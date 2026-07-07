// Creates a class for the calling teacher, with multi-subject support.
//
// Why this exists: a class now belongs to exactly one subject
// (classes.subject_id, see supabase/schema.sql) — that FK is the master
// scoping for the whole multi-subject platform. The teacher dashboard's
// legacy path (a direct `.from('classes').insert({ name, teacher_id })`
// with the anon client) still works because the column has a server-side
// default (default_subject_id() → the 'business' row), but as soon as the
// UI gains a subject picker it should POST here instead:
//
//   POST /.netlify/functions/create-class
//   Authorization: Bearer <teacher access token>
//   { "name": "Year 10 CS", "subject": "computer-science" }
//     — or —
//   { "name": "Year 10 CS", "subject_id": "<subjects.id uuid>" }
//
// `subject` (a subjects.slug) and `subject_id` are both accepted;
// `subject_id` wins if both are sent. When neither is given, the class
// defaults to the business subject (looked up by slug server-side), so a
// picker-less client keeps today's behaviour exactly.
//
// Responds 200 with the created class row (id, name, subject_id).

const { getAdminClient, requireTeacher, jsonResponse } = require('./_lib/adminClient');

const DEFAULT_SUBJECT_SLUG = 'business';
const MAX_NAME_LENGTH = 120;

async function resolveSubjectId(admin, body) {
    if (body.subject_id) {
        const { data, error } = await admin
            .from('subjects')
            .select('id')
            .eq('id', body.subject_id)
            .eq('active', true)
            .single();
        if (error || !data) return { error: 'Unknown subject_id' };
        return { id: data.id };
    }

    const slug = typeof body.subject === 'string' && body.subject.trim()
        ? body.subject.trim()
        : DEFAULT_SUBJECT_SLUG;
    const { data, error } = await admin
        .from('subjects')
        .select('id')
        .eq('slug', slug)
        .eq('active', true)
        .single();
    if (error || !data) return { error: `Unknown subject '${slug}'` };
    return { id: data.id };
}

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
        const teacher = await requireTeacher(event, admin);
        const body = JSON.parse(event.body || '{}');

        const name = typeof body.name === 'string' ? body.name.trim() : '';
        if (!name || name.length > MAX_NAME_LENGTH) {
            return jsonResponse(400, { error: `name is required (max ${MAX_NAME_LENGTH} characters)` });
        }

        const subject = await resolveSubjectId(admin, body);
        if (subject.error) {
            return jsonResponse(400, { error: subject.error });
        }

        const { data: cls, error: insertError } = await admin
            .from('classes')
            .insert({ name, teacher_id: teacher.id, subject_id: subject.id })
            .select('id, name, subject_id')
            .single();
        if (insertError) {
            return jsonResponse(500, { error: insertError.message });
        }

        return jsonResponse(200, { class: cls });
    } catch (err) {
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
