-- ══════════════════════════════════════════════════════════════
-- CS PRACTICE LAB — cloud saves (CS-CONTENT-PLAN.md §7, wave CS-C)
-- Students' lab work (Python code + files, SQL attempts, drill bests,
-- sim states) autosaves to localStorage instantly and syncs here so it
-- follows them across devices. One row per (user, page, tool, key).
-- Run once in the Supabase SQL editor. Safe to re-run.
-- ══════════════════════════════════════════════════════════════

create table if not exists public.cs_lab_saves (
  user_id    uuid not null references auth.users (id) on delete cascade,
  page_id    text not null,
  tool       text not null,
  k          text not null,
  v          jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, page_id, tool, k)
);

alter table public.cs_lab_saves enable row level security;

-- Owners read/write only their own rows. (Teacher visibility of student
-- code is a possible later feature — add a SELECT policy via class
-- membership then; deliberately NOT granted here.)
drop policy if exists cs_lab_saves_select_own on public.cs_lab_saves;
create policy cs_lab_saves_select_own on public.cs_lab_saves
  for select using (auth.uid() = user_id);

drop policy if exists cs_lab_saves_upsert_own on public.cs_lab_saves;
create policy cs_lab_saves_upsert_own on public.cs_lab_saves
  for insert with check (auth.uid() = user_id);

drop policy if exists cs_lab_saves_update_own on public.cs_lab_saves;
create policy cs_lab_saves_update_own on public.cs_lab_saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists cs_lab_saves_delete_own on public.cs_lab_saves;
create policy cs_lab_saves_delete_own on public.cs_lab_saves
  for delete using (auth.uid() = user_id);

-- Guard against unbounded payloads (a whole MEMFS dump should never be
-- more than a few hundred KB; 256 KB per key is generous for code + txt
-- files while stopping abuse).
alter table public.cs_lab_saves drop constraint if exists cs_lab_saves_v_size;
alter table public.cs_lab_saves add constraint cs_lab_saves_v_size
  check (pg_column_size(v) < 262144);
