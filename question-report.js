// ══════════════════════════════════════════════════════════════
// QUESTION REPORT (WP-C5) — a small "⚑ Report a problem" affordance the
// student quiz players drop next to a marked question, plus the modal it
// opens. Calls report_question() (supabase/question-reports.sql); the
// teacher sees the queue on their dashboard.
//
// Usage (after a question is marked, so the student knows what's wrong):
//   const btn = gcseQuestionReportButton({
//     client, questionKey, pageId, subject, activity
//   });
//   feedbackEl.appendChild(btn);
//
// Self-contained: injects its own styles, builds one shared modal, escapes
// everything, and never throws into the caller.
// ══════════════════════════════════════════════════════════════

function _qrEsc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

var QR_REASONS = [
    ['wrong_answer', "The marked answer looks wrong"],
    ['typo', "There's a typo or mistake in the text"],
    ['confusing', "The question is confusing or unclear"],
    ['technical', "Something didn't work (image, layout…)"],
    ['other', "Something else"]
];

function _qrInjectStyles() {
    if (document.getElementById('qrStyles')) return;
    var s = document.createElement('style');
    s.id = 'qrStyles';
    s.textContent =
        '.qr-report-btn{background:none;border:none;cursor:pointer;color:var(--mid,#5a6e7f);' +
        'font-family:"DM Mono",monospace;font-size:11px;letter-spacing:.03em;padding:4px 6px;' +
        'border-radius:5px;text-decoration:underline;text-underline-offset:2px;}' +
        '.qr-report-btn:hover{color:var(--wrong,#c84b31);background:rgba(200,75,49,.06);}' +
        '.qr-backdrop{position:fixed;inset:0;background:rgba(15,25,35,.5);z-index:9998;' +
        'display:none;align-items:center;justify-content:center;padding:20px;}' +
        '.qr-backdrop.show{display:flex;}' +
        '.qr-modal{background:var(--card-bg,#fffcf6);border:1px solid var(--border,#c9bfaa);' +
        'border-radius:14px;max-width:440px;width:100%;padding:22px 22px 18px;' +
        'box-shadow:0 20px 50px rgba(0,0,0,.28);font-family:"DM Sans",sans-serif;color:var(--ink,#0f1923);' +
        'max-height:90vh;overflow-y:auto;}' +
        '.qr-modal h3{font-family:"Playfair Display",serif;font-size:18px;margin:0 0 4px;}' +
        '.qr-modal .qr-sub{font-size:12.5px;color:var(--mid,#5a6e7f);margin-bottom:14px;}' +
        '.qr-opt{display:flex;gap:9px;align-items:flex-start;padding:8px 10px;border:1px solid var(--border,#c9bfaa);' +
        'border-radius:8px;margin-bottom:7px;cursor:pointer;font-size:13.5px;background:var(--card-bg,#fffcf6);}' +
        '.qr-opt:hover{border-color:var(--accent,#4a6fa5);}' +
        '.qr-opt input{margin-top:2px;}' +
        '.qr-modal textarea{width:100%;margin-top:6px;border:1px solid var(--border,#c9bfaa);border-radius:8px;' +
        'padding:9px 11px;font-family:inherit;font-size:13px;resize:vertical;min-height:60px;background:var(--card-bg,#fffcf6);color:inherit;}' +
        '.qr-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px;}' +
        '.qr-btn{border:none;border-radius:8px;padding:9px 16px;font-family:inherit;font-weight:600;font-size:13px;cursor:pointer;}' +
        '.qr-btn.primary{background:var(--chrome, var(--ink,#0f1923));color:var(--chrome-text, var(--paper,#f5f0e8));}' +
        '.qr-btn.primary:disabled{opacity:.55;cursor:default;}' +
        '.qr-btn.ghost{background:none;border:1px solid var(--border,#c9bfaa);color:var(--ink,#0f1923);}' +
        '.qr-msg{font-size:12.5px;margin-top:10px;padding:8px 10px;border-radius:6px;display:none;}' +
        '.qr-msg.show{display:block;}' +
        '.qr-msg.ok{background:rgba(45,122,79,.1);color:#2d7a4f;}' +
        '.qr-msg.err{background:rgba(200,75,49,.1);color:var(--wrong,#c84b31);}';
    document.head.appendChild(s);
}

function _qrModal() {
    var existing = document.getElementById('qrBackdrop');
    if (existing) return existing;
    _qrInjectStyles();
    var back = document.createElement('div');
    back.id = 'qrBackdrop';
    back.className = 'qr-backdrop';
    back.innerHTML =
        '<div class="qr-modal" role="dialog" aria-modal="true" aria-label="Report a problem with this question">' +
        '<h3>Report a problem</h3>' +
        '<div class="qr-sub">Thanks for helping us fix it — your teacher will see this.</div>' +
        '<div id="qrOpts">' +
        QR_REASONS.map(function (r, i) {
            return '<label class="qr-opt"><input type="radio" name="qrReason" value="' + r[0] + '"' +
                (i === 0 ? ' checked' : '') + '/><span>' + _qrEsc(r[1]) + '</span></label>';
        }).join('') +
        '</div>' +
        '<textarea id="qrDetail" maxlength="1000" placeholder="Anything else? (optional)"></textarea>' +
        '<div class="qr-msg" id="qrMsg"></div>' +
        '<div class="qr-actions">' +
        '<button type="button" class="qr-btn ghost" id="qrCancel">Cancel</button>' +
        '<button type="button" class="qr-btn primary" id="qrSend">Send report</button>' +
        '</div></div>';
    document.body.appendChild(back);

    var close = function () { back.classList.remove('show'); };
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    document.getElementById('qrCancel').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    return back;
}

function _qrOpen(ctx) {
    var back = _qrModal();
    var msg = document.getElementById('qrMsg');
    var send = document.getElementById('qrSend');
    var detail = document.getElementById('qrDetail');
    msg.className = 'qr-msg';
    detail.value = '';
    var checked = back.querySelector('input[name="qrReason"][value="wrong_answer"]');
    if (checked) checked.checked = true;
    send.disabled = false;
    send.textContent = 'Send report';
    back.classList.add('show');

    // Rebind send fresh each open so it captures the current ctx.
    var newSend = send.cloneNode(true);
    send.parentNode.replaceChild(newSend, send);
    newSend.addEventListener('click', async function () {
        var reasonEl = back.querySelector('input[name="qrReason"]:checked');
        var reason = reasonEl ? reasonEl.value : 'other';
        newSend.disabled = true;
        newSend.textContent = 'Sending…';
        try {
            if (!ctx.client) throw new Error('no client');
            var res = await ctx.client.rpc('report_question', {
                p_question_key: ctx.questionKey || null,
                p_page_id: ctx.pageId || null,
                p_subject: ctx.subject || null,
                p_activity: ctx.activity || null,
                p_reason: reason,
                p_detail: detail.value || null
            });
            if (res.error) throw res.error;
            if (res.data && res.data.ok === false) {
                msg.textContent = res.data.error === 'rate_limited'
                    ? "You've sent a lot of reports today — thanks! Try again tomorrow."
                    : 'Could not send the report.';
                msg.className = 'qr-msg err show';
                newSend.disabled = false;
                newSend.textContent = 'Send report';
                return;
            }
            msg.textContent = '✓ Report sent — thank you!';
            msg.className = 'qr-msg ok show';
            newSend.textContent = 'Sent';
            setTimeout(function () { back.classList.remove('show'); }, 1100);
        } catch (e) {
            msg.textContent = 'Could not send the report — check your connection and try again.';
            msg.className = 'qr-msg err show';
            newSend.disabled = false;
            newSend.textContent = 'Send report';
        }
    });
}

// Public: returns a small button element wired to open the report modal
// for this question's context. Safe to call many times.
function gcseQuestionReportButton(ctx) {
    _qrInjectStyles();
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'qr-report-btn';
    btn.textContent = '⚑ Report a problem';
    btn.addEventListener('click', function () {
        try { _qrOpen(ctx || {}); } catch (e) {}
    });
    return btn;
}
