-- ══════════════════════════════════════════════════════════════
-- DAILY REVISE — BANK QUESTIONS + MASTERY — run AFTER schema.sql (the
-- subjects table must exist first), in the Supabase SQL editor. Safe to
-- re-run. After this file, seed the bank with
-- `python tools/build_question_bank.py --upload` (or by running the
-- generated bank-questions-seed/<subject>/*.sql files in order), then run
-- daily-revise-functions.sql.
--
-- Why a separate table from question-bank.js: that generated JS file
-- embeds the correct answer inline in every question (`key: {answer, ...}`)
-- and is only ever loaded by the teacher-only teacher-tasks.html. The new
-- Daily Revise page is student-facing, so serving question-bank.js to it
-- directly would let any student read every answer in the course via
-- devtools. bank_questions splits each question into a student-visible
-- `snapshot` and a hidden `answer_key` — the same split task_questions
-- already uses (see tasks-schema.sql) — and carries ZERO RLS policies of
-- any kind, so no authenticated user can ever SELECT it directly. Students
-- only ever reach it through the SECURITY DEFINER functions in
-- daily-revise-functions.sql, whose declared return columns are what
-- omit answer_key (same enforcement mechanism as get_my_task_questions()).
-- ══════════════════════════════════════════════════════════════

-- ── bank_questions ── (populated by tools/build_question_bank.py --upload,
-- or the generated files in bank-questions-seed/<subject>/; excludes
-- free-text 'written' exam-practice questions, which have no deterministic
-- correctness signal and so can't participate in auto-graded mastery)
-- Multi-subject: every row carries subject_slug (references subjects.slug —
-- run schema.sql first so the subjects rows exist) and page_id is
-- subject-prefixed ('business:1-1-…'). Column order matches the generated
-- seed files' insert lists.
create table if not exists bank_questions (
    question_key text primary key,       -- same id as question-bank.js / task_questions.question_key
    subject_slug text not null references subjects(slug),
    page_id      text not null,
    page_name    text not null,
    source       text not null,          -- 'exam'|'mcq'|'tf'|'learn'|'misc'|'tips'|'fib'|'match'
    qtype        text not null check (qtype in ('mcq', 'tf', 'fib', 'numeric')),
    marks        numeric not null check (marks > 0),
    snapshot     jsonb not null,          -- question/options/caseStudy/reading/hint/starter — no answer
    answer_key   jsonb not null default '{}'::jsonb,  -- correct answer / blanks / explain — hidden
    updated_at   timestamptz not null default now()
);

-- Pre-multi-subject installs: this table already existed with no
-- subject_slug column and unprefixed question_key/page_id values (`create
-- table if not exists` above is a no-op against it). Those rows are a
-- generated cache, not authored data — their identity (question_key is a
-- text hash) is incompatible with the new "business:1-1-…"-prefixed ids, so
-- once the column exists they're cleared rather than backfilled;
-- `python tools/build_question_bank.py --upload` repopulates everything
-- under the new ids right after this file runs. Cascades to
-- question_mastery, which is harmless pre-launch. No-op on a fresh install.
alter table bank_questions add column if not exists subject_slug text references subjects(slug);
delete from bank_questions where subject_slug is null;
alter table bank_questions alter column subject_slug set not null;

create index if not exists bank_questions_subject_page_idx
    on bank_questions (subject_slug, page_id);
alter table bank_questions enable row level security;
-- No policies at all, deliberately — there is no "owning teacher" for a shared
-- course-wide table, so nobody should ever read it via a direct table query.

-- ── question_mastery ── (one row per student per question, current state —
-- not an event log, unlike progress_events)
create table if not exists question_mastery (
    student_id     uuid not null references profiles(id) on delete cascade,
    question_key   text not null references bank_questions(question_key) on delete cascade,
    mastery_count  int  not null default 0 check (mastery_count between 0 and 3),
    last_seen_at   timestamptz,
    next_due_at    timestamptz,           -- null = never seen, or mastered (excluded from the queue)
    updated_at     timestamptz not null default now(),
    primary key (student_id, question_key)
);
create index if not exists question_mastery_due_idx on question_mastery (student_id, next_due_at);

alter table question_mastery enable row level security;
drop policy if exists "question_mastery_self_select" on question_mastery;
create policy "question_mastery_self_select" on question_mastery
    for select using (student_id = auth.uid());
-- No insert/update policy — all writes go through record_mastery_answer()
-- (daily-revise-functions.sql), same trust pattern as progress_events /
-- record_progress() in schema.sql.
