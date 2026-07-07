// Shared site-wide legal footer — injected into every page (signed-out
// marketing/topic pages AND signed-in dashboard/task pages) so the policy
// pages stay reachable without requiring login. Self-contained: no
// dependency on script.js / ProgressStore / auth state, so it works on
// index.html (which doesn't load script.js) exactly the same as everywhere
// else. Safe to include more than once (guarded below).
(function () {
  if (document.getElementById('siteLegalFooter')) return;

  var CONTACT_EMAIL = 'mohanadmaeen.edu@gmail.com';

  var style = document.createElement('style');
  style.textContent = [
    '#siteLegalFooter{font-family:"DM Sans",sans-serif;background:var(--ink,#0f1923);',
    'color:var(--paper,#f5f0e8);padding:22px 24px 20px;font-size:12.5px;line-height:1.6;}',
    '#siteLegalFooter .flf-links{display:flex;flex-wrap:wrap;gap:6px 16px;',
    'font-family:"DM Mono",monospace;font-size:11px;letter-spacing:.04em;margin-bottom:10px;}',
    '#siteLegalFooter .flf-links a{color:var(--paper,#f5f0e8);opacity:.85;text-decoration:none;}',
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
    '<p class="flf-note">This is a teacher-led revision resource for OCR GCSE Business ' +
      'Studies (J204). Formal adoption by Avanti Schools Trust is pending — see the ' +
      '<a href="/privacy-policy.html">Privacy Policy</a> for current data-protection contact details.</p>';

  document.body.appendChild(footer);
})();
