-- ══════════════════════════════════════════════════════════════
-- CROSS-TASK WEAK-TOPIC ANALYTICS — run AFTER tasks-schema.sql, in
-- the Supabase SQL editor. Safe to re-run.
--
-- The existing per-task analytics (teacher-tasks.html) only ever
-- looks at ONE task at a time. These two functions aggregate a
-- student's (or a whole class's) submitted answers ACROSS every
-- task, grouped by topic (page_id) and question type, so a teacher
-- can see which topics a class is weak on overall, and a student
-- can see the same for themselves.
--
-- correct_rate is only meaningful for auto-markable types (mcq/tf/
-- fib, where task_answers.is_correct is set); avg_marks_pct works
-- for every type once marked (auto or by a teacher). The caller
-- picks whichever is non-null.
-- ══════════════════════════════════════════════════════════════

-- Teacher: weak-topic breakdown for one of their own classes.
create or replace function get_class_topic_performance(p_class_id uuid)
returns table (page_id text, qtype text, attempts int, correct_rate numeric, avg_marks_pct numeric)
language sql security definer stable set search_path = public as $$
    select q.page_id, q.qtype,
           count(a.*)::int as attempts,
           avg(case when q.qtype in ('mcq', 'tf', 'fib') and a.is_correct is not null
                    then (a.is_correct)::int end) as correct_rate,
           avg(case when q.marks > 0 and a.awarded is not null
                    then a.awarded / q.marks end) as avg_marks_pct
    from task_answers a
    join task_questions q on q.id = a.task_question_id
    join task_attempts att on att.id = a.attempt_id
    join tasks t on t.id = att.task_id
    where t.class_id = p_class_id
      and t.teacher_id = auth.uid()
      and att.status = 'submitted'
    group by q.page_id, q.qtype
    having count(a.*) > 0;
$$;
grant execute on function get_class_topic_performance(uuid) to authenticated;

-- Student: the same breakdown for their own submitted answers only.
create or replace function get_my_topic_performance()
returns table (page_id text, qtype text, attempts int, correct_rate numeric, avg_marks_pct numeric)
language sql security definer stable set search_path = public as $$
    select q.page_id, q.qtype,
           count(a.*)::int as attempts,
           avg(case when q.qtype in ('mcq', 'tf', 'fib') and a.is_correct is not null
                    then (a.is_correct)::int end) as correct_rate,
           avg(case when q.marks > 0 and a.awarded is not null
                    then a.awarded / q.marks end) as avg_marks_pct
    from task_answers a
    join task_questions q on q.id = a.task_question_id
    join task_attempts att on att.id = a.attempt_id
    where att.student_id = auth.uid()
      and att.status = 'submitted'
    group by q.page_id, q.qtype
    having count(a.*) > 0;
$$;
grant execute on function get_my_topic_performance() to authenticated;
