const { getAdminClient, requireAdminOver, logAdminAction, jsonResponse } = require('./_lib/adminClient');

// Suspend / reinstate a teacher.
//   suspend=true  → block sign-in (Auth ban). mode 'login_frozen' also archives
//                   the teacher's own classes (hiding them from students).
//   suspend=false → lift the ban and un-archive exactly the classes the freeze
//                   archived (leaving any the teacher archived themselves alone).
const BAN_FOREVER = '876000h'; // ~100 years

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

    let admin;
    try { admin = getAdminClient(); } catch (err) { return jsonResponse(500, { error: err.message }); }

    try {
        const { teacher_id: teacherId, suspend, mode } = JSON.parse(event.body || '{}');
        const ctx = await requireAdminOver(admin, event, teacherId);

        if (suspend) {
            const suspendMode = mode === 'login_frozen' ? 'login_frozen' : 'login';

            const { error: banErr } = await admin.auth.admin.updateUserById(teacherId, { ban_duration: BAN_FOREVER });
            if (banErr) throw banErr;

            let frozenIds = null;
            if (suspendMode === 'login_frozen') {
                const { data: cls } = await admin.from('classes')
                    .select('id').eq('teacher_id', teacherId).eq('archived', false);
                frozenIds = (cls || []).map((c) => c.id);
                if (frozenIds.length) {
                    const { error: arcErr } = await admin.from('classes')
                        .update({ archived: true }).in('id', frozenIds);
                    if (arcErr) throw arcErr;
                }
            }

            const { error: upErr } = await admin.from('school_members').update({
                status: 'suspended', suspended_mode: suspendMode,
                suspended_at: new Date().toISOString(), suspended_by: ctx.actorId,
                frozen_class_ids: frozenIds,
            }).eq('profile_id', teacherId);
            if (upErr) throw upErr;

            await logAdminAction(admin, { actorId: ctx.actorId, schoolId: ctx.schoolId, action: 'suspend_teacher',
                targetProfileId: teacherId, targetEmail: ctx.targetEmail, detail: { mode: suspendMode } });
            return jsonResponse(200, { ok: true });
        }

        // ── Reinstate ──
        const { error: unbanErr } = await admin.auth.admin.updateUserById(teacherId, { ban_duration: 'none' });
        if (unbanErr) throw unbanErr;

        const { data: mem } = await admin.from('school_members')
            .select('frozen_class_ids').eq('profile_id', teacherId).limit(1).maybeSingle();
        const frozen = (mem && mem.frozen_class_ids) || [];
        if (frozen.length) {
            const { error: unArcErr } = await admin.from('classes')
                .update({ archived: false }).in('id', frozen);
            if (unArcErr) throw unArcErr;
        }

        const { error: up2Err } = await admin.from('school_members').update({
            status: 'active', suspended_mode: null, suspended_at: null, suspended_by: null, frozen_class_ids: null,
        }).eq('profile_id', teacherId);
        if (up2Err) throw up2Err;

        await logAdminAction(admin, { actorId: ctx.actorId, schoolId: ctx.schoolId, action: 'reinstate_teacher',
            targetProfileId: teacherId, targetEmail: ctx.targetEmail });
        return jsonResponse(200, { ok: true });
    } catch (err) {
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
