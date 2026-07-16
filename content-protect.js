// ══════════════════════════════════════════════════════════════
// CONTENT PROTECTION (WP-A8) — casual-copy deterrents for STUDENT
// content pages.
//
// HONEST SCOPE: client-side JS cannot truly stop screenshots, DevTools
// or a determined scraper — the durable protection is server-side auth
// gating + rate limits (done elsewhere). This file only raises the effort
// for CASUAL copying, and never at the cost of accessibility:
//   • NO DevTools blanking/blurring, NO global keydown traps, nothing
//     that touches Ctrl+F / arrows / Tab — screen readers and keyboard
//     navigation keep working.
//   • Answer boxes (input/textarea/contenteditable) are always fully
//     selectable and typeable; the exam paste-guard in
//     notifications-shared.js still owns paste behaviour there.
//
// Loaded ONLY for student sessions: on topic pages it is injected by
// script.js after auth resolves (never edits topic HTML); on the
// standalone student pages (daily-revise / review-calendar / task /
// badges) it is a plain <script> include. No-ops for teachers, logged-out
// visitors, and when the platform_settings `content_protect` flag is off.
//
// Every listener / network call is wrapped so a thrown error can never
// break the page.
// ══════════════════════════════════════════════════════════════
(function () {
    'use strict';

    if (window.__gcseContentProtectLoaded) return; // never run twice
    window.__gcseContentProtectLoaded = true;

    var SESSION_KEY = 'gcse_session_v1';

    // Content whose text we discourage copying. Answer boxes are
    // deliberately NOT here — see EDITABLE_SELECTOR below.
    var CONTENT_SELECTOR = [
        '.topic-content',                         // topic-page learning notes
        '.case-study',                            // daily-revise / review-calendar case study
        '.case-study-box', '.case-study-text',    // topic-page case study
        '.qtext',                                 // daily-revise / review-calendar question text
        '.reading-card',                          // task.html reading extract
        '.fc-front', '.fc-back'                   // flashcard faces
    ].join(',');

    // Never interfere with anything a student types or (where the exam
    // paste-guard already allows it) pastes into their OWN answer box.
    var EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

    function readSession() {
        try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
        catch (e) { return null; }
    }

    // ── Guard: student sessions only. Teachers (even previewing) and
    // logged-out visitors get nothing. ──
    var _session = readSession();
    if (!_session || _session.role !== 'student') return;

    var _active = false;
    var _listenersBound = false;
    var _copyLoggedAt = 0;         // throttle copy_blocked to ≤ 1/min
    var _devtoolsLogged = false;   // devtools_opened fires at most once/session

    function client() {
        try { return window._gcseSupabaseClient || null; } catch (e) { return null; }
    }

    // Same page id the page's own progress writes use, so the teacher sees
    // one consistent name. Mirrors _guardPageId() in notifications-shared.js.
    function pageId() {
        try { if (typeof getPageId === 'function') return getPageId(); } catch (e) {}
        try {
            var path = location.pathname;
            if (/\/task\.html$/.test(path)) {
                var m = location.search.match(/[?&]id=([^&]+)/);
                if (m) return 'task:' + decodeURIComponent(m[1]);
            }
            return path.split('/').pop().replace('.html', '') || 'unknown';
        } catch (e) { return 'unknown'; }
    }

    // Best-effort integrity log. Silent no-op when logged out / offline —
    // exactly like the paste-guard, the deterrent still applies locally.
    function logEvent(context, detail) {
        try {
            var c = client();
            if (!c) return;
            c.rpc('record_integrity_event', {
                p_page_id: pageId(),
                p_context: context,
                p_detail: detail || {}
            }).then(function (res) {
                if (res && res.error) { try { console.error('record_integrity_event', res.error); } catch (e) {} }
            }, function () {});
        } catch (e) {}
    }

    // ── Block copy / cut / contextmenu / dragstart on protected content ──
    function onProtectEvent(e) {
        try {
            var t = e.target;
            if (!t || !t.closest) return;
            if (t.closest(EDITABLE_SELECTOR)) return;   // answer boxes stay free
            if (!t.closest(CONTENT_SELECTOR)) return;   // only protected content
            e.preventDefault();
            if (e.type === 'copy' || e.type === 'cut') {
                var now = Date.now();
                if (now - _copyLoggedAt < 60000) return; // ≤ 1 log per minute
                _copyLoggedAt = now;
                logEvent('copy_blocked', { page: pageId() });
            }
        } catch (err) {}
    }

    function bindListeners() {
        if (_listenersBound) return;
        _listenersBound = true;
        ['copy', 'cut', 'contextmenu', 'dragstart'].forEach(function (evt) {
            document.addEventListener(evt, onProtectEvent, true); // capture, before per-node handlers
        });
    }
    function unbindListeners() {
        if (!_listenersBound) return;
        _listenersBound = false;
        ['copy', 'cut', 'contextmenu', 'dragstart'].forEach(function (evt) {
            document.removeEventListener(evt, onProtectEvent, true);
        });
    }

    // (The username watermark that used to be built here was removed
    // 2026-07-12 by request — it competed with the theme backgrounds and
    // added little: the durable protection remains server-side auth.
    // deactivate() still removes any #gcseWatermark a cached page built.)

    // Print notice element. It is display:none on screen and only shown in
    // @media print (rule lives in style.css / business-style.css, gated on
    // body.gcse-protected). aria-hidden so it is never read aloud on screen.
    function buildPrintNotice() {
        if (document.getElementById('gcsePrintNotice')) return;
        var d = document.createElement('div');
        d.id = 'gcsePrintNotice';
        d.className = 'gcse-print-notice';
        d.setAttribute('aria-hidden', 'true');
        d.textContent = 'Printing is disabled — study on the site.';
        document.body.appendChild(d);
    }

    // ── DevTools heuristic: ONE light, passive check (outer/inner size
    // delta) — never a loop, never a `debugger` pause. On detection we ONLY
    // log an integrity event: no blank, blur, redirect or alert. A false
    // positive costs a single silent log, nothing the student can feel. ──
    function devtoolsLikelyOpen() {
        try {
            var wGap = (window.outerWidth || 0) - (window.innerWidth || 0);
            var hGap = (window.outerHeight || 0) - (window.innerHeight || 0);
            // 200px clears normal browser chrome (tabs/address/bookmarks bar)
            // while docked DevTools adds far more (~300px+ / a side panel).
            return wGap > 200 || hGap > 200;
        } catch (e) { return false; }
    }
    function runDevtoolsCheck() {
        try {
            if (_devtoolsLogged) return;
            if (!devtoolsLikelyOpen()) return;
            _devtoolsLogged = true;
            logEvent('devtools_opened', {
                w: (window.outerWidth || 0) - (window.innerWidth || 0),
                h: (window.outerHeight || 0) - (window.innerHeight || 0)
            });
        } catch (e) {}
    }
    function scheduleDevtoolsCheck() {
        try {
            // One check shortly after load, plus a single self-removing
            // resize check (covers "opened after load"). Neither is a loop;
            // both are gated by _devtoolsLogged so it fires once per session.
            setTimeout(runDevtoolsCheck, 1500);
            var onResizeOnce = function () {
                try { window.removeEventListener('resize', onResizeOnce); } catch (e) {}
                runDevtoolsCheck();
            };
            window.addEventListener('resize', onResizeOnce);
        } catch (e) {}
    }

    function activate() {
        if (_active) return;
        _active = true;
        try { document.body.classList.add('gcse-protected'); } catch (e) {} // gates the stylesheet rules
        buildPrintNotice();
        bindListeners();
        scheduleDevtoolsCheck();
    }

    function deactivate() {
        try {
            _active = false;
            unbindListeners();
            document.body.classList.remove('gcse-protected');
            ['gcseWatermark', 'gcsePrintNotice', 'gcseProtectStyles'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el && el.parentNode) el.parentNode.removeChild(el);
            });
        } catch (e) {}
    }

    // Best-effort feature flag. Protection is ON by default and applied
    // immediately — we only ever TEAR DOWN, and only when the query
    // explicitly returns content_protect = off. A missing client, a failed
    // lookup or an unknown key all leave protection ON (never disable the
    // page on a failed lookup). The client is set up asynchronously on the
    // standalone pages, so poll briefly.
    function checkFlag(tries) {
        tries = tries || 0;
        var c = client();
        if (!c) {
            if (tries < 15) setTimeout(function () { checkFlag(tries + 1); }, 400);
            return;
        }
        try {
            c.from('platform_settings').select('value').eq('key', 'content_protect').maybeSingle()
                .then(function (res) {
                    try {
                        if (!res || res.error || !res.data) return; // unknown → stay ON
                        var v = res.data.value;
                        if (v === false || v === 'false' || v === 0 || v === 'off') deactivate();
                    } catch (e) {}
                }, function () {}); // rejected → stay ON
        } catch (e) {}
    }

    function boot() {
        try {
            if (!document.body) return;
            activate();   // default ON — do not wait on the flag
            checkFlag();  // best-effort; may later tear down
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
