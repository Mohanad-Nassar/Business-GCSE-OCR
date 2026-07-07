#!/usr/bin/env python3
"""Scaffold the full page structure for a new subject, with content deferred.

Generates subjects/<slug>/subject.json (the manifest) and one topic HTML
page per entry in its topic tree, using the exact same page shell as the
Business topic pages (same tab bar, same 9 activity panels, same shared-JS
includes) so the pages look and navigate identically to a real subject —
but every page is marked "noQuestions": true and carries a single "coming
soon" Key Learning card instead of real content.

Why "noQuestions" (not empty-but-real question arrays): tools/build_
question_bank.py's question_pages() filters out any page with noQuestions
set BEFORE it ever opens the file (build_question_bank.py:377) — so these
pages are completely inert to the pipeline: no parsing attempted, nothing
written to bank_questions, zero risk of placeholder junk ever reaching
Daily Revise, tasks, or worksheets. The moment real content is ready for a
page, remove its "noQuestions": true from subject.json, fill in that page's
data arrays (topics/mcqData/tfData/fibData/matchData/miscData/examTips/
flashcards/examQuestions — see any subjects/business/*.html for the exact
shape each array needs), and run `python tools/build_question_bank.py
--upload`. That's the entire sync step — same command, same pipeline, same
one-command sync story as Business (see SETUP.md "Keeping content in
sync"). No code changes are needed to bring a page online.

Usage:
    python tools/scaffold_placeholder_subject.py --subject computer-science
    python tools/scaffold_placeholder_subject.py --subject economics
    python tools/scaffold_placeholder_subject.py --subject computer-science --subject economics

Safe to re-run: page files are only written if missing (never overwrites a
page that's since had real content added — re-run per subject.json instead
if you need to add a newly-introduced topic). subject.json is always
rewritten from the tree below, since it's pure structure with no content.
"""

import argparse
import json
import re
import sys
from pathlib import Path
from string import Template

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS_DIR = ROOT / "subjects"


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


# ──────────────────────────────────────────────────────────────────
# Subject definitions — header + topic tree. Economics numbers/titles are
# the user-confirmed OCR J205 list (MULTI-SUBJECT-PLAN.md); Computer
# Science is the standard OCR J277 spec structure, documented there as
# "proposed, pending passive confirmation."
# ──────────────────────────────────────────────────────────────────

SUBJECTS = {
    "computer-science": {
        "header": {
            "slug": "computer-science", "name": "GCSE Computer Science",
            "key_stage": "ks4", "level": "GCSE", "exam_board": "OCR",
            "spec_code": "J277", "exam_date": "2027-05-17",
            "colour": "#1a6b6b", "icon": "\U0001F4BB",
        },
        "units": [
            ("1", "Computer Systems", [
                "Systems Architecture",
                "Memory and Storage",
                "Computer Networks, Connections and Protocols",
                "Network Security",
                "Systems Software",
                "Ethical, Legal, Cultural and Environmental Impacts",
            ]),
            ("2", "Computational Thinking, Algorithms and Programming", [
                "Algorithms",
                "Programming Fundamentals",
                "Producing Robust Programs",
                "Boolean Logic",
                "Programming Languages and IDEs",
            ]),
        ],
    },
    "economics": {
        "header": {
            "slug": "economics", "name": "GCSE Economics",
            "key_stage": "ks4", "level": "GCSE", "exam_board": "OCR",
            "spec_code": "J205", "exam_date": "2027-05-19",
            "colour": "#2d7a4f", "icon": "\U0001F4C8",
        },
        # (title, file) pairs — files are the user's own exact filenames
        # (sentence-case, e.g. "Main_economic_groups...", not title-case),
        # given verbatim for this subject's course sidebar; kept as literal
        # strings here rather than derived, so there's zero risk of an
        # algorithmic mismatch against what the user already expects.
        "units": [
            ("1", "Introduction to Economics", [
                ("Main Economic Groups and Factors of Production", "1.1_Main_economic_groups_and_factors_of_production.html"),
                ("The Basic Economic Problem", "1.2_The_basic_economic_problem.html"),
            ]),
            ("2", "The Role of Markets and Money", [
                ("The Role of Markets", "2.1_The_role_of_markets.html"),
                ("Demand", "2.2_Demand.html"),
                ("Supply", "2.3_Supply.html"),
                ("Price", "2.4_Price.html"),
                ("Competition", "2.5_Competition.html"),
                ("Production", "2.6_Production.html"),
                ("The Labour Market", "2.7_The_labour_market.html"),
                ("The Role of Money and Financial Markets", "2.8_The_role_of_money_and_financial_markets.html"),
            ]),
            ("3", "Economic Objectives and the Role of Government", [
                ("Economic Growth", "3.1_Economic_growth.html"),
                ("Low Unemployment", "3.2_Low_unemployment.html"),
                ("Fair Distribution of Income", "3.3_Fair_distribution_of_income.html"),
                ("Price Stability", "3.4_Price_stability.html"),
                ("Fiscal Policy", "3.5_Fiscal_policy.html"),
                ("Monetary Policy", "3.6_Monetary_policy.html"),
                ("Supply-Side Policies", "3.7_Supply_side_policies.html"),
                ("Limitations of Markets", "3.8_Limitations_of_markets.html"),
            ]),
            ("4", "International Trade and the Global Economy", [
                ("Importance of International Trade", "4.1_Importance_of_international_trade.html"),
                ("Balance of Payments", "4.2_Balance_of_payments.html"),
                ("Exchange Rates", "4.3_Exchange_rates.html"),
                ("Globalisation", "4.4_Globalisation.html"),
            ]),
        ],
    },
}


def build_manifest(slug):
    spec = SUBJECTS[slug]
    groups = []
    for unit_num, unit_title, topics in spec["units"]:
        pages = []
        for i, entry in enumerate(topics, start=1):
            topic_num = f"{unit_num}.{i}"
            if isinstance(entry, tuple):
                title, file = entry  # explicit (title, file) — exact filenames given for this subject
            else:
                title = entry
                # Business's own convention: underscore-separated topic
                # number, lowercase underscore-separated words.
                file_words = re.sub(r"[^A-Za-z0-9]+", "_", title).strip("_").lower()
                file = f"{unit_num}_{i}_{file_words}.html"
            page_id = slugify(f"{topic_num} {title}")
            name = f"{topic_num} {title}"
            pages.append({
                "id": page_id, "name": name, "sub": unit_title,
                "file": file, "noQuestions": True,
            })
        groups.append({
            "id": slugify(f"{unit_num} {unit_title}"),
            "title": f"{unit_num}. {unit_title}",
            "sub": f"Unit {unit_num}",
            "colour": spec["header"]["colour"],
            "pages": pages,
        })
    return {**spec["header"], "groups": groups}


PAGE_TEMPLATE = """<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title_tag} – Interactive Study Guide</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet" />
    <link rel="stylesheet" href="/style.css" />
</head>

<body>
    <header>
        <div>
            <div class="badge">{badge}</div>
            <h1>{h1}</h1>
            <p>Interactive revision guide · Content coming soon</p>
        </div>
        <a href="/index.html" class="home-link">← \U0001F3E1 Home</a>
    </header>

    <nav class="tab-bar" id="tabBar">
        <button class="tab-btn active" onclick="switchTab('learn', this)">
            \U0001F4DA Key Learning
        </button>
        <button class="tab-btn" onclick="switchTab('mcq', this)">
            ❓ MCQ Quiz
        </button>
        <button class="tab-btn" onclick="switchTab('matching', this)">
            \U0001F517 Matching
        </button>
        <button class="tab-btn" onclick="switchTab('fib', this)">
            ✏️ Fill the Blanks
        </button>
        <button class="tab-btn" onclick="switchTab('misconceptions', this)">
            ⚠️ Misconceptions
        </button>
        <button class="tab-btn" onclick="switchTab('examtips', this)">
            \U0001F3AF Exam Tips
        </button>
        <button class="tab-btn" onclick="switchTab('flashcards', this)">
            \U0001F0CF Flashcards
        </button>
        <button class="tab-btn" onclick="switchTab('truefalse', this)">
            ✅ True / False
        </button>
        <button class="tab-btn" onclick="switchTab('exampractice', this)">
            \U0001F4DD Exam Practice
        </button>
    </nav>

    <main>
        <div class="tab-panel active" id="tab-learn">
            <h2 class="section-title">Key Learning Topics</h2>
            <p class="section-sub">Click any card to expand detailed notes.</p>
            <div class="topic-grid" id="topicGrid"></div>
        </div>

        <div class="tab-panel" id="tab-mcq">
            <h2 class="section-title">Multiple Choice Questions</h2>
            <p class="section-sub">Select an answer to reveal instant feedback.</p>
            <div class="score-bar">
                <div>
                    <div class="score-num" id="mcqScore">0</div>
                    <div style="font-size: 12px; color: var(--mid)">
                        correct answers
                    </div>
                </div>
                <div style="font-size: 13px; color: var(--mid)">
                    out of <strong id="mcqTotal">0</strong> attempted
                </div>
                <button class="reset-btn" onclick="resetMCQ()">RESET</button>
            </div>
            <div class="quiz-wrap" id="mcqWrap"></div>
        </div>

        <div class="tab-panel" id="tab-matching">
            <h2 class="section-title">Matching Activity</h2>
            <p class="section-sub">
                Click a term on the left, then click the matching definition on the
                right.
            </p>
            <div style="margin-bottom: 16px">
                <div class="score-bar">
                    <div>
                        <div class="score-num" id="matchScore">0</div>
                        <div style="font-size: 12px; color: var(--mid)">matched</div>
                    </div>
                    <div style="font-size: 13px; color: var(--mid)">
                        out of <strong id="matchTotal">0</strong>
                    </div>
                    <button class="reset-btn" onclick="resetMatch()">RESET</button>
                </div>
            </div>
            <div class="match-grid">
                <div>
                    <div class="match-label">TERMS</div>
                    <div class="match-col" id="matchLeft"></div>
                </div>
                <div>
                    <div class="match-label">DEFINITIONS</div>
                    <div class="match-col" id="matchRight"></div>
                </div>
            </div>
        </div>

        <div class="tab-panel" id="tab-fib">
            <h2 class="section-title">Fill in the Blanks</h2>
            <p class="section-sub">
                Click each dropdown and choose the correct word. Wrong answers reset —
                try again!
            </p>
            <div class="score-bar">
                <div>
                    <div class="score-num" id="fibScore">0</div>
                    <div style="font-size: 12px; color: var(--mid)">correct</div>
                </div>
                <div style="font-size: 13px; color: var(--mid)">
                    of <strong id="fibTotal">0</strong> blanks
                </div>
                <button class="reset-btn" onclick="resetFIB()">RESET</button>
            </div>
            <div class="fib-wrap" id="fibWrap"></div>
        </div>

        <div class="tab-panel" id="tab-misconceptions">
            <h2 class="section-title">Common Misconceptions</h2>
            <p class="section-sub">
                What students often think — and what examiners actually want.
            </p>
            <div class="misc-list" id="miscList"></div>
        </div>

        <div class="tab-panel" id="tab-examtips">
            <h2 class="section-title">Exam Questions &amp; Tips</h2>
            <p class="section-sub">
                Most repeated question types and mark-scheme structures from real OCR
                papers.
            </p>
            <div class="tips-grid" id="tipsGrid"></div>
        </div>

        <div class="tab-panel" id="tab-flashcards">
            <h2 class="section-title">Flashcards</h2>
            <p class="section-sub">
                Test yourself! Flip the card and rate your knowledge. Review your weak
                areas at the end.
            </p>

            <div class="fc-container">
                <div class="score-bar" id="fcScoreBar" style="display: none; margin-bottom: 20px">
                    <div>
                        <div class="score-num" id="fcKnown" style="color: #2d7a4f">0</div>
                        <div style="font-size: 12px; color: var(--mid)">known</div>
                    </div>
                    <div>
                        <div class="score-num" id="fcUnknown" style="color: #c84b31">
                            0
                        </div>
                        <div style="font-size: 12px; color: var(--mid)">learning</div>
                    </div>
                    <div style="font-size: 13px; color: var(--mid)">
                        out of <strong id="fcTotalTrack">0</strong>
                    </div>
                    <button class="reset-btn" onclick="resetFlashcards()">RESET</button>
                </div>

                <div id="fcActiveArea">
                    <div class="fc-progress" id="fcProgress">Card 1 of 0</div>
                    <div class="flashcard" id="flashcard" onclick="flipCard()">
                        <div class="fc-inner">
                            <div class="fc-front">
                                <div class="fc-label">KEY TERM</div>
                                <div class="fc-term" id="fcTerm"></div>
                            </div>
                            <div class="fc-back">
                                <div class="fc-def" id="fcDef"></div>
                            </div>
                        </div>
                    </div>
                    <p class="fc-hint">\U0001F446 Click card to flip</p>

                    <div class="fc-nav" id="fcNavDefault">
                        <button class="fc-btn outline" onclick="prevCard()">
                            ← Prev
                        </button>
                        <button class="fc-btn outline" onclick="flipCard()">Flip</button>
                        <button class="fc-btn" onclick="nextCard()">Next →</button>
                    </div>

                    <div class="fc-nav" id="fcNavAssess" style="display: none; gap: 15px">
                        <button class="fc-btn outline" style="border-color: #c84b31; color: #c84b31; flex: 1"
                            onclick="markCard(false)">
                            ❌ Still Learning
                        </button>
                        <button class="fc-btn" style="background: #2d7a4f; border-color: #2d7a4f; flex: 1"
                            onclick="markCard(true)">
                            ✅ Got It
                        </button>
                    </div>
                </div>

                <div id="fcSummaryArea" style="display: none; text-align: center; padding: 40px 20px">
                    <h3>Session Complete! \U0001F389</h3>
                    <p style="margin: 15px 0">
                        You knew <strong id="fcSummaryKnown">0</strong> out of
                        <strong id="fcSummaryTotal">0</strong> cards.
                    </p>
                    <div style="
                margin-top: 25px;
                display: flex;
                gap: 15px;
                justify-content: center;
                flex-wrap: wrap;
              ">
                        <button class="fc-btn" id="btnReviewWrong" onclick="reviewWrong()"
                            style="background: #c84b31; border-color: #c84b31">
                            Review Incorrect
                        </button>
                        <button class="fc-btn outline" onclick="resetFlashcards()">
                            Practice All Again
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="tab-panel" id="tab-truefalse">
            <h2 class="section-title">True or False?</h2>
            <p class="section-sub">Test your knowledge with these statements.</p>
            <div class="score-bar">
                <div>
                    <div class="score-num" id="tfScore">0</div>
                    <div style="font-size: 12px; color: var(--mid)">correct</div>
                </div>
                <div style="font-size: 13px; color: var(--mid)">
                    of <strong id="tfTotal">0</strong> answered
                </div>
                <button class="reset-btn" onclick="resetTF()">RESET</button>
            </div>
            <div class="tf-wrap" id="tfWrap"></div>
        </div>

        <div class="tab-panel" id="tab-exampractice">
            <h2 class="section-title">Exam Practice Questions</h2>
            <p class="section-sub">
                Full exam questions with case studies. Use <strong>Hint</strong>,
                <strong>Sentence Starter</strong> and
                <strong>Submit &amp; See Mark Scheme</strong> for each question.
            </p>
            <div class="ep-list" id="epList"></div>
        </div>
    </main>

<script>
    // ══════════════════════════════════════
    //  DATA: {h1} — placeholder, content not yet written
    // ══════════════════════════════════════
    const pageMeta = {{
            id: '{page_id}',
            badge: '{badge}',
            title: '{h1}',
            subtitle: 'Interactive revision guide',
            subject: '{slug}',
        }};

    const topics = [
        {{
            title: "This topic is being written",
            tag: "Coming soon",
            content: `<p>\U0001F6A7 <strong>Content for this topic is on its way.</strong> Key Learning notes, practice questions and exam-style questions for <strong>{h1}</strong> will appear here soon.</p>`
        }}
    ];

    const mcqData = [];
    const matchData = [];
    const fibData = [];
    const fibWords = [];
    const tfData = [];
    const miscData = [];
    const examTips = [];
    const flashcards = [];
    const examQuestions = [];
</script>
    <script src="/script.js"></script>
<script src="section-totals.js"></script>
<script src="page-groups.js"></script>
<script src="/progress-shared.js"></script>
<script src="/gamification.js"></script>
<script src="/topic-guard.js"></script>
<script src="/notifications-shared.js"></script>
<script src="/onboarding-tour.js"></script>
<script src="/footer-legal.js"></script>
</body>

</html>
"""


# ──────────────────────────────────────────────────────────────────
# subjects/<slug>/index.html — the subject's landing page. Pure structure
# (title/hero copy + a renderSubjectHome() call over this subject's own
# page-groups.js), so — like subject.json — it's always regenerated in
# full rather than only-if-missing: there is no hand-authored content in
# it to clobber. Uses string.Template ($identifier substitution, not
# str.format) because the inline CSS below is full of literal `{`/`}`.
# Shares the exact same renderSubjectHome() contract as
# subjects/business/index.html (hand-written separately, since Business
# keeps its original elaborate hero/exam-prep shell) so all subjects'
# landing pages render consistently from the one shared /subject-home.js.
# ──────────────────────────────────────────────────────────────────

INDEX_TEMPLATE = Template("""<!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="$name (OCR $spec_code) revision guide — topics are being written; explore the course structure now.">
  <title>$name – Interactive Study Guide</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
    rel="stylesheet">
  <style>
    :root {
      --ink: #0f1923;
      --paper: #f5f0e8;
      --cream: #ede7d9;
      --accent: $colour;
      --gold: #d4a843;
      --teal: #1a6b6b;
      --mid: #5a6e7f;
      --border: #c9bfaa;
      --success: #2d7a4f;
      --card-bg: #fffcf6;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--paper);
      color: var(--ink);
      min-height: 100vh;
      line-height: 1.5;
    }

    .skip-link {
      position: absolute; left: 12px; top: -60px; z-index: 100;
      background: var(--ink); color: var(--paper); padding: 10px 18px;
      border-radius: 0 0 8px 8px; font-weight: 600; font-size: 14px;
      text-decoration: none; transition: top .15s;
    }
    .skip-link:focus { top: 0; }

    :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
    .hero :focus-visible { outline-color: var(--gold); }

    .hero {
      background: var(--ink); color: var(--paper);
      padding: 48px 48px 40px; position: relative; overflow: hidden;
    }
    .hero::before {
      content: ''; position: absolute; top: -80px; right: -80px;
      width: 340px; height: 340px; border-radius: 50%;
      background: var(--accent); opacity: .12;
    }
    .hero-inner { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; }
    .hero-eyebrow { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; flex-wrap: wrap; }

    .badge {
      background: var(--accent); color: #fff;
      font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px;
      padding: 4px 10px; border-radius: 3px; text-transform: uppercase;
    }
    .badge.gold { background: var(--gold); color: var(--ink); }

    .hero h1 {
      font-family: 'Playfair Display', serif; font-size: clamp(28px, 5vw, 48px);
      line-height: 1.1; margin-bottom: 14px; max-width: 720px;
    }
    .hero p { font-size: 15px; color: #c3ccd4; max-width: 600px; line-height: 1.7; }

    .hero-nav {
      position: absolute; top: 0; right: 0; z-index: 2;
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end;
    }
    .hero-nav a, .hero-nav button {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.25);
      color: var(--paper); font-family: 'DM Mono', monospace; font-size: 12px;
      letter-spacing: .06em; padding: 9px 18px; border-radius: 8px;
      text-decoration: none; cursor: pointer; transition: background .15s, border-color .15s;
    }
    .hero-nav a:hover, .hero-nav button:hover { background: rgba(255,255,255,.16); border-color: var(--gold); }

    .content { max-width: 1200px; margin: 0 auto; padding: 36px 48px 80px; }

    .coming-soon-note {
      background: var(--card-bg); border: 1.5px dashed var(--border); border-radius: 10px;
      padding: 18px 22px; margin-bottom: 40px; font-size: 14px; color: var(--mid); line-height: 1.6;
    }
    .coming-soon-note strong { color: var(--ink); }

    .section-group { margin-bottom: 36px; }
    .section-group-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .section-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .section-name {
      font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2px;
      text-transform: uppercase; color: var(--mid);
    }
    .section-line { flex: 1; height: 1px; background: var(--border); }

    .topic-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;
    }
    .topic-card {
      background: var(--card-bg); border: 1.5px solid var(--border); border-radius: 10px;
      padding: 20px 22px 18px; cursor: pointer; text-decoration: none; color: inherit;
      display: block; position: relative; overflow: hidden;
      transition: box-shadow .22s, transform .22s, border-color .22s;
    }
    .topic-card::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
      border-radius: 4px 0 0 4px; background: var(--accent); transition: width .22s;
    }
    .topic-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.13); transform: translateY(-3px); border-color: #b0a490; }
    .topic-card:hover::before { width: 6px; }
    .topic-card .code {
      font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 2px;
      color: var(--mid); margin-bottom: 8px; display: block;
    }
    .topic-card h3 { font-family: 'Playfair Display', serif; font-size: 16px; line-height: 1.35; color: var(--ink); margin-bottom: 10px; }
    .topic-card .card-meta { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--mid); font-family: 'DM Mono', monospace; }
    .topic-card:focus-visible {
      outline: 3px solid var(--accent); outline-offset: 3px;
      box-shadow: 0 8px 28px rgba(0,0,0,.13); transform: translateY(-3px);
    }
    .topic-card .arrow { margin-left: auto; font-size: 14px; color: var(--mid); transition: transform .22s, color .22s; }
    .topic-card:hover .arrow { transform: translateX(4px); color: var(--ink); }
    .topic-card.child-card { margin-left: 18px; opacity: .92; }
    .topic-card.child-card .code { opacity: .8; }

    @media (max-width: 700px) {
      .hero { padding: 32px 24px 28px; }
      .content { padding: 24px 20px 60px; }
      .topic-grid { grid-template-columns: 1fr; }
      .hero-nav { position: static; margin-bottom: 16px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation: none !important; transition: none !important; }
      .topic-card:hover, .topic-card:focus-visible { transform: none; }
    }
  </style>
</head>

<body>

  <a class="skip-link" href="#mainContent">Skip to topics</a>

  <header class="hero">
    <div class="hero-inner">
      <nav class="hero-nav" aria-label="Site">
        <a href="/index.html">🏠 <span>All Subjects</span></a>
        <a href="/dashboard.html?subject=$slug">📊 <span>My Progress</span></a>
        <span id="accountBar" style="display:inline-flex;align-items:center;gap:10px;"></span>
      </nav>
      <div class="hero-eyebrow">
        <span class="badge">$name</span>
        <span class="badge gold">🚧 Coming Soon</span>
      </div>
      <h1>$icon $name</h1>
      <p>OCR $spec_code · $unit_count units · $topic_count topics. Every topic below already has its own page and
        full interactive shell (quizzes, flashcards, exam practice) — real notes and questions are being written
        topic by topic. Explore the course structure now, or check back soon.</p>
      <div id="gamHudMount"></div>
    </div>
  </header>

  <main class="content" id="mainContent">
    <p class="coming-soon-note">🚧 <strong>$name content is on its way.</strong> This subject's full topic tree is
      live and navigable, but Key Learning notes, quizzes and exam practice for each topic are still being written —
      the same one-command sync used for every other subject on this site will bring each page online.</p>
    <div id="topicsMount"></div>
  </main>

  <script>
    (function gcseHomeAuthGuard() {
      const GCSE_SESSION_KEY = 'gcse_session_v1';
      let session;
      try { session = JSON.parse(localStorage.getItem(GCSE_SESSION_KEY) || 'null'); } catch (e) { session = null; }
      if (!session || !session.access_token) {
        location.replace('/login.html?redirect=' + encodeURIComponent(location.pathname));
      }
    })();
  </script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
  <script src="page-groups.js"></script>
  <script src="section-totals.js"></script>
  <script src="/subject-home.js"></script>
  <script>renderSubjectHome(document.getElementById('topicsMount'));</script>
  <script src="/progress-shared.js"></script>
  <script src="/gamification.js"></script>
  <script>
    const SUPABASE_URL = 'https://eaohjlyiotyqhvsizcpw.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhb2hqbHlpb3R5cWh2c2l6Y3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzUzMDksImV4cCI6MjA5ODc1MTMwOX0.lHF4OUiTT3G_fzlXvXI_4QMu48o6eEnq0hWw6K1uBAk';
    const GCSE_SESSION_KEY = 'gcse_session_v1';

    async function gcseHomeInitAccountBar() {
      let cached;
      try { cached = JSON.parse(localStorage.getItem(GCSE_SESSION_KEY) || 'null'); } catch (e) { cached = null; }
      if (!cached) return;

      const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window._gcseSupabaseClient = supabaseClient;
      const { data, error } = await supabaseClient.auth.setSession({
        access_token: cached.access_token, refresh_token: cached.refresh_token,
      });
      if (error || !data.session) {
        localStorage.removeItem(GCSE_SESSION_KEY);
        location.replace('/login.html?redirect=' + encodeURIComponent(location.pathname));
        return;
      }
      localStorage.setItem(GCSE_SESSION_KEY, JSON.stringify({
        access_token: data.session.access_token, refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at, role: cached.role, username: cached.username,
      }));

      const bar = document.getElementById('accountBar');
      if (!bar) return;
      bar.innerHTML = `<span style="font-size:13px;color:rgba(255,255,255,.75);">Hi, <strong>$${cached.username || 'teacher'}</strong></span>
        $${cached.role === 'teacher' ? '<a href="/teacher-dashboard.html">🧑‍🏫 <span>Teacher Dashboard</span></a>' : ''}
        <a href="/manage-account.html" id="manageAccountLink">⚙ <span>Manage Account</span></a>
        <a href="#" id="homeLogoutLink">↪ <span>Log out</span></a>`;
      document.getElementById('homeLogoutLink').addEventListener('click', async (e) => {
        e.preventDefault();
        await supabaseClient.auth.signOut();
        localStorage.removeItem(GCSE_SESSION_KEY);
        location.replace('/login.html');
      });

      if (cached.role === 'student') {
        if (typeof gamificationRefreshStreak === 'function') gamificationRefreshStreak(supabaseClient);
        if (typeof gamificationRefreshDailyReviseStats === 'function') gamificationRefreshDailyReviseStats(supabaseClient);
        if (typeof gamificationRefreshHomeFromServer === 'function') gamificationRefreshHomeFromServer(supabaseClient);
      }
    }
    gcseHomeInitAccountBar();
  </script>
<script src="/notifications-shared.js"></script>
<script src="/onboarding-tour.js"></script>
<script src="/footer-legal.js"></script>
</body>

</html>
""")


def write_index_html(slug, manifest):
    topic_count = 0
    for group in manifest["groups"]:
        for page in group["pages"]:
            topic_count += 1 + len(page.get("children", []))
    html = INDEX_TEMPLATE.substitute(
        slug=slug, name=manifest["name"], icon=manifest["icon"], colour=manifest["colour"],
        spec_code=manifest["spec_code"], unit_count=len(manifest["groups"]), topic_count=topic_count,
    )
    index_path = SUBJECTS_DIR / slug / "index.html"
    index_path.write_text(html, encoding="utf-8")
    print(f"{index_path.relative_to(ROOT)} written")


def scaffold_subject(slug, force_pages=False):
    manifest = build_manifest(slug)
    subj_dir = SUBJECTS_DIR / slug
    subj_dir.mkdir(parents=True, exist_ok=True)

    manifest_path = subj_dir / "subject.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{manifest_path.relative_to(ROOT)} written")

    written, skipped = 0, 0
    unit_title_by_group = {g["id"]: g["title"].split(". ", 1)[-1] for g in manifest["groups"]}
    for group in manifest["groups"]:
        for page in group["pages"]:
            page_path = subj_dir / page["file"]
            if page_path.exists() and not force_pages:
                skipped += 1
                continue
            badge = f"OCR {manifest['level']} {manifest['name'].replace('GCSE ', '')} — Unit {group['sub'].split(' ')[-1]}: {unit_title_by_group[group['id']]}"
            html = PAGE_TEMPLATE.format(
                title_tag=page["name"], badge=badge, h1=page["name"],
                page_id=page["id"], slug=slug,
            )
            page_path.write_text(html, encoding="utf-8")
            written += 1
    print(f"subjects/{slug}/: {written} topic page(s) written, {skipped} already existed (skipped)")

    write_index_html(slug, manifest)
    return manifest


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--subject", action="append", required=True, choices=sorted(SUBJECTS),
                    help="repeatable; which placeholder subject(s) to scaffold")
    ap.add_argument("--force-pages", action="store_true",
                    help="overwrite existing page files too (default: only fills in missing ones)")
    args = ap.parse_args(argv)
    for slug in dict.fromkeys(args.subject):
        scaffold_subject(slug, force_pages=args.force_pages)


if __name__ == "__main__":
    main()
