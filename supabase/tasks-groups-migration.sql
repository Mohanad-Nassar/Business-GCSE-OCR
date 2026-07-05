-- ══════════════════════════════════════════════════════════════
-- MULTI-CLASS TASK ASSIGNMENT — run AFTER tasks-schema.sql, in the
-- Supabase SQL editor. Safe to re-run.
--
-- A task still belongs to exactly one class (tasks.class_id stays
-- NOT NULL — see tasks-schema.sql). When a teacher sends the same
-- task to several classes, the app creates one tasks row per class,
-- each a full copy of the same title/settings/questions, and links
-- the siblings with a shared assignment_group_id so the teacher can
-- later compare how each class performed on "the same" task.
--
-- No RLS change is needed: tasks_teacher_all already scopes every
-- row by teacher_id, and every sibling in a group shares the same
-- teacher_id.
-- ══════════════════════════════════════════════════════════════

alter table tasks add column if not exists assignment_group_id uuid;
create index if not exists tasks_assignment_group_idx on tasks (assignment_group_id);
