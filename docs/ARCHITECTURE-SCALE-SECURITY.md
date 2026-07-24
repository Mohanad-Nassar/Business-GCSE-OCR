# Platform architecture — security, scale & reliability (pre-scale review)

**Status:** DRAFT for review (2026-07-15). Strategic architecture assessment
before adding more platform subjects and onboarding many schools/users.
**Companion to:** [docs/SUBJECTS-V2-SPEC.md](SUBJECTS-V2-SPEC.md) (the Subjects
workspace + override-fork). Read this one first — it sets the foundation the
fork sits on.

---

## 0. TL;DR (the one-paragraph version)

You do **not** need to change platforms. Supabase (Postgres + RLS + RPCs) and
Netlify (edge + functions) are an appropriately scalable, low-ops stack for a
UK multi-school revision platform, and you already run the *correct* secure
assessment pattern in production — `bank_questions` (answers split out, no RLS)
+ server-side grading RPCs for Daily Revise, Tasks and spaced repetition. The
**one** structural security problem is that the original **topic lesson pages**
were built before that pattern existed: they inline correct answers in
JavaScript and grade in the browser, and the server trusts the browser's verdict.
The plan is therefore not a rewrite — it's **(1)** extend the grading pattern you
already own to the topic pages and delete the inline answers, **(2)** harden and
document the multi-tenant isolation you already have, and **(3)** fix a small
number of write-path/scale details before load grows. Everything else is
evolution you can do incrementally without breaking students mid-year.

---

## 1. Threat model (proportionality — read before the fixes)

This is a **formative revision & engagement** platform, not a proctored
high-stakes exam system. That bounds scope deliberately:

**In scope (must fix):**
- Correct answers must not be trivially readable in page source / DevTools.
- A student must not be able to **forge** correctness, XP, mastery, streaks or
  leaderboard rank — because those feed spaced repetition, gamification and
  teacher analytics. Forged mastery *silently corrupts the learning signal*, which
  is worse than a leaked answer.
- Cross-school data isolation must be airtight (one school never sees another's
  students, content, or analytics).

**Explicitly OUT of scope (disproportionate for revision):**
- Remote proctoring, webcam monitoring, browser lockdown, question watermarking,
  seed-site beacons. These belong to summative exams, not revision. Your existing
  light-touch integrity (paste-guard, `integrity-events`, the edge scrape
  throttle) is the right level and stays.
- Making it *impossible* for a determined student to see an answer they've
  already attempted. The bar is "answers aren't handed out for free and scores
  can't be faked," not "NSA-grade." Perfect secrecy of a revision MCQ is neither
  achievable nor worth the cost.

Sources for the general principles: server-side grading authority and never
trusting client computations for scored work
([InQuizitive client-side trust bypass write-up](https://medium.com/@JIT_Shellcode/inquizitive-client-side-injection-lms-trust-bypass-and-stored-xss-0ea4da8d22fa)),
pooled multi-tenant isolation + observability
([AWS: building multi-tenant SaaS](https://aws.amazon.com/blogs/architecture/lets-architect-building-multi-tenant-saas-systems/),
[Brocoders multi-tenant guide 2026](https://brocoders.com/blog/multi-tenant-architecture-designing-saas-apps/)),
and item-bank randomisation
([online exam security guide](https://examonline.in/online-exam-security/)).

---

## 2. Current architecture (as-is, verified in code)

| Layer | Today | Verdict |
|---|---|---|
| **Auth** | Supabase Auth, JWT in `vidya_at` cookie + bearer; edge verifies via PostgREST | ✅ Sound |
| **Content — platform** | ~100 **static HTML** files under `/subjects/*`, edge-gated ([content-gate.ts](../netlify/edge-functions/content-gate.ts)) | ⚠️ Answers inline (see §3); delivery model fine |
| **Content — teacher** | DB rows (`custom_topics.sections` jsonb) rendered by `topic.html` | ✅ Right model |
| **Interactive engine** | [script.js](../script.js) grades in the browser vs inline `mcqData/.ans`, `tfData/.answer`, exam keys | ❌ Client-trust (see §3) |
| **Progress** | `record_progress(page_id, …, p_is_correct, p_done, p_total)` stores the **client's** verdict | ❌ Forgeable (see §3) |
| **Daily Revise / Tasks / Spaced-rep** | `bank_questions` (answer split out, **no RLS**) + `record_mastery_answer()` grades **server-side** | ✅ **This is the correct pattern — already built** |
| **Multi-tenancy** | Single shared schema; row isolation by `school_id` + RLS + SECURITY DEFINER RPCs | ✅ Industry-standard "pooled" model; needs hardening/tests (§5) |
| **Hosting/scale** | Netlify edge + functions, Supabase Postgres | ✅ Serverless auto-scale; a few limits to mind (§6) |

**Key insight:** two content+grading systems coexist. The **newer** one
(bank_questions + server grading) is secure and is what everything built since
Daily Revise uses. The **older** one (static pages + script.js) is the legacy
liability. The whole plan is to converge on the newer one.

---

## 3. The core problem, precisely

On a topic lesson page (e.g. [2_4_1_introduction_marking_mix.html](../subjects/business/2_4_1_introduction_marking_mix.html)):

1. **Answers are shipped to the browser.** `mcqData[i].ans` (correct index) and
   `.explain` are inline JS; same for `tfData`, fill-in-blank bracket answers and
   exam mark schemes. `View Source` reveals every answer — no tools needed.
2. **The browser is the judge.** [script.js:1506](../script.js#L1506)
   `chosenOi === mcqData[qi].ans` decides correctness client-side.
3. **The server trusts the judge.** [script.js:322](../script.js#L322) sends
   `p_is_correct` and `record_progress` stores it verbatim. One console call —
   `record_progress('business:2-4-1','mcq','q3',{}, true, 10, 10)` — forges a
   perfect score, and with it XP, mastery, streaks, leaderboard rank and the
   teacher's analytics.

Problem 2+3 (forgeable grading) is the more damaging half: it **pollutes the
adaptive learning signal and every league table**, invisibly. Fixing it also
fixes problem 1 as a side effect, because once the server grades, the client no
longer needs the answer.

**You already have the antidote table.** `bank_questions` holds `answer_key` for
platform subjects server-side (seeded by `tools/build_question_bank.py --upload`;
see `supabase/bank-questions-seed/`). The topic pages simply don't use it yet.

---

## 4. Target architecture

### 4.1 Server-authoritative grading (the keystone fix)
Introduce **one** grading entry point the topic pages call instead of grading
locally — a direct sibling of `record_mastery_answer()`:

```
grade_topic_answer(p_question_key text, p_answer jsonb) returns jsonb
  -- SECURITY DEFINER, fixed search_path, rate-limited (reuse the daily cap)
  -- 1. look up bank_questions.answer_key by question_key   (server-only)
  -- 2. compute is_correct server-side (mcq index / tf bool / fib blanks)
  -- 3. record_progress with the SERVER's is_correct (+ done/total derived
  --    server-side from the page's real question count, not client-claimed)
  -- 4. return { correct, explain, correct_option }  -- revealed only AFTER answering
```

- The page fetches **answerless** question snapshots (the `snapshot` half of
  `bank_questions`, exactly what Daily Revise already serves) and renders them.
- `mcqData/.ans/.explain` inline blocks are **deleted** from the pages.
- `record_progress` is **locked down** to stop accepting a client `is_correct`
  for gradable sections — it either grades internally or only accepts writes
  from `grade_topic_answer`. (Non-gradable progress like "read the notes" can
  stay a simple client mark — there's nothing to forge.)
- **Result:** answers never reach the browser before an attempt, and scores are
  unforgeable. Identical trust model to the code you already trust in production.

`done/total` per section must be derived from the **server's** count of that
page's questions, so a client can't claim `10/10` on a page with 12 questions.
That count comes from `bank_questions` (already grouped by `page_id`).

### 4.2 One content model (converge — evolution, not prerequisite)
The end state is **all** content — platform and teacher — addressable in the DB
model and rendered by the **one** dynamic renderer (`topic.html`), with questions
always served answerless. Platform subjects already have their **questions** in
`bank_questions`; converging the **reading/notes** into the same
`sections`-style store (or keeping notes as static, CDN-cached HTML while
questions go answerless via the API — see decision D-B) removes the duplicated
static-page maintenance burden and is what makes the **override-fork in
SUBJECTS-V2 clean** (a fork is then just a row that shadows a topic, no static
file to redirect around).

Two honest options, to be chosen (D-B in §7):
- **(B1) Hybrid — recommended first step.** Keep the reading/notes as static
  CDN-served HTML (fast, cheap, reliable), but strip answers and route all
  question rendering + grading through the API/`bank_questions`. Smallest change
  that fully closes the security hole; content delivery stays as scalable as it
  is now.
- **(B2) Full DB content.** Migrate the static pages' prose into the DB model too,
  retire the per-topic HTML, render everything through `topic.html`. More work and
  a heavier read path, but one content pipeline, per-tenant variation for free,
  and the cleanest fork story. Do this *after* B1 if/when static-page maintenance
  becomes the bottleneck.

### 4.3 Multi-tenancy: keep pooled, harden it
Shared-schema + `school_id` row isolation + RLS is the **correct, cheapest**
model for many similar tenants (schema-per-tenant / DB-per-tenant is
operationally heavy and unwarranted here — the AWS/Brocoders guidance is to not
over-isolate until a tenant demands it). What it needs before scale:
- **An RLS test harness** run as *anon*, *student A vs B*, *teacher of school X
  vs Y*, on every table — codified, not ad-hoc (the `auth-authz` skill's
  "prove it as another user" rule). This is the single highest-leverage
  reliability investment before onboarding schools.
- **`school_id` present and indexed** on every tenant-scoped table; a checklist
  that new tables can't ship without it.
- SECURITY DEFINER functions audited for a pinned `search_path` (they already
  set it) and for not leaking cross-tenant rows in their return shape.

### 4.4 Reliability
- **Fail-open vs fail-closed** is already thoughtfully chosen at the edge
  (content-gate fails open on infra blips, closed on definitive deny) — keep that
  philosophy, document it per surface.
- Add **observability**: structured logs on auth failures, permission denials,
  admin actions, and grade writes (the `secure-coding` logging rule) + a simple
  uptime/error dashboard before scale, so a bad deploy is caught in minutes.
- **Backups/restore drill**: confirm Supabase PITR is on and actually
  test-restore once — an untested backup isn't a backup.

---

## 5. Multi-tenant isolation — the pre-scale checklist
1. RLS ON for every table (✅ today) — plus the automated cross-tenant test suite (§4.3).
2. No table without `school_id`/ownership scoping in its policies.
3. No RPC returns another tenant's rows in its projection (audit each SECURITY DEFINER return list).
4. `bank_questions`-style "no policy = no direct read" for any answer-bearing or cross-tenant-cache table.
5. Service-role key server-only (✅ — it's in Netlify functions, never shipped).
6. Audit log on every privilege/grant mutation (✅ pattern exists in school-admin.sql; extend to V2).

---

## 6. Scalability details to fix before load grows (Supabase/Postgres)
- **Connection pooling:** ensure the app/functions use Supabase's pooled
  (Supavisor/pgBouncer, transaction mode) endpoint, not direct connections —
  serverless + many schools = connection storms otherwise. Cheapest scale win.
- **Write amplification on `progress_events`:** every answer is an INSERT.
  At thousands of concurrent students this is the hottest path. Mitigations, in
  order: keep the append + summary split you have; ensure the right composite
  indexes; consider batching low-value events; partition/rollup old events later.
  Grading via one RPC (§4.1) actually helps — it's one round trip per answer with
  server validation, not several.
- **RLS performance:** the SECURITY DEFINER helper functions are called per-row
  in some policies — keep them `stable`, ensure the columns they filter on are
  indexed, and watch the query plans on the leaderboard / analytics reads (the
  heaviest). Cache expensive aggregates (leaderboard) with a short TTL rather than
  recomputing per request.
- **Edge caching:** static content is already CDN-served; fold the override-set
  lookup for the fork into the *existing* 60s-cached edge verdict, never a second
  round trip (already noted in SUBJECTS-V2 §11.2).
- **Cost guardrails:** the `cloud-scale-limits` guidance — know the Supabase plan's
  row/egress/function limits for your target school count *before* onboarding, and
  put a ceiling alert on them.

---

## 6b. P1c implementation invariants (regression watch)

Things that have broken more than once while converting topic pages to
server-graded — check these on EVERY activity conversion and rollout:

- **The "redo wrong" nudge must key off the real section total, not the inline
  array length.** `updateRedoWrongButtons()` shows "✨ So close! You got N wrong…"
  only once `answered >= total`. Historically `total` was `mcqData.length` /
  `tfData.length` — but P1c **empties those arrays** (`const mcqData = []`), so the
  total silently became 0 and the nudge misfired (fired too early, or after the
  counter broke, not at all). **Invariant:** when the inline array is empty/absent,
  read the total from `ProgressStore.get(pageId, section).total` (the
  server/`progress_summary` total). Broken twice (2026-07-15) — do not reintroduce.
- **The completion celebration must fire when all questions are ANSWERED
  (`attempts >= total`), not only on a perfect score (`done === total`).**
  `showCelebration` already renders the prominent "🔁 Redo N wrong" popup button
  (it calls `redoWrongAnswers`), so the student sees the retry prompt front-and-
  centre instead of an inline banner they must scroll to. `res.done` is the
  CORRECT count, not the answered count — gating the popup on `done === total`
  means it never appears when there are wrong answers.
- **Server snapshot field names differ from the inline arrays.** TF bank snapshot
  uses `question` (inline used `statement`); MCQ inline used `q`/`opts`/`ans`,
  bank uses `question`/`options` + hidden `answer_key`. Always render server mode
  from the SNAPSHOT field names, with a fallback to the legacy name.
- **The score counter denominator = attempts, not the section total.** `#mcqTotal`
  / `#tfTotal` show how many have been *attempted* (matches the legacy counter);
  the mastery *progress bar* uses correct/total. Don't wire `res.total` into the
  attempts counter.
- **Server mode must bypass `ProgressStore.saveAnswers`** (it mirrors to
  `record_progress` with client `is_correct` AND awards XP) — use `setAnswersBulk`
  for display only; the grade RPC already recorded progress + drives XP from the
  server verdict.
- **Stripping an inline array is only safe when that activity renders from the
  bank by default** (page sets `window.SERVER_GRADED = true` and the section has
  bank rows). Never strip an array whose activity still lacks a server path.
- **`record_mastery_answer`'s durable mastery counters are FIRST-EVER-gated.**
  `total_mastered` (daily_revise_stats) and `mastery_events` fire only the first
  time a question is EVER mastered per student — deduped against an existing
  `mastery_events` row, **not** the old `v_new_count = 3 and v_old_count < 3`
  transition guard, which re-fired on every master→reset→re-master cycle and let a
  scripted client farm mastery (and the coins/XP/leaderboard rank that read it).
  `mastery_count` still resets on a wrong answer so a forgotten question re-surfaces.
  Do not revert the gate to the bare transition guard (added 2026-07-19 for the
  coin economy — supabase/rewards-store.sql / [[rewards-store-feature]]).

---

## 7. Decisions — LOCKED (2026-07-15)
- **D-A · Scale target = low-thousands concurrent** (dozens of schools). Standard
  pooled connections + indexed write path; revisit heavier work (partitioning,
  replicas) at ~10k. §6 done at "sensible now, not gold-plated."
- **D-B · Content model = full DB content (B2)** is the target end-state (one
  renderer, retire per-topic static HTML). BUT sequencing: **P1 server-grading is
  built first into the shared engine** (`script.js`, which both static pages and
  `topic.html` run), so it secures the hole immediately and is reused — not
  redone — when B2 migrates the prose. B2 itself is Phase P4.
- **D-C · Assessment stakes = may become summative.** So the grading layer is
  built to a stricter bar now: immutable `progress_events` log, exam-type answers
  never revealed client-side, scores/`done`/`total` derived server-side, full
  audit. Proctoring/lockdown still deferred until stakes actually change — but the
  data model won't need re-architecting when they do.
- **D-D · Build order = P0 → P1 first** (secure the core), then SUBJECTS-V2 S0–S4
  in parallel with P3; SUBJECTS-V2 S5 (fork) after P1 (and after P4/B2 for the
  cleanest version).

---

## 8. Phased plan (non-breaking, students never interrupted)

| Phase | Deliverable | Risk | Notes |
|---|---|---|---|
| **P0 · Baseline & tests** | Codify the cross-tenant RLS test harness (§4.3); turn on observability + verify PITR restore. No user-facing change. | Low | Do first — it's the safety net for everything after. |
| **P1 · Server-authoritative topic grading** | `grade_topic_answer()` RPC; topic pages fetch answerless snapshots + call it; delete inline `mcqData/.ans` etc.; lock down `record_progress` for gradable sections. Roll out subject-by-subject behind a flag. | **High-value, Med risk** | Closes both the leak and the forgery. Reuses the Daily-Revise pattern wholesale. Biggest single security win. |
| **P2 · Anti-forgery sweep** | Audit every client→server "trust" call (XP, streaks, mastery, leaderboard writes) for the same client-verdict flaw; move any scoring decision server-side. | Med | Ensures P1 didn't leave a side door (e.g. a gamification RPC that still trusts the client). |
| **P3 · Scale hardening** | §6 items: pooled connections, progress_events indexing/rollup, leaderboard caching, cost alerts. | Low-Med | Do before onboarding the next wave of schools. |
| **P4 · Content convergence (optional, B2)** | Migrate static prose into the DB model; single renderer; retire per-topic HTML. | Med-High | Only if/when static maintenance or the fork demands it. Unblocks the cleanest SUBJECTS-V2 fork. |

**Ordering vs SUBJECTS-V2:** P0 → P1 → P2 first (secure the core), then
SUBJECTS-V2 S0–S4 (sharing/tabs/grants) can proceed in parallel with P3, and
SUBJECTS-V2 S5 (fork) lands after P1 (ideally after P4 if B2 is chosen).

---

## 9. What NOT to do (explicit)
- **Don't migrate off Supabase/Netlify.** The problem is the trust boundary, not
  the platform. A rewrite on new infra would cost months and fix nothing the RPC
  pattern above doesn't.
- **Don't add proctoring/lockdown/watermarking.** Disproportionate for revision (§1).
- **Don't go schema-per-tenant.** Pooled + RLS is correct until a single tenant's
  scale or compliance genuinely forces isolation — none does yet.
- **Don't try to make already-answered questions un-inspectable.** Chasing perfect
  secrecy past "not handed out for free + unforgeable scores" is wasted effort.

---

*End of assessment. Please weigh in on §7 (D-A…D-D); with those set I'll fold the
phase plan into the master plan and can start at P0.*
