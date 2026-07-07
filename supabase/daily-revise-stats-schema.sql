-- ══════════════════════════════════════════════════════════════
-- DAILY REVISE — LIFETIME STATS — run AFTER schema.sql (needs the subjects
-- table) and BEFORE daily-revise-functions.sql (the updated
-- record_mastery_answer() writes to this table). Safe to re-run.
--
-- question_mastery.mastery_count resets to 0 on a wrong answer, so it can't
-- drive XP directly (XP must never go DOWN). This table is a durable,
-- monotonically-increasing counter of lifetime Daily Revise activity —
-- total_correct only ever grows (every correct answer, regardless of
-- mastery resets), total_mastered only ever grows (once per question the
-- FIRST time it reaches mastery_count = 3). Read by gamification.js to fold
-- Daily Revise practice into a student's total XP and to power its two new
-- Daily-Revise-specific badges.
--
-- Multi-subject: one row per (student, subject) — record_mastery_answer()
-- attributes each answer to the question's bank_questions.subject_slug.
-- A client that wants the cross-subject lifetime totals (XP/badges are
-- cross-subject) just sums its own rows.
-- ══════════════════════════════════════════════════════════════

create table if not exists daily_revise_stats (
    student_id     uuid not null references profiles(id) on delete cascade,
    subject_slug   text not null default 'business' references subjects(slug),
    total_correct  int not null default 0,
    total_mastered int not null default 0,
    updated_at     timestamptz not null default now(),
    primary key (student_id, subject_slug)
);

-- Pre-multi-subject installs: this table already existed with `student_id`
-- as a single-column primary key and no subject_slug (`create table if not
-- exists` above is a no-op against it). Unlike bank_questions, this data is
-- worth keeping — it genuinely was every student's Business stats, since
-- Business was the only subject that existed. The DEFAULT 'business'
-- backfills every existing row correctly in the same statement; widening
-- the primary key is then safe since there was at most one row per student.
-- Both statements are harmless no-ops on a fresh install (constraint name
-- is Postgres's standard auto-generated name for a lone-column PK).
alter table daily_revise_stats add column if not exists subject_slug text not null default 'business' references subjects(slug);
alter table daily_revise_stats drop constraint if exists daily_revise_stats_pkey;
alter table daily_revise_stats add primary key (student_id, subject_slug);

alter table daily_revise_stats enable row level security;
drop policy if exists "daily_revise_stats_self_select" on daily_revise_stats;
create policy "daily_revise_stats_self_select" on daily_revise_stats
    for select using (student_id = auth.uid());
-- No insert/update policy — written only by record_mastery_answer()
-- (security definer), same trust pattern as question_mastery.
