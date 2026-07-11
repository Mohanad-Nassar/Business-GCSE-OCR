// ══════════════════════════════════════════════════════════════
// SUBJECT LOADER — root pages only (topic pages get their subject
// from the generated page-groups.js in their own directory instead).
//
// Include order on a root page (all BEFORE progress-shared.js):
//   <script src="/subjects-index.js"></script>      window.SUBJECTS
//   <script src="/page-groups-all.js"></script>     window.PAGE_GROUPS_ALL
//   <script src="/section-totals-all.js"></script>  window.SECTION_TOTALS(_ALL)
//   <script src="/subject-loader.js"></script>
//   <script>subjectLoaderInit({ mode: 'single' });</script>
//
// subjectLoaderInit({ mode })
//   mode: 'single' (default) — one subject's view. Reads ?subject=<slug>
//         from the URL (default 'business'), sets window.SUBJECT to that
//         subject's registry entry and window.PAGE_GROUPS to its topic
//         tree. Used by dashboard.html, daily-revise.html, index.html and
//         the teacher pages (TODO(step-5): teacher pages should resolve
//         the subject from the selected class instead of the URL).
//   mode: 'all' — cross-subject view (badges.html/profile): merges every
//         subject's topic tree into window.PAGE_GROUPS (registry order)
//         and leaves window.SUBJECT null.
//
// Placeholder subjects (registered in subjects-index.js but with no
// generated content yet) simply contribute no topic groups — callers can
// rely on window.PAGE_GROUPS always being an array.
//
// Synchronous by design: everything after this <script> can rely on
// window.SUBJECT / window.PAGE_GROUPS, exactly like on a topic page.
// ══════════════════════════════════════════════════════════════

function subjectLoaderInit(opts) {
  opts = opts || {};
  var subjects = window.SUBJECTS || [];
  var groupsAll = window.PAGE_GROUPS_ALL || {};

  if (opts.mode === 'all') {
    window.SUBJECT = null;
    window.PAGE_GROUPS = subjects.reduce(function (acc, s) {
      return acc.concat(groupsAll[s.slug] || []);
    }, []);
    return null;
  }

  // mode: 'single'
  // Subject resolution order: explicit ?subject= wins, then the subject the
  // student last worked in (persisted below — so an economics student who
  // opens a bare daily-revise.html link doesn't silently get business
  // questions), then business as the final fallback.
  var slug = null;
  try {
    slug = new URLSearchParams(location.search).get('subject');
  } catch (e) { /* very old browser — fall through */ }
  if (!slug) {
    try { slug = localStorage.getItem('gcse_last_subject'); } catch (e) {}
  }
  slug = slug || opts.defaultSubject || 'business';

  var subject = null;
  for (var i = 0; i < subjects.length; i++) {
    if (subjects[i].slug === slug) { subject = subjects[i]; break; }
  }
  if (!subject) {
    if (slug !== 'business') console.error('subject-loader: unknown subject "' + slug + '" — falling back to business');
    for (var j = 0; j < subjects.length; j++) {
      if (subjects[j].slug === 'business') { subject = subjects[j]; break; }
    }
    subject = subject || subjects[0] || null;
  }

  window.SUBJECT = subject;
  window.PAGE_GROUPS = (subject && groupsAll[subject.slug]) || [];
  // Remember the resolved subject so bare links (no ?subject=) keep the
  // student in the subject they were last working in. Topic pages persist
  // the same key via account-cluster.js (they set window.SUBJECT from their
  // own page-groups.js instead of running this loader). Never persist a
  // FALLBACK though — when the URL asked for something we couldn't resolve
  // (e.g. review-calendar's ?subject=all, or a typo), recording the
  // business fallback would silently corrupt the student's real subject.
  if (subject && subject.slug === slug) {
    try { localStorage.setItem('gcse_last_subject', subject.slug); } catch (e) {}
  }
  if (subject && !(subject.slug in groupsAll)) {
    console.error('subject-loader: no page-groups entry for "' + subject.slug + '" (placeholder subject with no content yet?)');
  }
  return subject;
}
