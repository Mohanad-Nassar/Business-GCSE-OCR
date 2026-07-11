-- ══════════════════════════════════════════════════════════════
-- CLASS JOIN CODES (WP-A2, 2026-07-11) — run AFTER schema.sql (needs
-- classes / class_students / profiles / subjects / is_class_owner).
-- Safe to re-run.
--
-- Teachers keep generating per-class logins exactly as before; a join
-- code is the ADDITIONAL path that lets any student account (generated
-- or self-signup, WP-A1) join a class — including classes in other
-- subjects. One ACTIVE code per class (regenerating revokes the old).
--
-- Students never touch these tables directly: redemption goes through
-- the SECURITY DEFINER RPC below, which also enforces the platform's
-- one-class-per-student-per-subject convention and a 10-failures/hour
-- throttle per student.
-- ══════════════════════════════════════════════════════════════

create table if not exists class_join_codes (
    code       text primary key,          -- 8 chars, unambiguous alphabet
    class_id   uuid not null references classes(id) on delete cascade,
    created_by uuid not null references profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz,               -- null = never expires
    max_uses   int,                       -- null = unlimited
    use_count  int not null default 0,
    revoked    boolean not null default false
);
create index if not exists idx_join_codes_class on class_join_codes(class_id);

-- Failed-redemption throttle (rows marked success=true don't count).
create table if not exists join_code_attempts (
    id           bigint generated always as identity primary key,
    student_id   uuid not null references profiles(id) on delete cascade,
    attempted_at timestamptz not null default now(),
    success      boolean not null default false
);
create index if not exists idx_join_attempts_student_time
    on join_code_attempts(student_id, attempted_at);

alter table class_join_codes  enable row level security;
alter table join_code_attempts enable row level security;

-- Teachers may READ codes for their own classes (the class-card UI lists
-- them). All writes go through the RPCs; students get no table access.
drop policy if exists "join_codes_teacher_select" on class_join_codes;
create policy "join_codes_teacher_select" on class_join_codes
    for select using (is_class_owner(class_id));
-- join_code_attempts: deliberately NO client policies (RPC-only).

-- ── generate_join_code ──
-- Revokes any previous active code for the class, then mints a fresh
-- 8-char code from an alphabet with no 0/O/1/I/L lookalikes.
create or replace function generate_join_code(
    p_class_id uuid,
    p_expires_days int default null,
    p_max_uses int default null
) returns class_join_codes
language plpgsql security definer set search_path = public as $$
declare
    alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    new_code text;
    i int;
    row_out class_join_codes;
begin
    if auth.uid() is null or not is_class_owner(p_class_id) then
        raise exception 'not_class_owner';
    end if;
    if p_expires_days is not null and (p_expires_days < 1 or p_expires_days > 365) then
        raise exception 'bad_expiry';
    end if;
    if p_max_uses is not null and (p_max_uses < 1 or p_max_uses > 1000) then
        raise exception 'bad_max_uses';
    end if;

    update class_join_codes set revoked = true
     where class_id = p_class_id and not revoked;

    loop
        new_code := '';
        for i in 1..8 loop
            new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
        end loop;
        begin
            insert into class_join_codes (code, class_id, created_by, expires_at, max_uses)
            values (new_code, p_class_id, auth.uid(),
                    case when p_expires_days is null then null
                         else now() + make_interval(days => p_expires_days) end,
                    p_max_uses)
            returning * into row_out;
            exit;
        exception when unique_violation then
            -- 31^8 keyspace: a collision is astronomically rare — just retry.
        end;
    end loop;
    return row_out;
end;
$$;
grant execute on function generate_join_code(uuid, int, int) to authenticated;

-- ── revoke_join_code ──
create or replace function revoke_join_code(p_class_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null or not is_class_owner(p_class_id) then
        raise exception 'not_class_owner';
    end if;
    update class_join_codes set revoked = true
     where class_id = p_class_id and not revoked;
end;
$$;
grant execute on function revoke_join_code(uuid) to authenticated;

-- ── redeem_join_code ──
-- Student-only. Errors are stable slugs the UI maps to friendly text:
--   too_many_attempts · code_invalid · code_expired · code_full ·
--   subject_taken:<existing class name> · students_only
-- Joining a class you're already in is a SUCCESS (already=true), not an
-- error — refreshing the page after joining must not scare anyone.
create or replace function redeem_join_code(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    uid uuid := auth.uid();
    my_role text;
    failed_attempts int;
    attempt_id bigint;
    jc class_join_codes;
    cls classes;
    subj subjects;
    existing_name text;
begin
    if uid is null then raise exception 'not_authenticated'; end if;
    select role into my_role from profiles where id = uid;
    if my_role is distinct from 'student' then raise exception 'students_only'; end if;

    select count(*) into failed_attempts from join_code_attempts
     where student_id = uid and not success
       and attempted_at > now() - interval '1 hour';
    if failed_attempts >= 10 then raise exception 'too_many_attempts'; end if;

    insert into join_code_attempts (student_id) values (uid)
    returning id into attempt_id;

    select * into jc from class_join_codes
     where code = upper(trim(p_code)) and not revoked;
    if not found then raise exception 'code_invalid'; end if;
    if jc.expires_at is not null and jc.expires_at < now() then raise exception 'code_expired'; end if;
    if jc.max_uses is not null and jc.use_count >= jc.max_uses then raise exception 'code_full'; end if;

    select * into cls from classes where id = jc.class_id and not archived;
    if not found then raise exception 'code_invalid'; end if;
    select * into subj from subjects where id = cls.subject_id;

    if exists (select 1 from class_students where class_id = cls.id and student_id = uid) then
        update join_code_attempts set success = true where id = attempt_id;
        return jsonb_build_object('already', true, 'class_name', cls.name,
            'subject_slug', subj.slug, 'subject_name', subj.name, 'subject_icon', subj.icon);
    end if;

    -- One class per student per subject (platform convention) — moving a
    -- student between classes stays a teacher action.
    select c2.name into existing_name
      from class_students cs
      join classes c2 on c2.id = cs.class_id
     where cs.student_id = uid and c2.subject_id = cls.subject_id and not c2.archived
     limit 1;
    if existing_name is not null then
        raise exception 'subject_taken:%', existing_name;
    end if;

    insert into class_students (class_id, student_id) values (cls.id, uid);
    update class_join_codes set use_count = use_count + 1 where code = jc.code;
    update join_code_attempts set success = true where id = attempt_id;

    return jsonb_build_object('already', false, 'class_name', cls.name,
        'subject_slug', subj.slug, 'subject_name', subj.name, 'subject_icon', subj.icon);
end;
$$;
grant execute on function redeem_join_code(text) to authenticated;
