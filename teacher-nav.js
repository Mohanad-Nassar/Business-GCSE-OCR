// ══════════════════════════════════════════════════════════════
// TEACHER NAV (shared) — one consistent link bar across every
// teacher-facing page. Teacher pages don't use the student account
// dropdown (account-cluster.js); they navigate through a horizontal
// nav bar in the dark header. This file is the single source of that
// bar so the same links (and the same active-page highlight) appear
// on teacher-dashboard, teacher-classes, teacher-analytics,
// teacher-tasks, teacher-worksheets and teacher-calendar.
//
// Usage: add <script src="/teacher-nav.js"></script> near the end of
// a teacher page's <body>. The bar injects itself right after the
// page's <header>, so no per-page markup is needed.
//
// The current ?class= param (when present) is carried across to the
// class-scoped destinations so opening e.g. Daily Revise keeps you on
// the class you were already looking at — "links take you there".
// ══════════════════════════════════════════════════════════════

// ── SITE THEME BOOTSTRAP — teacher-worksheets.html is the one page that
// doesn't load footer-legal.js (which normally carries this), so the same
// guarded loader lives here too. Double-inclusion is a no-op. ──
(function () {
    try {
        // No saved choice → the site default (aurora). Keep in sync with
        // DEFAULT_THEME in theme.js. An explicit 'classic' pick stays classic.
        var t = localStorage.getItem('gcse_theme') || 'aurora';
        if (t !== 'classic') document.documentElement.setAttribute('data-theme', t);
        var b = localStorage.getItem('gcse_bg');
        if (b && b !== 'none') document.documentElement.setAttribute('data-bg', b);
    } catch (e) { /* private mode — default theme */ }
    if (!window.__gcseThemeInit && !document.querySelector('script[data-gcse-theme]')) {
        var s = document.createElement('script');
        s.src = '/theme.js';
        s.setAttribute('data-gcse-theme', '1');
        document.head.appendChild(s);
    }
    if (!window.__gcseMotionInit && !document.querySelector('script[data-gcse-motion]')) {
        var m = document.createElement('script');
        m.src = '/site-motion.js';
        m.setAttribute('data-gcse-motion', '1');
        document.head.appendChild(m);
    }
})();

(function () {
    'use strict';

    // basename → true when this is the page we're on. Marks that link active.
    var here = (location.pathname.split('/').pop() || 'teacher-dashboard.html').toLowerCase();

    // Class context to preserve, if any (e.g. arrived via ...?class=<uuid>).
    var classParam = new URLSearchParams(location.search).get('class');
    var withClass = function (href, scoped) {
        return (scoped && classParam) ? href + '?class=' + encodeURIComponent(classParam) : href;
    };

    // scoped:true links accept a ?class= and get the current one appended.
    var LINKS = [
        { href: 'teacher-dashboard.html', icon: '🏫', label: 'Dashboard', scoped: false },
        { href: 'teacher-classes.html', icon: '📚', label: 'My Classes', scoped: false },
        { href: 'teacher-analytics.html', icon: '🎯', label: 'Daily Revise', scoped: true },
        { href: 'teacher-tasks.html', icon: '📋', label: 'Tasks', scoped: true },
        { href: 'teacher-worksheets.html', icon: '🖨️', label: 'Worksheets', scoped: true },
        { href: 'leaderboard.html', icon: '🏆', label: 'Leaderboard', scoped: false },
        { href: 'teacher-subjects.html', icon: '📖', label: 'My Content', scoped: false },
        { href: 'teacher-calendar.html', icon: '🗓️', label: 'Calendar', scoped: false },
        { href: 'teacher-notifications.html', icon: '✅', label: 'To-Do', scoped: false },
    ];

    function injectStyles() {
        if (document.getElementById('teacher-nav-styles')) return;
        var style = document.createElement('style');
        style.id = 'teacher-nav-styles';
        style.textContent = [
            '.teacher-nav{background:var(--chrome, var(--ink,#1a2332));border-bottom:1px solid rgba(255,255,255,.12);',
            'padding:0 40px;position:sticky;top:0;z-index:40;}',
            '.teacher-nav-inner{display:flex;gap:6px;flex-wrap:wrap;max-width:1250px;margin:0 auto;}',
            '.teacher-nav a{display:inline-flex;align-items:center;gap:7px;text-decoration:none;',
            "font-family:'DM Mono',monospace;font-size:11.5px;letter-spacing:.04em;",
            'color:rgba(245,240,232,.72);padding:11px 14px;border-bottom:2px solid transparent;',
            'white-space:nowrap;transition:color .15s,border-color .15s;}',
            '.teacher-nav a:hover{color:var(--chrome-text, var(--paper,#f5f0e8));}',
            '.teacher-nav a.active{color:var(--chrome-text, var(--paper,#f5f0e8));border-bottom-color:var(--accent,#d4a843);font-weight:500;}',
            '.teacher-nav a .tn-ic{font-size:13px;}',
            // business-style.css gives header{z-index:10} at ≥900px (for the
            // topic-page grid, which teacher pages disable). That turns the
            // header into a stacking context and TRAPS the injected profile
            // dropdown (z:502) / bell panel (z:501) BELOW this sticky nav
            // (z:40) — the nav then paints over the middle of the open menu.
            // Teacher pages don't use that grid, so clear it: the panels then
            // escape to the root stacking context and paint above the nav, per
            // the z-index ladder in style.css.
            'header:has(#accountBar){z-index:auto;}',
            '@media (max-width:640px){.teacher-nav{padding:0 14px;}.teacher-nav a{padding:10px 10px;font-size:11px;}',
            '.teacher-nav a .tn-lbl{display:none;}.teacher-nav a .tn-ic{font-size:16px;}}',
        ].join('');
        document.head.appendChild(style);
    }

    function build() {
        if (document.getElementById('teacherNav')) return;
        var header = document.querySelector('header');
        if (!header) return;
        injectStyles();

        var nav = document.createElement('nav');
        nav.id = 'teacherNav';
        nav.className = 'teacher-nav';
        nav.setAttribute('aria-label', 'Teacher navigation');
        nav.innerHTML = '<div class="teacher-nav-inner">' + LINKS.map(function (l) {
            var active = (l.href.toLowerCase() === here) ? ' active' : '';
            return '<a class="' + 'tn-link' + active + '" href="' + withClass(l.href, l.scoped) + '"' +
                (active ? ' aria-current="page"' : '') + '>' +
                '<span class="tn-ic" aria-hidden="true">' + l.icon + '</span>' +
                '<span class="tn-lbl">' + l.label + '</span></a>';
        }).join('') + '</div>';

        header.parentNode.insertBefore(nav, header.nextSibling);
        buildAccountCluster(header);
        maybeAddOwnerLink(nav);
    }

    // The admin page (admin.html) is for the platform owner AND any school
    // admin, so its nav link must not show to ordinary teachers. We ask the
    // server, via the am_i_admin RPC (school-admin.sql), whether the caller is
    // an owner or a school_admin of any school, and append the link if so —
    // appears on every teacher page for those users. If school-admin.sql hasn't
    // been run yet the RPC 404s and we simply show no link (fail safe).
    var NAV_SUPABASE_URL = 'https://eaohjlyiotyqhvsizcpw.supabase.co';
    var NAV_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb2hqbHlpb3R5cWh2c2l6Y3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzUzMDksImV4cCI6MjA5ODc1MTMwOX0.lHF4OUiTT3G_fzlXvXI_4QMu48o6eEnq0hWw6K1uBAk';
    function maybeAddOwnerLink(nav) {
        var cached = null;
        try { cached = JSON.parse(localStorage.getItem('gcse_session_v1') || 'null'); } catch (e) {}
        if (!cached || cached.role !== 'teacher' || !cached.access_token) return;
        fetch(NAV_SUPABASE_URL + '/rest/v1/rpc/am_i_admin', {
            method: 'POST',
            headers: { apikey: NAV_SUPABASE_ANON_KEY, Authorization: 'Bearer ' + cached.access_token, 'Content-Type': 'application/json' },
            body: '{}',
        }).then(function (r) { return r.ok ? r.json() : null; }).then(function (info) {
            if (!info) return;
            var isAdmin = info.is_owner || (info.schools && info.schools.length > 0);
            if (!isAdmin) return;
            var inner = nav.querySelector('.teacher-nav-inner');
            if (!inner || inner.querySelector('[data-owner-link]')) return;
            var active = here === 'admin.html' ? ' active' : '';
            var a = document.createElement('a');
            a.className = 'tn-link' + active;
            a.setAttribute('data-owner-link', '1');
            a.href = 'admin.html';
            if (active) a.setAttribute('aria-current', 'page');
            a.innerHTML = '<span class="tn-ic" aria-hidden="true">🏫</span><span class="tn-lbl">Admin</span>';
            inner.appendChild(a);
        }).catch(function () { /* offline / RLS denied — just no link */ });
    }

    // ── Header account cluster — the SAME avatar "Hi, name" dropdown +
    // notification-slot students get (account-cluster.js), so teacher and
    // student headers look identical. A .site-band top row (styled by
    // business-style.css, which every teacher page links) is injected as
    // the header's first child carrying the brand link + #accountBar mount;
    // account-cluster.js and notifications-shared.js (the 🔔 bell, which
    // derives teacher notes: submissions to mark, pending topic-access
    // requests) are loaded on demand so no per-page <script> tags are
    // needed. ──
    function loadScriptOnce(src, marker) {
        return new Promise(function (resolve) {
            if (marker()) return resolve();
            var existing = document.querySelector('script[src="' + src + '"]');
            if (existing) { existing.addEventListener('load', resolve); existing.addEventListener('error', resolve); return; }
            var s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = resolve;
            document.head.appendChild(s);
        });
    }

    function buildAccountCluster(header) {
        var cached = null;
        try { cached = JSON.parse(localStorage.getItem('gcse_session_v1') || 'null'); } catch (e) {}
        if (!cached || cached.role !== 'teacher') return;

        // The site-band top row (brand + account mount). teacher-dashboard
        // used to carry its own #accountBar div — any existing one is reused
        // as the mount instead of injecting a second band.
        if (!document.getElementById('accountBar')) {
            var band = document.createElement('nav');
            band.className = 'site-band';
            band.setAttribute('aria-label', 'Site');
            band.innerHTML = '<a class="sb-brand" href="/hub.html"><span aria-hidden="true">🏡</span> Site Home</a>' +
                '<span class="gcse-account-bar" id="accountBar"></span>';
            header.insertBefore(band, header.firstChild);
        }

        window._gcseProfile = window._gcseProfile || { username: cached.username, role: 'teacher' };
        loadScriptOnce('/account-cluster.js', function () { return typeof window._gcseInjectAccountBar === 'function'; })
            .then(function () {
                if (typeof window._gcseInjectAccountBar === 'function') window._gcseInjectAccountBar();
                // Bell second: it mounts into the #gcseNotifSlot the cluster creates.
                return loadScriptOnce('/notifications-shared.js', function () { return typeof window.deriveStudentNotifications === 'function'; });
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
