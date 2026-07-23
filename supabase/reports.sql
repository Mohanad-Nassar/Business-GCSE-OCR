-- ══════════════════════════════════════════════════════════════
-- REPORT WRITER — Phase R1 (per-student + class batch) — run AFTER
-- schema.sql, daily-revise-functions.sql, daily-revise-stats-schema.sql,
-- spaced-repetition.sql and leaderboard.sql, in the Supabase SQL editor.
-- Safe to re-run. Source of truth: docs/REPORT-WRITER-PLAN.md.
--
-- Turns a student's real activity into a parent-shareable summary. Every
-- number here is server-computed; the browser never receives a figure the
-- caller isn't authorised to see. Same trust model as get_leaderboard /
-- daily-revise-analytics.sql: base-table RLS stays self-only, and these
-- SECURITY DEFINER functions are the one controlled cross-student read,
-- each verifying access itself (teaches_student / is_class_owner).
--
-- ACCURACY IS SPLIT, deliberately (docs/REPORT-WRITER-PLAN.md §3):
--   • GRADED   = progress_events with section = 'daily-revise' — correctness
--     is computed server-side in record_mastery_answer(), so it is trustworthy
--     and is what the parent-facing narrative leans on.
--   • PRACTICE = every other section — the topic pages write is_correct from
--     the client and it is currently forgeable (memory architecture-scale-
--     security). Shown, but labelled "practice", never the headline verdict.
--
-- SUBJECT SCOPING: page_id is subject-prefixed ('business:1-1-…'), so
-- `page_id like p_subject || ':%'` isolates one subject from a student's
-- shared progress_events pool; mastery_events carries subject_slug directly;
-- bank joins filter on bank_questions.subject_slug — exactly as the daily-
-- revise analytics do. Topic → GROUP folding is done on the CLIENT from
-- page-groups-all.js (these functions return page_id + page_name only), so
-- the SQL never carries the topic tree.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · CORE PER-STUDENT REPORT (internal helper)
-- ══════════════════════════════════════════════════════════════
-- Builds the full report jsonb for ONE student and a [from, to) window. It
-- does NO access check of its own and is NOT granted to authenticated — the
-- default PUBLIC execute grant is revoked below, so PostgREST never exposes
-- it and it can only be reached from inside the access-checked SECURITY
-- DEFINER wrappers in Section 2 (which run as the function owner). That is a
-- tighter posture than _lb_window_metrics, which is callable directly.
--
-- Return shape (docs/REPORT-WRITER-PLAN.md §4):
--   { meta, headline, prev, activity[], topics[] }
-- Group rollups + trend verdict + effort/accuracy flag are derived on the
-- client/templater from these numbers (deterministic — no AI).
create or replace function _report_for_student(
    p_student_id uuid, p_subject text, p_from timestamptz, p_to timestamptz)
returns jsonb
language sql stable security definer set search_path = public as $$
with
win as (
    -- current window + the matching PREVIOUS window (same length, immediately
    -- before it) for growth arrows — same technique as get_leaderboard.
    select p_from as w_from, p_to as w_to,
           (p_from - (p_to - p_from)) as p_from2, p_from as p_to2
),
-- Per-page event metrics, CURRENT window. Graded = daily-revise (server-
-- marked); practice = every other section (client-marked, counted only when
-- is_correct was recorded).
cur as (
    select pe.page_id,
           count(*) filter (where pe.section = 'daily-revise')::int                      as g_answered,
           count(*) filter (where pe.section = 'daily-revise' and pe.is_correct)::int     as g_correct,
           count(*) filter (where pe.section <> 'daily-revise' and pe.is_correct is not null)::int as p_answered,
           count(*) filter (where pe.section <> 'daily-revise' and pe.is_correct)::int    as p_correct
    from progress_events pe cross join win
    where pe.student_id = p_student_id
      and pe.page_id like p_subject || ':%'
      and pe.answered_at >= win.w_from and pe.answered_at < win.w_to
    group by pe.page_id
),
-- Per-page GRADED metrics, PREVIOUS window (for per-group growth on the client).
prevpage as (
    select pe.page_id,
           count(*) filter (where pe.section = 'daily-revise')::int                   as g_answered,
           count(*) filter (where pe.section = 'daily-revise' and pe.is_correct)::int as g_correct
    from progress_events pe cross join win
    where pe.student_id = p_student_id
      and pe.page_id like p_subject || ':%'
      and pe.answered_at >= win.p_from2 and pe.answered_at < win.p_to2
    group by pe.page_id
),
-- Bank denominators + page names (canonical topic set for the subject).
bank as (
    select b.page_id, min(b.page_name) as page_name, count(*)::int as bank_total
    from bank_questions b
    where b.subject_slug = p_subject
    group by b.page_id
),
-- Lifetime mastered (Rule-of-3 complete) per page — the mastered/total shown
-- per topic; not windowed (mastery doesn't expire), matching the class matrix.
mast as (
    select b.page_id, count(*) filter (where m.mastery_count = 3)::int as mastered
    from question_mastery m
    join bank_questions b on b.question_key = m.question_key
    where m.student_id = p_student_id and b.subject_slug = p_subject
    group by b.page_id
),
-- Headline totals (current window) — summed server-side so the client never
-- computes a headline figure.
curtot as (
    select coalesce(sum(g_answered),0)::int gA, coalesce(sum(g_correct),0)::int gC,
           coalesce(sum(p_answered),0)::int pA, coalesce(sum(p_correct),0)::int pC
    from cur
),
prevtot as (
    select coalesce(sum(g_answered),0)::int gA, coalesce(sum(g_correct),0)::int gC
    from prevpage
),
-- Windowed first-masteries (velocity numerator + headline "new this window").
mastwin as (
    select count(*)::int n
    from mastery_events me cross join win
    where me.student_id = p_student_id and me.subject_slug = p_subject
      and me.mastered_at >= win.w_from and me.mastered_at < win.w_to
),
-- Effective span in weeks for mastery velocity: clamp the window start to the
-- student's first activity so an "all-time" (1970) window doesn't divide by
-- decades and read as ~0/week.
span as (
    select greatest(1.0,
        extract(epoch from (win.w_to - greatest(win.w_from,
            coalesce((select min(pe.answered_at) from progress_events pe
                      where pe.student_id = p_student_id and pe.page_id like p_subject || ':%'),
                     win.w_from)))) / 604800.0) as weeks
    from win
),
-- Distinct active days in window (consistency signal).
adays as (
    select count(distinct (pe.answered_at at time zone 'utc')::date)::int n
    from progress_events pe cross join win
    where pe.student_id = p_student_id and pe.page_id like p_subject || ':%'
      and pe.answered_at >= win.w_from and pe.answered_at < win.w_to
),
-- Current subject streak (islands technique, today-or-yesterday rule — same as
-- _lb_streaks / get_my_streak, but for one student, all-time).
day_list as (
    select distinct (pe.answered_at at time zone 'utc')::date d
    from progress_events pe
    where pe.student_id = p_student_id and pe.page_id like p_subject || ':%'
),
islands as (
    select d, d - (row_number() over (order by d))::int grp from day_list
),
runs as (select count(*)::int len, max(d) last_d from islands group by grp),
streak as (select coalesce(max(len) filter (where last_d >= current_date - 1), 0)::int streak from runs),
-- Weekly activity buckets for the sparkline.
activity as (
    select date_trunc('week', pe.answered_at)::date week_start,
           count(*)::int attempts,
           count(*) filter (where pe.section = 'daily-revise' and pe.is_correct)::int graded_correct
    from progress_events pe cross join win
    where pe.student_id = p_student_id and pe.page_id like p_subject || ':%'
      and pe.answered_at >= win.w_from and pe.answered_at < win.w_to
    group by 1
)
select jsonb_build_object(
    'meta', jsonb_build_object(
        'student_id', p_student_id, 'subject', p_subject,
        'from', p_from, 'to', p_to, 'has_prev', true, 'generated_at', now()),
    'headline', jsonb_build_object(
        'attempts', ct.gA + ct.pA,
        'graded_answered', ct.gA, 'graded_correct', ct.gC,
        'graded_accuracy_pct', round(100.0 * ct.gC / nullif(ct.gA, 0), 1),
        'practice_answered', ct.pA, 'practice_correct', ct.pC,
        'practice_accuracy_pct', round(100.0 * ct.pC / nullif(ct.pA, 0), 1),
        'mastered_window', mw.n,
        'mastered_total', coalesce((select total_mastered from daily_revise_stats
                                    where student_id = p_student_id and subject_slug = p_subject), 0),
        'mastery_velocity_per_week', round(mw.n / (select weeks from span), 2),
        'reviews_completed', (select count(*)::int from topic_reviews tr, win
                              where tr.student_id = p_student_id and tr.page_id like p_subject || ':%'
                                and tr.completed_at >= win.w_from and tr.completed_at < win.w_to),
        'reviews_upcoming', (select count(*)::int from topic_reviews tr
                             where tr.student_id = p_student_id and tr.page_id like p_subject || ':%'
                               and tr.completed_at is null
                               and tr.due_date between current_date and current_date + 7),
        'active_days', (select n from adays),
        'streak', (select streak from streak)
    ),
    'prev', jsonb_build_object(
        'graded_answered', pt.gA, 'graded_correct', pt.gC,
        'graded_accuracy_pct', round(100.0 * pt.gC / nullif(pt.gA, 0), 1)
    ),
    'activity', coalesce((select jsonb_agg(jsonb_build_object(
        'week_start', week_start, 'attempts', attempts, 'graded_correct', graded_correct)
        order by week_start) from activity), '[]'::jsonb),
    'topics', coalesce((select jsonb_agg(jsonb_build_object(
        'page_id', bank.page_id, 'page_name', bank.page_name, 'bank_total', bank.bank_total,
        'graded_answered', coalesce(cur.g_answered, 0), 'graded_correct', coalesce(cur.g_correct, 0),
        'graded_accuracy_pct', round(100.0 * cur.g_correct / nullif(cur.g_answered, 0), 1),
        'practice_answered', coalesce(cur.p_answered, 0), 'practice_correct', coalesce(cur.p_correct, 0),
        'mastered', coalesce(mast.mastered, 0),
        'prev_graded_answered', coalesce(prevpage.g_answered, 0),
        'prev_graded_accuracy_pct', round(100.0 * prevpage.g_correct / nullif(prevpage.g_answered, 0), 1))
        order by bank.page_id)
        from bank
        left join cur on cur.page_id = bank.page_id
        left join mast on mast.page_id = bank.page_id
        left join prevpage on prevpage.page_id = bank.page_id), '[]'::jsonb)
)
from curtot ct, prevtot pt, mastwin mw;
$$;
-- Lock it down: strip the default PUBLIC execute grant so it is reachable ONLY
-- from the access-checked wrappers below (which run as owner), never directly.
revoke all on function _report_for_student(uuid, text, timestamptz, timestamptz) from public;

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · PUBLIC RPCS (access-checked)
-- ══════════════════════════════════════════════════════════════

-- One student. Teacher-of-student, or the student themselves (the self branch
-- is left in now so Phase-R2 parent/student self-serve needs no RPC change).
create or replace function get_student_report(
    p_student_id uuid, p_subject text, p_from timestamptz, p_to timestamptz) returns jsonb
language plpgsql security definer stable set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not (teaches_student(p_student_id) or p_student_id = auth.uid()) then
        raise exception 'Not authorised';
    end if;
    return _report_for_student(p_student_id, p_subject, p_from, p_to);
end;
$$;
grant execute on function get_student_report(uuid, text, timestamptz, timestamptz) to authenticated;

-- Whole class in one round trip: the roster + a report per student. Powers the
-- Student tab (render one student's entry), the Class summary, and the batch
-- print/CSV. Owner-gated; the subject is the class's own subject. Percentile
-- and effort-vs-accuracy flags are derived on the client from this set (every
-- classmate is present), so no extra RPC is needed for them.
create or replace function get_class_report_batch(
    p_class_id uuid, p_from timestamptz, p_to timestamptz) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_subject text;
    v_name    text;
    result    jsonb;
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'Not authorised'; end if;

    select s.slug, c.name into v_subject, v_name
    from classes c join subjects s on s.id = c.subject_id where c.id = p_class_id;
    if v_subject is null then raise exception 'Class has no subject'; end if;

    select jsonb_build_object(
        'meta', jsonb_build_object(
            'class_id', p_class_id, 'class_name', v_name, 'subject', v_subject,
            'from', p_from, 'to', p_to, 'generated_at', now()),
        'students', coalesce((select jsonb_agg(jsonb_build_object(
                'student_id', p.id, 'username', p.username) order by p.username)
            from class_students cs join profiles p on p.id = cs.student_id
            where cs.class_id = p_class_id), '[]'::jsonb),
        'reports', coalesce((select jsonb_object_agg(cs.student_id::text,
                _report_for_student(cs.student_id, v_subject, p_from, p_to))
            from class_students cs where cs.class_id = p_class_id), '{}'::jsonb)
    ) into result;

    return result;
end;
$$;
grant execute on function get_class_report_batch(uuid, timestamptz, timestamptz) to authenticated;

-- Teacher-only: this student's own most-missed Daily-Revise questions (server-
-- graded), worst first, with the option distribution the teacher already sees
-- in the task builder. answer_key exposure is teacher-gated by the guard, same
-- as get_class_dr_questions. Not shown on the parent copy.
create or replace function get_student_misconceptions(
    p_student_id uuid, p_subject text, p_days int default null, p_limit int default 10)
returns table (question_key text, page_id text, page_name text, qtype text,
               snapshot jsonb, answer_key jsonb, attempts int, correct int,
               last_answer jsonb, last_correct boolean)
language plpgsql security definer stable set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not (teaches_student(p_student_id) or p_student_id = auth.uid()) then
        raise exception 'Not authorised';
    end if;

    return query
    with ev as (
        select pe.question_id, pe.is_correct, pe.answer, pe.answered_at
        from progress_events pe
        join bank_questions b on b.question_key = pe.question_id
        where pe.student_id = p_student_id and pe.section = 'daily-revise'
          and b.subject_slug = p_subject
          and (p_days is null or pe.answered_at >= now() - make_interval(days => p_days))
    ), agg as (
        select ev.question_id,
               count(*)::int attempts,
               count(*) filter (where ev.is_correct)::int correct,
               (array_agg(ev.answer order by ev.answered_at desc))[1] last_answer,
               (array_agg(ev.is_correct order by ev.answered_at desc))[1] last_correct
        from ev group by ev.question_id
    )
    select b.question_key, b.page_id, b.page_name, b.qtype, b.snapshot, b.answer_key,
           a.attempts, a.correct, a.last_answer, a.last_correct
    from agg a join bank_questions b on b.question_key = a.question_id
    where a.correct < a.attempts   -- wrong at least once
    order by (a.correct::numeric / nullif(a.attempts, 0)) asc, a.attempts desc
    limit greatest(p_limit, 1);
end;
$$;
grant execute on function get_student_misconceptions(uuid, text, int, int) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · READ-ONLY SANITY CHECKS (run manually; nothing is written)
-- ══════════════════════════════════════════════════════════════
-- Replace the UUIDs/slug with a real class + one of its students, then run.
-- Expected: JSON comes back for your own student/class; a student you do NOT
-- teach raises "Not authorised".
--
--   -- one student, all-time
--   select jsonb_pretty(get_student_report(
--     '<STUDENT_UUID>', 'business', timestamptz '1970-01-01', now()));
--
--   -- whole class, last 30 days
--   select jsonb_pretty(get_class_report_batch(
--     '<CLASS_UUID>', now() - interval '30 days', now()));
--
--   -- this student's weakest questions
--   select * from get_student_misconceptions('<STUDENT_UUID>', 'business', null, 10);
--
--   -- ACCESS: should raise "Not authorised"
--   select get_student_report('<A_STUDENT_YOU_DONT_TEACH>', 'business',
--     timestamptz '1970-01-01', now());
