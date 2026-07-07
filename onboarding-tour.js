// ══════════════════════════════════════════════════════════════
// NEW-STUDENT ONBOARDING TOUR — a guided walkthrough that spans THREE
// page types: index.html (welcome/HUD/bell/topics) → dashboard.html
// (progress/tasks/topics-to-review) → any topic page (tab bar/exam
// practice/account). Loaded on index.html, dashboard.html and every
// topic page (like notifications-shared.js) so a step's "Next" button
// can navigate the browser to a real page and the tour picks back up
// there — state survives the navigation via localStorage.
//
// Auto-starts once per browser (gcse_onboarding_tour_seen_v1 flag),
// only from index.html; a "❓ Take the tour" link there replays it.
// Mid-tour progress lives in gcse_onboarding_tour_state_v1 = {step};
// any navigation that ISN'T the tour's own "Next" button (closing the
// tab, clicking something else, going back) clears it via beforeunload,
// so a stale step never pops up unexpectedly on a later visit.
//
// Animation idiom copied from gamification.js's _gamShowTopicCelebration
// (fade-in via a .show class, role=dialog, Escape/click-outside to
// close) — kept calmer here (no confetti/sound). The spotlight ring is
// a box-shadow trick (no SVG mask needed).
// ══════════════════════════════════════════════════════════════

const ONBOARDING_TOUR_FLAG = 'gcse_onboarding_tour_seen_v1';
const ONBOARDING_STATE_KEY = 'gcse_onboarding_tour_state_v1';
const ONBOARDING_SESSION_KEY = 'gcse_session_v1';
const ONBOARDING_FALLBACK_TOPIC = '/subjects/business/1_1_role_of_business_enterprise.html';

// An element that's present but display:none (e.g. an empty-state
// section on a brand-new account) shouldn't be spotlighted — it has no
// visible position. Falls back to `orEl` (assumed always-visible).
function _tourVisible(el, orEl) {
    if (el && el.offsetParent !== null) return el;
    return orEl || null;
}

const ONBOARDING_STEPS = [
    // ── index.html ──
    {
        page: 'index',
        target: () => document.getElementById('gamHudMount'),
        title: 'Welcome! 👋',
        body: 'This is your <strong>Level</strong>, <strong>XP</strong> and <strong>🔥 streak</strong> — they grow every time you answer a question. Let’s take a quick look around.',
    },
    {
        page: 'index',
        target: () => document.querySelector('.gcse-notif-wrap .gcse-notif-btn'),
        title: 'Your notifications 🔔',
        body: 'When a teacher sets you a task or marks your work, it shows up here. For example:',
        example: `
            <div class="gcse-tour-example">
                <span aria-hidden="true">📋</span>
                <span>New task assigned: “Break-even analysis” — due Fri</span>
            </div>`,
    },
    {
        page: 'index',
        target: () => document.querySelector('.gam-continue') || document.querySelector('.topic-card') || document.getElementById('mainContent'),
        title: 'Pick up where you left off',
        body: 'The gold card jumps straight back into your most recent topic, and every topic below is one click away — click any card to start revising.',
    },
    {
        page: 'index',
        target: () => document.querySelector('.hero-nav a[href="dashboard.html"]'),
        title: 'Your Dashboard',
        body: 'Let’s take a look at your Dashboard — your full progress, tasks and scores all live there.',
        navTo: () => 'dashboard.html',
        navLabel: 'Go to Dashboard →',
    },

    // ── dashboard.html ──
    {
        page: 'dashboard',
        target: () => document.querySelector('.summary-strip'),
        title: 'Your progress at a glance',
        body: 'This strip totals your answers across every topic — how much you’ve done, and how much is left.',
    },
    {
        page: 'dashboard',
        target: () => _tourVisible(document.getElementById('tasksSection'), document.querySelector('main')),
        title: 'Tasks from your teacher',
        body: 'When your teacher sets a task, it appears here with its due date and status. Once it’s marked, your score shows up too. For example:',
        example: `
            <div class="gcse-tour-example gcse-tour-example-task">
                <span class="gcse-tour-example-title">Break-even analysis</span>
                <span class="gcse-tour-example-chip">✅ Marked — 8/10 (80%)</span>
            </div>`,
    },
    {
        page: 'dashboard',
        target: () => _tourVisible(document.getElementById('myInsights'), document.getElementById('dashContent')),
        title: 'Topics to review',
        body: 'Once you’ve completed a few tasks, we’ll highlight the topics worth revisiting most — lowest scores first.',
    },
    {
        page: 'dashboard',
        target: () => document.querySelector('#dashContent .page-link'),
        title: 'Let’s open a topic',
        body: 'Every topic has its own page — notes, quizzes, matching, and exam practice. Let’s open one and take a look.',
        navTo: () => {
            const l = document.querySelector('#dashContent .page-link');
            return (l && l.getAttribute('href')) || ONBOARDING_FALLBACK_TOPIC;
        },
        navLabel: 'Open a topic →',
    },

    // ── any topic page ──
    {
        page: 'topic',
        target: () => document.getElementById('tabBar'),
        title: 'Everything for this topic',
        body: 'Each tab is a different way to revise: notes, quizzes, matching, fill-in-the-blanks and more. Work through them in order, or jump straight to whichever you need.',
    },
    {
        page: 'topic',
        target: () => document.querySelector('#tabBar button[onclick*="exampractice"]'),
        title: 'Exam Practice',
        body: 'This tab has real exam-style questions with full mark schemes — great for checking you’re exam-ready.',
    },
    {
        page: 'topic',
        target: () => document.querySelector('.site-nav .sn-link[href="manage-account.html"]') || document.getElementById('manageAccountLink'),
        title: 'You’re all set!',
        body: 'You can manage your account and change your password any time from here. Happy revising!',
    },
];

function _tourInjectStyles() {
    if (document.getElementById('gcseTourStyles')) return;
    const s = document.createElement('style');
    s.id = 'gcseTourStyles';
    s.textContent = `
.gcse-tour-overlay{position:fixed;inset:0;z-index:600;background:rgba(15,25,35,.55);opacity:0;transition:opacity .3s;}
.gcse-tour-overlay.show{opacity:1;}
.gcse-tour-spotlight{position:relative;z-index:601;box-shadow:0 0 0 4px var(--gold,#d4a843),0 0 0 9999px rgba(15,25,35,.55);
  border-radius:8px;transition:box-shadow .25s;}
.gcse-tour-card{position:fixed;z-index:602;width:320px;max-width:90vw;background:var(--card-bg,#fffcf6);
  border:2px solid var(--gold,#d4a843);border-radius:14px;box-shadow:0 20px 55px rgba(0,0,0,.4);
  padding:20px 22px 18px;font-family:'DM Sans',sans-serif;color:var(--ink,#1a2332);
  opacity:0;transform:translateY(8px);transition:opacity .25s,transform .25s;}
.gcse-tour-card.show{opacity:1;transform:translateY(0);}
.gcse-tour-step{font-family:'DM Mono',monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--mid,#5a6e7f);margin-bottom:6px;}
.gcse-tour-title{font-family:'Playfair Display',serif;font-weight:700;font-size:19px;margin-bottom:8px;}
.gcse-tour-body{font-size:13.5px;line-height:1.55;margin-bottom:10px;}
.gcse-tour-example{display:flex;align-items:center;gap:8px;background:rgba(74,111,165,.08);
  border:1px dashed rgba(74,111,165,.4);border-radius:8px;padding:9px 11px;font-size:12.5px;margin-bottom:12px;}
.gcse-tour-example-task{justify-content:space-between;gap:10px;}
.gcse-tour-example-title{font-weight:600;}
.gcse-tour-example-chip{font-family:'DM Mono',monospace;font-size:11px;color:#2d7a4f;white-space:nowrap;}
.gcse-tour-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.gcse-tour-skip{background:none;border:none;color:var(--mid,#5a6e7f);font-size:12.5px;cursor:pointer;padding:6px 4px;}
.gcse-tour-skip:hover{color:var(--ink,#1a2332);text-decoration:underline;}
.gcse-tour-next{background:var(--ink,#0f1923);color:var(--paper,#f5f0e8);border:none;padding:9px 18px;
  border-radius:7px;font-family:'DM Sans',sans-serif;font-weight:600;font-size:13px;cursor:pointer;}
.gcse-tour-next:hover{background:#1c2c3d;}
.gcse-tour-replay{background:none;border:1px dashed rgba(255,255,255,.35);color:var(--paper,#f5f0e8);
  font-family:'DM Mono',monospace;font-size:11px;padding:6px 12px;border-radius:99px;cursor:pointer;}
.gcse-tour-replay:hover{border-color:var(--gold,#d4a843);color:var(--gold,#d4a843);}
@media (max-width:520px){
  .gcse-tour-card{left:50% !important;right:auto !important;top:auto !important;bottom:16px !important;
    transform:translateX(-50%) translateY(8px);width:calc(100vw - 32px);}
  .gcse-tour-card.show{transform:translateX(-50%) translateY(0);}
}
    `;
    document.head.appendChild(s);
}

let _tourIndex = 0;
let _tourOverlay = null;
let _tourCard = null;
let _tourSpotlighted = null;
let _tourOnKey = null;
let _tourScrollRAF = null;
let _tourScrollTimer = null;
let _tourNavigatingAway = false;

function _tourStopTrackingScroll() {
    if (_tourScrollRAF) cancelAnimationFrame(_tourScrollRAF);
    if (_tourScrollTimer) clearTimeout(_tourScrollTimer);
    _tourScrollRAF = null;
    _tourScrollTimer = null;
}

// A smooth scrollIntoView animates for a few hundred ms — position the
// card every frame while that's happening, so it doesn't get measured
// against the target's PRE-scroll position (the "out of place" bug).
function _tourTrackScroll(target) {
    _tourStopTrackingScroll();
    const tick = () => {
        _tourPositionCard(target);
        _tourScrollRAF = requestAnimationFrame(tick);
    };
    _tourScrollRAF = requestAnimationFrame(tick);
    _tourScrollTimer = setTimeout(_tourStopTrackingScroll, 650);
}

function _tourPositionCard(target) {
    if (!_tourCard) return;
    const cardW = 320, cardH = _tourCard.offsetHeight || 200;
    const margin = 14;
    if (!target) {
        _tourCard.style.transform = 'translate(-50%,-50%)';
        _tourCard.style.top = '50%';
        _tourCard.style.left = '50%';
        return;
    }
    _tourCard.style.transform = 'none';
    const r = target.getBoundingClientRect();
    let top = r.bottom + margin;
    if (top + cardH > window.innerHeight - margin) top = r.top - cardH - margin;
    top = Math.min(Math.max(top, margin), Math.max(margin, window.innerHeight - cardH - margin));
    const left = Math.min(Math.max(margin, r.left), Math.max(margin, window.innerWidth - cardW - margin));
    _tourCard.style.top = top + 'px';
    _tourCard.style.left = left + 'px';
}

function _tourReadState() {
    try { return JSON.parse(localStorage.getItem(ONBOARDING_STATE_KEY) || 'null'); } catch (e) { return null; }
}
function _tourClearState() {
    try { localStorage.removeItem(ONBOARDING_STATE_KEY); } catch (e) {}
}
function _tourSaveState(step) {
    try { localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify({ step })); } catch (e) {}
}

// Waits (briefly, bounded) for a step's target to exist/become visible
// before rendering it — covers the async render race on a fresh page
// load (e.g. dashboard.html's task list, or a topic page's account bar
// link, both populated after a network round-trip, not at parse time).
function _tourWaitForTarget(step, cb) {
    let tries = 0;
    (function poll() {
        const t = typeof step.target === 'function' ? step.target() : null;
        if ((t && t.offsetParent !== null) || ++tries >= 15) return cb();
        setTimeout(poll, 200);
    })();
}

function _tourRenderStep(i) {
    if (_tourSpotlighted) { _tourSpotlighted.classList.remove('gcse-tour-spotlight'); _tourSpotlighted = null; }
    _tourStopTrackingScroll();

    const step = ONBOARDING_STEPS[i];
    const target = typeof step.target === 'function' ? step.target() : null;
    if (target) {
        target.classList.add('gcse-tour-spotlight');
        _tourSpotlighted = target;
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        _tourTrackScroll(target);
    }

    const isLast = i === ONBOARDING_STEPS.length - 1;
    const navUrl = step.navTo ? step.navTo() : null;
    const nextLabel = navUrl ? (step.navLabel || 'Continue →') : (isLast ? 'Done' : 'Next →');

    _tourCard.innerHTML = `
        <div class="gcse-tour-step">Step ${i + 1} of ${ONBOARDING_STEPS.length}</div>
        <div class="gcse-tour-title">${step.title}</div>
        <div class="gcse-tour-body">${step.body}</div>
        ${step.example || ''}
        <div class="gcse-tour-actions">
            <button type="button" class="gcse-tour-skip" id="gcseTourSkip">Skip tour</button>
            <button type="button" class="gcse-tour-next" id="gcseTourNext">${nextLabel}</button>
        </div>`;
    _tourCard.querySelector('#gcseTourSkip').addEventListener('click', _tourClose);
    _tourCard.querySelector('#gcseTourNext').addEventListener('click', () => {
        if (navUrl) {
            _tourSaveState(i + 1);
            _tourNavigatingAway = true;
            location.href = navUrl;
            return;
        }
        if (isLast) return _tourClose();
        _tourIndex = i + 1;
        _tourAdvanceTo(_tourIndex);
    });
    // Position after the card's real height is known (innerHTML just changed).
    requestAnimationFrame(() => _tourPositionCard(target));
}

function _tourAdvanceTo(i) {
    _tourIndex = i;
    _tourWaitForTarget(ONBOARDING_STEPS[i], () => _tourRenderStep(i));
}

function _tourClose() {
    try { localStorage.setItem(ONBOARDING_TOUR_FLAG, '1'); } catch (e) {}
    _tourClearState();
    _tourStopTrackingScroll();
    if (_tourSpotlighted) _tourSpotlighted.classList.remove('gcse-tour-spotlight');
    if (_tourOnKey) document.removeEventListener('keydown', _tourOnKey);
    if (_tourOverlay) {
        _tourOverlay.classList.remove('show');
        const overlay = _tourOverlay, card = _tourCard;
        setTimeout(() => { overlay.remove(); if (card) card.remove(); }, 260);
    }
    _tourOverlay = null; _tourCard = null; _tourSpotlighted = null;
}

// startIndex lets a resumed tour (arriving on dashboard.html/a topic
// page mid-flow) open straight at the right step instead of step 0.
function gcseStartOnboardingTour(startIndex) {
    if (document.getElementById('gcseTourOverlay')) return; // already open
    _tourInjectStyles();

    _tourOverlay = document.createElement('div');
    _tourOverlay.className = 'gcse-tour-overlay';
    _tourOverlay.id = 'gcseTourOverlay';
    document.body.appendChild(_tourOverlay);

    _tourCard = document.createElement('div');
    _tourCard.className = 'gcse-tour-card';
    _tourCard.setAttribute('role', 'dialog');
    _tourCard.setAttribute('aria-modal', 'true');
    _tourCard.setAttribute('aria-label', 'Site tour');
    document.body.appendChild(_tourCard);

    requestAnimationFrame(() => {
        _tourOverlay.classList.add('show');
        _tourCard.classList.add('show');
    });

    _tourOnKey = e => { if (e.key === 'Escape') _tourClose(); };
    document.addEventListener('keydown', _tourOnKey);
    _tourOverlay.addEventListener('click', () => _tourClose());

    _tourAdvanceTo(startIndex || 0);
}

function _tourInjectReplayLink() {
    const nav = document.querySelector('.hero-nav');
    if (!nav || document.getElementById('gcseTourReplayBtn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'gcseTourReplayBtn';
    btn.className = 'gcse-tour-replay';
    btn.textContent = '❓ Take the tour';
    btn.addEventListener('click', () => { _tourClearState(); gcseStartOnboardingTour(0); });
    nav.appendChild(btn);
}

function _tourDetectPageKind() {
    if (document.getElementById('tabBar')) return 'topic';
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (file === 'dashboard.html') return 'dashboard';
    if (file === '' || file === 'index.html') return 'index';
    return null;
}

// Any navigation away from a page that ISN'T the tour's own "Next"
// button (closing the tab, clicking something else, going back)
// abandons an in-progress tour rather than leaving a stale step that
// would pop up unexpectedly on a later, unrelated visit.
window.addEventListener('beforeunload', () => {
    if (!_tourNavigatingAway) _tourClearState();
});

function _tourBoot() {
    let cached;
    try { cached = JSON.parse(localStorage.getItem(ONBOARDING_SESSION_KEY) || 'null'); } catch (e) { cached = null; }
    if (!cached || cached.role !== 'student') return;

    const pageKind = _tourDetectPageKind();
    if (!pageKind) return;

    const state = _tourReadState();
    if (state && ONBOARDING_STEPS[state.step] && ONBOARDING_STEPS[state.step].page === pageKind) {
        gcseStartOnboardingTour(state.step);
        return;
    }
    if (state) _tourClearState(); // stale / landed somewhere unexpected — abandon quietly

    if (pageKind !== 'index') return; // only index.html offers the replay link + auto-starts a fresh tour

    _tourInjectReplayLink();
    let seen = false;
    try { seen = !!localStorage.getItem(ONBOARDING_TOUR_FLAG); } catch (e) {}
    if (!seen) gcseStartOnboardingTour(0);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _tourBoot);
} else {
    _tourBoot();
}
