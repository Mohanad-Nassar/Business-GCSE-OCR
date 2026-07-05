const { createClient } = require('@supabase/supabase-js');

function getAdminClient() {
    const url = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
        throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured in this environment');
    }
    return createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

// Verifies the caller sent a valid Supabase access token belonging to a
// teacher, using the service-role client (bypasses RLS to check the role).
async function requireTeacher(event, admin) {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
        throw httpError(401, 'Missing authorization token');
    }

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData || !userData.user) {
        throw httpError(401, 'Invalid or expired session');
    }

    const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('id, role')
        .eq('id', userData.user.id)
        .single();
    if (profileError || !profile || profile.role !== 'teacher') {
        throw httpError(403, 'Teacher role required');
    }

    return { id: userData.user.id };
}

async function requireOwnedClass(admin, teacherId, classId) {
    const { data: cls, error } = await admin
        .from('classes')
        .select('id, teacher_id')
        .eq('id', classId)
        .single();
    if (error || !cls || cls.teacher_id !== teacherId) {
        throw httpError(403, 'Class not found or not owned by this teacher');
    }
    return cls;
}

// Confirms studentId belongs to a class owned by teacherId.
async function requireOwnedStudent(admin, teacherId, studentId) {
    const { data: memberships, error } = await admin
        .from('class_students')
        .select('class_id, classes!inner(teacher_id)')
        .eq('student_id', studentId);
    if (error) throw error;
    const owns = (memberships || []).some(m => m.classes && m.classes.teacher_id === teacherId);
    if (!owns) {
        throw httpError(403, 'Student is not in one of your classes');
    }
}

function httpError(statusCode, message) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
}

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    };
}

module.exports = { getAdminClient, requireTeacher, requireOwnedClass, requireOwnedStudent, httpError, jsonResponse };
