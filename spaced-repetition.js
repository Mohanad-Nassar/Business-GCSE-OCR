// ══════════════════════════════════════════════════════════════
// SPACED REPETITION — the Review Calendar's shared client engine.
//
// When a student first works on a topic, the server schedules three
// follow-up reviews — +1 day, +7 days and +28 days — and each one is
// only ticked off once the student passes a short quiz on that topic
// (the quiz flow lives in review-calendar.js; this file is the shared
// read/render layer used by the calendar page AND the dashboard badge).
//
// Scheduling is 100% SERVER-SIDE, lazily seeded inside
// get_review_schedule() itself — deliberately so:
//   - cross-device by construction: the schedule lives in one place,
//     so a topic started on a phone shows its reviews on the school PC;
//   - retroactive: topics a student worked on BEFORE this feature
//     shipped get their reviews seeded on first fetch, no backfill job;
//   - zero hooks in topic pages: none of the 38+ generated topic HTMLs
//     (or script.js's answer path) needed touching — this engine only
//     READS the schedule and helps render it.
//
// The pure functions live at the TOP of this file, DOM-free, exactly
// like drBarFill/drQueueParams in daily-revise.js — there is no Node on
// this machine, so tools/logic_test.py loads the file into a real V8
// (py_mini_racer) and asserts on them directly. Keep them free of
// document/localStorage so that stays true.
//
// Schedule rows come from rpc get_review_schedule(p_subject):
//   { page_id, stage, due_date, completed_at, answered, correct, attempts }
// due_date is a 'YYYY-MM-DD' string, completed_at an ISO timestamp or
// null, stage ∈ 1..3, page_id subject-prefixed
// ("business:1-1-role-of-business-enterprise").
//
// The last good fetch is cached per subject under localStorage key
//   'sr_schedule_cache_v1:' + (subjectSlug || 'all')   as {fetchedAt, rows}
// so the calendar can paint instantly (srCachedSchedule) and survive a
// flaky connection (srFetchSchedule falls back to it on RPC error).
// ══════════════════════════════════════════════════════════════

// ── Pure, DOM-free helpers (unit-tested in tools/logic_test.py) ──

const SR_STAGES = [
  { stage: 1, days: 1,  label: '1 day' },
  { stage: 2, days: 7,  label: '1 week' },
  { stage: 3, days: 28, label: '4 weeks' },
];

// Local-timezone 'YYYY-MM-DD' — deliberately NOT toISOString(), which is
// UTC: for UK school users a review due "today" must flip at local
// midnight, not at 11pm/1am depending on BST.
function srTodayStr(d) {
  d = d || new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// One row's state relative to today. Plain string comparison is safe and
// intentional: 'YYYY-MM-DD' sorts lexicographically in date order.
function srStatus(row, todayStr) {
  if (row.completed_at) return 'completed';
  if (row.due_date < todayStr) return 'overdue';
  if (row.due_date === todayStr) return 'due';
  return 'upcoming';
}

// Headline numbers for badges/summary chips. `actionable` is what the
// student can do something about right now (due today + overdue).
function srCounts(rows, todayStr) {
  const c = { due: 0, overdue: 0, upcoming: 0, completed: 0, actionable: 0 };
  (rows || []).forEach(row => { c[srStatus(row, todayStr)]++; });
  c.actionable = c.due + c.overdue;
  return c;
}

// due_date string -> array of rows, input order preserved within a day —
// the calendar grid's data shape (one cell per srMonthMatrix date).
function srGroupByDate(rows) {
  const out = {};
  (rows || []).forEach(row => {
    (out[row.due_date] = out[row.due_date] || []).push(row);
  });
  return out;
}

function srStageLabel(stage) {
  const def = SR_STAGES.find(s => s.stage === stage);
  return def ? def.label : 'stage ' + stage;
}

// Mirrors the server's quiz sizing/pass rules — used ONLY for progress
// UI text ("3 of 5 · pass at 3"); the server is the one that actually
// grades and ticks the review off.
function srSessionTarget(totalAvailable) {
  return Math.max(1, Math.min(5, totalAvailable));
}
function srPassMark(target) {
  return Math.ceil(0.6 * target);
}

// Monday-start calendar grid for one month: an array of week-arrays of
// 'YYYY-MM-DD' strings, padded with leading/trailing days from the
// adjacent months so every week is exactly 7 days. This is the calendar
// page's layout backbone — it just walks these strings and looks each
// one up in srGroupByDate's output.
function srMonthMatrix(year, monthIndex0) {
  const first = new Date(year, monthIndex0, 1);
  // JS getDay(): 0=Sun..6=Sat — shift so Monday is 0.
  const lead = (first.getDay() + 6) % 7;
  const cursor = new Date(year, monthIndex0, 1 - lead);
  const weeks = [];
  do {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(srTodayStr(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  } while (cursor.getMonth() === monthIndex0 && cursor.getFullYear() === year);
  return weeks;
}

// ── Client/data helpers (DOM + network + storage below this line) ──

const SR_CACHE_KEY_PREFIX = 'sr_schedule_cache_v1:';

function _srCacheKey(subjectSlug) {
  return SR_CACHE_KEY_PREFIX + (subjectSlug || 'all');
}

// Fetch the schedule (lazily seeding it server-side on first call).
// Success: caches to localStorage and returns the rows. RPC error: logs
// and falls back to the last cached rows, else [] — the calendar page
// stays usable offline/flaky rather than blanking.
async function srFetchSchedule(client, subjectSlug) {
  try {
    const { data, error } = await client.rpc('get_review_schedule',
      { p_subject: subjectSlug || null });
    if (error) throw error;
    const rows = data || [];
    try {
      localStorage.setItem(_srCacheKey(subjectSlug),
        JSON.stringify({ fetchedAt: Date.now(), rows }));
    } catch (e) {}
    return rows;
  } catch (e) {
    console.error('get_review_schedule', e);
    const cached = srCachedSchedule(subjectSlug);
    return cached || [];
  }
}

// Last successfully fetched rows (or null) — for an instant paint before
// srFetchSchedule's network round trip lands.
function srCachedSchedule(subjectSlug) {
  try {
    const saved = JSON.parse(localStorage.getItem(_srCacheKey(subjectSlug)) || 'null');
    if (saved && Array.isArray(saved.rows)) return saved.rows;
  } catch (e) {}
  return null;
}

// Topic display name for a schedule row's page_id. Reuses pageTitle()
// from progress-shared.js when that file is loaded; falls back to the
// raw id elsewhere. Deliberately NOT cached: window.PAGE_GROUPS gets
// reassigned on subject switches (see the comment above pageTitle() in
// progress-shared.js), so a lookup table built here would go stale.
function srPageName(pageId) {
  if (typeof pageTitle === 'function') return pageTitle(pageId);
  return pageId;
}

function _srEsc(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _srInjectStyles() {
  if (document.getElementById('srStyles')) return;
  const s = document.createElement('style');
  s.id = 'srStyles';
  s.textContent = `
    .sr-due-badge{display:inline-flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:11.5px;font-weight:600;color:var(--ink,#1a2332);background:var(--cream,#ede7d9);border:1px solid var(--border,#c9bfaa);border-radius:99px;padding:4px 12px;white-space:nowrap;}
    .sr-due-badge.sr-overdue{color:#c84b31;background:rgba(200,75,49,.12);border-color:#c84b31;}
  `;
  document.head.appendChild(s);
}

// Small inline "reviews due" pill for the dashboard/home: cleared when
// there's nothing actionable, red-tinted when anything is overdue.
function srRenderDueBadge(el, rows, todayStr) {
  const counts = srCounts(rows, todayStr);
  if (!counts.actionable) { el.innerHTML = ''; return; }
  _srInjectStyles();
  const label = `${counts.actionable} review${counts.actionable === 1 ? '' : 's'} due`;
  el.innerHTML = `<span class="sr-due-badge${counts.overdue > 0 ? ' sr-overdue' : ''}">` +
    `<span aria-hidden="true">⏳</span> ${_srEsc(label)}</span>`;
}
