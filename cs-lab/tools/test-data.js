// ══════════════════════════════════════════════════════════════
// CS PRACTICE LAB — Test Data Sorter (2.3.2 Testing, CS-CONTENT-PLAN.md §7.1)
// Registers 'test-data'.
//
// Wrapped as (function (global) { ... })(window) so the pure helpers
// (classifyValue, explainClassification) can be unit-tested under plain
// Node via require() — the CsLab.registerTool call is skipped when there
// is no global.CsLab (i.e. outside the browser).
// ══════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

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
    if (global.document.getElementById('cslab-testdata-style')) return;
    const style = global.document.createElement('style');
    style.id = 'cslab-testdata-style';
    style.textContent = [
      '.cslab-testdata-intro { color: var(--mid); font-size: 14px; margin: 0 0 14px; }',
      '.cslab-testdata-scenario { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-bottom: 20px; }',
      '.cslab-testdata-rule { font-weight: 700; margin: 0 0 4px; }',
      '.cslab-testdata-rule-desc { color: var(--mid); font-size: 13.5px; margin: 0 0 14px; }',
      '.cslab-testdata-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding: 10px 0; border-top: 1px solid var(--border); }',
      '.cslab-testdata-row:first-of-type { border-top: none; }',
      '.cslab-testdata-value { font-family: "DM Mono", Consolas, monospace; font-size: 14px; min-width: 120px; font-weight: 600; }',
      '.cslab-testdata-tagbtns { display: flex; flex-wrap: wrap; gap: 6px; }',
      '.cslab-testdata-tagbtn { min-height: 40px; padding: 6px 12px; border-radius: 7px; border: 1.5px solid var(--border); background: var(--card-bg); color: var(--ink); font-family: inherit; font-size: 12.5px; cursor: pointer; }',
      '.cslab-testdata-tagbtn.chosen.right { border-color: var(--success); background: color-mix(in srgb, var(--success) 18%, var(--card-bg)); }',
      '.cslab-testdata-tagbtn.chosen.wrong { border-color: #c0392b; background: color-mix(in srgb, #c0392b 14%, var(--card-bg)); }',
      '.cslab-testdata-reason { flex-basis: 100%; font-size: 12.5px; color: var(--mid); margin: 2px 0 0; }',
      '.cslab-testdata-design { margin-top: 16px; padding-top: 14px; border-top: 2px solid var(--border); }',
      '.cslab-testdata-design h5 { margin: 0 0 8px; }',
      '.cslab-testdata-design-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-bottom: 10px; }',
      '.cslab-testdata-design-cell label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .04em; color: var(--mid); }',
      '.cslab-testdata-design-cell input { width: 100%; box-sizing: border-box; min-height: 40px; padding: 6px 10px; border: 1.5px solid var(--border); border-radius: 6px; background: var(--card-bg); color: var(--ink); font-family: "DM Mono", Consolas, monospace; }',
      '.cslab-testdata-design-feedback { font-size: 12.5px; margin: 4px 0 0; }',
      '.cslab-testdata-design-feedback.ok { color: var(--success); }',
      '.cslab-testdata-design-feedback.no { color: #c0392b; }',
    ].join('\n');
    global.document.head.appendChild(style);
  }

  // ── Rule definitions ────────────────────────────────────────────────
  const RULES = {
    quantity: { id: 'quantity', label: 'Quantity', kind: 'integer-range', min: 1, max: 99, description: 'a whole number from 1 to 99' },
    percentage: { id: 'percentage', label: 'Percentage', kind: 'decimal-range', min: 0, max: 100, description: 'a number from 0 to 100' },
    username: { id: 'username', label: 'Username', kind: 'letter-length', min: 3, max: 10, description: 'a username of 3 to 10 letters (letters only)' },
  };

  const CLASSES = ['normal', 'boundary', 'invalid', 'erroneous'];
  const CLASS_LABELS = { normal: 'Normal', boundary: 'Boundary', invalid: 'Invalid', erroneous: 'Erroneous' };

  const SCENARIOS = [
    { rule: 'quantity', values: [1, 99, 50, 23, 0, 100, 'twelve', 4.5] },
    { rule: 'percentage', values: [0, 100, 45, 72.5, -1, 101, 'hundred', '%50'] },
    { rule: 'username', values: ['ben', 'abcdefghij', 'claudia', 'harry', 'hi', 'supercalifragil', 'b3n', ''] },
  ];

  // ── Pure classifier: works for both the curated candidates AND
  //    whatever a student types into "design your own" — single source
  //    of truth so there's no drift between the two. ───────────────────
  function classifyValue(rawValue, rule) {
    const raw = String(rawValue);
    if (rule.kind === 'letter-length') {
      if (raw.length === 0) return 'erroneous';
      if (!/^[A-Za-z]+$/.test(raw)) return 'erroneous';
      const len = raw.length;
      if (len === rule.min || len === rule.max) return 'boundary';
      if (len > rule.min && len < rule.max) return 'normal';
      return 'invalid';
    }
    // numeric rules (integer-range / decimal-range)
    const trimmed = raw.trim();
    if (trimmed === '' || !/^-?\d+(\.\d+)?$/.test(trimmed)) return 'erroneous';
    const num = parseFloat(trimmed);
    if (rule.kind === 'integer-range' && !Number.isInteger(num)) return 'erroneous';
    if (num === rule.min || num === rule.max) return 'boundary';
    if (num > rule.min && num < rule.max) return 'normal';
    return 'invalid';
  }

  // Pure: human-readable reason for a classification, generic across rules.
  function explainClassification(rule, cls) {
    switch (cls) {
      case 'normal': return 'A typical valid value, comfortably inside the allowed range.';
      case 'boundary': return 'Valid, but sitting exactly on the edge of the allowed range (' + rule.min + ' or ' + rule.max + ').';
      case 'invalid': return 'The right type/format, but outside the allowed range — validation should reject it.';
      default: return "The wrong type or format altogether (or missing data) — something validation should never accept as sensible input.";
    }
  }

  function displayValue(v) {
    if (v === '') return '(empty string)';
    return String(v);
  }

  function buildScenarioCard(scnDef, ctx) {
    const rule = RULES[scnDef.rule];
    const card = el('div', 'cslab-testdata-scenario');
    card.appendChild(el('p', 'cslab-testdata-rule', rule.label + ' — validation rule'));
    card.appendChild(el('p', 'cslab-testdata-rule-desc', 'Accepted input: ' + rule.description + '.'));

    const order = shuffle(scnDef.values.map((v, i) => i));
    order.forEach(i => {
      const value = scnDef.values[i];
      const correctClass = classifyValue(value, rule);
      const row = el('div', 'cslab-testdata-row');
      row.appendChild(el('span', 'cslab-testdata-value', displayValue(value)));
      const btnWrap = el('div', 'cslab-testdata-tagbtns');
      const reasonEl = el('p', 'cslab-testdata-reason');
      CLASSES.forEach(cls => {
        const b = el('button', 'cslab-testdata-tagbtn', CLASS_LABELS[cls]);
        b.type = 'button';
        b.addEventListener('click', () => {
          btnWrap.querySelectorAll('.cslab-testdata-tagbtn').forEach(n => n.classList.remove('chosen', 'right', 'wrong'));
          const ok = cls === correctClass;
          b.classList.add('chosen', ok ? 'right' : 'wrong');
          reasonEl.textContent = (ok ? '✓ Correct — ' : ('✗ Actually ' + CLASS_LABELS[correctClass] + ' — ')) + explainClassification(rule, correctClass);
        });
        btnWrap.appendChild(b);
      });
      row.appendChild(btnWrap);
      row.appendChild(reasonEl);
      card.appendChild(row);
    });

    // "Design your own" — one value per class, checked programmatically.
    const design = el('div', 'cslab-testdata-design');
    design.appendChild(el('h5', null, '✏️ Design your own'));
    design.appendChild(el('p', 'cslab-testdata-rule-desc', 'Type one value of each class for this rule, then check them.'));
    const grid = el('div', 'cslab-testdata-design-grid');
    const inputs = {};
    CLASSES.forEach(cls => {
      const cell = el('div', 'cslab-testdata-design-cell');
      const label = el('label', null, CLASS_LABELS[cls]);
      const input = global.document.createElement('input');
      input.type = 'text';
      cell.appendChild(label);
      cell.appendChild(input);
      const fb = el('p', 'cslab-testdata-design-feedback');
      cell.appendChild(fb);
      inputs[cls] = { input, fb };
      grid.appendChild(cell);
    });
    design.appendChild(grid);
    const checkBtn = ctx.ui.btn('Check my examples');
    design.appendChild(checkBtn);
    card.appendChild(design);

    let completedThisScenario = false;
    checkBtn.addEventListener('click', () => {
      // An empty "erroneous" example is legitimate (missing data is a classic
      // erroneous case) so classifyValue already handles it — every other
      // class needs a real typed value to classify correctly against.
      CLASSES.forEach(cls => {
        const val = inputs[cls].input.value;
        const actual = classifyValue(val, rule);
        const ok = actual === cls;
        inputs[cls].fb.className = 'cslab-testdata-design-feedback ' + (ok ? 'ok' : 'no');
        inputs[cls].fb.textContent = ok
          ? '✓ Correct.'
          : ('This classifies as ' + CLASS_LABELS[actual] + ', not ' + CLASS_LABELS[cls] + '. Rule needs ' + rule.description + '.');
      });
      if (!completedThisScenario) {
        completedThisScenario = true;
        const done = ctx.store.get('completed', []);
        if (done.indexOf(rule.id) === -1) { done.push(rule.id); ctx.store.set('completed', done); }
        ctx.complete({ scenario: rule.id });
      }
    });

    return card;
  }

  function mountTestData(el0, ctx) {
    injectStyle();
    const wrap = el('div', 'cslab-testdata');
    wrap.appendChild(el('p', 'cslab-testdata-intro',
      'Every field has a validation rule. For each value below, decide whether it is Normal, Boundary, Invalid or Erroneous test data — then design your own examples of each.'));
    SCENARIOS.forEach(scn => wrap.appendChild(buildScenarioCard(scn, ctx)));
    el0.appendChild(wrap);
  }

  // ── Registration (skipped outside the browser) ─────────────────────
  if (global && global.CsLab) {
    global.CsLab.registerTool('test-data', { title: 'Test Data Sorter', icon: '🧪', mount: mountTestData });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { classifyValue, explainClassification, RULES, SCENARIOS, CLASSES };
  }
})(typeof window !== 'undefined' ? window : this);
