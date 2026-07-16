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

// Verifies the caller is allowed to administer the TARGET teacher: the platform
// owner (any teacher), or a school_admin of a school the target is an active
// member of. Used by the admin-*-teacher functions. Returns the caller id, the
// target's school (for audit), the target's email, and whether the caller is
// the owner. Refuses to act on the owner account or on non-teacher targets.
async function requireAdminOver(admin, event, targetProfileId) {
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) throw httpError(401, 'Missing authorization token');
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData || !userData.user) throw httpError(401, 'Invalid or expired session');
    const actorId = userData.user.id;
    if (!targetProfileId) throw httpError(400, 'teacher_id is required');
    if (targetProfileId === actorId) throw httpError(400, 'You cannot perform this action on your own account');

    const { data: target, error: tErr } = await admin
        .from('profiles').select('id, role, email, is_owner').eq('id', targetProfileId).single();
    if (tErr || !target) throw httpError(404, 'Teacher not found');
    if (target.is_owner) throw httpError(403, 'The owner account cannot be managed here');
    if (target.role !== 'teacher') throw httpError(400, 'Target is not a teacher');

    // The schools the target belongs to.
    const { data: tm } = await admin.from('school_members').select('school_id').eq('profile_id', targetProfileId);
    const targetSchoolIds = (tm || []).map((r) => r.school_id);

    // Owner: allowed over anyone.
    const { data: me } = await admin.from('profiles').select('is_owner').eq('id', actorId).single();
    if (me && me.is_owner) {
        return { actorId, isOwner: true, schoolId: targetSchoolIds[0] || null, targetEmail: target.email };
    }

    // Otherwise the caller must be a (non-removed) school_admin of one of the
    // target's schools.
    if (targetSchoolIds.length === 0) throw httpError(403, 'Not authorised for this teacher');
    const { data: mine } = await admin
        .from('school_members').select('school_id')
        .eq('profile_id', actorId).eq('role', 'school_admin').is('removed_at', null)
        .in('school_id', targetSchoolIds);
    if (!mine || mine.length === 0) throw httpError(403, 'Not authorised for this teacher');
    return { actorId, isOwner: false, schoolId: mine[0].school_id, targetEmail: target.email };
}

// Append a row to admin_audit_log (service role bypasses RLS). Best-effort:
// a logging failure must never block the action it records.
async function logAdminAction(admin, { actorId, schoolId, action, targetProfileId, targetEmail, detail }) {
    try {
        await admin.from('admin_audit_log').insert({
            actor_id: actorId || null,
            school_id: schoolId || null,
            action,
            target_profile_id: targetProfileId || null,
            target_email: targetEmail || null,
            detail: detail || null,
        });
    } catch (e) {
        console.error('logAdminAction', action, e);
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

module.exports = { getAdminClient, requireTeacher, requireOwnedClass, requireOwnedStudent, requireAdminOver, logAdminAction, httpError, jsonResponse };
