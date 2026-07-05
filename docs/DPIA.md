# Data Protection Impact Assessment (DPIA) — DRAFT

**System:** OCR GCSE Business Studies (J204) revision Platform
**Status:** Draft prepared ahead of IT/DPO review — NOT yet signed off. Not published on the
public site (internal document only).
**Prepared:** 5 July 2026
**Structure:** follows the ICO's DPIA guidance —
https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/

---

## Screening questions — why a DPIA is needed

- [x] **Systematic monitoring**: the Platform logs every question a pupil answers, whether it was
  correct, and when — an ongoing, systematic record of pupil activity and attainment.
- [x] **Processing of children's data at scale**: pupils are aged approximately 11–16 (KS3/KS4).
- [x] **New technology / novel use**: gamification (XP, levels, streaks, badges) computed live from
  behavioural data is a newer pattern than a standard MIS/gradebook.
- [x] **Evaluation or scoring**: the Platform produces per-pupil and per-class performance data used
  by teachers to make decisions about follow-up teaching.

Any one of the above is sufficient to require a DPIA under UK GDPR Article 35; this system meets
several. Proceeding with the full assessment below.

---

## Step 1 — Describe the processing

**Nature:** A static website (Netlify-hosted) backed by Supabase (PostgreSQL + Auth), confirmed
hosted in a UK/EU region. Pupils authenticate with a username + password (Supabase Auth, using an
internally-synthesised `username@students.local` address — no real pupil email is collected).
Teachers authenticate with a real work email + a school-issued invite code.

**Scope — data collected:**

| Table | Fields | Data subject |
|---|---|---|
| `profiles` | id, role (student/teacher), username, created_at | Students, teachers |
| `classes` / `class_students` | class name, teacher_id, student_id, joined_at | Teachers, students |
| `progress_events` | page_id, section, question_id, submitted answer (jsonb), correct/incorrect, timestamp — append-only, never overwritten | Students |
| `progress_summary` | per-topic done/total rollup | Students |
| `teacher_invite_codes` | invite code, note | N/A (operational, not personal data) |

Gamification (XP, level, badges, day-streak) is **derived on read** from `progress_events` /
`progress_summary` — it is not stored as an independent record.

Usernames are pseudonymous handles; the schema has no field for a pupil's real name. **Open item:**
confirm operationally whether any teacher has, in practice, set a pupil's username to their real
name — if so this changes the pseudonymisation assessment below.

**Context:** Internal revision tool for pupils and teachers at a school within Avanti Schools
Trust. Not yet formally adopted by the Trust — see "Open items" below.

**Purpose:** Formative assessment and revision support — pupils see their own progress and gaps;
teachers see class-level dashboards to target follow-up teaching.

**Sub-processors (third parties with data access):**

| Processor | Role | Data residency |
|---|---|---|
| Supabase | Database + authentication hosting | UK/EU region (confirmed) |
| Netlify | Static site + serverless function hosting | UK/EU region (confirmed) |
| Google Fonts | Webfont delivery (IP address only, no account data) | Not a data processor for personal data in this system, but a third-party network request — disclosed in the Cookie Policy |

No other third parties (no analytics, no advertising, no CRM/email marketing tool) have access to
this data.

---

## Step 2 — Assess necessity and proportionality

- Data collected is limited to what's needed to show a pupil their own progress and a teacher their
  class's progress (data minimisation: no real names, no contact details, no demographic data
  collected).
- The append-only answer log (`progress_events`) is more granular than a simple pass/fail summary,
  but this granularity is what powers the "what to revise next" recommendation — a core purpose of
  the tool, not incidental.
- No profiling beyond the pupil's own subject performance; no automated decisions with legal or
  similarly significant effect are made about any pupil.
- **Retention is not yet proportionate as implemented**: data is currently kept indefinitely. A
  12-month-after-last-activity-or-leaving retention rule has been *decided* (see Step 5) but not yet
  *built*. This is the single largest proportionality gap in the current system.

---

## Step 3 — Consultation

Not yet carried out. Required before sign-off:

- [ ] Trust/school Data Protection Officer (or interim data protection lead).
- [ ] IT lead responsible for Supabase/Netlify infrastructure.
- [ ] Designated safeguarding lead (for the Acceptable Use Policy's escalation path).
- [ ] A sample of teachers who would use the class dashboards.
- [ ] Parent/carer representation, or at minimum a plain-English notice reviewed by a
  parent-facing staff member (see `childrens-code.html` and `privacy-policy.html`).

---

## Step 4 — Identify and assess risks

| # | Risk | Likelihood | Impact | To whom |
|---|---|---|---|---|
| 1 | No automated retention/deletion — pupil answer history accumulates indefinitely | High (confirmed gap) | Medium | Pupils |
| 2 | Small class sizes could make a pupil re-identifiable from progress data even without a real name | Medium | Medium | Pupils |
| 3 | Breach of the Supabase database (e.g. leaked service-role key) exposing full answer history | Low | High | Pupils, Trust |
| 4 | Teacher invite codes shared or leaked, allowing unauthorised teacher signup | Medium | Medium | Trust |
| 5 | System not yet formally adopted — unclear accountability if a data subject request or breach occurs today | High (current state) | High | Trust, pupils |
| 6 | Google Fonts request discloses pupil device IP to Google | Low | Low | Pupils |

---

## Step 5 — Identify measures to reduce risk

| Risk # | Mitigation | Status |
|---|---|---|
| 1 | Build and schedule an automated job (e.g. a Netlify scheduled function, following the existing `weekly-retry-tasks` cron pattern) to delete/anonymise `profiles`/`class_students`/`progress_events`/`progress_summary` rows 12 months after last activity or after a pupil leaves | **Not built — open action** |
| 2 | Keep usernames pseudonymous (already the case in the schema); confirm with teachers this isn't overridden in practice | Partially in place — needs operational confirmation |
| 3 | Row-level security already restricts each pupil to their own rows and each teacher to their own classes; service-role key is kept out of all committed files (`netlify.toml` deliberately excludes it from secrets-scan allowlist) | In place |
| 4 | Rotate/limit teacher invite codes; consider one-time or time-limited codes | Recommend review |
| 5 | Complete Trust sign-off of this DPIA and formally designate a controller/DPO | **Open — this document is the first step** |
| 6 | Optional: self-host fonts instead of loading from Google Fonts, to remove the third-party request entirely | Low priority, disclosed in Cookie Policy in the meantime |

---

## Step 6 — Sign-off and record outcomes

| Role | Name | Date | Decision |
|---|---|---|---|
| Data Protection Officer / interim lead | *[pending]* | | |
| IT lead | *[pending]* | | |
| Safeguarding lead | *[pending]* | | |
| System owner (this document's author) | Mohanad Nassar | 2026-07-05 | Draft submitted for review |

---

## Step 7 — Integrate into the project plan

Outstanding actions before this system can be considered fully compliant and formally adopted:

1. **Build the 12-month retention/deletion job** — currently the single biggest gap between stated
   policy and actual behaviour.
2. **Confirm data controller** — Trust-wide vs. single school vs. continued informal/teacher-led
   status — and update `privacy-policy.html`, `terms.html`, and this DPIA accordingly.
3. **Name a real DPO/contact** to replace the provisional contact email used across the policy
   pages.
4. **Confirm operationally** whether pupil usernames ever contain real names.
5. **Add this system to the Trust's Record of Processing Activities (ROPA)** once adopted.
6. **Link the Acceptable Use Policy's safeguarding escalation path** to the Trust's actual
   safeguarding policy/contact, rather than the placeholder used today.
7. **Complete Step 3 consultation** (DPO, IT, safeguarding lead, sample teachers) and re-run Steps
   4–6 with their input before final sign-off.
