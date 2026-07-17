const sanitizeHtml = require('sanitize-html');

// Shared server-side HTML sanitiser for the bank-sync boundary, used by BOTH
// sync-subject-bank (teacher subjects) and sync-override-bank (platform-subject
// school overrides) so the XSS storage boundary is IDENTICAL on both paths.
// Pure-JS (htmlparser2, no jsdom) so it bundles cleanly in a Netlify function.
// The allowlist mirrors the client editor's (rich-editor.js ALLOWED_TAGS /
// TAG_ATTRS / STYLE_PROPS / ALLOWED_CLASSES) so legitimate teacher formatting
// survives while scripts, event handlers and javascript: URLs are stripped —
// even from a client that bypassed the editor and PATCHed content directly.
const STYLE_PROPS = ['color', 'background-color', 'text-align', 'font-size',
    'font-weight', 'font-style', 'text-decoration', 'text-decoration-line',
    'width', 'height', 'max-width', 'margin-left', 'padding-left',
    'list-style-type', 'vertical-align', 'border-collapse'];

const SANITISE_OPTS = {
    allowedTags: ['p', 'div', 'br', 'hr', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'mark', 'sub', 'sup',
        'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'span',
        'font', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
        'caption', 'figure', 'figcaption'],
    allowedAttributes: {
        a: ['href', 'title'],
        img: ['src', 'alt', 'width', 'height'],
        th: ['colspan', 'rowspan'],
        td: ['colspan', 'rowspan'],
        ol: ['start', 'type'],
        font: ['color'],
        '*': ['style'],   // class is governed by allowedClasses below
    },
    allowedClasses: { '*': ['rt-callout', 'rt-tip', 'rt-keyterm', 'rt-warning'] },
    allowedStyles: {
        '*': STYLE_PROPS.reduce((m, p) => { m[p] = [/^[^;{}()]*$/]; return m; }, {}),
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },  // data: only for <img> (inert in an image context)
    // script/style/etc. are dropped tag AND content (not kept as text).
    nonTextTags: ['script', 'style', 'textarea', 'option', 'noscript', 'iframe'],
    disallowedTagsMode: 'discard',
};

const cleanHtml = (x) => (typeof x === 'string' ? sanitizeHtml(x, SANITISE_OPTS) : x);

// Sanitise ONLY the HTML-bearing fields of each bank row (rendered as HTML
// downstream): snapshot.reading, answer_key.markScheme, answer_key.modelAnswer.
// Everything else is plain text escaped at render time — do NOT touch it here
// (sanitising escaped text would double-process it). Returns a shallow copy;
// never mutates the caller's rows.
function sanitiseBankRows(rows) {
    return rows.map((row) => {
        if (!row || typeof row !== 'object') return row;
        const snapshot = row.snapshot;
        const answerKey = row.answer_key;
        const out = Object.assign({}, row);
        if (snapshot && typeof snapshot === 'object' && typeof snapshot.reading === 'string') {
            out.snapshot = Object.assign({}, snapshot, { reading: cleanHtml(snapshot.reading) });
        }
        if (answerKey && typeof answerKey === 'object') {
            const cleanKey = Object.assign({}, answerKey);
            if (typeof cleanKey.markScheme === 'string') cleanKey.markScheme = cleanHtml(cleanKey.markScheme);
            if (typeof cleanKey.modelAnswer === 'string') cleanKey.modelAnswer = cleanHtml(cleanKey.modelAnswer);
            out.answer_key = cleanKey;
        }
        return out;
    });
}

// Sanitise the HTML-bearing fields of a 9-activity `sections` jsonb (the same
// shape as custom_topics.sections) before it is stored as a platform-subject
// SCHOOL OVERRIDE (subject_overrides.sections, via the save-override function).
// This is the server-side XSS boundary the override path needs: custom_topics
// gets that boundary from the client rich-editor + the renderer, but an override
// is written server-side, so we clean it here (review fix #8).
//
// Only the RICH-TEXT fields are cleaned — the exact set the client mounts a
// RichText editor on (teacher-subjects.html RT_FIELD_PANELS = learn/tips/exam,
// plus reading.html): reading.html, learn.items[].html, tips.items[].html,
// exam.questions[].markScheme. Every other section field (mcq/tf/fib/terms/misc
// text, titles, options, explanations) is PLAIN TEXT escaped at render time —
// running it through the HTML sanitiser would corrupt legitimate '<' / '>' and
// double-process it, so those are left untouched. Returns a deep-ish copy of the
// touched paths; never mutates the caller's object.
function sanitiseSections(sections) {
    if (!sections || typeof sections !== 'object' || Array.isArray(sections)) return sections;
    const out = Object.assign({}, sections);

    // reading.html
    const reading = out.reading;
    if (reading && typeof reading === 'object' && typeof reading.html === 'string') {
        out.reading = Object.assign({}, reading, { html: cleanHtml(reading.html) });
    }

    // learn / tips: each items[].html
    ['learn', 'tips'].forEach((key) => {
        const block = out[key];
        if (block && typeof block === 'object' && Array.isArray(block.items)) {
            out[key] = Object.assign({}, block, {
                items: block.items.map((it) =>
                    (it && typeof it === 'object' && typeof it.html === 'string')
                        ? Object.assign({}, it, { html: cleanHtml(it.html) })
                        : it),
            });
        }
    });

    // exam: each questions[].markScheme
    const exam = out.exam;
    if (exam && typeof exam === 'object' && Array.isArray(exam.questions)) {
        out.exam = Object.assign({}, exam, {
            questions: exam.questions.map((q) =>
                (q && typeof q === 'object' && typeof q.markScheme === 'string')
                    ? Object.assign({}, q, { markScheme: cleanHtml(q.markScheme) })
                    : q),
        });
    }

    return out;
}

module.exports = { SANITISE_OPTS, cleanHtml, sanitiseBankRows, sanitiseSections };
