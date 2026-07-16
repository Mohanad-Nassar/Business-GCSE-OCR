-- ══════════════════════════════════════════════════════════════
-- SCHOOLS (Phase B — STRUCTURE ONLY, NO BILLING) — run AFTER schema.sql,
-- in the Supabase SQL editor. Safe to re-run.
--
-- Adds the school model the master plan's Phase B is built on, but WITHOUT any
-- subscriptions / credits / Stripe — this is the "structure without payment"
-- slice. Nothing here gates content: billing_enforced stays false and
-- has_subject_access() is untouched, so access is exactly as it is today
-- (teacher/owner see everything; students via their class). It just lets
-- teachers belong to a school and sign up with a PER-SCHOOL invite code
-- instead of one shared secret.
--
--   schools            — one row per school (you run several from one platform)
--   school_members     — which teacher/school_admin belongs to which school
--   school_invite_codes— per-school signup codes, optional expiry / use cap
--   profiles.school_id — denormalised convenience (school_members is the truth)
--
-- OWNER BOOTSTRAP (run once so the owner-only management RPCs work — the seed at
-- the foot of this file does NOT need it, as SQL-editor statements run as table
-- owner and bypass the is_owner guard):
--   update profiles set is_owner = true where email = 'you@your-school.org';
-- NOTE: teacher accounts created before 2026-07-11 (WP-A1) have a NULL
-- profiles.email, so the line above matches 0 rows for them. Set by id instead:
--   update profiles set is_owner = true
--   where id = (select id from auth.users where email = 'you@your-school.org');
-- (auth.users always has the email.) This seed does not touch is_owner.
-- ══════════════════════════════════════════════════════════════

-- ── profiles.school_id ──
alter table profiles add column if not exists school_id uuid;

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · TABLES
-- ══════════════════════════════════════════════════════════════

create table if not exists schools (
    id            uuid primary key default gen_random_uuid(),
    name          text not null,
    contact_email text,
    status        text not null default 'active' check (status in ('active', 'suspended')),
    created_at    timestamptz not null default now()
);

create table if not exists school_members (
    school_id  uuid not null references schools(id) on delete cascade,
    profile_id uuid not null references profiles(id) on delete cascade,
    role       text not null default 'teacher' check (role in ('teacher', 'school_admin')),
    created_at timestamptz not null default now(),
    primary key (school_id, profile_id)
);

-- Per-school signup codes. expires_at null = never; max_uses null = unlimited.
create table if not exists school_invite_codes (
    code       text primary key,
    school_id  uuid not null references schools(id) on delete cascade,
    role       text not null default 'teacher' check (role in ('teacher', 'school_admin')),
    expires_at timestamptz,
    max_uses   int,
    use_count  int not null default 0,
    revoked    boolean not null default false,
    created_at timestamptz not null default now()
);
create index if not exists school_invite_codes_school_idx on school_invite_codes (school_id);

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · HELPERS + RLS
-- ══════════════════════════════════════════════════════════════

-- Is the caller the platform owner? (is_owner lives on profiles since WP-A1.)
create or replace function _is_owner() returns boolean
language sql security definer stable set search_path = public as $$
    select exists (select 1 from profiles where id = auth.uid() and is_owner);
$$;
grant execute on function _is_owner() to authenticated;

-- Is the caller a school_admin of this school?
create or replace function is_school_admin(p_school_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
    select exists (select 1 from school_members m
        where m.school_id = p_school_id and m.profile_id = auth.uid() and m.role = 'school_admin');
$$;
grant execute on function is_school_admin(uuid) to authenticated;

alter table schools             enable row level security;
alter table school_members      enable row level security;
alter table school_invite_codes enable row level security;

-- schools — owner manages all; a member can read their own school.
drop policy if exists "schools_owner_all" on schools;
create policy "schools_owner_all" on schools for all using (_is_owner()) with check (_is_owner());
drop policy if exists "schools_member_select" on schools;
create policy "schools_member_select" on schools for select using (
    exists (select 1 from school_members m where m.school_id = schools.id and m.profile_id = auth.uid()));

-- school_members — owner manages all; a member can read their own membership.
-- (No self-insert: membership is set by the signup function / owner RPCs only.)
drop policy if exists "school_members_owner_all" on school_members;
create policy "school_members_owner_all" on school_members for all using (_is_owner()) with check (_is_owner());
drop policy if exists "school_members_self_select" on school_members;
create policy "school_members_self_select" on school_members for select using (profile_id = auth.uid());

-- school_invite_codes — owner + that school's school_admin manage; nobody else
-- reads them (the signup function validates via the service role, bypassing RLS).
drop policy if exists "school_invite_codes_owner_all" on school_invite_codes;
create policy "school_invite_codes_owner_all" on school_invite_codes for all using (_is_owner()) with check (_is_owner());
drop policy if exists "school_invite_codes_admin_all" on school_invite_codes;
create policy "school_invite_codes_admin_all" on school_invite_codes for all
    using (is_school_admin(school_id)) with check (is_school_admin(school_id));

-- ══════════════════════════════════════════════════════════════
-- SECTION 3 · PRIVILEGE-GUARD UPDATE
-- ══════════════════════════════════════════════════════════════
-- Extends schema.sql's profiles guard to ALSO pin school_id, so a teacher can't
-- move themselves between schools by editing their own row — while EXEMPTING the
-- owner (who legitimately reassigns teachers via the RPCs below) and trusted
-- service-role / SQL-editor contexts (null auth.uid()). Mirrors the definition
-- in schema.sql; re-running either file is safe.
create or replace function _profiles_block_privilege_change() returns trigger
language plpgsql set search_path = public as $$
begin
    -- Trusted contexts (service role / SQL editor / trigger provisioning) have a
    -- null auth.uid(); the owner is trusted to reassign schools/roles.
    if auth.uid() is null or exists (select 1 from profiles where id = auth.uid() and is_owner) then
        return new;
    end if;
    if new.role         is distinct from old.role
       or new.account_type is distinct from old.account_type
       or new.is_owner     is distinct from old.is_owner
       or new.school_id    is distinct from old.school_id then
        raise exception 'Not allowed to change role, account_type, is_owner or school_id';
    end if;
    return new;
end;
$$;

-- ══════════════════════════════════════════════════════════════
-- SECTION 4 · SIGNUP INVITE CONSUMPTION (service role only)
-- ══════════════════════════════════════════════════════════════
-- Atomically validate + count one use of a school invite code, returning the
-- school it belongs to (null = no valid code). The single UPDATE locks the row,
-- so concurrent signups on a capped code can't over-redeem it. Callable ONLY by
-- the service role (the teacher-signup function) — never by end users, so a
-- normal account can't burn codes.
create or replace function consume_school_invite(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_school uuid;
begin
    update school_invite_codes
       set use_count = use_count + 1
     where code = p_code and not revoked
       and (expires_at is null or expires_at > now())
       and (max_uses is null or use_count < max_uses)
    returning school_id into v_school;
    return v_school;
end;
$$;
revoke all on function consume_school_invite(text) from public;
grant execute on function consume_school_invite(text) to service_role;

-- Give a use back if the signup fails downstream (e.g. duplicate email on a
-- single-use code), so a genuine retry isn't blocked.
create or replace function release_school_invite(p_code text) returns void
language sql security definer set search_path = public as $$
    update school_invite_codes set use_count = greatest(use_count - 1, 0) where code = p_code;
$$;
revoke all on function release_school_invite(text) from public;
grant execute on function release_school_invite(text) to service_role;

-- ══════════════════════════════════════════════════════════════
-- SECTION 5 · OWNER / SCHOOL-ADMIN MANAGEMENT RPCs
-- ══════════════════════════════════════════════════════════════
-- Enough to run the school model from the SQL editor (or a future /admin page)
-- with no billing UI: create a school, mint / revoke its codes, attach a teacher.

create or replace function create_school(p_name text, p_contact_email text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
    if not _is_owner() then raise exception 'owner only'; end if;
    insert into schools (name, contact_email)
    values (coalesce(nullif(trim(p_name), ''), 'New School'), p_contact_email)
    returning id into v_id;
    return v_id;
end;
$$;
grant execute on function create_school(text, text) to authenticated;

create or replace function create_school_invite_code(
    p_school_id uuid, p_code text, p_expires_at timestamptz default null,
    p_max_uses int default null, p_role text default 'teacher') returns text
language plpgsql security definer set search_path = public as $$
begin
    if not (_is_owner() or is_school_admin(p_school_id)) then raise exception 'not authorised'; end if;
    if coalesce(nullif(trim(p_code), ''), '') = '' then raise exception 'code required'; end if;
    insert into school_invite_codes (code, school_id, role, expires_at, max_uses)
    values (trim(p_code), p_school_id, coalesce(p_role, 'teacher'), p_expires_at, p_max_uses);
    return trim(p_code);
end;
$$;
grant execute on function create_school_invite_code(uuid, text, timestamptz, int, text) to authenticated;

create or replace function revoke_school_invite_code(p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare v_school uuid;
begin
    select school_id into v_school from school_invite_codes where code = p_code;
    if v_school is null then return; end if;
    if not (_is_owner() or is_school_admin(v_school)) then raise exception 'not authorised'; end if;
    update school_invite_codes set revoked = true where code = p_code;
end;
$$;
grant execute on function revoke_school_invite_code(text) to authenticated;

-- Attach an EXISTING teacher (by email) to a school. Their profiles.email is set
-- by the WP-A1 signup trigger, so teachers who signed up after 2026-07-11 are
-- findable; older ones are covered by the seed below.
create or replace function attach_teacher_to_school(p_school_id uuid, p_email text, p_role text default 'teacher') returns void
language plpgsql security definer set search_path = public as $$
declare v_pid uuid;
begin
    if not (_is_owner() or is_school_admin(p_school_id)) then raise exception 'not authorised'; end if;
    select id into v_pid from profiles
    where lower(email) = lower(trim(p_email)) and role = 'teacher';
    if v_pid is null then raise exception 'no teacher account found with that email'; end if;
    update profiles set school_id = p_school_id where id = v_pid;
    insert into school_members (school_id, profile_id, role)
    values (p_school_id, v_pid, coalesce(p_role, 'teacher'))
    on conflict (school_id, profile_id) do update set role = excluded.role;
end;
$$;
grant execute on function attach_teacher_to_school(uuid, text, text) to authenticated;

-- One call that paints the whole owner admin page: every school with its
-- members (usernames + emails — profiles RLS otherwise hides other teachers, so
-- this security-definer read is the controlled way to list them) and its invite
-- codes. Owner-only.
create or replace function get_school_admin_overview() returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare v jsonb;
begin
    if not _is_owner() then raise exception 'owner only'; end if;
    select coalesce(jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'contact_email', s.contact_email, 'status', s.status,
        'members', (select coalesce(jsonb_agg(jsonb_build_object(
                        'profile_id', p.id, 'username', p.username, 'email', p.email, 'role', m.role)
                        order by (m.role = 'school_admin') desc, p.username), '[]'::jsonb)
                    from school_members m join profiles p on p.id = m.profile_id
                    where m.school_id = s.id),
        'codes', (select coalesce(jsonb_agg(jsonb_build_object(
                      'code', c.code, 'role', c.role, 'expires_at', c.expires_at,
                      'max_uses', c.max_uses, 'use_count', c.use_count, 'revoked', c.revoked)
                      order by c.created_at desc), '[]'::jsonb)
                  from school_invite_codes c where c.school_id = s.id)
    ) order by s.created_at), '[]'::jsonb)
    into v from schools s;
    return v;
end;
$$;
grant execute on function get_school_admin_overview() to authenticated;

-- ══════════════════════════════════════════════════════════════
-- SECTION 7 · SEED — your first school + migrate existing teachers & code
-- ══════════════════════════════════════════════════════════════
-- Idempotent. Creates one default school if none exists, attaches every current
-- teacher to it, and copies any legacy shared teacher_invite_codes onto it as
-- unlimited-use school codes so signups keep working through the transition.
-- Rename it afterwards:  update schools set name = 'Your School Name';
do $$
declare v_school uuid;
begin
    select id into v_school from schools order by created_at asc limit 1;
    if v_school is null then
        insert into schools (name) values ('My School') returning id into v_school;
    end if;

    update profiles set school_id = v_school where role = 'teacher' and school_id is null;

    insert into school_members (school_id, profile_id, role)
        select v_school, id, 'teacher' from profiles where role = 'teacher'
    on conflict (school_id, profile_id) do nothing;

    insert into school_invite_codes (code, school_id, role, max_uses)
        select code, v_school, 'teacher', null from teacher_invite_codes
    on conflict (code) do nothing;
end $$;
