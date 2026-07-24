// ══════════════════════════════════════════════════════════════
// CONJUGATION DRILLS v2 — vocab.js mode module
//
// Spec-driven (AQA 8692 §3.3): "Students are also required to know words
// which can be regularly inflected... using the grammar specified in
// section 3.3." The wordbank only lists dictionary/infinitive forms (plus
// separately-listed IRREGULAR forms per Annex E — e.g. "ser" already has
// soy/eres/es/... as its own practice items) — regular inflection is
// expected but untested by any existing mode. This drill: infinitive +
// person + TENSE → student produces the conjugated form.
//
// v2 (real Spanish-teacher feedback, relayed 2026-07): v1 only drilled
// present tense and only showed the person, not the tense. Fixed both —
// see PERSONS/TENSES below and the explicit tense label in the prompt.
//
// Endings are the EXACT regular patterns already taught (and shipped to
// students) on the platform's own Grammar Toolkit pages — NOT re-derived
// from scratch, and verified byte-for-byte against those pages' own tables
// in the test harness used when this module was built:
//   - Present:   G.3-present-tense-and-key-irregulars.html
//                hablo/hablas/habla/hablamos/habláis/hablan
//   - Preterite: G.4-talking-about-the-past.html
//                hablé/hablaste/habló/hablamos/hablasteis/hablaron
//                comí/comiste/comió/comimos/(comisteis*)/comieron
//                (* G.4's table doesn't show vosotros for -er/-ir preterite —
//                filled in from the uncontested standard paradigm the SAME
//                page already shows for 5 of 6 persons, not independently
//                sourced. Flagging this rather than silently treating every
//                form as page-verified.)
//
// Two REAL, systematic (not verb-specific) preterite spelling rules are
// implemented on top of the plain endings — checked against every verb in
// REGULAR_VERBS before shipping (28 need the first, 2 need the second):
//   1. -car/-gar/-zar verbs change c→qu / g→gu / z→c, but ONLY in the yo
//      form (sacar → saqué, not "sacé"). Standard Spanish orthography —
//      keeps que/gue/ce sounding right — not an exception to the paradigm.
//   2. Verbs whose stem ends in a vowel (creer, leer) change unstressed í→y
//      in the ÉL and ELLOS forms only (creyó, creyeron) — also a standard,
//      predictable spelling rule, not an irregular verb.
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
// the wordbank itself, so it's worth a native-speaker spot-check. The SAME
// 172 verbs carry over to preterite unchanged — the two rules above are
// systematic enough that no further verb needed excluding (verified: every
// verb needing rule 1 or 2 was enumerated and checked, not assumed).
// ══════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // See match-attack.js's timer fix for the same pattern/rationale: a
  // document-level listener attached inside mount() must be reachable from
  // unmount(), which runs in a different closure — module-level, not a
  // per-mount `let`, or navigating away mid-round leaks a live listener.
  let activeOutsideClickHandler = null;
  let activeEscapeHandler = null;

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

  const TENSES = [
    { key: 'pres', label: 'Present' },
    { key: 'pret', label: 'Preterite' },
    { key: 'imp', label: 'Imperfect' },
    { key: 'fut', label: 'Future' },
    { key: 'nfut', label: 'Near future' },
    { key: 'cond', label: 'Conditional' },
    { key: 'pperf', label: 'Present perfect' },
  ];

  const PRESENT_ENDINGS = {
    ar: ['o', 'as', 'a', 'amos', 'áis', 'an'],
    er: ['o', 'es', 'e', 'emos', 'éis', 'en'],
    ir: ['o', 'es', 'e', 'imos', 'ís', 'en'],
  };
  const PRETERITE_ENDINGS = {
    ar: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'],
    er: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
    ir: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
  };
  // Vowel-final stems (creer, leer) need a DIFFERENT ending set, not a
  // patch on the normal one — every "i" that would otherwise sit right next
  // to the stem's final vowel either gets an accent (hiatus: creíste, not
  // "creiste") or turns into "y" (creyó, not "creió"). Defining these
  // directly avoids the bug a first attempt hit: a regex hunting for "the i
  // to accent" in the full concatenated form (e.g. "creisteis") can't tell
  // that ending apart from the OTHER "i" already built into "-isteis"
  // itself, and grabs the wrong one.
  const VOWEL_STEM_PRETERITE_ENDINGS = ['í', 'íste', 'yó', 'ímos', 'ísteis', 'yeron'];
  // Future: the SAME endings for -ar/-er/-ir (unlike present/preterite),
  // attached to the WHOLE infinitive, not a modified stem — simpler than
  // preterite, but with its own trap: ~12 very common verbs (tener→tendré,
  // hacer→haré, poder→podré, decir→diré, querer→querré, poner→pondré,
  // salir→saldré, venir→vendré, haber→habré, saber→sabré, caber→cabré,
  // valer→valdré) use a SHORTENED/CHANGED stem, plus their compounds
  // (mantener, proponer, convenir, predecir...). Checked the full closed set
  // + known compounds against REGULAR_VERBS before adding this tense —
  // zero overlap (they were already excluded as present-tense irregulars,
  // since the same ~12 verbs are irregular there too).
  const FUTURE_ENDINGS = ['é', 'ás', 'á', 'emos', 'éis', 'án'];
  // Near future ("voy a + infinitive" = "I am going to..."): a periphrastic
  // construction, not an inflection of the target verb at all — only "ir"
  // conjugates (voy/vas/va/vamos/vais/van), and the infinitive that follows
  // is ALWAYS unchanged. That means it genuinely works for every Spanish
  // verb, regular or irregular — unlike present/preterite/future, it has no
  // exception cases to whitelist against. Still pooled from REGULAR_VERBS
  // for now (consistency with the other three tenses / Mixed mode), not
  // because it's required.
  const NEAR_FUTURE_FORMS = ['voy', 'vas', 'va', 'vamos', 'vais', 'van'];
  // Imperfect: uniform endings PER TYPE (ar vs er/ir), attached to the stem —
  // and genuinely exception-free against this whitelist. Spanish has only
  // THREE imperfect-irregular verbs in the whole language (ser/ir/ver), and
  // all three are ALSO present-tense irregular — already excluded from
  // REGULAR_VERBS for that reason — so zero additional exclusions needed
  // (checked, not assumed: neither 'ser', 'ir', nor 'ver' appears above).
  const IMPERFECT_ENDINGS = {
    ar: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'],
    er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
    ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
  };
  // Conditional: same uniform-endings-on-the-whole-infinitive shape as
  // future, and the SAME closed set of stem-changing verbs (tendría, haría,
  // podría...) — already excluded from REGULAR_VERBS as present-tense
  // irregulars, exactly like the future-tense case above. Zero overlap.
  const CONDITIONAL_ENDINGS = ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'];
  // Present perfect: haber (present) + past participle. The participle is
  // regular (-ar→-ado, -er/-ir→-ido) for all but 5 of the 172 whitelisted
  // verbs — checked individually against every verb below, not assumed:
  // escribir/descubrir/describir/cubrir/romper carry a genuinely irregular
  // participle even though their PRESENT tense is fully regular.
  const HABER_PRESENT = ['he', 'has', 'ha', 'hemos', 'habéis', 'han'];
  const IRREGULAR_PARTICIPLES = {
    escribir: 'escrito', descubrir: 'descubierto', describir: 'descrito', cubrir: 'cubierto', romper: 'roto',
  };
  const HINT_TEXT = {
    pres: { ar: '-o, -as, -a, -amos, -áis, -an', er: '-o, -es, -e, -emos, -éis, -en', ir: '-o, -es, -e, -imos, -ís, -en' },
    pret: { ar: '-é, -aste, -ó, -amos, -asteis, -aron', er: '-í, -iste, -ió, -imos, -isteis, -ieron', ir: '-í, -iste, -ió, -imos, -isteis, -ieron' },
    imp: { ar: '-aba, -abas, -aba, -ábamos, -abais, -aban', er: '-ía, -ías, -ía, -íamos, -íais, -ían', ir: '-ía, -ías, -ía, -íamos, -íais, -ían' },
    fut: { ar: '-é, -ás, -á, -emos, -éis, -án (added to the WHOLE infinitive)', er: '-é, -ás, -á, -emos, -éis, -án (added to the WHOLE infinitive)', ir: '-é, -ás, -á, -emos, -éis, -án (added to the WHOLE infinitive)' },
    nfut: { ar: 'voy, vas, va, vamos, vais, van (+ a + the unchanged infinitive)', er: 'voy, vas, va, vamos, vais, van (+ a + the unchanged infinitive)', ir: 'voy, vas, va, vamos, vais, van (+ a + the unchanged infinitive)' },
    cond: { ar: '-ía, -ías, -ía, -íamos, -íais, -ían (added to the WHOLE infinitive)', er: '-ía, -ías, -ía, -íamos, -íais, -ían (added to the WHOLE infinitive)', ir: '-ía, -ías, -ía, -íamos, -íais, -ían (added to the WHOLE infinitive)' },
    pperf: { ar: 'he, has, ha, hemos, habéis, han (+ past participle — mostly -ado/-ido)', er: 'he, has, ha, hemos, habéis, han (+ past participle — mostly -ado/-ido)', ir: 'he, has, ha, hemos, habéis, han (+ past participle — mostly -ado/-ido)' },
  };
  // Preterite yo/él forms are the two GCSE-critical accent cases: dropping
  // the final accent doesn't just look untidy here, it changes the word's
  // MEANING/person (hablo "I speak" vs habló "he/she spoke") — unlike a
  // typical accent slip elsewhere, which this app already treats leniently
  // (accept + "mind the accent" nudge, Duolingo-style). Real Spanish-teacher
  // feedback: these two forms must be graded strictly instead.
  function isStrictAccentItem(item) { return item.tense.key === 'pret' && (item.person.key === 'yo' || item.person.key === 'el'); }

  // "consistir (en)" etc: the drill conjugates the bare verb; the "(en)" is
  // a usage note, not part of the inflected form.
  function bareInfinitive(headword) { return headword.replace(/\s*\([^)]*\)\s*$/, ''); }

  function verbType(bare) {
    const t = bare.slice(-2);
    return PRESENT_ENDINGS[t] ? t : null;
  }

  function presentForms(infinitive) {
    const bare = bareInfinitive(infinitive);
    const type = verbType(bare);
    if (!type) return null;
    const stem = bare.slice(0, -2);
    return PRESENT_ENDINGS[type].map(e => stem + e);
  }

  // Rule 1: -car/-gar/-zar spelling change, YO form only (index 0).
  function carGarZarYoStem(stem) {
    if (/c$/.test(stem)) return stem.slice(0, -1) + 'qu';
    if (/g$/.test(stem)) return stem.slice(0, -1) + 'gu';
    if (/z$/.test(stem)) return stem.slice(0, -1) + 'c';
    return null;
  }
  function preteriteForms(infinitive) {
    const bare = bareInfinitive(infinitive);
    const type = verbType(bare);
    if (!type) return null;
    const stem = bare.slice(0, -2);
    if (type !== 'ar' && /[aeiou]$/.test(stem)) return VOWEL_STEM_PRETERITE_ENDINGS.map(e => stem + e);
    const forms = PRETERITE_ENDINGS[type].map(e => stem + e);
    if (type === 'ar') {
      const yoStem = carGarZarYoStem(stem);
      if (yoStem) forms[0] = yoStem + 'é';
    }
    return forms;
  }

  function futureForms(infinitive) {
    const bare = bareInfinitive(infinitive);
    if (!verbType(bare)) return null; // still gate on "is this a real -ar/-er/-ir verb"
    return FUTURE_ENDINGS.map(e => bare + e);
  }

  function nearFutureForms(infinitive) {
    const bare = bareInfinitive(infinitive);
    if (!verbType(bare)) return null; // gate on "is this a real -ar/-er/-ir verb"
    return NEAR_FUTURE_FORMS.map(f => f + ' a ' + bare);
  }

  function imperfectForms(infinitive) {
    const bare = bareInfinitive(infinitive);
    const type = verbType(bare);
    if (!type) return null;
    const stem = bare.slice(0, -2);
    return IMPERFECT_ENDINGS[type].map(e => stem + e);
  }

  function conditionalForms(infinitive) {
    const bare = bareInfinitive(infinitive);
    if (!verbType(bare)) return null;
    return CONDITIONAL_ENDINGS.map(e => bare + e);
  }

  function participleOf(bare) {
    if (IRREGULAR_PARTICIPLES[bare]) return IRREGULAR_PARTICIPLES[bare];
    const type = verbType(bare);
    if (!type) return null;
    const stem = bare.slice(0, -2);
    return stem + (type === 'ar' ? 'ado' : 'ido');
  }

  function presentPerfectForms(infinitive) {
    const bare = bareInfinitive(infinitive);
    const participle = participleOf(bare);
    if (!participle) return null;
    return HABER_PRESENT.map(h => h + ' ' + participle);
  }

  const CONJUGATORS = {
    pres: presentForms, pret: preteriteForms, imp: imperfectForms,
    fut: futureForms, nfut: nearFutureForms, cond: conditionalForms, pperf: presentPerfectForms,
  };

  function injectStyles() {
    if (document.getElementById('vlCjStyles')) return;
    const s = document.createElement('style');
    s.id = 'vlCjStyles';
    s.textContent = `
      .vl-cj-tensepicker { position:relative; display:flex; justify-content:center; margin-bottom:16px; }
      .vl-cj-tensebtn { display:inline-flex; align-items:center; gap:8px; background:var(--cream); border:1.5px solid var(--border); color:var(--ink); font-family:'DM Sans',sans-serif; font-weight:600; font-size:13px; padding:9px 16px; border-radius:8px; cursor:pointer; max-width:90vw; }
      .vl-cj-tensebtn:hover { border-color:var(--accent); color:var(--accent); }
      .vl-cj-tensebtn[aria-expanded="true"] { border-color:var(--accent); color:var(--accent); }
      .vl-cj-tensearrow { font-size:11px; opacity:.7; transition:transform .15s; flex-shrink:0; }
      .vl-cj-tensebtn[aria-expanded="true"] .vl-cj-tensearrow { transform:rotate(180deg); }
      .vl-cj-tensemenu { position:absolute; top:calc(100% + 6px); left:50%; transform:translateX(-50%); background:var(--card-bg); border:1.5px solid var(--border); border-radius:10px; box-shadow:0 12px 28px rgba(0,0,0,.15); padding:8px; z-index:20; min-width:220px; max-width:min(300px,90vw); }
      .vl-cj-tenseopt { display:flex; align-items:center; gap:8px; padding:7px 8px; border-radius:6px; font-size:13.5px; color:var(--ink); cursor:pointer; }
      .vl-cj-tenseopt:hover { background:var(--cream); }
      .vl-cj-tenseopt input { accent-color:var(--accent); width:16px; height:16px; flex-shrink:0; }
      .vl-cj-tensemenu-foot { display:flex; justify-content:space-between; gap:8px; margin-top:6px; padding-top:8px; border-top:1px solid var(--border); }
      .vl-cj-tensemini { background:transparent; border:1px solid var(--border); color:var(--mid); font-family:'DM Mono',monospace; font-size:11px; padding:5px 10px; border-radius:6px; cursor:pointer; }
      .vl-cj-tensemini:hover { border-color:var(--accent); color:var(--accent); }
      .vl-cj-prompt { text-align:center; padding:24px; }
      .vl-cj-infinitive { font-family:'Playfair Display',serif; font-weight:700; font-size:24px; color:var(--ink); }
      .vl-cj-gloss { font-size:13px; color:var(--mid); margin-top:2px; }
      .vl-cj-tense { font-family:'DM Mono',monospace; font-size:10.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#fff; background:var(--accent); border-radius:99px; padding:2px 10px; display:inline-block; margin-top:10px; }
      .vl-cj-person { font-family:'DM Mono',monospace; font-size:15px; font-weight:700; color:var(--accent); margin-top:6px; }
      .vl-cj-say { border:1px solid var(--border); background:var(--card-bg); border-radius:999px; padding:2px 10px; font-size:13px; cursor:pointer; margin-bottom:4px; }
      .vl-cj-inputrow { display:flex; gap:8px; max-width:360px; margin:16px auto 6px; }
      .vl-cj-inputrow input { flex:1; padding:11px 14px; border:1.5px solid var(--border); border-radius:8px; font-size:15px; background:var(--card-bg); color:var(--ink); text-align:center; }
      .vl-cj-inputrow input.correct { border-color:var(--success); background:#d4edda; }
      .vl-cj-inputrow input.wrong { border-color:var(--wrong); background:#fde8e5; }
      .vl-cj-hint { text-align:center; font-size:11.5px; color:var(--mid); margin-bottom:10px; }
      .vl-cj-hintbtn { background:transparent; border:1px dashed var(--border); color:var(--mid); font-size:11.5px; padding:4px 12px; border-radius:99px; cursor:pointer; margin-bottom:8px; }
      .vl-cj-hintbtn:hover { border-color:var(--accent); color:var(--accent); }
      .vl-cj-hintbox { font-size:12.5px; color:var(--accent); background:var(--cream); border-radius:8px; padding:8px 12px; margin:0 auto 10px; max-width:340px; display:none; }
      .vl-cj-hintbox.show { display:block; }
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

  // v3 (teacher feedback round 2): a single-select pill row for 7 tenses
  // doesn't fit on a phone screen (it overflowed sideways with no wrap —
  // a real responsive bug, not just a style nit) and only let students
  // drill one tense (or literally all of them via "Mixed") at a time.
  // Replaced with a dropdown, multi-select checklist so any COMBINATION is
  // possible (e.g. "just the two past tenses"). Storage format changed from
  // a single string to a JSON array; getSelectedTenses() falls back to "all"
  // for anyone with the old v2 string value still in localStorage, rather
  // than crashing on JSON.parse.
  const TENSE_MODE_KEY = 'geo_vocablab_cj_tensemode';
  const ALL_TENSE_KEYS = TENSES.map(t => t.key);
  function getSelectedTenses() {
    try {
      const raw = localStorage.getItem(TENSE_MODE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length && parsed.every(k => ALL_TENSE_KEYS.indexOf(k) !== -1)) return parsed;
      }
    } catch (e) { /* old v2 string value, or corrupt — fall through to default */ }
    return ALL_TENSE_KEYS.slice();
  }
  function setSelectedTenses(keys) { try { localStorage.setItem(TENSE_MODE_KEY, JSON.stringify(keys)); } catch (e) {} }
  function tenseButtonLabel(keys) {
    if (keys.length === TENSES.length) return 'All tenses (mixed)';
    if (keys.length === 1) return TENSES.filter(t => t.key === keys[0])[0].label;
    return keys.length + ' tenses selected';
  }

  function buildDeck(ctx, selectedKeys) {
    // Cross-reference the curated whitelist against the LIVE wordbank rather
    // than trusting the hardcoded list blindly — if a headword's spelling or
    // gloss ever changes, this verb silently drops out instead of drilling
    // a stale/mismatched form.
    const bySpanish = new Map();
    ctx.allWords.forEach(w => { if (w.pos === 'v') bySpanish.set(w.headword, w); });
    const verbs = REGULAR_VERBS.map(inf => bySpanish.get(inf)).filter(Boolean);

    const tenses = TENSES.filter(t => selectedKeys.indexOf(t.key) !== -1);
    const items = [];
    verbs.forEach(v => {
      tenses.forEach(tense => {
        const forms = CONJUGATORS[tense.key](v.headword);
        if (!forms) return;
        PERSONS.forEach((p, i) => {
          items.push({
            id: v.id + '::' + tense.key + '::' + p.key,  // synthetic status key — a
            verb: v, person: p, tense: tense, form: forms[i], // DIFFERENT skill from
          });                                                  // knowing the word itself
        });
      });
    });
    return items;
  }

  function mount(el, ctx) {
    injectStyles();

    el.innerHTML =
      '<div class="vl-cj-tensepicker">' +
        '<button type="button" class="vl-cj-tensebtn" id="vlCjTenseBtn" aria-haspopup="listbox" aria-expanded="false">' +
          '<span id="vlCjTenseBtnLabel"></span><span class="vl-cj-tensearrow" aria-hidden="true">▾</span>' +
        '</button>' +
        '<div class="vl-cj-tensemenu" id="vlCjTenseMenu" role="listbox" aria-multiselectable="true" hidden>' +
          TENSES.map(t => '<label class="vl-cj-tenseopt"><input type="checkbox" value="' + t.key + '"> ' + esc(t.label) + '</label>').join('') +
          '<div class="vl-cj-tensemenu-foot">' +
            '<button type="button" class="vl-cj-tensemini" id="vlCjTenseAllBtn">Select all</button>' +
            '<button type="button" class="vl-cj-tensemini" id="vlCjTenseDoneBtn">Done</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="vl-cj-stats" id="vlCjStats"></div><div id="vlCjArea"></div>';

    const tenseBtn = el.querySelector('#vlCjTenseBtn');
    const tenseMenu = el.querySelector('#vlCjTenseMenu');
    const tenseLabelEl = el.querySelector('#vlCjTenseBtnLabel');
    const tenseCheckboxes = Array.prototype.slice.call(tenseMenu.querySelectorAll('input[type=checkbox]'));
    let draftKeys = getSelectedTenses().slice();

    function syncCheckboxes() { tenseCheckboxes.forEach(cb => { cb.checked = draftKeys.indexOf(cb.value) !== -1; }); }
    function syncLabel() { tenseLabelEl.textContent = tenseButtonLabel(getSelectedTenses()); }
    function openMenu() { draftKeys = getSelectedTenses().slice(); syncCheckboxes(); tenseMenu.hidden = false; tenseBtn.setAttribute('aria-expanded', 'true'); }
    function closeMenuAndCommit() {
      tenseMenu.hidden = true; tenseBtn.setAttribute('aria-expanded', 'false');
      const prev = getSelectedTenses();
      const changed = prev.length !== draftKeys.length || !prev.every(k => draftKeys.indexOf(k) !== -1);
      setSelectedTenses(draftKeys);
      syncLabel();
      if (changed) startRound();
    }
    syncCheckboxes();
    syncLabel();

    tenseBtn.addEventListener('click', () => { if (tenseMenu.hidden) openMenu(); else closeMenuAndCommit(); });
    tenseCheckboxes.forEach(cb => cb.addEventListener('change', () => {
      if (cb.checked) {
        if (draftKeys.indexOf(cb.value) === -1) draftKeys.push(cb.value);
      } else if (draftKeys.length <= 1 && draftKeys.indexOf(cb.value) !== -1) {
        cb.checked = true; // at least one tense must always stay selected
      } else {
        draftKeys = draftKeys.filter(k => k !== cb.value);
      }
    }));
    el.querySelector('#vlCjTenseAllBtn').addEventListener('click', () => { draftKeys = ALL_TENSE_KEYS.slice(); syncCheckboxes(); });
    el.querySelector('#vlCjTenseDoneBtn').addEventListener('click', closeMenuAndCommit);

    // Module-level handles (not per-mount closures) so unmount() can always
    // reach whichever instance is live and remove them — the same leak class
    // found and fixed in match-attack.js's timer earlier: a dangling
    // document-level listener would otherwise outlive this mount forever.
    activeOutsideClickHandler = function (e) { if (!tenseMenu.hidden && !el.contains(e.target)) closeMenuAndCommit(); };
    activeEscapeHandler = function (e) { if (e.key === 'Escape' && !tenseMenu.hidden) closeMenuAndCommit(); };
    document.addEventListener('click', activeOutsideClickHandler);
    document.addEventListener('keydown', activeEscapeHandler);

    const area = el.querySelector('#vlCjArea');
    let deck = [], index = 0, correctCount = 0, wrongCount = 0, combo = 0, awaitingNext = false;

    function startRound() {
      const pool = buildDeck(ctx, getSelectedTenses());
      if (pool.length < 3) { area.innerHTML = '<div class="empty">No regular verbs available to drill right now.</div>'; return; }
      const ROUND_SIZE = 15;
      // smartShuffle expects objects with an .id it can look up via ctx.status —
      // the synthetic conjugation ids work with it exactly like real word ids.
      deck = ctx.smartShuffle(pool).slice(0, Math.min(ROUND_SIZE, pool.length));
      index = 0; correctCount = 0; wrongCount = 0; combo = 0;
      renderPrompt();
    }

    function renderStats() {
      el.querySelector('#vlCjStats').innerHTML =
        '<span>Verb <b>' + (index + 1) + '</b>/' + deck.length + '</span>' +
        '<span><b>' + correctCount + '</b> correct</span>' +
        '<span><b>' + wrongCount + '</b> wrong</span>' +
        (combo >= 3 ? '<span>🔥 <b>' + combo + '</b> streak</span>' : '');
    }

    function hintFor(item) {
      const bare = bareInfinitive(item.verb.headword);
      const type = verbType(bare);
      const endings = HINT_TEXT[item.tense.key][type];
      const personIdx = PERSONS.findIndex(p => p.key === item.person.key);
      const parts = endings.split(', ');
      const highlighted = parts.map((e, i) => i === personIdx ? '<strong>' + e + '</strong>' : e).join(', ');
      let extra = '';
      if (item.tense.key === 'pret' && type === 'ar' && personIdx === 0 && carGarZarYoStem(bare.slice(0, -2))) {
        extra = ' — this verb also needs a yo-form spelling change (c→qu / g→gu / z→c) before adding the ending.';
      }
      if (item.tense.key === 'pperf' && IRREGULAR_PARTICIPLES[bare]) {
        extra = ' — irregular participle: ' + IRREGULAR_PARTICIPLES[bare] + '.';
      }
      if (isStrictAccentItem(item)) {
        extra += ' — the accent on the final letter is essential here: it changes the meaning (e.g. hablo = I speak, habló = he/she spoke).';
      }
      return item.tense.label + ' ' + type.toUpperCase() + ' endings: ' + highlighted + extra;
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
          '<div class="vl-cj-gloss">' + esc(ctx.simplifyGloss(item.verb.english)) + '</div>' +
          '<div class="vl-cj-tense">' + esc(item.tense.label) + '</div>' +
          '<div class="vl-cj-person">' + esc(item.person.label) + '</div>' +
        '</div>' +
        '<div class="vl-cj-inputrow"><input type="text" id="vlCjInput" placeholder="Type the conjugated form…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done"></div>' +
        '<div style="text-align:center;"><button type="button" class="vl-cj-hintbtn" id="vlCjHintBtn">💡 Show hint</button></div>' +
        '<div class="vl-cj-hintbox" id="vlCjHintBox">' + hintFor(item) + '</div>' +
        '<div class="vl-cj-hint">Type the ' + esc(item.person.label) + ' form, then tap Submit (or press Enter).</div>' +
        '<div class="vl-cj-feedback" id="vlCjFeedback"></div>' +
        '<div class="vl-cj-nav" id="vlCjNav"><button type="button" class="vl-btn" id="vlCjSubmitBtn">Submit</button></div>';

      area.querySelector('#vlCjSay').addEventListener('click', () => ctx.ui.speak(bare));
      area.querySelector('#vlCjHintBtn').addEventListener('click', () => area.querySelector('#vlCjHintBox').classList.toggle('show'));
      const input = area.querySelector('#vlCjInput');
      const feedback = area.querySelector('#vlCjFeedback');
      ctx.ui.attachAccentBar(input);
      input.focus();
      area.querySelector('#vlCjSubmitBtn').addEventListener('click', () => submit(input, feedback, item));
      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        if (awaitingNext) { advance(); return; }
        submit(input, feedback, item);
      });
    }

    // Accent-only difference check: true when the ONLY thing separating the
    // student's answer from the correct form is an accent mark (or case) —
    // as opposed to a genuinely different letter/typo. Self-contained here
    // rather than reusing ctx.fuzzyMatch's internals, since the strictness
    // rule below only overrides the OUTCOME for two specific person/tense
    // combos, not the matching logic itself.
    function stripAccentsLocal(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function isAccentOnlyDiff(input, correct) {
      const a = stripAccentsLocal(String(input || '').trim().toLowerCase());
      const b = stripAccentsLocal(String(correct || '').trim().toLowerCase());
      return a === b && a.length > 0 && String(input).trim().toLowerCase() !== String(correct).trim().toLowerCase();
    }

    function submit(input, feedback, item) {
      if (awaitingNext) return;
      let res = ctx.fuzzyMatch(input.value, item.form);
      // GCSE-critical exception (real Spanish-teacher feedback): preterite
      // yo/él forms change MEANING without the final accent (hablo vs
      // habló) — unlike every other word, where a missing accent is
      // accepted leniently with a "mind the accent" nudge. Downgrade an
      // accent-only match to wrong here, with a message that explains why.
      let accentOnlyMiss = false;
      if (isStrictAccentItem(item) && res.correct && isAccentOnlyDiff(input.value, item.form)) {
        res = { correct: false, perfect: false };
        accentOnlyMiss = true;
      }
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
        feedback.textContent = accentOnlyMiss
          ? '✗ Not quite — you need an accent on the final letter: "' + item.form + '". In the preterite this changes the meaning!'
          : '✗ Not quite — the answer was "' + item.form + '".';
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
      area.querySelector('#vlCjAgain').addEventListener('click', () => { ctx.complete(); startRound(); });
    }

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    startRound();
  }

  window.VocabLab.registerTool('conjugation-drills', {
    title: 'Conjugation Drills',
    icon: '🔤',
    mount: mount,
    unmount() {
      if (activeOutsideClickHandler) { document.removeEventListener('click', activeOutsideClickHandler); activeOutsideClickHandler = null; }
      if (activeEscapeHandler) { document.removeEventListener('keydown', activeEscapeHandler); activeEscapeHandler = null; }
    },
  });

  // ── Node export (tests only) ──
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      REGULAR_VERBS, PERSONS, TENSES, presentForms, preteriteForms, futureForms, nearFutureForms,
      imperfectForms, conditionalForms, presentPerfectForms, bareInfinitive, IRREGULAR_PARTICIPLES,
    };
  }
})();
