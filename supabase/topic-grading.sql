-- ══════════════════════════════════════════════════════════════
-- TOPIC-PAGE SERVER-SIDE GRADING (Architecture P1) — run AFTER
-- schema.sql, bank-questions-schema.sql, daily-revise-functions.sql AND
-- supabase/subjects-v2.sql (for can_view_subject, used to scope access to
-- teacher-authored private subjects), in the Supabase SQL editor. Safe to
-- re-run.
--
-- WHY: the topic lesson pages (script.js) historically shipped every
-- correct answer inline (mcqData[i].ans / .explain, tfData.answer, fib
-- brackets, exam keys) AND graded in the browser, then handed the verdict
-- to record_progress(p_is_correct) — so a student could read every answer
-- in View Source and forge perfect scores/XP/mastery/leaderboard rank with
-- one console call (see docs/ARCHITECTURE-SCALE-SECURITY.md §3).
--
-- This file gives the topic pages the SAME secure path Daily Revise, Tasks
-- and spaced-repetition already use:
--   • get_topic_questions(page_id)  → the ANSWERLESS `snapshot` half of
--     bank_questions for one page (never answer_key), so the page can render
--     its quizzes without the answers ever reaching the browser.
--   • grade_topic_answer(question_key, answer) → grades SERVER-SIDE against
--     the hidden answer_key, records progress with the SERVER's verdict, and
--     returns correctness (+ the answer, revealed only AFTER the attempt).
--
-- bank_questions carries NO RLS policy of any kind, so it is never directly
-- readable; both functions below are SECURITY DEFINER with a pinned
-- search_path and re-check subject access with has_subject_access(), exactly
-- like edge_gate_check(). Correctness is ALWAYS computed here — the client's
-- claim is never trusted (same rule as record_mastery_answer /
-- submit_task_attempt).
--
-- STAKES NOTE (D-C "may become summative"): progress_events stays an
-- append-only log; done/total is derived server-side from the real question
-- count (a client can't claim 10/10 on a 12-question page); and the answer is
-- only ever returned AFTER an attempt is recorded. If/when a summative mode is
-- added, withholding the post-answer key is a one-line gate (see the return).
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · READ — answerless question snapshots for one page
-- ══════════════════════════════════════════════════════════════
-- Mirrors get_daily_revise_queue's projection (question_key, source, qtype,
-- marks, snapshot — NEVER answer_key) but for a single topic page and with no
-- scheduling/mastery logic: the topic page just needs to render its quizzes.
-- The page groups the rows into its sections by `source`
-- (mcq/tf/fib/exam/learn/misc/tips/match — the SECTION_TOTALS keys).
--
-- p_source (optional) = fetch ONE section only (just-in-time delivery). The
-- page requests a section's questions when the student opens that quiz tab,
-- rather than shipping the whole page's bank up front — so DevTools/Network
-- only ever holds the questions the student is actually looking at, not the
-- entire set (docs/ARCHITECTURE-SCALE-SECURITY.md §4.5). Null = the whole page
-- (used by teacher previews). Bulk enumeration is additionally blunted by the
-- edge scrape-throttle on /subjects/* (content-gate.ts).
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

    return query
    select bq.question_key, bq.source, bq.qtype, bq.marks, bq.snapshot
    from bank_questions bq
    where bq.page_id = p_page_id
      and (p_source is null or bq.source = p_source)
    order by bq.source, bq.question_key;  -- deterministic; the page re-orders per section
end;
$$;
grant execute on function get_topic_questions(text, text) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · GRADE — one answer, server-side, authoritative
-- ══════════════════════════════════════════════════════════════
-- Section = the question's bank `source` (mcq/tf/fib/exam/learn/misc/tips/match),
-- which is exactly the topic page's per-section progress key. done/total are
-- recomputed server-side from bank_questions + the student's own correct events,
-- so neither can be inflated by the client. Re-answering is idempotent: `done`
-- counts DISTINCT correctly-answered questions and can never exceed `total`.
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
        when v_row.qtype = 'numeric' then
            -- correct iff EVERY numeric key matches (numeric_answer_correct
            -- mirrors the client comparator — supabase/numeric-normalise.sql).
            p_answer is not null and (v_row.answer_key ? 'numeric') and not exists (
                select 1 from jsonb_object_keys(v_row.answer_key->'numeric') k
                where not numeric_answer_correct(p_answer->'value'->>k, v_row.answer_key->'numeric'->k))
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
    where bq.page_id = v_row.page_id and bq.source = v_section;

    select count(distinct pe.question_id) into v_done
    from progress_events pe
    where pe.student_id = v_uid and pe.page_id = v_row.page_id
      and pe.section = v_section and pe.is_correct;

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

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · record_progress() HARDENING — apply AFTER the pages migrate
-- ══════════════════════════════════════════════════════════════
-- Once every gradable topic section calls grade_topic_answer() instead of
-- record_progress(...p_is_correct...), record_progress must STOP accepting a
-- client-supplied is_correct for gradable sections (mcq/tf/fib/exam/learn/
-- misc/tips/match) — otherwise the old forgery path is still open. Non-gradable
-- marks (e.g. "read the notes", flashcards flip-through) have nothing to forge
-- and keep working.
--
-- Left commented until P1c so we don't break pages mid-rollout. The hardened
-- body will: (a) keep the topic-access manual-lock guard from
-- topic-access-schema.sql, and (b) for gradable sections, ignore p_is_correct
-- (force null) so a forged "true" can never reach progress_events. Written and
-- reviewed alongside the last page migration.
--
-- create or replace function record_progress(...) ... ;
