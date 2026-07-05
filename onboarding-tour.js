// ══════════════════════════════════════════════════════════════
// NEW-STUDENT ONBOARDING TOUR — index.html only. A 5-step guided
// walkthrough (HUD → notifications bell → topics → tasks → account),
// shown automatically once per browser for a student account, with a
// small "❓ Take the tour" link to replay it any time.
//
// Loaded after gamification.js and notifications-shared.js (both of
// which build their DOM synchronously inside a DOMContentLoaded
// handler registered earlier in the document) so every step's target
// element already exists by the time this file's own DOMContentLoaded
// handler runs — no polling needed, unlike notifications-shared.js's
// async client lookup.
//
// Animation idiom copied from gamification.js's _gamShowTopicCelebration
// (fade-in overlay via a .show class, role=dialog, Escape/click-outside
// to close) — kept calmer here (no confetti/sound).
// ══════════════════════════════════════════════════════════════

const ONBOARDING_TOUR_FLAG = 'gcse_onboarding_tour_seen_v1';
const ONBOARDING_SESSION_KEY = 'gcse_session_v1';

const ONBOARDING_STEPS = [
    {
        target: () => document.getElementById('gamHudMount'),
        title: 'Welcome! 👋',
        body: 'This is your <strong>Level</strong>, <strong>XP</strong> and <strong>🔥 streak</strong> — they grow every time you answer a question. Let’s take a 30-second look around.',
    },
    {
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
        target: () => document.querySelector('.gam-continue') || document.querySelector('.topic-card') || document.getElementById('mainContent'),
        title: 'Pick up where you left off',
        body: 'The gold card jumps straight back into your most recent topic, and every topic below is one click away — click any card to start revising.',
    },
    {
        target: () => document.querySelector('.hero-nav a[href="dashboard.html"]'),
        title: 'Tasks & marks',
        body: 'When your teacher sets a task, it (and its result once marked) appears on your <strong>Dashboard</strong>. For example:',
        example: `
            <div class="gcse-tour-example gcse-tour-example-task">
                <span class="gcse-tour-example-title">Break-even analysis</span>
                <span class="gcse-tour-example-chip">✅ Marked — 8/10 (80%)</span>
            </div>`,
    },
    {
        target: () => document.getElementById('manageAccountLink'),
        title: 'Your account',
        body: 'Manage your account details and change your password any time from here.',
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

function _tourPositionCard(target) {
    if (!_tourCard) return;
    const cardRect = { w: 320, h: _tourCard.offsetHeight || 200 };
    if (!target) {
        _tourCard.style.top = '50%';
        _tourCard.style.left = '50%';
        _tourCard.style.transform = 'translate(-50%,-50%)';
        return;
    }
    _tourCard.style.transform = 'none';
    const r = target.getBoundingClientRect();
    const margin = 14;
    let top = r.bottom + margin;
    if (top + cardRect.h > window.innerHeight - margin) top = Math.max(margin, r.top - cardRect.h - margin);
    let left = Math.min(Math.max(margin, r.left), window.innerWidth - cardRect.w - margin);
    _tourCard.style.top = top + 'px';
    _tourCard.style.left = left + 'px';
}

function _tourShowStep(i) {
    if (_tourSpotlighted) { _tourSpotlighted.classList.remove('gcse-tour-spotlight'); _tourSpotlighted = null; }
    const step = ONBOARDING_STEPS[i];
    const target = typeof step.target === 'function' ? step.target() : null;
    if (target) {
        target.classList.add('gcse-tour-spotlight');
        _tourSpotlighted = target;
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    const isLast = i === ONBOARDING_STEPS.length - 1;
    _tourCard.innerHTML = `
        <div class="gcse-tour-step">Step ${i + 1} of ${ONBOARDING_STEPS.length}</div>
        <div class="gcse-tour-title">${step.title}</div>
        <div class="gcse-tour-body">${step.body}</div>
        ${step.example || ''}
        <div class="gcse-tour-actions">
            <button type="button" class="gcse-tour-skip" id="gcseTourSkip">Skip tour</button>
            <button type="button" class="gcse-tour-next" id="gcseTourNext">${isLast ? 'Done' : 'Next →'}</button>
        </div>`;
    _tourCard.querySelector('#gcseTourSkip').addEventListener('click', _tourClose);
    _tourCard.querySelector('#gcseTourNext').addEventListener('click', () => {
        if (isLast) return _tourClose();
        _tourIndex++;
        _tourShowStep(_tourIndex);
    });
    // Position after the card's real height is known (innerHTML just changed).
    requestAnimationFrame(() => _tourPositionCard(target));
}

function _tourClose() {
    try { localStorage.setItem(ONBOARDING_TOUR_FLAG, '1'); } catch (e) {}
    if (_tourSpotlighted) _tourSpotlighted.classList.remove('gcse-tour-spotlight');
    if (_tourOnKey) document.removeEventListener('keydown', _tourOnKey);
    if (_tourOverlay) {
        _tourOverlay.classList.remove('show');
        const overlay = _tourOverlay, card = _tourCard;
        setTimeout(() => { overlay.remove(); if (card) card.remove(); }, 260);
    }
    _tourOverlay = null; _tourCard = null; _tourSpotlighted = null;
}

function gcseStartOnboardingTour() {
    if (document.getElementById('gcseTourOverlay')) return; // already open
    _tourInjectStyles();
    _tourIndex = 0;

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

    _tourShowStep(0);
}

function _tourInjectReplayLink() {
    const nav = document.querySelector('.hero-nav');
    if (!nav || document.getElementById('gcseTourReplayBtn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'gcseTourReplayBtn';
    btn.className = 'gcse-tour-replay';
    btn.textContent = '❓ Take the tour';
    btn.addEventListener('click', gcseStartOnboardingTour);
    nav.appendChild(btn);
}

function _tourBoot() {
    let cached;
    try { cached = JSON.parse(localStorage.getItem(ONBOARDING_SESSION_KEY) || 'null'); } catch (e) { cached = null; }
    if (!cached || cached.role !== 'student') return;

    _tourInjectReplayLink();

    let seen = false;
    try { seen = !!localStorage.getItem(ONBOARDING_TOUR_FLAG); } catch (e) {}
    if (!seen) gcseStartOnboardingTour();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _tourBoot);
} else {
    _tourBoot();
}
