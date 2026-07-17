-- ══════════════════════════════════════════════════════════════
-- SUBJECTS V2 — PLATFORM OVERRIDE-FORK · S5 STEP 3 (forked bank sync)
-- Run AFTER subjects-v2-s5-bank-scope.sql (bank_questions.school_id) and
-- subjects-v2-s4-fork-grants.sql (the two grant tables). Safe to re-run.
--
-- WHY A FORK, NOT A REUSE (spec §10c A3): sync_teacher_subject_bank_srv
-- (subjects-v2-bank-sync-hardening.sql) is UNSAFE for overrides because it
--   (a) validates page_ids against published custom_topics — platform subjects
--       have none, so it rejects every override row, AND
--   (b) ends with `delete ... where subject_slug = v_slug and not (question_key
--       = any(v_kept))` — for subject_slug='business' that would WIPE every
--       school's master bank (every school_id-is-null row).
-- So overrides get their OWN sibling that validates against published
-- subject_overrides and pins BOTH the upsert and the delete to a single school,
-- never touching master (school_id is null) or any other school's rows.
--
-- SECURITY (auth-authz / secure-coding):
--   • service_role ONLY (revoked from public/anon/authenticated) — reached only
--     via the sanitising Netlify function `sync-override-bank`, exactly like the
--     teacher sync goes through `sync-subject-bank`.
--   • Authorisation is the S4 AND-clamp checked EXPLICITLY (can_edit_platform_
--     subject is auth.uid()-based and null under service role, so it can't be
--     used here): p_owner must hold a teacher_subject_edit_access row for the
--     subject AND the school must hold a subject_school_edit_grants row for it AND
--     the owner's own school must be p_school_id. Any gap ⇒ fail closed.
--   • KEY NAMESPACING is the master-integrity guard at the key level: every
--     row's question_key MUST carry this school's `:ovr:<school-uuid>:` segment
--     (full uuid, hyphens stripped), so a master-format key (no :ovr:) or another
--     school's key is rejected before it can reach on_conflict(question_key) and
--     overwrite a foreign/master row.
-- ══════════════════════════════════════════════════════════════

create or replace function sync_school_override_bank_srv(
    p_owner uuid, p_school_id uuid, p_subject_id uuid, p_rows jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_slug   text;
    v_prefix text;     -- first 8 chars of the school uuid (the key-namespace tag)
    v_ns     text;     -- the required ':ovr:<prefix8>:' key segment for this school
    v_row    jsonb;
    v_key    text;
    v_page   text;
    v_kept   text[] := '{}';
    v_count  int := 0;
begin
    -- ── AUTHORISE — the S4 AND-clamp, checked explicitly (defence-in-depth
    --    behind the Netlify function). All three must hold or we fail closed:
    --    (1) p_owner holds a teacher edit grant for the subject,
    --    (2) p_school_id holds the school edit grant for the subject,
    --    (3) p_owner's OWN school IS p_school_id — so a teacher granted in
    --        school A can never write school B's overrides even if B is also
    --        granted (mirrors can_edit_platform_subject's _school_of clamp). ──
    if _school_of(p_owner) is distinct from p_school_id then
        raise exception 'not authorised';
    end if;
    if not exists (
        select 1 from teacher_subject_edit_access tea
        where tea.profile_id = p_owner and tea.subject_id = p_subject_id
    ) then
        raise exception 'not authorised';
    end if;
    if not exists (
        select 1 from subject_school_edit_grants g
        where g.school_id = p_school_id and g.subject_id = p_subject_id
    ) then
        raise exception 'not authorised';
    end if;

    -- The subject must be a PLATFORM subject (created_by is null); get its slug.
    -- A teacher-authored subject edits custom_topics directly and has no override
    -- layer, so it is rejected here.
    select slug into v_slug from subjects
    where id = p_subject_id and created_by is null;
    if v_slug is null then raise exception 'not authorised'; end if;

    if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
        raise exception 'Rows must be a JSON array';
    end if;
    if jsonb_array_length(p_rows) > 4000 then
        raise exception 'Too many questions (max 4000 per subject)';
    end if;

    -- Canonical override question_key format (the client MUST mint keys this way):
    --   <page_id>:<source>:ovr:<school uuid, hyphens stripped>:<hash>
    -- The namespace tag is the FULL school uuid (32 hex), not a truncated prefix
    -- (§8 audit finding 4): an 8-char prefix collides at ~32 bits, and although the
    -- school_id-pinned upsert/delete below keep that a correctness footgun rather
    -- than a breach, the full uuid removes the collision entirely. 32 chars keeps
    -- keys comfortably under the 300-char cap. We require the literal
    -- ':ovr:<uuid32>:' segment to appear in every key.
    v_prefix := replace(p_school_id::text, '-', '');
    v_ns     := ':ovr:' || v_prefix || ':';

    for v_row in select * from jsonb_array_elements(p_rows) loop
        v_key  := v_row->>'question_key';
        v_page := v_row->>'page_id';

        -- Key must (a) belong to THIS subject, (b) carry THIS school's override
        -- namespace segment, (c) be within the length cap. (b) is the master-
        -- integrity guard: a master-format key (no :ovr:) or a key bearing a
        -- DIFFERENT school's prefix is rejected here, so the on_conflict upsert
        -- below can never land on a school_id-is-null master row or a foreign
        -- school's row.
        if v_key is null
           or v_key not like v_slug || ':%'
           or position(v_ns in v_key) = 0
           or char_length(v_key) > 300 then
            raise exception 'Bad question_key %', v_key;
        end if;

        -- page_id must be a PUBLISHED subject_overrides topic for THIS
        -- (subject, school) — NOT custom_topics. topic_slug is the hyphenated
        -- page-id tail (spec §10c A1), so page_id = <slug>:<topic_slug>.
        if v_page is null or not exists (
            select 1 from subject_overrides o
            where o.subject_id = p_subject_id
              and o.school_id  = p_school_id
              and o.status = 'published'
              and v_slug || ':' || o.topic_slug = v_page
        ) then
            raise exception 'page_id % is not a published override topic of this school', v_page;
        end if;

        if (v_row->>'source') not in ('exam','mcq','tf','learn','misc','tips','fib','match') then
            raise exception 'Bad source %', v_row->>'source';
        end if;
        if (v_row->>'qtype') not in ('mcq','tf','fib') then
            raise exception 'Bad qtype %', v_row->>'qtype';
        end if;
        if jsonb_typeof(v_row->'snapshot') <> 'object' or jsonb_typeof(v_row->'answer_key') <> 'object' then
            raise exception 'snapshot and answer_key must be objects';
        end if;

        insert into bank_questions (question_key, subject_slug, school_id, page_id, page_name,
                                    source, qtype, marks, snapshot, answer_key, updated_at)
        values (v_key, v_slug, p_school_id, v_page, left(coalesce(v_row->>'page_name', ''), 200),
                v_row->>'source', v_row->>'qtype',
                least(greatest(coalesce((v_row->>'marks')::numeric, 1), 0.5), 10),
                v_row->'snapshot', v_row->'answer_key', now())
        on conflict (question_key) do update set
            page_id = excluded.page_id, page_name = excluded.page_name,
            source = excluded.source, qtype = excluded.qtype, marks = excluded.marks,
            snapshot = excluded.snapshot, answer_key = excluded.answer_key,
            school_id = excluded.school_id,
            updated_at = now()
        -- Belt-and-suspenders behind the key-namespace rejection above: even if
        -- a key somehow collided with an existing row, only THIS school's rows
        -- may be updated — a master (null) or foreign-school row is never touched.
        where bank_questions.school_id = p_school_id;

        v_kept := array_append(v_kept, v_key);
        v_count := v_count + 1;
    end loop;

    -- ── MASTER-INTEGRITY GUARD (the dangerous line) ──
    -- Pinned to THIS school. `school_id = p_school_id` makes it STRUCTURALLY
    -- impossible to touch master rows (school_id is null never equals a uuid) or
    -- any other school's rows. NEVER remove the school_id clause — without it,
    -- for subject_slug='business' this would wipe every school's master bank
    -- (that is exactly the sync_teacher_subject_bank_srv trap this fork avoids).
    -- Empty v_kept (an empty publish) removes only THIS school's override rows.
    delete from bank_questions
    where school_id = p_school_id
      and subject_slug = v_slug
      and not (question_key = any(v_kept));

    return jsonb_build_object('synced', v_count);
end;
$$;

-- Service-role ONLY — reached exclusively via the sanitising Netlify function
-- `sync-override-bank`, which has already cleaned the HTML-bearing fields.
revoke all on function sync_school_override_bank_srv(uuid, uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function sync_school_override_bank_srv(uuid, uuid, uuid, jsonb) to service_role;
