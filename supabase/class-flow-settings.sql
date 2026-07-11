-- ══════════════════════════════════════════════════════════════
-- CLASS FLOW SETTINGS — run AFTER topic-access-schema.sql, in the
-- Supabase SQL editor. Safe to re-run.
--
-- Lets a teacher tune, per class, how students move through the
-- ACTIVITIES inside a topic page (this is separate from
-- classes.topic_access_mode, which controls whole-TOPIC locking):
--
--   flow_activity_order  'open'       — students can jump between the
--                                       activity tabs freely (default)
--                        'sequential' — each activity's tab unlocks only
--                                       when the previous one is fully
--                                       correct (Key Learning → MCQ → …)
--   flow_focus_mode      true  — students see ONE question/card at a
--                                time with Back/Next navigation (default)
--                        false — the whole list at once (classic view)
--   flow_pre_seconds     reading time before a question can be answered
--                        (students who try earlier get a "slow down"
--                        nudge). Default 10, 0 disables.
--   flow_post_seconds    pause after answering before Next unlocks, so
--                        blitz-guessing doesn't pay. Default 10,
--                        0 disables.
--   flow_activity_timers per-ACTIVITY overrides of the two timers above.
--                        A jsonb object keyed by section name (learn, mcq,
--                        match, fib, misc, tips, flashcards, tf, exam); each
--                        value is {"pre": int, "post": int} with either or
--                        both keys present. A missing section, or a missing
--                        pre/post within a section, falls back to the
--                        class-wide flow_pre_seconds/flow_post_seconds.
--                        Default '{}' = no overrides (class-wide everywhere).
--
-- Enforced client-side only (script.js "GUIDED STUDENT FLOW") — like
-- sequential topic access, this is pacing, not security. Settings reach
-- students through get_my_topic_settings(), re-declared below with a
-- new `flow` key (existing keys unchanged, so topic-guard.js is
-- unaffected).
--
-- ⚠️ This is a FULL re-declaration (create or replace) of the same
-- function topic-access-schema.sql already defines — not additive. This
-- file's copy must always be a superset of that one's fields (currently:
-- mode, allow_requests, hidden, granted, requests, flow — where `flow`
-- itself carries activity_order, focus_mode, pre_seconds, post_seconds and
-- activity_timers). If
-- topic-access-schema.sql ever gains a new field, copy it in here too,
-- then re-run THIS file last — whichever of the two ran most recently
-- wins, in full.
--
-- MULTI-SUBJECT SIGNATURE CHANGE (kept in lockstep with
-- topic-access-schema.sql): get_my_topic_settings is no longer zero-arg —
-- both copies are now (p_subject text default null) returns jsonb, and
-- resolve the caller's class for that subject via my_class_for_subject()
-- (schema.sql) instead of "earliest-joined class". The old zero-arg
-- version is dropped below (same guard as topic-access-schema.sql) so
-- clients never see two overloads.
-- ══════════════════════════════════════════════════════════════

alter table classes add column if not exists flow_activity_order text not null default 'open'
    check (flow_activity_order in ('open', 'sequential'));
alter table classes add column if not exists flow_focus_mode boolean not null default true;
alter table classes add column if not exists flow_pre_seconds int not null default 10
    check (flow_pre_seconds between 0 and 120);
alter table classes add column if not exists flow_post_seconds int not null default 10
    check (flow_post_seconds between 0 and 120);
-- Per-activity timer overrides: { "<section>": {"pre": int, "post": int}, … }.
-- Keys are section names (learn, mcq, match, fib, misc, tips, flashcards, tf,
-- exam); either/both of pre/post may be present; anything missing falls back
-- to the class-wide flow_pre_seconds/flow_post_seconds above. '{}' = none.
alter table classes add column if not exists flow_activity_timers jsonb not null default '{}'::jsonb;

-- ── get_my_topic_settings(p_subject) ── (same as topic-access-schema.sql, plus `flow`)
drop function if exists get_my_topic_settings();
create or replace function get_my_topic_settings(p_subject text default null) returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid            uuid := auth.uid();
    v_class_id       uuid;
    v_mode           text := 'open';
    v_allow_requests boolean := true;
    v_hidden         text[];
    v_granted        text[];
    v_requests       jsonb;
    v_flow           jsonb;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    v_class_id := my_class_for_subject(p_subject);
    if v_class_id is not null then
        select c.topic_access_mode, c.topic_access_allow_requests,
               jsonb_build_object(
                   'activity_order',  c.flow_activity_order,
                   'focus_mode',      c.flow_focus_mode,
                   'pre_seconds',     c.flow_pre_seconds,
                   'post_seconds',    c.flow_post_seconds,
                   'activity_timers', c.flow_activity_timers
               )
        into v_mode, v_allow_requests, v_flow
        from classes c where c.id = v_class_id;
    end if;

    if v_class_id is not null then
        select coalesce(array_agg(page_id), '{}') into v_hidden
        from class_topic_visibility where class_id = v_class_id and visible = false;
    else
        v_hidden := '{}';
    end if;

    -- Grants/requests are returned for ALL subjects on purpose — page ids
    -- are subject-prefixed ('business:…'), so the client matches by page_id
    -- and rows from other subjects are simply never looked up.
    select coalesce(array_agg(page_id), '{}') into v_granted
    from student_topic_grants where student_id = v_uid;

    select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'page_id', page_id, 'status', status,
        'requested_at', requested_at, 'resolved_at', resolved_at
    ) order by requested_at desc), '[]'::jsonb) into v_requests
    from topic_access_requests where student_id = v_uid;

    return jsonb_build_object(
        'mode', coalesce(v_mode, 'open'),
        'allow_requests', coalesce(v_allow_requests, true),
        'hidden', to_jsonb(v_hidden),
        'granted', to_jsonb(v_granted),
        'requests', v_requests,
        'flow', coalesce(v_flow, jsonb_build_object(
            'activity_order', 'open',
            'focus_mode', true,
            'pre_seconds', 10,
            'post_seconds', 10,
            'activity_timers', '{}'::jsonb
        ))
    );
end;
$$;
grant execute on function get_my_topic_settings(text) to authenticated;
