// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Micro-sims (T10, CS-CONTENT-PLAN.md §7.1)
// Registers THREE tool ids in one file:
//   'fde-sim'         — 1.1.1 Architecture of the CPU
//   'storage-chooser' — 1.2.2 Secondary storage
//   'threat-defence'  — 1.4.1 Threats / 1.4.2 Prevention (config.mode)
//
// Wrapped as (function (global) { ... })(window) so the pure helpers are
// unit-testable under plain Node via require() — CsLab.registerTool calls
// are skipped when there is no global.CsLab (i.e. outside the browser).
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  // ── Tiny DOM helper (textContent only — never innerHTML for anything
  //    that includes dynamic/student-influenced text) ───────────────
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

  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    const sa = a.slice().sort(), sb = b.slice().sort();
    return sa.every((v, i) => v === sb[i]);
  }

  // ── Shared style (one <style>, all three tools live under it) ─────
  function injectStyle() {
    if (global.document.getElementById('cslab-msim-style')) return;
    const style = global.document.createElement('style');
    style.id = 'cslab-msim-style';
    style.textContent = [
      // fde-sim
      '.cslab-msim-fde-intro, .cslab-msim-intro { color: var(--mid); font-size: 14px; margin: 0 0 14px; }',
      '.cslab-msim-diagram { width: 100%; max-width: 720px; height: auto; margin-bottom: 6px; }',
      '.cslab-msim-diagram [data-part] rect { fill: var(--card-bg); stroke: currentColor; stroke-width: 1.4; transition: fill .2s, stroke .2s; }',
      '.cslab-msim-diagram [data-part].active rect { fill: color-mix(in srgb, var(--accent) 24%, var(--card-bg)); stroke: var(--accent); stroke-width: 2.6; }',
      '.cslab-msim-diagram text { fill: var(--ink); font-family: "DM Mono", Consolas, monospace; }',
      '.cslab-msim-diagram .cslab-msim-label { font-size: 11px; font-weight: 600; }',
      '.cslab-msim-diagram .cslab-msim-value { font-size: 10px; fill: var(--mid); }',
      '.cslab-msim-diagram .cslab-msim-title { font-size: 10px; fill: var(--mid); letter-spacing: .06em; }',
      '.cslab-msim-diagram .cslab-msim-ram-content { font-size: 9.5px; }',
      '.cslab-msim-controls { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }',
      '.cslab-msim-progress { font-size: 13px; font-weight: 600; color: var(--ink); margin: 4px 0; }',
      '.cslab-msim-caption { min-height: 42px; font-size: 14px; line-height: 1.5; background: var(--cream); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; margin: 0 0 14px; }',
      '.cslab-msim-legend { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px 16px; font-size: 12.5px; color: var(--mid); }',
      '.cslab-msim-legend li strong { color: var(--ink); }',
      // storage-chooser
      '.cslab-msim-storage-list { display: flex; flex-direction: column; gap: 16px; }',
      '.cslab-msim-storage-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; position: relative; }',
      '.cslab-msim-storage-card.done { border-color: var(--success); }',
      '.cslab-msim-storage-badge { display: none; position: absolute; top: 12px; right: 14px; font-size: 11px; font-weight: 600; color: var(--success); }',
      '.cslab-msim-storage-card.done .cslab-msim-storage-badge { display: block; }',
      '.cslab-msim-storage-title { font-weight: 700; margin: 0 0 4px; padding-right: 70px; }',
      '.cslab-msim-storage-blurb { color: var(--mid); font-size: 13.5px; margin: 0 0 10px; }',
      '.cslab-msim-storage-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }',
      '.cslab-msim-type-btn { min-height: 44px; padding: 8px 14px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--card-bg); color: var(--ink); font-family: inherit; font-size: 13px; cursor: pointer; }',
      '.cslab-msim-type-btn.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, var(--card-bg)); font-weight: 600; }',
      '.cslab-msim-device-select { min-height: 44px; padding: 6px 10px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--card-bg); color: var(--ink); font-family: inherit; font-size: 13px; margin-bottom: 10px; }',
      '.cslab-msim-factor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-bottom: 10px; }',
      '.cslab-msim-factor { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 6px 10px; border: 1.5px solid var(--border); border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--ink); }',
      '.cslab-msim-factor input { width: 17px; height: 17px; }',
      '.cslab-msim-factor.picked { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--card-bg)); }',
      // threat-defence
      '.cslab-msim-threat-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }',
      '.cslab-msim-threat-score { font-weight: 700; font-size: 14px; }',
      '.cslab-msim-threat-streak { color: var(--mid); font-size: 13px; }',
      '.cslab-msim-timer-toggle { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--mid); cursor: pointer; }',
      '.cslab-msim-threat-timer { font-weight: 700; color: var(--accent); }',
      '.cslab-msim-threat-title { margin: 0 0 6px; font-size: 16px; }',
      '.cslab-msim-threat-scenario { color: var(--mid); font-size: 13.5px; margin: 0 0 10px; }',
      '.cslab-msim-threat-instruction { font-weight: 600; font-size: 13px; margin: 0 0 8px; }',
      '.cslab-msim-threat-options { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }',
      '.cslab-msim-threat-options .cslab-btn { min-height: 44px; }',
      '.cslab-msim-threat-options .cslab-btn.correct { background: var(--success); }',
      '.cslab-msim-threat-options .cslab-btn.wrong { background: #c0392b; }',
      '.cslab-msim-threat-checks { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin-bottom: 10px; }',
      '.cslab-msim-check { display: flex; align-items: center; gap: 8px; min-height: 44px; padding: 6px 10px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 13px; cursor: pointer; }',
      '.cslab-msim-check input { width: 17px; height: 17px; }',
      '.cslab-msim-summary { text-align: center; padding: 20px 10px; }',
      '.cslab-msim-summary p { font-size: 15px; }',
    ].join('\n');
    global.document.head.appendChild(style);
  }

  // ══════════════════════════════════════════════════════════
  // FDE-SIM — fetch/decode/execute walk-through (1.1.1)
  // NR (Appendix B 1.1.1): register-to-register data flow per FE stage —
  // captions stay at spec level ("the PC is used to fetch…"), not a claim
  // about exact internal wiring.
  // ══════════════════════════════════════════════════════════

  const FDE_PROGRAM = [
    { addr: 0, kind: 'instr', op: 'LOAD', operand: 4, text: 'LOAD the number at address 4' },
    { addr: 1, kind: 'instr', op: 'ADD', operand: 5, text: 'ADD the number at address 5' },
    { addr: 2, kind: 'instr', op: 'STORE', operand: 3, text: 'STORE the Accumulator at address 3' },
    { addr: 3, kind: 'data', value: null, text: '(empty — the result goes here)' },
    { addr: 4, kind: 'data', value: 12, text: 'the number 12' },
    { addr: 5, kind: 'data', value: 30, text: 'the number 30' },
  ];

  const FDE_LEGEND = [
    ['PC', 'Program Counter', 'holds the ADDRESS of the next instruction to fetch.'],
    ['MAR', 'Memory Address Register', 'holds the ADDRESS currently being accessed in memory.'],
    ['MDR', 'Memory Data Register', 'holds the DATA or instruction just fetched from (or about to be written to) memory.'],
    ['ACC', 'Accumulator', 'holds a DATA value the ALU is working on.'],
    ['CU', 'Control Unit', 'decodes instructions and directs the other components.'],
    ['ALU', 'Arithmetic Logic Unit', 'carries out calculations and comparisons.'],
    ['Cache', 'Cache', 'very fast memory holding recently/frequently used instructions and data, closer to the CPU than RAM.'],
  ];

  // Pure: deterministic step-by-step simulation of the 3-instruction program.
  function buildFdeSteps(program) {
    const instrs = program.filter(c => c.kind === 'instr');
    const mem = {};
    program.forEach(c => { mem[c.addr] = c.kind === 'data' ? c.value : c.text; });
    let pc = 0, mar = null, mdr = null, acc = null;
    const steps = [];
    instrs.forEach(instr => {
      // FETCH
      mar = instr.addr;
      mdr = instr.text;
      pc = instr.addr + 1;
      steps.push({
        stage: 'FETCH', addr: instr.addr,
        regs: { pc, mar, mdr, acc },
        highlight: ['pc', 'mar', 'mdr', 'ram' + instr.addr],
        caption: 'FETCH: the address in the PC is used to fetch the next instruction from memory. The PC then increments so it is ready to fetch the following instruction.',
      });
      // DECODE
      steps.push({
        stage: 'DECODE', addr: instr.addr,
        regs: { pc, mar, mdr, acc },
        highlight: ['cu', 'mdr'],
        caption: 'DECODE: the Control Unit decodes the instruction so the CPU knows which operation to carry out.',
      });
      // EXECUTE
      let caption, highlight;
      if (instr.op === 'LOAD') {
        acc = mem[instr.operand];
        caption = 'EXECUTE: the value stored at address ' + instr.operand + ' is loaded into the Accumulator.';
        highlight = ['alu', 'acc', 'ram' + instr.operand];
      } else if (instr.op === 'ADD') {
        acc = (acc || 0) + mem[instr.operand];
        caption = 'EXECUTE: the ALU adds the value at address ' + instr.operand + ' to the number already in the Accumulator.';
        highlight = ['alu', 'acc', 'ram' + instr.operand];
      } else { // STORE
        mem[instr.operand] = acc;
        caption = 'EXECUTE: the value in the Accumulator is written back to address ' + instr.operand + ' in memory.';
        highlight = ['alu', 'acc', 'ram' + instr.operand];
      }
      steps.push({
        stage: 'EXECUTE', addr: instr.addr,
        regs: { pc, mar, mdr, acc },
        highlight, caption,
        ramUpdate: instr.op === 'STORE' ? { addr: instr.operand, value: acc } : null,
      });
    });
    return steps;
  }

  function fdeSvgMarkup() {
    const regBox = (part, label, x, y, w, h) =>
      '<g data-part="' + part + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6"/>' +
      '<text class="cslab-msim-label" x="' + (x + w / 2) + '" y="' + (y + 18) + '" text-anchor="middle">' + label + '</text>' +
      '<text class="cslab-msim-value" data-val="' + part + '" x="' + (x + w / 2) + '" y="' + (y + h - 8) + '" text-anchor="middle">–</text></g>';

    const ramCell = (addr, y) =>
      '<g data-part="ram' + addr + '"><rect x="440" y="' + y + '" width="220" height="42" rx="4"/>' +
      '<text class="cslab-msim-title" x="450" y="' + (y + 15) + '">Address ' + addr + '</text>' +
      '<text class="cslab-msim-ram-content" data-ram="' + addr + '" x="450" y="' + (y + 32) + '">–</text></g>';

    let ram = '';
    for (let a = 0; a < 6; a++) ram += ramCell(a, 20 + a * 48);

    return (
      '<svg class="cslab-msim-diagram" viewBox="0 0 680 320" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="16" y="12" width="390" height="296" rx="10" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/>' +
      '<text class="cslab-msim-title" x="26" y="30">CPU</text>' +
      regBox('cu', 'CU', 36, 40, 160, 46) +
      regBox('alu', 'ALU', 210, 40, 172, 46) +
      '<g data-part="cache"><rect x="36" y="96" width="346" height="30" rx="4"/><text class="cslab-msim-label" x="209" y="116" text-anchor="middle">Cache</text></g>' +
      regBox('pc', 'PC', 36, 150, 78, 54) +
      regBox('mar', 'MAR', 122, 150, 78, 54) +
      regBox('mdr', 'MDR', 208, 150, 90, 54) +
      regBox('acc', 'ACC', 306, 150, 76, 54) +
      '<line x1="382" y1="230" x2="440" y2="230" stroke="currentColor" stroke-width="1.4" marker-end="url(#fdeArrow)" opacity=".6"/>' +
      '<text class="cslab-msim-title" x="386" y="248">bus</text>' +
      '<defs><marker id="fdeArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="currentColor" opacity=".6"/></marker></defs>' +
      ram +
      '</svg>'
    );
  }

  function setFdeRegDisplay(root, regs) {
    ['pc', 'mar', 'mdr', 'acc'].forEach(k => {
      const n = root.querySelector('[data-val="' + k + '"]');
      if (!n) return;
      const v = regs[k];
      n.textContent = (v === null || v === undefined) ? '–' : String(v);
    });
  }

  function setFdeRam(root, addr, text) {
    const n = root.querySelector('[data-ram="' + addr + '"]');
    if (n) n.textContent = text;
  }

  function mountFde(el0, ctx) {
    injectStyle();
    const steps = buildFdeSteps(FDE_PROGRAM);
    let idx = -1; // -1 = not started
    let autoTimer = null;
    let completed = false;

    const wrap = el('div', 'cslab-msim-fde');
    wrap.appendChild(el('p', 'cslab-msim-fde-intro',
      'A tiny 3-instruction program adds two numbers together and stores the result. Press Step to walk through fetch, decode and execute — the parts of the CPU being used light up at each stage.'));

    // Controls + the step readout sit directly under the intro, ABOVE the
    // diagram: the CPU diagram is tall, so with the buttons underneath it the
    // student had to scroll down to press Step and back up to watch the parts
    // light up. Keeping them here means the whole cycle stays in view.
    const controls = el('div', 'cslab-msim-controls');
    const stepBtn = ctx.ui.btn('Step ▶');
    const autoBtn = ctx.ui.btn('Auto-play', 'secondary');
    const resetBtn = ctx.ui.btn('Reset', 'secondary');
    controls.appendChild(stepBtn);
    controls.appendChild(autoBtn);
    controls.appendChild(resetBtn);
    wrap.appendChild(controls);

    const progress = el('p', 'cslab-msim-progress', 'Ready — press Step to fetch the first instruction.');
    wrap.appendChild(progress);
    const caption = el('p', 'cslab-msim-caption');
    caption.setAttribute('aria-live', 'polite');
    wrap.appendChild(caption);

    wrap.appendChild(ctx.ui.el(fdeSvgMarkup()));

    const legend = el('ul', 'cslab-msim-legend');
    FDE_LEGEND.forEach(([abbr, name, desc]) => {
      const li = global.document.createElement('li');
      const strong = global.document.createElement('strong');
      strong.textContent = abbr + ' (' + name + ')';
      li.appendChild(strong);
      li.appendChild(global.document.createTextNode(' — ' + desc));
      legend.appendChild(li);
    });
    wrap.appendChild(legend);
    el0.appendChild(wrap);

    function stopAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = 'Auto-play'; }
    }

    function render() {
      wrap.querySelectorAll('[data-part]').forEach(n => n.classList.remove('active'));
      if (idx < 0) {
        setFdeRegDisplay(wrap, { pc: 0, mar: null, mdr: null, acc: null });
        setFdeRam(wrap, 3, '(empty — the result goes here)');
        progress.textContent = 'Ready — press Step to fetch the first instruction.';
        // Placeholder rather than '': the caption sits above the diagram now,
        // where an empty bordered box would just look broken on first load.
        caption.textContent = 'Each stage is explained here as you step through the cycle.';
        stepBtn.disabled = false;
        return;
      }
      const step = steps[idx];
      (step.highlight || []).forEach(p => {
        const n = wrap.querySelector('[data-part="' + p + '"]');
        if (n) n.classList.add('active');
      });
      setFdeRegDisplay(wrap, step.regs);
      if (step.ramUpdate) setFdeRam(wrap, step.ramUpdate.addr, 'the number ' + step.ramUpdate.value);
      const instrNum = Math.floor(idx / 3) + 1;
      const done = idx === steps.length - 1;
      progress.textContent = done
        ? 'Program finished — press Reset to run it again.'
        : 'Step ' + (idx + 1) + ' of ' + steps.length + ' — Instruction ' + instrNum + ' of 3, ' + step.stage + '.';
      caption.textContent = step.caption;
      stepBtn.disabled = done;
      if (done && !completed) {
        completed = true;
        stopAuto();
        ctx.complete({ program: 'add-two-numbers' });
      }
    }

    stepBtn.addEventListener('click', () => {
      if (idx >= steps.length - 1) return;
      idx++;
      render();
    });
    autoBtn.addEventListener('click', () => {
      if (autoTimer) { stopAuto(); return; }
      autoBtn.textContent = '⏸ Pause';
      autoTimer = setInterval(() => {
        if (idx >= steps.length - 1) { stopAuto(); return; }
        idx++;
        render();
      }, 1700);
    });
    resetBtn.addEventListener('click', () => {
      stopAuto();
      idx = -1;
      completed = false;
      render();
    });

    render();
  }

  // ══════════════════════════════════════════════════════════
  // STORAGE-CHOOSER — pick the right secondary storage (1.2.2)
  // ══════════════════════════════════════════════════════════

  const STORAGE_DEVICES = {
    optical: ['CD-R', 'DVD', 'Blu-ray disc'],
    magnetic: ['internal hard disk drive (HDD)', 'external hard disk drive', 'magnetic tape drive'],
    'solid-state': ['SSD', 'USB flash drive', 'memory card (e.g. microSD)'],
  };
  const STORAGE_TYPE_LABELS = { optical: 'Optical (CD / DVD / Blu-ray)', magnetic: 'Magnetic (hard disk / tape)', 'solid-state': 'Solid-state (SSD / flash)' };
  const STORAGE_FACTORS = ['capacity', 'speed', 'portability', 'durability', 'reliability', 'cost'];
  const STORAGE_FACTOR_LABELS = { capacity: 'Capacity', speed: 'Speed', portability: 'Portability', durability: 'Durability', reliability: 'Reliability', cost: 'Cost' };

  const STORAGE_SCENARIOS = [
    {
      id: 'photographer', title: "A wedding photographer's archive",
      blurb: 'Thousands of huge, high-resolution RAW photo files from past weddings need to be kept safe for years. Once an album has been delivered, the files are rarely opened again.',
      correctType: 'magnetic', correctFactors: ['capacity', 'cost'],
      explain: 'A magnetic hard disk drive gives huge capacity very cheaply per gigabyte — exactly what is needed to keep thousands of large files long-term.',
      alt: { type: 'optical', factors: ['durability', 'reliability'], note: 'An optical archive disc (e.g. Blu-ray) is also a reasonable answer — discs are not affected by a drive failure or magnets, which suits long-term archiving, even though the capacity per disc is much smaller.' },
    },
    {
      id: 'smartwatch', title: 'A smartwatch',
      blurb: 'A tiny device worn on the wrist all day, knocked against doors and splashed with sweat and rain, needs to keep working.',
      correctType: 'solid-state', correctFactors: ['portability', 'durability'],
      explain: 'Solid-state storage has no moving parts, so it is small, light and shock-resistant — ideal for a device this size that takes daily knocks.',
    },
    {
      id: 'school-backups', title: 'School backups',
      blurb: 'Every student and teacher file is backed up on-site overnight. The school needs to store a very large amount of data as cheaply as possible.',
      correctType: 'magnetic', correctFactors: ['capacity', 'cost'],
      explain: 'A magnetic hard disk (or NAS of hard disks) gives the huge capacity a whole-school backup needs at the lowest cost per gigabyte.',
      alt: { type: 'solid-state', factors: ['reliability', 'speed'], note: 'If the budget allows, solid-state backup storage would be faster and more reliable, though at a much higher cost per gigabyte for the same capacity.' },
    },
    {
      id: 'grandparent', title: 'Posting files to a grandparent',
      blurb: 'A small number of family photos need to be sent through the post to a grandparent who does not have broadband.',
      correctType: 'optical', correctFactors: ['cost', 'portability'],
      explain: 'A cheap CD or DVD is inexpensive, light enough to post, and works in almost any older drive a grandparent might have.',
      alt: { type: 'solid-state', factors: ['portability', 'cost'], note: 'A cheap USB flash drive would also work well for posting — small, light and inexpensive, and it does not need a disc drive to read it.' },
    },
    {
      id: 'gaming-pc', title: 'A gaming PC boot drive',
      blurb: 'The drive that the operating system and games are installed on — it needs to load everything as fast as possible.',
      correctType: 'solid-state', correctFactors: ['speed', 'reliability'],
      explain: 'An SSD has no moving parts to wait for, so read/write speeds are far higher than a magnetic disk, cutting load times.',
    },
    {
      id: 'cctv', title: 'A CCTV recorder',
      blurb: 'Runs 24 hours a day for months, constantly overwriting old footage with new footage in a continuous loop, and needs a huge amount of storage.',
      correctType: 'magnetic', correctFactors: ['capacity', 'reliability'],
      explain: 'Surveillance-rated magnetic hard disks are built for huge capacity at low cost and for reliably handling constant, continuous read/write cycles.',
    },
    {
      id: 'car-music', title: 'Music for a car on bumpy roads',
      blurb: 'A portable music player will be jolted around constantly while it plays on rough roads.',
      correctType: 'solid-state', correctFactors: ['durability', 'portability'],
      explain: 'With no moving parts to skip or get damaged, solid-state storage keeps playing reliably through vibration and knocks, and it is small enough to carry.',
    },
    {
      id: 'mailshot', title: 'Cheap bulk mailshot discs',
      blurb: 'A company wants to give away hundreds of identical promotional discs, each holding a small amount of content, as cheaply as possible.',
      correctType: 'optical', correctFactors: ['cost', 'portability'],
      explain: 'Blank CD-Rs can be mass-produced and posted out very cheaply — ideal when hundreds of identical, low-capacity copies are needed.',
    },
  ];

  // Pure: grade a scenario answer against the model answer (+ accepted alternative).
  function gradeStorageChoice(scenario, type, factors) {
    if (type === scenario.correctType && sameSet(factors, scenario.correctFactors)) {
      return { verdict: 'best', ok: true, message: scenario.explain };
    }
    if (scenario.alt && type === scenario.alt.type && sameSet(factors, scenario.alt.factors)) {
      return { verdict: 'also-acceptable', ok: true, message: scenario.alt.note };
    }
    if (type === scenario.correctType) {
      return { verdict: 'right-type', ok: false, message: 'Good choice of storage type — but pick the two factors that justify it best. ' + scenario.explain };
    }
    if (scenario.alt && type === scenario.alt.type) {
      return { verdict: 'right-type', ok: false, message: 'That type can work here, but check the two factors again. ' + scenario.alt.note };
    }
    return { verdict: 'wrong', ok: false, message: 'Not the strongest choice here. ' + scenario.explain };
  }

  function buildStorageCards(container, ctx) {
    const doneIds = ctx.store.get('completed', []);
    const list = el('div', 'cslab-msim-storage-list');
    STORAGE_SCENARIOS.forEach(scn => {
      const card = el('div', 'cslab-msim-storage-card');
      if (doneIds.indexOf(scn.id) !== -1) card.classList.add('done');
      card.appendChild(el('span', 'cslab-msim-storage-badge', '✓ checked'));
      card.appendChild(el('h4', 'cslab-msim-storage-title', scn.title));
      card.appendChild(el('p', 'cslab-msim-storage-blurb', scn.blurb));

      let selectedType = null;
      const typeRow = el('div', 'cslab-msim-storage-row');
      Object.keys(STORAGE_TYPE_LABELS).forEach(t => {
        const b = el('button', 'cslab-msim-type-btn', STORAGE_TYPE_LABELS[t]);
        b.type = 'button';
        b.addEventListener('click', () => {
          selectedType = t;
          typeRow.querySelectorAll('.cslab-msim-type-btn').forEach(n => n.classList.remove('selected'));
          b.classList.add('selected');
          deviceSelect.innerHTML = '';
          deviceSelect.style.display = '';
          const placeholder = global.document.createElement('option');
          placeholder.value = ''; placeholder.textContent = 'Choose a device…';
          deviceSelect.appendChild(placeholder);
          STORAGE_DEVICES[t].forEach(d => {
            const opt = global.document.createElement('option');
            opt.value = d; opt.textContent = d;
            deviceSelect.appendChild(opt);
          });
        });
        typeRow.appendChild(b);
      });
      card.appendChild(typeRow);

      const deviceSelect = global.document.createElement('select');
      deviceSelect.className = 'cslab-msim-device-select';
      deviceSelect.style.display = 'none';
      card.appendChild(deviceSelect);

      const factorGrid = el('div', 'cslab-msim-factor-grid');
      const pickedFactors = [];
      STORAGE_FACTORS.forEach(f => {
        const label = el('label', 'cslab-msim-factor');
        const cb = global.document.createElement('input');
        cb.type = 'checkbox'; cb.value = f;
        cb.addEventListener('change', () => {
          if (cb.checked) {
            if (pickedFactors.length >= 2) { cb.checked = false; return; }
            pickedFactors.push(f);
            label.classList.add('picked');
          } else {
            const i = pickedFactors.indexOf(f);
            if (i !== -1) pickedFactors.splice(i, 1);
            label.classList.remove('picked');
          }
        });
        label.appendChild(cb);
        label.appendChild(global.document.createTextNode(STORAGE_FACTOR_LABELS[f]));
        factorGrid.appendChild(label);
      });
      card.appendChild(factorGrid);

      const checkBtn = ctx.ui.btn('Check my answer');
      card.appendChild(checkBtn);
      const feedback = el('p', 'cslab-feedback');
      card.appendChild(feedback);

      checkBtn.addEventListener('click', () => {
        if (!selectedType || !deviceSelect.value || pickedFactors.length !== 2) {
          ctx.ui.feedback(feedback, false, 'Pick a storage type, a device, and exactly two factors first.');
          return;
        }
        const result = gradeStorageChoice(scn, selectedType, pickedFactors);
        ctx.ui.feedback(feedback, result.ok, result.message);
        const done = ctx.store.get('completed', []);
        if (done.indexOf(scn.id) === -1) { done.push(scn.id); ctx.store.set('completed', done); }
        card.classList.add('done');
        ctx.complete({ scenario: scn.id, verdict: result.verdict });
      });

      list.appendChild(card);
    });
    container.appendChild(list);
  }

  function mountStorageChooser(el0, ctx) {
    injectStyle();
    const wrap = el('div', 'cslab-msim-storage');
    wrap.appendChild(el('p', 'cslab-msim-intro',
      'For each scenario, choose the storage type and a device, then tick the TWO factors that best justify your choice — capacity, speed, portability, durability, reliability or cost.'));
    el0.appendChild(wrap);
    buildStorageCards(wrap, ctx);
  }

  // ══════════════════════════════════════════════════════════
  // THREAT-DEFENCE — quick-fire threat↔prevention game (1.4.1 / 1.4.2)
  // ══════════════════════════════════════════════════════════

  const THREATS = {
    malware: 'Malware', phishing: 'Phishing', bruteforce: 'Brute-force attack',
    dos: 'Denial-of-service (DoS) attack', interception: 'Data interception', sqli: 'SQL injection',
  };
  const DEFENCES = {
    antimalware: 'Anti-malware software', firewall: 'Firewall', passwords: 'Strong passwords & lockouts',
    accesslevels: 'User access levels', encryption: 'Encryption', pentest: 'Penetration testing', physical: 'Physical security',
  };
  // Every threat each defence helps limit — the exam skill for 1.4.2.
  const DEFENCE_LIMITS = {
    antimalware: ['malware'], firewall: ['malware', 'dos'], passwords: ['bruteforce'],
    accesslevels: ['sqli', 'phishing'], encryption: ['interception'], pentest: ['sqli', 'bruteforce'], physical: ['interception'],
  };
  const THREAT_BEST_DEFENCE = {
    malware: 'antimalware', phishing: 'accesslevels', bruteforce: 'passwords',
    dos: 'firewall', interception: 'encryption', sqli: 'pentest',
  };
  const THREAT_FEEDBACK = {
    malware: 'Anti-malware software scans for, blocks and removes malicious programs such as viruses and ransomware.',
    phishing: "Phishing relies on tricking a person, so there's no single technical fix — but user access levels limit the damage if a tricked user's account is compromised.",
    bruteforce: 'Strong passwords make guessing harder, and locking the account after repeated failed attempts stops automated guessing outright.',
    dos: 'A firewall can monitor network traffic and block the flood of suspicious requests a DoS attack sends.',
    interception: "Encryption doesn't STOP data being intercepted — it makes the intercepted data unreadable without the key, so the data stays protected even if it's caught.",
    sqli: 'Penetration testing deliberately tries attacks like SQL injection against a system to find and fix the weakness before a real attacker does.',
  };

  const ROUNDS_THREAT_FIRST = [
    { threat: 'malware', scenario: 'A student plugs in a USB stick found on the bus. Within minutes, files across the school network start disappearing.' },
    { threat: 'malware', scenario: 'Every file on an office computer is suddenly locked, with a message demanding payment to unlock them.' },
    { threat: 'phishing', scenario: "An email claiming to be from a bank asks the user to 'confirm their password' by clicking a link." },
    { threat: 'phishing', scenario: 'A text message claims a parcel delivery failed and asks for card details to reschedule it.' },
    { threat: 'bruteforce', scenario: 'A program tries thousands of password combinations per second against a login page.' },
    { threat: 'dos', scenario: "A website is flooded with so many fake requests at once that real customers can't load the page." },
    { threat: 'interception', scenario: "An attacker on public airport Wi-Fi reads the contents of other users' unencrypted messages as they cross the network." },
    { threat: 'sqli', scenario: "A user types ' OR '1'='1 into a login box and gains access without a real password." },
  ];
  const ROUNDS_DEFENCE_FIRST = [
    { defence: 'antimalware', scenario: 'Software installed on every school computer scans files and blocks known malicious programs.' },
    { defence: 'firewall', scenario: 'A device monitors network traffic and blocks anything that looks suspicious before it reaches the network.' },
    { defence: 'passwords', scenario: 'A login system demands a long, complex password and locks the account after five failed attempts.' },
    { defence: 'accesslevels', scenario: "A normal user can view only their own data, but only an administrator can view or edit everyone's data." },
    { defence: 'encryption', scenario: "Data is scrambled using a key before it's sent, so anyone who intercepts it sees only meaningless characters." },
    { defence: 'pentest', scenario: 'A hired specialist deliberately tries to break into a system the same way a criminal would, then reports the weaknesses found.' },
    { defence: 'physical', scenario: 'Server rooms are kept locked, with swipe-card entry and CCTV covering the door.' },
    { defence: 'accesslevels', scenario: "Only the HR team's logins can open the payroll database; everyone else's login is refused." },
  ];

  // Pure: choose 6 defence buttons for a threat-first round (correct + 5 random others).
  function pickDefenceOptions(correctId) {
    const others = Object.keys(DEFENCES).filter(id => id !== correctId);
    const five = shuffle(others).slice(0, 5);
    return shuffle([correctId].concat(five));
  }

  // Pure: grade a threat-first answer.
  function gradeThreatRound(round, selectedDefenceId) {
    const best = THREAT_BEST_DEFENCE[round.threat];
    if (selectedDefenceId === best) return { correct: true, message: THREAT_FEEDBACK[round.threat] };
    const alsoLimits = (DEFENCE_LIMITS[selectedDefenceId] || []).indexOf(round.threat) !== -1;
    if (alsoLimits) {
      return { correct: false, message: DEFENCES[selectedDefenceId] + ' does help here too, but ' + DEFENCES[best] + ' is the best match. ' + THREAT_FEEDBACK[round.threat] };
    }
    return { correct: false, message: DEFENCES[selectedDefenceId] + " doesn't target this threat. " + THREAT_FEEDBACK[round.threat] };
  }

  // Pure: grade a defence-first (multi-select) answer.
  function gradeDefenceFirstRound(round, selectedThreatIds) {
    const correctSet = DEFENCE_LIMITS[round.defence];
    return { correct: sameSet(selectedThreatIds, correctSet), correctSet };
  }

  const TIMER_SECONDS = 15;

  function mountThreatDefence(el0, ctx) {
    injectStyle();
    const mode = (ctx.config && ctx.config.mode === 'defence-first') ? 'defence-first' : 'threat-first';
    const rounds = mode === 'defence-first' ? ROUNDS_DEFENCE_FIRST : ROUNDS_THREAT_FIRST;

    let idx = 0, score = 0, streak = 0, bestStreak = 0, timerOn = false, timerHandle = null, timeLeft = 0, summarised = false;

    const wrap = el('div', 'cslab-msim-threat');
    wrap.appendChild(el('p', 'cslab-msim-intro', mode === 'defence-first'
      ? 'A prevention is shown — tick every threat it helps limit, then Check. That mapping is the exam skill for 1.4.2.'
      : 'A threat is shown — choose the BEST prevention from the six options. Beat the clock if you turn the timer on.'));

    const topBar = el('div', 'cslab-msim-threat-top');
    const scoreEl = el('span', 'cslab-msim-threat-score', 'Score: 0 / ' + rounds.length);
    const streakEl = el('span', 'cslab-msim-threat-streak', 'Streak: 0');
    const timerLabel = el('label', 'cslab-msim-timer-toggle');
    const timerCheckbox = global.document.createElement('input');
    timerCheckbox.type = 'checkbox';
    timerLabel.appendChild(timerCheckbox);
    timerLabel.appendChild(global.document.createTextNode(' ⏱ ' + TIMER_SECONDS + 's timer per question'));
    timerCheckbox.addEventListener('change', () => { timerOn = timerCheckbox.checked; });
    topBar.appendChild(scoreEl);
    topBar.appendChild(streakEl);
    topBar.appendChild(timerLabel);
    wrap.appendChild(topBar);

    const progressEl = el('p', 'cslab-msim-progress');
    wrap.appendChild(progressEl);
    const timerEl = el('p', 'cslab-msim-threat-timer');
    wrap.appendChild(timerEl);
    const body = el('div');
    wrap.appendChild(body);
    el0.appendChild(wrap);

    function clearTimer() {
      if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
      timerEl.textContent = '';
    }

    function startTimer(onExpire) {
      if (!timerOn) return;
      timeLeft = TIMER_SECONDS;
      timerEl.textContent = 'Time left: ' + timeLeft + 's';
      timerHandle = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) { clearTimer(); onExpire(); return; }
        timerEl.textContent = 'Time left: ' + timeLeft + 's';
      }, 1000);
    }

    function updateTopBar() {
      scoreEl.textContent = 'Score: ' + score + ' / ' + rounds.length;
      streakEl.textContent = 'Streak: ' + streak + (bestStreak > 1 ? ' (best ' + bestStreak + ')' : '');
    }

    function finishRound(correct, message) {
      clearTimer();
      if (correct) { score++; streak++; bestStreak = Math.max(bestStreak, streak); } else { streak = 0; }
      updateTopBar();
      const feedback = body.querySelector('.cslab-feedback');
      if (feedback) ctx.ui.feedback(feedback, correct, message);
      const nextBtn = ctx.ui.btn(idx === rounds.length - 1 ? 'See results' : 'Next round ▶');
      nextBtn.addEventListener('click', () => { idx++; renderRound(); });
      body.appendChild(nextBtn);
    }

    function renderRound() {
      clearTimer();
      body.innerHTML = '';
      if (idx >= rounds.length) { renderSummary(); return; }
      const round = rounds[idx];
      progressEl.textContent = 'Round ' + (idx + 1) + ' of ' + rounds.length;

      if (mode === 'threat-first') {
        body.appendChild(el('h4', 'cslab-msim-threat-title', THREATS[round.threat]));
        body.appendChild(el('p', 'cslab-msim-threat-scenario', round.scenario));
        body.appendChild(el('p', 'cslab-msim-threat-instruction', 'Choose the BEST prevention:'));
        const optRow = el('div', 'cslab-msim-threat-options');
        const options = pickDefenceOptions(THREAT_BEST_DEFENCE[round.threat]);
        options.forEach(defId => {
          const b = ctx.ui.btn(DEFENCES[defId]);
          b.addEventListener('click', () => {
            optRow.querySelectorAll('.cslab-btn').forEach(n => { n.disabled = true; });
            const result = gradeThreatRound(round, defId);
            b.classList.add(result.correct ? 'correct' : 'wrong');
            if (!result.correct) {
              const correctBtn = Array.prototype.find.call(optRow.children, n => n.textContent === DEFENCES[THREAT_BEST_DEFENCE[round.threat]]);
              if (correctBtn) correctBtn.classList.add('correct');
            }
            finishRound(result.correct, result.message);
          });
          optRow.appendChild(b);
        });
        body.appendChild(optRow);
        body.appendChild(el('p', 'cslab-feedback'));
        startTimer(() => {
          optRow.querySelectorAll('.cslab-btn').forEach(n => { n.disabled = true; });
          const best = THREAT_BEST_DEFENCE[round.threat];
          const correctBtn = Array.prototype.find.call(optRow.children, n => n.textContent === DEFENCES[best]);
          if (correctBtn) correctBtn.classList.add('correct');
          finishRound(false, "Time's up! " + THREAT_FEEDBACK[round.threat]);
        });
      } else {
        body.appendChild(el('h4', 'cslab-msim-threat-title', DEFENCES[round.defence]));
        body.appendChild(el('p', 'cslab-msim-threat-scenario', round.scenario));
        body.appendChild(el('p', 'cslab-msim-threat-instruction', 'Tick every threat this helps limit, then Check:'));
        const checksWrap = el('div', 'cslab-msim-threat-checks');
        Object.keys(THREATS).forEach(tid => {
          const label = el('label', 'cslab-msim-check');
          const cb = global.document.createElement('input');
          cb.type = 'checkbox'; cb.value = tid;
          label.appendChild(cb);
          label.appendChild(global.document.createTextNode(THREATS[tid]));
          checksWrap.appendChild(label);
        });
        body.appendChild(checksWrap);
        const checkBtn = ctx.ui.btn('Check');
        body.appendChild(checkBtn);
        body.appendChild(el('p', 'cslab-feedback'));

        function submit() {
          const selected = Array.prototype.slice.call(checksWrap.querySelectorAll('input:checked')).map(n => n.value);
          checksWrap.querySelectorAll('input').forEach(n => { n.disabled = true; });
          checkBtn.disabled = true;
          const result = gradeDefenceFirstRound(round, selected);
          const correctLabel = result.correctSet.map(t => THREATS[t]).join(', ');
          const message = (result.correct ? 'Correct — ' : 'Not quite — ') +
            DEFENCES[round.defence] + ' best limits: ' + correctLabel + '.';
          finishRound(result.correct, message);
        }
        checkBtn.addEventListener('click', submit);
        startTimer(() => { checkBtn.disabled = true; submit(); });
      }
    }

    function renderSummary() {
      body.innerHTML = '';
      const summary = el('div', 'cslab-msim-summary');
      summary.appendChild(el('p', null, '🏁 Final score: ' + score + ' / ' + rounds.length));
      summary.appendChild(el('p', null, 'Best streak: ' + bestStreak));
      const again = ctx.ui.btn('Play again');
      again.addEventListener('click', () => { idx = 0; score = 0; streak = 0; bestStreak = 0; updateTopBar(); renderRound(); });
      summary.appendChild(again);
      body.appendChild(summary);
      progressEl.textContent = 'Finished';
      if (!summarised) {
        summarised = true;
        ctx.complete({ mode, score });
      }
    }

    updateTopBar();
    renderRound();
  }

  // ── Registration (skipped outside the browser) ─────────────────────
  if (global && global.CsLab) {
    global.CsLab.registerTool('fde-sim', { title: 'Fetch–Execute Simulator', icon: '⚙️', mount: mountFde });
    global.CsLab.registerTool('storage-chooser', { title: 'Storage Chooser', icon: '💾', mount: mountStorageChooser });
    global.CsLab.registerTool('threat-defence', { title: 'Threat vs Defence', icon: '🛡️', mount: mountThreatDefence });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      buildFdeSteps, FDE_PROGRAM,
      gradeStorageChoice, STORAGE_SCENARIOS,
      pickDefenceOptions, gradeThreatRound, gradeDefenceFirstRound,
      THREATS, DEFENCES, DEFENCE_LIMITS, THREAT_BEST_DEFENCE,
      ROUNDS_THREAT_FIRST, ROUNDS_DEFENCE_FIRST,
      sameSet, shuffle,
    };
  }
})(typeof window !== 'undefined' ? window : this);
