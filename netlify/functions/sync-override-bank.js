const { getAdminClient, jsonResponse } = require('./_lib/adminClient');
const { sanitiseBankRows } = require('./_lib/sanitizeBankHtml');

// The XSS storage boundary for platform-subject SCHOOL OVERRIDE "bank sync".
//
// A fork of sync-subject-bank: same sanitising boundary, but for a school's
// OVERRIDE of a platform subject (subjects-v2-s5). bank_questions content is
// rendered as HTML to students and other teachers, so unsanitised HTML must
// NEVER reach it — even from a teacher who bypasses the editor. Clients cannot
// call the service-role RPC directly (revoked from `authenticated` in
// subjects-v2-s5-override-sync.sql); they POST here instead. This function
// verifies the caller (the S4 AND-clamp + that the school is theirs), sanitises
// the HTML-bearing fields with the shared allowlist, then calls the
// service-role-only sync_school_override_bank_srv() to do the validated,
// school-pinned upsert.
//
// The HTML-bearing fields (rendered as HTML downstream) are:
//   snapshot.reading, answer_key.markScheme, answer_key.modelAnswer
// Everything else is plain text escaped at render time — do NOT touch it here.

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
        const schoolId = (body.school_id || '').trim();
        const rows = body.rows;
        if (!subjectId) {
            return jsonResponse(400, { error: 'subject_id is required' });
        }
        if (!schoolId) {
            return jsonResponse(400, { error: 'school_id is required' });
        }

        // 2. Validate the rows envelope before doing any work.
        if (!Array.isArray(rows)) {
            return jsonResponse(400, { error: 'rows must be an array' });
        }
        if (rows.length > MAX_ROWS) {
            return jsonResponse(400, { error: 'Too many questions (max ' + MAX_ROWS + ' per subject)' });
        }

        // 3. The subject must be a PLATFORM subject (created_by is null) — a
        // teacher subject has no override layer. Don't leak which subject it is.
        const { data: subject, error: subjectError } = await admin
            .from('subjects')
            .select('created_by')
            .eq('id', subjectId)
            .single();
        if (subjectError || !subject || subject.created_by !== null) {
            return jsonResponse(403, { error: 'Not authorised for this subject' });
        }

        // 4. The school_id MUST be the caller's own school — proven by an ACTIVE
        // (not removed) school_members row for this caller + school. This is the
        // cross-school clamp: a granted teacher of school A can never target
        // school B's override bank.
        const { data: membership } = await admin
            .from('school_members')
            .select('school_id')
            .eq('profile_id', userId)
            .eq('school_id', schoolId)
            .is('removed_at', null)
            .maybeSingle();
        if (!membership) {
            return jsonResponse(403, { error: 'Not authorised for this school' });
        }

        // 5. The S4 AND-clamp, verified server-side (defence-in-depth; the _srv
        // RPC re-checks it too): the caller holds a teacher edit grant for the
        // subject AND the school holds the school edit grant for it. Either
        // missing ⇒ no edit access (deny by default — there is no unrestricted
        // default for editing platform subjects).
        const { data: teacherGrant } = await admin
            .from('teacher_subject_edit_access')
            .select('subject_id')
            .eq('profile_id', userId)
            .eq('subject_id', subjectId)
            .maybeSingle();
        const { data: schoolGrant } = await admin
            .from('subject_school_edit_grants')
            .select('subject_id')
            .eq('school_id', schoolId)
            .eq('subject_id', subjectId)
            .maybeSingle();
        if (!teacherGrant || !schoolGrant) {
            return jsonResponse(403, { error: 'Not authorised for this subject' });
        }

        // 6. Sanitise the HTML-bearing fields with the shared allowlist config —
        // the exact same boundary sync-subject-bank uses. Every other field is
        // left untouched.
        const sanitisedRows = sanitiseBankRows(rows);

        // 7. Hand off to the service-role-only RPC for the validated,
        // school-pinned upsert (it re-checks the clamp and the key namespace).
        const { data, error } = await admin.rpc('sync_school_override_bank_srv', {
            p_owner: userId,
            p_school_id: schoolId,
            p_subject_id: subjectId,
            p_rows: sanitisedRows,
        });
        if (error) {
            console.error('sync-override-bank rpc error:', error.message);
            // The RPC's raise exceptions are caller-fixable bad input; a missing
            // function / permission issue is ours. 'not authorised' (post-check
            // race) → 403; the validation raises → 400; anything else → 500.
            const msg = error.message || '';
            if (/not authorised/i.test(msg)) return jsonResponse(403, { error: 'Not authorised for this subject' });
            if (/^(Rows must|Too many|Bad |page_id |snapshot and answer_key)/i.test(msg)) {
                return jsonResponse(400, { error: msg });
            }
            return jsonResponse(500, { error: 'Could not sync the override question bank' });
        }

        return jsonResponse(200, data || { synced: 0 });
    } catch (err) {
        console.error('sync-override-bank error:', err && err.message);
        return jsonResponse(500, { error: 'Unexpected error' });
    }
};
