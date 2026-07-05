-- ══════════════════════════════════════════════════════════════
-- RETRY-WRONG-QUESTIONS — run AFTER tasks-schema.sql, in the
-- Supabase SQL editor. Safe to re-run.
--
-- Adds a manual "retry only what I got wrong" flow: a student can
-- spin up a brand-new, small task containing just the auto-marked
-- questions (mcq/tf/fib) they got wrong on a past submitted attempt.
-- Rather than trying to scope a single task_attempts row to a
-- subset of task_questions (submit_task_attempt() blanks-and-scores
-- EVERY question on the task, so a partial retry against the same
-- task would corrupt scoring), this creates a new tasks row —
-- reusing the exact same tables/flow the teacher's task builder
-- already uses, just single-student and machine-picked.
--
-- 'written' questions are excluded: they're unmarked (awarded is
-- null) until a teacher grades them, so "wrong" isn't well-defined
-- for them the way it is for auto-marked types.
-- ══════════════════════════════════════════════════════════════

alter table tasks add column if not exists source_kind text not null default 'standard'
    check (source_kind in ('standard', 'retry_manual', 'retry_auto'));
alter table tasks add column if not exists parent_task_id uuid references tasks(id) on delete set null;
create index if not exists tasks_parent_idx on tasks (parent_task_id);

-- Build a retry task from one of the caller's own submitted attempts.
-- Returns the new task's id.
create or replace function create_retry_task(p_source_attempt_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
    v_uid     uuid := auth.uid();
    v_attempt task_attempts%rowtype;
    v_source  tasks%rowtype;
    v_new_id  uuid;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select * into v_attempt from task_attempts
    where id = p_source_attempt_id and student_id = v_uid and status = 'submitted';
    if not found then raise exception 'Attempt not found'; end if;

    select * into v_source from tasks where id = v_attempt.task_id;

    if not exists (
        select 1 from task_answers a
        join task_questions q on q.id = a.task_question_id
        where a.attempt_id = p_source_attempt_id
          and q.qtype in ('mcq', 'tf', 'fib')
          and a.is_correct = false
    ) then
        raise exception 'No auto-marked wrong answers to retry from this attempt';
    end if;

    insert into tasks (
        teacher_id, class_id, title, instructions, status, due_at, late_policy,
        attempts_allowed, attempt_scoring, timer_on_leave, time_limit_minutes,
        marking_mode, source_kind, parent_task_id, published_at
    ) values (
        v_source.teacher_id, v_source.class_id,
        'Retry: ' || v_source.title,
        'Auto-generated from your wrong answers on "' || v_source.title || '".',
        'published', now() + interval '7 days', 'accept_late',
        null, 'best', 'paused', null,
        'manual', 'retry_manual', v_source.id, now()
    ) returning id into v_new_id;

    with wrong_qs as (
        select q.question_key, q.page_id, q.source, q.qtype, q.marks, q.snapshot, q.answer_key, q.q_order
        from task_answers a
        join task_questions q on q.id = a.task_question_id
        where a.attempt_id = p_source_attempt_id
          and q.qtype in ('mcq', 'tf', 'fib')
          and a.is_correct = false
        order by q.q_order
        limit 10
    )
    insert into task_questions (task_id, q_order, question_key, page_id, source, qtype, marks, snapshot, answer_key)
    select v_new_id, row_number() over (order by q_order) - 1,
           question_key, page_id, source, qtype, marks, snapshot, answer_key
    from wrong_qs;

    insert into task_assignments (task_id, student_id) values (v_new_id, v_uid);

    return v_new_id;
end;
$$;
grant execute on function create_retry_task(uuid) to authenticated;
