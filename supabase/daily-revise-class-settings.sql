-- ══════════════════════════════════════════════════════════════
-- DAILY REVISE — CLASS SETTINGS — run AFTER bank-questions-schema.sql, in
-- the Supabase SQL editor. Safe to re-run.
--
-- Per-class controls for the Daily Revise practice zone, in the same style
-- as class-flow-settings.sql: nullable/defaulted columns directly on
-- `classes`, no new RLS policy needed (the existing classes_teacher_all
-- policy already covers any column on a teacher's own row), written by the
-- teacher dashboard via a direct `.update()`, read by students through
-- get_daily_revise_settings() (see daily-revise-functions.sql).
--
-- daily_revise_topic_mode mirrors topic_access_mode's three-way pattern:
--   'teacher_controlled' — no filter shown to students at all; the TEACHER
--                          instead picks the class-wide topic set via
--                          class_topic_filter_active, and every student's
--                          queue is pinned to it. Default (untouched) state
--                          is every topic active, so nothing changes for a
--                          class until a teacher opts in to narrowing it.
--   'teacher_guided'      — students can filter, but only within the topics
--                          the teacher has left active (class_topic_filter_active).
--   'student_controlled'  — students can filter across every topic freely.
-- ══════════════════════════════════════════════════════════════

alter table classes add column if not exists daily_revise_topic_mode text not null default 'teacher_controlled'
    check (daily_revise_topic_mode in ('teacher_controlled', 'teacher_guided', 'student_controlled'));
alter table classes add column if not exists daily_revise_weekly_cap int
    check (daily_revise_weekly_cap is null or daily_revise_weekly_cap > 0);  -- null = unlimited
alter table classes add column if not exists daily_revise_pre_seconds int not null default 5
    check (daily_revise_pre_seconds between 0 and 60);
alter table classes add column if not exists daily_revise_post_seconds int not null default 5
    check (daily_revise_post_seconds between 0 and 60);

-- ── class_topic_filter_active ── ('teacher_guided' mode only)
-- A separate table from class_topic_visibility (topic-access-schema.sql) on
-- purpose — that table is tightly coupled to the manual topic-LOCK feature
-- (record_progress() rejects writes to a hidden topic, topic-guard.js blocks
-- the page entirely), and reusing it here would silently inherit that
-- write-rejection behaviour for an unrelated feature. Absence of a row here
-- means active, same "absence = default" convention as class_topic_visibility,
-- so a teacher in 'teacher_guided' mode only writes rows for topics they're
-- switching OFF the Daily Revise filter.
create table if not exists class_topic_filter_active (
    class_id   uuid not null references classes(id) on delete cascade,
    page_id    text not null,
    active     boolean not null default true,
    updated_at timestamptz not null default now(),
    primary key (class_id, page_id)
);
alter table class_topic_filter_active enable row level security;
drop policy if exists "ctfa_teacher_all" on class_topic_filter_active;
create policy "ctfa_teacher_all" on class_topic_filter_active
    for all using (is_class_owner(class_id)) with check (is_class_owner(class_id));
