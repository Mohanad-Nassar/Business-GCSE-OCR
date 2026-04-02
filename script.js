// ══════════════════════════════════════
//  TAB SWITCHING
// ══════════════════════════════════════
function switchTab(id, btn) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    btn.classList.add('active');
}

// ══════════════════════════════════════
//  BUILD LEARN
// ══════════════════════════════════════
function buildLearn() {
    const grid = document.getElementById('topicGrid');
    if (!grid) return; // 🛡️ Safety check
    topics.forEach(t => {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.innerHTML = `<span class="tag">${t.tag}</span><h3>${t.title}</h3><span class="toggle-icon">+</span><div class="topic-content">${t.content}</div>`;
        card.addEventListener('click', () => card.classList.toggle('open'));
        grid.appendChild(card);
    });
}

// ══════════════════════════════════════
//  BUILD MCQ
// ══════════════════════════════════════
let mcqScore = 0, mcqTotal = 0;
function buildMCQ() {
    const wrap = document.getElementById('mcqWrap');
    if (!wrap) return; // 🛡️ Safety check
    mcqData.forEach((q, qi) => {
        const block = document.createElement('div');
        block.className = 'q-block';
        block.innerHTML = `<div class="q-num">QUESTION ${qi + 1}</div>
      <div class="q-text">${q.q}</div>
      <div class="options">${q.opts.map((o, oi) => `<button class="opt-btn" data-qi="${qi}" data-oi="${oi}">${o}</button>`).join('')}</div>
      <div class="q-feedback" id="qfb-${qi}"></div>`;
        wrap.appendChild(block);
    });
    wrap.addEventListener('click', e => {
        if (!e.target.classList.contains('opt-btn')) return;
        const qi = +e.target.dataset.qi, oi = +e.target.dataset.oi;
        const block = e.target.closest('.q-block');
        if (block.dataset.answered) return;
        block.dataset.answered = 1; mcqTotal++;
        block.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
        const fb = document.getElementById(`qfb-${qi}`);
        if (oi === mcqData[qi].ans) {
            e.target.classList.add('correct');
            fb.textContent = '✓ Correct! ' + mcqData[qi].explain;
            fb.className = 'q-feedback show ok'; mcqScore++;
        } else {
            e.target.classList.add('wrong');
            block.querySelectorAll('.opt-btn')[mcqData[qi].ans].classList.add('correct');
            fb.textContent = '✗ ' + mcqData[qi].explain;
            fb.className = 'q-feedback show no';
        }
        document.getElementById('mcqScore').textContent = mcqScore;
        document.getElementById('mcqTotal').textContent = mcqTotal;
    });
}
function resetMCQ() {
    mcqScore = 0; mcqTotal = 0;
    const scoreEl = document.getElementById('mcqScore');
    if (!scoreEl) return;
    scoreEl.textContent = 0;
    document.getElementById('mcqTotal').textContent = 0;
    document.getElementById('mcqWrap').innerHTML = '';
    buildMCQ();
}

// ══════════════════════════════════════
//  BUILD MATCHING
// ══════════════════════════════════════
let matchSelected = null, matchScore = 0, matchTotal = 0;
const matchMistakes = new Set();
let matchLocked = false;
function buildMatch() {
    const left = document.getElementById('matchLeft');
    const right = document.getElementById('matchRight');
    if (!left || !right) return; // 🛡️ Safety check

    matchTotal = matchData.length;
    document.getElementById('matchTotal').textContent = matchTotal;
    const shuffled = [...matchData].sort(() => Math.random() - .5);
    matchData.forEach(m => { const el = document.createElement('div'); el.className = 'match-item'; el.textContent = m.term; el.dataset.key = m.term; el.dataset.side = 'left'; left.appendChild(el); });
    shuffled.forEach(m => { const el = document.createElement('div'); el.className = 'match-item'; el.textContent = m.def; el.dataset.key = m.term; el.dataset.side = 'right'; right.appendChild(el); });
    left.addEventListener('click', handleMatch);
    right.addEventListener('click', handleMatch);
}
function handleMatch(e) {
    if (matchLocked) return;
    const item = e.target.closest('.match-item'); if (!item || item.classList.contains('matched-ok') || item.classList.contains('matched-eventual')) return;
    if (!matchSelected) { document.querySelectorAll('.match-item.selected').forEach(x => x.classList.remove('selected')); item.classList.add('selected'); matchSelected = item; }
    else {
        if (matchSelected === item) { item.classList.remove('selected'); matchSelected = null; return; }
        if (matchSelected.dataset.side === item.dataset.side) { matchSelected.classList.remove('selected'); matchSelected = item; item.classList.add('selected'); return; }
        const a = matchSelected, b = item; a.classList.remove('selected'); b.classList.remove('selected'); matchSelected = null;
        if (a.dataset.key === b.dataset.key) {
            const cls = matchMistakes.has(a.dataset.key) ? 'matched-eventual' : 'matched-ok';
            a.classList.add(cls); b.classList.add(cls); matchScore++; document.getElementById('matchScore').textContent = matchScore;
        } else {
            matchLocked = true; matchMistakes.add(a.dataset.key); matchMistakes.add(b.dataset.key);
            a.classList.add('matched-no'); b.classList.add('matched-no');
            setTimeout(() => { a.classList.remove('matched-no'); b.classList.remove('matched-no'); matchLocked = false; }, 700);
        }
    }
}
function resetMatch() {
    matchScore = 0; matchSelected = null; matchLocked = false; matchMistakes.clear();
    const scoreEl = document.getElementById('matchScore');
    if (!scoreEl) return;
    scoreEl.textContent = 0;
    document.getElementById('matchLeft').innerHTML = '';
    document.getElementById('matchRight').innerHTML = '';
    buildMatch();
}

// ══════════════════════════════════════
//  BUILD FIB
// ══════════════════════════════════════
let fibScore = 0, fibCorrectTotal = 0;
function buildFIB() {
    const wrap = document.getElementById('fibWrap');
    if (!wrap) return; // 🛡️ Safety check

    fibCorrectTotal = fibData.reduce((a, f) => a + Object.keys(f.blanks).length, 0);
    document.getElementById('fibTotal').textContent = fibCorrectTotal;
    fibData.forEach((f, fi) => {
        const div = document.createElement('div'); div.className = 'fib-sentence';
        const correctAnswers = Object.values(f.blanks);
        const distractors = fibWords.filter(w => !correctAnswers.includes(w)).sort(() => Math.random() - .5).slice(0, 4);
        let html = f.display, bi = 0;
        html = html.replace(/_____/g, () => {
            const key = Object.keys(f.blanks)[bi]; const ans = f.blanks[key]; bi++;
            const opts = [ans, ...distractors.filter(d => d !== ans).slice(0, 3)].sort(() => Math.random() - .5);
            const optHTML = ['— choose —', ...opts].map(o => `<option value="${o === '— choose —' ? '' : o}">${o}</option>`).join('');
            return `<span class="blank-select" data-fi="${fi}" data-key="${key}" data-ans="${ans}"><select>${optHTML}</select></span>`;
        });
        div.innerHTML = html; wrap.appendChild(div);
    });
    wrap.addEventListener('change', e => {
        const sel = e.target; if (sel.tagName !== 'SELECT') return;
        const wrapper = sel.closest('.blank-select'); if (!wrapper || wrapper.dataset.answered === 'correct') return;
        const chosen = sel.value, ans = wrapper.dataset.ans; if (!chosen) return;
        if (chosen === ans) { wrapper.dataset.answered = 'correct'; wrapper.classList.remove('wrong'); wrapper.classList.add('correct'); sel.disabled = true; fibScore++; document.getElementById('fibScore').textContent = fibScore; }
        else { wrapper.classList.remove('correct'); wrapper.classList.add('wrong'); setTimeout(() => { wrapper.classList.remove('wrong'); sel.value = ''; }, 700); }
    });
}
function resetFIB() {
    fibScore = 0;
    const scoreEl = document.getElementById('fibScore');
    if (!scoreEl) return;
    scoreEl.textContent = 0;
    document.getElementById('fibWrap').innerHTML = '';
    buildFIB();
}

// ══════════════════════════════════════
//  BUILD MISCONCEPTIONS
// ══════════════════════════════════════
function buildMisc() {
    const list = document.getElementById('miscList');
    if (!list) return; // 🛡️ Safety check
    miscData.forEach(m => {
        const card = document.createElement('div'); card.className = 'misc-card';
        card.innerHTML = `<div class="wrong-view"><div class="misc-tag">✗ Common Student View</div><p>${m.wrong}</p></div><div class="correct-view"><div class="misc-tag">✓ Examiner's Correct View</div><p>${m.correct}</p></div>`;
        list.appendChild(card);
    });
}

// ══════════════════════════════════════
//  BUILD EXAM TIPS
// ══════════════════════════════════════
function buildTips() {
    const grid = document.getElementById('tipsGrid');
    if (!grid) return; // 🛡️ Safety check
    examTips.forEach(t => {
        const card = document.createElement('div'); card.className = 'tip-card';
        const pills = t.pills.map(p => `<span class="mark-pill ${p}">${p.toUpperCase()}</span>`).join('');
        card.innerHTML = `<div class="tip-type">${t.type}</div><h4>${t.title}</h4><p>${t.content}</p>${t.pills.length ? `<div class="mark-breakdown">${pills}</div>` : ''}`;
        grid.appendChild(card);
    });
}


// ══════════════════════════════════════
//  FLASHCARDS
// ══════════════════════════════════════
let activeDeck = [];
let fcIndex = 0;
let knownCards = [];
let unknownCards = [];

function initFlashcards() {
    const termEl = document.getElementById('fcTerm');
    if (!termEl || typeof flashcards === 'undefined') return;

    // Start with all flashcards
    activeDeck = [...flashcards];
    resetFlashcardsState();
}

function resetFlashcardsState() {
    fcIndex = 0;
    knownCards = [];
    unknownCards = [];

    document.getElementById('fcSummaryArea').style.display = 'none';
    document.getElementById('fcActiveArea').style.display = 'block';
    document.getElementById('fcScoreBar').style.display = 'flex';

    renderFC();
    updateFCScore();
}

function resetFlashcards() {
    activeDeck = [...flashcards];
    resetFlashcardsState();
}

function reviewWrong() {
    if (unknownCards.length === 0) return;
    activeDeck = [...unknownCards]; // Load only the wrong cards
    resetFlashcardsState();
}

function renderFC() {
    const termEl = document.getElementById('fcTerm');
    if (!termEl || activeDeck.length === 0) return;

    const fc = activeDeck[fcIndex];
    termEl.textContent = fc.term;
    document.getElementById('fcDef').textContent = fc.def;
    document.getElementById('fcProgress').textContent = `Card ${fcIndex + 1} of ${activeDeck.length}`;

    document.getElementById('flashcard').classList.remove('flipped');

    // Reset to default nav buttons before flipping
    document.getElementById('fcNavDefault').style.display = 'flex';
    document.getElementById('fcNavAssess').style.display = 'none';
}

function flipCard() {
    const cardEl = document.getElementById('flashcard');
    if (!cardEl) return;

    cardEl.classList.toggle('flipped');

    // Show assess buttons only when flipped to the back
    const isFlipped = cardEl.classList.contains('flipped');
    if (isFlipped) {
        document.getElementById('fcNavDefault').style.display = 'none';
        document.getElementById('fcNavAssess').style.display = 'flex';
    } else {
        document.getElementById('fcNavDefault').style.display = 'flex';
        document.getElementById('fcNavAssess').style.display = 'none';
    }
}

function markCard(isKnown) {
    const currentCard = activeDeck[fcIndex];

    if (isKnown) {
        knownCards.push(currentCard);
    } else {
        unknownCards.push(currentCard);
    }

    updateFCScore();

    // Move to next card or show summary if at the end
    if (fcIndex < activeDeck.length - 1) {
        fcIndex++;
        renderFC();
    } else {
        showFCSummary();
    }
}

function updateFCScore() {
    const knownEl = document.getElementById('fcKnown');
    if (!knownEl) return;
    knownEl.textContent = knownCards.length;
    document.getElementById('fcUnknown').textContent = unknownCards.length;
    document.getElementById('fcTotalTrack').textContent = activeDeck.length;
}

function showFCSummary() {
    document.getElementById('fcActiveArea').style.display = 'none';
    document.getElementById('fcSummaryArea').style.display = 'block';

    document.getElementById('fcSummaryKnown').textContent = knownCards.length;
    document.getElementById('fcSummaryTotal').textContent = activeDeck.length;

    // Hide "Review Incorrect" button if they got 100% right
    const btnReviewWrong = document.getElementById('btnReviewWrong');
    if (unknownCards.length > 0) {
        btnReviewWrong.style.display = 'inline-block';
    } else {
        btnReviewWrong.style.display = 'none';
    }
}

// Manual navigation functions (for when they are just browsing without assessing)
function nextCard() {
    if (activeDeck.length === 0) return;
    fcIndex = (fcIndex + 1) % activeDeck.length;
    renderFC();
}

function prevCard() {
    if (activeDeck.length === 0) return;
    fcIndex = (fcIndex - 1 + activeDeck.length) % activeDeck.length;
    renderFC();
}


// ══════════════════════════════════════
//  BUILD TRUE / FALSE
// ══════════════════════════════════════
let tfScore = 0, tfTotal = 0;
function buildTF() {
    const wrap = document.getElementById('tfWrap');
    if (!wrap) return; // 🛡️ Safety check
    tfData.forEach((item, i) => {
        const card = document.createElement('div'); card.className = 'tf-card';
        card.innerHTML = `<div><div class="tf-text">${item.statement}</div><div class="tf-explanation" id="tfExp-${i}">${item.explanation}</div></div>
    <div class="tf-btns"><button class="tf-btn" data-i="${i}" data-val="true">TRUE</button><button class="tf-btn" data-i="${i}" data-val="false">FALSE</button></div>`;
        wrap.appendChild(card);
    });
    wrap.addEventListener('click', e => {
        const btn = e.target.closest('.tf-btn'); if (!btn) return;
        const i = +btn.dataset.i; const card = btn.closest('.tf-card');
        if (card.dataset.answered) return;
        card.dataset.answered = 1;
        const val = btn.dataset.val === 'true'; const correct = val === tfData[i].answer; tfTotal++;
        card.querySelectorAll('.tf-btn').forEach(b => b.disabled = true);
        if (correct) { btn.classList.add('correct'); tfScore++; }
        else { btn.classList.add('wrong'); card.querySelectorAll('.tf-btn').forEach(b => { if (b.dataset.val === String(tfData[i].answer)) b.classList.add('correct'); }); }
        document.getElementById(`tfExp-${i}`).classList.add('show');
        document.getElementById('tfScore').textContent = tfScore;
        document.getElementById('tfTotal').textContent = tfTotal;
    });
}
function resetTF() {
    tfScore = 0; tfTotal = 0;
    const scoreEl = document.getElementById('tfScore');
    if (!scoreEl) return;
    scoreEl.textContent = 0;
    document.getElementById('tfTotal').textContent = 0;
    document.getElementById('tfWrap').innerHTML = '';
    buildTF();
}

// ══════════════════════════════════════
//  BUILD EXAM PRACTICE
// ══════════════════════════════════════
function buildExamPractice() {
    const list = document.getElementById('epList');
    if (!list) return; // 🛡️ Safety check

    examQuestions.forEach((q, qi) => {
        const card = document.createElement('div');
        card.className = 'ep-card';
        const caseHtml = q.caseStudy ? `<div class="ep-case">${q.caseStudy.replace(/\n/g, '<br>')}</div>` : '';
        let interactiveHtml = '';
        if (q.type === 'mcq') {
            interactiveHtml = `<div class="ep-mcq-opts">${q.options.map((o, oi) =>
                `<button class="ep-opt" data-qi="${qi}" data-oi="${oi}"><strong>${String.fromCharCode(65 + oi)}.</strong> ${o}</button>`
            ).join('')}</div>`;
        } else {
            interactiveHtml = `<textarea class="ep-answer-area" id="epTextarea-${qi}" placeholder="Write your answer here..."></textarea>`;
        }
        card.innerHTML = `
      <div class="ep-header">
        <div>
          <div class="ep-num">${q.num}</div>
          <div class="ep-title">${q.marks} mark${q.marks > 1 ? 's' : ''}</div>
        </div>
        <div class="ep-marks">[${q.marks} mark${q.marks > 1 ? 's' : ''}]</div>
      </div>
      <div class="ep-body">
        ${caseHtml}
        <div class="ep-question">${q.question.replace(/\n/g, '<br>')}</div>
        ${interactiveHtml}
        <div class="ep-btn-row">
          <button class="ep-btn hint-btn" onclick="togglePop(${qi},'hint')">💡 Hint</button>
          <button class="ep-btn starter-btn" onclick="togglePop(${qi},'starter')">✍️ Sentence Starter</button>
          ${q.type !== 'mcq' ? `<button class="ep-btn submit-btn" onclick="togglePop(${qi},'marks')">📋 Submit &amp; See Mark Scheme</button>` : ''}
        </div>
        <div class="ep-popup hint-pop" id="epHint-${qi}"><strong>💡 Hint:</strong> ${q.hint}</div>
        <div class="ep-popup starter-pop" id="epStarter-${qi}"><strong>✍️ Sentence Starter:</strong><br>${q.starter.replace(/\n/g, '<br>')}</div>
        <div class="ep-popup marks-pop" id="epMarks-${qi}">
          ${q.markScheme}
          ${q.modelAnswer ? `<div class="marks-section"><h5>✓ Model Answer</h5><div class="model-answer">${q.modelAnswer}</div></div>` : ''}
        </div>
      </div>`;
        list.appendChild(card);
    });

    list.addEventListener('click', e => {
        const btn = e.target.closest('.ep-opt');
        if (!btn) return;
        const qi = +btn.dataset.qi, oi = +btn.dataset.oi;
        const card = btn.closest('.ep-card');
        if (card.dataset.epAnswered) return;
        card.dataset.epAnswered = 1;
        const allOpts = card.querySelectorAll('.ep-opt');
        allOpts.forEach(b => b.disabled = true);
        if (oi === examQuestions[qi].answer) {
            btn.classList.add('ep-correct');
        } else {
            btn.classList.add('ep-wrong');
            allOpts[examQuestions[qi].answer].classList.add('ep-correct');
        }
        document.getElementById(`epMarks-${qi}`).classList.add('show');
    });
}

function togglePop(qi, type) {
    const hint = document.getElementById(`epHint-${qi}`);
    const starter = document.getElementById(`epStarter-${qi}`);
    const marks = document.getElementById(`epMarks-${qi}`);
    if (type === 'hint') { hint.classList.toggle('show'); starter.classList.remove('show'); }
    else if (type === 'starter') { starter.classList.toggle('show'); hint.classList.remove('show'); }
    else if (type === 'marks') { marks.classList.toggle('show'); }
}

// ══════════════════════════════════════
//  SAFE INITIALIZATION
// ══════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
    // Only builds the section IF the specific data array exists on this particular page
    if (typeof topics !== 'undefined') buildLearn();
    if (typeof mcqData !== 'undefined') buildMCQ();
    if (typeof matchData !== 'undefined') buildMatch();
    if (typeof fibData !== 'undefined' && typeof fibWords !== 'undefined') buildFIB();
    if (typeof miscData !== 'undefined') buildMisc();
    if (typeof examTips !== 'undefined') buildTips();
    if (typeof flashcards !== 'undefined') initFlashcards();
    if (typeof tfData !== 'undefined') buildTF();
    if (typeof examQuestions !== 'undefined') buildExamPractice();
});