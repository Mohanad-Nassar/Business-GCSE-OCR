-- ══════════════════════════════════════════════════════════════
-- Schema for the GCSE Business site's accounts / classes / progress
-- backend (Supabase). Run this once, in full, in the Supabase SQL
-- editor for a fresh project. Safe to re-run.
--
-- Structure: ALL tables are created first, THEN all row-level-security
-- policies and functions. This ordering matters — several policies
-- reference other tables (e.g. the profiles policy references
-- class_students), so every table must already exist before any policy
-- that names it is created.
-- ══════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · TABLES
-- ══════════════════════════════════════════════════════════════

-- One row per auth.users row. Created by the Netlify Functions
-- (using the service-role key) at signup time, never by the client.
create table if not exists profiles (
    id         uuid primary key references auth.users(id) on delete cascade,
    role       text not null check (role in ('teacher', 'student')),
    username   text unique,
    created_at timestamptz not null default now()
);

create table if not exists classes (
    id         uuid primary key default gen_random_uuid(),
    name       text not null,
    teacher_id uuid not null references profiles(id) on delete cascade,
    archived   boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists class_students (
    class_id   uuid not null references classes(id) on delete cascade,
    student_id uuid not null references profiles(id) on delete cascade,
    joined_at  timestamptz not null default now(),
    primary key (class_id, student_id)
);

-- Append-only answer log: one row per answer, never overwritten.
-- This is what gives you "which question, what answer, and when".
create table if not exists progress_events (
    id          bigserial primary key,
    student_id  uuid not null references profiles(id) on delete cascade,
    page_id     text not null,
    section     text not null,
    question_id text,
    answer      jsonb,
    is_correct  boolean,
    answered_at timestamptz not null default now()
);

create index if not exists progress_events_student_page_section_idx
    on progress_events (student_id, page_id, section);
create index if not exists progress_events_student_time_idx
    on progress_events (student_id, answered_at desc);

-- Small per-section rollup so dashboards don't aggregate the full log.
create table if not exists progress_summary (
    student_id uuid not null references profiles(id) on delete cascade,
    page_id    text not null,
    section    text not null,
    done       int not null default 0,
    total      int not null default 0,
    updated_at timestamptz not null default now(),
    primary key (student_id, page_id, section)
);

-- The shared code(s) that gate teacher signup; you seed this yourself.
create table if not exists teacher_invite_codes (
    code       text primary key,
    note       text,
    created_at timestamptz not null default now()
);

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · RLS HELPER FUNCTIONS
-- ══════════════════════════════════════════════════════════════
-- These are SECURITY DEFINER, which means their bodies run with the
-- function owner's privileges and therefore BYPASS row-level security
-- on the tables they read. That is exactly what breaks the otherwise
-- infinite recursion you get when a policy on `classes` reads
-- `class_students`, whose own policy reads `classes`, and so on.
-- They still call auth.uid(), which returns the *caller's* id from the
-- JWT, so the access checks stay correct and per-user.

-- Does the current user own this class?
create or replace function is_class_owner(p_class_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (
        select 1 from classes where id = p_class_id and teacher_id = auth.uid()
    );
$$;

-- Is the current user a student member of this class?
create or replace function is_member_of_class(p_class_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (
        select 1 from class_students where class_id = p_class_id and student_id = auth.uid()
    );
$$;

-- Does the current user (a teacher) have this student in one of their classes?
create or replace function teaches_student(p_student_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (
        select 1 from class_students cs
        join classes c on c.id = cs.class_id
        where cs.student_id = p_student_id and c.teacher_id = auth.uid()
    );
$$;

grant execute on function is_class_owner(uuid)     to authenticated;
grant execute on function is_member_of_class(uuid) to authenticated;
grant execute on function teaches_student(uuid)    to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

alter table profiles             enable row level security;
alter table classes              enable row level security;
alter table class_students       enable row level security;
alter table progress_events      enable row level security;
alter table progress_summary     enable row level security;
alter table teacher_invite_codes enable row level security;

-- ── profiles ──
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
    for select using (id = auth.uid());

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
    for update using (id = auth.uid());

drop policy if exists "profiles_select_teacher_of_student" on profiles;
create policy "profiles_select_teacher_of_student" on profiles
    for select using (teaches_student(profiles.id));

-- ── classes ──
drop policy if exists "classes_teacher_all" on classes;
create policy "classes_teacher_all" on classes
    for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists "classes_student_select" on classes;
create policy "classes_student_select" on classes
    for select using (is_member_of_class(classes.id));

-- ── class_students ──
drop policy if exists "class_students_teacher_all" on class_students;
create policy "class_students_teacher_all" on class_students
    for all using (is_class_owner(class_students.class_id))
    with check (is_class_owner(class_students.class_id));

drop policy if exists "class_students_self_select" on class_students;
create policy "class_students_self_select" on class_students
    for select using (student_id = auth.uid());

-- ── progress_events ──
-- No insert/update/delete policies: rows can only be written via the
-- record_progress() function below, which forces student_id = auth.uid().
drop policy if exists "progress_events_self_select" on progress_events;
create policy "progress_events_self_select" on progress_events
    for select using (student_id = auth.uid());

drop policy if exists "progress_events_teacher_select" on progress_events;
create policy "progress_events_teacher_select" on progress_events
    for select using (teaches_student(progress_events.student_id));

-- ── progress_summary ──
drop policy if exists "progress_summary_self_select" on progress_summary;
create policy "progress_summary_self_select" on progress_summary
    for select using (student_id = auth.uid());

drop policy if exists "progress_summary_teacher_select" on progress_summary;
create policy "progress_summary_teacher_select" on progress_summary
    for select using (teaches_student(progress_summary.student_id));

-- ── teacher_invite_codes ──
-- RLS is enabled with NO policies on purpose: this table is never
-- readable from the browser, only from the teacher-signup Netlify
-- Function, which uses the service-role key (bypasses RLS entirely).
--
-- Seed your own invite code, e.g.:
--   insert into teacher_invite_codes (code, note) values ('choose-a-code-here', 'staff signup');

-- ══════════════════════════════════════════════════════════════
-- SECTION 4 · PROGRESS FUNCTIONS
-- ══════════════════════════════════════════════════════════════

-- record_progress(): the only way a student's answer gets written.
-- security definer means it runs with the privileges of the function
-- owner (bypassing RLS on the two inserts below), but it reads
-- auth.uid() from the caller's own JWT, so a student can never write
-- progress under someone else's id even if client code is tampered with.
create or replace function record_progress(
    p_page_id     text,
    p_section     text,
    p_question_id text,
    p_answer      jsonb,
    p_is_correct  boolean,
    p_done        int,
    p_total       int
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null then
        raise exception 'not authenticated';
    end if;

    insert into progress_events (student_id, page_id, section, question_id, answer, is_correct)
    values (v_uid, p_page_id, p_section, p_question_id, p_answer, p_is_correct);

    if p_done is not null and p_total is not null then
        insert into progress_summary (student_id, page_id, section, done, total, updated_at)
        values (v_uid, p_page_id, p_section, p_done, p_total, now())
        on conflict (student_id, page_id, section)
        do update set done = excluded.done, total = excluded.total, updated_at = now();
    end if;
end;
$$;

revoke all on function record_progress(text, text, text, jsonb, boolean, int, int) from public;
grant execute on function record_progress(text, text, text, jsonb, boolean, int, int) to authenticated;

-- reset_my_page_progress(): lets a student wipe their own server-side
-- progress for one page (mirrors the "reset page" button on dashboard.html,
-- which otherwise only clears localStorage and would be overridden the
-- next time server data merges back in).
create or replace function reset_my_page_progress(p_page_id text) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null then
        raise exception 'not authenticated';
    end if;

    delete from progress_events where student_id = v_uid and page_id = p_page_id;
    delete from progress_summary where student_id = v_uid and page_id = p_page_id;
end;
$$;

revoke all on function reset_my_page_progress(text) from public;
grant execute on function reset_my_page_progress(text) to authenticated;
