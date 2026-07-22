// ══════════════════════════════════════════════════════════════
// LANDING PAGE MOTION (WP-A6) — hand-rolled, no libraries.
//  • nav gains .scrolled once the page moves
//  • .rv elements reveal via IntersectionObserver (stagger = .rv-d* CSS)
//  • [data-count] numbers count up when the stats strip appears
//  • hero mock cards get a slow scroll parallax ([data-plx] factor)
//  • stats are REAL: topics/subjects computed from the generated
//    registries (subjects-index.js / page-groups-all.js) when present
//  • prefers-reduced-motion: everything above is skipped; content is
//    simply visible (landing.css also zeroes animations)
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // ── Real numbers from the registries (graceful fallbacks) ──
  function countTopics() {
    var groupsAll = window.PAGE_GROUPS_ALL || {};
    var n = 0;
    Object.keys(groupsAll).forEach(function (slug) {
      (groupsAll[slug] || []).forEach(function walk(g) {
        n += (g.pages || []).length;
        (g.groups || []).forEach(walk);
      });
    });
    return n;
  }
  function applyStats() {
    var topics = countTopics();
    var subjects = (window.SUBJECTS || []).length;
    var el;
    if (topics && (el = document.querySelector('[data-stat="topics"]'))) el.dataset.count = String(topics);
    if (subjects && (el = document.querySelector('[data-stat="subjects"]'))) el.dataset.count = String(subjects);
  }

  // ── Nav scrolled state ──
  var nav = document.querySelector('.nav');
  function onScrollNav() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  // ── Mobile nav (hamburger) ── links + Log in/Get started live in #navPanel,
  // which collapses into the burger below 900px (see landing.css).
  var burger = document.getElementById('navBurger');
  var panel = document.getElementById('navPanel');
  if (nav && burger) {
    function closeNav() {
      nav.classList.remove('nav-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
    }
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    // A tap on any link or button inside the panel closes it.
    if (panel) panel.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) closeNav();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('nav-open') && !nav.contains(e.target)) closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeNav();
    }, { passive: true });
  }

  // ── Reveal on scroll ──
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('rv-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('rv-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // ── Count-up numbers ──
  function animateCount(el) {
    var target = parseInt(el.dataset.count || '0', 10);
    if (!target) { el.textContent = el.dataset.count || '0'; return; }
    if (reduced) { el.textContent = String(target) + (el.dataset.suffix || ''); return; }
    var start = null, dur = 1400;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased)) + (el.dataset.suffix || '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (counters.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      counters.forEach(animateCount);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  // ── Hero parallax (transform-only, rAF-throttled) ──
  var plxEls = Array.prototype.slice.call(document.querySelectorAll('[data-plx]'));
  if (plxEls.length && !reduced) {
    var ticking = false;
    function applyPlx() {
      ticking = false;
      var y = window.scrollY;
      if (y > 900) return; // hero is long gone — stop doing work
      plxEls.forEach(function (el) {
        var f = parseFloat(el.dataset.plx || '0');
        el.style.setProperty('translate', '0 ' + (y * f).toFixed(1) + 'px');
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(applyPlx); }
    }, { passive: true });
  }

  applyStats();
})();
