# Report Writer — Plan (source of truth)

**Status:** SPEC — not built yet. Written 2026-07-20.
**Owner decisions locked** (do not re-litigate): see §1.

A **Report** turns a student's real Vidya activity — accuracy per topic, mastery,
reviews completed, activity over time — into a clear, actionable, parent-shareable
summary, exportable to **PDF** (print) and **Excel** (CSV). No AI anywhere: every
sentence is deterministic templating over the numbers.

Mirrors how [`docs/REWARDS-STORE-PLAN.md`](REWARDS-STORE-PLAN.md) was speced — this
file is the contract; code follows it.

---

## 1. Locked decisions

| Question | Decision |
|---|---|
| **Audience / entry point** | Four report views, all read-only aggregates from the same spine: (1) **Per-student** (parent + teacher copy), (2) **Class summary** (teacher / head of class), (3) **Head of Department** cross-class within a subject, (4) **SLT** cross-subject whole-cohort. Student/parent self-serve is Phase R2. |
| **Export** | **Print-to-PDF** (a dedicated print stylesheet + `window.print()`, zero new deps) **+ CSV** (via the existing `downloadCsv`/`toCsv` in `tasks-shared.js`). No jsPDF/SheetJS in v1. |
| **Granularity / window** | **Topic-group level** headline (groups from `page-groups-all.js`), with a **topic drill-down table** underneath. Selectable **window**: All-time · This term · Since last report · Last 30 days. |
| **Accuracy sourcing** | **Split: graded vs practice.** *Graded* = server-graded Daily-Revise answers (`section='daily-revise'`, correctness computed in `record_mastery_answer`) — trustworthy. *Practice* = topic-page section answers (client-written `is_correct`, currently forgeable — memory `architecture-scale-security`). The parent-facing narrative leans on **graded**; practice is shown but labelled "practice". |
| **v1 metric additions** | Fold in the cheap ✅ signals (§3b): trend-verdict badge, consistency + reviews-coming-up, mastery velocity, and a **teacher-only** block (misconceptions, effort-vs-accuracy flag, cohort percentile) that is **suppressed on the parent copy**. |
| **No AI** | All prose = deterministic templates over the metric numbers. |
| **Fairness first** | Constructive framing (§6). Strengths + growth + next steps, never a wall of red. |

---

## 2. Principles

1. **No AI / no LLM.** Prose is a pure function of the numbers (`report-templater.js`).
   Same input → same words, every time. Testable with `jsdom`.
2. **Fairness first** (owner's explicit requirement, memory `architecture-scale-security`,
   REWARDS §4.2). Mirror the coin system's stance: **reward effort + improvement;
   accuracy is a signal, not a verdict.** Lead with strengths and growth-over-time;
   frame weak topics as "next steps", never a red scoreboard. A low-activity or
   struggling student's report must still read as encouraging and specific.
3. **Server-enforced access** (UK GDPR — children's data). A teacher may report only
   on their own students; enforced in a SECURITY DEFINER RPC via `teaches_student()` /
   `is_class_owner()`. RLS on base tables stays self-only. Copy the `get_leaderboard`
   trust model verbatim. The browser never receives a number the caller isn't
   authorised to see.
4. **Trust the server for numbers.** All metrics come from the new RPC, which reuses
   `_lb_window_metrics` + `daily_revise_stats` + `mastery_events` + `topic_reviews`.
   No client-computed totals in the report body.
5. **Subject-scoped everywhere.** `page_id like slug || ':%'`; report is always for one
   (student, subject) pair. Student links carry `?subject=` (memory `richtext-and-subject-links`).
6. **House architecture** (memory `business-gcse-shared-js-architecture`): logic lives in
   shared JS, not per-HTML edits; the standalone page uses `tasksAuthInit('teacher')` +
   `account-cluster.js`, resets the body grid, and the auth guard redirects to
   `/index.html`. Match `teacher-analytics.html` exactly.

---

## 3. Data sources (all already exist — reuse, don't rebuild)

| Signal | Source | Trust |
|---|---|---|
| Effort spine: attempts / distinct_q / answered / correct / mastered per window | `_lb_window_metrics(class_ids, subject, from, to)` (`leaderboard.sql`) | mixed (see below) |
| Lifetime mastery | `daily_revise_stats.total_mastered` (per student, per subject) | server |
| Windowed mastery (first-mastery log) | `mastery_events` (`subject_slug`, `mastered_at`) | server |
| Reviews completed | `topic_reviews.completed_at` (spaced-repetition) | server |
| Current streak / active days | `_lb_streaks` + `progress_events` distinct dates | server |
| **Graded accuracy** per topic | `progress_events` where `section='daily-revise'`, `question_id`→`bank_questions` | **server-graded** |
| **Practice accuracy** per topic | `progress_events` where `section` in topic-page sections | client-written (forgeable) |
| Topic/group names + tree | `page-groups-all.js` (`PAGE_GROUPS_ALL[slug]`) | static |
| Per-topic bank totals (denominators) | `section-totals-all.js` / `bank_questions` count | static/server |

**Graded vs practice split** hinges on `progress_events.section`. Daily-Revise rows are
graded server-side (`record_mastery_answer`), so they are the honest accuracy source.
Topic-page section rows (`mcq`/`tf`/`fib`/…) carry client-written `is_correct` — shown,
but labelled "practice", never used for the headline accuracy sentence. This is the same
data the leaderboard already trusts, so it is acceptable for v1; the label is the
honesty guarantee.

---

## 3b. v1 metric additions (all ✅ off data we already query)

Folded into the per-student report (and rolled up for Class/HoD/SLT where noted):

| Metric | Definition | Shown to |
|---|---|---|
| **Trend verdict** | `Improving / Steady / Needs a nudge` from graded-accuracy + mastery deltas vs previous window | Parent + all |
| **Consistency** | active days/week in window + longest streak (habit, not score) | Parent + all |
| **Reviews coming up** | count of `topic_reviews` due in next 7 days → "what to revise next" | Parent/Student |
| **Mastery velocity** | new `mastery_events` per week (a pure-growth number; low attainers can shine) | Parent + all |
| **Misconceptions** | top wrong-answer patterns on the student's weak topics (MCQ option distribution, same computation as `get_class_dr_questions`) | **Teacher only** |
| **Effort-vs-accuracy** | quadrant flag: high-effort/low-accuracy → reteach; low-effort → motivate | **Teacher only** |
| **Cohort percentile** | rank within class for the window (reuses leaderboard scoring) | **Teacher only** |

The **teacher-only** block is a distinct region the print stylesheet and the parent
export **omit**. `report-templater.js` takes an `audience: 'parent' | 'teacher'` flag; the
parent branch never receives the teacher-only numbers in its rendered output.

---

## 4. New SQL — `supabase/reports.sql`

One SECURITY DEFINER RPC family, mirroring `daily-revise-analytics.sql` conventions
(each fn checks access itself, `set search_path = public`, `grant … to authenticated`,
returns **aggregates only**).

### `get_student_report(p_student_id uuid, p_subject text, p_from timestamptz, p_to timestamptz)` → `jsonb`

- **Access:** `if not (teaches_student(p_student_id) or p_student_id = auth.uid()) then raise 'Not authorised'`.
  (Self-branch left in now so Phase R2 student/parent self-serve needs no RPC change.)
- **Window:** caller passes explicit `[from, to)`; the RPC also computes the matching
  **previous** window (same length, immediately before `from`) for growth arrows —
  same technique as `get_leaderboard`.
- **Returns** `jsonb`:
  ```
  {
    meta: { student_id, subject, from, to, has_prev, generated_at },
    headline: {                       -- current window, graded unless noted
      attempts, distinct_q,
      graded_answered, graded_correct, graded_accuracy_pct,   -- section='daily-revise'
      practice_answered, practice_correct, practice_accuracy_pct,
      mastered_window, mastered_total,        -- mastery_events window / daily_revise_stats
      reviews_completed,                       -- topic_reviews in window
      active_days, streak
    },
    prev: { … same shape, previous window … },  -- for growth deltas
    activity: [ { week_start, attempts, graded_correct } … ],  -- sparkline buckets
    groups: [ {                          -- one row per PAGE_GROUPS group
      group_id, group_title,
      graded_answered, graded_correct, graded_accuracy_pct,
      practice_answered, practice_correct,
      mastered, bank_total,               -- mastered/total for the group
      prev_graded_accuracy_pct            -- growth per group
    } … ],
    topics: [ {                          -- drill-down, one row per page_id
      page_id, page_name, group_id,
      graded_answered, graded_correct, graded_accuracy_pct,
      practice_answered, mastered, bank_total
    } … ]
  }
  ```
- **Subject scoping:** `progress_events.page_id like p_subject || ':%'`; `mastery_events.subject_slug = p_subject`; bank joins on `bank_questions.subject_slug`. Group attribution is done **client-side** from `PAGE_GROUPS_ALL` (the RPC returns `page_id`; the client folds pages into groups) — keeps the RPC free of the topic tree, exactly like the matrix view.

### `get_class_report_batch(p_class_id uuid, p_from timestamptz, p_to timestamptz)` → `jsonb`
- **Access:** `is_class_owner(p_class_id)`.
- Returns `{ students:[{ student_id, username }], reports:{ <student_id>: <same shape as get_student_report> } }` for every rostered student in one round trip — powers the batch print (one PDF, page-break per student) and a class-level CSV. Reuses the same internal CTEs as the single RPC (factor into an internal `_report_metrics(class_ids, student_ids, subject, from, to)` helper à la `_lb_window_metrics`).

### `get_hod_report(p_subject text, p_from timestamptz, p_to timestamptz, p_group_id uuid default null)` → `jsonb`
- **Access:** the caller's own same-subject classes (every `class` where `teacher_id = auth.uid()` and `subject_id` matches), or one `class_link_group` — the **same pool resolution `get_leaderboard` already does for the `subject`/`groups` teacher scope**. See §10 for the true cross-teacher-department caveat.
- Returns per-class rollups + a **subject-wide topic heatmap** (per group/topic: graded accuracy averaged across the pool, mastered/total, activity volume) + a **coverage map** (topics with near-zero activity anywhere) + class-vs-class engagement (reuses the leaderboard `groups` math). Aggregates only; no per-student rows unless the HoD drills into one class (which re-uses `get_class_report_batch`, still owner-gated).

### `get_slt_report(p_from timestamptz, p_to timestamptz)` → `jsonb`
- **Access:** whole-school role only — `owner` / `school_admin` (memory `school-admin-feature`). If the caller lacks it, `raise 'Not authorised'`.
- Returns cross-subject engagement KPIs (weekly-active %, students on a streak, total mastered, trend over term), a **per-subject health row** (which subjects thriving vs struggling), and an **academic-integrity summary** (paste-guard counts, if `integrity-events.sql` is run). No demographic or year-group cuts in v1 (§10).

> The teacher/admin will run `supabase/reports.sql` in the SQL editor. Hand them the file +
> a read-only sanity query per RPC; I can't run it against live (verify honestly).

---

## 5. Windows

Client maps the picker to `[from, to)`:

| Label | from | to |
|---|---|---|
| All time | `1970-01-01` | `now()` |
| This term | term start (config constant; default 1 Sep / 1 Jan / school year logic) | `now()` |
| Since last report | timestamp of this student's last generated report (localStorage per teacher+student for v1; a `report_runs` table is a Phase R2 nicety) | `now()` |
| Last 30 days | `now() - 30d` | `now()` |

"Since last report" is the growth-forward default the owner wants; the RPC's previous-window delta gives per-metric arrows regardless of which window is chosen.

---

## 6. Deterministic prose (`report-templater.js`)

Pure functions: `(reportJson, names) → { summary, strengths[], nextSteps[], effortNote }`.
**No AI.** Rules, tuned for the fairness principle:

- **Opening line** always leads with effort/engagement, not accuracy:
  *"{Name} answered {attempts} questions across {active_days} days this {window},
  mastering {mastered_window} new questions."*
- **Strengths** = top 1–3 groups by graded accuracy **or** by improvement vs previous
  window (whichever is higher), min activity threshold so a 1-question fluke isn't a
  "strength". Phrased warmly.
- **Growth** = any group/metric up vs previous window gets an explicit
  *"up from X% to Y%"* — improvement is celebrated even when absolute level is low.
- **Next steps** (never "weaknesses") = 1–3 groups with lowest graded accuracy **that
  have enough attempts to be meaningful**, phrased as an action:
  *"A short Daily-Revise session on {group} would help — {mastered}/{total} mastered so far."*
  Under-practised topics are framed as "not started yet", not as failures.
- **Low-activity guard:** if `attempts < threshold`, suppress accuracy verdicts entirely
  and produce an encouraging "getting started" template instead of a red report.
- **Caveat footer** (small print): *"Practice-mode accuracy reflects self-checked answers;
  graded figures come from Daily-Revise questions marked by Vidya."*

Deterministic ⇒ unit-testable: `jsdom` harness feeds fixture JSON, asserts exact strings
and that no "wall of red" (e.g. never more Next-Step items than Strength items when any
strength exists).

---

## 7. Export

- **PDF = print.** A `@media print` stylesheet on `report.html`: hide chrome/nav/controls,
  A4 page setup, `page-break-after` between students in batch mode, black-on-white,
  Vidya wordmark header + generated-date + window in a print header. A "🖨 Print / Save as
  PDF" button calls `window.print()`. Zero dependencies (secure-coding §9).
- **Excel = CSV** via existing `downloadCsv(rows, filename)` (`tasks-shared.js`). Two
  exports: per-student topic CSV (topic, group, graded %, practice %, mastered/total,
  attempts) and, in batch, a class CSV (one row per student × group).
- SheetJS/jsPDF explicitly **out of scope** for v1; revisit only if print output proves
  insufficient (ask before adding).

---

## 8. Files & UI

| File | New? | Role |
|---|---|---|
| `supabase/reports.sql` | new | All RPCs (§4): `_report_metrics` helper, `get_student_report`, `get_class_report_batch`, `get_hod_report`, `get_slt_report`. Owner/admin runs it; not auto-applied. |
| `report.html` | new | Standalone page. Mirrors `teacher-analytics.html`: `business-style.css`, grid reset, `tasksAuthInit('teacher')`, subtab bar for the four views (**Student · Class · Department · School**, the last two shown only if the RPC returns data for the caller's role), pickers, live preview, Print + CSV, batch toggle. Includes `page-groups-all.js`, `section-totals-all.js`, `tasks-shared.js`, `account-cluster.js`, `teacher-nav.js`, `footer-legal.js`. |
| `report.js` | new | Fetches the RPCs, folds pages→groups via `PAGE_GROUPS_ALL`, renders each view, wires Print/CSV/batch. |
| `report-templater.js` | new | Pure deterministic prose (§6), `audience` flag (§3b). Shared for Phase-R2 self-serve. |
| `report.css` *(or inline)* | new | Report layout + `@media print`. Inline in head is fine (matches `teacher-analytics.html`). |
| `teacher-nav.js` | edit | Add a "📄 Reports" link (one line, shared nav — not per-HTML). |

One page, four subtabs (like teacher-analytics' tabs) rather than four HTML files — the
Department/School tabs simply don't render if `get_hod_report`/`get_slt_report` return
empty for the caller's role. No topic-page HTML edits; no changes to existing
analytics/leaderboard code.

---

## 9. Build sequence (Phase R1 = v1)

Built spine-first so each layer is verifiable before the next depends on it.

1. **`reports.sql` — per-student core.** `_report_metrics` helper + `get_student_report`
   + `get_class_report_batch`. Hand owner the file + a read-only test query.
2. **`report-templater.js`** — pure functions (parent/teacher audiences) + `jsdom`
   fixture tests. `node --check`.
3. **`report.html` + `report.js` — Student tab.** Single-student preview (picker → RPC →
   render → prose), then Print stylesheet, then CSV, then class **batch**.
4. **Class tab** — class summary rollup from the same batch RPC.
5. **`reports.sql` — leadership.** Add `get_hod_report` + `get_slt_report`; wire the
   **Department** and **School** tabs (role-gated, hidden when empty).
6. **`teacher-nav.js`** — add the link.
7. **Verify:** `node --check` all JS; jsdom templater tests; manual print-preview
   screenshot per tab; **access matrix** confirmed by SQL the owner runs — a non-owning
   teacher denied `get_student_report`/`get_hod_report`, a non-admin denied
   `get_slt_report`, parent export omits the teacher-only block (§3b).

Phase R2 (later): student/parent self-serve view (RPC already allows the self branch),
`report_runs` table for a true "since last report", and — once the school/role model is
run (§10) — **true cross-teacher HoD** and **whole-school SLT** access + year-group cuts.

---

## 10. Risks / open items

- **Forgeable practice accuracy** — mitigated by the graded/practice label; parent
  narrative uses graded only. Revisit when P1 topic-page hardening lands
  (memory `architecture-scale-security`).
- **Empty/low data** — fairness guard (§6) must be the *first* thing built into the
  templater, not bolted on.
- **"This term" boundary** — needs a term-dates constant; default to a simple
  Sep/Jan/Apr rule for v1, make it a single config object so a school can override.
- **Batch size** — a large class × all-time is one big RPC payload; cap topic rows to the
  subject's real page set (bounded) and `log`/note if any student is truncated. Aggregates
  only, so it stays reasonable — but confirm against the biggest real class before launch.
- **HoD / SLT access depends on the school-role model** (memories `school-admin-feature`,
  `teacher-signup-and-schools`). Those SQL files (`school-admin.sql`, `schools.sql`) are
  **NOT yet run on live**. So in v1:
  - **HoD** report resolves its pool as "the caller's OWN same-subject classes" (works
    today for a teacher who owns their department's classes). A **true** HoD seeing *other*
    teachers' classes needs the department/role grant — Phase R2, gated on the school model.
  - **SLT** report requires `owner`/`school_admin`. If that role isn't present the tab is
    empty and the RPC denies — build it now, but it only lights up once roles exist. Flag
    this to the owner rather than silently shipping a dead tab.
- **Year-group / cohort and PP·SEND cuts** — **no such metadata in the model**; explicitly
  out of scope for v1. Do not fabricate a cut we can't source. Revisit if/when the school
  model adds year + demographic fields (data-protection review required first).
- **`integrity-events.sql` not run** — the SLT academic-integrity summary degrades
  gracefully to "not available" if the table is absent (same `undefined_table` fallback
  pattern the grader uses), rather than failing the whole report.
```
