-- ══════════════════════════════════════════════════════════════
-- GAMIFICATION — run AFTER schema.sql, in the Supabase SQL editor.
-- Safe to re-run.
--
-- XP, levels and badges are NOT stored anywhere — gamification.js derives
-- them fresh, every time, from progress_summary (via SECTION_TOTALS +
-- PAGE_GROUPS, same as the Phase 2 stats fix). That's deliberate: nothing
-- to award "once", nothing to drift out of sync, and it stays consistent
-- with how every other stat in this app is computed on read rather than
-- accumulated as separate mutable state.
--
-- A day-streak, though, genuinely needs a scan over progress_events'
-- timestamps that isn't practical to duplicate client-side (it would mean
-- pulling a student's entire answer history into the browser). This one
-- function is the only new gamification surface on the server.
-- ══════════════════════════════════════════════════════════════

create or replace function get_my_streak() returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid     uuid := auth.uid();
    v_days    date[];
    v_current int := 0;
    v_longest int := 0;
    v_run     int := 0;
    v_prev    date;
    d         date;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select coalesce(array_agg(distinct (answered_at at time zone 'utc')::date order by (answered_at at time zone 'utc')::date), '{}')
    into v_days
    from progress_events where student_id = v_uid;

    if v_days is null or array_length(v_days, 1) is null then
        return jsonb_build_object('current', 0, 'longest', 0);
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

    -- Only counts as a "current" streak if it runs up to today or yesterday
    -- (yesterday still counts — a student hasn't broken the chain until a
    -- full day has passed with no activity at all).
    if v_prev = current_date or v_prev = current_date - 1 then
        v_current := v_run;
    else
        v_current := 0;
    end if;

    return jsonb_build_object('current', v_current, 'longest', v_longest);
end;
$$;
grant execute on function get_my_streak() to authenticated;

