-- ══════════════════════════════════════════════════════════════
-- TASKS / ASSIGNMENTS SCHEMA — run AFTER schema.sql, in full, in
-- the Supabase SQL editor. Safe to re-run.
--
-- Adds teacher-created question tasks: drafts, publishing, per-
-- student overrides (deadline extensions / extra time), attempts,
-- autosaved answers with per-question timing, auto-marking of
-- MCQ / True-False, a manual marking queue (structured so an AI
-- marker can slot in later — see task_answers.marked_by), and an
-- anonymised leaderboard.
--
-- Design notes:
--  · Each task stores a full SNAPSHOT of its questions
--    (task_questions.snapshot) plus a separate ANSWER KEY column
--    (task_questions.answer_key). Students can never select the
--    answer_key column: they read questions through the
--    get_my_task_questions() function, and keys are only revealed
--    by get_task_answer_keys() once revealing them is allowed.
--  · All student writes (start / save / submit) go through
--    SECURITY DEFINER functions which re-check deadlines, attempt
--    limits and ownership server-side, so none of those rules rely
--    on client-side code.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · TABLES
-- ══════════════════════════════════════════════════════════════

create table if not exists tasks (
    id                 uuid primary key default gen_random_uuid(),
    teacher_id         uuid not null references profiles(id) on delete cascade,
    class_id           uuid not null references classes(id) on delete cascade,
    title              text not null,
    instructions       text not null default '',
    status             text not null default 'draft' check (status in ('draft', 'published')),
    due_at             timestamptz,
    -- 'accept_late': submissions after the deadline are allowed but flagged late.
    -- 'lock': the task locks at the deadline; answers become viewable.
    late_policy        text not null default 'accept_late' check (late_policy in ('accept_late', 'lock')),
    attempts_allowed   int check (attempts_allowed is null or attempts_allowed between 1 and 10), -- null = unlimited
    attempt_scoring    text not null default 'best' check (attempt_scoring in ('best', 'latest', 'first')),
    -- Whether the countdown keeps running while the student is away mid-attempt.
    timer_on_leave     text not null default 'paused' check (timer_on_leave in ('running', 'paused')),
    time_limit_minutes int check (time_limit_minutes is null or time_limit_minutes between 1 and 600), -- null = untimed
    -- 'manual' today; 'ai' is the reserved coming-soon mode. Mark schemes are
    -- already stored per question, and task_answers.marked_by distinguishes
    -- the marking source, so switching this on later needs no schema change.
    marking_mode       text not null default 'manual' check (marking_mode in ('manual', 'ai')),
    -- Wizard state (selection modes/counts per section) so a draft reopens
    -- exactly where the teacher left off. Never read by students.
    builder_state      jsonb,
    created_at         timestamptz not null default now(),
    published_at       timestamptz,
    updated_at         timestamptz not null default now(),
    constraint published_needs_due_date check (status <> 'published' or due_at is not null)
);
create index if not exists tasks_class_idx   on tasks (class_id);
create index if not exists tasks_teacher_idx on tasks (teacher_id);

create table if not exists task_questions (
    id           uuid primary key default gen_random_uuid(),
    task_id      uuid not null references tasks(id) on delete cascade,
    q_order      int  not null default 0, -- display order (named to dodge the reserved word `position`)
    question_key text not null,           -- stable id from question-bank.js
    page_id      text not null,           -- topic page the question came from
    source       text not null,           -- 'exam' | 'mcq' | 'tf' | 'learn' | 'misc' | 'tips' | 'fib' | 'match'
    qtype        text not null check (qtype in ('mcq', 'tf', 'written', 'fib')),
    marks        numeric not null default 1 check (marks > 0),
    snapshot     jsonb not null,          -- student-visible: question, options, case study…
    answer_key   jsonb not null default '{}'::jsonb -- correct answer, mark scheme, model answer
);
create index if not exists task_questions_task_idx on task_questions (task_id, q_order);

create table if not exists task_assignments (
    task_id            uuid not null references tasks(id) on delete cascade,
    student_id         uuid not null references profiles(id) on delete cascade,
    due_override       timestamptz,               -- per-student deadline extension
    extra_time_minutes int not null default 0 check (extra_time_minutes >= 0), -- SEN / extra-time accommodation
    assigned_at        timestamptz not null default now(),
    primary key (task_id, student_id)
);
create index if not exists task_assignments_student_idx on task_assignments (student_id);

create table if not exists task_attempts (
    id                 uuid primary key default gen_random_uuid(),
    task_id            uuid not null references tasks(id) on delete cascade,
    student_id         uuid not null references profiles(id) on delete cascade,
    attempt_number     int  not null,
    status             text not null default 'in_progress' check (status in ('in_progress', 'submitted')),
    started_at         timestamptz not null default now(),
    submitted_at       timestamptz,
    is_late            boolean not null default false,
    time_spent_seconds int not null default 0,
    marks_awarded      numeric,           -- running total once marked (auto + manual)
    marks_total        numeric,           -- fixed at submit: sum of question marks
    marking_complete   boolean not null default false,
    unique (task_id, student_id, attempt_number)
);
create index if not exists task_attempts_task_idx    on task_attempts (task_id, student_id);
create index if not exists task_attempts_student_idx on task_attempts (student_id);

create table if not exists task_answers (
    id                 uuid primary key default gen_random_uuid(),
    attempt_id         uuid not null references task_attempts(id) on delete cascade,
    task_question_id   uuid not null references task_questions(id) on delete cascade,
    answer             jsonb,             -- {"value": <index|bool|text>}
    time_spent_seconds int not null default 0,
    is_correct         boolean,           -- auto-markable questions only
    awarded            numeric,           -- marks given (auto or manual); null = awaiting marking
    feedback           text,
    -- Marking source. 'ai' is reserved for the future AI marker: it writes the
    -- same columns as a teacher, so the two are interchangeable downstream.
    marked_by          text check (marked_by in ('auto', 'teacher', 'ai')),
    marker_id          uuid references profiles(id) on delete set null,
    marked_at          timestamptz,
    updated_at         timestamptz not null default now(),
    unique (attempt_id, task_question_id)
);
create index if not exists task_answers_attempt_idx  on task_answers (attempt_id);
create index if not exists task_answers_question_idx on task_answers (task_question_id);

-- Student notification read-state. Notifications themselves are derived
-- (assigned / due soon / marked / overdue) from the tables above; this only
-- remembers which ones a student has dismissed, so it works across devices.
create table if not exists task_notification_reads (
    student_id uuid not null references profiles(id) on delete cascade,
    note_key   text not null,             -- e.g. 'assigned:<task_id>', 'marked:<attempt_id>'
    read_at    timestamptz not null default now(),
    primary key (student_id, note_key)
);

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · HELPER FUNCTIONS (security definer — see schema.sql
-- for why these bypass RLS while staying per-caller correct)
-- ══════════════════════════════════════════════════════════════

-- Does the current user (a teacher) own this task?
create or replace function owns_task(p_task_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (select 1 from tasks where id = p_task_id and teacher_id = auth.uid());
$$;

-- Is the current user (a student) assigned to this published task?
create or replace function is_assigned_task(p_task_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (
        select 1 from task_assignments a
        join tasks t on t.id = a.task_id
        where a.task_id = p_task_id and a.student_id = auth.uid() and t.status = 'published'
    );
$$;

grant execute on function owns_task(uuid)        to authenticated;
grant execute on function is_assigned_task(uuid) to authenticated;

-- The deadline that applies to one student: their override, else the task due date.
create or replace function task_effective_due(p_task_id uuid, p_student_id uuid) returns timestamptz
language sql security definer stable set search_path = public as $$
    select coalesce(a.due_override, t.due_at)
    from tasks t
    left join task_assignments a on a.task_id = t.id and a.student_id = p_student_id
    where t.id = p_task_id;
$$;
-- INTERNAL ONLY (WP-A7 security audit): this answers for an ARBITRARY
-- p_student_id (unlike auth.uid()-scoped helpers), so a direct client call could
-- read another student's per-student due_override (an SEN/extra-time signal).
-- It is only ever called by the SECURITY DEFINER functions below (start / save /
-- submit / answer-keys), which invoke it as the function owner and so don't need
-- this grant. Revoked from all client roles, mirroring has_subject_access() in
-- entitlements.sql.
revoke execute on function task_effective_due(uuid, uuid) from public;
revoke execute on function task_effective_due(uuid, uuid) from anon;
revoke execute on function task_effective_due(uuid, uuid) from authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · QUESTION-FREEZE TRIGGER
-- Once any student has started an attempt, a task's questions can
-- no longer be added, changed or removed (in-progress attempts
-- reference them). Enforced in the database, not just the UI.
-- ══════════════════════════════════════════════════════════════

create or replace function _block_question_change_after_start() returns trigger
language plpgsql security definer set search_path = public as $$
declare
    v_task uuid := coalesce(new.task_id, old.task_id);
begin
    if exists (select 1 from task_attempts where task_id = v_task) then
        raise exception 'Questions cannot be changed once a student has started this task';
    end if;
    if tg_op = 'DELETE' then return old; end if;
    return new;
end;
$$;

drop trigger if exists task_questions_freeze on task_questions;
create trigger task_questions_freeze
    before insert or update or delete on task_questions
    for each row execute function _block_question_change_after_start();

-- Keep tasks.updated_at fresh.
create or replace function _touch_task_updated_at() returns trigger
language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end;
$$;
drop trigger if exists tasks_touch_updated on tasks;
create trigger tasks_touch_updated before update on tasks
    for each row execute function _touch_task_updated_at();

-- ══════════════════════════════════════════════════════════════
-- SECTION 4 · ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

alter table tasks                   enable row level security;
alter table task_questions          enable row level security;
alter table task_assignments        enable row level security;
alter table task_attempts           enable row level security;
alter table task_answers            enable row level security;
alter table task_notification_reads enable row level security;

-- ── tasks ──
drop policy if exists "tasks_teacher_all" on tasks;
create policy "tasks_teacher_all" on tasks
    for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- Students see published tasks they are assigned to (drafts stay invisible).
drop policy if exists "tasks_student_select" on tasks;
create policy "tasks_student_select" on tasks
    for select using (status = 'published' and is_assigned_task(tasks.id));

-- ── task_questions ──
-- Teachers only. Students NEVER select this table directly (the answer_key
-- column lives here); they use get_my_task_questions() below.
drop policy if exists "task_questions_teacher_all" on task_questions;
create policy "task_questions_teacher_all" on task_questions
    for all using (owns_task(task_questions.task_id))
    with check (owns_task(task_questions.task_id));

-- ── task_assignments ──
drop policy if exists "task_assignments_teacher_all" on task_assignments;
create policy "task_assignments_teacher_all" on task_assignments
    for all using (owns_task(task_assignments.task_id))
    with check (owns_task(task_assignments.task_id));

drop policy if exists "task_assignments_self_select" on task_assignments;
create policy "task_assignments_self_select" on task_assignments
    for select using (student_id = auth.uid());

-- ── task_attempts ──
-- Read-only from the client; rows are created/updated only by the
-- start/save/submit/mark functions below.
drop policy if exists "task_attempts_teacher_select" on task_attempts;
create policy "task_attempts_teacher_select" on task_attempts
    for select using (owns_task(task_attempts.task_id));

drop policy if exists "task_attempts_self_select" on task_attempts;
create policy "task_attempts_self_select" on task_attempts
    for select using (student_id = auth.uid());

-- ── task_answers ──
drop policy if exists "task_answers_teacher_select" on task_answers;
create policy "task_answers_teacher_select" on task_answers
    for select using (exists (
        select 1 from task_attempts att
        where att.id = task_answers.attempt_id and owns_task(att.task_id)
    ));

drop policy if exists "task_answers_self_select" on task_answers;
create policy "task_answers_self_select" on task_answers
    for select using (exists (
        select 1 from task_attempts att
        where att.id = task_answers.attempt_id and att.student_id = auth.uid()
    ));

-- ── task_notification_reads ──
drop policy if exists "notification_reads_self_all" on task_notification_reads;
create policy "notification_reads_self_all" on task_notification_reads
    for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ══════════════════════════════════════════════════════════════
-- SECTION 5 · STUDENT-FACING FUNCTIONS
-- ══════════════════════════════════════════════════════════════

-- Questions for one of my assigned, published tasks — WITHOUT answer keys.
create or replace function get_my_task_questions(p_task_id uuid)
returns table (id uuid, q_order int, page_id text, source text, qtype text, marks numeric, snapshot jsonb)
language sql security definer stable set search_path = public as $$
    select q.id, q.q_order, q.page_id, q.source, q.qtype, q.marks, q.snapshot
    from task_questions q
    where q.task_id = p_task_id
      and (is_assigned_task(p_task_id) or owns_task(p_task_id))
    order by q.q_order;
$$;
grant execute on function get_my_task_questions(uuid) to authenticated;

-- Start (or resume) an attempt. Enforces: published+assigned, the lock
-- deadline, and the attempt limit. Returns the attempt row as json.
create or replace function start_task_attempt(p_task_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid       uuid := auth.uid();
    v_task      tasks%rowtype;
    v_attempt   task_attempts%rowtype;
    v_due       timestamptz;
    v_submitted int;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select * into v_task from tasks where id = p_task_id;
    if not found or v_task.status <> 'published' then
        raise exception 'Task not available';
    end if;
    if not exists (select 1 from task_assignments where task_id = p_task_id and student_id = v_uid) then
        raise exception 'You are not assigned to this task';
    end if;

    -- Resume an unfinished attempt if there is one.
    select * into v_attempt from task_attempts
    where task_id = p_task_id and student_id = v_uid and status = 'in_progress'
    order by attempt_number desc limit 1;
    if found then return to_jsonb(v_attempt); end if;

    v_due := task_effective_due(p_task_id, v_uid);
    if v_task.late_policy = 'lock' and v_due is not null and now() > v_due then
        raise exception 'This task locked at the deadline';
    end if;

    select count(*) into v_submitted from task_attempts
    where task_id = p_task_id and student_id = v_uid and status = 'submitted';
    if v_task.attempts_allowed is not null and v_submitted >= v_task.attempts_allowed then
        raise exception 'No attempts remaining';
    end if;

    insert into task_attempts (task_id, student_id, attempt_number)
    values (p_task_id, v_uid,
            (select coalesce(max(attempt_number), 0) + 1 from task_attempts
             where task_id = p_task_id and student_id = v_uid))
    returning * into v_attempt;
    return to_jsonb(v_attempt);
end;
$$;
grant execute on function start_task_attempt(uuid) to authenticated;

-- Autosave one answer (upsert). p_time_spent_seconds is the cumulative time
-- on that question for this attempt. 60s grace after a hard lock so an
-- in-flight save at the deadline isn't lost.
create or replace function save_task_answer(
    p_attempt_id uuid, p_task_question_id uuid, p_answer jsonb, p_time_spent_seconds int
) returns void
language plpgsql security definer set search_path = public as $$
declare
    v_uid     uuid := auth.uid();
    v_attempt task_attempts%rowtype;
    v_task    tasks%rowtype;
    v_due     timestamptz;
begin
    select * into v_attempt from task_attempts where id = p_attempt_id and student_id = v_uid;
    if not found then raise exception 'Attempt not found'; end if;
    if v_attempt.status <> 'in_progress' then raise exception 'Attempt already submitted'; end if;

    if not exists (select 1 from task_questions
                   where id = p_task_question_id and task_id = v_attempt.task_id) then
        raise exception 'Question does not belong to this task';
    end if;

    select * into v_task from tasks where id = v_attempt.task_id;
    v_due := task_effective_due(v_attempt.task_id, v_uid);
    if v_task.late_policy = 'lock' and v_due is not null and now() > v_due + interval '60 seconds' then
        raise exception 'This task locked at the deadline';
    end if;

    insert into task_answers (attempt_id, task_question_id, answer, time_spent_seconds, updated_at)
    values (p_attempt_id, p_task_question_id, p_answer, greatest(coalesce(p_time_spent_seconds, 0), 0), now())
    on conflict (attempt_id, task_question_id) do update
        set answer = excluded.answer,
            time_spent_seconds = greatest(task_answers.time_spent_seconds, excluded.time_spent_seconds),
            updated_at = now();
end;
$$;
grant execute on function save_task_answer(uuid, uuid, jsonb, int) to authenticated;

-- Submit an attempt: auto-marks MCQ / True-False against the stored answer
-- key, creates blank rows for unanswered questions (so they appear in the
-- marking queue and analytics), computes the late flag and the totals.
create or replace function submit_task_attempt(p_attempt_id uuid, p_time_spent_seconds int default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid     uuid := auth.uid();
    v_attempt task_attempts%rowtype;
    v_task    tasks%rowtype;
    v_due     timestamptz;
    v_late    boolean := false;
begin
    select * into v_attempt from task_attempts where id = p_attempt_id and student_id = v_uid;
    if not found then raise exception 'Attempt not found'; end if;
    if v_attempt.status <> 'in_progress' then raise exception 'Attempt already submitted'; end if;

    select * into v_task from tasks where id = v_attempt.task_id;
    v_due := task_effective_due(v_attempt.task_id, v_uid);
    if v_due is not null and now() > v_due then
        if v_task.late_policy = 'lock' then
            if now() > v_due + interval '60 seconds' then
                raise exception 'This task locked at the deadline';
            end if;
            -- inside the grace window: counts as on time
        else
            v_late := true;
        end if;
    end if;

    -- Blank rows for anything unanswered.
    insert into task_answers (attempt_id, task_question_id, answer)
    select p_attempt_id, q.id, null
    from task_questions q
    where q.task_id = v_attempt.task_id
      and not exists (select 1 from task_answers a
                      where a.attempt_id = p_attempt_id and a.task_question_id = q.id);

    -- Auto-mark MCQ (answer index), True/False (boolean), and
    -- fill-in-the-blanks (one mark per blank, case/space-insensitive).
    -- Stored answers: {"value": <index|bool>} or {"value": {"B1": "word", …}}.
    update task_answers a
    set is_correct = case
            when q.qtype in ('mcq', 'tf') then
                a.answer is not null and (a.answer->>'value') = (q.answer_key->>'answer')
            when q.qtype = 'fib' then
                a.answer is not null and not exists (
                    select 1 from jsonb_each_text(q.answer_key->'blanks') kb
                    where lower(btrim(coalesce(a.answer->'value'->>kb.key, '')))
                          <> lower(btrim(kb.value)))
            end,
        awarded    = case
            when q.qtype in ('mcq', 'tf') then
                case when a.answer is not null
                          and (a.answer->>'value') = (q.answer_key->>'answer')
                     then q.marks else 0 end
            when q.qtype = 'fib' then coalesce((
                select round(q.marks
                             * (count(*) filter (where lower(btrim(coalesce(a.answer->'value'->>kb.key, '')))
                                                       = lower(btrim(kb.value))))
                             / greatest(count(*), 1), 2)
                from jsonb_each_text(q.answer_key->'blanks') kb), 0)
            end,
        marked_by  = 'auto',
        marked_at  = now(),
        updated_at = now()
    from task_questions q
    where a.attempt_id = p_attempt_id
      and q.id = a.task_question_id
      and q.qtype in ('mcq', 'tf', 'fib');

    update task_attempts att
    set status             = 'submitted',
        submitted_at       = now(),
        is_late            = v_late,
        time_spent_seconds = coalesce(p_time_spent_seconds,
                                      (select sum(time_spent_seconds) from task_answers where attempt_id = att.id),
                                      0),
        marks_total        = (select coalesce(sum(marks), 0) from task_questions where task_id = att.task_id),
        marks_awarded      = (select coalesce(sum(awarded), 0) from task_answers where attempt_id = att.id),
        marking_complete   = not exists (select 1 from task_answers
                                         where attempt_id = att.id and awarded is null)
    where att.id = p_attempt_id;

    select * into v_attempt from task_attempts where id = p_attempt_id;
    return to_jsonb(v_attempt);
end;
$$;
grant execute on function submit_task_attempt(uuid, int) to authenticated;

-- Answer keys (correct answers, mark schemes, model answers).
-- Teachers: always. Students: only once they can no longer submit for marks —
-- attempts exhausted, or the deadline has passed on a hard-lock task.
create or replace function get_task_answer_keys(p_task_id uuid)
returns table (task_question_id uuid, answer_key jsonb)
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid       uuid := auth.uid();
    v_task      tasks%rowtype;
    v_due       timestamptz;
    v_submitted int;
    v_allowed   boolean := false;
begin
    if owns_task(p_task_id) then
        v_allowed := true;
    elsif is_assigned_task(p_task_id) then
        select * into v_task from tasks where id = p_task_id;
        v_due := task_effective_due(p_task_id, v_uid);
        select count(*) into v_submitted from task_attempts
        where task_id = p_task_id and student_id = v_uid and status = 'submitted';

        if v_task.attempts_allowed is not null and v_submitted >= v_task.attempts_allowed then
            v_allowed := true;   -- no attempts left
        elsif v_task.late_policy = 'lock' and v_due is not null and now() > v_due then
            v_allowed := true;   -- task locked at deadline
        end if;
    end if;

    if not v_allowed then
        raise exception 'Answers are not available yet';
    end if;

    return query select q.id, q.answer_key from task_questions q where q.task_id = p_task_id;
end;
$$;
grant execute on function get_task_answer_keys(uuid) to authenticated;

-- Anonymised leaderboard for a task. Each student's counted attempt (per the
-- task's attempt_scoring) is ranked by percentage; only fully-marked attempts
-- appear. Callers see which row is theirs; nobody sees anyone else's name.
create or replace function get_task_leaderboard(p_task_id uuid)
returns table (rank bigint, pct numeric, is_late boolean, is_me boolean)
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid uuid := auth.uid();
begin
    if not (owns_task(p_task_id) or is_assigned_task(p_task_id)) then
        raise exception 'Not allowed';
    end if;

    return query
    with marked as (
        select att.*, (att.marks_awarded / nullif(att.marks_total, 0)) as score_pct
        from task_attempts att
        where att.task_id = p_task_id and att.status = 'submitted' and att.marking_complete
    ),
    counted as (
        select distinct on (m.student_id) m.student_id, m.score_pct, m.is_late as late_flag
        from marked m
        join tasks t on t.id = m.task_id
        order by m.student_id,
            case when t.attempt_scoring = 'best'   then -coalesce(m.score_pct, 0) end,
            case when t.attempt_scoring = 'latest' then -m.attempt_number end,
            case when t.attempt_scoring = 'first'  then m.attempt_number end
    )
    select rank() over (order by c.score_pct desc nulls last),
           round(coalesce(c.score_pct, 0) * 100, 1),
           c.late_flag,
           c.student_id = v_uid
    from counted c
    order by 1, 4 desc;
end;
$$;
grant execute on function get_task_leaderboard(uuid) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 6 · TEACHER MARKING
-- ══════════════════════════════════════════════════════════════

-- Record a mark + feedback for one answer, then refresh the attempt's
-- totals and completion flag. (An AI marker would call the same logic with
-- marked_by = 'ai'; the p_source parameter is validated to those two.)
create or replace function mark_task_answer(
    p_answer_id uuid, p_awarded numeric, p_feedback text default null, p_source text default 'teacher'
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid      uuid := auth.uid();
    v_answer   task_answers%rowtype;
    v_attempt  task_attempts%rowtype;
    v_qmarks   numeric;
begin
    if p_source not in ('teacher', 'ai') then raise exception 'Invalid marking source'; end if;

    select a.* into v_answer from task_answers a
    join task_attempts att on att.id = a.attempt_id
    where a.id = p_answer_id and owns_task(att.task_id);
    if not found then raise exception 'Answer not found'; end if;

    select marks into v_qmarks from task_questions where id = v_answer.task_question_id;
    if p_awarded is null or p_awarded < 0 or p_awarded > v_qmarks then
        raise exception 'Awarded marks must be between 0 and %', v_qmarks;
    end if;

    update task_answers
    set awarded = p_awarded,
        feedback = coalesce(p_feedback, feedback),
        marked_by = p_source,
        marker_id = v_uid,
        marked_at = now(),
        updated_at = now()
    where id = p_answer_id;

    update task_attempts att
    set marks_awarded    = (select coalesce(sum(awarded), 0) from task_answers where attempt_id = att.id),
        marking_complete = not exists (select 1 from task_answers
                                       where attempt_id = att.id and awarded is null)
    where att.id = v_answer.attempt_id
    returning * into v_attempt;

    return to_jsonb(v_attempt);
end;
$$;
grant execute on function mark_task_answer(uuid, numeric, text, text) to authenticated;
