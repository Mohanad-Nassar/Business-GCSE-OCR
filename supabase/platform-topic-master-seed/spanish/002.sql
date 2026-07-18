-- ══════════════════════════════════════════════════════════════
-- PLATFORM TOPIC MASTER SEED (spanish) — GENERATED FILE, DO NOT EDIT BY HAND
-- Part 2 of 2. Built by tools/build_question_bank.py.
-- Run every part, in order, AFTER supabase/subjects-v2-s5-master-content.sql.
-- Seeds the master `sections` that 'Make a copy' pre-fills a fork with.
-- Safe to re-run (upserts by (subject_slug, topic_slug)).
-- Generated: 2026-07-18T16:24:22Z
-- ══════════════════════════════════════════════════════════════
insert into platform_topic_master (subject_slug, topic_slug, page_name, sections)
values
('spanish', 'x-1-listening-and-dictation', 'X.1 Listening and Dictation', '{"learn": {"enabled": true, "items": [{"title": "This topic is being written", "html": "<p>🚧 <strong>Content for this topic is on its way.</strong> Key Learning notes, practice questions and exam-style questions for <strong>X.1 Listening and Dictation</strong> will appear here soon.</p>"}]}}'::jsonb),
('spanish', 'x-2-reading-and-translation-into-english', 'X.2 Reading and Translation into English', '{"learn": {"enabled": true, "items": [{"title": "This topic is being written", "html": "<p>🚧 <strong>Content for this topic is on its way.</strong> Key Learning notes, practice questions and exam-style questions for <strong>X.2 Reading and Translation into English</strong> will appear here soon.</p>"}]}}'::jsonb),
('spanish', 'x-3-speaking-read-aloud-and-photo-card', 'X.3 Speaking: Read-Aloud and Photo Card', '{"learn": {"enabled": true, "items": [{"title": "This topic is being written", "html": "<p>🚧 <strong>Content for this topic is on its way.</strong> Key Learning notes, practice questions and exam-style questions for <strong>X.3 Speaking: Read-Aloud and Photo Card</strong> will appear here soon.</p>"}]}}'::jsonb),
('spanish', 'x-4-writing-and-translation-into-spanish', 'X.4 Writing and Translation into Spanish', '{"learn": {"enabled": true, "items": [{"title": "This topic is being written", "html": "<p>🚧 <strong>Content for this topic is on its way.</strong> Key Learning notes, practice questions and exam-style questions for <strong>X.4 Writing and Translation into Spanish</strong> will appear here soon.</p>"}]}}'::jsonb)
on conflict (subject_slug, topic_slug) do update set
  page_name = excluded.page_name,
  sections = excluded.sections,
  updated_at = now();
