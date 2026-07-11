// ══════════════════════════════════════════════════════════════
// ACCOUNT CLUSTER (shared) — the notification slot + avatar "Hi, name"
// dropdown that appears in the header of EVERY student-facing page.
//
// This code used to live inside script.js, which only topic pages load.
// It now lives here so the standalone pages (index.html, dashboard.html,
// daily-revise.html, review-calendar.html, badges.html, task.html,
// manage-account.html, the subject index pages) can render the exact same
// cluster — one implementation, no forks.
//
//   • Topic pages: script.js loads this file dynamically (their HTML is
//     never edited) and calls _gcseInjectAccountBar() once auth resolves.
//   • Standalone pages: include <script src="/account-cluster.js"></script>
//     then set window._gcseProfile = { username, role } (and ideally
//     window._gcseSupabaseClient) and call _gcseInjectAccountBar().
//
// Mount order: #accountBar (standalone pages) → #siteNav (topic pages) →
// <header>. notifications-shared.js mounts the 🔔 bell into the
// #gcseNotifSlot this cluster creates — keep that ID stable.
// ══════════════════════════════════════════════════════════════

// HTML-escape any user-supplied text (usernames are chosen by users, so
// anything rendered via innerHTML must go through this).
function gcseEscapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

async function gcseLogout() {
    // Works both alongside script.js (which owns the canonical session
    // helpers) and standalone, where we fall back to the raw key.
    try {
        if (window._gcseSupabaseClient) await window._gcseSupabaseClient.auth.signOut();
    } catch (e) {}
    try {
        if (typeof _gcseWriteSession === 'function') _gcseWriteSession(null);
        else localStorage.removeItem('gcse_session_v1');
    } catch (e) {}
    // Clear the WP-A3 gate cookie + per-tab enrollment flag (auth-shared.js
    // isn't loaded on every page, so clear inline).
    try { document.cookie = 'vidya_at=; Path=/; Max-Age=0'; } catch (e) {}
    try { sessionStorage.removeItem('vidya_has_subjects'); } catch (e) {}
    location.replace(typeof LOGIN_PAGE === 'string' ? LOGIN_PAGE : '/login.html');
}

function _gcseInjectAccountBarStyles() {
    if (document.getElementById('gcse-account-bar-styles')) return;
    const style = document.createElement('style');
    style.id = 'gcse-account-bar-styles';
    style.textContent = `
        .gcse-profile-cluster{display:inline-flex;align-items:center;gap:10px;position:relative;font-family:'DM Sans',sans-serif;}
        .gcse-notif-slot{display:inline-flex;align-items:center;}
        .gcse-profile-btn{display:inline-flex;align-items:center;gap:9px;cursor:pointer;
            background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.22);
            border-radius:99px;padding:4px 14px 4px 5px;color:inherit;font-family:inherit;
            transition:border-color .15s,background .15s;}
        .gcse-profile-btn:hover,.gcse-profile-btn[aria-expanded="true"]{background:rgba(255,255,255,.16);border-color:var(--gold,#d4a843);}
        .gcse-avatar{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;
            width:30px;height:30px;border-radius:50%;
            background:linear-gradient(135deg,#d4a843,#b8860b);color:#1a2332;
            font-weight:700;font-size:13.5px;line-height:1;text-transform:uppercase;}
        .gcse-profile-name{font-family:'DM Mono',monospace;font-size:11.5px;color:rgba(245,240,232,.9);white-space:nowrap;}
        .gcse-profile-caret{font-size:9px;color:rgba(245,240,232,.6);transition:transform .15s;}
        .gcse-profile-btn[aria-expanded="true"] .gcse-profile-caret{transform:rotate(180deg);}
        .gcse-profile-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:230px;z-index:502;
            background:var(--card-bg,#fffcf6);border:1px solid var(--border,#c9bfaa);border-radius:12px;
            box-shadow:0 16px 44px rgba(0,0,0,.28);padding:6px;display:none;color:var(--ink,#1a2332);}
        .gcse-profile-menu.show{display:block;}
        .gcse-profile-menu .gpm-head{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--border,#c9bfaa);margin-bottom:5px;}
        .gcse-profile-menu .gpm-head .gcse-avatar{width:36px;height:36px;font-size:16px;}
        .gcse-profile-menu .gpm-who{min-width:0;}
        .gcse-profile-menu .gpm-name{font-weight:700;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .gcse-profile-menu .gpm-role{font-family:'DM Mono',monospace;font-size:10px;color:var(--mid,#5a6e7f);text-transform:capitalize;}
        .gcse-profile-menu a.gpm-item,.gcse-profile-menu button.gpm-item{display:flex;align-items:center;gap:9px;width:100%;
            padding:9px 12px;border:none;background:none;border-radius:8px;cursor:pointer;text-align:left;
            font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink,#1a2332);text-decoration:none;}
        .gcse-profile-menu a.gpm-item:hover,.gcse-profile-menu button.gpm-item:hover{background:var(--cream,#ede7d9);}
        .gcse-profile-menu .gpm-divider{border-top:1px solid var(--border,#c9bfaa);margin:5px 0;}
        .gcse-profile-menu button.gpm-logout{color:#c84b31;font-weight:600;}
        @media (max-width:520px){
            .gcse-profile-name{display:none;}
            .gcse-profile-btn{padding:4px 10px 4px 5px;}
            .gcse-profile-menu{position:fixed;top:auto;bottom:0;left:0;right:0;border-radius:14px 14px 0 0;min-width:0;}
        }
    `;
    document.head.appendChild(style);
}

// One grouped, premium account cluster used on EVERY page: a notification
// slot + an avatar "Hi, name" button that opens a dropdown with the
// role-appropriate links and Log out. Mounts into (in order of
// preference): an existing #accountBar (dashboard / manage-account /
// index), the injected #siteNav (topic pages), or the page header.
function _gcseInjectAccountBar() {
    const profile = window._gcseProfile;
    if (!profile) return;
    if (document.getElementById('gcseProfileCluster')) return;
    const mount = document.getElementById('accountBar')
        || document.getElementById('siteNav')
        || document.querySelector('header');
    if (!mount) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', _gcseInjectAccountBar);
        }
        return;
    }
    // Auth can resolve before DOMContentLoaded builds #siteNav — if only
    // the raw header exists so far, wait for the nav to get the right spot.
    if (mount.tagName === 'HEADER' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _gcseInjectAccountBar);
        return;
    }
    _gcseInjectAccountBarStyles();

    const name = profile.username || (profile.role === 'teacher' ? 'teacher' : 'student');
    const safeName = gcseEscapeHtml(name);
    const initial = gcseEscapeHtml((name.trim()[0] || '?'));
    const role = profile.role === 'teacher' ? 'teacher' : 'student';

    // Student links must carry the subject the student is currently working
    // in — a bare /daily-revise.html silently falls back to business, which
    // served economics students the wrong subject's questions. Topic pages
    // set window.SUBJECT from their own page-groups.js; root pages set it
    // via subject-loader.js; and we persist it here too so subject-less
    // pages (badges, manage-account, task) still link back correctly.
    let subjSlug = (window.SUBJECT && window.SUBJECT.slug) || null;
    try {
        if (subjSlug) localStorage.setItem('gcse_last_subject', subjSlug);
        else subjSlug = localStorage.getItem('gcse_last_subject');
    } catch (e) {}
    const subjQ = subjSlug ? '?subject=' + encodeURIComponent(subjSlug) : '';

    const items = role === 'teacher'
        ? `<a class="gpm-item" href="/teacher-dashboard.html"><span aria-hidden="true">🧑‍🏫</span> Teacher Dashboard</a>
           <a class="gpm-item" href="/teacher-classes.html"><span aria-hidden="true">📚</span> My Classes</a>
           <a class="gpm-item" href="/teacher-analytics.html"><span aria-hidden="true">🎯</span> Daily Revise</a>
           <a class="gpm-item" href="/teacher-tasks.html"><span aria-hidden="true">📋</span> Tasks &amp; Worksheets</a>
           <a class="gpm-item" href="/teacher-calendar.html"><span aria-hidden="true">🗓️</span> Calendar</a>
           <a class="gpm-item" href="/manage-account.html"><span aria-hidden="true">⚙️</span> Manage account</a>`
        : `<a class="gpm-item" href="/dashboard.html${subjQ}"><span aria-hidden="true">📊</span> My Progress</a>
           <a class="gpm-item" href="${subjSlug ? '/subjects/' + encodeURIComponent(subjSlug) + '/index.html' : '/index.html'}"><span aria-hidden="true">🏡</span> All Topics</a>
           <a class="gpm-item" href="/index.html"><span aria-hidden="true">🗂️</span> My Subjects</a>
           <a class="gpm-item" href="/daily-revise.html${subjQ}"><span aria-hidden="true">🎯</span> Daily Revise</a>
           <a class="gpm-item" href="/dashboard.html${subjQ}#tasksSection"><span aria-hidden="true">📋</span> Tasks</a>
           <a class="gpm-item" href="/review-calendar.html${subjQ}"><span aria-hidden="true">🗓️</span> Calendar</a>
           <a class="gpm-item" href="/manage-account.html"><span aria-hidden="true">⚙️</span> Manage account</a>`;

    const cluster = document.createElement('span');
    cluster.id = 'gcseProfileCluster';
    cluster.className = 'gcse-profile-cluster';
    cluster.innerHTML = `
        <span class="gcse-notif-slot" id="gcseNotifSlot"></span>
        <button type="button" class="gcse-profile-btn" aria-haspopup="true" aria-expanded="false">
            <span class="gcse-avatar" aria-hidden="true">${initial}</span>
            <span class="gcse-profile-name">Hi, <strong>${safeName}</strong></span>
            <span class="gcse-profile-caret" aria-hidden="true">▼</span>
        </button>
        <div class="gcse-profile-menu" role="menu" aria-label="Account">
            <div class="gpm-head">
                <span class="gcse-avatar" aria-hidden="true">${initial}</span>
                <div class="gpm-who">
                    <div class="gpm-name">${safeName}</div>
                    <div class="gpm-role">${role}</div>
                </div>
            </div>
            ${items}
            <div class="gpm-divider" role="separator"></div>
            <button type="button" class="gpm-item gpm-logout gcse-logout-btn"><span aria-hidden="true">↪</span> Log out</button>
        </div>`;
    mount.appendChild(cluster);

    const btn = cluster.querySelector('.gcse-profile-btn');
    const menu = cluster.querySelector('.gcse-profile-menu');
    btn.addEventListener('click', e => {
        e.stopPropagation();
        const willShow = !menu.classList.contains('show');
        menu.classList.toggle('show', willShow);
        btn.setAttribute('aria-expanded', String(willShow));
    });
    document.addEventListener('click', e => {
        if (!cluster.contains(e.target)) {
            menu.classList.remove('show');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            menu.classList.remove('show');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
    cluster.querySelector('.gcse-logout-btn').addEventListener('click', gcseLogout);

    // The sound toggle joins the dropdown so the header stays uncluttered —
    // and the nav-level copy (added by initSiteNav for logged-out visitors)
    // is removed so there is only ever one.
    if (typeof gamificationCreateSoundButton === 'function' && !menu.querySelector('.gpm-sound')) {
        try {
            const navSound = document.querySelector('#siteNav > button[title="Toggle sound effects"]');
            if (navSound) navSound.remove();
            const soundBtn = gamificationCreateSoundButton('gpm-item gpm-sound');
            const lbl = document.createElement('span');
            lbl.textContent = ' Sound effects';
            soundBtn.appendChild(lbl);
            // Re-append the label after each toggle repaint (paint() replaces textContent)
            soundBtn.addEventListener('click', () => {
                if (!soundBtn.querySelector('span')) {
                    const l = document.createElement('span');
                    l.textContent = ' Sound effects';
                    soundBtn.appendChild(l);
                }
            });
            menu.insertBefore(soundBtn, menu.querySelector('.gpm-divider'));
        } catch (e) {}
    }
}
