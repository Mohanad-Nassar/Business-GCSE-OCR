-- ══════════════════════════════════════════════════════════════
-- NOTIFICATION PREFERENCES — per-user notification settings (level +
-- sound per type, plus a global sound switch). Powers the "⚙️ Manage
-- notifications" panel on teacher-notifications.html and the 🔊 toggle
-- on notifications.html.
--
-- NOTE: this table is a best-effort CROSS-DEVICE sync only. The client
-- (notifications-shared.js) treats localStorage `gcse_notif_prefs_v1`
-- as the source of truth and degrades silently (42P01) when this file
-- hasn't been run — so notifications keep working with no server row.
--
-- Run this whole file once in the Supabase SQL editor. Safe to re-run.
-- Depends on: profiles from schema.sql.
-- ══════════════════════════════════════════════════════════════

create table if not exists user_notif_prefs (
    user_id    uuid primary key references profiles(id) on delete cascade,
    prefs      jsonb not null default '{}',
    updated_at timestamptz not null default now()
);

alter table user_notif_prefs enable row level security;

-- Own-row only, for every verb — same style as teacher_todos.
drop policy if exists "user_notif_prefs_own" on user_notif_prefs;
create policy "user_notif_prefs_own" on user_notif_prefs
    for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Keep updated_at fresh on every write (the client also sends it, but the
-- trigger guarantees it even for a bare upsert).
create or replace function _touch_user_notif_prefs_updated_at() returns trigger
language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end;
$$;
drop trigger if exists user_notif_prefs_touch on user_notif_prefs;
create trigger user_notif_prefs_touch before update on user_notif_prefs
    for each row execute function _touch_user_notif_prefs_updated_at();
