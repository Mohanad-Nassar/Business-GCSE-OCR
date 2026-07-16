-- ══════════════════════════════════════════════════════════════
-- SCHOOL ADMIN — teacher management + subject access control.
-- Run AFTER schema.sql, schools.sql, entitlements.sql and class-teachers.sql,
-- in the Supabase SQL editor. Safe to re-run.
--
-- Gives the platform OWNER and each school's SCHOOL_ADMIN a real management
-- surface (driven by admin.html / admin.js):
--   • see a school's teachers (username, email, role, last sign-in, class/
--     student counts) and suspend / remove / delete / reset-password them
--     (the account actions themselves run in Netlify functions, which need the
--     Auth admin API; this file provides the DB state + read/permission layer)
--   • TWO-TIER subject access: the OWNER sets which subjects each SCHOOL may
--     use; each SCHOOL_ADMIN then picks, from that set, which subjects each
--     TEACHER in their school gets. A teacher can never exceed the school set.
--   • an audit log of every destructive/admin action.
--
-- PERMISSION MODEL:
--   • owner (_is_owner)         → every school, every action.
--   • school_admin (school_members.role='school_admin') → only their school(s).
--   • is_school_admin_over(target) is the central guard for teacher-targeted
--     actions (owner OR school_admin of a school the target belongs to).
--
-- BACKWARD COMPATIBILITY (important): with the new tables EMPTY, nothing
-- changes — a school with no school_subjects rows is unrestricted (all active
-- subjects), and a teacher with no teacher_subject_access rows gets the whole
-- school set. The entitlement functions are only redefined here to LAYER the
-- restriction on top of entitlements.sql's baseline; re-running entitlements.sql
-- alone reverts to unrestricted, so re-run this file after it.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · TABLES
-- ══════════════════════════════════════════════════════════════

-- ── Teacher lifecycle state on the membership row ──
-- status/suspended_mode drive the Active vs Suspended tabs; removed_at (soft
-- detach) drives the Removed tab and is reversible (re-attach clears it).
-- frozen_class_ids remembers exactly which classes a "freeze" archived, so
-- reinstating un-archives those and leaves already-archived ones alone.
alter table school_members add column if not exists status         text not null default 'active';
alter table school_members add column if not exists suspended_mode text;         -- 'login' | 'login_frozen'
alter table school_members add column if not exists frozen_class_ids uuid[];
alter table school_members add column if not exists suspended_at   timestamptz;
alter table school_members add column if not exists suspended_by   uuid references profiles(id) on delete set null;
alter table school_members add column if not exists removed_at     timestamptz;
alter table school_members add column if not exists removed_by     uuid references profiles(id) on delete set null;
do $$ begin
    alter table school_members add constraint school_members_status_chk
        check (status in ('active', 'suspended'));
exception when duplicate_object then null; end $$;

-- ── School-level subject allow-list (owner-managed) ──
-- No rows for a school = unrestricted (all active subjects).
create table if not exists school_subjects (
    school_id  uuid not null references schools(id)  on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (school_id, subject_id)
);

-- ── Per-teacher subject access (school_admin-managed, within the school set) ──
-- No rows for a teacher = the whole school set.
create table if not exists teacher_subject_access (
    profile_id uuid not null references profiles(id) on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (profile_id, subject_id)
);

-- ── Audit log ──
create table if not exists admin_audit_log (
    id                bigserial primary key,
    actor_id          uuid references profiles(id) on delete set null,
    school_id         uuid references schools(id)  on delete set null,
    action            text not null,
    target_profile_id uuid references profiles(id) on delete set null,
    target_email      text,
    detail            jsonb,
    created_at        timestamptz not null default now()
);
create index if not exists admin_audit_log_school_idx on admin_audit_log (school_id, created_at desc);

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · HELPERS
-- ══════════════════════════════════════════════════════════════

-- The school a teacher belongs to (school_members is the truth; profiles.school_id
-- is a denormalised convenience). Returns the first non-removed membership.
create or replace function _school_of(p_profile uuid) returns uuid
language sql stable security definer set search_path = public as $$
    select school_id from school_members
    where profile_id = p_profile and removed_at is null
    order by (role = 'school_admin') desc, created_at asc
    limit 1;
$$;

-- Central guard: is the caller allowed to administer this target teacher?
-- Owner (any) OR a school_admin of a school the target is an ACTIVE member of.
create or replace function is_school_admin_over(p_profile uuid) returns boolean
language sql stable security definer set search_path = public as $$
    select _is_owner() or exists (
        select 1
        from school_members target
        join school_members me
          on me.school_id = target.school_id
         and me.profile_id = auth.uid()
         and me.role = 'school_admin'
         and me.removed_at is null
        where target.profile_id = p_profile
    );
$$;
grant execute on function is_school_admin_over(uuid) to authenticated;

-- The subjects a teacher may actually access, applying BOTH tiers:
--   school set  = explicit school_subjects, or ALL active subjects if none
--   teacher set = explicit teacher_subject_access, or the whole school set if none
-- Result = school_set  ∩ (teacher_set or school_set). Active subjects only.
create or replace function effective_teacher_subjects(p_profile uuid)
returns table(subject_id uuid)
language sql stable security definer set search_path = public as $$
    with sch as (select _school_of(p_profile) as school_id),
    school_set as (
        select s.id
        from subjects s, sch
        where s.active
          and (
            not exists (select 1 from school_subjects ss where ss.school_id = sch.school_id)
            or exists (select 1 from school_subjects ss
                       where ss.school_id = sch.school_id and ss.subject_id = s.id)
          )
    ),
    tset as (select tsa.subject_id from teacher_subject_access tsa where tsa.profile_id = p_profile)
    select ss.id from school_set ss
    where not exists (select 1 from tset)
       or ss.id in (select subject_id from tset);
$$;
grant execute on function effective_teacher_subjects(uuid) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · RLS ON NEW TABLES
-- ══════════════════════════════════════════════════════════════
alter table school_subjects        enable row level security;
alter table teacher_subject_access enable row level security;
alter table admin_audit_log        enable row level security;

-- school_subjects — owner manages; a member of the school may read (to know its
-- set). Writes go through set_school_subjects (owner-only) but a direct
-- owner policy is harmless and convenient.
drop policy if exists "school_subjects_owner_all" on school_subjects;
create policy "school_subjects_owner_all" on school_subjects for all using (_is_owner()) with check (_is_owner());
drop policy if exists "school_subjects_member_read" on school_subjects;
create policy "school_subjects_member_read" on school_subjects for select using (
    exists (select 1 from school_members m where m.school_id = school_subjects.school_id and m.profile_id = auth.uid()));

-- teacher_subject_access — a teacher reads their own; an admin over that teacher
-- reads it. Writes via set_teacher_subjects only.
drop policy if exists "tsa_self_read" on teacher_subject_access;
create policy "tsa_self_read" on teacher_subject_access for select using (profile_id = auth.uid());
drop policy if exists "tsa_admin_read" on teacher_subject_access;
create policy "tsa_admin_read" on teacher_subject_access for select using (is_school_admin_over(profile_id));

-- admin_audit_log — owner reads all; school_admin reads their school's rows.
-- No client write policy (definer functions / service role write it).
drop policy if exists "audit_owner_read" on admin_audit_log;
create policy "audit_owner_read" on admin_audit_log for select using (_is_owner());
drop policy if exists "audit_admin_read" on admin_audit_log;
create policy "audit_admin_read" on admin_audit_log for select using (
    school_id is not null and is_school_admin(school_id));

-- ══════════════════════════════════════════════════════════════
-- SECTION 4 · ENTITLEMENT OVERRIDES  (layer the subject rule on top)
-- ══════════════════════════════════════════════════════════════
-- Redefines the three entitlements.sql functions so the TEACHER path is gated
-- by effective_teacher_subjects. Owner still sees everything; students are
-- unchanged. Empty tables ⇒ identical to entitlements.sql's baseline.

create or replace function has_subject_access(p_profile uuid, p_subject text)
returns boolean
language sql stable security definer set search_path = public as $$
    select
        -- owner: every subject
        exists (select 1 from profiles p where p.id = p_profile and p.is_owner)
        -- teacher: only subjects within their effective set
        or exists (
            select 1
            from profiles p
            join subjects s on s.slug = p_subject and s.active
            where p.id = p_profile and p.role = 'teacher'
              and s.id in (select subject_id from effective_teacher_subjects(p_profile))
        )
        -- student: subjects of their unarchived classes (unchanged)
        or exists (
            select 1
            from class_students cs
            join classes  c on c.id = cs.class_id
            join subjects s on s.id = c.subject_id
            where cs.student_id = p_profile
              and s.slug = p_subject
              and not c.archived
        );
$$;
revoke execute on function has_subject_access(uuid, text) from public;
revoke execute on function has_subject_access(uuid, text) from anon;
revoke execute on function has_subject_access(uuid, text) from authenticated;

create or replace function get_my_entitlements() returns jsonb
language sql stable security definer set search_path = public as $$
    select case
        -- owner: every active subject
        when exists (select 1 from profiles p where p.id = auth.uid() and p.is_owner)
        then coalesce((select jsonb_agg(jsonb_build_object(
                 'subject', s.slug, 'name', s.name, 'icon', s.icon,
                 'colour', s.colour, 'via', 'staff') order by s.sort_order)
             from subjects s where s.active), '[]'::jsonb)
        -- teacher: only their effective subjects
        when exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'teacher')
        then coalesce((select jsonb_agg(jsonb_build_object(
                 'subject', s.slug, 'name', s.name, 'icon', s.icon,
                 'colour', s.colour, 'via', 'staff') order by s.sort_order)
             from subjects s
             where s.active and s.id in (select subject_id from effective_teacher_subjects(auth.uid()))), '[]'::jsonb)
        -- student: subjects of their unarchived classes (unchanged)
        else coalesce((select jsonb_agg(jsonb_build_object(
                 'subject', s.slug, 'name', s.name, 'icon', s.icon,
                 'colour', s.colour, 'via', 'class') order by s.sort_order)
             from (select distinct c.subject_id
                     from class_students cs
                     join classes c on c.id = cs.class_id
                    where cs.student_id = auth.uid() and not c.archived) m
             join subjects s on s.id = m.subject_id
            where s.active), '[]'::jsonb)
    end;
$$;
grant execute on function get_my_entitlements() to authenticated;
revoke execute on function get_my_entitlements() from public;
revoke execute on function get_my_entitlements() from anon;

create or replace function edge_gate_check(p_subject text) returns jsonb
language sql stable security definer set search_path = public as $$
    select jsonb_build_object(
        'allow_content', has_subject_access(auth.uid(), p_subject),
        -- question-bank.js embeds answers, so it is teacher/owner-only AND must
        -- respect the subject restriction (a teacher blocked from a subject
        -- can't fetch its bank either).
        'allow_bank', (
            exists (select 1 from profiles p where p.id = auth.uid() and (p.role = 'teacher' or p.is_owner))
            and has_subject_access(auth.uid(), p_subject)
        )
    );
$$;
grant execute on function edge_gate_check(text) to authenticated;
revoke execute on function edge_gate_check(text) from public;
revoke execute on function edge_gate_check(text) from anon;

-- ══════════════════════════════════════════════════════════════
-- SECTION 4b · CLASS-CREATION SUBJECT GUARD
-- ══════════════════════════════════════════════════════════════
-- A teacher must not create a class in a subject they can't access. Redefines
-- the classes INSERT policy (from class-teachers.sql) to also require subject
-- access. Backward-compatible: my_subject_access is true for any teacher whose
-- school/teacher subject sets are unset, so nothing changes until a restriction
-- is applied. Service role (create-class.js / seed) bypasses RLS as before.
drop policy if exists "classes_teacher_insert" on classes;
create policy "classes_teacher_insert" on classes
    for insert with check (
        teacher_id = auth.uid()
        and (
            subject_id is null
            or my_subject_access((select s.slug from subjects s where s.id = subject_id))
        )
    );

-- ══════════════════════════════════════════════════════════════
-- SECTION 5 · READ RPCs (owner / school_admin scoped)
-- ══════════════════════════════════════════════════════════════

-- What can the CALLER administer? Drives the admin page's gate + school switcher.
--   { is_owner, schools:[{id,name,role}] }  (owner sees every school)
create or replace function am_i_admin() returns jsonb
language sql stable security definer set search_path = public as $$
    select jsonb_build_object(
        'is_owner', _is_owner(),
        'schools', case
            when _is_owner() then coalesce((select jsonb_agg(jsonb_build_object(
                    'id', s.id, 'name', s.name, 'role', 'owner') order by s.created_at)
                 from schools s), '[]'::jsonb)
            else coalesce((select jsonb_agg(jsonb_build_object(
                    'id', s.id, 'name', s.name, 'role', m.role) order by s.created_at)
                 from school_members m join schools s on s.id = m.school_id
                 where m.profile_id = auth.uid() and m.role = 'school_admin' and m.removed_at is null), '[]'::jsonb)
        end
    );
$$;
grant execute on function am_i_admin() to authenticated;

-- Everything the teacher-admin page needs for ONE school: its teachers (with
-- status, last sign-in, class/student counts, subject access), invite codes,
-- the school's allowed-subject set, and the full subject catalogue. Owner may
-- pass any school; a school_admin is restricted to schools they administer.
create or replace function get_teacher_admin_overview(p_school_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
    if auth.uid() is null then raise exception 'not_authenticated'; end if;
    if not (_is_owner() or is_school_admin(p_school_id)) then raise exception 'not_authorised'; end if;

    select jsonb_build_object(
        'school', (select jsonb_build_object('id', s.id, 'name', s.name, 'status', s.status)
                   from schools s where s.id = p_school_id),
        -- catalogue of every active subject, for rendering grids
        'all_subjects', coalesce((select jsonb_agg(jsonb_build_object(
                            'id', s.id, 'slug', s.slug, 'name', s.name, 'icon', s.icon, 'colour', s.colour)
                            order by s.sort_order) from subjects s where s.active), '[]'::jsonb),
        -- this school's allowed subject ids (empty = unrestricted / all)
        'school_subject_ids', coalesce((select jsonb_agg(ss.subject_id)
                            from school_subjects ss where ss.school_id = p_school_id), '[]'::jsonb),
        'teachers', coalesce((
            select jsonb_agg(jsonb_build_object(
                'profile_id', p.id,
                'username', p.username,
                'email', p.email,
                'role', m.role,
                'is_creator_owner', p.is_owner,
                'status', m.status,
                'suspended_mode', m.suspended_mode,
                'removed_at', m.removed_at,
                'last_sign_in_at', (select u.last_sign_in_at from auth.users u where u.id = p.id),
                'class_count', (select count(distinct ct.class_id)
                                from class_teachers ct where ct.teacher_id = p.id),
                'student_count', (select count(distinct cs.student_id)
                                  from class_teachers ct
                                  join class_students cs on cs.class_id = ct.class_id
                                  where ct.teacher_id = p.id),
                'explicit_subject_ids', coalesce((select jsonb_agg(tsa.subject_id)
                                  from teacher_subject_access tsa where tsa.profile_id = p.id), '[]'::jsonb),
                'effective_subject_ids', coalesce((select jsonb_agg(es.subject_id)
                                  from effective_teacher_subjects(p.id) es), '[]'::jsonb)
            ) order by (m.role = 'school_admin') desc, p.username)
            from school_members m join profiles p on p.id = m.profile_id
            where m.school_id = p_school_id), '[]'::jsonb),
        'codes', coalesce((select jsonb_agg(jsonb_build_object(
                      'code', c.code, 'role', c.role, 'expires_at', c.expires_at,
                      'max_uses', c.max_uses, 'use_count', c.use_count, 'revoked', c.revoked)
                      order by c.created_at desc)
                  from school_invite_codes c where c.school_id = p_school_id), '[]'::jsonb),
        'audit', coalesce((select jsonb_agg(jsonb_build_object(
                      'action', a.action, 'actor', ap.username, 'target', tp.username,
                      'target_email', a.target_email, 'detail', a.detail, 'created_at', a.created_at)
                      order by a.created_at desc)
                  from (select * from admin_audit_log where school_id = p_school_id
                        order by created_at desc limit 200) a
                  left join profiles ap on ap.id = a.actor_id
                  left join profiles tp on tp.id = a.target_profile_id), '[]'::jsonb)
    ) into v;
    return v;
end;
$$;
grant execute on function get_teacher_admin_overview(uuid) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 6 · MANAGEMENT RPCs (non-auth actions; audited)
-- ══════════════════════════════════════════════════════════════
-- Suspend / remove / delete / reset-password all need the Auth admin API and
-- live in Netlify functions. The RPCs here cover the pure-DB actions: subject
-- access and role changes.

-- Owner sets a whole school's allowed-subject set (empty array = unrestricted).
create or replace function set_school_subjects(p_school_id uuid, p_subject_ids uuid[]) returns void
language plpgsql security definer set search_path = public as $$
begin
    if not _is_owner() then raise exception 'owner_only'; end if;
    delete from school_subjects where school_id = p_school_id;
    if p_subject_ids is not null and array_length(p_subject_ids, 1) is not null then
        insert into school_subjects (school_id, subject_id)
            select p_school_id, unnest(p_subject_ids)
        on conflict do nothing;
    end if;
    insert into admin_audit_log (actor_id, school_id, action, detail)
    values (auth.uid(), p_school_id, 'set_school_subjects',
            jsonb_build_object('subject_ids', to_jsonb(coalesce(p_subject_ids, '{}'))));
end;
$$;
grant execute on function set_school_subjects(uuid, uuid[]) to authenticated;

-- School_admin (or owner) sets one teacher's subjects. CLAMPED to the school's
-- allowed set, so a teacher can never be granted beyond it. Empty array = the
-- whole school set (we store no rows).
create or replace function set_teacher_subjects(p_profile uuid, p_subject_ids uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare v_school uuid;
begin
    if not is_school_admin_over(p_profile) then raise exception 'not_authorised'; end if;
    v_school := _school_of(p_profile);
    delete from teacher_subject_access where profile_id = p_profile;
    if p_subject_ids is not null and array_length(p_subject_ids, 1) is not null then
        -- keep only ids that are within the school's effective set
        insert into teacher_subject_access (profile_id, subject_id)
            select p_profile, x.sid
            from unnest(p_subject_ids) as x(sid)
            join subjects s on s.id = x.sid and s.active
            where s.id in (
                select ss.id from subjects ss
                where ss.active and (
                    not exists (select 1 from school_subjects k where k.school_id = v_school)
                    or exists (select 1 from school_subjects k where k.school_id = v_school and k.subject_id = ss.id)
                ))
        on conflict do nothing;
    end if;
    insert into admin_audit_log (actor_id, school_id, action, target_profile_id, detail)
    values (auth.uid(), v_school, 'set_teacher_subjects', p_profile,
            jsonb_build_object('subject_ids', to_jsonb(coalesce(p_subject_ids, '{}'))));
end;
$$;
grant execute on function set_teacher_subjects(uuid, uuid[]) to authenticated;

-- Promote/demote a teacher to/from school_admin. Owner or an admin over them.
-- Can't touch the platform owner; can't demote the last remaining admin.
create or replace function set_teacher_role(p_profile uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
declare v_school uuid; v_admins int;
begin
    if not is_school_admin_over(p_profile) then raise exception 'not_authorised'; end if;
    if p_role not in ('teacher', 'school_admin') then raise exception 'bad_role'; end if;
    if exists (select 1 from profiles where id = p_profile and is_owner) then raise exception 'cannot_change_owner'; end if;
    v_school := _school_of(p_profile);
    if p_role = 'teacher' then
        select count(*) into v_admins from school_members
        where school_id = v_school and role = 'school_admin' and removed_at is null;
        if v_admins <= 1 and exists (select 1 from school_members
            where school_id = v_school and profile_id = p_profile and role = 'school_admin') then
            raise exception 'cannot_demote_last_admin';
        end if;
    end if;
    update school_members set role = p_role where profile_id = p_profile and school_id = v_school;
    insert into admin_audit_log (actor_id, school_id, action, target_profile_id, detail)
    values (auth.uid(), v_school, 'set_teacher_role', p_profile, jsonb_build_object('role', p_role));
end;
$$;
grant execute on function set_teacher_role(uuid, text) to authenticated;
