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

  // ── Reveal on scroll & Animate progress bars ──
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.rv'));

  function triggerInnerAnimations(el) {
    // Animate CSS progress bars inside revealed elements
    var bars = el.querySelectorAll('.fv-bar i[data-width]');
    for (var i = 0; i < bars.length; i++) {
      if (reduced) {
        bars[i].style.width = bars[i].getAttribute('data-width');
        bars[i].style.transition = 'none';
      } else {
        // Small delay so the bar animates *after* the card has started revealing
        (function(bar) {
          setTimeout(function() {
            bar.style.width = bar.getAttribute('data-width');
          }, 300);
        })(bars[i]);
      }
    }
  }

  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) {
      el.classList.add('rv-in');
      triggerInnerAnimations(el);
    });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('rv-in');
          triggerInnerAnimations(en.target);
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

    // Interactive 3D tilt on hero stage
    var heroStage = document.querySelector('.hero-stage');
    var mockEls = document.querySelectorAll('.mock');

    if (heroStage && mockEls.length) {
      var tiltTicking = false;
      var mouseX = 0;
      var mouseY = 0;
      var stageRect = null;

      function updateTilt() {
        tiltTicking = false;
        if (!stageRect) return;

        // Calculate relative mouse position (-1 to 1)
        var x = (mouseX - stageRect.left - stageRect.width / 2) / (stageRect.width / 2);
        var y = (mouseY - stageRect.top - stageRect.height / 2) / (stageRect.height / 2);

        // Clamp values to prevent extreme rotation if mouse goes far outside
        x = Math.max(-1, Math.min(1, x));
        y = Math.max(-1, Math.min(1, y));

        mockEls.forEach(function(el, i) {
          // Adjust strength based on element index for variety
          var strength = 8 + (i * 2);
          var rotX = y * -strength;
          var rotY = x * strength;

          el.style.transform = 'translateY(calc(-1 * var(--float-y, 0px))) rotate(var(--tilt, 0deg)) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
        });
      }

      heroStage.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!stageRect) stageRect = heroStage.getBoundingClientRect();

        if (!tiltTicking) {
          tiltTicking = true;
          requestAnimationFrame(updateTilt);
        }
      });

      heroStage.addEventListener('mouseleave', function() {
        mockEls.forEach(function(el) {
          el.style.transform = ''; // Reset to CSS keyframe animation
        });
        stageRect = null;
      });

      // Update rect on scroll or resize
      window.addEventListener('scroll', function() { stageRect = null; }, { passive: true });
      window.addEventListener('resize', function() { stageRect = null; }, { passive: true });
    }
  }

  applyStats();
})();
