-- ══════════════════════════════════════════════════════════════
-- REWARDS STORE — CALIBRATION REPORT   (WP-6, docs/REWARDS-STORE-PLAN.md §4.5)
--
-- READ-ONLY. Run in the Supabase SQL editor and paste the single result table
-- back. Nothing here writes — it only SELECTs over existing history, so it is
-- safe to run any number of times.
--
-- WHAT IT ANSWERS. Under the v1 earn formula in rewards-store.sql —
--     15 coins per first-mastery  +  15 per completed review,
--     capped at 100 coins/day, with a 600-coin retroactive launch grant —
-- how many coins does a REAL active student earn per week, and does that match
-- the intended pace (~350 = a mid-tier character in ~1 week)? The numbers tell
-- us how to tune, in supabase/rewards-store.sql:
--     • the two ×15 multipliers in _wallet_target()
--     • c_daily (the 100/day cap) and c_retro (the 600 grant) in _wallet_earned()
--     • the shop prices in SECTION 4 (the seed)
--
-- HOW TO READ IT.
--   • Percentiles are over ACTIVE earners (students with ≥1 mastery or review).
--     "median" = the typical student; p90 = a very keen one; p25 = a quiet one.
--   • coins_per_week_median is the headline: aim to price a mid character at
--     ≈ 1× that (so ~1 week), a cheap item at ≈ 0.2×, a prestige-feel item higher.
--   • If pct_student_days_over_100cap is ~0, the daily cap never bites and could
--     be lowered; if it's large, the cap is throttling keen students — raise it.
--   • If pct_active_over_retro_600 is large, heavy pre-launch users are being
--     clipped by the retro grant — consider raising c_retro.
--   • If students_active_earners is small or zero, there isn't enough real usage
--     to calibrate from data yet — we set the constants by model (see the plan)
--     and re-run this once the cohort is live.
-- ══════════════════════════════════════════════════════════════

with
me_cnt as (
    select student_id,
           count(*)::numeric                                                          as n,
           min(mastered_at)                                                           as first_at,
           max(mastered_at)                                                           as last_at,
           count(*) filter (where mastered_at >= now() - interval '28 days')::numeric as n28
    from mastery_events
    group by student_id
),
rv_cnt as (
    select student_id,
           count(*)::numeric                                                            as n,
           count(*) filter (where completed_at >= now() - interval '28 days')::numeric  as n28
    from topic_reviews
    where completed_at is not null
    group by student_id
),
-- Per-student coins under the current formula: lifetime, and just the last 28d
-- (the recent-earning-rate proxy; ÷4 ≈ coins/week).
per_student as (
    select p.id as student_id,
           coalesce(me.n, 0)   as masteries,
           coalesce(rv.n, 0)   as reviews,
           coalesce(me.n, 0) * 15 + coalesce(rv.n, 0) * 15   as lifetime_coins,
           coalesce(me.n28, 0) * 15 + coalesce(rv.n28, 0) * 15 as coins_28d
    from profiles p
    left join me_cnt me on me.student_id = p.id
    left join rv_cnt rv on rv.student_id = p.id
    where p.role = 'student'
),
active   as (select * from per_student where lifetime_coins > 0),
active28 as (select * from per_student where coins_28d > 0),
-- Coins that WOULD accrue per student per calendar day (mastery + review on the
-- same day combined) — used to test whether the 100/day cap actually clips.
day_coins as (
    select student_id, d, sum(c) * 15 as coins_day
    from (
        select student_id, mastered_at::date  as d, count(*) as c from mastery_events group by 1, 2
        union all
        select student_id, completed_at::date as d, count(*) as c from topic_reviews where completed_at is not null group by 1, 2
    ) u
    group by student_id, d
),
peak as (select student_id, max(coins_day) as mx from day_coins group by student_id)

select metric, round(value, 1) as value
from (
    values
        ('— DATA AVAILABILITY —',        null::numeric),
        ('students_total',               (select count(*) from profiles where role = 'student')::numeric),
        ('students_active_earners',      (select count(*) from active)::numeric),
        ('students_active_last_28d',     (select count(*) from active28)::numeric),
        ('mastery_events_total',         (select count(*) from mastery_events)::numeric),
        ('reviews_completed_total',      (select count(*) from topic_reviews where completed_at is not null)::numeric),
        ('history_span_days',            (select extract(day from (max(last_at) - min(first_at)))::numeric from me_cnt)),

        ('— CURRENT CONSTANTS —',        null::numeric),
        ('earn_per_mastery',             15::numeric),
        ('earn_per_review',              15::numeric),
        ('daily_cap_per_day',            100::numeric),
        ('retro_grant_cap',              600::numeric),
        ('target_price_mid_character',   350::numeric),

        ('— WEEKLY EARN  (active, last 28d ÷ 4) —', null::numeric),
        ('coins_per_week_p25',           (select (percentile_cont(0.25) within group (order by coins_28d) / 4)::numeric from active28)),
        ('coins_per_week_median',        (select (percentile_cont(0.50) within group (order by coins_28d) / 4)::numeric from active28)),
        ('coins_per_week_p75',           (select (percentile_cont(0.75) within group (order by coins_28d) / 4)::numeric from active28)),
        ('coins_per_week_p90',           (select (percentile_cont(0.90) within group (order by coins_28d) / 4)::numeric from active28)),

        ('— PACE: weeks to afford at the median weekly rate —', null::numeric),
        ('weeks_to_mid_character_350',   (select (350 / nullif(percentile_cont(0.50) within group (order by coins_28d) / 4, 0))::numeric from active28)),
        ('weeks_to_cheap_item_60',       (select (60  / nullif(percentile_cont(0.50) within group (order by coins_28d) / 4, 0))::numeric from active28)),

        ('— DAILY CAP CHECK —',          null::numeric),
        ('peak_day_coins_median',        (select (percentile_cont(0.50) within group (order by mx))::numeric from peak)),
        ('peak_day_coins_p90',           (select (percentile_cont(0.90) within group (order by mx))::numeric from peak)),
        ('pct_student_days_over_100cap', (select (100.0 * avg((coins_day > 100)::int))::numeric from day_coins)),

        ('— RETRO CAP CHECK —',          null::numeric),
        ('lifetime_coins_median',        (select (percentile_cont(0.50) within group (order by lifetime_coins))::numeric from active)),
        ('lifetime_coins_p90',           (select (percentile_cont(0.90) within group (order by lifetime_coins))::numeric from active)),
        ('pct_active_over_retro_600',    (select (100.0 * avg((lifetime_coins > 600)::int))::numeric from active))
) as t(metric, value);
