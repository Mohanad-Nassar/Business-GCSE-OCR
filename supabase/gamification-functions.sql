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

-- p_subject scopes the streak to ONE subject (its prefixed page ids, e.g.
-- 'business:1-1-…', same filter as get_my_activity_days) so each subject's
-- dashboard shows its own streak; null = across every subject (the badges/
-- profile-wide view). Dropped-then-recreated because the signature changed —
-- keeping the old 0-arg version around would make the no-arg call ambiguous.
drop function if exists get_my_streak();
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

    -- Timestamp of the most recent answer — powers the "last practised X ago"
    -- line shown once a streak has lapsed.
    select max(answered_at) into v_last
    from progress_events
    where student_id = v_uid
      and (p_subject is null or page_id like p_subject || ':%');

    select coalesce(array_agg(distinct (answered_at at time zone 'utc')::date order by (answered_at at time zone 'utc')::date), '{}')
    into v_days
    from progress_events
    where student_id = v_uid
      and (p_subject is null or page_id like p_subject || ':%');

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

    -- Only counts as a "current" streak if it runs up to today or yesterday
    -- (yesterday still counts — a student hasn't broken the chain until a
    -- full day has passed with no activity at all).
    if v_prev = current_date or v_prev = current_date - 1 then
        v_current := v_run;
    else
        v_current := 0;
    end if;

    return jsonb_build_object('current', v_current, 'longest', v_longest, 'last_active', v_last);
end;
$$;
grant execute on function get_my_streak(text) to authenticated;

-- ── Per-day activity, for the GitHub-style practice heatmap ──
-- Distinct-day counts of the caller's progress_events over the last p_days
-- days (default ~53 weeks, so it fills a year-wide calendar). Same UTC date
-- casting as get_my_streak above; only days that actually had activity are
-- returned, as a jsonb array [{"day":"YYYY-MM-DD","count":N}, …] ordered by
-- day. Both topic-page and Daily Revise answers land in progress_events, so
-- with p_subject null this aggregates across every subject (the cross-subject
-- view, e.g. badges.html). Pass p_subject to scope the calendar to one subject
-- on a subject-scoped page (dashboard/review-calendar): page ids are
-- subject-prefixed, e.g. 'business:1-1-…', so the same `like p_subject || ':%'`
-- filter get_review_schedule uses selects one subject's events. Both params
-- default, so a bare get_my_activity_days() call keeps the original
-- all-subjects, ~year-wide behaviour. Safe to re-run.
create or replace function get_my_activity_days(p_days int default 371, p_subject text default null) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid    uuid := auth.uid();
    v_result jsonb;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select coalesce(
        jsonb_agg(jsonb_build_object('day', d.day, 'count', d.cnt) order by d.day),
        '[]'::jsonb)
    into v_result
    from (
        select (answered_at at time zone 'utc')::date as day,
               count(*)::int                          as cnt
        from progress_events
        where student_id = v_uid
          and (answered_at at time zone 'utc')::date > current_date - p_days
          and (p_subject is null or page_id like p_subject || ':%')
        group by (answered_at at time zone 'utc')::date
    ) d;

    return v_result;
end;
$$;
grant execute on function get_my_activity_days(int, text) to authenticated;

