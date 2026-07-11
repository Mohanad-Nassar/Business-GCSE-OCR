-- ══════════════════════════════════════════════════════════════
-- INTEGRITY EVENTS — copy-paste attempts into exam answer boxes.
--
-- Students can't paste into written exam-answer textareas (blocked
-- client-side in notifications-shared.js); every blocked attempt is
-- logged here so the teacher dashboard can show who tried, where and
-- when. Deliberately a separate table from progress_events: streaks,
-- the practice heatmap and "answers logged" all count progress_events
-- rows, and a paste attempt must never credit activity.
--
-- Run this whole file once in the Supabase SQL editor.
-- Depends on: profiles + teaches_student() from schema.sql.
-- ══════════════════════════════════════════════════════════════

create table if not exists integrity_events (
    id         bigserial primary key,
    student_id uuid not null references profiles(id) on delete cascade,
    page_id    text not null,           -- same ids as progress_events ('economics:2-2-demand', 'task:<uuid>')
    context    text,                    -- which answer box, e.g. 'exam q3'
    detail     jsonb,                   -- { chars: <length of blocked paste> }
    created_at timestamptz not null default now()
);

create index if not exists integrity_events_student_time_idx
    on integrity_events (student_id, created_at desc);

alter table integrity_events enable row level security;

-- No insert/update/delete policies: rows can only be written via
-- record_integrity_event() below, which forces student_id = auth.uid().
drop policy if exists "integrity_events_self_select" on integrity_events;
create policy "integrity_events_self_select" on integrity_events
    for select using (student_id = auth.uid());

drop policy if exists "integrity_events_teacher_select" on integrity_events;
create policy "integrity_events_teacher_select" on integrity_events
    for select using (teaches_student(integrity_events.student_id));

-- Same security-definer pattern as record_progress(): auth.uid() comes
-- from the caller's JWT, so tampered client code still can't log an
-- event under someone else's id.
create or replace function record_integrity_event(
    p_page_id text,
    p_context text,
    p_detail  jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null then
        raise exception 'not authenticated';
    end if;

    insert into integrity_events (student_id, page_id, context, detail)
    values (v_uid, p_page_id, left(p_context, 120), p_detail);
end;
$$;

revoke all on function record_integrity_event(text, text, jsonb) from public;
grant execute on function record_integrity_event(text, text, jsonb) to authenticated;
