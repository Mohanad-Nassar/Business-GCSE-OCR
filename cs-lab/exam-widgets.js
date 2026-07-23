// ══════════════════════════════════════════════════════════════
// CS EXAM WIDGETS — registry + core (CS-CONTENT-PLAN.md §7.3, 2026-07-17)
//
// Paper-faithful answer widgets for the Exam Practice tab on Computer
// Science pages, replacing the flattened plain-textarea rendering. Loaded
// (with its sibling modules) by every CS topic page BEFORE script.js's
// DOMContentLoaded init; script.js's seam (_epUseWidget/_epSaveWidgetResult)
// delegates any non-MCQ exam question here, keyed off `q.format`
// ('lines' when the question has no format hint).
//
// ── Contract (what sibling modules + the mock-exam runner code against) ──
//
//   CsExamWidgets.register('tickGrid', function mount(el, q, qi, opts) {
//     // build the answer UI inside `el` for question q
//     return {
//       getState()               // -> serializable answer state
//       setState(state, locked)  // restore; locked = already marked
//     };
//   });
//
//   opts = {
//     reveal(),        // show the question's mark-scheme popup
//     save(payload),   // record the result: { mark, max, state }
//   }
//
//   Rules for widget modules:
//   - Auto-markable formats (grids, cloze, tables) mark themselves on their
//     own Check button, then call opts.save({mark, max, state}) AND
//     opts.reveal(). Apply the REAL paper rules (extra ticks void the row,
//     two lines from one item = 0, etc.).
//   - Prose/code formats can't auto-mark: reveal the scheme, then use
//     helpers.buildSelfMarkPanel so the student ticks each mark-scheme
//     point they earned (examiner-style) — the panel calls opts.save.
//   - Theme CSS variables only; inject a <style> once per module, class-
//     prefixed .csew-<module>.
//   - Never use classes ep-answer-area/answer-box on inputs students must
//     paste into; DO use ep-answer-area for free-prose exam answers (the
//     paste-guard is deliberate there).
//   - Question data may carry optional layout hints:
//       q.lines  — number of ruled answer lines (default 2×marks, max 12)
//       q.stubs  — labelled lead-ins, e.g. ["Benefit", "Drawback"] or
//                  ["1", "2", "3"] — one lined block per stub
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  if (window.CsExamWidgets) return; // never double-init

  var factories = {};

  // ── tiny DOM helpers (shared with sibling modules via .helpers) ──
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function btn(label, cls) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cslab-btn' + (cls ? ' ' + cls : '');
    b.textContent = label;
    return b;
  }
  function injectStyleOnce(id, css) {
    if (typeof document === 'undefined') return; // Node (unit tests) — no DOM
    if (document.getElementById(id)) return;
    var s = document.createElement('style');
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── Tickable mark-point model (see docs/SELF-MARK-POINTS-AUTHORING.md) ──
  //
  // PREFERRED: the question authors `q.markPoints`, describing exactly what a
  // student ticks and what each tick is worth. Two shapes:
  //   flat:    [ "point", { text: "point", marks: 2 }, … ]
  //   grouped: { note, groups: [ { label, max, points: [ … ] }, … ] }
  // Groups model the compound schemes OCR uses constantly — e.g. "1 for
  // naming each register, 1 for each matching purpose" is TWO groups (one per
  // register the student gave) of two 1-mark points, each group capped at 2.
  //
  // FALLBACK (no markPoints): the <li>s of the mark scheme's first
  // .marks-section, one mark each. This is correct ONLY for plain "1 mark per
  // bullet" schemes. For compound schemes it silently UNDER-awards (the
  // student ticks the 2 bullets they answered and scores 2 of 4), which is
  // why authoring markPoints is mandatory for them.
  function normPoint(p) {
    if (typeof p === 'string') return { text: p, marks: 1 };
    return { text: p.text, marks: p.marks == null ? 1 : p.marks };
  }

  function buildPointModel(q) {
    var mp = q.markPoints;
    if (mp) {
      if (Array.isArray(mp)) {
        return { note: null, groups: [{ label: null, max: null, points: mp.map(normPoint) }] };
      }
      return {
        note: mp.note || null,
        groups: (mp.groups || []).map(function (g) {
          return {
            label: g.label || null,
            max: g.max == null ? null : g.max,
            points: (g.points || []).map(normPoint),
          };
        }),
      };
    }
    var parsed = parseMarkPoints(q.markScheme);
    if (!parsed.length) return null;
    if (COMPOUND_SCHEME_HINT.test(stripTags(q.markScheme))) {
      // Loud in dev, invisible to students: the scheme reads like a compound
      // one, so the 1-mark-per-bullet fallback is probably mis-marking.
      console.warn('[cs-exam-widgets] ' + (q.num || 'A question') + ' (' + q.marks +
        ' marks) looks like a COMPOUND mark scheme but has no q.markPoints — ' +
        'students may under-award themselves. See docs/SELF-MARK-POINTS-AUTHORING.md');
    }
    return { note: null, groups: [{ label: null, max: null, points: parsed.map(normPoint) }] };
  }

  // Phrases that mean "this scheme does NOT award 1 mark per bullet".
  // Deliberately narrow — a false alarm on every ordinary question would train
  // authors to ignore the warning. "1 mark for each correct answer to a max of
  // N" and "1 mark per register with its purpose" are PLAIN (one bullet = one
  // mark) and must NOT match; only per-item caps, name+purpose splits, pair
  // marking and point+development chains do.
  var COMPOUND_SCHEME_HINT = /for\s+naming|max\s+\d+\s+(marks?\s+)?per\b|marks?\s+in\s+pairs|additional\s+mark|each\s+for\s+[\w\s]+\+/i;

  function stripTags(html) {
    var t = document.createElement('template');
    t.innerHTML = html || '';
    return t.content.textContent || '';
  }

  // Pull tickable mark points out of a markScheme HTML blob: the <li> items
  // of its FIRST .marks-section (our schemes consistently open with the
  // "Mark Scheme — N marks" section whose bullets are the creditable
  // points). Returns [] when nothing parseable — callers fall back to a
  // plain numeric self-mark.
  function parseMarkPoints(markSchemeHtml) {
    try {
      var t = document.createElement('template');
      t.innerHTML = markSchemeHtml || '';
      var section = t.content.querySelector('.marks-section');
      if (!section) return [];
      var items = section.querySelectorAll('li');
      var out = [];
      items.forEach(function (li) {
        var text = (li.textContent || '').trim();
        if (text) out.push(text);
      });
      return out;
    } catch (e) { return []; }
  }

  // OCR banded levels for extended responses, derived from the tariff.
  function bandsFor(marks) {
    if (marks >= 8) return [{ label: 'Not creditworthy', lo: 0, hi: 0 }, { label: 'Band 1 (basic)', lo: 1, hi: 2 }, { label: 'Band 2 (reasonable)', lo: 3, hi: 5 }, { label: 'Band 3 (thorough)', lo: 6, hi: 8 }];
    return [{ label: 'Not creditworthy', lo: 0, hi: 0 }, { label: 'Band 1 (basic)', lo: 1, hi: 2 }, { label: 'Band 2 (reasonable)', lo: 3, hi: 4 }, { label: 'Band 3 (thorough)', lo: 5, hi: marks }];
  }

  // ── examiner-style self-marking panel (prose + code widgets share this) ──
  // Reveals after the student submits: each mark-scheme point gets a tick
  // box; ticked points (capped at q.marks) become the awarded mark. If the
  // scheme yields no parseable points, falls back to a numeric mark input.
  function buildSelfMarkPanel(container, q, opts, getAnswerState) {
    var panel = el('div', 'csew-selfmark');
    panel.appendChild(el('h5', null, '🖊️ Now mark it like an examiner'));
    var model = buildPointModel(q);
    var allTicks = [];      // flat, in reading order — what gets saved/restored
    var groupTicks = [];    // [[checkbox,…], …] — what marking iterates
    if (model) {
      panel.appendChild(el('p', 'csew-note', model.note ||
        'Tick each point your answer makes (the full scheme is open below — check the "How the marks are given" rules before you tick).'));
      var listEl = el('div', 'csew-points');
      model.groups.forEach(function (g, gi) {
        groupTicks[gi] = [];
        if (g.label) {
          listEl.appendChild(el('div', 'csew-group-label',
            g.label + (g.max != null ? ' — up to ' + g.max + ' mark' + (g.max > 1 ? 's' : '') : '')));
        }
        g.points.forEach(function (p, pi) {
          var lab = el('label', 'csew-point');
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          groupTicks[gi][pi] = cb;
          allTicks.push(cb);
          lab.appendChild(cb);
          lab.appendChild(el('span', null, p.text + (p.marks > 1 ? ' (' + p.marks + ' marks)' : '')));
          listEl.appendChild(lab);
        });
      });
      panel.appendChild(listEl);
    }
    var row = el('div', 'csew-row');
    var markLabel = el('span', 'csew-note', '');
    var manual = null;
    if (!model) {
      manual = document.createElement('input');
      manual.type = 'number';
      manual.min = '0';
      manual.max = String(q.marks);
      manual.className = 'csew-markinput';
      row.appendChild(el('span', 'csew-note', 'My marks (out of ' + q.marks + '):'));
      row.appendChild(manual);
    } else {
      row.appendChild(markLabel);
    }
    var saveBtn = btn('Save my marks');
    row.appendChild(saveBtn);
    panel.appendChild(row);

    // Sum each group's ticked points (capped by the group's own max), then cap
    // the total at the question tariff.
    function rawTotal() {
      var total = 0;
      model.groups.forEach(function (g, gi) {
        var sub = 0;
        g.points.forEach(function (p, pi) {
          if (groupTicks[gi][pi].checked) sub += p.marks;
        });
        if (g.max != null) sub = Math.min(sub, g.max);
        total += sub;
      });
      return total;
    }
    function currentMark() {
      if (manual) return Math.max(0, Math.min(q.marks, parseInt(manual.value, 10) || 0));
      return Math.min(q.marks, rawTotal());
    }
    function refreshLabel() {
      if (manual) return;
      markLabel.textContent = 'Marks: ' + currentMark() + ' / ' + q.marks +
        (rawTotal() > q.marks ? ' (capped at the question maximum)' : '');
    }
    allTicks.forEach(function (c) { c.addEventListener('change', refreshLabel); });
    refreshLabel();
    var ticks = allTicks; // saved/restored state is the flat tick list

    saveBtn.addEventListener('click', function () {
      var state = getAnswerState();
      state._ticks = ticks.map(function (c) { return c.checked; });
      var mark = currentMark();
      // Persist the awarded mark in the state itself: the numeric-fallback
      // path has no ticks to re-derive it from on restore, and widgets lock
      // their panel from state._mark when re-mounted.
      state._mark = mark;
      lockPanel(panel, mark, q.marks);
      opts.save({ mark: mark, max: q.marks, state: state });
    });
    container.appendChild(panel);
    // Mark-point labels are set via textContent (el helper), so any LaTeX in them
    // (Additional Maths mark schemes) needs KaTeX. No-op on subjects without
    // math-render.js loaded (CS/Business/Economics), so this is safe everywhere.
    if (typeof renderMathIn === 'function') renderMathIn(panel);
    return {
      restore: function (state, mark) {
        if (state && state._ticks) ticks.forEach(function (c, i) { c.checked = !!state._ticks[i]; });
        refreshLabel();
        if (mark != null) lockPanel(panel, mark, q.marks);
      },
    };
  }

  function lockPanel(panel, mark, max) {
    panel.querySelectorAll('input,button').forEach(function (n) { n.disabled = true; });
    var done = el('p', 'csew-awarded', '✓ Recorded: ' + mark + ' / ' + max + ' marks');
    panel.appendChild(done);
  }

  // ── core styles (paper look) ──
  injectStyleOnce('csew-core-style', [
    '.ep-widget { margin-bottom: 16px; }',
    '.csew-note { font-size: 12.5px; color: var(--mid); }',
    '.csew-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 8px; }',
    '.csew-selfmark { background: var(--cream); border: 1px solid var(--border); border-left: 3px solid var(--accent);',
    '  border-radius: 8px; padding: 10px 12px; margin-top: 10px; }',
    '.csew-selfmark h5 { margin: 0 0 6px; font-size: 13.5px; }',
    '.csew-points { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; }',
    '.csew-point { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; line-height: 1.45; cursor: pointer; }',
    '.csew-point input { margin-top: 2px; }',
    '.csew-group-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;',
    '  color: var(--accent); margin: 8px 0 2px; }',
    '.csew-points > .csew-group-label:first-child { margin-top: 0; }',
    '.csew-markinput { width: 64px; font-family: inherit; font-size: 13px; padding: 5px 7px;',
    '  border: 1px solid var(--border); border-radius: 6px; background: var(--card-bg); color: var(--ink); }',
    '.csew-awarded { font-weight: 700; color: var(--success); margin: 8px 0 0; }',
    // ruled paper lines: dotted baselines like the real answer booklet
    '.csew-lines-label { font-size: 13px; font-weight: 600; margin: 8px 0 2px; }',
    // min-height:0 is load-bearing — .ep-answer-area (style.css, needed for the
    // paste-guard) sets min-height:120px, which silently overrode our inline
    // height and forced every box to ~4 lines regardless of its tariff.
    'textarea.csew-lines { width: 100%; box-sizing: border-box; border: 1px solid var(--border); border-radius: 8px;',
    '  min-height: 0; background: var(--card-bg); color: var(--ink); font-family: inherit; font-size: 14px;',
    '  padding: 4px 12px; line-height: 28px; resize: vertical;',
    '  background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 27px, color-mix(in srgb, var(--mid) 55%, transparent) 27px, color-mix(in srgb, var(--mid) 55%, transparent) 28px);',
    '  background-attachment: local; }',
    '.csew-marksright { text-align: right; font-weight: 700; font-size: 13px; color: var(--ink); margin: 2px 0 0; }',
    '.csew-band { display: flex; flex-direction: column; gap: 6px; margin: 8px 0; }',
    '.csew-band label { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; cursor: pointer; }',
  ].join('\n'));

  // ── Auto-growing ruled answer box ──
  // A box OPENS at one line per mark it's worth (so "give three characteristics
  // [3]" = three boxes of one line each, not three essays), grows as the
  // student types, and scrolls once it passes MAX_LINES. Never sized at 2×
  // marks like the printed paper: on screen that just looks daunting and
  // implies far more writing than the tariff wants. `q.lines` is still
  // honoured by the mock-exam PRINT view, where a real handwriting space IS
  // the point.
  var LINE_PX = 28, PAD_PX = 8, BORDER_PX = 2, MAX_LINES = 5;
  function lineBoxHeight(lines) { return lines * LINE_PX + PAD_PX + BORDER_PX; }
  function clampLines(n) { return Math.max(1, Math.min(MAX_LINES, Math.round(n) || 1)); }
  function autoGrow(ta) {
    var minH = lineBoxHeight(ta._minLines || 1);
    ta.style.height = 'auto';                 // let it shrink back when text is deleted
    var needed = ta.scrollHeight + BORDER_PX; // scrollHeight excludes the border
    var max = lineBoxHeight(MAX_LINES);
    ta.style.height = Math.max(minH, Math.min(needed, max)) + 'px';
    ta.style.overflowY = needed > max ? 'auto' : 'hidden';
  }
  function makeLineBox(minLines) {
    var ta = document.createElement('textarea');
    ta.className = 'csew-lines ep-answer-area';
    ta._minLines = clampLines(minLines);
    ta.rows = ta._minLines;
    ta.spellcheck = false;
    ta.style.height = lineBoxHeight(ta._minLines) + 'px';
    ta.style.overflowY = 'hidden';
    ta.addEventListener('input', function () { autoGrow(ta); });
    return ta;
  }

  // How many lines a given answer box opens at = the marks it can earn.
  // Priority: an authored q.stubLines override → the matching markPoints group's
  // max (e.g. Example = 1 mark, Explanation = 2) → the tariff shared evenly
  // across the stubs → the whole tariff for a single box.
  function linesForBox(q, stubs, i) {
    if (Array.isArray(q.stubLines) && q.stubLines[i] != null) return clampLines(q.stubLines[i]);
    var mp = q.markPoints;
    if (mp && mp.groups && mp.groups.length === stubs.length) {
      var g = mp.groups[i];
      var m = g.max != null ? g.max : (g.points || []).reduce(function (a, p) { return a + (p.marks || 1); }, 0);
      return clampLines(m);
    }
    return clampLines(Math.ceil((q.marks || 1) / stubs.length));
  }

  // ── 'lines' — ruled answer lines with labelled stubs; self-marked ──
  function mountLines(elc, q, qi, opts) {
    var stubs = q.stubs && q.stubs.length ? q.stubs : [null];
    var areas = [];
    stubs.forEach(function (stub, i) {
      if (stub != null) elc.appendChild(el('div', 'csew-lines-label', stub));
      var ta = makeLineBox(linesForBox(q, stubs, i));
      areas.push(ta);
      elc.appendChild(ta);
    });
    elc.appendChild(el('div', 'csew-marksright', '[' + q.marks + ']'));
    var submit = btn('📋 Submit & mark my answer');
    elc.appendChild(submit);
    var panelHandle = null;
    function answerState() {
      return { texts: areas.map(function (a) { return a.value; }) };
    }
    function lockAreas() { areas.forEach(function (a) { a.disabled = true; }); }
    submit.addEventListener('click', function () {
      submit.disabled = true;
      opts.reveal();
      panelHandle = buildSelfMarkPanel(elc, q, opts, answerState);
    });
    return {
      getState: answerState,
      setState: function (state, locked) {
        if (state && state.texts) areas.forEach(function (a, i) { a.value = state.texts[i] || ''; autoGrow(a); });
        if (locked) {
          submit.disabled = true;
          lockAreas();
          opts.reveal();
          panelHandle = buildSelfMarkPanel(elc, q, opts, answerState);
          panelHandle.restore(state, state && state._mark != null ? state._mark : undefined);
          // lock panel with the recorded mark if we have one in saved payload:
          // the seam passes locked=true only when selfMark was saved, so show
          // it as recorded using the ticks the student made.
          var ticked = state && state._ticks ? state._ticks.filter(Boolean).length : null;
          if (ticked != null) lockPanelSafe(elc, Math.min(q.marks, ticked), q.marks);
        }
      },
    };
  }
  // Avoid double "Recorded" lines when restore already locked via restore()
  function lockPanelSafe(container, mark, max) {
    var panel = container.querySelector('.csew-selfmark');
    if (!panel || panel.querySelector('.csew-awarded')) return;
    lockPanel(panel, mark, max);
  }

  // ── 'banded' — extended response with level-of-response self-marking ──
  function mountBanded(elc, q, qi, opts) {
    // Extended responses always open at the full MAX_LINES — an 8-marker
    // genuinely is an essay, so a one-line box would misrepresent it.
    var ta = makeLineBox(MAX_LINES);
    elc.appendChild(ta);
    elc.appendChild(el('div', 'csew-marksright', '[' + q.marks + ']'));
    var submit = btn('📋 Submit & mark my answer');
    elc.appendChild(submit);
    var bands = bandsFor(q.marks || 8);
    var chosen = null, radios = [], markSel = null, panel = null;

    function buildPanel() {
      panel = el('div', 'csew-selfmark');
      panel.appendChild(el('h5', null, '🖊️ Level-of-response marking'));
      panel.appendChild(el('p', 'csew-note', 'Read the band descriptors in the mark scheme below, decide which band your answer sits in, then pick the mark within that band (top of the band = fully meets it).'));
      var wrap = el('div', 'csew-band');
      bands.forEach(function (b, i) {
        var lab = el('label');
        var r = document.createElement('input');
        r.type = 'radio';
        r.name = 'csewBand-' + qi;
        radios.push(r);
        r.addEventListener('change', function () { chosen = b; refreshMarkSel(); });
        lab.appendChild(r);
        lab.appendChild(el('span', null, b.label + (b.hi ? ' — ' + b.lo + (b.hi > b.lo ? '–' + b.hi : '') + ' marks' : ' — 0 marks')));
        wrap.appendChild(lab);
      });
      panel.appendChild(wrap);
      var row = el('div', 'csew-row');
      markSel = document.createElement('select');
      markSel.className = 'csew-markinput';
      row.appendChild(el('span', 'csew-note', 'Mark:'));
      row.appendChild(markSel);
      var saveBtn = btn('Save my marks');
      row.appendChild(saveBtn);
      panel.appendChild(row);
      refreshMarkSel();
      saveBtn.addEventListener('click', function () {
        var mark = parseInt(markSel.value, 10) || 0;
        lockPanel(panel, mark, q.marks);
        opts.save({ mark: mark, max: q.marks, state: { text: ta.value, band: chosen ? chosen.label : null, _mark: mark } });
      });
      elc.appendChild(panel);
    }
    function refreshMarkSel() {
      if (!markSel) return;
      markSel.innerHTML = '';
      var b = chosen || bands[0];
      for (var m = b.lo; m <= b.hi; m++) {
        var o = document.createElement('option');
        o.value = String(m); o.textContent = String(m);
        markSel.appendChild(o);
      }
      if (b.hi > b.lo) markSel.value = String(b.hi - (b.hi > b.lo ? 0 : 0));
    }
    submit.addEventListener('click', function () {
      submit.disabled = true;
      opts.reveal();
      buildPanel();
    });
    return {
      getState: function () { return { text: ta.value }; },
      setState: function (state, locked) {
        if (state && state.text != null) { ta.value = state.text; autoGrow(ta); }
        if (locked) {
          submit.disabled = true;
          ta.disabled = true;
          opts.reveal();
          buildPanel();
          if (state && state._mark != null) lockPanel(panel, state._mark, q.marks);
        }
      },
    };
  }

  // ── 'numeric' — typed numeric answer, AUTO-marked (ADM-B B1) ──────
  // The question carries q.numeric, a map of blank-id → answer key:
  //   q.numeric = { "1": { value: 2.45, tol: 0.005, accept: ["-3+2root5"] } }
  // (one key is the common case; multi-key supports multi-part numeric).
  // Normalisation MUST stay byte-identical to the server graders'
  // numeric_answer_correct() (supabase/numeric-normalise.sql) or the live
  // mark diverges from what the student sees — change both together.
  //
  //   normNumeric(s): lowercase, √→root, strip spaces/commas/£/$/€/%.
  //   value match:    parse a plain decimal OR an a/b fraction, then
  //                   |parsed − key.value| ≤ (key.tol ?? 0.0005).
  //   exact-form match: normNumeric(student) === normNumeric(any accept[]).
  function normNumeric(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/√/g, 'root')      // √ → root
      .replace(/[\s,£$€%]/g, '');
  }
  function evalNumericValue(ns) {
    // leading '+' deliberately NOT accepted — keeps the parse identical to the
    // server, where '+3'::numeric is not portable. Students type '-3', not '+3'.
    if (/^-?\d+(\.\d+)?$/.test(ns)) return parseFloat(ns);
    var m = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(ns);
    if (m) { var d = parseFloat(m[2]); if (d !== 0) return parseFloat(m[1]) / d; }
    return null; // not a bare number/fraction — only an accept-form can match
  }
  function numericKeyCorrect(raw, key) {
    if (!key) return false;
    var ns = normNumeric(raw);
    if (ns === '') return false;
    var accept = key.accept || [];
    for (var i = 0; i < accept.length; i++) { if (ns === normNumeric(accept[i])) return true; }
    var v = evalNumericValue(ns);
    if (v === null) return false;
    var tol = (key.tol != null) ? key.tol : 0.0005;
    return Math.abs(v - key.value) <= tol + 1e-12;
  }

  function mountNumeric(elc, q, qi, opts) {
    injectStyleOnce('csew-numeric-style', [
      '.csew-numeric { font-family: "DM Mono","Consolas",monospace; font-size: 15px; padding: 9px 11px; min-height: 42px; width: 100%; max-width: 260px; box-sizing: border-box; border: 1px solid var(--border); border-radius: 7px; background: var(--cream); color: var(--ink); }',
      '.csew-numeric:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }',
      '.csew-numeric.csew-correct { border-color: var(--success); box-shadow: 0 0 0 1px var(--success); }',
      '.csew-numeric.csew-incorrect { border-color: #c0392b; box-shadow: 0 0 0 1px #c0392b; }',
      '.csew-numeric-fb { font-size: 13.5px; font-weight: 600; margin: 8px 0 0; }',
      '.csew-numeric-fb.ok { color: var(--success); }',
      '.csew-numeric-fb.no { color: #c0392b; }',
    ].join('\n'));

    var keys = q.numeric || {};
    var ids = Object.keys(keys);
    if (!ids.length) return factories['lines'](elc, q, qi, opts); // no key → self-mark fallback

    var inputs = {};
    ids.forEach(function (id) {
      var k = keys[id];
      if (k.label || ids.length > 1) elc.appendChild(el('div', 'csew-lines-label', k.label || ('Answer ' + id)));
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'csew-numeric';
      inp.autocomplete = 'off';
      inp.spellcheck = false;
      inp.setAttribute('aria-label', k.label || ('Numeric answer ' + id));
      inputs[id] = inp;
      elc.appendChild(inp);
    });
    elc.appendChild(el('div', 'csew-marksright', '[' + q.marks + ']'));
    var submit = btn('✓ Check my answer');
    elc.appendChild(submit);
    var fb = el('div', 'csew-numeric-fb');
    elc.appendChild(fb);

    var answered = false;
    function stateOf() { var t = {}; ids.forEach(function (id) { t[id] = inputs[id].value; }); return { values: t }; }
    function markInputs() {
      var correct = 0;
      ids.forEach(function (id) {
        var ok = numericKeyCorrect(inputs[id].value, keys[id]);
        inputs[id].classList.toggle('csew-correct', ok);
        inputs[id].classList.toggle('csew-incorrect', !ok);
        inputs[id].disabled = true;
        if (ok) correct++;
      });
      return correct;
    }
    function grade() {
      var correct = markInputs();
      var mark = Math.round((q.marks || 0) * correct / ids.length);
      submit.disabled = true;
      var all = correct === ids.length;
      fb.className = 'csew-numeric-fb ' + (all ? 'ok' : 'no');
      fb.textContent = all ? ('Correct — ' + mark + ' / ' + q.marks)
        : (correct ? 'Partly right — ' + mark + ' / ' + q.marks : 'Not correct — 0 / ' + q.marks) + '. Check the mark scheme for the method.';
      opts.reveal();
      opts.save({ mark: mark, max: q.marks, state: { values: stateOf().values, _mark: mark } });
    }
    submit.addEventListener('click', function () { if (answered) return; answered = true; grade(); });
    ids.forEach(function (id) {
      inputs[id].addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); if (!answered) { answered = true; grade(); } } });
    });

    return {
      getState: stateOf,
      setState: function (s, locked) {
        if (s && s.values) ids.forEach(function (id) { if (s.values[id] != null) inputs[id].value = s.values[id]; });
        if (locked) { answered = true; markInputs(); submit.disabled = true; opts.reveal(); }
      },
    };
  }

  // ── 'mathParts' — multi-part question (ADM-B B2) ──────────────────
  // q.parts = [ { label:'(a)', marks, prompt?, markScheme?, ...one of:
  //               numeric:{…}  → that part AUTO-marks (reuses the numeric
  //                              comparator), or
  //               markPoints/markScheme → that part SELF-marks via the tick
  //               panel } ]
  // Each part marks independently; the widget aggregates the part marks into
  // ONE opts.save({mark, max}) once every part is marked. No script.js change —
  // _epUseWidget keys on q.format.
  function mountMathParts(elc, q, qi, opts) {
    injectStyleOnce('csew-mathparts-style', [
      '.csew-part { border-left: 3px solid var(--border); padding: 4px 0 10px 14px; margin: 0 0 14px; }',
      '.csew-part-head { font-size: 14.5px; margin-bottom: 8px; line-height: 1.5; }',
      '.csew-part-marks { color: var(--mid); font-family: "DM Mono","Consolas",monospace; font-size: 12px; }',
      '.csew-part-scheme { margin-top: 10px; }',
    ].join('\n'));

    var parts = q.parts || [];
    if (!parts.length) return factories['lines'](elc, q, qi, opts); // malformed → self-mark fallback
    var totalMax = q.marks || parts.reduce(function (s, p) { return s + (p.marks || 0); }, 0);
    var awarded = {};   // part index → awarded mark
    var pctl = [];      // per-part controller: { getState, restore }

    function tally() { var t = 0; for (var i = 0; i < parts.length; i++) t += awarded[i] || 0; return Math.min(t, totalMax); }
    function maybeSave() {
      if (Object.keys(awarded).length < parts.length) return;
      opts.save({ mark: tally(), max: totalMax, state: { parts: pctl.map(function (c) { return c.getState(); }), _mark: tally() } });
    }

    parts.forEach(function (part, i) {
      var pmax = part.marks || 0;
      var wrap = el('div', 'csew-part'); elc.appendChild(wrap);
      var head = el('div', 'csew-part-head');
      head.innerHTML = (part.label ? '<strong>' + part.label + '</strong> ' : '') + (part.prompt || '') +
        ' <span class="csew-part-marks">[' + pmax + ']</span>';
      wrap.appendChild(head);
      var body = el('div'); wrap.appendChild(body);
      var scheme = el('div', 'csew-part-scheme'); scheme.style.display = 'none'; scheme.innerHTML = part.markScheme || '';
      wrap.appendChild(scheme);
      function revealScheme() { if (part.markScheme) scheme.style.display = ''; if (typeof renderMathIn === 'function') renderMathIn(wrap); }

      if (part.numeric && Object.keys(part.numeric).length) {
        // AUTO-marked numeric part
        var keys = Object.keys(part.numeric), inputs = {};
        keys.forEach(function (id) {
          var k = part.numeric[id];
          if (k.label || keys.length > 1) body.appendChild(el('div', 'csew-lines-label', k.label || ('Answer ' + id)));
          var inp = document.createElement('input');
          inp.type = 'text'; inp.className = 'csew-numeric'; inp.autocomplete = 'off'; inp.spellcheck = false;
          inputs[id] = inp; body.appendChild(inp);
        });
        var chk = btn('✓ Check'); body.appendChild(chk);
        var fb = el('div', 'csew-numeric-fb'); body.appendChild(fb);
        var done = false;
        function grade() {
          if (done) return; done = true;
          var c = 0;
          keys.forEach(function (id) {
            var okv = numericKeyCorrect(inputs[id].value, part.numeric[id]);
            inputs[id].classList.toggle('csew-correct', okv);
            inputs[id].classList.toggle('csew-incorrect', !okv);
            inputs[id].disabled = true; if (okv) c++;
          });
          var m = Math.round(pmax * c / keys.length); awarded[i] = m; chk.disabled = true;
          fb.className = 'csew-numeric-fb ' + (c === keys.length ? 'ok' : 'no');
          fb.textContent = (c === keys.length ? 'Correct' : (c ? 'Partly right' : 'Not correct')) + ' — ' + m + ' / ' + pmax;
          revealScheme(); maybeSave();
        }
        chk.addEventListener('click', grade);
        keys.forEach(function (id) { inputs[id].addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); grade(); } }); });
        pctl.push({
          getState: function () { var v = {}; keys.forEach(function (id) { v[id] = inputs[id].value; }); return { kind: 'numeric', values: v, _mark: awarded[i] }; },
          restore: function (st, locked) { if (st && st.values) keys.forEach(function (id) { if (st.values[id] != null) inputs[id].value = st.values[id]; }); if (locked) grade(); },
        });
      } else {
        // SELF-marked written part (method / working marks)
        var ta = makeLineBox(clampLines(part.lines || Math.ceil(pmax || 1))); body.appendChild(ta);
        var submit = btn('📋 Submit part'); body.appendChild(submit);
        var panelHandle = null, savedState = null;
        function answerState() { return { text: ta.value }; }
        function openPanel(restoreState, lockedMark) {
          submit.disabled = true; ta.disabled = true; revealScheme();
          panelHandle = buildSelfMarkPanel(body, { marks: pmax, markScheme: part.markScheme, markPoints: part.markPoints },
            { reveal: function () {}, save: function (pl) { awarded[i] = pl.mark; savedState = pl.state; maybeSave(); } }, answerState);
          if (restoreState) panelHandle.restore(restoreState, lockedMark);
        }
        submit.addEventListener('click', function () { openPanel(); });
        pctl.push({
          getState: function () { return Object.assign({ kind: 'written' }, savedState || answerState(), awarded[i] != null ? { _mark: awarded[i] } : {}); },
          restore: function (st, locked) { if (st && st.text != null) { ta.value = st.text; autoGrow(ta); } if (locked) openPanel(st, st && st._mark != null ? st._mark : undefined); },
        });
      }
    });

    return {
      getState: function () { return { parts: pctl.map(function (c) { return c.getState(); }) }; },
      setState: function (s, locked) { if (s && s.parts) pctl.forEach(function (c, i) { c.restore(s.parts[i], locked); }); },
    };
  }

  window.CsExamWidgets = {
    register: function (format, factory) { factories[format] = factory; },
    supports: function (format) { return !!factories[format]; },
    mount: function (elc, q, qi, opts) {
      var f = factories[q.format || 'lines'] || factories['lines'];
      try { return f(elc, q, qi, opts); }
      catch (e) {
        console.error('[cs-exam-widgets]', e);
        elc.textContent = '⚠️ This question could not display — please tell your teacher.';
        return { getState: function () { return null; }, setState: function () {} };
      }
    },
    helpers: {
      el: el, btn: btn, injectStyleOnce: injectStyleOnce,
      parseMarkPoints: parseMarkPoints, buildSelfMarkPanel: buildSelfMarkPanel,
      lockPanel: lockPanel, bandsFor: bandsFor,
      // numeric normalisation/compare — exposed so tests (and any future
      // caller) use the SAME logic the server graders mirror.
      normNumeric: normNumeric, evalNumericValue: evalNumericValue,
      numericAnswerCorrect: numericKeyCorrect,
    },
  };

  window.CsExamWidgets.register('lines', mountLines);
  window.CsExamWidgets.register('banded', mountBanded);
  window.CsExamWidgets.register('numeric', mountNumeric);
  window.CsExamWidgets.register('mathParts', mountMathParts);
})();
