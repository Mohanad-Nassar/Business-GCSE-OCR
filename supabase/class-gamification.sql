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

-- p_subject scopes every student's streak to ONE subject (its prefixed page
-- ids, same filter as get_class_activity_days) so the teacher sees the streak
-- for the class's subject rather than a cross-subject figure; null = every
-- subject. Dropped-then-recreated because the signature changed.
drop function if exists get_class_streaks(uuid);
-- Streak-freeze shields (WP-5): dates that count as "active" for a subject's
-- streak. Table + RLS are created TOGETHER here (never split) so streak_shields
-- can NEVER exist without RLS, whichever file runs first — a bare table would be
-- world-writable via the anon key (a student could forge streaks). rewards-store.sql
-- carries the identical block as canonical. Writes only via use_perk (definer).
create table if not exists streak_shields (
    student_id   uuid not null references profiles(id) on delete cascade,
    subject_slug text not null references subjects(slug),
    shield_date  date not null,
    created_at   timestamptz not null default now(),
    primary key (student_id, subject_slug, shield_date)
);
alter table streak_shields enable row level security;
drop policy if exists "streak_shields_self_select" on streak_shields;
create policy "streak_shields_self_select" on streak_shields for select using (student_id = auth.uid());
grant select on streak_shields to authenticated;

create or replace function get_class_streaks(p_class_id uuid, p_subject text default null) returns jsonb
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
          and (p_subject is null or pe.page_id like p_subject || ':%')
        group by cs.student_id, (pe.answered_at at time zone 'utc')::date
        union   -- streak-freeze shields count as active days (WP-5)
        select cs.student_id, ss.shield_date
        from class_students cs
        join streak_shields ss on ss.student_id = cs.student_id
        where cs.class_id = p_class_id
          and (p_subject is null or ss.subject_slug = p_subject)
    ), last_seen as (
        -- Timestamp of each student's most recent answer (subject-scoped) —
        -- used for the "last practised X ago" display once a streak has lapsed.
        select cs.student_id, max(pe.answered_at) as last_active
        from class_students cs
        join progress_events pe on pe.student_id = cs.student_id
        where cs.class_id = p_class_id
          and (p_subject is null or pe.page_id like p_subject || ':%')
        group by cs.student_id
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
        'student_id', s.student_id,
        'longest', s.longest,
        'current', s.current,
        'last_active', ls.last_active
    )), '[]'::jsonb)
    into v_result
    from (
        select student_id,
               max(len) as longest,
               coalesce(max(len) filter (where last_d >= current_date - 1), 0) as current
        from lens
        group by student_id
    ) s
    left join last_seen ls on ls.student_id = s.student_id;

    return v_result;
end;
$$;
grant execute on function get_class_streaks(uuid, text) to authenticated;

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
