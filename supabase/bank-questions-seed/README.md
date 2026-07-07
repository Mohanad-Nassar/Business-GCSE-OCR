# bank_questions seed files

Everything in here is **generated** by `tools/build_question_bank.py` — do not edit by hand.

- Use the per-subject folders: **`business/`** (and, once their content exists,
  `computer-science/`, `economics/`). Each folder holds numbered `NNN.sql` parts;
  run them **in order**, one at a time, in the Supabase SQL editor, **after**
  `supabase/bank-questions-schema.sql`. Each part is a standalone upsert
  (safe to re-run).
- Preferred alternative: skip these files entirely and run
  `python tools/build_question_bank.py --upload` (needs `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` in `.env`), which pushes the same rows over the
  REST API.
- The old numbered `NNN.sql` files that used to sit directly in this folder were
  the **legacy single-subject seed** with unprefixed page/question ids and no
  `subject_slug` column. They have been deleted — if one reappears from an old
  branch or backup, do not run it; regenerate with the build script instead.
