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

-- ── subjects ── (multi-subject platform)
-- One row per subject the platform offers. MUST exist (and be seeded)
-- before `classes`, because classes.subject_id references it and defaults
-- to the business row. Everything subject-scoped hangs off this table:
--   * classes.subject_id           — a class belongs to exactly one subject
--   * bank_questions.subject_slug  — question pool per subject
--   * page ids                     — every page_id is '<slug>:<topic-slug>'
--     so the subject is derivable via split_part(page_id, ':', 1)
-- exam_date drives get_daily_revise_queue()'s pacing (replaces the old
-- hardcoded date) and the Flight Path target band.
create table if not exists subjects (
    id         uuid primary key default gen_random_uuid(),
    slug       text not null unique,
    name       text not null,
    key_stage  text not null check (key_stage in ('ks3', 'ks4', 'ks5')),
    level      text,
    exam_board text,
    spec_code  text,
    exam_date  date,        -- null = no exam scheduled; readers fall back to a default
    colour     text,        -- per-subject accent, e.g. '#7a5c9e'
    icon       text,        -- emoji shown on subject cards/chips
    sort_order int  not null default 0,
    active     boolean not null default true,
    created_at timestamptz not null default now()
);

-- Idempotent seed — safe to re-run; the pipeline
-- (tools/build_question_bank.py --upload) upserts these same rows from each
-- subject manifest, so values here and in subjects/*/subject.json should agree.
-- CS/Economics exam dates are PROVISIONAL placeholders — correct them when
-- the real 2027 timetable lands.
insert into subjects (slug, name, key_stage, level, exam_board, spec_code, exam_date, colour, icon, sort_order)
values
    ('business',         'GCSE Business',         'ks4', 'GCSE', 'OCR', 'J204', '2027-05-12', '#7a5c9e', '💼', 1),
    ('computer-science', 'GCSE Computer Science', 'ks4', 'GCSE', 'OCR', 'J277', '2027-05-17', '#1a6b6b', '💻', 2),
    ('economics',        'GCSE Economics',        'ks4', 'GCSE', 'OCR', 'J205', '2027-05-19', '#2d7a4f', '📈', 3)
on conflict (slug) do update set
    name       = excluded.name,
    key_stage  = excluded.key_stage,
    level      = excluded.level,
    exam_board = excluded.exam_board,
    spec_code  = excluded.spec_code,
    exam_date  = excluded.exam_date,
    colour     = excluded.colour,
    icon       = excluded.icon,
    sort_order = excluded.sort_order;

-- Server-side default subject for new classes: the teacher dashboard's
-- class-creation insert doesn't send subject_id yet (no subject picker in
-- the UI), so the column default looks up the business row. Once the UI
-- gains a picker it simply supplies subject_id explicitly and this default
-- stops mattering.
create or replace function default_subject_id() returns uuid
language sql stable set search_path = public as $$
    select id from subjects where slug = 'business';
$$;

create table if not exists classes (
    id         uuid primary key default gen_random_uuid(),
    name       text not null,
    teacher_id uuid not null references profiles(id) on delete cascade,
    subject_id uuid not null default default_subject_id() references subjects(id),
    archived   boolean not null default false,
    created_at timestamptz not null default now()
);
-- Retrofit guard for a database created before subjects existed (a fresh
-- project gets the column from the create table above; this is a no-op there).
alter table classes add column if not exists subject_id uuid not null
    default default_subject_id() references subjects(id);

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

-- The caller's class FOR A GIVEN SUBJECT (null = any subject, which
-- reproduces the old single-subject "earliest-joined class" behaviour).
-- Every student-facing RPC that used to grab `order by cs.joined_at limit 1`
-- now resolves its class through this instead, so a student enrolled in
-- several subjects (one class each, by convention) gets the right class for
-- the subject at hand. joined_at stays as the tiebreak within a subject.
create or replace function my_class_for_subject(p_subject text) returns uuid
language sql security definer stable set search_path = public as $$
    select c.id
    from class_students cs
    join classes  c on c.id = cs.class_id
    join subjects s on s.id = c.subject_id
    where cs.student_id = auth.uid()
      and (p_subject is null or s.slug = p_subject)
    order by cs.joined_at asc
    limit 1;
$$;

grant execute on function is_class_owner(uuid)       to authenticated;
grant execute on function is_member_of_class(uuid)   to authenticated;
grant execute on function teaches_student(uuid)      to authenticated;
grant execute on function my_class_for_subject(text) to authenticated;
grant execute on function default_subject_id()       to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

alter table profiles             enable row level security;
alter table subjects             enable row level security;
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

-- ── subjects ──
-- Read-all: the subject catalogue (names, colours, exam dates) is not a
-- secret — every signed-in page needs it, and it contains nothing personal.
-- No insert/update/delete policies: rows come only from this seed or the
-- build pipeline (service role).
drop policy if exists "subjects_read_all" on subjects;
create policy "subjects_read_all" on subjects
    for select using (true);

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

-- ══════════════════════════════════════════════════════════════
-- SECTION 5 · SUBJECT ENROLLMENT
-- ══════════════════════════════════════════════════════════════

-- get_my_subjects(): the subjects the caller is enrolled in, derived from
-- their class memberships (class membership IS subject enrollment — there
-- is no separate enrollments table). The subjects hub uses this to show a
-- student only their own subjects. Teachers get the subjects of classes
-- they teach, via the same derivation on classes.teacher_id.
create or replace function get_my_subjects()
returns setof subjects
language sql security definer stable set search_path = public as $$
    select s.*
    from subjects s
    where s.active
      and (
        exists (
            select 1
            from class_students cs
            join classes c on c.id = cs.class_id
            where cs.student_id = auth.uid() and c.subject_id = s.id
        )
        or exists (
            select 1 from classes c
            where c.teacher_id = auth.uid() and c.subject_id = s.id
        )
      )
    order by s.sort_order, s.slug;
$$;
grant execute on function get_my_subjects() to authenticated;


-- ══════════════════════════════════════════════════════════════
-- AUTH V2 (WP-A1, 2026-07-11) — self-signup accounts via email /
-- Google / Microsoft (Supabase Auth providers). Safe to re-run.
--
-- Teacher-generated students are untouched: generate-students.js keeps
-- creating their profiles rows itself (service key), and the trigger
-- below deliberately skips their synthetic '@students.local' emails.
--
-- Owner prerequisites (Supabase dashboard):
--   Auth → Providers: enable Google + Azure (client ids/secrets from a
--   Google Cloud OAuth app and a Microsoft Entra app registration, both
--   with redirect https://<project-ref>.supabase.co/auth/v1/callback).
--   Auth → URL configuration: add the production domain and
--   http://localhost:8888 to the redirect allowlist.
-- ══════════════════════════════════════════════════════════════

alter table profiles
  add column if not exists account_type text not null default 'class_student'
    check (account_type in ('class_student', 'self_signup', 'teacher', 'owner')),
  add column if not exists email text,
  add column if not exists is_owner boolean not null default false;

-- Backfill: rows that predate these columns are teacher-generated students
-- or invite-code teachers; both are identifiable by role.
update profiles set account_type = 'teacher'
  where role = 'teacher' and account_type = 'class_student';

-- Auto-provision a profile for every NEW auth user that signed up itself
-- (email/password or OAuth). Generated students are skipped (their profile
-- is created by generate-students.js with a chosen username); a second
-- run for the same user is a no-op (on conflict do nothing).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  base_name text;
  candidate text;
  n int := 0;
begin
  if new.email is null or new.email like '%@students.local' then
    return new;
  end if;

  -- Display name from OAuth metadata / signup form, else the email's
  -- local part. Squashed to the site's username style: lowercase,
  -- letters/digits/hyphens only, max 24 chars.
  base_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1)
  );
  base_name := lower(regexp_replace(base_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_name := trim(both '-' from substr(base_name, 1, 24));
  if base_name = '' then base_name := 'student'; end if;

  -- Usernames are unique — suffix with a short random tag on collision.
  candidate := base_name;
  loop
    begin
      insert into profiles (id, role, username, account_type, email)
      values (new.id, 'student', candidate, 'self_signup', new.email)
      on conflict (id) do nothing;
      exit;
    exception when unique_violation then
      n := n + 1;
      if n > 5 then
        -- Give up on a pretty name; uuid tail is always unique.
        candidate := base_name || '-' || substr(replace(new.id::text, '-', ''), 1, 6);
      else
        candidate := base_name || '-' || substr(md5(random()::text), 1, 4);
      end if;
    end;
  end loop;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ══════════════════════════════════════════════════════════════
-- PROFILES PRIVILEGE-COLUMN GUARD (WP-A7 security audit) — safe to re-run.
--
-- profiles_update_own (above) lets a user update THEIR OWN profile row, which
-- is fine for a future "change my username" edit — BUT Postgres RLS is
-- row-level, not column-level. Without this guard an authenticated STUDENT
-- could `update profiles set role = 'teacher'` / `is_owner = true` /
-- `account_type = 'owner'` on their own row and silently self-escalate:
-- teacher/owner unlock EVERY subject's gated content and flip
-- edge_gate_check()'s allow_bank to true (entitlements.sql), which serves
-- question-bank.js — and that file embeds every correct answer inline. That is
-- exactly the crown-jewel leak bank_questions is designed to prevent, so the
-- escalation path must be closed at the source.
--
-- This BEFORE UPDATE trigger pins role / account_type / is_owner for any
-- JWT-authenticated caller (a real user always has a non-null auth.uid()).
-- Server-side provisioning — the signup Netlify Functions and the
-- handle_new_user() trigger use the service-role key, the SQL-editor backfills
-- above run as the table owner — all have a null auth.uid() and are
-- deliberately left untouched, so nothing legitimate breaks. No client code
-- updates profiles today (all writes are service-role), so this is pure
-- defence-in-depth with zero functional impact.
create or replace function _profiles_block_privilege_change() returns trigger
language plpgsql set search_path = public as $$
begin
    -- Trusted contexts (service role / SQL editor / trigger provisioning) have
    -- no end-user JWT, so auth.uid() is null — let them change anything.
    if auth.uid() is null then
        return new;
    end if;
    if new.role         is distinct from old.role
       or new.account_type is distinct from old.account_type
       or new.is_owner     is distinct from old.is_owner then
        raise exception 'Not allowed to change role, account_type or is_owner';
    end if;
    return new;
end;
$$;

drop trigger if exists profiles_block_privilege_change on profiles;
create trigger profiles_block_privilege_change
    before update on profiles
    for each row execute function _profiles_block_privilege_change();
