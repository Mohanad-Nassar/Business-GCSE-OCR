/* math-render.js — shared KaTeX rendering helper for the Additional Maths subject.
 *
 * Exposes ONE global: renderMathIn(el). Call it after inserting any HTML that may
 * contain LaTeX, on any surface. It walks text nodes and renders \(...\) inline and
 * \[...\] display maths in place.
 *
 * Contract (see ADDMATHS-CONTENT-PLAN.md §8 and resources/addmaths/research/
 * math-rendering-plan.md):
 *  - Delimiters are \(...\) and \[...\] ONLY. Never $...$ (currency clashes; ${ is
 *    template-literal interpolation the build parser rejects).
 *  - Content is stored as RAW LaTeX and rendered AFTER sanitised insertion — never
 *    store pre-rendered KaTeX HTML (taskRichText / sanitize-html strip its attributed
 *    spans; the \( delimiters pass through untouched as plain text).
 *  - pre/code/textarea/option and .no-math are left alone (CS code samples, answer
 *    boxes, and opt-out content never get mathified).
 *  - Bad LaTeX renders as red source (throwOnError:false) — never a blank page.
 *
 * Loading: Additional Maths topic pages include the vendored KaTeX assets + this file
 * statically BEFORE /script.js, so renderMathInElement is defined when script.js's
 * activity builders call renderMathIn at DOMContentLoaded. Shared surfaces (task.html,
 * daily-revise, review-calendar, teacher-worksheets, the maths mock runner) may load
 * this file WITHOUT the KaTeX assets; the first renderMathIn call whose container holds
 * math lazily injects the vendored CSS/JS, then renders. Non-maths pages that never
 * call renderMathIn, or call it on math-free content, load zero KaTeX bytes.
 */
(function (global) {
  'use strict';

  var KATEX_BASE = '/vendor/katex/';

  var DELIMITERS = [
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true }
  ];

  // Do not mathify inside these — code samples, answer inputs, opted-out content.
  var IGNORED_TAGS = ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'];
  var IGNORED_CLASSES = ['no-math'];

  var assetsPromise = null;

  function doRender(el) {
    if (typeof global.renderMathInElement !== 'function') return false;
    try {
      global.renderMathInElement(el, {
        delimiters: DELIMITERS,
        throwOnError: false,
        ignoredTags: IGNORED_TAGS,
        ignoredClasses: IGNORED_CLASSES
      });
      return true;
    } catch (e) {
      // Never let a maths render break an activity build.
      return false;
    }
  }

  function hasMath(el) {
    if (!el) return false;
    var t = el.textContent || '';
    return t.indexOf('\\(') !== -1 || t.indexOf('\\[') !== -1;
  }

  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = resolve; // resolve anyway; doRender will just no-op
      document.head.appendChild(s);
    });
  }

  function ensureAssets() {
    if (assetsPromise) return assetsPromise;
    assetsPromise = new Promise(function (resolve) {
      if (!document.querySelector('link[data-katex]')) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = KATEX_BASE + 'katex.min.css';
        link.setAttribute('data-katex', '');
        document.head.appendChild(link);
      }
      var chain = Promise.resolve();
      if (typeof global.katex === 'undefined') {
        chain = chain.then(function () { return loadScript(KATEX_BASE + 'katex.min.js'); });
      }
      if (typeof global.renderMathInElement !== 'function') {
        chain = chain.then(function () { return loadScript(KATEX_BASE + 'contrib/auto-render.min.js'); });
      }
      chain.then(resolve);
    });
    return assetsPromise;
  }

  function renderMathIn(el) {
    if (!el) return;
    // Fast path: assets already present (every Additional Maths topic page).
    if (typeof global.renderMathInElement === 'function') {
      doRender(el);
      return;
    }
    // Lazy path: only pay for KaTeX if this container actually has maths.
    if (!hasMath(el)) return;
    ensureAssets().then(function () { doRender(el); });
  }

  global.renderMathIn = renderMathIn;
})(window);
