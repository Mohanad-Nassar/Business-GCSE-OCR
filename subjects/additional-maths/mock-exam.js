// ══════════════════════════════════════════════════════════════
// MOCK EXAM RUNNER — subjects/additional-maths/mock-exam.html
//
// Adapted from subjects/computer-science/mock-exam.js (ADM-B B3). Two
// Add-Maths-specific changes vs the CS engine:
//   1. The paper is ASSEMBLED FROM THE BANK at load — assembleFromBank()
//      reads window.QUESTION_BANK (the built bank loaded by this page),
//      takes the source==='exam' questions (verbatim from real 6993 papers,
//      each carrying key.markScheme), groups multi-part questions that share
//      a case study, and packs them into ~100-mark mock papers. No
//      hand-authored MOCK_PAPERS file is needed (though one still wins if
//      present — window.MOCK_PAPERS is only populated when empty).
//   2. renderMathIn() is called after every question/case-study/mark-scheme
//      insertion so KaTeX renders (the self-mark widget renders its own maths).
//
// Renders window.MOCK_PAPERS[id] = { id, title, minutes, totalMarks, sections:[
//   { title, preamble?, questions:[ examQuestion-shaped objects ] } ] }
// (same per-question shape as a topic page's `examQuestions`: num, marks,
// type, format?, caseStudy?/caseId, question, markScheme, modelAnswer,
// options+answer for MCQ, lines/stubs for widget layout hints).
//
// Four views, one #mockRoot:
//   PICKER  → pick a paper: start timed, print blank, or "I did it on
//             paper" (jump straight to marking).
//   EXAM    → sticky timer + progress; every answer widget is mounted
//             live but its own Check/Submit button is hidden (exam
//             conditions — no mark scheme, no self-marking mid-paper).
//   MARKING → buttons reappear, mark schemes become togglable, MCQs are
//             auto- (or self-) graded, a live running total updates as
//             each question is marked.
//   RESULTS → total / section / format breakdown, time used, best score
//             saved to localStorage.
//   PRINT   → a fifth, simpler view: the whole paper laid out for
//             handwriting, then window.print().
//
// State: vidya_mock_state::<paperId> (in-flight attempt, cleared on
// finish) and vidya_mock::<paperId> (best score, kept forever). Both are
// this runner's own keys — unrelated to the topic pages' geo_progress_ /
// gcse_ storage.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── minimal standalone auth guard (tasks-shared.js's toLogin pattern,
  // trimmed to what this self-contained page actually needs: just proof a
  // session exists in localStorage — no Supabase client, no role check) ──
  const SESSION_KEY = 'gcse_session_v1';
  function isAuthed() {
    try {
      const cached = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return !!(cached && cached.access_token);
    } catch (e) { return false; }
  }
  if (!isAuthed()) {
    location.replace('/index.html?redirect=' + encodeURIComponent(location.pathname + location.search));
    return;
  }

  const root = document.getElementById('mockRoot');
  if (!root) return;

  const STATE_PREFIX = 'vidya_mock_state::';
  const BEST_PREFIX = 'vidya_mock::';

  const FORMAT_LABELS = {
    mcq: 'Multiple choice', lines: 'Written response', banded: 'Extended response',
    tableFill: 'Table completion', tickGrid: 'Tick grid', cloze: 'Cloze / fill-in-the-blanks',
    truthTable: 'Truth table', trace: 'Trace table', code: 'Code writing', matchLine: 'Matching',
  };
  function formatLabel(fmt) { return FORMAT_LABELS[fmt] || (fmt.charAt(0).toUpperCase() + fmt.slice(1)); }

  // ── tiny DOM helpers (same shape as cs-lab/exam-widgets.js's .helpers) ──
  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function text(tag, cls, t) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (t != null) n.textContent = t;
    return n;
  }

  function getPapers() { return window.MOCK_PAPERS || {}; }

  function safeParse(json, fallback) {
    try { const v = JSON.parse(json); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function loadState(paperId) { return safeParse(localStorage.getItem(STATE_PREFIX + paperId), null); }
  function saveState(paperId, state) { try { localStorage.setItem(STATE_PREFIX + paperId, JSON.stringify(state)); } catch (e) {} }
  function clearState(paperId) { try { localStorage.removeItem(STATE_PREFIX + paperId); } catch (e) {} }
  function loadBest(paperId) { return safeParse(localStorage.getItem(BEST_PREFIX + paperId), null); }
  function saveBest(paperId, results) {
    const prev = loadBest(paperId);
    const improved = !prev || results.total > prev.total;
    if (improved) {
      try { localStorage.setItem(BEST_PREFIX + paperId, JSON.stringify({ total: results.total, max: results.max, date: Date.now() })); } catch (e) {}
    }
    return improved;
  }

  function formatClock(totalSeconds) {
    const s = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }

  // ══════════════════════════════════════
  //  ONE ATTEMPT "IN FLIGHT" AT A TIME
  // ══════════════════════════════════════
  let run = null;
  function resetRun() {
    if (run && run.timerId) clearInterval(run.timerId);
    if (run && run.autosaveId) clearInterval(run.autosaveId);
    run = {
      paperId: null, paper: null,
      origin: null,          // 'timed' | 'paper'
      phase: null,           // 'exam' | 'marking' | 'results'
      container: null,
      flat: [],              // flattened questions: [{gi, sectionIndex, section, q}]
      handles: {},           // gi -> widget handle ({getState,setState}) for non-mcq
      mcqSel: {},            // gi -> chosen option index (ungraded while phase==='exam')
      markResults: {},       // gi -> {mark, max}
      widgetState: {},       // gi -> the richest known state for that question (see persistState)
      startedAt: null,       // epoch ms — wall-clock, so leaving the page never pauses the clock
      finishedAt: null,
      timerId: null,
      autosaveId: null,
    };
    return run;
  }
  resetRun();

  // Several questions can share one extract. Mirrors script.js's
  // _epResolveCase, but checks paper.caseStudies AND a bare global
  // EXAM_CASE_STUDIES (defensive: the mock-paper files are being written
  // independently and either convention is plausible) before falling back
  // to the question's own inline caseStudy text.
  function resolveCase(paper, q) {
    if (!q.caseId) return q.caseStudy || '';
    if (paper.caseStudies && paper.caseStudies[q.caseId] != null) return paper.caseStudies[q.caseId];
    if (window.EXAM_CASE_STUDIES && window.EXAM_CASE_STUDIES[q.caseId] != null) return window.EXAM_CASE_STUDIES[q.caseId];
    return q.caseStudy || '';
  }

  function flattenPaper(paper) {
    const flat = [];
    let gi = 0;
    (paper.sections || []).forEach((section, si) => {
      (section.questions || []).forEach((q) => {
        flat.push({ gi: gi++, sectionIndex: si, section, q });
      });
    });
    return flat;
  }

  // Generic "has this been touched" heuristic across unknown widget state
  // shapes (exam-widgets-grids.js / -code.js are still stubs as of this
  // build — tomorrow's tickGrid/cloze/code state objects are unknowable
  // today, so this just asks "is there any non-empty leaf value anywhere").
  function stateLooksAnswered(state) {
    if (state == null) return false;
    if (typeof state === 'string') return state.trim().length > 0;
    if (typeof state === 'boolean') return state;
    if (typeof state === 'number') return state !== 0;
    if (Array.isArray(state)) return state.some(stateLooksAnswered);
    if (typeof state === 'object') return Object.values(state).some(stateLooksAnswered);
    return false;
  }

  // ══════════════════════════════════════
  //  PICKER
  // ══════════════════════════════════════
  function renderPicker() {
    resetRun();
    root.innerHTML = '';
    const wrap = el('div', 'mx-wrap');
    wrap.appendChild(text('h2', 'section-title', 'Choose a paper'));
    wrap.appendChild(text('p', 'section-sub', 'Sit a full paper under timed conditions, or print it to handwrite and mark later.'));

    const papers = getPapers();
    const ids = Object.keys(papers);
    if (!ids.length) {
      wrap.appendChild(text('div', 'mx-empty', '📄 No mock papers are loaded yet — check back soon.'));
      root.appendChild(wrap);
      return;
    }

    const grid = el('div', 'mx-picker-grid');
    ids.forEach(id => grid.appendChild(buildPaperCard(id, papers[id])));
    wrap.appendChild(grid);
    root.appendChild(wrap);
  }

  function buildPaperCard(id, paper) {
    const card = el('div', 'mx-paper-card');
    card.appendChild(text('div', 'mx-pc-title', paper.title || id));

    const meta = el('div', 'mx-pc-meta');
    meta.appendChild(text('span', null, '⏱ ' + paper.minutes + ' min'));
    meta.appendChild(text('span', null, '✏️ ' + paper.totalMarks + ' marks'));
    const qCount = (paper.sections || []).reduce((n, s) => n + (s.questions || []).length, 0);
    meta.appendChild(text('span', null, qCount + ' question' + (qCount === 1 ? '' : 's')));
    card.appendChild(meta);

    const best = loadBest(id);
    if (best) card.appendChild(text('div', 'mx-pc-best', '🏆 Best: ' + best.total + ' / ' + best.max));

    const saved = loadState(id);
    const inProgress = !!(saved && saved.phase && saved.phase !== 'results');
    if (inProgress) {
      card.appendChild(text('div', 'mx-pc-progress', '⏳ In progress — ' + (saved.phase === 'exam' ? 'sitting the paper' : 'marking')));
    }

    const actions = el('div', 'mx-pc-actions');
    const startBtn = text('button', 'mx-btn primary wide', inProgress ? 'Resume mock' : 'Start timed mock');
    startBtn.type = 'button';
    startBtn.addEventListener('click', () => startTimedMock(id));
    actions.appendChild(startBtn);

    const printBtn = text('button', 'mx-btn wide', 'Print blank paper');
    printBtn.type = 'button';
    printBtn.addEventListener('click', () => renderPrintView(id));
    actions.appendChild(printBtn);

    const paperBtn = text('button', 'mx-link-btn', 'or, I did it on paper — mark it now →');
    paperBtn.type = 'button';
    paperBtn.addEventListener('click', () => startPaperMarking(id));
    actions.appendChild(paperBtn);

    if (inProgress) {
      const discard = text('button', 'mx-link-btn', 'Discard this attempt & start over');
      discard.type = 'button';
      discard.addEventListener('click', () => { clearState(id); renderPicker(); });
      actions.appendChild(discard);
    }

    card.appendChild(actions);
    return card;
  }

  // Proportional pacing hint for multi-section papers (Paper 2's Section
  // A/B split etc.) — derived from each section's mark total rather than
  // hard-coded, so it stays correct however many sections a paper has.
  function advisoryHint(paper) {
    if (!paper.sections || paper.sections.length < 2) return '';
    const totalMarks = paper.sections.reduce((s, sec) => s + (sec.questions || []).reduce((m, q) => m + (q.marks || 0), 0), 0) || paper.totalMarks || 1;
    const parts = paper.sections.map(sec => {
      const marks = (sec.questions || []).reduce((m, q) => m + (q.marks || 0), 0);
      const mins = Math.round(paper.minutes * marks / totalMarks);
      return (sec.title || 'Section') + ' ~' + mins + ' min';
    });
    return 'Suggested pacing: ' + parts.join(' / ');
  }

  // ══════════════════════════════════════
  //  EXAM + MARKING (same view, two phases)
  // ══════════════════════════════════════
  function startTimedMock(id) {
    const paper = getPapers()[id];
    if (!paper) return;
    resetRun();
    run.paperId = id; run.paper = paper; run.origin = 'timed';
    run.flat = flattenPaper(paper);

    const saved = loadState(id);
    let widgetState = {};
    if (saved && (saved.phase === 'exam' || saved.phase === 'marking') && saved.startedAt) {
      run.startedAt = saved.startedAt;
      run.finishedAt = saved.finishedAt || null;
      run.mcqSel = saved.mcqSel || {};
      run.markResults = saved.markResults || {};
      widgetState = saved.widgetState || {};
    } else {
      run.startedAt = Date.now();
    }
    const resumeMarking = !!(saved && saved.phase === 'marking');
    run.phase = 'exam';
    renderExamView(widgetState, { live: !resumeMarking, resumeMarking });
    startAutosave();
  }

  // "I did it on paper": no timer ever ran, so nothing to suppress — mount
  // straight into marking phase with empty state. MCQs can't be auto-graded
  // (nothing was recorded), so buildMcqAnswer's marking-phase click handler
  // lets the student tick which option they circled on paper instead.
  function startPaperMarking(id) {
    const paper = getPapers()[id];
    if (!paper) return;
    resetRun();
    run.paperId = id; run.paper = paper; run.origin = 'paper';
    run.flat = flattenPaper(paper);
    run.startedAt = null; run.finishedAt = null;
    run.phase = 'exam'; // flipped to 'marking' by the resumeMarking call below
    renderExamView({}, { live: false, resumeMarking: true });
    startAutosave();
  }

  function renderExamView(widgetStateMap, opts) {
    opts = opts || {};
    root.innerHTML = '';
    const container = el('div', 'mx-wrap' + (opts.live ? ' mock-exam-live' : ''));
    run.container = container;

    if (opts.live) container.appendChild(buildTopbar());

    const sectionsWrap = el('div');
    let curSectionIndex = -1, curListEl = null;
    run.flat.forEach(entry => {
      if (entry.sectionIndex !== curSectionIndex) {
        curSectionIndex = entry.sectionIndex;
        const sec = entry.section;
        const secWrap = el('div', 'mx-section');
        secWrap.appendChild(text('div', 'mx-section-head', sec.title || ('Section ' + (curSectionIndex + 1))));
        if (sec.preamble) secWrap.appendChild(el('div', 'mx-preamble', String(sec.preamble).replace(/\n/g, '<br>')));
        curListEl = el('div', 'mx-qlist');
        secWrap.appendChild(curListEl);
        sectionsWrap.appendChild(secWrap);
      }
      curListEl.appendChild(buildQuestionCard(entry, widgetStateMap[entry.gi]));
    });
    container.appendChild(sectionsWrap);
    root.appendChild(container);

    if (opts.live) startTimerTicking();
    if (opts.resumeMarking) enterMarkingPhase({ restoring: true });
  }

  function buildTopbar() {
    const bar = el('div', 'mx-topbar');
    bar.id = 'mxTopbar';
    bar.appendChild(text('div', 'mx-tb-title', run.paper.title || run.paperId));
    const timerEl = text('div', 'mx-timer', '');
    timerEl.id = 'mxTimer';
    bar.appendChild(timerEl);
    const progressEl = text('div', 'mx-tb-progress', '');
    progressEl.id = 'mxTbProgress';
    bar.appendChild(progressEl);
    const finishBtn = text('button', 'mx-finish-btn', 'Finish now');
    finishBtn.type = 'button';
    finishBtn.addEventListener('click', () => {
      if (confirm('Finish the mock now? You can still self-mark every question afterwards.')) enterMarkingPhase();
    });
    bar.appendChild(finishBtn);
    const advisory = advisoryHint(run.paper);
    if (advisory) bar.appendChild(text('div', 'mx-tb-advisory', advisory));
    return bar;
  }

  function buildQuestionCard(entry, savedWidgetState) {
    const { gi, q } = entry;
    const card = el('div', 'ep-card');
    card.dataset.gi = String(gi);
    const caseText = resolveCase(run.paper, q);
    const caseHtml = caseText ? '<div class="ep-case">' + caseText.replace(/>\s*\n\s*</g, '><').replace(/\n/g, '<br>') + '</div>' : '';
    const isMcq = q.type === 'mcq';
    const usesWidget = !isMcq && window.CsExamWidgets && window.CsExamWidgets.supports && window.CsExamWidgets.supports(q.format || 'lines');

    card.innerHTML = `<div class="ep-header">
<div><div class="ep-num">${q.num || ('Q' + (gi + 1))}</div><div class="ep-title">${q.marks} mark${q.marks > 1 ? 's' : ''}</div></div>
<div class="ep-marks">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</div>
</div>
<div class="ep-body">
${caseHtml}
<div class="ep-question">${(q.question || '').replace(/\n/g, '<br>')}</div>
<div class="ep-answer-slot"></div>
<div class="ep-btn-row"></div>
<div class="ep-popup marks-pop" id="mxMarks-${gi}">
${q.markScheme || ''}
${q.modelAnswer ? '<div class="marks-section"><h5>✓ Model Answer</h5><div class="model-answer">' + q.modelAnswer.replace(/\n/g, '<br>') + '</div></div>' : ''}
</div>
</div>`;

    const answerSlot = card.querySelector('.ep-answer-slot');
    const btnRow = card.querySelector('.ep-btn-row');

    if (isMcq) {
      buildMcqAnswer(answerSlot, entry);
    } else if (usesWidget) {
      answerSlot.className = 'ep-widget';
      answerSlot.id = 'mxWidget-' + gi;
      const handle = window.CsExamWidgets.mount(answerSlot, q, gi, {
        reveal() { showScheme(gi); },
        save(payload) { recordMark(gi, payload.mark, payload.max, payload.state); },
      });
      run.handles[gi] = handle;
      if (savedWidgetState && handle.setState) handle.setState(savedWidgetState, run.markResults[gi] != null);
    } else {
      buildFallbackAnswer(answerSlot, entry, savedWidgetState);
    }

    // "Mark scheme" toggle: the collapsible required once marking starts.
    // Hidden by CSS (.mock-exam-live .mx-scheme-toggle) during the live
    // exam so it can never be used to peek at the scheme mid-paper.
    const schemeBtn = text('button', 'ep-btn mx-scheme-toggle', '📋 Mark scheme');
    schemeBtn.type = 'button';
    schemeBtn.addEventListener('click', () => { const m = document.getElementById('mxMarks-' + gi); if (m) m.classList.toggle('show'); });
    btnRow.appendChild(schemeBtn);

    // Render KaTeX in the question text, case study and (hidden) mark scheme.
    // The self-mark widget renders its own maths; re-rendering is a no-op.
    if (typeof renderMathIn === 'function') renderMathIn(card);

    return card;
  }

  function buildMcqAnswer(answerSlot, entry) {
    const { gi, q } = entry;
    answerSlot.className = 'ep-mcq-opts';
    answerSlot.id = 'mxMcq-' + gi;
    (q.options || []).forEach((opt, oi) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ep-opt';
      b.dataset.oi = String(oi);
      b.innerHTML = '<strong>' + String.fromCharCode(65 + oi) + '.</strong> ' + opt;
      answerSlot.appendChild(b);
    });

    answerSlot.addEventListener('click', (e) => {
      const btn = e.target.closest('.ep-opt');
      if (!btn || answerSlot.dataset.locked) return;
      const oi = +btn.dataset.oi;
      if (run.phase === 'exam') {
        // Exam conditions: record the choice, no feedback yet.
        answerSlot.querySelectorAll('.ep-opt').forEach(o => o.classList.remove('mx-opt-selected'));
        btn.classList.add('mx-opt-selected');
        run.mcqSel[gi] = oi;
        persistState();
      } else if (run.phase === 'marking' && run.origin === 'paper') {
        // Nothing was recorded on paper — the student ticks what they
        // actually circled so it can still be auto-graded.
        run.mcqSel[gi] = oi;
        gradeMcq(gi, entry);
      }
    });

    const preselected = run.mcqSel[gi];
    if (preselected != null) {
      const b = answerSlot.querySelector('.ep-opt[data-oi="' + preselected + '"]');
      if (b) b.classList.add('mx-opt-selected');
    }
    if (run.markResults[gi]) {
      answerSlot.dataset.locked = '1';
      colorMcqOptions(answerSlot, preselected, q.answer);
    }
  }

  function colorMcqOptions(answerSlot, chosen, correctIdx) {
    const opts = answerSlot.querySelectorAll('.ep-opt');
    opts.forEach(o => { o.disabled = true; o.classList.remove('mx-opt-selected'); });
    if (chosen != null && opts[chosen]) opts[chosen].classList.add(chosen === correctIdx ? 'ep-correct' : 'ep-wrong');
    if (chosen !== correctIdx && opts[correctIdx]) opts[correctIdx].classList.add('ep-correct');
  }

  function gradeMcq(gi, entry) {
    const answerSlot = document.getElementById('mxMcq-' + gi);
    if (!answerSlot || answerSlot.dataset.locked === '1') return;
    answerSlot.dataset.locked = '1';
    const chosen = run.mcqSel[gi];
    colorMcqOptions(answerSlot, chosen, entry.q.answer);
    const mark = (chosen === entry.q.answer) ? entry.q.marks : 0;
    recordMark(gi, mark, entry.q.marks, { oi: chosen });
    showScheme(gi);
  }

  function autoGradeAllMcqs() {
    run.flat.forEach(entry => { if (entry.q.type === 'mcq') gradeMcq(entry.gi, entry); });
  }

  // Fallback for question formats exam-widgets-grids.js / -code.js haven't
  // registered yet (both are stubs as of this build) — a plain ruled
  // textarea + the shared examiner self-mark panel, exactly like
  // mountLines() in cs-lab/exam-widgets.js, so an unfamiliar format never
  // crashes the runner. Reuses CsExamWidgets.helpers so its Submit button
  // carries the same 'cslab-btn' class the exam-phase CSS suppresses.
  function buildFallbackAnswer(answerSlot, entry, savedState) {
    const { gi, q } = entry;
    const helpers = window.CsExamWidgets && window.CsExamWidgets.helpers;
    answerSlot.className = 'ep-widget';
    answerSlot.id = 'mxWidget-' + gi;
    const ta = document.createElement('textarea');
    ta.className = 'csew-lines ep-answer-area';
    ta.rows = Math.min(2 * (q.marks || 1), 12);
    ta.spellcheck = false;
    answerSlot.appendChild(ta);
    answerSlot.appendChild(el('div', 'csew-marksright', '[' + q.marks + ']'));
    const submit = helpers ? helpers.btn('📋 Submit & mark my answer') : text('button', 'cslab-btn', '📋 Submit & mark my answer');
    if (!helpers) submit.type = 'button';
    answerSlot.appendChild(submit);

    const answerState = () => ({ text: ta.value });
    submit.addEventListener('click', () => {
      submit.disabled = true;
      ta.disabled = true;
      showScheme(gi);
      if (helpers) helpers.buildSelfMarkPanel(answerSlot, q, { save: (payload) => recordMark(gi, payload.mark, payload.max, payload.state) }, answerState);
    });

    if (savedState && savedState.text != null) ta.value = savedState.text;
    run.handles[gi] = {
      getState: answerState,
      setState(s, locked) {
        if (s && s.text != null) ta.value = s.text;
        if (locked) {
          submit.disabled = true;
          ta.disabled = true;
          showScheme(gi);
          if (helpers) {
            const panel = helpers.buildSelfMarkPanel(answerSlot, q, { save: () => {} }, answerState);
            const recorded = run.markResults[gi];
            panel.restore(s, recorded ? recorded.mark : undefined);
          }
        }
      },
    };
  }

  function showScheme(gi) {
    const m = document.getElementById('mxMarks-' + gi);
    if (m) m.classList.add('show');
  }

  // ── timer ──
  function startTimerTicking() {
    tickTimer();
    run.timerId = setInterval(tickTimer, 1000);
  }
  function stopTimerTicking() {
    if (run.timerId) { clearInterval(run.timerId); run.timerId = null; }
  }
  function tickTimer() {
    const remaining = run.paper.minutes * 60 - (Date.now() - run.startedAt) / 1000;
    const timerEl = document.getElementById('mxTimer');
    if (timerEl) {
      timerEl.textContent = '⏱ ' + formatClock(remaining);
      timerEl.classList.toggle('warn', remaining <= 300 && remaining > 0);
    }
    const progressEl = document.getElementById('mxTbProgress');
    if (progressEl) progressEl.textContent = answeredCount() + ' / ' + run.flat.length + ' answered';
    if (remaining <= 0) { stopTimerTicking(); enterMarkingPhase(); }
  }
  function answeredCount() {
    let n = 0;
    run.flat.forEach(entry => {
      if (entry.q.type === 'mcq') { if (run.mcqSel[entry.gi] != null) n++; return; }
      const h = run.handles[entry.gi];
      if (h && h.getState && stateLooksAnswered(h.getState())) n++;
    });
    return n;
  }

  // ── exam → marking transition ──
  function enterMarkingPhase(opts) {
    opts = opts || {};
    const firstTime = run.phase !== 'marking';
    if (firstTime) {
      stopTimerTicking();
      run.phase = 'marking';
      if (!run.finishedAt) run.finishedAt = Date.now();
      if (run.origin === 'timed') autoGradeAllMcqs();
    }
    if (run.container) run.container.classList.remove('mock-exam-live');
    const topbar = document.getElementById('mxTopbar');
    if (topbar) topbar.remove();

    if (!document.getElementById('mxLiveBar') && run.container) {
      const banner = el('div', 'mx-markbanner', '🖊️ <strong>Marking time</strong> — check each question against the mark scheme below it, then self-mark it (multiple choice grades itself). Your total updates live as you go.');
      const liveBar = el('div', 'mx-livebar');
      liveBar.id = 'mxLiveBar';
      const totalEl = text('strong', null, '');
      totalEl.id = 'mxLiveTotal';
      liveBar.appendChild(totalEl);
      run.container.insertBefore(liveBar, run.container.firstChild);
      run.container.insertBefore(banner, liveBar);
    }

    updateLiveBar();
    persistState();
    maybeFinishMarking();
  }

  function recordMark(gi, mark, max, state) {
    run.markResults[gi] = { mark, max };
    if (state !== undefined) run.widgetState[gi] = state;
    updateLiveBar();
    persistState();
    maybeFinishMarking();
  }

  function updateLiveBar() {
    const totalEl = document.getElementById('mxLiveTotal');
    if (!totalEl) return;
    const totalSoFar = Object.values(run.markResults).reduce((s, r) => s + r.mark, 0);
    const markedCount = Object.keys(run.markResults).length;
    totalEl.textContent = 'Marks so far: ' + totalSoFar + ' / ' + run.paper.totalMarks + ' (' + markedCount + ' / ' + run.flat.length + ' questions marked)';
  }

  function maybeFinishMarking() {
    if (run.flat.length > 0 && Object.keys(run.markResults).length >= run.flat.length) finishMarking();
  }

  function finishMarking() {
    if (run.phase === 'results') return;
    run.phase = 'results';
    if (!run.finishedAt) run.finishedAt = Date.now();
    if (run.autosaveId) { clearInterval(run.autosaveId); run.autosaveId = null; }
    const results = computeResults();
    const improved = saveBest(run.paperId, results);
    clearState(run.paperId); // finished — nothing left to resume
    renderResults(results, improved);
  }

  function computeResults() {
    const paper = run.paper;
    let total = 0;
    const perSection = (paper.sections || []).map(sec => ({ title: sec.title || 'Section', mark: 0, max: 0 }));
    const perFormat = {};
    run.flat.forEach(entry => {
      const r = run.markResults[entry.gi] || { mark: 0, max: entry.q.marks };
      const max = r.max != null ? r.max : entry.q.marks;
      total += r.mark;
      perSection[entry.sectionIndex].mark += r.mark;
      perSection[entry.sectionIndex].max += max;
      const fmt = entry.q.type === 'mcq' ? 'mcq' : (entry.q.format || 'lines');
      if (!perFormat[fmt]) perFormat[fmt] = { mark: 0, max: 0 };
      perFormat[fmt].mark += r.mark;
      perFormat[fmt].max += max;
    });
    const timeUsedSeconds = run.startedAt ? Math.round(((run.finishedAt || Date.now()) - run.startedAt) / 1000) : null;
    return { total, max: paper.totalMarks, perSection, perFormat, timeUsedSeconds };
  }

  // ── persistence: periodic autosave of everything needed to resume ──
  function persistState() {
    if (!run.paperId || run.phase === 'results') return;
    const widgetState = {};
    run.flat.forEach(entry => {
      const gi = entry.gi;
      if (entry.q.type === 'mcq') return; // tracked via mcqSel, not widgetState
      if (run.markResults[gi] && run.widgetState[gi] !== undefined) {
        widgetState[gi] = run.widgetState[gi];
        return;
      }
      const h = run.handles[gi];
      if (h && h.getState) {
        const s = h.getState();
        if (s != null) widgetState[gi] = s;
      }
    });
    saveState(run.paperId, {
      phase: run.phase, origin: run.origin,
      startedAt: run.startedAt, finishedAt: run.finishedAt,
      mcqSel: run.mcqSel, markResults: run.markResults,
      widgetState,
    });
  }
  function onVisibilityPersist() { if (document.hidden) persistState(); }
  function startAutosave() {
    if (run.autosaveId) clearInterval(run.autosaveId);
    run.autosaveId = setInterval(persistState, 8000);
    document.removeEventListener('visibilitychange', onVisibilityPersist);
    document.addEventListener('visibilitychange', onVisibilityPersist);
    window.removeEventListener('beforeunload', persistState);
    window.addEventListener('beforeunload', persistState);
  }

  // ══════════════════════════════════════
  //  RESULTS
  // ══════════════════════════════════════
  function renderResults(results, improved) {
    root.innerHTML = '';
    const wrap = el('div', 'mx-wrap');

    const hero = el('div', 'mx-results-hero');
    hero.appendChild(text('div', null, run.paper.title || run.paperId));
    hero.appendChild(text('div', 'mx-results-score', results.total + ' / ' + results.max));
    const pct = results.max ? Math.round(100 * results.total / results.max) : 0;
    hero.appendChild(text('div', null, pct + '%' + (improved ? ' — 🏆 new best!' : '')));
    if (results.timeUsedSeconds != null) hero.appendChild(text('div', null, 'Time used: ' + formatClock(results.timeUsedSeconds)));
    wrap.appendChild(hero);

    wrap.appendChild(text('h3', 'mx-section-head', 'By section'));
    wrap.appendChild(buildBreakdownTable(results.perSection.map(s => [s.title, s.mark, s.max])));

    wrap.appendChild(text('h3', 'mx-section-head', 'By question type'));
    wrap.appendChild(buildBreakdownTable(Object.keys(results.perFormat).map(fmt => [formatLabel(fmt), results.perFormat[fmt].mark, results.perFormat[fmt].max])));

    const actions = el('div', 'mx-results-actions');
    const backBtn = text('button', 'mx-btn primary', '← Back to papers');
    backBtn.type = 'button';
    backBtn.addEventListener('click', renderPicker);
    actions.appendChild(backBtn);
    wrap.appendChild(actions);

    root.appendChild(wrap);
  }

  function buildBreakdownTable(rows) {
    const table = el('table', 'mx-results-table');
    const headRow = document.createElement('tr');
    headRow.appendChild(document.createElement('th'));
    headRow.appendChild(text('th', null, 'Marks'));
    headRow.appendChild(text('th', null, '%'));
    table.appendChild(headRow);
    rows.forEach(([label, mark, max]) => {
      const tr = document.createElement('tr');
      tr.appendChild(text('td', null, label));
      tr.appendChild(text('td', null, mark + ' / ' + max));
      tr.appendChild(text('td', null, (max ? Math.round(100 * mark / max) : 0) + '%'));
      table.appendChild(tr);
    });
    return table;
  }

  // ══════════════════════════════════════
  //  PRINT (blank paper)
  // ══════════════════════════════════════
  function renderPrintView(id) {
    const paper = getPapers()[id];
    if (!paper) return;
    resetRun();
    root.innerHTML = '';
    const wrap = el('div', 'mx-wrap');

    const controls = el('div', 'no-print');
    const backBtn = text('button', 'mx-btn', '← Back to papers');
    backBtn.type = 'button';
    backBtn.addEventListener('click', renderPicker);
    controls.appendChild(backBtn);
    const printBtn = text('button', 'mx-btn primary', '🖨️ Print / Save as PDF');
    printBtn.type = 'button';
    printBtn.style.marginLeft = '10px';
    printBtn.addEventListener('click', () => window.print());
    controls.appendChild(printBtn);
    const markBtn = text('button', 'mx-link-btn', 'Done printing — mark it now →');
    markBtn.type = 'button';
    markBtn.addEventListener('click', () => startPaperMarking(id));
    controls.appendChild(markBtn);
    wrap.appendChild(controls);

    const sheet = el('div', 'mx-print-sheet active');
    sheet.appendChild(text('h2', null, paper.title || id));
    sheet.appendChild(text('p', null, 'Time: ' + paper.minutes + ' minutes — Total marks: ' + paper.totalMarks));

    (paper.sections || []).forEach((sec, si) => {
      sheet.appendChild(text('h3', null, sec.title || ('Section ' + (si + 1))));
      if (sec.preamble) sheet.appendChild(el('div', null, String(sec.preamble).replace(/\n/g, '<br>')));
      (sec.questions || []).forEach((q, qi) => sheet.appendChild(buildPrintQuestion(paper, q, qi)));
    });

    wrap.appendChild(sheet);
    root.appendChild(wrap);
  }

  function buildPrintQuestion(paper, q, qiInSection) {
    const box = el('div', 'mx-print-q');
    const head = el('div', 'mx-print-qhead');
    head.appendChild(text('span', null, q.num || ('Q' + (qiInSection + 1))));
    head.appendChild(text('span', null, '[' + q.marks + ' mark' + (q.marks > 1 ? 's' : '') + ']'));
    box.appendChild(head);

    const caseText = resolveCase(paper, q);
    if (caseText) box.appendChild(el('div', 'ep-case', caseText.replace(/>\s*\n\s*</g, '><').replace(/\n/g, '<br>')));
    box.appendChild(el('div', 'ep-question', (q.question || '').replace(/\n/g, '<br>')));

    if (q.type === 'mcq') {
      (q.options || []).forEach((opt, oi) => box.appendChild(el('div', 'mx-print-opt', String.fromCharCode(65 + oi) + '. ' + opt)));
    } else if (!/<table/i.test(q.question || '')) {
      // Tables/grids print as empty bordered tables for free — they're
      // already blank cells in the transcribed question HTML, styled by
      // style.css's .ep-question table rules. Everything else gets lines.
      const lineCount = q.lines || Math.max(2, 2 * (q.marks || 1));
      for (let i = 0; i < lineCount; i++) box.appendChild(el('div', 'mx-print-line'));
    }
    if (typeof renderMathIn === 'function') renderMathIn(box);
    return box;
  }

  // ══════════════════════════════════════
  //  ASSEMBLE PAPERS FROM THE BANK
  // ══════════════════════════════════════
  // pageId 'additional-maths:1-3-quadratics-…' → [group, page] = [1, 3] for
  // ordering the paper like the real one (algebra first, calculus late).
  function parseGroupOrder(pageId) {
    var m = /:(\d+)-(\d+)-/.exec(pageId || '');
    return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [99, 99];
  }
  function hashish(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  function assembleFromBank() {
    // A hand-authored MOCK_PAPERS file, if present, always wins.
    if (window.MOCK_PAPERS && Object.keys(window.MOCK_PAPERS).length) return;
    var bank = window.QUESTION_BANK;
    if (!Array.isArray(bank)) return;
    var exam = bank.filter(function (q) { return q.source === 'exam' && q.key && q.key.markScheme; });
    if (!exam.length) return;

    // Group multi-part questions that share one page + case-study stimulus.
    var unitsMap = {}, order = [];
    exam.forEach(function (q) {
      var caseKey = (q.caseStudy && q.caseStudy.trim()) ? ('case:' + hashish(q.caseStudy)) : ('solo:' + q.id);
      var key = q.pageId + '||' + caseKey;
      if (!unitsMap[key]) { unitsMap[key] = { pageId: q.pageId, parts: [], go: parseGroupOrder(q.pageId) }; order.push(key); }
      unitsMap[key].parts.push(q);
    });
    var units = order.map(function (k) { return unitsMap[k]; });
    units.sort(function (a, b) {
      if (a.go[0] !== b.go[0]) return a.go[0] - b.go[0];
      if (a.go[1] !== b.go[1]) return a.go[1] - b.go[1];
      return String(a.parts[0].num || '').localeCompare(String(b.parts[0].num || ''));
    });
    units.forEach(function (u) { u.marks = u.parts.reduce(function (s, q) { return s + (q.marks || 0); }, 0); });

    // Pack whole units into ~100-mark papers (a unit is never split).
    var TARGET = 100, papers = [], cur = [], curMarks = 0;
    units.forEach(function (u) {
      if (curMarks >= TARGET) { papers.push(cur); cur = []; curMarks = 0; }
      cur.push(u); curMarks += u.marks;
    });
    if (cur.length) papers.push(cur);
    // Avoid a tiny stub final paper: fold a small remainder (< 60 marks) into
    // the previous paper so every mock is a substantial ~100-mark sitting.
    if (papers.length > 1) {
      var last = papers[papers.length - 1];
      var lastMarks = last.reduce(function (s, u) { return s + u.marks; }, 0);
      if (lastMarks < 60) { papers[papers.length - 2] = papers[papers.length - 2].concat(last); papers.pop(); }
    }

    var out = {};
    papers.forEach(function (unitList, pi) {
      var qnum = 0, questions = [];
      unitList.forEach(function (u) {
        qnum++;
        u.parts.forEach(function (q, partIdx) {
          var partLabel = u.parts.length > 1 ? (' (' + String.fromCharCode(97 + partIdx) + ')') : '';
          questions.push({
            num: String(qnum) + partLabel,
            marks: q.marks || 0,
            question: q.question,
            caseStudy: partIdx === 0 ? (q.caseStudy || '') : '', // stimulus shown once per unit
            markScheme: q.key.markScheme,
            modelAnswer: q.key.modelAnswer || '',
            // Use the question's real widget format so numeric parts auto-mark
            // and mathParts render multi-part; plain exam Qs (no format) → 'lines'
            // (the tick-the-scheme self-mark panel). Carry the answer keys the
            // numeric/mathParts widgets need.
            format: q.format || 'lines',
            numeric: (q.key && q.key.numeric) || undefined,
            parts: q.parts || undefined,
          });
        });
      });
      var totalMarks = questions.reduce(function (s, q) { return s + q.marks; }, 0);
      var id = 'adm-mock-' + (pi + 1);
      out[id] = {
        id: id,
        title: 'Additional Mathematics — Mock Paper ' + (pi + 1),
        minutes: 120,
        totalMarks: totalMarks,
        sections: [{ title: 'Answer all the questions. Calculators are allowed.', questions: questions }],
      };
    });
    window.MOCK_PAPERS = out;
  }

  // ══════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════
  assembleFromBank();
  renderPicker();
})();
