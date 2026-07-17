-- ══════════════════════════════════════════════════════════════
-- SUBJECTS V2 — PLATFORM OVERRIDE-FORK · S5 STEP 5 (seed a copy from master)
-- Run AFTER subjects-v2-s5-overrides.sql (needs can_edit_platform_subject from
-- subjects-v2-s4-fork-grants.sql, re-checked here). Safe to re-run.
-- Source of truth: docs/SUBJECTS-V2-SPEC.md §5 (Option B — "Make a copy" seeds
-- the override editor with the FULL master content instead of a blank page).
--
-- WHAT THIS IS: a master (platform) topic's content is normally split between a
-- static HTML page and bank_questions — neither is the editor's `sections` jsonb.
-- tools/build_question_bank.py now ALSO assembles each master topic's full
-- 9-activity `sections` (same shape as custom_topics.sections / a published
-- subject_override) and stores it here, so "Make a copy" can pre-fill the fork.
--
-- SECURITY (auth-authz / secure-coding):
--   • The master `sections` include ANSWERS (mcq answer index, tf boolean, fib
--     blanks, mark schemes). So the table has RLS ON with NO client-readable
--     policy — the anon/authenticated roles can never SELECT it directly.
--   • The only read path is get_platform_topic_sections(), a SECURITY DEFINER
--     function gated on can_edit_platform_subject() — i.e. exactly the granted
--     teachers who can already FORK the subject (and thus already see its answers
--     in their own editor). No new surface, no answers to non-editors.
--   • The table is written ONLY by the build's service-role upload (or the
--     generated seed SQL run in the SQL editor) — same trust path as
--     bank_questions.
-- ══════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════
-- SECTION 1 · platform_topic_master  (one row per platform topic page)
-- ══════════════════════════════════════════════════════════════
create table if not exists platform_topic_master (
    subject_slug text not null,
    -- hyphenated page-id tail (matches subject_overrides.topic_slug /
    -- pageMeta.id), so a fork lookups by the SAME key it will store under.
    topic_slug   text not null,
    page_name    text,
    sections     jsonb not null default '{}'::jsonb,
    updated_at   timestamptz not null default now(),
    primary key (subject_slug, topic_slug)
);

-- RLS ON, NO policy: the rows carry answers. Direct client SELECT/INSERT/UPDATE/
-- DELETE are all denied — the only reader is the SECURITY DEFINER function below,
-- and the only writer is the service role (which bypasses RLS). Fail closed.
alter table platform_topic_master enable row level security;

-- ══════════════════════════════════════════════════════════════
-- SECTION 2 · get_platform_topic_sections()  (the gated read path)
-- ══════════════════════════════════════════════════════════════
-- Returns the master `sections` jsonb for one platform topic, but ONLY to a
-- teacher who may edit that platform subject (can_edit_platform_subject — the
-- same S4 AND-clamp that lets them fork it). Any other caller fails closed.
-- Returns null when the topic has no master row yet (table not populated) — the
-- client treats null as "master not available, start blank".
create or replace function get_platform_topic_sections(p_subject_id uuid, p_topic_slug text)
returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
    v_slug     text;
    v_sections jsonb;
begin
    -- Gate: only a granted editor of THIS platform subject. Raise (not return
    -- null) so a non-editor gets an explicit denial, never silent data.
    if not can_edit_platform_subject(p_subject_id) then
        raise exception 'not authorised';
    end if;

    -- Map the subject id → its slug (platform_topic_master is keyed by slug).
    -- created_by is null clamp: only platform subjects have master content.
    select slug into v_slug
    from subjects
    where id = p_subject_id and created_by is null;
    if v_slug is null then
        return null;   -- not a platform subject → no master content
    end if;

    select sections into v_sections
    from platform_topic_master
    where subject_slug = v_slug and topic_slug = p_topic_slug;

    return v_sections;   -- null when this topic has no master row yet
end;
$$;
grant execute on function get_platform_topic_sections(uuid, text) to authenticated;
