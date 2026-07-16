-- ══════════════════════════════════════════════════════════════
-- SUBJECTS v2 — BANK-SYNC XSS HARDENING
-- Run AFTER teacher-subjects.sql AND bank-questions-schema.sql, in
-- full, in the Supabase SQL editor. Safe to re-run.
-- Re-run this file whenever teacher-subjects.sql is re-run (that
-- file also re-grants the raw RPC to `authenticated`; section 2
-- below revokes it again).
--
-- WHY THIS FILE EXISTS — the XSS storage boundary.
-- bank_questions content is rendered as HTML to students and other
-- teachers. The HTML-bearing fields are snapshot.reading,
-- answer_key.markScheme and answer_key.modelAnswer. Previously the
-- client called sync_teacher_subject_bank() DIRECTLY (granted to
-- `authenticated`); that RPC validates row STRUCTURE only, never
-- HTML content — so a teacher who bypasses the editor (curl / a
-- direct PATCH of custom_topics + a direct RPC call) could store
-- <script>/onerror HTML that then runs in every viewer's browser.
--
-- After this migration ALL publishing flows through the sanitising
-- Netlify function `sync-subject-bank`, which runs DOMPurify over
-- those three fields and then calls the service-role-only sibling
-- sync_teacher_subject_bank_srv(). The raw RPC is no longer
-- client-callable: clients can only reach it through the function,
-- so unsanitised HTML can never reach bank_questions.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · service-role sibling of sync_teacher_subject_bank
-- ══════════════════════════════════════════════════════════════
-- Byte-identical to sync_teacher_subject_bank (teacher-subjects.sql,
-- SECTION 5) EXCEPT the ownership check: it trusts the caller-
-- resolved owner passed as p_owner instead of auth.uid() (the
-- service-role client has a null auth.uid()). The Netlify function
-- resolves p_owner from the verified bearer token and re-checks
-- ownership itself, so this is defence-in-depth, not the only gate.
create or replace function sync_teacher_subject_bank_srv(p_owner uuid, p_subject_id uuid, p_rows jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_slug  text;
    v_row   jsonb;
    v_key   text;
    v_page  text;
    v_kept  text[] := '{}';
    v_count int := 0;
begin
    select slug into v_slug from subjects
    where id = p_subject_id and created_by = p_owner;
    if v_slug is null then raise exception 'Not your subject'; end if;

    if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
        raise exception 'Rows must be a JSON array';
    end if;
    if jsonb_array_length(p_rows) > 4000 then
        raise exception 'Too many questions (max 4000 per subject)';
    end if;

    for v_row in select * from jsonb_array_elements(p_rows) loop
        v_key  := v_row->>'question_key';
        v_page := v_row->>'page_id';
        if v_key is null or v_key not like v_slug || ':%' or char_length(v_key) > 300 then
            raise exception 'Bad question_key %', v_key;
        end if;
        if v_page is null or not exists (
            select 1 from custom_topics t
            where t.subject_id = p_subject_id and t.status = 'published'
              and v_slug || ':' || t.slug = v_page
        ) then
            raise exception 'page_id % is not a published topic of this subject', v_page;
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

        insert into bank_questions (question_key, subject_slug, page_id, page_name,
                                    source, qtype, marks, snapshot, answer_key, updated_at)
        values (v_key, v_slug, v_page, left(coalesce(v_row->>'page_name', ''), 200),
                v_row->>'source', v_row->>'qtype',
                least(greatest(coalesce((v_row->>'marks')::numeric, 1), 0.5), 10),
                v_row->'snapshot', v_row->'answer_key', now())
        on conflict (question_key) do update set
            page_id = excluded.page_id, page_name = excluded.page_name,
            source = excluded.source, qtype = excluded.qtype, marks = excluded.marks,
            snapshot = excluded.snapshot, answer_key = excluded.answer_key,
            updated_at = now();

        v_kept := array_append(v_kept, v_key);
        v_count := v_count + 1;
    end loop;

    -- Anything of this subject's not in the new set is gone (unpublished
    -- topic, deleted question) — mastery rows cascade with it.
    delete from bank_questions
    where subject_slug = v_slug and not (question_key = any(v_kept));

    return jsonb_build_object('synced', v_count);
end;
$$;

-- Service-role ONLY — reached exclusively via the Netlify function
-- `sync-subject-bank`, which has already sanitised the HTML fields.
revoke all on function sync_teacher_subject_bank_srv(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function sync_teacher_subject_bank_srv(uuid, uuid, jsonb) to service_role;

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · close the raw RPC to clients
-- ══════════════════════════════════════════════════════════════
-- The unsanitised RPC stays DEFINED (owner/service contexts still use
-- it via the _srv sibling's body), but clients can no longer call it
-- directly — every publish now goes through the sanitising function.
-- NOTE: Postgres grants EXECUTE to PUBLIC by default at function creation,
-- and every role inherits PUBLIC — so revoking `authenticated` alone leaves
-- the function callable via the PUBLIC grant. Revoke from PUBLIC (and anon)
-- too, matching the _srv lock-down above, or the boundary is a no-op.
revoke all on function sync_teacher_subject_bank(uuid, jsonb) from public, anon, authenticated;
