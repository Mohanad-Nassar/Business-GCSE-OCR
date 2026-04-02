// ══════════════════════════════════════
//  BUILD FILL IN BLANKS
// ══════════════════════════════════════
let fibScore = 0, fibCorrectTotal = 0;
function buildFIB() {
    fibCorrectTotal = fibData.reduce((a, f) => a + Object.keys(f.blanks).length, 0);
    document.getElementById('fibTotal').textContent = fibCorrectTotal;
    const wrap = document.getElementById('fibWrap');
    fibData.forEach((f, fi) => {
        const div = document.createElement('div');
        div.className = 'fib-sentence';
        const correctAnswers = Object.values(f.blanks);
        const distractors = fibWords.filter(w => !correctAnswers.includes(w)).sort(() => Math.random() - .5).slice(0, 4);
        let html = f.display, bi = 0;
        html = html.replace(/_____/g, () => {
            const key = Object.keys(f.blanks)[bi];
            const ans = f.blanks[key]; bi++;
            const opts = [ans, ...distractors.filter(d => d !== ans).slice(0, 3)].sort(() => Math.random() - .5);
            const optHTML = ['— choose —', ...opts].map(o => `<option value="${o === '— choose —' ? '' : o}">${o}</option>`).join('');
            return `<span class="blank-select" data-fi="${fi}" data-key="${key}" data-ans="${ans}"><select>${optHTML}</select></span>`;
        });
        div.innerHTML = html; wrap.appendChild(div);
    });
    wrap.addEventListener('change', e => {
        const sel = e.target;
        if (sel.tagName !== 'SELECT') return;
        const wrapper = sel.closest('.blank-select');
        if (!wrapper || wrapper.dataset.answered === 'correct') return;
        const chosen = sel.value, ans = wrapper.dataset.ans;
        if (!chosen) return;
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
}
function resetFIB() {
    fibScore = 0;
    document.getElementById('fibScore').textContent = 0;
    document.getElementById('fibWrap').innerHTML = '';
    buildFIB();
}