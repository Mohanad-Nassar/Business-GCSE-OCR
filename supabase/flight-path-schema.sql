-- ══════════════════════════════════════════════════════════════
-- FLIGHT PATH — run AFTER schema.sql (needs the subjects table) and
-- tasks-analytics-functions.sql, in the Supabase SQL editor. Safe to re-run.
--
-- One row per student per subject per day: their course-wide weighted % for
-- that subject (the same weighting dashboard.html's "Topics to Review" list
-- already computes from get_my_topic_performance(), just averaged across
-- every topic instead of the worst few). dashboard.html plots these over
-- time against a target band that rises toward the subject's exam date.
--
-- Multi-subject: snapshots are keyed per subject — (student_id,
-- subject_slug, snapshot_date) — so a student on two subjects gets two
-- independent flight paths. record_flight_path_snapshot() gained a
-- p_subject parameter (default 'business', so an older one-arg client keeps
-- working and lands on the business path).
--
-- Writes only happen through record_flight_path_snapshot() below — same
-- trust pattern as record_progress() in schema.sql: the caller computes the
-- value, the function just forces student_id = auth.uid() and upserts.
-- ══════════════════════════════════════════════════════════════

create table if not exists flight_path_snapshots (
    id            bigserial primary key,
    student_id    uuid not null references profiles(id) on delete cascade,
    subject_slug  text not null default 'business' references subjects(slug),
    snapshot_date date not null default current_date,
    pct           numeric not null check (pct >= 0 and pct <= 100),
    created_at    timestamptz not null default now(),
    unique (student_id, subject_slug, snapshot_date)
);

-- Pre-multi-subject installs: this table already existed with
-- UNIQUE(student_id, snapshot_date) and no subject_slug (`create table if
-- not exists` above is a no-op against it). Like daily_revise_stats, this
-- data is worth keeping — every existing snapshot genuinely was a Business
-- flight path, since Business was the only subject that existed. The
-- DEFAULT 'business' backfills existing rows in the same statement; the old
-- two-column uniqueness is dropped and replaced with a unique index (not a
-- named constraint — ALTER TABLE has no ADD CONSTRAINT IF NOT EXISTS, but
-- CREATE UNIQUE INDEX does, so it stays safe to re-run) covering the same
-- three columns record_flight_path_snapshot()'s ON CONFLICT targets. A
-- fresh install ends up with two equivalent unique indexes (the inline one
-- above plus this one) — harmless redundancy, not worth special-casing.
alter table flight_path_snapshots add column if not exists subject_slug text not null default 'business' references subjects(slug);
alter table flight_path_snapshots drop constraint if exists flight_path_snapshots_student_id_snapshot_date_key;
create unique index if not exists flight_path_snapshots_student_subject_date_uidx
    on flight_path_snapshots (student_id, subject_slug, snapshot_date);

alter table flight_path_snapshots enable row level security;

drop policy if exists "flight_path_self_select" on flight_path_snapshots;
create policy "flight_path_self_select" on flight_path_snapshots
    for select using (student_id = auth.uid());

drop policy if exists "flight_path_teacher_select" on flight_path_snapshots;
create policy "flight_path_teacher_select" on flight_path_snapshots
    for select using (teaches_student(flight_path_snapshots.student_id));
-- No insert/update policy — all writes go through the SECURITY DEFINER
-- function below.

-- SIGNATURE CHANGE: was record_flight_path_snapshot(numeric). Adding the
-- defaulted p_subject parameter creates a different signature, so the old
-- one must be dropped first or the two would coexist as ambiguous overloads.
drop function if exists record_flight_path_snapshot(numeric);

create or replace function record_flight_path_snapshot(p_pct numeric, p_subject text default 'business') returns void
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if p_pct is null or p_pct < 0 or p_pct > 100 then raise exception 'p_pct must be between 0 and 100'; end if;
    if p_subject is null or not exists (select 1 from subjects where slug = p_subject) then
        raise exception 'unknown subject';
    end if;

    insert into flight_path_snapshots (student_id, subject_slug, snapshot_date, pct)
    values (auth.uid(), p_subject, current_date, p_pct)
    on conflict (student_id, subject_slug, snapshot_date) do update set pct = excluded.pct;
end;
$$;
grant execute on function record_flight_path_snapshot(numeric, text) to authenticated;
