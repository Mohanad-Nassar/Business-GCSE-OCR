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
        { href: 'teacher-calendar.html', icon: '🗓️', label: 'Calendar', scoped: false },
    ];

    function injectStyles() {
        if (document.getElementById('teacher-nav-styles')) return;
        var style = document.createElement('style');
        style.id = 'teacher-nav-styles';
        style.textContent = [
            '.teacher-nav{background:var(--ink,#1a2332);border-bottom:1px solid rgba(255,255,255,.12);',
            'padding:0 40px;position:sticky;top:0;z-index:40;}',
            '.teacher-nav-inner{display:flex;gap:6px;flex-wrap:wrap;max-width:1250px;margin:0 auto;}',
            '.teacher-nav a{display:inline-flex;align-items:center;gap:7px;text-decoration:none;',
            "font-family:'DM Mono',monospace;font-size:11.5px;letter-spacing:.04em;",
            'color:rgba(245,240,232,.72);padding:11px 14px;border-bottom:2px solid transparent;',
            'white-space:nowrap;transition:color .15s,border-color .15s;}',
            '.teacher-nav a:hover{color:var(--paper,#f5f0e8);}',
            '.teacher-nav a.active{color:var(--paper,#f5f0e8);border-bottom-color:var(--accent,#d4a843);font-weight:500;}',
            '.teacher-nav a .tn-ic{font-size:13px;}',
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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', build);
    } else {
        build();
    }
})();
