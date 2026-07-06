-- ══════════════════════════════════════════════════════════════
-- DAILY REVISE — LIFETIME STATS — run BEFORE daily-revise-functions.sql (the
-- updated record_mastery_answer() writes to this table). Safe to re-run.
--
-- question_mastery.mastery_count resets to 0 on a wrong answer, so it can't
-- drive XP directly (XP must never go DOWN). This table is a durable,
-- monotonically-increasing counter of lifetime Daily Revise activity —
-- total_correct only ever grows (every correct answer, regardless of
-- mastery resets), total_mastered only ever grows (once per question the
-- FIRST time it reaches mastery_count = 3). Read by gamification.js to fold
-- Daily Revise practice into a student's total XP and to power its two new
-- Daily-Revise-specific badges.
-- ══════════════════════════════════════════════════════════════

create table if not exists daily_revise_stats (
    student_id     uuid primary key references profiles(id) on delete cascade,
    total_correct  int not null default 0,
    total_mastered int not null default 0,
    updated_at     timestamptz not null default now()
);
alter table daily_revise_stats enable row level security;
drop policy if exists "daily_revise_stats_self_select" on daily_revise_stats;
create policy "daily_revise_stats_self_select" on daily_revise_stats
    for select using (student_id = auth.uid());
-- No insert/update policy — written only by record_mastery_answer()
-- (security definer), same trust pattern as question_mastery.
