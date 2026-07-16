-- ══════════════════════════════════════════════════════════════
-- TEACHER TO-DO / NOTIFICATIONS — run AFTER schema.sql, in full, in
-- the Supabase SQL editor. Safe to re-run.
--
-- Powers teacher-notifications.html, the teacher's task-management
-- page. Two small tables:
--
--  · teacher_todos      — the teacher's OWN to-do items (things they
--    add themselves): title, notes, priority, an optional link, a
--    done flag and a snooze ("remind me in X hours/days/weeks").
--
--  · teacher_notif_state — per-item state for the DERIVED notifications
--    (submissions to mark, topic-access requests, …) that
--    notifications-shared.js computes on the fly. Those have no row of
--    their own, so their snooze/done state is stored here keyed by the
--    same stable note_key the bell uses. The header bell reads this too,
--    so snoozing/finishing an alert on the page also quiets the bell.
--
-- Everything is per-teacher and RLS-guarded to auth.uid().
-- ══════════════════════════════════════════════════════════════

-- ── teacher_todos ──
create table if not exists teacher_todos (
    id           uuid primary key default gen_random_uuid(),
    teacher_id   uuid not null references profiles(id) on delete cascade,
    title        text not null check (char_length(title) between 1 and 200),
    notes        text not null default '' check (char_length(notes) <= 2000),
    -- 'action' = a task the teacher must do; 'info' = a note/reminder to self.
    kind         text not null default 'action' check (kind in ('action', 'info')),
    priority     text not null default 'normal' check (priority in ('low', 'normal', 'high')),
    -- Optional deep link to the relevant page (validated http/https/relative
    -- on the client before it is ever rendered as a link).
    link_href    text not null default '' check (char_length(link_href) <= 500),
    status       text not null default 'open' check (status in ('open', 'done')),
    due_at       timestamptz,
    snooze_until timestamptz,        -- hidden from the "active" view until this passes
    done_at      timestamptz,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);
create index if not exists teacher_todos_teacher_idx on teacher_todos (teacher_id, status);

-- ── teacher_notif_state ── (snooze/done for derived notifications)
create table if not exists teacher_notif_state (
    teacher_id   uuid not null references profiles(id) on delete cascade,
    note_key     text not null check (char_length(note_key) <= 300),
    snooze_until timestamptz,
    done         boolean not null default false,
    done_at      timestamptz,
    updated_at   timestamptz not null default now(),
    primary key (teacher_id, note_key)
);

-- Keep updated_at fresh.
create or replace function _touch_teacher_todo_updated_at() returns trigger
language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end;
$$;
drop trigger if exists teacher_todos_touch on teacher_todos;
create trigger teacher_todos_touch before update on teacher_todos
    for each row execute function _touch_teacher_todo_updated_at();
drop trigger if exists teacher_notif_state_touch on teacher_notif_state;
create trigger teacher_notif_state_touch before update on teacher_notif_state
    for each row execute function _touch_teacher_todo_updated_at();

-- ── RLS: each teacher sees and edits only their own rows ──
alter table teacher_todos       enable row level security;
alter table teacher_notif_state enable row level security;

drop policy if exists "teacher_todos_own" on teacher_todos;
create policy "teacher_todos_own" on teacher_todos
    for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists "teacher_notif_state_own" on teacher_notif_state;
create policy "teacher_notif_state_own" on teacher_notif_state
    for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
