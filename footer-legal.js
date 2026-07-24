// Shared site-wide legal footer — injected into every page (signed-out
// marketing/topic pages AND signed-in dashboard/task pages) so the policy
// pages stay reachable without requiring login. Self-contained: no
// dependency on script.js / ProgressStore / auth state, so it works on
// index.html (which doesn't load script.js) exactly the same as everywhere
// else. Safe to include more than once (guarded below).

// ── SITE THEME BOOTSTRAP — this file loads on every page, so it doubles
// as the single hook that (a) re-applies the saved colour theme before
// theme.js arrives, minimising the flash of the default palette, and
// (b) pulls in /theme.js (theme definitions + the floating 🎨 switcher).
// teacher-nav.js carries the same guarded loader for teacher-worksheets,
// the one page without this footer. ──
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
    s.src = '/theme.js'; // root-absolute: also injected on /subjects/<slug>/ pages
    s.setAttribute('data-gcse-theme', '1');
    document.head.appendChild(s);
  }
  if (!window.__gcseMotionInit && !document.querySelector('script[data-gcse-motion]')) {
    var m = document.createElement('script');
    m.src = '/site-motion.js'; // root-absolute: also injected on /subjects/<slug>/ pages
    m.setAttribute('data-gcse-motion', '1');
    document.head.appendChild(m);
  }
})();

(function () {
  if (document.getElementById('siteLegalFooter')) return;

  var CONTACT_EMAIL = 'mohanadmaeen.edu@gmail.com';

  var style = document.createElement('style');
  style.textContent = [
    '#siteLegalFooter{font-family:"DM Sans",sans-serif;background:var(--chrome, var(--ink,#0f1923));',
    'color:var(--chrome-text, var(--paper,#f5f0e8));padding:22px 24px 20px;font-size:12.5px;line-height:1.6;}',
    '#siteLegalFooter .flf-links{display:flex;flex-wrap:wrap;gap:6px 16px;',
    'font-family:"DM Mono",monospace;font-size:11px;letter-spacing:.04em;margin-bottom:10px;}',
    '#siteLegalFooter .flf-links a{color:var(--chrome-text, var(--paper,#f5f0e8));opacity:.85;text-decoration:none;}',
    '#siteLegalFooter .flf-links a:hover{opacity:1;text-decoration:underline;}',
    '#siteLegalFooter .flf-note{opacity:.65;max-width:760px;}',
    '#siteLegalFooter .flf-note a{color:inherit;}',
    '@media (min-width:900px){',
    '  body>#siteLegalFooter{grid-column:1 / -1;}',
    '}',
  ].join('');
  document.head.appendChild(style);

  var footer = document.createElement('footer');
  footer.id = 'siteLegalFooter';
  footer.innerHTML =
    '<nav class="flf-links" aria-label="Legal">' +
      // Root-absolute: this footer is injected on topic pages under
      // /subjects/<slug>/ as well as on root pages.
      '<a href="/privacy-policy.html">Privacy Policy</a>' +
      '<a href="/cookie-policy.html">Cookie Policy</a>' +
      '<a href="/terms.html">Terms &amp; Conditions</a>' +
      '<a href="/acceptable-use.html">Acceptable Use</a>' +
      '<a href="/childrens-code.html">Children’s Code</a>' +
      '<a href="/accessibility.html">Accessibility</a>' +
      '<a href="mailto:' + CONTACT_EMAIL + '">Contact</a>' +
    '</nav>' +
    '<p class="flf-note">An independent, teacher-led revision resource. It is <strong>not affiliated ' +
      'with, endorsed by, or connected to any awarding body</strong> (including OCR and AQA). ' +
      'Qualification names, specification codes and command words are used only to indicate which ' +
      'courses this material supports; all notes, questions and mark schemes are original and were ' +
      'written for this site. Formal adoption by Avanti Schools Trust is pending — see the ' +
      '<a href="/privacy-policy.html">Privacy Policy</a> for data-protection contact details.</p>';

  document.body.appendChild(footer);
})();
