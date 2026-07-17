const { getAdminClient, jsonResponse } = require('./_lib/adminClient');
const { sanitiseBankRows } = require('./_lib/sanitizeBankHtml');

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

        // 4. Sanitise the HTML-bearing fields (snapshot.reading,
        // answer_key.markScheme, answer_key.modelAnswer) with the shared
        // allowlist config (strips script/iframe/on*-handlers/javascript: URLs,
        // keeps formatting tags, class, <img src>, tables). Every other field is
        // left untouched. Same helper as sync-override-bank, so both bank paths
        // share one XSS boundary.
        const sanitisedRows = sanitiseBankRows(rows);

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
