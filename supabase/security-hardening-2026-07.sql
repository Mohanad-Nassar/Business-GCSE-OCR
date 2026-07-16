-- ══════════════════════════════════════════════════════════════
-- SECURITY HARDENING — 2026-07 audit follow-ups.
--
-- RUN ORDER: run this AFTER all of the following are already applied, in the
-- Supabase SQL editor:
--   • supabase/schools.sql
--   • supabase/school-admin.sql
--   • supabase/teacher-subjects.sql
--   • supabase/subjects-v2.sql
--   • supabase/subjects-v2-s2-requests.sql
--   • supabase/subjects-v2-s3-external.sql
-- Safe to re-run (every statement is create-or-replace / drop-if-exists).
--
-- IMPORTANT: this file REPLACES functions/policies those files define. If ANY
-- of the files above is ever re-run, re-run THIS file afterwards so these
-- hardened definitions win again.
--
-- Contents:
--   (a) is_school_admin  — honour school_members.removed_at (stops a removed
--       admin retaining admin power through every consumer: share policies,
--       revoke_share, resolve_* functions, S4 grants).
--   (b) has_subject_access — scope teacher-authored PRIVATE subjects with
--       can_view_subject instead of the "every active subject" teacher default.
--   (c) custom_topics draft leak — enrolled students must not preview DRAFT
--       topics; only share grantees may. Students keep published-only access.
--   (d) resolve_external_share — a requester cannot approve their own request.
--   (e) consume_external_share_invite — atomic single-use token claim.
-- ══════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- (a) is_school_admin — removed_at gap
-- Body copied from supabase/schools.sql with `and m.removed_at is null` added.
-- Same grant posture as schools.sql (execute to authenticated).
-- ──────────────────────────────────────────────────────────────
create or replace function is_school_admin(p_school_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (select 1 from school_members m
        where m.school_id = p_school_id and m.profile_id = auth.uid() and m.role = 'school_admin'
          and m.removed_at is null);
$$;
grant execute on function is_school_admin(uuid) to authenticated;

-- ──────────────────────────────────────────────────────────────
-- (b) has_subject_access — private-subject scoping
-- Body copied from supabase/school-admin.sql. ONLY the teacher branch changes:
--   • platform subject (created_by is null) → effective_teacher_subjects, exactly
--     as before (byte-identical behaviour).
--   • teacher-authored subject (created_by is not null) → can_view_subject(s.id),
--     but ONLY when p_profile = auth.uid() (can_view_subject reads auth.uid()
--     internally). A service context passing a DIFFERENT uid is DENIED foreign
--     teacher-authored subjects (fail closed).
-- Owner and student branches are byte-identical. Grant posture preserved exactly:
-- revoked from public/anon/authenticated (called only by definer functions).
-- ──────────────────────────────────────────────────────────────
create or replace function has_subject_access(p_profile uuid, p_subject text)
returns boolean
language sql stable security definer set search_path = public as $$
    select
        -- owner: every subject
        exists (select 1 from profiles p where p.id = p_profile and p.is_owner)
        -- teacher: platform subjects via their effective set; teacher-authored
        -- (private) subjects via can_view_subject — and only when p_profile is
        -- the live caller, else foreign teacher-authored subjects are denied.
        or exists (
            select 1
            from profiles p
            join subjects s on s.slug = p_subject and s.active
            where p.id = p_profile and p.role = 'teacher'
              and (
                    (s.created_by is null
                       and s.id in (select subject_id from effective_teacher_subjects(p_profile)))
                 or (s.created_by is not null
                       and p_profile = auth.uid()
                       and can_view_subject(s.id))
              )
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

-- ──────────────────────────────────────────────────────────────
-- (c) custom_topics draft leak
-- The subjects-v2.sql "custom_topics_viewer_select" policy used can_view_subject,
-- which includes enrolled_in_subject — so enrolled STUDENTS could read DRAFT
-- topics. Replace it with a share-grantee-only check. Enrolled students remain
-- covered ONLY by teacher-subjects.sql's published-only
-- "custom_topics_student_select" policy (untouched). The subjects-v2.sql
-- editor-ALL policy ("custom_topics_editor_all") is also untouched.
-- ──────────────────────────────────────────────────────────────
create or replace function has_subject_share(p_subject_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (
        select 1 from subject_shares sh
        where sh.subject_id = p_subject_id
          and ( sh.grantee_profile_id = auth.uid()
             or (sh.grantee_school_id is not null and sh.grantee_school_id = _school_of(auth.uid())) )
    );
$$;
grant execute on function has_subject_share(uuid) to authenticated;

drop policy if exists "custom_topics_viewer_select" on custom_topics;
create policy "custom_topics_viewer_select" on custom_topics for select
    using (has_subject_share(custom_topics.subject_id));

-- ──────────────────────────────────────────────────────────────
-- (d) resolve_external_share — self-approval guard
-- Body copied from supabase/subjects-v2-s3-external.sql verbatim, with a
-- requester-cannot-self-approve check inserted right after the not-authorised
-- check. search_path (public, extensions) and grant preserved exactly.
-- ──────────────────────────────────────────────────────────────
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
    if v_req.requested_by = auth.uid() then raise exception 'You cannot approve your own request'; end if;
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

-- ──────────────────────────────────────────────────────────────
-- (e) consume_external_share_invite — atomic single-use claim
-- Body copied from supabase/subjects-v2-s3-external.sql. The initial SELECT +
-- distinct invalid/expired/not_approved/email_mismatch reasons are kept (incl.
-- the early consumed_at fast-path). The bare UPDATE is replaced with an atomic
-- claim (WHERE consumed_at is null + NOT FOUND → 'used') so two concurrent
-- signups can never both consume the same token. service_role-only grant
-- preserved exactly.
-- ──────────────────────────────────────────────────────────────
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

    -- Atomic claim: only the first caller flips consumed_at; a racing second
    -- caller matches zero rows and is told the token is already used.
    update external_share_invite_tokens set consumed_at = now()
    where token_hash = v_hash and consumed_at is null;
    if not found then return jsonb_build_object('ok', false, 'reason', 'used'); end if;

    insert into subject_shares (subject_id, grantee_profile_id, access, shared_by)
    values (v_req.subject_id, p_new_profile, v_req.access, v_req.requested_by)
    on conflict (subject_id, grantee_profile_id) where grantee_profile_id is not null
    do update set access = excluded.access;
    return jsonb_build_object('ok', true, 'subject_id', v_req.subject_id);
end;
$$;
revoke all on function consume_external_share_invite(text, uuid, text) from public, anon, authenticated;
grant execute on function consume_external_share_invite(text, uuid, text) to service_role;
