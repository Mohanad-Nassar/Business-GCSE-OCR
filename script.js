// ══════════════════════════════════════════════════════════════
// REQUIRED: Each topic HTML file must define pageMeta with an id
// before loading this script, e.g.:
//
//   const pageMeta = {
//     id:       '7-1-issues-evaluation',   // ← must match PAGES[] in dashboard.html
//     badge:    'Paper 3 · Section A',
//     title:    'Issues Evaluation',
//     subtitle: 'AQA GCSE Geography'
//   };
//
// Page IDs in use:
//   '7-1-issues-evaluation'
//   '8-1-fieldwork'
//   '9-1-geographical-skills'
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// AUTH GUARD + SUPABASE SYNC
// The whole site requires login. A lightweight session cache is
// kept in localStorage (GCSE_SESSION_KEY) so this guard can redirect
// synchronously, before the Supabase SDK has even finished loading —
// that avoids a long flash of content for a logged-out visitor.
//
// Fill in SUPABASE_URL / SUPABASE_ANON_KEY once your Supabase project
// exists (see supabase/schema.sql + SETUP.md). The anon key is safe
// to ship in this file — it only grants what Row Level Security allows.
// ══════════════════════════════════════════════════════════════
const SUPABASE_URL = 'https://eaohjlyiotyqhvsizcpw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb2hqbHlpb3R5cWh2c2l6Y3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzUzMDksImV4cCI6MjA5ODc1MTMwOX0.lHF4OUiTT3G_fzlXvXI_4QMu48o6eEnq0hWw6K1uBAk';
const STUDENT_EMAIL_DOMAIN = 'students.local';

const GCSE_SESSION_KEY = 'gcse_session_v1';
const GCSE_QUEUE_KEY = 'gcse_sync_queue_v1';
// Root-absolute: topic pages now live at /subjects/<slug>/, so a relative
// link would resolve inside the subject directory.
const LOGIN_PAGE = '/login.html';
// Pages that must stay reachable without a session.
const GCSE_NO_GUARD_PAGES = ['login.html', 'teacher-signup.html'];

let _gcseSupabaseClient = null;
let _gcseProfile = null; // { role, username }

function _gcseCurrentPage() {
    return (location.pathname.split('/').pop() || 'index.html').toLowerCase();
}

function _gcseReadSession() {
    try {
        const raw = localStorage.getItem(GCSE_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}

function _gcseWriteSession(session) {
    try {
        if (session) localStorage.setItem(GCSE_SESSION_KEY, JSON.stringify(session));
        else localStorage.removeItem(GCSE_SESSION_KEY);
    } catch (e) {}
}

function _gcseRedirectToLogin() {
    location.replace(`${LOGIN_PAGE}?redirect=${encodeURIComponent(location.pathname + location.search)}`);
}

// Runs immediately (synchronously, at parse time) — this is the guard.
(function gcseAuthGuard() {
    if (GCSE_NO_GUARD_PAGES.includes(_gcseCurrentPage())) return;
    const session = _gcseReadSession();
    if (!session || !session.access_token) _gcseRedirectToLogin();
})();

function _gcseLoadSupabaseSdk() {
    return new Promise((resolve, reject) => {
        if (window.supabase) return resolve(window.supabase);
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
        s.onload = () => resolve(window.supabase);
        s.onerror = () => reject(new Error('Failed to load the Supabase SDK'));
        document.head.appendChild(s);
    });
}

async function gcseInitAuth() {
    if (GCSE_NO_GUARD_PAGES.includes(_gcseCurrentPage())) return;
    const cached = _gcseReadSession();
    if (!cached) return; // the synchronous guard above has already redirected

    let supabaseLib;
    try {
        supabaseLib = await _gcseLoadSupabaseSdk();
    } catch (e) {
        return; // offline or CDN unreachable — let the student keep working locally
    }
    _gcseSupabaseClient = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // Top-level `let` never attaches to window, but topic-guard.js and
    // gamification.js poll window._gcseSupabaseClient — mirror it explicitly.
    window._gcseSupabaseClient = _gcseSupabaseClient;

    const { data, error } = await _gcseSupabaseClient.auth.setSession({
        access_token: cached.access_token,
        refresh_token: cached.refresh_token,
    });
    if (error || !data || !data.session) {
        _gcseWriteSession(null);
        _gcseRedirectToLogin();
        return;
    }

    _gcseProfile = { role: cached.role, username: cached.username };
    window._gcseProfile = _gcseProfile; // same reason as window._gcseSupabaseClient above
    _gcseWriteSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        role: cached.role,
        username: cached.username,
    });

    _gcseSupabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') { _gcseWriteSession(null); return; }
        if (session) {
            _gcseWriteSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                role: cached.role,
                username: cached.username,
            });
        }
    });

    _gcseAccountBarWhenReady(); // cluster lives in account-cluster.js (loaded near the top of this file)
    await gcseFlushQueuedProgress();
    gcseHydrateFromServer();
    gcseRefreshFlowSettings();
    if (cached.role === 'student' && typeof gamificationRefreshStreak === 'function') {
        gamificationRefreshStreak(_gcseSupabaseClient);
    }
    if (cached.role === 'student' && typeof gamificationRefreshDailyReviseStats === 'function') {
        gamificationRefreshDailyReviseStats(_gcseSupabaseClient);
    }
    if (cached.role === 'student' && typeof gamificationRefreshReviewStats === 'function') {
        gamificationRefreshReviewStats(_gcseSupabaseClient);
    }
}

// ── Cross-device sync ──
// Local progress lives in localStorage, so a student moving from the school
// PC to a home device used to start from zero (while the dashboard, which
// reads the server, showed the truth). On topic pages we replay this page's
// server answer log into the local store — summaries alone can't rebuild
// the per-question UI. The log for one page is small and indexed
// (student+page+section).

// Per-SECTION reset tombstones — same idea as the per-page
// 'gcse_page_reset_' key below, but for one activity: written by
// _fullResetSection when a student resets a single section, so hydration
// doesn't resurrect answers from before that reset.
function _gcseSectionResetMap(pageId) {
    try { return JSON.parse(localStorage.getItem('gcse_section_reset_' + pageId) || '{}') || {}; } catch (e) { return {}; }
}
function _gcseTombstoneSection(pageId, section) {
    const map = _gcseSectionResetMap(pageId);
    map[section] = Date.now();
    try { localStorage.setItem('gcse_section_reset_' + pageId, JSON.stringify(map)); } catch (e) {}
}

// Pure merge: newest server event per (section, question_id), with any
// locally stored answer taking precedence (this device may be ahead).
function _gcseMergeServerAnswers(pageId, events) {
    const sectionResets = _gcseSectionResetMap(pageId);
    const bySection = {};
    (events || []).forEach(ev => {
        if (!ev.section || ev.question_id == null) return;
        const sectionResetTs = sectionResets[ev.section] || 0;
        if (sectionResetTs && new Date(ev.answered_at).getTime() <= sectionResetTs) return;
        (bySection[ev.section] = bySection[ev.section] || {})[ev.question_id] = ev.answer;
    });
    let changed = false;
    Object.keys(bySection).forEach(section => {
        const local = ProgressStore.getAnswers(pageId, section) || {};
        const merged = Object.assign({}, bySection[section], local);
        if (Object.keys(merged).length > Object.keys(local).length) {
            ProgressStore.setAnswersBulk(pageId, section, merged);
            changed = true;
        }
    });
    return changed;
}

async function gcseHydrateFromServer() {
    if (!_gcseSupabaseClient || !_gcseProfile || _gcseProfile.role !== 'student') return;
    if (!document.querySelector('.tab-bar')) return; // topic pages only
    const pageId = getPageId();

    // A local page reset tombstones everything up to that moment — only
    // server rows newer than the reset may hydrate back in.
    let resetTs = 0;
    try { resetTs = parseInt(localStorage.getItem('gcse_page_reset_' + pageId) || '0', 10) || 0; } catch (e) {}

    let events;
    try {
        let q = _gcseSupabaseClient.from('progress_events')
            .select('section, question_id, answer, answered_at')
            .eq('page_id', pageId)
            .order('answered_at', { ascending: true })
            .limit(2000);
        if (resetTs) q = q.gt('answered_at', new Date(resetTs).toISOString());
        const { data, error } = await q;
        if (error) return;
        events = data;
    } catch (e) { return; }

    // Matching also merges its summary rollup directly (older accounts may
    // have a summary but no per-pair answer log).
    let matchChanged = false;
    try {
        const { data: sums } = await _gcseSupabaseClient.from('progress_summary')
            .select('done, total, updated_at')
            .eq('page_id', pageId).eq('section', 'match');
        const matchResetTs = _gcseSectionResetMap(pageId)['match'] || 0;
        (sums || []).forEach(row => {
            if (resetTs && new Date(row.updated_at).getTime() <= resetTs) return;
            if (matchResetTs && new Date(row.updated_at).getTime() <= matchResetTs) return;
            const local = ProgressStore.get(pageId, 'match');
            if ((row.done || 0) > (local.done || 0)) {
                ProgressStore.save(pageId, 'match', row.done, Math.max(row.total || 0, local.total || 0));
                matchChanged = true;
            }
        });
    } catch (e) {}

    const answersChanged = _gcseMergeServerAnswers(pageId, events);
    if (!answersChanged && !matchChanged) return;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _gcseApplyHydration);
    } else {
        _gcseApplyHydration();
    }
}

// Rebuild the activities so hydrated answers show up, then persist the
// recounted summaries and refresh everything that displays progress.
function _gcseApplyHydration() {
    if (typeof rebuildAllActivities !== 'function') return;
    // Progress that merely ARRIVES from another device shouldn't fire
    // "activity complete" toasts — silence transitions while we rebuild.
    const wasInteractive = typeof _flowInteractive !== 'undefined' && _flowInteractive;
    if (wasInteractive) _flowInteractive = false;
    rebuildAllActivities();
    if (typeof syncDerivedSummaries === 'function') syncDerivedSummaries();
    if (typeof refreshLessonBar === 'function') refreshLessonBar();
    if (typeof updateRedoWrongButtons === 'function') updateRedoWrongButtons();
    if (typeof refreshActivityLocks === 'function') refreshActivityLocks();
    if (typeof _gamUpdateHud === 'function') _gamUpdateHud();
    // A topic that arrives from the server already complete shouldn't pop
    // confetti on this device.
    if (typeof gamificationMarkTopicCelebratedIfComplete === 'function') gamificationMarkTopicCelebratedIfComplete();
    if (wasInteractive) setTimeout(() => { _flowInteractive = true; }, 600);
}

// ══════════════════════════════════════════════════════════════
// ACCOUNT CLUSTER — gcseEscapeHtml / _gcseInjectAccountBarStyles /
// _gcseInjectAccountBar / gcseLogout moved to /account-cluster.js so the
// standalone pages (dashboard, index, badges, daily-revise, review-
// calendar, task, manage-account, subject indexes) can reuse the exact
// same cluster without loading all of script.js. Topic page HTML is never
// edited, so this file loads it dynamically instead of via a script tag.
// ══════════════════════════════════════════════════════════════
(function _gcseLoadAccountCluster() {
    if (typeof _gcseInjectAccountBar === 'function') return; // already present
    if (document.querySelector('script[src$="account-cluster.js"]')) return;
    const s = document.createElement('script');
    s.src = '/account-cluster.js';
    document.head.appendChild(s);
})();

// Auth resolves after a network round-trip, so account-cluster.js is
// almost certainly parsed by then — but "almost" isn't a guarantee, so
// retry briefly instead of assuming.
function _gcseAccountBarWhenReady(tries = 0) {
    if (typeof _gcseInjectAccountBar === 'function') { _gcseInjectAccountBar(); return; }
    if (tries < 50) setTimeout(() => _gcseAccountBarWhenReady(tries + 1), 100);
}

// ── Offline-safe sync of per-question answers to Supabase ──
function _gcseReadQueue() {
    try { return JSON.parse(localStorage.getItem(GCSE_QUEUE_KEY) || '[]'); } catch (e) { return []; }
}
function _gcseWriteQueue(queue) {
    try { localStorage.setItem(GCSE_QUEUE_KEY, JSON.stringify(queue.slice(-500))); } catch (e) {}
}

function _gcseSendOne(item) {
    return _gcseSupabaseClient.rpc('record_progress', {
        p_page_id: item.page_id,
        p_section: item.section,
        p_question_id: item.question_id,
        p_answer: item.answer,
        p_is_correct: item.is_correct,
        p_done: item.done,
        p_total: item.total,
    }).then(({ error }) => { if (error) throw error; });
}

// A rejection from record_progress() for a locked topic (see
// supabase/topic-access-schema.sql) is permanent — retrying the exact same
// write will never succeed, unlike a network/offline failure. Without this
// check, a rejected answer would sit in the retry queue forever, retried on
// every page load and 'online' event.
function _gcseIsPermanentRejection(error) {
    return !!(error && typeof error.message === 'string' && error.message.includes('locked'));
}

function _gcseQueueOrSend(item) {
    if (_gcseSupabaseClient && _gcseProfile) {
        _gcseSendOne(item).catch(err => {
            if (_gcseIsPermanentRejection(err)) return; // dropped — retrying can't help
            const q = _gcseReadQueue(); q.push(item); _gcseWriteQueue(q);
        });
    } else {
        const q = _gcseReadQueue(); q.push(item); _gcseWriteQueue(q);
    }
}

async function gcseFlushQueuedProgress() {
    if (!_gcseSupabaseClient) return;
    const queue = _gcseReadQueue();
    if (!queue.length) return;
    const remaining = [];
    for (const item of queue) {
        try { await _gcseSendOne(item); } catch (e) { if (!_gcseIsPermanentRejection(e)) remaining.push(item); }
    }
    _gcseWriteQueue(remaining);
}
window.addEventListener('online', gcseFlushQueuedProgress);

// A per-question answer `val` sometimes carries its own correctness
// (e.g. { chosen, correct, answer } from the quick-check quizzes) —
// reuse that when present instead of leaving is_correct unknown.
function _gcseExtractCorrectness(val) {
    if (val && typeof val === 'object' && typeof val.correct === 'boolean') return val.correct;
    return null;
}

gcseInitAuth();

// ══════════════════════════════════════════════════════════════
// TAB ID ADAPTER
// Supports both Geography tab IDs (tab-match, tab-misc, tab-tf, tab-exam)
// and Business tab IDs (tab-matching, tab-misconceptions, tab-truefalse, tab-exampractice)
// Add any future subject's tab IDs here.
// ══════════════════════════════════════════════════════════════
const TAB_ID_MAP = {
    // Geography           Business
    'tab-match':           'tab-matching',
    'tab-misc':            'tab-misconceptions',
    'tab-tf':              'tab-truefalse',
    'tab-exam':            'tab-exampractice',
    'tab-learn':           'tab-learn',
    'tab-mcq':             'tab-mcq',
    'tab-fib':             'tab-fib',
    'tab-examtips':        'tab-examtips',
    'tab-flashcards':      'tab-flashcards',
};

// Resolve a canonical tab ID to whatever actually exists in the DOM
function resolveTabId(canonicalId) {
    if (document.getElementById(canonicalId)) return canonicalId;
    const alt = TAB_ID_MAP[canonicalId];
    if (alt && document.getElementById(alt)) return alt;
    // Try reverse lookup (business → geography)
    const rev = Object.entries(TAB_ID_MAP).find(([, v]) => v === canonicalId);
    if (rev && document.getElementById(rev[0])) return rev[0];
    return canonicalId; // fallback
}

// ═══════════════════════════════════════════════════════════════
// STABLE QUESTION IDS
// Answers are persisted per question, but the 🔀 Randomise buttons
// shuffle the data arrays in place — so positional keys would pin old
// answers onto the wrong questions after a shuffle. Tag every question
// with its ORIGINAL index once, before anything can reorder it, and key
// all saves/restores by that. (Same key space as the old positional
// keys on an unshuffled page, so existing saved data still lines up.)
// ═══════════════════════════════════════════════════════════════
function tagStableQuestionIds() {
    if (typeof mcqData !== 'undefined') mcqData.forEach((q, i) => { if (q._qi == null) q._qi = i; });
    if (typeof tfData !== 'undefined') tfData.forEach((q, i) => { if (q._qi == null) q._qi = i; });
    if (typeof fibData !== 'undefined') fibData.forEach((f, i) => { if (f._fi == null) f._fi = i; });
    if (typeof flashcards !== 'undefined') flashcards.forEach((f, i) => { if (f._qi == null) f._qi = i; });
}
function _stableQi(arr, i) {
    const q = arr[i];
    return q && q._qi != null ? q._qi : i;
}

// ── TAB SWITCHING ──
function switchTab(id, btn) {
    // Sequential unlock for students: locked activities bounce with a hint
    const tabBtn = btn || document.querySelector(`.tab-btn[onclick*="'${id}'"]`);
    if (tabBtn && tabBtn.classList.contains('tab-locked')) {
        if (typeof showQuickToast === 'function') {
            showQuickToast('🔒 ' + (tabBtn.dataset.lockMsg || 'Finish the previous activity first'));
        }
        return;
    }
    const panel = document.getElementById('tab-' + id);
    if (!panel) return;
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    panel.classList.add('active');
    if (tabBtn) tabBtn.classList.add('active');
    if (id === 'learn' || id === 'examtips') showDoubleClickHint();
    // Hide all floating progress bars; the IntersectionObserver on the new
    // tab will re-show the right one if the user has scrolled past it
    document.querySelectorAll('.prog-float').forEach(f => f.classList.remove('visible'));
    // The HUD's "Next up" chip depends on which tab is open — refresh it
    if (typeof _gamUpdateHud === 'function') _gamUpdateHud();
    // Keep the activity in the URL (page.html#mcq) so every tab is
    // shareable and Back/Forward moves between activities.
    if (location.hash !== '#' + id) {
        try { history.pushState(null, '', '#' + id); } catch (e) {}
    }
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY DEEP LINKS — page.html#mcq, #matching, #truefalse …
// A teacher can share a link straight to one activity; the hash also
// updates as students move around, so Back/Forward walks through the
// activities they visited. (Static hosting can't route path suffixes
// like page.html/mcq — the #hash form works everywhere.)
// ═══════════════════════════════════════════════════════════════
const ACTIVITY_HASH_ALIASES = {
    match: 'matching', tf: 'truefalse', exam: 'exampractice',
    tips: 'examtips', misc: 'misconceptions', quiz: 'mcq', cards: 'flashcards',
};

function activityIdFromHash() {
    let h = (location.hash || '').replace(/^#\/?/, '').toLowerCase();
    if (!h) return null;
    h = ACTIVITY_HASH_ALIASES[h] || h;
    return document.getElementById('tab-' + h) ? h : null;
}

function applyHashActivity() {
    const id = activityIdFromHash();
    if (!id) return;
    const panel = document.getElementById('tab-' + id);
    if (panel && panel.classList.contains('active')) return; // already open
    switchTab(id, null);
}
window.addEventListener('hashchange', applyHashActivity);

// ═══════════════════════════════════════════════════════════════
// SITE NAV — one predictable cluster at the top of every topic page:
// [🏡 All Topics] ......... [📊 My Progress] [🔊] [Hi user] [Log out]
// The account part is appended later by _gcseInjectAccountBar() once
// auth resolves; the sound toggle comes from gamification.js.
// ═══════════════════════════════════════════════════════════════
function initSiteNav() {
    const header = document.querySelector('header');
    if (!header || document.getElementById('siteNav')) return;
    const nav = document.createElement('nav');
    nav.id = 'siteNav';
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Site');
    // Topic pages always know their subject (window.SUBJECT comes from the
    // directory's generated page-groups.js) — carry it on both links so the
    // student stays in this subject instead of falling back to business.
    const snSlug = (window.SUBJECT && window.SUBJECT.slug) || null;
    const snQ = snSlug ? '?subject=' + encodeURIComponent(snSlug) : '';
    nav.innerHTML = `
        <a class="sn-brand" href="${snSlug ? '/subjects/' + encodeURIComponent(snSlug) + '/index.html' : '/hub.html'}"><span aria-hidden="true">🏡</span> All Topics</a>
        <a class="sn-link" href="/dashboard.html${snQ}"><span aria-hidden="true">📊</span> <span class="sn-label">My Progress</span></a>`;
    if (typeof gamificationCreateSoundButton === 'function') {
        nav.appendChild(gamificationCreateSoundButton('sn-btn'));
    }
    header.insertBefore(nav, header.firstChild);
    // The nav replaces the old standalone "← Home" link (see style.css)
    document.body.classList.add('has-site-nav');
}

// ═══════════════════════════════════════════════════════════════
// TAB PROGRESS INDICATORS
// A mini ring (or gold ✓ when complete) on each tab button, kept
// live by updateLessonRing() — so the tab bar itself shows how much
// of every activity is done without opening the progress drawer.
// ═══════════════════════════════════════════════════════════════
const TAB_IDS_BY_SECTION = {
    learn: 'learn', mcq: 'mcq', match: 'matching', fib: 'fib',
    misc: 'misconceptions', tips: 'examtips', flashcards: 'flashcards',
    tf: 'truefalse', exam: 'exampractice',
};

function injectTabProgressStyles() {
    if (document.getElementById('tabProgressStyles')) return;
    const s = document.createElement('style');
    s.id = 'tabProgressStyles';
    s.textContent = `
        .tab-prog { display: inline-flex; align-items: center; justify-content: center; margin-left: 7px; vertical-align: -2px; }
        .tab-prog svg { display: block; }
        .tab-prog-done {
            display: inline-flex; align-items: center; justify-content: center;
            width: 15px; height: 15px; border-radius: 50%;
            background: var(--gold); color: var(--ink);
            font-size: 9.5px; font-weight: 700; line-height: 1;
        }
        @keyframes tabProgPop { 0% { transform: scale(.3); } 65% { transform: scale(1.35); } 100% { transform: scale(1); } }
        .tab-prog.pop { animation: tabProgPop .45s ease; }
    `;
    document.head.appendChild(s);
}

function _tabProgRingSvg(done, total) {
    const r = 5.5, circ = 2 * Math.PI * r;
    const pct = total > 0 ? Math.min(1, done / total) : 0;
    return `<svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true">
        <circle cx="7.5" cy="7.5" r="${r}" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2.4"/>
        <circle cx="7.5" cy="7.5" r="${r}" fill="none" stroke="var(--gold)" stroke-width="2.4" stroke-linecap="round"
            stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${(circ - pct * circ).toFixed(2)}"
            transform="rotate(-90 7.5 7.5)"/>
    </svg>`;
}

function updateTabIndicator(section, done, total) {
    const el = document.getElementById('tabProg_' + section);
    if (!el) return;
    const prev = el.dataset.state || '';
    let state;
    if (!total) {
        state = 'empty';
        el.style.display = 'none';
        el.innerHTML = '';
    } else if (done >= total) {
        state = 'done';
        el.style.display = '';
        el.innerHTML = '<span class="tab-prog-done">✓</span>';
        el.title = 'All done!';
    } else {
        state = 'part';
        el.style.display = '';
        el.innerHTML = _tabProgRingSvg(done, total);
        el.title = `${done} of ${total} done`;
    }
    el.dataset.state = state;
    if (state === 'done' && prev && prev !== 'done') {
        el.classList.remove('pop');
        void el.offsetWidth;
        el.classList.add('pop');
    }
}

// ═══════════════════════════════════════════════════════════════
// REDO WRONG ANSWERS (MCQ + True/False)
// A "🔁 redo the ones you got wrong" action: clears just the wrongly
// answered questions so the student retries them, keeping everything
// they got right. FIB/Matching are retry-until-correct by design, so
// only these two sections can hold a persisted wrong answer.
// ═══════════════════════════════════════════════════════════════
function _wrongAnswerKeys(section) {
    const data = section === 'mcq' ? (typeof mcqData !== 'undefined' ? mcqData : null)
               : section === 'tf' ? (typeof tfData !== 'undefined' ? tfData : null)
               : null;
    if (!data || typeof ProgressStore === 'undefined') return [];
    const answers = ProgressStore.getAnswers(getPageId(), section) || {};
    // Answers are keyed by each question's STABLE id (survives shuffles)
    const byKey = {};
    data.forEach((q, i) => { byKey[q._qi != null ? q._qi : i] = q; });
    return Object.keys(answers).filter(k => {
        const q = byKey[k];
        if (!q) return false;
        const v = answers[k];
        if (v !== null && typeof v === 'object') return v.correct === false;
        // legacy formats: bare option index (mcq) / bare boolean (tf)
        return section === 'mcq' ? v !== q.ans : v !== q.answer;
    });
}

function redoWrongAnswers(section) {
    const wrong = _wrongAnswerKeys(section);
    if (!wrong.length) return;
    const pid = getPageId();
    ProgressStore.removeAnswers(pid, section, wrong);
    if (section === 'mcq') {
        mcqScore = 0; mcqTotal = 0;
        const wrap = document.getElementById('mcqWrap');
        if (wrap) wrap.innerHTML = '';
        buildMCQ(true); // recounts from the remaining (correct) answers, only showing the ones left to retry
        ProgressStore.save(pid, 'mcq', mcqScore, mcqData.length);
    } else {
        tfScore = 0; tfTotal = 0;
        const wrap = document.getElementById('tfWrap');
        if (wrap) wrap.innerHTML = '';
        buildTF(true);
        ProgressStore.save(pid, 'tf', tfScore, tfData.length);
    }
    if (typeof _gamUpdateHud === 'function') _gamUpdateHud();
    updateRedoWrongButtons();
    // Focus mode shows one question at a time from _focusState[section].idx.
    // The wrap was just rebuilt with only the wrong questions, so that index
    // (likely left pointing at the last question of the FULL set) must be
    // reset to the first one here — otherwise _focusTick()'s clamp just pins
    // it to the last item of the new, shorter list instead of the first.
    if (_focusState[section]) {
        _focusState[section].idx = 0;
        _focusTick();
    }
    const sel = section === 'mcq' ? '#mcqWrap .q-block:not([data-answered])' : '#tfWrap .tf-card:not([data-answered])';
    const first = document.querySelector(sel);
    if (first && first.scrollIntoView) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function injectRedoWrongStyles() {
    if (document.getElementById('redoWrongStyles')) return;
    const s = document.createElement('style');
    s.id = 'redoWrongStyles';
    s.textContent = `
        .redo-wrong-btn { border-color: #b8860b !important; color: #8f6d19 !important; }
        .redo-notice {
            display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
            background: rgba(212, 168, 67, .14);
            border: 1.5px solid var(--gold);
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 16px;
            font-size: 13.5px;
            color: var(--ink);
        }
        .redo-notice-btn {
            font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 600;
            background: linear-gradient(135deg, #d4a843, #b8860b); color: #fff;
            border: none; border-radius: 8px; padding: 8px 14px; cursor: pointer;
            white-space: nowrap;
        }
        .redo-notice-btn:hover { filter: brightness(1.08); }
    `;
    document.head.appendChild(s);
}

function injectRedoWrongButtons() {
    injectRedoWrongStyles();
    [['mcq', 'resetMCQ'], ['tf', 'resetTF']].forEach(([section, resetName]) => {
        if (document.getElementById('redoWrongBtn_' + section)) return;
        const resetBtn = Array.from(document.querySelectorAll('.reset-btn'))
            .find(b => (b.getAttribute('onclick') || '').includes(resetName));
        if (!resetBtn) return;
        const redo = document.createElement('button');
        redo.className = 'reset-btn redo-wrong-btn';
        redo.id = 'redoWrongBtn_' + section;
        redo.style.display = 'none';
        redo.style.marginLeft = '0';
        redo.addEventListener('click', () => redoWrongAnswers(section));
        resetBtn.parentNode.insertBefore(redo, resetBtn);
    });
    updateRedoWrongButtons();
}

// Keeps the score-bar button and the "you got n wrong — redo them" banner
// in sync with the answer store. Cheap, so it's called from
// updateLessonRing on every save.
function updateRedoWrongButtons() {
    [['mcq', 'mcqWrap', 'quiz'], ['tf', 'tfWrap', 'True/False round']].forEach(([section, wrapId, label]) => {
        const btn = document.getElementById('redoWrongBtn_' + section);
        if (!btn) return;
        const data = section === 'mcq' ? (typeof mcqData !== 'undefined' ? mcqData : null)
                   : (typeof tfData !== 'undefined' ? tfData : null);
        if (!data) return;
        const wrong = _wrongAnswerKeys(section).length;
        btn.style.display = wrong ? '' : 'none';
        btn.innerHTML = `🔁 REDO ${wrong} WRONG`;

        // Nudge banner once the section is fully attempted but not perfect
        const answered = Object.keys(ProgressStore.getAnswers(getPageId(), section) || {}).length;
        let notice = document.getElementById('redoNotice_' + section);
        if (wrong > 0 && answered >= data.length) {
            const wrap = document.getElementById(wrapId);
            if (!notice && wrap) {
                notice = document.createElement('div');
                notice.className = 'redo-notice';
                notice.id = 'redoNotice_' + section;
                wrap.parentNode.insertBefore(notice, wrap);
            }
            if (notice) {
                notice.innerHTML = `<span>✨ So close! You got <strong>${wrong}</strong> wrong in this ${label} — redo just ${wrong === 1 ? 'that one' : 'those'} to master it.</span>
                    <button type="button" class="redo-notice-btn">🔁 Redo ${wrong} wrong answer${wrong === 1 ? '' : 's'}</button>`;
                notice.querySelector('.redo-notice-btn').addEventListener('click', () => redoWrongAnswers(section));
            }
        } else if (notice) {
            notice.remove();
        }
    });
}

function initTabProgress() {
    const bar = document.querySelector('.tab-bar');
    if (!bar) return;
    injectTabProgressStyles();
    Object.entries(TAB_IDS_BY_SECTION).forEach(([section, tabId]) => {
        const btn = bar.querySelector(`.tab-btn[onclick*="'${tabId}'"]`);
        if (!btn || document.getElementById('tabProg_' + section)) return;
        const span = document.createElement('span');
        span.className = 'tab-prog';
        span.id = 'tabProg_' + section;
        span.style.display = 'none';
        btn.appendChild(span);
    });
    // Initial paint from whatever is already stored for this page
    const saved = ProgressStore.getPage(getPageId());
    Object.keys(TAB_IDS_BY_SECTION).forEach(section => {
        const d = saved[section];
        if (d) updateTabIndicator(section, d.done || 0, d.total || 0);
    });
}

// ═══════════════════════════════════════════════════════════════
// GUIDED STUDENT FLOW
// Students (only) get a paced experience whose knobs the TEACHER sets
// per class in the dashboard's 🔒 Topic Access panel (see
// supabase/class-flow-settings.sql). Defaults, for a class that never
// touches the settings:
//   · activity_order 'open'  — students can jump between activity tabs
//     ('sequential' locks each tab until the previous one is fully
//     correct — done counts mastery)
//   · focus_mode true        — ONE question/card at a time, Back/Next
//   · pre_seconds 10         — reading time before a question can be
//     answered (early attempts get a "slow down" nudge)
//   · post_seconds 10        — pause after answering before Next
// Settings arrive via get_my_topic_settings() after login and are
// cached in localStorage so follow-up pages apply them instantly.
// Completing an activity fires a toast (and the celebration modal)
// with a one-click jump to the next activity.
// Teachers and previews always keep the classic everything-visible view.
// ═══════════════════════════════════════════════════════════════
const GCSE_FLOW_KEY = 'gcse_flow_settings_v1';
// activity_timers: per-section overrides, e.g. { learn: {pre:30, post:5} } —
// keyed by the section names in ACTIVITY_ORDER. A missing section, or a
// missing pre/post within one, falls back to the class-wide pre/post_seconds.
const GCSE_FLOW_DEFAULTS = { activity_order: 'open', focus_mode: true, pre_seconds: 10, post_seconds: 10, activity_timers: {} };

let _flowSettings = (() => {
    try {
        const cached = JSON.parse(localStorage.getItem(GCSE_FLOW_KEY) || 'null');
        if (cached) return Object.assign({}, GCSE_FLOW_DEFAULTS, cached);
    } catch (e) {}
    return Object.assign({}, GCSE_FLOW_DEFAULTS);
})();

// Per-section override lookup. Returns the override seconds for a field
// ('pre'/'post') of a given section, or null to fall back to class-wide.
// Only a real finite number counts — a missing key, a bad type, or NaN
// falls through; an explicit 0 is a valid override and must win over the
// fallback (hence the `!= null` checks in the getters below, not `|| `).
function _flowSectionSecs(section, field) {
    if (!section) return null;
    const t = _flowSettings.activity_timers;
    if (!t || typeof t !== 'object') return null;
    const o = t[section];
    if (!o || typeof o !== 'object') return null;
    const v = o[field];
    return (typeof v === 'number' && isFinite(v)) ? v : null;
}
function _flowPreMs(section)  {
    const ov = _flowSectionSecs(section, 'pre');
    const secs = ov != null ? ov : (+_flowSettings.pre_seconds  || 0);
    return Math.max(0, secs * 1000);
}
function _flowPostMs(section) {
    const ov = _flowSectionSecs(section, 'post');
    const secs = ov != null ? ov : (+_flowSettings.post_seconds || 0);
    return Math.max(0, secs * 1000);
}

// Fresh settings from the server (students only) — reconciles the page
// if the teacher's choices differ from what the cache applied.
async function gcseRefreshFlowSettings() {
    if (!_gcseSupabaseClient || !_gcseProfile || _gcseProfile.role !== 'student') return;
    let flow;
    try {
        // p_subject scopes the answer to THIS page's subject's class —
        // window.SUBJECT is set by the generated page-groups.js.
        const { data, error } = await _gcseSupabaseClient.rpc('get_my_topic_settings',
            { p_subject: (window.SUBJECT && window.SUBJECT.slug) || null });
        if (error) { console.error('gcseRefreshFlowSettings', error); return; }
        if (!data || !data.flow) return;
        flow = data.flow;
    } catch (e) { console.error('gcseRefreshFlowSettings', e); return; }
    _flowSettings = Object.assign({}, GCSE_FLOW_DEFAULTS, flow);
    try { localStorage.setItem(GCSE_FLOW_KEY, JSON.stringify(_flowSettings)); } catch (e) {}
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyFlowSettings);
    else applyFlowSettings();
}

function gcseIsStudent() {
    try {
        const s = JSON.parse(localStorage.getItem(GCSE_SESSION_KEY) || 'null');
        return !!s && s.role === 'student';
    } catch (e) { return false; }
}

const ACTIVITY_ORDER = [
    { section: 'learn',      tabId: 'learn',        icon: '📚', label: 'Key Learning' },
    { section: 'mcq',        tabId: 'mcq',          icon: '❓', label: 'MCQ Quiz' },
    { section: 'match',      tabId: 'matching',     icon: '🔗', label: 'Matching' },
    { section: 'fib',        tabId: 'fib',          icon: '✏️', label: 'Fill the Blanks' },
    { section: 'misc',       tabId: 'misconceptions', icon: '⚠️', label: 'Misconceptions' },
    { section: 'tips',       tabId: 'examtips',     icon: '🎯', label: 'Exam Tips' },
    { section: 'flashcards', tabId: 'flashcards',   icon: '🃏', label: 'Flashcards', optional: true },
    { section: 'tf',         tabId: 'truefalse',    icon: '✅', label: 'True / False' },
    { section: 'exam',       tabId: 'exampractice', icon: '📝', label: 'Exam Practice' },
];

function _activityTotal(section) {
    const pid = getPageId();
    const t = window.SECTION_TOTALS && window.SECTION_TOTALS[pid];
    if (t && t[section] != null) return t[section];
    return ProgressStore.get(pid, section).total || 0;
}

function sectionIsComplete(section) {
    const total = _activityTotal(section);
    if (!total) return true; // nothing to do on this page — never blocks
    return (ProgressStore.get(getPageId(), section).done || 0) >= total;
}

function nextActivityAfter(section) {
    const idx = ACTIVITY_ORDER.findIndex(a => a.section === section);
    if (idx === -1) return null;
    for (let i = idx + 1; i < ACTIVITY_ORDER.length; i++) {
        if (_activityTotal(ACTIVITY_ORDER[i].section) > 0) return ACTIVITY_ORDER[i];
    }
    return null;
}

function goToActivity(tabId) {
    const btn = document.querySelector(`.tab-btn[onclick*="'${tabId}'"]`);
    if (btn) {
        btn.click();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function injectFlowStyles() {
    if (document.getElementById('flowStyles')) return;
    const s = document.createElement('style');
    s.id = 'flowStyles';
    s.textContent = `
        .tab-btn.tab-locked { opacity: .4; cursor: not-allowed; }
        .tab-btn.tab-locked:hover { color: #999; }
        .tab-lock { margin-left: 6px; font-size: 11px; }
        .quick-toast {
            position: fixed; top: 64px; left: 50%; transform: translateX(-50%) translateY(-8px);
            z-index: 10005; background: var(--ink); color: var(--paper);
            font-family: 'DM Mono', monospace; font-size: 12.5px;
            padding: 10px 20px; border-radius: 99px; border: 1px solid var(--gold);
            box-shadow: 0 10px 28px rgba(0,0,0,.3);
            opacity: 0; transition: opacity .25s, transform .25s; pointer-events: none;
            max-width: 90vw; text-align: center;
        }
        .quick-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .flow-toast {
            position: fixed; top: 14px; left: 50%; transform: translateX(-50%) translateY(-12px);
            z-index: 495; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
            background: var(--card-bg); border: 2px solid var(--gold); border-radius: 14px;
            padding: 12px 16px; box-shadow: 0 14px 38px rgba(0,0,0,.3);
            font-size: 13.5px; color: var(--ink); max-width: min(560px, 92vw);
            opacity: 0; transition: opacity .3s, transform .3s;
        }
        .flow-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .flow-toast-xp { font-family: 'DM Mono', monospace; font-size: 11px; color: #8f6d19; font-weight: 600; }
        .flow-toast-next {
            font-family: 'DM Mono', monospace; font-size: 11.5px; font-weight: 600;
            background: linear-gradient(135deg, #d4a843, #b8860b); color: #fff;
            border: none; border-radius: 8px; padding: 9px 14px; cursor: pointer; white-space: nowrap;
        }
        .flow-toast-next:hover { filter: brightness(1.08); }
        .flow-toast-close { background: none; border: none; font-size: 18px; color: var(--mid); cursor: pointer; line-height: 1; padding: 2px 6px; }
        .focus-hidden { display: none !important; }
        .focus-nav {
            display: flex; align-items: center; justify-content: space-between; gap: 12px;
            margin: 18px 0 6px; padding: 12px 14px;
            background: var(--card-bg); border: 1.5px solid var(--border); border-radius: 12px;
        }
        .focus-nav button {
            font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 600;
            border-radius: 8px; padding: 10px 18px; cursor: pointer;
            border: 1.5px solid var(--border); background: var(--cream); color: var(--ink);
            transition: border-color .15s, background .15s;
        }
        .focus-nav button:hover:not(:disabled) { border-color: var(--accent); background: var(--card-bg); }
        .focus-nav button:disabled { opacity: .55; cursor: not-allowed; }
        .focus-nav .focus-next:not(:disabled) {
            background: linear-gradient(135deg, #d4a843, #b8860b); color: #fff; border-color: #b8860b;
        }
        .focus-count { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--mid); white-space: nowrap; }
    `;
    document.head.appendChild(s);
}

let _quickToastTimer = null;
function showQuickToast(msg) {
    injectFlowStyles();
    let el = document.getElementById('quickToast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'quickToast';
        el.className = 'quick-toast';
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(_quickToastTimer);
    _quickToastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ── Sequential tab locks (only when the teacher picked 'sequential') ──
function refreshActivityLocks() {
    const bar = document.querySelector('.tab-bar');
    if (!bar) return;
    if (!gcseIsStudent() || _flowSettings.activity_order !== 'sequential') {
        // Free navigation — make sure nothing stays locked from a
        // previously cached 'sequential' setting.
        bar.querySelectorAll('.tab-btn.tab-locked').forEach(btn => _setTabLocked(btn, false));
        return;
    }
    injectFlowStyles();
    let gateMsg = null; // set once we pass the first incomplete required activity
    ACTIVITY_ORDER.forEach(act => {
        const btn = bar.querySelector(`.tab-btn[onclick*="'${act.tabId}'"]`);
        if (!btn) return;
        _setTabLocked(btn, !!gateMsg && !act.optional, gateMsg);
        if (!act.optional && !gateMsg && _activityTotal(act.section) > 0 && !sectionIsComplete(act.section)) {
            gateMsg = `Finish ${act.icon} ${act.label} first`;
        }
    });
}

function _setTabLocked(btn, locked, msg) {
    btn.classList.toggle('tab-locked', locked);
    btn.setAttribute('aria-disabled', String(locked));
    if (locked) btn.dataset.lockMsg = msg || 'Finish the previous activity first';
    else delete btn.dataset.lockMsg;
    let lockIcon = btn.querySelector('.tab-lock');
    if (locked && !lockIcon) {
        lockIcon = document.createElement('span');
        lockIcon.className = 'tab-lock';
        lockIcon.setAttribute('aria-hidden', 'true');
        lockIcon.textContent = '🔒';
        btn.appendChild(lockIcon);
    } else if (!locked && lockIcon) {
        lockIcon.remove();
    }
}

// ── Section-complete notifications (with "next activity" jump) ──
let _flowInteractive = false;
const _sectionCompleteSeen = {};

function _trackSectionCompletion(section, done, total) {
    if (!total) return;
    const complete = done >= total;
    const was = _sectionCompleteSeen[section];
    _sectionCompleteSeen[section] = complete;
    if (_flowInteractive && complete && was === false) notifySectionComplete(section);
}

function notifySectionComplete(section) {
    const act = ACTIVITY_ORDER.find(a => a.section === section);
    // Give the shared celebration modal (fires ~400ms after the answer) a
    // moment — if it's up, its own Next button is the CTA.
    setTimeout(() => {
        if (document.getElementById('sharedCelebCard')) return;
        if (document.getElementById('matchCelebOverlay')) return; // match celebration has its own Next CTA
        if (document.getElementById('flowCompleteToast')) return;
        injectFlowStyles();
        const next = nextActivityAfter(section);
        const bonus = typeof GAMIFICATION_CATEGORY_BONUS !== 'undefined'
            ? ` <span class="flow-toast-xp">+${GAMIFICATION_CATEGORY_BONUS} XP bonus banked</span>` : '';
        const el = document.createElement('div');
        el.className = 'flow-toast';
        el.id = 'flowCompleteToast';
        el.innerHTML = `
            <span>🎉 ${act ? act.icon + ' ' + act.label : 'Activity'} complete!${bonus}</span>
            ${next ? `<button type="button" class="flow-toast-next">${next.icon} Next: ${next.label} →</button>` : ''}
            <button type="button" class="flow-toast-close" aria-label="Dismiss">×</button>`;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('show'));
        const kill = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 350); };
        const nb = el.querySelector('.flow-toast-next');
        if (nb) nb.addEventListener('click', () => { kill(); goToActivity(next.tabId); });
        el.querySelector('.flow-toast-close').addEventListener('click', kill);
        setTimeout(kill, 12000);
    }, 800);
}

// ── Focus mode: one card/question at a time + 20s Next cooldown ──
const FOCUS_SECTIONS = [
    { section: 'learn', wrapId: 'topicGrid', itemSel: '.topic-card', forceOpen: true,
      done: el => !!el.dataset.read, gate: 'Read + answer the Quick Check' },
    { section: 'mcq', wrapId: 'mcqWrap', itemSel: '.q-block',
      done: el => !!el.dataset.answered, gate: 'Answer to unlock' },
    { section: 'fib', wrapId: 'fibWrap', itemSel: '.fib-sentence',
      done: el => {
          const blanks = el.querySelectorAll('.blank-select');
          if (blanks.length) return Array.from(blanks).every(b => b.dataset.answered === 'correct');
          const inputs = el.querySelectorAll('.fib-input');
          return inputs.length > 0 && Array.from(inputs).every(i => i.disabled);
      }, gate: 'Fill every blank to unlock' },
    { section: 'misc', wrapId: 'miscList', itemSel: '.misc-card',
      done: el => !!el.dataset.read, gate: 'Answer the Quick Check' },
    { section: 'tips', wrapId: 'tipsGrid', itemSel: '.tip-card', forceOpen: true,
      done: el => !!el.dataset.read, gate: 'Read + answer the Quick Check' },
    { section: 'tf', wrapId: 'tfWrap', itemSel: '.tf-card',
      done: el => !!el.dataset.answered, gate: 'Answer to unlock' },
    { section: 'exam', wrapId: 'epList', itemSel: '.ep-card',
      // Written questions are done only once SELF-MARKED (not merely revealed);
      // MCQs are done when answered. Legacy reveal-only restores also set
      // epSelfMarked so old data isn't suddenly blocked.
      done: el => !!el.dataset.epSelfMarked || !!el.dataset.epAnswered, gate: 'Answer, check the scheme & mark yourself' },
];

const _focusState = {};
let _focusTimer = null;

function _focusItems(def) {
    const wrap = document.getElementById(def.wrapId);
    return wrap ? Array.from(wrap.querySelectorAll(def.itemSel)) : [];
}

function _focusCooldownRemaining(el, section) {
    const at = parseInt(el.dataset.gcseDoneAt || '0', 10);
    if (!at) return 0;
    return Math.max(0, _flowPostMs(section) - (Date.now() - at));
}

// Reading time left before the current item may be answered.
function _focusReadRemaining(el, section) {
    const pre = _flowPreMs(section);
    if (!pre) return 0;
    const at = parseInt(el.dataset.gcseShownAt || '0', 10);
    if (!at) return 0;
    return Math.max(0, pre - (Date.now() - at));
}

// Capture-phase guard: answering the current focus item during its
// reading time is blocked with a "slow down" nudge. Anything already
// answered (reviewing feedback, popups) is left alone.
function _focusPreGuard(e) {
    // Note: no global `_flowPreMs()` short-circuit here — reading time can
    // be off class-wide yet set for one section via an activity override, so
    // the per-item `_focusReadRemaining(cur, def.section)` below is what
    // actually decides whether this section is currently gated.
    if (!_flowSettings.focus_mode) return;
    if (!e.target || !e.target.closest) return;
    const control = e.target.closest('button, select, input');
    if (!control) return;
    for (let i = 0; i < FOCUS_SECTIONS.length; i++) {
        const def = FOCUS_SECTIONS[i];
        const st = _focusState[def.section];
        if (!st) continue;
        const wrap = document.getElementById(def.wrapId);
        if (!wrap || !wrap.contains(e.target)) continue;
        const cur = _focusItems(def)[st.idx];
        if (!cur || !cur.contains(e.target) || def.done(cur)) return;
        const remain = _focusReadRemaining(cur, def.section);
        if (remain > 0) {
            e.preventDefault();
            e.stopPropagation();
            showQuickToast(`🐢 Slow down — read it carefully! You can answer in ${Math.ceil(remain / 1000)}s`);
        }
        return;
    }
}

function _focusMove(def, delta) {
    const st = _focusState[def.section];
    if (!st) return;
    const items = _focusItems(def);
    const target = st.idx + delta;
    if (target < 0 || target >= items.length) return;
    const cur = items[st.idx];
    if (delta > 0 && cur && (!def.done(cur) || _focusCooldownRemaining(cur, def.section) > 0)) return;
    st.idx = target;
    _focusTick();
    const el = items[st.idx];
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function _focusTick() {
    FOCUS_SECTIONS.forEach(def => {
        const nav = document.getElementById('focusNav_' + def.section);
        const st = _focusState[def.section];
        if (!nav || !st) return;
        const items = _focusItems(def);
        if (!items.length) { nav.style.display = 'none'; return; }
        nav.style.display = '';
        if (st.idx >= items.length) st.idx = items.length - 1;

        items.forEach((el, i) => el.classList.toggle('focus-hidden', i !== st.idx));
        const cur = items[st.idx];
        if (def.forceOpen) cur.classList.add('open');
        // Reading timer starts the first time an item is shown
        if (!cur.dataset.gcseShownAt) cur.dataset.gcseShownAt = String(Date.now());

        // Cooldown bookkeeping: only answers given WHILE the item is on
        // screen start the after-answer timer — items restored from a
        // previous session (or rebuilt) don't make the student wait again.
        if (!def.done(cur)) {
            cur.dataset.gcseShownUndone = '1';
        } else if (!cur.dataset.gcseDoneAt) {
            cur.dataset.gcseDoneAt = cur.dataset.gcseShownUndone === '1' ? String(Date.now()) : '0';
        }

        nav.querySelector('.focus-count').textContent = `${st.idx + 1} / ${items.length}`;
        nav.querySelector('.focus-prev').disabled = st.idx === 0;
        const nextBtn = nav.querySelector('.focus-next');
        const last = st.idx === items.length - 1;
        if (!def.done(cur)) {
            nextBtn.disabled = true;
            const readRemain = cur.dataset.gcseShownUndone === '1' ? Math.ceil(_focusReadRemaining(cur, def.section) / 1000) : 0;
            nextBtn.textContent = readRemain > 0 ? `📖 Read carefully… ${readRemain}s` : '🔒 ' + def.gate;
        } else {
            const remain = Math.ceil(_focusCooldownRemaining(cur, def.section) / 1000);
            if (remain > 0) {
                nextBtn.disabled = true;
                nextBtn.textContent = `⏳ Next in ${remain}s`;
            } else if (last) {
                nextBtn.disabled = true;
                nextBtn.textContent = '✓ All done';
            } else {
                nextBtn.disabled = false;
                nextBtn.textContent = 'Next ›';
            }
        }
    });
}

let _focusGuardsInstalled = false;

function initFocusMode() {
    if (!gcseIsStudent() || !_flowSettings.focus_mode) return;
    injectFlowStyles();
    if (!_focusGuardsInstalled) {
        // Capture phase so the "read first" block runs before the answer
        // handlers on the wraps (mousedown also stops <select> opening).
        document.addEventListener('click', _focusPreGuard, true);
        document.addEventListener('mousedown', _focusPreGuard, true);
        _focusGuardsInstalled = true;
    }
    FOCUS_SECTIONS.forEach(def => {
        const wrap = document.getElementById(def.wrapId);
        if (!wrap || document.getElementById('focusNav_' + def.section)) return;
        const nav = document.createElement('div');
        nav.className = 'focus-nav';
        nav.id = 'focusNav_' + def.section;
        nav.innerHTML = `
            <button type="button" class="focus-prev">‹ Back</button>
            <span class="focus-count">– / –</span>
            <button type="button" class="focus-next" disabled>Next ›</button>`;
        wrap.parentNode.insertBefore(nav, wrap.nextSibling);
        nav.querySelector('.focus-prev').addEventListener('click', () => _focusMove(def, -1));
        nav.querySelector('.focus-next').addEventListener('click', () => _focusMove(def, +1));

        // Resume at the first unfinished item; anything already done never
        // waits out a cooldown.
        const items = _focusItems(def);
        items.forEach(el => { if (def.done(el)) el.dataset.gcseDoneAt = '0'; });
        let idx = items.findIndex(el => !def.done(el));
        if (idx === -1) idx = Math.max(0, items.length - 1);
        _focusState[def.section] = { idx };
    });
    if (!_focusTimer) _focusTimer = setInterval(_focusTick, 400);
    _focusTick();
}

// Teacher-configured cooldown for standalone "next step" buttons
// (e.g. Matching round 2)
function _applyButtonCooldown(btn, readyHtml, thing, section) {
    const ms = _flowPostMs(section);
    if (!ms) return;
    btn.disabled = true;
    const start = Date.now();
    const tick = setInterval(() => {
        if (btn.isConnected === false) { clearInterval(tick); return; }
        const remain = Math.ceil((ms - (Date.now() - start)) / 1000);
        if (remain > 0) {
            btn.innerHTML = `⏳ ${thing} unlocks in ${remain}s`;
        } else {
            clearInterval(tick);
            btn.disabled = false;
            btn.innerHTML = readyHtml;
        }
    }, 500);
    btn.innerHTML = `⏳ ${thing} unlocks in ${Math.round(ms / 1000)}s`;
}

// Tear focus mode back down (teacher switched the class to "all at once")
function teardownFocusMode() {
    if (_focusTimer) { clearInterval(_focusTimer); _focusTimer = null; }
    FOCUS_SECTIONS.forEach(def => {
        const nav = document.getElementById('focusNav_' + def.section);
        if (nav) nav.remove();
        _focusItems(def).forEach(el => el.classList.remove('focus-hidden'));
        delete _focusState[def.section];
    });
}

// Reconcile the page with the current _flowSettings (initial load uses the
// cached copy; gcseRefreshFlowSettings re-runs this if the server differs).
function applyFlowSettings() {
    refreshActivityLocks();
    if (gcseIsStudent() && _flowSettings.focus_mode) initFocusMode();
    else teardownFocusMode();
    updateExpandAllControlsVisibility();
    // Case study shows per-question in focus mode, once-per-run in the
    // scroll-through view — re-evaluate whenever the mode changes.
    if (typeof updateExamCaseStudyGrouping === 'function') updateExamCaseStudyGrouping();
}

function initStudentFlow() {
    applyFlowSettings();
    // Section states recorded during the initial build shouldn't toast —
    // only genuine transitions after the page settles.
    setTimeout(() => { _flowInteractive = true; }, 600);
}

// ── HEADER ACTIONS (Expand All + Grid/List toggle) ──
// Only meaningful in "All at once" mode (focus_mode false) — in "One at a
// time" (focus_mode true) these same two grids (Key Learning, Exam Tips)
// are ALSO in FOCUS_SECTIONS above, so they're already reduced to a single
// visible card with its own Back/Next nav; Grid View / Expand All Cards
// would just be redundant controls fighting that view. Hidden for students
// while focus_mode is on, shown again the moment it's off — kept in sync by
// updateExpandAllControlsVisibility(), called here AND from
// applyFlowSettings() (a teacher's setting can refresh mid-session).
function injectExpandAll(tabId, gridId, cardClass) {
    const tabPanel = document.getElementById(tabId);
    const grid = document.getElementById(gridId);
    if (!tabPanel || !grid) return;
    if (tabPanel.querySelector('.header-actions-wrap')) { updateExpandAllControlsVisibility(); return; }

    const title = tabPanel.querySelector('.section-title');
    const subTitle = tabPanel.querySelector('.section-sub');

    const headerWrap = document.createElement('div');
    headerWrap.className = 'header-actions-wrap';

    const textWrap = document.createElement('div');
    if (title) textWrap.appendChild(title);
    if (subTitle) { subTitle.style.marginBottom = '0'; textWrap.appendChild(subTitle); }

    const actionWrap = document.createElement('div');
    actionWrap.className = 'expand-all-controls';
    actionWrap.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:4px;';

    let isListView = true, isExpanded = true;
    grid.classList.add('list-view');
    grid.querySelectorAll('.' + cardClass).forEach(c => c.classList.add('open'));

    const layoutBtn = document.createElement('button');
    layoutBtn.className = 'fc-btn outline';
    layoutBtn.innerHTML = '🔠 Grid View';
    layoutBtn.addEventListener('click', () => {
        isListView = !isListView;
        layoutBtn.innerHTML = isListView ? '🔠 Grid View' : '🔲 List View';
        grid.classList.toggle('list-view', isListView);
    });

    const expandBtn = document.createElement('button');
    expandBtn.className = 'fc-btn outline';
    expandBtn.innerHTML = '📂 Collapse All Cards';
    expandBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        expandBtn.innerHTML = isExpanded ? '📂 Collapse All Cards' : '📂 Expand All Cards';
        grid.querySelectorAll('.' + cardClass).forEach(c => c.classList.toggle('open', isExpanded));
        window.getSelection().removeAllRanges();
    });

    actionWrap.appendChild(layoutBtn);
    actionWrap.appendChild(expandBtn);
    headerWrap.appendChild(textWrap);
    headerWrap.appendChild(actionWrap);
    tabPanel.insertBefore(headerWrap, grid);
    updateExpandAllControlsVisibility();
}

// Shows/hides every injected Grid View + Expand/Collapse All Cards control
// as a group, based on the CURRENT flow settings — teachers and previews
// (gcseIsStudent() false) always keep them, matching every other
// focus-mode gate in this file (see initFocusMode()'s identical guard).
function updateExpandAllControlsVisibility() {
    const hide = gcseIsStudent() && _flowSettings.focus_mode;
    document.querySelectorAll('.expand-all-controls').forEach(w => { w.style.display = hide ? 'none' : ''; });
}

// ── BUILD LEARN ──
let learnRead = 0, _learnRestoring = false;

function injectLearnProgressBar() {
    if (document.getElementById('learnBarWrap')) return;
    const grid = document.getElementById('topicGrid');
    if (!grid) return;
    const bar = createProgressBar('learn', '📚 Key Learning — Cards Read');
    grid.parentElement.insertBefore(bar, grid);
}

function markLearnRead(card, idx, silent = false) {
    if (card.dataset.read) return;
    card.dataset.read = '1';
    learnRead++;
    if (!silent) ProgressStore.save(getPageId(), 'learn', learnRead, topics.length);
    if (!silent) ProgressStore.saveAnswers(getPageId(), 'learn', idx, true);
    const badge = document.createElement('span');
    badge.className = 'read-badge';
    badge.textContent = '✓ Read';
    card.querySelector('h3').appendChild(badge);
    // Mark checkpoint as already answered
    const checkWrap = card.querySelector('.read-check-wrap');
    if (checkWrap) {
        checkWrap.dataset.answered = '1';
        checkWrap.querySelectorAll('.read-check-btn').forEach(b => b.disabled = true);
    }
    updateProgressBar('learn', learnRead, topics.length);
    if (!silent && learnRead >= topics.length && learnRead > 0) {
        setTimeout(() => showCelebration({
            title: 'Section Complete!',
            subtitle: "You've worked through all the key learning cards 📚",
            extra: `${topics.length} card${topics.length !== 1 ? 's' : ''} completed`,
            section: 'learn',
            onReset: () => {
                learnRead = 0;
                document.getElementById('topicGrid').innerHTML = '';
                const old = document.getElementById('learnBarWrap');
                if (old) old.remove();
                destroyProgressBar('learn');
                buildLearn();
            }
        }), 400);
    }
}

function renderReadCheck(card, checkData, onComplete, restoreData) {
    if (!checkData) { onComplete(); return; }
    const wrap = document.createElement('div');
    wrap.className = 'read-check-wrap';

    // Keep options in a stable order derived from a seeded shuffle
    // so the restore can match by text without re-randomising
    const shuffled = checkData.opts
        .map((o, i) => ({ text: o, correct: i === checkData.ans }))
        .sort(() => Math.random() - .5);

    const correctText = checkData.opts[checkData.ans];

    wrap.innerHTML = `
        <div class="read-check-label">🧠 Quick Check — answer to mark this card as read</div>
        <div class="read-check-q">${checkData.q}</div>
        <div class="read-check-opts">${shuffled.map(o =>
            `<button class="read-check-btn" data-correct="${o.correct}">${o.text}</button>`
        ).join('')}</div>
        <div class="read-check-feedback" style="display:none;"></div>`;

    const fb = wrap.querySelector('.read-check-feedback');

    function applyAnswer(wasCorrect, chosenText) {
        wrap.dataset.answered = '1';
        wrap.querySelectorAll('.read-check-btn').forEach(b => {
            b.disabled = true;
            if (b.dataset.correct === 'true') b.classList.add('rc-correct');
        });
        // Highlight the chosen button if it was wrong
        if (!wasCorrect) {
            wrap.querySelectorAll('.read-check-btn').forEach(b => {
                if (b.textContent === chosenText && b.dataset.correct !== 'true')
                    b.classList.add('rc-wrong');
            });
        }
        fb.style.display = 'block';
        if (wasCorrect) {
            fb.className = 'read-check-feedback rc-fb-ok';
            fb.textContent = '✓ Correct! ' + (checkData.explain || '');
        } else {
            fb.className = 'read-check-feedback rc-fb-no';
            fb.textContent = '✗ ' + (checkData.explain || 'See the correct answer highlighted above.');
        }
        // Show "already answered" label
        const lbl = wrap.querySelector('.read-check-label');
        if (lbl) lbl.textContent = '🧠 Quick Check — completed';
    }

    // ── Restore saved answer immediately (no click needed)
    if (restoreData) {
        applyAnswer(restoreData.correct, restoreData.chosen);
        return wrap;
    }

    // ── Wire up live clicks
    wrap.querySelectorAll('.read-check-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (wrap.dataset.answered) return;
            const wasCorrect = btn.dataset.correct === 'true';
            const chosenText = btn.textContent;
            applyAnswer(wasCorrect, chosenText);
            // Save chosen answer so restore knows what to show
            if (typeof onComplete._saveAnswer === 'function')
                onComplete._saveAnswer({ chosen: chosenText, correct: wasCorrect, answer: correctText });
            setTimeout(() => onComplete(), 600);
        });
    });
    return wrap;
}

function buildLearn() {
    const grid = document.getElementById('topicGrid');
    if (!grid) return;
    const savedReadCards = ProgressStore.getAnswers(getPageId(), 'learn');
    topics.forEach((t, ti) => {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.innerHTML = `<span class="tag">${t.tag}</span><h3>${t.title}</h3><span class="toggle-icon">+</span><div class="topic-content">${t.content}</div>`;

        // Append checkpoint inside topic-content after the content
        const contentDiv = card.querySelector('.topic-content');
        let check = null;
        if (t.readCheck) {
            const savedAnswer = (savedReadCards && savedReadCards[`ans_${ti}`]) || null;
            const onComplete = () => markLearnRead(card, ti);
            onComplete._saveAnswer = (ans) => ProgressStore.saveAnswers(getPageId(), 'learn', `ans_${ti}`, ans);
            check = renderReadCheck(card, t.readCheck, onComplete, savedAnswer);
        }
        if (check) contentDiv.appendChild(check);

        card.addEventListener('dblclick', () => {
            card.classList.toggle('open');
            window.getSelection().removeAllRanges();
        });
        grid.appendChild(card);

        // Restore saved read state (silent = don't re-save or re-trigger celebration)
        if (savedReadCards && savedReadCards[ti]) {
            markLearnRead(card, ti, true);
        }
    });
    injectLearnProgressBar();
    updateProgressBar('learn', learnRead, topics.length);
    ProgressStore.saveTotal(getPageId(), 'learn', topics.length);
    injectExpandAll(resolveTabId('tab-learn'), 'topicGrid', 'topic-card');
}


// ── BUILD MCQ ──
let mcqScore = 0, mcqTotal = 0;

function injectMCQProgressBar() {
    if (document.getElementById('mcqBarWrap')) return;
    const wrap = document.getElementById('mcqWrap');
    if (!wrap) return;
    const bar = createProgressBar('mcq', '❓ Multiple Choice — Progress');
    wrap.parentElement.insertBefore(bar, wrap);
}

function updateMCQProgress() {
    // Progress = CORRECT answers (mastery), not just attempts
    updateProgressBar('mcq', mcqScore, mcqData.length);
    if (mcqTotal > 0 && mcqTotal >= mcqData.length) {
        const perfect = mcqScore === mcqData.length;
        setTimeout(() => showCelebration({
            title: perfect ? 'Full Marks!' : 'Quiz Complete!',
            subtitle: perfect
                ? 'Every answer correct — excellent work! 🌟'
                : `You scored ${mcqScore} out of ${mcqData.length}`,
            extra: `${mcqData.length} question${mcqData.length !== 1 ? 's' : ''} answered`,
            section: 'mcq',
            onReset: resetMCQ
        }), 400);
    }
}

function applyMCQAnswered(block, qi, chosenOi) {
    block.dataset.answered = 1;
    block.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
    const fb = document.getElementById(`qfb-${qi}`);
    if (chosenOi === mcqData[qi].ans) {
        block.querySelectorAll('.opt-btn')[chosenOi].classList.add('correct');
        fb.textContent = '✓ Correct! ' + mcqData[qi].explain;
        fb.className = 'q-feedback show ok';
    } else {
        block.querySelectorAll('.opt-btn')[chosenOi].classList.add('wrong');
        block.querySelectorAll('.opt-btn')[mcqData[qi].ans].classList.add('correct');
        fb.textContent = '✗ ' + mcqData[qi].explain;
        fb.className = 'q-feedback show no';
    }
}

function buildMCQ(retryOnly = false) {
    const wrap = document.getElementById('mcqWrap');
    if (!wrap) return;
    const saved = ProgressStore.get(getPageId(), 'mcq');
    const savedAnswers = ProgressStore.getAnswers(getPageId(), 'mcq');

    mcqData.forEach((q, qi) => {
        // Restore previously answered state (old format: bare option index;
        // new format: { oi, correct } so the server log gets is_correct).
        // Keyed by the question's stable id so shuffles can't misalign it.
        const key = _stableQi(mcqData, qi);
        const hasSaved = savedAnswers && savedAnswers[key] !== undefined;

        if (hasSaved) {
            const v = savedAnswers[key];
            const chosenOi = (v !== null && typeof v === 'object') ? v.oi : v;
            mcqTotal++;
            if (chosenOi === mcqData[qi].ans) mcqScore++;
            // Retry mode only renders the questions still needing an
            // answer, so students aren't hunting through already-correct ones.
            if (retryOnly) return;
        }

        const block = document.createElement('div');
        block.className = 'q-block';
        block.innerHTML = `<div class="q-num">QUESTION ${qi + 1}</div><div class="q-text">${q.q}</div>
<div class="options">${q.opts.map((o, oi) => `<button class="opt-btn" data-qi="${qi}" data-oi="${oi}">${o}</button>`).join('')}</div>
<div class="q-feedback" id="qfb-${qi}"></div>`;
        wrap.appendChild(block);

        if (hasSaved) {
            const v = savedAnswers[key];
            const chosenOi = (v !== null && typeof v === 'object') ? v.oi : v;
            applyMCQAnswered(block, qi, chosenOi);
        }
    });

    document.getElementById('mcqScore').textContent = mcqScore;
    document.getElementById('mcqTotal').textContent = mcqTotal;

    wrap.addEventListener('click', e => {
        if (!e.target.classList.contains('opt-btn')) return;
        const qi = +e.target.dataset.qi, oi = +e.target.dataset.oi;
        const block = e.target.closest('.q-block');
        if (block.dataset.answered) return;
        applyMCQAnswered(block, qi, oi);
        mcqTotal++;
        if (oi === mcqData[qi].ans) mcqScore++;
        document.getElementById('mcqScore').textContent = mcqScore;
        document.getElementById('mcqTotal').textContent = mcqTotal;
        updateMCQProgress();
        ProgressStore.save(getPageId(), 'mcq', mcqScore, mcqData.length);
        ProgressStore.saveAnswers(getPageId(), 'mcq', _stableQi(mcqData, qi), { oi, correct: oi === mcqData[qi].ans });
    });
    injectMCQProgressBar();
    updateProgressBar('mcq', mcqScore, mcqData.length);
    ProgressStore.saveTotal(getPageId(), 'mcq', mcqData.length);
    // Migrate any legacy attempted-based summary to mastery counting
    if (mcqTotal > 0 && (ProgressStore.get(getPageId(), 'mcq').done || 0) !== mcqScore) {
        ProgressStore.save(getPageId(), 'mcq', mcqScore, mcqData.length);
    }
}
function resetMCQ() {
    mcqScore = 0; mcqTotal = 0;
    document.getElementById('mcqScore').textContent = 0;
    document.getElementById('mcqTotal').textContent = 0;
    document.getElementById('mcqWrap').innerHTML = '';
    destroyProgressBar('mcq');
    const old = document.getElementById('mcqBarWrap');
    if (old) old.remove();
    buildMCQ();
}

// ── BUILD MATCHING ──
let matchSelected = null, matchScore = 0, matchTotal = 0;
const matchMistakes = new Set();
let matchLocked = false;
let matchRound = 1;
let matchRoundScores = [0, 0];
let matchRoundSize = 0; // 0 = auto (split in half)

function getMatchRoundSize() {
    // If a custom size is set, use it; otherwise half the deck (rounded up)
    return matchRoundSize > 0 ? matchRoundSize : Math.ceil(matchData.length / 2);
}

function getMatchRoundData(round) {
    const size = getMatchRoundSize();
    return round === 1 ? matchData.slice(0, size) : matchData.slice(size);
}

// ── Find the score bar that contains matchScore — works regardless of tab ID
function getMatchScoreBar() {
    const el = document.getElementById('matchScore');
    return el ? el.closest('.score-bar') : null;
}

// ── Inject the round-size picker into the score bar (beside Randomise / Reset)
function injectMatchSizePicker() {
    if (document.getElementById('matchSizePicker')) return;
    const scoreBar = getMatchScoreBar();
    if (!scoreBar) return;
    const T = getSubjectTheme();

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;align-items:center;gap:6px;';

    const lbl = document.createElement('label');
    lbl.htmlFor = 'matchSizePicker';
    lbl.style.cssText = "font-family:'DM Mono',monospace;font-size:10px;color:var(--mid);letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;";
    lbl.textContent = 'Per round:';

    const sel = document.createElement('select');
    sel.id = 'matchSizePicker';
    sel.style.cssText = `
        appearance:none; -webkit-appearance:none;
        background:${T.surface2}; border:1.5px solid var(--border);
        border-radius:6px; padding:5px 10px;
        font-family:'DM Mono',monospace; font-size:11px; font-weight:600;
        color:${T.accentHl}; cursor:pointer; outline:none;
        transition:border-color .15s;
    `;
    sel.addEventListener('focus', () => sel.style.borderColor = T.accentHl);
    sel.addEventListener('blur',  () => sel.style.borderColor = 'var(--border)');

    // Build options: Auto, then 4 up to matchData.length-1 (always leave at least 1 in round 2)
    const autoOpt = document.createElement('option');
    autoOpt.value = '0';
    autoOpt.textContent = 'Auto';
    sel.appendChild(autoOpt);

    const max = matchData.length - 1; // at least 1 item must go to round 2
    for (let i = 4; i <= max; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = String(i);
        sel.appendChild(opt);
    }
    sel.value = '0';

    sel.addEventListener('change', () => {
        matchRoundSize = parseInt(sel.value, 10);
        rebuildMatchHeader(); // update bars to reflect new sizes
        resetMatch();
    });

    wrapper.appendChild(lbl);
    wrapper.appendChild(sel);

    // Put it before the first .reset-btn in the score bar
    const resetBtn = scoreBar.querySelector('.reset-btn');
    if (resetBtn) { scoreBar.insertBefore(wrapper, resetBtn); }
    else scoreBar.appendChild(wrapper);
}

// ── Rebuild header (on size change)
function rebuildMatchHeader() {
    const old = document.getElementById('matchRoundHeader');
    if (old) old.remove();
    injectMatchHeader();
}

// ── Inject the round header: overall bar + per-round bars
// Called AFTER buildMatchRound so matchLeft exists in the DOM
function injectMatchHeader() {
    if (document.getElementById('matchRoundHeader')) return;
    const T = getSubjectTheme();

    const r1count = getMatchRoundData(1).length;
    const r2count = getMatchRoundData(2).length;
    const total   = r1count + r2count;

    const header = document.createElement('div');
    header.id = 'matchRoundHeader';
    header.style.cssText = `
        background:${T.surface2};
        border:1px solid var(--border);
        border-radius:10px;
        padding:16px 20px;
        margin-bottom:16px;
        display:flex;
        flex-direction:column;
        gap:14px;
    `;
    header.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <span style="font-family:'DM Mono',monospace;font-size:11px;color:${T.accentHl};letter-spacing:.12em;text-transform:uppercase;">🃏 Matching — 2 Rounds</span>
            <span id="matchRoundLabel" style="font-family:'DM Mono',monospace;font-size:11px;color:var(--mid);letter-spacing:.08em;">Currently on Round 1 of 2</span>
        </div>
        <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--mid);letter-spacing:.06em;text-transform:uppercase;">Overall Progress</span>
                <span id="matchOverallLabel" style="font-family:'DM Mono',monospace;font-size:10px;color:var(--mid);">0 / ${total}</span>
            </div>
            <div style="background:var(--border);border-radius:99px;height:10px;overflow:hidden;">
                <div id="matchBarOverall" style="height:100%;width:0%;background:linear-gradient(90deg,${T.accent},${T.accentHl});border-radius:99px;transition:width .4s ease;"></div>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--mid);width:60px;flex-shrink:0;">Round 1</span>
                <div style="flex:1;background:var(--border);border-radius:99px;height:7px;overflow:hidden;">
                    <div id="matchBar1" style="height:100%;width:0%;background:linear-gradient(90deg,${T.accent},${T.accentHl});border-radius:99px;transition:width .4s ease;"></div>
                </div>
                <span id="matchBarLabel1" style="font-family:'DM Mono',monospace;font-size:10px;color:var(--mid);width:40px;text-align:right;">0/${r1count}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--mid);width:60px;flex-shrink:0;">Round 2</span>
                <div style="flex:1;background:var(--border);border-radius:99px;height:7px;overflow:hidden;">
                    <div id="matchBar2" style="height:100%;width:0%;background:linear-gradient(90deg,var(--teal),${T.accentHl});border-radius:99px;transition:width .4s ease;opacity:.35;"></div>
                </div>
                <span id="matchBarLabel2" style="font-family:'DM Mono',monospace;font-size:10px;color:var(--mid);width:40px;text-align:right;">0/${r2count}</span>
            </div>
        </div>
    `;

    // Insert directly before the match grid wrapper
    const matchLeft = document.getElementById('matchLeft');
    const matchGrid = matchLeft ? (matchLeft.closest('.match-grid') || matchLeft.parentElement) : null;
    if (matchGrid) {
        matchGrid.parentElement.insertBefore(header, matchGrid);
    } else {
        const scoreBar = getMatchScoreBar();
        if (scoreBar) scoreBar.after(header);
    }
}

// ── Update per-round bar + overall bar
function updateMatchProgress(round) {
    const r1data = getMatchRoundData(1);
    const r2data = getMatchRoundData(2);
    const data   = round === 1 ? r1data : r2data;
    const total  = data.length;
    const left   = document.getElementById('matchLeft');
    if (!left) return;

    const done = round === matchRound
        ? left.querySelectorAll('.matched-ok, .matched-eventual').length
        : (round < matchRound ? total : 0);
    const pct = total ? (done / total) * 100 : 0;

    const bar = document.getElementById(`matchBar${round}`);
    const lbl = document.getElementById(`matchBarLabel${round}`);
    if (bar) bar.style.width = pct + '%';
    if (lbl) lbl.textContent = `${done}/${total}`;

    // Overall bar
    const r1done = matchRound > 1 ? r1data.length : (round === 1 ? done : 0);
    const r2done = matchRound > 1 && round === 2 ? done : 0;
    const grandTotal = r1data.length + r2data.length;
    const grandDone  = r1done + r2done;
    const overallPct = grandTotal ? (grandDone / grandTotal) * 100 : 0;
    const overallBar = document.getElementById('matchBarOverall');
    const overallLbl = document.getElementById('matchOverallLabel');
    if (overallBar) overallBar.style.width = overallPct + '%';
    if (overallLbl) overallLbl.textContent = `${grandDone} / ${grandTotal}`;
}

// ── Celebration overlay
function showMatchCelebration() {
    const T = getSubjectTheme();
    if (!document.getElementById('matchCelebStyles')) {
        const s = document.createElement('style');
        s.id = 'matchCelebStyles';
        s.textContent = `
            @keyframes celebBounceIn {
                0%   { opacity:0; transform:translate(-50%,-50%) scale(.5) rotate(-4deg); }
                60%  { opacity:1; transform:translate(-50%,-50%) scale(1.08) rotate(2deg); }
                80%  { transform:translate(-50%,-50%) scale(.97) rotate(-1deg); }
                100% { transform:translate(-50%,-50%) scale(1) rotate(0deg); }
            }
            @keyframes celebBounceOut {
                0%   { opacity:1; transform:translate(-50%,-50%) scale(1); }
                100% { opacity:0; transform:translate(-50%,-50%) scale(.8); }
            }
            @keyframes celebFloat {
                0%,100% { transform:translateY(0); }
                50%     { transform:translateY(-8px); }
            }
            @keyframes confettiFall {
                0%   { transform:translateY(-20px) rotate(0deg); opacity:1; }
                100% { transform:translateY(100vh) rotate(720deg); opacity:0; }
            }
        `;
        document.head.appendChild(s);
    }

    const colours = ['#52b788','#e9c46a','#0077b6','#e76f51','#d8ede5'];
    for (let i = 0; i < 65; i++) {
        const piece = document.createElement('div');
        piece.style.cssText = `
            position:fixed; top:0;
            left:${Math.random() * 100}vw;
            width:${6 + Math.random() * 8}px; height:${6 + Math.random() * 8}px;
            background:${colours[Math.floor(Math.random() * colours.length)]};
            border-radius:${Math.random() > .5 ? '50%' : '2px'};
            z-index:10001; pointer-events:none;
            animation:confettiFall ${1.5 + Math.random() * 2}s ${Math.random() * .8}s ease-in forwards;
        `;
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 4000);
    }

    const overlay = document.createElement('div');
    overlay.id = 'matchCelebOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;backdrop-filter:blur(3px);';

    const card = document.createElement('div');
    card.style.cssText = `
        position:fixed; top:50%; left:50%;
        transform:translate(-50%,-50%);
        background:${T.overlayCard}; border:2px solid ${T.accentHl};
        border-radius:16px; padding:36px 40px; text-align:center;
        z-index:10002; min-width:280px; max-width:90vw;
        box-shadow:0 24px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(82,183,136,.2);
        animation:celebBounceIn .55s cubic-bezier(.34,1.56,.64,1) forwards;
    `;

    const perfect = matchMistakes.size === 0;
    const r1 = getMatchRoundData(1).length;
    const r2 = getMatchRoundData(2).length;
    // Guide the student onward — same CTA the shared celebration modal has.
    const next = typeof nextActivityAfter === 'function' ? nextActivityAfter('match') : null;
    card.innerHTML = `
        <div style="font-size:52px;margin-bottom:12px;animation:celebFloat 1.8s ease-in-out infinite;">🎉</div>
        <div style="font-family:'Merriweather',serif;font-size:22px;font-weight:700;color:${T.accentHl};margin-bottom:8px;">
            ${perfect ? 'Perfect Score!' : 'All Matched!'}
        </div>
        <div style="font-family:'DM Sans',sans-serif;font-size:14px;color:${T.textDim};margin-bottom:6px;line-height:1.6;">
            ${perfect
                ? 'You matched every pair first time — amazing work! 🌟'
                : `You got there! ${matchMistakes.size} pair${matchMistakes.size>1?'s':''} needed a second try.`}
        </div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;color:var(--mid);margin-bottom:22px;">
            ${r1} pairs · Round 1 &nbsp;+&nbsp; ${r2} pairs · Round 2
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            ${next ? `<button id="celebNext" style="background:linear-gradient(135deg,#d4a843,#b8860b);color:#fff;border:none;border-radius:8px;padding:10px 22px;font-family:'DM Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.06em;">${next.icon} Next: ${next.label} →</button>` : ''}
            <button id="celebDismiss" style="background:${next ? 'transparent' : T.accent};color:${next ? T.textDim : T.accentText};border:${next ? '1.5px solid var(--border)' : 'none'};border-radius:8px;padding:10px 22px;font-family:'DM Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.06em;">✓ Done</button>
            <button id="celebReset" style="background:transparent;color:${T.textDim};border:1.5px solid var(--border);border-radius:8px;padding:10px 22px;font-family:'DM Mono',monospace;font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.06em;">🔄 Play Again</button>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(card);

    const dismiss = () => {
        card.style.animation = 'celebBounceOut .3s ease forwards';
        overlay.style.transition = 'opacity .3s'; overlay.style.opacity = '0';
        setTimeout(() => { card.remove(); overlay.remove(); }, 320);
    };
    const nextBtn = document.getElementById('celebNext');
    if (nextBtn) nextBtn.addEventListener('click', () => { dismiss(); setTimeout(() => goToActivity(next.tabId), 340); });
    document.getElementById('celebDismiss').addEventListener('click', dismiss);
    // Play Again is a real reset — with per-pair persistence, a bare board
    // rebuild would just restore the finished state.
    document.getElementById('celebReset').addEventListener('click', () => { dismiss(); setTimeout(() => _fullResetSection('match'), 340); });
    overlay.addEventListener('click', dismiss);
}

function buildMatchRound(round) {
    const left  = document.getElementById('matchLeft');
    const right = document.getElementById('matchRight');
    if (!left || !right) return;

    matchSelected = null; matchLocked = false;
    left.innerHTML = ''; right.innerHTML = '';

    const old = document.getElementById('matchNextRoundBtn');
    if (old) old.remove();

    const data = getMatchRoundData(round);
    const shuffled = [...data].sort(() => Math.random() - .5);

    const label = document.getElementById('matchRoundLabel');
    if (label) label.textContent = `Currently on Round ${round} of 2`;

    if (round === 2) {
        const bar2 = document.getElementById('matchBar2');
        if (bar2) bar2.style.opacity = '1';
    }

    updateMatchProgress(1);
    updateMatchProgress(2);

    matchTotal = matchData.length;
    document.getElementById('matchTotal').textContent = matchTotal;

    data.forEach(m => {
        const el = document.createElement('div');
        el.className = 'match-item'; el.textContent = m.term;
        el.dataset.key = m.term; el.dataset.side = 'left';
        left.appendChild(el);
    });
    shuffled.forEach(m => {
        const el = document.createElement('div');
        el.className = 'match-item'; el.textContent = m.def;
        el.dataset.key = m.term; el.dataset.side = 'right';
        right.appendChild(el);
    });

    // Restore pairs already matched (saved per pair as pair_<term> the moment
    // they're solved) — work from an earlier session stays done, so a student
    // mid-round-2 never has to replay round 1.
    const matched = _matchSavedKeys();
    if (matched.size) {
        [left, right].forEach(col => col.querySelectorAll('.match-item').forEach(el => {
            if (matched.has(el.dataset.key)) el.classList.add('matched-ok');
        }));
    }

    left.addEventListener('click', handleMatch);
    right.addEventListener('click', handleMatch);

    // Clear any leftover lines from a previous round, then (re)install the
    // redraw hooks and draw for whatever is matched now (restored pairs
    // included — the drawing derives from the classes set above).
    _matchClearLines();
    _matchRedrawLines();
    updateMatchProgress(1);
    updateMatchProgress(2);
}

// Terms whose pair is already solved, from the per-pair answer log.
function _matchSavedKeys() {
    const saved = ProgressStore.getAnswers(getPageId(), 'match') || {};
    const keys = new Set();
    Object.keys(saved).forEach(k => { if (k.indexOf('pair_') === 0) keys.add(k.slice(5)); });
    return keys;
}

function buildMatch() {
    matchRoundScores = [0, 0];
    // Resume where they left off: round 1 until every round-1 pair is solved,
    // then round 2; a fully solved deck shows the finished round-2 board with
    // the "next activity" bar instead of replaying anything.
    const matched = _matchSavedKeys();
    matchScore = matchData.filter(m => matched.has(m.term)).length;
    matchRound = getMatchRoundData(1).every(m => matched.has(m.term)) && getMatchRoundData(2).length ? 2 : 1;
    document.getElementById('matchScore').textContent = matchScore;
    buildMatchRound(matchRound);
    injectMatchSizePicker();
    injectMatchHeader();
    ProgressStore.saveTotal(getPageId(), 'match', matchData.length);
    // The header is injected after the round build, so paint it now.
    const label = document.getElementById('matchRoundLabel');
    if (label) label.textContent = `Currently on Round ${matchRound} of 2`;
    if (matchRound === 2) {
        const bar2 = document.getElementById('matchBar2');
        if (bar2) bar2.style.opacity = '1';
    }
    updateMatchProgress(1);
    updateMatchProgress(2);
    if (matchData.length && matchScore >= matchData.length) _matchShowCompleteBar();
}

function handleMatch(e) {
    if (matchLocked) return;
    const item = e.target.closest('.match-item');
    if (!item || item.classList.contains('matched-ok') || item.classList.contains('matched-eventual')) return;
    if (!matchSelected) {
        document.querySelectorAll('.match-item.selected').forEach(x => x.classList.remove('selected'));
        item.classList.add('selected'); matchSelected = item;
    } else {
        if (matchSelected === item) { item.classList.remove('selected'); matchSelected = null; return; }
        if (matchSelected.dataset.side === item.dataset.side) {
            matchSelected.classList.remove('selected'); matchSelected = item; item.classList.add('selected'); return;
        }
        const a = matchSelected, b = item;
        a.classList.remove('selected'); b.classList.remove('selected'); matchSelected = null;
        if (a.dataset.key === b.dataset.key) {
            const cls = matchMistakes.has(a.dataset.key) ? 'matched-eventual' : 'matched-ok';
            a.classList.add(cls); b.classList.add(cls);
            _matchRedrawLines(); // draw the connecting line for this solved pair
            matchScore++; matchRoundScores[matchRound - 1]++;
            document.getElementById('matchScore').textContent = matchScore;
            updateMatchProgress(matchRound);
            // The match game restarts from 0 every visit, but the recorded
            // summary is "best ever" — otherwise the first pair of a new
            // session would overwrite a finished 13/13 with 1/13 (locally
            // AND on the server, since record_progress overwrites done).
            const prevMatchDone = ProgressStore.get(getPageId(), 'match').done || 0;
            const bestMatchDone = Math.min(Math.max(matchScore, prevMatchDone), matchData.length);
            ProgressStore.save(getPageId(), 'match', bestMatchDone, matchData.length);
            // Mirror the pair to the server as a per-answer event (keyed by
            // the term text, which is stable across shuffles) — without this
            // the teacher dashboard always showed matching as 0, because
            // only saveAnswers() reaches progress_summary. saveAnswers also
            // fires the gamification hook, so no manual call is needed here.
            ProgressStore.saveAnswers(getPageId(), 'match', 'pair_' + a.dataset.key, { correct: true });
            const left = document.getElementById('matchLeft');
            const total = left.querySelectorAll('.match-item').length;
            const done  = left.querySelectorAll('.matched-ok, .matched-eventual').length;
            if (done === total) onRoundComplete();
        } else {
            matchLocked = true;
            matchMistakes.add(a.dataset.key); matchMistakes.add(b.dataset.key);
            a.classList.add('matched-no'); b.classList.add('matched-no');
            if (typeof gamificationPlaySound === 'function') gamificationPlaySound('wrong');
            setTimeout(() => { a.classList.remove('matched-no'); b.classList.remove('matched-no'); matchLocked = false; }, 700);
        }
    }
}

function onRoundComplete() {
    if (matchRound === 1) {
        updateMatchProgress(1);
        const left = document.getElementById('matchLeft');
        const grid = left.closest('.match-grid') || left.parentElement;
        const btn = document.createElement('button');
        btn.id = 'matchNextRoundBtn';
        btn.className = 'fc-btn';
        btn.style.cssText = 'margin-top:16px;width:100%;font-size:14px;padding:14px;';
        btn.innerHTML = '✅ Round 1 complete — Start Round 2 →';
        btn.addEventListener('click', () => {
            matchRound = 2;
            matchMistakes.clear();
            buildMatchRound(2);
        });
        grid.parentElement.insertBefore(btn, grid.nextSibling);
        // Students get the same 20s "no blitzing" cooldown as everywhere else
        if (typeof gcseIsStudent === 'function' && gcseIsStudent()) {
            _applyButtonCooldown(btn, '✅ Round 1 complete — Start Round 2 →', 'Round 2', 'match');
        }
    } else {
        updateMatchProgress(2);
        _matchShowCompleteBar();
        setTimeout(showMatchCelebration, 400);
    }
}

// Persistent "you're done" strip under the board — the celebration modal is
// transient, this stays so the student always has the route onward.
function _matchShowCompleteBar() {
    if (document.getElementById('matchCompleteBar')) return;
    const left = document.getElementById('matchLeft');
    if (!left) return;
    const grid = left.closest('.match-grid') || left.parentElement;
    injectFlowStyles(); // .flow-toast-next
    const next = typeof nextActivityAfter === 'function' ? nextActivityAfter('match') : null;
    const bar = document.createElement('div');
    bar.id = 'matchCompleteBar';
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:16px;padding:14px 18px;border:1.5px solid var(--gold);border-radius:10px;background:rgba(212,168,67,.12);font-size:14px;';
    bar.innerHTML = `<span>✅ <strong>Matching complete — both rounds done!</strong>${next ? ' Carry on to the next activity.' : ''}</span>
        ${next ? `<button type="button" class="flow-toast-next">${next.icon} Next: ${next.label} →</button>` : ''}`;
    grid.parentElement.insertBefore(bar, grid.nextSibling);
    const nb = bar.querySelector('.flow-toast-next');
    if (nb) nb.addEventListener('click', () => goToActivity(next.tabId));
}

// Rebuild the board from saved state (round + solved pairs re-derived) —
// does NOT clear progress; _fullResetSection('match') is the real reset.
function resetMatch() {
    matchSelected = null; matchLocked = false;
    matchMistakes.clear();
    document.getElementById('matchLeft').innerHTML = '';
    document.getElementById('matchRight').innerHTML = '';
    const old = document.getElementById('matchNextRoundBtn');
    if (old) old.remove();
    const doneBar = document.getElementById('matchCompleteBar');
    if (doneBar) doneBar.remove();
    rebuildMatchHeader();
    buildMatch();
}

// ── Match connecting lines ────────────────────────────────────
// SVG overlay on .match-grid that draws a line between the two halves of
// every solved pair. Source of truth is the DOM: items carrying
// .matched-ok / .matched-eventual plus their data-key — no separate
// bookkeeping array that could drift. Lines are cleared and fully
// recomputed on every redraw (cheap: ≤ ~15 lines).

const _MATCH_SVG_NS = 'http://www.w3.org/2000/svg';
let _matchLinesRO = null;          // ResizeObserver on the grid
let _matchLinesGlobalHooks = false; // window resize + font-load hooks bound once
let _matchLinesRafId = 0;          // rAF throttle for redraw storms

// Pure geometry — unit-testable. Given the bounding rects of a matched
// left item, its right partner, and the grid container, return the line
// endpoints in grid-local coordinates: right edge of the left item to
// left edge of the right item, each vertically centred.
function _matchLineCoords(leftRect, rightRect, gridRect) {
    return {
        x1: leftRect.right - gridRect.left,
        y1: leftRect.top + leftRect.height / 2 - gridRect.top,
        x2: rightRect.left - gridRect.left,
        y2: rightRect.top + rightRect.height / 2 - gridRect.top
    };
}

function _matchLinesGrid() {
    const left = document.getElementById('matchLeft');
    return left ? (left.closest('.match-grid') || left.parentElement) : null;
}

function _matchLinesSvg(grid, create) {
    let svg = grid.querySelector(':scope > .match-lines-svg');
    if (!svg && create) {
        svg = document.createElementNS(_MATCH_SVG_NS, 'svg');
        svg.setAttribute('class', 'match-lines-svg');
        svg.setAttribute('aria-hidden', 'true');
        grid.appendChild(svg);
    }
    return svg;
}

function _matchClearLines() {
    const grid = _matchLinesGrid();
    if (!grid) return;
    const svg = _matchLinesSvg(grid, false);
    if (svg) while (svg.firstChild) svg.removeChild(svg.firstChild);
}

function _matchScheduleLinesRedraw() {
    if (_matchLinesRafId) return;
    _matchLinesRafId = requestAnimationFrame(() => {
        _matchLinesRafId = 0;
        _matchRedrawLines();
    });
}

function _matchInitLinesObservers(grid) {
    if (!_matchLinesGlobalHooks) {
        _matchLinesGlobalHooks = true;
        window.addEventListener('resize', _matchScheduleLinesRedraw);
        // Web-font swap changes item heights after first paint
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(_matchScheduleLinesRedraw).catch(() => {});
        }
    }
    // ResizeObserver also catches column reflow and content above the grid
    // changing the grid's own box (e.g. drawer/header height changes).
    if (typeof ResizeObserver !== 'undefined') {
        if (!_matchLinesRO) _matchLinesRO = new ResizeObserver(_matchScheduleLinesRedraw);
        _matchLinesRO.observe(grid); // idempotent for an already-observed node
    }
}

// Recompute every line from current DOM state. Called after each successful
// match, after every round build (buildMatchRound), and on resize/reflow.
function _matchRedrawLines() {
    const grid  = _matchLinesGrid();
    const left  = document.getElementById('matchLeft');
    const right = document.getElementById('matchRight');
    if (!grid || !left || !right) return;

    const svg = _matchLinesSvg(grid, true);
    _matchInitLinesObservers(grid);

    // Remember which pairs already have a line so only NEW lines animate
    // (resize redraws must not re-trigger the draw-in effect).
    const prevKeys = new Set();
    svg.querySelectorAll('line').forEach(l => prevKeys.add(l.getAttribute('data-key')));
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // One-column layout (matches the 640px .match-grid media query in
    // style.css): items stack vertically, lines are meaningless — skip.
    // The computed template has one track when collapsed ("none" when the
    // section is hidden), two when side-by-side.
    const cols = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
    if (cols < 2) return;

    const gridRect = grid.getBoundingClientRect();
    if (!gridRect.width || !gridRect.height) return; // hidden — RO redraws on reveal

    const rightByKey = new Map();
    right.querySelectorAll('.match-item.matched-ok, .match-item.matched-eventual')
        .forEach(el => rightByKey.set(el.dataset.key, el));

    left.querySelectorAll('.match-item.matched-ok, .match-item.matched-eventual')
        .forEach(li => {
            const key = li.dataset.key;
            const ri  = rightByKey.get(key);
            if (!ri) return; // half-matched key (shouldn't happen) — skip gracefully
            const c = _matchLineCoords(li.getBoundingClientRect(), ri.getBoundingClientRect(), gridRect);
            const line = document.createElementNS(_MATCH_SVG_NS, 'line');
            line.setAttribute('x1', c.x1); line.setAttribute('y1', c.y1);
            line.setAttribute('x2', c.x2); line.setAttribute('y2', c.y2);
            line.setAttribute('pathLength', '1'); // normalise for the dash draw-in
            line.setAttribute('data-key', key);
            const eventual = li.classList.contains('matched-eventual') || ri.classList.contains('matched-eventual');
            let lineCls = eventual ? 'match-lines-eventual' : 'match-lines-ok';
            if (!prevKeys.has(key)) lineCls += ' match-lines-anim';
            line.setAttribute('class', lineCls);
            svg.appendChild(line);
        });
}


// ══════════════════════════════════════════════════════════════
// SUBJECT THEME ADAPTER
// Returns semantic colour tokens that work for both the
// dark Geography palette and the light Business palette.
// All injected styles (celebration, drawer, progress bars,
// read-check) reference these tokens so they match every site.
// ══════════════════════════════════════════════════════════════
function getSubjectTheme() {
    const root = getComputedStyle(document.documentElement);
    // Detect subject by checking which palette variables exist
    // Business has --paper and --ink; Geography has --bg and --surface
    const hasPaper = root.getPropertyValue('--paper').trim() !== '';
    const hasAccent2 = root.getPropertyValue('--accent2').trim() !== '';

    if (hasPaper && !hasAccent2) {
        // ── Business (light parchment theme) ──
        return {
            bg:          'var(--paper)',
            surface:     'var(--card-bg)',
            surface2:    'var(--cream)',
            border:      'var(--border)',
            text:        'var(--ink)',
            textDim:     'var(--mid)',
            accent:      'var(--accent)',
            accentHl:    'var(--gold)',
            accentText:  '#fff',
            success:     'var(--success)',
            successBg:   '#d4edda',
            successText: 'var(--success)',
            wrong:       'var(--wrong)',
            wrongBg:     '#fde8e5',
            wrongText:   'var(--wrong)',
            headerBg:    'var(--ink)',
            headerText:  'var(--paper)',
            pillBg:      'rgba(122,92,158,.12)',
            pillBorder:  'rgba(122,92,158,.3)',
            serif:       "'Playfair Display', serif",
            mono:        "'DM Mono', monospace",
            overlayCard: 'var(--card-bg)',
            confetti:    ['#7a5c9e','#d4a843','#1a6b6b','#c84b31','#f5f0e8'],
        };
    } else {
        // ── Geography (dark green theme) ──
        return {
            bg:          'var(--bg)',
            surface:     'var(--surface)',
            surface2:    'var(--surface2)',
            border:      'var(--border)',
            text:        'var(--text)',
            textDim:     'var(--text-dim)',
            accent:      'var(--accent)',
            accentHl:    'var(--accent2)',
            accentText:  'var(--bg)',
            success:     'var(--success)',
            successBg:   'rgba(22,163,74,.2)',
            successText: '#86efac',
            wrong:       'var(--wrong)',
            wrongBg:     'rgba(220,38,38,.2)',
            wrongText:   '#fca5a5',
            headerBg:    'linear-gradient(135deg,#061410 0%,#0e2a1e 45%,#081a14 100%)',
            headerText:  'var(--text)',
            pillBg:      'rgba(82,183,136,.12)',
            pillBorder:  'rgba(82,183,136,.3)',
            serif:       "'Merriweather', serif",
            mono:        "'DM Mono', monospace",
            overlayCard: 'var(--surface2)',
            confetti:    ['#52b788','#e9c46a','#0077b6','#e76f51','#d8ede5'],
        };
    }
}

// ══════════════════════════════════════
// SHARED CELEBRATION (used by FIB, FC, TF, EP)
// ══════════════════════════════════════
function injectCelebStyles() {
    if (document.getElementById('sharedCelebStyles')) return;
    const s = document.createElement('style');
    s.id = 'sharedCelebStyles';
    s.textContent = `
        @keyframes celebBounceIn  { 0%{opacity:0;transform:translate(-50%,-50%) scale(.5) rotate(-4deg)} 60%{opacity:1;transform:translate(-50%,-50%) scale(1.08) rotate(2deg)} 80%{transform:translate(-50%,-50%) scale(.97) rotate(-1deg)} 100%{transform:translate(-50%,-50%) scale(1) rotate(0)} }
        @keyframes celebBounceOut { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,-50%) scale(.8)} }
        @keyframes celebFloat     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes confettiFall   { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
    `;
    document.head.appendChild(s);
}

function showCelebration({ title, subtitle, extra = '', onReset, section }) {
    injectCelebStyles();
    const T = getSubjectTheme();
    for (let i = 0; i < 65; i++) {
        const p = document.createElement('div');
        p.style.cssText = `position:fixed;top:0;left:${Math.random()*100}vw;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;background:${T.confetti[Math.floor(Math.random()*T.confetti.length)]};border-radius:${Math.random()>.5?'50%':'2px'};z-index:10001;pointer-events:none;animation:confettiFall ${1.5+Math.random()*2}s ${Math.random()*.8}s ease-in forwards;`;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 4000);
    }

    // Guided-flow CTA: if the activity is mastered, offer the next one;
    // if there are wrong answers to fix (mcq/tf), offer to redo just those.
    let ctaHtml = '', ctaNext = null, ctaWrong = 0;
    if (section && typeof nextActivityAfter === 'function') {
        const goldBtn = `background:linear-gradient(135deg,#d4a843,#b8860b);color:#fff;border:none;border-radius:8px;padding:10px 22px;font-family:${T.mono};font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.06em;`;
        if ((section === 'mcq' || section === 'tf') && typeof _wrongAnswerKeys === 'function') {
            ctaWrong = _wrongAnswerKeys(section).length;
        }
        if (ctaWrong > 0) {
            ctaHtml = `<button id="sharedCelebRedo" style="${goldBtn}">🔁 Redo ${ctaWrong} wrong</button>`;
        } else if (sectionIsComplete(section)) {
            ctaNext = nextActivityAfter(section);
            if (ctaNext) ctaHtml = `<button id="sharedCelebNext" style="${goldBtn}">${ctaNext.icon} Next: ${ctaNext.label} →</button>`;
        }
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10000;backdrop-filter:blur(3px);';
    const card = document.createElement('div');
    card.id = 'sharedCelebCard';
    card.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:${T.overlayCard};border:2px solid ${T.accent};border-radius:16px;padding:36px 40px;text-align:center;z-index:10002;min-width:280px;max-width:90vw;box-shadow:0 24px 60px rgba(0,0,0,.35);animation:celebBounceIn .55s cubic-bezier(.34,1.56,.64,1) forwards;`;
    card.innerHTML = `
        <div style="font-size:52px;margin-bottom:12px;animation:celebFloat 1.8s ease-in-out infinite;">🎉</div>
        <div style="font-family:${T.serif};font-size:22px;font-weight:700;color:${T.accent};margin-bottom:8px;">${title}</div>
        <div style="font-family:'DM Sans',sans-serif;font-size:14px;color:${T.textDim};margin-bottom:${extra?'6px':'22px'};line-height:1.6;">${subtitle}</div>
        ${extra ? `<div style="font-family:${T.mono};font-size:11px;color:${T.textDim};margin-bottom:22px;">${extra}</div>` : ''}
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            ${ctaHtml}
            <button id="sharedCelebDismiss" style="background:${ctaHtml ? 'transparent' : T.accent};color:${ctaHtml ? T.textDim : T.accentText};border:${ctaHtml ? `1.5px solid ${T.border}` : 'none'};border-radius:8px;padding:10px 22px;font-family:${T.mono};font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.06em;">✓ Done</button>
            <button id="sharedCelebReset" style="background:transparent;color:${T.textDim};border:1.5px solid ${T.border};border-radius:8px;padding:10px 22px;font-family:${T.mono};font-size:12px;font-weight:600;cursor:pointer;letter-spacing:.06em;">🔄 Try Again</button>
        </div>`;
    document.body.appendChild(overlay);
    document.body.appendChild(card);
    const dismiss = () => {
        card.style.animation = 'celebBounceOut .3s ease forwards';
        overlay.style.transition = 'opacity .3s'; overlay.style.opacity = '0';
        setTimeout(() => { card.remove(); overlay.remove(); }, 320);
    };
    document.getElementById('sharedCelebDismiss').addEventListener('click', dismiss);
    // "Try Again" clears the section for real where a full reset exists —
    // the bare onReset rebuild would restore the saved answers straight back.
    document.getElementById('sharedCelebReset').addEventListener('click', () => {
        dismiss();
        setTimeout(() => {
            if (section && typeof SECTION_RESET_DEFS !== 'undefined' && SECTION_RESET_DEFS[section]) _fullResetSection(section);
            else if (onReset) onReset();
        }, 340);
    });
    const nextBtn = document.getElementById('sharedCelebNext');
    if (nextBtn) nextBtn.addEventListener('click', () => { dismiss(); setTimeout(() => goToActivity(ctaNext.tabId), 340); });
    const redoBtn = document.getElementById('sharedCelebRedo');
    if (redoBtn) redoBtn.addEventListener('click', () => { dismiss(); setTimeout(() => redoWrongAnswers(section), 340); });
    overlay.addEventListener('click', dismiss);
}

// ══════════════════════════════════════
// SHARED PROGRESS BAR HELPERS
// ══════════════════════════════════════
// ── Progress bar styles (injected once)
function injectProgressStyles() {
    if (document.getElementById('progressBarStyles')) return;
    const T = getSubjectTheme();
    const s = document.createElement('style');
    s.id = 'progressBarStyles';
    s.textContent = `
        .prog-inline {
            background: ${T.surface2};
            border: 1px solid ${T.border};
            border-radius: 10px;
            padding: 14px 20px;
            margin-bottom: 16px;
        }
        .prog-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        .prog-label {
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            color: ${T.textDim};
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        .prog-count {
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            color: ${T.textDim};
        }
        .prog-track {
            background: ${T.border};
            border-radius: 99px;
            height: 10px;
            overflow: hidden;
        }
        .prog-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, ${T.accent}, ${T.accentHl});
            border-radius: 99px;
            transition: width .45s cubic-bezier(.4,0,.2,1);
        }
        .prog-float {
            position: fixed;
            top: 52px;
            left: 50%;
            transform: translateX(-50%) translateY(-12px);
            z-index: 200;
            opacity: 0;
            pointer-events: none;
            transition: opacity .3s ease, transform .3s cubic-bezier(.34,1.3,.64,1);
            background: ${T.surface};
            border: 1px solid ${T.border};
            border-bottom: 2px solid ${T.accent};
            border-radius: 0 0 12px 12px;
            padding: 7px 18px 9px;
            min-width: 200px;
            max-width: min(440px, 88vw);
            width: max-content;
            box-shadow: 0 6px 24px rgba(0,0,0,.2);
            backdrop-filter: blur(6px);
        }
        .prog-float.visible {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
            pointer-events: auto;
        }
        .prog-float .prog-row { margin-bottom: 4px; gap: 12px; }
        .prog-float .prog-label { font-size: 9px; }
        .prog-float .prog-count { font-size: 9px; flex-shrink: 0; }
        .prog-float .prog-track { height: 5px; }
        @keyframes progPulse {
            0%   { box-shadow: 0 6px 24px rgba(0,0,0,.2), 0 0 0 0 rgba(0,0,0,.2); }
            70%  { box-shadow: 0 6px 24px rgba(0,0,0,.2), 0 0 0 7px rgba(0,0,0,0); }
            100% { box-shadow: 0 6px 24px rgba(0,0,0,.2), 0 0 0 0 rgba(0,0,0,0); }
        }
        .prog-float.pulse { animation: progPulse .5s ease; }

        /* ── Read checkpoint ── */
        .read-check-wrap {
            margin-top: 18px;
            border-top: 1px solid var(--border);
            padding-top: 14px;
        }
        .read-check-label {
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            letter-spacing: .1em;
            text-transform: uppercase;
            color: var(--accent2);
            margin-bottom: 8px;
        }
        .read-check-q {
            font-size: 14px;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 10px;
            line-height: 1.5;
        }
        .read-check-opts {
            display: flex;
            flex-direction: column;
            gap: 7px;
            margin-bottom: 10px;
        }
        .read-check-btn {
            background: var(--surface2);
            border: 1.5px solid var(--border);
            border-radius: 7px;
            padding: 9px 14px;
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            color: var(--text);
            text-align: left;
            cursor: pointer;
            transition: background .15s, border-color .15s;
        }
        .read-check-btn:hover:not(:disabled) {
            background: var(--surface);
            border-color: var(--accent2);
        }
        .read-check-btn.rc-correct {
            background: rgba(22,163,74,.2);
            border-color: var(--success);
            color: #86efac;
            font-weight: 600;
        }
        .read-check-btn.rc-wrong {
            background: rgba(220,38,38,.2);
            border-color: var(--wrong);
            color: #fca5a5;
        }
        .read-check-feedback {
            font-size: 13px;
            padding: 9px 13px;
            border-radius: 6px;
            line-height: 1.6;
        }
        .rc-fb-ok {
            background: rgba(22,163,74,.15);
            border: 1px solid rgba(22,163,74,.3);
            color: #86efac;
        }
        .rc-fb-no {
            background: rgba(220,38,38,.15);
            border: 1px solid rgba(220,38,38,.3);
            color: #fca5a5;
        }

        /* ── Completed read-check visual state ── */
        .read-check-wrap {
            margin-top: 18px;
            border-top: 1px solid ${T.border};
            padding-top: 14px;
        }
        .read-check-wrap[data-answered] {
            background: ${T.successBg};
            border-radius: 8px;
            padding: 12px;
            margin: 4px -4px -4px;
        }
        .read-check-wrap[data-answered] .read-check-label {
            color: ${T.accent};
        }
        /* Quick Check inside a .misc-card: the card itself has NO side
           padding (only its .wrong-view/.correct-view children do), so
           give the injected block the same 20px inset the views use —
           in BOTH the unanswered and the answered [data-answered] state
           (whose shorthand padding + negative side margins would
           otherwise pull it back to the card edges). Mirrored in
           style.css; duplicated here because this injected <style> is
           appended after the stylesheet and would win otherwise. */
        .misc-card > .read-check-wrap {
            padding-left: 20px;
            padding-right: 20px;
            padding-bottom: 16px;
        }
        .misc-card > .read-check-wrap[data-answered] {
            margin-left: 0;
            margin-right: 0;
            padding-left: 20px;
            padding-right: 20px;
        }
        .read-check-label {
            font-family: 'DM Mono', monospace;
            font-size: 10px;
            letter-spacing: .1em;
            text-transform: uppercase;
            color: ${T.accent};
            margin-bottom: 8px;
        }
        .read-check-q {
            font-size: 14px;
            font-weight: 600;
            color: ${T.text};
            margin-bottom: 10px;
            line-height: 1.5;
        }
        .read-check-opts {
            display: flex;
            flex-direction: column;
            gap: 7px;
            margin-bottom: 10px;
        }
        .read-check-btn {
            background: ${T.surface2};
            border: 1.5px solid ${T.border};
            border-radius: 7px;
            padding: 9px 14px;
            font-family: 'DM Sans', sans-serif;
            font-size: 13px;
            color: ${T.text};
            text-align: left;
            cursor: pointer;
            transition: background .15s, border-color .15s;
        }
        .read-check-btn:hover:not(:disabled) { background: ${T.surface}; border-color: ${T.accent}; }
        .read-check-btn:disabled { opacity: .55; cursor: default; }
        .read-check-btn.rc-correct {
            background: ${T.successBg}; border-color: ${T.success};
            color: ${T.successText}; font-weight: 600; opacity: 1 !important;
        }
        .read-check-btn.rc-wrong {
            background: ${T.wrongBg}; border-color: ${T.wrong};
            color: ${T.wrongText}; opacity: 1 !important;
        }
        .read-check-feedback {
            font-size: 13px; padding: 9px 13px;
            border-radius: 6px; line-height: 1.6;
        }
        .rc-fb-ok { background: ${T.successBg}; color: ${T.successText}; border: 1px solid ${T.success}; }
        .rc-fb-no { background: ${T.wrongBg}; color: ${T.wrongText}; border: 1px solid ${T.wrong}; }

        /* ── Read badge ── */
        .read-badge {
            display: inline-block;
            font-family: 'DM Mono', monospace;
            font-size: 10px; font-weight: 600;
            letter-spacing: .08em;
            color: ${T.successText};
            background: ${T.successBg};
            border: 1px solid ${T.success};
            border-radius: 4px;
            padding: 2px 7px; margin-left: 10px;
            vertical-align: middle;
        }
        .misc-read-badge { display: block; margin: 10px 16px; text-align: center; }
    `;
    document.head.appendChild(s);
}

// Registry of all active progress bar IDs — used by the scroll handler
const _progIds = [];

function createProgressBar(id, label) {
    injectProgressStyles();

    // Inline bar
    const wrap = document.createElement('div');
    wrap.id = id + 'BarWrap';
    wrap.className = 'prog-inline';
    wrap.innerHTML = `
        <div class="prog-row">
            <span class="prog-label">${label}</span>
            <span class="prog-count" id="${id}BarLabel">0 / 0</span>
        </div>
        <div class="prog-track">
            <div class="prog-fill" id="${id}Bar"></div>
        </div>`;

    // Floating twin
    const floater = document.createElement('div');
    floater.id = id + 'BarFloat';
    floater.className = 'prog-float';
    floater.innerHTML = `
        <div class="prog-row">
            <span class="prog-label">${label}</span>
            <span class="prog-count" id="${id}BarLabelFloat">0 / 0</span>
        </div>
        <div class="prog-track">
            <div class="prog-fill" id="${id}BarFloatFill"></div>
        </div>`;
    document.body.appendChild(floater);

    if (!_progIds.includes(id)) _progIds.push(id);
    return wrap;
}

// Single scroll listener — checks every registered bar on scroll
function _onProgScroll() {
    _progIds.forEach(id => {
        const inlineEl = document.getElementById(id + 'BarWrap');
        const floatEl  = document.getElementById(id + 'BarFloat');
        if (!inlineEl || !floatEl) return;

        // Only show if the tab containing this bar is currently active
        const tabPanel = inlineEl.closest('.tab-panel');
        const tabActive = tabPanel && tabPanel.classList.contains('active');
        if (!tabActive) {
            floatEl.classList.remove('visible');
            return;
        }

        const rect = inlineEl.getBoundingClientRect();
        // Show when the bottom of the inline bar has scrolled above the tab bar (~52px)
        floatEl.classList.toggle('visible', rect.bottom < 56);
    });
}
window.addEventListener('scroll', _onProgScroll, { passive: true });

function updateProgressBar(id, done, total) {
    const pct = total ? (done / total * 100) + '%' : '0%';

    // Update inline
    const bar = document.getElementById(id + 'Bar');
    const lbl = document.getElementById(id + 'BarLabel');
    if (bar) bar.style.width = pct;
    if (lbl) lbl.textContent = `${done} / ${total}`;

    // Update float
    const barF = document.getElementById(id + 'BarFloatFill');
    const lblF = document.getElementById(id + 'BarLabelFloat');
    if (barF) barF.style.width = pct;
    if (lblF) lblF.textContent = `${done} / ${total}`;

    // Pulse the floater when an answer is given and it's visible
    const floatEl = document.getElementById(id + 'BarFloat');
    if (floatEl && done > 0 && floatEl.classList.contains('visible')) {
        floatEl.classList.remove('pulse');
        void floatEl.offsetWidth;
        floatEl.classList.add('pulse');
    }

    // Re-evaluate visibility immediately after an answer (no need to scroll)
    _onProgScroll();
}

function destroyProgressBar(id) {
    const floatEl = document.getElementById(id + 'BarFloat');
    if (floatEl) floatEl.remove();
    const i = _progIds.indexOf(id);
    if (i > -1) _progIds.splice(i, 1);
}


// ══════════════════════════════════════
// FILL IN THE BLANKS
// ══════════════════════════════════════
let fibScore = 0, fibCorrectTotal = 0;
let isAdvancedFIB = false;
function isAnswerAcceptable(u, a) {
    u = u.trim().toLowerCase(); a = a.trim().toLowerCase();
    return u === a || u + 's' === a || u === a + 's';
}

function injectFIBProgressBar() {
    if (document.getElementById('fibBarWrap')) return;
    const wrap = document.getElementById('fibWrap');
    if (!wrap) return;
    const bar = createProgressBar('fib', '✏️ Fill in the Blanks — Progress');
    wrap.parentElement.insertBefore(bar, wrap);
}

function updateFIBProgress() {
    updateProgressBar('fib', fibScore, fibCorrectTotal);
    if (fibScore > 0 && fibScore >= fibCorrectTotal) {
        setTimeout(() => showCelebration({
            title: 'All Blanks Filled!',
            subtitle: 'You completed every gap — great recall! 📝',
            extra: `${fibCorrectTotal} blank${fibCorrectTotal !== 1 ? 's' : ''} answered correctly`,
            section: 'fib',
            onReset: resetFIB
        }), 400);
    }
}

function buildFIB() {
    const wrap = document.getElementById('fibWrap');
    if (!wrap) return;
    fibCorrectTotal = fibData.reduce((a, f) => a + Object.keys(f.blanks).filter(k => f.blanks[k] !== '').length, 0);
    document.getElementById('fibTotal').textContent = fibCorrectTotal;
    fibData.forEach((f, fi) => {
        const div = document.createElement('div');
        div.className = 'fib-sentence';
        let html = f.display, bi = 0;
        if (!isAdvancedFIB) {
            const correctAnswers = Object.values(f.blanks).filter(v => v !== '');
            const distractors = fibWords.filter(w => !correctAnswers.includes(w)).sort(() => Math.random() - .5).slice(0, 4);
            html = html.replace(/_____/g, () => {
                const key = Object.keys(f.blanks)[bi];
                const ans = f.blanks[key]; bi++;
                if (!ans) return `<em>(see above)</em>`;
                const opts = [ans, ...distractors.filter(d => d !== ans).slice(0, 3)].sort(() => Math.random() - .5);
                const optHTML = ['— choose —', ...opts].map(o => `<option value="${o === '— choose —' ? '' : o}">${o}</option>`).join('');
                return `<span class="blank-select" data-fi="${fi}" data-sfi="${f._fi != null ? f._fi : fi}" data-key="${key}" data-ans="${ans}"><select>${optHTML}</select></span>`;
            });
            div.innerHTML = html;
        } else {
            html = html.replace(/_____/g, () => {
                const key = Object.keys(f.blanks)[bi];
                const ans = f.blanks[key]; bi++;
                if (!ans) return `<em>(see above)</em>`;
                return `<input type="text" class="fib-input" data-fi="${fi}" data-key="${key}" data-ans="${ans}" placeholder="type here...">`;
            });
            div.innerHTML = html;
            const checkBtn = document.createElement('button');
            checkBtn.className = 'fib-check-btn'; checkBtn.innerHTML = '✓ Check Answers';
            checkBtn.addEventListener('click', () => {
                const inputs = div.querySelectorAll('.fib-input');
                let allOk = true;
                inputs.forEach(input => {
                    if (input.disabled) return;
                    if (isAnswerAcceptable(input.value, input.dataset.ans)) {
                        input.classList.remove('wrong'); input.classList.add('correct');
                        input.disabled = true; fibScore++;
                    } else { input.classList.remove('correct'); input.classList.add('wrong'); allOk = false; }
                });
                document.getElementById('fibScore').textContent = fibScore;
                if (allOk) { checkBtn.innerHTML = 'Perfect! ✨'; checkBtn.disabled = true; }
                updateFIBProgress();
                ProgressStore.save(getPageId(), 'fib', fibScore, fibCorrectTotal);
            });
            div.appendChild(document.createElement('br'));
            div.appendChild(checkBtn);
        }
        wrap.appendChild(div);

        // Restore previously answered dropdown blanks (old format: the answer
        // string; new format: { answer, correct } — only correct picks are
        // stored locally, but skip any correct:false rows defensively, e.g.
        // hydrated from the server answer log)
        if (!isAdvancedFIB) {
            const savedFIB = ProgressStore.getAnswers(getPageId(), 'fib') || {};
            div.querySelectorAll('.blank-select').forEach(wrapper => {
                const saveKey = `${wrapper.dataset.sfi != null ? wrapper.dataset.sfi : wrapper.dataset.fi}_${wrapper.dataset.key}`;
                const sv = savedFIB[saveKey];
                const val = (sv !== null && typeof sv === 'object') ? (sv.correct === false ? '' : sv.answer) : sv;
                if (val) {
                    const sel = wrapper.querySelector('select');
                    if (sel) {
                        sel.value = val;
                        sel.disabled = true;
                        wrapper.dataset.answered = 'correct';
                        wrapper.classList.add('correct');
                        fibScore++;
                    }
                }
            });
        }
    });
    if (!isAdvancedFIB && !wrap.dataset.listenerAttached) {
        wrap.addEventListener('change', e => {
            const sel = e.target; if (sel.tagName !== 'SELECT') return;
            const wrapper = sel.closest('.blank-select'); if (!wrapper || wrapper.dataset.answered === 'correct') return;
            const chosen = sel.value, ans = wrapper.dataset.ans; if (!chosen) return;
            if (chosen === ans) {
                wrapper.dataset.answered = 'correct'; wrapper.classList.remove('wrong'); wrapper.classList.add('correct');
                sel.disabled = true; fibScore++;
                document.getElementById('fibScore').textContent = fibScore;
                updateFIBProgress();
                ProgressStore.save(getPageId(), 'fib', fibScore, fibCorrectTotal);
                ProgressStore.saveAnswers(getPageId(), 'fib', `${wrapper.dataset.sfi != null ? wrapper.dataset.sfi : wrapper.dataset.fi}_${wrapper.dataset.key}`, { answer: ans, correct: true });
            } else {
                wrapper.classList.remove('correct'); wrapper.classList.add('wrong');
                if (typeof gamificationPlaySound === 'function') gamificationPlaySound('wrong');
                // Wrong picks never persist locally (the blank clears for a
                // retry), but the server log should still see them.
                if (typeof _gcseQueueOrSend === 'function') {
                    _gcseQueueOrSend({
                        page_id: getPageId(), section: 'fib',
                        question_id: `${wrapper.dataset.sfi != null ? wrapper.dataset.sfi : wrapper.dataset.fi}_${wrapper.dataset.key}`,
                        answer: { answer: chosen, correct: false }, is_correct: false,
                        done: fibScore, total: fibCorrectTotal,
                    });
                }
                setTimeout(() => { wrapper.classList.remove('wrong'); sel.value = ''; }, 700);
            }
        });
        wrap.dataset.listenerAttached = 'true';
    }
    document.getElementById('fibScore').textContent = fibScore;
    injectFIBProgressBar();
    updateProgressBar('fib', fibScore, fibCorrectTotal);
    ProgressStore.saveTotal(getPageId(), 'fib', fibCorrectTotal);
}
function resetFIB() {
    fibScore = 0;
    document.getElementById('fibScore').textContent = 0;
    document.getElementById('fibWrap').innerHTML = '';
    destroyProgressBar('fib');
    const old = document.getElementById('fibBarWrap');
    if (old) old.remove();
    buildFIB();
}
function injectFIBAdvancedToggle() {
    const fibScoreEl = document.getElementById('fibScore');
    const scoreBar = fibScoreEl ? fibScoreEl.closest('.score-bar') : null;
    if (!scoreBar || scoreBar.querySelector('.fib-mode-toggle')) return;
    const btn = document.createElement('button');
    btn.className = 'fc-btn outline fib-mode-toggle';
    btn.innerHTML = '🔥 Advanced Mode: Typing';
    btn.addEventListener('click', () => {
        isAdvancedFIB = !isAdvancedFIB;
        btn.innerHTML = isAdvancedFIB ? '🔽 Standard Mode: Dropdowns' : '🔥 Advanced Mode: Typing';
        resetFIB();
    });
    scoreBar.appendChild(btn);
}

// ══════════════════════════════════════
// FLASHCARDS
// ══════════════════════════════════════
let activeDeck = [], fcIndex = 0, redCards = [], amberCards = [], greenCards = [];

function injectFCProgressBar() {
    if (document.getElementById('fcBarWrap')) return;
    const scoreBar = document.getElementById('fcScoreBar');
    if (!scoreBar) return;
    const bar = createProgressBar('fc', '🃏 Flashcards — Progress');
    scoreBar.after(bar);
}

// Adds the Amber score counter + "🟡 Nearly" button purely via JS, so none
// of the 38 topic pages' inline flashcard markup needs editing.
function injectFCAmberUI() {
    const scoreBar = document.getElementById('fcScoreBar');
    if (scoreBar && !document.getElementById('fcAmber')) {
        const knownWrap = document.getElementById('fcKnown');
        if (knownWrap && knownWrap.parentElement) {
            const amberWrap = document.createElement('div');
            amberWrap.innerHTML = `<div class="score-num" id="fcAmber" style="color:#d4a843">0</div><div style="font-size:12px;color:var(--mid)">nearly</div>`;
            knownWrap.parentElement.after(amberWrap);
        }
    }
    const assess = document.getElementById('fcNavAssess');
    if (assess && !document.getElementById('fcAmberBtn')) {
        const btns = assess.querySelectorAll('.fc-btn');
        if (btns.length >= 2) {
            const amberBtn = document.createElement('button');
            amberBtn.type = 'button';
            amberBtn.id = 'fcAmberBtn';
            amberBtn.className = 'fc-btn outline';
            amberBtn.style.cssText = 'border-color:#d4a843;color:#8a6800;flex:1';
            amberBtn.textContent = '🟡 Nearly';
            amberBtn.addEventListener('click', () => markCard('amber'));
            assess.insertBefore(amberBtn, btns[1]);
        }
    }
}

function updateFCProgress() {
    // Only Green counts toward mastery progress (Red/Amber still need
    // review) — always measured against the FULL deck, not a review subset.
    updateProgressBar('fc', greenCards.length, flashcards.length);
}

function initFlashcards() {
    if (!document.getElementById('fcTerm') || typeof flashcards === 'undefined') return;
    activeDeck = [...flashcards];
    injectFCProgressBar();
    injectFCAmberUI();
    // Total registered against the FULL deck, never a review subset.
    ProgressStore.saveTotal(getPageId(), 'flashcards', flashcards.length);

    // Restore each card's previously graded Red/Amber/Green verdict —
    // keyed by the card's stable id so shuffles/randomise can't misalign
    // it (same pattern as MCQ/TF's _stableQi-keyed answers).
    redCards = []; amberCards = []; greenCards = [];
    const savedAnswers = ProgressStore.getAnswers(getPageId(), 'flashcards') || {};
    flashcards.forEach((f, i) => {
        const v = savedAnswers[_stableQi(flashcards, i)];
        if (!v || typeof v !== 'object' || !v.status) return;
        if (v.status === 'green') greenCards.push(f);
        else if (v.status === 'amber') amberCards.push(f);
        else if (v.status === 'red') redCards.push(f);
    });

    // Restore saved position
    const savedProgress = savedAnswers.progress;
    if (savedProgress && savedProgress.index > 0) {
        fcIndex = Math.min(savedProgress.index, activeDeck.length - 1);
        document.getElementById('fcSummaryArea').style.display = 'none';
        document.getElementById('fcActiveArea').style.display = 'block';
        document.getElementById('fcScoreBar').style.display = 'flex';
        updateProgressBar('fc', greenCards.length, flashcards.length);
        renderFC(); updateFCScore();
        // Show how far they got without losing progress
    } else {
        resetFlashcardsState();
    }
}
function resetFlashcardsState() {
    fcIndex = 0;
    document.getElementById('fcSummaryArea').style.display = 'none';
    document.getElementById('fcActiveArea').style.display = 'block';
    document.getElementById('fcScoreBar').style.display = 'flex';
    updateProgressBar('fc', greenCards.length, flashcards.length);
    renderFC(); updateFCScore();
}
function resetFlashcards() { activeDeck = [...flashcards]; redCards = []; amberCards = []; greenCards = []; updateProgressBar("fc", 0, flashcards.length); resetFlashcardsState(); }
function reviewWrong() {
    const toReview = [...redCards, ...amberCards];
    if (!toReview.length) return;
    activeDeck = toReview;
    resetFlashcardsState();
}
function renderFC() {
    const termEl = document.getElementById('fcTerm');
    if (!termEl || activeDeck.length === 0) return;
    const fc = activeDeck[fcIndex];
    termEl.textContent = fc.term;
    document.getElementById('fcDef').textContent = fc.def;
    document.getElementById('fcProgress').textContent = `Card ${fcIndex + 1} of ${activeDeck.length}`;
    document.getElementById('flashcard').classList.remove('flipped');
    document.getElementById('fcNavDefault').style.display = 'flex';
    document.getElementById('fcNavAssess').style.display = 'none';
    _fcUpdateCapUI();
}
function flipCard() {
    const cardEl = document.getElementById('flashcard');
    if (!cardEl) return;
    cardEl.classList.toggle('flipped');
    const isFlipped = cardEl.classList.contains('flipped');
    document.getElementById('fcNavDefault').style.display = isFlipped ? 'none' : 'flex';
    document.getElementById('fcNavAssess').style.display = isFlipped ? 'flex' : 'none';
    if (isFlipped) _fcUpdateCapUI();
}
// Disables the R/A/G buttons and shows a "come back tomorrow" message once
// the daily flashcard-review cap (gamification.js) has been reached.
function _fcUpdateCapUI() {
    const assess = document.getElementById('fcNavAssess');
    if (!assess) return;
    const capped = typeof fcDailyReviewCount === 'function' && typeof FC_DAILY_CAP !== 'undefined'
        && fcDailyReviewCount() >= FC_DAILY_CAP;
    assess.querySelectorAll('.fc-btn').forEach(b => b.disabled = capped);
    let msg = document.getElementById('fcCapMsg');
    if (capped) {
        if (!msg) {
            msg = document.createElement('p');
            msg.id = 'fcCapMsg';
            msg.className = 'fc-hint';
            msg.style.color = 'var(--mid)';
            assess.after(msg);
        }
        msg.textContent = `🎯 Daily flashcard limit reached (${FC_DAILY_CAP}/day) — come back tomorrow for more.`;
    } else if (msg) {
        msg.remove();
    }
}
function markCard(status) {
    const normalized = status === true ? 'green' : status === false ? 'red' : status;
    if (typeof fcDailyReviewCount === 'function' && typeof FC_DAILY_CAP !== 'undefined'
        && fcDailyReviewCount() >= FC_DAILY_CAP) {
        _fcUpdateCapUI();
        return;
    }
    const card = activeDeck[fcIndex];
    // Re-grading a card (e.g. in a "review wrong" round) must MOVE it, not
    // duplicate it — otherwise greenCards accumulates copies across review
    // rounds and the recorded "done" climbs past the deck size (19/12).
    [redCards, amberCards, greenCards].forEach(arr => {
        const ix = arr.indexOf(card);
        if (ix !== -1) arr.splice(ix, 1);
    });
    if (normalized === 'green') greenCards.push(card);
    else if (normalized === 'amber') amberCards.push(card);
    else redCards.push(card);
    updateFCScore();
    updateFCProgress();
    // card._qi is stamped once (tagStableQuestionIds) and travels with the
    // object — reading it directly is safer than re-deriving an index here,
    // since activeDeck may be a shuffled/filtered subset of `flashcards`.
    const key = card && card._qi != null ? card._qi : fcIndex;
    // Total is ALWAYS the full deck — activeDeck may be a review subset,
    // and saving its length made totals flip (16 → 12) between rounds.
    ProgressStore.save(getPageId(), 'flashcards', greenCards.length, flashcards.length);
    ProgressStore.saveAnswers(getPageId(), 'flashcards', 'progress', { index: fcIndex + 1, done: greenCards.length });
    ProgressStore.saveAnswers(getPageId(), 'flashcards', key, { status: normalized });
    if (typeof _fcBumpDaily === 'function') _fcBumpDaily();
    if (fcIndex < activeDeck.length - 1) {
        fcIndex++; renderFC();
    } else {
        showFCSummary();
        const perfect = redCards.length === 0 && amberCards.length === 0;
        setTimeout(() => showCelebration({
            title: perfect ? 'Perfect Deck!' : 'Deck Complete!',
            subtitle: perfect
                ? 'You knew every card — outstanding! 🌟'
                : `${greenCards.length} mastered, ${redCards.length + amberCards.length} to review`,
            extra: `${activeDeck.length} card${activeDeck.length !== 1 ? 's' : ''} completed`,
            section: 'flashcards',
            onReset: resetFlashcards
        }), 400);
    }
}
function updateFCScore() {
    const knownEl = document.getElementById('fcKnown');
    if (!knownEl) return;
    knownEl.textContent = greenCards.length;
    const amberEl = document.getElementById('fcAmber');
    if (amberEl) amberEl.textContent = amberCards.length;
    document.getElementById('fcUnknown').textContent = redCards.length;
    document.getElementById('fcTotalTrack').textContent = activeDeck.length;
}
function showFCSummary() {
    document.getElementById('fcActiveArea').style.display = 'none';
    document.getElementById('fcSummaryArea').style.display = 'block';
    document.getElementById('fcSummaryKnown').textContent = greenCards.length;
    document.getElementById('fcSummaryTotal').textContent = activeDeck.length;
    const reviewBtn = document.getElementById('btnReviewWrong');
    if (reviewBtn) {
        reviewBtn.style.display = (redCards.length + amberCards.length) > 0 ? 'inline-block' : 'none';
        reviewBtn.textContent = 'Review Red + Amber';
    }
}
function nextCard() { if (!activeDeck.length) return; fcIndex = (fcIndex + 1) % activeDeck.length; renderFC(); }
function prevCard() { if (!activeDeck.length) return; fcIndex = (fcIndex - 1 + activeDeck.length) % activeDeck.length; renderFC(); }

// ══════════════════════════════════════
// TRUE / FALSE
// ══════════════════════════════════════
let tfScore = 0, tfTotal = 0;

function injectTFProgressBar() {
    if (document.getElementById('tfBarWrap')) return;
    const wrap = document.getElementById('tfWrap');
    if (!wrap) return;
    const bar = createProgressBar('tf', '✅ True / False — Progress');
    wrap.parentElement.insertBefore(bar, wrap);
}

function updateTFProgress() {
    // Progress = CORRECT answers (mastery), not just attempts
    updateProgressBar('tf', tfScore, tfData.length);
    if (tfTotal > 0 && tfTotal >= tfData.length) {
        const perfect = tfScore === tfData.length;
        setTimeout(() => showCelebration({
            title: perfect ? 'Full Marks!' : 'All Done!',
            subtitle: perfect
                ? 'Every statement answered correctly — brilliant! 🎯'
                : `You scored ${tfScore} out of ${tfData.length}`,
            extra: `${tfData.length} statement${tfData.length !== 1 ? 's' : ''} completed`,
            section: 'tf',
            onReset: resetTF
        }), 400);
    }
}

function applyTFAnswered(card, i, chosenVal) {
    card.dataset.answered = 1;
    const correct = chosenVal === tfData[i].answer;
    card.querySelectorAll('.tf-btn').forEach(b => b.disabled = true);
    card.querySelectorAll('.tf-btn').forEach(b => {
        const bVal = b.dataset.val === 'true';
        if (bVal === chosenVal) { b.classList.add(correct ? 'correct' : 'wrong'); }
        if (!correct && bVal === tfData[i].answer) { b.classList.add('correct'); }
    });
    document.getElementById(`tfExp-${i}`).classList.add('show');
    return correct;
}

function buildTF(retryOnly = false) {
    const wrap = document.getElementById('tfWrap');
    if (!wrap) return;
    const savedAnswers = ProgressStore.getAnswers(getPageId(), 'tf');

    tfData.forEach((item, i) => {
        // Restore saved answer (old format: bare boolean; new format:
        // { val, correct } so the server log gets is_correct).
        // Keyed by the statement's stable id so shuffles can't misalign it.
        const key = _stableQi(tfData, i);
        const savedVal = savedAnswers && savedAnswers[key];
        const hasSaved = savedAnswers && savedAnswers[key] !== undefined;

        if (hasSaved) {
            const chosen = (savedVal !== null && typeof savedVal === 'object') ? savedVal.val : savedVal;
            const correct = chosen === item.answer;
            tfTotal++;
            if (correct) tfScore++;
            // Retry mode only renders the statements still needing an
            // answer, so students aren't hunting through already-correct ones.
            if (retryOnly) return;
        }

        const card = document.createElement('div'); card.className = 'tf-card';
        card.innerHTML = `<div><div class="tf-text">${item.statement}</div><div class="tf-explanation" id="tfExp-${i}">${item.explanation}</div></div>
<div class="tf-btns"><button class="tf-btn" data-i="${i}" data-val="true">TRUE</button><button class="tf-btn" data-i="${i}" data-val="false">FALSE</button></div>`;
        wrap.appendChild(card);

        if (hasSaved) {
            const chosen = (savedVal !== null && typeof savedVal === 'object') ? savedVal.val : savedVal;
            applyTFAnswered(card, i, chosen);
        }
    });

    document.getElementById('tfScore').textContent = tfScore;
    document.getElementById('tfTotal').textContent = tfTotal;

    wrap.addEventListener('click', e => {
        const btn = e.target.closest('.tf-btn'); if (!btn) return;
        const i = +btn.dataset.i; const card = btn.closest('.tf-card');
        if (card.dataset.answered) return;
        const chosenVal = btn.dataset.val === 'true';
        const correct = applyTFAnswered(card, i, chosenVal);
        tfTotal++;
        if (correct) tfScore++;
        document.getElementById('tfScore').textContent = tfScore;
        document.getElementById('tfTotal').textContent = tfTotal;
        updateTFProgress();
        ProgressStore.save(getPageId(), 'tf', tfScore, tfData.length);
        ProgressStore.saveAnswers(getPageId(), 'tf', _stableQi(tfData, i), { val: chosenVal, correct });
    });
    injectTFProgressBar();
    updateProgressBar('tf', tfScore, tfData.length);
    ProgressStore.saveTotal(getPageId(), 'tf', tfData.length);
    // Migrate any legacy attempted-based summary to mastery counting
    if (tfTotal > 0 && (ProgressStore.get(getPageId(), 'tf').done || 0) !== tfScore) {
        ProgressStore.save(getPageId(), 'tf', tfScore, tfData.length);
    }
}
function resetTF() {
    tfScore = 0; tfTotal = 0;
    document.getElementById('tfScore').textContent = 0;
    document.getElementById('tfTotal').textContent = 0;
    document.getElementById('tfWrap').innerHTML = '';
    destroyProgressBar('tf');
    const old = document.getElementById('tfBarWrap');
    if (old) old.remove();
    buildTF();
}

// ══════════════════════════════════════
// EXAM PRACTICE
// ══════════════════════════════════════
let epRevealed = 0;

function injectEPProgressBar() {
    if (document.getElementById('epBarWrap')) return;
    const list = document.getElementById('epList');
    if (!list) return;
    const bar = createProgressBar('ep', '📝 Exam Practice — Questions Attempted');
    list.parentElement.insertBefore(bar, list);
}

function updateEPProgress() {
    updateProgressBar('ep', epRevealed, examQuestions.length);
    if (epRevealed > 0 && epRevealed >= examQuestions.length) {
        setTimeout(() => showCelebration({
            title: 'Practice Complete!',
            subtitle: 'You worked through every exam question — well done! 📋',
            extra: `${examQuestions.length} question${examQuestions.length !== 1 ? 's' : ''} attempted`,
            section: 'exam',
            onReset: () => {
                epRevealed = 0;
                document.getElementById('epList').innerHTML = '';
                destroyProgressBar('ep');
                const old = document.getElementById('epBarWrap');
                if (old) old.remove();
                buildExamPractice();
            }
        }), 400);
    }
}
let miscRead = 0;

function injectMiscProgressBar() {
    if (document.getElementById('miscBarWrap')) return;
    const list = document.getElementById('miscList');
    if (!list) return;
    const bar = createProgressBar('misc', '⚠️ Misconceptions — Cards Read');
    list.parentElement.insertBefore(bar, list);
}

function markMiscRead(card, idx = -1, silent = false) {
    if (card.dataset.read) return;
    card.dataset.read = '1';
    miscRead++;
    if (!silent) {
        ProgressStore.save(getPageId(), 'misc', miscRead, miscData.length);
        if (idx >= 0) ProgressStore.saveAnswers(getPageId(), 'misc', idx, true);
    }
    const badge = document.createElement('div');
    badge.className = 'read-badge misc-read-badge';
    badge.textContent = '✓ Read';
    card.appendChild(badge);
    updateProgressBar('misc', miscRead, miscData.length);
    if (!silent && miscRead >= miscData.length) {
        setTimeout(() => showCelebration({
            title: 'Section Complete!',
            subtitle: "You've reviewed all the common misconceptions ⚠️",
            extra: `${miscData.length} misconception${miscData.length !== 1 ? 's' : ''} reviewed`,
            section: 'misc',
            onReset: () => {
                miscRead = 0;
                document.getElementById('miscList').innerHTML = '';
                const old = document.getElementById('miscBarWrap');
                if (old) old.remove();
                destroyProgressBar('misc');
                buildMisc();
            }
        }), 400);
    }
}

function buildMisc() {
    const list = document.getElementById('miscList');
    if (!list) return;
    const savedReadCards = ProgressStore.getAnswers(getPageId(), 'misc');
    miscData.forEach((m, mi) => {
        const card = document.createElement('div'); card.className = 'misc-card';
        card.innerHTML = `<div class="wrong-view"><div class="misc-tag">✗ Common Student View</div><p>${m.wrong}</p></div><div class="correct-view"><div class="misc-tag">✓ Examiner's Correct View</div><p>${m.correct}</p></div>`;
        if (m.readCheck) {
            const savedAnswer = (savedReadCards && savedReadCards[`ans_${mi}`]) || null;
            const onComplete = () => markMiscRead(card, mi);
            onComplete._saveAnswer = (ans) => ProgressStore.saveAnswers(getPageId(), 'misc', `ans_${mi}`, ans);
            const check = renderReadCheck(card, m.readCheck, onComplete, savedAnswer);
            if (check) card.appendChild(check);
        }
        list.appendChild(card);
        if (savedReadCards && savedReadCards[mi]) markMiscRead(card, mi, true);
    });
    injectMiscProgressBar();
    updateProgressBar('misc', miscRead, miscData.length);
    ProgressStore.saveTotal(getPageId(), 'misc', miscData.length);
}


// ── BUILD EXAM TIPS ──
let tipsRead = 0;

function injectTipsProgressBar() {
    if (document.getElementById('tipsBarWrap')) return;
    const grid = document.getElementById('tipsGrid');
    if (!grid) return;
    const bar = createProgressBar('tips', '🎯 Exam Tips — Cards Read');
    grid.parentElement.insertBefore(bar, grid);
}

function markTipRead(card, idx = -1, silent = false) {
    if (card.dataset.read) return;
    card.dataset.read = '1';
    tipsRead++;
    if (!silent) {
        ProgressStore.save(getPageId(), 'tips', tipsRead, examTips.length);
        if (idx >= 0) ProgressStore.saveAnswers(getPageId(), 'tips', idx, true);
    }
    const badge = document.createElement('span');
    badge.className = 'read-badge';
    badge.textContent = '✓ Read';
    card.querySelector('h4').appendChild(badge);
    updateProgressBar('tips', tipsRead, examTips.length);
    if (!silent && tipsRead >= examTips.length) {
        setTimeout(() => showCelebration({
            title: 'Section Complete!',
            subtitle: "You've read all the exam tips — go ace it! 🎯",
            extra: `${examTips.length} tip${examTips.length !== 1 ? 's' : ''} completed`,
            section: 'tips',
            onReset: () => {
                tipsRead = 0;
                document.getElementById('tipsGrid').innerHTML = '';
                const old = document.getElementById('tipsBarWrap');
                if (old) old.remove();
                destroyProgressBar('tips');
                buildTips();
            }
        }), 400);
    }
}

function buildTips() {
    const grid = document.getElementById('tipsGrid');
    if (!grid) return;
    const savedReadCards = ProgressStore.getAnswers(getPageId(), 'tips');
    examTips.forEach((t, ti) => {
        const card = document.createElement('div'); card.className = 'tip-card'; card.style.cursor = 'pointer';
        const pills = t.pills.map(p => `<span class="mark-pill ${p}">${p}</span>`).join('');
        card.innerHTML = `<span class="toggle-icon" style="position:absolute;right:20px;top:20px;color:#5a6e7f;font-size:18px;transition:transform 0.3s;">+</span>
<div class="tip-type">${t.type}</div><h4>${t.title}</h4>
<div class="tip-content">${t.content}${t.pills.length ? `<div class="mark-breakdown">${pills}</div>` : ''}</div>`;
        const contentDiv = card.querySelector('.tip-content');
        if (t.readCheck) {
            const savedAnswer = (savedReadCards && savedReadCards[`ans_${ti}`]) || null;
            const onComplete = () => markTipRead(card, ti);
            onComplete._saveAnswer = (ans) => ProgressStore.saveAnswers(getPageId(), 'tips', `ans_${ti}`, ans);
            const check = renderReadCheck(card, t.readCheck, onComplete, savedAnswer);
            if (check) contentDiv.appendChild(check);
        }
        card.addEventListener('dblclick', () => { card.classList.toggle('open'); window.getSelection().removeAllRanges(); });
        grid.appendChild(card);
        if (savedReadCards && savedReadCards[ti]) markTipRead(card, ti, true);
    });
    injectTipsProgressBar();
    updateProgressBar('tips', tipsRead, examTips.length);
    ProgressStore.saveTotal(getPageId(), 'tips', examTips.length);
    injectExpandAll(resolveTabId('tab-examtips'), 'tipsGrid', 'tip-card');
}



// ── BUILD EXAM PRACTICE ──
function buildExamPractice() {
    const list = document.getElementById('epList');
    if (!list) return;
    const savedEP = ProgressStore.getAnswers(getPageId(), 'exam') || {};
    // Restore epRevealed count from saved answers
    epRevealed = Object.keys(savedEP).length;
    examQuestions.forEach((q, qi) => {
        const card = document.createElement('div'); card.className = 'ep-card';
        // Resolve the extract text: a question may either carry its own inline
        // caseStudy (a scenario unique to that question) OR reference a shared
        // extract by caseId (several questions about the same extract point at
        // one entry in EXAM_CASE_STUDIES, so editing it once updates them all).
        const caseText = _epResolveCase(q);
        // Stamp a grouping key so updateExamCaseStudyGrouping() can show a
        // shared extract once per run of questions in the scroll-through view.
        // Keyed by caseId when present so it groups by identity, not by exact
        // text; otherwise by the inline text itself.
        card.dataset.caseKey = q.caseId ? ('id:' + q.caseId) : (caseText || '');
        // Case studies come in two flavours: plain text (Business) that uses
        // newlines for paragraph/bullet breaks, and full HTML (Economics) with
        // <p>/<ul>/<table> where the newlines are just formatting between tags.
        // Collapse newlines that sit BETWEEN tags first (so we don't inject
        // stray <br>s — including ones the parser hoists above a <table>),
        // then turn any remaining (plain-text) newlines into <br>.
        const caseHtml = caseText ? `<div class="ep-case">${caseText.replace(/>\s*\n\s*</g,'><').replace(/\n/g,'<br>')}</div>` : '';
        let interactiveHtml = '';
        if (q.type === 'mcq') {
            interactiveHtml = `<div class="ep-mcq-opts">${q.options.map((o, oi) => `<button class="ep-opt" data-qi="${qi}" data-oi="${oi}"><strong>${String.fromCharCode(65+oi)}.</strong> ${o}</button>`).join('')}</div>`;
        } else {
            interactiveHtml = `<textarea class="ep-answer-area" id="epTextarea-${qi}" placeholder="Write your answer here..."></textarea>`;
        }
        card.innerHTML = `<div class="ep-header">
<div><div class="ep-num">${q.num}</div><div class="ep-title">${q.marks} mark${q.marks>1?'s':''}</div></div>
<div class="ep-marks">[${q.marks} mark${q.marks>1?'s':''}]</div>
</div>
<div class="ep-body">
${caseHtml}
<div class="ep-question">${q.question.replace(/\n/g,'<br>')}</div>
${interactiveHtml}
<div class="ep-btn-row">
<button class="ep-btn hint-btn" onclick="togglePop(${qi},'hint')">💡 Hint</button>
<button class="ep-btn starter-btn" onclick="togglePop(${qi},'starter')">✍️ Sentence Starter</button>
${q.type !== 'mcq' ? `<button class="ep-btn submit-btn" onclick="togglePop(${qi},'marks')">📋 Submit &amp; See Mark Scheme</button>` : ''}
</div>
<div class="ep-popup hint-pop" id="epHint-${qi}"><strong>💡 Hint:</strong> ${q.hint}</div>
<div class="ep-popup starter-pop" id="epStarter-${qi}"><strong>✍️ Sentence Starter:</strong><br>${q.starter.replace(/\n/g,'<br>')}</div>
<div class="ep-popup marks-pop" id="epMarks-${qi}">
${q.markScheme}
${q.modelAnswer ? `<div class="marks-section"><h5>✓ Model Answer</h5><div class="model-answer">${q.modelAnswer.replace(/\n/g,'<br>')}</div></div>` : ''}
</div>
</div>`;
        list.appendChild(card);

        // Restore revealed state from previous session
        if (savedEP[qi]) {
            card.dataset.epRevealed = '1';
            const marksEl = document.getElementById(`epMarks-${qi}`);
            if (marksEl) marksEl.classList.add('show');
            if (q.type === 'mcq') {
                card.dataset.epAnswered = '1';
                const savedOi = savedEP[qi].oi;
                if (savedOi !== undefined) {
                    const allOpts = card.querySelectorAll('.ep-opt');
                    allOpts.forEach(b => b.disabled = true);
                    if (allOpts[savedOi]) allOpts[savedOi].classList.add(savedOi === q.answer ? 'ep-correct' : 'ep-wrong');
                    if (savedOi !== q.answer && allOpts[q.answer]) allOpts[q.answer].classList.add('ep-correct');
                }
            } else {
                // Written question: scheme was revealed before, so show the
                // self-assessment panel too.
                const entry = savedEP[qi];
                const panel = _epInsertSelfPanel(card, qi);
                // Both branches set epSelfMarked: a saved entry is already
                // COUNTED (it's in epRevealed above), so focus mode must not
                // re-block it — legacy reveal-only users included.
                card.dataset.epSelfMarked = '1';
                if (entry.selfMark !== undefined && entry.selfMark !== null) {
                    // Fully self-marked: restore their answer + mark, locked.
                    const ta = document.getElementById(`epTextarea-${qi}`);
                    if (ta) { ta.value = entry.answerText || ''; ta.disabled = true; }
                    if (panel) {
                        panel.querySelector('.ep-self-mark').value = entry.selfMark;
                        panel.querySelector('.ep-self-reflect').value = entry.reflection || '';
                        _epLockSelfPanel(panel, entry.selfMark, entry.selfMax != null ? entry.selfMax : q.marks);
                    }
                }
                // Legacy `{revealed:true}` entries (pre-self-marking): still
                // counted as attempted; the panel stays UNLOCKED so they can
                // self-mark — saving then must not double-count (the save
                // handler checks card.dataset.epRevealed).
            }
        }
    });
    // MCQ auto-reveal on click
    list.addEventListener('click', e => {
        const btn = e.target.closest('.ep-opt'); if (!btn) return;
        const qi = +btn.dataset.qi, oi = +btn.dataset.oi;
        const card = btn.closest('.ep-card');
        if (card.dataset.epAnswered) return;
        card.dataset.epAnswered = 1;
        const allOpts = card.querySelectorAll('.ep-opt');
        allOpts.forEach(b => b.disabled = true);
        btn.classList.add(oi === examQuestions[qi].answer ? 'ep-correct' : 'ep-wrong');
        if (oi !== examQuestions[qi].answer) allOpts[examQuestions[qi].answer].classList.add('ep-correct');
        document.getElementById(`epMarks-${qi}`).classList.add('show');
        epRevealed++; updateEPProgress();
        ProgressStore.save(getPageId(), 'exam', epRevealed, examQuestions.length);
        ProgressStore.saveAnswers(getPageId(), 'exam', qi, { revealed: true, oi });
    });
    injectEPProgressBar();
    updateProgressBar('ep', epRevealed, examQuestions.length);
    ProgressStore.saveTotal(getPageId(), 'exam', examQuestions.length);
    ProgressStore.saveTotal(getPageId(), 'exam', examQuestions.length);
    updateExamCaseStudyGrouping();
}

// ── Shared exam case studies (single source per extract) ──
// Several questions can be about the SAME extract. Rather than each carrying
// its own copy (which drifts when edited), a question may set `caseId` and the
// page defines the text once in EXAM_CASE_STUDIES = { id: "<html>" }. Every
// question with that id shows the one shared extract, so an edit updates them
// all. Questions with their own unique scenario keep using inline `caseStudy`.
function _epExamCaseStudies() {
    if (typeof EXAM_CASE_STUDIES !== 'undefined' && EXAM_CASE_STUDIES) return EXAM_CASE_STUDIES;
    if (typeof window !== 'undefined' && window.EXAM_CASE_STUDIES) return window.EXAM_CASE_STUDIES;
    return null;
}
function _epResolveCase(q) {
    if (q && q.caseId) {
        const map = _epExamCaseStudies();
        if (map && map[q.caseId] != null) return map[q.caseId];
    }
    return (q && q.caseStudy) || '';
}

// ── Case-study display mode ──
// One-at-a-time (focus) view: every exam question keeps its own copy of the
// case study, because the student only ever sees one card. All-at-once
// (scroll-through) view: the same extract shared by a run of consecutive
// questions is shown once — on the first of the run — so it isn't repeated
// down the whole list. Toggling the teacher's setting just re-runs this;
// no rebuild needed (the case study stays in the DOM, we only hide/show it).
function _epExamFocusActive() {
    return typeof gcseIsStudent === 'function' && gcseIsStudent()
        && typeof _flowSettings !== 'undefined' && !!_flowSettings.focus_mode;
}

function _injectExamCaseStyles() {
    if (document.getElementById('epCaseGroupStyles')) return;
    const s = document.createElement('style');
    s.id = 'epCaseGroupStyles';
    s.textContent = '.ep-case.ep-case-dup{display:none !important;}';
    document.head.appendChild(s);
}

function updateExamCaseStudyGrouping() {
    const list = document.getElementById('epList');
    if (!list) return;
    _injectExamCaseStyles();
    const perQuestion = _epExamFocusActive();
    let prevKey = null;
    list.querySelectorAll('.ep-card').forEach(card => {
        const caseEl = card.querySelector('.ep-case');
        const key = card.dataset.caseKey || '';
        if (caseEl) {
            // Hide only when this question's extract repeats the immediately
            // preceding question's AND we're in the scroll-through view.
            const isDuplicate = !perQuestion && key !== '' && key === prevKey;
            caseEl.classList.toggle('ep-case-dup', isDuplicate);
        }
        prevKey = key;
    });
}
function togglePop(qi, type) {
    const hint    = document.getElementById(`epHint-${qi}`);
    const starter = document.getElementById(`epStarter-${qi}`);
    const marks   = document.getElementById(`epMarks-${qi}`);
    if (type === 'hint')        { hint.classList.toggle('show'); starter.classList.remove('show'); }
    else if (type === 'starter'){ starter.classList.toggle('show'); hint.classList.remove('show'); }
    else if (type === 'marks')  {
        const wasHidden = !marks.classList.contains('show');
        marks.classList.toggle('show');
        // Revealing the mark scheme no longer counts the question — students
        // must mark their own answer first (_epSaveSelfMark does the counting
        // and persistence). The first reveal just adds the self-assessment
        // panel below the popup; it stays put when the popup is re-hidden.
        const card = marks.closest('.ep-card');
        if (wasHidden && examQuestions[qi] && examQuestions[qi].type !== 'mcq') {
            _epInsertSelfPanel(card, qi);
        }
    }
}

// ── EXAM PRACTICE SELF-MARKING ──
// After seeing the mark scheme, students award themselves a mark (0–q.marks)
// and write a short reflection. Only THEN does the question count as
// attempted. Mirrors the teacher marking-queue controls in teacher-tasks.html.
function _epInsertSelfPanel(card, qi) {
    const existing = document.getElementById(`epSelf-${qi}`);
    if (existing) return existing;
    const q = examQuestions[qi];
    const panel = document.createElement('div');
    panel.className = 'ep-self';
    panel.id = `epSelf-${qi}`;
    panel.innerHTML = `<div class="ep-self-head">🖊️ Mark your own answer</div>
<div class="ep-self-hint">Compare your answer with the mark scheme, then award yourself a mark and say why.</div>
<div class="ep-self-field">
<label for="epSelfMark-${qi}">My marks (0–${q.marks})</label>
<input type="number" class="ep-self-mark" id="epSelfMark-${qi}" min="0" max="${q.marks}" step="0.5">
</div>
<textarea class="ep-self-reflect" id="epSelfReflect-${qi}" placeholder="Why did you give yourself this mark? e.g. which mark-scheme points did you hit or miss?"></textarea>
<button type="button" class="ep-btn ep-self-save">💾 Save my mark</button>
<div class="ep-self-msg" id="epSelfMsg-${qi}"></div>`;
    const marksPop = document.getElementById(`epMarks-${qi}`);
    if (marksPop && marksPop.parentNode) marksPop.insertAdjacentElement('afterend', panel);
    else card.querySelector('.ep-body').appendChild(panel);
    panel.querySelector('.ep-self-save').addEventListener('click', () => _epSaveSelfMark(qi));
    return panel;
}

function _epSaveSelfMark(qi) {
    const q = examQuestions[qi];
    const panel = document.getElementById(`epSelf-${qi}`);
    if (!panel || !q) return;
    const card = panel.closest('.ep-card');
    const markInp = panel.querySelector('.ep-self-mark');
    const reflectTa = panel.querySelector('.ep-self-reflect');
    const msg = panel.querySelector('.ep-self-msg');
    const mark = parseFloat(markInp.value);
    if (isNaN(mark) || mark < 0 || mark > Number(q.marks)) {
        msg.textContent = `Enter a mark between 0 and ${q.marks}.`;
        msg.classList.add('show');
        return;
    }
    const reflection = reflectTa.value.trim();
    if (!reflection) {
        msg.textContent = 'Add a sentence explaining your mark.';
        msg.classList.add('show');
        return;
    }
    msg.textContent = ''; msg.classList.remove('show');
    // Lock their written answer so the self-mark stays honest. answerText may
    // be empty (some students answer on paper) — saved but never required.
    const ansTa = document.getElementById(`epTextarea-${qi}`);
    const answerText = ansTa ? ansTa.value.trim() : '';
    if (ansTa) ansTa.disabled = true;
    // Legacy reveal-only entries were already counted on restore
    // (card.dataset.epRevealed set) — don't double-increment for those.
    const alreadyCounted = !!card.dataset.epRevealed;
    card.dataset.epRevealed = '1';
    card.dataset.epSelfMarked = '1';
    if (!alreadyCounted) {
        epRevealed++; updateEPProgress();
        ProgressStore.save(getPageId(), 'exam', epRevealed, examQuestions.length);
    }
    // No `correct` key on purpose: a self-award isn't verified right/wrong,
    // so correctness stays null for the XP hook (_gcseExtractCorrectness).
    ProgressStore.saveAnswers(getPageId(), 'exam', qi, { revealed: true, selfMark: mark, selfMax: q.marks, reflection, answerText });
    _epLockSelfPanel(panel, mark, q.marks);
}

function _epLockSelfPanel(panel, mark, max) {
    panel.classList.add('locked');
    const markInp = panel.querySelector('.ep-self-mark');
    const reflectTa = panel.querySelector('.ep-self-reflect');
    if (markInp) markInp.disabled = true;
    if (reflectTa) reflectTa.disabled = true;
    const btn = panel.querySelector('.ep-self-save');
    if (btn) {
        const chip = document.createElement('span');
        chip.className = 'ep-self-done';
        chip.textContent = `✓ Self-marked: ${mark}/${max}`;
        btn.replaceWith(chip);
    }
    const msg = panel.querySelector('.ep-self-msg');
    if (msg) { msg.textContent = ''; msg.classList.remove('show'); }
}

// ── SCROLL TO TOP ──
function initScrollToTop() {
    const btn = document.createElement('button');
    btn.innerHTML = '↑'; btn.className = 'scroll-to-top';
    btn.title = 'Back to top';
    btn.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(btn);
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 300));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── TOAST ──
let toastEl = null, toastTimeout = null;
function showDoubleClickHint() {
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'toast-hint';
        toastEl.innerHTML = `💡 <strong>Hint:</strong> Double-tap to open or close details.`;
        document.body.appendChild(toastEl);
    }
    toastEl.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

// ── SECTION RESET (score-bar RESET buttons) ──
// A RESET used to just rebuild the DOM — but every build restores the saved
// answers straight back, so to a student the button looked broken. Now it
// genuinely clears that one section (answers + summary, locally and on the
// server) so they can practise it again, and shuffles the questions for the
// retake. First attempts always run in the authored order — the separate
// 🔀 RANDOMISE button is gone, the shuffle simply happens on reset.
const SECTION_RESET_DEFS = {
    mcq:        { data: () => typeof mcqData    !== 'undefined' ? mcqData    : null, total: () => mcqData.length,    rebuild: () => resetMCQ() },
    match:      { data: () => typeof matchData  !== 'undefined' ? matchData  : null, total: () => matchData.length,  rebuild: () => resetMatch() },
    fib:        { data: () => typeof fibData    !== 'undefined' ? fibData    : null, total: () => typeof fibCorrectTotal !== 'undefined' ? fibCorrectTotal : 0, rebuild: () => resetFIB() },
    flashcards: { data: () => typeof flashcards !== 'undefined' ? flashcards : null, total: () => flashcards.length, rebuild: () => resetFlashcards() },
    tf:         { data: () => typeof tfData     !== 'undefined' ? tfData     : null, total: () => tfData.length,     rebuild: () => resetTF() },
};

function _fullResetSection(section) {
    const def = SECTION_RESET_DEFS[section];
    if (!def) return;
    const pid = getPageId();
    ProgressStore.setAnswersBulk(pid, section, {});
    // Tombstone locally, and wipe the server copy (fire-and-forget — until
    // supabase/section-reset.sql is run, the tombstone alone still stops
    // THIS device re-hydrating the cleared answers).
    _gcseTombstoneSection(pid, section);
    try {
        if (_gcseSupabaseClient && _gcseProfile && _gcseProfile.role === 'student') {
            _gcseSupabaseClient.rpc('reset_my_section_progress', { p_page_id: pid, p_section: section })
                .then(() => {}, e => console.error('reset_my_section_progress', e));
        }
    } catch (e) {}
    // Retakes come in a fresh order (question ids are stable, so a shuffle
    // can never misalign future saved answers).
    const data = def.data();
    if (data) data.sort(() => Math.random() - .5);
    ProgressStore.save(pid, section, 0, def.total());
    def.rebuild();
    if (typeof _gamUpdateHud === 'function') _gamUpdateHud();
}

function confirmResetSection(section) {
    if (!confirm('Practise this activity again?\n\nYour answers for it will be cleared and the questions will come back in a new order.')) return;
    _fullResetSection(section);
}

// Rewire each score-bar RESET button from "rebuild" to the real reset above.
// The inline onclick is removed so the old rebuild can't also fire; on any
// page where this doesn't find a button, the inline fallback still works.
function upgradeResetButtons() {
    const byFn = [['resetMCQ', 'mcq'], ['resetMatch', 'match'], ['resetFIB', 'fib'], ['resetFlashcards', 'flashcards'], ['resetTF', 'tf']];
    document.querySelectorAll('.reset-btn').forEach(btn => {
        if (btn.dataset.fullReset) return;
        const oc = btn.getAttribute('onclick') || '';
        const hit = byFn.find(([fn]) => oc.includes(fn));
        if (!hit) return;
        btn.dataset.fullReset = '1';
        btn.removeAttribute('onclick');
        btn.addEventListener('click', () => confirmResetSection(hit[1]));
    });
}



// ══════════════════════════════════════════════════════════════
// RESTORE PROGRESS ON PAGE LOAD
// Re-applies saved done/total to score counters, progress bars
// and lesson rings — without re-asking questions.
// ══════════════════════════════════════════════════════════════
function restoreProgress() {
    const pageId = getPageId();
    const saved  = ProgressStore.getPage(pageId);

    Object.entries(saved).forEach(([section, { done, total }]) => {
        if (!total) return; // nothing registered yet

        // ── Update the floating/inline progress bar (mcq/tf bars are
        // already painted by their builds with mastery counts — a legacy
        // attempted-based summary here would overstate them)
        if (section !== 'mcq' && section !== 'tf') updateProgressBar(section, done, total);

        // ── Update score counter elements
        // mcq/tf/fib score counters are derived from the answer store by
        // their build functions (score = correct, total = attempted) — the
        // summary rollup can't distinguish those, so don't overwrite them.
        const scoreMap = {
            mcq:        { score: null,          tot: null        },
            match:      { score: 'matchScore',  tot: 'matchTotal'},
            fib:        { score: null,          tot: null        },
            flashcards: { score: 'fcKnown',     tot: 'fcTotalTrack' },
            tf:         { score: null,          tot: null        },
            exam:       { score: null,           tot: null        },
            learn:      { score: null,           tot: null        },
            misc:       { score: null,           tot: null        },
            tips:       { score: null,           tot: null        },
        };
        const map = scoreMap[section];
        if (map) {
            if (map.score) { const el = document.getElementById(map.score); if (el) el.textContent = done; }
            if (map.tot)   { const el = document.getElementById(map.tot);   if (el) el.textContent = total; }
        }

        // (Matching's header bars are painted by buildMatch itself, which
        // restores the exact per-round state — the summary rollup here can't
        // split done across the two rounds.)

        // ── Update lesson ring
        updateLessonRing(section, done, total);
    });
}

// ── INJECT EXAMPLE readCheck QUESTIONS ──
// These are placeholder questions — replace the readCheck arrays in your
// topics / miscData / examTips data objects with real questions.
// Format for every readCheck:
//   { q: 'Question text', opts: ['A','B','C','D'], ans: 0, explain: 'Why A is correct.' }
//   ans = index of the correct option in opts[]
function injectExampleReadChecks() {
    // ── Example questions for topics[] ──
    const learnChecks = [
        { q: 'Which of the following best defines this topic?',            opts: ['It relates to human-environment interaction','It only applies to physical geography','It is unrelated to GCSE content','It describes tectonic processes only'], ans: 0, explain: 'Human-environment interaction is a core theme running through this topic.' },
        { q: 'What is the key idea covered in this card?',                 opts: ['Understanding causes, effects and responses','Memorising place names','Calculating statistics','Drawing map sketches'], ans: 0, explain: 'GCSE questions focus on causes, effects and responses — always structure answers around these.' },
        { q: 'Which command word asks you to give similarities AND differences?', opts: ['Compare','Describe','Explain','Suggest'], ans: 0, explain: "'Compare' requires you to state both similarities and differences explicitly." },
        { q: 'A 6-mark explain question requires:',                        opts: ['Developed point + explanation + example','A list of six facts','One long description','Only statistics'], ans: 0, explain: 'Point → Explain → Example (PEE) is the structure for extended answers.' },
        { q: 'Evidence in geography exam answers should be:',              opts: ['Specific — named places, dates, data','Vague and general','Copied from the question','Limited to the UK only'], ans: 0, explain: 'Examiners award marks for specific, accurate evidence such as named examples and statistics.' },
    ];

    // ── Example questions for miscData[] ──
    const miscChecks = [
        { q: 'What is the most common mistake students make with this topic?', opts: ['Confusing cause and effect','Using too many examples','Writing too much','Knowing too much detail'], ans: 0, explain: 'Mixing up cause and effect is a very common error — always ask: why did it happen vs what happened as a result.' },
        { q: "The examiner's correct view is best described as:",             opts: ['Balanced, evidence-based and precise','Opinionated and one-sided','Memorised from a textbook','Focused only on negatives'], ans: 0, explain: 'Examiners reward balance and precision — avoid sweeping statements.' },
        { q: "When students write 'it affects everyone the same', this is wrong because:", opts: ['Different groups are affected differently','Everyone is always affected the same','Geography ignores inequality','All impacts are always positive'], ans: 0, explain: 'Geography always considers how impacts vary by location, wealth, age, and other factors.' },
    ];

    // ── Example questions for examTips[] ──
    const tipsChecks = [
        { q: 'The first thing you should do when reading an exam question is:', opts: ['Identify the command word','Start writing immediately','Count the marks','Choose an example'], ans: 0, explain: 'The command word tells you exactly what the examiner wants — describe, explain, evaluate etc.' },
        { q: 'For a 9-mark question, how should you structure your answer?',    opts: ['Multiple developed points with evidence and a conclusion','One long paragraph','A bullet-pointed list','A diagram only'], ans: 0, explain: '9-mark questions assess AO1, AO2 and AO3 — you need knowledge, application and evaluation.' },
        { q: 'Using a case study in your answer:',                              opts: ['Must include specific place names and data','Should be kept vague to be safe','Is optional for all questions','Only applies to 1-mark questions'], ans: 0, explain: 'Specific case study detail (name, location, statistics) is essential for full marks on longer questions.' },
        { q: 'The word "suggest" in a question means:',                         opts: ['Use your own reasoning — there is no single right answer','Only recall memorised facts','Describe what you can see','Draw a diagram'], ans: 0, explain: "'Suggest' invites your own geographical reasoning — apply your knowledge to an unfamiliar situation." },
    ];

    // Attach to topics — cycle through checks if fewer than topics
    if (typeof topics !== 'undefined') {
        topics.forEach((t, i) => {
            if (!t.readCheck) t.readCheck = learnChecks[i % learnChecks.length];
        });
    }
    if (typeof miscData !== 'undefined') {
        miscData.forEach((m, i) => {
            if (!m.readCheck) m.readCheck = miscChecks[i % miscChecks.length];
        });
    }
    if (typeof examTips !== 'undefined') {
        examTips.forEach((t, i) => {
            if (!t.readCheck) t.readCheck = tipsChecks[i % tipsChecks.length];
        });
    }
}


// ══════════════════════════════════════════════════════════════
// THEME TOGGLE — Light / Dark mode
// ══════════════════════════════════════════════════════════════
function buildThemeToggle() {
    if (document.getElementById('themeToggle')) return;
    // Only inject toggle if the page has the #themeToggle CSS defined
    // (geography pages include it in style.css; business pages don't yet)
    const T = getSubjectTheme();
    const hasDarkMode = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent2').trim() !== '';
    // Geography only for now — business uses its own parchment theme
    if (!hasDarkMode) return;

    const saved = localStorage.getItem('geo_theme');
    if (saved === 'light') document.body.classList.add('light');

    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.setAttribute('aria-label', 'Toggle light/dark mode');
    const isLight = () => document.body.classList.contains('light');
    const update = () => {
        btn.innerHTML = `<span class="theme-icon">${isLight() ? '🌙' : '☀️'}</span>
            <span class="theme-label">${isLight() ? 'Dark' : 'Light'}</span>`;
    };
    btn.addEventListener('click', () => {
        document.body.classList.toggle('light');
        localStorage.setItem('geo_theme', isLight() ? 'light' : 'dark');
        update();
    });
    update();
    document.body.appendChild(btn);
}


// ══════════════════════════════════════════════════════════════
// COURSE SIDEBAR — Business Studies Navigation
// ══════════════════════════════════════════════════════════════
const courseData = [
    {
        title: "1. Business Activity",
        links: [
            { url: "/subjects/business/1_1_role_of_business_enterprise.html",  label: "1.1 Role of Business Enterprise" },
            { url: "/subjects/business/1_2_business_planning.html",             label: "1.2 Business Planning" },
            { url: "/subjects/business/1_3_business_ownership.html",            label: "1.3 Business Ownership" },
            { url: "/subjects/business/1_4_business_aims_objectives.html",      label: "1.4 Aims and Objectives" },
            { url: "/subjects/business/1_5_stakeholders_in_business.html",      label: "1.5 Stakeholders in Business" },
            { url: "/subjects/business/1_6_business_growth.html",               label: "1.6 Business Growth" }
        ]
    },
    {
        title: "2. Marketing",
        links: [
            { url: "/subjects/business/2_1_role_of_marketing.html",    label: "2.1 The Role of Marketing" },
            { url: "/subjects/business/2_2_market_research.html",       label: "2.2 Market Research" },
            { url: "/subjects/business/2_3_market_segmentation.html",   label: "2.3 Market Segmentation" },
            {
                url: "/subjects/business/2_4_marketing_mix.html",
                label: "2.4 The Marketing Mix",
                children: [
                    { url: "/subjects/business/2_4_1_introduction_marking_mix.html",      label: "2.4.1 Introduction" },
                    { url: "/subjects/business/2_4_2_Product_and_The_Product_Life_Cycle.html",  label: "2.4.2 Product & PLC" },
                    { url: "/subjects/business/2_4_3_pricing_methods.html",                label: "2.4.3 Pricing Methods" },
                    { url: "/subjects/business/2_4_4_Promotion.html",                      label: "2.4.4 Promotion" },
                    { url: "/subjects/business/2_4_5_place.html",                          label: "2.4.5 Place" },
                    { url: "/subjects/business/2_4_6_market_data_integrated_mix.html",     label: "2.4.6 Market Data & Mix" }
                ]
            }
        ]
    },
    {
        title: "3. People",
        links: [
            { url: "/subjects/business/3_1_role_of_human_resources.html",       label: "3.1 Role of Human Resources" },
            { url: "/subjects/business/3_2_organisational_structures.html",     label: "3.2 Organisational Structures" },
            { url: "/subjects/business/3_3_communication_in_business.html",     label: "3.3 Communication in Business" },
            { url: "/subjects/business/3_4_recruitment_and_selection.html",     label: "3.4 Recruitment and Selection" },
            { url: "/subjects/business/3_5_motivation_and_retention.html",      label: "3.5 Motivation and Retention" },
            { url: "/subjects/business/3_6_training_and_development.html",      label: "3.6 Training and Development" },
            { url: "/subjects/business/3_7_employment_law.html",                label: "3.7 Employment Law" }
        ]
    },
    {
        title: "4. Operations",
        links: [
            { url: "/subjects/business/4_1_production_processes.html",          label: "4.1 Production Processes" },
            { url: "/subjects/business/4_2_quality_of_goods_services.html",     label: "4.2 Quality of Goods & Services" },
            { url: "/subjects/business/4_3_sales_process_customer_service.html",label: "4.3 The Sales Process" },
            { url: "/subjects/business/4_4_consumer_law.html",                  label: "4.4 Consumer Law" },
            { url: "/subjects/business/4_5_business_location.html",             label: "4.5 Business Location" },
            { url: "/subjects/business/4_6_working_with_suppliers.html",        label: "4.6 Working with Suppliers" }
        ]
    },
    {
        title: "5. Finance",
        links: [
            { url: "/subjects/business/5_1_role_of_finance_function.html",      label: "5.1 Role of Finance Function" },
            { url: "/subjects/business/5_2_sources_of_finance.html",            label: "5.2 Sources of Finance" },
            { url: "/subjects/business/5_3_revenue_costs_profit_loss.html",     label: "5.3 Revenue, Costs, Profit" },
            { url: "/subjects/business/5_4_break_even.html",                    label: "5.4 Break-even" },
            { url: "/subjects/business/5_5_cash_and_cash_flow.html",            label: "5.5 Cash and Cash Flow" }
        ]
    },
    {
        title: "6. Influences",
        links: [
            { url: "/subjects/business/6_1_ethical_environmental.html",         label: "6.1 Ethical & Environmental" },
            { url: "/subjects/business/6_2_the_economic_climate.html",          label: "6.2 The Economic Climate" },
            { url: "/subjects/business/6_3_globalisation.html",                 label: "6.3 Globalisation" }
        ]
    },
    {
        title: "7. Final",
        links: [
            { url: "/subjects/business/7_1_final.html",                         label: "7.1 Interdependent Nature" }
        ]
    }
];

function initCourseSidebar() {
    // Skip on index/home pages and if already built
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) return;
    if (document.getElementById('course-sidebar')) return;

    const body   = document.body;
    const navBar = document.querySelector('.tab-bar');
    const currentPath = window.location.pathname;

    // Fallback flag for browsers without :has() support — CSS also
    // scopes on body:has(.course-sidebar), this just doubles up safely
    body.classList.add('has-sidebar');

    // ── Build sidebar element
    const sidebar = document.createElement('aside');
    sidebar.id = 'course-sidebar';
    sidebar.className = 'course-sidebar';

    // Subject-aware topic tree: subject pages declare their own tree via
    // page-groups.js (window.PAGE_GROUPS / window.SUBJECT). Business keeps
    // the hand-curated nested courseData below (PAGE_GROUPS is flat and
    // would lose the 2.4.x sub-page nesting).
    let sections = courseData;
    let homeHref = '/subjects/business/index.html';
    if (window.PAGE_GROUPS && window.SUBJECT && window.SUBJECT.slug !== 'business') {
        sections = window.PAGE_GROUPS.map(g => ({
            title: g.title,
            links: g.pages.map(p => ({ url: p.href, label: p.name }))
        }));
        homeHref = '/subjects/' + window.SUBJECT.slug + '/index.html';
    }

    let html = `
        <div class="sb-header">
            <a href="${homeHref}">← All Lessons</a>
            <button class="mobile-close-btn" id="mobileCloseBtn">✕ Close</button>
        </div>`;

    sections.forEach(section => {
        html += `<div class="sb-section">${section.title}</div>`;
        section.links.forEach(link => {
            const isActive = currentPath.includes(link.url) ? 'active' : '';

            if (link.children) {
                // Parent link — check if any child is also active to auto-expand
                const anyChildActive = link.children.some(c => currentPath.includes(c.url));
                const parentActive   = currentPath.includes(link.url) && !anyChildActive;
                const expanded       = anyChildActive ? 'open' : '';
                const pActive        = (parentActive || anyChildActive) ? 'active' : '';

                html += `
                    <div class="sb-parent ${pActive} ${expanded}">
                        <a href="${link.url}" class="sb-link sb-link-parent ${pActive}">${link.label}</a>
                        <button class="sb-chevron" aria-label="Expand" onclick="this.closest('.sb-parent').classList.toggle('open');event.preventDefault();event.stopPropagation();">▾</button>
                    </div>
                    <div class="sb-children ${expanded}">`;
                link.children.forEach(child => {
                    const cActive = currentPath.includes(child.url) ? 'active' : '';
                    html += `<a href="${child.url}" class="sb-link sb-child ${cActive}">${child.label}</a>`;
                });
                html += `</div>`;
            } else {
                html += `<a href="${link.url}" class="sb-link ${isActive}">${link.label}</a>`;
            }
        });
    });

    html += `<div class="sidebar-resizer" id="sidebarResizer"></div>`;
    sidebar.innerHTML = html;
    body.insertBefore(sidebar, navBar || body.firstChild);

    // ── Mobile overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    body.appendChild(overlay);
    overlay.addEventListener('click', () => body.classList.remove('sidebar-mobile-open'));

    const closeBtn = document.getElementById('mobileCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => body.classList.remove('sidebar-mobile-open'));

    // ── Hamburger toggle in tab bar
    if (navBar) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle-btn';
        toggleBtn.innerHTML = '☰';
        toggleBtn.title = 'Toggle Course Menu';
        navBar.insertBefore(toggleBtn, navBar.firstChild);
        toggleBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (window.innerWidth >= 900) body.classList.toggle('sidebar-collapsed');
            else body.classList.toggle('sidebar-mobile-open');
        });
    }

    // ── Auto-scroll to active link
    setTimeout(() => {
        const active = sidebar.querySelector('.sb-link.active');
        if (active) active.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);

    // ── Drag-to-resize (desktop)
    const resizer = document.getElementById('sidebarResizer');
    let isResizing = false;
    if (resizer) {
        resizer.addEventListener('mousedown', () => {
            isResizing = true;
            body.classList.add('is-resizing');
            resizer.classList.add('active');
            body.style.cursor = 'ew-resize';
            body.style.userSelect = 'none';
        });
        document.addEventListener('mousemove', e => {
            if (!isResizing) return;
            let w = Math.min(600, Math.max(200, e.clientX));
            document.documentElement.style.setProperty('--sidebar-width', w + 'px');
        });
        document.addEventListener('mouseup', () => {
            if (!isResizing) return;
            isResizing = false;
            body.classList.remove('is-resizing');
            resizer.classList.remove('active');
            body.style.cursor = '';
            body.style.userSelect = '';
        });
    }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    applyPageMeta();
    initSiteNav();
    buildThemeToggle();
    if (typeof courseData !== 'undefined') initCourseSidebar();
    tagStableQuestionIds();
    injectExampleReadChecks();
    buildLessonBar();
    initTabProgress();
    buildLearn();
    buildMCQ();
    buildMatch();
    buildFIB();
    buildMisc();
    buildTips();
    initFlashcards();
    buildTF();
    buildExamPractice();
    initScrollToTop();
    injectRedoWrongButtons();
    // Must run AFTER injectRedoWrongButtons/injectMatchSizePicker — both
    // locate the reset buttons via the inline onclick this removes.
    upgradeResetButtons();
    injectFIBAdvancedToggle();
    restoreProgress();
    initStudentFlow();
    applyHashActivity(); // open the activity from a shared #mcq/#matching link
    setTimeout(showDoubleClickHint, 800);
});


// ══════════════════════════════════════════════════════════════
// LESSON PROGRESS SUMMARY BAR
// Shows overall completion across all activities for this page.
// ══════════════════════════════════════════════════════════════
const SECTION_LABELS = {
    learn:      { icon: '📚', label: 'Key Learning' },
    mcq:        { icon: '❓', label: 'MCQ Quiz' },
    match:      { icon: '🔗', label: 'Matching' },
    fib:        { icon: '✏️', label: 'Fill the Blanks' },
    misc:       { icon: '⚠️', label: 'Misconceptions' },
    tips:       { icon: '🎯', label: 'Exam Tips' },
    flashcards: { icon: '🃏', label: 'Flashcards' },
    tf:         { icon: '✅', label: 'True / False' },
    exam:       { icon: '📝', label: 'Exam Practice' },
};

// ── Inject drawer styles once
function injectDrawerStyles() {
    if (document.getElementById('lessonDrawerStyles')) return;
    const T = getSubjectTheme();
    const s = document.createElement('style');
    s.id = 'lessonDrawerStyles';
    s.textContent = `
        #lessonPill {
            position: fixed; right: 24px; bottom: 82px;
            z-index: 300;
            width: 48px; height: 48px;
            background: ${T.surface2};
            border: 1px solid ${T.border};
            border-radius: 50%;
            padding: 0;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: transform .15s, background .2s, border-color .2s;
            box-shadow: 0 6px 18px rgba(0,0,0,.22);
        }
        #lessonPill:hover { background: ${T.surface}; border-color: ${T.accent}; transform: scale(1.08); }
        #lessonPill .pill-label {
            position: absolute;
            width: 1px; height: 1px;
            overflow: hidden; clip: rect(0 0 0 0);
            white-space: nowrap;
        }
        @media (max-width: 640px) {
            #lessonPill { right: 16px; bottom: 70px; width: 44px; height: 44px; }
        }
        #lessonDrawerOverlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,.4);
            backdrop-filter: blur(3px);
            z-index: 400; opacity: 0; pointer-events: none;
            transition: opacity .3s ease;
        }
        #lessonDrawerOverlay.open { opacity: 1; pointer-events: auto; }
        #lessonDrawer {
            position: fixed; top: 0; right: 0; bottom: 0;
            width: min(360px, 92vw);
            background: ${T.surface};
            border-left: 1px solid ${T.border};
            z-index: 401; display: flex; flex-direction: column;
            transform: translateX(100%);
            transition: transform .35s cubic-bezier(.4,0,.2,1);
            box-shadow: -12px 0 40px rgba(0,0,0,.2);
        }
        #lessonDrawer.open { transform: translateX(0); }
        .drawer-header {
            padding: 20px 22px 16px;
            border-bottom: 1px solid ${T.border};
            display: flex; align-items: center;
            justify-content: space-between; flex-shrink: 0;
            background: ${T.headerBg};
        }
        .drawer-header-left h3 {
            font-family: ${T.serif}; font-size: 16px;
            color: ${T.headerText}; margin-bottom: 3px;
        }
        .drawer-header-left p {
            font-family: 'DM Mono', monospace; font-size: 10px;
            color: ${T.headerText}; letter-spacing: .08em; opacity: .65;
        }
        .drawer-close {
            background: transparent;
            border: 1px solid rgba(255,255,255,.25);
            border-radius: 6px; padding: 6px 10px;
            color: ${T.headerText}; cursor: pointer; font-size: 16px;
            opacity: .7;
            transition: opacity .15s;
        }
        .drawer-close:hover { opacity: 1; }
        .drawer-overall {
            padding: 16px 22px;
            border-bottom: 1px solid ${T.border}; flex-shrink: 0;
        }
        .drawer-overall-top {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 8px;
        }
        .drawer-overall-label {
            font-family: 'DM Mono', monospace; font-size: 10px;
            color: ${T.textDim}; letter-spacing: .1em; text-transform: uppercase;
        }
        .drawer-overall-pct {
            font-family: ${T.serif}; font-size: 22px;
            color: ${T.accent}; line-height: 1;
        }
        .drawer-overall-track {
            background: ${T.border}; border-radius: 99px; height: 8px; overflow: hidden;
        }
        .drawer-overall-fill {
            height: 100%; width: 0%;
            background: linear-gradient(90deg, ${T.accent}, ${T.accentHl});
            border-radius: 99px; transition: width .6s cubic-bezier(.4,0,.2,1);
        }
        .drawer-sections { overflow-y: auto; flex: 1; padding: 8px 0; }
        .drawer-sections::-webkit-scrollbar { width: 4px; }
        .drawer-sections::-webkit-scrollbar-thumb { background: ${T.border}; border-radius:10px; }
        .drawer-row {
            display: flex; align-items: center; gap: 16px;
            padding: 12px 22px;
            border-bottom: 1px solid ${T.border};
            transition: background .15s;
        }
        .drawer-row:last-child { border-bottom: none; }
        .drawer-row:hover { background: ${T.surface2}; }
        .drawer-row-ring { flex-shrink: 0; }
        .drawer-row-info { flex: 1; min-width: 0; }
        .drawer-row-label { font-size: 13px; font-weight: 500; color: ${T.text}; margin-bottom: 3px; }
        .drawer-row-count { font-family: 'DM Mono', monospace; font-size: 11px; color: ${T.textDim}; }
        .drawer-row-bar-track { background: ${T.border}; border-radius: 99px; height: 4px; overflow: hidden; margin-top: 5px; }
        .drawer-row-bar-fill { height: 100%; width: 0%; border-radius: 99px; transition: width .5s cubic-bezier(.4,0,.2,1); }
        .drawer-row-icon { font-size: 18px; flex-shrink: 0; }
        .drawer-row-badge {
            font-family: 'DM Mono', monospace; font-size: 9px;
            letter-spacing: .08em; padding: 2px 7px;
            border-radius: 3px; flex-shrink: 0;
        }
        .badge-done  { background: ${T.successBg}; color: ${T.successText}; border: 1px solid ${T.success}; }
        .badge-prog  { background: ${T.pillBg};    color: ${T.accent};       border: 1px solid ${T.pillBorder}; }
        .badge-empty { background: transparent;     color: ${T.textDim};      border: 1px solid ${T.border}; }
        .drawer-footer { padding: 14px 22px; border-top: 1px solid ${T.border}; flex-shrink: 0; }
        .drawer-reset-btn {
            width: 100%; background: transparent;
            border: 1px solid ${T.border}; border-radius: 7px;
            padding: 10px 16px; font-family: 'DM Mono', monospace;
            font-size: 11px; color: ${T.textDim}; cursor: pointer;
            letter-spacing: .06em;
            transition: border-color .15s, color .15s, background .15s;
        }
        .drawer-reset-btn:hover { border-color: #dc2626; color: #c84b31; background: rgba(200,75,49,.06); }
        @keyframes pillPulse {
            0%,100% { box-shadow: -4px 0 16px rgba(0,0,0,.15); }
            50%      { box-shadow: -4px 0 20px rgba(0,0,0,.25); }
        }
        #lessonPill.pulse { animation: pillPulse .8s ease; }
    `;
    document.head.appendChild(s);
}

// ── Draw an SVG ring and return the HTML string
function _makeDrawerRing(done, total, size = 52) {
    const T = getSubjectTheme();
    const r = size * 0.38;
    const circ = 2 * Math.PI * r;
    const pct    = total > 0 ? done / total : 0;
    const offset = circ - pct * circ;
    const colour = total === 0 ? T.border
                 : done >= total ? T.accentHl
                 : done > 0 ? T.accent
                 : T.border;
    const tColour = total === 0 ? T.textDim
                  : done >= total ? T.accentHl
                  : done > 0 ? T.accent
                  : T.textDim;
    const label    = total === 0 ? '–' : `${done}/${total}`;
    const fontSize = label.length > 4 ? size * 0.14 : size * 0.17;
    const cx = size / 2, cy = size / 2, sw = size * 0.09;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${T.border}" stroke-width="${sw}"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
            stroke="${colour}" stroke-width="${sw}"
            stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
            stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"
            style="transition:stroke-dashoffset .55s cubic-bezier(.4,0,.2,1)"/>
        <text x="${cx}" y="${cy + size * 0.07}" text-anchor="middle"
            font-family="DM Mono,monospace" font-size="${fontSize.toFixed(1)}"
            fill="${tColour}" font-weight="500">${label}</text>
    </svg>`;
}

// ── Overall % ring for the pill (smaller)
function _makePillRing(pct) {
    const T = getSubjectTheme();
    const size = 38, r = 14, circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const colour = pct === 0 ? T.border : pct >= 100 ? T.accentHl : T.accent;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="19" cy="19" r="${r}" fill="none" stroke="${T.border}" stroke-width="3.5"/>
        <circle cx="19" cy="19" r="${r}" fill="none"
            stroke="${colour}" stroke-width="3.5"
            stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
            stroke-linecap="round" transform="rotate(-90 19 19)"
            id="pillRingFill"
            style="transition:stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)"/>
        <text x="19" y="23" text-anchor="middle"
            font-family="DM Mono,monospace" font-size="7"
            fill="${colour}" id="pillRingText">${pct}%</text>
    </svg>`;
}

function buildLessonBar() {
    if (document.getElementById('lessonPill')) return;
    injectDrawerStyles();

    // ── Pill button (fixed right edge)
    const pill = document.createElement('button');
    pill.id = 'lessonPill';
    pill.setAttribute('aria-label', 'Open progress drawer');
    pill.title = 'Lesson progress';
    pill.innerHTML = `
        ${_makePillRing(0)}
        <span class="pill-label">Progress</span>`;
    document.body.appendChild(pill);

    // ── Backdrop overlay
    const overlay = document.createElement('div');
    overlay.id = 'lessonDrawerOverlay';
    document.body.appendChild(overlay);

    // ── Drawer panel
    const drawer = document.createElement('div');
    drawer.id = 'lessonDrawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.innerHTML = `
        <div class="drawer-header">
            <div class="drawer-header-left">
                <h3>📊 Lesson Progress</h3>
                <p>Track your activity across this guide</p>
            </div>
            <button class="drawer-close" id="lessonDrawerClose" aria-label="Close">✕</button>
        </div>
        <div class="drawer-overall">
            <div class="drawer-overall-top">
                <span class="drawer-overall-label">Overall completion</span>
                <span class="drawer-overall-pct" id="drawerOverallPct">–</span>
            </div>
            <div class="drawer-overall-track">
                <div class="drawer-overall-fill" id="drawerOverallFill"></div>
            </div>
        </div>
        <div class="drawer-sections" id="drawerSections"></div>
        <div class="drawer-footer">
            <button class="drawer-reset-btn" id="drawerResetBtn">🗑 Reset This Page's Progress</button>
        </div>`;
    document.body.appendChild(drawer);

    // Build section rows
    const sectionsEl = drawer.querySelector('#drawerSections');
    Object.entries(SECTION_LABELS).forEach(([key, meta]) => {
        const row = document.createElement('div');
        row.className = 'drawer-row';
        row.id = `drawerRow_${key}`;
        row.innerHTML = `
            <div class="drawer-row-ring" id="drawerRing_${key}">${_makeDrawerRing(0, 0)}</div>
            <div class="drawer-row-info">
                <div class="drawer-row-label">${meta.label}</div>
                <div class="drawer-row-count" id="drawerCount_${key}">Not started</div>
                <div class="drawer-row-bar-track">
                    <div class="drawer-row-bar-fill" id="drawerBar_${key}" style="background:var(--accent2)"></div>
                </div>
            </div>
            <div class="drawer-row-icon">${meta.icon}</div>
            <span class="drawer-row-badge badge-empty" id="drawerBadge_${key}">–</span>`;
        sectionsEl.appendChild(row);
    });

    // ── Open / close logic
    function openDrawer() {
        drawer.classList.add('open');
        overlay.classList.add('open');
        pill.setAttribute('aria-expanded', 'true');
    }
    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
        pill.setAttribute('aria-expanded', 'false');
    }

    pill.addEventListener('click', openDrawer);
    overlay.addEventListener('click', closeDrawer);
    document.getElementById('lessonDrawerClose').addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

    // Reset this page's progress
    document.getElementById('drawerResetBtn').addEventListener('click', () => {
        if (!confirm('Reset all progress for this page? This cannot be undone.')) return;
        ProgressStore.clearPage(getPageId());
        rebuildAllActivities();
        refreshLessonBar();
        if (typeof _gamUpdateHud === 'function') _gamUpdateHud();
        closeDrawer();
    });

    // Load saved state
    refreshLessonBar();
}

// Tear down and rebuild every activity from the answer store — used by the
// drawer's reset button and by cross-device hydration (the build functions
// re-derive their counters from whatever answers are stored).
function rebuildAllActivities() {
    learnRead = 0; miscRead = 0; tipsRead = 0;
    mcqScore = 0; mcqTotal = 0;
    matchScore = 0;
    fibScore = 0;
    tfScore = 0; tfTotal = 0;
    epRevealed = 0;
    ['mcqWrap','matchLeft','matchRight','fibWrap','tfWrap','epList',
     'topicGrid','miscList','tipsGrid'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    ['mcqBarWrap','matchRoundHeader','fibBarWrap','tfBarWrap','epBarWrap',
     'learnBarWrap','miscBarWrap','tipsBarWrap'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    ['mcq','match','fib','tf','ep','learn','misc','tips','fc'].forEach(id => destroyProgressBar(id));
    document.getElementById('mcqScore').textContent = 0;
    document.getElementById('mcqTotal').textContent = 0;
    document.getElementById('tfScore') && (document.getElementById('tfScore').textContent = 0);
    document.getElementById('tfTotal') && (document.getElementById('tfTotal').textContent = 0);
    buildLearn(); buildMCQ(); buildMatch(); buildFIB();
    buildMisc(); buildTips(); initFlashcards(); buildTF(); buildExamPractice();
}

// Persist the counters the build functions just derived from the answer
// store — after hydration the stored per-section summaries may lag the
// merged answers until the student's next answer would overwrite them.
function syncDerivedSummaries() {
    const pid = getPageId();
    const rows = [
        ['learn', typeof topics !== 'undefined' ? topics.length : 0, () => learnRead],
        ['mcq',   typeof mcqData !== 'undefined' ? mcqData.length : 0, () => mcqScore],
        ['fib',   typeof fibCorrectTotal !== 'undefined' ? fibCorrectTotal : 0, () => fibScore],
        ['tf',    typeof tfData !== 'undefined' ? tfData.length : 0, () => tfScore],
        ['misc',  typeof miscData !== 'undefined' ? miscData.length : 0, () => miscRead],
        ['tips',  typeof examTips !== 'undefined' ? examTips.length : 0, () => tipsRead],
        ['exam',  typeof examQuestions !== 'undefined' ? examQuestions.length : 0, () => epRevealed],
    ];
    rows.forEach(([section, total, getDone]) => {
        if (total > 0) ProgressStore.save(pid, section, getDone(), total);
    });
}

function refreshLessonBar() {
    const pageId = getPageId();
    const saved  = ProgressStore.getPage(pageId);
    let totalDone = 0, totalItems = 0;

    Object.entries(SECTION_LABELS).forEach(([key]) => {
        const data = saved[key] || { done: 0, total: 0 };
        updateLessonRing(key, data.done, data.total);
        totalDone  += data.done;
        totalItems += data.total;
    });

    _updateDrawerOverall(totalDone, totalItems);
}

function _updateDrawerOverall(done, total) {
    const pct = total ? Math.round(done / total * 100) : 0;

    // Pill ring
    const pillFill = document.getElementById('pillRingFill');
    const pillText = document.getElementById('pillRingText');
    if (pillFill) {
        const circ = 2 * Math.PI * 14;
        pillFill.style.strokeDashoffset = circ - (pct / 100) * circ;
        const T = getSubjectTheme();
    const colour = pct === 0 ? T.border : pct >= 100 ? T.accentHl : T.accent;
        pillFill.style.stroke = colour;
        if (pillText) { pillText.textContent = pct + '%'; pillText.style.fill = colour; }
    }

    // Drawer overall
    const pctEl  = document.getElementById('drawerOverallPct');
    const fillEl = document.getElementById('drawerOverallFill');
    if (pctEl)  pctEl.textContent = total ? pct + '%' : '–';
    if (fillEl) fillEl.style.width = pct + '%';
}

function updateLessonRing(section, done, total) {
    // Keep the tab-bar indicator for this section in sync
    updateTabIndicator(section, done, total);
    if ((section === 'mcq' || section === 'tf') && typeof updateRedoWrongButtons === 'function') {
        updateRedoWrongButtons();
    }
    // Sequential unlocks + "activity complete" notifications
    if (typeof refreshActivityLocks === 'function') refreshActivityLocks();
    if (typeof _trackSectionCompletion === 'function') _trackSectionCompletion(section, done, total);

    // Update ring SVG
    const ringWrap = document.getElementById(`drawerRing_${section}`);
    if (ringWrap) ringWrap.innerHTML = _makeDrawerRing(done, total);

    // Update count label
    const countEl = document.getElementById(`drawerCount_${section}`);
    if (countEl) {
        countEl.textContent = total === 0 ? 'Not available'
            : done === 0 ? `0 of ${total} done`
            : done >= total ? `All ${total} complete!`
            : `${done} of ${total} done`;
    }

    // Update mini bar
    const barEl = document.getElementById(`drawerBar_${section}`);
    if (barEl) {
        const pct = total > 0 ? (done / total * 100) : 0;
        barEl.style.width = pct + '%';
        barEl.style.background = done >= total && total > 0
            ? 'var(--gold)'
            : 'linear-gradient(90deg, var(--accent), var(--accent2))';
    }

    // Update badge
    const badgeEl = document.getElementById(`drawerBadge_${section}`);
    if (badgeEl) {
        if (total === 0) {
            badgeEl.textContent = '–'; badgeEl.className = 'drawer-row-badge badge-empty';
        } else if (done >= total) {
            badgeEl.textContent = '✓ Done'; badgeEl.className = 'drawer-row-badge badge-done';
        } else if (done > 0) {
            badgeEl.textContent = 'In progress'; badgeEl.className = 'drawer-row-badge badge-prog';
        } else {
            badgeEl.textContent = 'Not started'; badgeEl.className = 'drawer-row-badge badge-empty';
        }
    }

    // Pulse the pill when a section updates
    const pill = document.getElementById('lessonPill');
    if (pill && done > 0) {
        pill.classList.remove('pulse');
        void pill.offsetWidth;
        pill.classList.add('pulse');
    }

    // Refresh overall
    const pageId = getPageId();
    const saved  = ProgressStore.getPage(pageId);
    let tDone = 0, tTotal = 0;
    Object.keys(SECTION_LABELS).forEach(k => {
        const d = saved[k] || { done: 0, total: 0 };
        tDone  += d.done;
        tTotal += d.total;
    });
    _updateDrawerOverall(tDone, tTotal);
}

// ══════════════════════════════════════════════════════════════
// PROGRESS STORE
// Central read/write layer for all activity progress.
// Uses localStorage now — swap _backend below for Google Sheets.
// ══════════════════════════════════════════════════════════════
const ProgressStore = (() => {
    const PREFIX = 'geo_progress_';

    // ── Backend (swap this object to upgrade to Google Sheets) ──
    const _backend = {
        set(key, val) {
            try { localStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch(e) {}
        },
        get(key) {
            try { const v = localStorage.getItem(PREFIX + key); return v ? JSON.parse(v) : null; } catch(e) { return null; }
        },
        keys() {
            try {
                return Object.keys(localStorage)
                    .filter(k => k.startsWith(PREFIX))
                    .map(k => k.slice(PREFIX.length));
            } catch(e) { return []; }
        }
    };

    // ── Public API ──
    function save(pageId, section, done, total) {
        if (!pageId) return;
        // A section can never be more complete than its own total — clamping
        // here protects every caller (and the teacher dashboard) from
        // overcounted summaries like "18/12".
        if (typeof total === 'number' && total > 0 && typeof done === 'number' && done > total) done = total;
        const key = `${pageId}__${section}`;
        _backend.set(key, { done, total, ts: Date.now() });
        _notifyDashboard(pageId, section, done, total);
        // Update the lesson bar ring for this section live
        if (typeof updateLessonRing === 'function') updateLessonRing(section, done, total);
    }

    function get(pageId, section) {
        return _backend.get(`${pageId}__${section}`) || { done: 0, total: 0 };
    }

    function getPage(pageId) {
        // Returns object of { section: { done, total } } for one page
        const result = {};
        _backend.keys().forEach(k => {
            if (k.startsWith(pageId + '__')) {
                const section = k.slice(pageId.length + 2);
                result[section] = _backend.get(k) || { done: 0, total: 0 };
            }
        });
        return result;
    }

    function getAll() {
        // Returns { pageId: { section: { done, total } } }
        const result = {};
        _backend.keys().forEach(k => {
            const [pageId, section] = k.split('__');
            if (!pageId || !section) return;
            if (!result[pageId]) result[pageId] = {};
            result[pageId][section] = _backend.get(k) || { done: 0, total: 0 };
        });
        return result;
    }

    // Ping the dashboard iframe/tab if it's open (future upgrade hook)
    function _notifyDashboard(pageId, section, done, total) {
        try {
            // BroadcastChannel lets the dashboard page update live if open in another tab
            if (typeof BroadcastChannel !== 'undefined') {
                const ch = new BroadcastChannel('geo_progress');
                ch.postMessage({ pageId, section, done, total });
                ch.close();
            }
        } catch(e) {}
    }

    // Save total only — never overwrites done count
    function saveTotal(pageId, section, total) {
        if (!pageId || !total) return;
        const key = `${pageId}__${section}`;
        const existing = _backend.get(key) || {};
        // Only update total; preserve existing done
        _backend.set(key, { done: existing.done || 0, total, ts: existing.ts || Date.now() });
        if (typeof updateLessonRing === 'function') updateLessonRing(section, existing.done || 0, total);
    }

    // Save individual answer choices (for per-question restore on reload)
    function saveAnswers(pageId, section, idx, val) {
        if (!pageId) return;
        const key = `${pageId}__answers__${section}`;
        const existing = _backend.get(key) || {};
        existing[idx] = val;
        _backend.set(key, existing);

        // Mirror this single answer to the server (student accounts only —
        // no-op if nobody is logged in as a student, e.g. teacher browsing).
        const isCorrect = _gcseExtractCorrectness(val);
        if (typeof _gcseQueueOrSend === 'function') {
            const summary = _backend.get(`${pageId}__${section}`) || {};
            _gcseQueueOrSend({
                page_id: pageId,
                section,
                question_id: String(idx),
                answer: val,
                is_correct: isCorrect,
                done: typeof summary.done === 'number' ? summary.done : null,
                total: typeof summary.total === 'number' ? summary.total : null,
            });
        }
        if (typeof gamificationOnAnswer === 'function') gamificationOnAnswer(isCorrect, section);
    }

    function getAnswers(pageId, section) {
        if (!pageId) return null;
        return _backend.get(`${pageId}__answers__${section}`);
    }

    // Bulk-write a whole answers object WITHOUT the per-answer side effects
    // (no server mirror, no XP toast) — used by cross-device hydration,
    // which is restoring history rather than recording new answers.
    function setAnswersBulk(pageId, section, answersObj) {
        if (!pageId) return;
        _backend.set(`${pageId}__answers__${section}`, answersObj || {});
    }

    // Delete specific answer keys (used by "redo wrong answers").
    function removeAnswers(pageId, section, keys) {
        if (!pageId || !keys || !keys.length) return;
        const key = `${pageId}__answers__${section}`;
        const existing = _backend.get(key) || {};
        keys.forEach(k => { delete existing[k]; });
        _backend.set(key, existing);
    }

    function clearPage(pageIdArg) {
        _backend.keys()
            .filter(k => k.startsWith(pageIdArg + '__'))
            .forEach(k => { try { localStorage.removeItem(PREFIX + k); } catch(e) {} });
        // Re-arm the one-time topic-complete celebration (gamification.js)
        try { localStorage.removeItem('gcse_topic_celebrated_' + pageIdArg); } catch(e) {}
        // Tombstone so cross-device hydration doesn't resurrect anything the
        // student just reset (only server rows newer than this re-sync)...
        try { localStorage.setItem('gcse_page_reset_' + pageIdArg, String(Date.now())); } catch(e) {}
        // ...and wipe the server copy too, where possible (same RPC the
        // dashboard reset uses; fire-and-forget).
        try {
            if (_gcseSupabaseClient && _gcseProfile && _gcseProfile.role === 'student') {
                _gcseSupabaseClient.rpc('reset_my_page_progress', { p_page_id: pageIdArg }).then(() => {}, e => console.error('reset_my_page_progress', e));
            }
        } catch (e) {}
    }

    return { save, saveTotal, saveAnswers, setAnswersBulk, removeAnswers, getAnswers, get, getPage, getAll, clearPage };
})();

// ── Get the page ID from pageMeta (defined in each topic HTML), prefixed
// with the page's subject slug — window.SUBJECT comes from the generated
// page-groups.js each topic page loads. "1-1-role-of-business-enterprise"
// becomes "business:1-1-role-of-business-enterprise": the subject-safe id
// used by localStorage progress keys, progress_summary/progress_events
// rows, SECTION_TOTALS and the question bank alike. (Pre-launch: old
// unprefixed local progress is deliberately abandoned, no migration.)
function getPageId() {
    let id;
    if (typeof pageMeta !== 'undefined' && pageMeta.id) id = pageMeta.id;
    else id = location.pathname.split('/').pop().replace('.html', '') || 'unknown';
    if (window.SUBJECT && window.SUBJECT.slug && id.indexOf(':') === -1) {
        id = window.SUBJECT.slug + ':' + id;
    }
    return id;
}

// Apply pageMeta to the DOM (badge, title, subtitle, page title)
function applyPageMeta() {
    if (typeof pageMeta === 'undefined') return;
    const badgeEl = document.querySelector('header .badge');
    const h1El    = document.querySelector('header h1');
    const subEl   = document.querySelector('header p');
    const titleEl = document.querySelector('title');
    if (badgeEl && pageMeta.badge)    badgeEl.innerHTML = pageMeta.badge;
    if (h1El    && pageMeta.title)    h1El.textContent  = pageMeta.title;
    if (subEl   && pageMeta.subtitle) subEl.textContent = pageMeta.subtitle;
    if (titleEl && pageMeta.title)    titleEl.textContent = pageMeta.title.replace(/&amp;/g, '&');
}
