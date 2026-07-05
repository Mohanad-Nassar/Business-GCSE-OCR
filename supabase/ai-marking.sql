-- ══════════════════════════════════════════════════════════════
-- AI MARKING SUGGESTIONS — run AFTER tasks-schema.sql, in the
-- Supabase SQL editor. Safe to re-run.
--
-- Adds a place for Gemini's mark suggestions to live for written
-- (qtype = 'written') task_answers. This is a SEPARATE table from
-- task_answers rather than new ai_* columns on it, on purpose:
-- task_answers has a student-self-select RLS policy (students read
-- their own submitted answers, e.g. task.html's results view selects
-- '*' from it), and Postgres RLS is row-level, not column-level —
-- any ai_* column added directly to task_answers would be visible to
-- the student the moment Gemini suggests it, before the teacher has
-- reviewed anything. Keeping suggestions in their own teacher-only
-- table preserves the "AI suggests, teacher releases" design: nothing
-- a student can read changes until the teacher accepts a suggestion
-- through the existing manual mark_task_answer() path.
-- ══════════════════════════════════════════════════════════════

create table if not exists task_answer_suggestions (
    answer_id       uuid primary key references task_answers(id) on delete cascade,
    ai_marks        numeric not null,
    ai_feedback     text not null,   -- student-facing, once accepted
    ai_reasoning    text not null,   -- teacher-facing, per mark-scheme point
    ai_confidence   real not null check (ai_confidence >= 0 and ai_confidence <= 1),
    ai_model        text not null,
    ai_suggested_at timestamptz not null default now()
);

alter table task_answer_suggestions enable row level security;

-- Teachers only, and only for answers belonging to a task they own —
-- mirrors the join used by task_answers_teacher_select in tasks-schema.sql.
drop policy if exists "task_answer_suggestions_teacher_all" on task_answer_suggestions;
create policy "task_answer_suggestions_teacher_all" on task_answer_suggestions
    for all using (exists (
        select 1 from task_answers a
        join task_attempts att on att.id = a.attempt_id
        where a.id = task_answer_suggestions.answer_id and owns_task(att.task_id)
    ))
    with check (exists (
        select 1 from task_answers a
        join task_attempts att on att.id = a.attempt_id
        where a.id = task_answer_suggestions.answer_id and owns_task(att.task_id)
    ));
