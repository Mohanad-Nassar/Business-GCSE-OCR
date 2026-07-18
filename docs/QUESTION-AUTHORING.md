# Writing questions that actually teach — ALL subjects

**Read this before writing any MCQ, True/False, readCheck, matching or
fill-the-blanks item, in any subject** (Business, Economics, Computer Science,
Additional Maths, Spanish, and every future subject). Written for AI content
builders. Owner instruction, 2026-07-18: these failure modes recur across the
whole platform — treat this file as a hard contract, not advice.

The point of every activity is that the student **reads, thinks and learns**.
An item a student can answer *without understanding* has failed, even if it is
"correct". The rules below exist to close the shortcuts students actually use.

---

## 1. Never let the correct answer be guessable by shape

**The length tell (the #1 repeated defect).** Students learn that the longest,
most-detailed option is usually right, and guess by length instead of reading.

- The correct answer **must NOT be the unique longest option.**
- **Every** item must have **at least one distractor that is equal to or longer
  than the correct answer** — and that distractor must be a *genuine trap* (a
  plausible near-miss), not obvious filler.
- Vary which position (A/B/C/D) is correct across a set — no positional bias.
- Keep all options in the **same register, tense and grammatical form** so none
  stands out. Don't make the right one the only "textbook-worded" option.

**Automated check.** A correct answer that is the strict-longest option is a
defect. Audit a page with a length pass (strip HTML, compare option character
lengths per item); fail any item where the correct option is uniquely longest,
or where no distractor is ≥ the correct option's length. (Reference
implementation: the Spanish pilot's `audit.js`.)

## 2. Distractors must be real errors, not joke options

Every wrong option should be a mistake a real student genuinely makes — a
misconception, a false friend, a wrong tense, a sign error, a plausible
mis-reading. Joke or absurd options let students eliminate by silliness and
learn nothing. Mine the misconceptions list / examiner reports for distractors.

## 3. Never reveal the answer inside the prompt

- Don't restate the answer in the stem, a hint, or an example.
- **Listening / dictation items:** the prompt must be **audio only** — do NOT
  print the transcript next to the blank, because the transcript contains the
  answer. (In this codebase, mark the Spanish with `data-say="…" data-listen`;
  `speech.js` removes the written text and leaves only the 🔊 button, so the
  student must decode the audio.) A transcript is fine only where it does **not**
  give away what is being tested (e.g. beside a fully-revealed model answer).
- Fill-the-blanks: the surrounding words must not spell out the missing one.

## 4. Language-assessment specifics (Spanish / MFL)

- Test the **skill named**: meaning-choice, listen-and-choose (audio-only),
  grammar-in-context (agreement, ser/estar, gustar, tense), or translation.
- Distractors should turn on **one** feature a learner confuses: negation
  (`se debe` vs `no se debe`), quantity (`más` vs `menos`), tense
  (`voy a` vs present vs preterite), agreement (`gusta`/`gustan`,
  adjective endings), false friends (`sensible`, `éxito`, `ropa`).
- Keep all options **on the prescribed wordlist** except a deliberately-tested
  off-list item.

---

## Companion contract

Written/prose exam answers use **tick-the-mark-scheme self-marking** (grouped
`markPoints`) — see `docs/SELF-MARK-POINTS-AUTHORING.md`. That is the platform
standard for every subject.
