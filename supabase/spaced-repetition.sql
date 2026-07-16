-- ══════════════════════════════════════════════════════════════
-- REVIEW CALENDAR — SPACED REPETITION — run AFTER bank-questions-schema.sql,
-- daily-revise-stats-schema.sql and daily-revise-functions.sql (it depends on
-- bank_questions / question_mastery and DELEGATES grading to
-- record_mastery_answer()), in the Supabase SQL editor. Safe to re-run.
--
-- The "Review Calendar" is a topic-level spaced-repetition layer that sits ON
-- TOP of the per-question "Rule of 3" that Daily Revise already runs. When a
-- student first opens (and answers something on) a topic, three reviews are
-- scheduled for that topic at +1 day, +7 days and +28 days. A review is ticked
-- off by passing a short 5-question quiz drawn from that topic's bank
-- (≥60% correct). All state is server-side so the calendar syncs across a
-- student's devices.
--
-- Three functions power it, mirroring the daily-revise trio:
--   get_review_schedule(p_subject)          — lazily seeds any missing reviews
--                                             from the student's own answer
--                                             history, then returns the whole
--                                             calendar (optionally one subject)
--   get_topic_review_questions(page, limit) — the answer-free question batch
--                                             for one topic's quiz, same shape
--                                             as get_daily_revise_queue() so
--                                             the client renderer is reused
--   record_review_answer(page, stage, key,  — grades one quiz answer and
--                        answer)              advances / completes / fails the
--                                             review session
--
-- WHY LAZY SEEDING (not a signup trigger): reviews are derived state, not
-- authored data. Rather than fire a trigger on every progress_events insert
-- (which would couple this feature into the hot write path of record_progress)
-- we materialise the three review rows on demand, the first time the student's
-- client asks for the calendar for a topic they've started. `on conflict do
-- nothing` keeps it idempotent, so re-opening the calendar never disturbs an
-- in-progress or completed review.
--
-- WHY WE EXCLUDE section='daily-revise' FROM THE SEED ANCHOR: the anchor for a
-- topic's schedule is min(answered_at) — the moment the student first touched
-- that topic. But record_mastery_answer() logs EVERY graded answer (both the
-- cross-topic Daily Revise drill AND this feature's own review quizzes) to
-- progress_events with section='daily-revise'. A student drilling a topic's
-- questions inside Daily Revise has NOT "opened" that topic in the sense the
-- Review Calendar means, so counting those events would schedule reviews for
-- topics they never actually studied. Excluding that one section leaves only
-- genuine topic-page activity (record_progress's mcq/tf/fib/… sections) as the
-- anchor source. It also self-excludes this feature's own review answers, so
-- answering a review never re-anchors or resurrects a schedule.
--
-- WHY GRADING DELEGATES TO record_mastery_answer(): the review quiz answers the
-- exact same bank_questions the rest of the app does. Rather than duplicate the
-- (subtle) mcq/tf/fib correctness logic — and, worse, let question_mastery,
-- daily_revise_stats XP and the day-streak drift out of sync with Daily Revise
-- — record_review_answer() literally calls record_mastery_answer() for the
-- grade and then layers ONLY the review-session bookkeeping on top. One source
-- of truth for "is this answer correct and what does it do to the student's
-- mastery/XP/streak".
--
-- SECURITY: like the daily-revise functions, all three are SECURITY DEFINER and
-- key off auth.uid(); topic_reviews carries SELECT-only policies (student's own
-- rows + their teacher's) and NO write policies, so every mutation goes through
-- these RPCs. bank_questions' answer_key never appears in any declared return
-- column, so students never see answers — the same enforcement daily-revise and
-- tasks already rely on.
-- ══════════════════════════════════════════════════════════════

-- ── topic_reviews ── (one row per student per topic per stage — the calendar)
create table if not exists topic_reviews (
    student_id   uuid not null references profiles(id) on delete cascade,
    page_id      text not null,
    stage        smallint not null check (stage in (1, 2, 3)),  -- 1=+1d, 2=+7d, 3=+28d
    due_date     date not null,
    completed_at timestamptz,          -- null = not yet ticked off
    attempts     int not null default 0,   -- failed quiz attempts on this review
    answered     int not null default 0,   -- current in-progress quiz session counters
    correct      int not null default 0,   -- (both reset to 0 on a failed attempt)
    primary key (student_id, page_id, stage)
);
create index if not exists topic_reviews_due_idx on topic_reviews (student_id, due_date);

alter table topic_reviews enable row level security;
drop policy if exists "topic_reviews_self_select" on topic_reviews;
create policy "topic_reviews_self_select" on topic_reviews
    for select using (student_id = auth.uid());

drop policy if exists "topic_reviews_teacher_select" on topic_reviews;
create policy "topic_reviews_teacher_select" on topic_reviews
    for select using (teaches_student(topic_reviews.student_id));
-- No insert/update/delete policy — all writes go through the SECURITY DEFINER
-- RPCs below, same trust pattern as question_mastery / progress_events.

-- ── get_review_schedule(p_subject) ──
-- Step 1: lazily seed the three stage rows for every topic the student has
-- genuinely opened (min(answered_at) as the anchor, section='daily-revise'
-- events excluded — see header) that has no rows yet. Step 2: return the whole
-- calendar, filtered to one subject when p_subject is given (page ids are
-- subject-prefixed, e.g. 'business:1-1-…').
create or replace function get_review_schedule(p_subject text default null)
returns table (
    page_id      text,
    stage        smallint,
    due_date     date,
    completed_at timestamptz,
    answered     int,
    correct      int,
    attempts     int
)
language plpgsql security definer set search_path = public as $$
-- RETURNS TABLE's column names (page_id, stage, …) are implicitly declared as
-- plpgsql variables of the same name; without this, the INSERT/ON CONFLICT
-- column list below (which shares those names) raises "ambiguous column"
-- (42702) the moment the function runs. We never assign those OUT variables
-- directly — RETURN QUERY fills them — so always preferring the table column
-- is exactly right.
#variable_conflict use_column
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    -- Lazy seed: one anchor per not-yet-scheduled topic, then a 3-row cross
    -- join for the +1d / +7d / +28d stages. `on conflict do nothing` makes this
    -- a safe no-op once a topic already has its reviews.
    with anchors as (
        select pe.page_id, min(pe.answered_at) as anchor
        from progress_events pe
        where pe.student_id = v_uid
          and pe.section <> 'daily-revise'          -- exclude drill/review grading events
          and (p_subject is null or pe.page_id like p_subject || ':%')
          and not exists (
              select 1 from topic_reviews tr
              where tr.student_id = v_uid and tr.page_id = pe.page_id
          )
        group by pe.page_id
    )
    insert into topic_reviews (student_id, page_id, stage, due_date)
    select v_uid, a.page_id, st.stage, (a.anchor + st.stage_offset)::date
    from anchors a
    cross join (values
        (1::smallint, interval '1 day'),
        (2::smallint, interval '7 days'),
        (3::smallint, interval '28 days')
    ) as st(stage, stage_offset)  -- "offset" is a reserved word, hence stage_offset
    on conflict (student_id, page_id, stage) do nothing;

    -- Permanent demo row, page_id 'example' (no subject prefix, so it can't
    -- collide with a real subject:page id and isn't touched by the anchors
    -- seed above). Always due_date = today, refreshed on every call, so every
    -- student — including ones who sign up after this ships — sees on their
    -- very first visit what a due review looks like, with no need to have
    -- studied anything yet. bank_questions has no rows for it, so a curious
    -- click into it hits review-calendar.js's existing "no questions yet"
    -- message rather than a broken quiz — it can never be ticked off.
    insert into topic_reviews (student_id, page_id, stage, due_date)
    values (v_uid, 'example', 1, current_date)
    on conflict (student_id, page_id, stage) do update set due_date = current_date;

    return query
    select tr.page_id, tr.stage, tr.due_date, tr.completed_at,
           tr.answered, tr.correct, tr.attempts
    from topic_reviews tr
    where tr.student_id = v_uid
      and (p_subject is null or tr.page_id like p_subject || ':%' or tr.page_id = 'example')
    order by tr.due_date, tr.stage;
end;
$$;
grant execute on function get_review_schedule(text) to authenticated;

-- ── get_topic_review_questions(p_page_id, p_limit) ──
-- p_limit random questions from one topic's bank for its review quiz. Same
-- answer-free `snapshot` column and same auto-markable qtype set as
-- get_daily_revise_queue(), joined to question_mastery for mastery_count, so
-- the daily-revise client renderer is interchangeable. No smart scheduling and
-- no exclusion of mastered questions — a review is a fresh sample of the whole
-- topic. Auth-only guard, matching the daily-revise queue (which applies no
-- enrolment restriction of its own).
create or replace function get_topic_review_questions(p_page_id text, p_limit int default 5)
returns table (
    question_key  text,
    qtype         text,
    marks         numeric,
    page_name     text,
    snapshot      jsonb,
    mastery_count int   -- null = never seen; 0 = last answer wrong; 3 = mastered
)
language plpgsql security definer set search_path = public as $$
declare
    v_uid uuid := auth.uid();
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    return query
    select b.question_key, b.qtype, b.marks, b.page_name, b.snapshot, m.mastery_count
    from bank_questions b
    left join question_mastery m
        on m.question_key = b.question_key and m.student_id = v_uid
    where b.page_id = p_page_id
      and b.qtype in ('mcq', 'tf', 'fib')  -- only the qtypes record_mastery_answer can grade
    order by random()
    limit greatest(coalesce(p_limit, 5), 0);
end;
$$;
grant execute on function get_topic_review_questions(text, int) to authenticated;

-- ── record_review_answer(p_page_id, p_stage, p_question_key, p_answer) ──
-- Grades one review-quiz answer (via record_mastery_answer — see header) and
-- advances the review session. Passing 5 questions (or however many the topic
-- has, if fewer) at ≥60% ticks the review off; failing resets the session so
-- the student can retry immediately. Returns record_mastery_answer's grading
-- jsonb merged with a `review` progress object.
create or replace function record_review_answer(
    p_page_id      text,
    p_stage        smallint,
    p_question_key text,
    p_answer       jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid       uuid := auth.uid();
    v_row       topic_reviews%rowtype;
    v_grade     jsonb;
    v_is_correct boolean;
    v_answered  int;
    v_correct   int;
    v_target    int;
    v_pass_mark int;
    v_completed boolean := false;
    v_failed    boolean := false;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    -- 1. Locate the caller's review row (locked for the update below).
    select * into v_row from topic_reviews
    where student_id = v_uid and page_id = p_page_id and stage = p_stage
    for update;
    if not found then
        raise exception 'No review scheduled for this topic and stage';
    end if;
    if v_row.completed_at is not null then
        raise exception 'This review is already completed';
    end if;

    -- 2. The question must actually belong to this topic (a tampered client
    -- can't grade against some other topic's bank).
    if not exists (
        select 1 from bank_questions
        where question_key = p_question_key and page_id = p_page_id
    ) then
        raise exception 'Question does not belong to this topic';
    end if;

    -- 3. Delegate the grade — this also updates question_mastery,
    -- daily_revise_stats XP and progress_events/streak, exactly as a Daily
    -- Revise answer would (one source of truth for correctness).
    v_grade := record_mastery_answer(p_question_key, p_answer);
    v_is_correct := coalesce((v_grade->>'correct')::boolean, false);

    -- 4. Advance the in-progress session counters.
    v_answered := v_row.answered + 1;
    v_correct  := v_row.correct + (case when v_is_correct then 1 else 0 end);

    -- 5. Session target = 5, capped at however many gradeable questions the
    -- topic actually has; pass mark = 60% of that target, rounded up.
    select least(5, count(*)) into v_target
    from bank_questions
    where page_id = p_page_id and qtype in ('mcq', 'tf', 'fib');
    v_pass_mark := ceil(0.6 * v_target);

    if v_answered >= v_target then
        if v_correct >= v_pass_mark then
            -- Passed — tick the review off.
            update topic_reviews
            set answered = v_answered, correct = v_correct, completed_at = now()
            where student_id = v_uid and page_id = p_page_id and stage = p_stage;
            v_completed := true;
        else
            -- Failed — count the attempt and reset so they can retry now.
            update topic_reviews
            set answered = 0, correct = 0, attempts = attempts + 1
            where student_id = v_uid and page_id = p_page_id and stage = p_stage;
            v_failed := true;
        end if;
    else
        -- Mid-session — just persist the running counters.
        update topic_reviews
        set answered = v_answered, correct = v_correct
        where student_id = v_uid and page_id = p_page_id and stage = p_stage;
    end if;

    -- 6. Grade jsonb (correct / mastery_count / answer_key) merged with the
    -- review session state. answered/correct report THIS session's final tally
    -- (even on a failing answer, where the stored counters were just reset).
    return v_grade || jsonb_build_object('review', jsonb_build_object(
        'answered',       v_answered,
        'correct',        v_correct,
        'target',         v_target,
        'pass_mark',      v_pass_mark,
        'completed',      v_completed,
        'failed_attempt', v_failed
    ));
end;
$$;
grant execute on function record_review_answer(text, smallint, text, jsonb) to authenticated;

-- ── Seed questions for the 'example' demo topic ──
-- Backs the always-due-today row get_review_schedule() seeds above. Without
-- these, get_topic_review_questions('example', 5) returns zero rows and a
-- curious click just shows review-calendar.js's placeholder message. With
-- them, the demo is fully real: a student can open it, answer, and — since
-- record_review_answer delegates grading to record_mastery_answer() same as
-- any other topic — actually pass it, so they see the whole flow end to end,
-- not just a preview. subject_slug is a required FK with no user-facing
-- effect here (the calendar always shows this row's name as "Example Topic",
-- never the subject). Safe to re-run: upserts by question_key.
insert into bank_questions (question_key, subject_slug, page_id, page_name, source, qtype, marks, snapshot, answer_key)
values
('example:mcq:1', 'business', 'example', 'Example Topic', 'mcq', 'mcq', 1,
 '{"question": "How often does a topic come back for review after you first study it?", "options": ["After 1 day, 1 week, then 4 weeks", "Every single day, forever", "Only once, right after you finish it", "Whenever your teacher chooses"]}'::jsonb,
 '{"answer": 0, "explain": "Correct — 1 day, 1 week, then 4 weeks. Each stage is ticked off separately by passing a short quiz, so the topic keeps coming back until all three are done."}'::jsonb),
('example:mcq:2', 'business', 'example', 'Example Topic', 'mcq', 'mcq', 1,
 '{"question": "What happens if you don''t pass a review quiz?", "options": ["Nothing — you can never retry it", "It resets so you can try again straight away", "You lose XP permanently", "The topic is removed from your calendar"]}'::jsonb,
 '{"answer": 1, "explain": "Correct — failing just resets the session so you can retry immediately. Nothing is lost, and the review stays on your calendar until you pass it."}'::jsonb),
('example:tf:1', 'business', 'example', 'Example Topic', 'tf', 'tf', 1,
 '{"question": "You need at least 60% correct to pass a review and tick it off."}'::jsonb,
 '{"answer": true, "explain": "TRUE. The pass mark is 60% of the questions in that session — get that many right and the review is complete."}'::jsonb),
('example:tf:2', 'business', 'example', 'Example Topic', 'tf', 'tf', 1,
 '{"question": "This example review is here just to show you how the calendar works, and answering it doesn''t affect your real progress."}'::jsonb,
 '{"answer": true, "explain": "TRUE. This one is just a demo — it resets itself to \"due today\" every time, so it will always be here to remind you how reviews work."}'::jsonb),
('example:fib:1', 'business', 'example', 'Example Topic', 'fib', 'fib', 1,
 '{"question": "A review is ticked off once you pass a short _____ drawn from that topic''s question bank.", "blankOptions": {"B1": ["quiz", "lecture", "survey", "essay"]}}'::jsonb,
 '{"blanks": {"B1": "quiz"}}'::jsonb)
on conflict (question_key) do update set
    page_name = excluded.page_name, snapshot = excluded.snapshot,
    answer_key = excluded.answer_key, updated_at = now();


-- ══════════════════════════════════════════════════════════════
-- TEACHER OVERSIGHT OF THE REVIEW CALENDAR
-- Lets a teacher, from the class dashboard, (a) see how many reviews each
-- student has left overdue and (b) tick off a review themselves once they've
-- confirmed the student actually did it. Both build on the same topic_reviews
-- table above — no new state model, just two teacher-scoped RPCs and a pair of
-- teacher-check columns. Safe to re-run.
-- ══════════════════════════════════════════════════════════════

-- ── teacher-check columns ──
-- teacher_checked_at is the teacher's own confirmation that this review was
-- genuinely completed (separate from completed_at, which the STUDENT earns by
-- passing the quiz — a teacher may want to verify it independently). Nullable;
-- null = not checked. Added idempotently so this whole file stays re-runnable.
alter table topic_reviews add column if not exists teacher_checked_at timestamptz;
alter table topic_reviews add column if not exists teacher_checked_by uuid references profiles(id);

-- ── get_class_review_overview(p_class_id, p_subject) ──
-- Every real review row (the 'example' demo excluded) for every student in one
-- of the caller's classes, so the teacher dashboard can count overdue reviews
-- per student and list them on a student's profile. Like get_review_schedule()
-- it LAZILY SEEDS first: any topic a class student has genuinely opened but has
-- no review rows for yet gets its +1d/+7d/+28d rows materialised now, so the
-- teacher's overdue counts are accurate even for a student who has never opened
-- their own calendar. Seeding mirrors the per-student seed exactly (same anchor
-- = min(answered_at) excluding daily-revise grading events, same on-conflict
-- no-op), just generalised across the whole roster in one set-based insert.
create or replace function get_class_review_overview(p_class_id uuid, p_subject text default null)
returns table (
    student_id       uuid,
    page_id          text,
    stage            smallint,
    due_date         date,
    completed_at     timestamptz,
    teacher_checked_at timestamptz
)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    -- Ownership guard: the caller must be the teacher of this class. Without
    -- this a teacher could pass any class id; RLS on the SELECT below would
    -- still protect other teachers' students, but we fail loudly and early.
    if not exists (select 1 from classes c where c.id = p_class_id and c.teacher_id = auth.uid()) then
        raise exception 'not your class';
    end if;

    -- Lazy seed across the whole roster (see header). Idempotent.
    with roster as (
        select cs.student_id from class_students cs where cs.class_id = p_class_id
    ),
    anchors as (
        select pe.student_id, pe.page_id, min(pe.answered_at) as anchor
        from progress_events pe
        join roster r on r.student_id = pe.student_id
        where pe.section <> 'daily-revise'
          and (p_subject is null or pe.page_id like p_subject || ':%')
          and not exists (
              select 1 from topic_reviews tr
              where tr.student_id = pe.student_id and tr.page_id = pe.page_id
          )
        group by pe.student_id, pe.page_id
    )
    insert into topic_reviews (student_id, page_id, stage, due_date)
    select a.student_id, a.page_id, st.stage, (a.anchor + st.stage_offset)::date
    from anchors a
    cross join (values
        (1::smallint, interval '1 day'),
        (2::smallint, interval '7 days'),
        (3::smallint, interval '28 days')
    ) as st(stage, stage_offset)
    on conflict (student_id, page_id, stage) do nothing;

    return query
    select tr.student_id, tr.page_id, tr.stage, tr.due_date, tr.completed_at, tr.teacher_checked_at
    from topic_reviews tr
    join class_students cs on cs.student_id = tr.student_id and cs.class_id = p_class_id
    where tr.page_id <> 'example'
      and (p_subject is null or tr.page_id like p_subject || ':%')
    order by tr.student_id, tr.due_date, tr.stage;
end;
$$;
grant execute on function get_class_review_overview(uuid, text) to authenticated;

-- ── set_review_teacher_check(p_student_id, p_page_id, p_stage, p_checked) ──
-- Toggles the teacher's confirmation on one review. topic_reviews has NO write
-- policy (all mutations go through SECURITY DEFINER RPCs), so this is the write
-- path for the teacher-check columns, guarded by teaches_student(). Setting it
-- off clears both the timestamp and the checker. Returns the new state.
create or replace function set_review_teacher_check(
    p_student_id uuid,
    p_page_id    text,
    p_stage      smallint,
    p_checked    boolean
) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;
    if not teaches_student(p_student_id) then
        raise exception 'not your student';
    end if;

    update topic_reviews
    set teacher_checked_at = case when p_checked then now() else null end,
        teacher_checked_by = case when p_checked then auth.uid() else null end
    where student_id = p_student_id and page_id = p_page_id and stage = p_stage;
    if not found then
        raise exception 'No such review to check';
    end if;

    return jsonb_build_object('checked', p_checked);
end;
$$;
grant execute on function set_review_teacher_check(uuid, text, smallint, boolean) to authenticated;


