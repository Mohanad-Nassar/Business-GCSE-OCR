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
--
-- Enforced client-side only (script.js "GUIDED STUDENT FLOW") — like
-- sequential topic access, this is pacing, not security. Settings reach
-- students through get_my_topic_settings(), re-declared below with a
-- new `flow` key (existing keys unchanged, so topic-guard.js is
-- unaffected).
-- ══════════════════════════════════════════════════════════════

alter table classes add column if not exists flow_activity_order text not null default 'open'
    check (flow_activity_order in ('open', 'sequential'));
alter table classes add column if not exists flow_focus_mode boolean not null default true;
alter table classes add column if not exists flow_pre_seconds int not null default 10
    check (flow_pre_seconds between 0 and 120);
alter table classes add column if not exists flow_post_seconds int not null default 10
    check (flow_post_seconds between 0 and 120);

-- ── get_my_topic_settings() ── (same as topic-access-schema.sql, plus `flow`)
create or replace function get_my_topic_settings() returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_uid      uuid := auth.uid();
    v_class_id uuid;
    v_mode     text := 'open';
    v_hidden   text[];
    v_granted  text[];
    v_requests jsonb;
    v_flow     jsonb;
begin
    if v_uid is null then raise exception 'not authenticated'; end if;

    select c.id, c.topic_access_mode,
           jsonb_build_object(
               'activity_order', c.flow_activity_order,
               'focus_mode',     c.flow_focus_mode,
               'pre_seconds',    c.flow_pre_seconds,
               'post_seconds',   c.flow_post_seconds
           )
    into v_class_id, v_mode, v_flow
    from class_students cs join classes c on c.id = cs.class_id
    where cs.student_id = v_uid
    order by cs.joined_at asc limit 1;

    if v_class_id is not null then
        select coalesce(array_agg(page_id), '{}') into v_hidden
        from class_topic_visibility where class_id = v_class_id and visible = false;
    else
        v_hidden := '{}';
    end if;

    select coalesce(array_agg(page_id), '{}') into v_granted
    from student_topic_grants where student_id = v_uid;

    select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'page_id', page_id, 'status', status,
        'requested_at', requested_at, 'resolved_at', resolved_at
    ) order by requested_at desc), '[]'::jsonb) into v_requests
    from topic_access_requests where student_id = v_uid;

    return jsonb_build_object(
        'mode', coalesce(v_mode, 'open'),
        'hidden', to_jsonb(v_hidden),
        'granted', to_jsonb(v_granted),
        'requests', v_requests,
        'flow', coalesce(v_flow, jsonb_build_object(
            'activity_order', 'open',
            'focus_mode', true,
            'pre_seconds', 10,
            'post_seconds', 10
        ))
    );
end;
$$;
grant execute on function get_my_topic_settings() to authenticated;
