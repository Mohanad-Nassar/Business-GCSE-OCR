-- ══════════════════════════════════════════════════════════════
-- SUBJECTS V2 — EXTERNAL SHARE INVITES (spec S3). Run AFTER subjects-v2.sql,
-- in the Supabase SQL editor. Safe to re-run.
--
-- Sharing OUTSIDE the owner's school is an ADMIN-APPROVED request (spec D5):
-- the owner submits invitee name + email + access + reason; the school_admin
-- sees ALL of that (requester, invitee data, timing, reason) and approves/denies.
-- On approval:
--   • invitee already has a teacher account → an immediate subject_shares row.
--   • new person (spec D6) → a single-use, hashed, ≤72h invite TOKEN. The raw
--     token is returned to the admin ONCE (to send as a signup link). It's
--     consumed at signup by the teacher-signup function via
--     consume_external_share_invite() (service-role only) — that wiring is S3b.
--
-- SECURITY: RPC-only writes; admin scope enforced by is_school_admin(school_id);
-- token stored only as sha256 hash; token table has NO client-facing policy.
-- ══════════════════════════════════════════════════════════════

create table if not exists subject_external_share_requests (
    id            uuid primary key default gen_random_uuid(),
    subject_id    uuid not null references subjects(id) on delete cascade,
    requested_by  uuid not null references profiles(id) on delete cascade,
    school_id     uuid not null references schools(id)  on delete cascade,   -- approver scope
    invitee_name  text not null check (char_length(invitee_name)  between 1 and 120),
    invitee_email text not null check (char_length(invitee_email) between 3 and 200),
    access        text not null default 'view' check (access in ('view','edit')),
    reason        text not null check (char_length(reason) between 1 and 1000),
    status        text not null default 'pending'
                  check (status in ('pending','approved','denied','revoked')),
    resolved_by   uuid references profiles(id) on delete set null,
    resolved_at   timestamptz,
    created_at    timestamptz not null default now()
);
create index if not exists sesr_school_idx  on subject_external_share_requests (school_id, status);
create index if not exists sesr_subject_idx on subject_external_share_requests (subject_id);

-- Single-use, hashed-at-rest signup token for NEW-account invitees.
-- No RLS policy at all → never client-readable (service role bypasses RLS).
create table if not exists external_share_invite_tokens (
    token_hash  text primary key,
    request_id  uuid not null references subject_external_share_requests(id) on delete cascade,
    expires_at  timestamptz not null,
    consumed_at timestamptz
);
alter table external_share_invite_tokens enable row level security;

alter table subject_external_share_requests enable row level security;
-- requester reads own; admin over the request's school reads them. Writes via RPC.
drop policy if exists "sesr_requester_select" on subject_external_share_requests;
create policy "sesr_requester_select" on subject_external_share_requests for select using (requested_by = auth.uid());
drop policy if exists "sesr_admin_select" on subject_external_share_requests;
create policy "sesr_admin_select" on subject_external_share_requests for select
    using (_is_owner() or is_school_admin(school_id));

-- ── request_external_share() ── (owner submits; goes to their school's admin)
create or replace function request_external_share(
    p_subject_id uuid, p_invitee_name text, p_invitee_email text, p_access text, p_reason text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_school uuid; v_id uuid;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;
    if not exists (select 1 from subjects where id = p_subject_id and created_by = v_uid) then
        raise exception 'You can only share subjects you created';
    end if;
    if coalesce(p_access,'') not in ('view','edit') then raise exception 'access must be view or edit'; end if;
    if coalesce(btrim(p_invitee_name),'') = '' or coalesce(btrim(p_invitee_email),'') = ''
       or coalesce(btrim(p_reason),'') = '' then
        raise exception 'Invitee name, email and a reason are all required';
    end if;
    v_school := _school_of(v_uid);
    if v_school is null then raise exception 'You are not in a school yet'; end if;
    insert into subject_external_share_requests
        (subject_id, requested_by, school_id, invitee_name, invitee_email, access, reason)
    values (p_subject_id, v_uid, v_school, btrim(p_invitee_name),
            lower(btrim(p_invitee_email)), p_access, btrim(p_reason))
    returning id into v_id;
    return jsonb_build_object('id', v_id, 'status', 'pending');
end;
$$;
grant execute on function request_external_share(uuid, text, text, text, text) to authenticated;

-- ── resolve_external_share() ── (admin approves/denies; owner-of-platform too)
-- On approve: existing teacher → immediate share; new person → minted token
-- (raw token returned ONCE for the admin to send as a signup link).
create or replace function resolve_external_share(p_request_id uuid, p_approve boolean)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
    v_req      subject_external_share_requests%rowtype;
    v_existing uuid;
    v_token    text;
    v_hash     text;
begin
    select * into v_req from subject_external_share_requests where id = p_request_id;
    if not found then raise exception 'Request not found'; end if;
    if not (_is_owner() or is_school_admin(v_req.school_id)) then raise exception 'not authorised'; end if;
    if v_req.status <> 'pending' then raise exception 'This request was already resolved'; end if;

    update subject_external_share_requests
    set status = case when p_approve then 'approved' else 'denied' end,
        resolved_by = auth.uid(), resolved_at = now()
    where id = p_request_id;

    if not p_approve then return jsonb_build_object('status', 'denied'); end if;

    -- Existing platform teacher with that email → share straight away.
    select id into v_existing from profiles
    where lower(email) = v_req.invitee_email and role = 'teacher';
    if v_existing is not null then
        insert into subject_shares (subject_id, grantee_profile_id, access, shared_by)
        values (v_req.subject_id, v_existing, v_req.access, auth.uid())
        on conflict (subject_id, grantee_profile_id) where grantee_profile_id is not null
        do update set access = excluded.access;
        return jsonb_build_object('status', 'approved', 'mode', 'existing');
    end if;

    -- New person → high-entropy token (≈244 bits), stored as sha256 hash only.
    v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    v_hash  := encode(digest(v_token, 'sha256'), 'hex');
    insert into external_share_invite_tokens (token_hash, request_id, expires_at)
    values (v_hash, p_request_id, now() + interval '72 hours');
    -- Raw token returned ONCE (never stored) — the admin sends it as a link.
    return jsonb_build_object('status', 'approved', 'mode', 'invite', 'token', v_token);
end;
$$;
grant execute on function resolve_external_share(uuid, boolean) to authenticated;

-- ── peek_external_share_invite() ── (service role — validate WITHOUT consuming)
-- The signup function calls this BEFORE creating an account, so a bogus/expired
-- token is rejected up front (no create-then-delete churn). The token is bound
-- to the invitee's email: it only validates for the address it was issued to,
-- so an intercepted link can't be used to make an arbitrary account.
create or replace function peek_external_share_invite(p_token text, p_email text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_tok external_share_invite_tokens%rowtype; v_req subject_external_share_requests%rowtype;
begin
    v_hash := encode(digest(coalesce(p_token,''), 'sha256'), 'hex');
    select * into v_tok from external_share_invite_tokens where token_hash = v_hash;
    if not found then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;
    if v_tok.consumed_at is not null then return jsonb_build_object('ok', false, 'reason', 'used'); end if;
    if v_tok.expires_at < now() then return jsonb_build_object('ok', false, 'reason', 'expired'); end if;
    select * into v_req from subject_external_share_requests where id = v_tok.request_id;
    if not found or v_req.status <> 'approved' then return jsonb_build_object('ok', false, 'reason', 'not_approved'); end if;
    if v_req.invitee_email <> lower(btrim(coalesce(p_email,''))) then
        return jsonb_build_object('ok', false, 'reason', 'email_mismatch');
    end if;
    return jsonb_build_object('ok', true, 'invitee_email', v_req.invitee_email);
end;
$$;
revoke all on function peek_external_share_invite(text, text) from public, anon, authenticated;
grant execute on function peek_external_share_invite(text, text) to service_role;

-- ── consume_external_share_invite() ── (service role only — called at signup, S3b)
-- Single-uses the token and attaches the share. Re-checks everything peek did
-- (incl. the email binding) so it's safe even if called directly.
create or replace function consume_external_share_invite(p_token text, p_new_profile uuid, p_email text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_hash text; v_tok external_share_invite_tokens%rowtype; v_req subject_external_share_requests%rowtype;
begin
    v_hash := encode(digest(coalesce(p_token,''), 'sha256'), 'hex');
    select * into v_tok from external_share_invite_tokens where token_hash = v_hash;
    if not found then return jsonb_build_object('ok', false, 'reason', 'invalid'); end if;
    if v_tok.consumed_at is not null then return jsonb_build_object('ok', false, 'reason', 'used'); end if;
    if v_tok.expires_at < now() then return jsonb_build_object('ok', false, 'reason', 'expired'); end if;
    select * into v_req from subject_external_share_requests where id = v_tok.request_id;
    if not found or v_req.status <> 'approved' then return jsonb_build_object('ok', false, 'reason', 'not_approved'); end if;
    if v_req.invitee_email <> lower(btrim(coalesce(p_email,''))) then
        return jsonb_build_object('ok', false, 'reason', 'email_mismatch');
    end if;

    update external_share_invite_tokens set consumed_at = now() where token_hash = v_hash;
    insert into subject_shares (subject_id, grantee_profile_id, access, shared_by)
    values (v_req.subject_id, p_new_profile, v_req.access, v_req.requested_by)
    on conflict (subject_id, grantee_profile_id) where grantee_profile_id is not null
    do update set access = excluded.access;
    return jsonb_build_object('ok', true, 'subject_id', v_req.subject_id);
end;
$$;
revoke all on function consume_external_share_invite(text, uuid, text) from public, anon, authenticated;
grant execute on function consume_external_share_invite(text, uuid, text) to service_role;

-- ── Reads ──
create or replace function get_incoming_external_requests(p_school_id uuid)
returns table (id uuid, subject_name text, requester_name text, invitee_name text,
               invitee_email text, access text, reason text, status text, created_at timestamptz)
language sql security definer stable set search_path = public as $$
    select r.id, s.name, rq.username, r.invitee_name, r.invitee_email,
           r.access, r.reason, r.status, r.created_at
    from subject_external_share_requests r
    join subjects s on s.id = r.subject_id
    left join profiles rq on rq.id = r.requested_by
    where r.school_id = p_school_id and (_is_owner() or is_school_admin(p_school_id))
    order by (r.status = 'pending') desc, r.created_at desc;
$$;
grant execute on function get_incoming_external_requests(uuid) to authenticated;

create or replace function get_my_external_requests()
returns table (id uuid, subject_name text, invitee_name text, invitee_email text,
               access text, status text, created_at timestamptz)
language sql security definer stable set search_path = public as $$
    select r.id, s.name, r.invitee_name, r.invitee_email, r.access, r.status, r.created_at
    from subject_external_share_requests r
    join subjects s on s.id = r.subject_id
    where r.requested_by = auth.uid()
    order by r.created_at desc;
$$;
grant execute on function get_my_external_requests() to authenticated;
