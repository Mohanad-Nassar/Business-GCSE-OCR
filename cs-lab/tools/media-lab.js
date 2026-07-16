// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Media Lab (T8, CS-CONTENT-PLAN.md §7.1)
// Registers THREE tool ids in one file:
//   'media-bitmap'      — 1.2.6 Images
//   'media-sound'       — 1.2.7 Sound
//   'media-compression' — 1.2.8 Compression
//
// Wrapped as (function (global) { ... })(window) so the pure helpers are
// unit-testable under plain Node via require() — CsLab.registerTool calls
// are skipped when there is no global.CsLab (i.e. outside the browser).
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  function el(tag, cls, text) {
    const n = global.document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function injectStyle() {
    if (global.document.getElementById('cslab-media-style')) return;
    const style = global.document.createElement('style');
    style.id = 'cslab-media-style';
    style.textContent = [
      '.cslab-media-intro { color: var(--mid); font-size: 14px; margin: 0 0 14px; }',
      '.cslab-media-section { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 18px; }',
      '.cslab-media-section h4 { margin: 0 0 10px; }',
      '.cslab-media-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }',
      '.cslab-media-toggle-btn { min-height: 44px; padding: 8px 14px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--card-bg); color: var(--ink); font-family: inherit; font-size: 13px; cursor: pointer; }',
      '.cslab-media-toggle-btn.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, var(--card-bg)); font-weight: 600; }',
      // bitmap grid
      '.cslab-media-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; max-width: 352px; margin: 0 0 12px; }',
      '.cslab-media-cell { aspect-ratio: 1; min-width: 36px; min-height: 36px; padding: 0; border: 1px solid var(--border); cursor: pointer; }',
      '.cslab-media-cell.wrong { outline: 3px solid #c0392b; outline-offset: -3px; }',
      '.cslab-media-binary { font-family: "DM Mono", Consolas, monospace; font-size: 11px; line-height: 1.6; background: var(--cream); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; white-space: pre; overflow-x: auto; margin: 0 0 10px; }',
      '.cslab-media-readout { font-size: 13.5px; margin: 0 0 6px; }',
      '.cslab-media-note { color: var(--mid); font-size: 12px; margin: 0 0 10px; }',
      // sound
      '.cslab-media-canvas { width: 100%; max-width: 640px; height: 200px; background: var(--cream); border: 1px solid var(--border); border-radius: 8px; display: block; margin-bottom: 10px; }',
      '.cslab-media-slider-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; max-width: 420px; }',
      '.cslab-media-slider-row label { font-size: 13px; font-weight: 600; }',
      '.cslab-media-slider-row input[type=range] { width: 100%; min-height: 32px; }',
      '.cslab-media-quiz { display: flex; flex-direction: column; gap: 14px; }',
      '.cslab-media-quiz-q { border-top: 1px solid var(--border); padding-top: 12px; }',
      '.cslab-media-quiz-q label { display: block; margin-bottom: 6px; font-size: 13.5px; }',
      '.cslab-media-quiz-q input[type=number], .cslab-media-quiz-q input[type=text] { min-height: 40px; padding: 6px 10px; border: 1.5px solid var(--border); border-radius: 6px; background: var(--card-bg); color: var(--ink); font-family: inherit; width: 140px; }',
      // compression
      '.cslab-media-lossless-input { width: 100%; box-sizing: border-box; min-height: 44px; padding: 8px 12px; border: 1.5px solid var(--border); border-radius: 8px; background: var(--card-bg); color: var(--ink); font-family: inherit; font-size: 14px; margin-bottom: 10px; }',
      '.cslab-media-encoded { font-family: "DM Mono", Consolas, monospace; background: var(--cream); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; word-break: break-all; margin-bottom: 8px; }',
      '.cslab-media-ratio { font-size: 13px; color: var(--mid); margin: 0 0 10px; }',
      '.cslab-media-lossy-canvases { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px; }',
      '.cslab-media-lossy-canvases canvas { border: 1px solid var(--border); border-radius: 6px; background: var(--cream); }',
      '.cslab-media-size-bar-wrap { max-width: 320px; margin-bottom: 12px; }',
      '.cslab-media-size-bar-track { background: var(--border); border-radius: 99px; height: 12px; overflow: hidden; }',
      '.cslab-media-size-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--success)); border-radius: 99px; transition: width .2s ease; }',
      '.cslab-media-mcq { display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px; }',
      '.cslab-media-mcq-opt { display: flex; align-items: center; gap: 8px; min-height: 40px; }',
    ].join('\n');
    global.document.head.appendChild(style);
  }

  // ══════════════════════════════════════════════════════════
  // MEDIA-BITMAP — pixel grid + binary + Decode Challenge (1.2.6)
  // ══════════════════════════════════════════════════════════

  const BMP_W = 8, BMP_H = 8;
  const BMP_PALETTES = {
    1: ['#ffffff', '#000000'],
    2: ['#ffffff', '#aaaaaa', '#555555', '#000000'],
  };

  function makeEmptyGrid(w, h) {
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill(0));
    return g;
  }

  // Pure: pixel grid (row-major palette indices) -> binary string, rows joined by \n.
  function pixelsToBinary(grid, depth) {
    return grid.map(row => row.map(v => v.toString(2).padStart(depth, '0')).join('')).join('\n');
  }

  // Pure: inverse of pixelsToBinary.
  function binaryToPixels(binaryStr, depth, width, height) {
    const rows = (binaryStr || '').split('\n');
    const grid = [];
    for (let y = 0; y < height; y++) {
      const rowStr = rows[y] || '';
      const row = [];
      for (let x = 0; x < width; x++) {
        const chunk = rowStr.substr(x * depth, depth);
        row.push(chunk.length === depth ? parseInt(chunk, 2) : 0);
      }
      grid.push(row);
    }
    return grid;
  }

  function imageFileSizeBits(width, height, depth) { return width * height * depth; }
  function imageFileSizeBytes(width, height, depth) { return imageFileSizeBits(width, height, depth) / 8; }

  function randomBinaryString(width, height, depth) {
    const rows = [];
    for (let y = 0; y < height; y++) {
      let row = '';
      for (let x = 0; x < width; x++) {
        let v = Math.floor(Math.random() * Math.pow(2, depth));
        row += v.toString(2).padStart(depth, '0');
      }
      rows.push(row);
    }
    return rows.join('\n');
  }

  // Pure: compare two equal-sized grids cell by cell.
  function comparePixelGrids(a, b) {
    let correct = 0, total = 0;
    const wrong = [];
    for (let y = 0; y < a.length; y++) {
      for (let x = 0; x < a[y].length; x++) {
        total++;
        if (a[y][x] === (b[y] || [])[x]) correct++;
        else wrong.push([x, y]);
      }
    }
    return { correct, total, wrong };
  }

  function renderBitmapGrid(grid, depth, onCellClick) {
    const wrap = el('div', 'cslab-media-grid');
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const btn = global.document.createElement('button');
        btn.type = 'button';
        btn.className = 'cslab-media-cell';
        btn.style.background = BMP_PALETTES[depth][grid[y][x]];
        btn.setAttribute('aria-label', 'Pixel row ' + y + ' column ' + x);
        if (onCellClick) btn.addEventListener('click', () => onCellClick(x, y, btn));
        wrap.appendChild(btn);
      }
    }
    return wrap;
  }

  function mountMediaBitmap(el0, ctx) {
    injectStyle();
    let depth = 1;
    let paintGrid = makeEmptyGrid(BMP_W, BMP_H);
    let challengeTarget = randomBinaryString(BMP_W, BMP_H, depth);
    let challengeGrid = makeEmptyGrid(BMP_W, BMP_H);

    const wrap = el('div', 'cslab-media-bitmap');
    wrap.appendChild(el('p', 'cslab-media-intro',
      'Every pixel in a bitmap image is stored as a binary colour code. Click pixels to paint them, and watch the binary string and file size change live.'));

    const depthRow = el('div', 'cslab-media-row');
    depthRow.appendChild(el('span', null, 'Colour depth:'));
    const depth1Btn = el('button', 'cslab-media-toggle-btn selected', '1-bit (2 colours)');
    const depth2Btn = el('button', 'cslab-media-toggle-btn', '2-bit (4 colours)');
    depth1Btn.type = 'button'; depth2Btn.type = 'button';
    depthRow.appendChild(depth1Btn);
    depthRow.appendChild(depth2Btn);
    wrap.appendChild(depthRow);
    wrap.appendChild(el('p', 'cslab-media-note',
      'Switching colour depth clears both grids below, because it changes how many bits describe each pixel.'));

    // Paint section
    const paintSection = el('div', 'cslab-media-section');
    paintSection.appendChild(el('h4', null, '🎨 Paint'));
    let gridHost = el('div');
    paintSection.appendChild(gridHost);
    const binaryOut = el('div', 'cslab-media-binary');
    paintSection.appendChild(binaryOut);
    const sizeOut = el('p', 'cslab-media-readout');
    paintSection.appendChild(sizeOut);
    paintSection.appendChild(el('p', 'cslab-media-note', 'Real image files also store metadata (width, height, the colour palette) on top of this, which adds a little more.'));
    wrap.appendChild(paintSection);

    // Decode Challenge section
    const challengeSection = el('div', 'cslab-media-section');
    challengeSection.appendChild(el('h4', null, '🧩 Decode Challenge'));
    challengeSection.appendChild(el('p', null, 'Colour the grid below to match this binary string:'));
    const targetOut = el('div', 'cslab-media-binary');
    challengeSection.appendChild(targetOut);
    let challengeHost = el('div');
    challengeSection.appendChild(challengeHost);
    const challengeRow = el('div', 'cslab-media-row');
    const checkBtn = ctx.ui.btn('Check');
    const newBtn = ctx.ui.btn('New challenge', 'secondary');
    challengeRow.appendChild(checkBtn);
    challengeRow.appendChild(newBtn);
    challengeSection.appendChild(challengeRow);
    const challengeFeedback = el('p', 'cslab-feedback');
    challengeSection.appendChild(challengeFeedback);
    wrap.appendChild(challengeSection);

    el0.appendChild(wrap);

    function renderPaint() {
      binaryOut.textContent = pixelsToBinary(paintGrid, depth);
      const bits = imageFileSizeBits(BMP_W, BMP_H, depth);
      sizeOut.textContent = BMP_W + '×' + BMP_H + ' pixels × ' + depth + '-bit depth = ' + bits + ' bits = ' + imageFileSizeBytes(BMP_W, BMP_H, depth) + ' bytes.';
      gridHost.innerHTML = '';
      gridHost.appendChild(renderBitmapGrid(paintGrid, depth, (x, y) => {
        paintGrid[y][x] = (paintGrid[y][x] + 1) % BMP_PALETTES[depth].length;
        renderPaint();
      }));
    }

    function renderChallenge() {
      targetOut.textContent = challengeTarget;
      challengeHost.innerHTML = '';
      challengeHost.appendChild(renderBitmapGrid(challengeGrid, depth, (x, y) => {
        challengeGrid[y][x] = (challengeGrid[y][x] + 1) % BMP_PALETTES[depth].length;
        challengeHost.querySelectorAll('.cslab-media-cell').forEach(c => c.classList.remove('wrong'));
        challengeFeedback.textContent = '';
        renderChallengeGridOnly();
      }));
    }

    function renderChallengeGridOnly() {
      // Repaint just the swatches (avoid losing click handlers by not rebuilding).
      const cells = challengeHost.querySelectorAll('.cslab-media-cell');
      let i = 0;
      for (let y = 0; y < challengeGrid.length; y++) {
        for (let x = 0; x < challengeGrid[y].length; x++) {
          cells[i].style.background = BMP_PALETTES[depth][challengeGrid[y][x]];
          i++;
        }
      }
    }

    depth1Btn.addEventListener('click', () => {
      depth = 1;
      depth1Btn.classList.add('selected'); depth2Btn.classList.remove('selected');
      paintGrid = makeEmptyGrid(BMP_W, BMP_H);
      challengeGrid = makeEmptyGrid(BMP_W, BMP_H);
      challengeTarget = randomBinaryString(BMP_W, BMP_H, depth);
      renderPaint(); renderChallenge();
    });
    depth2Btn.addEventListener('click', () => {
      depth = 2;
      depth2Btn.classList.add('selected'); depth1Btn.classList.remove('selected');
      paintGrid = makeEmptyGrid(BMP_W, BMP_H);
      challengeGrid = makeEmptyGrid(BMP_W, BMP_H);
      challengeTarget = randomBinaryString(BMP_W, BMP_H, depth);
      renderPaint(); renderChallenge();
    });

    checkBtn.addEventListener('click', () => {
      const target = binaryToPixels(challengeTarget, depth, BMP_W, BMP_H);
      const result = comparePixelGrids(target, challengeGrid);
      const cells = challengeHost.querySelectorAll('.cslab-media-cell');
      cells.forEach(c => c.classList.remove('wrong'));
      result.wrong.forEach(([x, y]) => { cells[y * BMP_W + x].classList.add('wrong'); });
      const allCorrect = result.correct === result.total;
      ctx.ui.feedback(challengeFeedback, allCorrect,
        allCorrect ? '✓ All ' + result.total + ' pixels match!' : (result.correct + ' / ' + result.total + ' pixels correct — the wrong ones are outlined.'));
      ctx.complete({ depth, correct: result.correct, total: result.total });
    });

    newBtn.addEventListener('click', () => {
      challengeGrid = makeEmptyGrid(BMP_W, BMP_H);
      challengeTarget = randomBinaryString(BMP_W, BMP_H, depth);
      challengeFeedback.textContent = '';
      renderChallenge();
    });

    renderPaint();
    renderChallenge();
  }

  // ══════════════════════════════════════════════════════════
  // MEDIA-SOUND — sampling lab (1.2.7)
  // ══════════════════════════════════════════════════════════

  // Pure: number of samples taken across a duration at a given rate.
  function sampleCount(rateHz, durationS) { return Math.round(rateHz * durationS); }

  // Pure: quantise a value in [-1, 1] to one of 2^depthBits levels.
  function quantizeSample(value, depthBits) {
    const levels = Math.pow(2, depthBits);
    const step = 2 / levels;
    const idx = Math.min(levels - 1, Math.max(0, Math.floor((value + 1) / step)));
    return -1 + idx * step + step / 2;
  }

  // Pure: file-size formula from Appendix B 1.2.3 — rate × duration × depth.
  function soundFileSizeBits(rateHz, durationS, depthBits) { return rateHz * durationS * depthBits; }
  function soundFileSizeBytes(rateHz, durationS, depthBits) { return soundFileSizeBits(rateHz, durationS, depthBits) / 8; }

  function describeSoundQuality(rateHz, depthBits) {
    const rateScore = rateHz >= 32 ? 2 : rateHz >= 12 ? 1 : 0;
    const depthScore = depthBits >= 3 ? 2 : depthBits >= 2 ? 1 : 0;
    const total = rateScore + depthScore;
    if (total >= 3) return 'Close to the original wave — a high sample rate captures its shape accurately, and enough bit depth gives smooth volume levels. Bigger file.';
    if (total >= 1) return 'A rough compromise — noticeably stepped, but still recognisable. Medium file size.';
    return 'Very low quality — few samples and few volume levels make the sound jagged and thin. Tiny file.';
  }

  const SOUND_QUESTIONS = [
    { text: 'A 5-second clip is recorded at 8 Hz with 2-bit depth. What is the file size in BITS?', answer: soundFileSizeBits(8, 5, 2) },
    { text: 'A 5-second clip is recorded at 16 Hz with 4-bit depth. What is the file size in BITS?', answer: soundFileSizeBits(16, 5, 4) },
    { text: 'A 5-second clip is recorded at 32 Hz with 1-bit depth. What is the file size in BYTES?', answer: soundFileSizeBytes(32, 5, 1) },
  ];

  function drawSoundCanvas(canvas, rateHz, depthBits) {
    const ctx2d = canvas.getContext('2d');
    const cssW = canvas.clientWidth || 640, cssH = canvas.clientHeight || 200;
    const dpr = global.devicePixelRatio || 1;
    canvas.width = cssW * dpr; canvas.height = cssH * dpr;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2d.clearRect(0, 0, cssW, cssH);

    const midY = cssH / 2, amp = cssH * 0.38;
    const freqHz = 2; // two full cycles across the 1-second window, for a clearly "smooth" wave
    const wave = t => Math.sin(2 * Math.PI * freqHz * t);

    // Smooth analogue wave.
    ctx2d.beginPath();
    ctx2d.globalAlpha = 0.5;
    ctx2d.lineWidth = 2;
    for (let px = 0; px <= cssW; px++) {
      const t = px / cssW;
      const y = midY - wave(t) * amp;
      if (px === 0) ctx2d.moveTo(px, y); else ctx2d.lineTo(px, y);
    }
    ctx2d.strokeStyle = getComputedColor(canvas, '--mid');
    ctx2d.stroke();
    ctx2d.globalAlpha = 1;

    // Sampled + quantised staircase.
    const n = sampleCount(rateHz, 1);
    const points = [];
    for (let i = 0; i < n; i++) {
      const t = i / rateHz;
      if (t > 1) break;
      const q = quantizeSample(wave(t), depthBits);
      points.push({ x: (t / 1) * cssW, y: midY - q * amp });
    }
    ctx2d.strokeStyle = getComputedColor(canvas, '--accent');
    ctx2d.fillStyle = getComputedColor(canvas, '--accent');
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    points.forEach((p, i) => {
      if (i === 0) { ctx2d.moveTo(p.x, p.y); return; }
      const prev = points[i - 1];
      ctx2d.lineTo(p.x, prev.y); // horizontal hold
      ctx2d.lineTo(p.x, p.y);    // step to new level
    });
    ctx2d.stroke();
    points.forEach(p => {
      ctx2d.beginPath();
      ctx2d.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx2d.fill();
    });
  }

  function getComputedColor(node, varName) {
    const v = global.getComputedStyle(node).getPropertyValue(varName);
    return v ? v.trim() : '#888888';
  }

  function mountMediaSound(el0, ctx) {
    injectStyle();
    let rate = 16, depth = 2;

    const wrap = el('div', 'cslab-media-sound');
    wrap.appendChild(el('p', 'cslab-media-intro',
      'Analogue sound is sampled at fixed points in time (sample rate) and each sample is rounded to the nearest of a fixed number of volume levels (bit depth). The dots below are the samples; the orange line is what actually gets stored.'));

    const canvas = global.document.createElement('canvas');
    canvas.className = 'cslab-media-canvas';
    wrap.appendChild(canvas);

    const rateRow = el('div', 'cslab-media-slider-row');
    const rateLabel = el('label', null, 'Sample rate: 16 Hz');
    const rateSlider = global.document.createElement('input');
    rateSlider.type = 'range'; rateSlider.min = '4'; rateSlider.max = '64'; rateSlider.step = '1'; rateSlider.value = String(rate);
    rateRow.appendChild(rateLabel); rateRow.appendChild(rateSlider);
    wrap.appendChild(rateRow);

    const depthRow = el('div', 'cslab-media-slider-row');
    const depthLabel = el('label', null, 'Bit depth: 2 bits (4 levels)');
    const depthSlider = global.document.createElement('input');
    depthSlider.type = 'range'; depthSlider.min = '1'; depthSlider.max = '4'; depthSlider.step = '1'; depthSlider.value = String(depth);
    depthRow.appendChild(depthLabel); depthRow.appendChild(depthSlider);
    wrap.appendChild(depthRow);

    const samplesOut = el('p', 'cslab-media-readout');
    const sizeOut = el('p', 'cslab-media-readout');
    const qualityOut = el('p', 'cslab-media-readout');
    wrap.appendChild(samplesOut); wrap.appendChild(sizeOut); wrap.appendChild(qualityOut);

    function redraw() {
      samplesOut.textContent = 'Samples taken in 1 second: ' + sampleCount(rate, 1);
      const bits = soundFileSizeBits(rate, 5, depth);
      sizeOut.textContent = 'File size for a 5-second clip: ' + rate + ' × 5 × ' + depth + ' = ' + bits + ' bits = ' + soundFileSizeBytes(rate, 5, depth) + ' bytes.';
      qualityOut.textContent = 'Quality: ' + describeSoundQuality(rate, depth);
      drawSoundCanvas(canvas, rate, depth);
    }
    rateSlider.addEventListener('input', () => { rate = parseInt(rateSlider.value, 10); rateLabel.textContent = 'Sample rate: ' + rate + ' Hz'; redraw(); });
    depthSlider.addEventListener('input', () => { depth = parseInt(depthSlider.value, 10); depthLabel.textContent = 'Bit depth: ' + depth + ' bit' + (depth === 1 ? '' : 's') + ' (' + Math.pow(2, depth) + ' levels)'; redraw(); });

    // Quiz
    const quizSection = el('div', 'cslab-media-section');
    quizSection.appendChild(el('h4', null, '✏️ Check your understanding'));
    const quizWrap = el('div', 'cslab-media-quiz');
    let answeredCount = 0;
    let completed = false;
    SOUND_QUESTIONS.forEach((q, i) => {
      const qEl = el('div', 'cslab-media-quiz-q');
      const label = el('label', null, (i + 1) + '. ' + q.text);
      qEl.appendChild(label);
      const input = global.document.createElement('input');
      input.type = 'number'; input.step = 'any';
      qEl.appendChild(input);
      const checkBtn = ctx.ui.btn('Check');
      qEl.appendChild(checkBtn);
      const feedback = el('p', 'cslab-feedback');
      qEl.appendChild(feedback);
      let alreadyAnswered = false;
      checkBtn.addEventListener('click', () => {
        const val = parseFloat(input.value);
        const ok = !isNaN(val) && Math.abs(val - q.answer) < 1e-9;
        ctx.ui.feedback(feedback, ok, ok ? 'Correct!' : ('Not quite — the answer is ' + q.answer + '.'));
        if (!alreadyAnswered) { alreadyAnswered = true; answeredCount++; }
        if (answeredCount === SOUND_QUESTIONS.length && !completed) {
          completed = true;
          ctx.complete({ tool: 'media-sound' });
        }
      });
      quizWrap.appendChild(qEl);
    });
    quizSection.appendChild(quizWrap);
    wrap.appendChild(quizSection);

    el0.appendChild(wrap);
    redraw();
  }

  // ══════════════════════════════════════════════════════════
  // MEDIA-COMPRESSION — lossless (RLE) + lossy demos (1.2.8)
  // NR (Appendix B 1.2.8): performing specific compression algorithms is
  // not examined — this RLE demo is a visual illustration of "it squashes
  // down and comes back exactly", not a technique students must reproduce.
  // ══════════════════════════════════════════════════════════

  // Pure: run-length encode. Format per run is "<count>:<char>" so the
  // decoder can always read digits up to the next ':' then take exactly
  // one character afterwards — that stays unambiguous even if the
  // original text itself contains digits or colons.
  function rleEncode(str) {
    if (!str) return '';
    let out = '';
    let i = 0;
    while (i < str.length) {
      let j = i;
      while (j < str.length && str[j] === str[i]) j++;
      out += (j - i) + ':' + str[i];
      i = j;
    }
    return out;
  }

  // Pure: inverse of rleEncode.
  function rleDecode(encoded) {
    if (!encoded) return '';
    let out = '';
    let i = 0;
    while (i < encoded.length) {
      let numStr = '';
      while (i < encoded.length && encoded[i] !== ':') { numStr += encoded[i]; i++; }
      i++; // skip ':'
      const ch = encoded[i]; i++;
      const count = parseInt(numStr, 10) || 0;
      out += ch.repeat(count);
    }
    return out;
  }

  function compressionRatio(original, encoded) {
    if (!original.length) return 0;
    return encoded.length / original.length;
  }

  // Pure, illustrative only: a monotonically-decreasing size estimate for the
  // lossy demo's shrinking bar (not an exam formula — bitmap/sound own those).
  function estimateLossySizePercent(quality) {
    const q = Math.max(0, Math.min(100, quality));
    return Math.round(8 + 92 * Math.pow(q / 100, 1.6));
  }

  const COMPRESSION_MCQS = [
    { text: 'Streaming a film over the internet', answer: 'lossy' },
    { text: 'The code of a computer program', answer: 'lossless' },
    { text: 'A holiday photo attached to an email', answer: 'lossy' },
    { text: "A hospital's medical scan used for diagnosis", answer: 'lossless' },
  ];

  function drawLossyImage(canvas, quality) {
    const size = 160;
    canvas.width = size; canvas.height = size;
    const ctx2d = canvas.getContext('2d');

    // Base "smiley on a gradient" image, always drawn at full detail first.
    const base = global.document.createElement('canvas');
    base.width = size; base.height = size;
    const bctx = base.getContext('2d');
    const grad = bctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#ffd166'); grad.addColorStop(1, '#ef476f');
    bctx.fillStyle = grad;
    bctx.fillRect(0, 0, size, size);
    bctx.fillStyle = '#222';
    bctx.beginPath(); bctx.arc(size * 0.35, size * 0.4, size * 0.06, 0, Math.PI * 2); bctx.fill();
    bctx.beginPath(); bctx.arc(size * 0.65, size * 0.4, size * 0.06, 0, Math.PI * 2); bctx.fill();
    bctx.beginPath(); bctx.arc(size * 0.5, size * 0.55, size * 0.28, 0.15 * Math.PI, 0.85 * Math.PI); bctx.lineWidth = size * 0.05; bctx.strokeStyle = '#222'; bctx.stroke();

    const q = Math.max(1, Math.min(100, quality));
    const block = Math.max(1, Math.round(24 * (1 - q / 100)) + 1); // pixelation block size
    const levels = Math.max(2, Math.round(2 + (q / 100) * 6));      // posterise levels per channel

    const small = global.document.createElement('canvas');
    const sw = Math.max(1, Math.round(size / block));
    small.width = sw; small.height = sw;
    small.getContext('2d').drawImage(base, 0, 0, sw, sw);
    const imgData = small.getContext('2d').getImageData(0, 0, sw, sw);
    const step = 255 / (levels - 1);
    for (let i = 0; i < imgData.data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        imgData.data[i + c] = Math.round(Math.round(imgData.data[i + c] / step) * step);
      }
    }
    small.getContext('2d').putImageData(imgData, 0, 0);

    ctx2d.imageSmoothingEnabled = false;
    ctx2d.clearRect(0, 0, size, size);
    ctx2d.drawImage(small, 0, 0, size, size);
  }

  function mountMediaCompression(el0, ctx) {
    injectStyle();
    const wrap = el('div', 'cslab-media-compression');

    // Lossless demo
    const losslessSection = el('div', 'cslab-media-section');
    losslessSection.appendChild(el('h4', null, '🗜️ Lossless: text (run-length demo)'));
    losslessSection.appendChild(el('p', 'cslab-media-intro', "Type some text — repeated letters get squashed into count:letter pairs. Press Restore to prove nothing was lost."));
    const textInput = global.document.createElement('input');
    textInput.type = 'text'; textInput.className = 'cslab-media-lossless-input';
    textInput.placeholder = 'e.g. aaaabbbccccccd';
    textInput.value = 'aaaabbbccccccd';
    losslessSection.appendChild(textInput);
    const encodedOut = el('div', 'cslab-media-encoded');
    losslessSection.appendChild(encodedOut);
    const ratioOut = el('p', 'cslab-media-ratio');
    losslessSection.appendChild(ratioOut);
    const restoreRow = el('div', 'cslab-media-row');
    const restoreBtn = ctx.ui.btn('Restore ▶');
    restoreRow.appendChild(restoreBtn);
    losslessSection.appendChild(restoreRow);
    const restoreOut = el('p', 'cslab-feedback');
    losslessSection.appendChild(restoreOut);
    losslessSection.appendChild(el('p', 'cslab-media-note',
      "This simple demo only shows one way lossless compression CAN work — you don't need to reproduce it by hand for the exam. Real tools (like ZIP) use cleverer methods, and if there's little repetition the result can even end up bigger than the original."));
    wrap.appendChild(losslessSection);

    function refreshLossless() {
      const text = textInput.value;
      const encoded = rleEncode(text);
      encodedOut.textContent = encoded || '(type something above)';
      const ratio = compressionRatio(text, encoded);
      ratioOut.textContent = text
        ? ('Original: ' + text.length + ' characters → Compressed: ' + encoded.length + ' characters (ratio ' + ratio.toFixed(2) + ').')
        : '';
      restoreOut.textContent = '';
    }
    textInput.addEventListener('input', refreshLossless);
    restoreBtn.addEventListener('click', () => {
      const restored = rleDecode(encodedOut.textContent === '(type something above)' ? '' : encodedOut.textContent);
      const ok = restored === textInput.value;
      ctx.ui.feedback(restoreOut, ok, ok ? '✓ Restored exactly — "' + restored + '" — nothing was lost.' : 'Restore mismatch (try re-typing your text).');
    });
    refreshLossless();

    // Lossy demo
    const lossySection = el('div', 'cslab-media-section');
    lossySection.appendChild(el('h4', null, '🖼️ Lossy: image quality slider'));
    lossySection.appendChild(el('p', 'cslab-media-intro', 'Drag the slider down — detail is thrown away to shrink the file. The discarded detail never comes back.'));
    const canvasRow = el('div', 'cslab-media-lossy-canvases');
    const originalCanvas = global.document.createElement('canvas');
    const lossyCanvas = global.document.createElement('canvas');
    canvasRow.appendChild(originalCanvas);
    canvasRow.appendChild(lossyCanvas);
    lossySection.appendChild(canvasRow);
    const qualityRow = el('div', 'cslab-media-slider-row');
    const qualityLabel = el('label', null, 'Quality: 100%');
    const qualitySlider = global.document.createElement('input');
    qualitySlider.type = 'range'; qualitySlider.min = '5'; qualitySlider.max = '100'; qualitySlider.step = '1'; qualitySlider.value = '100';
    qualityRow.appendChild(qualityLabel); qualityRow.appendChild(qualitySlider);
    lossySection.appendChild(qualityRow);
    const sizeBarWrap = el('div', 'cslab-media-size-bar-wrap');
    sizeBarWrap.appendChild(el('p', 'cslab-media-readout', 'Estimated file size'));
    const sizeTrack = el('div', 'cslab-media-size-bar-track');
    const sizeFill = el('div', 'cslab-media-size-bar-fill');
    sizeTrack.appendChild(sizeFill);
    sizeBarWrap.appendChild(sizeTrack);
    lossySection.appendChild(sizeBarWrap);
    wrap.appendChild(lossySection);

    drawLossyImage(originalCanvas, 100);
    function refreshLossy() {
      const q = parseInt(qualitySlider.value, 10);
      qualityLabel.textContent = 'Quality: ' + q + '%';
      drawLossyImage(lossyCanvas, q);
      sizeFill.style.width = estimateLossySizePercent(q) + '%';
    }
    qualitySlider.addEventListener('input', refreshLossy);
    refreshLossy();

    // MCQs
    const mcqSection = el('div', 'cslab-media-section');
    mcqSection.appendChild(el('h4', null, '✏️ Lossy or lossless?'));
    let completed = false;
    const selections = {};
    COMPRESSION_MCQS.forEach((q, i) => {
      const qEl = el('div', 'cslab-media-mcq');
      qEl.appendChild(el('p', null, (i + 1) + '. ' + q.text));
      ['lossy', 'lossless'].forEach(opt => {
        const optLabel = el('label', 'cslab-media-mcq-opt');
        const radio = global.document.createElement('input');
        radio.type = 'radio'; radio.name = 'cslab-media-mcq-' + i; radio.value = opt;
        radio.addEventListener('change', () => { selections[i] = opt; });
        optLabel.appendChild(radio);
        optLabel.appendChild(global.document.createTextNode(opt === 'lossy' ? 'Lossy' : 'Lossless'));
        qEl.appendChild(optLabel);
      });
      mcqSection.appendChild(qEl);
    });
    const mcqCheckBtn = ctx.ui.btn('Check answers');
    mcqSection.appendChild(mcqCheckBtn);
    const mcqFeedback = el('p', 'cslab-feedback');
    mcqSection.appendChild(mcqFeedback);
    mcqCheckBtn.addEventListener('click', () => {
      let correct = 0;
      COMPRESSION_MCQS.forEach((q, i) => { if (selections[i] === q.answer) correct++; });
      const allAnswered = Object.keys(selections).length === COMPRESSION_MCQS.length;
      if (!allAnswered) {
        ctx.ui.feedback(mcqFeedback, false, 'Answer all four questions first.');
        return;
      }
      ctx.ui.feedback(mcqFeedback, correct === COMPRESSION_MCQS.length, correct + ' / ' + COMPRESSION_MCQS.length + ' correct.');
      if (!completed) { completed = true; ctx.complete({ tool: 'media-compression', score: correct }); }
    });
    wrap.appendChild(mcqSection);

    el0.appendChild(wrap);
  }

  // ── Registration (skipped outside the browser) ─────────────────────
  if (global && global.CsLab) {
    global.CsLab.registerTool('media-bitmap', { title: 'Bitmap Lab', icon: '🖼️', mount: mountMediaBitmap });
    global.CsLab.registerTool('media-sound', { title: 'Sampling Lab', icon: '🔊', mount: mountMediaSound });
    global.CsLab.registerTool('media-compression', { title: 'Compression Lab', icon: '🗜️', mount: mountMediaCompression });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      pixelsToBinary, binaryToPixels, imageFileSizeBits, imageFileSizeBytes,
      randomBinaryString, comparePixelGrids, makeEmptyGrid,
      sampleCount, quantizeSample, soundFileSizeBits, soundFileSizeBytes, describeSoundQuality, SOUND_QUESTIONS,
      rleEncode, rleDecode, compressionRatio, estimateLossySizePercent, COMPRESSION_MCQS,
    };
  }
})(typeof window !== 'undefined' ? window : this);
