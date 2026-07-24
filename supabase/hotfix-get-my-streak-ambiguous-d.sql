-- ══════════════════════════════════════════════════════════════
-- HOTFIX (2026-07-21): get_my_streak silently returned 0/0 for EVERY student.
--
-- Cause: the WP-5 streak_shields refactor added a subquery aliasing a column
-- `d` and aggregated it with `array_agg(d order by d)`. The function also
-- declares a PL/pgSQL loop variable `d date`, so the bare `d` was ambiguous →
-- Postgres raised 42702 ("column reference d is ambiguous") and the whole
-- function threw. gamification.js wraps the call in `catch(e){}`, so the error
-- was invisible and every streak fell back to 0 — while the practice calendar
-- (get_my_activity_days, no such variable) kept lighting up. That mismatch is
-- why the teacher dashboard (get_class_streaks — no `d` variable) still showed
-- the real streak while students saw 0.
--
-- Fix: qualify the aggregated column as x.d. Logic is otherwise UNCHANGED.
-- This block is identical to the corrected function now in
-- supabase/gamification-functions.sql — safe to re-run either one.
--
-- Run in the Supabase SQL editor. streak_shields already exists on live; this
-- touches only the function body.
-- ══════════════════════════════════════════════════════════════

create or replace function get_my_streak(p_subject text default null) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid     uuid := auth.uid();
    v_days    date[];
    v_current int := 0;
    v_longest int := 0;
    v_run     int := 0;
    v_prev    date;
    v_last    timestamptz;
    d         date;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select max(answered_at) into v_last
    from progress_events
    where student_id = v_uid
      and (p_subject is null or page_id like p_subject || ':%');

    -- Qualify as x.d — a bare `d` collides with the loop variable below (42702).
    select coalesce(array_agg(x.d order by x.d), '{}')
    into v_days
    from (
        select distinct (answered_at at time zone 'utc')::date as d
        from progress_events
        where student_id = v_uid
          and (p_subject is null or page_id like p_subject || ':%')
        union
        select shield_date as d
        from streak_shields
        where student_id = v_uid
          and (p_subject is null or subject_slug = p_subject)
    ) x;

    if v_days is null or array_length(v_days, 1) is null then
        return jsonb_build_object('current', 0, 'longest', 0, 'last_active', null);
    end if;

    foreach d in array v_days loop
        if v_prev is null or d = v_prev + 1 then
            v_run := v_run + 1;
        else
            v_run := 1;
        end if;
        v_longest := greatest(v_longest, v_run);
        v_prev := d;
    end loop;

    if v_prev = current_date or v_prev = current_date - 1 then
        v_current := v_run;
    else
        v_current := 0;
    end if;

    return jsonb_build_object('current', v_current, 'longest', v_longest, 'last_active', v_last);
end;
$$;
grant execute on function get_my_streak(text) to authenticated;
