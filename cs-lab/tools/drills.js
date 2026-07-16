// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Data Drills (T2, CS-CONTENT-PLAN.md §7.1)
// Registers tool id 'drills'. Mental-arithmetic drills for OCR J277
// 1.2.3 units/file-size, 1.2.4 number representation, 1.2.5 ASCII,
// 1.2.6 image size, 1.2.7 sound size (Appendix B scope only).
//
// Pure generator/marking logic lives at module scope with no DOM
// access, so it can be unit-tested under Node — see the
// module.exports guard at the bottom (never runs in the browser).
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── small helpers ──────────────────────────────────────────────
  function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

  function toBinary8(n) { return (n & 0xFF).toString(2).padStart(8, '0'); }
  function groupBits(bin) { return bin.slice(0, 4) + ' ' + bin.slice(4); }

  function normBinary(raw) {
    const cleaned = String(raw == null ? '' : raw).replace(/\s+/g, '');
    if (!/^[01]+$/.test(cleaned)) return null;
    return cleaned;
  }
  function normHex(raw) {
    const cleaned = String(raw == null ? '' : raw).replace(/\s+/g, '').toUpperCase();
    if (!/^[0-9A-F]+$/.test(cleaned)) return null;
    return cleaned;
  }
  function normInt(raw) {
    const cleaned = String(raw == null ? '' : raw).replace(/[,\s]+/g, '');
    if (!/^-?\d+$/.test(cleaned)) return null;
    return parseInt(cleaned, 10);
  }
  function normYesNo(raw) {
    const c = String(raw == null ? '' : raw).trim().toLowerCase();
    if (['yes', 'y', 'true', '1'].indexOf(c) !== -1) return true;
    if (['no', 'n', 'false', '0'].indexOf(c) !== -1) return false;
    return null;
  }
  function normOrder(raw) {
    const cleaned = String(raw == null ? '' : raw).toUpperCase().replace(/[^A-D]/g, ',');
    const parts = cleaned.split(',').filter(Boolean);
    return parts.join(',');
  }
  function normCodeList(raw) {
    const cleaned = String(raw == null ? '' : raw).replace(/\s+/g, '');
    const parts = cleaned.split(',').filter(Boolean);
    if (!parts.length || !parts.every(p => /^\d+$/.test(p))) return null;
    return parts.map(p => String(parseInt(p, 10))).join(',');
  }

  // ── 1.2.4 — denary / binary / hex ─────────────────────────────
  function genBinDen() {
    const n = randInt(0, 255);
    const bin = toBinary8(n);
    return {
      prompt: 'Convert the 8-bit binary number ' + groupBits(bin) + ' to denary.',
      scaffold: 'places',
      fields: [{
        id: 'ans', label: 'Denary answer', kind: 'text', placeholder: 'e.g. 90',
        check: raw => normInt(raw) === n, correctDisplay: String(n),
      }],
      working: workingBinToDen(bin, n),
    };
  }
  function workingBinToDen(bin, n) {
    const places = [128, 64, 32, 16, 8, 4, 2, 1];
    const parts = [];
    for (let i = 0; i < 8; i++) if (bin[i] === '1') parts.push(places[i]);
    const sumText = parts.length ? parts.join(' + ') + ' = ' + n : 'no bits are set = 0';
    return 'Place values: 128 64 32 16 8 4 2 1 — add the columns with a 1: ' + sumText + '.';
  }

  function genDenBin() {
    const n = randInt(0, 255);
    const bin = toBinary8(n);
    return {
      prompt: 'Convert the denary number ' + n + ' to 8-bit binary.',
      scaffold: 'places',
      fields: [{
        id: 'ans', label: '8-bit binary', kind: 'text', placeholder: 'e.g. 01011010',
        check: raw => normBinary(raw) === bin, correctDisplay: groupBits(bin),
      }],
      working: workingDenToBin(n, bin),
    };
  }
  function workingDenToBin(n, bin) {
    const places = [128, 64, 32, 16, 8, 4, 2, 1];
    let remaining = n;
    const steps = [];
    for (let i = 0; i < 8; i++) {
      const p = places[i];
      if (remaining >= p) { steps.push(p + ' fits → 1'); remaining -= p; }
      else steps.push(p + ' too big → 0');
    }
    return 'Fit the largest place value first: ' + steps.join(', ') + '. Result: ' + groupBits(bin) + ' (remember to pad to 8 digits).';
  }

  function genBinHex() {
    const n = randInt(0, 255);
    const bin = toBinary8(n);
    const hex = n.toString(16).toUpperCase().padStart(2, '0');
    return {
      prompt: 'Convert the 8-bit binary number ' + groupBits(bin) + ' to a 2-digit hex value.',
      fields: [{
        id: 'ans', label: 'Hex answer (2 digits)', kind: 'text', placeholder: 'e.g. 5A',
        check: raw => normHex(raw) === hex, correctDisplay: hex,
      }],
      working: workingBinToHex(bin, hex),
    };
  }
  function workingBinToHex(bin, hex) {
    const hi = bin.slice(0, 4), lo = bin.slice(4);
    return 'Split into nibbles: ' + hi + ' = ' + parseInt(hi, 2).toString(16).toUpperCase() +
      ', ' + lo + ' = ' + parseInt(lo, 2).toString(16).toUpperCase() + ' → ' + hex + '.';
  }

  function genHexDen() {
    const n = randInt(0, 255);
    const hex = n.toString(16).toUpperCase().padStart(2, '0');
    return {
      prompt: 'Convert the hex value ' + hex + ' to denary.',
      fields: [{
        id: 'ans', label: 'Denary answer', kind: 'text', placeholder: 'e.g. 90',
        check: raw => normInt(raw) === n, correctDisplay: String(n),
      }],
      working: workingHexToDen(hex, n),
    };
  }
  function workingHexToDen(hex, n) {
    const hi = parseInt(hex[0], 16), lo = parseInt(hex[1], 16);
    return 'Each hex digit is a nibble: ' + hex[0] + ' = ' + hi + ' × 16 = ' + (hi * 16) +
      '; ' + hex[1] + ' = ' + lo + '. Total: ' + (hi * 16) + ' + ' + lo + ' = ' + n + '.';
  }

  function genAddition() {
    const wantOverflow = Math.random() < 0.5;
    let a, b;
    if (wantOverflow) {
      a = randInt(1, 255);
      b = randInt(Math.max(1, 256 - a), 255);
    } else {
      a = randInt(0, 254);
      b = randInt(0, 255 - a);
    }
    const sum = a + b;
    const overflow = sum > 255;
    const result8 = toBinary8(sum & 0xFF);
    return {
      prompt: 'Add these two 8-bit binary numbers: ' + groupBits(toBinary8(a)) + ' + ' + groupBits(toBinary8(b)),
      fields: [
        {
          id: 'result', label: '8-bit result', kind: 'text', placeholder: 'e.g. 10110010',
          check: raw => normBinary(raw) === result8, correctDisplay: groupBits(result8),
        },
        {
          id: 'overflow', label: 'Did it overflow?', kind: 'mcq', options: ['Yes', 'No'],
          check: raw => normYesNo(raw) === overflow, correctDisplay: overflow ? 'Yes' : 'No',
        },
      ],
      working: workingAddition(a, b, sum, overflow, result8),
    };
  }
  function workingAddition(a, b, sum, overflow, result8) {
    return 'Column addition: ' + a + ' + ' + b + ' = ' + sum + '. ' +
      (overflow
        ? 'That is more than 255, so it overflows an 8-bit register — the extra carry is lost, leaving ' + result8 + '.'
        : 'That fits in 8 bits (0–255), so no overflow: ' + result8 + '.');
  }

  function genShifts() {
    const n = randInt(1, 255);
    const direction = Math.random() < 0.5 ? 'left' : 'right';
    const amount = randInt(1, 3);
    const bin = toBinary8(n);
    const resultVal = direction === 'left' ? (n << amount) & 0xFF : n >>> amount;
    const resultBin = toBinary8(resultVal);
    const meaningOptions = direction === 'left' ? ['×2', '×4', '×8'] : ['÷2', '÷4', '÷8'];
    const correctMeaning = meaningOptions[amount - 1];
    return {
      prompt: 'Shift ' + groupBits(bin) + ' ' + direction + ' by ' + amount + (amount === 1 ? ' bit' : ' bits') + '.',
      fields: [
        {
          id: 'result', label: 'Result (8 bits)', kind: 'text', placeholder: 'e.g. 01011000',
          check: raw => normBinary(raw) === resultBin, correctDisplay: groupBits(resultBin),
        },
        {
          id: 'meaning', label: 'What did this shift do?', kind: 'mcq', options: meaningOptions,
          check: raw => String(raw == null ? '' : raw).trim() === correctMeaning, correctDisplay: correctMeaning,
        },
      ],
      working: workingShift(bin, direction, amount, resultBin),
    };
  }
  function workingShift(bin, direction, amount, resultBin) {
    return 'Shifting ' + direction + ' by ' + amount + ' ' +
      (direction === 'left' ? 'drops bits off the left and fills 0s on the right' : 'drops bits off the right and fills 0s on the left') +
      ': ' + bin + ' → ' + resultBin + '.';
  }

  // ── 1.2.3 — units & file-size formulas ────────────────────────
  const UNIT_CHAIN = [
    { id: 'bit', label: 'bits', factorFromPrev: 1 },
    { id: 'nibble', label: 'nibbles', factorFromPrev: 4 },
    { id: 'byte', label: 'bytes', factorFromPrev: 2 },
    { id: 'KB', label: 'KB', factorFromPrev: 1000 },
    { id: 'MB', label: 'MB', factorFromPrev: 1000 },
    { id: 'GB', label: 'GB', factorFromPrev: 1000 },
    { id: 'TB', label: 'TB', factorFromPrev: 1000 },
    { id: 'PB', label: 'PB', factorFromPrev: 1000 },
  ];

  function genUnits() {
    return Math.random() < 0.65 ? genUnitsConvert() : genUnitsOrder();
  }

  function genUnitsConvert() {
    const i = randInt(0, UNIT_CHAIN.length - 2);
    const small = UNIT_CHAIN[i], large = UNIT_CHAIN[i + 1];
    const factor = large.factorFromPrev;
    const up = Math.random() < 0.5;
    let from, to, valueFrom, expected, opText;
    if (up) {
      from = small; to = large;
      expected = randInt(1, 9);
      valueFrom = expected * factor;
      opText = 'divide by ' + factor;
    } else {
      from = large; to = small;
      valueFrom = randInt(1, 9);
      expected = valueFrom * factor;
      opText = 'multiply by ' + factor;
    }
    const usesKChain = large.factorFromPrev === 1000;
    return {
      prompt: 'Convert ' + valueFrom + ' ' + from.label + ' to ' + to.label + '.',
      fields: [{
        id: 'ans', label: to.label, kind: 'text', placeholder: 'e.g. 12',
        check: raw => normInt(raw) === expected, correctDisplay: String(expected),
      }],
      working: '1 ' + large.label + ' = ' + factor + ' ' + small.label + ', so ' + opText + ': ' +
        valueFrom + ' ' + from.label + ' = ' + expected + ' ' + to.label + '.' +
        (usesKChain ? ' (This course uses 1,000 per step — 1,024 is sometimes also accepted.)' : ''),
    };
  }

  function bitsForItem(idx, value) {
    let bits = value;
    for (let k = 1; k <= idx; k++) bits *= UNIT_CHAIN[k].factorFromPrev;
    return bits;
  }
  function buildOrderItems() {
    const letters = ['A', 'B', 'C'];
    return letters.map(letter => {
      const idx = randInt(0, 5); // cap at GB so numbers stay mentally trackable
      const value = randInt(1, 20);
      return { letter, value, unit: UNIT_CHAIN[idx], bits: bitsForItem(idx, value) };
    });
  }
  function hasDuplicateBits(items) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].bits === items[j].bits) return true;
      }
    }
    return false;
  }
  function genUnitsOrder() {
    let items = buildOrderItems();
    let attempts = 0;
    while (hasDuplicateBits(items) && attempts < 20) { items = buildOrderItems(); attempts++; }
    const sorted = items.slice().sort((x, y) => x.bits - y.bits);
    const correctOrder = sorted.map(it => it.letter);
    return {
      prompt: 'Order these from smallest to largest: ' +
        items.map(it => it.letter + ') ' + it.value + ' ' + it.unit.label).join('   '),
      fields: [{
        id: 'ans', label: 'Order (e.g. B,A,C)', kind: 'text', placeholder: 'e.g. B,A,C',
        check: raw => normOrder(raw) === correctOrder.join(','), correctDisplay: correctOrder.join(','),
      }],
      working: 'In bits: ' + items.map(it => it.letter + '=' + it.bits).join(', ') +
        ' → smallest to largest: ' + correctOrder.join(', ') + '.',
    };
  }

  function genTextsize() {
    const bitsPerChar = pick([5, 6, 7, 8]);
    const numChars = 8 * randInt(1, 20); // multiple of 8 keeps the byte answer clean
    const totalBits = bitsPerChar * numChars;
    const totalBytes = totalBits / 8;
    return {
      prompt: 'A text file uses ' + bitsPerChar + ' bits per character and has ' + numChars + ' characters. Find the file size.',
      fields: [
        { id: 'bits', label: 'Size in bits', kind: 'text', placeholder: 'e.g. 800', check: raw => normInt(raw) === totalBits, correctDisplay: String(totalBits) },
        { id: 'bytes', label: 'Size in bytes', kind: 'text', placeholder: 'e.g. 100', check: raw => normInt(raw) === totalBytes, correctDisplay: String(totalBytes) },
      ],
      working: 'bits/char × number of characters = ' + bitsPerChar + ' × ' + numChars + ' = ' + totalBits + ' bits. Divide by 8 for bytes: ' + totalBits + ' ÷ 8 = ' + totalBytes + ' bytes.',
    };
  }

  function genImageSizeQuestion(harder) {
    const colourDepth = harder ? pick([8, 16, 24]) : 8;
    const width = harder ? randInt(10, 100) : randInt(2, 10);
    const height = harder ? randInt(10, 100) : randInt(2, 10);
    const totalBits = colourDepth * width * height;
    const totalBytes = totalBits / 8;
    return {
      prompt: 'An image is ' + width + ' × ' + height + ' pixels with a colour depth of ' + colourDepth + ' bits per pixel. Find the file size.',
      fields: [
        { id: 'bits', label: 'Size in bits', kind: 'text', placeholder: 'e.g. 640', check: raw => normInt(raw) === totalBits, correctDisplay: String(totalBits) },
        { id: 'bytes', label: 'Size in bytes', kind: 'text', placeholder: 'e.g. 80', check: raw => normInt(raw) === totalBytes, correctDisplay: String(totalBytes) },
      ],
      working: 'colour depth × width × height = ' + colourDepth + ' × ' + width + ' × ' + height + ' = ' + totalBits + ' bits = ' + totalBytes + ' bytes (÷8).',
    };
  }

  function genSoundSizeQuestion(harder) {
    const sampleRate = harder ? randInt(100, 1000) : pick([10, 20, 50, 100]);
    const duration = harder ? randInt(5, 60) : randInt(2, 10);
    const bitDepth = pick([8, 16, 24]);
    const totalBits = sampleRate * duration * bitDepth;
    const totalBytes = totalBits / 8;
    return {
      prompt: 'A sound is sampled at ' + sampleRate + ' Hz for ' + duration + ' seconds at a bit depth of ' + bitDepth + ' bits. Find the file size.',
      fields: [
        { id: 'bits', label: 'Size in bits', kind: 'text', placeholder: 'e.g. 1600', check: raw => normInt(raw) === totalBits, correctDisplay: String(totalBits) },
        { id: 'bytes', label: 'Size in bytes', kind: 'text', placeholder: 'e.g. 200', check: raw => normInt(raw) === totalBytes, correctDisplay: String(totalBytes) },
      ],
      working: 'sample rate × duration × bit depth = ' + sampleRate + ' × ' + duration + ' × ' + bitDepth + ' = ' + totalBits + ' bits = ' + totalBytes + ' bytes (÷8).',
    };
  }

  function genFilesize() {
    const kind = pick(['sound', 'image', 'text']);
    if (kind === 'sound') return genSoundSizeQuestion(false);
    if (kind === 'image') return genImageSizeQuestion(false);
    return genTextsize();
  }
  function genImagesize() { return genImageSizeQuestion(true); }
  function genSoundsize() { return genSoundSizeQuestion(true); }

  // ── 1.2.5 — character codes ────────────────────────────────────
  const ANCHOR_NOTE = "Remember: in this scheme 'A' = 65, and each following letter is one more (B = 66, C = 67 …). ";
  function letterCode(letter) { return letter.charCodeAt(0); }

  function genAsciiCode() {
    const letter = pick('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
    const code = letterCode(letter);
    return {
      prompt: ANCHOR_NOTE + "What is the code for '" + letter + "'?",
      fields: [{ id: 'ans', label: 'Code', kind: 'text', placeholder: 'e.g. 68', check: raw => normInt(raw) === code, correctDisplay: String(code) }],
      working: "'A' = 65, '" + letter + "' is " + (code - 65) + " letters after 'A', so " + letter + ' = 65 + ' + (code - 65) + ' = ' + code + '.',
    };
  }
  function genAsciiOffset() {
    const baseIdx = randInt(0, 22); // leaves room for +1..+3 without leaving A-Z
    const offset = randInt(1, 3);
    const base = String.fromCharCode(65 + baseIdx);
    const target = String.fromCharCode(65 + baseIdx + offset);
    return {
      prompt: ANCHOR_NOTE + 'Which character is ' + offset + ' more than \'' + base + '\'?',
      fields: [{ id: 'ans', label: 'Character', kind: 'text', placeholder: 'e.g. I', check: raw => String(raw == null ? '' : raw).trim().toUpperCase() === target, correctDisplay: target }],
      working: base + ' = ' + letterCode(base) + ', + ' + offset + ' = ' + letterCode(target) + ' = \'' + target + '\'.',
    };
  }
  function randWord(len) {
    let w = '';
    for (let i = 0; i < len; i++) w += String.fromCharCode(65 + randInt(0, 25));
    return w;
  }
  function genAsciiEncode() {
    const word = randWord(3);
    const codes = word.split('').map(letterCode);
    return {
      prompt: ANCHOR_NOTE + "Write the denary codes for the word '" + word + "'.",
      fields: [{ id: 'ans', label: 'Codes (comma-separated)', kind: 'text', placeholder: 'e.g. 72,73,74', check: raw => normCodeList(raw) === codes.join(','), correctDisplay: codes.join(',') }],
      working: word.split('').map((ch, i) => ch + '=' + codes[i]).join(', ') + '.',
    };
  }
  function genAscii() {
    const subtype = pick(['code', 'offset', 'encode']);
    if (subtype === 'code') return genAsciiCode();
    if (subtype === 'offset') return genAsciiOffset();
    return genAsciiEncode();
  }

  // ── registry ────────────────────────────────────────────────────
  const GENERATORS = {
    'bin-den': genBinDen, 'den-bin': genDenBin, 'bin-hex': genBinHex, 'hex-den': genHexDen,
    'addition': genAddition, 'shifts': genShifts,
    'units': genUnits, 'filesize': genFilesize, 'imagesize': genImagesize, 'soundsize': genSoundsize,
    'ascii': genAscii,
  };
  const MODE_LABELS = {
    'bin-den': 'Binary → Denary', 'den-bin': 'Denary → Binary', 'bin-hex': 'Binary → Hex', 'hex-den': 'Hex → Denary',
    'addition': 'Binary Addition', 'shifts': 'Shifts',
    'units': 'Units', 'filesize': 'File Sizes', 'imagesize': 'Image Size', 'soundsize': 'Sound Size',
    'ascii': 'Character Codes',
  };
  const ROUND_LENGTH = 10;

  // ── DOM rendering ───────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('cslab-drills-style')) return;
    const style = document.createElement('style');
    style.id = 'cslab-drills-style';
    style.textContent =
      '.cslab-drills-tabs{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}' +
      '.cslab-drills-tab{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:20px;padding:6px 14px;font-family:inherit;font-size:13px;cursor:pointer}' +
      '.cslab-drills-tab.active{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.cslab-drills-progress{color:var(--mid);font-size:13px;margin:0 0 8px}' +
      '.cslab-drills-prompt{font-size:16px;font-weight:600;margin:0 0 14px;white-space:pre-wrap}' +
      '.cslab-drills-scaffold-toggle{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--mid);margin-bottom:8px;cursor:pointer}' +
      '.cslab-drills-scaffold-row{font-family:"DM Mono","Consolas",monospace;letter-spacing:2px;background:var(--cream);border:1px solid var(--border);border-radius:6px;padding:6px 10px;margin-bottom:12px;font-size:13px;color:var(--ink)}' +
      '.cslab-drills-fields{display:flex;flex-direction:column;gap:12px;margin-bottom:10px}' +
      '.cslab-drills-field label{display:block;font-size:13px;color:var(--mid);margin-bottom:4px}' +
      '.cslab-drills-field input[type=text]{width:100%;max-width:280px;box-sizing:border-box;font-family:"DM Mono","Consolas",monospace;font-size:15px;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--cream);color:var(--ink)}' +
      '.cslab-drills-field input.correct{border-color:var(--success);box-shadow:0 0 0 1px var(--success)}' +
      '.cslab-drills-field input.incorrect{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}' +
      '.cslab-drills-mcq{display:flex;flex-wrap:wrap;gap:8px}' +
      '.cslab-drills-mcq button{background:var(--card-bg);border:1px solid var(--border);color:var(--ink);border-radius:8px;padding:8px 14px;font-family:inherit;font-size:14px;cursor:pointer}' +
      '.cslab-drills-mcq button.selected{background:var(--accent);color:var(--paper);border-color:var(--accent)}' +
      '.cslab-drills-mcq.correct button.selected{border-color:var(--success);box-shadow:0 0 0 1px var(--success)}' +
      '.cslab-drills-mcq.incorrect button.selected{border-color:#c0392b;box-shadow:0 0 0 1px #c0392b}' +
      '.cslab-drills-btnrow{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}' +
      '.cslab-drills-working{margin-top:12px;padding:10px 12px;background:var(--cream);border:1px solid var(--border);border-radius:8px;font-size:14px;color:var(--ink)}' +
      '.cslab-drills-score{font-size:16px;font-weight:600;margin-bottom:12px}';
    document.head.appendChild(style);
  }

  function mount(el, ctx) {
    injectStyles();
    const modes = (ctx.config && ctx.config.modes && ctx.config.modes.length) ? ctx.config.modes : Object.keys(GENERATORS);

    const root = document.createElement('div');
    root.className = 'cslab-drills';
    el.appendChild(root);

    const tabBar = document.createElement('div');
    tabBar.className = 'cslab-drills-tabs';
    const body = document.createElement('div');
    root.appendChild(tabBar);
    root.appendChild(body);

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

    function setActiveTabUI(activeMode) {
      Array.prototype.forEach.call(tabBar.children, (btn, i) => btn.classList.toggle('active', modes[i] === activeMode));
    }

    function startRound(mode) {
      setActiveTabUI(mode);
      round = { mode: mode, index: 0, score: 0, total: ROUND_LENGTH };
      renderQuestion();
    }

    function renderScaffoldToggle(wrap) {
      const row = document.createElement('label');
      row.className = 'cslab-drills-scaffold-toggle';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!ctx.store.get('scaffold', false);
      const span = document.createElement('span');
      span.textContent = 'Show place values (128… 1)';
      row.appendChild(cb);
      row.appendChild(span);
      wrap.appendChild(row);

      const table = document.createElement('div');
      table.className = 'cslab-drills-scaffold-row';
      table.textContent = '128   64   32   16   8   4   2   1';
      table.style.display = cb.checked ? '' : 'none';
      wrap.appendChild(table);

      cb.addEventListener('change', () => {
        ctx.store.set('scaffold', cb.checked);
        table.style.display = cb.checked ? '' : 'none';
      });
    }

    function renderQuestion() {
      body.innerHTML = '';
      if (round.index >= round.total) { renderRoundDone(); return; }

      const q = GENERATORS[round.mode]();
      const wrap = document.createElement('div');
      wrap.className = 'cslab-drills-q';

      const progress = document.createElement('p');
      progress.className = 'cslab-drills-progress';
      progress.textContent = 'Question ' + (round.index + 1) + ' of ' + round.total + ' — streak ' + currentStreak() + ' (best ' + bestStreak() + ')';
      wrap.appendChild(progress);

      if (q.scaffold === 'places') renderScaffoldToggle(wrap);

      const promptEl = document.createElement('p');
      promptEl.className = 'cslab-drills-prompt';
      promptEl.textContent = q.prompt;
      wrap.appendChild(promptEl);

      const fieldsWrap = document.createElement('div');
      fieldsWrap.className = 'cslab-drills-fields';
      const fieldEls = {};
      q.fields.forEach(f => {
        const row = document.createElement('div');
        row.className = 'cslab-drills-field';
        const label = document.createElement('label');
        label.textContent = f.label;
        row.appendChild(label);

        if (f.kind === 'mcq') {
          const group = document.createElement('div');
          group.className = 'cslab-drills-mcq';
          let selected = null;
          f.options.forEach(opt => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = opt;
            b.addEventListener('click', () => {
              selected = opt;
              Array.prototype.forEach.call(group.children, c => c.classList.toggle('selected', c === b));
            });
            group.appendChild(b);
          });
          row.appendChild(group);
          fieldEls[f.id] = { get: () => selected, el: group };
        } else {
          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = f.placeholder || '';
          input.autocomplete = 'off';
          row.appendChild(input);
          fieldEls[f.id] = { get: () => input.value, el: input };
        }
        fieldsWrap.appendChild(row);
      });
      wrap.appendChild(fieldsWrap);

      const feedback = document.createElement('div');
      feedback.className = 'cslab-feedback';
      wrap.appendChild(feedback);

      const btnRow = document.createElement('div');
      btnRow.className = 'cslab-drills-btnrow';
      const checkBtn = CsLab.ui.btn('Check');
      const workingBtn = CsLab.ui.btn('Show working', 'secondary');
      workingBtn.style.display = 'none';
      const nextBtn = CsLab.ui.btn('Next', 'secondary');
      nextBtn.style.display = 'none';
      btnRow.appendChild(checkBtn);
      btnRow.appendChild(workingBtn);
      btnRow.appendChild(nextBtn);
      wrap.appendChild(btnRow);

      const workingEl = document.createElement('p');
      workingEl.className = 'cslab-drills-working';
      workingEl.style.display = 'none';
      wrap.appendChild(workingEl);

      let answered = false;
      checkBtn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        let allCorrect = true;
        q.fields.forEach(f => {
          const raw = fieldEls[f.id].get();
          const ok = !!f.check(raw);
          if (!ok) allCorrect = false;
          fieldEls[f.id].el.classList.toggle('correct', ok);
          fieldEls[f.id].el.classList.toggle('incorrect', !ok);
        });
        registerAnswer(allCorrect);
        if (allCorrect) round.score++;
        checkBtn.disabled = true;
        CsLab.ui.feedback(feedback, allCorrect, allCorrect ? 'Correct!' : 'Not quite — check the highlighted answer(s).');
        workingBtn.style.display = '';
        nextBtn.style.display = '';
        progress.textContent = 'Question ' + (round.index + 1) + ' of ' + round.total + ' — streak ' + currentStreak() + ' (best ' + bestStreak() + ')';
      });

      workingBtn.addEventListener('click', () => {
        workingEl.textContent = q.working;
        workingEl.style.display = '';
        workingBtn.style.display = 'none';
      });

      nextBtn.addEventListener('click', () => { round.index++; renderQuestion(); });

      body.appendChild(wrap);
    }

    function renderRoundDone() {
      body.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'cslab-drills-done';
      const heading = document.createElement('p');
      heading.className = 'cslab-drills-score';
      heading.textContent = 'Round complete: ' + round.score + ' / ' + round.total + ' correct. Streak ' + currentStreak() + ' (best ' + bestStreak() + ').';
      wrap.appendChild(heading);
      const again = CsLab.ui.btn('Play again');
      again.addEventListener('click', () => startRound(round.mode));
      wrap.appendChild(again);
      body.appendChild(wrap);
      ctx.complete({ mode: round.mode, score: round.score });
    }

    modes.forEach(m => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cslab-drills-tab';
      b.textContent = MODE_LABELS[m] || m;
      b.addEventListener('click', () => startRound(m));
      tabBar.appendChild(b);
    });

    startRound(modes[0]);
  }

  if (typeof CsLab !== 'undefined' && CsLab && typeof CsLab.registerTool === 'function') {
    CsLab.registerTool('drills', { title: 'Data Drills', icon: '🔢', mount: mount });
  }

  // ── Node test hook (never runs in the browser) ──────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      randInt, pick, toBinary8, groupBits,
      normBinary, normHex, normInt, normYesNo, normOrder, normCodeList,
      GENERATORS, MODE_LABELS, UNIT_CHAIN, bitsForItem,
    };
  }
})();
