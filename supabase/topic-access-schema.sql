-- ══════════════════════════════════════════════════════════════
-- TOPIC ACCESS CONTROL — run AFTER schema.sql, in the Supabase SQL
-- editor. Safe to re-run.
--
-- Adds per-class topic locking, with two modes a teacher chooses per
-- class (classes.topic_access_mode, default 'open' = today's behaviour,
-- so existing classes are completely unaffected until a teacher opts in):
--   'manual'     — teacher explicitly hides/shows each topic
--                  (class_topic_visibility). Anything not listed stays
--                  visible.
--   'sequential' — a topic unlocks once the previous one (in curriculum
--                  order) is fully answered. Enforced client-side only
--                  (see topic-guard.js) — it depends on PAGE_GROUPS
--                  ordering and true section totals, both of which live
--                  in JS (progress-shared.js / section-totals.js), not
--                  worth duplicating into SQL for a soft pacing feature.
-- In both modes, student_topic_grants lets a teacher (or an approved
-- topic_access_requests row) unlock one topic early for one student,
-- regardless of mode — the "I'm ahead, let me skip forward" case.
--
-- Enforcement split, on purpose:
--   'manual' hidden topics are enforced BOTH client-side (topic-guard.js
--   blocks the page) AND server-side (record_progress rejects writes) —
--   a specifically-hidden topic is a real lock.
--   'sequential' is enforced client-side only — it's a pacing nudge, not
--   a secret; a student who works around the client check just gets to
--   record progress on a topic they haven't been told to skip to yet.
-- ══════════════════════════════════════════════════════════════

alter table classes add column if not exists topic_access_mode text not null default 'open'
    check (topic_access_mode in ('open', 'manual', 'sequential'));

-- ── class_topic_visibility ── (manual mode)
-- Absence of a row = visible. A row with visible=false hides that topic
-- for every student in the class (unless they hold a grant).
create table if not exists class_topic_visibility (
    class_id   uuid not null references classes(id) on delete cascade,
    page_id    text not null,
    visible    boolean not null default false,
    updated_at timestamptz not null default now(),
    primary key (class_id, page_id)
);
alter table class_topic_visibility enable row level security;
drop policy if exists "ctv_teacher_all" on class_topic_visibility;
create policy "ctv_teacher_all" on class_topic_visibility
    for all using (is_class_owner(class_id)) with check (is_class_owner(class_id));

-- ── student_topic_grants ── (per-student early/override unlock, any mode)
create table if not exists student_topic_grants (
    student_id uuid not null references profiles(id) on delete cascade,
    page_id    text not null,
    granted_by uuid references profiles(id),
    granted_at timestamptz not null default now(),
    primary key (student_id, page_id)
);
alter table student_topic_grants enable row level security;
drop policy if exists "stg_teacher_all" on student_topic_grants;
create policy "stg_teacher_all" on student_topic_grants
    for all using (teaches_student(student_id)) with check (teaches_student(student_id));

-- ── topic_access_requests ── ("please open this for me")
create table if not exists topic_access_requests (
    id           uuid primary key default gen_random_uuid(),
    student_id   uuid not null references profiles(id) on delete cascade,
    class_id     uuid not null references classes(id) on delete cascade,
    page_id      text not null,
    status       text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
    requested_at timestamptz not null default now(),
    resolved_at  timestamptz,
    resolved_by  uuid references profiles(id)
);
create unique index if not exists tar_one_pending on topic_access_requests (student_id, page_id) where status = 'pending';
alter table topic_access_requests enable row level security;
drop policy if exists "tar_teacher_all" on topic_access_requests;
create policy "tar_teacher_all" on topic_access_requests
    for all using (is_class_owner(class_id)) with check (is_class_owner(class_id));
-- No student policies on any of the three tables above — students read
-- via get_my_topic_settings() and write via request_topic_access() below,
-- same pattern as progress_events/progress_summary in schema.sql.

-- ── get_my_topic_settings() ──
-- Everything a student's client needs to compute lock state for every
-- topic: their class's mode, the manual-mode hidden list, their own
-- grants, and their own request history (so the UI can show "pending" /
-- "denied" without a direct SELECT policy). If a student is somehow in
-- more than one class, the earliest-joined class wins — this app's
-- classes are effectively 1-per-student in practice.
create or replace function get_my_topic_settings() returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid      uuid := auth.uid();
    v_class_id uuid;
    v_mode     text := 'open';
    v_hidden   text[];
    v_granted  text[];
    v_requests jsonb;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select c.id, c.topic_access_mode into v_class_id, v_mode
    from class_students cs join classes c on c.id = cs.class_id
    where cs.student_id = v_uid
    order by cs.joined_at asc limit 1;

    if v_class_id is not null then
        select coalesce(array_agg(page_id), '{}') into v_hidden
        from class_topic_visibility where class_id = v_class_id and visible = false;
    else
        v_hidden := '{}';
    end if;

    select coalesce(array_agg(page_id), '{}') into v_granted
    from student_topic_grants where student_id = v_uid;

    select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'page_id', page_id, 'status', status,
        'requested_at', requested_at, 'resolved_at', resolved_at
    ) order by requested_at desc), '[]'::jsonb) into v_requests
    from topic_access_requests where student_id = v_uid;

    return jsonb_build_object(
        'mode', coalesce(v_mode, 'open'),
        'hidden', to_jsonb(v_hidden),
        'granted', to_jsonb(v_granted),
        'requests', v_requests
    );
end;
$$;
grant execute on function get_my_topic_settings() to authenticated;

-- ── request_topic_access() ──
-- Upserts a pending request for the caller's own class; a no-op (returns
-- the existing row) if one's already pending, so mashing the button
-- can't spam the teacher's queue.
create or replace function request_topic_access(p_page_id text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid        uuid := auth.uid();
    v_class_id   uuid;
    v_id         uuid;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select c.id into v_class_id
    from class_students cs join classes c on c.id = cs.class_id
    where cs.student_id = v_uid
    order by cs.joined_at asc limit 1;
    if v_class_id is null then raise exception 'You are not in a class'; end if;

    select id into v_id from topic_access_requests
    where student_id = v_uid and page_id = p_page_id and status = 'pending';
    if v_id is not null then
        return jsonb_build_object('id', v_id, 'status', 'pending', 'already', true);
    end if;

    insert into topic_access_requests (student_id, class_id, page_id)
    values (v_uid, v_class_id, p_page_id)
    returning id into v_id;
    return jsonb_build_object('id', v_id, 'status', 'pending', 'already', false);
end;
$$;
grant execute on function request_topic_access(text) to authenticated;

-- ── resolve_topic_access_request() ── (teacher approves/denies)
-- Approving also writes the grant in the same transaction, so the queue
-- status and the actual unlock can never drift out of sync.
create or replace function resolve_topic_access_request(p_request_id uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare
    v_req topic_access_requests%rowtype;
begin
    select * into v_req from topic_access_requests where id = p_request_id;
    if not found then raise exception 'Request not found'; end if;
    if not is_class_owner(v_req.class_id) then raise exception 'Not authorised'; end if;

    update topic_access_requests
    set status = case when p_approve then 'approved' else 'denied' end,
        resolved_at = now(), resolved_by = auth.uid()
    where id = p_request_id;

    if p_approve then
        insert into student_topic_grants (student_id, page_id, granted_by)
        values (v_req.student_id, v_req.page_id, auth.uid())
        on conflict (student_id, page_id) do nothing;
    end if;
end;
$$;
grant execute on function resolve_topic_access_request(uuid, boolean) to authenticated;

-- ── record_progress() override ──
-- Same body as schema.sql, plus one guard: reject writes for a topic a
-- student's class has explicitly hidden (manual mode), unless they hold
-- a grant. Sequential mode is not checked here — see the header note.
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
    v_class_id uuid;
    v_mode text;
    v_granted boolean;
    v_hidden boolean;
begin
    if v_uid is null then
        raise exception 'not authenticated';
    end if;

    select exists(
        select 1 from student_topic_grants where student_id = v_uid and page_id = p_page_id
    ) into v_granted;

    if not v_granted then
        select c.id, c.topic_access_mode into v_class_id, v_mode
        from class_students cs join classes c on c.id = cs.class_id
        where cs.student_id = v_uid
        order by cs.joined_at asc limit 1;

        if v_class_id is not null and v_mode = 'manual' then
            select exists(
                select 1 from class_topic_visibility
                where class_id = v_class_id and page_id = p_page_id and visible = false
            ) into v_hidden;
            if v_hidden then
                raise exception 'This topic is locked — ask your teacher to open it, or request access from the topic page.';
            end if;
        end if;
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
