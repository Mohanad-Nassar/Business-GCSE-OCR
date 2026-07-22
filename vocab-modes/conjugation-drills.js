// ══════════════════════════════════════════════════════════════
// CONJUGATION DRILLS — vocab.js mode module
//
// Spec-driven (AQA 8692 §3.3): "Students are also required to know words
// which can be regularly inflected... using the grammar specified in
// section 3.3." The wordbank only lists dictionary/infinitive forms (plus
// separately-listed IRREGULAR forms per Annex E — e.g. "ser" already has
// soy/eres/es/... as its own practice items) — regular inflection is
// expected but untested by any existing mode. This drill: infinitive +
// person → student produces the present-tense form.
//
// Endings are the EXACT regular -ar/-er/-ir pattern already taught (and
// shipped to students) on subjects/spanish/G.3-present-tense-and-key-
// irregulars.html — hablo/hablas/habla/hablamos/habláis/hablan etc. —
// verified byte-for-byte against that page's own table (see the Node test
// harness used when this module was built). NOT re-derived from scratch.
//
// REGULAR_VERBS is a CURATED whitelist, not an automatic filter. A present-
// tense-regular Spanish verb cannot be reliably detected from spelling
// alone — many high-frequency infinitives ending in -ar/-er/-ir are
// actually irregular (querer, poder, hacer, conocer...) or stem-changing
// (pensar e→ie, jugar u→ue, servir e→i) or belong to spelling/accent-shift
// families (enviar, continuar, prohibir) that a naive stem+ending
// conjugator would get WRONG. Every verb below was individually checked
// against the wordbank's own infinitive list and excluded unless its
// present tense is fully regular in all six persons. When genuinely
// uncertain, a verb was left OUT rather than risk teaching a wrong form —
// this is a curated linguistic judgement call, not an extracted fact like
// the wordbank itself, so it's worth a native-speaker spot-check.
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  const REGULAR_VERBS = [
    'pasar', 'deber', 'creer', 'hablar', 'mirar', 'tomar', 'vivir', 'esperar', 'trabajar', 'escribir',
    'entrar', 'leer', 'recibir', 'preguntar', 'presentar', 'crear', 'terminar', 'sacar', 'necesitar',
    'escuchar', 'ganar', 'explicar', 'usar', 'tocar', 'ayudar', 'estudiar', 'correr', 'comer', 'comprar',
    'decidir', 'pagar', 'subir', 'intentar', 'descubrir', 'andar', 'aprender', 'aceptar', 'responder',
    'bajar', 'evitar', 'vender', 'compartir', 'mandar', 'participar', 'enseñar', 'aumentar', 'apoyar',
    'contestar', 'depender', 'tirar', 'guardar', 'gritar', 'parar', 'cantar', 'romper', 'cuidar', 'salvar',
    'funcionar', 'visitar', 'invitar', 'mejorar', 'causar', 'viajar', 'disfrutar', 'organizar', 'beber',
    'durar', 'respetar', 'describir', 'comunicar', 'robar', 'discutir', 'bailar', 'montar', 'grabar',
    'tardar', 'besar', 'practicar', 'comparar', 'limpiar', 'descansar', 'respirar', 'apagar', 'votar',
    'empujar', 'criticar', 'gastar', 'aguantar', 'fumar', 'diseñar', 'odiar', 'reservar', 'cenar',
    'ahorrar', 'nadar', 'repasar', 'contaminar', 'reciclar', 'existir', 'considerar', 'utilizar',
    'resultar', 'lograr', 'formar', 'alcanzar', 'desarrollar', 'meter', 'dedicar', 'comprender',
    'publicar', 'imaginar', 'caminar', 'indicar', 'destacar', 'significar', 'matar', 'acompañar',
    'cubrir', 'llorar', 'comentar', 'abandonar', 'notar', 'expresar', 'cortar', 'cruzar', 'emplear',
    'sorprender', 'controlar', 'conservar', 'añadir', 'firmar', 'luchar', 'prestar', 'superar',
    'identificar', 'mencionar', 'instalar', 'consistir (en)', 'esconder', 'pegar', 'cobrar', 'ordenar',
    'asistir', 'reflejar', 'fundar', 'temer', 'solicitar', 'rechazar', 'cargar', 'cometer', 'regalar',
    'perdonar', 'emitir', 'mezclar', 'investigar', 'animar', 'abrazar', 'pasear', 'amenazar', 'apreciar',
    'sobrevivir', 'fabricar', 'conectar', 'engañar', 'alegrar', 'suspender', 'castigar', 'descargar',
    'charlar', 'cocinar', 'navegar', 'alquilar',
  ];

  const PERSONS = [
    { key: 'yo', label: 'yo' },
    { key: 'tu', label: 'tú' },
    { key: 'el', label: 'él / ella / usted' },
    { key: 'nosotros', label: 'nosotros/as' },
    { key: 'vosotros', label: 'vosotros/as' },
    { key: 'ellos', label: 'ellos / ellas / ustedes' },
  ];

  const ENDINGS = {
    ar: ['o', 'as', 'a', 'amos', 'áis', 'an'],
    er: ['o', 'es', 'e', 'emos', 'éis', 'en'],
    ir: ['o', 'es', 'e', 'imos', 'ís', 'en'],
  };

  // "consistir (en)" etc: the drill conjugates the bare verb; the "(en)" is
  // a usage note, not part of the inflected form.
  function bareInfinitive(headword) { return headword.replace(/\s*\([^)]*\)\s*$/, ''); }

  function presentForms(infinitive) {
    const bare = bareInfinitive(infinitive);
    const type = bare.slice(-2);
    const stem = bare.slice(0, -2);
    const endings = ENDINGS[type];
    if (!endings) return null;
    return endings.map(e => stem + e);
  }

  function injectStyles() {
    if (document.getElementById('vlCjStyles')) return;
    const s = document.createElement('style');
    s.id = 'vlCjStyles';
    s.textContent = `
      .vl-cj-prompt { text-align:center; padding:24px; }
      .vl-cj-infinitive { font-family:'Playfair Display',serif; font-weight:700; font-size:24px; color:var(--ink); }
      .vl-cj-gloss { font-size:13px; color:var(--mid); margin-top:2px; }
      .vl-cj-person { font-family:'DM Mono',monospace; font-size:15px; font-weight:700; color:var(--accent); margin-top:10px; }
      .vl-cj-say { border:1px solid var(--border); background:var(--card-bg); border-radius:999px; padding:2px 10px; font-size:13px; cursor:pointer; margin-bottom:4px; }
      .vl-cj-inputrow { display:flex; gap:8px; max-width:360px; margin:16px auto 6px; }
      .vl-cj-inputrow input { flex:1; padding:11px 14px; border:1.5px solid var(--border); border-radius:8px; font-size:15px; background:var(--card-bg); color:var(--ink); text-align:center; }
      .vl-cj-inputrow input.correct { border-color:var(--success); background:#d4edda; }
      .vl-cj-inputrow input.wrong { border-color:var(--wrong); background:#fde8e5; }
      .vl-cj-hint { text-align:center; font-size:11.5px; color:var(--mid); margin-bottom:10px; }
      .vl-cj-feedback { min-height:20px; font-size:13.5px; margin-bottom:6px; text-align:center; }
      .vl-cj-feedback.correct { color:var(--success); }
      .vl-cj-feedback.wrong { color:var(--wrong); }
      .vl-cj-nav { display:flex; justify-content:center; margin-bottom:14px; min-height:40px; }
      .vl-cj-stats { display:flex; justify-content:center; gap:20px; font-family:'DM Mono',monospace; font-size:12px; color:var(--mid); margin-bottom:10px; }
      .vl-cj-stats b { color:var(--ink); }
      .vl-cj-summary { text-align:center; padding:20px; }
    `;
    document.head.appendChild(s);
  }

  function buildDeck(ctx) {
    // Cross-reference the curated whitelist against the LIVE wordbank rather
    // than trusting the hardcoded list blindly — if a headword's spelling or
    // gloss ever changes, this verb silently drops out instead of drilling
    // a stale/mismatched form.
    const bySpanish = new Map();
    ctx.allWords.forEach(w => { if (w.pos === 'v') bySpanish.set(w.headword, w); });
    const verbs = REGULAR_VERBS.map(inf => bySpanish.get(inf)).filter(Boolean);

    const items = [];
    verbs.forEach(v => {
      const forms = presentForms(v.headword);
      if (!forms) return;
      PERSONS.forEach((p, i) => {
        items.push({
          id: v.id + '::pres::' + p.key,        // synthetic status key — a DIFFERENT
          verb: v, person: p, form: forms[i],    // skill from knowing the word itself
        });
      });
    });
    return items;
  }

  function mount(el, ctx) {
    injectStyles();
    const pool = buildDeck(ctx);
    if (pool.length < 3) { el.innerHTML = '<div class="empty">No regular verbs available to drill right now.</div>'; return; }

    const ROUND_SIZE = 15;
    // smartShuffle expects objects with an .id it can look up via ctx.status —
    // the synthetic conjugation ids work with it exactly like real word ids.
    const deck = ctx.smartShuffle(pool).slice(0, Math.min(ROUND_SIZE, pool.length));
    let index = 0, correctCount = 0, wrongCount = 0, combo = 0, awaitingNext = false;

    el.innerHTML = '<div class="vl-cj-stats" id="vlCjStats"></div><div id="vlCjArea"></div>';
    const area = el.querySelector('#vlCjArea');

    function renderStats() {
      el.querySelector('#vlCjStats').innerHTML =
        '<span>Verb <b>' + (index + 1) + '</b>/' + deck.length + '</span>' +
        '<span><b>' + correctCount + '</b> correct</span>' +
        '<span><b>' + wrongCount + '</b> wrong</span>' +
        (combo >= 3 ? '<span>🔥 <b>' + combo + '</b> streak</span>' : '');
    }

    function renderPrompt() {
      if (index >= deck.length) { renderSummary(); return; }
      renderStats();
      awaitingNext = false;
      const item = deck[index];
      const bare = bareInfinitive(item.verb.headword);

      area.innerHTML =
        '<div class="vl-cj-prompt">' +
          '<button type="button" class="vl-cj-say" id="vlCjSay" aria-label="Listen">🔊</button>' +
          '<div class="vl-cj-infinitive">' + esc(bare) + '</div>' +
          '<div class="vl-cj-gloss">' + esc(item.verb.english) + '</div>' +
          '<div class="vl-cj-person">' + esc(item.person.label) + '</div>' +
        '</div>' +
        '<div class="vl-cj-inputrow"><input type="text" id="vlCjInput" placeholder="Type the conjugated form…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done"></div>' +
        '<div class="vl-cj-hint">Type the ' + esc(item.person.label) + ' form, then tap Submit (or press Enter).</div>' +
        '<div class="vl-cj-feedback" id="vlCjFeedback"></div>' +
        '<div class="vl-cj-nav" id="vlCjNav"><button type="button" class="vl-btn" id="vlCjSubmitBtn">Submit</button></div>';

      area.querySelector('#vlCjSay').addEventListener('click', () => ctx.ui.speak(bare));
      const input = area.querySelector('#vlCjInput');
      const feedback = area.querySelector('#vlCjFeedback');
      input.focus();
      area.querySelector('#vlCjSubmitBtn').addEventListener('click', () => submit(input, feedback, item));
      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        if (awaitingNext) { advance(); return; }
        submit(input, feedback, item);
      });
    }

    function submit(input, feedback, item) {
      if (awaitingNext) return;
      const res = ctx.fuzzyMatch(input.value, item.form);
      awaitingNext = true;
      input.classList.add(res.correct ? 'correct' : 'wrong');
      input.readOnly = true;
      const next = ctx.status.bump(item.id, res.correct);
      const isLast = index >= deck.length - 1;
      area.querySelector('.vl-cj-hint').textContent = '';
      area.querySelector('#vlCjNav').innerHTML = '<button type="button" class="vl-btn" id="vlCjNextBtn">' + (isLast ? 'See results →' : 'Next verb →') + '</button>';
      area.querySelector('#vlCjNextBtn').addEventListener('click', advance);
      if (res.correct) {
        correctCount++; combo++;
        feedback.className = 'vl-cj-feedback correct';
        feedback.textContent = res.perfect ? '✓ Correct!' : '✓ Correct — ' + item.form + ' (mind the accent!)';
        ctx.ui.playSound('correct');
        if (combo > 0 && combo % 5 === 0) { ctx.ui.playSound('combo'); ctx.ui.comboToast(combo); }
        ctx.ui.xpToast(next === 'green' ? 3 : 1);
      } else {
        wrongCount++; combo = 0;
        feedback.className = 'vl-cj-feedback wrong';
        feedback.textContent = '✗ Not quite — the answer was "' + item.form + '".';
        ctx.ui.playSound('wrong');
      }
      renderStats();
    }

    function advance() { index++; renderPrompt(); }

    function renderSummary() {
      const perfect = wrongCount === 0 && correctCount > 0;
      if (perfect) ctx.ui.confetti(50);
      area.innerHTML = '<div class="vl-cj-summary">' +
        '<h3 style="font-family:\'Playfair Display\',serif; margin-bottom:8px;">' + (perfect ? '🌟 Flawless round!' : 'Round complete!') + '</h3>' +
        '<p class="muted">' + correctCount + ' correct · ' + wrongCount + ' wrong</p>' +
        '<button type="button" class="vl-btn" id="vlCjAgain" style="margin-top:14px;">Go again</button>' +
      '</div>';
      el.querySelector('#vlCjStats').innerHTML = '';
      area.querySelector('#vlCjAgain').addEventListener('click', () => { ctx.complete(); mount(el, ctx); });
    }

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    renderPrompt();
  }

  window.VocabLab.registerTool('conjugation-drills', {
    title: 'Conjugation Drills',
    icon: '🔤',
    mount: mount,
    unmount() {},
  });

  // ── Node export (tests only) ──
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { REGULAR_VERBS, PERSONS, presentForms, bareInfinitive };
  }
})();
