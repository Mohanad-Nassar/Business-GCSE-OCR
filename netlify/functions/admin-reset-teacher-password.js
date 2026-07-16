const { getAdminClient, requireAdminOver, logAdminAction, jsonResponse } = require('./_lib/adminClient');
const { generatePassword } = require('./_lib/credentials');

// Reset a teacher's password, two ways (admin picks):
//   'temp'  → set a new temporary password and return it to show on screen
//             (works with no email setup; teacher changes it after signing in)
//   'email' → trigger Supabase's recovery email to the teacher's address
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

    let admin;
    try { admin = getAdminClient(); } catch (err) { return jsonResponse(500, { error: err.message }); }

    try {
        const { teacher_id: teacherId, method } = JSON.parse(event.body || '{}');
        const ctx = await requireAdminOver(admin, event, teacherId);

        if (method === 'email') {
            if (!ctx.targetEmail) return jsonResponse(400, { error: 'No email on record for this teacher' });
            const { error } = await admin.auth.resetPasswordForEmail(ctx.targetEmail);
            if (error) throw error;
            await logAdminAction(admin, { actorId: ctx.actorId, schoolId: ctx.schoolId, action: 'reset_password',
                targetProfileId: teacherId, targetEmail: ctx.targetEmail, detail: { method: 'email' } });
            return jsonResponse(200, { ok: true, method: 'email' });
        }

        // Default: temporary password.
        const password = generatePassword();
        const { error } = await admin.auth.admin.updateUserById(teacherId, { password });
        if (error) throw error;
        await logAdminAction(admin, { actorId: ctx.actorId, schoolId: ctx.schoolId, action: 'reset_password',
            targetProfileId: teacherId, targetEmail: ctx.targetEmail, detail: { method: 'temp' } });
        return jsonResponse(200, { ok: true, method: 'temp', password });
    } catch (err) {
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
