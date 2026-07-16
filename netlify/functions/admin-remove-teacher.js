const { getAdminClient, requireAdminOver, logAdminAction, jsonResponse } = require('./_lib/adminClient');

// Soft-detach a teacher from a school (reversible), or re-attach them.
// The account and their classes are untouched — this only flips the membership's
// removed_at, which moves them to / from the Removed tab. Deleting the account
// forever is a separate action (admin-delete-teacher).
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

    let admin;
    try { admin = getAdminClient(); } catch (err) { return jsonResponse(500, { error: err.message }); }

    try {
        const { teacher_id: teacherId, reattach } = JSON.parse(event.body || '{}');
        const ctx = await requireAdminOver(admin, event, teacherId);
        if (!ctx.schoolId) throw { statusCode: 400, message: 'Teacher is not in a school' };

        const patch = reattach
            ? { removed_at: null, removed_by: null }
            : { removed_at: new Date().toISOString(), removed_by: ctx.actorId };

        const { error } = await admin.from('school_members')
            .update(patch).eq('profile_id', teacherId).eq('school_id', ctx.schoolId);
        if (error) throw error;

        await logAdminAction(admin, { actorId: ctx.actorId, schoolId: ctx.schoolId,
            action: reattach ? 'reattach_teacher' : 'remove_teacher',
            targetProfileId: teacherId, targetEmail: ctx.targetEmail });
        return jsonResponse(200, { ok: true });
    } catch (err) {
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
