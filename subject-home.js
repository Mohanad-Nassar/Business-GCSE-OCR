// ══════════════════════════════════════════════════════════════
// SUBJECT HOME RENDERER — shared by every subjects/<slug>/index.html.
//
// Renders one subject's topic-card grid from a PAGE_GROUPS-shaped array
// (the same tree structure the generated page-groups.js sets as
// window.PAGE_GROUPS on every topic page) into a container element. This
// is the data-driven replacement for the ~38 hand-written <a
// class="topic-card"> blocks the old root index.html used to carry for
// Business — every subject's landing page calls this same function, so
// all three (and any future subject) render consistently and stay in
// sync with subjects/<slug>/subject.json automatically, with zero hand
// transcription.
//
// Include order on a subject landing page (after that directory's own
// generated page-groups.js, which sets window.SUBJECT / window.PAGE_GROUPS
// exactly like a topic page does):
//   <script src="page-groups.js"></script>
//   <script src="/subject-home.js"></script>
//   <script>renderSubjectHome(document.getElementById('topicsMount'));</script>
//
// renderSubjectHome(container, opts)
//   container    : DOM element whose innerHTML is replaced with the
//                  rendered markup. No-op if falsy.
//   opts.groups  : array of PAGE_GROUPS-shaped group objects to render
//                  (default: window.PAGE_GROUPS). Pass a slice to split
//                  one subject's tree across multiple mounts (e.g.
//                  Business's Component One / Component Two split).
//   opts.idPrefix: prefix used for each rendered <section>'s DOM id, so
//                  multiple calls into different mounts on the same page
//                  don't collide (default: 'sec').
//
// Markup produced per group (unchanged classes from the original
// hand-written index.html, so existing CSS — topic-grid/topic-card/
// section-group/etc. — applies with no changes):
//   <div class="section-group" id="...">
//     <div class="section-group-header">
//       <span class="section-dot" style="background:<group.colour>"></span>
//       <h3 class="section-name"><group.title></h3>
//       <span class="section-line"></span>
//     </div>
//     <div class="topic-grid">
//       <a class="topic-card" href="<page.href>" style="--accent:<group.colour>">
//         <span class="code"><leading token of page.name></span>
//         <h3><rest of page.name></h3>
//         <div class="card-meta"><span><page.sub or group label></span><span class="arrow">→</span></div>
//       </a>
//       ... one more per page.children (prefixed "↳ ", class "child-card") ...
//     </div>
//   </div>
//
// There is no hand-written per-topic description in the manifest data
// (only id/name/sub/href/children) — rather than invent copy, the card's
// meta line simply uses the page's own "sub" field when present, falling
// back to the group's section label. This keeps the function honest to
// its data source instead of fabricating content.
// ══════════════════════════════════════════════════════════════

function renderSubjectHome(container, opts) {
  opts = opts || {};
  const groups = opts.groups || window.PAGE_GROUPS || [];
  const idPrefix = opts.idPrefix || 'sec';
  if (!container) return;

  // "1. Business Activity" -> "Business Activity" (strip a leading
  // "<number>. " so the fallback card-meta line doesn't repeat the code
  // badge's own number).
  function sectionLabel(group) {
    const title = group.title || '';
    return title.replace(/^\d+(?:\.\d+)*\.\s*/, '') || title;
  }

  function cardHtml(page, group, isChild) {
    const name = page.name || '';
    const m = /^(\S+)\s+([\s\S]*)$/.exec(name);
    const code = m ? m[1] : '';
    const title = (isChild ? '↳ ' : '') + (m ? m[2] : name);
    const meta = page.sub || sectionLabel(group);
    const accent = group.colour ? ` style="--accent:${group.colour}"` : '';
    return `<a class="topic-card${isChild ? ' child-card' : ''}" href="${page.href}"${accent}>
        <span class="code">${code}</span>
        <h3>${title}</h3>
        <div class="card-meta">
          <span>${meta}</span>
          <span class="arrow" aria-hidden="true">→</span>
        </div>
      </a>`;
  }

  const html = groups.map(group => {
    const cards = (group.pages || []).map(page => {
      let out = cardHtml(page, group, false);
      if (page.children && page.children.length) {
        out += page.children.map(child => cardHtml(child, group, true)).join('');
      }
      return out;
    }).join('');

    return `<div class="section-group" id="${idPrefix}-${group.id}">
        <div class="section-group-header">
          <span class="section-dot" aria-hidden="true" style="background:${group.colour || 'var(--accent)'}"></span>
          <h3 class="section-name">${group.title}</h3>
          <span class="section-line"></span>
        </div>
        <div class="topic-grid">${cards}</div>
      </div>`;
  }).join('');

  container.innerHTML = html;
}
