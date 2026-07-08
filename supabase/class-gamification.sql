-- ══════════════════════════════════════════════════════════════
-- CLASS GAMIFICATION — run AFTER schema.sql (and ideally after
-- gamification-functions.sql), in the Supabase SQL editor. Safe to re-run.
--
-- get_class_streaks(): the day-streaks of every student in one of the
-- caller's classes, in one call — the teacher-side counterpart of
-- get_my_streak() (which only answers for the caller). Levels, XP and
-- badges never need the server: the teacher dashboard derives them from
-- progress_summary rows it already loads, exactly like the student's own
-- pages do. Streaks are the one number that needs the answer-log's
-- timestamps, which is what this function scans.
--
-- Same streak rules as get_my_streak(): consecutive UTC days with at
-- least one answer; a streak still counts as "current" if the last
-- answer was today or yesterday.
-- ══════════════════════════════════════════════════════════════

create or replace function get_class_streaks(p_class_id uuid) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_result jsonb;
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'Not authorised'; end if;

    with days as (
        select cs.student_id, (pe.answered_at at time zone 'utc')::date as d
        from class_students cs
        join progress_events pe on pe.student_id = cs.student_id
        where cs.class_id = p_class_id
        group by cs.student_id, (pe.answered_at at time zone 'utc')::date
    ), islands as (
        -- consecutive dates share a group: date minus row_number is constant
        select student_id, d,
               d - (row_number() over (partition by student_id order by d))::int as grp
        from days
    ), lens as (
        select student_id, count(*)::int as len, max(d) as last_d
        from islands
        group by student_id, grp
    )
    select coalesce(jsonb_agg(jsonb_build_object(
        'student_id', student_id,
        'longest', longest,
        'current', current
    )), '[]'::jsonb)
    into v_result
    from (
        select student_id,
               max(len) as longest,
               coalesce(max(len) filter (where last_d >= current_date - 1), 0) as current
        from lens
        group by student_id
    ) s;

    return v_result;
end;
$$;
grant execute on function get_class_streaks(uuid) to authenticated;

-- ── get_class_activity_days(p_class_id, p_subject, p_days) ──
-- Per-day answer counts for EVERY student in one of the caller's classes, in
-- one call — the teacher-side, whole-class counterpart of get_my_activity_days
-- (which only answers for the caller). Powers the GitHub-style practice heatmap
-- on the single-student panel of the teacher dashboard. Same UTC-date grouping
-- and jsonb {"day":"YYYY-MM-DD","count":N} shape as get_my_activity_days, plus a
-- "student_id" on each row so the client can slice the flat array per student.
-- Joined through class_students exactly like get_class_streaks. When p_subject
-- is given it filters to that subject's prefixed page ids (e.g. 'business:1-1-…',
-- same pattern as get_review_schedule) so the teacher's view of a student is
-- scoped to the class's subject — matching what that student sees on their own
-- subject-scoped dashboard. p_days defaults to 371 (~53 weeks, a year-wide grid).
create or replace function get_class_activity_days(p_class_id uuid, p_subject text default null, p_days int default 371) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_result jsonb;
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'Not authorised'; end if;

    select coalesce(
        jsonb_agg(jsonb_build_object('student_id', d.student_id, 'day', d.day, 'count', d.cnt)
                  order by d.student_id, d.day),
        '[]'::jsonb)
    into v_result
    from (
        select cs.student_id                             as student_id,
               (pe.answered_at at time zone 'utc')::date as day,
               count(*)::int                             as cnt
        from class_students cs
        join progress_events pe on pe.student_id = cs.student_id
        where cs.class_id = p_class_id
          and (pe.answered_at at time zone 'utc')::date > current_date - p_days
          and (p_subject is null or pe.page_id like p_subject || ':%')
        group by cs.student_id, (pe.answered_at at time zone 'utc')::date
    ) d;

    return v_result;
end;
$$;
grant execute on function get_class_activity_days(uuid, text, int) to authenticated;
