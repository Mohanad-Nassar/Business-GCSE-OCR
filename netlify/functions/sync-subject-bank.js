const sanitizeHtml = require('sanitize-html');
const { getAdminClient, jsonResponse } = require('./_lib/adminClient');

// Server-side HTML sanitiser for the bank-sync boundary. Pure-JS (htmlparser2,
// no jsdom) so it bundles cleanly in a Netlify function. The allowlist mirrors
// the client editor's (rich-editor.js ALLOWED_TAGS / TAG_ATTRS / STYLE_PROPS /
// ALLOWED_CLASSES) so legitimate teacher formatting survives while scripts,
// event handlers and javascript: URLs are stripped — even from a client that
// bypassed the editor and PATCHed custom_topics directly.
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

// The XSS storage boundary for teacher-subject "bank sync".
//
// bank_questions content is rendered as HTML to students and other
// teachers, so unsanitised HTML must NEVER reach it — even from a
// teacher who bypasses the editor. The client can no longer call
// sync_teacher_subject_bank directly (revoked from `authenticated` in
// subjects-v2-bank-sync-hardening.sql); it POSTs here instead. This
// function verifies the caller, sanitises the HTML-bearing fields with
// DOMPurify's safe defaults, then calls the service-role-only
// sync_teacher_subject_bank_srv() to do the validated upsert.
//
// The HTML-bearing fields (rendered as HTML downstream) are:
//   snapshot.reading, answer_key.markScheme, answer_key.modelAnswer
// Everything else is plain text escaped at render time — do NOT touch
// it here (sanitising escaped text would double-process it).

const MAX_ROWS = 4000; // must match the _srv RPC's cap

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' });
    }

    let admin;
    try {
        admin = getAdminClient();
    } catch (err) {
        return jsonResponse(500, { error: err.message });
    }

    try {
        // 1. Resolve the caller from their bearer token (fail closed).
        const authHeader = event.headers.authorization || event.headers.Authorization || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (!token) {
            return jsonResponse(401, { error: 'Missing authorization token' });
        }
        const { data: userData, error: userError } = await admin.auth.getUser(token);
        if (userError || !userData || !userData.user) {
            return jsonResponse(401, { error: 'Invalid or expired session' });
        }
        const userId = userData.user.id;

        const body = JSON.parse(event.body || '{}');
        const subjectId = (body.subject_id || '').trim();
        const rows = body.rows;
        if (!subjectId) {
            return jsonResponse(400, { error: 'subject_id is required' });
        }

        // 3. Validate the rows envelope before doing any work.
        if (!Array.isArray(rows)) {
            return jsonResponse(400, { error: 'rows must be an array' });
        }
        if (rows.length > MAX_ROWS) {
            return jsonResponse(400, { error: 'Too many questions (max ' + MAX_ROWS + ' per subject)' });
        }

        // 2. Verify ownership server-side (defence-in-depth; the _srv RPC
        // re-checks with p_owner too). Don't leak which subject it is.
        const { data: subject, error: subjectError } = await admin
            .from('subjects')
            .select('created_by')
            .eq('id', subjectId)
            .single();
        if (subjectError || !subject || subject.created_by !== userId) {
            return jsonResponse(403, { error: 'Not authorised for this subject' });
        }

        // 4. Sanitise the HTML-bearing fields with DOMPurify's safe
        // defaults (strips script/iframe/on*-handlers/javascript: URLs,
        // keeps formatting tags, class, <img src>, tables). Every other
        // field is left untouched.
        const sanitisedRows = rows.map((row) => {
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

        // 5. Hand off to the service-role-only RPC for the validated upsert.
        const { data, error } = await admin.rpc('sync_teacher_subject_bank_srv', {
            p_owner: userId,
            p_subject_id: subjectId,
            p_rows: sanitisedRows,
        });
        if (error) {
            console.error('sync-subject-bank rpc error:', error.message);
            // The RPC's raise exceptions are caller-fixable bad input; a
            // missing function / permission issue is ours. Treat 'Not your
            // subject' (post-ownership-check race) as 403, the rest as 400.
            const msg = error.message || '';
            if (/not your subject/i.test(msg)) return jsonResponse(403, { error: 'Not authorised for this subject' });
            if (/^(Rows must|Too many|Bad |page_id |snapshot and answer_key)/i.test(msg)) {
                return jsonResponse(400, { error: msg });
            }
            return jsonResponse(500, { error: 'Could not sync the question bank' });
        }

        return jsonResponse(200, data || { synced: 0 });
    } catch (err) {
        console.error('sync-subject-bank error:', err && err.message);
        return jsonResponse(500, { error: 'Unexpected error' });
    }
};
