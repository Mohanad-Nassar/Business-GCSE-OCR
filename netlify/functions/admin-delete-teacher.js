const { getAdminClient, requireAdminOver, logAdminAction, jsonResponse } = require('./_lib/adminClient');

// Permanently delete a teacher account. Because classes.teacher_id is
// ON DELETE CASCADE, we MUST reassign (or explicitly delete) their classes
// BEFORE removing the account, or the classes + rosters would be destroyed.
//   class_action:
//     'handoff' → each class goes to an existing co-teacher, else to the admin
//     'orphan'  → all their classes go to the acting admin (to reassign later)
//     'delete'  → their classes are deleted too (students unlinked; answer rows kept)
// Only a teacher already REMOVED from the school can be deleted here.
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

    let admin;
    try { admin = getAdminClient(); } catch (err) { return jsonResponse(500, { error: err.message }); }

    try {
        const { teacher_id: teacherId, class_action: classAction } = JSON.parse(event.body || '{}');
        const action = ['handoff', 'orphan', 'delete'].includes(classAction) ? classAction : 'handoff';
        const ctx = await requireAdminOver(admin, event, teacherId);
        if (!ctx.schoolId) return jsonResponse(400, { error: 'Teacher is not in a school' });

        // Must be removed from the school first (matches the UI: delete lives in
        // the Removed tab). Guards against deleting an active teacher by mistake.
        const { data: mem } = await admin.from('school_members')
            .select('removed_at').eq('profile_id', teacherId).eq('school_id', ctx.schoolId).maybeSingle();
        if (!mem || !mem.removed_at) {
            return jsonResponse(400, { error: 'Remove the teacher from the school before deleting their account.' });
        }

        // Classes this teacher CREATED (owns via classes.teacher_id).
        const { data: owned } = await admin.from('classes').select('id').eq('teacher_id', teacherId);
        const ownedIds = (owned || []).map((c) => c.id);

        if (action === 'delete') {
            if (ownedIds.length) {
                const { error } = await admin.from('classes').delete().in('id', ownedIds);
                if (error) throw error;
            }
        } else {
            for (const classId of ownedIds) {
                let newOwner = ctx.actorId;
                if (action === 'handoff') {
                    // Prefer an existing co-teacher of this class.
                    const { data: co } = await admin.from('class_teachers')
                        .select('teacher_id').eq('class_id', classId).neq('teacher_id', teacherId).limit(1);
                    if (co && co.length) newOwner = co[0].teacher_id;
                }
                // Ensure the new owner is a teacher of the class, then take ownership.
                // (Service role bypasses the classes_pin_creator trigger.)
                await admin.from('class_teachers')
                    .upsert({ class_id: classId, teacher_id: newOwner, is_main: true, added_by: ctx.actorId },
                            { onConflict: 'class_id,teacher_id' });
                const { error } = await admin.from('classes').update({ teacher_id: newOwner }).eq('id', classId);
                if (error) throw error;
            }
        }

        // Audit BEFORE the delete, so target_profile_id is still a valid FK
        // (it becomes null on cascade; target_email preserves who it was).
        await logAdminAction(admin, { actorId: ctx.actorId, schoolId: ctx.schoolId, action: 'delete_teacher',
            targetProfileId: teacherId, targetEmail: ctx.targetEmail,
            detail: { class_action: action, class_count: ownedIds.length } });

        // Cascades to profiles + school_members + class_teachers + class_students.
        const { error: delErr } = await admin.auth.admin.deleteUser(teacherId);
        if (delErr) throw delErr;

        return jsonResponse(200, { ok: true });
    } catch (err) {
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
