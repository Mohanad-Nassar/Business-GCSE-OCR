-- ══════════════════════════════════════════════════════════════
-- QUESTION REPORTS (WP-C5) — students flag a wrong/typo/confusing
-- question; teachers see and resolve the queue. Run AFTER schema.sql
-- (needs profiles / teaches_student() / is_owner) and bank-questions-
-- schema.sql (bank_questions, for the question-text join). Safe to re-run.
--
-- Content-quality loop: freshly-authored questions will have the odd
-- error; this catches them BEFORE the exam. A report is about CONTENT
-- (a question_key / page_id), not a class — a teacher sees reports from
-- any student they teach (teaches_student), the owner sees all.
--
-- Writes go through report_question() / resolve_question_report() only
-- (both force the actor from auth.uid()); students never write the table
-- directly.
-- ══════════════════════════════════════════════════════════════

create table if not exists question_reports (
    id             bigint generated always as identity primary key,
    reporter_id    uuid not null references profiles(id) on delete cascade,
    question_key   text,                    -- bank question key when known
    page_id        text,                    -- 'economics:2-2-demand' / 'task:<uuid>'
    subject_slug   text,
    activity       text,                    -- 'daily-revise' | 'review' | 'task' | …
    reason         text not null check (reason in
                     ('wrong_answer', 'typo', 'confusing', 'technical', 'other')),
    detail         text,
    status         text not null default 'open' check (status in
                     ('open', 'reviewing', 'resolved', 'dismissed')),
    resolved_by    uuid references profiles(id),
    resolved_at    timestamptz,
    resolution_note text,
    created_at     timestamptz not null default now()
);
create index if not exists idx_question_reports_status
    on question_reports (status, created_at desc);
create index if not exists idx_question_reports_reporter
    on question_reports (reporter_id, created_at desc);

alter table question_reports enable row level security;

-- Students read their own reports; teachers read reports from students
-- they teach; the owner reads everything. All WRITES are RPC-only.
drop policy if exists "qr_self_select" on question_reports;
create policy "qr_self_select" on question_reports
    for select using (reporter_id = auth.uid());

drop policy if exists "qr_teacher_select" on question_reports;
create policy "qr_teacher_select" on question_reports
    for select using (
        teaches_student(reporter_id)
        or exists (select 1 from profiles p where p.id = auth.uid() and p.is_owner)
    );

-- ── report_question ── (student-facing)
-- Returns { ok:true, id } or { ok:false, error:'rate_limited' }. Auth guard
-- raises (never happens in the normal UI). Rate-limited to 20 reports per
-- student per UTC day so a frustrated student can't flood the queue.
create or replace function report_question(
    p_question_key text,
    p_page_id text,
    p_subject text,
    p_activity text,
    p_reason text,
    p_detail text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    uid uuid := auth.uid();
    today_count int;
    new_id bigint;
begin
    if uid is null then raise exception 'not_authenticated'; end if;
    if p_reason is null or p_reason not in
       ('wrong_answer', 'typo', 'confusing', 'technical', 'other') then
        p_reason := 'other';
    end if;

    select count(*) into today_count from question_reports
     where reporter_id = uid and created_at >= date_trunc('day', now() at time zone 'utc');
    if today_count >= 20 then
        return jsonb_build_object('ok', false, 'error', 'rate_limited');
    end if;

    insert into question_reports
        (reporter_id, question_key, page_id, subject_slug, activity, reason, detail)
    values
        (uid, nullif(p_question_key, ''), nullif(p_page_id, ''), nullif(p_subject, ''),
         nullif(p_activity, ''), p_reason, left(nullif(p_detail, ''), 1000))
    returning id into new_id;

    return jsonb_build_object('ok', true, 'id', new_id);
end;
$$;
grant execute on function report_question(text, text, text, text, text, text) to authenticated;
revoke execute on function report_question(text, text, text, text, text, text) from public;
revoke execute on function report_question(text, text, text, text, text, text) from anon;

-- ── get_question_reports ── (teacher/owner-facing, enriched)
-- Returns the reports the caller may see, newest first, with the reporter's
-- username and the question text (joined from bank_questions — students
-- can't read that table, but this definer function can). p_status filters
-- ('open' by default; pass null for all).
create or replace function get_question_reports(p_status text default 'open')
returns table (
    id bigint,
    reporter_username text,
    question_key text,
    page_id text,
    subject_slug text,
    activity text,
    reason text,
    detail text,
    status text,
    question_text text,
    created_at timestamptz,
    resolved_at timestamptz,
    resolution_note text
)
language sql security definer set search_path = public as $$
    select r.id,
           rep.username,
           r.question_key, r.page_id, r.subject_slug, r.activity, r.reason, r.detail, r.status,
           bq.snapshot ->> 'question',
           r.created_at, r.resolved_at, r.resolution_note
    from question_reports r
    join profiles rep on rep.id = r.reporter_id
    left join bank_questions bq on bq.question_key = r.question_key
    where (p_status is null or r.status = p_status)
      and (
        teaches_student(r.reporter_id)
        or exists (select 1 from profiles p where p.id = auth.uid() and p.is_owner)
      )
    order by r.created_at desc
    limit 500;
$$;
grant execute on function get_question_reports(text) to authenticated;
revoke execute on function get_question_reports(text) from public;
revoke execute on function get_question_reports(text) from anon;

-- ── resolve_question_report ── (teacher/owner-facing)
-- Set a report's status (reviewing / resolved / dismissed / re-open) with an
-- optional note. Only a teacher who teaches the reporter, or the owner.
create or replace function resolve_question_report(
    p_id bigint,
    p_status text,
    p_note text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
    uid uuid := auth.uid();
    rep_id uuid;
begin
    if uid is null then raise exception 'not_authenticated'; end if;
    if p_status not in ('open', 'reviewing', 'resolved', 'dismissed') then
        raise exception 'bad_status';
    end if;
    select reporter_id into rep_id from question_reports where id = p_id;
    if rep_id is null then raise exception 'report_not_found'; end if;
    if not (teaches_student(rep_id)
            or exists (select 1 from profiles p where p.id = uid and p.is_owner)) then
        raise exception 'not_authorised';
    end if;

    update question_reports set
        status = p_status,
        resolution_note = left(nullif(p_note, ''), 1000),
        resolved_by = case when p_status in ('resolved', 'dismissed') then uid else null end,
        resolved_at = case when p_status in ('resolved', 'dismissed') then now() else null end
    where id = p_id;
end;
$$;
grant execute on function resolve_question_report(bigint, text, text) to authenticated;
revoke execute on function resolve_question_report(bigint, text, text) from public;
revoke execute on function resolve_question_report(bigint, text, text) from anon;
