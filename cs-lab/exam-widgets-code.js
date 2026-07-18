// ══════════════════════════════════════════════════════════════
// CS EXAM WIDGETS — code formats (CS-CONTENT-PLAN.md §6, Appendix C)
//
// Registers the three Paper 2 "write/complete code" exam-question formats
// with CsExamWidgets (cs-lab/exam-widgets.js — read its header first, this
// module is a sibling that plugs into the same registry/opts contract):
//
//   codeWrite    — "Write an algorithm…" answered in ERL OR a high-level
//                  language (the real paper offers the choice). Python
//                  answers get a "Test my code" runner; ERL can't be run,
//                  same as on paper. Self-marked (prose-style — no scheme
//                  can enumerate every logically-equivalent program).
//   codeGaps     — a printed code listing with numbered gaps the student
//                  fills inline (q.gaps.lines / q.gaps.answers). Auto-marked
//                  against accept-lists; falls back to a plain codeWrite-
//                  style mono textarea + self-mark when q.gaps is absent so
//                  a question can ship before its gap data is authored.
//   codeFunction — a given function header/footer with the body typed in
//                  between (q.func.header/footer); optional Python test
//                  when q.func.testable. Self-marked.
//
// ── A note on the answer textarea's ep-answer-area class ──
// CS-CONTENT-PLAN.md §5 (Standing owner instruction block) is explicit:
// "The CS-B codeWrite exam textarea MUST keep ep-answer-area (paste-guard)."
// That matches the site-wide integrity system (notifications-shared.js's
// PASTE GUARD, `textarea.ep-answer-area, textarea.answer-box`): every other
// exam-style answer box on the site blocks paste so a Googled/AI/Practice-Lab
// answer can't be dropped in wholesale, and every blocked attempt is logged
// for teachers. A code answer is still an exam answer under those rules, so
// codeWrite's and codeFunction's answer textareas keep ep-answer-area here.
// (codeGaps' inline gap inputs are plain <input> elements, which the guard's
// textarea-only selector never touched anyway — nothing to decide there.)
//
// ── Pyodide "Test my code" runner ──
// One Web Worker (cs-lab/pyworker.js) is created lazily, on the page's FIRST
// Test click, and kept warm for every codeWrite/codeFunction widget on the
// page after that (exam widgets have no unmount hook to tear one down per-
// question, and spinning up Pyodide — a multi-MB CDN fetch — per question
// would be slow and wasteful). Runs are serialised through one queue so two
// Test buttons clicked in quick succession never race over the worker's
// onmessage handler. Batch mode only (interactive:false + a pre-supplied
// `inputs` array) — exam "Test it" is a quick sanity check, not the full
// live-console Practice Lab, so the SharedArrayBuffer/COOP+COEP interactive
// path isn't needed. A run gets 10s (vs the Lab's 15s: this is meant to be
// a quick check, not a full workout) before the worker is terminated — the
// only way to stop a genuinely runaway loop — and the next Test spins up a
// fresh one.
//
// Pure (DOM-free) gap-marking logic lives at the top and is exported via
// module.exports for node unit testing when not in a browser — same split
// py-runner.js uses.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  var TEST_TIMEOUT_MS = 10000;
  var EQUIV_NOTE = '⚖️ The mark scheme allows ANY logically equivalent code — mark the logic, not the exact wording.';

  // ── pure gap-marking helpers (no DOM) ──────────────────────────────
  function normalizeGapAnswer(v) { return (v == null ? '' : String(v)).trim().toLowerCase(); }

  // Case-insensitive, whitespace-trimmed match against an accept-list. An
  // empty student answer never matches, even if "" were (wrongly) in the
  // accept-list — an unattempted gap must never auto-credit.
  function gapIsCorrect(accepted, val) {
    var norm = normalizeGapAnswer(val);
    if (!norm) return false;
    return (accepted || []).some(function (a) { return normalizeGapAnswer(a) === norm; });
  }

  // Splits one q.gaps.lines[] string into an ordered token stream of plain
  // text and {id} gap markers — e.g. "if theTeam[{2}] == {3} then" ->
  // [text, gap 2, text, gap 3, text]. Used to both render the line (DOM)
  // and unit-test the placeholder extraction (no DOM).
  var GAP_TOKEN_RE = /\{(\d+)\}/g;
  function parseGapLine(lineText) {
    var tokens = [], last = 0, m;
    GAP_TOKEN_RE.lastIndex = 0;
    while ((m = GAP_TOKEN_RE.exec(lineText))) {
      if (m.index > last) tokens.push({ type: 'text', value: lineText.slice(last, m.index) });
      tokens.push({ type: 'gap', id: m[1] });
      last = GAP_TOKEN_RE.lastIndex;
    }
    if (last < lineText.length) tokens.push({ type: 'text', value: lineText.slice(last) });
    return tokens;
  }

  // ── everything below needs a browser (Worker, DOM, the CsExamWidgets registry) ──
  if (typeof window !== 'undefined') {
    if (!window.CsExamWidgets) {
      console.error('[cs-exam-widgets-code] exam-widgets.js must load first');
    } else if (!window.CsExamWidgets.supports('codeWrite')) { // never double-register
      registerCodeWidgets(window.CsExamWidgets);
    }
  }

  function registerCodeWidgets(registry) {
    var helpers = registry.helpers;
    var el = helpers.el, btn = helpers.btn, injectStyleOnce = helpers.injectStyleOnce;

    // ── shared Pyodide worker (one per page, reused, batch mode) ──────
    var pyWorker = null;
    var pyReadyPromise = null;
    var pyRunChain = Promise.resolve(); // serialises runs across every widget instance

    function terminatePyWorker() {
      if (pyWorker) { try { pyWorker.terminate(); } catch (e) {} }
      pyWorker = null;
      pyReadyPromise = null;
    }

    function ensurePyWorker(onProgress) {
      if (pyReadyPromise) return pyReadyPromise;
      pyWorker = new Worker('/cs-lab/pyworker.js');
      pyReadyPromise = new Promise(function (resolve, reject) {
        pyWorker.onmessage = function (ev) {
          var msg = ev.data;
          if (!msg) return;
          if (msg.type === 'progress') { if (onProgress) onProgress(msg.text); }
          else if (msg.type === 'ready') resolve();
          // Clear pyWorker/pyReadyPromise before rejecting (not after) — otherwise
          // this rejected promise would stay cached and every future Test click
          // would fail instantly without ever retrying the Pyodide/CDN load.
          else if (msg.type === 'load-error') { terminatePyWorker(); reject(new Error(msg.message)); }
        };
        pyWorker.onerror = function (e) {
          var message = (e && e.message) || 'The Python worker failed to start.';
          terminatePyWorker();
          reject(new Error(message));
        };
      });
      pyReadyPromise.catch(function () {}); // don't leave an unhandled rejection sitting around
      return pyReadyPromise;
    }

    // Runs `code` in batch mode with `inputLines` fed to input() in order.
    // Resolves { stdout, stderr, timedOut } — never rejects (load/start
    // failures are folded into stderr so callers only need one branch).
    function runPythonBatch(code, inputLines, onProgress) {
      var result = pyRunChain.then(function () { return runOne(code, inputLines, onProgress); });
      pyRunChain = result.catch(function () {}); // one bad run must not jam the queue
      return result;
    }

    function runOne(code, inputLines, onProgress) {
      return ensurePyWorker(onProgress).then(function () {
        return new Promise(function (resolve) {
          var stdout = '', stderr = '', settled = false;
          var timer = setTimeout(function () {
            if (settled) return;
            settled = true;
            terminatePyWorker();
            resolve({ stdout: stdout, stderr: stderr, timedOut: true });
          }, TEST_TIMEOUT_MS);
          pyWorker.onmessage = function (ev) {
            var msg = ev.data;
            if (!msg || settled) return;
            if (msg.type === 'stdout') stdout += msg.text;
            else if (msg.type === 'stderr') stderr += msg.text;
            else if (msg.type === 'done') { settled = true; clearTimeout(timer); resolve({ stdout: stdout, stderr: stderr, timedOut: false }); }
            else if (msg.type === 'error') { settled = true; clearTimeout(timer); resolve({ stdout: stdout, stderr: stderr + (stderr ? '\n' : '') + msg.message, timedOut: false }); }
            else if (msg.type === 'load-error') { settled = true; clearTimeout(timer); resolve({ stdout: stdout, stderr: '⚠️ Could not load Python: ' + msg.message, timedOut: false }); }
          };
          pyWorker.postMessage({ type: 'run', code: code || '', files: {}, folders: [], interactive: false, inputs: inputLines || [] });
        });
      }, function (err) {
        return { stdout: '', stderr: '⚠️ Could not start Python: ' + ((err && err.message) || err), timedOut: false };
      });
    }

    // ── shared "▶ Test my code" block (codeWrite Python mode + codeFunction testable) ──
    // getCode() is called fresh on every click so callers can assemble the
    // code lazily (codeFunction prepends its header at run time).
    function buildPythonTestUI(container, getCode) {
      var wrap = el('div', 'csew-code-test');
      var testBtn = btn('▶ Test my code', 'csew-code-testbtn');
      wrap.appendChild(testBtn);
      wrap.appendChild(el('div', 'csew-code-inputslabel', 'Inputs (one per line, used in order for any input() calls):'));
      var inputsTa = document.createElement('textarea');
      inputsTa.className = 'csew-code-inputs';
      inputsTa.rows = 2;
      inputsTa.spellcheck = false;
      inputsTa.placeholder = 'e.g.\n5\nY';
      wrap.appendChild(inputsTa);
      var status = el('div', 'csew-code-teststatus', '');
      wrap.appendChild(status);
      var outPre = document.createElement('pre');
      outPre.className = 'csew-code-output';
      outPre.hidden = true;
      wrap.appendChild(outPre);
      container.appendChild(wrap);

      var running = false;
      testBtn.addEventListener('click', function () {
        if (running) return;
        running = true;
        testBtn.disabled = true;
        outPre.hidden = true;
        status.textContent = '⏳ Running…';
        var inputLines = inputsTa.value.split(/\r\n|\r|\n/).filter(function (l, i, arr) { return !(l === '' && i === arr.length - 1); });
        runPythonBatch(getCode(), inputLines, function (progressText) { status.textContent = '⏳ ' + progressText; })
          .then(function (result) {
            running = false;
            testBtn.disabled = false;
            outPre.hidden = false;
            var text = result.stdout || '';
            if (result.stderr) text += (text ? '\n' : '') + result.stderr;
            if (result.timedOut) text += (text ? '\n' : '') + '⏱️ Stopped after 10 seconds (an infinite loop?).';
            outPre.textContent = text || '(no output)';
            status.textContent = result.timedOut ? '⏱️ Timed out.' : '✅ Ran.';
          });
      });

      return {
        root: wrap,
        getInputs: function () { return inputsTa.value; },
        setInputs: function (v) { inputsTa.value = v || ''; },
        lock: function () { testBtn.disabled = true; inputsTa.disabled = true; },
      };
    }

    // ── shared submit -> reveal -> self-mark-panel flow ──
    // codeWrite, codeFunction, and codeGaps' no-data fallback all end the
    // same way: disable the answer box(es), reveal the mark scheme, remind
    // the student the scheme accepts any logically-equivalent code, then
    // hand off to buildSelfMarkPanel. Restoring a locked widget needs the
    // same "rebuild panel, restore ticks, re-lock" dance mountLines uses in
    // exam-widgets.js — duplicated here (not exported via .helpers) rather
    // than editing that file, which is out of scope for this module.
    function lockPanelSafe(container, mark, max) {
      var panel = container.querySelector('.csew-selfmark');
      if (!panel || panel.querySelector('.csew-awarded')) return;
      helpers.lockPanel(panel, mark, max);
    }

    function attachSelfMarkFlow(container, q, opts, getAnswerState, lockExtra) {
      function showPanel() {
        if (lockExtra) lockExtra();
        opts.reveal();
        container.appendChild(el('p', 'csew-note csew-code-equivnote', EQUIV_NOTE));
        return helpers.buildSelfMarkPanel(container, q, opts, getAnswerState);
      }
      return {
        submit: function () { showPanel(); },
        restore: function (state) {
          var panelHandle = showPanel();
          panelHandle.restore(state, state && state._mark != null ? state._mark : undefined);
          var ticked = state && state._ticks ? state._ticks.filter(Boolean).length : null;
          if (ticked != null) lockPanelSafe(container, Math.min(q.marks, ticked), q.marks);
        },
      };
    }

    // ── core styles ──
    injectStyleOnce('csew-code-style', [
      '.csew-code-toggle { display: flex; gap: 8px; margin-bottom: 8px; }',
      '.csew-code-lang-active { background: var(--accent); color: #fff; border-color: var(--accent); }',
      '.csew-code-area { font-family: "DM Mono", Consolas, "Liberation Mono", Menlo, monospace; font-size: 13.5px; tab-size: 4; }',
      '.csew-code-langnote { margin: 6px 0; }',
      '.csew-code-test { margin-top: 10px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--cream); }',
      '.csew-code-inputslabel { font-size: 12.5px; color: var(--mid); margin: 8px 0 4px; }',
      '.csew-code-inputs { width: 100%; box-sizing: border-box; font-family: "DM Mono", monospace; font-size: 13px;',
      '  padding: 6px 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--card-bg); color: var(--ink); resize: vertical; }',
      '.csew-code-teststatus { font-size: 12.5px; color: var(--mid); margin-top: 6px; min-height: 1.2em; }',
      '.csew-code-output { white-space: pre-wrap; word-break: break-word; font-family: "DM Mono", monospace; font-size: 12.5px;',
      '  background: var(--card-bg); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; max-height: 200px; overflow: auto; color: var(--ink); margin: 6px 0 0; }',
      '.csew-code-header, .csew-code-footer { font-family: "DM Mono", monospace; font-size: 13.5px; white-space: pre-wrap;',
      '  background: color-mix(in srgb, var(--mid) 12%, var(--card-bg)); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; margin: 0; }',
      '.csew-code-header { border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom: none; }',
      '.csew-code-footer { border-top-left-radius: 0; border-top-right-radius: 0; margin-top: -1px; }',
      '.csew-code-body { border-radius: 0; }',
      '.csew-code-gapblock { font-family: "DM Mono", monospace; font-size: 13.5px; line-height: 1.9;',
      '  background: color-mix(in srgb, var(--mid) 8%, var(--card-bg)); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; overflow-x: auto; }',
      '.csew-code-gapline { display: flex; gap: 10px; white-space: pre; }',
      '.csew-code-lineno { color: var(--mid); min-width: 2ch; text-align: right; user-select: none; }',
      '.csew-code-linetext { white-space: pre-wrap; }',
      '.csew-code-gapinput { font-family: "DM Mono", monospace; font-size: 13px; padding: 1px 5px; min-width: 3.5ch;',
      '  border: 1px solid var(--border); border-radius: 4px; background: var(--card-bg); color: var(--ink); }',
      '.csew-code-gap-ok { border-color: var(--success); background: color-mix(in srgb, var(--success) 18%, var(--card-bg)); color: var(--success); }',
      '.csew-code-gap-bad { border-color: var(--wrong); background: color-mix(in srgb, var(--wrong) 18%, var(--card-bg)); color: var(--wrong); }',
      '.csew-code-gapresult { font-weight: 700; margin-top: 8px; }',
      '.csew-code-equivnote { margin-top: 10px; }',
    ].join('\n'));

    // ── 'codeWrite' — ERL/Python choice, mono answer box, Python test runner ──
    function mountCodeWrite(elc, q, qi, opts) {
      var wrap = el('div', 'csew-code');
      elc.appendChild(wrap);

      var toggleRow = el('div', 'csew-code-toggle');
      var erlBtn = btn('ERL', 'csew-code-langbtn');
      var pyBtn = btn('Python', 'csew-code-langbtn');
      toggleRow.appendChild(erlBtn);
      toggleRow.appendChild(pyBtn);
      wrap.appendChild(toggleRow);

      // One shared answer box for either language — the paper gives ONE
      // answer, not two, so switching language never clears what's typed.
      var ta = document.createElement('textarea');
      ta.className = 'csew-lines csew-code-area ep-answer-area';
      var linesTotal = q.lines || Math.min(3 * (q.marks || 4), 20);
      ta.rows = linesTotal;
      ta.style.height = (linesTotal * 22 + 10) + 'px';
      ta.spellcheck = false;
      wrap.appendChild(ta);
      wrap.appendChild(el('div', 'csew-marksright', '[' + q.marks + ']'));

      var langNote = el('p', 'csew-note csew-code-langnote', '');
      wrap.appendChild(langNote);

      var testUI = buildPythonTestUI(wrap, function () { return ta.value; });

      var submit = btn('📋 Submit & mark my answer');
      wrap.appendChild(submit);

      var lang = 'erl';
      var locked = false;
      function applyLang() {
        erlBtn.classList.toggle('csew-code-lang-active', lang === 'erl');
        pyBtn.classList.toggle('csew-code-lang-active', lang === 'python');
        testUI.root.hidden = lang !== 'python';
        langNote.textContent = lang === 'python'
          ? '▶ You can test your Python code below before you submit — a real advantage over paper, where nothing can be run.'
          : "✏️ ERL can't be run here, just like on paper — switch to Python above if you'd like to test your logic first.";
      }
      erlBtn.addEventListener('click', function () { if (locked) return; lang = 'erl'; applyLang(); });
      pyBtn.addEventListener('click', function () { if (locked) return; lang = 'python'; applyLang(); });
      applyLang();

      function answerState() { return { lang: lang, code: ta.value, testInputs: testUI.getInputs() }; }
      function lockAll() {
        locked = true;
        submit.disabled = true;
        ta.disabled = true;
        erlBtn.disabled = true;
        pyBtn.disabled = true;
        testUI.lock();
      }
      var flow = attachSelfMarkFlow(wrap, q, opts, answerState, lockAll);
      submit.addEventListener('click', flow.submit);

      return {
        getState: answerState,
        setState: function (state, isLocked) {
          if (state) {
            lang = state.lang === 'python' ? 'python' : 'erl';
            if (state.code != null) ta.value = state.code;
            if (state.testInputs != null) testUI.setInputs(state.testInputs);
          }
          applyLang();
          if (isLocked) flow.restore(state);
        },
      };
    }

    // ── 'codeGaps' — printed listing with inline typed gaps, auto-marked ──
    function mountCodeGaps(elc, q, qi, opts) {
      var wrap = el('div', 'csew-code');
      elc.appendChild(wrap);

      if (!q.gaps || !q.gaps.lines || !q.gaps.lines.length) {
        return mountCodeGapsFallback(wrap, q, qi, opts);
      }

      var gaps = q.gaps;
      var block = el('div', 'csew-code-gapblock');
      wrap.appendChild(block);

      var inputs = {}; // gap id -> [input, ...] (same id can appear more than once in a listing)
      var order = [];  // gap ids, first-seen order (for state + marks)

      gaps.lines.forEach(function (lineText, li) {
        var rowEl = el('div', 'csew-code-gapline');
        rowEl.appendChild(el('span', 'csew-code-lineno', String(li + 1)));
        var codeSpan = el('span', 'csew-code-linetext');
        rowEl.appendChild(codeSpan);

        parseGapLine(lineText).forEach(function (tok) {
          if (tok.type === 'text') { codeSpan.appendChild(document.createTextNode(tok.value)); return; }
          var gid = tok.id;
          var inp = document.createElement('input');
          inp.type = 'text';
          inp.className = 'csew-code-gapinput';
          inp.autocomplete = 'off';
          inp.setAttribute('autocapitalize', 'off');
          inp.spellcheck = false;
          if (inputs[gid]) inputs[gid].push(inp);
          else { inputs[gid] = [inp]; order.push(gid); }
          codeSpan.appendChild(inp);
        });
        block.appendChild(rowEl);
      });

      wrap.appendChild(el('div', 'csew-marksright', '[' + q.marks + ']'));
      var checkBtn = btn('✅ Check my answers');
      wrap.appendChild(checkBtn);
      var resultNote = el('p', 'csew-code-gapresult', '');
      wrap.appendChild(resultNote);

      function acceptedFor(gid) { return (gaps.answers && gaps.answers[gid]) || []; }
      // Re-derivable from the current input values + q.gaps.answers alone,
      // so restoring a locked widget just re-runs this rather than needing
      // to save per-gap correctness in state.
      function gradeAndPaint() {
        var correctCount = 0;
        order.forEach(function (gid) {
          var els = inputs[gid];
          var ok = els.every(function (i) { return gapIsCorrect(acceptedFor(gid), i.value); }); // every occurrence of a repeated gap must match
          els.forEach(function (i) {
            i.classList.remove('csew-code-gap-ok', 'csew-code-gap-bad');
            i.classList.add(ok ? 'csew-code-gap-ok' : 'csew-code-gap-bad');
          });
          if (ok) correctCount++;
        });
        var mark = Math.min(q.marks, correctCount);
        resultNote.textContent = '✅ ' + correctCount + ' / ' + order.length + ' gap' + (order.length === 1 ? '' : 's') + ' correct — ' + mark + ' / ' + q.marks + ' marks';
        return mark;
      }
      function answerState() {
        var values = {};
        order.forEach(function (gid) { values[gid] = inputs[gid].map(function (i) { return i.value; }); });
        return { values: values };
      }
      function restoreValues(state) {
        if (!state || !state.values) return;
        order.forEach(function (gid) {
          var vs = state.values[gid] || [];
          inputs[gid].forEach(function (i, idx) { i.value = vs[idx] || ''; });
        });
      }
      function lockAll() {
        order.forEach(function (gid) { inputs[gid].forEach(function (i) { i.disabled = true; }); });
        checkBtn.disabled = true;
      }

      checkBtn.addEventListener('click', function () {
        var mark = gradeAndPaint();
        lockAll();
        opts.save({ mark: mark, max: q.marks, state: answerState() });
        opts.reveal();
      });

      return {
        getState: answerState,
        setState: function (state, locked) {
          restoreValues(state);
          if (locked) { gradeAndPaint(); lockAll(); opts.reveal(); }
        },
      };
    }

    // Fallback when a codeGaps question hasn't had its q.gaps data authored
    // yet: same mono textarea + self-mark treatment as codeWrite, minus the
    // language toggle (a gap-fill question has no "which language" choice).
    function mountCodeGapsFallback(wrap, q, qi, opts) {
      var ta = document.createElement('textarea');
      ta.className = 'csew-lines csew-code-area ep-answer-area';
      var linesTotal = q.lines || Math.min(3 * (q.marks || 4), 20);
      ta.rows = linesTotal;
      ta.style.height = (linesTotal * 22 + 10) + 'px';
      ta.spellcheck = false;
      wrap.appendChild(ta);
      wrap.appendChild(el('div', 'csew-marksright', '[' + q.marks + ']'));
      var submit = btn('📋 Submit & mark my answer');
      wrap.appendChild(submit);

      function answerState() { return { code: ta.value }; }
      function lockAll() { submit.disabled = true; ta.disabled = true; }
      var flow = attachSelfMarkFlow(wrap, q, opts, answerState, lockAll);
      submit.addEventListener('click', flow.submit);

      return {
        getState: answerState,
        setState: function (state, locked) {
          if (state && state.code != null) ta.value = state.code;
          if (locked) flow.restore(state);
        },
      };
    }

    // ── 'codeFunction' — fixed header/footer, typed body, optional Python test ──
    function mountCodeFunction(elc, q, qi, opts) {
      var wrap = el('div', 'csew-code');
      elc.appendChild(wrap);
      var func = q.func || {};

      wrap.appendChild(el('pre', 'csew-code-header', func.header || ''));
      var ta = document.createElement('textarea');
      ta.className = 'csew-lines csew-code-area csew-code-body ep-answer-area';
      var linesTotal = q.lines || Math.min(3 * (q.marks || 4), 16);
      ta.rows = linesTotal;
      ta.style.height = (linesTotal * 22 + 10) + 'px';
      ta.spellcheck = false;
      wrap.appendChild(ta);
      wrap.appendChild(el('pre', 'csew-code-footer', func.footer || ''));
      wrap.appendChild(el('div', 'csew-marksright', '[' + q.marks + ']'));

      // Testable questions must author q.func.header as valid Python (e.g.
      // "def move_character(direction, position):") — the ERL footer
      // ("endfunction"/"endprocedure") is Python-invalid and deliberately
      // left OUT of the assembled test run; Python needs no end marker.
      var testUI = func.testable ? buildPythonTestUI(wrap, function () { return (func.header || '') + '\n' + ta.value; }) : null;

      var submit = btn('📋 Submit & mark my answer');
      wrap.appendChild(submit);

      function answerState() {
        var s = { body: ta.value };
        if (testUI) s.testInputs = testUI.getInputs();
        return s;
      }
      function lockAll() {
        submit.disabled = true;
        ta.disabled = true;
        if (testUI) testUI.lock();
      }
      var flow = attachSelfMarkFlow(wrap, q, opts, answerState, lockAll);
      submit.addEventListener('click', flow.submit);

      return {
        getState: answerState,
        setState: function (state, locked) {
          if (state && state.body != null) ta.value = state.body;
          if (testUI && state && state.testInputs != null) testUI.setInputs(state.testInputs);
          if (locked) flow.restore(state);
        },
      };
    }

    registry.register('codeWrite', mountCodeWrite);
    registry.register('codeGaps', mountCodeGaps);
    registry.register('codeFunction', mountCodeFunction);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { normalizeGapAnswer: normalizeGapAnswer, gapIsCorrect: gapIsCorrect, parseGapLine: parseGapLine };
  }
})();
