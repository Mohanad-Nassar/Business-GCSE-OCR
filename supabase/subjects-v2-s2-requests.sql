-- ══════════════════════════════════════════════════════════════
-- SUBJECTS V2 — REQUEST TO EDIT (spec S2). Run AFTER subjects-v2.sql,
-- in the Supabase SQL editor. Safe to re-run.
--
-- A teacher who can only VIEW a shared subject can ask for edit access. Per
-- spec D7 the request is approvable by the subject's OWNER *or* a school_admin
-- over the owner's school; approving writes an 'edit' subject_shares grant to
-- the requester (others keep whatever they had).
--
-- Scope note: 'platform_fork' requests (edit access to a platform subject the
-- school may fork) belong to S4/S5 and are accepted by the schema here but not
-- yet surfaced — this file wires the 'shared' path only.
-- ══════════════════════════════════════════════════════════════

create table if not exists subject_edit_requests (
    id           uuid primary key default gen_random_uuid(),
    subject_id   uuid not null references subjects(id) on delete cascade,
    requested_by uuid not null references profiles(id) on delete cascade,
    scope        text not null default 'shared' check (scope in ('shared','platform_fork')),
    reason       text check (char_length(reason) <= 1000),
    status       text not null default 'pending' check (status in ('pending','approved','denied')),
    resolved_by  uuid references profiles(id) on delete set null,
    resolved_at  timestamptz,
    created_at   timestamptz not null default now()
);
-- One pending request per (subject, requester) — stops queue spam, same trick
-- as topic_access_requests.
create unique index if not exists subject_edit_requests_one_pending
    on subject_edit_requests (subject_id, requested_by) where status = 'pending';
create index if not exists subject_edit_requests_subject_idx on subject_edit_requests (subject_id, status);

alter table subject_edit_requests enable row level security;

-- Requester reads their own requests (status feedback). No direct insert/update
-- policy — all writes go through the RPCs below.
drop policy if exists "ser_requester_select" on subject_edit_requests;
create policy "ser_requester_select" on subject_edit_requests for select using (requested_by = auth.uid());

-- Approver (subject owner OR school_admin over the owner's school) reads them.
drop policy if exists "ser_approver_select" on subject_edit_requests;
create policy "ser_approver_select" on subject_edit_requests for select using (
    _owns_subject(subject_id) or is_school_admin(_subject_owner_school(subject_id))
);

-- ── request_subject_edit() ──
-- Caller must currently be able to VIEW the subject but NOT already edit it.
-- Idempotent: a second call while one is pending returns the existing row.
create or replace function request_subject_edit(p_subject_id uuid, p_reason text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_id uuid;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    if not can_view_subject(p_subject_id) then raise exception 'You do not have access to this subject'; end if;
    if can_edit_subject(p_subject_id) then raise exception 'You already have edit access'; end if;

    select id into v_id from subject_edit_requests
    where subject_id = p_subject_id and requested_by = v_uid and status = 'pending';
    if v_id is not null then
        return jsonb_build_object('id', v_id, 'status', 'pending', 'already', true);
    end if;

    insert into subject_edit_requests (subject_id, requested_by, scope, reason)
    values (p_subject_id, v_uid, 'shared', nullif(left(coalesce(p_reason, ''), 1000), ''))
    returning id into v_id;
    return jsonb_build_object('id', v_id, 'status', 'pending', 'already', false);
end;
$$;
grant execute on function request_subject_edit(uuid, text) to authenticated;

-- ── resolve_subject_edit_request() ── (owner or admin approves/denies)
-- Approving writes the edit grant in the same transaction, so the request
-- status and the actual access can never drift apart.
create or replace function resolve_subject_edit_request(p_request_id uuid, p_approve boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare v_req subject_edit_requests%rowtype;
begin
    select * into v_req from subject_edit_requests where id = p_request_id;
    if not found then raise exception 'Request not found'; end if;
    if not (_owns_subject(v_req.subject_id) or is_school_admin(_subject_owner_school(v_req.subject_id))) then
        raise exception 'not authorised';
    end if;
    if v_req.status <> 'pending' then raise exception 'This request was already resolved'; end if;

    update subject_edit_requests
    set status = case when p_approve then 'approved' else 'denied' end,
        resolved_by = auth.uid(), resolved_at = now()
    where id = p_request_id;

    if p_approve and v_req.scope = 'shared' then
        insert into subject_shares (subject_id, grantee_profile_id, access, shared_by)
        values (v_req.subject_id, v_req.requested_by, 'edit', auth.uid())
        on conflict (subject_id, grantee_profile_id) where grantee_profile_id is not null
        do update set access = 'edit';
    end if;
end;
$$;
grant execute on function resolve_subject_edit_request(uuid, boolean) to authenticated;

-- ── Reads for the UI ──
-- The caller's own requests (the "My requests" status strip).
create or replace function get_my_edit_requests()
returns table (id uuid, subject_id uuid, subject_name text, status text, created_at timestamptz, resolved_at timestamptz)
language sql security definer stable set search_path = public as $$
    select r.id, r.subject_id, s.name, r.status, r.created_at, r.resolved_at
    from subject_edit_requests r
    join subjects s on s.id = r.subject_id
    where r.requested_by = auth.uid()
    order by r.created_at desc;
$$;
grant execute on function get_my_edit_requests() to authenticated;

-- Pending requests the caller may approve (owner of the subject, or admin over
-- the owner's school). Drives the owner panel + the admin Sharing tab.
create or replace function get_incoming_edit_requests()
returns table (id uuid, subject_id uuid, subject_name text, requester_name text, reason text, created_at timestamptz)
language sql security definer stable set search_path = public as $$
    select r.id, r.subject_id, s.name, p.username, r.reason, r.created_at
    from subject_edit_requests r
    join subjects s on s.id = r.subject_id
    left join profiles p on p.id = r.requested_by
    where r.status = 'pending'
      and (_owns_subject(r.subject_id) or is_school_admin(_subject_owner_school(r.subject_id)))
    order by r.created_at desc;
$$;
grant execute on function get_incoming_edit_requests() to authenticated;
