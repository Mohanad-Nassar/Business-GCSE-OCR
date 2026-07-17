const { getAdminClient, jsonResponse } = require('./_lib/adminClient');
const { sanitiseSections } = require('./_lib/sanitizeBankHtml');

// The XSS storage boundary for platform-subject SCHOOL OVERRIDE "sections".
//
// A granted teacher forks a platform TOPIC's 9 activities and saves/publishes a
// copy for their own school (subject_overrides.sections). custom_topics gets its
// XSS boundary from the client rich-editor + the renderer; an override is stored
// through THIS function so the boundary is enforced server-side (spec §8 / review
// fix #8): sections are NEVER written to subject_overrides straight from the
// client. We verify the caller (the S4 AND-clamp + that the school is theirs —
// the SAME checks sync-override-bank makes), sanitise every HTML-bearing field
// inside `sections` with the shared allowlist, then upsert with the service role.
//
// Authorisation mirrors sync-override-bank.js exactly:
//   • valid bearer token → getUser (fail closed),
//   • subject is a PLATFORM subject (created_by is null),
//   • school_id is the caller's OWN active school_members row (cross-school clamp),
//   • the S4 AND-clamp: caller holds teacher_subject_edit_access AND the school
//     holds subject_school_edit_grants for the subject.

const MAX_SECTIONS_CHARS = 600000; // must match subject_overrides.sections CHECK
const TOPIC_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;   // hyphenated page-id tail (DB CHECK)
const FILE_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_]{0,120}$/; // underscored static-file tail

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

        // 2. Validate the envelope.
        const body = JSON.parse(event.body || '{}');
        const subjectId = (body.subject_id || '').trim();
        const schoolId = (body.school_id || '').trim();
        const topicSlug = (body.topic_slug || '').trim();
        const fileSlug = (body.file_slug || '').trim();
        const status = (body.status || 'draft').trim();
        const sections = body.sections;
        if (!subjectId) return jsonResponse(400, { error: 'subject_id is required' });
        if (!schoolId) return jsonResponse(400, { error: 'school_id is required' });
        if (!TOPIC_SLUG_RE.test(topicSlug)) {
            return jsonResponse(400, { error: 'Bad topic_slug (must be the hyphenated page-id tail)' });
        }
        if (!FILE_SLUG_RE.test(fileSlug)) {
            return jsonResponse(400, { error: 'Bad file_slug (must be the underscored file tail)' });
        }
        if (status !== 'draft' && status !== 'published') {
            return jsonResponse(400, { error: 'status must be draft or published' });
        }
        if (!sections || typeof sections !== 'object' || Array.isArray(sections)) {
            return jsonResponse(400, { error: 'sections must be an object' });
        }
        // Basic sanity: topic_slug (hyphen form) and file_slug (underscore form)
        // must be separator/case variants of the same page. They are derived from
        // one page-groups entry on the client, so a mismatch means tampering —
        // reject it before it can create an unroutable override row.
        const canon = (s) => s.toLowerCase().replace(/[-_]/g, '');
        if (canon(topicSlug) !== canon(fileSlug)) {
            return jsonResponse(400, { error: 'topic_slug and file_slug do not correspond' });
        }

        // 3. The subject must be a PLATFORM subject (created_by is null) — a
        // teacher subject edits custom_topics directly and has no override layer.
        const { data: subject, error: subjectError } = await admin
            .from('subjects')
            .select('created_by')
            .eq('id', subjectId)
            .single();
        if (subjectError || !subject || subject.created_by !== null) {
            return jsonResponse(403, { error: 'Not authorised for this subject' });
        }

        // 4. school_id MUST be the caller's own school — an ACTIVE (not removed)
        // school_members row. This is the cross-school clamp: a granted teacher of
        // school A can never target school B's override.
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

        // 5. The S4 AND-clamp (defence-in-depth behind the RLS editor policy):
        // caller holds a teacher edit grant for the subject AND the school holds
        // the school edit grant for it. Either missing ⇒ deny by default.
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

        // 6. Sanitise the HTML-bearing fields inside sections with the shared
        // allowlist (the same boundary the bank sync uses), THEN size-check the
        // cleaned payload against the DB CHECK so we fail with a friendly message
        // rather than a raw constraint error.
        const cleanSections = sanitiseSections(sections);
        if (JSON.stringify(cleanSections).length > MAX_SECTIONS_CHARS) {
            return jsonResponse(400, { error: 'This topic is too long to save (over 600,000 characters).' });
        }

        // 7. Upsert (service role). Identified by the (subject, school, topic_slug)
        // unique constraint. On update we preserve created_by (the original forker)
        // and only touch the editable fields — the updated_at trigger stamps time.
        const { data: existing, error: existingError } = await admin
            .from('subject_overrides')
            .select('id')
            .eq('subject_id', subjectId)
            .eq('school_id', schoolId)
            .eq('topic_slug', topicSlug)
            .maybeSingle();
        if (existingError && existingError.code === '42P01') {
            return jsonResponse(500, { error: 'Overrides are not set up yet (run supabase/subjects-v2-s5-overrides.sql).' });
        }

        let writeError;
        if (existing) {
            ({ error: writeError } = await admin
                .from('subject_overrides')
                .update({ file_slug: fileSlug, sections: cleanSections, status })
                .eq('id', existing.id));
        } else {
            ({ error: writeError } = await admin
                .from('subject_overrides')
                .insert({
                    subject_id: subjectId, school_id: schoolId,
                    topic_slug: topicSlug, file_slug: fileSlug,
                    sections: cleanSections, status, created_by: userId,
                }));
        }
        if (writeError) {
            console.error('save-override write error:', writeError.message);
            // 23505 = a concurrent co-editor won the insert race; treat as retryable.
            if (writeError.code === '23505') {
                return jsonResponse(409, { error: 'Another teacher just saved this topic — reload and try again.' });
            }
            return jsonResponse(500, { error: 'Could not save this override' });
        }

        return jsonResponse(200, { ok: true, status });
    } catch (err) {
        console.error('save-override error:', err && err.message);
        return jsonResponse(500, { error: 'Unexpected error' });
    }
};
