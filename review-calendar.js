// ══════════════════════════════════════════════════════════════
// REVIEW CALENDAR — the student's month-at-a-glance view of the
// spaced-repetition schedule.
//
// When a student first practises a topic, the server schedules three
// reviews of it — after 1 day, 1 week and 4 weeks (SR_STAGES, defined
// in spaced-repetition.js). This page paints those onto a calendar and
// lets the student tick one off by passing a short, server-graded quiz
// (5 questions from that topic, ≥60% to pass; a failed session resets
// the counters so they can simply try again).
//
// Like daily-revise.js, this page NEVER loads question-bank.js — the
// only source of questions is get_topic_review_questions(), whose
// snapshots deliberately omit the correct answer, and the only grader
// is record_review_answer(). The correct answer is never in the client
// until the student has already submitted.
//
// All the scheduling maths (which stage is due when, the Monday-start
// month grid, session targets and pass marks) lives in the shared
// engine spaced-repetition.js, so this file stays a thin view layer:
// fetch schedule → render calendar/due-list → run a quiz → refetch.
//
// Gamification mirrors daily-revise exactly: per-correct sound + XP
// toast + the device-local daily-goal bump, and a celebratory sound
// when a review is ticked off. record_review_answer() has already
// durably credited XP via the same mastery path daily-revise uses, so
// none of the toasts are fake. Badge-unlock toasts are intentionally
// skipped here for the same reason as daily-revise (accurate badge
// computation needs the full per-topic progress this page never fetches;
// the badges still toast on the next topic-page/dashboard visit).
// ══════════════════════════════════════════════════════════════

const esc = taskEscapeHtml;

// Teacher-authored bank HTML (reading/markScheme) is rendered raw into
// innerHTML below, so it must pass the RichText allowlist sanitiser at the
// render sink (the editor-time sanitise is bypassable via the REST API).
// rich-editor.js is loaded on this page, so RichText is always present; the
// guard only degrades to raw on trusted static pages that omit it.
function _safeHtml(x) {
  return (typeof RichText !== 'undefined' && RichText.sanitize) ? RichText.sanitize(x || '') : (x || '');
}

let srClient = null;
let schedule = [];            // rows from srFetchSchedule()

// The month the calendar is currently showing (0-indexed month, like Date).
let calYear = 0;
let calMonth = 0;

// ── Quiz session state ──────────────────────────────────────────
// A review is identified by (page_id, stage). We fetch its questions
// once and walk them client-side; the SERVER is the source of truth
// for how many have been answered/got right this session, so if the
// student abandoned a half-finished review earlier the counters it
// returns on the next submit (review.answered / review.correct) simply
// pick up where they left off — we resync srSessionAnswered/Correct
// from every response rather than trusting our own local index.
let quizActive = false;
let quizPageId = null;
let quizStage = null;
let quizQuestions = [];
let quizIdx = 0;
let quizAwaitingAnswer = false; // a question is on screen, not yet submitted
let srTarget = 0;               // questions needed this session (srSessionTarget)
let srPassMarkN = 0;            // correct answers needed to tick off (srPassMark)
let srSessionAnswered = 0;      // server truth, resynced on each submit
let srSessionCorrect = 0;
// Fill-in-the-blanks has two modes, exactly like daily-revise / the topic
// pages: dropdown (default) or free-text typing. Persists across questions
// within a session.
let srAdvancedFIB = false;

// ── WP-A5: merged calendar state ────────────────────────────────
// The calendar shows TWO event kinds — spaced-repetition reviews (soft/
// outline chips, the original feature) and teacher-set task deadlines
// (solid chips) — filterable by subject and by kind. ?subject=all opens
// the cross-subject view; a normal ?subject=<slug> seeds the filter with
// that one subject (the chips can widen it when the student has more).
let srUid = null;
let calAllMode = false;              // ?subject=all
let taskEvents = [];                 // [{date, due, task, state, subjectSlug}]
let calFilters = { subjects: null, reviews: true, tasks: true }; // subjects = Set(slug)
let calSubjectUniverse = [];         // slugs this student may pick from
const CAL_FILTERS_KEY = 'vidya_cal_filters_v1';

function srSlug() {
  return (window.SUBJECT && window.SUBJECT.slug) || 'business';
}

// Subject registry meta (colour/icon/name) by slug — subjects-index.js.
function calSubjectMeta(slug) {
  const all = window.SUBJECTS || [];
  for (let i = 0; i < all.length; i++) if (all[i].slug === slug) return all[i];
  return null;
}

// A page id's subject is its prefix: 'economics:2-2-demand' → 'economics'.
function calSubjectOf(pageId) {
  const s = String(pageId);
  const i = s.indexOf(':');
  return i > 0 ? s.slice(0, i) : srSlug();
}

// Topic names across EVERY subject (window.PAGE_GROUPS only holds the
// current subject's tree, which would leave other subjects' reviews
// unnamed in the all-subjects view).
let _calPageNames = null;
function calPageName(pid) {
  if (!_calPageNames) {
    _calPageNames = {};
    const groupsAll = window.PAGE_GROUPS_ALL || {};
    Object.keys(groupsAll).forEach(slug => {
      (groupsAll[slug] || []).forEach(function walk(g) {
        (g.pages || []).forEach(p => { _calPageNames[p.id] = p.name; });
        (g.groups || []).forEach(walk);
      });
    });
  }
  return _calPageNames[pid] || srPageName(pid);
}

function calLoadFilters() {
  try {
    const saved = JSON.parse(localStorage.getItem(CAL_FILTERS_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      calFilters.reviews = saved.reviews !== false;
      calFilters.tasks = saved.tasks !== false;
      if (Array.isArray(saved.subjects)) calFilters.subjects = new Set(saved.subjects);
    }
  } catch (e) {}
}
function calSaveFilters() {
  try {
    localStorage.setItem(CAL_FILTERS_KEY, JSON.stringify({
      subjects: calFilters.subjects ? [...calFilters.subjects] : null,
      reviews: calFilters.reviews, tasks: calFilters.tasks,
    }));
  } catch (e) {}
}

// Subject filter applied to the review schedule (kind toggles only affect
// the month grid — the Due-now panel is reviews by definition).
function calVisibleSchedule() {
  if (!calFilters.subjects) return schedule;
  return schedule.filter(r => calFilters.subjects.has(calSubjectOf(r.page_id)));
}
function calVisibleTasks() {
  if (!calFilters.subjects) return taskEvents;
  return taskEvents.filter(ev => !ev.subjectSlug || calFilters.subjects.has(ev.subjectSlug));
}

// ── Small date helpers ──────────────────────────────────────────
// Parse a 'YYYY-MM-DD' as a LOCAL calendar date (never via new Date(str),
// which treats a bare date as UTC and can slip a day either side).
function srParseDate(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  return new Date(y, m - 1, d);
}
const SR_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const SR_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function srFmtDate(dateStr) {
  const dt = srParseDate(dateStr);
  return `${SR_DOW[dt.getDay()]} ${dt.getDate()} ${SR_MONTHS[dt.getMonth()].slice(0, 3)}`;
}
// Whole days from a → b (both 'YYYY-MM-DD'); positive if b is later.
function srDayDiff(aStr, bStr) {
  const a = srParseDate(aStr), b = srParseDate(bStr);
  return Math.round((b - a) / 86400000);
}

async function init() {
  const auth = await tasksAuthInit('student'); // redirects to login if not a student
  if (!auth) return;
  srClient = auth.client;
  srUid = auth.session.user.id;

  // ?subject=all = the cross-subject view (subject-loader falls back to
  // business for the unknown 'all' slug, so read the raw param here).
  let rawParam = null;
  try { rawParam = new URLSearchParams(location.search).get('subject'); } catch (e) {}
  calAllMode = rawParam === 'all';

  // The whole page takes on the subject's own accent colour (the calendar
  // "today" ring, due chips, buttons). business-style.css seeds --accent
  // purple; overriding it on :root lets Computer Science / Economics wear
  // their own colour without touching the shared stylesheet. The
  // all-subjects view keeps the neutral default — no one subject owns it.
  if (!calAllMode && window.SUBJECT && window.SUBJECT.colour) {
    document.documentElement.style.setProperty('--accent', window.SUBJECT.colour);
  }

  const subjName = calAllMode ? 'All subjects' : ((window.SUBJECT && window.SUBJECT.name) || 'Revision');
  document.title = `Review Calendar — ${subjName}`;
  document.getElementById('srSubjectBadge').textContent = calAllMode
    ? 'All subjects'
    : subjName + (window.SUBJECT && window.SUBJECT.specCode ? ` · ${window.SUBJECT.specCode}` : '');
  // Keep the Dashboard / Daily Revise links pinned to a real subject (in
  // the all-subjects view: the one the student last worked in).
  let slug = srSlug();
  if (calAllMode) {
    try { slug = localStorage.getItem('gcse_last_subject') || slug; } catch (e) {}
  }
  document.getElementById('srDashLink').href = 'dashboard.html?subject=' + encodeURIComponent(slug);
  document.getElementById('srDailyLink').href = 'daily-revise.html?subject=' + encodeURIComponent(slug);

  // Subject filter universe = this student's entitled subjects (WP-A3 RPC;
  // falls back to whatever subjects appear in the data if it's missing).
  calLoadFilters();
  try {
    const { data: ents, error: entsErr } = await srClient.rpc('get_my_entitlements');
    if (!entsErr && Array.isArray(ents)) calSubjectUniverse = ents.map(r => r.subject);
  } catch (e) {}
  // Seed the subject selection: explicit ?subject=<slug> wins, then the
  // saved selection, then everything (the all view / first visit).
  if (rawParam && !calAllMode) {
    calFilters.subjects = new Set([rawParam]);
  } else if (calAllMode || !calFilters.subjects) {
    calFilters.subjects = calAllMode && calSubjectUniverse.length
      ? new Set(calSubjectUniverse) : (calFilters.subjects || null);
  }
  // Drop stale saved slugs the student no longer has.
  if (calFilters.subjects && calSubjectUniverse.length) {
    calFilters.subjects = new Set([...calFilters.subjects].filter(s => calSubjectUniverse.includes(s)));
    if (!calFilters.subjects.size) calFilters.subjects = new Set(calSubjectUniverse);
  }

  // Shared avatar + "Hi, name" dropdown (account-cluster.js) so this page's
  // header matches every other page; minimal escaped bar as a fallback.
  if (typeof _gcseInjectAccountBar === 'function') {
    window._gcseProfile = window._gcseProfile || { username: auth.username, role: auth.role };
    window._gcseSupabaseClient = window._gcseSupabaseClient || srClient;
    _gcseInjectAccountBar();
  } else {
    document.getElementById('accountBar').innerHTML =
      `<span>Logged in as <strong>${esc(auth.username || 'you')}</strong></span>
       <button type="button" class="nav-link" id="logoutBtn">Log out</button>`;
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await srClient.auth.signOut();
      localStorage.removeItem('gcse_session_v1');
      location.replace('login.html');
    });
  }

  // Calendar starts on the real current month.
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();

  document.getElementById('srPrevBtn').addEventListener('click', () => { shiftMonth(-1); });
  document.getElementById('srNextBtn').addEventListener('click', () => { shiftMonth(1); });
  document.getElementById('srTodayBtn').addEventListener('click', () => {
    const t = new Date();
    calYear = t.getFullYear(); calMonth = t.getMonth();
    renderCalendar();
  });

  // Quiz modal chrome — closing (backdrop or ✕) just abandons the session;
  // the server's counters persist, so no data is lost.
  document.getElementById('srQuizClose').addEventListener('click', closeQuiz);
  document.getElementById('srQuizBackdrop').addEventListener('click', closeQuiz);

  // A cached schedule (if the engine kept one from a previous page) lets us
  // paint instantly; the live fetch below then corrects it. The schedule is
  // always fetched for ALL subjects (p_subject null) and filtered here.
  const cached = typeof srCachedSchedule === 'function' ? srCachedSchedule(null) : null;
  if (cached && cached.length) { schedule = cached; renderAll(); }

  await refreshSchedule();
}

// ── Teacher-set task deadlines (WP-A5) ──────────────────────────
// Same RLS-scoped selects the dashboard uses; each published, dated task
// this student is assigned becomes one calendar event with its class's
// subject attached (classes_student_select + subjects read-all policies).
async function loadTaskEvents() {
  if (!srClient || !srUid) return;
  try {
    const [{ data: tasks }, { data: asg }, { data: atts }, { data: cls }] = await Promise.all([
      srClient.from('tasks').select('*'),
      srClient.from('task_assignments').select('*').eq('student_id', srUid),
      srClient.from('task_attempts').select('*').eq('student_id', srUid),
      srClient.from('classes').select('id, subjects(slug)'),
    ]);
    const classSubj = {};
    (cls || []).forEach(c => { if (c.subjects) classSubj[c.id] = c.subjects.slug; });
    taskEvents = (asg || []).map(a => {
      const t = (tasks || []).find(x => x.id === a.task_id);
      if (!t || t.status !== 'published') return null;
      const due = effectiveDue(t, a);
      if (!due) return null;
      const attempts = (atts || []).filter(x => x.task_id === t.id);
      return {
        date: srTodayStr(due),
        due,
        task: t,
        state: studentTaskState(t, a, attempts),
        subjectSlug: classSubj[t.class_id] || null,
      };
    }).filter(Boolean);
  } catch (e) {
    console.error('loadTaskEvents', e);
    // keep the previous events rather than blanking the calendar
  }
}

function shiftMonth(delta) {
  calMonth += delta;
  while (calMonth < 0) { calMonth += 12; calYear--; }
  while (calMonth > 11) { calMonth -= 12; calYear++; }
  renderCalendar();
}

// Re-fetch the whole schedule + task deadlines and repaint everything.
// Called on load, after a review is ticked off, and whenever the student
// returns to the page (see the live-refresh listeners at the bottom).
async function refreshSchedule() {
  try {
    const [rows] = await Promise.all([
      srFetchSchedule(srClient, null), // null = every subject; filtered client-side
      loadTaskEvents(),
    ]);
    schedule = rows || [];
  } catch (e) {
    console.error('srFetchSchedule', e);
    // Keep whatever we last had rather than blanking the page.
  }
  renderAll();
}

function renderAll() {
  renderFilterBar();
  renderStats();
  renderDueNow();
  renderCalendar();
  renderLegend();
}

// ── Filter bar (subjects × kinds) ───────────────────────────────
// Subject chips only appear for multi-subject students; the kind toggles
// (Reviews / Tasks) always do — they control what the month grid shows.
let _calFilterWired = false;
function renderFilterBar() {
  const bar = document.getElementById('srFilterBar');
  if (!bar) return;
  const subjects = calSubjectUniverse.length
    ? calSubjectUniverse
    : [...new Set(schedule.map(r => calSubjectOf(r.page_id)).concat(
        taskEvents.map(e => e.subjectSlug).filter(Boolean)))];
  const showSubjects = subjects.length > 1;
  if (calFilters.subjects === null && showSubjects) calFilters.subjects = new Set(subjects);

  const subjChips = showSubjects ? subjects.map(s => {
    const meta = calSubjectMeta(s) || {};
    const on = !calFilters.subjects || calFilters.subjects.has(s);
    return `<button type="button" class="sr-fchip" data-fsubject="${esc(s)}" aria-pressed="${on}"
      style="--chip-accent:${esc(meta.colour || 'var(--accent)')}">${meta.icon ? esc(meta.icon) + ' ' : ''}${esc(meta.name || s)}</button>`;
  }).join('') : '';

  bar.style.display = 'flex';
  bar.innerHTML = `
    ${showSubjects ? `<div class="sr-fgroup"><span class="sr-flabel">Subjects</span>${subjChips}</div>` : ''}
    <div class="sr-fgroup"><span class="sr-flabel">Show</span>
      <button type="button" class="sr-fchip" data-fkind="reviews" aria-pressed="${calFilters.reviews}">🔁 Reviews</button>
      <button type="button" class="sr-fchip" data-fkind="tasks" aria-pressed="${calFilters.tasks}"
        style="--chip-accent:var(--ink)">📋 Tasks</button>
    </div>`;

  if (!_calFilterWired) _calFilterWired = true; // listeners are re-attached per render below
  bar.querySelectorAll('[data-fsubject]').forEach(b => b.addEventListener('click', () => {
    const s = b.dataset.fsubject;
    if (!calFilters.subjects) calFilters.subjects = new Set(subjects);
    if (calFilters.subjects.has(s)) {
      // Never allow an empty subject selection — an all-blank calendar
      // reads as broken. The last chip stays on.
      if (calFilters.subjects.size > 1) calFilters.subjects.delete(s);
    } else {
      calFilters.subjects.add(s);
    }
    calSaveFilters();
    renderAll();
  }));
  bar.querySelectorAll('[data-fkind]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.fkind;
    const next = { ...calFilters, [k]: !calFilters[k] };
    // Same rule for kinds: at least one stays on.
    if (!next.reviews && !next.tasks) return;
    calFilters.reviews = next.reviews;
    calFilters.tasks = next.tasks;
    calSaveFilters();
    renderAll();
  }));
}

function renderLegend() {
  const el = document.getElementById('srLegend');
  if (!el) return;
  el.innerHTML = `
    <span><i class="lg-review"></i> Review (1 day / 1 week / 4 weeks)</span>
    <span><i class="lg-task"></i> Task deadline set by your teacher</span>
    <span><i class="lg-locked"></i> Missed / locked task</span>`;
}

// ── Stats strip ─────────────────────────────────────────────────
function renderStats() {
  const today = srTodayStr();
  const visible = calVisibleSchedule();
  const counts = srCounts(visible, today);
  // Next upcoming review: the earliest due_date among rows that aren't yet
  // actionable or completed.
  let nextDate = null;
  visible.forEach(r => {
    if (srStatus(r, today) === 'upcoming') {
      if (!nextDate || r.due_date < nextDate) nextDate = r.due_date;
    }
  });
  const dueTasks = calVisibleTasks().filter(ev =>
    ev.state === 'not_started' || ev.state === 'in_progress' || ev.state === 'overdue').length;
  document.getElementById('srStats').innerHTML = `
    <span class="stat">⏰ <b>${counts.actionable}</b> to review now</span>
    <span class="stat">✅ <b>${counts.completed}</b> completed</span>
    <span class="stat">📋 <b>${dueTasks}</b> open task${dueTasks === 1 ? '' : 's'}</span>
    <span class="stat">🗓️ next review: <b>${nextDate ? esc(srFmtDate(nextDate)) : '—'}</b></span>`;
}

// ── "Due now" panel ─────────────────────────────────────────────
function renderDueNow() {
  const host = document.getElementById('srDueNow');
  const today = srTodayStr();
  const schedule = calVisibleSchedule(); // shadow: this panel respects the subject filter

  // Entirely empty schedule = the student hasn't practised anything yet.
  if (!schedule.length) {
    host.innerHTML = `
      <div class="sr-empty">
        <div class="sr-empty-emoji">🌱</div>
        <p><strong>Nothing scheduled yet.</strong></p>
        <p class="muted">Topics appear here automatically the day after you first practise one —
        then we bring them back after 1 day, 1 week and 4 weeks so they stick.</p>
        <p style="margin-top:10px;">
          <a class="sr-inline-link" href="/subjects/${esc(srSlug())}/">Browse the topic list →</a>
        </p>
      </div>`;
    return;
  }

  // Overdue first (oldest due_date first), then today's due (oldest first).
  const actionable = schedule
    .filter(r => { const s = srStatus(r, today); return s === 'overdue' || s === 'due'; })
    .sort((a, b) => {
      const sa = srStatus(a, today), sb = srStatus(b, today);
      if (sa !== sb) return sa === 'overdue' ? -1 : 1;
      return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0;
    });

  if (!actionable.length) {
    host.innerHTML = `
      <div class="sr-empty">
        <div class="sr-empty-emoji">🎉</div>
        <p><strong>Nothing to review right now.</strong></p>
        <p class="muted">You're all caught up. Each topic you practise comes back after
        1 day → 1 week → 4 weeks; the calendar below shows what's coming.</p>
      </div>`;
    return;
  }

  const rows = actionable.map(r => {
    const s = srStatus(r, today);
    const name = calPageName(r.page_id);
    const overdueBy = s === 'overdue' ? srDayDiff(r.due_date, today) : 0;
    const when = s === 'overdue'
      ? `was due ${overdueBy} day${overdueBy === 1 ? '' : 's'} ago`
      : 'due today';
    return `
      <div class="sr-due-row ${s === 'overdue' ? 'is-overdue' : ''}">
        <div class="sr-due-main">
          <div class="sr-due-name" title="${esc(name)}">${esc(name)}</div>
          <div class="sr-due-meta">
            <span class="chip">${esc(srStageLabel(r.stage))} review</span>
            <span class="sr-due-when">${esc(when)}</span>
          </div>
        </div>
        <button type="button" class="btn sr-start-btn"
          data-pid="${esc(String(r.page_id))}" data-stage="${esc(String(r.stage))}">Start review</button>
      </div>`;
  }).join('');

  host.innerHTML = `<h2 class="sr-section-title">Due now</h2>${rows}`;
  host.querySelectorAll('.sr-start-btn').forEach(btn => {
    btn.addEventListener('click', () => startReview(btn.dataset.pid, Number(btn.dataset.stage)));
  });
}

// ── Month calendar ──────────────────────────────────────────────
// Merges both event kinds per day: reviews first (the page's original
// purpose), then task deadlines. The kind toggles control what appears;
// the subject filter applies to both.
function renderCalendar() {
  const today = srTodayStr();
  const byDate = calFilters.reviews ? srGroupByDate(calVisibleSchedule()) : {};
  const tasksByDate = {};
  if (calFilters.tasks) {
    calVisibleTasks().forEach(ev => {
      (tasksByDate[ev.date] = tasksByDate[ev.date] || []).push(ev);
    });
    Object.values(tasksByDate).forEach(list => list.sort((a, b) => a.due - b.due));
  }
  const matrix = srMonthMatrix(calYear, calMonth); // week-arrays of 'YYYY-MM-DD'

  document.getElementById('srCalTitle').textContent = `${SR_MONTHS[calMonth]} ${calYear}`;

  const head = SR_DOW.slice(1).concat(SR_DOW[0]) // Monday-start header
    .map(d => `<div class="sr-cal-dow">${d}</div>`).join('');

  const cells = matrix.map(week => week.map(dateStr => {
    const dt = srParseDate(dateStr);
    const inMonth = dt.getMonth() === calMonth;
    const isToday = dateStr === today;
    const dayNum = dt.getDate();
    return `<div class="sr-cell${inMonth ? '' : ' sr-out'}${isToday ? ' sr-today' : ''}">
      <div class="sr-cell-num">${dayNum}</div>
      <div class="sr-cell-chips">${chipsHtml(byDate[dateStr] || [], tasksByDate[dateStr] || [], today)}</div>
    </div>`;
  }).join('')).join('');

  document.getElementById('srCalGrid').innerHTML =
    `<div class="sr-cal-dowrow">${head}</div><div class="sr-cal-body">${cells}</div>`;

  // Wire clickable review chips (due/overdue) and the "+n more" expanders.
  // Task chips are plain <a> links to task.html — nothing to wire.
  const grid = document.getElementById('srCalGrid');
  grid.querySelectorAll('.sr-chip.is-clickable').forEach(ch => {
    ch.addEventListener('click', () => startReview(ch.dataset.pid, Number(ch.dataset.stage)));
  });
  grid.querySelectorAll('.sr-more').forEach(m => {
    m.addEventListener('click', () => m.closest('.sr-cell').classList.toggle('sr-expanded'));
  });
}

// Whether chips should carry their subject's colour/icon — only useful
// when more than one subject is actually selected.
function calMultiSubjectView() {
  return calFilters.subjects ? calFilters.subjects.size > 1 : calSubjectUniverse.length > 1;
}

// Chips for a single day cell — review rows then task events. First 3
// always show; the rest hide behind a "+n more" toggle that expands the
// cell (never widening it, so nothing overflows the grid horizontally).
function chipsHtml(reviewRows, taskList, today) {
  const total = reviewRows.length + taskList.length;
  if (!total) return '';
  const multi = calMultiSubjectView();
  const accentFor = slug => {
    const meta = slug ? calSubjectMeta(slug) : null;
    return meta && meta.colour ? meta.colour : 'var(--accent)';
  };
  const iconFor = slug => {
    const meta = slug ? calSubjectMeta(slug) : null;
    return multi && meta && meta.icon ? meta.icon + ' ' : '';
  };

  let i = 0;
  const parts = [];
  reviewRows.forEach(r => {
    const s = srStatus(r, today);
    const clickable = (s === 'due' || s === 'overdue');
    const name = calPageName(r.page_id);
    const stage = srStageLabel(r.stage);
    const slug = calSubjectOf(r.page_id);
    const cls = `sr-chip sr-${s}${clickable ? ' is-clickable' : ''}${multi ? ' sr-subject-accented' : ''}${i >= 3 ? ' sr-chip-extra' : ''}`;
    const tip = s === 'upcoming'
      ? `${name} — unlocks on ${srFmtDate(r.due_date)}`
      : `${name} — ${stage} review`;
    const tick = s === 'completed' ? '✓ ' : '';
    parts.push(`<div class="${cls}" style="--chip-accent:${esc(accentFor(slug))}" title="${esc(tip)}"
        ${clickable ? `data-pid="${esc(String(r.page_id))}" data-stage="${esc(String(r.stage))}" role="button" tabindex="0"` : ''}>
        <span class="sr-chip-name">${tick}${iconFor(slug)}${esc(name)}</span>
        <span class="sr-chip-stage">${esc(stage)}</span>
      </div>`);
    i++;
  });
  taskList.forEach(ev => {
    const done = ev.state === 'submitted';
    const locked = ev.state === 'locked';
    const time = ev.due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const stateLabel = { submitted: '✓ submitted', locked: 'missed', overdue: 'overdue!',
      in_progress: 'in progress', not_started: 'due ' + time }[ev.state] || 'due ' + time;
    const tip = `${ev.task.title} — task ${stateLabel}`;
    parts.push(`<a class="sr-chip sr-chip-task${done ? ' is-done' : ''}${locked ? ' sr-task-locked' : ''}${i >= 3 ? ' sr-chip-extra' : ''}"
        style="--chip-accent:${esc(accentFor(ev.subjectSlug))}" title="${esc(tip)}"
        href="task.html?id=${esc(ev.task.id)}">
        <span class="sr-chip-name">📋 ${iconFor(ev.subjectSlug)}${esc(ev.task.title)}</span>
        <span class="sr-chip-stage">${esc(stateLabel)}</span>
      </a>`);
    i++;
  });

  const extra = total - 3;
  const more = extra > 0
    ? `<button type="button" class="sr-more">+${extra} more</button>` : '';
  return parts.join('') + more;
}

// ── Quiz flow ───────────────────────────────────────────────────
function openQuizModal() {
  document.getElementById('srQuizBackdrop').classList.add('show');
  document.getElementById('srQuizModal').classList.add('show');
  quizActive = true;
}
function closeQuiz() {
  document.getElementById('srQuizBackdrop').classList.remove('show');
  document.getElementById('srQuizModal').classList.remove('show');
  quizActive = false;
  quizAwaitingAnswer = false;
  quizQuestions = [];
  // A refresh after closing reflects any review just ticked off (and is safe
  // now that no question is mid-answer).
  refreshSchedule();
}

async function startReview(pageId, stage) {
  quizPageId = pageId;
  quizStage = Number(stage);
  quizIdx = 0;
  srSessionAnswered = 0;
  srSessionCorrect = 0;
  srAdvancedFIB = false;
  openQuizModal();

  const panel = document.getElementById('srQuizPanel');
  panel.innerHTML = `<div class="sr-empty"><div class="sr-empty-emoji">⏳</div><p>Loading questions…</p></div>`;

  const { data, error } = await srClient.rpc('get_topic_review_questions',
    { p_page_id: pageId, p_limit: 5 });
  if (error) {
    console.error('get_topic_review_questions', error);
    panel.innerHTML = quizMessage('😕', 'Couldn’t load this review',
      'Something went wrong fetching the questions — please try again.');
    return;
  }
  quizQuestions = data || [];

  // Placeholder topics with no bank yet: nothing to grade, so we can't (and
  // mustn't) tick the review off.
  if (!quizQuestions.length) {
    panel.innerHTML = quizMessage('📭', 'No practice questions for this topic yet',
      'This review can’t be completed until questions exist for this topic. Nothing has been ticked off.');
    return;
  }

  // Target + pass mark come from the shared engine; the server confirms them
  // on the first submit (review.target / review.pass_mark) and we resync.
  srTarget = Math.min(srSessionTarget(quizQuestions.length), quizQuestions.length);
  srPassMarkN = srPassMark(srTarget);
  renderQuizQuestion();
}

function quizMessage(emoji, title, body) {
  return `<div class="sr-empty">
    <div class="sr-empty-emoji">${emoji}</div>
    <p><strong>${esc(title)}</strong></p>
    <p class="muted">${esc(body)}</p>
    <div class="sr-actions"><button type="button" class="btn" id="srBackBtn">Back to calendar</button></div>
  </div>`;
}
// Delegated so it works for every dynamically-inserted "Back to calendar".
document.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'srBackBtn') closeQuiz();
});

function srScoreDotsHtml() {
  let dots = '';
  for (let i = 0; i < srTarget; i++) {
    let cls = 'sr-dot';
    if (i < srSessionCorrect) cls += ' sr-dot-correct';
    else if (i < srSessionAnswered) cls += ' sr-dot-wrong';
    dots += `<span class="${cls}"></span>`;
  }
  return dots;
}

function renderQuizQuestion() {
  if (quizIdx >= quizQuestions.length) {
    // Ran out of fetched questions without the server declaring the review
    // complete or failed. Shouldn't normally happen (target ≤ fetched), but
    // fail safe rather than loop.
    document.getElementById('srQuizPanel').innerHTML = quizMessage('👍', 'That’s all for now',
      'Come back to finish this review later.');
    return;
  }
  const q = quizQuestions[quizIdx];
  const snap = q.snapshot || {};
  quizAwaitingAnswer = true;
  let hasSelection = false;
  const panel = document.getElementById('srQuizPanel');
  const topicName = calPageName(quizPageId) || q.page_name || 'Topic';

  let inputHtml = '';
  if (q.qtype === 'mcq') {
    inputHtml = `<div id="srqOpts">${(snap.options || []).map((o, oi) => `
      <label class="opt" data-oi="${oi}">
        <input type="radio" name="srqOpt" value="${oi}"/> ${esc(o)}
      </label>`).join('')}</div>`;
  } else if (q.qtype === 'tf') {
    inputHtml = `<div id="srqOpts">
      <label class="opt" data-val="true"><input type="radio" name="srqOpt" value="true"/> ✔ True</label>
      <label class="opt" data-val="false"><input type="radio" name="srqOpt" value="false"/> ✘ False</label>
    </div>`;
  } else if (q.qtype === 'fib') {
    // fibBlankTokens (tasks-shared.js) understands both marker styles — the
    // positional `_____` and the named `___B1___` the Economics bank uses.
    const tokens = fibBlankTokens(snap.question);
    const blankOptions = snap.blankOptions || {};
    const useDropdown = !srAdvancedFIB;
    let html = `<div style="margin-bottom:10px;">
      <button type="button" class="sr-mode-btn" id="srqFibModeBtn">${useDropdown ? '🔥 Switch to typing' : '🔽 Switch to dropdowns'}</button>
    </div><div class="fib-text" id="srqFib">`;
    let bn = 0;
    tokens.forEach(t => {
      if (t.blank == null) { html += taskRichText(t.text); return; }
      const key = t.blank; bn++;
      if (useDropdown && blankOptions[key]) {
        const opts = ['— choose —', ...blankOptions[key]];
        html += `<select class="blank-select" data-bk="${esc(key)}" aria-label="Blank ${bn}">` +
          opts.map(o => `<option value="${o === '— choose —' ? '' : esc(o)}">${esc(o)}</option>`).join('') +
          `</select>`;
      } else {
        html += `<input type="text" class="fib-input" data-bk="${esc(key)}" autocomplete="off" spellcheck="false" aria-label="Blank ${bn}"/>`;
      }
    });
    html += '</div>';
    inputHtml = html;
  }

  panel.innerHTML = `
    <div class="sr-quiz-head">
      <div class="sr-quiz-title">Review: ${esc(topicName)}</div>
      <div class="sr-quiz-sub"><span class="chip">${esc(srStageLabel(quizStage))} review</span></div>
    </div>
    <div class="sr-quiz-progress">
      <span class="sr-progress-text">Question ${Math.min(srSessionAnswered + 1, srTarget)} of ${srTarget}</span>
      <span class="sr-dots" id="srqDots">${srScoreDotsHtml()}</span>
    </div>
    <div class="qhead">
      <span class="chip">${esc(q.page_name || topicName)}</span>
      <span>[${q.marks} mark${Number(q.marks) === 1 ? '' : 's'}]</span>
    </div>
    ${snap.caseStudy ? `<div class="case-study"><strong>Case study:</strong>\n${taskRichText(snap.caseStudy)}</div>` : ''}
    ${snap.reading ? `<div class="case-study">${snap.readingTitle ? `<strong>${esc(snap.readingTitle)}</strong><br>` : ''}${_safeHtml(snap.reading)}</div>` : ''}
    ${q.qtype === 'fib' ? '' : `<div class="qtext">${taskRichText(snap.question)}</div>`}
    ${inputHtml}
    <div class="dr-feedback" id="srqFeedback"></div>
    <div class="sr-actions">
      <button type="button" class="btn" id="srqSubmitBtn" disabled>Submit</button>
    </div>`;

  const submitBtn = document.getElementById('srqSubmitBtn');
  const enable = () => { submitBtn.disabled = !hasSelection; };

  if (q.qtype === 'mcq' || q.qtype === 'tf') {
    panel.querySelectorAll('input[name="srqOpt"]').forEach(r => r.addEventListener('change', () => {
      panel.querySelectorAll('.opt').forEach(o => o.classList.remove('selected'));
      r.closest('.opt').classList.add('selected');
      hasSelection = true; enable();
    }));
  } else if (q.qtype === 'fib') {
    panel.querySelectorAll('.fib-input').forEach(inp => inp.addEventListener('input', () => { hasSelection = true; enable(); }));
    panel.querySelectorAll('.blank-select').forEach(sel => sel.addEventListener('change', () => { hasSelection = true; enable(); }));
    const modeBtn = document.getElementById('srqFibModeBtn');
    if (modeBtn) modeBtn.addEventListener('click', () => {
      srAdvancedFIB = !srAdvancedFIB;
      renderQuizQuestion(); // rebuild this same question in the other mode
    });
  }

  submitBtn.addEventListener('click', () => submitQuizAnswer(q));
}

async function submitQuizAnswer(q) {
  if (!quizAwaitingAnswer) return;
  let value;
  if (q.qtype === 'mcq') {
    const checked = document.querySelector('input[name="srqOpt"]:checked');
    if (!checked) return;
    value = parseInt(checked.value, 10);
  } else if (q.qtype === 'tf') {
    const checked = document.querySelector('input[name="srqOpt"]:checked');
    if (!checked) return;
    value = checked.value === 'true';
  } else if (q.qtype === 'fib') {
    value = {};
    document.querySelectorAll('#srqFib .fib-input, #srqFib .blank-select').forEach(el => { value[el.dataset.bk] = el.value; });
  }

  const submitBtn = document.getElementById('srqSubmitBtn');
  submitBtn.disabled = true;

  const { data, error } = await srClient.rpc('record_review_answer', {
    p_page_id: quizPageId, p_stage: quizStage,
    p_question_key: q.question_key, p_answer: { value },
  });
  if (error) {
    // The RPC raises if the review row is missing or already completed (e.g.
    // finished in another tab). Refresh the schedule and bounce back rather
    // than leaving the student stuck.
    console.error('record_review_answer', error);
    document.getElementById('srQuizPanel').innerHTML = quizMessage('🔄', 'This review moved on',
      'It looks like this review was already completed or is no longer scheduled. The calendar has been refreshed.');
    refreshSchedule();
    return;
  }
  quizAwaitingAnswer = false;
  applyQuizFeedback(q, data);
}

function applyQuizFeedback(q, result) {
  const correct = !!result.correct;
  const answerKey = result.answer_key || {};
  const review = result.review || {};

  // Server counters are authoritative — resync so the progress display is
  // right even if we resumed a partly-finished review.
  if (typeof review.answered === 'number') srSessionAnswered = review.answered;
  if (typeof review.correct === 'number') srSessionCorrect = review.correct;
  if (typeof review.target === 'number') srTarget = review.target;
  if (typeof review.pass_mark === 'number') srPassMarkN = review.pass_mark;
  const dotsEl = document.getElementById('srqDots');
  if (dotsEl) dotsEl.innerHTML = srScoreDotsHtml();

  // Colour the options / blanks from the returned answer key (same as
  // daily-revise).
  if (q.qtype === 'mcq') {
    document.querySelectorAll('#srqOpts .opt').forEach((el, oi) => {
      el.classList.add('disabled');
      if (oi === answerKey.answer) el.classList.add('correct');
      else if (el.classList.contains('selected') && !correct) el.classList.add('wrong');
    });
  } else if (q.qtype === 'tf') {
    document.querySelectorAll('#srqOpts .opt').forEach(el => {
      el.classList.add('disabled');
      const isTrueOpt = el.dataset.val === 'true';
      if (isTrueOpt === answerKey.answer) el.classList.add('correct');
      else if (el.classList.contains('selected') && !correct) el.classList.add('wrong');
    });
  } else if (q.qtype === 'fib') {
    const blanks = answerKey.blanks || {};
    document.querySelectorAll('#srqFib .fib-input, #srqFib .blank-select').forEach(el => {
      el.disabled = true;
      const expected = blanks[el.dataset.bk] || '';
      const ok = el.value.trim().toLowerCase() === String(expected).trim().toLowerCase();
      el.classList.add(ok ? 'correct' : 'wrong');
      if (!ok) el.insertAdjacentHTML('afterend', ` <span class="dr-fib-answer">✅ ${esc(expected)}</span>`);
    });
    const modeBtn = document.getElementById('srqFibModeBtn');
    if (modeBtn) modeBtn.disabled = true;
  }

  const fb = document.getElementById('srqFeedback');
  // explain is plain text but the markScheme fallback is site-generated
  // HTML (<p>/<strong>/tables with classes) — escaping it showed literal
  // tags. Render it the same way daily-revise.js's applyFeedback does.
  const explain = answerKey.explain || answerKey.markScheme || '';
  fb.className = `dr-feedback show ${correct ? 'm3' : 'm0'}`;
  fb.innerHTML = (correct ? '✓ Correct! ' : '✗ Not quite. ') + explain;

  // "Report a problem" (WP-C5) — appended once the answer's marked. Optional:
  // no-op if question-report.js isn't loaded.
  if (typeof gcseQuestionReportButton === 'function') {
    const row = document.createElement('div');
    row.style.marginTop = '8px';
    row.appendChild(gcseQuestionReportButton({
      client: srClient, questionKey: q.question_key, pageId: quizPageId,
      subject: srSlug(), activity: 'review',
    }));
    fb.appendChild(row);
  }

  // Gamification — identical to daily-revise. XP was already durably credited
  // server-side via the mastery path, so the toast is real.
  if (typeof gamificationPlaySound === 'function') gamificationPlaySound(correct ? 'correct' : 'wrong');
  if (typeof _gamBumpDaily === 'function') _gamBumpDaily();
  if (correct && typeof gamificationShowXpToast === 'function') {
    gamificationShowXpToast(GAMIFICATION_XP_PER_QUESTION);
  }

  // The `review` object is the source of truth for what happens next.
  if (review.completed) { showReviewComplete(); return; }
  if (review.failed_attempt) { showReviewFailed(); return; }

  // Otherwise: keep going to the next question.
  const actions = document.querySelector('#srQuizPanel .sr-actions');
  actions.innerHTML = `<button type="button" class="btn" id="srqNextBtn">Next →</button>`;
  document.getElementById('srqNextBtn').addEventListener('click', () => {
    quizIdx++;
    renderQuizQuestion();
  });
}

function showReviewComplete() {
  // Next stage's label, if this wasn't already the last (4-week) review.
  const next = (typeof SR_STAGES !== 'undefined' ? SR_STAGES : []).find(s => s.stage === quizStage + 1);
  const seeYou = next
    ? `See you again in ${next.label} for the next review of this topic.`
    : `That’s the last scheduled review of this topic — it’s locked in for the long term. 🎓`;
  document.getElementById('srQuizPanel').innerHTML = `
    <div class="sr-celebrate">
      <div class="sr-celebrate-tick">✓</div>
      <h2 class="sr-quiz-title" style="margin-bottom:8px;">Review complete!</h2>
      <p class="muted">You scored ${srSessionCorrect}/${srSessionAnswered} — that’s a pass.</p>
      <p style="margin-top:8px;">${esc(seeYou)}</p>
      <div class="sr-actions" style="justify-content:center;">
        <button type="button" class="btn" id="srBackBtn">Back to calendar</button>
      </div>
    </div>`;
  if (typeof gamificationPlaySound === 'function') gamificationPlaySound('levelup');
  // Repaint the calendar underneath so the chip turns green immediately.
  refreshSchedule();
}

function showReviewFailed() {
  document.getElementById('srQuizPanel').innerHTML = `
    <div class="sr-celebrate">
      <div class="sr-celebrate-tick sr-fail">↺</div>
      <h2 class="sr-quiz-title" style="margin-bottom:8px;">Not this time</h2>
      <p class="muted">You got ${srSessionCorrect}/${srSessionAnswered} — you need ${srPassMarkN} to tick this review off.</p>
      <p style="margin-top:8px;">No worries — your progress reset, so have another go with a fresh set of questions.</p>
      <div class="sr-actions" style="justify-content:center;">
        <button type="button" class="btn" id="srqRetryBtn">Try again</button>
        <button type="button" class="btn btn-ghost" id="srBackBtn">Back to calendar</button>
      </div>
    </div>`;
  document.getElementById('srqRetryBtn').addEventListener('click', () => startReview(quizPageId, quizStage));
}

// ── Live refresh (copied from daily-revise's maybeRefreshLive guard) ──
// Refresh on return to the page, but NEVER while a quiz question is on
// screen unanswered — a student mid-question shouldn't have it yanked away.
function maybeRefreshLive() {
  if (!srClient) return;
  if (quizActive && quizAwaitingAnswer) return;
  refreshSchedule();
}
window.addEventListener('pageshow', (e) => { if (e.persisted) maybeRefreshLive(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') maybeRefreshLive(); });
// `focus` also catches the side-by-side-windows case that visibilitychange
// misses (see daily-revise.js for the full reasoning).
window.addEventListener('focus', maybeRefreshLive);

document.addEventListener('DOMContentLoaded', init);
