-- ══════════════════════════════════════════════════════════════
-- ENTITLEMENTS + PLATFORM SETTINGS (WP-A3, 2026-07-11) — run AFTER
-- schema.sql (needs profiles / classes / class_students / subjects).
-- Safe to re-run.
--
-- ONE rule decides "may this person see subject X?" — used by the
-- Netlify Edge content gate (netlify/edge-functions/content-gate.ts),
-- and later by RLS and the UI. Phase A definition:
--   teachers + owner  → every subject
--   students          → subjects of the (unarchived) classes they're in
-- Phase B will OR in active subscriptions, switched by the
-- platform_settings.billing_enforced flag (false = free-for-school year).
--
-- The core function takes an arbitrary profile id, so it is NOT callable
-- by clients (revoked below) — only the auth.uid()-scoped wrappers are.
-- ══════════════════════════════════════════════════════════════

create table if not exists platform_settings (
    key        text primary key,
    value      jsonb not null,
    updated_at timestamptz not null default now()
);
insert into platform_settings (key, value) values
    ('billing_enforced', 'false'::jsonb),
    ('content_protect',  'true'::jsonb),
    -- Per-student daily sanity cap on auto-graded Daily-Revise / Review answers
    -- (WP-A7). Blunts scripted grinding; well above any real student's volume.
    -- Read by record_mastery_answer() (daily-revise-functions.sql).
    ('daily_answer_cap', '1000'::jsonb)
on conflict (key) do nothing;

alter table platform_settings enable row level security;
drop policy if exists "platform_settings_read_authed" on platform_settings;
create policy "platform_settings_read_authed" on platform_settings
    for select using (auth.role() = 'authenticated');
-- No client write policies — settings change via the SQL editor for now,
-- via owner-only admin RPCs in Phase B.

-- ── core rule (server-side only) ──
create or replace function has_subject_access(p_profile uuid, p_subject text)
returns boolean
language sql stable security definer set search_path = public as $$
    select
        exists (
            select 1 from profiles p
            where p.id = p_profile and (p.role = 'teacher' or p.is_owner)
        )
        or exists (
            select 1
            from class_students cs
            join classes  c on c.id = cs.class_id
            join subjects s on s.id = c.subject_id
            where cs.student_id = p_profile
              and s.slug = p_subject
              and not c.archived
        );
$$;
-- security definer functions are EXECUTE-able by PUBLIC by default — this
-- one must not be (it answers for ANY profile id, not just the caller's).
revoke execute on function has_subject_access(uuid, text) from public;
revoke execute on function has_subject_access(uuid, text) from anon;
revoke execute on function has_subject_access(uuid, text) from authenticated;

-- ── caller-scoped wrappers (safe to expose) ──
create or replace function my_subject_access(p_subject text) returns boolean
language sql stable security definer set search_path = public as $$
    select has_subject_access(auth.uid(), p_subject);
$$;
grant execute on function my_subject_access(text) to authenticated;

-- One round trip for the Edge gate: both verdicts at once.
--   allow_content — may load this subject's topic pages / assets
--   allow_bank    — may load question-bank.js (embeds answers inline, so
--                   it is TEACHER/OWNER-only; students must never fetch it)
create or replace function edge_gate_check(p_subject text) returns jsonb
language sql stable security definer set search_path = public as $$
    select jsonb_build_object(
        'allow_content', has_subject_access(auth.uid(), p_subject),
        'allow_bank', exists (
            select 1 from profiles p
            where p.id = auth.uid() and (p.role = 'teacher' or p.is_owner)
        )
    );
$$;
grant execute on function edge_gate_check(text) to authenticated;

-- UI helper: the subjects this account may access, with the reason —
-- feeds hub cards, the account-menu subject switcher and empty states.
create or replace function get_my_entitlements() returns jsonb
language sql stable security definer set search_path = public as $$
    select case
        -- teachers/owner: every active subject
        when exists (select 1 from profiles p
                     where p.id = auth.uid() and (p.role = 'teacher' or p.is_owner))
        then coalesce((select jsonb_agg(jsonb_build_object(
                 'subject', s.slug, 'name', s.name, 'icon', s.icon,
                 'colour', s.colour, 'via', 'staff') order by s.sort_order)
             from subjects s where s.active), '[]'::jsonb)
        -- students: subjects of their unarchived classes
        else coalesce((select jsonb_agg(jsonb_build_object(
                 'subject', s.slug, 'name', s.name, 'icon', s.icon,
                 'colour', s.colour, 'via', 'class') order by s.sort_order)
             from (select distinct c.subject_id
                     from class_students cs
                     join classes c on c.id = cs.class_id
                    where cs.student_id = auth.uid() and not c.archived) m
             join subjects s on s.id = m.subject_id
            where s.active), '[]'::jsonb)
    end;
$$;
grant execute on function get_my_entitlements() to authenticated;
