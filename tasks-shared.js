// ══════════════════════════════════════════════════════════════
// SHARED TASK HELPERS
// Used by teacher-tasks.html, teacher-worksheets.html, task.html,
// dashboard.html and teacher-dashboard.html. Pure functions + a small
// auth bootstrap; no DOM rendering here except the CSV download helper.
//
// Data shapes match supabase/tasks-schema.sql:
//   task        — row from `tasks`
//   assignment  — row from `task_assignments` (per student)
//   attempt     — row from `task_attempts`
//
// teacher-tasks.html / teacher-worksheets.html additionally need their
// question bank to be swappable at runtime (selected class's subject /
// a worksheet subject picker) instead of fixed at page-load — see
// "Dynamic per-subject question bank" below.
// ══════════════════════════════════════════════════════════════

const TASKS_SUPABASE_URL = 'https://eaohjlyiotyqhvsizcpw.supabase.co';
const TASKS_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb2hqbHlpb3R5cWh2c2l6Y3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzUzMDksImV4cCI6MjA5ODc1MTMwOX0.lHF4OUiTT3G_fzlXvXI_4QMu48o6eEnq0hWw6K1uBAk';
const TASKS_SESSION_KEY = 'gcse_session_v1';

// Restore the cached Supabase session and enforce a role. Returns
// { client, session, role, username } or redirects and returns null.
async function tasksAuthInit(requiredRole) {
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(TASKS_SESSION_KEY) || 'null'); } catch (e) {}
  const toLogin = () => {
    location.replace('login.html?redirect=' + encodeURIComponent(location.pathname + location.search));
    return null;
  };
  if (!cached) return toLogin();

  const client = supabase.createClient(TASKS_SUPABASE_URL, TASKS_SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.setSession({
    access_token: cached.access_token, refresh_token: cached.refresh_token,
  });
  if (error || !data.session) { localStorage.removeItem(TASKS_SESSION_KEY); return toLogin(); }
  if (requiredRole && cached.role !== requiredRole) {
    location.replace(cached.role === 'teacher' ? 'teacher-dashboard.html' : 'dashboard.html');
    return null;
  }
  localStorage.setItem(TASKS_SESSION_KEY, JSON.stringify({
    access_token: data.session.access_token, refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at, role: cached.role, username: cached.username,
  }));
  // Let gamification.js learn about this page's client (it stashes it for
  // the practice-heatmap poller and refreshes the streak cache). Fire and
  // forget — never awaited, never affects this function's return value.
  // Teacher pages don't load gamification.js, so this is a student-page
  // no-op there by the typeof guard.
  if (requiredRole === 'student' && typeof gamificationRefreshStreak === 'function') {
    try { gamificationRefreshStreak(client); } catch (e) {}
  }
  return { client, session: data.session, role: cached.role, username: cached.username };
}

// ── Question bank lookups (pages that need these include question-bank.js) ──

function bankById() {
  const m = {};
  (window.QUESTION_BANK || []).forEach(q => { m[q.id] = q; });
  return m;
}

function bankByPage() {
  const m = {};
  (window.QUESTION_BANK || []).forEach(q => {
    (m[q.pageId] = m[q.pageId] || []).push(q);
  });
  return m;
}

// Swappable lookup caches. teacher-tasks.html and teacher-worksheets.html
// used to compute these once as page-load `const`s from whatever bank the
// static <script src="/subjects/business/question-bank.js"> tag happened to
// load. Now that the bank can change at runtime (see loadSubjectBank
// below), both pages read these `let`s directly instead of declaring their
// own module-level copies — call refreshBankCaches() any time
// window.QUESTION_BANK changes.
let BANK_BY_PAGE = {};
let BANK_BY_ID = {};
function refreshBankCaches() {
  BANK_BY_PAGE = bankByPage();
  BANK_BY_ID = bankById();
}

const QTYPE_LABELS = { mcq: 'Multiple choice', tf: 'True / False', written: 'Written answer', fib: 'Fill in the blanks' };
const SOURCE_LABELS = {
  learn: 'Key Learning', mcq: 'MCQ Quiz', match: 'Matching', fib: 'Fill the Blanks',
  misc: 'Misconceptions', tips: 'Exam Tips', tf: 'True / False', exam: 'Exam Practice',
};
// Canonical category order, matching the order each activity appears on the
// topic pages themselves — teachers pick in this order and students answer
// in this order (see sortTaskQuestions below).
const SOURCE_ORDER = [
  { key: 'learn', icon: '📚', short: 'Learn',  label: 'Key Learning' },
  { key: 'mcq',   icon: '❓', short: 'MCQ',    label: 'MCQ Quiz' },
  { key: 'match', icon: '🔗', short: 'Match',  label: 'Matching' },
  { key: 'fib',   icon: '✏️', short: 'Blanks', label: 'Fill the Blanks' },
  { key: 'misc',  icon: '⚠️', short: 'Misc',   label: 'Misconceptions' },
  { key: 'tips',  icon: '🎯', short: 'Tips',   label: 'Exam Tips' },
  { key: 'tf',    icon: '✅', short: 'T/F',    label: 'True / False' },
  { key: 'exam',  icon: '📝', short: 'Exam',   label: 'Exam Practice' },
];
const SOURCE_ORDER_INDEX = SOURCE_ORDER.reduce((m, s, i) => (m[s.key] = i, m), {});

// Original position of each question in window.QUESTION_BANK — used only as
// a tie-breaker so questions from the same topic+category keep their
// original Q1/Q2/... order.
let _bankRankCache = null;
function bankRank(id) {
  if (!_bankRankCache) {
    _bankRankCache = {};
    (window.QUESTION_BANK || []).forEach((q, i) => { _bankRankCache[q.id] = i; });
  }
  return _bankRankCache[id] ?? 0;
}
// Must be called any time window.QUESTION_BANK is swapped for a different
// subject's bank — otherwise bankRank() keeps handing out ranks from
// whichever subject happened to build the cache first, and curriculum
// ordering (sortTaskQuestions) silently corrupts for every subject after it.
function resetBankRankCache() { _bankRankCache = null; }

// ── Dynamic per-subject question bank ──
// Topic pages know their own subject at build time via a relative
// <script src="page-groups.js"> include. teacher-tasks.html and
// teacher-worksheets.html pick their subject at RUNTIME instead (the
// selected class's subject / a worksheet subject dropdown), so they can't
// use a static include for the bank.
//
// /page-groups-all.js (window.PAGE_GROUPS_ALL, included by both pages)
// already holds every subject's topic tree merged into one small file, so
// switching subject only needs to repoint window.SUBJECT/window.PAGE_GROUPS
// at the right slot — no network fetch needed for that part. Only
// question-bank.js (deliberately never merged across subjects, ~4.3MB each)
// needs an actual dynamic <script> load.

// Points window.SUBJECT/window.PAGE_GROUPS at `slug` using the
// already-loaded /subjects-index.js + /page-groups-all.js registries.
// Synchronous — no network involved, unlike loadSubjectBank below.
function setActiveSubject(slug) {
  const subjects = window.SUBJECTS || [];
  const groupsAll = window.PAGE_GROUPS_ALL || {};
  let subject = subjects.find(s => s.slug === slug);
  if (!subject) {
    console.error('setActiveSubject: unknown subject "' + slug + '" — falling back to business');
    subject = subjects.find(s => s.slug === 'business') || subjects[0] || null;
  }
  window.SUBJECT = subject || null;
  window.PAGE_GROUPS = (subject && groupsAll[subject.slug]) || [];
  return subject;
}

// Swaps in `slug`'s question bank: points window.SUBJECT/PAGE_GROUPS at it
// (setActiveSubject, above), removes any previously-injected bank <script>
// (tagged with [data-subject-bank]), injects a fresh one for
// /subjects/<slug>/question-bank.js, and once it has loaded (or failed)
// recomputes BANK_BY_PAGE/BANK_BY_ID and clears the bank-rank cache so
// curriculum ordering never uses stale ranks from the previous subject.
// Returns a promise resolving to the subject registry entry (or rejecting
// on a network/script error — callers should surface that to the teacher).
function loadSubjectBank(slug) {
  const subject = setActiveSubject(slug);
  document.querySelectorAll('script[data-subject-bank]').forEach(el => el.remove());
  // Clear the bank itself while the new one is in flight, so a slow or
  // failed load can never be mistaken for the previous subject's data
  // still being current.
  window.QUESTION_BANK = [];
  refreshBankCaches();
  resetBankRankCache();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `/subjects/${(subject && subject.slug) || slug}/question-bank.js`;
    script.setAttribute('data-subject-bank', '');
    script.onload = () => {
      refreshBankCaches();
      resetBankRankCache();
      resolve(subject);
    };
    script.onerror = () => {
      console.error('loadSubjectBank: failed to load question bank for "' + slug + '"');
      reject(new Error('Failed to load question bank for ' + slug));
    };
    document.head.appendChild(script);
  });
}

// Sorts a list of bank-entry questions into curriculum order: topic page
// order (as in PAGE_GROUPS), then category order (SOURCE_ORDER), then
// original question order. This is the single order used both when a
// teacher reviews/saves a task and when a student answers it.
function sortTaskQuestions(list) {
  const pageIdx = {};
  let i = 0;
  PAGE_GROUPS.forEach(g => flatPages(g).forEach(p => { pageIdx[p.id] = i++; }));
  return list.slice().sort((a, b) =>
    (pageIdx[a.pageId] ?? 0) - (pageIdx[b.pageId] ?? 0) ||
    (SOURCE_ORDER_INDEX[a.source] ?? 99) - (SOURCE_ORDER_INDEX[b.source] ?? 99) ||
    bankRank(a.id) - bankRank(b.id)
  );
}

// ── Deadlines, attempts & status ──

function effectiveDue(task, assignment) {
  const o = assignment && assignment.due_override;
  return o ? new Date(o) : (task.due_at ? new Date(task.due_at) : null);
}

function effectiveTimeLimitMinutes(task, assignment) {
  if (!task.time_limit_minutes) return null;
  return task.time_limit_minutes + ((assignment && assignment.extra_time_minutes) || 0);
}

function submittedAttempts(attempts) {
  return (attempts || []).filter(a => a.status === 'submitted');
}

function attemptsRemaining(task, attempts) {
  if (task.attempts_allowed == null) return Infinity;
  return Math.max(0, task.attempts_allowed - submittedAttempts(attempts).length);
}

// The attempt that counts for the grade, per the task's attempt_scoring.
// Considers submitted attempts only; prefers fully-marked ones for 'best'.
function countedAttempt(task, attempts) {
  const subs = submittedAttempts(attempts);
  if (!subs.length) return null;
  if (task.attempt_scoring === 'first') {
    return subs.reduce((a, b) => (a.attempt_number < b.attempt_number ? a : b));
  }
  if (task.attempt_scoring === 'latest') {
    return subs.reduce((a, b) => (a.attempt_number > b.attempt_number ? a : b));
  }
  // 'best' — highest percentage; unmarked attempts count as their auto-marks so far
  const pct = a => (a.marks_total ? (a.marks_awarded || 0) / a.marks_total : 0);
  return subs.reduce((a, b) => (pct(b) > pct(a) ? b : a));
}

function attemptPct(attempt) {
  if (!attempt || !attempt.marks_total) return null;
  return Math.round(((attempt.marks_awarded || 0) / attempt.marks_total) * 1000) / 10;
}

// Whole-roster task stats, so a never-started student pulls the average down
// instead of being silently excluded. `assignments`/`attempts` are the raw
// task_assignments/task_attempts rows for ONE task (any student).
//   avgTrue   — average % across every assigned student; never-submitted = 0%,
//               submitted-but-not-fully-marked counts at its current partial score.
//   avgMarked — average % across submitted attempts that are fully marked
//               (this is what the UI used to call "avg score" on its own).
function computeTaskStats(task, assignments, attempts) {
  const byStudent = {};
  (attempts || []).forEach(a => (byStudent[a.student_id] = byStudent[a.student_id] || []).push(a));
  const assignedIds = (assignments || []).map(a => a.student_id);
  const countedByStudent = {};
  assignedIds.forEach(sid => { countedByStudent[sid] = countedAttempt(task, byStudent[sid] || []); });
  const counted = Object.values(countedByStudent).filter(Boolean);
  const marked = counted.filter(c => c.marking_complete && c.marks_total);

  const avgTrue = assignedIds.length
    ? Math.round(assignedIds.reduce((sum, sid) => {
        const c = countedByStudent[sid];
        return sum + (c && c.marks_total ? attemptPct(c) : 0);
      }, 0) / assignedIds.length)
    : null;
  const avgMarked = marked.length
    ? Math.round(marked.reduce((s, c) => s + attemptPct(c), 0) / marked.length)
    : null;

  return {
    assigned: assignedIds.length,
    submitted: counted.length,
    toMark: (attempts || []).filter(a => a.status === 'submitted' && !a.marking_complete).length,
    avgTrue, avgMarked,
  };
}

// A simple, computed "needs attention" flag for one student — not stored
// anywhere, just derived from their own task history each time it's shown.
// `taskRows` is [{ task, assignment, attempts }] across every task they've
// been assigned (any class). Flags on either signal:
//   - an overdue/locked task with no attempt started at all, or
//   - their last few marked attempts averaging below 50%.
function computeStrugglingFlag(taskRows) {
  const rows = taskRows || [];
  const overdueUntouched = rows.find(({ task, assignment, attempts }) => {
    const state = studentTaskState(task, assignment, attempts);
    return (state === 'overdue' || state === 'locked') && !(attempts || []).length;
  });
  if (overdueUntouched) {
    return { flag: true, reason: `Overdue with no attempt started: "${overdueUntouched.task.title}"` };
  }

  const scored = rows
    .map(({ task, attempts }) => countedAttempt(task, attempts))
    .filter(c => c && c.marking_complete && c.marks_total)
    .sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0))
    .slice(0, 5);
  if (scored.length >= 2) {
    const avg = scored.reduce((s, c) => s + attemptPct(c), 0) / scored.length;
    if (avg < 50) return { flag: true, reason: `Averaging ${Math.round(avg)}% over their last ${scored.length} marked tasks` };
  }
  return { flag: false, reason: null };
}

// One-word status for a student on a task. Returns one of:
// 'submitted' | 'in_progress' | 'overdue' | 'locked' | 'not_started'
function studentTaskState(task, assignment, attempts) {
  const due = effectiveDue(task, assignment);
  const past = due && Date.now() > due.getTime();
  if (submittedAttempts(attempts).length) return 'submitted';
  if ((attempts || []).some(a => a.status === 'in_progress') && !(past && task.late_policy === 'lock')) return 'in_progress';
  if (past) return task.late_policy === 'lock' ? 'locked' : 'overdue';
  return 'not_started';
}

const TASK_STATE_LABELS = {
  submitted: 'Submitted', in_progress: 'In progress', overdue: 'Overdue',
  locked: 'Missed (locked)', not_started: 'Not started',
};

// ── Formatting ──

function fmtDateTime(d) {
  if (!d) return '—';
  const dt = (d instanceof Date) ? d : new Date(d);
  return dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' ' +
         dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(s / 60), sec = s % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return m ? `${m}m ${sec}s` : `${sec}s`;
}

function fmtScore(attempt) {
  if (!attempt || attempt.marks_total == null) return '—';
  const pct = attemptPct(attempt);
  return `${attempt.marks_awarded ?? 0}/${attempt.marks_total} (${pct}%)`;
}

function taskEscapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── CSV export ──

function toCsv(rows) {
  const esc = v => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return rows.map(r => r.map(esc).join(',')).join('\r\n');
}

function downloadCsv(rows, filename) {
  const blob = new Blob(['' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
