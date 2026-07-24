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
# Science is the owner-LOCKED 29-page sub-topic structure of
# CS-CONTENT-PLAN.md §3 (one page per J277 sub-topic; spec sections are
# groups, carried as 4-tuples whose third element is the group `sub`
# label). Filenames are explicit (title, file) pairs — dotted, given
# verbatim by the owner.
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
            ("1.1", "Systems Architecture", "Paper 1 · Computer systems", [
                ("Architecture of the CPU", "1.1.1-architecture-of-the-cpu.html"),
                ("CPU Performance", "1.1.2-cpu-performance.html"),
                ("Embedded Systems", "1.1.3-embedded-systems.html"),
            ]),
            ("1.2", "Memory and Storage", "Paper 1 · Computer systems", [
                ("Primary Storage (Memory)", "1.2.1-primary-storage-memory.html"),
                ("Secondary Storage", "1.2.2-secondary-storage.html"),
                ("Units", "1.2.3-units.html"),
                ("Data Storage: Numbers", "1.2.4-data-storage-numbers.html"),
                ("Data Storage: Characters", "1.2.5-data-storage-characters.html"),
                ("Data Storage: Images", "1.2.6-data-storage-images.html"),
                ("Data Storage: Sound", "1.2.7-data-storage-sound.html"),
                ("Compression", "1.2.8-compression.html"),
            ]),
            ("1.3", "Computer Networks, Connections and Protocols", "Paper 1 · Computer systems", [
                ("Networks and Topologies", "1.3.1-networks-and-topologies.html"),
                ("Wired and Wireless Networks, Protocols and Layers", "1.3.2-wired-and-wireless-networks-protocols-and-layers.html"),
            ]),
            ("1.4", "Network Security", "Paper 1 · Computer systems", [
                ("Threats to Computer Systems and Networks", "1.4.1-threats-to-computer-systems-and-networks.html"),
                ("Identifying and Preventing Vulnerabilities", "1.4.2-identifying-and-preventing-vulnerabilities.html"),
            ]),
            ("1.5", "Systems Software", "Paper 1 · Computer systems", [
                ("Operating Systems", "1.5.1-operating-systems.html"),
                ("Utility Software", "1.5.2-utility-software.html"),
            ]),
            ("1.6", "Impacts of Digital Technology", "Paper 1 · Computer systems", [
                ("Ethical, Legal, Cultural and Environmental Impact", "1.6.1-ethical-legal-cultural-and-environmental-impact.html"),
            ]),
            ("2.1", "Algorithms", "Paper 2 · Computational thinking", [
                ("Computational Thinking", "2.1.1-computational-thinking.html"),
                ("Designing, Creating and Refining Algorithms", "2.1.2-designing-creating-and-refining-algorithms.html"),
                ("Searching and Sorting Algorithms", "2.1.3-searching-and-sorting-algorithms.html"),
            ]),
            ("2.2", "Programming Fundamentals", "Paper 2 · Computational thinking", [
                ("Programming Fundamentals", "2.2.1-programming-fundamentals.html"),
                ("Data Types", "2.2.2-data-types.html"),
                ("Additional Programming Techniques", "2.2.3-additional-programming-techniques.html"),
            ]),
            ("2.3", "Producing Robust Programs", "Paper 2 · Computational thinking", [
                ("Defensive Design", "2.3.1-defensive-design.html"),
                ("Testing", "2.3.2-testing.html"),
            ]),
            ("2.4", "Boolean Logic", "Paper 2 · Computational thinking", [
                ("Boolean Logic", "2.4.1-boolean-logic.html"),
            ]),
            ("2.5", "Programming Languages and IDEs", "Paper 2 · Computational thinking", [
                ("Languages", "2.5.1-languages.html"),
                ("The Integrated Development Environment (IDE)", "2.5.2-the-integrated-development-environment-ide.html"),
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
    "additional-maths": {
        # OCR Level 3 FSMQ Additional Mathematics (6993) — ADDMATHS-CONTENT-PLAN.md §3.
        # 11 groups / 35 lesson pages, teaching order. Groups carried as 4-tuples whose
        # third element is the group `sub` label. Filenames are explicit dotted
        # "<group>.<lesson>-slug.html" (like CS); the page id derives from the topic
        # number + title, so id "1-3-quadratics-and-completing-the-square" ≠ its
        # dotted filename — same convention as computer-science.
        "header": {
            "slug": "additional-maths", "name": "FSMQ Additional Mathematics",
            "key_stage": "ks4", "level": "Level 3", "exam_board": "OCR",
            "spec_code": "6993", "exam_date": "2027-06-09",  # PROVISIONAL — confirm 2027 timetable
            "colour": "#5a4bc4", "icon": "\U0001F4D0",
        },
        "units": [
            ("1", "Algebra Toolkit", "Paper 1 · Additional Mathematics", [
                ("Notation, Functions and Indices", "1.1-notation-functions-and-indices.html"),
                ("Surds and Algebraic Fractions", "1.2-surds-and-algebraic-fractions.html"),
                ("Quadratics and Completing the Square", "1.3-quadratics-and-completing-the-square.html"),
                ("Linear and Quadratic Inequalities", "1.4-linear-and-quadratic-inequalities.html"),
            ]),
            ("2", "Polynomials and Equations", "Paper 1 · Additional Mathematics", [
                ("Polynomial Arithmetic and Division", "2.1-polynomial-arithmetic-and-division.html"),
                ("The Factor Theorem and Cubics", "2.2-the-factor-theorem-and-cubics.html"),
                ("Setting Up and Solving Equations", "2.3-setting-up-and-solving-equations.html"),
                ("Sequences and Recurrence Relationships", "2.4-sequences-and-recurrence-relationships.html"),
            ]),
            ("3", "Coordinate Geometry", "Paper 1 · Additional Mathematics", [
                ("Straight Lines", "3.1-straight-lines.html"),
                ("Circles, Tangents and Normals", "3.2-circles-tangents-and-normals.html"),
                ("Sketching and Plotting Graphs", "3.3-sketching-and-plotting-graphs.html"),
            ]),
            ("4", "Linear Programming", "Paper 1 · Additional Mathematics", [
                ("Inequalities in Two Variables", "4.1-inequalities-in-two-variables.html"),
                ("Constraints and Objective Functions", "4.2-constraints-and-objective-functions.html"),
                ("Solving LP Problems Graphically", "4.3-solving-lp-problems-graphically.html"),
            ]),
            ("5", "Trigonometry", "Paper 1 · Additional Mathematics", [
                ("Trig Ratios for Any Angle", "5.1-trig-ratios-for-any-angle.html"),
                ("Sine and Cosine Rules", "5.2-sine-and-cosine-rules.html"),
                ("Trigonometric Identities", "5.3-trigonometric-identities.html"),
                ("Trigonometric Equations", "5.4-trigonometric-equations.html"),
                ("Pythagoras and Trig in 2D and 3D", "5.5-pythagoras-and-trig-in-2d-and-3d.html"),
            ]),
            ("6", "Enumeration and Probability", "Paper 1 · Additional Mathematics", [
                ("Counting, Permutations and Combinations", "6.1-counting-permutations-and-combinations.html"),
                ("The Binomial Expansion", "6.2-the-binomial-expansion.html"),
                ("The Binomial Distribution", "6.3-the-binomial-distribution.html"),
                ("Tree, Two-Way and Venn Diagrams", "6.4-tree-two-way-and-venn-diagrams.html"),
            ]),
            ("7", "Exponentials and Logarithms", "Paper 1 · Additional Mathematics", [
                ("Exponential Functions", "7.1-exponential-functions.html"),
                ("Logarithms and the Log Laws", "7.2-logarithms-and-the-log-laws.html"),
                ("Solving Exponential Equations", "7.3-solving-exponential-equations.html"),
                ("Reduction to Linear Form", "7.4-reduction-to-linear-form.html"),
            ]),
            ("8", "Differentiation", "Paper 1 · Additional Mathematics", [
                ("The Gradient Function", "8.1-the-gradient-function.html"),
                ("Tangents and Normals", "8.2-tangents-and-normals.html"),
                ("Stationary Points and Curve Sketching", "8.3-stationary-points-and-curve-sketching.html"),
            ]),
            ("9", "Integration", "Paper 1 · Additional Mathematics", [
                ("Indefinite Integration", "9.1-indefinite-integration.html"),
                ("Definite Integrals and Areas", "9.2-definite-integrals-and-areas.html"),
                ("Numerical Areas and the Trapezium Rule", "9.3-numerical-areas-and-the-trapezium-rule.html"),
            ]),
            ("10", "Kinematics and Numerical Methods", "Paper 1 · Additional Mathematics", [
                ("Kinematics", "10.1-kinematics.html"),
                ("Solving Equations Numerically", "10.2-solving-equations-numerically.html"),
            ]),
            ("11", "Exam Preparation", "Paper 1 · Additional Mathematics", [
                ("Command Words and Detailed Reasoning", "11.1-command-words-and-detailed-reasoning.html"),
                ("Synoptic and Unstructured Problems", "11.2-synoptic-and-unstructured-problems.html"),
            ]),
        ],
    },
    "spanish": {
        # AQA GCSE Spanish (8692) — SPANISH-CONTENT-PLAN.md §3. 12 groups / ~34 pages.
        # Group ids are P/G/1..9/X (Phonics, Grammar Toolkit, 9 theme-topics, Exam Skills);
        # explicit dotted "<group>.<lesson>-slug.html" filenames like CS/Add Maths.
        # ⚠ Running the scaffolder writes PLACEHOLDER pages — it will overwrite the
        # hand-built pilot 2.1-food-drink-and-a-balanced-diet.html, so preserve/re-apply
        # that page after any scaffold (SPANISH-CONTENT-PLAN §9 ES-0).
        "header": {
            "slug": "spanish", "name": "GCSE Spanish",
            "key_stage": "ks4", "level": "GCSE", "exam_board": "AQA",
            "spec_code": "8692", "exam_date": "2026-06-08",
            "colour": "#d6455d", "icon": "\U0001F1EA\U0001F1F8",
        },
        "units": [
            ("P", "Phonics & Sound-Symbol", "Phonics", [
                ("Spanish Sounds and the Alphabet", "P.1-spanish-sounds-and-the-alphabet.html"),
                ("Tricky Letters: ll, ch, ñ, j, h, r, v", "P.2-tricky-letters-ll-ch-n-j-h-r-v.html"),
            ]),
            ("G", "Grammar Toolkit", "Grammar Toolkit", [
                ("Nouns, Articles and Gender", "G.1-nouns-articles-and-gender.html"),
                ("Adjectives and Agreement", "G.2-adjectives-and-agreement.html"),
                ("Present Tense and Key Irregulars", "G.3-present-tense-and-key-irregulars.html"),
                ("Talking About the Past", "G.4-talking-about-the-past.html"),
                ("Future, Conditional and More Tenses", "G.5-future-conditional-and-more-tenses.html"),
                ("Pronouns, Negatives and Connectors", "G.6-pronouns-negatives-and-connectors.html"),
            ]),
            ("1", "Identity and Relationships", "Theme 1 · People and lifestyle", [
                ("Me, My Family and Friends", "1.1-me-my-family-and-friends.html"),
                ("Relationships and Role Models", "1.2-relationships-and-role-models.html"),
            ]),
            ("2", "Healthy Living & Lifestyle", "Theme 1 · People and lifestyle", [
                ("Food, Drink and a Balanced Diet", "2.1-food-drink-and-a-balanced-diet.html"),
                ("Exercise, Health Problems and Advice", "2.2-exercise-health-problems-and-advice.html"),
            ]),
            ("3", "Education and Work", "Theme 1 · People and lifestyle", [
                ("School Life and Subjects", "3.1-school-life-and-subjects.html"),
                ("Future Study, Jobs and Ambitions", "3.2-future-study-jobs-and-ambitions.html"),
            ]),
            ("4", "Free-Time Activities", "Theme 2 · Popular culture", [
                ("Sport, Hobbies and Going Out", "4.1-sport-hobbies-and-going-out.html"),
                ("Music, TV, Film and Reading", "4.2-music-tv-film-and-reading.html"),
            ]),
            ("5", "Customs, Festivals and Celebrations", "Theme 2 · Popular culture", [
                ("Food Customs and Daily Life", "5.1-food-customs-and-daily-life.html"),
                ("Festivals and Traditions", "5.2-festivals-and-traditions.html"),
            ]),
            ("6", "Celebrity Culture", "Theme 2 · Popular culture", [
                ("Celebrities, Influencers and Fame", "6.1-celebrities-influencers-and-fame.html"),
            ]),
            ("7", "Travel and Tourism", "Theme 3 · Communication and the world", [
                ("Holidays, Transport and Places", "7.1-holidays-transport-and-places.html"),
                ("My Region and Places of Interest", "7.2-my-region-and-places-of-interest.html"),
            ]),
            ("8", "Media and Technology", "Theme 3 · Communication and the world", [
                ("Technology in Everyday Life", "8.1-technology-in-everyday-life.html"),
                ("Social Media and Online Safety", "8.2-social-media-and-online-safety.html"),
            ]),
            ("9", "Environment and Where People Live", "Theme 3 · Communication and the world", [
                ("My Town, Home and Local Area", "9.1-my-town-home-and-local-area.html"),
                ("The Environment and Global Issues", "9.2-the-environment-and-global-issues.html"),
            ]),
            ("X", "Exam Skills", "Exam Skills", [
                ("Listening and Dictation", "X.1-listening-and-dictation.html"),
                ("Reading and Translation into English", "X.2-reading-and-translation-into-english.html"),
                ("Speaking: Read-Aloud and Photo Card", "X.3-speaking-read-aloud-and-photo-card.html"),
                ("Writing and Translation into Spanish", "X.4-writing-and-translation-into-spanish.html"),
            ]),
        ],
    },
    "sport-studies": {
        # OCR Cambridge Nationals Sport Studies L1/L2 (J829), Unit R184 only —
        # SPORT-CONTENT-PLAN.md §3/§4. R184 is the sole externally-assessed unit
        # (70 marks, 1h15, Sections A/B/C); R185/R186/R187 are NEA coursework and
        # out of scope. FINEST-GRAIN map (owner directive): one page per spec
        # sub-topic AND per sub-sub-topic — 6 groups / 31 pages. Pages are
        # 3-tuples (spec-number, title, file) so 2.4.1 / 2.5.6 / 5.2.3 keep their
        # real J829 numbering. FIRST fully copyright-free subject: zero verbatim,
        # even in examQuestions. Reuses the CS self-mark machinery (exam-widgets.js);
        # no new engineering.
        "header": {
            "slug": "sport-studies", "name": "Sport Studies",
            "key_stage": "ks4", "level": "Level 1/Level 2", "exam_board": "OCR",
            "spec_code": "J829", "exam_date": "2027-05-11",  # OCR J829/R184 exam: Tue 11 May 2027 PM
            "colour": "#16a34a", "icon": "\U0001F3C5",
        },
        "units": [
            ("1", "Issues Affecting Participation", "R184 · Contemporary Issues in Sport", [
                ("1.1", "User Groups", "1.1-user-groups.html"),
                ("1.2", "Barriers to Participation", "1.2-barriers-to-participation.html"),
                ("1.3", "Solutions to Barriers", "1.3-solutions-to-barriers.html"),
                ("1.4", "Popularity of Sport in the UK", "1.4-popularity-of-sport-in-the-uk.html"),
                ("1.5", "Emerging and New Sports", "1.5-emerging-and-new-sports.html"),
            ]),
            ("2", "The Role of Sport in Promoting Values", "R184 · Contemporary Issues in Sport", [
                ("2.1", "Values Promoted Through Sport", "2.1-values-promoted-through-sport.html"),
                ("2.2", "The Olympic & Paralympic Movement", "2.2-the-olympic-and-paralympic-movement.html"),
                ("2.3", "Initiatives and Campaigns", "2.3-initiatives-and-campaigns.html"),
                ("2.4.1", "Etiquette of Performers", "2.4.1-etiquette-of-performers.html"),
                ("2.4.2", "Etiquette of Spectators", "2.4.2-etiquette-of-spectators.html"),
                ("2.5.1", "Why Performers Use PEDs", "2.5.1-why-performers-use-peds.html"),
                ("2.5.2", "Why Performers Should Not Use PEDs", "2.5.2-why-performers-should-not-use-peds.html"),
                ("2.5.3", "The Role of WADA", "2.5.3-the-role-of-wada.html"),
                ("2.5.4", "Sanctions Against PEDs", "2.5.4-sanctions-against-peds.html"),
                ("2.5.5", "Education Against PEDs", "2.5.5-education-against-peds.html"),
                ("2.5.6", "The Impact of PEDs on Sport", "2.5.6-the-impact-of-peds-on-sport.html"),
            ]),
            ("3", "Hosting a Major Sporting Event", "R184 · Contemporary Issues in Sport", [
                ("3.1.1", "Types of Major Events", "3.1.1-types-of-major-events.html"),
                ("3.1.2", "Participants and Spectators", "3.1.2-participants-and-spectators.html"),
                ("3.2", "Pre-Event Aspects", "3.2-pre-event-aspects.html"),
                ("3.3.1", "During the Event", "3.3.1-during-the-event.html"),
                ("3.3.2", "Post-Event and Legacy", "3.3.2-post-event-and-legacy.html"),
            ]),
            ("4", "National Governing Bodies", "R184 · Contemporary Issues in Sport", [
                ("4.1", "The Role of NGBs", "4.1-the-role-of-ngbs.html"),
            ]),
            ("5", "Technology in Sport", "R184 · Contemporary Issues in Sport", [
                ("5.1.1", "Technology to Enhance Performance", "5.1.1-technology-to-enhance-performance.html"),
                ("5.1.2", "Technology to Increase Safety", "5.1.2-technology-to-increase-safety.html"),
                ("5.1.3", "Technology and Officiating", "5.1.3-technology-and-officiating.html"),
                ("5.1.4", "Technology to Enhance Spectatorship", "5.1.4-technology-to-enhance-spectatorship.html"),
                ("5.2.1", "Positive Effects of Technology", "5.2.1-positive-effects-of-technology.html"),
                ("5.2.2", "Negative Effects of Technology", "5.2.2-negative-effects-of-technology.html"),
                ("5.2.3", "Technology and the Spectator Experience", "5.2.3-technology-and-the-spectator-experience.html"),
            ]),
            ("6", "Exam Preparation", "R184 · Contemporary Issues in Sport", [
                ("6.1", "Command Words and Exam Sections", "6.1-command-words-and-exam-sections.html"),
                ("6.2", "Extended-Response Technique", "6.2-extended-response-technique.html"),
            ]),
        ],
    },
}


def build_manifest(slug):
    spec = SUBJECTS[slug]
    groups = []
    for unit in spec["units"]:
        # 3-tuple = (num, title, topics) with "Unit N" sub; 4-tuple adds an
        # explicit group `sub` label (CS uses paper labels per CS-CONTENT-PLAN §3).
        if len(unit) == 4:
            unit_num, unit_title, group_sub, topics = unit
        else:
            unit_num, unit_title, topics = unit
            group_sub = f"Unit {unit_num}"
        pages = []
        for i, entry in enumerate(topics, start=1):
            if isinstance(entry, tuple) and len(entry) == 3:
                # explicit (number, title, file) — the page's spec number is
                # given verbatim (e.g. "2.4.1", "2.5.6"), NOT derived from the
                # unit + index, so sub-sub-topic pages keep their real spec
                # numbering. Sport Studies (J829 R184) uses this for every page.
                topic_num, title, file = entry
            elif isinstance(entry, tuple):
                topic_num = f"{unit_num}.{i}"
                title, file = entry  # explicit (title, file) — exact filenames given for this subject
            else:
                topic_num = f"{unit_num}.{i}"
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
            # Dotted section numbers ("1.1") read wrong with the legacy
            # "N. Title" format — they render as "1.1 Title" instead.
            "title": (f"{unit_num} {unit_title}" if "." in unit_num
                      else f"{unit_num}. {unit_title}"),
            "sub": group_sub,
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
</script>{mathrender_include}
    <script src="/script.js"></script>
<script src="section-totals.js"></script>
<script src="page-groups.js"></script>
<script src="/progress-shared.js"></script>
<script src="/gamification.js"></script>
<script src="/topic-guard.js"></script>
<script src="/notifications-shared.js"></script>
<script src="/onboarding-tour.js"></script>
<script src="/footer-legal.js"></script>{cslab_include}
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
        <a href="/dashboard.html?subject=$slug">📊 <span>My Progress</span></a>$mock_link
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
        location.replace('/index.html?redirect=' + encodeURIComponent(location.pathname));
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
        location.replace('/index.html?redirect=' + encodeURIComponent(location.pathname));
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
        # CS ships timed past-paper mocks (mock-exam.html, CS-CONTENT-PLAN §7.3)
        mock_link=('\n        <a href="mock-exam.html">📝 <span>Mock Exams</span></a>'
                   if slug == "computer-science" else ""),
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
            board = manifest.get("exam_board", "OCR")
            if group["sub"].startswith("Unit "):
                badge = f"{board} {manifest['level']} {manifest['name'].replace('GCSE ', '')} — Unit {group['sub'].split(' ')[-1]}: {unit_title_by_group[group['id']]}"
            else:
                # CS-style paper-labelled groups: "… — Paper 1 · 1.1 Systems Architecture"
                badge = f"{board} {manifest['level']} {manifest['name'].replace('GCSE ', '')} — {group['sub'].split(' · ')[0]} · {group['title']}"
            html = PAGE_TEMPLATE.format(
                title_tag=page["name"], badge=badge, h1=page["name"],
                page_id=page["id"], slug=slug,
                # Additional Maths pages render LaTeX via self-hosted KaTeX
                # (ADDMATHS-CONTENT-PLAN.md §8). Assets load BEFORE /script.js so
                # renderMathInElement exists when script.js's activity builders call
                # renderMathIn at DOMContentLoaded. woff2-only, all under '/vendor'
                # (zero CSP change). exam-widgets.js gives written exam questions the
                # tick-the-mark-scheme self-mark panel (shared with CS, self-contained,
                # keyed by q.format via script.js's _epUseWidget seam). Other subjects
                # get nothing (empty string).
                mathrender_include=(
                    ('\n    <link rel="stylesheet" href="/vendor/katex/katex.min.css" data-katex />'
                     '\n    <script src="/vendor/katex/katex.min.js"></script>'
                     '\n    <script src="/vendor/katex/contrib/auto-render.min.js"></script>'
                     '\n    <script src="/math-render.js"></script>'
                     '\n    <script src="/cs-lab/exam-widgets.js"></script>'
                     # Maths Practice Lab (ADM-C): injects the 10th "Practice
                     # Lab" tab where PAGE_TOOLS maps tools; deferred so it runs
                     # after script.js has built #tabBar / switchTab. Self-noops
                     # on pages with no mapped tools. Injects its own CSS link.
                     '\n    <script src="/maths-lab/maths-lab.js" defer></script>')
                    if slug == "additional-maths" else
                    # Spanish pages get output-voice TTS (/speech.js, self-installs the
                    # 🔊 buttons + speed/voice panel + tab observer, SPANISH-CONTENT-PLAN
                    # §8.1) and the shared tick-the-mark-scheme self-mark panel. Both load
                    # BEFORE /script.js. Zero vendor bytes / no CSP change.
                    ('\n    <script src="/speech.js"></script>'
                     '\n    <script src="/cs-lab/exam-widgets.js"></script>')
                    if slug == "spanish" else
                    # Sport Studies is prose + self-marked written answers only
                    # (SPORT-CONTENT-PLAN.md §7): no KaTeX, no TTS, no Lab. It needs
                    # ONLY the shared tick-the-mark-scheme self-mark panel, loaded
                    # before /script.js so the widget exists when script.js's exam
                    # builder runs. markPoints (grouped/flat) + format:'banded' both
                    # live in exam-widgets.js.
                    ('\n    <script src="/cs-lab/exam-widgets.js"></script>')
                    if slug == "sport-studies" else ""),
                # CS pages get the Practice Lab framework + the exam-widget
                # registry (CS-CONTENT-PLAN §7/§7.3); both self-noop when a
                # page has nothing for them. Widgets load as normal scripts so
                # they exist before script.js's DOMContentLoaded exam render.
                cslab_include=('\n<script src="/cs-lab/exam-widgets.js"></script>'
                               '\n<script src="/cs-lab/exam-widgets-grids.js"></script>'
                               '\n<script src="/cs-lab/exam-widgets-code.js"></script>'
                               '\n<script src="/cs-lab/cs-lab.js" defer></script>'
                               if slug == "computer-science" else ""),
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
