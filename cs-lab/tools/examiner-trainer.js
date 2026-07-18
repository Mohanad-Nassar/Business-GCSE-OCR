// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Examiner Trainer (CS-CONTENT-PLAN.md §7.1)
// Registers TWO tool ids in one file:
//   'examiner-trainer' — the student marks a fictional answer against a
//                         real mark scheme, then compares against the
//                         "senior examiner" verdict. 8 rounds, one per
//                         topic (CPU purpose, registers, RAM vs ROM,
//                         network topologies, phishing, validation,
//                         cache, dual core).
//   'command-words'    — quick-fire drill on OCR command words: (a) match
//                         the word to what it demands, (b) given a
//                         question stem, pick how many distinct things
//                         the answer needs.
//
// All exam questions, mark schemes and fictional student answers below
// are original — not taken from any real paper or examiner report.
//
// Wrapped as (function (global) { ... })(window) so the pure marking/
// grading helpers can be unit-tested under plain Node via require() —
// CsLab.registerTool calls are skipped when there is no global.CsLab
// (i.e. outside the browser).
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── Pure marking helpers (unit-tested under Node) ────────────────

  // markScheme: [{id, text, marks}], correctAwardIds: string[] (points the
  // senior examiner actually awards), playerTickedIds: string[] (points the
  // player ticked as earned). Score = how many of the award/refuse
  // decisions the player got right, point by point.
  function gradeExaminerRound(markScheme, correctAwardIds, playerTickedIds) {
    const correctSet = new Set(correctAwardIds || []);
    const playerSet = new Set(playerTickedIds || []);
    let correctCount = 0;
    let correctMarks = 0;
    let playerMarks = 0;
    const perPoint = markScheme.map(function (p) {
      const shouldAward = correctSet.has(p.id);
      const playerAwarded = playerSet.has(p.id);
      const matches = shouldAward === playerAwarded;
      if (matches) correctCount += 1;
      if (shouldAward) correctMarks += p.marks;
      if (playerAwarded) playerMarks += p.marks;
      return { id: p.id, shouldAward: shouldAward, playerAwarded: playerAwarded, matches: matches };
    });
    return {
      perPoint: perPoint,
      totalPoints: markScheme.length,
      correctCount: correctCount,
      correctMarks: correctMarks,
      playerMarks: playerMarks,
      allMatched: correctCount === markScheme.length,
    };
  }

  // item: {word, demandId}. True if the player picked the demand type
  // that word actually calls for.
  function gradeWordMatch(item, chosenDemandId) {
    return chosenDemandId === item.demandId;
  }

  // item: {stem, correctOptionIndex}. True if the player picked the
  // option describing the right number/shape of things to write.
  function gradeStemChoice(item, chosenOptionIndex) {
    return chosenOptionIndex === item.correctOptionIndex;
  }

  // ── Content: Examiner Trainer rounds (T-CS-Examiner, original) ───
  // Every studentAnswer below is fictional and deliberately flawed —
  // vague points, repeated points, self-contradiction, missed
  // development, or naming a brand instead of the underlying concept —
  // mirroring the mistakes examiners actually see, not real answers.

  const EXAMINER_ROUNDS = [
    {
      id: 'cpu-purpose',
      topic: 'CPU purpose',
      question: 'Explain the purpose of the CPU in a computer system. [4]',
      maxMarks: 4,
      markScheme: [
        { id: 'p1', text: 'Identifies that the CPU processes/executes instructions — its core purpose', marks: 1 },
        { id: 'p2', text: 'States that the CPU fetches the next instruction from memory', marks: 1 },
        { id: 'p3', text: 'States that the CPU decodes the instruction to work out what it means', marks: 1 },
        { id: 'p4', text: 'States that the CPU executes the instruction, completing the fetch-decode-execute cycle', marks: 1 },
      ],
      studentAnswer: "The CPU is the brain of the computer. It is really important because without it the computer wouldn't work at all. It processes data using the FDE cycle, which fetches, decodes and executes instructions. The CPU today is much faster than the CPU used to be years ago.",
      correctAward: ['p1'],
      commentary: {
        p1: "Awarded — 'it processes data' captures the CPU's core purpose of executing instructions.",
        p2: "Not awarded — fetch is only named as part of 'the FDE cycle', never explained (what is fetched, and from where).",
        p3: 'Not awarded — same problem: decode is named but never explained.',
        p4: "Not awarded — execute is named but never explained; naming a cycle isn't the same as describing what each stage does.",
      },
    },
    {
      id: 'registers',
      topic: 'Registers',
      question: 'Describe the purpose of the Program Counter (PC) and Accumulator (ACC) registers. [4]',
      maxMarks: 4,
      markScheme: [
        { id: 'p1', text: 'States that the PC holds the memory address of the next instruction to be fetched', marks: 1 },
        { id: 'p2', text: 'States that the PC is incremented after each fetch, so the CPU knows where to fetch from next', marks: 1 },
        { id: 'p3', text: 'States that the ACC stores the results of calculations/logic operations carried out by the ALU', marks: 1 },
        { id: 'p4', text: "States that the value in the ACC can be used in further calculations or written back to memory", marks: 1 },
      ],
      studentAnswer: 'The Program Counter counts programs and keeps track of where the CPU is up to. The Accumulator adds things up like a calculator. The Program Counter is a really important register. It stores the address of the next instruction.',
      correctAward: ['p1'],
      commentary: {
        p1: 'Awarded — the final sentence correctly states the PC holds the address of the next instruction.',
        p2: 'Not awarded — incrementing the PC after a fetch is never mentioned.',
        p3: "Not awarded — 'adds things up like a calculator' is too vague; it never says the accumulator stores the RESULT of an ALU operation.",
        p4: "Not awarded — nothing is said about reusing or storing the ACC's value.",
      },
    },
    {
      id: 'ram-vs-rom',
      topic: 'RAM vs ROM',
      question: 'Explain one difference between RAM and ROM. [2]',
      maxMarks: 2,
      markScheme: [
        { id: 'p1', text: 'States that RAM is volatile (loses its contents when the power is off) whereas ROM is non-volatile (keeps its contents)', marks: 1 },
        { id: 'p2', text: 'States that RAM can be read from and written to, whereas ROM is normally read-only (or can only be written to during manufacture)', marks: 1 },
      ],
      studentAnswer: "RAM is volatile so it loses its data when the power is off, but ROM doesn't lose its data because ROM is not volatile, so it keeps its data because it is non-volatile.",
      correctAward: ['p1'],
      commentary: {
        p1: 'Awarded — the volatility difference is stated clearly and correctly.',
        p2: "Not awarded — the whole answer just restates the same volatility point three times in different words; a second, different difference (read/write access) was never given.",
      },
    },
    {
      id: 'network-topologies',
      topic: 'Network topologies',
      question: 'Compare the star and mesh network topologies in terms of reliability. [4]',
      maxMarks: 4,
      markScheme: [
        { id: 'p1', text: 'States that in a star topology, if the central switch fails, the whole network goes down', marks: 1 },
        { id: 'p2', text: 'States that in a mesh topology there is no single central device, so one cable/device failing does not bring down the whole network', marks: 1 },
        { id: 'p3', text: 'States that a single spoke cable failing in a star only affects that one device, not the whole network', marks: 1 },
        { id: 'p4', text: 'Reaches a clear, justified conclusion that mesh is more reliable/resilient overall because it does not depend on one single device', marks: 1 },
      ],
      studentAnswer: "A mesh network is more reliable because if one cable fails the others still work, so the network doesn't go down. A star network is less reliable because if the switch fails the whole network goes down. Actually, star networks are more reliable than mesh because they are easier to fix when something goes wrong.",
      correctAward: ['p1', 'p2'],
      commentary: {
        p1: "Awarded — correctly explains the star's single point of failure at the switch.",
        p2: 'Awarded — correctly explains that a mesh keeps working when one cable fails.',
        p3: 'Not awarded — never mentions what happens in a star when only a spoke cable (not the switch) fails.',
        p4: "Not awarded — the final sentence contradicts the first two without any justification, so there's no clear, consistent conclusion left to credit.",
      },
    },
    {
      id: 'phishing',
      topic: 'Phishing',
      question: 'Describe how a phishing attack could be used to compromise a computer system. [3]',
      maxMarks: 3,
      markScheme: [
        { id: 'p1', text: 'Describes that the attacker sends a fraudulent email/message that appears to come from a legitimate/trusted source in general', marks: 1 },
        { id: 'p2', text: 'Describes that the message tricks the user into clicking a malicious link, opening an attachment, or entering personal details on a fake website', marks: 1 },
        { id: 'p3', text: 'States a specific consequence, e.g. malware being installed or login credentials/personal data being stolen', marks: 1 },
      ],
      studentAnswer: 'Phishing is when someone sends you a fake email pretending to be like PayPal or your bank. You click the link because it looks real. Then bad stuff happens to your computer.',
      correctAward: ['p2'],
      commentary: {
        p1: "Not awarded — naming 'PayPal' as the example doesn't show the general concept that phishing can impersonate ANY trusted source; the answer needed to generalise, not just name a brand.",
        p2: 'Awarded — correctly explains that the user is tricked into clicking because the message looks genuine.',
        p3: "Not awarded — 'bad stuff happens to your computer' is far too vague; no specific consequence (malware, stolen data, stolen credentials) is named.",
      },
    },
    {
      id: 'validation',
      topic: 'Validation',
      question: "Explain why a range check would be an appropriate validation check for a user's age input, and describe one limitation of this check. [3]",
      maxMarks: 3,
      markScheme: [
        { id: 'p1', text: 'States that a range check tests whether a value falls between a sensible minimum and maximum (e.g. between 0 and 120 for an age)', marks: 1 },
        { id: 'p2', text: 'Develops this with what it rejects, e.g. impossible values like negative numbers or unrealistically high numbers', marks: 1 },
        { id: 'p3', text: "States the limitation that a range check cannot verify the value is the user's TRUE age — an in-range but false age would still pass", marks: 1 },
      ],
      studentAnswer: 'A range check makes sure the age is a sensible number. It checks the age is between two numbers. A limitation is that it might not work properly.',
      correctAward: ['p1'],
      commentary: {
        p1: "Awarded — 'checks the age is between two numbers' does capture the basic range-check idea.",
        p2: 'Not awarded — never developed with what the check actually rejects, or what the sensible bounds might be.',
        p3: "Not awarded — 'might not work properly' claims a limitation exists but never explains WHAT it is or WHY — a mark needs the development, not just the claim.",
      },
    },
    {
      id: 'cache',
      topic: 'Cache',
      question: 'Explain how cache memory improves CPU performance. [3]',
      maxMarks: 3,
      markScheme: [
        { id: 'p1', text: 'States that cache is a small amount of very fast memory located close to/inside the CPU', marks: 1 },
        { id: 'p2', text: 'States that cache stores frequently or recently used instructions/data', marks: 1 },
        { id: 'p3', text: 'Explains that this lets the CPU access that data faster than fetching it from RAM, reducing waiting time and so improving performance', marks: 1 },
      ],
      studentAnswer: "Cache is a small, very fast memory built into the CPU. It stores data and instructions the CPU has used recently. This means the CPU has to wait longer to access data because cache is slower than RAM, so performance gets worse. Overall, cache makes the CPU much faster because it avoids waiting for slow RAM.",
      correctAward: ['p1', 'p2'],
      commentary: {
        p1: 'Awarded — correctly describes cache as small, fast memory built into the CPU.',
        p2: 'Awarded — correctly says it stores recently used data/instructions.',
        p3: "Not awarded — the answer directly contradicts itself, first claiming cache is slower and makes performance worse, then claiming the opposite; an examiner can't credit an explanation that argues both ways without resolving which claim is correct.",
      },
    },
    {
      id: 'dual-core',
      topic: 'Dual core',
      question: 'Explain one benefit and one drawback of a dual-core CPU compared to a single-core CPU. [4]',
      maxMarks: 4,
      markScheme: [
        { id: 'p1', text: 'States that a dual-core CPU can process two threads/instructions/processes at the same time (in parallel)', marks: 1 },
        { id: 'p2', text: 'Develops the benefit: this improves performance/speed for tasks that can be split across cores, e.g. multitasking or software written to use multiple cores', marks: 1 },
        { id: 'p3', text: 'States the drawback that not all software is written to make use of multiple cores', marks: 1 },
        { id: 'p4', text: 'Develops the drawback: so for that software, a dual-core CPU may not be faster than an equivalent single-core CPU with a higher clock speed', marks: 1 },
      ],
      studentAnswer: 'A dual-core CPU is faster than a single-core CPU because it has two cores. Having two cores means it is faster. It can do two things at once which makes it faster. A drawback is that it costs more money to buy.',
      correctAward: ['p1'],
      commentary: {
        p1: "Awarded — 'do two things at once' does identify parallel processing.",
        p2: "Not awarded — 'faster' is repeated three times without ever explaining WHY multiple cores help (multitasking, software split across cores) — repetition isn't development.",
        p3: "Not awarded — cost is a real drawback of dual-core CPUs generally, but it isn't the software-compatibility drawback the mark scheme is looking for here.",
        p4: "Not awarded — because p3 wasn't credited, there's nothing here to develop against the mark scheme.",
      },
    },
  ];

  // ── Content: Command Words drill (original) ──────────────────────

  const DEMAND_TYPES = {
    recall: {
      label: 'Just recall a fact',
      detail: 'A short factual answer is enough — a word, name or number. No reasoning or examples needed.',
    },
    explainDescribe: {
      label: 'Point + development',
      detail: "Make a point, then develop it — say why, how, or give an example/consequence. A bare point alone won't score full marks.",
    },
    compareDiscuss: {
      label: 'Both sides + conclusion',
      detail: 'Cover more than one viewpoint (similarities and differences, or for and against) and reach a justified conclusion.',
    },
    doTask: {
      label: 'Carry out a task',
      detail: 'Produce a working solution — e.g. write code, draw/design a system, or refine something that already exists.',
    },
  };

  const WORD_ITEMS = [
    { word: 'State', demandId: 'recall' },
    { word: 'Identify', demandId: 'recall' },
    { word: 'Describe', demandId: 'explainDescribe' },
    { word: 'Explain', demandId: 'explainDescribe' },
    { word: 'Compare', demandId: 'compareDiscuss' },
    { word: 'Discuss', demandId: 'compareDiscuss' },
    { word: 'Design', demandId: 'doTask' },
    { word: 'Write', demandId: 'doTask' },
  ];

  // Shared option bank for the "how many things?" stem drill — every stem
  // maps to exactly one of these, and several share a mark total (e.g.
  // options 1 and 2 are both worth 2 marks) so the drill can't be beaten
  // by mark count alone; the command word has to be read properly.
  const STEM_OPTIONS = [
    '1 thing — one fact, no development needed',
    '2 things — two facts, no development needed',
    '2 things — 1 point + 1 development',
    '4 things — 2 points + 2 developments',
    '6 things — 3 points + 3 developments',
    'Points on both sides + a justified conclusion',
  ];

  const STEM_ITEMS = [
    { stem: 'State one purpose of the CPU. [1]', correctOptionIndex: 0, explain: "'State' + 'one' + [1 mark] = a single fact, nothing to develop." },
    { stem: 'Identify two input devices. [2]', correctOptionIndex: 1, explain: "'Identify' only ever wants recall — two named devices, no explanation of how they work." },
    { stem: 'Explain one benefit of using cache memory. [2]', correctOptionIndex: 2, explain: "'Explain' always needs a point AND a development — here that's 1 point + 1 development for the 2 marks." },
    { stem: 'Explain two drawbacks of using magnetic hard disks. [4]', correctOptionIndex: 3, explain: "Two drawbacks, each 'Explain'-ed: 2 points + 2 developments = 4 marks." },
    { stem: 'Describe one difference between RAM and ROM. [2]', correctOptionIndex: 2, explain: "'Describe' a single difference still needs the difference stated AND developed (e.g. what it means in practice) — 1 point + 1 development." },
    { stem: 'Give two examples of malware. [2]', correctOptionIndex: 1, explain: "'Give' is a recall word like 'Identify' — two named examples, no development." },
    { stem: 'Discuss the impact of social media on society. [6]', correctOptionIndex: 5, explain: "'Discuss' at 6 marks wants a balanced answer — points for AND against — finishing with a justified conclusion, not a fixed number of facts." },
    { stem: 'Explain three benefits of using a compiler rather than an interpreter. [6]', correctOptionIndex: 4, explain: "Three benefits, each 'Explain'-ed: 3 points + 3 developments = 6 marks." },
  ];

  // ── DOM helpers ────────────────────────────────────────────────
  function el(tag, cls, text) {
    const n = global.document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function injectStyle() {
    if (global.document.getElementById('cslab-examiner-style')) return;
    const style = global.document.createElement('style');
    style.id = 'cslab-examiner-style';
    style.textContent = [
      '.cslab-examiner-intro { color: var(--mid); font-size: 14px; margin: 0 0 18px; }',
      '.cslab-examiner-round { background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; }',
      '.cslab-examiner-progress { color: var(--mid); font-size: 13px; margin: 0 0 4px; font-weight: 600; }',
      '.cslab-examiner-question { font-size: 16px; font-weight: 600; margin: 0 0 12px; }',
      '.cslab-examiner-answer { background: var(--cream); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; }',
      '.cslab-examiner-answer-label { margin: 0 0 4px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--mid); }',
      '.cslab-examiner-answer-text { margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }',
      '.cslab-examiner-instructions { font-size: 13px; color: var(--mid); margin: 0 0 12px; }',
      '.cslab-examiner-scheme { list-style: none; margin: 0 0 10px; padding: 0; display: flex; flex-direction: column; gap: 10px; }',
      '.cslab-examiner-point { border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }',
      '.cslab-examiner-point.match { border-color: var(--success); }',
      '.cslab-examiner-point.mismatch { border-color: #c0392b; }',
      '.cslab-examiner-point-label { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 14px; min-height: 24px; }',
      '.cslab-examiner-point-label input { width: 20px; height: 20px; flex: none; margin-top: 1px; accent-color: var(--accent); }',
      '.cslab-examiner-comment { margin: 8px 0 0; padding-top: 8px; border-top: 1px dashed var(--border); font-size: 13px; color: var(--mid); }',
      '.cslab-examiner-live { font-weight: 600; font-size: 14px; margin: 4px 0 12px; }',
      '.cslab-examiner-btnrow { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px; }',
      '.cslab-examiner-done { text-align: left; }',
      '.cslab-examiner-score { font-size: 16px; font-weight: 600; margin-bottom: 12px; }',
      // command-words sub-tool (shares the .cslab-examiner-* namespace)
      '.cslab-examiner-cw-modetabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }',
      '.cslab-examiner-cw-modetab { min-height: 40px; background: var(--card-bg); border: 1px solid var(--border); color: var(--ink); border-radius: 20px; padding: 6px 14px; font-family: inherit; font-size: 13px; cursor: pointer; }',
      '.cslab-examiner-cw-modetab.active { background: var(--accent); color: var(--paper); border-color: var(--accent); }',
      '.cslab-examiner-cw-progress { color: var(--mid); font-size: 13px; margin: 0 0 8px; }',
      '.cslab-examiner-cw-prompt { font-size: 16px; font-weight: 600; margin: 0 0 14px; white-space: pre-wrap; }',
      '.cslab-examiner-cw-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }',
      '.cslab-examiner-cw-options button { min-height: 44px; text-align: left; background: var(--card-bg); border: 1px solid var(--border); color: var(--ink); border-radius: 8px; padding: 10px 14px; font-family: inherit; font-size: 14px; cursor: pointer; }',
      '.cslab-examiner-cw-options button.cw-opt-right { border-color: var(--success); box-shadow: 0 0 0 1px var(--success); }',
      '.cslab-examiner-cw-options button.cw-opt-chosen-wrong { border-color: #c0392b; box-shadow: 0 0 0 1px #c0392b; }',
      '.cslab-examiner-cw-options button:disabled { cursor: default; opacity: .85; }',
      '.cslab-examiner-cw-score { font-size: 16px; font-weight: 600; margin-bottom: 12px; }',
    ].join('\n');
    global.document.head.appendChild(style);
  }

  // ── Examiner Trainer mount ────────────────────────────────────────

  function mountExaminerTrainer(el0, ctx) {
    injectStyle();
    const root = el('div', 'cslab-examiner');
    root.appendChild(el('p', 'cslab-examiner-intro',
      "You're the senior examiner. Read the question, the mark scheme and the student's answer, then tick every point you think the answer has genuinely earned. Compare your marking against the real verdict at the end of each round."));
    const body = el('div');
    root.appendChild(body);
    el0.appendChild(root);

    let session = null; // { index, correctPoints, totalPoints }

    function startSession() {
      session = { index: 0, correctPoints: 0, totalPoints: 0 };
      renderRound();
    }

    function renderRound() {
      body.innerHTML = '';
      if (session.index >= EXAMINER_ROUNDS.length) { renderSessionDone(); return; }
      const round = EXAMINER_ROUNDS[session.index];

      const wrap = el('div', 'cslab-examiner-round');
      wrap.appendChild(el('p', 'cslab-examiner-progress', 'Round ' + (session.index + 1) + ' of ' + EXAMINER_ROUNDS.length + ' — ' + round.topic));
      wrap.appendChild(el('p', 'cslab-examiner-question', round.question));

      const answerBox = el('div', 'cslab-examiner-answer');
      answerBox.appendChild(el('p', 'cslab-examiner-answer-label', "Student's answer"));
      answerBox.appendChild(el('p', 'cslab-examiner-answer-text', round.studentAnswer));
      wrap.appendChild(answerBox);

      wrap.appendChild(el('p', 'cslab-examiner-instructions',
        'Tick every mark scheme point you think this answer has earned, then submit your marking.'));

      const schemeList = el('ul', 'cslab-examiner-scheme');
      const points = {}; // id -> { cb, li, commentEl }
      round.markScheme.forEach(function (p) {
        const li = el('li', 'cslab-examiner-point');
        const label = global.document.createElement('label');
        label.className = 'cslab-examiner-point-label';
        const cb = global.document.createElement('input');
        cb.type = 'checkbox';
        cb.setAttribute('aria-label', p.text);
        label.appendChild(cb);
        label.appendChild(el('span', null, p.text + ' (' + p.marks + (p.marks === 1 ? ' mark)' : ' marks)')));
        li.appendChild(label);
        const commentEl = el('p', 'cslab-examiner-comment');
        commentEl.style.display = 'none';
        li.appendChild(commentEl);
        schemeList.appendChild(li);
        points[p.id] = { cb: cb, li: li, commentEl: commentEl };
      });
      wrap.appendChild(schemeList);

      const liveMarks = el('p', 'cslab-examiner-live', 'Your mark so far: 0 / ' + round.maxMarks);
      wrap.appendChild(liveMarks);

      function updateLive() {
        let sum = 0;
        round.markScheme.forEach(function (p) { if (points[p.id].cb.checked) sum += p.marks; });
        liveMarks.textContent = 'Your mark so far: ' + sum + ' / ' + round.maxMarks;
      }
      round.markScheme.forEach(function (p) { points[p.id].cb.addEventListener('change', updateLive); });

      const feedback = el('p', 'cslab-feedback');
      const btnRow = el('div', 'cslab-examiner-btnrow');
      const submitBtn = ctx.ui.btn('Submit my marking');
      const nextBtn = ctx.ui.btn('Next round', 'secondary');
      nextBtn.style.display = 'none';
      btnRow.appendChild(submitBtn);
      btnRow.appendChild(nextBtn);
      wrap.appendChild(feedback);
      wrap.appendChild(btnRow);

      let submitted = false;
      submitBtn.addEventListener('click', function () {
        if (submitted) return;
        submitted = true;
        const ticked = round.markScheme
          .filter(function (p) { return points[p.id].cb.checked; })
          .map(function (p) { return p.id; });
        const result = gradeExaminerRound(round.markScheme, round.correctAward, ticked);

        round.markScheme.forEach(function (p) { points[p.id].cb.disabled = true; });
        result.perPoint.forEach(function (pp) {
          const rec = points[pp.id];
          rec.li.classList.add(pp.matches ? 'match' : 'mismatch');
          rec.commentEl.style.display = '';
          rec.commentEl.textContent = (pp.shouldAward ? '✓ Examiner: awarded — ' : '✗ Examiner: not awarded — ') + round.commentary[pp.id];
        });

        session.correctPoints += result.correctCount;
        session.totalPoints += result.totalPoints;
        ctx.ui.feedback(feedback, result.allMatched,
          'You matched ' + result.correctCount + ' of ' + result.totalPoints + ' marking decisions. ' +
          'Senior examiner mark: ' + result.correctMarks + '/' + round.maxMarks + ' — your mark: ' + result.playerMarks + '/' + round.maxMarks + '.');
        submitBtn.disabled = true;
        nextBtn.style.display = '';
        session.index += 1;
      });

      nextBtn.addEventListener('click', renderRound);

      body.appendChild(wrap);
    }

    function renderSessionDone() {
      body.innerHTML = '';
      const wrap = el('div', 'cslab-examiner-done');
      const pct = session.totalPoints ? Math.round((100 * session.correctPoints) / session.totalPoints) : 0;
      const prevBest = ctx.store.get('best', 0);
      const newBest = pct > prevBest;
      if (newBest) ctx.store.set('best', pct);
      wrap.appendChild(el('p', 'cslab-examiner-score',
        'Session complete: you matched the senior examiner on ' + session.correctPoints + ' / ' + session.totalPoints +
        ' marking decisions (' + pct + '%). Best: ' + (newBest ? pct : prevBest) + '%.' + (newBest ? ' New best!' : '')));
      const again = ctx.ui.btn('Mark another set');
      again.addEventListener('click', startSession);
      wrap.appendChild(again);
      body.appendChild(wrap);
      ctx.complete({ score: pct });
    }

    startSession();
  }

  // ── Command Words mount ───────────────────────────────────────────

  const CW_ROUND_LENGTH_MATCH = WORD_ITEMS.length;
  const CW_ROUND_LENGTH_STEMS = STEM_ITEMS.length;

  function buildMatchQuiz(item) {
    const ids = shuffle(Object.keys(DEMAND_TYPES));
    return {
      prompt: "What does the command word '" + item.word + "' demand?",
      options: ids.map(function (id) { return { id: id, label: DEMAND_TYPES[id].label }; }),
      isCorrect: function (optId) { return gradeWordMatch(item, optId); },
      explain: DEMAND_TYPES[item.demandId].detail,
    };
  }

  function buildStemQuiz(item) {
    const indices = shuffle(STEM_OPTIONS.map(function (_, i) { return i; }));
    return {
      prompt: item.stem,
      options: indices.map(function (i) { return { id: i, label: STEM_OPTIONS[i] }; }),
      isCorrect: function (optId) { return gradeStemChoice(item, optId); },
      explain: item.explain,
    };
  }

  function mountCommandWords(el0, ctx) {
    injectStyle();
    const root = el('div', 'cslab-examiner-cw');
    const modeTabs = el('div', 'cslab-examiner-cw-modetabs');
    const body = el('div');
    root.appendChild(modeTabs);
    root.appendChild(body);
    el0.appendChild(root);

    const MODES = [
      { id: 'match', label: 'Match the command word', items: WORD_ITEMS, total: CW_ROUND_LENGTH_MATCH, build: buildMatchQuiz },
      { id: 'stems', label: 'How many things?', items: STEM_ITEMS, total: CW_ROUND_LENGTH_STEMS, build: buildStemQuiz },
    ];

    let round = null;

    function currentStreak() { return ctx.store.get('streak', 0); }
    function bestStreak() { return ctx.store.get('best', 0); }
    function registerAnswer(correct) {
      let streak = ctx.store.get('streak', 0);
      let best = ctx.store.get('best', 0);
      streak = correct ? streak + 1 : 0;
      if (streak > best) best = streak;
      ctx.store.set('streak', streak);
      ctx.store.set('best', best);
    }

    function setActiveTabUI(activeId) {
      Array.prototype.forEach.call(modeTabs.children, function (btn, i) { btn.classList.toggle('active', MODES[i].id === activeId); });
    }

    function startRound(mode) {
      setActiveTabUI(mode.id);
      round = { mode: mode, items: shuffle(mode.items), index: 0, score: 0, total: mode.total };
      renderQuestion();
    }

    function renderQuestion() {
      body.innerHTML = '';
      if (round.index >= round.total) { renderRoundDone(); return; }

      const item = round.items[round.index];
      const quiz = round.mode.build(item);

      const wrap = el('div', 'cslab-examiner-cw-q');
      const progress = el('p', 'cslab-examiner-cw-progress',
        'Question ' + (round.index + 1) + ' of ' + round.total + ' — streak ' + currentStreak() + ' (best ' + bestStreak() + ')');
      wrap.appendChild(progress);
      wrap.appendChild(el('p', 'cslab-examiner-cw-prompt', quiz.prompt));

      const optWrap = el('div', 'cslab-examiner-cw-options');
      const feedback = el('p', 'cslab-feedback');
      const nextBtn = ctx.ui.btn('Next', 'secondary');
      nextBtn.style.display = 'none';

      let answered = false;
      const buttons = quiz.options.map(function (opt) {
        const b = global.document.createElement('button');
        b.type = 'button';
        b.textContent = opt.label;
        b.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          const correct = quiz.isCorrect(opt.id);
          buttons.forEach(function (pair) {
            pair.btn.disabled = true;
            if (quiz.isCorrect(pair.opt.id)) pair.btn.classList.add('cw-opt-right');
            else if (pair.opt.id === opt.id) pair.btn.classList.add('cw-opt-chosen-wrong');
          });
          registerAnswer(correct);
          if (correct) round.score += 1;
          ctx.ui.feedback(feedback, correct, (correct ? 'Correct! ' : 'Not quite. ') + quiz.explain);
          progress.textContent = 'Question ' + (round.index + 1) + ' of ' + round.total + ' — streak ' + currentStreak() + ' (best ' + bestStreak() + ')';
          nextBtn.style.display = '';
        });
        optWrap.appendChild(b);
        return { btn: b, opt: opt };
      });

      wrap.appendChild(optWrap);
      wrap.appendChild(feedback);
      nextBtn.addEventListener('click', function () { round.index += 1; renderQuestion(); });
      wrap.appendChild(nextBtn);
      body.appendChild(wrap);
    }

    function renderRoundDone() {
      body.innerHTML = '';
      const wrap = el('div', 'cslab-examiner-cw-done');
      wrap.appendChild(el('p', 'cslab-examiner-cw-score',
        'Round complete: ' + round.score + ' / ' + round.total + ' correct. Streak ' + currentStreak() + ' (best ' + bestStreak() + ').'));
      const again = ctx.ui.btn('Play again');
      again.addEventListener('click', function () { startRound(round.mode); });
      wrap.appendChild(again);
      body.appendChild(wrap);
      ctx.complete({ mode: round.mode.id, score: round.score });
    }

    MODES.forEach(function (m) {
      const b = global.document.createElement('button');
      b.type = 'button';
      b.className = 'cslab-examiner-cw-modetab';
      b.textContent = m.label;
      b.addEventListener('click', function () { startRound(m); });
      modeTabs.appendChild(b);
    });

    startRound(MODES[0]);
  }

  // ── Registration (skipped outside the browser) ─────────────────────
  if (global && global.CsLab) {
    global.CsLab.registerTool('examiner-trainer', { title: 'Examiner Trainer', icon: '🧑‍⚖️', mount: mountExaminerTrainer });
    global.CsLab.registerTool('command-words', { title: 'Command Word Drill', icon: '⚡', mount: mountCommandWords });
  }

  // ── Node test hook (never runs in the browser) ──────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      gradeExaminerRound: gradeExaminerRound,
      gradeWordMatch: gradeWordMatch,
      gradeStemChoice: gradeStemChoice,
      EXAMINER_ROUNDS: EXAMINER_ROUNDS,
      DEMAND_TYPES: DEMAND_TYPES,
      WORD_ITEMS: WORD_ITEMS,
      STEM_OPTIONS: STEM_OPTIONS,
      STEM_ITEMS: STEM_ITEMS,
    };
  }
})(typeof window !== 'undefined' ? window : this);
