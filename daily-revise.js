// ══════════════════════════════════════════════════════════════
// DAILY REVISE — spaced-repetition "Rule of 3" mastery drilling.
//
// Pulls today's queue from get_daily_revise_queue() and grades answers
// via record_mastery_answer() (supabase/daily-revise-functions.sql) —
// this page NEVER loads question-bank.js, since that generated file
// embeds the correct answer inline for every question and is only safe
// for the teacher-only task builder. See supabase/bank-questions-schema.sql
// for the full reasoning.
//
// Topic filtering, the workload cap and pacing are all controlled per-class
// by the teacher (supabase/daily-revise-class-settings.sql, configured from
// the Teacher Dashboard's Topic Access tab) — fetched via
// get_daily_revise_settings() on load and again whenever the student
// returns to this page (see refreshLive() below), so a teacher's change
// reaches a student without them needing to know to hard-refresh.
//
// Gamification: sound effects and the device-local daily-goal bump
// (_gamBumpDaily) both apply, since they genuinely reflect activity done
// here. XP toasts fire on correct answers too — record_mastery_answer()
// writes to daily_revise_stats (supabase/daily-revise-stats-schema.sql), a
// durable lifetime counter that computeGamificationStats() (gamification.js)
// folds into the SAME total XP/level shown everywhere else in the app, so
// the toast genuinely corresponds to a real, permanent change. It still
// deliberately does NOT write to progress_summary (a topic's own completion
// ring must never be misrepresented by cross-topic review). Badge-unlock
// toasts are intentionally skipped on this page specifically — computing
// them accurately needs this student's full per-topic progress too, which
// this page doesn't fetch; the same badges still toast correctly the next
// time the student visits a topic page or a dashboard, both of which do.
// The day-streak is real too — record_mastery_answer() logs to
// progress_events like everything else, which is exactly what get_my_streak()
// scans.
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

let drClient = null;
let drSettings = { topic_mode: 'teacher_controlled', active_page_ids: [], weekly_cap: null, pre_seconds: 5, post_seconds: 5 };
let selectedPageIds = []; // [] = no filter (show everything the mode allows)
let queue = [];
let qIdx = 0;
let answered = false;
let hasSelection = false;
let questionShownAt = 0;
let preTimer = null;
// Fill-in-the-blanks has two modes, exactly like the topic pages' own FIB
// tab (script.js's buildFIB/isAdvancedFIB): dropdown (default, a handful of
// options per blank) or typing (free-text). The dropdown's options are
// precomputed at question-bank build time (tools/build_question_bank.py),
// since the client must never learn which option is correct until it submits.
let isAdvancedFIB = false;

let filterUIWired = false;
let drFilterWorking = new Set();   // live working copy the grid edits; committed to selectedPageIds on Apply
let drFilterOpenGroups = new Set(); // which curriculum units are expanded — persists across re-renders

// ── Question filters (Smart-Revise style) ──
// Scheduling preferences, persisted per-browser. Unlike the TOPIC filter
// (teacher-gated by class mode), these only shape when/which mastery tiers
// come back, so every student may use them in every mode. Defaults exactly
// reproduce the original behaviour.
const DR_FILTER_PREFS_KEY = 'dr_filter_prefs_v1';
let drPrefs = { smart: true, excludeMastered: true, incorrectOnly: false };
try {
  const saved = JSON.parse(localStorage.getItem(DR_FILTER_PREFS_KEY) || 'null');
  if (saved && typeof saved === 'object') drPrefs = { ...drPrefs, ...saved };
} catch (e) {}

function drSavePrefs() {
  try { localStorage.setItem(DR_FILTER_PREFS_KEY, JSON.stringify(drPrefs)); } catch (e) {}
}

// This page is a single-subject view: subjectLoaderInit({mode:'single'})
// in daily-revise.html has set window.SUBJECT from ?subject= (default
// business) before this file loads.
function drSubjectSlug() {
  return (window.SUBJECT && window.SUBJECT.slug) || 'business';
}

// The exact RPC params for get_daily_revise_queue. Incorrect-only is a
// subset of unmastered, so it forces excludeMastered (pure, unit-tested).
// Full signature: (p_limit, p_page_ids, p_smart, p_exclude_mastered,
// p_incorrect_only, p_subject) — named params, order-independent.
function drQueueParams(prefs, pageIds) {
  return {
    p_page_ids: (pageIds && pageIds.length) ? pageIds : null,
    p_smart: !!prefs.smart,
    p_exclude_mastered: prefs.incorrectOnly ? true : !!prefs.excludeMastered,
    p_incorrect_only: !!prefs.incorrectOnly,
    p_subject: drSubjectSlug(),
  };
}

// ── Per-question mastery bar (4 equal segments: red/orange/yellow/green) ──
// Fill count from mastery_count: null (never seen) = 0 segments; 0 (last
// answer wrong) = 1; correct once = 2; twice = 3; mastered = all 4. Pure
// and unit-tested in tools/logic_test.py.
function drBarFill(masteryCount) {
  return masteryCount == null ? 0 : Math.max(0, Math.min(3, masteryCount)) + 1;
}

function drBarHtml(masteryCount) {
  const fill = drBarFill(masteryCount);
  const segs = [0, 1, 2, 3].map(i =>
    `<span class="seg s${i}${i < fill ? ' on' : ''}"></span>`).join('');
  const label = masteryCount == null ? 'New question' : DR_MASTERY_LABELS[Math.max(0, Math.min(3, masteryCount))];
  return `<div class="dr-mastery-bar" id="drMasteryBar" title="${esc(label)}" aria-label="Mastery: ${esc(label)}">${segs}</div>`;
}

async function init() {
  const auth = await tasksAuthInit('student');
  if (!auth) return;
  drClient = auth.client;

  // Teacher-authored subject? subject-loader.js registered a provisional
  // entry (the static registries don't know it) — upgrade it now that a
  // client exists, so the header, topic names and queue all resolve.
  if (window.SUBJECT && window.SUBJECT.provisional && typeof loadCustomSubjectBank === 'function') {
    try { await loadCustomSubjectBank(window.SUBJECT.slug); }
    catch (e) { console.error('custom subject hydrate', e); }
  }

  // Shared avatar + "Hi, name" dropdown (account-cluster.js) so this page's
  // header matches every other page; minimal escaped bar as a fallback.
  if (typeof _gcseInjectAccountBar === 'function') {
    window._gcseProfile = window._gcseProfile || { username: auth.username, role: auth.role };
    window._gcseSupabaseClient = window._gcseSupabaseClient || drClient;
    _gcseInjectAccountBar();
  } else {
    document.getElementById('accountBar').innerHTML =
      `<span>Logged in as <strong>${esc(auth.username || 'you')}</strong></span>
       <button type="button" class="nav-link" id="logoutBtn">Log out</button>`;
    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await drClient.auth.signOut();
      localStorage.removeItem('gcse_session_v1');
      location.replace('login.html');
    });
  }

  // Header badge names the current subject (the static markup says Business).
  try {
    const badge = document.getElementById('drSubjectBadge');
    if (badge && window.SUBJECT && window.SUBJECT.name) {
      badge.textContent = window.SUBJECT.name +
        (window.SUBJECT.specCode ? ' · ' + window.SUBJECT.specCode : '');
    }
  } catch (e) {}

  // Subject switcher (same control + behaviour as the dashboard) — lets the
  // student move Daily Revise to another of their subjects.
  try { await drInitSubjectSwitcher(); } catch (e) { console.error('drInitSubjectSwitcher', e); }

  await refreshLive();
}

// Builds the header subject dropdown from get_my_subjects (the RPC the
// dashboard uses), shown only when the student has 2+ subjects. Picking one
// reloads Daily Revise for that subject via ?subject=<slug>.
async function drInitSubjectSwitcher() {
  const mount = document.getElementById('subjectSwitcherMount');
  if (!mount || !drClient) return;
  let subjects = null;
  try {
    const { data, error } = await drClient.rpc('get_my_subjects');
    if (error || !Array.isArray(data)) return;
    subjects = data;
  } catch (e) { return; }
  if (!subjects || subjects.length < 2) return;

  const current = drSubjectSlug();
  const select = document.createElement('select');
  select.id = 'subjectSwitcherSelect';
  select.setAttribute('aria-label', 'Switch subject');
  select.innerHTML = subjects.map(s =>
    `<option value="${esc(s.slug)}"${s.slug === current ? ' selected' : ''}>${(s.icon ? s.icon + ' ' : '') + esc(s.name)}</option>`
  ).join('');
  select.addEventListener('change', () => {
    location.href = 'daily-revise.html?subject=' + encodeURIComponent(select.value);
  });
  const wrap = document.createElement('div');
  wrap.className = 'subject-switcher';
  wrap.appendChild(select);
  mount.replaceWith(wrap);
}

// Re-fetches settings + the queue from the server. Called on first load,
// and again whenever the student returns to this page — a browser can
// restore a page from its back-forward cache (navigating back/forward, or
// just switching tabs and back) WITHOUT re-running any of this page's JS at
// all, so a one-time fetch on load isn't enough to reflect a teacher's
// change without an explicit refresh. See the pageshow/visibilitychange
// listeners at the bottom of this file.
async function refreshLive() {
  try {
    const { data: settingsData, error: settingsErr } = await drClient.rpc('get_daily_revise_settings',
      { p_subject: drSubjectSlug() });
    if (settingsErr) {
      console.error('get_daily_revise_settings', settingsErr);
    } else if (settingsData) {
      console.log('[daily-revise] settings from server:', settingsData);
      drSettings = {
        topic_mode: settingsData.topic_mode || 'teacher_controlled',
        active_page_ids: settingsData.active_page_ids || [],
        weekly_cap: settingsData.weekly_cap,
        pre_seconds: settingsData.pre_seconds != null ? settingsData.pre_seconds : 5,
        post_seconds: settingsData.post_seconds != null ? settingsData.post_seconds : 5,
      };
    }
  } catch (e) {
    console.error('get_daily_revise_settings (thrown)', e);
  }

  // Each step below is independent — a failure in one (a missing element,
  // a network hiccup) must not stop the others from running, or the whole
  // page can end up half-wired with no visible error.
  try { setupFilterUI(); } catch (e) { console.error('setupFilterUI', e); }

  try {
    const streak = typeof gamificationRefreshStreak === 'function'
      ? await gamificationRefreshStreak(drClient) : 0;
    const drStats = typeof gamificationRefreshDailyReviseStats === 'function'
      ? await gamificationRefreshDailyReviseStats(drClient) : { masteredCount: 0 };
    renderStats(streak, drStats);
  } catch (e) { console.error('renderStats', e); }

  try { await loadQueue(); } catch (e) { console.error('loadQueue', e); }
}

// Only refetch automatically between questions, never mid-question — a
// student who's part-way through answering shouldn't have their in-progress
// selection yanked out from under them just because they alt-tabbed.
function maybeRefreshLive() {
  if (!drClient) return;
  if (queue.length && qIdx < queue.length && !answered) return;
  refreshLive();
}
window.addEventListener('pageshow', (e) => { if (e.persisted) maybeRefreshLive(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') maybeRefreshLive(); });
// visibilitychange only fires when a TAB is hidden/shown (minimized,
// switched away from) — it does NOT fire when two separate windows are
// simply side-by-side on screen and the student clicks back into this one
// (both stay "visible" the whole time), which is exactly how a teacher and
// student window get compared while testing. `focus` catches that case too.
window.addEventListener('focus', maybeRefreshLive);

let drMasteredCount = 0;

function renderStats(streak, drStats) {
  drMasteredCount = (drStats && drStats.masteredCount) || 0;
  const capLabel = drSettings.weekly_cap == null ? 'Unlimited' : `${drSettings.weekly_cap}/week`;
  document.getElementById('drStats').innerHTML = `
    <span class="stat">🔥 <b>${streak}</b> day streak</span>
    <span class="stat">📋 <b id="drQueueCount">${queue.length}</b> due now</span>
    <span class="stat">🏆 <b id="drMasteredCount">${drMasteredCount}</b> mastered</span>
    <span class="stat">🎚️ <b>${esc(capLabel)}</b> cap</span>`;
}

// The topic filter is always visible and discoverable, regardless of mode —
// it's just read-only (disabled, pre-ticked controls + an explanatory note)
// when the class's mode doesn't let a student change it, rather than
// disappearing entirely. teacher_controlled and teacher_guided both only
// list the topics the teacher's left active (class_topic_filter_active —
// there's nothing to show for a deactivated one); student_controlled lists
// every topic. Only teacher_guided/student_controlled are editable —
// teacher_controlled's boxes are shown ticked+disabled purely to show
// students WHAT the teacher has chosen, not to let them change it.
// Re-callable — this re-runs on every refreshLive(), so it must not
// re-attach the static buttons' listeners more than once (filterUIWired).
function setupFilterUI() {
  if (typeof PAGE_GROUPS === 'undefined') return;
  document.getElementById('drFilterToggleRow').style.display = 'block';

  const editable = drSettings.topic_mode !== 'teacher_controlled';
  const allowedIds = drSettings.topic_mode !== 'student_controlled'
    ? new Set(drSettings.active_page_ids || [])
    : null; // student_controlled — every topic, freely editable

  // Re-sync the working copy from whatever's currently committed each time
  // this runs (e.g. the page regaining focus) — same "stage, then Update"
  // grid used by the Teacher Dashboard's topic grids.
  drFilterWorking = new Set(editable ? selectedPageIds : []);
  renderTopicFilterGrid(document.getElementById('drFilterGroups'), {
    isChecked: pid => drFilterWorking.has(pid),
    onToggle: (pids, checked) => pids.forEach(pid => checked ? drFilterWorking.add(pid) : drFilterWorking.delete(pid)),
    countLabel: (n, total) => `${n}/${total} selected`,
    bulkButtons: editable ? [
      { label: 'Select all', onClick: all => all.forEach(pid => drFilterWorking.add(pid)) },
      { label: 'Clear all', onClick: all => all.forEach(pid => drFilterWorking.delete(pid)) },
    ] : undefined,
    disabledRow: editable ? undefined : () => true,
    openGroups: drFilterOpenGroups,
    pageFilter: p => !allowedIds || allowedIds.has(p.id),
  });

  document.getElementById('drFilterNote').textContent = editable ? ''
    : "Your teacher has set which topics your class practises here — you can't change it. The question filters above are still yours.";
  if (!editable) selectedPageIds = []; // no topic filter possible in this mode

  // Re-sync toggle state on every re-render (a repeat visitor's saved
  // prefs must win over the markup's defaults).
  document.getElementById('drSmartMode').checked = drPrefs.smart;
  document.getElementById('drExcludeMastered').checked = drPrefs.excludeMastered;
  document.getElementById('drIncorrectOnly').checked = drPrefs.incorrectOnly;

  if (filterUIWired) return;
  filterUIWired = true;

  const openDrFilter = () => {
    document.getElementById('drFilterPanel').classList.add('show');
    document.getElementById('drFilterBackdrop').classList.add('show');
  };
  const closeDrFilter = () => {
    document.getElementById('drFilterPanel').classList.remove('show');
    document.getElementById('drFilterBackdrop').classList.remove('show');
  };
  document.getElementById('drFilterToggleBtn').addEventListener('click', openDrFilter);
  document.getElementById('drFilterBackdrop').addEventListener('click', closeDrFilter);
  document.getElementById('drFilterCloseBtn').addEventListener('click', closeDrFilter);

  document.getElementById('drApplyFilterBtn').addEventListener('click', async () => {
    drPrefs = {
      smart: document.getElementById('drSmartMode').checked,
      excludeMastered: document.getElementById('drExcludeMastered').checked,
      incorrectOnly: document.getElementById('drIncorrectOnly').checked,
    };
    drSavePrefs();
    if (drSettings.topic_mode !== 'teacher_controlled') {
      selectedPageIds = [...drFilterWorking];
    }
    closeDrFilter();
    await loadQueue();
  });
}

async function loadQueue() {
  const panel = document.getElementById('drPanel');
  panel.innerHTML = '<div class="empty">Loading…</div>';
  const { data, error } = await drClient.rpc('get_daily_revise_queue', drQueueParams(drPrefs, selectedPageIds));
  if (error) {
    console.error('get_daily_revise_queue', error);
    panel.innerHTML = '<div class="empty">Couldn’t load today’s questions — try refreshing.</div>';
    return;
  }
  queue = data || [];
  qIdx = 0;
  const countEl = document.getElementById('drQueueCount');
  if (countEl) countEl.textContent = queue.length;

  if (!queue.length) {
    if (drPrefs.incorrectOnly) {
      panel.innerHTML = '<div class="empty">🎉 No questions you last got wrong — nice! Turn off “Incorrect only” to keep practising.</div>';
      return;
    }
    const narrowHint = selectedPageIds.length ? ' Try widening your topic filter, or c' : ' C';
    panel.innerHTML = `<div class="empty">🎉 Nothing due right now — you're all caught up.${narrowHint}heck back later.</div>`;
    return;
  }
  renderQuestion();
}

// Seeded per-question option shuffle (mirrors script.js's _shuffledIndices).
// Stable per question; data-oi / the radio value keep the ORIGINAL index, so
// server grading and the data-oi-keyed reveal are unchanged.
function _drHash(s) { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function drPerm(n, seedStr) {
  const idx = Array.from({ length: n }, (_, i) => i);
  let seed = _drHash(seedStr) || 1;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
  return idx;
}

function renderQuestion() {
  const q = queue[qIdx];
  const snap = q.snapshot;
  answered = false;
  hasSelection = false;
  const panel = document.getElementById('drPanel');

  let inputHtml = '';
  if (q.qtype === 'mcq') {
    // Display options in a seeded shuffled order so the correct answer is not
    // always in its authored slot. data-oi and the radio value keep the
    // ORIGINAL index, so the submitted answer and the reveal (which keys on
    // data-oi) are unchanged — only the display order differs.
    const _drOrder = drPerm((snap.options || []).length, String(snap.question || '') + '|' + String(snap.options || []));
    inputHtml = `<div id="drOpts">${_drOrder.map((oi) => `
      <label class="opt" data-oi="${oi}">
        <input type="radio" name="drOpt" value="${oi}"/> ${esc(snap.options[oi])}
      </label>`).join('')}</div>`;
  } else if (q.qtype === 'tf') {
    inputHtml = `<div id="drOpts">
      <label class="opt" data-val="true"><input type="radio" name="drOpt" value="true"/> ✔ True</label>
      <label class="opt" data-val="false"><input type="radio" name="drOpt" value="false"/> ✘ False</label>
    </div>`;
  } else if (q.qtype === 'fib') {
    // fibBlankTokens (tasks-shared.js) understands both marker styles — the
    // positional `_____` and the named `___B1___` the Economics bank uses.
    const tokens = fibBlankTokens(snap.question);
    const blankOptions = snap.blankOptions || {};
    const useDropdown = !isAdvancedFIB;
    let html = `<div style="margin-bottom:10px;">
      <button type="button" class="dr-filter-toggle" id="drFibModeBtn">${useDropdown ? '🔥 Switch to typing' : '🔽 Switch to dropdowns'}</button>
    </div><div class="fib-text" id="drFib">`;
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
    ${drBarHtml(q.mastery_count)}
    <div class="qhead">
      <span>Question ${qIdx + 1} of ${queue.length}</span>
      <span class="chip">${esc(q.page_name)}</span>
      <span>[${q.marks} mark${Number(q.marks) === 1 ? '' : 's'}]</span>
    </div>
    ${snap.caseStudy ? `<div class="case-study"><strong>Case study:</strong>\n${taskRichText(snap.caseStudy)}</div>` : ''}
    ${snap.reading ? `<div class="case-study">${snap.readingTitle ? `<strong>${esc(snap.readingTitle)}</strong><br>` : ''}${_safeHtml(snap.reading)}</div>` : ''}
    ${q.qtype === 'fib' ? '' : `<div class="qtext">${taskRichText(snap.question)}</div>`}
    ${inputHtml}
    <div class="dr-feedback" id="drFeedback"></div>
    <div class="dr-actions">
      <button type="button" class="btn" id="drSubmitBtn" disabled>Submit</button>
    </div>`;

  // Render any LaTeX in the freshly-inserted card (Additional Maths). No-op on
  // subjects without maths / pages that don't load math-render.js.
  if (typeof renderMathIn === 'function') renderMathIn(panel);

  const submitBtn = document.getElementById('drSubmitBtn');
  questionShownAt = Date.now();
  applyPreGuard(submitBtn);

  if (q.qtype === 'mcq' || q.qtype === 'tf') {
    panel.querySelectorAll('input[name="drOpt"]').forEach(r => r.addEventListener('change', () => {
      panel.querySelectorAll('.opt').forEach(o => o.classList.remove('selected'));
      r.closest('.opt').classList.add('selected');
      hasSelection = true;
      updateSubmitEnabled(submitBtn);
    }));
  } else if (q.qtype === 'fib') {
    panel.querySelectorAll('.fib-input').forEach(inp => inp.addEventListener('input', () => {
      hasSelection = true;
      updateSubmitEnabled(submitBtn);
    }));
    panel.querySelectorAll('.blank-select').forEach(sel => sel.addEventListener('change', () => {
      hasSelection = true;
      updateSubmitEnabled(submitBtn);
    }));
    const modeBtn = document.getElementById('drFibModeBtn');
    if (modeBtn) modeBtn.addEventListener('click', () => {
      // Preserve the original reading-pause start time — switching modes
      // shouldn't restart the countdown from scratch.
      const preservedShownAt = questionShownAt;
      isAdvancedFIB = !isAdvancedFIB;
      renderQuestion(); // rebuilds this same question in the other mode
      questionShownAt = preservedShownAt;
      applyPreGuard(document.getElementById('drSubmitBtn'));
    });
  }

  submitBtn.addEventListener('click', submitAnswer);
}

// "Reading pause" — Submit stays disabled until pre_seconds has elapsed,
// regardless of whether an answer's been picked yet (stops racing/guessing),
// AND an answer has actually been given. Mirrors script.js's focus-mode
// pre-guard, minimally, since this page doesn't load script.js.
function applyPreGuard(submitBtn) {
  if (preTimer) clearInterval(preTimer);
  const preMs = (drSettings.pre_seconds || 0) * 1000;
  if (preMs <= 0) { updateSubmitEnabled(submitBtn); return; }
  const tick = () => {
    const remaining = preMs - (Date.now() - questionShownAt);
    if (remaining <= 0) {
      clearInterval(preTimer);
      submitBtn.textContent = 'Submit';
      updateSubmitEnabled(submitBtn);
    } else {
      submitBtn.disabled = true;
      submitBtn.textContent = `Wait ${Math.ceil(remaining / 1000)}s…`;
    }
  };
  tick();
  preTimer = setInterval(tick, 250);
}

function updateSubmitEnabled(submitBtn) {
  const preMs = (drSettings.pre_seconds || 0) * 1000;
  const preElapsed = (Date.now() - questionShownAt) >= preMs;
  submitBtn.disabled = !(hasSelection && preElapsed);
}

async function submitAnswer() {
  if (answered) return;
  const q = queue[qIdx];
  let value;
  if (q.qtype === 'mcq') {
    const checked = document.querySelector('input[name="drOpt"]:checked');
    if (!checked) return;
    value = parseInt(checked.value, 10);
  } else if (q.qtype === 'tf') {
    const checked = document.querySelector('input[name="drOpt"]:checked');
    if (!checked) return;
    value = checked.value === 'true';
  } else if (q.qtype === 'fib') {
    value = {};
    document.querySelectorAll('#drFib .fib-input, #drFib .blank-select').forEach(el => { value[el.dataset.bk] = el.value; });
  }

  if (preTimer) clearInterval(preTimer);
  const submitBtn = document.getElementById('drSubmitBtn');
  submitBtn.disabled = true;

  const { data, error } = await drClient.rpc('record_mastery_answer', {
    p_question_key: q.question_key, p_answer: { value },
  });
  if (error) {
    console.error('record_mastery_answer', error);
    submitBtn.disabled = false;
    return;
  }
  answered = true;
  applyFeedback(q, data);
}

const DR_MASTERY_LABELS = ['Incorrect', 'Correct once', 'Correct twice', 'Mastered'];

function applyFeedback(q, result) {
  const correct = result.correct;
  const answerKey = result.answer_key || {};
  const tier = Math.max(0, Math.min(3, result.mastery_count));

  // Live-update the mastery bar: a correct answer visibly gains a segment,
  // a wrong one snaps back to the single red segment.
  q.mastery_count = result.mastery_count;
  const barEl = document.getElementById('drMasteryBar');
  if (barEl) barEl.outerHTML = drBarHtml(q.mastery_count);

  if (q.qtype === 'mcq') {
    document.querySelectorAll('.opt').forEach((el) => {
      el.classList.add('disabled');
      // Key on data-oi (ORIGINAL index), not DOM position — options are shuffled.
      const oi = +el.dataset.oi;
      if (oi === answerKey.answer) el.classList.add('correct');
      else if (el.classList.contains('selected') && !correct) el.classList.add('wrong');
    });
  } else if (q.qtype === 'tf') {
    document.querySelectorAll('.opt').forEach(el => {
      el.classList.add('disabled');
      const isTrueOpt = el.dataset.val === 'true';
      if (isTrueOpt === answerKey.answer) el.classList.add('correct');
      else if (el.classList.contains('selected') && !correct) el.classList.add('wrong');
    });
  } else if (q.qtype === 'fib') {
    const blanks = answerKey.blanks || {};
    document.querySelectorAll('#drFib .fib-input, #drFib .blank-select').forEach(el => {
      el.disabled = true;
      const expected = blanks[el.dataset.bk] || '';
      const ok = el.value.trim().toLowerCase() === String(expected).trim().toLowerCase();
      el.classList.add(ok ? 'correct' : 'wrong');
      // Shown inline, not just a hover tooltip, so the correct word is
      // actually visible once the blank's marked.
      if (!ok) el.insertAdjacentHTML('afterend', ` <span class="dr-fib-answer">✅ ${esc(expected)}</span>`);
    });
    const modeBtn = document.getElementById('drFibModeBtn');
    if (modeBtn) modeBtn.disabled = true;
  }

  const fb = document.getElementById('drFeedback');
  fb.className = `dr-feedback show m${tier}`;
  const explain = answerKey.explain || answerKey.markScheme || '';
  fb.innerHTML = `<span class="dr-mastery-chip m${tier}">${DR_MASTERY_LABELS[tier]}</span><br>`
    + (correct ? '✓ Correct! ' : '✗ Not quite. ') + explain;
  if (typeof renderMathIn === 'function') renderMathIn(fb);

  // "Report a problem" (WP-C5) — only once the answer's marked, so the
  // student can judge whether it's actually wrong. Optional feature: no-op
  // if question-report.js isn't loaded.
  if (typeof gcseQuestionReportButton === 'function') {
    const row = document.createElement('div');
    row.style.marginTop = '8px';
    row.appendChild(gcseQuestionReportButton({
      client: drClient, questionKey: q.question_key, pageId: q.page_id,
      subject: drSubjectSlug(), activity: 'daily-revise',
    }));
    fb.appendChild(row);
  }

  const isLast = qIdx >= queue.length - 1;
  const readyLabel = isLast ? 'Finish' : 'Next →';
  const actions = document.querySelector('.dr-actions');
  actions.innerHTML = `<button type="button" class="btn" id="drNextBtn" disabled>${readyLabel}</button>`;
  const nextBtn = document.getElementById('drNextBtn');
  applyPostCooldown(nextBtn, readyLabel);
  nextBtn.addEventListener('click', () => {
    qIdx++;
    if (qIdx < queue.length) {
      renderQuestion();
    } else if (drSettings.weekly_cap == null) {
      // Unlimited mode: keep going — re-check for whatever's next due.
      loadQueue();
    } else {
      document.getElementById('drPanel').innerHTML =
        '<div class="empty">🎉 That’s today’s allowance done — come back tomorrow for more.</div>';
    }
  });

  if (typeof gamificationPlaySound === 'function') gamificationPlaySound(correct ? 'correct' : 'wrong');
  if (typeof _gamBumpDaily === 'function') _gamBumpDaily(!!correct);
  // Lets the avatar buddy offer reassurance — decoupled the same way as
  // gamification.js's 'vidya:celebrate' (see avatar-buddy.js): a no-op if
  // the buddy isn't mounted or this fires on a page without it.
  if (!correct) { try { window.dispatchEvent(new CustomEvent('vidya:mistake')); } catch (e) {} }
  // Real XP — record_mastery_answer() has already durably credited this to
  // daily_revise_stats (see the header comment), so the toast isn't fake.
  if (correct && typeof gamificationShowXpToast === 'function') {
    gamificationShowXpToast(GAMIFICATION_XP_PER_QUESTION);
  }
  // A question only reaches tier 3 once, right when it's answered correctly
  // for the third time in a row — get_daily_revise_queue() never re-serves
  // an already-mastered question, so this can't double-count.
  if (correct && tier === 3) {
    drMasteredCount++;
    const el = document.getElementById('drMasteredCount');
    if (el) el.textContent = drMasteredCount;
  }
}

// "Cooldown" — Next/Finish stays disabled for post_seconds so feedback
// actually sinks in before moving on. Same minimal-replication approach as
// applyPreGuard above.
function applyPostCooldown(btn, readyLabel) {
  const postMs = (drSettings.post_seconds || 0) * 1000;
  if (postMs <= 0) { btn.disabled = false; return; }
  const answeredAt = Date.now();
  const timer = setInterval(tick, 250);
  function tick() {
    const remaining = postMs - (Date.now() - answeredAt);
    if (remaining <= 0) {
      clearInterval(timer);
      btn.disabled = false;
      btn.textContent = readyLabel;
    } else {
      btn.textContent = `${readyLabel} (${Math.ceil(remaining / 1000)}s)`;
    }
  }
  tick();
}

document.addEventListener('DOMContentLoaded', init);
