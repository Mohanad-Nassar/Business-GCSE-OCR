-- ══════════════════════════════════════════════════════════════
-- FLIGHT PATH — run AFTER schema.sql and tasks-analytics-functions.sql, in
-- the Supabase SQL editor. Safe to re-run.
--
-- One row per student per day: their course-wide weighted % (the same
-- weighting dashboard.html's "Topics to Review" list already computes from
-- get_my_topic_performance(), just averaged across every topic instead of
-- the worst few). dashboard.html plots these over time against a target
-- band that rises toward the exam date.
--
-- Writes only happen through record_flight_path_snapshot() below — same
-- trust pattern as record_progress() in schema.sql: the caller computes the
-- value, the function just forces student_id = auth.uid() and upserts.
-- ══════════════════════════════════════════════════════════════

create table if not exists flight_path_snapshots (
    id            bigserial primary key,
    student_id    uuid not null references profiles(id) on delete cascade,
    snapshot_date date not null default current_date,
    pct           numeric not null check (pct >= 0 and pct <= 100),
    created_at    timestamptz not null default now(),
    unique (student_id, snapshot_date)
);
alter table flight_path_snapshots enable row level security;

drop policy if exists "flight_path_self_select" on flight_path_snapshots;
create policy "flight_path_self_select" on flight_path_snapshots
    for select using (student_id = auth.uid());

drop policy if exists "flight_path_teacher_select" on flight_path_snapshots;
create policy "flight_path_teacher_select" on flight_path_snapshots
    for select using (teaches_student(flight_path_snapshots.student_id));
-- No insert/update policy — all writes go through the SECURITY DEFINER
-- function below.

create or replace function record_flight_path_snapshot(p_pct numeric) returns void
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if p_pct is null or p_pct < 0 or p_pct > 100 then raise exception 'p_pct must be between 0 and 100'; end if;

    insert into flight_path_snapshots (student_id, snapshot_date, pct)
    values (auth.uid(), current_date, p_pct)
    on conflict (student_id, snapshot_date) do update set pct = excluded.pct;
end;
$$;
grant execute on function record_flight_path_snapshot(numeric) to authenticated;
