// ══════════════════════════════════════
//  TAB SWITCHING
// ══════════════════════════════════════
function switchTab(id, btn) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    btn.classList.add('active');

    // NEW: Show the hint if they switch to Key Learning or Exam Tips
    if (id === 'learn' || id === 'examtips') {
        showDoubleClickHint();
    }
}

// ══════════════════════════════════════
//  EXPAND ALL BUTTON INJECTOR
// ══════════════════════════════════════
// ══════════════════════════════════════
//  EXPAND ALL BUTTON INJECTOR
// ══════════════════════════════════════

// ══════════════════════════════════════
//  HEADER ACTIONS INJECTOR (Expand All & Layout Toggle)
// ══════════════════════════════════════
function injectExpandAll(tabId, gridId, cardClass) {
    const tabPanel = document.getElementById(tabId);
    const grid = document.getElementById(gridId);
    if (!tabPanel || !grid) return;

    // Prevent duplicate buttons if the script runs twice
    if (tabPanel.querySelector('.header-actions-wrap')) return;

    // Grab the existing title and subtitle elements
    const title = tabPanel.querySelector('.section-title');
    const subTitle = tabPanel.querySelector('.section-sub');

    // Create a new Flexbox header container
    const headerWrap = document.createElement('div');
    headerWrap.className = 'header-actions-wrap';
    headerWrap.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; margin-bottom: 28px; gap: 15px;';

    // 1. Group the text items together on the left
    const textWrap = document.createElement('div');
    if (title) textWrap.appendChild(title);
    if (subTitle) {
        subTitle.style.marginBottom = '0';
        textWrap.appendChild(subTitle);
    }

    // 2. Create an Action Wrapper for the right side buttons
    const actionWrap = document.createElement('div');
    actionWrap.style.cssText = 'display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 4px;';

    // ─── APPLY DEFAULT STATES IMMEDIATELY ───
    let isListView = true;
    let isExpanded = true;

    // Force the grid into list view on load
    grid.classList.add('list-view');

    // Force all generated cards into the open state on load
    const initialCards = grid.querySelectorAll('.' + cardClass);
    initialCards.forEach(card => card.classList.add('open'));

    // 3. Create the Grid/List Toggle Button
    const layoutBtn = document.createElement('button');
    layoutBtn.className = 'fc-btn outline';
    // Since default is List View, the button offers Grid View
    layoutBtn.innerHTML = '🔠 Grid View';

    layoutBtn.addEventListener('click', () => {
        isListView = !isListView;
        layoutBtn.innerHTML = isListView ? '🔠 Grid View' : '🔲 List View';

        if (isListView) {
            grid.classList.add('list-view');
        } else {
            grid.classList.remove('list-view');
        }
    });

    // 4. Create the Expand/Collapse All Button
    const expandBtn = document.createElement('button');
    expandBtn.className = 'fc-btn outline';
    // Since default is Expanded, the button offers Collapse All
    expandBtn.innerHTML = '📂 Collapse All Cards';

    expandBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        expandBtn.innerHTML = isExpanded ? '📂 Collapse All Cards' : '📂 Expand All Cards';

        const cards = grid.querySelectorAll('.' + cardClass);
        cards.forEach(card => {
            if (isExpanded) {
                card.classList.add('open');
            } else {
                card.classList.remove('open');
            }
        });
        window.getSelection().removeAllRanges();
    });

    // Assemble the pieces
    actionWrap.appendChild(layoutBtn);
    actionWrap.appendChild(expandBtn);

    headerWrap.appendChild(textWrap);
    headerWrap.appendChild(actionWrap);

    // Insert the header right before the grid
    tabPanel.insertBefore(headerWrap, grid);
}
// ══════════════════════════════════════
//  BUILD LEARN
// ══════════════════════════════════════
function buildLearn() {
    const grid = document.getElementById('topicGrid');
    if (!grid) return;

    topics.forEach(t => {
        const card = document.createElement('div');
        card.className = 'topic-card';
        card.innerHTML = `<span class="tag">${t.tag}</span><h3>${t.title}</h3><span class="toggle-icon">+</span><div class="topic-content">${t.content}</div>`;

        card.addEventListener('dblclick', () => {
            card.classList.toggle('open');
            window.getSelection().removeAllRanges();
        });

        grid.appendChild(card);
    });

    injectExpandAll('tab-learn', 'topicGrid', 'topic-card');
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
//  BUILD FIB (ADVANCED TYPING + DROPDOWNS)
// ══════════════════════════════════════
let fibScore = 0, fibCorrectTotal = 0;
let isAdvancedFIB = false; // Tracks which mode the student is in

// Forgiving answer checker
function isAnswerAcceptable(userInput, actualAnswer) {
    let u = userInput.trim().toLowerCase();
    let a = actualAnswer.trim().toLowerCase();

    if (u === a) return true; // Exact match
    if (u + 's' === a || u === a + 's') return true; // Allows singular/plural leniency
    return false;
}

function buildFIB() {
    const wrap = document.getElementById('fibWrap');
    if (!wrap) return;

    fibCorrectTotal = fibData.reduce((a, f) => a + Object.keys(f.blanks).length, 0);
    document.getElementById('fibTotal').textContent = fibCorrectTotal;

    fibData.forEach((f, fi) => {
        const div = document.createElement('div');
        div.className = 'fib-sentence';

        let html = f.display;
        let bi = 0;

        // ── MODE: STANDARD DROPDOWNS ──
        if (!isAdvancedFIB) {
            const correctAnswers = Object.values(f.blanks);
            const distractors = fibWords.filter(w => !correctAnswers.includes(w)).sort(() => Math.random() - .5).slice(0, 4);

            html = html.replace(/_____/g, () => {
                const key = Object.keys(f.blanks)[bi];
                const ans = f.blanks[key];
                bi++;
                const opts = [ans, ...distractors.filter(d => d !== ans).slice(0, 3)].sort(() => Math.random() - .5);
                const optHTML = ['— choose —', ...opts].map(o => `<option value="${o === '— choose —' ? '' : o}">${o}</option>`).join('');
                return `<span class="blank-select" data-fi="${fi}" data-key="${key}" data-ans="${ans}"><select>${optHTML}</select></span>`;
            });
            div.innerHTML = html;
            wrap.appendChild(div);
        }
        // ── MODE: ADVANCED TYPING ──
        else {
            html = html.replace(/_____/g, () => {
                const key = Object.keys(f.blanks)[bi];
                const ans = f.blanks[key];
                bi++;
                return `<input type="text" class="fib-input" data-fi="${fi}" data-key="${key}" data-ans="${ans}" placeholder="type here...">`;
            });

            div.innerHTML = html;

            // Add the "Check Answers" button for this specific section
            const checkBtn = document.createElement('button');
            checkBtn.className = 'fib-check-btn';
            checkBtn.innerHTML = '✓ Check Answers';

            checkBtn.addEventListener('click', () => {
                const inputs = div.querySelectorAll('.fib-input');
                let allSectionCorrect = true;

                inputs.forEach(input => {
                    if (input.disabled) return; // Skip ones they already got right

                    if (isAnswerAcceptable(input.value, input.dataset.ans)) {
                        input.classList.remove('wrong');
                        input.classList.add('correct');
                        input.disabled = true; // Lock it in
                        fibScore++;
                    } else {
                        input.classList.remove('correct');
                        input.classList.add('wrong'); // Turns red, but keeps their text!
                        allSectionCorrect = false;
                    }
                });

                document.getElementById('fibScore').textContent = fibScore;

                if (allSectionCorrect) {
                    checkBtn.innerHTML = 'Perfect! ✨';
                    checkBtn.disabled = true;
                }
            });

            div.appendChild(document.createElement('br'));
            div.appendChild(checkBtn);
            wrap.appendChild(div);
        }
    });

    // Attach Dropdown Listener safely (only once, and only for standard mode)
    if (!isAdvancedFIB && !wrap.dataset.listenerAttached) {
        wrap.addEventListener('change', e => {
            const sel = e.target; if (sel.tagName !== 'SELECT') return;
            const wrapper = sel.closest('.blank-select'); if (!wrapper || wrapper.dataset.answered === 'correct') return;
            const chosen = sel.value, ans = wrapper.dataset.ans; if (!chosen) return;

            if (chosen === ans) {
                wrapper.dataset.answered = 'correct';
                wrapper.classList.remove('wrong'); wrapper.classList.add('correct');
                sel.disabled = true; fibScore++;
                document.getElementById('fibScore').textContent = fibScore;
            } else {
                wrapper.classList.remove('correct'); wrapper.classList.add('wrong');
                setTimeout(() => { wrapper.classList.remove('wrong'); sel.value = ''; }, 700);
            }
        });
        wrap.dataset.listenerAttached = 'true';
    }
}

function resetFIB() {
    fibScore = 0;
    const scoreEl = document.getElementById('fibScore');
    if (!scoreEl) return;
    scoreEl.textContent = 0;
    document.getElementById('fibWrap').innerHTML = '';
    buildFIB();
}

// ── INJECT THE TOGGLE BUTTON ──
function injectFIBAdvancedToggle() {
    const fibTab = document.getElementById('tab-fib');
    if (!fibTab || fibTab.querySelector('.fib-mode-toggle')) return;

    const scoreBar = fibTab.querySelector('.score-bar');
    if (!scoreBar) return;

    const btn = document.createElement('button');
    btn.className = 'fc-btn outline fib-mode-toggle';
    btn.innerHTML = '🔥 Advanced Mode: Typing';
    btn.style.marginBottom = '20px';

    btn.addEventListener('click', () => {
        isAdvancedFIB = !isAdvancedFIB;
        btn.innerHTML = isAdvancedFIB ? '🔽 Standard Mode: Dropdowns' : '🔥 Advanced Mode: Typing';
        resetFIB(); // Rebuilds the whole section in the new mode
    });

    // Insert right above the score bar
    fibTab.insertBefore(btn, scoreBar);
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
    if (!grid) return;

    examTips.forEach(t => {
        const card = document.createElement('div');
        card.className = 'tip-card';
        card.style.cursor = 'pointer';

        const pills = t.pills.map(p => `<span class="mark-pill ${p}">${p.toUpperCase()}</span>`).join('');

        card.innerHTML = `
            <span class="toggle-icon" style="position:absolute; right:20px; top:20px; color:#5a6e7f; font-size:18px; transition:transform 0.3s;">+</span>
            <div class="tip-type">${t.type}</div>
            <h4>${t.title}</h4>
            <div class="tip-content">
                ${t.content}
                ${t.pills.length ? `<div class="mark-breakdown">${pills}</div>` : ''}
            </div>
        `;

        // Just the double-click logic remains
        card.addEventListener('dblclick', () => {
            card.classList.toggle('open');
            window.getSelection().removeAllRanges();
        });

        grid.appendChild(card);
    });
    injectExpandAll('tab-examtips', 'tipsGrid', 'tip-card');
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
//  SCROLL TO TOP BUTTON
// ══════════════════════════════════════
function initScrollToTop() {
    // 1. Create the button element
    const scrollBtn = document.createElement('button');
    scrollBtn.innerHTML = '↑ Top';
    scrollBtn.className = 'scroll-to-top';
    document.body.appendChild(scrollBtn);

    // 2. Show/hide the button based on how far the user scrolls
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    // 3. Smoothly scroll to top when clicked
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
// ══════════════════════════════════════
//  TOAST NOTIFICATION LOGIC
// ══════════════════════════════════════
let toastEl = null;
let toastTimeout = null;

function showDoubleClickHint() {
    // Create the notification element if it doesn't exist
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.className = 'toast-hint';
        toastEl.innerHTML = `💡 <strong>Hint:</strong> Double-tap to open or close details.`;
        document.body.appendChild(toastEl);
    }

    // Show it
    toastEl.classList.add('show');

    // Reset the timer so it doesn't hide early if they keep clicking
    if (toastTimeout) clearTimeout(toastTimeout);

    // Hide it automatically after 3 seconds
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
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
    initScrollToTop();
    initCourseSidebar(); // <--- Add this
    // NEW: Show the hint shortly after the page loads 
    // (Since Key Learning is the default open tab)
    injectRandomiseButtons(); 
    injectFIBAdvancedToggle();
    initCategorisation();
    
    setTimeout(() => {
        showDoubleClickHint();
    }, 800);
});

// ══════════════════════════════════════
//  COURSE SIDEBAR NAV INJECTOR
// ══════════════════════════════════════
const courseData = [
    {
        title: "1. Business Activity",
        links: [
            { url: "1_1_role_of_business_enterprise.html", label: "1.1 Role of Business Enterprise" },
            { url: "1_2_business_planning.html", label: "1.2 Business Planning" },
            { url: "1_3_business_ownership.html", label: "1.3 Business Ownership" },
            { url: "1_4_business_aims_objectives.html", label: "1.4 Aims and Objectives" },
            { url: "1_5_stakeholders_in_business.html", label: "1.5 Stakeholders in Business" },
            { url: "1_6_business_growth.html", label: "1.6 Business Growth" }
        ]
    },
    {
        title: "2. Marketing",
        links: [
            { url: "2_1_role_of_marketing.html", label: "2.1 The Role of Marketing" },
            { url: "2_2_market_research.html", label: "2.2 Market Research" },
            { url: "2_3_market_segmentation.html", label: "2.3 Market Segmentation" },
            { url: "2_4_marketing_mix.html", label: "2.4 The Marketing Mix" }
        ]
    },
    {
        title: "3. People",
        links: [
            { url: "3_1_role_of_human_resources.html", label: "3.1 Role of Human Resources" },
            { url: "3_2_organisational_structures.html", label: "3.2 Organisational Structures" },
            { url: "3_3_communication_in_business.html", label: "3.3 Communication in Business" },
            { url: "3_4_recruitment_and_selection.html", label: "3.4 Recruitment and Selection" },
            { url: "3_5_motivation_and_retention.html", label: "3.5 Motivation and Retention" },
            { url: "3_6_training_and_development.html", label: "3.6 Training and Development" },
            { url: "3_7_employment_law.html", label: "3.7 Employment Law" }
        ]
    },
    {
        title: "4. Operations",
        links: [
            { url: "4_1_production_processes.html", label: "4.1 Production Processes" },
            { url: "4_2_quality_of_goods_services.html", label: "4.2 Quality of Goods & Services" },
            { url: "4_3_sales_process_customer_service.html", label: "4.3 The Sales Process" },
            { url: "4_4_consumer_law.html", label: "4.4 Consumer Law" },
            { url: "4_5_business_location.html", label: "4.5 Business Location" },
            { url: "4_6_working_with_suppliers.html", label: "4.6 Working with Suppliers" }
        ]
    },
    {
        title: "5. Finance",
        links: [
            { url: "5_1_role_of_finance_function.html", label: "5.1 Role of Finance Function" },
            { url: "5_2_sources_of_finance.html", label: "5.2 Sources of Finance" },
            { url: "5_3_revenue_costs_profit_loss.html", label: "5.3 Revenue, Costs, Profit" },
            { url: "5_4_break_even.html", label: "5.4 Break-even" },
            { url: "5_5_cash_and_cash_flow.html", label: "5.5 Cash and Cash Flow" }
        ]
    },
    {
        title: "6. Influences",
        links: [
            { url: "6_1_ethical_environmental.html", label: "6.1 Ethical & Environmental" },
            { url: "6_2_the_economic_climate.html", label: "6.2 The Economic Climate" },
            { url: "6_3_globalisation.html", label: "6.3 Globalisation" }
        ]
    },
    {
        title: "7. Final",
        links: [
            { url: "7_1_final.html", label: "7.1 Interdependent Nature" }
        ]
    }
];

// ══════════════════════════════════════
//  COURSE SIDEBAR NAV INJECTOR
// ══════════════════════════════════════
function initCourseSidebar() {
    // Only run if not on the index page and sidebar doesn't exist yet
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) return;
    if (document.getElementById('course-sidebar')) return;

    const body = document.body;
    const navBar = document.querySelector('.tab-bar');

    // 1. Build the Sidebar HTML
    const sidebar = document.createElement('aside');
    sidebar.id = 'course-sidebar';
    sidebar.className = 'course-sidebar';

    // Added the new "✕ Close" button to the header
    let html = `
        <div class="sb-header" style="display: flex; align-items: center;">
            <a href="index.html">← All Lessons</a>
            <button class="mobile-close-btn" id="mobileCloseBtn">✕ Close</button>
        </div>
    `;

    const currentPath = window.location.pathname;

    courseData.forEach(section => {
        html += `<div class="sb-section">${section.title}</div>`;
        section.links.forEach(link => {
            const isActive = currentPath.includes(link.url) ? 'active' : '';
            html += `<a href="${link.url}" class="sb-link ${isActive}">${link.label}</a>`;
        });
    });

    html += `<div class="sidebar-resizer" id="sidebarResizer"></div>`;
    sidebar.innerHTML = html;
    body.insertBefore(sidebar, navBar);

    // 2. Inject the Mobile Dark Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    body.appendChild(overlay);

    // Clicking the dark background closes the mobile menu
    overlay.addEventListener('click', () => {
        document.body.classList.remove('sidebar-mobile-open');
    });

    // Clicking the "Close" button closes the mobile menu
    const closeBtn = document.getElementById('mobileCloseBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.body.classList.remove('sidebar-mobile-open');
        });
    }

    // 3. Add Hamburger Toggle to Tab Bar
    if (navBar) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle-btn';
        toggleBtn.innerHTML = '☰';
        toggleBtn.title = 'Toggle Course Menu';

        navBar.insertBefore(toggleBtn, navBar.firstChild);

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents click glitches on mobile
            if (window.innerWidth >= 900) {
                document.body.classList.toggle('sidebar-collapsed');
            } else {
                document.body.classList.toggle('sidebar-mobile-open');
            }
        });
    }

    // 4. Auto-scroll sidebar to the active link
    setTimeout(() => {
        const activeLink = sidebar.querySelector('.active');
        if (activeLink) {
            activeLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);

    // 5. DRAG TO RESIZE LOGIC (Desktop Only)
    const resizer = document.getElementById('sidebarResizer');
    let isResizing = false;

    if (resizer) {
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.classList.add('is-resizing');
            resizer.classList.add('active');
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            let newWidth = e.clientX;
            if (newWidth < 200) newWidth = 200;
            if (newWidth > 600) newWidth = 600;
            document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.classList.remove('is-resizing');
                resizer.classList.remove('active');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }
}

// ══════════════════════════════════════
//  RANDOMISE BUTTONS INJECTOR
// ══════════════════════════════════════
function injectRandomiseButtons() {
    // Find all reset buttons on the page
    const resetBtns = document.querySelectorAll('.reset-btn');

    resetBtns.forEach(resetBtn => {
        // Prevent duplicate buttons if the script runs twice
        if (resetBtn.previousElementSibling && resetBtn.previousElementSibling.classList.contains('random-btn')) return;

        // Look at what the Reset button does to figure out which section we are in
        const onclickText = resetBtn.getAttribute('onclick') || '';
        let randomizeLogic = null;

        // Map the correct data array and reset function to the button
        if (onclickText.includes('resetMCQ') && typeof mcqData !== 'undefined') {
            randomizeLogic = () => { mcqData.sort(() => Math.random() - 0.5); resetMCQ(); };
        } else if (onclickText.includes('resetMatch') && typeof matchData !== 'undefined') {
            randomizeLogic = () => { matchData.sort(() => Math.random() - 0.5); resetMatch(); };
        } else if (onclickText.includes('resetFIB') && typeof fibData !== 'undefined') {
            randomizeLogic = () => { fibData.sort(() => Math.random() - 0.5); resetFIB(); };
        } else if (onclickText.includes('resetFlashcards') && typeof flashcards !== 'undefined') {
            randomizeLogic = () => { flashcards.sort(() => Math.random() - 0.5); resetFlashcards(); };
        } else if (onclickText.includes('resetTF') && typeof tfData !== 'undefined') {
            randomizeLogic = () => { tfData.sort(() => Math.random() - 0.5); resetTF(); };
        }

        // If we found a valid quiz section, inject the new button
        if (randomizeLogic) {
            const rndBtn = document.createElement('button');
            rndBtn.className = 'reset-btn random-btn'; // Reusing your existing reset styling
            rndBtn.innerHTML = '🔀 RANDOMISE';

            // Adjust the CSS margins so they sit beautifully together on the right
            rndBtn.style.marginLeft = 'auto';
            resetBtn.style.marginLeft = '0'; // Let the flexbox gap handle the space

            // Shuffle the data and rebuild the section when clicked
            rndBtn.addEventListener('click', randomizeLogic);

            // Insert it right before the existing RESET button
            resetBtn.parentNode.insertBefore(rndBtn, resetBtn);
        }
    });
}

// ══════════════════════════════════════
//  CATEGORISATION INJECTOR & LOGIC
// ══════════════════════════════════════
let active = null;

function initCategorisation() {
    if (typeof categoryData === 'undefined') return;

    const navBar = document.querySelector('.tab-bar');
    const mainArea = document.querySelector('main');
    if (!navBar || !mainArea || document.getElementById('tab-categorise')) return;

    const tabBtn = document.createElement('button');
    tabBtn.className = 'tab-btn';
    tabBtn.innerHTML = '🗂️ Categorise';
    tabBtn.onclick = function () { switchTab('categorise', this); };
    navBar.appendChild(tabBtn);

    const tabPanel = document.createElement('section');
    tabPanel.id = 'tab-categorise';
    tabPanel.className = 'tab-panel';
    tabPanel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
            <div>
                <h2 class="section-title">${categoryData.title}</h2>
                <p class="section-sub" id="catHint">Click an item to select it, then click a box to place it.</p>
            </div>
            <button class="reset-btn" onclick="buildCategorisationUI()">↺ RESET</button>
        </div>
        <div class="cat-progress" id="catProgress"></div>
        <div id="catCanvas" class="cat-canvas"></div>
    `;
    mainArea.appendChild(tabPanel);
    buildCategorisationUI();
}

function catHint(text, highlight) {
    const el = document.getElementById('catHint');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('highlight', !!highlight);
}

function setCatReady(on) {
    document.querySelectorAll('.cat-zone').forEach(z => z.classList.toggle('ready', on));
    const pool = document.getElementById('catPool');
    if (pool) pool.classList.toggle('ready', on);
}

function catTicker() {
    const pool = document.getElementById('catPool');
    const btn = document.getElementById('catCheckBtn');
    const pt = document.getElementById('catProgress');
    if (!pool || !btn) return;

    const remaining = pool.querySelectorAll('.cat-item').length;
    const total = document.querySelectorAll('.cat-item').length;

    if (pt) {
        pt.textContent = remaining === 0
            ? 'All placed — check your answers when ready!'
            : `${remaining} of ${total} items left`;
    }

    btn.style.display = remaining === 0 ? 'inline-block' : 'none';

    if (remaining > 0) {
        document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('wrong'));
    }
    if (remaining === 0 && !active) {
        catHint("All placed — hit 'Check answers' when ready.");
    }
}

function makeCatItem(item) {
    const el = document.createElement('div');
    el.className = 'cat-item';
    el.textContent = item.text;
    el.dataset.target = item.target;

    el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (el.classList.contains('correct')) return;

        const wasSelected = el.classList.contains('selected');
        document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('selected'));

        if (wasSelected) {
            active = null;
            setCatReady(false);
            catHint('Click an item to select it, then click a box to place it.');
        } else {
            active = el;
            el.classList.add('selected');
            setCatReady(true);
            catHint('Now click a category box — or click the item again to deselect.', true);
        }
    });

    return el;
}

function placeCatItem(dest) {
    if (!active) return;
    active.classList.remove('selected');
    dest.appendChild(active);
    active.classList.remove('cat-popin');
    void active.offsetWidth;
    active.classList.add('cat-popin');
    active = null;
    setCatReady(false);
    catHint('Nice — keep going! Click another item to sort it.');
    catTicker();
}

function buildCategorisationUI() {
    const canvas = document.getElementById('catCanvas');
    if (!canvas) return;
    active = null;
    canvas.innerHTML = '';

    // Zones
    const zonesWrap = document.createElement('div');
    zonesWrap.className = 'cat-zones';

    categoryData.categories.forEach(cat => {
        const zone = document.createElement('div');
        zone.className = 'cat-zone';
        zone.dataset.category = cat;

        const title = document.createElement('div');
        title.className = 'cat-zone-title';
        title.textContent = cat;

        const items = document.createElement('div');
        items.className = 'cat-zone-items';

        zone.appendChild(title);
        zone.appendChild(items);
        zone.addEventListener('click', () => placeCatItem(items));
        zonesWrap.appendChild(zone);
    });

    canvas.appendChild(zonesWrap);

    // Pool
    const poolLabel = document.createElement('p');
    poolLabel.className = 'cat-pool-label';
    poolLabel.textContent = 'Items to sort';
    canvas.appendChild(poolLabel);

    const pool = document.createElement('div');
    pool.className = 'cat-pool';
    pool.id = 'catPool';

    [...categoryData.items].sort(() => Math.random() - 0.5).forEach(item => {
        pool.appendChild(makeCatItem(item));
    });

    pool.addEventListener('click', () => {
        if (!active) return;
        pool.appendChild(active);
        active.classList.remove('selected', 'cat-popin');
        active = null;
        setCatReady(false);
        catHint('Moved back. Click an item to select it, then click a box.');
        catTicker();
    });

    canvas.appendChild(pool);

    // Check button
    const actionWrap = document.createElement('div');
    actionWrap.className = 'cat-action';

    const btn = document.createElement('button');
    btn.id = 'catCheckBtn';
    btn.className = 'fc-btn';
    btn.style.display = 'none';
    btn.textContent = '✓ Check answers';

    btn.addEventListener('click', () => {
        let correct = 0, total = 0;

        document.querySelectorAll('.cat-zone-items .cat-item').forEach(item => {
            const zone = item.closest('.cat-zone');
            if (!zone) return;
            total++;
            const ok = zone.dataset.category === item.dataset.target;
            item.classList.toggle('correct', ok);
            item.classList.toggle('wrong', !ok);
            if (!ok) {
                item.classList.remove('shake');
                void item.offsetWidth;
                item.classList.add('shake');
            }
            if (ok) correct++;
        });

        if (correct === total) {
            btn.textContent = 'Perfect score! ✨';
            btn.disabled = true;
            catHint('Excellent — all correct!');
        } else {
            const w = total - correct;
            btn.textContent = 'Try again';
            catHint(`${w} item${w > 1 ? 's are' : ' is'} wrong — move ${w > 1 ? 'them' : 'it'} and try again.`, true);
        }
    });

    actionWrap.appendChild(btn);
    canvas.appendChild(actionWrap);

    catHint('Click an item to select it, then click a box to place it.');
    catTicker();
}