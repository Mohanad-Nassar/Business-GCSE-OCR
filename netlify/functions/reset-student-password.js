const { getAdminClient, requireTeacher, requireOwnedStudent, jsonResponse } = require('./_lib/adminClient');
const { generatePassword } = require('./_lib/credentials');

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

        const password = generatePassword();
        const { error: updateError } = await admin.auth.admin.updateUserById(studentId, { password });
        if (updateError) throw updateError;

        return jsonResponse(200, { password });
    } catch (err) {
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
