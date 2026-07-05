const { getAdminClient, requireTeacher, requireOwnedStudent, jsonResponse } = require('./_lib/adminClient');

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
        const { student_id: studentId } = JSON.parse(event.body || '{}');
        if (!studentId) {
            return jsonResponse(400, { error: 'student_id is required' });
        }

        await requireOwnedStudent(admin, teacher.id, studentId);

        // Deleting the auth user cascades to profiles + class_students via FK on delete cascade.
        const { error: deleteError } = await admin.auth.admin.deleteUser(studentId);
        if (deleteError) throw deleteError;

        return jsonResponse(200, { ok: true });
    } catch (err) {
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
