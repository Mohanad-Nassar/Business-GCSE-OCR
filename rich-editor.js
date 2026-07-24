// ══════════════════════════════════════════════════════════════
// RICH TEXT EDITOR (shared) — the no-code editor teachers use to
// write topic content, plus the sanitiser that makes that content
// safe to show students. Used by teacher-subjects.html (subject
// builder wizard) and subject-view.html (inline topic editing).
//
// Public API (window.RichText):
//   sanitize(html)            -> safe HTML string. THE security
//                                boundary: run on save AND on render.
//   injectContentStyles()     -> once-per-page styles for .rt-content
//                                (rendered topics look identical in
//                                the editor and the student view).
//   create(mountEl, opts)     -> editor instance:
//        { getHTML, setHTML, insertHTML, isDirty, markClean,
//          focus, destroy }
//     opts: { client, teacherId, placeholder }
//        client/teacherId power image upload to the `topic-images`
//        storage bucket (supabase/teacher-subjects.sql).
//
// Images: insert by upload, by paste, or by web address (a linked image
//   is copied into the bucket when the other host allows it, so it can't
//   rot and stays canvas-editable). Clicking an image pins a control
//   panel + corner drag handles to it: size, rotate, crop, alignment,
//   text wrap, alt text, delete. That UI is position:fixed on <body> and
//   NEVER inside .rt-area — anything in there lands in getHTML().
//   Rotate/crop re-encode the pixels through a canvas rather than using a
//   CSS transform, so what students get is a plain <img> that lays out
//   and prints normally. Placement is one of the rt-img-* classes (styled
//   in CONTENT_CSS, allowlisted in ALLOWED_CLASSES) rather than free-form
//   CSS, so a teacher can only produce layouts the student view styles.
//   lessonTemplate(title)     -> starter scaffold HTML a teacher can
//                                insert instead of a blank page.
//   escapeHtml(str)
//
// Security notes (docs/SECURITY-AUDIT-xss.md applies):
//  · Content is authored by teachers but RENDERED for students, so
//    it is treated as hostile at render time regardless of source.
//  · sanitize() is a DOM-walk allowlist (not regex): parse inert via
//    DOMParser, remove script-capable elements entirely, unwrap
//    unknown tags, drop every attribute not explicitly allowed,
//    validate URL schemes, and filter style declarations against a
//    property allowlist (no url()/expression() values).
//  · SVG/MathML subtrees are removed outright (mXSS vectors).
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── Sanitiser ──────────────────────────────────────────────────

  // Tags removed WITH their children — script-capable or embed-like.
  var KILL_TAGS = {
    script: 1, style: 1, iframe: 1, object: 1, embed: 1, applet: 1, frame: 1,
    frameset: 1, base: 1, link: 1, meta: 1, form: 1, input: 1, button: 1,
    select: 1, option: 1, textarea: 1, video: 1, audio: 1, source: 1, track: 1,
    svg: 1, math: 1, template: 1, noscript: 1, slot: 1, canvas: 1, map: 1,
    area: 1, dialog: 1, portal: 1,
  };

  // Tags kept as-is. Anything not here and not in KILL_TAGS is unwrapped
  // (element dropped, its children kept), so pasted Word/Docs markup
  // degrades to plain content instead of breaking.
  var ALLOWED_TAGS = {
    p: 1, div: 1, br: 1, hr: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1,
    strong: 1, b: 1, em: 1, i: 1, u: 1, s: 1, strike: 1, mark: 1,
    sub: 1, sup: 1, code: 1, pre: 1, blockquote: 1,
    ul: 1, ol: 1, li: 1,
    a: 1, img: 1, span: 1, font: 1,
    table: 1, thead: 1, tbody: 1, tfoot: 1, tr: 1, th: 1, td: 1, caption: 1,
    figure: 1, figcaption: 1,
  };

  // Per-tag attribute allowlist (style/class are handled separately).
  var TAG_ATTRS = {
    a: { href: 1, title: 1 },
    img: { src: 1, alt: 1, width: 1, height: 1 },
    th: { colspan: 1, rowspan: 1 },
    td: { colspan: 1, rowspan: 1 },
    ol: { start: 1, type: 1 },
    font: { color: 1 }, // execCommand foreColor emits <font color> in some engines
    // Spanish topic-page content (rendered through this sanitizer wherever a
    // `reading` bank field is shown — daily-revise/task/review) marks audible
    // Spanish with data-say/data-listen (see speech.js). Plain-text values,
    // no markup/URL risk — safe to pass through untouched like any other
    // allowlisted attribute.
    span: { 'data-say': 1, 'data-listen': 1 },
  };

  // Inline style properties a teacher can legitimately produce with the
  // toolbar (plus safe paste leftovers). Everything else is dropped.
  var STYLE_PROPS = {
    'color': 1, 'background-color': 1, 'text-align': 1, 'font-size': 1,
    'font-weight': 1, 'font-style': 1, 'text-decoration': 1,
    'text-decoration-line': 1, 'width': 1, 'height': 1, 'max-width': 1,
    'margin-left': 1, 'padding-left': 1, 'list-style-type': 1,
    'vertical-align': 1, 'border-collapse': 1,
  };

  // Class tokens the editor itself emits (callout boxes, image placement).
  // Everything else — including pasted junk — is stripped. Placement is a
  // fixed class rather than free-form CSS so a teacher can never emit
  // position/float rules we haven't styled for the student view.
  var ALLOWED_CLASSES = {
    'rt-callout': 1, 'rt-tip': 1, 'rt-keyterm': 1, 'rt-warning': 1,
    'rt-img-left': 1, 'rt-img-center': 1, 'rt-img-right': 1,
    'rt-img-wrap-left': 1, 'rt-img-wrap-right': 1,
    'vocab-tbl': 1, 'tier-h': 1, // Spanish topic pages' vocab table + tier-tag styling — same reading-field path as data-say above
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function safeUrl(value, kind) {
    var v = String(value || '').trim();
    if (!v) return null;
    if (kind === 'img' && /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(v)) return v;
    var u;
    try { u = new URL(v, location.origin); } catch (e) { return null; }
    if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
    if (kind === 'link' && u.protocol === 'mailto:') return u.href;
    return null;
  }

  // Filter one style="" value down to allowlisted properties with inert
  // values. Uses the element's parsed CSSStyleDeclaration (no regex over
  // raw CSS), rebuilt property by property.
  function filterStyle(el) {
    var out = [];
    for (var i = 0; i < el.style.length; i++) {
      var prop = el.style[i];
      if (!STYLE_PROPS[prop]) continue;
      var val = el.style.getPropertyValue(prop);
      if (/url\s*\(|expression\s*\(|javascript|image-set\s*\(/i.test(val)) continue;
      out.push(prop + ':' + val);
    }
    if (out.length) el.setAttribute('style', out.join(';'));
    else el.removeAttribute('style');
  }

  function filterClass(el) {
    var kept = (el.getAttribute('class') || '').split(/\s+/).filter(function (c) {
      return ALLOWED_CLASSES[c];
    });
    if (kept.length) el.setAttribute('class', kept.join(' '));
    else el.removeAttribute('class');
  }

  function sanitize(html) {
    var doc = new DOMParser().parseFromString('<body>' + String(html == null ? '' : html), 'text/html');
    var body = doc.body;

    // Comments + processing instructions can smuggle markup on reserialise.
    var walker = doc.createTreeWalker(body, NodeFilter.SHOW_COMMENT, null);
    var junk = [], n;
    while ((n = walker.nextNode())) junk.push(n);
    junk.forEach(function (c) { c.remove(); });

    var nodes = Array.prototype.slice.call(body.querySelectorAll('*'));
    nodes.forEach(function (el) {
      if (!el.isConnected) return; // ancestor already removed
      var tag = el.localName;

      if (KILL_TAGS[tag] || el.namespaceURI !== 'http://www.w3.org/1999/xhtml') {
        el.remove();
        return;
      }
      if (!ALLOWED_TAGS[tag]) { // unwrap: keep children, drop the tag
        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
        el.remove();
        return;
      }

      var perTag = TAG_ATTRS[tag] || {};
      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        if (name === 'style' || name === 'class') return; // filtered below
        if (name.indexOf('on') === 0 || !perTag[name]) { el.removeAttribute(attr.name); return; }
        if (tag === 'a' && name === 'href') {
          var href = safeUrl(attr.value, 'link');
          if (href) el.setAttribute('href', href);
          else el.removeAttribute('href');
        } else if (tag === 'img' && name === 'src') {
          var src = safeUrl(attr.value, 'img');
          if (src) el.setAttribute('src', src);
          else el.remove();
        } else if (tag === 'font' && name === 'color') {
          if (!/^#[0-9a-f]{3,8}$|^[a-z]{2,20}$|^rgb\([\d\s,]+\)$/i.test(attr.value)) el.removeAttribute('color');
        } else if ((name === 'width' || name === 'height' || name === 'colspan' || name === 'rowspan' || name === 'start') &&
                   !/^\d{1,4}$/.test(attr.value)) {
          el.removeAttribute(attr.name);
        }
      });
      if (!el.isConnected) return; // removed above (bad img src)

      filterStyle(el);
      filterClass(el);

      if (tag === 'a' && el.getAttribute('href')) {
        // External-safe defaults on every link.
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
      if (tag === 'img' && !el.getAttribute('alt')) el.setAttribute('alt', '');
    });

    return body.innerHTML;
  }

  // ── Shared content styles (editor area + student render) ───────

  var CONTENT_CSS = [
    '.rt-content{font-size:15px;line-height:1.65;color:var(--ink,#0f1923);word-wrap:break-word;}',
    // Wrapped images float, so the container must grow to contain them or the
    // next section rides up alongside the picture.
    '.rt-content::after{content:"";display:table;clear:both;}',
    '.rt-content>*+*{margin-top:10px;}',
    '.rt-content h2{font-family:"Playfair Display",serif;font-size:24px;font-weight:700;margin-top:26px;}',
    '.rt-content h3{font-family:"Playfair Display",serif;font-size:19px;font-weight:700;margin-top:20px;}',
    '.rt-content h4{font-size:15.5px;font-weight:600;margin-top:16px;}',
    '.rt-content ul,.rt-content ol{padding-left:26px;}',
    '.rt-content li+li{margin-top:4px;}',
    '.rt-content a{color:var(--accent,#4a6fa5);}',
    '.rt-content img{max-width:100%;height:auto;border-radius:8px;}',
    // Image placement. Width lives in an inline style (a %, so it stays
    // responsive); WHERE the image sits is one of these classes.
    '.rt-content img.rt-img-left{display:block;margin-left:0;margin-right:auto;}',
    '.rt-content img.rt-img-center{display:block;margin-left:auto;margin-right:auto;}',
    '.rt-content img.rt-img-right{display:block;margin-left:auto;margin-right:0;}',
    '.rt-content img.rt-img-wrap-left{float:left;margin:4px 18px 12px 0;clear:left;}',
    '.rt-content img.rt-img-wrap-right{float:right;margin:4px 0 12px 18px;clear:right;}',
    // A 35%-wide float leaves an unreadable ribbon of text on a phone, so
    // wrapped images become ordinary centred ones there (keeping their size).
    '@media (max-width:640px){.rt-content img.rt-img-wrap-left,.rt-content img.rt-img-wrap-right{',
    '  float:none;display:block;margin:12px auto;}}',
    '.rt-content hr{border:none;border-top:1px solid var(--border,#c9bfaa);margin:18px 0;}',
    '.rt-content blockquote{border-left:3px solid var(--accent,#4a6fa5);padding:6px 14px;color:var(--mid,#5a6e7f);background:var(--cream,#ede7d9);border-radius:0 8px 8px 0;}',
    '.rt-content table{border-collapse:collapse;width:100%;margin:12px 0;font-size:13.5px;}',
    '.rt-content th,.rt-content td{border:1px solid var(--border,#c9bfaa);padding:8px 10px;text-align:left;vertical-align:top;}',
    '.rt-content th{background:var(--cream,#ede7d9);font-weight:600;}',
    '.rt-content pre,.rt-content code{font-family:"DM Mono",monospace;font-size:13px;background:var(--cream,#ede7d9);border-radius:4px;}',
    '.rt-content pre{padding:12px;overflow-x:auto;}',
    '.rt-content code{padding:1px 5px;}',
    // Highlighted text pins to dark ink so it reads on the light highlight
    // under every theme (matches the highlight toolbar action).
    '.rt-content mark{background:#ffe89b;color:#1f2933;border-radius:2px;padding:0 2px;}',
    // flow-root so an image wrapped inside a box stays inside its border.
    '.rt-content .rt-callout,.rt-content .rt-tip,.rt-content .rt-keyterm,.rt-content .rt-warning{',
    '  border:1px solid var(--border,#c9bfaa);border-radius:10px;padding:12px 16px;margin:14px 0;display:flow-root;}',
    '.rt-content .rt-tip{border-left:4px solid var(--success,#2d7a4f);background:rgba(45,122,79,.06);}',
    '.rt-content .rt-keyterm{border-left:4px solid var(--gold,#d4a843);background:rgba(212,168,67,.08);}',
    '.rt-content .rt-warning{border-left:4px solid #c84b31;background:rgba(200,75,49,.06);}',
    '.rt-content .rt-callout{border-left:4px solid var(--accent,#4a6fa5);background:rgba(74,111,165,.06);}',
  ].join('\n');

  function injectContentStyles() {
    if (document.getElementById('rt-content-styles')) return;
    var s = document.createElement('style');
    s.id = 'rt-content-styles';
    s.textContent = CONTENT_CSS;
    document.head.appendChild(s);
  }

  // ── Editor chrome styles ───────────────────────────────────────

  var EDITOR_CSS = [
    '.rt-editor{border:1px solid var(--border,#c9bfaa);border-radius:10px;background:var(--card-bg,#fffcf6);position:relative;}',
    '.rt-editor.rt-focus{border-color:var(--accent,#4a6fa5);box-shadow:0 0 0 2px rgba(74,111,165,.15);}',
    '.rt-toolbar{display:flex;flex-wrap:wrap;gap:2px;align-items:center;padding:8px;border-bottom:1px solid var(--border,#c9bfaa);',
    '  position:sticky;top:0;background:var(--card-bg,#fffcf6);z-index:5;border-radius:10px 10px 0 0;}',
    '.rt-btn{min-width:32px;height:32px;padding:0 7px;border:1px solid transparent;border-radius:6px;background:transparent;',
    '  color:var(--ink,#0f1923);cursor:pointer;font-size:14px;line-height:1;display:inline-flex;align-items:center;justify-content:center;gap:3px;}',
    '.rt-btn:hover{background:var(--cream,#ede7d9);border-color:var(--border,#c9bfaa);}',
    '.rt-btn:focus-visible{outline:2px solid var(--accent,#4a6fa5);outline-offset:1px;}',
    '.rt-btn b{font-family:Georgia,serif;}',
    '.rt-sep{width:1px;height:22px;background:var(--border,#c9bfaa);margin:0 5px;flex:none;}',
    '.rt-select{height:32px;border:1px solid var(--border,#c9bfaa);border-radius:6px;background:var(--card-bg,#fffcf6);',
    '  color:var(--ink,#0f1923);font-family:"DM Sans",sans-serif;font-size:12.5px;padding:0 6px;cursor:pointer;}',
    '.rt-area{min-height:280px;max-height:70vh;overflow-y:auto;padding:18px 22px;outline:none;border-radius:0 0 10px 10px;}',
    '.rt-area:empty::before{content:attr(data-placeholder);color:var(--mid,#5a6e7f);font-style:italic;pointer-events:none;}',
    '.rt-pop{position:absolute;z-index:30;background:var(--card-bg,#fffcf6);border:1px solid var(--border,#c9bfaa);',
    '  border-radius:10px;box-shadow:0 10px 30px rgba(15,25,35,.18);padding:10px;}',
    '.rt-swatches{display:grid;grid-template-columns:repeat(6,26px);gap:5px;}',
    '.rt-swatch{width:26px;height:26px;border-radius:6px;border:1px solid rgba(0,0,0,.15);cursor:pointer;padding:0;}',
    '.rt-swatch:hover{transform:scale(1.12);}',
    '.rt-pop label{display:block;font-family:"DM Mono",monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--mid,#5a6e7f);margin:8px 0 4px;}',
    '.rt-pop input[type=text],.rt-pop input[type=url]{width:240px;padding:8px 10px;border:1px solid var(--border,#c9bfaa);border-radius:6px;font-size:13px;background:var(--card-bg,#fffcf6);color:var(--ink,#0f1923);}',
    '.rt-pop .rt-apply{margin-top:8px;background:var(--accent,#4a6fa5);color:#fff;border:none;border-radius:6px;padding:7px 14px;font-size:12.5px;font-weight:600;cursor:pointer;}',
    '.rt-grid{display:grid;grid-template-columns:repeat(6,20px);gap:3px;}',
    '.rt-cell{width:20px;height:20px;border:1px solid var(--border,#c9bfaa);border-radius:3px;background:var(--card-bg,#fffcf6);cursor:pointer;padding:0;}',
    '.rt-cell.on{background:var(--accent,#4a6fa5);border-color:var(--accent,#4a6fa5);}',
    '.rt-grid-label{text-align:center;font-size:11px;color:var(--mid,#5a6e7f);margin-top:6px;font-family:"DM Mono",monospace;}',
    '.rt-pop .rt-file{display:block;width:100%;margin:0;background:var(--cream,#ede7d9);border:1px solid var(--border,#c9bfaa);',
    '  border-radius:6px;padding:9px 12px;font-size:12.5px;font-weight:600;color:var(--ink,#0f1923);cursor:pointer;}',
    '.rt-pop .rt-file:hover{border-color:var(--accent,#4a6fa5);}',
    '.rt-pop .rt-hint{font-size:11px;line-height:1.45;color:var(--mid,#5a6e7f);margin-top:6px;max-width:240px;}',
    '.rt-status{font-family:"DM Mono",monospace;font-size:11px;color:var(--mid,#5a6e7f);padding:2px 8px;}',
    '.rt-area img.rt-selected{outline:3px solid var(--accent,#4a6fa5);outline-offset:2px;}',
    // Image UI (panel, resize handles, crop overlay) is position:fixed on the
    // body — never inside .rt-area, so it can't leak into the saved HTML —
    // and is re-pinned to the image on scroll/resize.
    '.rt-imgpanel{position:fixed;z-index:60;display:flex;flex-wrap:wrap;gap:2px;align-items:center;',
    '  max-width:min(94vw,580px);background:var(--card-bg,#fffcf6);border:1px solid var(--border,#c9bfaa);',
    '  border-radius:10px;box-shadow:0 10px 30px rgba(15,25,35,.22);padding:6px;}',
    '.rt-imgpanel .rt-btn{height:30px;min-width:30px;font-size:13px;}',
    '.rt-imgpanel .rt-btn.on{background:var(--accent,#4a6fa5);border-color:var(--accent,#4a6fa5);color:#fff;}',
    '.rt-imgpanel .rt-btn[disabled]{opacity:.4;cursor:not-allowed;}',
    '.rt-imgpanel .rt-btn.rt-danger:hover{background:rgba(200,75,49,.12);border-color:#c84b31;}',
    '.rt-imgw{font-family:"DM Mono",monospace;font-size:11px;color:var(--mid,#5a6e7f);min-width:40px;text-align:center;}',
    '.rt-imgnote{font-size:11px;color:var(--mid,#5a6e7f);padding:0 6px;max-width:260px;}',
    '.rt-handles{position:fixed;z-index:59;pointer-events:none;}',
    '.rt-handle{position:absolute;width:13px;height:13px;border-radius:50%;background:var(--card-bg,#fffcf6);',
    '  border:2px solid var(--accent,#4a6fa5);pointer-events:auto;box-shadow:0 1px 4px rgba(15,25,35,.35);touch-action:none;}',
    '.rt-handle.nw{left:-7px;top:-7px;cursor:nwse-resize;}',
    '.rt-handle.ne{right:-7px;top:-7px;cursor:nesw-resize;}',
    '.rt-handle.sw{left:-7px;bottom:-7px;cursor:nesw-resize;}',
    '.rt-handle.se{right:-7px;bottom:-7px;cursor:nwse-resize;}',
    '.rt-cropwrap{position:fixed;z-index:58;overflow:hidden;touch-action:none;}',
    '.rt-cropbox{position:absolute;border:1px solid #fff;box-shadow:0 0 0 9999px rgba(15,25,35,.55);cursor:move;}',
    '.rt-cropbox::before{content:"";position:absolute;inset:0;pointer-events:none;',
    '  background:linear-gradient(to right,transparent 33%,rgba(255,255,255,.35) 33% 33.4%,transparent 33.4% 66%,rgba(255,255,255,.35) 66% 66.4%,transparent 66.4%),',
    '  linear-gradient(to bottom,transparent 33%,rgba(255,255,255,.35) 33% 33.4%,transparent 33.4% 66%,rgba(255,255,255,.35) 66% 66.4%,transparent 66.4%);}',
    '.rt-ch{position:absolute;width:14px;height:14px;background:#fff;border:1px solid var(--accent,#4a6fa5);border-radius:2px;touch-action:none;}',
    '.rt-ch.nw{left:0;top:0;cursor:nwse-resize;} .rt-ch.ne{right:0;top:0;cursor:nesw-resize;}',
    '.rt-ch.sw{left:0;bottom:0;cursor:nesw-resize;} .rt-ch.se{right:0;bottom:0;cursor:nwse-resize;}',
    '@media (max-width:640px){.rt-area{padding:14px;}.rt-toolbar{padding:6px;}}',
  ].join('\n');

  function injectEditorStyles() {
    if (document.getElementById('rt-editor-styles')) return;
    var s = document.createElement('style');
    s.id = 'rt-editor-styles';
    s.textContent = EDITOR_CSS;
    document.head.appendChild(s);
  }

  // ── Starter template ───────────────────────────────────────────

  function lessonTemplate(title) {
    var t = escapeHtml(title || 'This topic');
    return [
      '<h2>' + t + '</h2>',
      '<div class="rt-callout"><strong>🎯 Learning objectives</strong><ul>',
      '<li>Understand …</li><li>Be able to explain …</li><li>Apply … to a real example</li></ul></div>',
      '<h3>Key terms</h3>',
      '<table><thead><tr><th>Term</th><th>Definition</th></tr></thead><tbody>',
      '<tr><td><strong>Term 1</strong></td><td>What it means…</td></tr>',
      '<tr><td><strong>Term 2</strong></td><td>What it means…</td></tr></tbody></table>',
      '<h3>Notes</h3>',
      '<p>Write the main explanation here. Use <strong>bold</strong> for key words, add images with the 🖼️ button, and break long ideas into short paragraphs.</p>',
      '<div class="rt-tip"><strong>💡 Tip:</strong> a memorable example or exam hint goes here.</div>',
      '<h3>Worked example</h3>',
      '<p>Show one example, step by step.</p>',
      '<h3>Check your understanding</h3>',
      '<ol><li>Question 1…</li><li>Question 2…</li><li>Question 3…</li></ol>',
    ].join('');
  }

  // ── Editor factory ─────────────────────────────────────────────

  // THEME-SAFE PALETTE. Students read this content under any of the 7 site
  // themes (2 dark). Uncoloured text uses var(--ink) and always adapts, so
  // it matches the platform lessons exactly. These preset text colours are
  // all SATURATED MID-TONES chosen to stay legible on BOTH light (cream) and
  // dark (navy) backgrounds — no near-black or near-white, which would
  // vanish on one theme. The first swatch removes the colour (back to the
  // theme default). Teachers can still pick any custom colour, but the
  // presets are the safe path.
  var AUTO = '__auto__';
  var SWATCHES = [
    AUTO, '#c0392b', '#d97706', '#b8860b', '#2f9e6b', '#2c8c8c',
    '#3b74c4', '#7a5c9e', '#b8336a', '#8a6d3b',
  ];
  // Highlight backgrounds are light; to keep the highlighted TEXT readable
  // even in a dark theme (where default text is light), applying a highlight
  // also pins the text to dark ink (see the highlight handler below).
  var HILITES = [
    '#ffe89b', '#c9e4ca', '#cfe0f4', '#e8d5f2', '#f8cfc4', '#e0e0e0',
    'transparent',
  ];

  function create(mount, opts) {
    opts = opts || {};
    injectEditorStyles();
    injectContentStyles();

    var root = document.createElement('div');
    root.className = 'rt-editor';
    var toolbar = document.createElement('div');
    toolbar.className = 'rt-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Text formatting');
    var area = document.createElement('div');
    area.className = 'rt-area rt-content';
    area.contentEditable = 'true';
    area.setAttribute('data-placeholder', opts.placeholder || 'Start writing here — or insert the lesson template above.');
    root.appendChild(toolbar);
    root.appendChild(area);
    mount.appendChild(root);

    var dirty = false;
    var savedRange = null;
    var openPop = null;
    var selectedImg = null;

    function saveSelection() {
      var sel = window.getSelection();
      if (sel.rangeCount && area.contains(sel.anchorNode)) savedRange = sel.getRangeAt(0).cloneRange();
    }
    function restoreSelection() {
      if (!savedRange) { area.focus(); return; }
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
    function exec(cmd, value, css) {
      restoreSelection();
      try { document.execCommand('styleWithCSS', false, !!css); } catch (e) {}
      document.execCommand(cmd, false, value == null ? null : value);
      try { document.execCommand('styleWithCSS', false, false); } catch (e) {}
      area.focus();
      setDirty();
    }
    function insertHtmlAtCursor(html) {
      restoreSelection();
      document.execCommand('insertHTML', false, html);
      setDirty();
    }
    function setDirty() {
      if (!dirty) { dirty = true; if (typeof opts.onDirty === 'function') opts.onDirty(); }
    }

    function closePop() {
      if (openPop) { openPop.remove(); openPop = null; }
    }
    function showPop(anchorBtn, build) {
      closePop();
      saveSelection();
      var pop = document.createElement('div');
      pop.className = 'rt-pop';
      build(pop);
      root.appendChild(pop);
      var tb = toolbar.getBoundingClientRect();
      var bb = anchorBtn.getBoundingClientRect();
      pop.style.top = (bb.bottom - tb.top + 6) + 'px';
      pop.style.left = Math.max(6, Math.min(bb.left - tb.left, toolbar.clientWidth - pop.offsetWidth - 6)) + 'px';
      openPop = pop;
      var first = pop.querySelector('input, button');
      if (first && first.type !== 'color') first.focus();
    }

    function onDocMouseDown(e) {
      if (openPop && !openPop.contains(e.target) && !toolbar.contains(e.target)) closePop();
      // Pressing the image's own controls must NOT drop the selection: tearing
      // the panel down on mousedown removes the button before its click fires,
      // which silently killed every image action.
      if (selectedImg && e.target !== selectedImg && !inImgUi(e.target)) deselectImg();
    }
    function onDocKeyDown(e) {
      if (e.key === 'Escape') {
        closePop();
        if (cropWrap) closeCrop(); else deselectImg();
        return;
      }
      // Delete/Backspace with an image selected removes it (the caret isn't in
      // the area, so the browser wouldn't).
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedImg && !cropWrap &&
          !inImgUi(e.target) && e.target !== area) {
        e.preventDefault();
        var doomed = selectedImg;
        deselectImg();
        doomed.remove();
        setDirty();
      }
    }
    // The image UI is pinned to a rect, so anything that moves that rect has to
    // re-pin it. Capture phase catches scrolling inside .rt-area too.
    function onReflow() { positionImgUi(); }

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onDocKeyDown);
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);

    // ── Toolbar construction ──
    function btn(label, title, onClick, isHtml) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rt-btn';
      b.title = title;
      b.setAttribute('aria-label', title);
      if (isHtml) b.innerHTML = label; else b.textContent = label;
      // preventDefault on mousedown keeps the text selection alive.
      b.addEventListener('mousedown', function (e) { e.preventDefault(); saveSelection(); });
      b.addEventListener('click', function () { onClick(b); });
      toolbar.appendChild(b);
      return b;
    }
    function sep() {
      var s = document.createElement('span');
      s.className = 'rt-sep';
      s.setAttribute('aria-hidden', 'true');
      toolbar.appendChild(s);
    }

    btn('↺', 'Undo (Ctrl+Z)', function () { exec('undo'); });
    btn('↻', 'Redo (Ctrl+Y)', function () { exec('redo'); });
    sep();

    var blockSel = document.createElement('select');
    blockSel.className = 'rt-select';
    blockSel.title = 'Text style';
    blockSel.setAttribute('aria-label', 'Text style');
    [['p', 'Normal text'], ['h2', 'Heading'], ['h3', 'Subheading'], ['h4', 'Small heading']].forEach(function (o) {
      var op = document.createElement('option');
      op.value = o[0]; op.textContent = o[1];
      blockSel.appendChild(op);
    });
    blockSel.addEventListener('mousedown', saveSelection);
    blockSel.addEventListener('change', function () {
      exec('formatBlock', '<' + blockSel.value + '>');
    });
    toolbar.appendChild(blockSel);
    sep();

    btn('<b>B</b>', 'Bold (Ctrl+B)', function () { exec('bold'); }, true);
    btn('<i>I</i>', 'Italic (Ctrl+I)', function () { exec('italic'); }, true);
    btn('<u>U</u>', 'Underline (Ctrl+U)', function () { exec('underline'); }, true);
    btn('<s>S</s>', 'Strikethrough', function () { exec('strikeThrough'); }, true);
    sep();

    function colorPop(button, swatches, apply, label) {
      showPop(button, function (pop) {
        var grid = document.createElement('div');
        grid.className = 'rt-swatches';
        swatches.forEach(function (c) {
          var sw = document.createElement('button');
          sw.type = 'button';
          sw.className = 'rt-swatch';
          if (c === AUTO) {
            sw.title = 'Auto — match the theme (default)';
            sw.style.background = 'linear-gradient(135deg,#f5f0e8 50%,#1a2332 50%)';
            sw.textContent = 'A';
            sw.style.fontSize = '11px';
            sw.style.fontWeight = '700';
            sw.style.color = '#c0392b';
          } else {
            sw.title = c === 'transparent' ? 'Remove highlight' : c;
            sw.style.background = c === 'transparent'
              ? 'repeating-linear-gradient(45deg,#fff 0 4px,#ddd 4px 8px)' : c;
          }
          sw.addEventListener('click', function () { closePop(); apply(c); });
          grid.appendChild(sw);
        });
        pop.appendChild(grid);
        var lab = document.createElement('label');
        lab.textContent = 'Custom ' + label;
        pop.appendChild(lab);
        var custom = document.createElement('input');
        custom.type = 'color';
        custom.style.width = '100%';
        custom.style.height = '30px';
        custom.style.cursor = 'pointer';
        custom.addEventListener('change', function () { closePop(); apply(custom.value); });
        pop.appendChild(custom);
      });
    }
    btn('<span style="border-bottom:3px solid #c0392b;padding-bottom:1px;font-weight:600;">A</span>', 'Text colour', function (b) {
      // AUTO → color:inherit so the text falls back to the theme's --ink
      // (readable on every theme); otherwise the picked colour.
      colorPop(b, SWATCHES, function (c) { exec('foreColor', c === AUTO ? 'inherit' : c, true); }, 'colour');
    }, true);
    btn('<span style="background:#ffe89b;border-radius:3px;padding:0 4px;font-weight:600;color:#1f2933;">A</span>', 'Highlight', function (b) {
      colorPop(b, HILITES, function (c) {
        if (c === 'transparent') { exec('hiliteColor', 'transparent', true); return; }
        try { exec('hiliteColor', c, true); } catch (e) { exec('backColor', c, true); }
        // Highlight backgrounds are light — pin the text to dark ink so it
        // stays readable even in a dark theme (default text is light there).
        exec('foreColor', '#1f2933', true);
      }, 'highlight');
    }, true);
    sep();

    btn('•≡', 'Bullet list', function () { exec('insertUnorderedList'); });
    btn('1≡', 'Numbered list', function () { exec('insertOrderedList'); });
    sep();
    btn('⇤', 'Align left', function () { exec('justifyLeft'); });
    btn('⇹', 'Align centre', function () { exec('justifyCenter'); });
    btn('⇥', 'Align right', function () { exec('justifyRight'); });
    sep();

    btn('🔗', 'Insert link', function (b) {
      showPop(b, function (pop) {
        var sel = savedRange ? String(savedRange.toString()) : '';
        pop.innerHTML = '<label>Web address</label>';
        var url = document.createElement('input');
        url.type = 'url';
        url.placeholder = 'https://…';
        pop.appendChild(url);
        var lab = document.createElement('label');
        lab.textContent = 'Text to show';
        pop.appendChild(lab);
        var txt = document.createElement('input');
        txt.type = 'text';
        txt.value = sel;
        txt.placeholder = 'e.g. BBC Bitesize page';
        pop.appendChild(txt);
        var go = document.createElement('button');
        go.type = 'button';
        go.className = 'rt-apply';
        go.textContent = 'Insert link';
        go.addEventListener('click', function () {
          var raw = url.value.trim();
          if (raw && !/^[a-z]+:/i.test(raw)) raw = 'https://' + raw;
          var safe = safeUrl(raw, 'link');
          if (!safe) { url.style.borderColor = '#c84b31'; url.focus(); return; }
          var label = txt.value.trim() || safe;
          closePop();
          insertHtmlAtCursor('<a href="' + escapeHtml(safe) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label) + '</a>');
        });
        pop.appendChild(go);
        url.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
        txt.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
      });
    });

    btn('⊞', 'Insert table', function (b) {
      showPop(b, function (pop) {
        var grid = document.createElement('div');
        grid.className = 'rt-grid';
        var label = document.createElement('div');
        label.className = 'rt-grid-label';
        label.textContent = 'Pick size';
        var cells = [];
        for (var r = 1; r <= 6; r++) {
          for (var c = 1; c <= 6; c++) {
            (function (r, c) {
              var cell = document.createElement('button');
              cell.type = 'button';
              cell.className = 'rt-cell';
              cell.setAttribute('aria-label', r + ' rows by ' + c + ' columns');
              cell.addEventListener('mouseenter', function () {
                cells.forEach(function (x) {
                  x.el.classList.toggle('on', x.r <= r && x.c <= c);
                });
                label.textContent = r + ' row' + (r > 1 ? 's' : '') + ' × ' + c + ' column' + (c > 1 ? 's' : '');
              });
              cell.addEventListener('click', function () {
                closePop();
                var head = '<tr>';
                for (var i = 0; i < c; i++) head += '<th>Heading</th>';
                head += '</tr>';
                var rows = '';
                for (var j = 0; j < r; j++) {
                  rows += '<tr>';
                  for (var k = 0; k < c; k++) rows += '<td><br></td>';
                  rows += '</tr>';
                }
                insertHtmlAtCursor('<table><thead>' + head + '</thead><tbody>' + rows + '</tbody></table><p><br></p>');
              });
              cells.push({ el: cell, r: r, c: c });
              grid.appendChild(cell);
            })(r, c);
          }
        }
        pop.appendChild(grid);
        pop.appendChild(label);
      });
    });

    // ── Images ──
    var MAX_IMAGE = 2 * 1024 * 1024;   // upload ceiling
    var INLINE_LIMIT = 150 * 1024;     // data-URL fallback ceiling (keeps rows small)

    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/gif,image/webp';
    fileInput.style.display = 'none';
    root.appendChild(fileInput);
    var statusEl = document.createElement('span');
    statusEl.className = 'rt-status';
    statusEl.setAttribute('aria-live', 'polite');

    var statusTimer = null;
    function setStatus(msg, transient) {
      statusEl.textContent = msg || '';
      clearTimeout(statusTimer);
      if (msg && transient) statusTimer = setTimeout(function () { statusEl.textContent = ''; }, 4000);
    }

    function readAsDataUrl(blob) {
      return new Promise(function (resolve, reject) {
        var rd = new FileReader();
        rd.onload = function () { resolve(rd.result); };
        rd.onerror = function () { reject(new Error('Could not read that image file.')); };
        rd.readAsDataURL(blob);
      });
    }

    function extFor(blob, fallbackName) {
      var m = /^image\/(png|jpeg|gif|webp)$/.exec(blob.type || '');
      if (m) return m[1] === 'jpeg' ? 'jpg' : m[1];
      return ((fallbackName || '').match(/\.([a-z0-9]+)$/i) || [, 'png'])[1].toLowerCase();
    }

    // Put an image somewhere it can be served from and resolve to its src.
    // Used by upload, by paste, and by rotate/crop (which re-store the edited
    // pixels). Falls back to an inline data URL for small images so a teacher
    // is never blocked when the storage bucket isn't set up.
    function storeImage(blob, name) {
      if (!(opts.client && opts.teacherId && opts.client.storage)) {
        if (blob.size <= INLINE_LIMIT) return readAsDataUrl(blob);
        return Promise.reject(new Error('Images over 150 KB need online storage, which isn’t available here.'));
      }
      var id = crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
      var path = opts.teacherId + '/' + id + '.' + extFor(blob, name);
      return opts.client.storage.from('topic-images')
        .upload(path, blob, { contentType: blob.type || 'image/png', upsert: false })
        .then(function (res) {
          if (res.error) throw res.error;
          return opts.client.storage.from('topic-images').getPublicUrl(path).data.publicUrl;
        })
        .catch(function (err) {
          console.error('image upload', err);
          if (blob.size <= INLINE_LIMIT) {
            return readAsDataUrl(blob).then(function (d) {
              setStatus('Online image storage unavailable — embedded the image directly instead.', true);
              return d;
            });
          }
          throw new Error('Could not upload the image (storage not set up?). Try a smaller image (under 150 KB).');
        });
    }

    function insertImage(src, alt) {
      insertHtmlAtCursor('<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt || '') +
        '" class="rt-img-center"><p><br></p>');
      setStatus('');
    }

    function uploadImage(file) {
      if (!file || !/^image\/(png|jpe?g|gif|webp)$/.test(file.type)) {
        setStatus('That file type isn’t supported — use PNG, JPG, GIF or WebP.');
        return;
      }
      if (file.size > MAX_IMAGE) {
        setStatus('Image too large — keep it under 2 MB.');
        return;
      }
      setStatus('Uploading image…');
      var altText = (file.name || 'image').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').slice(0, 120);
      storeImage(file, file.name)
        .then(function (src) { insertImage(src, altText); })
        .catch(function (err) { setStatus(err.message || 'Could not add that image.'); });
    }

    // Insert an image the teacher linked to rather than uploaded. We try to
    // take our own copy first: a linked image breaks if the other site deletes
    // it, and a cross-origin one can't be rotated or cropped (canvas taint).
    // Both the fetch and the copy are best-effort — if the host refuses CORS
    // we simply link to the original, which is what the teacher asked for.
    function insertImageFromUrl(url, alt) {
      setStatus('Checking that link…');
      var probe = new Image();
      probe.onerror = function () {
        setStatus('That link didn’t load as an image. Check the address points straight at a picture.');
      };
      probe.onload = function () {
        setStatus('Saving a copy…');
        fetch(url, { mode: 'cors', credentials: 'omit' })
          .then(function (r) {
            if (!r.ok) throw new Error('http ' + r.status);
            return r.blob();
          })
          .then(function (blob) {
            if (!/^image\/(png|jpeg|gif|webp)$/.test(blob.type) || blob.size > MAX_IMAGE) throw new Error('not copyable');
            return storeImage(blob, url);
          })
          .then(function (src) {
            insertImage(src, alt);
            setStatus('Image saved to your subject.', true);
          })
          .catch(function () {
            insertImage(url, alt);
            setStatus('Linked to the image on the other site — it will disappear here if that site removes it.', true);
          });
      };
      probe.src = url;
    }

    btn('🖼️', 'Insert image', function (b) {
      showPop(b, function (pop) {
        var pick = document.createElement('button');
        pick.type = 'button';
        pick.className = 'rt-file';
        pick.textContent = '📁 Choose a file from this device';
        pick.addEventListener('click', function () { closePop(); fileInput.click(); });
        pop.appendChild(pick);

        var lab = document.createElement('label');
        lab.textContent = 'Or paste a web address';
        pop.appendChild(lab);
        var url = document.createElement('input');
        url.type = 'url';
        url.placeholder = 'https://…/diagram.png';
        pop.appendChild(url);

        var lab2 = document.createElement('label');
        lab2.textContent = 'Describe it (for screen readers)';
        pop.appendChild(lab2);
        var alt = document.createElement('input');
        alt.type = 'text';
        alt.placeholder = 'e.g. supply and demand graph';
        pop.appendChild(alt);

        var go = document.createElement('button');
        go.type = 'button';
        go.className = 'rt-apply';
        go.textContent = 'Insert image';
        go.addEventListener('click', function () {
          var raw = url.value.trim();
          if (raw && !/^[a-z]+:/i.test(raw)) raw = 'https://' + raw;
          var safe = safeUrl(raw, 'img');
          if (!safe) { url.style.borderColor = '#c84b31'; url.focus(); return; }
          closePop();
          insertImageFromUrl(safe, alt.value.trim());
        });
        pop.appendChild(go);
        url.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
        alt.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });

        var hint = document.createElement('div');
        hint.className = 'rt-hint';
        hint.textContent = 'Click any image after inserting it to resize, rotate, crop, or wrap text around it.';
        pop.appendChild(hint);
      });
    });
    fileInput.addEventListener('change', function () {
      if (fileInput.files && fileInput.files[0]) uploadImage(fileInput.files[0]);
      fileInput.value = '';
    });

    // ── Callout boxes ──
    btn('▣', 'Insert a box (tip / key term / important)', function (b) {
      showPop(b, function (pop) {
        [['rt-tip', '💡 Tip box'], ['rt-keyterm', '🔑 Key term box'], ['rt-warning', '⚠️ Important box'], ['rt-callout', '📌 Plain box']].forEach(function (o) {
          var choice = document.createElement('button');
          choice.type = 'button';
          choice.className = 'rt-btn';
          choice.style.display = 'flex';
          choice.style.width = '100%';
          choice.style.justifyContent = 'flex-start';
          choice.textContent = o[1];
          choice.addEventListener('click', function () {
            closePop();
            insertHtmlAtCursor('<div class="' + o[0] + '"><strong>' + o[1].split(' ')[0] + ' </strong>Write here…</div><p><br></p>');
          });
          pop.appendChild(choice);
        });
      });
    });

    btn('—', 'Insert divider line', function () { insertHtmlAtCursor('<hr><p><br></p>'); });
    sep();
    btn('⌫<small>A</small>', 'Clear formatting', function () { exec('removeFormat'); exec('formatBlock', '<p>'); }, true);
    toolbar.appendChild(statusEl);

    // ── Image select / size / rotate / crop / placement ──
    //
    // Clicking an image pins a control panel and four resize handles to it.
    // All of that UI lives on document.body (position:fixed), NOT inside the
    // editable area — anything inside .rt-area would end up in getHTML().
    // The trade-off is that it must be re-pinned on scroll/resize/reflow.

    var SIZES = [['Auto', ''], ['S', '30%'], ['M', '50%'], ['L', '75%'], ['Full', '100%']];
    var PLACEMENTS = [
      ['rt-img-left', '⇤', 'Line up on the left'],
      ['rt-img-center', '⇹', 'Centre'],
      ['rt-img-right', '⇥', 'Line up on the right'],
      ['rt-img-wrap-left', '◧', 'Wrap text: picture on the left, text on the right'],
      ['rt-img-wrap-right', '◨', 'Wrap text: picture on the right, text on the left'],
    ];

    var imgPanel = null, handleBox = null, cropWrap = null, cropRect = null, altBox = null;
    var widthLabel = null;

    function inImgUi(t) {
      return !!(imgPanel && imgPanel.contains(t)) ||
             !!(handleBox && handleBox.contains(t)) ||
             !!(cropWrap && cropWrap.contains(t)) ||
             !!(altBox && altBox.contains(t));
    }

    // The width an image's % is measured against: its containing block, or the
    // editor's content box when that block has collapsed around a float.
    function hostWidth(img) {
      var p = img.parentElement;
      var w = p ? p.clientWidth : 0;
      if (w < 40) {
        var cs = getComputedStyle(area);
        w = area.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
      }
      return Math.max(40, w);
    }

    function closeAlt() { if (altBox) { altBox.remove(); altBox = null; } }

    function closeCrop() {
      if (!cropWrap) return;
      cropWrap.remove();
      cropWrap = null;
      cropRect = null;
      if (imgPanel && selectedImg) { renderImgPanel(); positionImgUi(); }
    }

    function deselectImg() {
      closeCrop();
      closeAlt();
      if (imgPanel) { imgPanel.remove(); imgPanel = null; }
      if (handleBox) { handleBox.remove(); handleBox = null; }
      if (selectedImg) { selectedImg.classList.remove('rt-selected'); selectedImg = null; }
      widthLabel = null;
    }

    function selectImg(img) {
      deselectImg();
      closePop();
      selectedImg = img;
      img.classList.add('rt-selected');
      buildImgPanel();
      buildHandles();
      positionImgUi();
    }

    function positionImgUi() {
      if (!selectedImg) return;
      var r = selectedImg.getBoundingClientRect();
      var a = area.getBoundingClientRect();
      // Scrolled out of the editor's own viewport: hide, don't tear down.
      var off = r.bottom < a.top + 8 || r.top > a.bottom - 8;

      if (handleBox) {
        handleBox.style.display = (off || cropWrap) ? 'none' : 'block';
        handleBox.style.left = r.left + 'px';
        handleBox.style.top = r.top + 'px';
        handleBox.style.width = r.width + 'px';
        handleBox.style.height = r.height + 'px';
      }
      if (cropWrap) {
        cropWrap.style.display = off ? 'none' : 'block';
        cropWrap.style.left = r.left + 'px';
        cropWrap.style.top = r.top + 'px';
        cropWrap.style.width = r.width + 'px';
        cropWrap.style.height = r.height + 'px';
      }
      if (imgPanel) {
        imgPanel.style.display = off ? 'none' : 'flex';
        if (!off) {
          var pw = imgPanel.offsetWidth, ph = imgPanel.offsetHeight;
          var top = r.top - ph - 10;
          if (top < a.top + 4) top = r.bottom + 10;   // no room above → sit below
          top = Math.max(6, Math.min(top, window.innerHeight - ph - 6));
          imgPanel.style.top = top + 'px';
          imgPanel.style.left = Math.max(6, Math.min(r.left, window.innerWidth - pw - 6)) + 'px';
        }
      }
    }

    function pbtn(label, title, onClick) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rt-btn';
      b.title = title;
      b.setAttribute('aria-label', title);
      b.textContent = label;
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () { onClick(b); });
      imgPanel.appendChild(b);
      return b;
    }
    function psep() {
      var s = document.createElement('span');
      s.className = 'rt-sep';
      s.setAttribute('aria-hidden', 'true');
      imgPanel.appendChild(s);
    }

    function buildImgPanel() {
      imgPanel = document.createElement('div');
      imgPanel.className = 'rt-imgpanel';
      imgPanel.setAttribute('role', 'toolbar');
      imgPanel.setAttribute('aria-label', 'Image options');
      document.body.appendChild(imgPanel);
      renderImgPanel();
    }

    function renderImgPanel() {
      imgPanel.innerHTML = '';
      SIZES.forEach(function (s) {
        var b = pbtn(s[0], s[1] ? 'Resize to ' + s[1] + ' of the width' : 'Original size', function () {
          if (!selectedImg) return;
          if (s[1]) selectedImg.style.width = s[1];
          else selectedImg.style.removeProperty('width');
          setDirty();
          refreshImgPanel();
          positionImgUi();
        });
        b.dataset.size = s[1];
      });
      widthLabel = document.createElement('span');
      widthLabel.className = 'rt-imgw';
      widthLabel.title = 'Current width — or drag any corner of the image';
      imgPanel.appendChild(widthLabel);
      psep();

      pbtn('↺', 'Rotate left', function () { rotateSelected(-90); });
      pbtn('↻', 'Rotate right', function () { rotateSelected(90); });
      pbtn('⛶', 'Crop (cut off the edges)', function () { openCrop(); });
      psep();

      PLACEMENTS.forEach(function (p) {
        pbtn(p[1], p[2], function () { setPlacement(p[0]); }).dataset.place = p[0];
      });
      psep();

      pbtn('ALT', 'Describe the image for screen readers', function (b) { altPop(b); });
      pbtn('🗑️', 'Remove image', function () {
        if (!selectedImg) return;
        var doomed = selectedImg;
        deselectImg();
        doomed.remove();
        setDirty();
      }).classList.add('rt-danger');

      refreshImgPanel();
    }

    function refreshImgPanel() {
      if (!imgPanel || !selectedImg) return;
      var w = selectedImg.style.width || '';
      Array.prototype.forEach.call(imgPanel.querySelectorAll('[data-size]'), function (b) {
        b.classList.toggle('on', b.dataset.size === w);
      });
      Array.prototype.forEach.call(imgPanel.querySelectorAll('[data-place]'), function (b) {
        b.classList.toggle('on', selectedImg.classList.contains(b.dataset.place));
      });
      if (widthLabel) {
        widthLabel.textContent = w || Math.round(selectedImg.getBoundingClientRect().width) + 'px';
      }
    }

    function setPlacement(cls) {
      if (!selectedImg) return;
      var had = selectedImg.classList.contains(cls);
      PLACEMENTS.forEach(function (p) { selectedImg.classList.remove(p[0]); });
      if (!had) selectedImg.classList.add(cls);  // clicking the active one turns it off
      setDirty();
      refreshImgPanel();
      positionImgUi();
    }

    function altPop(anchor) {
      if (!selectedImg) return;
      closeAlt();
      var img = selectedImg;
      altBox = document.createElement('div');
      altBox.className = 'rt-pop';
      altBox.style.position = 'fixed';
      altBox.style.zIndex = '61';
      altBox.innerHTML = '<label>Describe this image</label>';
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.value = img.getAttribute('alt') || '';
      inp.placeholder = 'e.g. supply and demand graph';
      altBox.appendChild(inp);
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'rt-apply';
      ok.textContent = 'Save';
      ok.addEventListener('click', function () {
        img.setAttribute('alt', inp.value.trim());
        setDirty();
        closeAlt();
      });
      altBox.appendChild(ok);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ok.click(); } });
      document.body.appendChild(altBox);
      var r = anchor.getBoundingClientRect();
      altBox.style.left = Math.max(6, Math.min(r.left, window.innerWidth - altBox.offsetWidth - 6)) + 'px';
      altBox.style.top = Math.min(r.bottom + 6, window.innerHeight - altBox.offsetHeight - 6) + 'px';
      inp.focus();
      inp.select();
    }

    // ── Freehand resize ──
    function buildHandles() {
      handleBox = document.createElement('div');
      handleBox.className = 'rt-handles';
      ['nw', 'ne', 'sw', 'se'].forEach(function (corner) {
        var h = document.createElement('div');
        h.className = 'rt-handle ' + corner;
        h.title = 'Drag to resize';
        h.addEventListener('pointerdown', function (e) { startResize(e, corner, h); });
        handleBox.appendChild(h);
      });
      document.body.appendChild(handleBox);
    }

    function startResize(e, corner, handle) {
      if (!selectedImg) return;
      e.preventDefault();
      e.stopPropagation();
      var img = selectedImg;
      var start = img.getBoundingClientRect();
      var host = hostWidth(img);
      // Height follows via height:auto, so only the horizontal drag matters —
      // measured from whichever edge the dragged corner is NOT on.
      var fromLeft = (corner === 'ne' || corner === 'se');
      handle.setPointerCapture(e.pointerId);
      function move(ev) {
        var px = fromLeft ? ev.clientX - start.left : start.right - ev.clientX;
        img.style.width = Math.max(5, Math.min(100, Math.round(px / host * 100))) + '%';
        refreshImgPanel();
        positionImgUi();
      }
      function up() {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
        setDirty();
        positionImgUi();
      }
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    }

    // ── Rotate / crop (canvas re-encode) ──
    //
    // These rewrite the actual pixels rather than applying a CSS transform, so
    // the result is a plain <img> that lays out and prints normally in the
    // student view. The cost is that the canvas must be readable: a cross-origin
    // image whose host sends no CORS headers taints it, and export throws. We
    // check that up front and say so plainly instead of failing at the end.

    function loadEditable(src) {
      return new Promise(function (resolve, reject) {
        var im = new Image();
        if (!/^data:/i.test(src)) im.crossOrigin = 'anonymous';
        im.onload = function () { resolve(im); };
        im.onerror = function () {
          reject(new Error('That image is hosted on another site that won’t allow editing. Upload a copy from your device to rotate or crop it.'));
        };
        im.src = src;
      });
    }

    function outputType(src) {
      return /^data:image\/jpeg|\.jpe?g(\?|$)/i.test(src) ? 'image/jpeg' : 'image/png';
    }

    function canvasBlob(canvas, type) {
      return new Promise(function (resolve, reject) {
        try {
          canvas.toBlob(function (b) {
            if (b) resolve(b);
            else reject(new Error('Could not process that image.'));
          }, type, type === 'image/jpeg' ? 0.92 : undefined);
        } catch (err) {
          reject(new Error('That image is hosted on another site that won’t allow editing. Upload a copy from your device instead.'));
        }
      });
    }

    function applyCanvas(img, canvas, src, widthPct) {
      return canvasBlob(canvas, outputType(src))
        .then(function (blob) { return storeImage(blob, src); })
        .then(function (newSrc) {
          img.addEventListener('load', positionImgUi, { once: true });
          img.src = newSrc;
          if (widthPct != null) img.style.width = widthPct + '%';
          setDirty();
          refreshImgPanel();
          positionImgUi();
          setStatus('');
        });
    }

    function rotateSelected(deg) {
      var img = selectedImg;
      if (!img) return;
      var src = img.src;
      setStatus('Rotating…');
      loadEditable(src).then(function (im) {
        var w = im.naturalWidth, h = im.naturalHeight;
        var c = document.createElement('canvas');
        c.width = h; c.height = w;   // a quarter turn swaps the axes
        var ctx = c.getContext('2d');
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate(deg * Math.PI / 180);
        ctx.drawImage(im, -w / 2, -h / 2);
        return applyCanvas(img, c, src, null);
      }).catch(function (err) {
        setStatus(err.message || 'Could not rotate that image.');
      });
    }

    function openCrop() {
      var img = selectedImg;
      if (!img) return;
      setStatus('Opening crop…');
      // Prove the image is editable BEFORE the teacher drags a box for nothing.
      loadEditable(img.src).then(function () {
        if (selectedImg !== img) return;
        setStatus('');
        buildCrop(img);
      }).catch(function (err) { setStatus(err.message); });
    }

    function buildCrop(img) {
      var r = img.getBoundingClientRect();
      cropWrap = document.createElement('div');
      cropWrap.className = 'rt-cropwrap';
      var box = document.createElement('div');
      box.className = 'rt-cropbox';
      cropWrap.appendChild(box);
      document.body.appendChild(cropWrap);

      cropRect = { x: r.width * 0.1, y: r.height * 0.1, w: r.width * 0.8, h: r.height * 0.8 };
      function paint() {
        box.style.left = cropRect.x + 'px';
        box.style.top = cropRect.y + 'px';
        box.style.width = cropRect.w + 'px';
        box.style.height = cropRect.h + 'px';
      }
      paint();

      ['nw', 'ne', 'sw', 'se'].forEach(function (corner) {
        var h = document.createElement('div');
        h.className = 'rt-ch ' + corner;
        h.addEventListener('pointerdown', function (e) { dragCrop(e, h, corner, paint, img); });
        box.appendChild(h);
      });
      box.addEventListener('pointerdown', function (e) {
        if (e.target !== box) return;  // a corner handle — let it through
        dragCrop(e, box, 'move', paint, img);
      });

      renderCropPanel(img);
      positionImgUi();
    }

    function dragCrop(e, el, mode, paint, img) {
      e.preventDefault();
      e.stopPropagation();
      var bounds = img.getBoundingClientRect();
      var sx = e.clientX, sy = e.clientY;
      var o = { x: cropRect.x, y: cropRect.y, w: cropRect.w, h: cropRect.h };
      var MIN = 24;
      el.setPointerCapture(e.pointerId);
      function move(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (mode === 'move') {
          cropRect.x = Math.max(0, Math.min(o.x + dx, bounds.width - o.w));
          cropRect.y = Math.max(0, Math.min(o.y + dy, bounds.height - o.h));
        } else {
          if (mode.charAt(1) === 'w') {
            var nx = Math.max(0, Math.min(o.x + dx, o.x + o.w - MIN));
            cropRect.w = o.x + o.w - nx;
            cropRect.x = nx;
          } else {
            cropRect.w = Math.max(MIN, Math.min(o.w + dx, bounds.width - o.x));
          }
          if (mode.charAt(0) === 'n') {
            var ny = Math.max(0, Math.min(o.y + dy, o.y + o.h - MIN));
            cropRect.h = o.y + o.h - ny;
            cropRect.y = ny;
          } else {
            cropRect.h = Math.max(MIN, Math.min(o.h + dy, bounds.height - o.y));
          }
        }
        paint();
      }
      function up() {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
      }
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }

    function renderCropPanel(img) {
      imgPanel.innerHTML = '';
      var note = document.createElement('span');
      note.className = 'rt-imgnote';
      note.textContent = 'Drag the box to choose the part you want to keep.';
      imgPanel.appendChild(note);
      var apply = document.createElement('button');
      apply.type = 'button';
      apply.className = 'rt-apply';
      apply.style.margin = '0 4px';
      apply.textContent = 'Apply crop';
      apply.addEventListener('mousedown', function (e) { e.preventDefault(); });
      apply.addEventListener('click', function () { applyCrop(img); });
      imgPanel.appendChild(apply);
      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'rt-btn';
      cancel.textContent = 'Cancel';
      cancel.addEventListener('mousedown', function (e) { e.preventDefault(); });
      cancel.addEventListener('click', function () { closeCrop(); });
      imgPanel.appendChild(cancel);
    }

    function applyCrop(img) {
      if (!cropRect) return;
      var keep = { x: cropRect.x, y: cropRect.y, w: cropRect.w, h: cropRect.h };
      var shown = img.getBoundingClientRect();
      var host = hostWidth(img);
      var src = img.src;
      setStatus('Cropping…');
      closeCrop();
      loadEditable(src).then(function (im) {
        var fx = im.naturalWidth / shown.width, fy = im.naturalHeight / shown.height;
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(keep.w * fx));
        c.height = Math.max(1, Math.round(keep.h * fy));
        c.getContext('2d').drawImage(im,
          keep.x * fx, keep.y * fy, keep.w * fx, keep.h * fy,
          0, 0, c.width, c.height);
        // Keep the part they kept the same size on screen as it just looked.
        var pct = Math.max(5, Math.min(100, Math.round(keep.w / host * 100)));
        return applyCanvas(img, c, src, pct);
      }).catch(function (err) {
        setStatus(err.message || 'Could not crop that image.');
      });
    }

    area.addEventListener('click', function (e) {
      if (e.target && e.target.tagName === 'IMG' && area.contains(e.target)) selectImg(e.target);
      else deselectImg();
    });

    // ── Paste: sanitise rich clipboard, upload pasted images ──
    area.addEventListener('paste', function (e) {
      var cd = e.clipboardData;
      if (!cd) return;
      if (cd.files && cd.files.length && /^image\//.test(cd.files[0].type)) {
        e.preventDefault();
        saveSelection();
        uploadImage(cd.files[0]);
        return;
      }
      var html = cd.getData('text/html');
      if (html) {
        e.preventDefault();
        saveSelection();
        insertHtmlAtCursor(sanitize(html));
      }
      // plain text paste: browser default is fine inside contenteditable
    });

    area.addEventListener('input', setDirty);
    area.addEventListener('focus', function () { root.classList.add('rt-focus'); });
    area.addEventListener('blur', function () { root.classList.remove('rt-focus'); saveSelection(); });
    area.addEventListener('keyup', saveSelection);
    area.addEventListener('mouseup', saveSelection);

    return {
      getHTML: function () { deselectImg(); return sanitize(area.innerHTML); },
      setHTML: function (html) { area.innerHTML = sanitize(html); dirty = false; },
      insertHTML: function (html) { area.focus(); insertHtmlAtCursor(sanitize(html)); },
      isDirty: function () { return dirty; },
      markClean: function () { dirty = false; },
      focus: function () { area.focus(); },
      destroy: function () {
        // Callers re-mount this editor (teacher-subjects.html does it per
        // topic), so everything parked outside `root` has to come back with it.
        closePop();
        deselectImg();
        clearTimeout(statusTimer);
        document.removeEventListener('mousedown', onDocMouseDown);
        document.removeEventListener('keydown', onDocKeyDown);
        window.removeEventListener('scroll', onReflow, true);
        window.removeEventListener('resize', onReflow);
        root.remove();
      },
    };
  }

  window.RichText = {
    sanitize: sanitize,
    injectContentStyles: injectContentStyles,
    create: create,
    lessonTemplate: lessonTemplate,
    escapeHtml: escapeHtml,
  };
})();
