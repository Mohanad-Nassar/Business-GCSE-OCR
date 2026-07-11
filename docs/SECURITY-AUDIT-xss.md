# Security audit — XSS & CSV-injection (WP-A7, client render layer)

Date: 2026-07-11. Scope: every `innerHTML` / `insertAdjacentHTML` interpolation
of user- or teacher-typed text across the front-end, plus the CSV export path.
Author-controlled content from the generated question bank / page-groups (topic
titles, question text, mark schemes) is out of scope here — it's covered by the
`taskRichText` render convention and is not user input.

## Fixed

| # | Sev | File:line | Issue | Fix |
|---|-----|-----------|-------|-----|
| X1 | **Medium** | dashboard.html:883 | Student "My Tasks" notification list rendered `n.text` via innerHTML unescaped. `n.text` embeds the teacher-set task **title** (`notifications-shared.js` `deriveStudentNotifications`), so a task titled with markup would execute in every assigned student's dashboard — a cross-user (teacher→student) stored XSS. | Wrapped `n.text` in `taskEscapeHtml`; also escaped `n.key` and switched `n.taskId` to `encodeURIComponent`. Matches the notification **bell**, which already escaped via `_notifEsc`. |
| X2 | Low | tasks-shared.js:433 (`toCsv`) | CSV/formula injection: a cell beginning with `= + - @` (or a leading tab/CR) is run as a formula when the export opens in Excel/Sheets. Reachable via a student-chosen username or teacher-typed task title in analytics/results exports. | Added `csvSanitizeCell()` — prefixes a `'` to force-text such cells — applied inside `toCsv` before quoting. |

## Verified safe (no change needed)

- **Notification bell** (`notifications-shared.js:210`) — escapes `n.text` via `_notifEsc`. ✓
- **Account cluster** avatar/name (`account-cluster.js`) — `gcseEscapeHtml` on username. ✓
- **Teacher task pickers / previews / results** (`teacher-tasks.html`, `teacher-worksheets.html`, `task.html`, `teacher-analytics.html`) — question/case/explain render through `taskRichText`/`esc`; question titles in the picker go through `taskStripTags`+`esc` (fixed in the earlier taskRichText pass). ✓
- **Review calendar** task chip tooltip (`review-calendar.js:578`) — `tip` is escaped at its use site (`title="${esc(tip)}"`). ✓
- **`showMsg`** in teacher-tasks.html / teacher-dashboard.html — uses `textContent`, not innerHTML; `alert()` calls with task titles are plain text. ✓
- **CSV cell quoting** already handled `" , \n`; the injection guard is additive. ✓

## Open (follow-up — outside this session's edited-file lanes)

| # | Sev | File:line | Note |
|---|-----|-----------|------|
| X3 | Low (self-XSS) | teacher-dashboard.html:769 | Fallback account bar renders the teacher's OWN `cached.username` via innerHTML unescaped. Exploit requires a teacher to have set their own username to markup, so impact is self-only; the primary (non-fallback) path uses the escaped account cluster. Left untouched to avoid colliding with the concurrent anti-copy edit to this file — fold `gcseEscapeHtml`/`taskEscapeHtml` around `cached.username` in a follow-up. |
| X4 | Low | teacher-dashboard.html:1642 | The generated-students CSV (`username,password`) is assembled by hand, bypassing `toCsv`, so the injection guard doesn't cover it. Values are system-generated (safe charset: slug usernames, random passwords) so risk is minimal; route it through `toCsv` in a follow-up for consistency. |

Author-controlled generated content rendered raw (topic titles in the sidebar,
`group.title`/`group.sub` in progress-shared.js, `t.content` in script.js's learn
cards) is intentionally trusted — it originates from the build pipeline, never
from a user, and carries site-authored formatting HTML.
