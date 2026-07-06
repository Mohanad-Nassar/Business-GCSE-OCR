-- ══════════════════════════════════════════════════════════════
-- DAILY REVISE — FUNCTIONS — run AFTER bank-questions-schema.sql,
-- bank-questions-seed(-*).sql, daily-revise-class-settings.sql and
-- daily-revise-stats-schema.sql, in the Supabase SQL editor. Safe to re-run.
--
-- Three functions power daily-revise.html's spaced-repetition "Rule of 3":
--   get_daily_revise_settings() — the class's topic-filter mode, active
--                                 topics, workload cap and pacing seconds,
--                                 so the client can build its filter UI
--                                 before the first queue fetch
--   get_daily_revise_queue()    — today's prioritised question batch,
--                                 filtered/capped per the class's settings
--   record_mastery_answer()     — grades an answer server-side and updates
--                                 mastery_count / next_due_at
-- Neither queue function's declared return columns include answer_key —
-- that omission is the enforcement that keeps answers hidden from
-- students, the same mechanism get_my_task_questions() already uses in
-- tasks-schema.sql. record_mastery_answer() takes the student's RAW
-- submitted answer and computes correctness itself; it never trusts a
-- client-supplied "is this correct" value.
-- ══════════════════════════════════════════════════════════════

create or replace function get_daily_revise_settings() returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid          uuid := auth.uid();
    v_class_id     uuid;
    v_topic_mode   text := 'teacher_controlled';
    v_weekly_cap   int;
    v_pre_seconds  int := 5;
    v_post_seconds int := 5;
    v_active_pages text[] := '{}';
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select c.id, c.daily_revise_topic_mode, c.daily_revise_weekly_cap,
           c.daily_revise_pre_seconds, c.daily_revise_post_seconds
    into v_class_id, v_topic_mode, v_weekly_cap, v_pre_seconds, v_post_seconds
    from class_students cs join classes c on c.id = cs.class_id
    where cs.student_id = v_uid
    order by cs.joined_at asc limit 1;

    -- active_page_ids reflects the teacher's class_topic_filter_active
    -- selection in BOTH teacher_controlled (where it's the fixed, only
    -- filter — students just can't edit it) and teacher_guided (where it's
    -- the ceiling students can additionally narrow within).
    if v_class_id is not null and v_topic_mode in ('teacher_controlled', 'teacher_guided') then
        select coalesce(array_agg(distinct b.page_id), '{}') into v_active_pages
        from bank_questions b
        where not exists (
            select 1 from class_topic_filter_active f
            where f.class_id = v_class_id and f.page_id = b.page_id and f.active = false
        );
    end if;

    return jsonb_build_object(
        'topic_mode', coalesce(v_topic_mode, 'teacher_controlled'),
        'active_page_ids', to_jsonb(v_active_pages),
        'weekly_cap', v_weekly_cap,
        'pre_seconds', coalesce(v_pre_seconds, 5),
        'post_seconds', coalesce(v_post_seconds, 5)
    );
end;
$$;
grant execute on function get_daily_revise_settings() to authenticated;

-- Overload/return-shape changes from earlier signatures — drop them
-- explicitly first, since `create or replace` on a different parameter list
-- creates a second, ambiguous overload instead of replacing it, and can't
-- change a RETURNS TABLE column list at all.
drop function if exists get_daily_revise_queue(int);
drop function if exists get_daily_revise_queue(int, text[]);

-- p_smart / p_exclude_mastered / p_incorrect_only back the student filter
-- toggles in daily-revise.html; the defaults reproduce the original
-- behaviour exactly, so an older client calling with fewer args is fine.
--   p_smart          — true: spaced-repetition scheduling (only questions
--                      due now, priority order); false: ignore next_due_at,
--                      serve any eligible question in random order
--   p_exclude_mastered — true (default): mastery_count < 3 only
--   p_incorrect_only — only questions whose LAST answer was wrong
--                      (a mastery row exists with mastery_count = 0)
create or replace function get_daily_revise_queue(
    p_limit int default null, p_page_ids text[] default null,
    p_smart boolean default true, p_exclude_mastered boolean default true,
    p_incorrect_only boolean default false)
returns table (
    question_key  text,
    page_id       text,
    page_name     text,
    source        text,
    qtype         text,
    marks         numeric,
    snapshot      jsonb,
    mastery_count int   -- null = never seen; 0 = last answer wrong; 3 = mastered
)
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid            uuid := auth.uid();
    v_class_id       uuid;
    v_topic_mode     text := 'teacher_controlled';
    v_weekly_cap     int;
    -- Keep in sync with dashboard.html's FLIGHT_PATH_EXAM_DATE.
    v_exam_date      date := '2027-05-12';
    v_weeks_to_exam  numeric;
    v_remaining      int;
    v_weekly_target  int;
    v_daily_limit    int;
    v_filter         text[];
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select c.id, c.daily_revise_topic_mode, c.daily_revise_weekly_cap
    into v_class_id, v_topic_mode, v_weekly_cap
    from class_students cs join classes c on c.id = cs.class_id
    where cs.student_id = v_uid
    order by cs.joined_at asc limit 1;

    -- Resolve the effective topic filter against the class's mode — this
    -- runs server-side so a tampered client can't escape teacher_controlled/
    -- teacher_guided restrictions by sending arbitrary page_ids.
    if v_class_id is null then
        v_filter := null;  -- no class (or no bank rows) — no filter
    elsif v_topic_mode = 'teacher_controlled' then
        -- The teacher's own class_topic_filter_active selection is the
        -- ONLY filter here — whatever the client sent is ignored outright,
        -- since students have no say in this mode. Absence of any
        -- deactivated row (the default, untouched state) means every page
        -- is active, so an opted-out teacher gets today's original
        -- "spans every topic" behaviour with no extra step.
        select coalesce(array_agg(distinct b.page_id), '{}') into v_filter
        from bank_questions b
        where not exists (
            select 1 from class_topic_filter_active f
            where f.class_id = v_class_id and f.page_id = b.page_id and f.active = false
        );
    elsif v_topic_mode = 'teacher_guided' then
        if p_page_ids is null or array_length(p_page_ids, 1) is null then
            -- No client filter given — use every currently-active topic.
            select coalesce(array_agg(distinct b.page_id), '{}') into v_filter
            from bank_questions b
            where not exists (
                select 1 from class_topic_filter_active f
                where f.class_id = v_class_id and f.page_id = b.page_id and f.active = false
            );
        else
            -- Intersect the client's request with the active set; a
            -- requested-but-deactivated page is silently dropped, not an error.
            select coalesce(array_agg(pid), '{}') into v_filter
            from unnest(p_page_ids) pid
            where not exists (
                select 1 from class_topic_filter_active f
                where f.class_id = v_class_id and f.page_id = pid and f.active = false
            );
        end if;
    else -- student_controlled — the client's request is trusted as-is
        v_filter := p_page_ids;
    end if;

    -- Incorrect-only is a subset of unmastered (a count-0 row can't be 3),
    -- so it composes with rather than contradicts p_exclude_mastered.

    v_weeks_to_exam := greatest(ceil((v_exam_date - current_date) / 7.0), 1);

    -- Same eligibility predicates as the final query (minus scheduling), so
    -- the weekly-cap pacing reflects the pool the student is actually in.
    select count(*) into v_remaining
    from bank_questions b
    left join question_mastery m
        on m.question_key = b.question_key and m.student_id = v_uid
    where (not p_incorrect_only or m.mastery_count = 0)
      and (not p_exclude_mastered or coalesce(m.mastery_count, 0) < 3)
      and (v_filter is null or b.page_id = any(v_filter));

    if v_weekly_cap is not null then
        -- A configured weekly cap is a hard ceiling; daily is a flat 1/7
        -- slice — skipped days do not carry over (reinforces "come back
        -- often" over binge catch-up sessions).
        v_weekly_target := least(ceil(v_remaining::numeric / v_weeks_to_exam), v_weekly_cap);
        v_daily_limit := greatest(ceil(v_weekly_target / 7.0), 1);
        p_limit := least(coalesce(p_limit, v_daily_limit), v_daily_limit);
    else
        -- Unlimited: no artificial ceiling on top of what's actually due —
        -- p_limit only clamps a single response to a sane page size.
        p_limit := least(coalesce(p_limit, 200), 200);
    end if;

    return query
    select b.question_key, b.page_id, b.page_name, b.source, b.qtype, b.marks, b.snapshot,
           m.mastery_count
    from bank_questions b
    left join question_mastery m
        on m.question_key = b.question_key and m.student_id = v_uid
    where (not p_incorrect_only or m.mastery_count = 0)
      and (not p_exclude_mastered or coalesce(m.mastery_count, 0) < 3)
      and (not p_smart or m.next_due_at is null or m.next_due_at <= now())
      and (v_filter is null or b.page_id = any(v_filter))
    order by
        case when p_smart then (m.question_key is null or m.mastery_count = 0) else null end desc,  -- never-seen / just-reset first
        case when p_smart then m.next_due_at end asc nulls first,
        case when not p_smart then random() end  -- smart off: no schedule, just shuffle
    limit p_limit;
end;
$$;
grant execute on function get_daily_revise_queue(int, text[], boolean, boolean, boolean) to authenticated;

create or replace function record_mastery_answer(p_question_key text, p_answer jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
    v_uid        uuid := auth.uid();
    v_row        bank_questions%rowtype;
    v_is_correct boolean;
    v_old_count  int;
    v_new_count  int;
    v_next_due   timestamptz;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select * into v_row from bank_questions where question_key = p_question_key;
    if not found then raise exception 'Question not found'; end if;

    -- Same comparison logic as submit_task_attempt() in tasks-schema.sql —
    -- correctness is always computed here, server-side, never trusted from
    -- the client.
    v_is_correct := case
        when v_row.qtype in ('mcq', 'tf') then
            p_answer is not null and (p_answer->>'value') = (v_row.answer_key->>'answer')
        when v_row.qtype = 'fib' then
            p_answer is not null and not exists (
                select 1 from jsonb_each_text(v_row.answer_key->'blanks') kb
                where lower(btrim(coalesce(p_answer->'value'->>kb.key, '')))
                      <> lower(btrim(kb.value)))
        else false
    end;

    select mastery_count into v_old_count
    from question_mastery where student_id = v_uid and question_key = p_question_key;
    v_old_count := coalesce(v_old_count, 0);

    -- The Rule of 3: correct increments (capped at 3 = mastered, removed
    -- from the queue); wrong resets to 0 and is due again immediately.
    v_new_count := case when v_is_correct then least(v_old_count + 1, 3) else 0 end;
    v_next_due := case
        when not v_is_correct then now()
        when v_new_count >= 3 then null
        when v_old_count = 0 then now() + interval '1 day'
        else now() + interval '3 days'
    end;

    insert into question_mastery (student_id, question_key, mastery_count, last_seen_at, next_due_at, updated_at)
    values (v_uid, p_question_key, v_new_count, now(), v_next_due, now())
    on conflict (student_id, question_key) do update
        set mastery_count = excluded.mastery_count,
            last_seen_at  = excluded.last_seen_at,
            next_due_at   = excluded.next_due_at,
            updated_at    = now();

    -- Logged with section='daily-revise' (distinct from the topic's own
    -- mcq/tf/fib sections) so this activity counts toward the day-streak
    -- (get_my_streak() scans all of progress_events, no section filter)
    -- without inflating that topic's own per-section progress_summary ring.
    insert into progress_events (student_id, page_id, section, question_id, answer, is_correct)
    values (v_uid, v_row.page_id, 'daily-revise', p_question_key, p_answer, v_is_correct);

    -- Lifetime, monotonically-increasing stats — feeds this activity into
    -- the student's total XP and the two Daily-Revise badges (gamification.js).
    -- total_mastered increments only on the transition INTO mastery (3), not
    -- every time an already-mastered question is somehow re-answered.
    insert into daily_revise_stats (student_id, total_correct, total_mastered, updated_at)
    values (v_uid, case when v_is_correct then 1 else 0 end,
                    case when v_new_count = 3 and v_old_count < 3 then 1 else 0 end, now())
    on conflict (student_id) do update
        set total_correct  = daily_revise_stats.total_correct + excluded.total_correct,
            total_mastered = daily_revise_stats.total_mastered + excluded.total_mastered,
            updated_at     = now();

    return jsonb_build_object(
        'correct', v_is_correct,
        'mastery_count', v_new_count,
        'answer_key', v_row.answer_key
    );
end;
$$;
grant execute on function record_mastery_answer(text, jsonb) to authenticated;
