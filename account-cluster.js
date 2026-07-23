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
    // Clear the WP-A3 gate cookie + per-tab caches (auth-shared.js isn't
    // loaded on every page, so clear inline).
    try { document.cookie = 'vidya_at=; Path=/; Max-Age=0'; } catch (e) {}
    try { sessionStorage.removeItem('vidya_has_subjects'); } catch (e) {}
    try { sessionStorage.removeItem('vidya_entitlements_v1'); } catch (e) {}
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
        .gcse-profile-menu .gpm-section-label{font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--mid,#5a6e7f);padding:7px 12px 3px;}
        .gcse-profile-menu .gpm-subject-switch{padding:3px 12px 9px;}
        .gcse-profile-menu .gpm-subject-select{width:100%;appearance:none;-webkit-appearance:none;
            background:var(--cream,#ede7d9) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'><path d='M1 1l4 4 4-4' stroke='%235a6e7f' stroke-width='1.6' fill='none' stroke-linecap='round'/></svg>") no-repeat right 12px center;
            border:1px solid var(--border,#c9bfaa);border-radius:8px;padding:9px 30px 9px 12px;cursor:pointer;
            font-family:'DM Sans',sans-serif;font-size:13px;color:var(--ink,#1a2332);}
        .gcse-profile-menu .gpm-subject-select:hover{border-color:var(--accent,#4a6fa5);}
        .gcse-profile-menu button.gpm-logout{color:#c84b31;font-weight:600;}
        /* Art mode: the equipped avatar (WP-3) replaces the initial letter. The
           bust crop is square, so it fills the circle; a neutral ground shows
           through characters whose background cosmetic is "none". */
        .gcse-avatar.gcse-avatar-art{background:#e9edf3;padding:0;overflow:hidden;}
        .gcse-avatar.gcse-avatar-art svg{width:100%;height:100%;display:block;}
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

    // Page-specific menu links (e.g. a subject's "Mock Exams" page). A host
    // page sets window._gcseExtraMenuItems = [{ href, icon, label }] before
    // calling _gcseInjectAccountBar(); they appear at the top of the menu so
    // the header itself can stay down to just the bell + this profile button.
    const extras = Array.isArray(window._gcseExtraMenuItems) ? window._gcseExtraMenuItems : [];
    const extraItems = extras.map(e =>
        `<a class="gpm-item" href="${gcseEscapeHtml(e.href || '#')}"><span aria-hidden="true">${gcseEscapeHtml(e.icon || '📄')}</span> ${gcseEscapeHtml(e.label || '')}</a>`
    ).join('');

    const items = role === 'teacher'
        ? `<a class="gpm-item" href="/teacher-dashboard.html"><span aria-hidden="true">🧑‍🏫</span> Teacher Dashboard</a>
           <a class="gpm-item" href="/teacher-classes.html"><span aria-hidden="true">📚</span> My Classes</a>
           <a class="gpm-item" href="/teacher-analytics.html"><span aria-hidden="true">🎯</span> Daily Revise</a>
           <a class="gpm-item" href="/teacher-tasks.html"><span aria-hidden="true">📋</span> Tasks &amp; Worksheets</a>
           <a class="gpm-item" href="/teacher-calendar.html"><span aria-hidden="true">🗓️</span> Calendar</a>
           <a class="gpm-item" href="/manage-account.html"><span aria-hidden="true">⚙️</span> Manage account</a>`
        : `<a class="gpm-item" href="/dashboard.html${subjQ}"><span aria-hidden="true">📊</span> My Progress</a>
           <a class="gpm-item" href="${subjSlug ? '/subjects/' + encodeURIComponent(subjSlug) + '/index.html' : '/hub.html'}"><span aria-hidden="true">🏡</span> All Topics</a>
           <a class="gpm-item" href="/hub.html"><span aria-hidden="true">🗂️</span> My Subjects</a>
           <a class="gpm-item" href="/daily-revise.html${subjQ}"><span aria-hidden="true">🎯</span> Daily Revise</a>
           <a class="gpm-item" href="/tasks.html${subjQ}"><span aria-hidden="true">📋</span> Tasks</a>
           <a class="gpm-item" href="/review-calendar.html${subjQ}"><span aria-hidden="true">🗓️</span> Calendar</a>
           <a class="gpm-item" href="/locker.html"><span aria-hidden="true">🛍️</span> The Locker</a>
           <a class="gpm-item" href="/notifications.html"><span aria-hidden="true">🔔</span> Notifications</a>
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
            ${extraItems}${extraItems ? '<div class="gpm-divider" role="separator"></div>' : ''}
            ${items}
            <div class="gpm-divider" role="separator"></div>
            <button type="button" class="gpm-item gpm-logout gcse-logout-btn"><span aria-hidden="true">↪</span> Log out</button>
        </div>`;
    mount.appendChild(cluster);

    // WP-3: swap the initial letter for the student's equipped avatar (cached
    // render first, then revalidate from the DB). Students only; teachers and
    // students who haven't picked a character keep the letter.
    if (role === 'student') { try { _gcseHydrateAvatar(name); } catch (e) {} }

    const btn = cluster.querySelector('.gcse-profile-btn');
    const menu = cluster.querySelector('.gcse-profile-menu');
    btn.addEventListener('click', e => {
        e.stopPropagation();
        const willShow = !menu.classList.contains('show');
        // This button stops propagation, so the notification bell's outside-click
        // close never fires — on mobile both would be open and overlap. Close the
        // notif panel explicitly so the two are always mutually exclusive.
        if (willShow) {
            const notifPanel = document.querySelector('.gcse-notif-panel.show');
            if (notifPanel) {
                notifPanel.classList.remove('show');
                const notifBtn = document.querySelector('.gcse-notif-btn');
                if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
            }
        }
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

    // WP-A4: "Switch subject" section for multi-subject students — never
    // awaited, the menu works fine without it if the RPC isn't there yet.
    try { _gcseLoadSubjectSwitcher(menu, role); } catch (e) {}
}

// ── WP-3: equipped-avatar in the header circle ──────────────────────────────
// avatar.js is NOT included on most pages, so load it on demand (the same
// dynamic-load trick script.js uses for this file). One shared promise so
// concurrent callers never inject the tag twice.
function _gcseEnsureAvatarLib() {
    if (window.VidyaAvatar) return Promise.resolve(true);
    if (window._gcseAvatarLibPromise) return window._gcseAvatarLibPromise;
    window._gcseAvatarLibPromise = new Promise(resolve => {
        const s = document.createElement('script');
        s.src = '/avatar.js';
        s.onload = () => resolve(!!window.VidyaAvatar);
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
    });
    return window._gcseAvatarLibPromise;
}

// Paint the composed bust into every .gcse-avatar in the cluster (the button +
// the dropdown head). The SVG is sized to fill via CSS, so it works even while
// the dropdown is display:none (offsetWidth would read 0).
function _gcsePaintAvatar(character, loadout) {
    const cluster = document.getElementById('gcseProfileCluster');
    if (!cluster || !window.VidyaAvatar || !VidyaAvatar.has(character)) return;
    const lo = { character };
    if (loadout && typeof loadout === 'object') {
        Object.keys(loadout).forEach(k => { if (loadout[k]) lo[k] = loadout[k]; });
    }
    let svg;
    try { svg = VidyaAvatar.compose(lo, { size: 40, crop: 'bust' }); } catch (e) { return; }
    cluster.querySelectorAll('.gcse-avatar').forEach(el => {
        el.classList.add('gcse-avatar-art');
        el.innerHTML = svg;
    });
}

// Cache-then-revalidate: render the last-known avatar instantly from
// localStorage, then confirm/refresh from get_my_avatar_or_default (the equipped
// character, or a stable free-starter default for students who haven't picked).
// No client / no lib / teacher → the initial letter simply stays.
async function _gcseHydrateAvatar(name) {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem('gcse_avatar_v1') || 'null'); } catch (e) {}
    const ok = await _gcseEnsureAvatarLib();
    if (!ok) return;
    if (cached && cached.u === name && cached.character && VidyaAvatar.has(cached.character)) {
        _gcsePaintAvatar(cached.character, cached.loadout || {});
        _gcseMountBuddy(cached.character, cached.loadout || {});
    }
    const client = window._gcseSupabaseClient;
    if (!client) return;
    let res;
    try { res = await client.rpc('get_my_avatar_or_default'); }
    catch (e) { return; }
    if (!res || res.error || !res.data || !res.data.character) return;  // teacher / no starters
    const ch = res.data.character, lo = res.data.loadout || {};
    if (!VidyaAvatar.has(ch)) return;
    _gcsePaintAvatar(ch, lo);
    _gcseMountBuddy(ch, lo);
    try { localStorage.setItem('gcse_avatar_v1', JSON.stringify({ u: name, character: ch, loadout: lo })); } catch (e) {}
}

// WP-3b: the equipped character also appears as a small floating companion on
// app pages (avatar-buddy.js), fed the same resolved character+loadout. Loaded
// on demand, once; students only (only ever called from _gcseHydrateAvatar).
// avatar-buddy.js self-guards (skips the Locker, mobile and dismissed sessions).
function _gcseMountBuddy(character, loadout) {
    if (!character) return;
    const go = () => { try { if (window.VidyaBuddy) window.VidyaBuddy.show(character, loadout || {}); } catch (e) {} };
    if (window.VidyaBuddy) return go();
    if (window._gcseBuddyPromise) { window._gcseBuddyPromise.then(go); return; }
    window._gcseBuddyPromise = new Promise(resolve => {
        const s = document.createElement('script');
        s.src = '/avatar-buddy.js';
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
    });
    window._gcseBuddyPromise.then(go);
}

// One entry per entitled subject (get_my_entitlements, WP-A3), current
// subject ticked. Shown only when the student has 2+ subjects. Cached per
// tab for 60s so opening the menu never waits on the network.
async function _gcseLoadSubjectSwitcher(menu, role) {
    if (role !== 'student') return;
    const client = window._gcseSupabaseClient;
    if (!client || menu.querySelector('.gpm-subject-switch')) return;

    let rows = null;
    try {
        const cached = JSON.parse(sessionStorage.getItem('vidya_entitlements_v1') || 'null');
        if (cached && Date.now() - cached.ts < 60000 && Array.isArray(cached.rows)) rows = cached.rows;
    } catch (e) {}
    if (!rows) {
        try {
            const { data, error } = await client.rpc('get_my_entitlements');
            if (error || !Array.isArray(data)) return;
            rows = data;
            try { sessionStorage.setItem('vidya_entitlements_v1', JSON.stringify({ ts: Date.now(), rows })); } catch (e) {}
        } catch (e) { return; }
    }
    if (!rows || rows.length < 2) return;

    let currentSlug = (window.SUBJECT && window.SUBJECT.slug) || null;
    try { currentSlug = currentSlug || localStorage.getItem('gcse_last_subject'); } catch (e) {}

    // One compact dropdown rather than a row per subject — the menu stays
    // short however many subjects the student has. Picking one reloads the
    // dashboard for that subject (subject-loader reads ?subject= on the way in).
    const options = rows.map(r => {
        const on = r.subject === currentSlug;
        return `<option value="${gcseEscapeHtml(r.subject)}"${on ? ' selected' : ''}>${gcseEscapeHtml((r.icon ? r.icon + ' ' : '') + (r.name || r.subject))}</option>`;
    }).join('');

    const block = document.createElement('div');
    block.innerHTML = `<div class="gpm-divider" role="separator"></div>
        <div class="gpm-section-label" id="gpmSubjectLabel">Switch subject</div>
        <div class="gpm-subject-switch">
            <select class="gpm-subject-select" aria-labelledby="gpmSubjectLabel">${options}</select>
        </div>`;
    const anchor = menu.querySelector('.gpm-sound') || menu.querySelector('.gpm-divider');
    while (block.firstChild) menu.insertBefore(block.firstChild, anchor);

    const select = menu.querySelector('.gpm-subject-select');
    if (select) {
        // Keep the menu open while the native picker is up; navigate on choice.
        select.addEventListener('click', e => e.stopPropagation());
        select.addEventListener('change', () => {
            if (select.value && select.value !== currentSlug) {
                location.href = '/dashboard.html?subject=' + encodeURIComponent(select.value);
            }
        });
    }
}
