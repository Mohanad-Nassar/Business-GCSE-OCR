// ══════════════════════════════════════════════════════════════
// SITE-WIDE MOTION — reveal-on-scroll + hover-lift for the app shell
// (dashboards, teacher pages, subject/topic pages). Extends the same
// .rv/.rv-in convention landing.js already uses on index.html, so both
// systems share one mental model. Self-contained, no dependency on
// script.js/auth — safe to include on every page.
//
//  • Known content-block classes (flashcards, case studies, dashboard
//    panels, etc.) get "fade up" as they scroll into view, staggered
//    when several land together in the same row/grid.
//  • The fade/slide transition is set INLINE at reveal time (and removed
//    again once it finishes), not via a CSS class — several pages already
//    give these same classes their own bespoke `transition` (e.g.
//    teacher-dashboard.html's .class-card/.tile hover polish), and a
//    class-based transition here would silently fight theirs depending on
//    stylesheet order. Inline wins cleanly and self-cleans afterward, so
//    the page's own hover/interaction transitions are untouched once the
//    one-off reveal is done.
//  • A small, deliberately short list of card classes also get
//    .motion-hover (lift + shadow on hover) — only ones confirmed to have
//    no existing hover treatment. Most interactive cards in this codebase
//    (.topic-card, .class-card, .tile, .ep-opt…) already have their own,
//    often page-tuned hover — adding a second one would just be redundant
//    or clash, so this list stays narrow; use [data-hover-lift] to opt
//    any other element in explicitly.
//  • A MutationObserver keeps re-scanning for content rendered later by
//    script.js (e.g. .topic-content/.misc-card built after auth checks),
//    same debounced-sweep pattern as searchable-select.js.
//  • prefers-reduced-motion: everything reveals instantly, no transition
//    ever gets set (mirrors the reduced-motion handling already in
//    style.css/business-style.css/landing.css).
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';
  if (window.__gcseMotionInit) return;
  window.__gcseMotionInit = true;

  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var REVEAL_SELECTOR = [
    '.flashcard', '.marks-section', '.case-study-box', '.case-table', '.formula-box',
    '.tip-card', '.reading-card', '.tf-card', '.topic-card', '.topic-content', '.misc-card',
    '.ep-card', '.dash-panel', '.tasks-panel', '.class-card', '.tile', '.modal-panel',
    '.step-panel', '.guide-panel', '.summary-stat', '[data-reveal]'
  ].join(',');

  var HOVER_SELECTOR = '.flashcard, [data-hover-lift]';

  var REVEAL_TRANSITION = 'opacity .55s ease, transform .55s cubic-bezier(.2,.7,.2,1)';

  function revealNow(el) {
    el.style.transition = '';
    el.classList.add('rv-in');
  }

  function revealAnimated(el, delayMs) {
    // rAF so the browser commits the .rv (opacity:0) starting state to a
    // frame before the transition + class flip, or it may skip straight
    // to the end state with no visible animation.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.transitionDelay = delayMs + 'ms';
        el.style.transition = REVEAL_TRANSITION;
        el.classList.add('rv-in');
        setTimeout(function () { el.style.transition = ''; el.style.transitionDelay = ''; }, 550 + delayMs + 80);
      });
    });
  }

  var io = null;
  function revealObserver() {
    if (io) return io;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          revealAnimated(en.target, en.target.__rvDelay || 0);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    return io;
  }

  function applyReveal(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var els = scope.querySelectorAll(REVEAL_SELECTOR);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.dataset.rvDone) continue;
      el.dataset.rvDone = '1';
      el.classList.add('rv');
      // Stagger cards that land together in the same row/grid (siblings of
      // the same type), capped so a long list doesn't trail forever.
      var idx = Array.prototype.indexOf.call(el.parentNode ? el.parentNode.children : [], el);
      el.__rvDelay = Math.min(idx >= 0 ? idx : 0, 4) * 60;
      if (reduced || !('IntersectionObserver' in window)) {
        revealNow(el);
      } else {
        revealObserver().observe(el);
      }
    }
  }

  function applyHover(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var els = scope.querySelectorAll(HOVER_SELECTOR);
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('motion-hover');
    }
  }

  function sweep(root) { applyReveal(root); applyHover(root); }

  function start() { sweep(document); watch(); }

  // Catch content rendered after this script runs (auth-gated dashboards,
  // script.js's topic-content cards, teacher tables) — same debounced
  // MutationObserver pattern as searchable-select.js.
  function watch() {
    if (!window.MutationObserver) return;
    var pending = false;
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].addedNodes && muts[i].addedNodes.length) {
          if (pending) return;
          pending = true;
          (window.requestAnimationFrame || window.setTimeout)(function () { pending = false; sweep(document); }, 0);
          return;
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
