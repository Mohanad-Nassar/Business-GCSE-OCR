-- ══════════════════════════════════════════════════════════════
-- CO-TEACHERS + CLASS MEMBERSHIP — run AFTER schema.sql, join-codes.sql and
-- schools.sql, in the Supabase SQL editor. Safe to re-run.
--
-- Turns a class from single-teacher (classes.teacher_id) into a class with
-- MANY teachers and its students, plus:
--   • add a member by email → pick role (teacher or student)
--   • teachers join by INVITE they accept; students are enrolled directly + notified
--   • one or more "main teachers" (display only) shown to students as "Mr X"
--     or "Mr X & Miss Y"
--
-- PERMISSION MODEL (locked with the owner):
--   • every teacher of a class (creator OR accepted co-teacher) has FULL teaching
--     parity — tasks, progress, settings, join codes, adding students, inviting
--     co-teachers. This is achieved by REDEFINING is_class_owner() to mean "any
--     active teacher of the class", so all 14 existing files that call it extend
--     to co-teachers with no edits and IDENTICAL behaviour for today's
--     single-teacher classes.
--   • only the CREATOR (classes.teacher_id) may do destructive acts — delete the
--     class, or remove/demote another teacher — gated by the new is_class_creator().
--
-- SECURITY:
--   • add-by-email is enumeration-safe: RPCs return a neutral result whether or
--     not the email matches, and only act on a valid target.
--   • teacher invites are restricted to the SAME SCHOOL (schools.sql); students
--     may be any existing account, still bound by one-class-per-subject.
--   • all membership writes go through SECURITY DEFINER RPCs; no direct client
--     write policies on the new tables.
--   • a trigger pins classes.teacher_id so a co-teacher can't hijack ownership.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · TABLES
-- ══════════════════════════════════════════════════════════════

-- All teachers of a class, INCLUDING the creator (backfilled below). is_main
-- drives the student-facing "Mr X & Miss Y" label and nothing else.
create table if not exists class_teachers (
    class_id   uuid not null references classes(id) on delete cascade,
    teacher_id uuid not null references profiles(id) on delete cascade,
    is_main    boolean not null default false,
    added_by   uuid references profiles(id) on delete set null,
    added_at   timestamptz not null default now(),
    primary key (class_id, teacher_id)
);
create index if not exists idx_class_teachers_teacher on class_teachers(teacher_id);

-- Pending co-teacher invites. One active (pending) invite per (class, teacher).
create table if not exists class_teacher_invites (
    id              uuid primary key default gen_random_uuid(),
    class_id        uuid not null references classes(id) on delete cascade,
    invited_profile uuid not null references profiles(id) on delete cascade,
    invited_by      uuid not null references profiles(id) on delete cascade,
    status          text not null default 'pending' check (status in ('pending','accepted','declined','revoked')),
    created_at      timestamptz not null default now(),
    responded_at    timestamptz
);
create unique index if not exists uniq_pending_teacher_invite
    on class_teacher_invites(class_id, invited_profile) where status = 'pending';

-- Who enrolled a student (null = they joined themselves via a code, or a
-- generated login). Lets the student dashboard show a "you were added by your
-- teacher" notice for teacher-added enrolments only.
alter table class_students add column if not exists added_by uuid references profiles(id) on delete set null;

-- ── Backfill: every existing class's creator becomes a main teacher ──
insert into class_teachers (class_id, teacher_id, is_main, added_by)
    select id, teacher_id, true, teacher_id from classes
on conflict (class_id, teacher_id) do nothing;

-- ── Every NEW class auto-adds its creator as a main teacher, whatever path
-- created it (client insert, create-class.js / seed-demo-class.js service role).
-- Without this, a freshly-created class would have no class_teachers row, so
-- get_class_members and the student-facing teacher label would be blank.
create or replace function _classes_add_creator_teacher() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    insert into class_teachers (class_id, teacher_id, is_main, added_by)
    values (new.id, new.teacher_id, true, new.teacher_id)
    on conflict (class_id, teacher_id) do nothing;
    return new;
end;
$$;
drop trigger if exists classes_add_creator_teacher on classes;
create trigger classes_add_creator_teacher after insert on classes
    for each row execute function _classes_add_creator_teacher();

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · HELPER REDEFINITIONS  (the heart of co-teaching)
-- ══════════════════════════════════════════════════════════════

-- is_class_owner — REDEFINED. Now true for the creator OR any accepted
-- co-teacher (a row in class_teachers). Named "owner" for backward-compat with
-- the 14 files that already call it; semantically it now means "is a teacher of
-- this class". For a single-teacher class this is exactly the old result, so
-- nothing existing changes. SECURITY DEFINER (bypasses RLS) as before.
create or replace function is_class_owner(p_class_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (select 1 from classes where id = p_class_id and teacher_id = auth.uid())
        or exists (select 1 from class_teachers where class_id = p_class_id and teacher_id = auth.uid());
$$;

-- is_class_creator — NEW. The original single-owner semantics, for destructive
-- acts only (delete class, remove/demote a teacher). The creator is the person
-- in classes.teacher_id; it never changes (pinned by the trigger below).
create or replace function is_class_creator(p_class_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (select 1 from classes where id = p_class_id and teacher_id = auth.uid());
$$;
grant execute on function is_class_creator(uuid) to authenticated;

-- teaches_student — REDEFINED to include co-taught classes, so a co-teacher can
-- read their students' progress/profiles exactly like the creator. Same shape
-- as before; the class-ownership test now goes through is_class_owner (any
-- teacher) rather than a raw teacher_id match.
create or replace function teaches_student(p_student_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (
        select 1 from class_students cs
        where cs.student_id = p_student_id and is_class_owner(cs.class_id)
    );
$$;

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · CLASSES RLS SPLIT + OWNERSHIP PIN
-- ══════════════════════════════════════════════════════════════
-- The old classes_teacher_all policy (`for all using teacher_id = auth.uid()`)
-- must become per-command so co-teachers can SELECT/UPDATE (see + edit settings)
-- while only the CREATOR can DELETE. INSERT still forces teacher_id = self.
drop policy if exists "classes_teacher_all" on classes;

drop policy if exists "classes_teacher_select" on classes;
create policy "classes_teacher_select" on classes
    for select using (is_class_owner(id));

drop policy if exists "classes_teacher_insert" on classes;
create policy "classes_teacher_insert" on classes
    for insert with check (teacher_id = auth.uid());

drop policy if exists "classes_teacher_update" on classes;
create policy "classes_teacher_update" on classes
    for update using (is_class_owner(id)) with check (is_class_owner(id));

drop policy if exists "classes_teacher_delete" on classes;
create policy "classes_teacher_delete" on classes
    for delete using (is_class_creator(id));

-- Pin classes.teacher_id: a co-teacher (or anyone but the current creator) can
-- edit class settings via classes_teacher_update, but must NOT be able to
-- reassign ownership to themselves. Service role / SQL editor (null auth.uid())
-- and the creator keep full control.
create or replace function _classes_pin_creator() returns trigger
language plpgsql set search_path = public as $$
begin
    if new.teacher_id is distinct from old.teacher_id
       and auth.uid() is not null and auth.uid() <> old.teacher_id then
        raise exception 'Only the class creator can change ownership';
    end if;
    return new;
end;
$$;
drop trigger if exists classes_pin_creator on classes;
create trigger classes_pin_creator before update on classes
    for each row execute function _classes_pin_creator();

-- ══════════════════════════════════════════════════════════════
-- SECTION 4 · RLS ON THE NEW TABLES
-- ══════════════════════════════════════════════════════════════
alter table class_teachers        enable row level security;
alter table class_teacher_invites enable row level security;

-- class_teachers: any teacher of the class sees the roster; you always see your
-- own memberships. All writes go through the RPCs (no client write policy).
drop policy if exists "class_teachers_select" on class_teachers;
create policy "class_teachers_select" on class_teachers
    for select using (teacher_id = auth.uid() or is_class_owner(class_id));

-- class_teacher_invites: the invitee sees their invites; a class's teachers see
-- invites for their class. Writes via RPC only.
drop policy if exists "class_teacher_invites_select" on class_teacher_invites;
create policy "class_teacher_invites_select" on class_teacher_invites
    for select using (invited_profile = auth.uid() or is_class_owner(class_id));

-- ══════════════════════════════════════════════════════════════
-- SECTION 5 · RPCs
-- ══════════════════════════════════════════════════════════════

-- ── invite_teacher_to_class ── same-school, enumeration-safe.
-- Returns a neutral {ok:true, status} regardless of whether the email matched,
-- so a teacher can't probe which emails have accounts. Only creates an invite
-- when the target is a real teacher in the caller's school who isn't already a
-- teacher of / pending on the class.
create or replace function invite_teacher_to_class(p_class_id uuid, p_email text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid      uuid := auth.uid();
    v_my_school uuid;
    v_target   uuid;
    v_t_school uuid;
begin
    if v_uid is null then raise exception 'not_authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'not_class_teacher'; end if;

    select school_id into v_my_school from profiles where id = v_uid;

    select p.id, p.school_id into v_target, v_t_school
    from profiles p
    where lower(p.email) = lower(trim(p_email)) and p.role = 'teacher';

    -- Only act on a valid, same-school target; otherwise fall through to the
    -- neutral response (no enumeration, no error).
    if v_target is not null and v_target <> v_uid
       and v_my_school is not null and v_t_school is not distinct from v_my_school
       and not exists (select 1 from class_teachers where class_id = p_class_id and teacher_id = v_target) then
        insert into class_teacher_invites (class_id, invited_profile, invited_by)
        values (p_class_id, v_target, v_uid)
        on conflict do nothing;  -- swallow a duplicate pending invite
    end if;

    return jsonb_build_object('ok', true, 'status', 'invite_sent_if_eligible');
end;
$$;
grant execute on function invite_teacher_to_class(uuid, text) to authenticated;

-- ── respond_to_class_teacher_invite ── invitee only.
create or replace function respond_to_class_teacher_invite(p_invite_id uuid, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    v_inv class_teacher_invites;
begin
    if v_uid is null then raise exception 'not_authenticated'; end if;
    select * into v_inv from class_teacher_invites where id = p_invite_id and status = 'pending';
    if not found then return jsonb_build_object('ok', false, 'error', 'invite_not_found'); end if;
    if v_inv.invited_profile <> v_uid then raise exception 'not_your_invite'; end if;

    if p_accept then
        insert into class_teachers (class_id, teacher_id, is_main, added_by)
        values (v_inv.class_id, v_uid, false, v_inv.invited_by)
        on conflict (class_id, teacher_id) do nothing;
        update class_teacher_invites set status = 'accepted', responded_at = now() where id = p_invite_id;
        return jsonb_build_object('ok', true, 'accepted', true);
    else
        update class_teacher_invites set status = 'declined', responded_at = now() where id = p_invite_id;
        return jsonb_build_object('ok', true, 'accepted', false);
    end if;
end;
$$;
grant execute on function respond_to_class_teacher_invite(uuid, boolean) to authenticated;

-- ── revoke_class_teacher_invite ── any teacher of the class cancels a pending invite.
create or replace function revoke_class_teacher_invite(p_invite_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_class uuid;
begin
    select class_id into v_class from class_teacher_invites where id = p_invite_id and status = 'pending';
    if v_class is null then return; end if;
    if not is_class_owner(v_class) then raise exception 'not_class_teacher'; end if;
    update class_teacher_invites set status = 'revoked', responded_at = now() where id = p_invite_id;
end;
$$;
grant execute on function revoke_class_teacher_invite(uuid) to authenticated;

-- ── add_student_to_class ── enrol directly + enumeration-safe.
-- Any teacher of the class. A found student is enrolled immediately (the notify
-- is derived client-side from the new membership); the one-class-per-subject
-- convention (join-codes.sql) is enforced here too.
create or replace function add_student_to_class(p_class_id uuid, p_email text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid     uuid := auth.uid();
    v_student uuid;
    v_subject uuid;
    v_existing text;
begin
    if v_uid is null then raise exception 'not_authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'not_class_teacher'; end if;

    select subject_id into v_subject from classes where id = p_class_id and not archived;
    if v_subject is null then return jsonb_build_object('ok', false, 'error', 'class_invalid'); end if;

    select id into v_student from profiles
    where lower(email) = lower(trim(p_email)) and role = 'student';
    if v_student is null then
        -- Enumeration-safe: same shape as a real add.
        return jsonb_build_object('ok', true, 'status', 'added_if_exists');
    end if;

    if exists (select 1 from class_students where class_id = p_class_id and student_id = v_student) then
        return jsonb_build_object('ok', true, 'status', 'already_in_class');
    end if;

    -- One class per student per subject.
    select c.name into v_existing
    from class_students cs join classes c on c.id = cs.class_id
    where cs.student_id = v_student and c.subject_id = v_subject and not c.archived
    limit 1;
    if v_existing is not null then
        return jsonb_build_object('ok', false, 'error', 'subject_taken', 'class_name', v_existing);
    end if;

    insert into class_students (class_id, student_id, added_by) values (p_class_id, v_student, v_uid);
    return jsonb_build_object('ok', true, 'status', 'added');
end;
$$;
grant execute on function add_student_to_class(uuid, text) to authenticated;

-- ── remove_class_teacher ── CREATOR ONLY (destructive). Can't remove the creator.
create or replace function remove_class_teacher(p_class_id uuid, p_teacher_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_creator uuid;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if not is_class_creator(p_class_id) then raise exception 'creator_only'; end if;
    select teacher_id into v_creator from classes where id = p_class_id;
    if p_teacher_id = v_creator then raise exception 'cannot_remove_creator'; end if;
    delete from class_teachers where class_id = p_class_id and teacher_id = p_teacher_id;
end;
$$;
grant execute on function remove_class_teacher(uuid, uuid) to authenticated;

-- ── leave_class_as_teacher ── a co-teacher removes themselves. The creator
-- can't leave (they'd orphan the class — delete or hand over instead).
create or replace function leave_class_as_teacher(p_class_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if is_class_creator(p_class_id) then raise exception 'creator_cannot_leave'; end if;
    delete from class_teachers where class_id = p_class_id and teacher_id = auth.uid();
end;
$$;
grant execute on function leave_class_as_teacher(uuid) to authenticated;

-- ── set_main_teachers ── any teacher of the class sets the display roster.
-- Only actual teachers of the class can be marked main; display only.
create or replace function set_main_teachers(p_class_id uuid, p_teacher_ids uuid[]) returns void
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'not_class_teacher'; end if;
    update class_teachers
    set is_main = (teacher_id = any(coalesce(p_teacher_ids, '{}')))
    where class_id = p_class_id;
end;
$$;
grant execute on function set_main_teachers(uuid, uuid[]) to authenticated;

-- ── get_class_members ── the class settings roster: teachers (+ main/creator
-- flags), students, and pending teacher invites. Any teacher of the class.
create or replace function get_class_members(p_class_id uuid) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_creator uuid;
    v_result  jsonb;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if not is_class_owner(p_class_id) then raise exception 'not_class_teacher'; end if;
    select teacher_id into v_creator from classes where id = p_class_id;

    select jsonb_build_object(
        'creator_id', v_creator,
        'teachers', (select coalesce(jsonb_agg(jsonb_build_object(
                        'id', p.id, 'username', p.username, 'email', p.email,
                        'is_main', ct.is_main, 'is_creator', (p.id = v_creator))
                        order by (p.id = v_creator) desc, ct.is_main desc, p.username), '[]'::jsonb)
                     from class_teachers ct join profiles p on p.id = ct.teacher_id
                     where ct.class_id = p_class_id),
        'students', (select coalesce(jsonb_agg(jsonb_build_object(
                        'id', p.id, 'username', p.username, 'email', p.email)
                        order by p.username), '[]'::jsonb)
                     from class_students cs join profiles p on p.id = cs.student_id
                     where cs.class_id = p_class_id),
        'pending_invites', (select coalesce(jsonb_agg(jsonb_build_object(
                        'id', i.id, 'username', p.username, 'email', p.email)
                        order by i.created_at desc), '[]'::jsonb)
                     from class_teacher_invites i join profiles p on p.id = i.invited_profile
                     where i.class_id = p_class_id and i.status = 'pending')
    ) into v_result;
    return v_result;
end;
$$;
grant execute on function get_class_members(uuid) to authenticated;

-- ── get_my_pending_class_invites ── for the invited teacher: their pending
-- co-teacher invites with class + inviter names. Powers the bell + accept UI.
create or replace function get_my_pending_class_invites() returns jsonb
language sql security definer stable set search_path = public as $$
    select coalesce(jsonb_agg(jsonb_build_object(
        'id', i.id, 'class_id', i.class_id, 'class_name', c.name,
        'invited_by', inviter.username, 'created_at', i.created_at)
        order by i.created_at desc), '[]'::jsonb)
    from class_teacher_invites i
    join classes c on c.id = i.class_id
    join profiles inviter on inviter.id = i.invited_by
    where i.invited_profile = auth.uid() and i.status = 'pending';
$$;
grant execute on function get_my_pending_class_invites() to authenticated;

-- ── get_my_class_teachers ── STUDENT-facing: the main teacher name(s) of the
-- caller's class for a subject, for the "Mr X & Miss Y" label. Falls back to
-- ALL teachers if none are marked main, so students never see a blank. Member-
-- only (my_class_for_subject resolves the caller's own class).
create or replace function get_my_class_teachers(p_subject text default null) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_class uuid;
    v_mains jsonb;
    v_all   jsonb;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    v_class := my_class_for_subject(p_subject);
    if v_class is null then return jsonb_build_object('class_id', null, 'teachers', '[]'::jsonb); end if;

    select coalesce(jsonb_agg(p.username order by p.username), '[]'::jsonb) into v_mains
    from class_teachers ct join profiles p on p.id = ct.teacher_id
    where ct.class_id = v_class and ct.is_main;

    if v_mains is null or jsonb_array_length(v_mains) = 0 then
        select coalesce(jsonb_agg(p.username order by p.username), '[]'::jsonb) into v_all
        from class_teachers ct join profiles p on p.id = ct.teacher_id
        where ct.class_id = v_class;
        return jsonb_build_object('class_id', v_class, 'teachers', coalesce(v_all, '[]'::jsonb));
    end if;
    return jsonb_build_object('class_id', v_class, 'teachers', v_mains);
end;
$$;
grant execute on function get_my_class_teachers(text) to authenticated;

-- ── leave_class_as_student ── a student added by a teacher can opt out.
create or replace function leave_class_as_student(p_class_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    delete from class_students where class_id = p_class_id and student_id = auth.uid();
end;
$$;
grant execute on function leave_class_as_student(uuid) to authenticated;
