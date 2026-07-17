-- ══════════════════════════════════════════════════════════════
-- SUBJECTS V2 — PLATFORM OVERRIDE-FORK · S5 STEP 2 (school-scoped bank)
-- Run AFTER subjects-v2-s5-overrides.sql (subject_overrides table +
-- _student_school_for_subject) and AFTER the base daily-revise-functions.sql /
-- topic-grading.sql (this file REDEFINES three of their functions via
-- create-or-replace). Safe to re-run.
--
-- RE-RUN RULE: because this file `create or replace`s get_daily_revise_queue,
-- get_topic_questions and grade_topic_answer, you MUST re-run it whenever
-- daily-revise-functions.sql OR topic-grading.sql is re-run — otherwise those
-- base files silently revert the school-scope filter and school X's override
-- questions start leaking into school Y's Daily Revise / topic pages. (Same
-- override-tail discipline as MIGRATION-ORDER.md.)
--
-- WHAT THIS IS (spec §10c A2): bank_questions gains a per-school dimension.
--   • school_id IS NULL  → platform master row (shared by every school, as today)
--   • school_id = <school> → that school's override row (its fork of a topic)
-- Every student-facing bank read is filtered so a caller sees ONLY their own
-- school's override rows plus the master rows, EXCEPT on pages their school has
-- overridden (where the master is suppressed). No caller can ever see another
-- school's rows. The write side (sync + delete) lives in
-- subjects-v2-s5-override-sync.sql and is pinned to a single school likewise.
--
-- SECURITY (secure-coding / auth-authz): the caller's school is ALWAYS derived
-- server-side via _student_school_for_subject(subject_id) — never from client
-- input — so cross-school isolation cannot be spoofed by a tampered request.
-- The §8 review (prove as anon + as a SECOND school's student) gates shipping.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · bank_questions.school_id  (the per-school dimension)
-- ══════════════════════════════════════════════════════════════
-- NULL = platform master row (the only kind that existed before S5). Non-null =
-- an override row belonging to exactly that school. ON DELETE CASCADE so tearing
-- down a school removes its override bank with it (its mastery rows cascade in
-- turn via bank_questions(question_key)).
alter table bank_questions
    add column if not exists school_id uuid references schools(id) on delete cascade;

create index if not exists bank_questions_subject_school_page_idx
    on bank_questions (subject_slug, school_id, page_id);

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · _overridden_page_ids()  (the school's suppressed-master set)
-- ══════════════════════════════════════════════════════════════
-- The page_ids (subject_slug:topic_slug) that a school has a PUBLISHED override
-- for, in a given subject. Master rows on these pages are suppressed for that
-- school (its override rows carry the same page_id and replace them). Draft
-- overrides are NOT in the set — an unpublished fork must not blank the master.
-- SECURITY DEFINER + stable: reads subject_overrides (which is RLS-protected)
-- from a trusted context, used only inside the read functions below.
create or replace function _overridden_page_ids(p_school_id uuid, p_subject_slug text)
returns text[]
language sql security definer stable set search_path = public as $$
    select coalesce(array_agg(p_subject_slug || ':' || o.topic_slug), '{}')
    from subject_overrides o
    join subjects s on s.id = o.subject_id
    where o.school_id = p_school_id
      and s.slug = p_subject_slug
      and o.status = 'published';
$$;

-- GRANT HYGIENE (§8 audit findings 1 & 2). Both helpers are SECURITY DEFINER for
-- INTERNAL use only — the read functions below call them with a SERVER-derived
-- school. Exposing them to `authenticated`/`anon` leaked cross-school data:
--   • _overridden_page_ids(p_school_id, …) with an arbitrary p_school_id returned
--     WHICH topics any other school has forked (fork-metadata leak); and
--   • _school_of(uuid) had NO grant restriction at all and was confirmed
--     anon-callable, mapping any teacher UUID → their school with no auth.
-- Internal definer callers keep execute rights via function OWNERSHIP, so
-- revoking from client roles breaks nothing (same lock-down pattern as
-- has_subject_access). Verified: no client rpc() calls either function.
revoke all on function _overridden_page_ids(uuid, text) from public, anon, authenticated;
revoke all on function _school_of(uuid)                 from public, anon, authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · THE SHARED BANK FILTER  (applied identically everywhere below)
-- ══════════════════════════════════════════════════════════════
-- Given the caller's server-resolved school `v_school`
-- (= _student_school_for_subject(<subject_id>), NULL for a no-class/preview
-- caller) and `v_over` (= _overridden_page_ids(v_school, <subject_slug>)), every
-- bank_questions scan `b` gets this predicate:
--
--     and ( b.school_id = v_school
--           or (b.school_id is null and not (b.page_id = any(v_over))) )
--
-- Semantics:
--   • b.school_id = v_school            → show the caller's own override rows.
--   • b.school_id is null AND page not
--     in v_over                         → show master rows, except on pages the
--                                          school has overridden (those masters
--                                          are suppressed — the override replaces
--                                          them).
--   • NULL v_school → `b.school_id = null` is never true and v_over is empty →
--     master-only (correct fallback for a caller with no resolvable school).
--   • Another school's rows (b.school_id = some other school) NEVER match.
--
-- Below, each function uses its own bank alias (b / bq) but the predicate is
-- textually identical. The functions are byte-for-byte the CURRENT bodies from
-- daily-revise-functions.sql / topic-grading.sql, plus ONLY: the v_school /
-- v_over locals, their resolution, and this predicate on each bank scan.

-- ══════════════════════════════════════════════════════════════
-- SECTION 4a · get_daily_revise_queue  (daily-revise-functions.sql)
-- ══════════════════════════════════════════════════════════════
-- CHANGED vs base: + v_subject_id / v_school / v_over locals; + resolve them
-- once from p_subject; + the shared filter on all FOUR bank scans (the two
-- v_filter builders, the v_remaining count, and the final return query). Nothing
-- else — signature, return shape, pacing, grants and search_path are unchanged.
drop function if exists get_daily_revise_queue(int, text[], boolean, boolean, boolean, text);
create or replace function get_daily_revise_queue(
    p_limit int default null, p_page_ids text[] default null,
    p_smart boolean default true, p_exclude_mastered boolean default true,
    p_incorrect_only boolean default false, p_subject text default null)
returns table (
    question_key  text,
    page_id       text,
    page_name     text,
    source        text,
    qtype         text,
    marks         numeric,
    snapshot      jsonb,
    mastery_count int   -- null = never seen; 0 = last answer wrong; 3 = mastered
)
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid            uuid := auth.uid();
    v_class_id       uuid;
    v_topic_mode     text := 'teacher_controlled';
    v_weekly_cap     int;
    v_exam_date      date;
    v_weeks_to_exam  numeric;
    v_remaining      int;
    v_weekly_target  int;
    v_daily_limit    int;
    v_filter         text[];
    v_subject_id     uuid;      -- S5: subject resolved from p_subject slug
    v_school         uuid;      -- S5: caller's server-derived school (may be null)
    v_over           text[];    -- S5: page_ids this school has overridden
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    v_class_id := my_class_for_subject(p_subject);
    if v_class_id is not null then
        select c.daily_revise_topic_mode, c.daily_revise_weekly_cap
        into v_topic_mode, v_weekly_cap
        from classes c where c.id = v_class_id;
    end if;

    -- S5 school-scope: resolve the caller's school for THIS subject and the set
    -- of pages it has overridden, so the shared filter below shows the caller
    -- their own override bank + master (master suppressed on overridden pages)
    -- and never another school's rows. p_subject null (legacy) → v_subject_id
    -- null → v_school = _school_of (teacher) or null (student); v_over empty →
    -- master-only, the pre-S5 behaviour.
    select id into v_subject_id from subjects where slug = p_subject;
    v_school := _student_school_for_subject(v_subject_id);
    v_over   := _overridden_page_ids(v_school, p_subject);

    -- Pacing runs toward the subject's real exam date (subjects.exam_date,
    -- seeded/updated from the subject manifest); the business date is the
    -- sane fallback for null p_subject (legacy clients) or a subject with
    -- no exam scheduled.
    select s.exam_date into v_exam_date
    from subjects s where s.slug = coalesce(p_subject, 'business');
    v_exam_date := coalesce(v_exam_date, date '2027-05-12');

    -- Resolve the effective topic filter against the class's mode — this
    -- runs server-side so a tampered client can't escape teacher_controlled/
    -- teacher_guided restrictions by sending arbitrary page_ids.
    if v_class_id is null then
        v_filter := null;  -- no class (or no bank rows) — no filter
    elsif v_topic_mode = 'teacher_controlled' then
        -- The teacher's own class_topic_filter_active selection is the
        -- ONLY filter here — whatever the client sent is ignored outright,
        -- since students have no say in this mode. Absence of any
        -- deactivated row (the default, untouched state) means every page
        -- is active, so an opted-out teacher gets today's original
        -- "spans every topic" behaviour with no extra step.
        select coalesce(array_agg(distinct b.page_id), '{}') into v_filter
        from bank_questions b
        where (p_subject is null or b.subject_slug = p_subject)
          and ( b.school_id = v_school
                or (b.school_id is null and not (b.page_id = any(v_over))) )
          and not exists (
            select 1 from class_topic_filter_active f
            where f.class_id = v_class_id and f.page_id = b.page_id and f.active = false
        );
    elsif v_topic_mode = 'teacher_guided' then
        if p_page_ids is null or array_length(p_page_ids, 1) is null then
            -- No client filter given — use every currently-active topic.
            select coalesce(array_agg(distinct b.page_id), '{}') into v_filter
            from bank_questions b
            where (p_subject is null or b.subject_slug = p_subject)
              and ( b.school_id = v_school
                    or (b.school_id is null and not (b.page_id = any(v_over))) )
              and not exists (
                select 1 from class_topic_filter_active f
                where f.class_id = v_class_id and f.page_id = b.page_id and f.active = false
            );
        else
            -- Intersect the client's request with the active set; a
            -- requested-but-deactivated page is silently dropped, not an error.
            select coalesce(array_agg(pid), '{}') into v_filter
            from unnest(p_page_ids) pid
            where not exists (
                select 1 from class_topic_filter_active f
                where f.class_id = v_class_id and f.page_id = pid and f.active = false
            );
        end if;
    else -- student_controlled — the client's request is trusted as-is
        v_filter := p_page_ids;
    end if;

    -- Incorrect-only is a subset of unmastered (a count-0 row can't be 3),
    -- so it composes with rather than contradicts p_exclude_mastered.

    v_weeks_to_exam := greatest(ceil((v_exam_date - current_date) / 7.0), 1);

    -- Same eligibility predicates as the final query (minus scheduling), so
    -- the weekly-cap pacing reflects the pool the student is actually in.
    select count(*) into v_remaining
    from bank_questions b
    left join question_mastery m
        on m.question_key = b.question_key and m.student_id = v_uid
    where (p_subject is null or b.subject_slug = p_subject)
      and ( b.school_id = v_school
            or (b.school_id is null and not (b.page_id = any(v_over))) )
      and (not p_incorrect_only or m.mastery_count = 0)
      and (not p_exclude_mastered or coalesce(m.mastery_count, 0) < 3)
      and (v_filter is null or b.page_id = any(v_filter));

    if v_weekly_cap is not null then
        -- A configured weekly cap is a hard ceiling; daily is a flat 1/7
        -- slice — skipped days do not carry over (reinforces "come back
        -- often" over binge catch-up sessions).
        v_weekly_target := least(ceil(v_remaining::numeric / v_weeks_to_exam), v_weekly_cap);
        v_daily_limit := greatest(ceil(v_weekly_target / 7.0), 1);
        p_limit := least(coalesce(p_limit, v_daily_limit), v_daily_limit);
    else
        -- Unlimited: no artificial ceiling on top of what's actually due —
        -- p_limit only clamps a single response to a sane page size.
        p_limit := least(coalesce(p_limit, 200), 200);
    end if;

    return query
    select b.question_key, b.page_id, b.page_name, b.source, b.qtype, b.marks, b.snapshot,
           m.mastery_count
    from bank_questions b
    left join question_mastery m
        on m.question_key = b.question_key and m.student_id = v_uid
    where (p_subject is null or b.subject_slug = p_subject)
      and ( b.school_id = v_school
            or (b.school_id is null and not (b.page_id = any(v_over))) )
      and (not p_incorrect_only or m.mastery_count = 0)
      and (not p_exclude_mastered or coalesce(m.mastery_count, 0) < 3)
      and (not p_smart or m.next_due_at is null or m.next_due_at <= now())
      and (v_filter is null or b.page_id = any(v_filter))
    order by
        case when p_smart then (m.question_key is null or m.mastery_count = 0) else null end desc,  -- never-seen / just-reset first
        case when p_smart then m.next_due_at end asc nulls first,
        case when not p_smart then random() end  -- smart off: no schedule, just shuffle
    limit p_limit;
end;
$$;
grant execute on function get_daily_revise_queue(int, text[], boolean, boolean, boolean, text) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 4b · get_topic_questions  (topic-grading.sql)
-- ══════════════════════════════════════════════════════════════
-- CHANGED vs base: + v_school / v_over locals; + resolve them from the already-
-- resolved v_subject_id / v_subject; + the shared filter on the final return
-- query (alias bq). The subject-access gate (can_view_subject / has_subject_access)
-- is unchanged and still runs first. Signature, projection, grant, search_path
-- unchanged.
drop function if exists get_topic_questions(text);
create or replace function get_topic_questions(p_page_id text, p_source text default null)
returns table (
    question_key text,
    source       text,
    qtype        text,
    marks        numeric,
    snapshot     jsonb
)
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid        uuid := auth.uid();
    v_subject    text;
    v_subject_id uuid;
    v_created_by uuid;
    v_school     uuid;      -- S5: caller's server-derived school (may be null)
    v_over       text[];    -- S5: page_ids this school has overridden
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    -- The subject this page belongs to (page_id is subject-prefixed, but read
    -- it from the bank rather than trusting the string split).
    select bq.subject_slug into v_subject
    from bank_questions bq where bq.page_id = p_page_id limit 1;
    if v_subject is null then
        return;  -- unknown page / no bank rows → empty (not an error)
    end if;

    -- Resolve the subjects row so we can tell a teacher-authored PRIVATE subject
    -- (created_by is not null) from a platform subject.
    select s.id, s.created_by into v_subject_id, v_created_by
    from subjects s where s.slug = v_subject limit 1;

    -- Access gate. For teacher-authored subjects, has_subject_access defaults to
    -- EVERY active subject for any teacher — including other teachers' private
    -- ones — so use can_view_subject (owner / share grantee / enrolled student)
    -- instead. Platform subjects keep the edge content-gate's has_subject_access.
    -- On denial, return an EMPTY result (indistinguishable from an unknown
    -- page_id) rather than raising — no existence oracle.
    if v_created_by is not null then
        if not can_view_subject(v_subject_id) then
            return;
        end if;
    else
        if not has_subject_access(v_uid, v_subject) then
            return;
        end if;
    end if;

    -- S5 school-scope: resolve the caller's school for this subject and its
    -- overridden-page set, then show the caller their own override rows + master
    -- (master suppressed on overridden pages) and never another school's rows.
    v_school := _student_school_for_subject(v_subject_id);
    v_over   := _overridden_page_ids(v_school, v_subject);

    return query
    select bq.question_key, bq.source, bq.qtype, bq.marks, bq.snapshot
    from bank_questions bq
    where bq.page_id = p_page_id
      and (p_source is null or bq.source = p_source)
      and ( bq.school_id = v_school
            or (bq.school_id is null and not (bq.page_id = any(v_over))) )
    order by bq.source, bq.question_key;  -- deterministic; the page re-orders per section
end;
$$;
grant execute on function get_topic_questions(text, text) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 4c · grade_topic_answer  (topic-grading.sql)
-- ══════════════════════════════════════════════════════════════
-- CHANGED vs base: + v_school / v_over locals; + resolve them after the access
-- gate; + the shared filter on the v_total COUNT query (spec §10c A2's easy-to-
-- miss site — without it `total` counts master+override and "done = total" is
-- unreachable for an overridden page). The per-answer lookup by unique
-- question_key (line "select * ... where question_key = p_question_key") stays
-- AS-IS per spec — override keys are namespaced (:ovr:<school>:) so the lookup is
-- unambiguous, and the read path never leaks another school's keys to a client.
-- Everything else — rate cap, correctness logic, progress writes, the `done`
-- distinct-count, grant, search_path — is unchanged.
create or replace function grade_topic_answer(p_question_key text, p_answer jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid        uuid := auth.uid();
    v_row        bank_questions%rowtype;
    v_subject_id uuid;
    v_created_by uuid;
    v_is_correct boolean;
    v_section    text;
    v_done       int;
    v_total      int;
    v_recent     int;
    v_school     uuid;      -- S5: caller's server-derived school (may be null)
    v_over       text[];    -- S5: page_ids this school has overridden
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    -- Burst rate cap (anti-scraping / anti-farming). A human answering fast does
    -- ~20-30/min; 120/min is impossible by hand but throttles a script trying to
    -- grind XP or enumerate the bank via grading. Counts this student's gradable
    -- topic events in the last 60s (section='daily-revise' is excluded — that
    -- path has its own daily cap in record_mastery_answer). Fail-safe: this is a
    -- deterrent, not an exact quota.
    select count(*) into v_recent
    from progress_events
    where student_id = v_uid
      and answered_at >= now() - interval '60 seconds'
      and section in ('mcq','tf','fib','exam','learn','misc','tips','match');
    if v_recent >= 120 then
        raise exception 'Too many answers too fast — please slow down.'
            using errcode = 'check_violation';
    end if;

    select * into v_row from bank_questions where question_key = p_question_key;
    if not found then raise exception 'Question not found'; end if;

    -- Access gate. Teacher-authored (private) subjects use can_view_subject so a
    -- teacher can't grade against another teacher's private bank; platform
    -- subjects keep has_subject_access. On denial, raise the SAME error as the
    -- missing-question case — never 'no access' — so grading is not an existence
    -- oracle for question keys of subjects the caller can't see.
    select s.id, s.created_by into v_subject_id, v_created_by
    from subjects s where s.slug = v_row.subject_slug limit 1;
    if v_created_by is not null then
        if not can_view_subject(v_subject_id) then raise exception 'Question not found'; end if;
    else
        if not has_subject_access(v_uid, v_row.subject_slug) then raise exception 'Question not found'; end if;
    end if;

    -- S5 school-scope: resolve the caller's school + overridden-page set so the
    -- v_total count below reflects the caller's EFFECTIVE bank (their overrides +
    -- master, master suppressed on overridden pages), making "done = total"
    -- reachable and never double-counting master+override.
    v_school := _student_school_for_subject(v_subject_id);
    v_over   := _overridden_page_ids(v_school, v_row.subject_slug);

    -- Row-level school scope (defence-in-depth BEYOND the subject-level access gate
    -- above, which a same-subject student always passes): the caller may grade
    -- only their OWN school's override row, or a master row NOT suppressed for
    -- their school — never another school's key (even if somehow obtained), nor a
    -- master row on a page their school has overridden. This makes the gradable
    -- set EXACTLY the get_topic_questions read filter's set. Same 'Question not
    -- found' as a missing key → no cross-school existence oracle.
    if (v_row.school_id is not null and v_row.school_id is distinct from v_school)
       or (v_row.school_id is null and v_row.page_id = any(v_over)) then
        raise exception 'Question not found';
    end if;

    v_section := v_row.source;

    -- Correctness computed HERE — identical comparison logic to
    -- record_mastery_answer() / submit_task_attempt(). mcq/tf match the stored
    -- value; fib checks every blank case/space-insensitively.
    v_is_correct := case
        when v_row.qtype in ('mcq', 'tf') then
            p_answer is not null and (p_answer->>'value') = (v_row.answer_key->>'answer')
        when v_row.qtype = 'fib' then
            p_answer is not null and not exists (
                select 1 from jsonb_each_text(v_row.answer_key->'blanks') kb
                where lower(btrim(coalesce(p_answer->'value'->>kb.key, '')))
                      <> lower(btrim(kb.value)))
        else false
    end;

    -- Append-only event log (never trusts client is_correct).
    insert into progress_events (student_id, page_id, section, question_id, answer, is_correct)
    values (v_uid, v_row.page_id, v_section, p_question_key, p_answer, v_is_correct);

    -- Server-derived progress: total = gradable questions in this page+section;
    -- done = distinct questions the student has ever answered correctly. Both
    -- read from the source of truth, so the client cannot claim otherwise.
    select count(*) into v_total
    from bank_questions bq
    where bq.page_id = v_row.page_id and bq.source = v_section
      and ( bq.school_id = v_school
            or (bq.school_id is null and not (bq.page_id = any(v_over))) );

    -- done = distinct questions answered correctly, SCOPED to the keys currently
    -- VISIBLE to this student (review fix #4). Without this scope, a student who
    -- completed the master topic before their school forked it would keep their
    -- old master-key corrects counted while v_total counts only the override rows
    -- → least(done,total) reports done=total on an override they never answered.
    -- Restricting to the visible key set drops stale master (or ex-override) keys.
    select count(distinct pe.question_id) into v_done
    from progress_events pe
    where pe.student_id = v_uid and pe.page_id = v_row.page_id
      and pe.section = v_section and pe.is_correct
      and pe.question_id in (
          select bq.question_key from bank_questions bq
          where bq.page_id = v_row.page_id and bq.source = v_section
            and ( bq.school_id = v_school
                  or (bq.school_id is null and not (bq.page_id = any(v_over))) )
      );

    insert into progress_summary (student_id, page_id, section, done, total, updated_at)
    values (v_uid, v_row.page_id, v_section, least(v_done, v_total), v_total, now())
    on conflict (student_id, page_id, section)
    do update set done = excluded.done, total = excluded.total, updated_at = now();

    -- The answer is revealed only now, AFTER the attempt is recorded. A future
    -- summative mode would gate this line (return no answer_key/explain).
    return jsonb_build_object(
        'correct', v_is_correct,
        'answer_key', v_row.answer_key,
        'done', least(v_done, v_total),
        'total', v_total
    );
end;
$$;
grant execute on function grade_topic_answer(text, jsonb) to authenticated;
