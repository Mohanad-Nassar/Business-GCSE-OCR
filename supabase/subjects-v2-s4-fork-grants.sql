-- ══════════════════════════════════════════════════════════════
-- SUBJECTS V2 — PLATFORM-SUBJECT EDIT GRANTS · control plane (spec S4)
-- Run AFTER subjects-v2.sql AND subjects-v2-s2-requests.sql, in the Supabase
-- SQL editor. Safe to re-run.
--
-- IMPORTANT run-order note: subjects-v2-s2-requests.sql defines
-- request_subject_edit() / resolve_subject_edit_request() for the 'shared' path
-- only. This file REPLACES both to also wire the 'platform_fork' path, so if you
-- ever re-run subjects-v2-s2-requests.sql, re-run THIS file afterwards to
-- restore the platform-fork behaviour.
--
-- Source of truth: docs/SUBJECTS-V2-SPEC.md (§5.1, §6, §7.4, D3). This is the
-- GRANT CONTROL PLANE ONLY — it decides *who may edit* a platform subject.
-- The actual override editor / fork engine is S5 and is NOT built here.
--
-- WHAT THIS ADDS (mirrors school-admin.sql's two-tier *use*-access shapes)
--   • subject_school_edit_grants — the OWNER grants a SCHOOL the right to fork
--     and edit a platform subject. Owner-managed only.
--   • teacher_subject_edit_access — a SCHOOL_ADMIN grants a TEACHER edit rights,
--     CLAMPED to the school's grant set. Admin-managed only.
--   • can_edit_platform_subject() — the central guard. True iff owner, OR the
--     caller holds a teacher grant AND the caller's school holds the matching
--     school grant. The AND is the clamp: revoking the school grant instantly
--     voids every teacher grant beneath it, without touching the teacher rows.
--   • set_school_edit_subjects() / set_teacher_edit_subjects() — the guarded,
--     audited RPCs that are the ONLY way to write the two tables.
--   • request_subject_edit() / resolve_subject_edit_request() — extended so a
--     not-yet-granted teacher can request platform-fork edit access, and an
--     owner or school_admin can approve it (writing a clamped teacher grant).
--   • get_school_edit_grants() / get_my_platform_edit_status() — read RPCs for
--     the admin grids and the teacher Platform tab.
--
-- SECURITY MODEL (auth-authz / secure-coding skills)
--   • Role/ownership resolved server-side from auth.uid() only.
--   • NO client insert/update/delete policy on either grant table — writes go
--     only through the SECURITY DEFINER RPCs, which re-check the guard and write
--     the audit row in the same transaction (state + audit can't drift).
--   • Deny by default: unlike *use*-access (empty = unrestricted), an empty
--     school edit-grant set means NO forking at all — there is no "unrestricted"
--     default for editing.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · TABLES
-- ══════════════════════════════════════════════════════════════

-- ── Owner grants a SCHOOL the right to fork/edit a platform subject ──
create table if not exists subject_school_edit_grants (
    school_id  uuid not null references schools(id)  on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,  -- platform (created_by is null)
    granted_by uuid references profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    primary key (school_id, subject_id)
);

-- ── School_admin grants a TEACHER edit rights, CLAMPED to the school's set ──
create table if not exists teacher_subject_edit_access (
    profile_id uuid not null references profiles(id) on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,
    granted_by uuid references profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    primary key (profile_id, subject_id)
);

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · RLS  (reads only — all writes go through the RPCs)
-- ══════════════════════════════════════════════════════════════
alter table subject_school_edit_grants  enable row level security;
alter table teacher_subject_edit_access enable row level security;

-- subject_school_edit_grants — owner manages (read/write); a member of the
-- school may read (to know its set). A direct owner ALL policy is harmless and
-- convenient; teachers/admins never write it directly.
drop policy if exists "sseg_owner_all" on subject_school_edit_grants;
create policy "sseg_owner_all" on subject_school_edit_grants for all
    using (_is_owner()) with check (_is_owner());
drop policy if exists "sseg_member_read" on subject_school_edit_grants;
create policy "sseg_member_read" on subject_school_edit_grants for select using (
    exists (select 1 from school_members m
            where m.school_id = subject_school_edit_grants.school_id and m.profile_id = auth.uid()));

-- teacher_subject_edit_access — a teacher reads their own; an admin over that
-- teacher reads it (drives the admin grid). Writes via set_teacher_edit_subjects
-- only — NO client insert/update/delete policy.
drop policy if exists "tsea_self_read" on teacher_subject_edit_access;
create policy "tsea_self_read" on teacher_subject_edit_access for select using (profile_id = auth.uid());
drop policy if exists "tsea_admin_read" on teacher_subject_edit_access;
create policy "tsea_admin_read" on teacher_subject_edit_access for select using (is_school_admin_over(profile_id));

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · CENTRAL GUARD
-- ══════════════════════════════════════════════════════════════

-- Can the caller EDIT this platform subject's school override? True iff:
--   • the caller is the platform owner, OR
--   • the subject is a PLATFORM subject (created_by is null) AND the caller
--     holds a teacher_subject_edit_access row for it AND the caller's school
--     holds a subject_school_edit_grants row for it.
-- The final AND is the CLAMP — a stale teacher grant is void the instant the
-- school grant is revoked, without ever touching the teacher rows.
create or replace function can_edit_platform_subject(p_subject_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select _is_owner()
        or exists (
            select 1
            from subjects s
            join teacher_subject_edit_access tea
              on tea.subject_id = s.id and tea.profile_id = auth.uid()
            join subject_school_edit_grants g
              on g.subject_id = s.id and g.school_id = _school_of(auth.uid())
            where s.id = p_subject_id and s.created_by is null
        );
$$;
grant execute on function can_edit_platform_subject(uuid) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 4 · GRANT-SETTING RPCs  (owner / admin only; audited)
-- ══════════════════════════════════════════════════════════════

-- Owner sets which PLATFORM subjects a whole school may fork/edit. Delete-then-
-- insert, same shape as set_school_subjects. ONLY platform subjects are accepted
-- (join on created_by is null) — teacher subjects passed in are silently
-- dropped. Empty array = the school may edit nothing (deny by default).
create or replace function set_school_edit_subjects(p_school_id uuid, p_subject_ids uuid[]) returns void
language plpgsql security definer set search_path = public as $$
begin
    if not _is_owner() then raise exception 'owner_only'; end if;
    delete from subject_school_edit_grants where school_id = p_school_id;
    if p_subject_ids is not null and array_length(p_subject_ids, 1) is not null then
        insert into subject_school_edit_grants (school_id, subject_id, granted_by)
            select p_school_id, s.id, auth.uid()
            from unnest(p_subject_ids) as x(sid)
            join subjects s on s.id = x.sid and s.created_by is null and s.active
        on conflict do nothing;
    end if;
    insert into admin_audit_log (actor_id, school_id, action, detail)
    values (auth.uid(), p_school_id, 'set_school_edit_subjects',
            jsonb_build_object('subject_ids', to_jsonb(coalesce(p_subject_ids, '{}'))));
end;
$$;
grant execute on function set_school_edit_subjects(uuid, uuid[]) to authenticated;

-- School_admin (or owner) sets one teacher's editable subjects. CLAMPED to the
-- teacher's school's subject_school_edit_grants set — a teacher can never be
-- granted beyond it. There is NO unrestricted default: an empty school grant set
-- means the teacher gets nothing. Empty array = remove all the teacher's grants.
create or replace function set_teacher_edit_subjects(p_profile uuid, p_subject_ids uuid[]) returns void
language plpgsql security definer set search_path = public as $$
declare v_school uuid;
begin
    if not is_school_admin_over(p_profile) then raise exception 'not_authorised'; end if;
    v_school := _school_of(p_profile);
    delete from teacher_subject_edit_access where profile_id = p_profile;
    if p_subject_ids is not null and array_length(p_subject_ids, 1) is not null then
        -- keep only ids the school actually holds an edit grant for (the clamp)
        insert into teacher_subject_edit_access (profile_id, subject_id, granted_by)
            select p_profile, x.sid, auth.uid()
            from unnest(p_subject_ids) as x(sid)
            where exists (
                select 1 from subject_school_edit_grants g
                where g.school_id = v_school and g.subject_id = x.sid
            )
        on conflict do nothing;
    end if;
    insert into admin_audit_log (actor_id, school_id, action, target_profile_id, detail)
    values (auth.uid(), v_school, 'set_teacher_edit_subjects', p_profile,
            jsonb_build_object('subject_ids', to_jsonb(coalesce(p_subject_ids, '{}'))));
end;
$$;
grant execute on function set_teacher_edit_subjects(uuid, uuid[]) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 5 · REQUEST-TO-EDIT — extend for the platform-fork path (spec S2/S4)
-- ══════════════════════════════════════════════════════════════
-- Both functions below are copied from subjects-v2-s2-requests.sql and extended.
-- Re-running that file reverts them to the 'shared'-only versions — re-run THIS
-- file after it (see the run-order note at the top).

-- ── request_subject_edit() ──
-- For a PLATFORM subject (created_by is null): scope = 'platform_fork'; the
-- precondition is that the subject is active, the caller is a teacher, the
-- caller's school holds a subject_school_edit_grants row for it, and the caller
-- is NOT already granted. For a TEACHER subject: the original 'shared' behaviour
-- (can_view but not can_edit) is preserved verbatim.
create or replace function request_subject_edit(p_subject_id uuid, p_reason text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid         uuid := auth.uid();
    v_id          uuid;
    v_is_platform boolean;
    v_scope       text;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select (created_by is null) into v_is_platform from subjects where id = p_subject_id;
    if v_is_platform is null then raise exception 'Subject not found'; end if;

    if v_is_platform then
        v_scope := 'platform_fork';
        -- entitlement: active platform subject + caller is a teacher + the
        -- caller's school may fork it + not already granted.
        if not exists (select 1 from subjects s where s.id = p_subject_id and s.active) then
            raise exception 'You do not have access to this subject';
        end if;
        if not exists (select 1 from profiles p where p.id = v_uid and p.role = 'teacher') then
            raise exception 'You do not have access to this subject';
        end if;
        if not exists (
            select 1 from subject_school_edit_grants g
            where g.subject_id = p_subject_id and g.school_id = _school_of(v_uid)
        ) then
            raise exception 'Your school cannot edit this subject';
        end if;
        if can_edit_platform_subject(p_subject_id) then raise exception 'You already have edit access'; end if;
    else
        v_scope := 'shared';
        if not can_view_subject(p_subject_id) then raise exception 'You do not have access to this subject'; end if;
        if can_edit_subject(p_subject_id) then raise exception 'You already have edit access'; end if;
    end if;

    -- Idempotent: a second call while one is pending returns the existing row.
    select id into v_id from subject_edit_requests
    where subject_id = p_subject_id and requested_by = v_uid and status = 'pending';
    if v_id is not null then
        return jsonb_build_object('id', v_id, 'status', 'pending', 'already', true);
    end if;

    insert into subject_edit_requests (subject_id, requested_by, scope, reason)
    values (p_subject_id, v_uid, v_scope, nullif(left(coalesce(p_reason, ''), 1000), ''))
    returning id into v_id;
    return jsonb_build_object('id', v_id, 'status', 'pending', 'already', false);
end;
$$;
grant execute on function request_subject_edit(uuid, text) to authenticated;

-- ── resolve_subject_edit_request() ── (owner or admin approves/denies)
-- 'shared'        → approvable by the subject's OWNER or a school_admin over the
--                   owner's school; approval writes an 'edit' subject_shares grant.
-- 'platform_fork' → approvable by the OWNER or a school_admin over the REQUESTER
--                   (platform subjects have no owner-teacher, so _owns_subject
--                   cannot apply); approval writes a teacher_subject_edit_access
--                   row — but ONLY if the requester's school still holds the
--                   school grant, so an admin can't approve past the owner's grant.
create or replace function resolve_subject_edit_request(p_request_id uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
    v_req    subject_edit_requests%rowtype;
    v_school uuid;
begin
    select * into v_req from subject_edit_requests where id = p_request_id;
    if not found then raise exception 'Request not found'; end if;

    if v_req.scope = 'platform_fork' then
        if not (_is_owner() or is_school_admin_over(v_req.requested_by)) then
            raise exception 'not authorised';
        end if;
    else
        if not (_owns_subject(v_req.subject_id) or is_school_admin(_subject_owner_school(v_req.subject_id))) then
            raise exception 'not authorised';
        end if;
    end if;

    if v_req.status <> 'pending' then raise exception 'This request was already resolved'; end if;
    -- A requester may never approve their own edit request, even if they are also
    -- an owner/school_admin who would otherwise pass the authorisation block above.
    if v_req.requested_by = auth.uid() then raise exception 'You cannot approve your own request'; end if;

    -- For platform_fork approvals, re-check the owner's school grant BEFORE
    -- committing anything — an admin must not approve past the school grant.
    if p_approve and v_req.scope = 'platform_fork' then
        v_school := _school_of(v_req.requested_by);
        if not exists (
            select 1 from subject_school_edit_grants g
            where g.school_id = v_school and g.subject_id = v_req.subject_id
        ) then
            raise exception 'school_not_granted';
        end if;
    end if;

    update subject_edit_requests
    set status = case when p_approve then 'approved' else 'denied' end,
        resolved_by = auth.uid(), resolved_at = now()
    where id = p_request_id;

    if p_approve and v_req.scope = 'shared' then
        insert into subject_shares (subject_id, grantee_profile_id, access, shared_by)
        values (v_req.subject_id, v_req.requested_by, 'edit', auth.uid())
        on conflict (subject_id, grantee_profile_id) where grantee_profile_id is not null
        do update set access = 'edit';
    elsif p_approve and v_req.scope = 'platform_fork' then
        insert into teacher_subject_edit_access (profile_id, subject_id, granted_by)
        values (v_req.requested_by, v_req.subject_id, auth.uid())
        on conflict do nothing;
    end if;
end;
$$;
grant execute on function resolve_subject_edit_request(uuid, boolean) to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 6 · READ RPCs (admin grids + teacher Platform tab)
-- ══════════════════════════════════════════════════════════════

-- The subject ids a school may fork/edit (for the owner + admin grids). Owner or
-- that school's admin only; fails closed to an empty list for anyone else.
create or replace function get_school_edit_grants(p_school_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
    select case when (_is_owner() or is_school_admin(p_school_id))
        then coalesce((select jsonb_agg(g.subject_id)
                       from subject_school_edit_grants g where g.school_id = p_school_id), '[]'::jsonb)
        else '[]'::jsonb
    end;
$$;
grant execute on function get_school_edit_grants(uuid) to authenticated;

-- ── get_incoming_edit_requests() ── extended for platform_fork (replaces the
-- subjects-v2-s2-requests.sql version — same re-run note as the functions above).
-- The S2 version's approver filter (_owns_subject OR admin-over-the-owner's-
-- school) can NEVER match a platform subject (created_by is null → both false),
-- so platform-fork requests would sit invisible in every queue. This version
-- adds: scope='platform_fork' rows are visible to the OWNER and to a
-- school_admin over the REQUESTER — exactly the set resolve_subject_edit_request
-- accepts as approvers.
create or replace function get_incoming_edit_requests()
returns table (id uuid, subject_id uuid, subject_name text, requester_name text, reason text, created_at timestamptz)
language sql security definer stable set search_path = public as $$
    select r.id, r.subject_id, s.name, p.username, r.reason, r.created_at
    from subject_edit_requests r
    join subjects s on s.id = r.subject_id
    left join profiles p on p.id = r.requested_by
    where r.status = 'pending'
      and (
        (r.scope = 'shared' and
            (_owns_subject(r.subject_id) or is_school_admin(_subject_owner_school(r.subject_id))))
        or
        (r.scope = 'platform_fork' and
            (_is_owner() or is_school_admin_over(r.requested_by)))
      )
    order by r.created_at desc;
$$;
grant execute on function get_incoming_edit_requests() to authenticated;

-- The caller's platform-edit status across every active platform subject for
-- their school — drives the teacher Platform tab (editable / request / nothing).
create or replace function get_my_platform_edit_status()
returns table (subject_id uuid, school_granted boolean, teacher_granted boolean, can_edit boolean)
language sql stable security definer set search_path = public as $$
    select s.id,
           exists (select 1 from subject_school_edit_grants g
                   where g.subject_id = s.id and g.school_id = _school_of(auth.uid())) as school_granted,
           exists (select 1 from teacher_subject_edit_access tea
                   where tea.subject_id = s.id and tea.profile_id = auth.uid())        as teacher_granted,
           can_edit_platform_subject(s.id)                                             as can_edit
    from subjects s
    where s.created_by is null and s.active;
$$;
grant execute on function get_my_platform_edit_status() to authenticated;
