// Teacher-authed: pre-marks unmarked written (qtype = 'written') answers for
// one task using Gemini, and writes SUGGESTIONS ONLY into the teacher-only
// task_answer_suggestions table (see supabase/ai-marking.sql for why that's
// a separate table from task_answers). Nothing here ever touches the real
// awarded/feedback/marking_complete columns — a teacher must still call
// mark_task_answer() (via the existing "Save mark" button) to accept one.
//
// Privacy: the only thing sent to Gemini per answer is the question text,
// mark scheme, model answer, max marks and the student's answer text — no
// username, student id or other identifier (see docs/DPIA.md).
const { getAdminClient, requireTeacher, jsonResponse } = require('./_lib/adminClient');

// Verified against https://ai.google.dev/gemini-api/docs/models on 2026-07-05:
// gemini-flash-latest is the GA alias for Google's current fast/cheap text
// model (currently resolves to Gemini 3.5 Flash). Re-check that page if this
// starts erroring with an "unknown model" response.
const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Kept well under Netlify's synchronous-function time limit (each Gemini
// call is ~1-2s; CONCURRENCY runs several at once). A teacher with more
// unmarked answers than this just clicks "Suggest marks" again to top up.
const MAX_ANSWERS_PER_CALL = 20;
const CONCURRENCY = 4;
const GEMINI_TIMEOUT_MS = 20000;
const MAX_RETRIES = 2;
const MAX_FAILURE_DETAILS = 5;

const SUGGESTION_SCHEMA = {
    type: 'object',
    properties: {
        marks: { type: 'number', description: 'Marks to award, out of the maximum given below. Half marks are allowed.' },
        feedback: { type: 'string', description: 'Student-facing feedback: 2-3 sentences, specific and encouraging.' },
        reasoning: { type: 'string', description: 'Teacher-facing reasoning: how the answer matches or misses each mark-scheme point.' },
        confidence: { type: 'number', description: 'How confident you are in this mark, from 0 (unsure) to 1 (certain).' },
    },
    required: ['marks', 'feedback', 'reasoning', 'confidence'],
};

function buildPrompt({ question, maxMarks, markScheme, modelAnswer, studentAnswer }) {
    return [
        'You are an experienced GCSE Business Studies (OCR J204) teacher marking one written exam-style answer.',
        'Mark strictly against the mark scheme below and award partial marks where the mark scheme allows it.',
        'If the answer is missing, off-topic, or contains no creditable business content, award 0.',
        '',
        `Question (worth ${maxMarks} mark${maxMarks === 1 ? '' : 's'}):`,
        question,
        '',
        'Mark scheme:',
        markScheme || '(no mark scheme provided — use the model answer as your guide)',
        ...(modelAnswer ? ['', 'Model answer:', modelAnswer] : []),
        '',
        "Student's answer:",
        studentAnswer,
        '',
        `Reply with JSON only: marks (0-${maxMarks}, half marks allowed), feedback (student-facing, 2-3 sentences), reasoning (teacher-facing, point-by-point against the mark scheme), confidence (0-1).`,
    ].join('\n');
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function callGemini(apiKey, prompt) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    let res;
    try {
        res = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json', responseSchema: SUGGESTION_SCHEMA, temperature: 0.2 },
            }),
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timer);
    }

    const body = await res.json().catch(() => null);
    if (!res.ok) {
        const err = new Error((body && body.error && body.error.message) || `Gemini request failed (${res.status})`);
        err.statusCode = res.status;
        throw err;
    }
    const text = body && body.candidates && body.candidates[0]
        && body.candidates[0].content && body.candidates[0].content.parts
        && body.candidates[0].content.parts[0] && body.candidates[0].content.parts[0].text;
    if (!text) throw new Error('Gemini returned no content');
    return JSON.parse(text);
}

async function callGeminiWithRetry(apiKey, prompt) {
    let lastErr;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await callGemini(apiKey, prompt);
        } catch (err) {
            lastErr = err;
            // Only retry rate-limit/server errors — a bad key or bad request will
            // just fail the same way again.
            const retryable = err.statusCode === 429 || err.statusCode >= 500;
            if (!retryable || attempt === MAX_RETRIES) throw err;
            await sleep(500 * Math.pow(2, attempt));
        }
    }
    throw lastErr;
}

async function mapWithConcurrency(items, limit, fn) {
    let next = 0;
    async function worker() {
        while (next < items.length) {
            const item = items[next++];
            await fn(item);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
function roundToHalf(n) { return Math.round(n * 2) / 2; }

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
        const { task_id: taskId } = JSON.parse(event.body || '{}');
        if (!taskId) return jsonResponse(400, { error: 'task_id is required' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return jsonResponse(500, { error: 'GEMINI_API_KEY is not configured', code: 'missing_api_key' });
        }

        const { data: task, error: taskErr } = await admin
            .from('tasks').select('id, teacher_id').eq('id', taskId).single();
        if (taskErr || !task || task.teacher_id !== teacher.id) {
            return jsonResponse(403, { error: 'Task not found or not owned by this teacher' });
        }

        const { data: questions, error: qErr } = await admin
            .from('task_questions').select('id, marks, snapshot, answer_key')
            .eq('task_id', taskId).eq('qtype', 'written');
        if (qErr) throw qErr;
        if (!questions.length) {
            return jsonResponse(200, { suggested: 0, failed: 0, blank: 0, already_suggested: 0, remaining: 0, total_unmarked: 0 });
        }
        const qById = new Map(questions.map(q => [q.id, q]));

        const { data: attempts, error: attErr } = await admin
            .from('task_attempts').select('id, submitted_at')
            .eq('task_id', taskId).eq('status', 'submitted');
        if (attErr) throw attErr;
        if (!attempts.length) {
            return jsonResponse(200, { suggested: 0, failed: 0, blank: 0, already_suggested: 0, remaining: 0, total_unmarked: 0 });
        }
        const submittedAtByAttempt = new Map(attempts.map(a => [a.id, a.submitted_at]));

        const { data: answers, error: ansErr } = await admin
            .from('task_answers').select('id, attempt_id, task_question_id, answer')
            .in('attempt_id', attempts.map(a => a.id))
            .in('task_question_id', [...qById.keys()])
            .is('awarded', null);
        if (ansErr) throw ansErr;

        const hasText = a => a.answer && typeof a.answer.value === 'string' && a.answer.value.trim() !== '';
        const withText = answers.filter(hasText);
        const blank = answers.length - withText.length;

        const { data: existing, error: existErr } = await admin
            .from('task_answer_suggestions').select('answer_id')
            .in('answer_id', answers.length ? answers.map(a => a.id) : ['00000000-0000-0000-0000-000000000000']);
        if (existErr) throw existErr;
        const alreadySuggestedIds = new Set((existing || []).map(s => s.answer_id));

        const eligible = withText
            .filter(a => !alreadySuggestedIds.has(a.id))
            .sort((a, b) => (submittedAtByAttempt.get(a.attempt_id) || '').localeCompare(submittedAtByAttempt.get(b.attempt_id) || ''));
        const alreadySuggested = withText.length - eligible.length;

        const batch = eligible.slice(0, MAX_ANSWERS_PER_CALL);
        const remaining = eligible.length - batch.length;

        let suggested = 0, failed = 0;
        const failures = [];

        await mapWithConcurrency(batch, CONCURRENCY, async (ans) => {
            const q = qById.get(ans.task_question_id);
            const snapshot = q.snapshot || {};
            const key = q.answer_key || {};
            const questionText = [snapshot.caseStudy, snapshot.question].filter(Boolean).join('\n\n');
            const prompt = buildPrompt({
                question: questionText,
                maxMarks: Number(q.marks),
                markScheme: key.markScheme || key.explain || '',
                modelAnswer: key.modelAnswer || '',
                studentAnswer: String(ans.answer.value),
            });

            try {
                const result = await callGeminiWithRetry(apiKey, prompt);
                const marks = clamp(roundToHalf(Number(result.marks) || 0), 0, Number(q.marks));
                const confidenceRaw = Number(result.confidence);
                const confidence = clamp(Number.isFinite(confidenceRaw) ? confidenceRaw : 0, 0, 1);

                const { error: upErr } = await admin.from('task_answer_suggestions').upsert({
                    answer_id: ans.id,
                    ai_marks: marks,
                    ai_feedback: String(result.feedback || '').slice(0, 2000),
                    ai_reasoning: String(result.reasoning || '').slice(0, 2000),
                    ai_confidence: confidence,
                    ai_model: GEMINI_MODEL,
                    ai_suggested_at: new Date().toISOString(),
                });
                if (upErr) throw upErr;
                suggested++;
            } catch (err) {
                failed++;
                if (failures.length < MAX_FAILURE_DETAILS) {
                    failures.push({ answer_id: ans.id, error: err.message || 'Unknown error' });
                }
            }
        });

        return jsonResponse(200, {
            suggested, failed, blank, already_suggested: alreadySuggested, remaining,
            total_unmarked: answers.length, failures,
        });
    } catch (err) {
        return jsonResponse(err.statusCode || 500, { error: err.message || 'Unexpected error' });
    }
};
