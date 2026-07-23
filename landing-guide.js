// ══════════════════════════════════════════════════════════════
// LANDING GUIDE — a floating cast "tour guide" for the landing page.
//
// As the visitor scrolls, the guide hands off between the rewards-store
// cast (avatar.js) section by section. Each character is picked because its
// LORE archetype matches the section it introduces, INTRODUCES ITSELF BY
// NAME, then says one in-voice line about that section. Every landing
// section now has its own guide, in DOM order, so the character always
// matches what you're looking at.
//
// Detection is a DEBOUNCED SCROLLSPY, not an intersection race: the active
// section is the last one whose top has crossed the viewport mid-line, and a
// change only "commits" once scrolling settles (~160ms). So fast-scrolling
// past short sections doesn't flicker — exactly one character speaks per
// section you land on.
//
// THEME-AWARE: the bubble, tail, close button and re-summon pill all use the
// page's design tokens (var(--card)/(--ink)/(--border)/(--paper)), so the
// guide matches whatever colour theme is active (aurora, a dark theme, …)
// instead of a hardcoded white card. The eyebrow uses the character accent.
//
// Reuses VidyaAvatar.compose() as the ONLY art source (zero new assets).
// Namespaced `vg-`; honours prefers-reduced-motion; hidden on narrow
// viewports; dismissable for the session (× → a small re-summon pill).
// All copy here is static/author-written — never user input.
//
// Depends on: avatar.js (VidyaAvatar). Include AFTER it, on index.html only.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (!window.VidyaAvatar || typeof window.VidyaAvatar.compose !== 'function') return;

  var DISMISS_KEY = 'vidya_guide_dismissed_v1';
  try { if (sessionStorage.getItem(DISMISS_KEY)) { mountSummonPill(); return; } } catch (e) {}

  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // Too narrow → the fixed guide + bubble would sit on top of content. Skip.
  var narrow = false;
  try { narrow = window.matchMedia('(max-width: 760px)').matches; } catch (e) {}
  if (narrow) return;

  // ── The tour, in DOM order. Each stop: a landmark to watch, the character
  // that introduces it, and its line. Every line starts with the character
  // naming itself (the visitor is meeting the team), then its bit. Facts kept
  // current: five subjects, Business → Spanish. ──
  var TOUR = [
    { find: sel('.hero'),        char: 'vesper',  line: "Hey — I'm Vesper. I'll show you round Vidya and introduce you to the team. Keep scrolling." },
    { find: sel('.stats'),       char: 'codex',   line: "I'm Codex. Topics across all five subjects — and I remember every single one." },
    { find: sel('#activities'),  char: 'blot',    line: "I'm Blot. Nine ways into every topic — I reshape to fit whichever one you need." },
    { find: sel('#how'),         char: 'cadence', line: "I'm Cadence. Learn it, practise it, review it — I turn the whole thing into a loop." },
    { find: frow(0),             char: 'ember',   line: "I'm Ember. Get three in a row on Daily Revise and it's mastered — I burn brighter every streak." },
    { find: frow(1),             char: 'orion',   line: "I'm Orion. 1 day, 1 week, 4 weeks — I bring each topic back right before you'd forget it." },
    { find: frow(2),             char: 'byte',    line: "I'm Byte. Set it Monday, marked by Tuesday — I read every answer twice and panic never." },
    { find: frow(3),             char: 'pixl',    line: "I'm Pixl. Streaks, XP and badges — extra lives for showing up. Respawn, never quit." },
    { find: frow(4),             char: 'lumen',   line: "I'm Lumen. I find the gap at the bottom — before the mock does." },
    { find: frow(5),             char: 'kitsu',   line: "I'm Kitsu. One account, every subject, one code to join — I'm already three steps ahead." },
    { find: sel('#guides'),      char: 'boba',    line: "I'm Boba. Pick a favourite from the cast — we're easy company for the long haul to the exam." },
    { find: sel('#subjects'),    char: 'geode',   line: "I'm Geode. Five subjects, Business to Spanish — rough outside, rare all the way through." },
    { find: sel('#schools'),     char: 'vyrn',    line: "I'm Vyrn. For schools: join codes, gating, marking queues — I guard what you build." },
    { find: sel('#trust'),       char: 'kami',    line: "I'm Kami. Every score verified, every school walled off — sharp edges, no gaps." },
    { find: sel('#faq'),         char: 'wisp',    line: "I'm Wisp. Got questions? I'm around in the quiet hours if you need me." },
    { find: sel('.cta-band'),    char: 'nova',    line: "I'm Nova. Your future self keeps the marks — first one to the edge, come on." }
  ];

  // Resolve landmarks now; drop any stop whose element/character isn't present.
  var STOPS = TOUR.map(function (t) {
    var el = t.find();
    if (!el || !window.VidyaAvatar.has(t.char)) return null;
    return { el: el, char: t.char, line: t.line };
  }).filter(Boolean);
  if (!STOPS.length) return;

  injectCSS();

  // ── DOM: a fixed dock (glow orb + mascot) with a speech bubble above it ──
  var dock = document.createElement('div');
  dock.className = 'vg-dock';
  dock.setAttribute('aria-live', 'polite');
  dock.innerHTML =
    '<div class="vg-bubble" role="status">' +
      '<span class="vg-eyebrow"></span>' +
      '<p class="vg-line"></p>' +
      '<span class="vg-tail"></span>' +
    '</div>' +
    '<button class="vg-close" type="button" aria-label="Dismiss guide">&times;</button>' +
    '<button class="vg-stage" type="button" aria-label="Toggle guide message">' +
      '<span class="vg-orb" aria-hidden="true"></span>' +
      '<span class="vg-mascot" aria-hidden="true"></span>' +
    '</button>';
  document.body.appendChild(dock);

  var eyebrowEl = dock.querySelector('.vg-eyebrow');
  var lineEl = dock.querySelector('.vg-line');
  var mascotEl = dock.querySelector('.vg-mascot');
  var stageBtn = dock.querySelector('.vg-stage');

  var current = -1;
  var collapseTimer = null;
  var destroyed = false;

  function renderStop(i) {
    if (i === current || i < 0 || i >= STOPS.length || destroyed) return;
    current = i;
    var stop = STOPS[i];
    var accent = window.VidyaAvatar.defaultAccent(stop.char);
    var lore = window.VidyaAvatar.lore(stop.char) || {};

    // Accent drives both the glow orb and the eyebrow, per character.
    dock.style.setProperty('--vg-acc', accent);
    // Re-mount the SVG so the spring entrance replays on every hand-off.
    mascotEl.innerHTML = window.VidyaAvatar.compose({ character: stop.char }, { size: 150 });
    if (!reduced) {
      mascotEl.classList.remove('vg-in');
      void mascotEl.offsetWidth; // force reflow → animation restarts
      mascotEl.classList.add('vg-in');
    }

    eyebrowEl.textContent = lore.archetype ? (stop.char + ' · ' + lore.archetype) : stop.char;
    lineEl.textContent = stop.line;
    openBubble(true);
  }

  function openBubble(autoCollapse) {
    dock.classList.add('vg-open');
    if (collapseTimer) { clearTimeout(collapseTimer); collapseTimer = null; }
    if (autoCollapse) collapseTimer = setTimeout(function () { dock.classList.remove('vg-open'); }, 5600);
  }
  function toggleBubble() {
    if (dock.classList.contains('vg-open')) dock.classList.remove('vg-open');
    else openBubble(false);
  }

  stageBtn.addEventListener('click', toggleBubble);

  dock.querySelector('.vg-close').addEventListener('click', function () {
    destroyed = true;
    dock.classList.add('vg-gone');
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
    setTimeout(function () { dock.remove(); mountSummonPill(); }, 320);
  });

  // ── Debounced scrollspy: active = last stop whose top has crossed the
  // viewport mid-line; the swap only commits once scrolling settles, so
  // fast-scrolling past short sections shows exactly one character per
  // section you land on (no flicker, no two sections "mixing"). ──
  var pending = -1, settleTimer = null, rafPending = false, lastY = window.scrollY;

  function computeActive() {
    var line = window.innerHeight * 0.5;
    var active = 0;
    for (var i = 0; i < STOPS.length; i++) {
      if (STOPS[i].el.getBoundingClientRect().top <= line) active = i; else break;
    }
    return active;
  }

  function onScroll() {
    if (rafPending || destroyed) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      if (destroyed) return;
      var active = computeActive();
      if (active !== current && active !== pending) {
        pending = active;
        clearTimeout(settleTimer);
        settleTimer = setTimeout(function () { renderStop(pending); }, 160);
      }
      // gentle tilt toward the scroll direction
      if (!reduced) {
        var y = window.scrollY, dy = y - lastY; lastY = y;
        var tilt = Math.max(-7, Math.min(7, dy * 0.4));
        mascotEl.style.setProperty('--vg-tilt', tilt.toFixed(1) + 'deg');
        clearTimeout(mascotEl._t);
        mascotEl._t = setTimeout(function () { mascotEl.style.setProperty('--vg-tilt', '0deg'); }, 140);
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // Show the correct first stop for the current scroll position (spring in).
  renderStop(computeActive());

  // ── Helpers ─────────────────────────────────────────────────
  function sel(s) { return function () { return document.querySelector(s); }; }
  function frow(n) { return function () { return document.querySelectorAll('.features .frow')[n] || null; }; }

  function mountSummonPill() {
    if (document.querySelector('.vg-summon')) return;
    injectCSS();
    var pill = document.createElement('button');
    pill.className = 'vg-summon';
    pill.type = 'button';
    pill.innerHTML = '<span class="vg-summon-dot"></span> Guide';
    pill.setAttribute('aria-label', 'Bring the guide back');
    document.body.appendChild(pill);
    pill.addEventListener('click', function () {
      try { sessionStorage.removeItem(DISMISS_KEY); } catch (e) {}
      pill.remove();
      var s = document.createElement('script');
      s.src = 'landing-guide.js?resummon=' + Math.floor(performance.now());
      document.body.appendChild(s);
    });
  }

  function injectCSS() {
    if (document.getElementById('vg-styles')) return;
    var css = [
      '.vg-dock{position:fixed;right:22px;bottom:22px;z-index:60;display:flex;flex-direction:column;align-items:flex-end;pointer-events:none;font-family:inherit}',
      '.vg-dock *{box-sizing:border-box}',
      '.vg-stage{pointer-events:auto;position:relative;width:150px;height:177px;border:0;background:transparent;padding:0;cursor:pointer;display:block;-webkit-tap-highlight-color:transparent}',
      '.vg-orb{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);width:132px;height:132px;border-radius:50%;background:radial-gradient(circle at 50% 45%, var(--vg-acc,#37e0cf) 0%, transparent 68%);opacity:.34;filter:blur(3px);z-index:0}',
      '.vg-mascot{position:relative;z-index:1;display:block;filter:drop-shadow(0 12px 18px rgba(15,25,35,.28));transform-origin:50% 90%;rotate:var(--vg-tilt,0deg);transition:rotate .18s ease-out}',
      '.vg-mascot svg{display:block}',
      // theme-aware surfaces: everything follows the page's design tokens
      '.vg-close{pointer-events:auto;position:absolute;top:-4px;right:-2px;z-index:3;width:24px;height:24px;border-radius:50%;border:1px solid var(--border,#d8cfba);background:var(--card,#fffcf6);color:var(--mid,#5a6e7f);font-size:16px;line-height:1;cursor:pointer;opacity:0;transform:scale(.7);transition:opacity .2s,transform .2s;box-shadow:0 3px 8px rgba(15,25,35,.16)}',
      '.vg-dock:hover .vg-close{opacity:1;transform:scale(1)}',
      '.vg-close:hover{color:var(--ink,#0f1923);border-color:var(--mid,#5a6e7f)}',
      '.vg-bubble{pointer-events:auto;position:relative;max-width:250px;margin:0 6px 12px 0;padding:12px 15px;background:var(--card,#fffcf6);border:1px solid var(--border,#d8cfba);border-radius:16px 16px 6px 16px;box-shadow:0 14px 34px rgba(15,25,35,.18);opacity:0;transform:translateY(8px) scale(.94);transform-origin:100% 100%;transition:opacity .28s ease,transform .28s cubic-bezier(.34,1.56,.64,1);visibility:hidden}',
      '.vg-dock.vg-open .vg-bubble{opacity:1;transform:translateY(0) scale(1);visibility:visible}',
      '.vg-eyebrow{display:block;font-family:"DM Mono",ui-monospace,monospace;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--vg-acc,var(--marigold-dark,#a5680f));margin-bottom:3px;filter:saturate(.85) brightness(.9)}',
      '.vg-line{margin:0;font-size:14px;line-height:1.42;color:var(--ink,#0f1923);font-weight:500}',
      '.vg-tail{position:absolute;right:20px;bottom:-7px;width:14px;height:14px;background:var(--card,#fffcf6);border-right:1px solid var(--border,#d8cfba);border-bottom:1px solid var(--border,#d8cfba);transform:rotate(45deg)}',
      '.vg-dock.vg-gone{opacity:0;transform:translateY(14px);transition:opacity .3s,transform .3s;pointer-events:none}',
      // motion
      '@keyframes vg-bob{0%,100%{translate:0 0}50%{translate:0 -9px}}',
      '@keyframes vg-in{0%{opacity:0;transform:scale(.4) translateY(26px);filter:blur(6px)}60%{opacity:1;transform:scale(1.08) translateY(-4px);filter:blur(0)}100%{transform:scale(1) translateY(0)}}',
      '@keyframes vg-glow{0%,100%{opacity:.28;transform:translateX(-50%) scale(.94)}50%{opacity:.46;transform:translateX(-50%) scale(1.06)}}',
      '.vg-mascot{animation:vg-bob 4.6s ease-in-out infinite}',
      '.vg-mascot.vg-in{animation:vg-in .62s cubic-bezier(.34,1.56,.64,1) both, vg-bob 4.6s ease-in-out .62s infinite}',
      '.vg-orb{animation:vg-glow 3.8s ease-in-out infinite}',
      // re-summon pill (also theme-aware)
      '.vg-summon{position:fixed;right:22px;bottom:22px;z-index:60;pointer-events:auto;display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:999px;border:1px solid var(--border,#d8cfba);background:var(--card,#fffcf6);color:var(--ink,#0f1923);font:inherit;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 26px rgba(15,25,35,.16);transition:transform .2s,box-shadow .2s}',
      '.vg-summon:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(15,25,35,.2)}',
      '.vg-summon-dot{width:9px;height:9px;border-radius:50%;background:var(--marigold,#c77f1f)}',
      '@media (prefers-reduced-motion: reduce){.vg-mascot,.vg-mascot.vg-in,.vg-orb{animation:none}.vg-bubble{transition:opacity .2s}}'
    ].join('');
    var style = document.createElement('style');
    style.id = 'vg-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }
})();
