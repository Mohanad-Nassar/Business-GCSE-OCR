-- ══════════════════════════════════════════════════════════════
-- SUBJECTS V2 — TEACHER-TO-TEACHER SUBJECT SHARING (spec S1)
-- Run AFTER schema.sql, schools.sql, school-admin.sql AND
-- teacher-subjects.sql, in the Supabase SQL editor. Safe to re-run.
--
-- Source of truth: docs/SUBJECTS-V2-SPEC.md (§5.3, §6, §7.2).
-- This is phase S1 only (in-school sharing). Later phases add request-to-edit
-- (S2), external invites (S3), platform-fork edit grants (S4/S5) — separate
-- files.
--
-- WHAT THIS ADDS
--   • subject_shares — a teacher shares a subject THEY created with either one
--     colleague (grantee_profile_id) or their whole school (grantee_school_id),
--     at 'view' or 'edit' level.
--   • Only the OWNER can share (no transitive re-sharing). Sharing is limited
--     to the owner's OWN school — cross-school sharing is an admin-approved
--     request handled in a later phase (S3), rejected here.
--   • Shares are ADMIN-VISIBLE + REVOCABLE (spec D4): a school_admin can see and
--     delete any share whose subject owner is in their school.
--   • RLS is extended so a grantee can READ the shared subject, VIEW its topics
--     (read-only), and — for 'edit' shares — edit its custom_topics. A grantee
--     can never delete the subject, change its owner, or re-share it.
--
-- SECURITY MODEL (auth-authz skill)
--   • Role/ownership resolved server-side from auth.uid() only.
--   • Writes to subject_shares go ONLY through share_subject()/revoke_share()
--     (SECURITY DEFINER, fixed search_path) — no direct client INSERT policy,
--     so the same-school clamp can't be bypassed by writing a row directly.
--   • can_edit_subject()/can_view_subject() are the central guards, reused by
--     both the RLS policies and the RPCs.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · TABLE
-- ══════════════════════════════════════════════════════════════

create table if not exists subject_shares (
    id                 uuid primary key default gen_random_uuid(),
    subject_id         uuid not null references subjects(id)  on delete cascade,
    grantee_profile_id uuid references profiles(id) on delete cascade,
    grantee_school_id  uuid references schools(id)  on delete cascade,
    access             text not null default 'view' check (access in ('view','edit')),
    shared_by          uuid not null references profiles(id) on delete cascade,
    created_at         timestamptz not null default now(),
    -- exactly one grantee kind (a specific teacher XOR a whole school)
    constraint subject_shares_one_grantee
        check ((grantee_profile_id is not null) <> (grantee_school_id is not null))
);
-- One share row per (subject, grantee); re-sharing updates access in place.
create unique index if not exists subject_shares_one_per_teacher
    on subject_shares (subject_id, grantee_profile_id) where grantee_profile_id is not null;
create unique index if not exists subject_shares_one_per_school
    on subject_shares (subject_id, grantee_school_id)  where grantee_school_id is not null;
create index if not exists subject_shares_grantee_idx on subject_shares (grantee_profile_id);
create index if not exists subject_shares_subject_idx on subject_shares (subject_id);

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · GUARD HELPERS (SECURITY DEFINER, fixed search_path)
-- ══════════════════════════════════════════════════════════════

-- Does the caller own this (teacher) subject?
create or replace function _owns_subject(p_subject_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (select 1 from subjects where id = p_subject_id and created_by = auth.uid());
$$;
grant execute on function _owns_subject(uuid) to authenticated;

-- The school of a subject's owner — the scope a school_admin manages it under.
create or replace function _subject_owner_school(p_subject_id uuid) returns uuid
language sql security definer stable set search_path = public as $$
    select _school_of(s.created_by) from subjects s where s.id = p_subject_id;
$$;
grant execute on function _subject_owner_school(uuid) to authenticated;

-- Can the caller EDIT this subject's content? Owner, or holder of an 'edit'
-- share (direct, or a whole-school share to the caller's school).
create or replace function can_edit_subject(p_subject_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (select 1 from subjects s where s.id = p_subject_id and s.created_by = auth.uid())
        or exists (
            select 1 from subject_shares sh
            where sh.subject_id = p_subject_id and sh.access = 'edit'
              and ( sh.grantee_profile_id = auth.uid()
                 or (sh.grantee_school_id is not null and sh.grantee_school_id = _school_of(auth.uid())) )
        );
$$;
grant execute on function can_edit_subject(uuid) to authenticated;

-- Can the caller SEE this subject (read-only preview or better)? The above,
-- plus any 'view' share, plus normal enrolment (teacher-subjects.sql).
create or replace function can_view_subject(p_subject_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select can_edit_subject(p_subject_id)
        or enrolled_in_subject(p_subject_id)
        or exists (
            select 1 from subject_shares sh
            where sh.subject_id = p_subject_id
              and ( sh.grantee_profile_id = auth.uid()
                 or (sh.grantee_school_id is not null and sh.grantee_school_id = _school_of(auth.uid())) )
        );
$$;
grant execute on function can_view_subject(uuid) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · RLS ON subject_shares
-- ══════════════════════════════════════════════════════════════
alter table subject_shares enable row level security;

-- Owner: read + delete (revoke) their own subject's shares. NO insert/update
-- policy — creation goes through share_subject() so the same-school clamp holds.
drop policy if exists "shares_owner_select" on subject_shares;
create policy "shares_owner_select" on subject_shares for select using (_owns_subject(subject_id));
drop policy if exists "shares_owner_delete" on subject_shares;
create policy "shares_owner_delete" on subject_shares for delete using (_owns_subject(subject_id));

-- Grantee: read shares that grant THEM (directly or via their school).
drop policy if exists "shares_grantee_select" on subject_shares;
create policy "shares_grantee_select" on subject_shares for select using (
    grantee_profile_id = auth.uid()
    or (grantee_school_id is not null and grantee_school_id = _school_of(auth.uid()))
);

-- School_admin: see + revoke any share whose subject owner is in their school
-- (spec D4 — admin-visible + revocable).
drop policy if exists "shares_admin_select" on subject_shares;
create policy "shares_admin_select" on subject_shares for select
    using (is_school_admin(_subject_owner_school(subject_id)));
drop policy if exists "shares_admin_delete" on subject_shares;
create policy "shares_admin_delete" on subject_shares for delete
    using (is_school_admin(_subject_owner_school(subject_id)));

-- ══════════════════════════════════════════════════════════════
-- SECTION 4 · EXTEND subjects / custom_topics RLS FOR GRANTEES
-- ══════════════════════════════════════════════════════════════
-- Redefines the read policy from teacher-subjects.sql to ALSO admit share
-- grantees. Re-running teacher-subjects.sql reverts this — re-run this file
-- after it (documented run order at the top).
drop policy if exists "subjects_read_scoped" on subjects;
create policy "subjects_read_scoped" on subjects for select using (
    created_by is null
    or created_by = auth.uid()
    or enrolled_in_subject(subjects.id)
    or can_view_subject(subjects.id)
);

-- custom_topics: owner + 'edit'-share holders get full CRUD; 'view'-share
-- holders get read-only (drafts included — they're a colleague previewing, not
-- a student). The student policy (published + enrolled) from teacher-subjects.sql
-- is left intact.
drop policy if exists "custom_topics_teacher_all" on custom_topics;
drop policy if exists "custom_topics_editor_all" on custom_topics;
create policy "custom_topics_editor_all" on custom_topics for all
    using (can_edit_subject(custom_topics.subject_id))
    with check (can_edit_subject(custom_topics.subject_id));
drop policy if exists "custom_topics_viewer_select" on custom_topics;
create policy "custom_topics_viewer_select" on custom_topics for select
    using (can_view_subject(custom_topics.subject_id));

-- ══════════════════════════════════════════════════════════════
-- SECTION 5 · RPCs
-- ══════════════════════════════════════════════════════════════

-- Share (or re-share, updating access) one of the caller's OWN subjects with a
-- colleague or the whole school. CROSS-SCHOOL IS REJECTED here — that path is
-- the admin-approved external request (spec S3). p_scope: 'teacher' | 'school'.
create or replace function share_subject(
    p_subject_id uuid, p_scope text, p_access text, p_grantee_email text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid     uuid := auth.uid();
    v_school  uuid;
    v_grantee uuid;
    v_id      uuid;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    if not exists (select 1 from subjects where id = p_subject_id and created_by = v_uid) then
        raise exception 'You can only share subjects you created';
    end if;
    if p_access not in ('view','edit') then raise exception 'access must be view or edit'; end if;
    v_school := _school_of(v_uid);
    if v_school is null then raise exception 'You are not in a school yet'; end if;

    if p_scope = 'school' then
        insert into subject_shares (subject_id, grantee_school_id, access, shared_by)
        values (p_subject_id, v_school, p_access, v_uid)
        on conflict (subject_id, grantee_school_id) where grantee_school_id is not null
        do update set access = excluded.access
        returning id into v_id;

    elsif p_scope = 'teacher' then
        select id into v_grantee from profiles
        where lower(email) = lower(btrim(coalesce(p_grantee_email, ''))) and role = 'teacher';
        if v_grantee is null then raise exception 'No teacher account found with that email'; end if;
        if v_grantee = v_uid then raise exception 'You already own this subject'; end if;
        -- SAME-SCHOOL CLAMP: cross-school sharing must go through the admin
        -- request flow (S3), never this direct call.
        if _school_of(v_grantee) is distinct from v_school then
            raise exception 'That teacher is in a different school — external sharing needs a school-admin request';
        end if;
        insert into subject_shares (subject_id, grantee_profile_id, access, shared_by)
        values (p_subject_id, v_grantee, p_access, v_uid)
        on conflict (subject_id, grantee_profile_id) where grantee_profile_id is not null
        do update set access = excluded.access
        returning id into v_id;
    else
        raise exception 'scope must be teacher or school';
    end if;

    return jsonb_build_object('id', v_id);
end;
$$;
grant execute on function share_subject(uuid, text, text, text) to authenticated;

-- Revoke a share. Allowed for the subject's OWNER or a school_admin over the
-- owner's school (RLS enforces the same, but the RPC gives a clean error).
create or replace function revoke_share(p_share_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_subject uuid;
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    select subject_id into v_subject from subject_shares where id = p_share_id;
    if v_subject is null then return; end if;  -- already gone
    if not (_owns_subject(v_subject) or is_school_admin(_subject_owner_school(v_subject))) then
        raise exception 'not authorised';
    end if;
    delete from subject_shares where id = p_share_id;
end;
$$;
grant execute on function revoke_share(uuid) to authenticated;

-- Subjects shared WITH the caller (for the "Shared with me" tab). edit wins
-- over view if both a direct and a whole-school share apply.
create or replace function get_shared_with_me()
returns table (
    id uuid, slug text, name text, level text, exam_board text, description text,
    colour text, icon text, active boolean, access text,
    owner_name text, published_topics bigint, total_topics bigint
)
language sql security definer stable set search_path = public as $$
    select s.id, s.slug, s.name, s.level, s.exam_board, s.description,
           s.colour, s.icon, s.active,
           case when bool_or(sh.access = 'edit') then 'edit' else 'view' end as access,
           o.username as owner_name,
           count(t.id) filter (where t.status = 'published') as published_topics,
           count(t.id) as total_topics
    from subject_shares sh
    join subjects s on s.id = sh.subject_id
    left join profiles o on o.id = s.created_by
    left join custom_topics t on t.subject_id = s.id
    where sh.grantee_profile_id = auth.uid()
       or (sh.grantee_school_id is not null and sh.grantee_school_id = _school_of(auth.uid()))
    group by s.id, o.username
    order by s.name;
$$;
grant execute on function get_shared_with_me() to authenticated;

-- Teachers in the caller's school (for the share typeahead). profiles RLS hides
-- other teachers, so this security-definer read is the controlled way to list
-- them — scoped strictly to the caller's own school, excluding themselves.
create or replace function get_my_school_teachers()
returns table (profile_id uuid, username text, email text)
language sql security definer stable set search_path = public as $$
    select p.id, p.username, p.email
    from school_members m
    join profiles p on p.id = m.profile_id
    where m.school_id = _school_of(auth.uid())
      and m.removed_at is null
      and p.id <> auth.uid()
      and p.role = 'teacher'
    order by p.username;
$$;
grant execute on function get_my_school_teachers() to authenticated;

-- Shares OF the caller's own subjects (for the "manage sharing" view on a card):
-- who it's shared with + at what level, so the owner can revoke.
create or replace function get_shares_for_subject(p_subject_id uuid)
returns table (id uuid, scope text, grantee_name text, access text, created_at timestamptz)
language sql security definer stable set search_path = public as $$
    select sh.id,
           case when sh.grantee_school_id is not null then 'school' else 'teacher' end as scope,
           coalesce(p.username, sc.name, '—') as grantee_name,
           sh.access, sh.created_at
    from subject_shares sh
    left join profiles p on p.id = sh.grantee_profile_id
    left join schools  sc on sc.id = sh.grantee_school_id
    where sh.subject_id = p_subject_id
      and (_owns_subject(p_subject_id) or is_school_admin(_subject_owner_school(p_subject_id)))
    order by sh.created_at desc;
$$;
grant execute on function get_shares_for_subject(uuid) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 6 · ADMIN OVERSIGHT (spec D4 — admin-visible + revocable)
-- ══════════════════════════════════════════════════════════════
-- Every share whose subject OWNER is in the given school, for the admin.html
-- "Sharing" tab. Owner-or-that-school's-admin only (the WHERE clause fails
-- closed for anyone else, returning zero rows — no cross-school leak). Revoking
-- reuses revoke_share() above, which already authorises school_admins.
create or replace function get_school_shares(p_school_id uuid)
returns table (
    id uuid, subject_name text, owner_name text,
    scope text, grantee_name text, access text, created_at timestamptz
)
language sql security definer stable set search_path = public as $$
    select sh.id, s.name as subject_name, o.username as owner_name,
           case when sh.grantee_school_id is not null then 'school' else 'teacher' end as scope,
           coalesce(gp.username, gsc.name, '—') as grantee_name,
           sh.access, sh.created_at
    from subject_shares sh
    join subjects s on s.id = sh.subject_id
    left join profiles o   on o.id  = s.created_by
    left join profiles gp  on gp.id = sh.grantee_profile_id
    left join schools  gsc on gsc.id = sh.grantee_school_id
    where _school_of(s.created_by) = p_school_id
      and (_is_owner() or is_school_admin(p_school_id))
    order by sh.created_at desc;
$$;
grant execute on function get_school_shares(uuid) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 7 · CLASSES MAY USE SUBJECTS SHARED WITH THE TEACHER
-- ══════════════════════════════════════════════════════════════
-- A teacher a subject is SHARED with (view OR edit — either is fine for running
-- a class) can create a class on it. This relaxes two guards that otherwise only
-- allow platform subjects + the teacher's own creations:
--   • teacher-subjects.sql's _class_subject_guard trigger (the "Classes can only
--     use platform subjects or subjects created by their own teacher" error);
--   • school-admin.sql's classes_teacher_insert RLS policy (defensive — so it
--     keeps working even if the school's subject entitlements are later
--     restricted, which would make my_subject_access() false for a shared subject).
-- Re-run this file after teacher-subjects.sql / school-admin.sql (they recreate
-- the originals); that's already the documented run order.

create or replace function _class_subject_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
    select created_by into v_owner from subjects where id = new.subject_id;
    -- platform subject (null owner), or the class's own teacher created it
    if v_owner is null or v_owner = new.teacher_id then
        return new;
    end if;
    -- OR the subject is shared with this teacher — directly or via a whole-school
    -- share. (Checked against new.teacher_id, not auth.uid(), so it holds whether
    -- the insert is client-direct or via the service-role create-class function.)
    if exists (
        select 1 from subject_shares sh
        where sh.subject_id = new.subject_id
          and ( sh.grantee_profile_id = new.teacher_id
             or (sh.grantee_school_id is not null and sh.grantee_school_id = _school_of(new.teacher_id)) )
    ) then
        return new;
    end if;
    raise exception 'Classes can only use platform subjects, subjects you created, or subjects shared with you';
end;
$$;

drop policy if exists "classes_teacher_insert" on classes;
create policy "classes_teacher_insert" on classes
    for insert with check (
        teacher_id = auth.uid()
        and (
            subject_id is null
            or my_subject_access((select s.slug from subjects s where s.id = subject_id))
            or can_view_subject(subject_id)
        )
    );
