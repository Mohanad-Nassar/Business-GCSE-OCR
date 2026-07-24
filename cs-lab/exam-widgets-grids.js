// ══════════════════════════════════════════════════════════════
// CS EXAM WIDGETS — structured-grid formats (CS-CONTENT-PLAN.md §7.3)
// Registers into the CsExamWidgets registry defined by exam-widgets.js
// (load this file AFTER that one — see the <script> order on the CS
// topic pages). Covers the grid/table/matching/cloze/truth-table/
// trace-table/binary-sum question forms; codeWrite/codeGaps/codeFunction
// are exam-widgets-code.js's territory, not this file's.
//
// ── Optional per-question data fields (all opt-in; absent = fallback) ──
// Two shapes coexist here on purpose: tickGrid/matchLine/binaryColumn were
// spec'd before any real paper was transcribed, so they use the original
// per-question-field contract. tableFill/bankCloze/truthTable/traceTable
// were subsequently transcribed by a parallel agent from the actual June
// 2024 papers (subjects/computer-science/mock-papers/2024-paper{1,2}.js)
// using its own reasonable reading of the same brief — THAT shape (below)
// is what this file now parses for those four formats, since it is real,
// already-authored content, not a hypothetical.
//
//   q.grid   = { cols:[...], rows:[{label, correct:[colIdx,...]}] }        (tickGrid)
//   q.table  = { headers:[...], rows:[[cell|null,...]], openChoice?:bool } (tableFill)
//   q.answers = {"r,c":[accepted,...]}  — TOP-LEVEL on q, keyed 0-based into table.rows
//              (tableFill; openChoice:true = an open answer set, e.g. "any 2 of 4
//              registers", which cannot be marked per-cell — falls back to
//              reveal-scheme + self-mark even though q.table.rows is present)
//   q.match  = { left:[...], right:[...], answer:{leftIdx:rightIdx}, decoys:[rightIdx,...] } (matchLine)
//   q.cloze  = HTML string with ___1___, ___2___... blanks (bankCloze) OR
//              { text:"... {1} ... {2} ...", answers:{"1":[accepted,...]} } (inlineCloze, legacy shape)
//   q.bank   = ["word", ...]           (bankCloze, alongside q.cloze)
//   q.answers = ["wordForBlank1", "wordForBlank2", ...] — ordered array, one
//              accepted string (or an array of accepted alternatives) per
//              blank number (bankCloze; same top-level field as tableFill's)
//   q.truth  = { inputs:[...], output:"P", pairRows:bool, rows:[{in:[0,1,...], out:0|1}] } (truthTable)
//   q.trace  = { columns:[...], rows:[[cell|null,...], ...] }              (traceTable;
//              rows are the EXPECTED trace, null = blank/unchanged-is-fine;
//              rendered with a couple of extra spare rows since papers say
//              "you may not need to use all the rows")
//   q.binary = { a:"01101001", b:"...", bits:8, answer:"...", overflow?:bool, askOverflow?:bool } (binaryColumn)
//
// Every format works WITHOUT its structured field today by falling back to
// the core registry's 'lines' widget — a ruled-lines textarea +
// buildSelfMarkPanel, exactly like a plain 'written' question, which is a
// strict improvement over the un-widgeted rendering these formats got
// before this file existed (plain textarea + no self-mark UI). This is
// done by remounting through CsExamWidgets.mount() with format forced to
// 'lines', so the fallback path is byte-for-byte the core module's own
// behaviour — no logic duplicated here.
//
// Auto-marking formats (all except the fallback path) apply the real
// paper rules documented per-format below, colour each answer unit
// green/red, call opts.save({mark, max, state}) once, then opts.reveal(),
// then disable all inputs — one Check per question, exactly per contract.
//
// Marking is pure-function/DOM-free where practical (see the
// module.exports guard at the bottom) so it can be unit-tested under
// plain Node without a browser — this file is wrapped as
// (function (root) {...})(window||global) for that reason, unlike
// exam-widgets.js's plain (function(){...})() (which never needs to run
// outside a browser).
// ══════════════════════════════════════════════════════════════

(function (root) {
  'use strict';

  var hasCore = !!(root && root.CsExamWidgets);
  var H = hasCore ? root.CsExamWidgets.helpers : null;

  // ── shared "recorded" UI + colour helpers (used by every auto-marker) ──
  function markCorrectClass(node, ok) {
    node.classList.remove('csew-grids-correct', 'csew-grids-wrong');
    node.classList.add(ok ? 'csew-grids-correct' : 'csew-grids-wrong');
  }
  function showRecorded(host, mark, max) {
    host.appendChild(H.el('p', 'csew-awarded', '✓ Recorded: ' + mark + ' / ' + max + ' marks'));
  }

  // ── Deterministic per-question DISPLAY shuffle (mirrors script.js's
  // _shuffledIndices). Returns a permutation of [0..n-1] seeded by the
  // question, so authored answer positions (word-bank listed answer-first,
  // tick-grid diagonals) are broken up — but STABLE per question, so it
  // never re-jumbles on reload. ONLY the DOM insertion order uses this;
  // every data structure (checkboxes, chips, grading, saved state) stays
  // keyed to the ORIGINAL index, so marking and persistence are unchanged.
  function _hashStr(s) { var h = 2166136261 >>> 0; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seededPerm(n, seedStr) {
    var idx = []; for (var k = 0; k < n; k++) idx.push(k);
    var seed = _hashStr(seedStr) || 1;
    function rnd() { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    for (var i = n - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp; }
    return idx;
  }
  function qSeed(q) { return String((q && q.num) || '') + '|' + String((q && q.question) || '').slice(0, 120); }
  // Remount through the core registry's own 'lines' widget (ruled
  // textarea + buildSelfMarkPanel on submit) — the documented fallback
  // for every format here when its optional structured field is absent.
  function mountAsLines(elc, q, qi, opts) {
    var qLines = Object.assign({}, q, { format: 'lines' });
    return root.CsExamWidgets.mount(elc, qLines, qi, opts);
  }

  // ══════════════════ pure marking helpers (Node-testable) ══════════════════

  function normalizeText(s) {
    return (s === null || s === undefined ? '' : String(s)).trim().toLowerCase();
  }

  // trim + case-insensitive match against an accept-list. `accepted` may be
  // a single string (the transcribed papers' q.answers convention — one
  // canonical word per blank/cell) or an array of accepted alternatives
  // (the original per-field spec's accept-list convention) — both work.
  // Blank entries never credit (an empty box is never "the answer they
  // didn't need to give").
  function cellAccepted(value, accepted) {
    var v = normalizeText(value);
    if (!v) return false;
    var list = Array.isArray(accepted) ? accepted : [accepted];
    return list.some(function (a) { return normalizeText(a) === v; });
  }

  // Generic "keyed cell -> accepted answer(s)" marker shared by tableFill
  // and both cloze formats (all three are really the same "fill named gaps"
  // shape, just with different key spaces: "r,c" for tables, "1".."N" for
  // cloze blanks).
  function markKeyedAnswers(answers, values, maxMarks) {
    var keys = Object.keys(answers || {});
    var cellResults = {};
    var correctCount = 0;
    keys.forEach(function (k) {
      var ok = cellAccepted(values ? values[k] : undefined, answers[k]);
      cellResults[k] = ok;
      if (ok) correctCount++;
    });
    var mark = maxMarks != null ? Math.min(maxMarks, correctCount) : correctCount;
    return { cellResults: cellResults, mark: mark, max: maxMarks != null ? maxMarks : keys.length };
  }
  // Convenience wrappers for the pure-fn test harness: accept either an
  // already-resolved {key: answer} map, or a wrapper object carrying one
  // under .answers (the original per-field spec's q.table/q.cloze shape).
  // Mount functions below resolve the map themselves and call
  // markKeyedAnswers directly, since the transcribed papers put the answer
  // key at the top level of the question (q.answers), not nested.
  function markTableFill(source, values, maxMarks) {
    return markKeyedAnswers((source && source.answers) ? source.answers : (source || {}), values, maxMarks);
  }
  function markCloze(source, values, maxMarks) {
    return markKeyedAnswers((source && source.answers) ? source.answers : (source || {}), values, maxMarks);
  }

  // Ordered array [ansForBlank1, ansForBlank2, ...] (the transcribed
  // bankCloze convention: q.answers is an array, not a keyed map) -> the
  // "1".."N" keyed map markKeyedAnswers expects.
  function clozeAnswersFromArray(answersArray) {
    var out = {};
    (answersArray || []).forEach(function (a, i) { out[String(i + 1)] = a; });
    return out;
  }

  // Cloze text ("... {1} ... ___2___ ...") -> HTML with each blank replaced
  // by a placeholder <span data-blank="N">, so cloze text — which may itself
  // be authored HTML with <p>/<strong>/etc, same trust level as q.question —
  // can be assigned via innerHTML in one shot and then walked for its blank
  // slots, rather than fighting createTextNode against embedded markup.
  // Supports both the original {1} token convention and the transcribed
  // papers' ___1___ convention (FIB-style named blanks, see
  // fib-blank-markers memory) so either can be authored going forward.
  function clozeHtmlWithSlots(text, slotClass) {
    return (text || '').replace(/\{(\w+)\}|___(\d+)___/g, function (whole, a, b) {
      return '<span class="' + slotClass + '" data-blank="' + (a || b) + '"></span>';
    });
  }

  // Tick-grid: real paper rule — a row scores 1 only if its ticked set is
  // EXACTLY the answer set (missing ticks OR extra ticks both void the row).
  function markTickGrid(grid, ticks) {
    var cols = (grid && grid.cols) || [];
    var rows = (grid && grid.rows) || [];
    var rowScores = rows.map(function (row, ri) {
      var correctSet = {};
      (row.correct || []).forEach(function (c) { correctSet[c] = true; });
      var tickedRow = (ticks && ticks[ri]) || [];
      var ok = true;
      for (var ci = 0; ci < cols.length; ci++) {
        var isTicked = !!tickedRow[ci];
        var shouldTick = !!correctSet[ci];
        if (isTicked !== shouldTick) { ok = false; break; }
      }
      return ok ? 1 : 0;
    });
    var mark = rowScores.reduce(function (a, b) { return a + b; }, 0);
    return { rowScores: rowScores, mark: mark, max: rows.length };
  }

  // Matching: 1 mark per left item whose connected right item is correct.
  // Drawing two lines from one left item is impossible by construction here
  // (one connection per left item, re-click replaces it) — the paper's "any
  // 2 lines from 1 component = 0" rule falls out for free.
  function markMatchLine(match, connections) {
    var answer = (match && match.answer) || {};
    var results = {};
    var mark = 0;
    Object.keys(answer).forEach(function (k) {
      var ok = connections && connections[k] != null && String(connections[k]) === String(answer[k]);
      results[k] = ok;
      if (ok) mark++;
    });
    return { results: results, mark: mark, max: Object.keys(answer).length };
  }

  // Truth table (transcribed-paper shape: a single output column —
  // q.truth = { inputs, output, pairRows, rows:[{in:[0,1,...], out:0|1}] }).
  // Default: 1 mark per correct output cell. q.truth.pairRows: OCR's
  // pair-of-rows convention — rows are grouped (0,1),(2,3),... and a pair
  // scores 1 only when BOTH rows' output in it are correct.
  function markTruthTable(truth, values) {
    var rows = (truth && truth.rows) || [];
    var cellResults = [];
    if (truth && truth.pairRows) {
      var pairCount = Math.floor(rows.length / 2);
      var mark = 0;
      for (var p = 0; p < pairCount; p++) {
        var r1 = p * 2, r2 = p * 2 + 1;
        var v1 = values ? values[r1] : undefined;
        var v2 = values ? values[r2] : undefined;
        var ok1 = String(v1) === String(rows[r1].out);
        var ok2 = String(v2) === String(rows[r2].out);
        cellResults[r1] = ok1; cellResults[r2] = ok2;
        if (ok1 && ok2) mark++;
      }
      return { cellResults: cellResults, mark: mark, max: pairCount };
    }
    var correct = 0;
    rows.forEach(function (row, ri) {
      var v = values ? values[ri] : undefined;
      var ok = String(v) === String(row.out);
      cellResults[ri] = ok;
      if (ok) correct++;
    });
    return { cellResults: cellResults, mark: correct, max: rows.length };
  }

  // Trace table blank-cell convention: an expected-blank cell ("value is
  // unchanged from the row above / not needed") is correct only when the
  // student also leaves it blank — we do not attempt carried-value
  // inference here (that is the Practice Lab trace-table tool's job; exam
  // answers are marked strictly against the authored expected grid,
  // paper-style).
  function traceCellMatches(entered, expected) {
    var e = entered === null || entered === undefined ? '' : String(entered).trim();
    var x = expected === null || expected === undefined ? '' : String(expected).trim();
    if (x === '') return e === '';
    return e.toLowerCase() === x.toLowerCase();
  }
  // Transcribed-paper shape: q.trace = { columns, rows: (string|null)[][] }
  // — rows are positional (column index, not column name) and ARE the
  // expected trace. Partial credit is per FULLY-CORRECT ROW (every column
  // in that row right), not per cell — matches the OCR trace-table mark
  // scheme pattern of one mark per correct line of the trace. Only the
  // authored rows are graded; the mount function renders extra ungraded
  // "spare" rows beyond this (papers explicitly say "you may not need to
  // use all the rows in the table"), so `values` may be longer than
  // `trace.rows` — the extra entries are simply never consulted here.
  function markTraceTable(trace, values) {
    var columns = (trace && trace.columns) || [];
    var expectedRows = (trace && trace.rows) || [];
    var rowResults = expectedRows.map(function (expectedRow, ri) {
      var enteredRow = (values && values[ri]) || [];
      var cellResults = columns.map(function (col, ci) {
        return traceCellMatches(enteredRow[ci], expectedRow[ci]);
      });
      var rowCorrect = cellResults.every(function (ok) { return ok; });
      return { cellResults: cellResults, rowCorrect: rowCorrect };
    });
    var mark = rowResults.filter(function (r) { return r.rowCorrect; }).length;
    return { rowResults: rowResults, mark: mark, max: expectedRows.length };
  }

  // Binary sum: per-digit partial credit against q.binary.answer, plus an
  // optional +1 for a correctly-judged overflow toggle.
  function markBinarySum(binary, enteredDigits, enteredOverflow) {
    var expected = String((binary && binary.answer) || '').split('');
    var entered = enteredDigits || [];
    var digitResults = expected.map(function (d, i) {
      return (entered[i] === undefined || entered[i] === null ? '' : String(entered[i]).trim()) === d;
    });
    var mark = digitResults.filter(Boolean).length;
    var max = expected.length;
    var overflowOk = null;
    if (binary && binary.askOverflow) {
      overflowOk = !!enteredOverflow === !!binary.overflow;
      if (overflowOk) mark++;
      max++;
    }
    return { digitResults: digitResults, overflowOk: overflowOk, mark: mark, max: max };
  }

  // ══════════════════ styles (theme vars only, injected once) ══════════════════

  var GRID_CSS = [
    '.csew-grids-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 13.5px; }',
    '.csew-grids-table th, .csew-grids-table td { border: 1px solid var(--border); padding: 6px 8px; text-align: left; vertical-align: middle; }',
    '.csew-grids-table th { background: color-mix(in srgb, var(--accent) 10%, var(--card-bg)); }',
    '.csew-grids-rowlabel { font-weight: 600; }',
    '.csew-grids-checkcell, .csew-grids-togglecell, .csew-grids-giventd { text-align: center; }',
    '.csew-grids-checkcell input[type="checkbox"] { width: 17px; height: 17px; cursor: pointer; }',
    '.csew-grids-cellinput, .csew-grids-blank { box-sizing: border-box; border: 1px solid var(--border); border-radius: 6px;',
    '  background: var(--card-bg); color: var(--ink); font-family: inherit; font-size: 13.5px; padding: 5px 7px; }',
    '.csew-grids-cellinput { width: 100%; }',
    '.csew-grids-blank { display: inline-block; min-width: 100px; margin: 0 3px; text-align: center; }',
    '.csew-grids-clozetext { line-height: 2.1; }',
    '.csew-grids-correct { border-color: var(--success) !important; background: color-mix(in srgb, var(--success) 16%, var(--card-bg)) !important; }',
    '.csew-grids-wrong { border-color: var(--wrong) !important; background: color-mix(in srgb, var(--wrong) 14%, var(--card-bg)) !important; }',
    // matching
    '.csew-grids-matchwrap { position: relative; margin: 10px 0; }',
    '.csew-grids-match-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }',
    '.csew-grids-match-line { stroke: var(--accent); stroke-width: 2; }',
    '.csew-grids-match-cols { display: flex; justify-content: space-between; gap: 24px; position: relative; z-index: 1; }',
    '.csew-grids-match-col { display: flex; flex-direction: column; gap: 8px; width: 47%; }',
    '.csew-grids-match-item { text-align: left; padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px;',
    '  background: var(--card-bg); color: var(--ink); cursor: pointer; font-family: inherit; font-size: 13.5px; }',
    '.csew-grids-match-item:disabled { cursor: default; }',
    '.csew-grids-match-item.csew-grids-selected { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 30%, transparent); }',
    // word-bank cloze
    '.csew-grids-bank { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; padding: 10px; border: 1px dashed var(--border); border-radius: 8px; background: var(--cream); }',
    '.csew-grids-chip { padding: 6px 14px; border-radius: 999px; border: 1px solid var(--border); background: var(--card-bg);',
    '  color: var(--ink); cursor: grab; font-family: inherit; font-size: 13px; }',
    '.csew-grids-chip.csew-grids-armed { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, var(--card-bg)); }',
    '.csew-grids-chip.csew-grids-used, .csew-grids-chip:disabled { opacity: .4; cursor: not-allowed; text-decoration: line-through; }',
    '.csew-grids-gap { display: inline-block; min-width: 100px; padding: 2px 8px; margin: 0 3px; border-bottom: 2px solid var(--mid); text-align: center; cursor: pointer; }',
    '.csew-grids-gap.csew-grids-filled { font-weight: 600; }',
    '.csew-grids-gap.csew-grids-locked { cursor: default; }',
    // truth table toggle
    '.csew-grids-toggle { width: 36px; height: 30px; border: 1px solid var(--border); border-radius: 6px;',
    '  background: var(--card-bg); color: var(--ink); font-family: inherit; font-weight: 700; cursor: pointer; }',
    '.csew-grids-toggle:disabled { cursor: default; }',
    // binary column
    '.csew-grids-binarywrap { margin: 10px 0; }',
    '.csew-grids-binrow { display: flex; align-items: center; gap: 8px; margin: 2px 0; }',
    '.csew-grids-binlabel { width: 16px; font-weight: 700; text-align: center; }',
    '.csew-grids-bincells { display: flex; gap: 2px; margin-left: 24px; }',
    '.csew-grids-digit { width: 26px; height: 30px; display: flex; align-items: center; justify-content: center;',
    '  font-family: "Courier New", monospace; font-size: 15px; border: 1px solid var(--border); border-radius: 4px;',
    '  background: var(--card-bg); color: var(--ink); }',
    'input.csew-grids-digit { text-align: center; padding: 0; font-family: "Courier New", monospace; }',
    '.csew-grids-binrule { border-top: 2px solid var(--ink); margin: 4px 0 4px 24px; width: 216px; max-width: 100%; }',
    '.csew-grids-overflow label { margin-right: 14px; cursor: pointer; font-size: 13px; }',
  ].join('\n');

  // ══════════════════ mount functions (DOM; only ever called in-browser) ══════════════════

  function marksRightTag(elc, q) {
    elc.appendChild(H.el('div', 'csew-marksright', '[' + q.marks + ']'));
  }
  function checkButtonRow(elc) {
    var checkBtn = H.btn('✓ Check Answers');
    elc.appendChild(checkBtn);
    var noteHost = H.el('div', 'csew-grids-note-host');
    elc.appendChild(noteHost);
    return { checkBtn: checkBtn, noteHost: noteHost };
  }

  // ── 1. tickGrid ──
  function mountTickGrid(elc, q, qi, opts) {
    if (!q.grid || !q.grid.cols || !q.grid.rows) return mountAsLines(elc, q, qi, opts);
    H.injectStyleOnce('csew-grids-style', GRID_CSS);
    var grid = q.grid;
    var table = document.createElement('table');
    table.className = 'csew-grids-table csew-grids-tickgrid';
    var htr = document.createElement('tr');
    htr.appendChild(H.el('th', null, 'Statement'));
    grid.cols.forEach(function (c) { htr.appendChild(H.el('th', null, c)); });
    table.appendChild(htr);

    var checkboxes = grid.rows.map(function () { return []; });
    var rowEls = [];
    grid.rows.forEach(function (row, ri) {
      var tr = document.createElement('tr');
      tr.appendChild(H.el('td', 'csew-grids-rowlabel', row.label));
      grid.cols.forEach(function (c, ci) {
        var td = document.createElement('td');
        td.className = 'csew-grids-checkcell';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        checkboxes[ri][ci] = cb;
        td.appendChild(cb);
        tr.appendChild(td);
      });
      rowEls[ri] = tr;
    });
    // Insert rows in a seeded shuffled order so the correct column is not a
    // fixed diagonal. checkboxes[] and grid.rows stay in ORIGINAL order, so
    // readTicks / markTickGrid / saved state are entirely unchanged.
    seededPerm(grid.rows.length, qSeed(q)).forEach(function (origRi) { table.appendChild(rowEls[origRi]); });
    elc.appendChild(table);
    marksRightTag(elc, q);
    var ctrl = checkButtonRow(elc);

    function readTicks() {
      return checkboxes.map(function (row) { return row.map(function (cb) { return !!cb.checked; }); });
    }
    function applyColors(rowScores) {
      grid.rows.forEach(function (row, ri) {
        var ok = rowScores[ri] === 1;
        checkboxes[ri].forEach(function (cb) { markCorrectClass(cb.closest('td'), ok); });
      });
    }
    function lockAll() {
      checkboxes.forEach(function (row) { row.forEach(function (cb) { cb.disabled = true; }); });
      ctrl.checkBtn.disabled = true;
    }
    function doCheck() {
      if (ctrl.checkBtn.disabled) return; // guard: belt-and-braces against double-submit
      var ticks = readTicks();
      var result = markTickGrid(grid, ticks);
      applyColors(result.rowScores);
      lockAll();
      var mark = Math.min(q.marks, result.mark);
      showRecorded(ctrl.noteHost, mark, q.marks);
      opts.save({ mark: mark, max: q.marks, state: { ticks: ticks } });
      opts.reveal();
    }
    ctrl.checkBtn.addEventListener('click', doCheck);

    return {
      getState: function () { return { ticks: readTicks() }; },
      setState: function (state, locked) {
        if (state && state.ticks) {
          state.ticks.forEach(function (row, ri) {
            (row || []).forEach(function (v, ci) { if (checkboxes[ri] && checkboxes[ri][ci]) checkboxes[ri][ci].checked = !!v; });
          });
        }
        if (locked) {
          var result = markTickGrid(grid, (state && state.ticks) || readTicks());
          applyColors(result.rowScores);
          lockAll();
          showRecorded(ctrl.noteHost, Math.min(q.marks, result.mark), q.marks);
        }
      },
    };
  }

  // ── 2. tableFill ──
  function mountTableFill(elc, q, qi, opts) {
    // openChoice ("any 2 of these 4 registers") cannot be marked per-cell —
    // the paper's transcribed shape flags this explicitly; fall back even
    // though q.table.rows is present.
    if (!q.table || !q.table.rows || q.table.openChoice) return mountAsLines(elc, q, qi, opts);
    H.injectStyleOnce('csew-grids-style', GRID_CSS);
    var t = q.table;
    // Answer key lives at the top level of q (real transcribed shape:
    // q.answers = {"r,c": [accepted,...]}), with q.table.answers supported
    // too for back-compat with the original per-field spec.
    var answersMap = q.answers || t.answers || {};
    var table = document.createElement('table');
    table.className = 'csew-grids-table csew-grids-tablefill';
    if (t.headers && t.headers.length) {
      var htr = document.createElement('tr');
      t.headers.forEach(function (h) { htr.appendChild(H.el('th', null, h)); });
      table.appendChild(htr);
    }
    var inputs = {};
    t.rows.forEach(function (row, ri) {
      var tr = document.createElement('tr');
      row.forEach(function (cell, ci) {
        var td = document.createElement('td');
        if (cell === null || cell === undefined) {
          var inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'csew-grids-cellinput';
          inp.autocomplete = 'off';
          inp.spellcheck = false;
          inputs[ri + ',' + ci] = inp;
          td.appendChild(inp);
        } else {
          td.textContent = cell;
        }
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    elc.appendChild(table);
    marksRightTag(elc, q);
    var ctrl = checkButtonRow(elc);

    function readValues() {
      var v = {};
      Object.keys(inputs).forEach(function (k) { v[k] = inputs[k].value; });
      return v;
    }
    function applyColors(cellResults) {
      Object.keys(inputs).forEach(function (k) { markCorrectClass(inputs[k], !!cellResults[k]); });
    }
    function lockAll() {
      Object.keys(inputs).forEach(function (k) { inputs[k].disabled = true; });
      ctrl.checkBtn.disabled = true;
    }
    function doCheck() {
      if (ctrl.checkBtn.disabled) return;
      var values = readValues();
      var result = markKeyedAnswers(answersMap, values, q.marks);
      applyColors(result.cellResults);
      lockAll();
      showRecorded(ctrl.noteHost, result.mark, q.marks);
      opts.save({ mark: result.mark, max: q.marks, state: { values: values } });
      opts.reveal();
    }
    ctrl.checkBtn.addEventListener('click', doCheck);

    return {
      getState: function () { return { values: readValues() }; },
      setState: function (state, locked) {
        if (state && state.values) Object.keys(inputs).forEach(function (k) { if (state.values[k] != null) inputs[k].value = state.values[k]; });
        if (locked) {
          var result = markKeyedAnswers(answersMap, (state && state.values) || readValues(), q.marks);
          applyColors(result.cellResults);
          lockAll();
          showRecorded(ctrl.noteHost, result.mark, q.marks);
        }
      },
    };
  }

  // ── 3. matchLine ──
  function mountMatchLine(elc, q, qi, opts) {
    if (!q.match || !q.match.left || !q.match.right || !q.match.answer) return mountAsLines(elc, q, qi, opts);
    H.injectStyleOnce('csew-grids-style', GRID_CSS);
    var m = q.match;
    var container = H.el('div', 'csew-grids-matchwrap');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'csew-grids-match-svg');
    container.appendChild(svg);
    var cols = H.el('div', 'csew-grids-match-cols');
    var leftCol = H.el('div', 'csew-grids-match-col');
    var rightCol = H.el('div', 'csew-grids-match-col');
    cols.appendChild(leftCol); cols.appendChild(rightCol);
    container.appendChild(cols);
    elc.appendChild(container);
    marksRightTag(elc, q);

    var leftEls = [], rightEls = [];
    m.left.forEach(function (txt) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'csew-grids-match-item';
      item.textContent = txt;
      leftEls.push(item);
      leftCol.appendChild(item);
    });
    m.right.forEach(function (txt, i) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'csew-grids-match-item';
      item.textContent = txt;
      rightEls[i] = item;
    });
    // Append the right-hand options in a seeded shuffled order so the correct
    // matches are not a straight-across pattern. rightEls stays in ORIGINAL
    // order, so click handling (connections store the original index), line
    // drawing and marking are all unchanged.
    seededPerm(m.right.length, qSeed(q)).forEach(function (origI) { rightCol.appendChild(rightEls[origI]); });

    var connections = {}; // leftIdx -> rightIdx
    var selectedLeft = null;

    function clearSelection() {
      if (selectedLeft != null) leftEls[selectedLeft].classList.remove('csew-grids-selected');
      selectedLeft = null;
    }
    function redrawLines() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var crect = container.getBoundingClientRect();
      if (!crect.width && !crect.height) return; // not laid out yet (e.g. hidden tab)
      Object.keys(connections).forEach(function (li) {
        var ri = connections[li];
        if (ri == null || !leftEls[li] || !rightEls[ri]) return;
        var a = leftEls[li].getBoundingClientRect();
        var b = rightEls[ri].getBoundingClientRect();
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', a.right - crect.left);
        line.setAttribute('y1', a.top + a.height / 2 - crect.top);
        line.setAttribute('x2', b.left - crect.left);
        line.setAttribute('y2', b.top + b.height / 2 - crect.top);
        line.setAttribute('class', 'csew-grids-match-line');
        svg.appendChild(line);
      });
    }
    leftEls.forEach(function (item, li) {
      item.addEventListener('click', function () {
        if (item.disabled) return;
        if (selectedLeft === li) { clearSelection(); return; }
        clearSelection();
        selectedLeft = li;
        item.classList.add('csew-grids-selected');
      });
    });
    rightEls.forEach(function (item, ri) {
      item.addEventListener('click', function () {
        if (item.disabled || selectedLeft == null) return;
        connections[selectedLeft] = ri;
        redrawLines();
        clearSelection();
      });
    });
    root.addEventListener('resize', redrawLines);

    var ctrl = checkButtonRow(elc);

    function lockAll() {
      leftEls.forEach(function (b) { b.disabled = true; });
      rightEls.forEach(function (b) { b.disabled = true; });
      ctrl.checkBtn.disabled = true;
    }
    function applyColors(results) {
      Object.keys(results).forEach(function (li) {
        var ok = results[li];
        markCorrectClass(leftEls[li], ok);
        if (connections[li] != null && rightEls[connections[li]]) markCorrectClass(rightEls[connections[li]], ok);
      });
    }
    function doCheck() {
      if (ctrl.checkBtn.disabled) return;
      var result = markMatchLine(m, connections);
      applyColors(result.results);
      lockAll();
      var mark = Math.min(q.marks, result.mark);
      showRecorded(ctrl.noteHost, mark, q.marks);
      opts.save({ mark: mark, max: q.marks, state: { connections: connections } });
      opts.reveal();
    }
    ctrl.checkBtn.addEventListener('click', doCheck);

    return {
      getState: function () { return { connections: connections }; },
      setState: function (state, locked) {
        if (state && state.connections) {
          Object.keys(state.connections).forEach(function (li) { connections[li] = state.connections[li]; });
          redrawLines();
        }
        if (locked) {
          var result = markMatchLine(m, connections);
          applyColors(result.results);
          lockAll();
          showRecorded(ctrl.noteHost, Math.min(q.marks, result.mark), q.marks);
        }
      },
    };
  }

  // ── cloze shared helpers (inlineCloze + bankCloze) ──
  // q.cloze is either a plain HTML string (transcribed-paper convention,
  // ___1___ tokens) or the original {text, answers} wrapper object ({1}
  // tokens). q.answers is one of three shapes, all resolved to the same
  // {"1": [...]} keyed map downstream: an ORDERED ARRAY (the transcribed
  // bankCloze convention — index 0 = blank "1"), a top-level {"1": [...]}
  // keyed map (authored directly against blank ids), or — via the legacy
  // {text, answers} wrapper — the same keyed map nested under q.cloze.
  function resolveClozeText(q) {
    return typeof q.cloze === 'string' ? q.cloze : ((q.cloze && q.cloze.text) || '');
  }
  function resolveClozeAnswers(q) {
    if (Array.isArray(q.answers)) return clozeAnswersFromArray(q.answers);
    if (q.answers && typeof q.answers === 'object') return q.answers;
    if (q.cloze && q.cloze.answers) return q.cloze.answers;
    return null;
  }
  // Assigns `text` (which may itself be authored HTML — <p>/<strong>/etc,
  // same trust level as q.question) into `host` via one innerHTML set with
  // each blank token turned into a placeholder span, then swaps every
  // placeholder for the real interactive element `makeSlot(blankId)`
  // builds. Returns {blankId: element} in authoring order.
  function renderClozeInto(host, text, makeSlot) {
    host.innerHTML = clozeHtmlWithSlots(text, 'csew-grids-slot-tmp');
    var placeholders = host.querySelectorAll('.csew-grids-slot-tmp');
    var slots = {};
    Array.prototype.forEach.call(placeholders, function (ph) {
      var id = ph.getAttribute('data-blank');
      var real = makeSlot(id);
      ph.parentNode.replaceChild(real, ph);
      slots[id] = real;
    });
    return slots;
  }

  // ── 4. inlineCloze ──
  function mountInlineCloze(elc, q, qi, opts) {
    var clozeText = resolveClozeText(q);
    var answersMap = resolveClozeAnswers(q);
    if (!clozeText || !answersMap) return mountAsLines(elc, q, qi, opts);
    H.injectStyleOnce('csew-grids-style', GRID_CSS);
    var wrap = H.el('div', 'csew-grids-clozetext');
    var inputs = renderClozeInto(wrap, clozeText, function (id) {
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'csew-grids-blank';
      inp.autocomplete = 'off';
      inp.spellcheck = false;
      inp.setAttribute('aria-label', 'Blank ' + id);
      return inp;
    });
    elc.appendChild(wrap);
    marksRightTag(elc, q);
    var ctrl = checkButtonRow(elc);

    function readValues() {
      var v = {};
      Object.keys(inputs).forEach(function (id) { v[id] = inputs[id].value; });
      return v;
    }
    function applyColors(cellResults) {
      Object.keys(inputs).forEach(function (id) { markCorrectClass(inputs[id], !!cellResults[id]); });
    }
    function lockAll() {
      Object.keys(inputs).forEach(function (id) { inputs[id].disabled = true; });
      ctrl.checkBtn.disabled = true;
    }
    function doCheck() {
      if (ctrl.checkBtn.disabled) return;
      var values = readValues();
      var result = markKeyedAnswers(answersMap, values, q.marks);
      applyColors(result.cellResults);
      lockAll();
      showRecorded(ctrl.noteHost, result.mark, q.marks);
      opts.save({ mark: result.mark, max: q.marks, state: { values: values } });
      opts.reveal();
    }
    ctrl.checkBtn.addEventListener('click', doCheck);

    return {
      getState: function () { return { values: readValues() }; },
      setState: function (state, locked) {
        if (state && state.values) Object.keys(inputs).forEach(function (id) { if (state.values[id] != null) inputs[id].value = state.values[id]; });
        if (locked) {
          var result = markKeyedAnswers(answersMap, (state && state.values) || readValues(), q.marks);
          applyColors(result.cellResults);
          lockAll();
          showRecorded(ctrl.noteHost, result.mark, q.marks);
        }
      },
    };
  }

  // ── 5. bankCloze ──
  function mountBankCloze(elc, q, qi, opts) {
    var clozeText = resolveClozeText(q);
    var answersMap = resolveClozeAnswers(q);
    if (!clozeText || !answersMap || !q.bank || !q.bank.length) return mountAsLines(elc, q, qi, opts);
    H.injectStyleOnce('csew-grids-style', GRID_CSS);
    var textWrap = H.el('div', 'csew-grids-clozetext');
    var gaps = renderClozeInto(textWrap, clozeText, function (id) {
      var gap = document.createElement('span');
      gap.className = 'csew-grids-gap';
      gap.dataset.blank = id;
      return gap;
    });
    elc.appendChild(textWrap);

    var bankWrap = H.el('div', 'csew-grids-bank');
    var chips = [];
    // Each chip keeps its ORIGINAL bank index as chipId (grading is by the
    // chip's word, saved state is by chipId), but the chips are appended to
    // the DOM in a seeded shuffled order so the answer words are not simply
    // listed first in the bank.
    q.bank.forEach(function (word, i) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'csew-grids-chip';
      chip.textContent = word;
      chip.draggable = true;
      chip.dataset.word = word;
      chip.dataset.chipId = String(i);
      chips[i] = chip;
    });
    seededPerm(q.bank.length, qSeed(q)).forEach(function (origI) { bankWrap.appendChild(chips[origI]); });
    elc.appendChild(bankWrap);
    marksRightTag(elc, q);

    var placed = {}; // blankId -> chipId
    var armedChip = null;
    function chipById(id) { return chips[Number(id)]; }
    function clearArm() { if (armedChip) armedChip.classList.remove('csew-grids-armed'); armedChip = null; }
    function unplaceBlank(blankId) {
      var chipId = placed[blankId];
      if (chipId == null) return;
      delete placed[blankId];
      gaps[blankId].textContent = '';
      gaps[blankId].classList.remove('csew-grids-filled');
      var chip = chipById(chipId);
      if (chip) { chip.classList.remove('csew-grids-used'); chip.disabled = false; }
    }
    function placeChip(blankId, chip) {
      unplaceBlank(blankId);
      Object.keys(placed).forEach(function (bid) { if (placed[bid] === chip.dataset.chipId) unplaceBlank(bid); });
      placed[blankId] = chip.dataset.chipId;
      gaps[blankId].textContent = chip.dataset.word;
      gaps[blankId].classList.add('csew-grids-filled');
      chip.classList.add('csew-grids-used');
      chip.disabled = true;
    }
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (chip.disabled) return;
        if (armedChip === chip) { clearArm(); return; }
        clearArm();
        armedChip = chip;
        chip.classList.add('csew-grids-armed');
      });
      chip.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', chip.dataset.chipId); });
    });
    Object.keys(gaps).forEach(function (blankId) {
      var gap = gaps[blankId];
      gap.addEventListener('click', function () {
        if (gap.classList.contains('csew-grids-locked')) return;
        if (placed[blankId] != null) { unplaceBlank(blankId); return; }
        if (armedChip) { placeChip(blankId, armedChip); clearArm(); }
      });
      gap.addEventListener('dragover', function (e) { e.preventDefault(); });
      gap.addEventListener('drop', function (e) {
        e.preventDefault();
        if (gap.classList.contains('csew-grids-locked')) return;
        var chip = chipById(e.dataTransfer.getData('text/plain'));
        if (chip && !chip.disabled) placeChip(blankId, chip);
      });
    });

    var ctrl = checkButtonRow(elc);

    function currentValues() {
      var v = {};
      Object.keys(gaps).forEach(function (id) { var cid = placed[id]; v[id] = cid != null ? chipById(cid).dataset.word : ''; });
      return v;
    }
    function applyColors(cellResults) {
      Object.keys(gaps).forEach(function (id) { markCorrectClass(gaps[id], !!cellResults[id]); });
    }
    function lockAll() {
      Object.keys(gaps).forEach(function (id) { gaps[id].classList.add('csew-grids-locked'); });
      chips.forEach(function (c) { c.disabled = true; });
      ctrl.checkBtn.disabled = true;
    }
    function doCheck() {
      if (ctrl.checkBtn.disabled) return;
      var values = currentValues();
      var result = markKeyedAnswers(answersMap, values, q.marks);
      applyColors(result.cellResults);
      lockAll();
      showRecorded(ctrl.noteHost, result.mark, q.marks);
      opts.save({ mark: result.mark, max: q.marks, state: { placed: placed } });
      opts.reveal();
    }
    ctrl.checkBtn.addEventListener('click', doCheck);

    function restorePlaced(savedPlaced) {
      Object.keys(savedPlaced || {}).forEach(function (blankId) {
        var chip = chipById(savedPlaced[blankId]);
        if (chip && gaps[blankId]) placeChip(blankId, chip);
      });
    }

    return {
      getState: function () { return { placed: placed }; },
      setState: function (state, locked) {
        if (state && state.placed) restorePlaced(state.placed);
        if (locked) {
          var result = markKeyedAnswers(answersMap, currentValues(), q.marks);
          applyColors(result.cellResults);
          lockAll();
          showRecorded(ctrl.noteHost, result.mark, q.marks);
        }
      },
    };
  }

  // ── 6. truthTable ──
  // q.truth = { inputs:[...], output:"P", pairRows:bool, rows:[{in:[0,1,...], out:0|1}] }
  function mountTruthTable(elc, q, qi, opts) {
    if (!q.truth || !q.truth.inputs || !q.truth.rows || !q.truth.rows.length) return mountAsLines(elc, q, qi, opts);
    H.injectStyleOnce('csew-grids-style', GRID_CSS);
    var truth = q.truth;
    var table = document.createElement('table');
    table.className = 'csew-grids-table csew-grids-truthtable';
    var htr = document.createElement('tr');
    truth.inputs.forEach(function (h) { htr.appendChild(H.el('th', null, h)); });
    htr.appendChild(H.el('th', null, truth.output || 'Output'));
    table.appendChild(htr);

    var toggles = []; // one per row (single output column)
    truth.rows.forEach(function (row, ri) {
      var tr = document.createElement('tr');
      (row.in || []).forEach(function (v) { tr.appendChild(H.el('td', 'csew-grids-giventd', String(v))); });
      var td = document.createElement('td');
      td.className = 'csew-grids-togglecell';
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'csew-grids-toggle';
      toggle.textContent = '–';
      toggle.dataset.state = '';
      toggle.addEventListener('click', function () {
        var next = toggle.dataset.state === '' ? '0' : (toggle.dataset.state === '0' ? '1' : '');
        toggle.dataset.state = next;
        toggle.textContent = next === '' ? '–' : next;
      });
      toggles[ri] = toggle;
      td.appendChild(toggle);
      tr.appendChild(td);
      table.appendChild(tr);
    });
    elc.appendChild(table);
    marksRightTag(elc, q);
    var ctrl = checkButtonRow(elc);

    function readValues() {
      return toggles.map(function (t) { return t.dataset.state; });
    }
    function applyColors(cellResults) {
      cellResults.forEach(function (ok, ri) { if (toggles[ri]) markCorrectClass(toggles[ri], ok); });
    }
    function lockAll() {
      toggles.forEach(function (t) { t.disabled = true; });
      ctrl.checkBtn.disabled = true;
    }
    function applyValues(values) {
      (values || []).forEach(function (v, ri) {
        if (toggles[ri]) { toggles[ri].dataset.state = v || ''; toggles[ri].textContent = v || '–'; }
      });
    }
    function doCheck() {
      if (ctrl.checkBtn.disabled) return;
      var values = readValues();
      var result = markTruthTable(truth, values);
      applyColors(result.cellResults);
      lockAll();
      var mark = Math.min(q.marks, result.mark);
      showRecorded(ctrl.noteHost, mark, q.marks);
      opts.save({ mark: mark, max: q.marks, state: { values: values } });
      opts.reveal();
    }
    ctrl.checkBtn.addEventListener('click', doCheck);

    return {
      getState: function () { return { values: readValues() }; },
      setState: function (state, locked) {
        if (state && state.values) applyValues(state.values);
        if (locked) {
          var result = markTruthTable(truth, (state && state.values) || readValues());
          applyColors(result.cellResults);
          lockAll();
          showRecorded(ctrl.noteHost, Math.min(q.marks, result.mark), q.marks);
        }
      },
    };
  }

  // ── 7. traceTable ──
  // q.trace = { columns:[...], rows:(string|null)[][] } — rows are the
  // EXPECTED trace (null = blank/unchanged is acceptable). Renders the
  // authored rows plus a couple of extra ungraded "spare" rows, since the
  // papers explicitly say "you may not need to use all the rows".
  var TRACE_SPARE_ROWS = 2;
  function mountTraceTable(elc, q, qi, opts) {
    if (!q.trace || !q.trace.columns || !q.trace.rows || !q.trace.rows.length) return mountAsLines(elc, q, qi, opts);
    H.injectStyleOnce('csew-grids-style', GRID_CSS);
    var trace = q.trace;
    var gradedRows = trace.rows.length;
    var totalRows = gradedRows + TRACE_SPARE_ROWS;
    var table = document.createElement('table');
    table.className = 'csew-grids-table csew-grids-tracetable';
    var htr = document.createElement('tr');
    trace.columns.forEach(function (c) { htr.appendChild(H.el('th', null, c)); });
    table.appendChild(htr);

    var inputs = []; // inputs[rowIdx][colIdx]
    for (var ri = 0; ri < totalRows; ri++) {
      var tr = document.createElement('tr');
      var rowInputs = [];
      trace.columns.forEach(function () {
        var td = document.createElement('td');
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'csew-grids-cellinput';
        inp.autocomplete = 'off';
        inp.spellcheck = false;
        rowInputs.push(inp);
        td.appendChild(inp);
        tr.appendChild(td);
      });
      inputs.push(rowInputs);
      table.appendChild(tr);
    }
    elc.appendChild(table);
    marksRightTag(elc, q);
    var ctrl = checkButtonRow(elc);

    function readValues() {
      return inputs.map(function (rowInputs) { return rowInputs.map(function (inp) { return inp.value; }); });
    }
    function applyColors(rowResults) {
      rowResults.forEach(function (r, ri) {
        r.cellResults.forEach(function (ok, ci) { if (inputs[ri] && inputs[ri][ci]) markCorrectClass(inputs[ri][ci], ok); });
      });
    }
    function lockAll() {
      inputs.forEach(function (rowInputs) { rowInputs.forEach(function (inp) { inp.disabled = true; }); });
      ctrl.checkBtn.disabled = true;
    }
    function applyValues(values) {
      (values || []).forEach(function (rowVals, ri) {
        if (!inputs[ri]) return;
        (rowVals || []).forEach(function (v, ci) { if (inputs[ri][ci]) inputs[ri][ci].value = v || ''; });
      });
    }
    function doCheck() {
      if (ctrl.checkBtn.disabled) return;
      var values = readValues();
      var result = markTraceTable(trace, values);
      applyColors(result.rowResults);
      lockAll();
      var mark = Math.min(q.marks, result.mark);
      showRecorded(ctrl.noteHost, mark, q.marks);
      opts.save({ mark: mark, max: q.marks, state: { values: values } });
      opts.reveal();
    }
    ctrl.checkBtn.addEventListener('click', doCheck);

    return {
      getState: function () { return { values: readValues() }; },
      setState: function (state, locked) {
        if (state && state.values) applyValues(state.values);
        if (locked) {
          var result = markTraceTable(trace, (state && state.values) || readValues());
          applyColors(result.rowResults);
          lockAll();
          showRecorded(ctrl.noteHost, Math.min(q.marks, result.mark), q.marks);
        }
      },
    };
  }

  // ── 8. binaryColumn ──
  function mountBinaryColumn(elc, q, qi, opts) {
    if (!q.binary || !q.binary.a || !q.binary.b || !q.binary.answer) return mountAsLines(elc, q, qi, opts);
    H.injectStyleOnce('csew-grids-style', GRID_CSS);
    var bin = q.binary;
    var width = bin.answer.length;
    var wrap = H.el('div', 'csew-grids-binarywrap');

    function digitRow(label, digits, editable) {
      var row = H.el('div', 'csew-grids-binrow');
      row.appendChild(H.el('span', 'csew-grids-binlabel', label || ''));
      var cellsWrap = H.el('div', 'csew-grids-bincells');
      var cellEls = [];
      for (var i = 0; i < width; i++) {
        if (editable) {
          var inp = document.createElement('input');
          inp.type = 'text';
          inp.maxLength = 1;
          inp.inputMode = 'numeric';
          inp.className = 'csew-grids-digit';
          inp.autocomplete = 'off';
          cellEls.push(inp);
          cellsWrap.appendChild(inp);
        } else {
          cellsWrap.appendChild(H.el('span', 'csew-grids-digit', (digits && digits[i]) || ''));
        }
      }
      row.appendChild(cellsWrap);
      return { row: row, cells: cellEls };
    }

    var aPad = bin.a.padStart(width, ' ').split('');
    var bPad = bin.b.padStart(width, ' ').split('');
    wrap.appendChild(digitRow('', aPad, false).row);
    wrap.appendChild(digitRow('+', bPad, false).row);
    wrap.appendChild(H.el('div', 'csew-grids-binrule'));
    var answerRow = digitRow('', null, true);
    wrap.appendChild(answerRow.row);
    elc.appendChild(wrap);

    var overflowRadios = null;
    if (bin.askOverflow) {
      var ofWrap = H.el('div', 'csew-row csew-grids-overflow');
      ofWrap.appendChild(H.el('span', 'csew-note', 'Overflow?'));
      var yesLbl = document.createElement('label');
      var yesR = document.createElement('input'); yesR.type = 'radio'; yesR.name = 'csewOverflow-' + qi;
      yesLbl.appendChild(yesR); yesLbl.appendChild(document.createTextNode(' Yes'));
      var noLbl = document.createElement('label');
      var noR = document.createElement('input'); noR.type = 'radio'; noR.name = 'csewOverflow-' + qi;
      noLbl.appendChild(noR); noLbl.appendChild(document.createTextNode(' No'));
      ofWrap.appendChild(yesLbl); ofWrap.appendChild(noLbl);
      elc.appendChild(ofWrap);
      overflowRadios = { yes: yesR, no: noR };
    }
    marksRightTag(elc, q);
    var ctrl = checkButtonRow(elc);

    function readDigits() { return answerRow.cells.map(function (c) { return c.value.trim(); }); }
    function readOverflow() {
      if (!overflowRadios) return null;
      if (overflowRadios.yes.checked) return true;
      if (overflowRadios.no.checked) return false;
      return null;
    }
    function applyColors(digitResults) { digitResults.forEach(function (ok, i) { markCorrectClass(answerRow.cells[i], ok); }); }
    function lockAll() {
      answerRow.cells.forEach(function (c) { c.disabled = true; });
      if (overflowRadios) { overflowRadios.yes.disabled = true; overflowRadios.no.disabled = true; }
      ctrl.checkBtn.disabled = true;
    }
    function doCheck() {
      if (ctrl.checkBtn.disabled) return;
      var digits = readDigits();
      var overflow = readOverflow();
      var result = markBinarySum(bin, digits, overflow);
      applyColors(result.digitResults);
      lockAll();
      var mark = Math.min(q.marks, result.mark);
      showRecorded(ctrl.noteHost, mark, q.marks);
      opts.save({ mark: mark, max: q.marks, state: { digits: digits, overflow: overflow } });
      opts.reveal();
    }
    ctrl.checkBtn.addEventListener('click', doCheck);

    return {
      getState: function () { return { digits: readDigits(), overflow: readOverflow() }; },
      setState: function (state, locked) {
        if (state && state.digits) state.digits.forEach(function (d, i) { if (answerRow.cells[i]) answerRow.cells[i].value = d || ''; });
        if (state && overflowRadios && state.overflow != null) { (state.overflow ? overflowRadios.yes : overflowRadios.no).checked = true; }
        if (locked) {
          var digits = (state && state.digits) || readDigits();
          var overflow = state && state.overflow != null ? state.overflow : readOverflow();
          var result = markBinarySum(bin, digits, overflow);
          applyColors(result.digitResults);
          lockAll();
          showRecorded(ctrl.noteHost, Math.min(q.marks, result.mark), q.marks);
        }
      },
    };
  }

  // ══════════════════ registration + Node export guard ══════════════════

  if (hasCore) {
    var CEW = root.CsExamWidgets;
    CEW.register('tickGrid', mountTickGrid);
    CEW.register('tableFill', mountTableFill);
    CEW.register('matchLine', mountMatchLine);
    CEW.register('inlineCloze', mountInlineCloze);
    CEW.register('bankCloze', mountBankCloze);
    CEW.register('truthTable', mountTruthTable);
    CEW.register('traceTable', mountTraceTable);
    CEW.register('binaryColumn', mountBinaryColumn);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      normalizeText: normalizeText,
      cellAccepted: cellAccepted,
      markKeyedAnswers: markKeyedAnswers,
      markTableFill: markTableFill,
      markCloze: markCloze,
      clozeAnswersFromArray: clozeAnswersFromArray,
      clozeHtmlWithSlots: clozeHtmlWithSlots,
      markTickGrid: markTickGrid,
      markMatchLine: markMatchLine,
      markTruthTable: markTruthTable,
      traceCellMatches: traceCellMatches,
      markTraceTable: markTraceTable,
      markBinarySum: markBinarySum,
    };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
