-- ══════════════════════════════════════════════════════════════
-- PLATFORM TOPIC MASTER SEED (computer-science) — GENERATED FILE, DO NOT EDIT BY HAND
-- Part 2 of 2. Built by tools/build_question_bank.py.
-- Run every part, in order, AFTER supabase/subjects-v2-s5-master-content.sql.
-- Seeds the master `sections` that 'Make a copy' pre-fills a fork with.
-- Safe to re-run (upserts by (subject_slug, topic_slug)).
-- Generated: 2026-07-17T19:29:31Z
-- ══════════════════════════════════════════════════════════════
insert into platform_topic_master (subject_slug, topic_slug, page_name, sections)
values
('computer-science', '2-3-2-testing', '2.3.2 Testing', '{"learn": {"enabled": true, "items": [{"title": "This topic is being written", "html": "<p>🚧 <strong>Content for this topic is on its way.</strong> Key Learning notes, practice questions and exam-style questions for <strong>2.3.2 Testing</strong> will appear here soon.</p>"}]}}'::jsonb),
('computer-science', '2-4-1-boolean-logic', '2.4.1 Boolean Logic', '{"learn": {"enabled": true, "items": [{"title": "This topic is being written", "html": "<p>🚧 <strong>Content for this topic is on its way.</strong> Key Learning notes, practice questions and exam-style questions for <strong>2.4.1 Boolean Logic</strong> will appear here soon.</p>"}]}}'::jsonb),
('computer-science', '2-5-1-languages', '2.5.1 Languages', '{"learn": {"enabled": true, "items": [{"title": "This topic is being written", "html": "<p>🚧 <strong>Content for this topic is on its way.</strong> Key Learning notes, practice questions and exam-style questions for <strong>2.5.1 Languages</strong> will appear here soon.</p>"}]}}'::jsonb),
('computer-science', '2-5-2-the-integrated-development-environment-ide', '2.5.2 The Integrated Development Environment (IDE)', '{"learn": {"enabled": true, "items": [{"title": "This topic is being written", "html": "<p>🚧 <strong>Content for this topic is on its way.</strong> Key Learning notes, practice questions and exam-style questions for <strong>2.5.2 The Integrated Development Environment (IDE)</strong> will appear here soon.</p>"}]}}'::jsonb)
on conflict (subject_slug, topic_slug) do update set
  page_name = excluded.page_name,
  sections = excluded.sections,
  updated_at = now();
