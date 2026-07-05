# ══════════════════════════════════════════════════════════════
# LOGIC TESTS — runs the real shared JS (script.js, gamification.js,
# progress-shared.js, section-totals.js) inside a real V8 engine with
# stubbed browser globals, and asserts the behaviour of the gamification
# maths, mastery counting, redo-wrong flow, cross-device merging, guided
# flow settings and activity deep links.
#
#   pip install mini-racer          (one-off)
#   python tools/logic_test.py
#
# Exit code 0 = all passed. Add new checks alongside the feature they
# cover — this file is the safety net for changes to the shared JS.
# ══════════════════════════════════════════════════════════════
import io, json, os, sys
from py_mini_racer import MiniRacer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read(name):
    return io.open(os.path.join(ROOT, name), encoding="utf-8").read()

STUBS = r"""
var window = this;
var console = { log: function(){}, warn: function(){}, error: function(){} };
var _timers = [];
function setTimeout(fn, ms){ _timers.push(fn); return _timers.length; }
function clearTimeout(id){ if (id > 0) _timers[id-1] = null; }
function runTimers(){ var t = _timers.slice(); _timers = []; t.forEach(function(f){ if (f) f(); }); }
function requestAnimationFrame(fn){ fn(); }
function addEventListener(){}
function removeEventListener(){}
function getComputedStyle(){ return { getPropertyValue: function(){ return ''; } }; }

var localStorage = {};
Object.defineProperties(localStorage, {
  getItem:    { value: function(k){ return Object.prototype.hasOwnProperty.call(this, k) ? this[k] : null; } },
  setItem:    { value: function(k, v){ this[k] = String(v); } },
  removeItem: { value: function(k){ delete this[k]; } },
});

function makeEl(tag){
  var el = {
    tagName: String(tag||'div').toUpperCase(), children: [], style: {}, dataset: {}, _q: {},
    className: '', id: '', innerHTML: '', textContent: '', title: '', hidden: false, offsetWidth: 0,
    classList: {
      _s: {},
      add: function(c){ this._s[c] = 1; },
      remove: function(c){ delete this._s[c]; },
      toggle: function(c, f){ if (f === undefined) f = !this._s[c]; if (f) this._s[c] = 1; else delete this._s[c]; return !!f; },
      contains: function(c){ return !!this._s[c]; },
    },
    setAttribute: function(k, v){ this['_attr_' + k] = v; },
    getAttribute: function(k){ var v = this['_attr_' + k]; return v === undefined ? null : v; },
    appendChild: function(c){ this.children.push(c); c.parentElement = c.parentNode = this; return c; },
    insertBefore: function(c, ref){ this.children.unshift(c); c.parentElement = c.parentNode = this; return c; },
    querySelector: function(sel){
      if (sel.charAt(0) !== '#') return null; // class lookups: "not found" (mirrors fresh DOM)
      if (!this._q[sel]) this._q[sel] = makeEl('q');
      return this._q[sel];
    },
    querySelectorAll: function(sel){
      // memoized bank of dummies so code that indexes into option/button
      // NodeLists (e.g. applyMCQAnswered) can run
      if (!this._qa) this._qa = {};
      if (!this._qa[sel]) { this._qa[sel] = []; for (var i = 0; i < 8; i++) this._qa[sel].push(makeEl('i')); }
      return this._qa[sel];
    },
    addEventListener: function(){},
    remove: function(){},
  };
  return el;
}

var _els = {};
function __mkel(id){ var e = makeEl('div'); e.id = id; _els[id] = e; return e; }
var _qsel = {};
function __mkqs(sel){ var e = makeEl('div'); _qsel[sel] = e; return e; }
var document = {
  readyState: 'complete',
  head: makeEl('head'),
  body: makeEl('body'),
  documentElement: makeEl('html'),
  getElementById: function(id){
    if (_els[id]) return _els[id];
    // per-question feedback nodes are created inside innerHTML strings the
    // stub can't parse — auto-create those so build functions can run
    if (/^(qfb-|tfExp-)/.test(id)) return __mkel(id);
    return null;
  },
  querySelector: function(sel){ return _qsel[sel] || null; },
  querySelectorAll: function(){ return []; },
  createElement: makeEl,
  addEventListener: function(){},
  removeEventListener: function(){},
};
var location = { pathname: '/1_1_role_of_business_enterprise.html', search: '', hash: '', replace: function(){} };
var history = { pushState: function(s, t, url){ if (url && url.charAt(0) === '#') location.hash = url; }, replaceState: function(){} };
function bodyCountByClass(cls){
  return document.body.children.filter(function(c){ return (c.className||'').indexOf(cls) !== -1; }).length;
}
"""

passed = failed = 0
def check(name, cond, extra=""):
    global passed, failed
    if cond: passed += 1; print("PASS", name)
    else: failed += 1; print("FAIL", name, extra)

# ══════════════ Context 1: index.html-like (no ProgressStore) ══════════════
c1 = MiniRacer()
c1.eval(STUBS)
# seed local progress the way ProgressStore writes it
c1.eval("""
localStorage.setItem('geo_progress_1-1-role-of-business-enterprise__learn', JSON.stringify({done:6,total:6,ts:1}));
localStorage.setItem('geo_progress_1-1-role-of-business-enterprise__mcq',   JSON.stringify({done:3,total:12,ts:1}));
localStorage.setItem('geo_progress_1-1-role-of-business-enterprise__answers__mcq', JSON.stringify({0:1}));
__mkel('gamHudMount');
""")
c1.eval(read("section-totals.js"))
c1.eval(read("progress-shared.js"))
c1.eval(read("gamification.js"))

r = json.loads(c1.eval("""JSON.stringify((function(){
  var mount = _els['gamHudMount'];
  var hud = mount.children[0] || null;
  return {
    injected: !!hud,
    cls: hud ? hud.className : '',
    level: hud ? hud._q['#gamHudLevelNum'].textContent : '',
    xpLbl: hud ? hud._q['#gamHudXpLbl'].textContent : '',
    xpTotal: hud ? hud._q['#gamHudXpTotal'].textContent : '',
    fill: hud ? hud._q['#gamHudXpFill'].style.width : '',
    badges: hud ? hud._q['#gamHudBadgeCount'].textContent : '',
  };
})())"""))
# learn 6/6 + mcq 3/12 => 9 answers *10 XP + 50 section bonus = 140 XP => level 2 (50 used), 90/200 = 45%
check("home HUD injected into mount", r["injected"] and "gam-hud--hero" in r["cls"], r)
check("home HUD level 2 from 140 XP", r["level"] == 2 or r["level"] == "2", r)
check("home HUD xp label 90/200", "90 / 200" in str(r["xpLbl"]), r)
check("home HUD xp total 140", "140 XP" in str(r["xpTotal"]), r)
check("home HUD fill 45%", r["fill"] == "45%", r)
check("home HUD badges 1/17 (first steps)", str(r["badges"]) == "1/17", r)
check("HUD markup has no sound/dashboard chips",
      c1.eval("(_gamHudMainHtml().indexOf('gamHudSound') === -1) && (_gamHudMainHtml().indexOf('gam-hud-dash') === -1)"))

snd = json.loads(c1.eval("""JSON.stringify((function(){
  var b = gamificationCreateSoundButton('sn-btn');
  return { cls: b.className, icon: b.textContent };
})())"""))
check("sound button factory renders", snd["cls"] == "sn-btn" and snd["icon"] in ("\U0001F50A", "\U0001F507"), snd)

cont = json.loads(c1.eval("""JSON.stringify((function(){
  var card = null;
  _els['gamHudMount'].children.forEach(function(c){ if ((c.className||'').indexOf('gam-continue') !== -1) card = c; });
  return card ? { href: card.href, html: card.innerHTML.slice(0, 400) } : null;
})())"""))
check("continue card injected", cont is not None, cont)
check("continue card resumes most recent topic", bool(cont) and cont["href"] == "1_1_role_of_business_enterprise.html", cont)
check("continue card shows 11% (9/85) resume state", bool(cont) and "11%" in cont["html"] and "Continue where you left off" in cont["html"], cont)

# pure helpers
tp = json.loads(c1.eval("JSON.stringify(_gamTopicProgress('1-1-role-of-business-enterprise', _gamProgressData()))"))
check("topic progress done=9 total=85 incomplete", tp == {"done": 9, "total": 85, "complete": False}, tp)
pot = c1.eval("_gamPagePotentialXp('1-1-role-of-business-enterprise')")
check("potential XP = 85*10 + 8*50 + 200 = 1450", pot == 1450, pot)
lv = json.loads(c1.eval("JSON.stringify([gamificationLevelFromXp(0).level, gamificationLevelFromXp(49).level, gamificationLevelFromXp(50).level])"))
check("level curve 0/49/50 -> 1/1/2", lv == [1, 1, 2], lv)
rd = json.loads(c1.eval("JSON.stringify(_gamReadLocalProgress())"))
check("local reader parses store (with ts), skips answers",
      rd == {"1-1-role-of-business-enterprise": {"learn": {"done": 6, "total": 6, "ts": 1}, "mcq": {"done": 3, "total": 12, "ts": 1}}}, rd)

# combo
c1.eval("_gamTrackCombo(true); _gamTrackCombo(true); _gamTrackCombo(true);")
combo = c1.eval("_gamCombo")
toasts = c1.eval("bodyCountByClass('gam-combo-toast')")
check("combo counts 3 correct", combo == 3, combo)
check("combo toast at milestone 3", toasts == 1, toasts)
c1.eval("_gamTrackCombo(false)")
check("combo resets on wrong", c1.eval("_gamCombo") == 0)

# daily goal counter (device-local)
dg = json.loads(c1.eval("""JSON.stringify((function(){
  localStorage.setItem('gcse_daily_2020-01-01', '99'); // stale key from another day
  _gamBumpDaily(); _gamBumpDaily(); _gamBumpDaily();
  return { count: gamificationDailyCount(), stale: localStorage.getItem('gcse_daily_2020-01-01') };
})())"""))
check("daily goal counts today's answers and prunes old days", dg["count"] == 3 and dg["stale"] is None, dg)

# ══════════════ Context 2: topic-page-like (script.js + real ProgressStore) ══════════════
c2 = MiniRacer()
c2.eval(STUBS)
c2.eval("var pageMeta = { id: '1-1-role-of-business-enterprise' };")
c2.eval("['learn','mcq','match','fib','misc','tips','flashcards','tf','exam'].forEach(function(s){ __mkel('tabProg_' + s); });")
c2.eval(read("section-totals.js"))
c2.eval(read("progress-shared.js"))
c2.eval(read("script.js"))
c2.eval(read("gamification.js"))

pid = "1-1-role-of-business-enterprise"
c2.eval(f"ProgressStore.saveTotal('{pid}','mcq',12)")
st = json.loads(c2.eval("JSON.stringify({state:_els['tabProg_mcq'].dataset.state, disp:_els['tabProg_mcq'].style.display, html:_els['tabProg_mcq'].innerHTML.slice(0,30)})"))
check("tab ring appears when total registered", st["state"] == "part" and st["disp"] == "" and "<svg" in st["html"], st)

c2.eval(f"ProgressStore.save('{pid}','mcq',12,12)")
st2 = json.loads(c2.eval("JSON.stringify({state:_els['tabProg_mcq'].dataset.state, html:_els['tabProg_mcq'].innerHTML, pop:_els['tabProg_mcq'].classList.contains('pop')})"))
check("tab check + pop on completion", st2["state"] == "done" and "tab-prog-done" in st2["html"] and st2["pop"], st2)

c2.eval("updateTabIndicator('fib', 0, 0)")
st3 = json.loads(c2.eval("JSON.stringify({state:_els['tabProg_fib'].dataset.state, disp:_els['tabProg_fib'].style.display})"))
check("tab hidden when no total", st3["state"] == "empty" and st3["disp"] == "none", st3)

# real answer flow: saveAnswers -> gamificationOnAnswer -> toast + debounce
before = c2.eval("bodyCountByClass('gam-xp-toast')")
c2.eval(f"ProgressStore.saveAnswers('{pid}','mcq',3,{{chosen:1,correct:true}})")
after = c2.eval("bodyCountByClass('gam-xp-toast')")
check("XP toast on real answer", after == before + 1, (before, after))
c2.eval(f"ProgressStore.saveAnswers('{pid}','flashcards','progress',{{index:1,done:1}})")
after2 = c2.eval("bodyCountByClass('gam-xp-toast')")
check("no XP toast for flashcards", after2 == after, (after, after2))
c2.eval(f"ProgressStore.saveAnswers('{pid}','mcq',7,{{oi:1,correct:false}})")
after3 = c2.eval("bodyCountByClass('gam-xp-toast')")
check("no XP toast for wrong answers", after3 == after2, (after2, after3))
c2.eval("runTimers()")  # debounce check must not crash
check("debounced stats check runs clean", True)

# celebration on full completion
c2.eval(f"""
var t = window.SECTION_TOTALS['{pid}'];
Object.keys(t).forEach(function(k){{ if (k !== 'flashcards' && t[k] > 0) ProgressStore.save('{pid}', k, t[k], t[k]); }});
_gamHudPageId = '{pid}';
_gamMaybeCelebrateTopic();
""")
cel = json.loads(c2.eval(f"""JSON.stringify({{
  overlays: bodyCountByClass('gam-celeb-overlay'),
  confetti: bodyCountByClass('gam-confetti'),
  flag: localStorage.getItem('gcse_topic_celebrated_{pid}'),
}})"""))
check("celebration overlay shown once", cel["overlays"] == 1, cel)
check("confetti burst fired", cel["confetti"] == 44, cel)
check("celebrated flag set", cel["flag"] == "1", cel)
c2.eval("_gamMaybeCelebrateTopic()")
check("second celebration blocked by flag", c2.eval("bodyCountByClass('gam-celeb-overlay')") == 1)

# reset clears flag + progress
c2.eval(f"ProgressStore.clearPage('{pid}')")
res = json.loads(c2.eval(f"""JSON.stringify({{
  flag: localStorage.getItem('gcse_topic_celebrated_{pid}'),
  keys: Object.keys(localStorage).filter(function(k){{ return k.indexOf('geo_progress_{pid}') === 0; }}).length,
}})"""))
check("clearPage removes progress + celebration flag", res == {"flag": None, "keys": 0}, res)

# ── redo-wrong-answers + correctness shapes (real buildMCQ against fake data) ──
c2.eval("""
var mcqData = [
  { q: 'q0', opts: ['x','y'], ans: 0 },
  { q: 'q1', opts: ['x','y'], ans: 1 },
  { q: 'q2', opts: ['x','y'], ans: 0 },
];
var tfData = [
  { statement: 's0', explanation: 'e0', answer: true },
  { statement: 's1', explanation: 'e1', answer: false },
];
document.body.appendChild(__mkel('mcqWrap'));
document.body.appendChild(__mkel('tfWrap'));
__mkel('mcqScore'); __mkel('mcqTotal'); __mkel('tfScore'); __mkel('tfTotal');
""")
# mixed legacy + new answer formats: q0 legacy-correct, q1 legacy-wrong, q2 new-format-wrong
c2.eval(f"""
ProgressStore.setAnswersBulk('{pid}', 'mcq', {{ 0: 0, 1: 0, 2: {{ oi: 1, correct: false }} }});
ProgressStore.setAnswersBulk('{pid}', 'tf',  {{ 0: true, 1: {{ val: true, correct: false }} }});
""")
wk = json.loads(c2.eval("JSON.stringify([_wrongAnswerKeys('mcq'), _wrongAnswerKeys('tf')])"))
check("wrong-key detection across old+new formats", wk == [["1", "2"], ["1"]], wk)

c2.eval("mcqScore = 0; mcqTotal = 0; buildMCQ();")
built = json.loads(c2.eval("JSON.stringify({ total: mcqTotal, score: mcqScore })"))
check("buildMCQ restores mixed-format answers (3 answered, 1 right)", built == {"total": 3, "score": 1}, built)
# mastery model: the stored summary counts CORRECT answers, not attempts
mast = json.loads(c2.eval(f"JSON.stringify(ProgressStore.get('{pid}', 'mcq'))"))
check("summary migrated to mastery counting (done=1 of 3)", mast["done"] == 1 and mast["total"] == 3, mast)

c2.eval("redoWrongAnswers('mcq')")
redo = json.loads(c2.eval(f"""JSON.stringify({{
  keys: Object.keys(ProgressStore.getAnswers('{pid}', 'mcq') || {{}}),
  summary: ProgressStore.get('{pid}', 'mcq'),
  total: mcqTotal, score: mcqScore,
}})"""))
check("redo clears only the wrong answers", redo["keys"] == ["0"], redo)
check("redo recounts + persists summary (1/3)", redo["summary"]["done"] == 1 and redo["summary"]["total"] == 3 and redo["total"] == 1 and redo["score"] == 1, redo)

# ── stable question ids: 🔀 Randomise must not misalign saved answers ──
sh = json.loads(c2.eval(f"""JSON.stringify((function(){{
  mcqData = [
    {{ q: 'A', opts: ['x','y','z'], ans: 0 }},
    {{ q: 'B', opts: ['x','y','z'], ans: 1 }},
    {{ q: 'C', opts: ['x','y','z'], ans: 2 }},
  ];
  tagStableQuestionIds();
  ProgressStore.setAnswersBulk('{pid}', 'mcq', {{ 0: 0, 1: 1, 2: {{ oi: 2, correct: true }} }}); // all correct
  mcqScore = 0; mcqTotal = 0; buildMCQ();
  var before = {{ score: mcqScore, total: mcqTotal }};
  mcqData.reverse(); // what the Randomise button does
  mcqScore = 0; mcqTotal = 0;
  _els['mcqWrap'].innerHTML = ''; buildMCQ();
  var after = {{ score: mcqScore, total: mcqTotal }};
  return {{ before: before, after: after, keys: Object.keys(ProgressStore.getAnswers('{pid}', 'mcq')) }};
}})())"""))
check("answers restore correctly before shuffle (3/3)", sh["before"] == {"score": 3, "total": 3}, sh)
check("shuffle keeps every answer on its own question (3/3)", sh["after"] == {"score": 3, "total": 3}, sh)
check("storage keys stay in the original-id space", sorted(sh["keys"]) == ["0", "1", "2"], sh)

# ── guided-flow helpers: mastery completion + activity ordering ──
flow = json.loads(c2.eval(f"""JSON.stringify((function(){{
  var beforeLearn = sectionIsComplete('learn');
  ProgressStore.save('{pid}', 'learn', 6, 6);
  return {{
    beforeLearn: beforeLearn,
    afterLearn: sectionIsComplete('learn'),
    nextAfterLearn: (nextActivityAfter('learn') || {{}}).section,
    nextAfterTips: (nextActivityAfter('tips') || {{}}).section,
    nextAfterExam: nextActivityAfter('exam'),
    guestIsStudent: gcseIsStudent(),
  }};
}})())"""))
check("sectionIsComplete uses true totals (learn 0/6 -> 6/6)", flow["beforeLearn"] is False and flow["afterLearn"] is True, flow)
check("activity order: learn -> mcq, tips -> flashcards, exam -> end",
      flow["nextAfterLearn"] == "mcq" and flow["nextAfterTips"] == "flashcards" and flow["nextAfterExam"] is None, flow)
check("guests/teachers are not gated", flow["guestIsStudent"] is False, flow)
c2.eval("localStorage.setItem('gcse_session_v1', JSON.stringify({access_token:'t', role:'student', username:'s'}))")
check("student session detected for gating", c2.eval("gcseIsStudent()") is True)
c2.eval("localStorage.removeItem('gcse_session_v1')")

# ── teacher-configurable flow settings ──
fs = json.loads(c2.eval("JSON.stringify({ s: _flowSettings, pre: _flowPreMs(), post: _flowPostMs() })"))
check("flow defaults: open nav, focus on, 10s/10s",
      fs["s"] == {"activity_order": "open", "focus_mode": True, "pre_seconds": 10, "post_seconds": 10}
      and fs["pre"] == 10000 and fs["post"] == 10000, fs)
rr = json.loads(c2.eval("""JSON.stringify((function(){
  var el = makeEl('div');
  el.dataset.gcseShownAt = String(Date.now() - 4000);
  var withPre = _focusReadRemaining(el);
  _flowSettings.pre_seconds = 0;
  var noPre = _focusReadRemaining(el);
  _flowSettings.pre_seconds = 10;
  el.dataset.gcseDoneAt = String(Date.now() - 3000);
  _flowSettings.post_seconds = 30;
  var post30 = _focusCooldownRemaining(el);
  _flowSettings.post_seconds = 10;
  return { withPre: withPre, noPre: noPre, post30: post30 };
})())"""))
check("reading timer counts down from teacher's pre_seconds", 5500 < rr["withPre"] <= 6000, rr)
check("pre_seconds 0 disables the reading gate", rr["noPre"] == 0, rr)
check("cooldown follows teacher's post_seconds", 26500 < rr["post30"] <= 27000, rr)
cd0 = json.loads(c2.eval("""JSON.stringify((function(){
  _flowSettings.post_seconds = 0;
  var b = makeEl('button'); b.disabled = false;
  _applyButtonCooldown(b, 'ready', 'Round 2');
  _flowSettings.post_seconds = 10;
  return { disabled: b.disabled };
})())"""))
check("post_seconds 0 disables button cooldowns", cd0["disabled"] is False, cd0)

# ── cross-device hydration: server answer-log merge (local wins per question) ──
pid2 = "1-2-business-planning"
c2.eval(f"""
ProgressStore.setAnswersBulk('{pid2}', 'mcq', {{ 5: {{ oi: 1, correct: false }} }});
var hydChanged = _gcseMergeServerAnswers('{pid2}', [
  {{ section: 'mcq', question_id: '0', answer: {{ oi: 1, correct: false }}, answered_at: 'a' }},
  {{ section: 'mcq', question_id: '0', answer: {{ oi: 0, correct: true }},  answered_at: 'b' }},
  {{ section: 'mcq', question_id: '5', answer: {{ oi: 2, correct: true }},  answered_at: 'c' }},
  {{ section: 'tf',  question_id: '1', answer: {{ val: false, correct: true }}, answered_at: 'd' }},
]);
""")
hyd = json.loads(c2.eval(f"""JSON.stringify({{
  changed: hydChanged,
  mcq: ProgressStore.getAnswers('{pid2}', 'mcq'),
  tf: ProgressStore.getAnswers('{pid2}', 'tf'),
}})"""))
check("hydration merges new server answers", hyd["changed"] is True and hyd["tf"] == {"1": {"val": False, "correct": True}}, hyd)
check("hydration: latest server event wins per question", hyd["mcq"]["0"] == {"oi": 0, "correct": True}, hyd)
check("hydration: local answer beats server for same question", hyd["mcq"]["5"] == {"oi": 1, "correct": False}, hyd)

c2.eval(f"ProgressStore.clearPage('{pid2}')")
tomb = c2.eval(f"localStorage.getItem('gcse_page_reset_{pid2}') !== null")
check("page reset writes hydration tombstone", tomb is True)

# ── home-page server merge (display-only) ──
sm = json.loads(c1.eval("""JSON.stringify((function(){
  _gamServerProgress = { '1-1-role-of-business-enterprise': { mcq: { done: 12, total: 12 } },
                         '5-4-break-even': { tf: { done: 4, total: 12 } } };
  var d = _gamProgressData();
  return { mcq: d['1-1-role-of-business-enterprise'].mcq, learn: d['1-1-role-of-business-enterprise'].learn, other: d['5-4-break-even'].tf };
})())"""))
check("home merge: server-ahead section adopted", sm["mcq"]["done"] == 12, sm)
check("home merge: local-only sections kept", sm["learn"]["done"] == 6, sm)
check("home merge: server-only pages appear", sm["other"]["done"] == 4, sm)

# ── activity deep links (#mcq / #matching, with aliases) ──
dl = json.loads(c2.eval("""JSON.stringify((function(){
  __mkel('tab-mcq'); __mkel('tab-matching');
  location.hash = '#match';
  var alias = activityIdFromHash();
  location.hash = '#MCQ';
  var direct = activityIdFromHash();
  location.hash = '#bogus';
  var bogus = activityIdFromHash();
  location.hash = '#matching';
  applyHashActivity();
  return { alias: alias, direct: direct, bogus: bogus,
           opened: _els['tab-matching'].classList.contains('active') };
})())"""))
check("hash aliases resolve (#match -> matching, case-insensitive)", dl["alias"] == "matching" and dl["direct"] == "mcq", dl)
check("unknown hashes are ignored", dl["bogus"] is None, dl)
check("applyHashActivity opens the tab from the URL", dl["opened"] is True, dl)
sw = json.loads(c2.eval("""JSON.stringify((function(){
  location.hash = '';
  switchTab('mcq', null);
  return { hash: location.hash, active: _els['tab-mcq'].classList.contains('active') };
})())"""))
check("switchTab writes the activity into the URL", sw == {"hash": "#mcq", "active": True}, sw)

# unified site nav injection (topic pages)
c2.eval("__mkqs('header')")
c2.eval("initSiteNav()")
nav = json.loads(c2.eval("""JSON.stringify((function(){
  var header = _qsel['header'];
  var nav = header.children[0] || null;
  return {
    isNav: !!nav && nav.id === 'siteNav',
    html: nav ? nav.innerHTML.slice(0, 300) : '',
    extraChildren: nav ? nav.children.length : 0,
    bodyFlag: document.body.classList.contains('has-site-nav'),
  };
})())"""))
check("site nav injected first in header", nav["isNav"], nav)
check("site nav links All Topics + My Progress", "index.html" in nav["html"] and "dashboard.html" in nav["html"], nav)
check("site nav received sound toggle", nav["extraChildren"] == 1, nav)
check("legacy home-link hidden via body class", nav["bodyFlag"], nav)

print()
print(f"{passed} passed, {failed} failed")
sys.exit(1 if failed else 0)
