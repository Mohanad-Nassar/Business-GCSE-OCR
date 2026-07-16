// ══════════════════════════════════════════════════════════════
// SEARCHABLE SELECT — progressive enhancement for every <select>.
//
// Turns a normal dropdown into a "combobox": click to see all options (like
// before), OR start typing to filter them. The native <select> is kept in the
// DOM as the source of truth — its value, `change`/`input` events and form
// submission all keep working exactly as they did, so no page logic needs to
// change. A MutationObserver picks up dropdowns that are rendered later (e.g.
// the join-code expiry, admin school picker, task builder), so this file just
// needs to be loaded once per page.
//
// Opt out of a specific dropdown with  <select data-no-search>  and it stays a
// plain native select. <select multiple> / size>1 are always left alone.
//
// Load it anywhere on the page (defer is fine):
//   <script src="searchable-select.js" defer></script>
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';
  if (window.__ssInit) return;   // guard against double-loading
  window.__ssInit = true;

  var idSeq = 0;

  // ── one-time stylesheet (theme-aware via the site's CSS vars) ──
  function injectStyle() {
    if (document.getElementById('ss-style')) return;
    var css = ''
      + '.ss-combo{position:relative;display:inline-flex;align-items:center;vertical-align:middle;box-sizing:border-box;max-width:100%;}'
      + '.ss-combo .ss-input{width:100%;box-sizing:border-box;padding:8px 30px 8px 12px;border:1px solid var(--border,#ccc);border-radius:7px;background:var(--card-bg,#fff);color:var(--ink,#111);font-family:inherit;font-size:13px;line-height:1.3;cursor:pointer;}'
      + '.ss-combo .ss-input::placeholder{color:var(--mid,#8a8a8a);opacity:1;}'
      + '.ss-combo .ss-input:focus{outline:none;border-color:var(--accent,#7a5c9e);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent,#7a5c9e) 22%,transparent);}'
      + '.ss-combo .ss-arrow{position:absolute;right:11px;pointer-events:none;font-size:9px;color:var(--mid,#888);transition:transform .15s ease;}'
      + '.ss-combo.ss-open .ss-arrow{transform:rotate(180deg);}'
      + '.ss-combo .ss-list{position:absolute;z-index:9999;top:calc(100% + 4px);left:0;min-width:100%;max-height:260px;overflow-y:auto;margin:0;padding:4px;list-style:none;'
      +   'background:var(--card-bg,#fff);border:1px solid var(--border,#ccc);border-radius:9px;box-shadow:0 14px 34px -12px rgba(0,0,0,.4);}'
      + '.ss-combo .ss-list[hidden]{display:none;}'
      + '.ss-combo .ss-opt{padding:8px 11px;border-radius:6px;font-size:13px;color:var(--ink,#111);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}'
      + '.ss-combo .ss-opt[hidden]{display:none;}'
      + '.ss-combo .ss-opt.ss-active{background:var(--accent,#7a5c9e);color:#fff;}'
      + '.ss-combo .ss-opt.ss-selected:not(.ss-active){background:color-mix(in srgb,var(--accent,#7a5c9e) 14%,transparent);font-weight:600;}'
      + '.ss-combo .ss-opt.ss-disabled{opacity:.45;cursor:not-allowed;}'
      + '.ss-combo .ss-grp{padding:9px 11px 3px;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--mid,#888);}'
      + '.ss-combo .ss-empty{padding:9px 11px;font-size:12px;color:var(--mid,#888);font-style:italic;}'
      + '@media (prefers-reduced-motion: reduce){.ss-combo .ss-arrow{transition:none;}}';
    var s = document.createElement('style');
    s.id = 'ss-style';
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  function shouldEnhance(sel) {
    return sel && sel.tagName === 'SELECT' && !sel.multiple && sel.size <= 1
      && !sel.dataset.ssEnhanced && !sel.hasAttribute('data-no-search')
      && !sel.closest('.ss-combo');
  }

  function labelOf(opt) { return (opt.textContent || '').trim(); }

  function enhance(sel) {
    if (!shouldEnhance(sel)) return;
    injectStyle();
    sel.dataset.ssEnhanced = '1';

    var combo = document.createElement('div');
    combo.className = 'ss-combo';

    // Preserve the footprint of the original control so layouts don't jump.
    // Measured by briefly un-hiding it (visibility:hidden, so no flash) —
    // needed because pages that populate options asynchronously (e.g. after
    // an auth/data fetch) would otherwise freeze in the near-empty width the
    // <select> had at enhance-time.
    function resizeCombo() {
      var prevDisplay = sel.style.display;
      sel.style.visibility = 'hidden';
      sel.style.position = 'absolute';
      sel.style.display = '';
      var w = sel.offsetWidth;
      sel.style.display = prevDisplay;
      sel.style.position = '';
      sel.style.visibility = '';
      if (w > 40) combo.style.width = w + 'px';
    }
    resizeCombo();

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'ss-input';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.autocomplete = 'off';
    input.spellcheck = false;
    var listId = 'ss-list-' + (++idSeq);
    input.setAttribute('aria-controls', listId);

    // Keep <label for=…> working: repoint it (and any aria) to the input.
    if (sel.id) {
      input.id = sel.id + '-ss';
      try {
        var lbl = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(sel.id) : sel.id) + '"]');
        if (lbl) lbl.setAttribute('for', input.id);
      } catch (e) {}
    }

    var arrow = document.createElement('span');
    arrow.className = 'ss-arrow';
    arrow.textContent = '▼';

    var list = document.createElement('ul');
    list.className = 'ss-list';
    list.id = listId;
    list.setAttribute('role', 'listbox');
    list.hidden = true;

    combo.appendChild(input);
    combo.appendChild(arrow);
    combo.appendChild(list);

    // Hide the native select but keep it in place (value + form submission +
    // existing listeners all stay intact).
    sel.style.display = 'none';
    sel.setAttribute('tabindex', '-1');
    sel.setAttribute('aria-hidden', 'true');
    sel.parentNode.insertBefore(combo, sel.nextSibling);
    sel._ssCombo = combo;

    var open = false;
    var activeIdx = -1;   // index into rows[] of the highlighted option
    var rows = [];        // [{li, optIndex, label}] for real (selectable) options

    function committedLabel() {
      var o = sel.options[sel.selectedIndex];
      return o ? labelOf(o) : '';
    }

    // (Re)build the option rows from the live <select>.
    function build() {
      list.innerHTML = '';
      rows = [];
      var children = sel.children;
      for (var i = 0; i < children.length; i++) {
        var node = children[i];
        if (node.tagName === 'OPTGROUP') {
          var g = document.createElement('li');
          g.className = 'ss-grp';
          g.setAttribute('role', 'presentation');
          g.textContent = node.label || '';
          list.appendChild(g);
          var opts = node.children;
          for (var j = 0; j < opts.length; j++) addOptionRow(opts[j]);
        } else if (node.tagName === 'OPTION') {
          addOptionRow(node);
        }
      }
      var empty = document.createElement('li');
      empty.className = 'ss-empty';
      empty.hidden = true;
      empty.textContent = 'No matches';
      empty.dataset.ssEmpty = '1';
      list.appendChild(empty);
    }

    function addOptionRow(opt) {
      var li = document.createElement('li');
      li.className = 'ss-opt' + (opt.disabled ? ' ss-disabled' : '');
      li.setAttribute('role', 'option');
      li.textContent = labelOf(opt) || ' ';
      var rowIndex = rows.length;
      var optIndex = opt.index;   // index within select.options
      li.dataset.opt = optIndex;
      li.id = listId + '-opt-' + rowIndex;
      if (!opt.disabled) {
        li.addEventListener('mousedown', function (e) {
          e.preventDefault();            // keep focus on the input
          commit(rowIndex);
        });
      }
      list.appendChild(li);
      rows.push({ li: li, optIndex: optIndex, label: labelOf(opt), disabled: opt.disabled });
    }

    function syncDisplay() { input.value = committedLabel(); }

    function filter(term) {
      term = (term || '').trim().toLowerCase();
      var anyVisible = false;
      for (var i = 0; i < rows.length; i++) {
        var show = !term || rows[i].label.toLowerCase().indexOf(term) !== -1;
        rows[i].li.hidden = !show;
        if (show && !rows[i].disabled) anyVisible = true;
      }
      var empty = list.querySelector('[data-ss-empty]');
      if (empty) empty.hidden = anyVisible;
      // Move the highlight to the first visible, selectable row.
      setActive(firstVisible());
    }

    function firstVisible() {
      for (var i = 0; i < rows.length; i++) if (!rows[i].li.hidden && !rows[i].disabled) return i;
      return -1;
    }
    function stepActive(dir) {
      var i = activeIdx;
      for (var n = 0; n < rows.length; n++) {
        i += dir;
        if (i < 0) i = rows.length - 1;
        if (i >= rows.length) i = 0;
        if (!rows[i].li.hidden && !rows[i].disabled) { setActive(i); return; }
      }
    }
    function setActive(i) {
      if (activeIdx >= 0 && rows[activeIdx]) rows[activeIdx].li.classList.remove('ss-active');
      activeIdx = i;
      if (i >= 0 && rows[i]) {
        rows[i].li.classList.add('ss-active');
        input.setAttribute('aria-activedescendant', rows[i].li.id);
        rows[i].li.scrollIntoView({ block: 'nearest' });
      }
    }

    function markSelected() {
      for (var i = 0; i < rows.length; i++) {
        rows[i].li.classList.toggle('ss-selected', rows[i].optIndex === sel.selectedIndex);
        rows[i].li.setAttribute('aria-selected', rows[i].optIndex === sel.selectedIndex ? 'true' : 'false');
      }
    }

    function openList() {
      if (open || sel.disabled) return;
      build();
      markSelected();
      // Clear the field so typing filters immediately; the current choice stays
      // visible as the placeholder. Restored on close if nothing new is picked.
      input.placeholder = committedLabel() || 'Select or type…';
      input.value = '';
      filter('');
      // Land the highlight on the current selection if it's visible.
      for (var i = 0; i < rows.length; i++) if (rows[i].optIndex === sel.selectedIndex) { setActive(i); break; }
      list.hidden = false;
      open = true;
      combo.classList.add('ss-open');
      input.setAttribute('aria-expanded', 'true');
    }
    function closeList(revert) {
      if (!open) return;
      list.hidden = true;
      open = false;
      combo.classList.remove('ss-open');
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      if (revert !== false) syncDisplay();
    }

    function commit(rowIndex) {
      var r = rows[rowIndex];
      if (!r) { closeList(); return; }
      if (sel.selectedIndex !== r.optIndex) {
        sel.selectedIndex = r.optIndex;
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      closeList();
    }

    // ── events ──
    input.addEventListener('focus', openList);
    input.addEventListener('mousedown', function () { if (!open) openList(); });
    arrow.addEventListener('mousedown', function (e) {
      e.preventDefault();
      if (open) { closeList(); } else { input.focus(); openList(); }
    });
    input.addEventListener('input', function () { if (!open) openList(); filter(input.value); });
    input.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); if (!open) { openList(); } else { stepActive(1); } break;
        case 'ArrowUp':   e.preventDefault(); if (!open) { openList(); } else { stepActive(-1); } break;
        case 'Enter':     if (open) { e.preventDefault(); commit(activeIdx); } break;
        case 'Escape':    if (open) { e.preventDefault(); e.stopPropagation(); closeList(); input.blur(); } break;
        case 'Tab':       if (open) closeList(); break;
        default: break;
      }
    });
    input.addEventListener('blur', function () { setTimeout(function () { if (open) closeList(); }, 0); });

    // If app code changes the select programmatically and fires 'change',
    // reflect it in the closed display.
    sel.addEventListener('change', function () { if (!open) syncDisplay(); });

    // If app code rebuilds the options (dynamic dropdowns) or disables the
    // select, mirror that onto the combo.
    function syncDisabled() { input.disabled = sel.disabled; combo.style.opacity = sel.disabled ? '.55' : ''; }
    var optObserver = new MutationObserver(function () { if (!open) syncDisplay(); syncDisabled(); resizeCombo(); });
    try { optObserver.observe(sel, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] }); } catch (e) {}

    syncDisplay();
    syncDisabled();
    if (!committedLabel()) input.placeholder = 'Select or type…';
  }

  function enhanceAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var sels = scope.querySelectorAll('select');
    for (var i = 0; i < sels.length; i++) { try { enhance(sels[i]); } catch (e) { /* never break a page over one dropdown */ } }
  }

  // Catch dropdowns rendered after load (debounced so a burst of DOM writes
  // triggers a single sweep).
  function watch() {
    if (!window.MutationObserver) return;
    var pending = false;
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].addedNodes && muts[i].addedNodes.length) {
          if (pending) return;
          pending = true;
          (window.requestAnimationFrame || window.setTimeout)(function () { pending = false; enhanceAll(document); }, 0);
          return;
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function start() { enhanceAll(document); watch(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.SearchableSelect = { enhance: enhance, enhanceAll: enhanceAll };
})();
