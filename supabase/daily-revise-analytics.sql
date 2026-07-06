-- ══════════════════════════════════════════════════════════════
-- DAILY REVISE — TEACHER ANALYTICS — run AFTER daily-revise-functions.sql,
-- in the Supabase SQL editor. Safe to re-run.
--
-- Four functions power teacher-analytics.html (linked from the Teacher
-- Dashboard): Usage, Student overview, Question analysis and Class matrix.
-- question_mastery / daily_revise_stats only carry student-self-select RLS
-- (a student can never see anyone else's), so teacher access goes through
-- these SECURITY DEFINER functions instead of new table policies — each one
-- verifies is_class_owner() itself and returns AGGREGATES only, never raw
-- per-event rows (progress_events can get large).
--
-- Every function takes an optional p_page_ids text[] (default null = every
-- topic) so the teacher can scope the whole analytics page to one or more
-- topics via the shared "🔍 Filter by topic" control.
-- ══════════════════════════════════════════════════════════════

-- ── Usage: per-student activity volume + accuracy/mastered ──
-- p_days windows attempts/correct/days_revised (null = all time);
-- last_revised_at is always all-time so "days since last revised" stays
-- meaningful even in a 7-day view. mastered is a live count (not windowed
-- by p_days — mastery doesn't "expire"), and respects p_page_ids the same
-- way attempts/days do.
drop function if exists get_class_dr_usage(uuid, int);

create or replace function get_class_dr_usage(p_class_id uuid, p_days int default null, p_page_ids text[] default null)
returns table (student_id uuid, attempts int, correct int, days_revised int,
               last_revised_at timestamptz, mastered int)
language plpgsql security definer stable set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'Not authorised'; end if;

    return query
    with acc as (
        select cs.student_id as sid,
               count(*) filter (where p_days is null
                                   or pe.answered_at >= now() - make_interval(days => p_days))::int as att,
               count(*) filter (where pe.is_correct and (p_days is null
                                   or pe.answered_at >= now() - make_interval(days => p_days)))::int as cor,
               count(distinct (pe.answered_at at time zone 'utc')::date)
                     filter (where p_days is null
                                or pe.answered_at >= now() - make_interval(days => p_days))::int as days,
               max(pe.answered_at) as last_at
        from class_students cs
        join progress_events pe
            on pe.student_id = cs.student_id and pe.section = 'daily-revise'
        where cs.class_id = p_class_id
          and (p_page_ids is null or pe.page_id = any(p_page_ids))
        group by cs.student_id
    ), mast as (
        select cs.student_id as sid, count(*) filter (where m.mastery_count = 3)::int as n
        from class_students cs
        join question_mastery m on m.student_id = cs.student_id
        join bank_questions b on b.question_key = m.question_key
        where cs.class_id = p_class_id
          and (p_page_ids is null or b.page_id = any(p_page_ids))
        group by cs.student_id
    )
    select cs.student_id, coalesce(acc.att, 0), coalesce(acc.cor, 0), coalesce(acc.days, 0),
           acc.last_at, coalesce(mast.n, 0)
    from class_students cs
    left join acc on acc.sid = cs.student_id
    left join mast on mast.sid = cs.student_id
    where cs.class_id = p_class_id;
end;
$$;
grant execute on function get_class_dr_usage(uuid, int, text[]) to authenticated;

-- ── Student overview: mastery-tier counts + accuracy inputs ──
-- incorrect/tier1/tier2/mastered count question_mastery rows at counts
-- 0/1/2/3 (questions never seen have no row and aren't counted anywhere);
-- attempts/correct come from the daily-revise answer log for Accuracy %.
drop function if exists get_class_dr_overview(uuid);

create or replace function get_class_dr_overview(p_class_id uuid, p_page_ids text[] default null)
returns table (student_id uuid, incorrect int, tier1 int, tier2 int, mastered int,
               attempts int, correct int)
language plpgsql security definer stable set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'Not authorised'; end if;

    return query
    with tiers as (
        select cs.student_id as sid,
               count(*) filter (where m.mastery_count = 0)::int as t0,
               count(*) filter (where m.mastery_count = 1)::int as t1,
               count(*) filter (where m.mastery_count = 2)::int as t2,
               count(*) filter (where m.mastery_count = 3)::int as t3
        from class_students cs
        join question_mastery m on m.student_id = cs.student_id
        join bank_questions b on b.question_key = m.question_key
        where cs.class_id = p_class_id
          and (p_page_ids is null or b.page_id = any(p_page_ids))
        group by cs.student_id
    ), acc as (
        select cs.student_id as sid,
               count(*)::int as att,
               count(*) filter (where pe.is_correct)::int as cor
        from class_students cs
        join progress_events pe
            on pe.student_id = cs.student_id and pe.section = 'daily-revise'
        where cs.class_id = p_class_id
          and (p_page_ids is null or pe.page_id = any(p_page_ids))
        group by cs.student_id
    )
    select cs.student_id,
           coalesce(t.t0, 0), coalesce(t.t1, 0), coalesce(t.t2, 0), coalesce(t.t3, 0),
           coalesce(a.att, 0), coalesce(a.cor, 0)
    from class_students cs
    left join tiers t on t.sid = cs.student_id
    left join acc a on a.sid = cs.student_id
    where cs.class_id = p_class_id;
end;
$$;
grant execute on function get_class_dr_overview(uuid, text[]) to authenticated;

-- ── Question analysis: class-wide per-question performance ──
-- One row per bank question with at least one attempt from this class in
-- the window (p_days default 90 bounds the progress_events scan; null =
-- all time), further scoped to p_page_ids when given. option_counts maps
-- each distinct submitted value (MCQ option index as text, TF
-- 'true'/'false') to how many times it was chosen; FIB answers are
-- multi-blank objects, so option_counts is null for them and the client
-- shows a correct/incorrect split instead. answer_key exposure here is
-- teacher-only (the guard above) — the same content teachers already see
-- in the task builder's mark schemes.
drop function if exists get_class_dr_questions(uuid, int);

create or replace function get_class_dr_questions(p_class_id uuid, p_days int default 90, p_page_ids text[] default null)
returns table (question_key text, page_id text, page_name text, qtype text,
               snapshot jsonb, answer_key jsonb, students_attempted int,
               attempts int, correct int, option_counts jsonb)
language plpgsql security definer stable set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'Not authorised'; end if;

    return query
    with ev as (
        select pe.question_id, pe.student_id, pe.is_correct,
               case when pe.answer is null then null
                    when jsonb_typeof(pe.answer->'value') in ('object', 'array') then null
                    else pe.answer->>'value' end as picked
        from progress_events pe
        join class_students cs on cs.student_id = pe.student_id and cs.class_id = p_class_id
        join bank_questions bq on bq.question_key = pe.question_id
        where pe.section = 'daily-revise'
          and (p_days is null or pe.answered_at >= now() - make_interval(days => p_days))
          and (p_page_ids is null or bq.page_id = any(p_page_ids))
    ), agg as (
        select ev.question_id,
               count(distinct ev.student_id)::int as students_attempted,
               count(*)::int as attempts,
               count(*) filter (where ev.is_correct)::int as correct
        from ev
        group by ev.question_id
    ), opts as (
        select ev.question_id, jsonb_object_agg(ev.picked, ev.n) as option_counts
        from (
            select ev.question_id, ev.picked, count(*)::int as n
            from ev
            where ev.picked is not null
            group by ev.question_id, ev.picked
        ) ev
        group by ev.question_id
    )
    select b.question_key, b.page_id, b.page_name, b.qtype, b.snapshot, b.answer_key,
           a.students_attempted, a.attempts, a.correct,
           case when b.qtype = 'fib' then null else o.option_counts end
    from agg a
    join bank_questions b on b.question_key = a.question_id
    left join opts o on o.question_id = a.question_id;
end;
$$;
grant execute on function get_class_dr_questions(uuid, int, text[]) to authenticated;

-- ── Class matrix: student × topic mastery grid ──
-- cells only exist where a student has at least one tracked question on
-- that page; pages[] carries per-page bank totals for the denominators.
-- p_page_ids narrows both pages[] and cells[] to the selected topics.
--   tracked      — question_mastery rows (questions ever attempted)
--   mastered     — rows at mastery_count = 3
--   correct_plus — rows at mastery_count >= 1 (last answer correct)
drop function if exists get_class_dr_matrix(uuid);

create or replace function get_class_dr_matrix(p_class_id uuid, p_page_ids text[] default null) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_pages jsonb;
    v_cells jsonb;
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'Not authorised'; end if;

    select coalesce(jsonb_agg(p order by p->>'page_id'), '[]'::jsonb) into v_pages
    from (
        select jsonb_build_object(
            'page_id', b.page_id, 'page_name', min(b.page_name),
            'bank_total', count(*)::int) as p
        from bank_questions b
        where p_page_ids is null or b.page_id = any(p_page_ids)
        group by b.page_id
    ) pages;

    select coalesce(jsonb_agg(c), '[]'::jsonb) into v_cells
    from (
        select jsonb_build_object(
            'student_id', cs.student_id, 'page_id', b.page_id,
            'tracked', count(*)::int,
            'mastered', count(*) filter (where m.mastery_count = 3)::int,
            'correct_plus', count(*) filter (where m.mastery_count >= 1)::int) as c
        from class_students cs
        join question_mastery m on m.student_id = cs.student_id
        join bank_questions b on b.question_key = m.question_key
        where cs.class_id = p_class_id
          and (p_page_ids is null or b.page_id = any(p_page_ids))
        group by cs.student_id, b.page_id
    ) cells;

    return jsonb_build_object('pages', v_pages, 'cells', v_cells);
end;
$$;
grant execute on function get_class_dr_matrix(uuid, text[]) to authenticated;
