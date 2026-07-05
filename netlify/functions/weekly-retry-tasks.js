// Scheduled function (see netlify.toml: schedule = "@weekly") — no HTTP
// caller, so no auth header to check. Runs with the service-role client,
// which bypasses RLS entirely; every write below re-derives its own
// teacher_id/class_id from the source data rather than trusting input,
// since there is no per-caller authorization to lean on here.
//
// For every student, gathers auto-marked questions (mcq/tf/fib) they got
// wrong in the last LOOKBACK_DAYS, and either tops up their existing
// unfinished "retry_auto" task with newly-wrong questions, or creates a
// new one, capped at MAX_QUESTIONS_PER_TASK questions.
const { getAdminClient } = require('./_lib/adminClient');

const LOOKBACK_DAYS = 30;
const MAX_QUESTIONS_PER_TASK = 10;
const AUTO_MARKABLE = ['mcq', 'tf', 'fib'];

function questionRow(taskId, order, q) {
    return {
        task_id: taskId, q_order: order, question_key: q.question_key, page_id: q.page_id,
        source: q.source, qtype: q.qtype, marks: q.marks, snapshot: q.snapshot, answer_key: q.answer_key,
    };
}

exports.handler = async () => {
    let admin;
    try { admin = getAdminClient(); } catch (err) {
        return { statusCode: 500, body: err.message };
    }

    try {
        const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 3600 * 1000).toISOString();

        // Recent submitted attempts, then the wrong auto-marked answers within them —
        // fetched in this order so we never pull the site's whole wrong-answer history.
        const { data: attempts, error: attErr } = await admin
            .from('task_attempts').select('id, task_id, student_id, submitted_at')
            .eq('status', 'submitted').gte('submitted_at', since);
        if (attErr) throw attErr;
        if (!attempts.length) return { statusCode: 200, body: 'No recent submitted attempts.' };

        const attemptIds = attempts.map(a => a.id);
        const { data: wrongAnswers, error: waErr } = await admin
            .from('task_answers').select('task_question_id, attempt_id')
            .eq('is_correct', false).in('attempt_id', attemptIds);
        if (waErr) throw waErr;
        if (!wrongAnswers.length) return { statusCode: 200, body: 'No wrong answers in the lookback window.' };

        const attemptById = new Map(attempts.map(a => [a.id, a]));
        const taskIds = [...new Set(attempts.map(a => a.task_id))];
        const { data: tasks } = await admin.from('tasks').select('id, teacher_id, class_id').in('id', taskIds);
        const taskById = new Map((tasks || []).map(t => [t.id, t]));

        const qIds = [...new Set(wrongAnswers.map(a => a.task_question_id))];
        const { data: questions } = await admin
            .from('task_questions').select('id, question_key, page_id, source, qtype, marks, snapshot, answer_key')
            .in('id', qIds).in('qtype', AUTO_MARKABLE);
        const qById = new Map((questions || []).map(q => [q.id, q]));

        // Group deduped wrong questions by (student, teacher, class) — a student's
        // wrong answers could span more than one teacher/class, so each gets its
        // own retry task rather than merging across classes.
        const groups = new Map(); // "student|teacher|class" -> Map(question_key -> {question, at})
        wrongAnswers.forEach(a => {
            const att = attemptById.get(a.attempt_id);
            const task = att && taskById.get(att.task_id);
            const q = qById.get(a.task_question_id);
            if (!att || !task || !q) return;
            const key = `${att.student_id}|${task.teacher_id}|${task.class_id}`;
            const group = groups.get(key) || new Map();
            const existing = group.get(q.question_key);
            if (!existing || new Date(att.submitted_at) > new Date(existing.at)) {
                group.set(q.question_key, { question: q, at: att.submitted_at });
            }
            groups.set(key, group);
        });

        // Batch-fetch every currently-open (unfinished) retry_auto task once, up
        // front, so the per-group loop below does no per-student round trips.
        const { data: retryAutoTasks } = await admin
            .from('tasks').select('id, teacher_id, class_id')
            .eq('source_kind', 'retry_auto').eq('status', 'published');
        const retryAutoIds = (retryAutoTasks || []).map(t => t.id);
        let retryAssignments = [], retrySubmitted = new Set();
        if (retryAutoIds.length) {
            const [{ data: asg }, { data: atts }] = await Promise.all([
                admin.from('task_assignments').select('task_id, student_id').in('task_id', retryAutoIds),
                admin.from('task_attempts').select('task_id, student_id').in('task_id', retryAutoIds).eq('status', 'submitted'),
            ]);
            retryAssignments = asg || [];
            retrySubmitted = new Set((atts || []).map(a => `${a.task_id}|${a.student_id}`));
        }
        const taskByIdRetry = new Map((retryAutoTasks || []).map(t => [t.id, t]));
        const openTaskByKey = new Map();
        retryAssignments.forEach(a => {
            if (retrySubmitted.has(`${a.task_id}|${a.student_id}`)) return; // already finished — not "open"
            const t = taskByIdRetry.get(a.task_id);
            if (!t) return;
            const key = `${a.student_id}|${t.teacher_id}|${t.class_id}`;
            if (!openTaskByKey.has(key)) openTaskByKey.set(key, a.task_id);
        });

        let created = 0, toppedUp = 0, skipped = 0;
        for (const [key, group] of groups) {
            const [studentId, teacherId, classId] = key.split('|');
            const wrongQuestions = [...group.values()]
                .sort((a, b) => new Date(b.at) - new Date(a.at))
                .map(v => v.question);

            const openTaskId = openTaskByKey.get(key);
            if (openTaskId) {
                const { data: existingQs } = await admin
                    .from('task_questions').select('question_key').eq('task_id', openTaskId);
                const existingKeys = new Set((existingQs || []).map(q => q.question_key));
                const room = MAX_QUESTIONS_PER_TASK - existingKeys.size;
                const toAdd = wrongQuestions.filter(q => !existingKeys.has(q.question_key)).slice(0, Math.max(0, room));
                if (toAdd.length) {
                    await admin.from('task_questions').insert(
                        toAdd.map((q, i) => questionRow(openTaskId, existingKeys.size + i, q))
                    );
                    toppedUp++;
                } else {
                    skipped++;
                }
                continue;
            }

            const capped = wrongQuestions.slice(0, MAX_QUESTIONS_PER_TASK);
            const { data: newTask, error: insErr } = await admin.from('tasks').insert({
                teacher_id: teacherId, class_id: classId,
                title: 'Weekly retry: questions to review',
                instructions: 'Auto-generated from questions you got wrong recently — have another go.',
                status: 'published', due_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
                late_policy: 'accept_late', attempts_allowed: null, attempt_scoring: 'best',
                timer_on_leave: 'paused', time_limit_minutes: null, marking_mode: 'manual',
                source_kind: 'retry_auto', published_at: new Date().toISOString(),
            }).select('id').single();
            if (insErr) { skipped++; continue; }

            await admin.from('task_questions').insert(capped.map((q, i) => questionRow(newTask.id, i, q)));
            await admin.from('task_assignments').insert({ task_id: newTask.id, student_id: studentId });
            created++;
        }

        return { statusCode: 200, body: `Created ${created}, topped up ${toppedUp}, skipped ${skipped}.` };
    } catch (err) {
        return { statusCode: 500, body: err.message || 'Unexpected error' };
    }
};
