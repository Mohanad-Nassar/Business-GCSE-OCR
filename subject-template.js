// ══════════════════════════════════════════════════════════════
// SUBJECT CONTENT TEMPLATE (shared) — the download → fill → upload
// path for teacher-authored subjects (docs/TEACHER-SUBJECTS-SPEC.md).
//
// A teacher downloads one JSON file for their subject, fills it in —
// by hand, or by handing it to an AI tool with the provided prompt —
// and uploads it back; the wizard turns it into topics + the
// standard 9-activity structure. This file owns the format, so the
// wizard (teacher-subjects.html) never parses JSON itself.
//
// Public API (window.SubjectTemplate):
//   build(subject, topics)  -> template object to download
//                              (pre-filled from existing topics;
//                              a worked example when there are none)
//   fileName(subject)       -> '<slug>-content.json'
//   aiPrompt(subject)       -> copy-paste prompt for ChatGPT/Claude/…
//   parse(jsonText)         -> { ok, errors[], topics[], counts }
//        topics[i] = { unit, title, publish,
//                      sections: <normalised storage shape> }
//   slugify(title)          -> 'topic-slug'
//   uniqueSlug(base, taken) -> collision-free slug (Set/array taken)
//
// Security: every HTML-capable field is sanitised through
// RichText.sanitize (rich-editor.js MUST be loaded first); if it is
// somehow missing we fail CLOSED by escaping to plain text. Plain
// strings are stored raw and escaped at render time by the player.
// ══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  var FORMAT = 'vidya-subject-template-v1';

  // ── Limits (mirrored in the validator messages) ──
  var MAX_TOPICS = 60, MAX_ITEMS = 50;
  var MAX_SHORT = 300, MAX_QUESTION = 1200, MAX_HTML = 100000;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Plain text stays plain; anything containing markup is sanitised.
  // Multi-paragraph plain text becomes <p>…</p> per blank-line block.
  function toSafeHtml(value) {
    var s = String(value == null ? '' : value).trim();
    if (!s) return '';
    if (s.indexOf('<') !== -1) {
      if (window.RichText && typeof window.RichText.sanitize === 'function') {
        return window.RichText.sanitize(s);
      }
      return '<p>' + esc(s) + '</p>'; // fail closed: treat as text
    }
    return s.split(/\n\s*\n/).map(function (para) {
      return '<p>' + esc(para).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  function slugify(title) {
    var s = String(title || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/g, '');
    return s || 'topic';
  }

  function uniqueSlug(base, taken) {
    var has = taken instanceof Set ? function (x) { return taken.has(x); }
      : function (x) { return (taken || []).indexOf(x) !== -1; };
    if (!has(base)) return base;
    for (var i = 2; i < 500; i++) {
      var cand = base + '-' + i;
      if (!has(cand)) return cand;
    }
    return base + '-' + Date.now().toString(36);
  }

  // ══════════════════════════════════════════════════════════════
  // BUILD (download)
  // ══════════════════════════════════════════════════════════════

  var README = [
    'HOW TO USE THIS FILE',
    'HOW TO USE THIS FILE',
    '',
    'Each object in "topics" becomes one topic page (a lesson) for your',
    'students, with up to nine activities. You can fill in a whole subject, a',
    'single unit, or just one lesson — import as often as you like; topics with',
    'the same "title" are UPDATED, new titles are ADDED, nothing else is touched.',
    '',
    'THE NINE ACTIVITIES (every one is optional — DELETE any you do not want):',
    ' • notes ............ the main revision notes students read first.',
    ' • notesCheck ....... a quick multiple-choice question on the notes.',
    '                      RECOMMENDED: without it, "one question at a time"',
    '                      mode has nothing to answer on the notes card.',
    ' • keyLearning ...... short teaching points, one idea each; give every one a',
    '                      "check" MCQ. Use as many as the lesson needs, up to 15.',
    ' • keyTerms ......... term + definition pairs → flashcards AND matching',
    '                      (needs at least 4 to make a good matching game).',
    ' • mcq .............. quick-fire multiple-choice questions.',
    ' • fillInTheBlanks .. sentences with the missing word(s) in [square',
    '                      brackets], e.g. "The heart has [four] chambers."',
    '                      (1–4 blanks per sentence).',
    ' • trueFalse ........ statements marked true or false.',
    ' • misconceptions ... a common mistake + the correction, plus a "check" MCQ',
    '                      that tests the student now has it right (recommended).',
    ' • examTips ......... exam technique advice: a "title", a "tip", and a "check"',
    '                      MCQ that tests the technique (recommended).',
    ' • examPractice ..... longer written questions: "question", "marks" (1–25),',
    '                      an optional "hint", and a "markScheme" students',
    '                      self-mark against. NO options/answer (it is written).',
    '',
    'ANSWERS: for every "check" and every "mcq", "answer" is the LETTER of the',
    'correct option — "A", "B", "C" or "D" (A is the first option). True/false',
    'takes true or false (no quotes).',
    '',
    'FORMATTING: "notes", keyLearning "text", exam-tip "tip" and "markScheme"',
    'accept simple HTML (<p>, <strong>, <em>, <ul><li>, <table>). Everything',
    'else is plain text.',
    '',
    'NO CODING NEEDED: open the AI helper in the builder, copy the prompt, and',
    'paste it into ChatGPT / Claude / Gemini together with this file — then',
    'upload what it gives back (My Content → your subject → Import). ALWAYS read',
    'through anything an AI wrote before you publish it to students.',
  ];

  function exampleTopic() {
    return {
      unit: '1 · Getting started',
      title: 'Example topic — replace me',
      publish: false,
      notes: 'Write the main lesson notes here. Plain text is fine — leave a blank line to start a new paragraph.',
      notesCheck: {
        question: 'A quick question to check they read the notes above?',
        options: ['The right answer', 'A tempting wrong answer', 'Another wrong answer', 'A clearly wrong answer'],
        answer: 'A',
        explain: 'One sentence on why the right answer is right.',
      },
      keyLearning: [{
        title: 'The first big idea',
        text: 'Explain the idea in two or three short sentences a student can revise from.',
        check: {
          question: 'A quick question to check they understood the idea above?',
          options: ['The right answer', 'A tempting wrong answer', 'Another wrong answer', 'A clearly wrong answer'],
          answer: 'A',
          explain: 'One sentence on why the right answer is right.',
        },
      }],
      keyTerms: [
        { term: 'First key word', definition: 'What it means, in one sentence.' },
        { term: 'Second key word', definition: 'What it means, in one sentence.' },
        { term: 'Third key word', definition: 'Flashcards and the matching game need at least 4 terms to work well.' },
        { term: 'Fourth key word', definition: 'Add as many as the topic needs.' },
      ],
      mcq: [{
        question: 'A practice multiple-choice question?',
        options: ['Wrong', 'Wrong', 'Right', 'Wrong'],
        answer: 'C',
        explain: 'Why C is correct.',
      }],
      fillInTheBlanks: [
        { sentence: 'Wrap the missing word in [brackets], up to [four] blanks per sentence.' },
      ],
      trueFalse: [
        { statement: 'A statement students decide is true or false.', answer: true, explain: 'Why.' },
      ],
      misconceptions: [{
        misconception: 'Something students often get wrong.',
        reality: 'What is actually correct, and why the mix-up happens.',
        check: {
          question: 'A question that checks they now have this right?',
          options: ['The right idea', 'The old mistake', 'A different wrong idea', 'Another wrong idea'],
          answer: 'A',
          explain: 'Why the right idea is right.',
        },
      }],
      examTips: [{
        title: 'How to answer “describe” questions',
        tip: 'The advice itself.',
        check: {
          question: 'A question that checks they can use this technique?',
          options: ['Do it the right way', 'A common wrong approach', 'Another wrong approach', 'A third wrong approach'],
          answer: 'A',
          explain: 'Why that is the right approach.',
        },
      }],
      examPractice: [{
        question: 'A longer written practice question?',
        marks: 4,
        hint: 'Optional nudge shown before they answer.',
        markScheme: 'What a good answer includes — students self-mark against this.',
      }],
    };
  }

  // Convert one stored topic (custom_topics row) back to the
  // author-facing template shape.
  function topicToTemplate(row) {
    var sec = row.sections || {};
    var out = { unit: row.section || '', title: row.title, publish: row.status === 'published' };
    function on(key) { return sec[key] && sec[key].enabled !== false; }
    function checkOut(c) {
      return c && c.question ? {
        question: c.question, options: (c.options || []).slice(),
        answer: 'ABCDEF'[c.answer] || 'A', explain: c.explain || '',
      } : null;
    }
    if (on('reading')) {
      out.notes = sec.reading.html || '';
      var nc = checkOut(sec.reading.check);
      if (nc) out.notesCheck = nc;
    }
    if (on('learn')) out.keyLearning = (sec.learn.items || []).map(function (i) {
      var o = { title: i.title || '', text: i.html || '' };
      if (i.check) o.check = {
        question: i.check.question, options: i.check.options.slice(),
        answer: 'ABCDEF'[i.check.answer] || 'A', explain: i.check.explain || '',
      };
      return o;
    });
    if (on('terms')) out.keyTerms = (sec.terms.pairs || []).map(function (p) {
      return { term: p.term, definition: p.definition };
    });
    if (on('mcq')) out.mcq = (sec.mcq.questions || []).map(function (q) {
      return { question: q.question, options: q.options.slice(), answer: 'ABCDEF'[q.answer] || 'A', explain: q.explain || '' };
    });
    if (on('fib')) out.fillInTheBlanks = (sec.fib.questions || []).map(function (q) {
      return { sentence: q.text };
    });
    if (on('tf')) out.trueFalse = (sec.tf.questions || []).map(function (q) {
      return { statement: q.statement, answer: !!q.answer, explain: q.explain || '' };
    });
    if (on('misc')) out.misconceptions = (sec.misc.items || []).map(function (i) {
      var o = { misconception: i.myth, reality: i.truth };
      if (i.check) o.check = {
        question: i.check.question, options: i.check.options.slice(),
        answer: 'ABCDEF'[i.check.answer] || 'A', explain: i.check.explain || '',
      };
      return o;
    });
    if (on('tips')) out.examTips = (sec.tips.items || []).map(function (i) {
      var o = { title: i.title || '', tip: i.html || '' };
      var c = checkOut(i.check);
      if (c) o.check = c;
      return o;
    });
    if (on('exam')) out.examPractice = (sec.exam.questions || []).map(function (q) {
      return { question: q.question, marks: q.marks, hint: q.hint || '', markScheme: q.markScheme || '' };
    });
    return out;
  }

  // Build a template object. `scope` (optional) narrows what a downloaded
  // file covers and how the readme/example read, so teachers can work
  // lesson-by-lesson or unit-by-unit instead of the whole subject at once:
  //   { type: 'subject' }                       — every topic (default)
  //   { type: 'unit',   unit: '<section text>' } — one unit's topics
  //   { type: 'lesson', topicId: '<id>' }        — a single topic
  //   { type: 'blank',  unit: '<optional>' }     — one fresh example topic
  // A scope with no matching stored topics yields one example topic so the
  // file is never empty (a starting point for that unit/lesson).
  function build(subject, topics, scope) {
    scope = scope || { type: 'subject' };
    var all = topics || [];
    var picked;
    if (scope.type === 'blank') {
      var ex = exampleTopic();
      if (scope.unit) ex.unit = scope.unit;
      picked = [ex];
    } else if (scope.type === 'lesson') {
      picked = all.filter(function (t) { return t.id === scope.topicId; }).map(topicToTemplate);
      if (!picked.length) picked = [exampleTopic()];
    } else if (scope.type === 'unit') {
      picked = all.filter(function (t) { return (t.section || '') === (scope.unit || ''); }).map(topicToTemplate);
      if (!picked.length) { var e2 = exampleTopic(); e2.unit = scope.unit || e2.unit; picked = [e2]; }
    } else {
      picked = all.length ? all.map(topicToTemplate) : [exampleTopic()];
    }
    return {
      format: FORMAT,
      scope: scope.type,
      _readme: README.slice(),
      subject: {
        name: subject && subject.name || '',
        level: subject && subject.level || '',
        examBoard: subject && subject.exam_board || '',
      },
      topics: picked,
    };
  }

  function fileName(subject, scope) {
    var base = slugify(subject && (subject.slug || subject.name) || 'subject');
    if (scope && scope.type === 'unit' && scope.unit) return base + '-' + slugify(scope.unit) + '-content.json';
    if (scope && scope.type === 'lesson' && scope.topicTitle) return base + '-' + slugify(scope.topicTitle) + '-content.json';
    return base + '-content.json';
  }

  function aiPrompt(subject, scope) {
    var name = subject && subject.name || 'my subject';
    var level = subject && subject.level ? (' at ' + subject.level + ' level') : '';
    var board = subject && subject.exam_board ? (' (' + subject.exam_board + ')') : '';
    scope = scope || { type: 'subject' };
    var ask;
    if (scope.type === 'lesson') ask = 'Fill in the ONE topic in the file (the lesson I am editing). Keep it as a single object in "topics".';
    else if (scope.type === 'unit') ask = 'Fill in the topics for the unit "' + (scope.unit || '') + '". Add one object to "topics" for each lesson in that unit.';
    else ask = 'Add one object to "topics" for each lesson I list at the bottom.';

    return [
      'You are helping a teacher write revision content for "' + name + '"' + level + board + '.',
      'Attached is a JSON template. Fill it in and return ONLY the completed JSON — same structure, same key names, valid JSON, nothing before or after it.',
      '',
      ask,
      '',
      'EACH topic object may contain these sections. Include every section that fits the lesson and DELETE the rest. A "check" is a multiple-choice question: { "question", "options": ["…","…","…","…"], "answer": "A", "explain" }.',
      '',
      '• "notes": string. The main revision notes. Simple HTML is allowed (<p>, <strong>, <em>, <ul><li>, <table>).',
      '• "notesCheck": one check on the notes. Include it whenever you write notes.',
      '• "keyLearning": array of teaching points, each { "title", "text", "check": {…} }.',
      '     Break the lesson into as MANY small, focused points as it takes to cover',
      '     everything the students must learn — one idea per point — but NO MORE THAN 15.',
      '     Give EVERY point a check question (required).',
      '• "keyTerms": array of { "term", "definition" }. Aim 6–12 (they power flashcards and the matching game; need at least 4).',
      '• "mcq": array of { "question", "options": ["…","…","…","…"], "answer": "A"–"D", "explain" }. Aim 6–10.',
      '• "fillInTheBlanks": array of { "sentence" }. Wrap each missing word in [square brackets], 1–4 per sentence. Aim 4–6.',
      '• "trueFalse": array of { "statement", "answer": true|false, "explain" }. Aim 6–8.',
      '• "misconceptions": array of { "misconception", "reality", "check": {…} }. The "check" is REQUIRED — a question that tests whether the student now has the idea right. Aim 3–5.',
      '• "examTips": array of { "title", "tip", "check": {…} }. The "check" is REQUIRED — a short question that tests the technique in the tip. Aim 2–4.',
      '• "examPractice": array of { "question", "marks": 1–25, "hint" (optional), "markScheme" }. Written questions — NO options and NO "answer". Aim 2–4.',
      '',
      'RULES:',
      '- "answer" is ALWAYS the LETTER of the correct option: "A", "B", "C" or "D" (A = the first option). Never a number, never the answer text.',
      '- true/false "answer" is the literal true or false (no quotes).',
      '- EVERY check and mcq needs a check question — misconceptions and exam tips included. Do not leave any of them out.',
      '- Guard against "pick the longest answer" guessing: the correct option must NOT be the longest one. Make at least one WRONG option as long as (or longer than) the correct answer, and keep all options a similar length and level of detail, so a student cannot tell the answer from its length.',
      '- Give every question plausible wrong options and a one-line "explain".',
      '- Keep "publish": false on every topic — the teacher reviews before publishing.',
      '- Use UK curriculum wording. Do not invent facts; write "[CHECK THIS]" beside anything you are unsure of.',
      '- Do not add keys that are not listed above.',
      '',
      scope.type === 'subject' ? 'The lessons I want:\n1. (list your lessons here)' :
        scope.type === 'unit' ? 'The lessons in this unit:\n1. (list the lessons here)' :
        'Write this lesson thoroughly.',
    ].join('\n');
  }

  // ══════════════════════════════════════════════════════════════
  // PARSE (upload) — friendly validation + normalisation
  // ══════════════════════════════════════════════════════════════

  function normAnswer(val, optionCount, path, errors) {
    if (typeof val === 'number' && isFinite(val) && val >= 0 && val < optionCount && val % 1 === 0) return val;
    if (typeof val === 'string') {
      var idx = 'ABCDEF'.indexOf(val.trim().toUpperCase());
      if (idx >= 0 && idx < optionCount) return idx;
      var n = parseInt(val, 10);
      if (String(n) === val.trim() && n >= 1 && n <= optionCount) return n - 1; // "1"-based number
    }
    errors.push(path + ': "answer" must be a letter between A and ' + 'ABCDEF'[optionCount - 1] + ' (got ' + JSON.stringify(val) + ')');
    return 0;
  }

  function normCheck(raw, path, errors) {
    if (raw == null) return null;
    if (typeof raw !== 'object') { errors.push(path + ': "check" must be an object'); return null; }
    var q = str(raw.question);
    if (!q) { errors.push(path + ': the check question needs a "question"'); return null; }
    var options = arr(raw.options).map(str).filter(Boolean);
    if (options.length < 2 || options.length > 6) {
      errors.push(path + ': check questions need 2–6 options (got ' + options.length + ')');
      return null;
    }
    return {
      question: clip(q, MAX_QUESTION),
      options: options.map(function (o) { return clip(o, MAX_SHORT); }),
      answer: normAnswer(raw.answer, options.length, path, errors),
      explain: clip(str(raw.explain), MAX_QUESTION),
    };
  }

  function str(v) { return v == null ? '' : String(v).trim(); }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function clip(s, n) { return s.length > n ? s.slice(0, n) : s; }
  function capItems(list, path, errors) {
    if (list.length > MAX_ITEMS) {
      errors.push(path + ': too many items (' + list.length + ') — keep it under ' + MAX_ITEMS);
      return list.slice(0, MAX_ITEMS);
    }
    return list;
  }

  function parseTopic(raw, idx, errors) {
    var label = 'Topic ' + (idx + 1);
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push(label + ': each entry in "topics" must be an object { … }');
      return null;
    }
    var title = str(raw.title);
    if (!title) { errors.push(label + ': needs a "title"'); return null; }
    if (title.length > 160) { errors.push(label + ' ("' + title.slice(0, 30) + '…"): title too long (160 max)'); return null; }
    label = 'Topic ' + (idx + 1) + ' ("' + title + '")';

    var sections = {};

    var notes = raw.notes != null ? String(raw.notes) : '';
    var notesCheck = raw.notesCheck ? normCheck(raw.notesCheck, label + ' → notesCheck', errors) : null;
    if (notes.trim()) {
      if (notes.length > MAX_HTML) errors.push(label + ': "notes" is too long (' + MAX_HTML + ' characters max)');
      else {
        sections.reading = { enabled: true, html: toSafeHtml(notes) };
        if (notesCheck) sections.reading.check = notesCheck;
      }
    } else if (notesCheck) {
      // A notes check with no notes still needs a home so the quick MCQ
      // isn't silently dropped.
      sections.reading = { enabled: true, html: '', check: notesCheck };
    }

    var learn = capItems(arr(raw.keyLearning), label + ' → keyLearning', errors).map(function (i, n) {
      var p = label + ' → keyLearning ' + (n + 1);
      var text = str(i && i.text);
      if (!text) { errors.push(p + ': needs "text" (the learning point itself)'); return null; }
      return { title: clip(str(i.title), MAX_SHORT), html: toSafeHtml(i.text), check: normCheck(i.check, p, errors) };
    }).filter(Boolean);
    if (learn.length) sections.learn = { enabled: true, items: learn };

    var terms = capItems(arr(raw.keyTerms), label + ' → keyTerms', errors).map(function (i, n) {
      var term = str(i && i.term), def = str(i && i.definition);
      if (!term || !def) { errors.push(label + ' → keyTerms ' + (n + 1) + ': needs both "term" and "definition"'); return null; }
      return { term: clip(term, MAX_SHORT), definition: clip(def, MAX_QUESTION) };
    }).filter(Boolean);
    if (terms.length) sections.terms = { enabled: true, pairs: terms };

    var mcq = capItems(arr(raw.mcq), label + ' → mcq', errors).map(function (q, n) {
      var p = label + ' → MCQ question ' + (n + 1);
      var question = str(q && q.question);
      if (!question) { errors.push(p + ': needs a "question"'); return null; }
      var options = arr(q.options).map(str).filter(Boolean);
      if (options.length < 2 || options.length > 6) { errors.push(p + ': needs 2–6 options (got ' + options.length + ')'); return null; }
      return {
        question: clip(question, MAX_QUESTION),
        options: options.map(function (o) { return clip(o, MAX_SHORT); }),
        answer: normAnswer(q.answer, options.length, p, errors),
        explain: clip(str(q.explain), MAX_QUESTION),
      };
    }).filter(Boolean);
    if (mcq.length) sections.mcq = { enabled: true, questions: mcq };

    var fib = capItems(arr(raw.fillInTheBlanks), label + ' → fillInTheBlanks', errors).map(function (q, n) {
      var p = label + ' → fill-in-the-blanks ' + (n + 1);
      var text = str(q && (q.sentence != null ? q.sentence : q.text));
      if (!text) { errors.push(p + ': needs a "sentence"'); return null; }
      var blanks = (text.match(/\[[^\[\]]+\]/g) || []).length;
      if (!blanks) { errors.push(p + ': wrap the missing word(s) in [square brackets] — none found'); return null; }
      if (blanks > 4) { errors.push(p + ': maximum 4 blanks per sentence (found ' + blanks + ')'); return null; }
      return { text: clip(text, MAX_QUESTION) };
    }).filter(Boolean);
    if (fib.length) sections.fib = { enabled: true, questions: fib };

    var tf = capItems(arr(raw.trueFalse), label + ' → trueFalse', errors).map(function (q, n) {
      var p = label + ' → true/false ' + (n + 1);
      var statement = str(q && q.statement);
      if (!statement) { errors.push(p + ': needs a "statement"'); return null; }
      var ans = q.answer;
      if (typeof ans === 'string') ans = ans.trim().toLowerCase() === 'true' ? true : ans.trim().toLowerCase() === 'false' ? false : null;
      if (typeof ans !== 'boolean') { errors.push(p + ': "answer" must be true or false'); return null; }
      return { statement: clip(statement, MAX_QUESTION), answer: ans, explain: clip(str(q.explain), MAX_QUESTION) };
    }).filter(Boolean);
    if (tf.length) sections.tf = { enabled: true, questions: tf };

    var misc = capItems(arr(raw.misconceptions), label + ' → misconceptions', errors).map(function (i, n) {
      var p = label + ' → misconception ' + (n + 1);
      var myth = str(i && i.misconception), truth = str(i && i.reality);
      if (!myth || !truth) { errors.push(p + ': needs both "misconception" and "reality"'); return null; }
      return { myth: clip(myth, MAX_QUESTION), truth: clip(truth, MAX_QUESTION), check: normCheck(i.check, p, errors) };
    }).filter(Boolean);
    if (misc.length) sections.misc = { enabled: true, items: misc };

    var tips = capItems(arr(raw.examTips), label + ' → examTips', errors).map(function (i, n) {
      var tip = str(i && i.tip);
      if (!tip) { errors.push(label + ' → exam tip ' + (n + 1) + ': needs a "tip"'); return null; }
      var o = { title: clip(str(i.title), MAX_SHORT), html: toSafeHtml(i.tip) };
      var c = normCheck(i.check, label + ' → exam tip ' + (n + 1), errors);
      if (c) o.check = c;
      return o;
    }).filter(Boolean);
    if (tips.length) sections.tips = { enabled: true, items: tips };

    var exam = capItems(arr(raw.examPractice), label + ' → examPractice', errors).map(function (q, n) {
      var p = label + ' → exam practice ' + (n + 1);
      var question = str(q && q.question);
      if (!question) { errors.push(p + ': needs a "question"'); return null; }
      var marks = typeof q.marks === 'string' ? parseInt(q.marks, 10) : q.marks;
      if (typeof marks !== 'number' || !isFinite(marks) || marks < 1 || marks > 25 || marks % 1 !== 0) {
        errors.push(p + ': "marks" must be a whole number from 1 to 25');
        return null;
      }
      return {
        question: clip(question, MAX_QUESTION), marks: marks,
        hint: clip(str(q.hint), MAX_QUESTION), markScheme: toSafeHtml(q.markScheme),
      };
    }).filter(Boolean);
    if (exam.length) sections.exam = { enabled: true, questions: exam };

    if (!Object.keys(sections).length) {
      errors.push(label + ': has no content in any section — fill in at least one (notes, mcq, keyTerms, …)');
      return null;
    }

    return {
      unit: clip(str(raw.unit != null ? raw.unit : raw.section), 120),
      title: title,
      publish: raw.publish === true,
      sections: sections,
    };
  }

  function countsFor(topics) {
    var totals = { topics: topics.length, learn: 0, terms: 0, mcq: 0, fib: 0, tf: 0, misc: 0, tips: 0, exam: 0, notes: 0 };
    topics.forEach(function (t) {
      var s = t.sections;
      if (s.reading) totals.notes++;
      if (s.learn) totals.learn += s.learn.items.length;
      if (s.terms) totals.terms += s.terms.pairs.length;
      if (s.mcq) totals.mcq += s.mcq.questions.length;
      if (s.fib) totals.fib += s.fib.questions.length;
      if (s.tf) totals.tf += s.tf.questions.length;
      if (s.misc) totals.misc += s.misc.items.length;
      if (s.tips) totals.tips += s.tips.items.length;
      if (s.exam) totals.exam += s.exam.questions.length;
    });
    return totals;
  }

  function parse(jsonText) {
    var errors = [];
    var data;
    try { data = JSON.parse(String(jsonText)); }
    catch (e) {
      return { ok: false, topics: [], counts: null, errors: [
        'This file isn’t valid JSON — it may have been edited in a word processor or cut off. ' +
        'Ask your AI tool to "output the complete corrected JSON only", or re-download the template. (' + e.message + ')',
      ] };
    }
    if (data == null || typeof data !== 'object' || Array.isArray(data)) {
      return { ok: false, topics: [], counts: null, errors: ['The file must contain a JSON object with a "topics" list.'] };
    }
    if (data.format && data.format !== FORMAT) {
      errors.push('This file was made for a different template version ("' + data.format + '") — download a fresh template and copy your content across.');
    }
    var rawTopics = arr(data.topics);
    if (!rawTopics.length) {
      errors.push('No topics found — the "topics" list is empty.');
      return { ok: false, topics: [], counts: null, errors: errors };
    }
    if (rawTopics.length > MAX_TOPICS) {
      errors.push('Too many topics (' + rawTopics.length + ') — maximum ' + MAX_TOPICS + ' per file. Split the file.');
      rawTopics = rawTopics.slice(0, MAX_TOPICS);
    }

    var topics = [];
    var seen = {};
    rawTopics.forEach(function (raw, i) {
      var t = parseTopic(raw, i, errors);
      if (!t) return;
      var key = t.title.toLowerCase();
      if (seen[key]) { errors.push('Topic ' + (i + 1) + ' ("' + t.title + '"): duplicate title — every topic needs a unique title'); return; }
      seen[key] = true;
      topics.push(t);
    });

    return { ok: errors.length === 0 && topics.length > 0, topics: topics, counts: countsFor(topics), errors: errors };
  }

  window.SubjectTemplate = {
    FORMAT: FORMAT,
    build: build,
    fileName: fileName,
    aiPrompt: aiPrompt,
    parse: parse,
    countsFor: countsFor,
    slugify: slugify,
    uniqueSlug: uniqueSlug,
    toSafeHtml: toSafeHtml, // wizard uses this for textarea → stored html fields
  };
})();
