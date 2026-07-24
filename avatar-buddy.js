// ══════════════════════════════════════════════════════════════
// AVATAR BUDDY (WP-3b) — the student's EQUIPPED character as a small floating
// companion across the app, so the cast the student unlocked in the Locker
// follows them into the activities and pages.
//
// It is fed the already-resolved { character, loadout } by account-cluster.js
// (which fetches + caches it via get_my_avatar_or_default). So there's no new
// data path here and no per-page includes: wherever the header avatar appears,
// so does the buddy. Zero new art — VidyaAvatar.compose() renders the same
// recolourable SVG as the Locker and the header.
//
// THEME-AWARE: the speech bubble / pill use the page design tokens
// (var(--card)/(--ink)/(--border)), so it matches whatever colour theme is on.
// Namespaced `vb-`; honours prefers-reduced-motion; dismissable for the
// session (× → a re-summon pill). Skipped on the Locker itself (redundant
// there) and on small screens (the header avatar is enough on mobile).
//
// API: window.VidyaBuddy.show(character, loadout) / .hide()
//
// Also reacts to two page-level CustomEvents so other shared JS can talk to
// it without a hard dependency: 'vidya:celebrate' (gamification.js — streak/
// level/badge/combo/daily-goal) and 'vidya:mistake' (daily-revise.js — wrong
// answer). Both are safe to dispatch on any page: no listener, no-op.
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  var DISMISS_KEY = 'vidya_buddy_dismissed_v1';
  var GREETED_KEY = 'vidya_buddy_greeted_v1';

  // Warm, GCSE-age (not childish) lines the buddy cycles through on click.
  var CHEERS = [
    'Every question counts. Keep going.',
    "You showed up today — that's the hard part done.",
    'One more topic before you stop?',
    'Your streak likes it when you visit.',
    'Future-you is taking notes.',
    'Small and often beats cramming. Always.'
  ];

  // Reassurance after a wrong answer (see the 'vidya:mistake' listener below).
  var MISTAKE_LINES = [
    "Not this one — you'll have it next time.",
    'Slips happen. Shake it off and go again.',
    'That one was tricky. Onto the next.',
    "Wrong answers are just practice that hasn't paid off yet."
  ];

  // Per-page context: the buddy only mounts on app-shell pages (dashboard,
  // daily-revise, task, etc — see account-cluster.js), never the topic pages,
  // so "contextual" here means per-PAGE, not per-scroll-section.
  var PAGE_TIPS = [
    { match: /daily-revise/i, tip: 'Spaced repetition beats cramming — a little most days sticks best.' },
    { match: /review-calendar/i, tip: "Reviews land at 1, 7 and 28 days — right before you'd have forgotten." },
    { match: /leaderboard/i, tip: 'Consistency beats one big session — small streaks add up fast.' },
    { match: /dashboard/i, tip: "Pick up wherever you left off — every subject keeps its own progress." },
    { match: /task(?:s)?\.html/i, tip: 'Answers are graded on the server, so give it your best real shot.' }
  ];
  function pageTip() {
    var path = location.pathname;
    for (var i = 0; i < PAGE_TIPS.length; i++) if (PAGE_TIPS[i].match.test(path)) return PAGE_TIPS[i].tip;
    return null;
  }

  var reduced = false;
  try { reduced = global.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var els = null;        // built lazily on first show()
  var shownChar = null;
  var cheerIdx = 0;
  var cheerLines = CHEERS;
  var collapseTimer = null;
  var destroyed = false;
  var lastMistakeAt = 0;

  function skip() {
    if (destroyed) return true;
    try { if (sessionStorage.getItem(DISMISS_KEY)) return true; } catch (e) {}
    // The Locker is the customiser — a floating copy there is redundant.
    if (/locker\.html?$/i.test(location.pathname)) return true;
    // Mobile: the header avatar carries the identity; a corner buddy crowds.
    try { if (global.matchMedia('(max-width: 640px)').matches) return true; } catch (e) {}
    return false;
  }

  function show(character, loadout) {
    if (skip() || !global.VidyaAvatar || !VidyaAvatar.has(character)) return;
    if (!els) build();
    if (character === shownChar) return;      // already showing this one
    shownChar = character;

    var accent = VidyaAvatar.defaultAccent(character);
    var lore = VidyaAvatar.lore(character) || {};
    var name = character.charAt(0).toUpperCase() + character.slice(1);
    var lo = {};
    if (loadout && typeof loadout === 'object') Object.keys(loadout).forEach(function (k) { if (loadout[k]) lo[k] = loadout[k]; });
    lo.character = character;

    els.dock.style.setProperty('--vb-acc', accent);
    try { els.mascot.innerHTML = VidyaAvatar.compose(lo, { size: 92 }); } catch (e) { return; }
    if (!reduced) { els.mascot.classList.remove('vb-in'); void els.mascot.offsetWidth; els.mascot.classList.add('vb-in'); }

    els.eyebrow.textContent = lore.archetype ? (name + ' · ' + lore.archetype) : name;

    // First click after a character (re)shows teaches who they are — lore's
    // already authored per-character in avatar.js and otherwise only used in
    // the Locker — then rotation folds into the generic cheers below.
    cheerIdx = 0;
    cheerLines = (lore.archetype && lore.tagline)
      ? [lore.archetype + ' — ' + lore.tagline].concat(CHEERS)
      : CHEERS;

    // Greet once per session; after that it just sits quietly until clicked.
    var greeted = false;
    try { greeted = !!sessionStorage.getItem(GREETED_KEY); } catch (e) {}
    if (!greeted) {
      var tip = pageTip();
      els.line.textContent = "Hey — I'm " + name + ", your guide." + (tip ? ' ' + tip : " I'll keep you company while you revise.");
      openBubble(true);
      try { sessionStorage.setItem(GREETED_KEY, '1'); } catch (e) {}
    }
  }

  function hide() { if (els) els.dock.style.display = 'none'; }

  function openBubble(autoCollapse) {
    els.dock.classList.add('vb-open');
    if (collapseTimer) { clearTimeout(collapseTimer); collapseTimer = null; }
    if (autoCollapse) collapseTimer = setTimeout(function () { els.dock.classList.remove('vb-open'); }, 6000);
  }

  function speakCheer() {
    els.line.textContent = cheerLines[cheerIdx % cheerLines.length];
    cheerIdx++;
    openBubble(true);
  }

  // Reacts to gamification.js's celebrations (streak/level/badge/combo/daily
  // goal) — see the 'vidya:celebrate' CustomEvent it dispatches. Decoupled on
  // purpose: gamification.js has no idea this listener exists, so it fires
  // harmlessly on every page whether or not the buddy happens to be mounted.
  function speakCelebration(detail) {
    if (!els || destroyed || !shownChar) return;
    var line;
    switch (detail && detail.kind) {
      case 'badge': line = 'Nice — you just unlocked ' + (detail.label || 'a badge') + '!'; break;
      case 'levelup': line = 'Level ' + detail.level + '! Look at you go.'; break;
      case 'combo': line = detail.combo + ' correct in a row — you\'re on fire.'; break;
      case 'streak': line = "Streak's safe for today. Nice work."; break;
      case 'daily-goal': line = "Daily goal smashed! That's today sorted."; break;
      default: return;
    }
    els.line.textContent = line;
    openBubble(true);
  }

  // Reassurance after a wrong answer — see the 'vidya:mistake' listener
  // below. Throttled: this can fire many times a session (every miss in
  // Daily Revise), unlike the rare celebration events above.
  function speakMistake() {
    if (!els || destroyed || !shownChar) return;
    var now = Date.now();
    if (now - lastMistakeAt < 20000) return;
    lastMistakeAt = now;
    els.line.textContent = MISTAKE_LINES[Math.floor(Math.random() * MISTAKE_LINES.length)];
    openBubble(true);
  }

  global.addEventListener('vidya:celebrate', function (e) { speakCelebration(e.detail); });
  global.addEventListener('vidya:mistake', function () { speakMistake(); });

  // Corner-dock positioning: measure the real scroll-to-top button instead of
  // assuming its size/position (the old CSS hardcoded right:6/bottom:80 on
  // the belief that scroll-to-top always sits at bottom:30 — it doesn't
  // exist at all on today's app-shell pages, so that gap was phantom). When
  // an anchor IS present we stack above it and centre on its column; when
  // it isn't, we fall back to the same visual spot this already shipped at.
  var DOCK_STAGE_W = 96, DOCK_GAP = 10, DOCK_FALLBACK_BOTTOM = 24, DOCK_FALLBACK_CENTER = 54;
  var resizeBound = false;

  function positionDock() {
    if (!els) return;
    var anchor = document.querySelector('.scroll-to-top');
    var r = anchor ? anchor.getBoundingClientRect() : null;
    if (r && !r.width) r = null;
    var bottom = r ? Math.round(global.innerHeight - r.top + DOCK_GAP) : DOCK_FALLBACK_BOTTOM;
    var center = r ? (global.innerWidth - (r.left + r.width / 2)) : DOCK_FALLBACK_CENTER;
    els.dock.style.bottom = bottom + 'px';
    els.dock.style.right = Math.max(0, Math.round(center - DOCK_STAGE_W / 2)) + 'px';
    var summon = document.querySelector('.vb-summon');
    if (summon) summon.style.bottom = bottom + 'px';
  }

  function build() {
    injectCSS();
    var dock = document.createElement('div');
    dock.className = 'vb-dock';
    dock.setAttribute('aria-live', 'polite');
    dock.innerHTML =
      '<div class="vb-bubble" role="status"><span class="vb-eyebrow"></span><p class="vb-line"></p><span class="vb-tail"></span></div>' +
      '<button class="vb-close" type="button" aria-label="Hide my companion">&times;</button>' +
      '<button class="vb-stage" type="button" aria-label="Say hello to your companion">' +
        '<span class="vb-orb" aria-hidden="true"></span><span class="vb-mascot" aria-hidden="true"></span>' +
      '</button>';
    document.body.appendChild(dock);

    els = {
      dock: dock,
      bubble: dock.querySelector('.vb-bubble'),
      eyebrow: dock.querySelector('.vb-eyebrow'),
      line: dock.querySelector('.vb-line'),
      mascot: dock.querySelector('.vb-mascot')
    };
    positionDock();
    if (!resizeBound) { global.addEventListener('resize', positionDock); resizeBound = true; }

    dock.querySelector('.vb-stage').addEventListener('click', function () {
      if (dock.classList.contains('vb-open')) dock.classList.remove('vb-open');
      else speakCheer();
    });
    dock.querySelector('.vb-close').addEventListener('click', function () {
      destroyed = true;
      dock.classList.add('vb-gone');
      try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
      setTimeout(function () { dock.remove(); mountSummonPill(); }, 320);
    });
  }

  function mountSummonPill() {
    if (document.querySelector('.vb-summon')) return;
    injectCSS();
    var pill = document.createElement('button');
    pill.className = 'vb-summon';
    pill.type = 'button';
    pill.setAttribute('aria-label', 'Bring my companion back');
    pill.innerHTML = '<span class="vb-summon-dot"></span> Companion';
    document.body.appendChild(pill);
    positionDock();
    if (!resizeBound) { global.addEventListener('resize', positionDock); resizeBound = true; }
    pill.addEventListener('click', function () {
      try { sessionStorage.removeItem(DISMISS_KEY); } catch (e) {}
      pill.remove();
      destroyed = false; els = null; shownChar = null;
      var c = null;
      try { c = JSON.parse(localStorage.getItem('gcse_avatar_v1') || 'null'); } catch (e) {}
      if (c && c.character) show(c.character, c.loadout || {});
    });
  }

  function injectCSS() {
    if (document.getElementById('vb-styles')) return;
    var css = [
      // right/bottom are set by positionDock() — it measures the real
      // scroll-to-top button (if this page has one) instead of assuming it.
      '.vb-dock{position:fixed;right:6px;bottom:24px;z-index:55;display:flex;flex-direction:column;align-items:flex-end;pointer-events:none;font-family:inherit}',
      '.vb-dock *{box-sizing:border-box}',
      '.vb-stage{pointer-events:auto;position:relative;width:96px;height:112px;border:0;background:transparent;padding:0;cursor:pointer;display:block;-webkit-tap-highlight-color:transparent}',
      '.vb-orb{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);width:86px;height:86px;border-radius:50%;background:radial-gradient(circle at 50% 45%, var(--vb-acc,#37e0cf) 0%, transparent 68%);opacity:.32;filter:blur(3px);z-index:0}',
      '.vb-mascot{position:relative;z-index:1;display:block;filter:drop-shadow(0 10px 14px rgba(15,25,35,.26));transform-origin:50% 90%}',
      '.vb-mascot svg{display:block}',
      '.vb-close{pointer-events:auto;position:absolute;top:-4px;right:-2px;z-index:3;width:22px;height:22px;border-radius:50%;border:1px solid var(--border,#d8cfba);background:var(--card,#fffcf6);color:var(--mid,#5a6e7f);font-size:15px;line-height:1;cursor:pointer;opacity:0;transform:scale(.7);transition:opacity .2s,transform .2s;box-shadow:0 3px 8px rgba(15,25,35,.16)}',
      '.vb-dock:hover .vb-close{opacity:1;transform:scale(1)}',
      '.vb-close:hover{color:var(--ink,#0f1923);border-color:var(--mid,#5a6e7f)}',
      '.vb-bubble{pointer-events:auto;position:relative;max-width:236px;margin:0 4px 10px 0;padding:11px 14px;background:var(--card,#fffcf6);border:1px solid var(--border,#d8cfba);border-radius:15px 15px 5px 15px;box-shadow:0 14px 32px rgba(15,25,35,.18);opacity:0;transform:translateY(8px) scale(.94);transform-origin:100% 100%;transition:opacity .28s ease,transform .28s cubic-bezier(.34,1.56,.64,1);visibility:hidden}',
      '.vb-dock.vb-open .vb-bubble{opacity:1;transform:translateY(0) scale(1);visibility:visible}',
      '.vb-eyebrow{display:block;font-family:"DM Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--vb-acc,var(--marigold-dark,#a5680f));margin-bottom:3px;filter:saturate(.85) brightness(.92)}',
      '.vb-line{margin:0;font-size:13.5px;line-height:1.4;color:var(--ink,#0f1923);font-weight:500}',
      '.vb-tail{position:absolute;right:18px;bottom:-7px;width:13px;height:13px;background:var(--card,#fffcf6);border-right:1px solid var(--border,#d8cfba);border-bottom:1px solid var(--border,#d8cfba);transform:rotate(45deg)}',
      '.vb-dock.vb-gone{opacity:0;transform:translateY(12px);transition:opacity .3s,transform .3s;pointer-events:none}',
      '@keyframes vb-bob{0%,100%{translate:0 0}50%{translate:0 -7px}}',
      '@keyframes vb-in{0%{opacity:0;transform:scale(.5) translateY(20px);filter:blur(5px)}60%{opacity:1;transform:scale(1.06) translateY(-3px);filter:blur(0)}100%{transform:scale(1) translateY(0)}}',
      '@keyframes vb-glow{0%,100%{opacity:.26;transform:translateX(-50%) scale(.94)}50%{opacity:.42;transform:translateX(-50%) scale(1.05)}}',
      '.vb-mascot{animation:vb-bob 4.4s ease-in-out infinite}',
      '.vb-mascot.vb-in{animation:vb-in .58s cubic-bezier(.34,1.56,.64,1) both, vb-bob 4.4s ease-in-out .58s infinite}',
      '.vb-orb{animation:vb-glow 3.8s ease-in-out infinite}',
      '.vb-summon{position:fixed;right:20px;bottom:24px;z-index:55;pointer-events:auto;display:inline-flex;align-items:center;gap:7px;padding:8px 14px;border-radius:999px;border:1px solid var(--border,#d8cfba);background:var(--card,#fffcf6);color:var(--ink,#0f1923);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;box-shadow:0 10px 24px rgba(15,25,35,.16);transition:transform .2s,box-shadow .2s}',
      '.vb-summon:hover{transform:translateY(-2px);box-shadow:0 14px 28px rgba(15,25,35,.2)}',
      '.vb-summon-dot{width:8px;height:8px;border-radius:50%;background:var(--vb-acc,var(--marigold,#c77f1f))}',
      '@media (prefers-reduced-motion: reduce){.vb-mascot,.vb-mascot.vb-in,.vb-orb{animation:none}.vb-bubble{transition:opacity .2s}}',
      // never let the buddy sit over content on small screens even if shown
      '@media (max-width: 640px){.vb-dock,.vb-summon{display:none}}'
    ].join('');
    var style = document.createElement('style');
    style.id = 'vb-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  global.VidyaBuddy = { show: show, hide: hide };
})(window);
