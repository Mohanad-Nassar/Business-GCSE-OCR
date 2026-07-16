#!/usr/bin/env python3
"""
QUESTION BANK BUILDER (pipeline v2 — multi-subject, compat mode)

Drives from the subject manifests (subjects/*/subject.json — generated
once by tools/extract_subject_manifest.py, now the source of truth for
each subject's topic tree). For every subject it extracts the
examQuestions / mcqData / tfData / ... arrays embedded in each topic
page and emits, into subjects/<slug>/:

    question-bank.js    window.QUESTION_BANK, ids prefixed "<slug>:..."
    section-totals.js   window.SECTION_TOTALS, page-id keys prefixed
    page-groups.js      window.SUBJECT + window.PAGE_GROUPS (prefixed
                        page ids, root-absolute hrefs)

plus the cross-subject registry files at the repo root:

    subjects-index.js       window.SUBJECTS  (manifest headers)
    page-groups-all.js      window.PAGE_GROUPS_ALL  {slug: groups}
    section-totals-all.js   window.SECTION_TOTALS_ALL merged across
                            subjects (+ window.SECTION_TOTALS alias —
                            every consumer reads window.SECTION_TOTALS[pageId])

and per-subject seed SQL in supabase/bank-questions-seed/<slug>/ with a
subject_slug column. The pre-multi-subject seed files directly in
supabase/bank-questions-seed/*.sql are left untouched.

Topic HTML resolution tries subjects/<slug>/<file> first, then the repo
root — the 38 business pages still live at the root until the step-4
restructure (see MULTI-SUBJECT-PLAN.md), so the script works both
before and after the move.

Usage (run from the repo root):

    python tools/build_question_bank.py [--subject slug]... [--legacy]
                                        [--upload] [--seed N]

    --subject SLUG  build only this subject (repeatable; default: all
                    subjects discovered under subjects/*/subject.json)
    --legacy        ADDITIONALLY emit today's root question-bank.js and
                    section-totals.js with unprefixed ids (business
                    only — byte-compatible with the pre-v2 output, for
                    diff verification and until the step-4 flip)
    --upload        push bank rows + the subjects header row live to
                    Supabase via PostgREST (needs SUPABASE_URL +
                    SUPABASE_SERVICE_ROLE_KEY in .env). DEFAULT IS OFF:
                    without this flag the script never touches the
                    network; run the generated seed SQL manually instead.
    --seed N        seed the RNG used to pick/shuffle FIB dropdown
                    distractors (blankOptions), for reproducible builds.

Question IDs are content-hashed (slug:pageId:source:hash of question
text), so they stay stable when questions are reordered. Editing a
question's text gives it a new id — existing tasks are safe because
each task stores a full snapshot of its questions in the database at
creation.

The topic pages contain no template interpolation (${...}) or string
concatenation inside these arrays, so a static-literal parser suffices;
the parser below raises on anything it does not understand rather than
guessing.
"""

import argparse
import json
import os
import random
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS_DIR = ROOT / "subjects"

BANNER = "// ══════════════════════════════════════════════════════════════\n"
SQL_BANNER = "-- ══════════════════════════════════════════════════════════════\n"

# ──────────────────────────────────────────────────────────────────
# LEGACY literal — the build no longer reads this (each subject's
# subject.json manifest is the source of truth). Retained ONLY so
# tools/extract_subject_manifest.py can re-run its PAGES ≡ PAGE_GROUPS
# ≡ manifest cross-check; delete alongside that check after the step-4
# restructure. The overview page 2_4_marketing_mix.html has no question
# arrays and is intentionally absent (manifest marks it noQuestions).
# ──────────────────────────────────────────────────────────────────
PAGES = [
    ("1-1-role-of-business-enterprise", "1.1 Role of Business Enterprise", "1_1_role_of_business_enterprise.html"),
    ("1-2-business-planning", "1.2 Business Planning", "1_2_business_planning.html"),
    ("1-3-business-ownership", "1.3 Business Ownership", "1_3_business_ownership.html"),
    ("1-4-business-aims-objectives", "1.4 Aims and Objectives", "1_4_business_aims_objectives.html"),
    ("1-5-stakeholders-in-business", "1.5 Stakeholders in Business", "1_5_stakeholders_in_business.html"),
    ("1-6-business-growth", "1.6 Business Growth", "1_6_business_growth.html"),
    ("2-1-role-of-marketing", "2.1 The Role of Marketing", "2_1_role_of_marketing.html"),
    ("2-2-market-research", "2.2 Market Research", "2_2_market_research.html"),
    ("2-3-market-segmentation", "2.3 Market Segmentation", "2_3_market_segmentation.html"),
    ("2-4-1-introduction-marking-mix", "2.4.1 Marketing Mix: Introduction", "2_4_1_introduction_marking_mix.html"),
    ("2-4-2-product-and-product-life", "2.4.2 Product & Product Life Cycle", "2_4_2_Product_and_The_Product_Life_Cycle.html"),
    ("2-4-3-pricing-methods", "2.4.3 Pricing Methods", "2_4_3_pricing_methods.html"),
    ("2-4-4-promotion", "2.4.4 Promotion", "2_4_4_Promotion.html"),
    ("2-4-5-place", "2.4.5 Place", "2_4_5_place.html"),
    ("2-4-6-market-data-integrated-mix", "2.4.6 Market Data & Integrated Mix", "2_4_6_market_data_integrated_mix.html"),
    ("3-1-role-of-human-resources", "3.1 Role of Human Resources", "3_1_role_of_human_resources.html"),
    ("3-2-organisational-structures", "3.2 Organisational Structures", "3_2_organisational_structures.html"),
    ("3-3-communication-in-business", "3.3 Communication in Business", "3_3_communication_in_business.html"),
    ("3-4-recruitment-and-selection", "3.4 Recruitment and Selection", "3_4_recruitment_and_selection.html"),
    ("3-5-motivation-and-retention", "3.5 Motivation and Retention", "3_5_motivation_and_retention.html"),
    ("3-6-training-and-development", "3.6 Training and Development", "3_6_training_and_development.html"),
    ("3-7-employment-law", "3.7 Employment Law", "3_7_employment_law.html"),
    ("4-1-production-processes", "4.1 Production Processes", "4_1_production_processes.html"),
    ("4-2-quality-of-goods-services", "4.2 Quality of Goods & Services", "4_2_quality_of_goods_services.html"),
    ("4-3-sales-process-customer-service", "4.3 The Sales Process", "4_3_sales_process_customer_service.html"),
    ("4-4-consumer-law", "4.4 Consumer Law", "4_4_consumer_law.html"),
    ("4-5-business-location", "4.5 Business Location", "4_5_business_location.html"),
    ("4-6-working-with-suppliers", "4.6 Working with Suppliers", "4_6_working_with_suppliers.html"),
    ("5-1-role-of-finance-function", "5.1 Role of Finance Function", "5_1_role_of_finance_function.html"),
    ("5-2-sources-of-finance", "5.2 Sources of Finance", "5_2_sources_of_finance.html"),
    ("5-3-revenue-costs-profit-loss", "5.3 Revenue, Costs, Profit", "5_3_revenue_costs_profit_loss.html"),
    ("5-4-break-even", "5.4 Break-even", "5_4_break_even.html"),
    ("5-5-cash-and-cash-flow", "5.5 Cash and Cash Flow", "5_5_cash_and_cash_flow.html"),
    ("6-1-ethical-environmental", "6.1 Ethical & Environmental", "6_1_ethical_environmental.html"),
    ("6-2-the-economic-climate", "6.2 The Economic Climate", "6_2_the_economic_climate.html"),
    ("6-3-globalisation", "6.3 Globalisation", "6_3_globalisation.html"),
    ("7-1-final", "7.1 Interdependent Nature of Business", "7_1_final.html"),
]


class JsLiteralParser:
    """Recursive-descent parser for static JS literals: objects with
    identifier or string keys, arrays, single/double/backtick strings,
    numbers, booleans, null/undefined, trailing commas, comments."""

    def __init__(self, src: str, pos: int = 0):
        self.src = src
        self.pos = pos

    def error(self, msg):
        line = self.src.count("\n", 0, self.pos) + 1
        raise ValueError(f"{msg} at position {self.pos} (line {line})")

    def skip_ws(self):
        s, n = self.src, len(self.src)
        while self.pos < n:
            c = s[self.pos]
            if c in " \t\r\n":
                self.pos += 1
            elif c == "/" and self.pos + 1 < n and s[self.pos + 1] == "/":
                nl = s.find("\n", self.pos)
                self.pos = n if nl < 0 else nl + 1
            elif c == "/" and self.pos + 1 < n and s[self.pos + 1] == "*":
                end = s.find("*/", self.pos + 2)
                if end < 0:
                    self.error("unterminated comment")
                self.pos = end + 2
            else:
                return

    def parse_value(self):
        self.skip_ws()
        c = self.src[self.pos]
        if c == "[":
            return self.parse_array()
        if c == "{":
            return self.parse_object()
        if c in "'\"":
            return self.parse_quoted(c)
        if c == "`":
            return self.parse_template()
        m = re.match(r"-?\d+(\.\d+)?([eE][+-]?\d+)?", self.src[self.pos:])
        if m:
            self.pos += m.end()
            text = m.group(0)
            return float(text) if ("." in text or "e" in text or "E" in text) else int(text)
        m = re.match(r"[A-Za-z_$][A-Za-z0-9_$]*", self.src[self.pos:])
        if m:
            word = m.group(0)
            self.pos += m.end()
            if word == "true":
                return True
            if word == "false":
                return False
            if word in ("null", "undefined"):
                return None
            self.error(f"unexpected identifier '{word}'")
        self.error(f"unexpected character {c!r}")

    def parse_array(self):
        self.pos += 1  # [
        out = []
        while True:
            self.skip_ws()
            if self.src[self.pos] == "]":
                self.pos += 1
                return out
            out.append(self.parse_value())
            self.skip_ws()
            if self.src[self.pos] == ",":
                self.pos += 1
            elif self.src[self.pos] == "]":
                self.pos += 1
                return out
            else:
                self.error("expected ',' or ']' in array")

    def parse_object(self):
        self.pos += 1  # {
        out = {}
        while True:
            self.skip_ws()
            c = self.src[self.pos]
            if c == "}":
                self.pos += 1
                return out
            if c in "'\"":
                key = self.parse_quoted(c)
            else:
                m = re.match(r"[A-Za-z_$][A-Za-z0-9_$]*", self.src[self.pos:])
                if not m:
                    self.error("expected object key")
                key = m.group(0)
                self.pos += m.end()
            self.skip_ws()
            if self.src[self.pos] != ":":
                self.error("expected ':' after object key")
            self.pos += 1
            out[key] = self.parse_value()
            self.skip_ws()
            if self.src[self.pos] == ",":
                self.pos += 1
            elif self.src[self.pos] == "}":
                self.pos += 1
                return out
            else:
                self.error("expected ',' or '}' in object")

    _ESCAPES = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f", "v": "\v", "0": "\0"}

    def _escape(self):
        c = self.src[self.pos]
        if c == "u":
            if self.src[self.pos + 1] == "{":
                end = self.src.index("}", self.pos + 2)
                cp = int(self.src[self.pos + 2:end], 16)
                self.pos = end + 1
                return chr(cp)
            cp = int(self.src[self.pos + 1:self.pos + 5], 16)
            self.pos += 5
            return chr(cp)
        if c == "x":
            cp = int(self.src[self.pos + 1:self.pos + 3], 16)
            self.pos += 3
            return chr(cp)
        self.pos += 1
        if c == "\n":  # line continuation
            return ""
        return self._ESCAPES.get(c, c)

    def parse_quoted(self, quote):
        self.pos += 1
        buf = []
        while True:
            c = self.src[self.pos]
            if c == "\\":
                self.pos += 1
                buf.append(self._escape())
            elif c == quote:
                self.pos += 1
                return "".join(buf)
            elif c == "\n":
                self.error("newline in string")
            else:
                buf.append(c)
                self.pos += 1

    def parse_template(self):
        self.pos += 1
        buf = []
        while True:
            c = self.src[self.pos]
            if c == "\\":
                self.pos += 1
                buf.append(self._escape())
            elif c == "`":
                self.pos += 1
                return "".join(buf)
            elif c == "$" and self.src[self.pos + 1] == "{":
                self.error("template interpolation not supported")
            else:
                buf.append(c)
                self.pos += 1


def extract_array(src: str, var_name: str, file: str):
    m = re.search(r"const\s+" + var_name + r"\s*=\s*\[", src)
    if not m:
        return None
    parser = JsLiteralParser(src, m.end() - 1)
    try:
        return parser.parse_array()
    except ValueError as e:
        raise SystemExit(f"ERROR parsing {var_name} in {file}: {e}")


def extract_object(src: str, var_name: str, file: str):
    """Like extract_array but for an object literal (`const X = { … }`) —
    used for EXAM_CASE_STUDIES, the per-page shared-extract map that exam
    questions reference by caseId (see script.js's _epResolveCase)."""
    m = re.search(r"const\s+" + var_name + r"\s*=\s*\{", src)
    if not m:
        return None
    parser = JsLiteralParser(src, m.end() - 1)
    try:
        return parser.parse_object()
    except ValueError as e:
        raise SystemExit(f"ERROR parsing {var_name} in {file}: {e}")


def djb2(text: str) -> str:
    h = 5381
    for ch in text:
        h = ((h * 33) + ord(ch)) & 0xFFFFFFFF
    return format(h, "08x")


def prune(d: dict) -> dict:
    return {k: v for k, v in d.items() if v is not None}


def sql_string(s: str) -> str:
    """Escape a Python string as a single-quoted Postgres text literal."""
    return "'" + str(s).replace("'", "''") + "'"


def sql_jsonb(obj) -> str:
    return sql_string(json.dumps(obj, ensure_ascii=False)) + "::jsonb"


def _load_dotenv():
    """Minimal .env loader (KEY=value per line) — no dependency needed for
    the one file this script reads. Doesn't override already-set env vars."""
    env_path = ROOT / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k = k.strip()
        if k and k not in os.environ:
            os.environ[k] = v.strip()


# ──────────────────────────────────────────────────────────────────
# Subject manifests
# ──────────────────────────────────────────────────────────────────

def discover_manifests():
    """All subjects/*/subject.json, sorted by directory name."""
    manifests = []
    for path in sorted(SUBJECTS_DIR.glob("*/subject.json")):
        m = json.loads(path.read_text(encoding="utf-8"))
        if m.get("slug") != path.parent.name:
            raise SystemExit(f"ERROR: {path} slug {m.get('slug')!r} != directory name {path.parent.name!r}")
        manifests.append(m)
    if not manifests:
        raise SystemExit("No subjects/*/subject.json found — run "
                         "tools/extract_subject_manifest.py first.")
    return manifests


def walk_pages(groups):
    """Every page node in document order (parents before children)."""
    def rec(pages):
        for p in pages:
            yield p
            yield from rec(p.get("children") or [])
    for g in groups:
        yield from rec(g["pages"])


def question_pages(manifest):
    """(page_id, page_name, file) for every question-bearing page — the
    same triple shape the old PAGES literal had. bankName (where the
    manifest carries one) overrides the display name so the question
    bank's pageName matches the pre-v2 output exactly."""
    return [(p["id"], p.get("bankName") or p["name"], p["file"])
            for p in walk_pages(manifest["groups"]) if not p.get("noQuestions")]


def resolve_page_file(slug, file):
    """subjects/<slug>/<file> once the topic pages move there (step 4);
    repo root until then."""
    cand = SUBJECTS_DIR / slug / file
    return cand if cand.exists() else ROOT / file


def subject_header(manifest):
    """The window.SUBJECT shape (camelCase for JS consumers)."""
    return {
        "slug": manifest["slug"], "name": manifest["name"],
        "colour": manifest["colour"], "icon": manifest["icon"],
        "keyStage": manifest["key_stage"], "level": manifest["level"],
        "examBoard": manifest["exam_board"], "specCode": manifest["spec_code"],
    }


def page_groups_structure(manifest):
    """The manifest's topic tree in the exact structure progress-shared.js's
    PAGE_GROUPS literal has today, but with subject-prefixed page ids and
    root-absolute hrefs (pages move under /subjects/<slug>/ in step 4)."""
    slug = manifest["slug"]

    def page_node(p):
        node = {"id": f"{slug}:{p['id']}", "name": p["name"]}
        if p.get("sub"):
            node["sub"] = p["sub"]
        node["href"] = f"/subjects/{slug}/{p['file']}"
        if p.get("children"):
            node["children"] = [page_node(c) for c in p["children"]]
        return node

    return [{"id": g["id"], "title": g["title"], "sub": g["sub"],
             "colour": g["colour"], "pages": [page_node(p) for p in g["pages"]]}
            for g in manifest["groups"]]


# ──────────────────────────────────────────────────────────────────
# Bank extraction (logic unchanged from the single-subject builder)
# ──────────────────────────────────────────────────────────────────

SOURCES = ["exam", "mcq", "tf", "learn", "misc", "tips", "fib", "match"]


def build_bank(slug, pages):
    """Parse every topic page's question arrays into the flat bank.
    Ids are UNPREFIXED here (pageId:source:hash) — prefixing is applied
    per output so one parse serves both new-mode and --legacy emission."""
    bank = []
    warnings = []
    flash_counts = {}

    for page_id, page_name, file in pages:
        full = resolve_page_file(slug, file)
        if not full.exists():
            warnings.append(f"missing file: {file}")
            continue
        src = full.read_text(encoding="utf-8")
        seen = set()

        # Flashcards aren't gradable questions, so they're not part of the
        # task-builder bank — but their count is still needed for progress
        # totals (see section-totals.js below).
        flash_counts[page_id] = len(extract_array(src, "flashcards", file) or [])

        # This page's FIB distractor word bank — used below to precompute
        # each blank's dropdown option set (see the fibData loop).
        fib_words = extract_array(src, "fibWords", file) or []

        def unique_id(source, text):
            base = f"{page_id}:{source}:{djb2(text)}"
            qid, n = base, 2
            while qid in seen:
                qid = f"{base}-{n}"
                n += 1
            seen.add(qid)
            return qid

        # Shared exam extracts (single source per extract): questions may
        # reference one by caseId instead of inlining caseStudy — resolve it
        # so the bank snapshot still carries the full extract text.
        case_studies = extract_object(src, "EXAM_CASE_STUDIES", file) or {}

        def resolve_case(q):
            cid = q.get("caseId")
            if cid:
                return case_studies.get(cid)
            return q.get("caseStudy")

        for q in extract_array(src, "examQuestions", file) or []:
            if not q or not q.get("question"):
                continue
            is_mcq = q.get("type") == "mcq"
            bank.append(prune({
                "id": unique_id("exam", q["question"]),
                "pageId": page_id, "pageName": page_name,
                "source": "exam",
                # 'written' and 'extended' both need free-text answers + manual marking
                "type": "mcq" if is_mcq else "written",
                "marks": q.get("marks") or 1,
                "num": q.get("num") or None,
                "question": q["question"],
                "options": q.get("options") if is_mcq else None,
                "caseStudy": resolve_case(q) or None,
                "hint": q.get("hint") or None,
                "starter": q.get("starter") or None,
                "key": prune({
                    "answer": q.get("answer") if is_mcq else None,
                    "markScheme": q.get("markScheme") or "",
                    "modelAnswer": q.get("modelAnswer") or "",
                }),
            }))

        for q in extract_array(src, "mcqData", file) or []:
            if not q or not q.get("q"):
                continue
            bank.append(prune({
                "id": unique_id("mcq", q["q"]),
                "pageId": page_id, "pageName": page_name,
                "source": "mcq", "type": "mcq", "marks": 1,
                "question": q["q"],
                "options": q.get("opts") or [],
                "key": {"answer": q.get("ans"), "explain": q.get("explain") or ""},
            }))

        for q in extract_array(src, "tfData", file) or []:
            if not q or not q.get("statement"):
                continue
            bank.append(prune({
                "id": unique_id("tf", q["statement"]),
                "pageId": page_id, "pageName": page_name,
                "source": "tf", "type": "tf", "marks": 1,
                "question": q["statement"],
                "key": {"answer": q.get("answer") is True, "explain": q.get("explanation") or ""},
            }))

        # Key Learning cards, Misconceptions and Exam Tips all carry an
        # embedded MCQ "read check". The card content is included as
        # `reading` (HTML) because the questions refer to "this card".
        def add_read_check(source, item, reading_html, title):
            rc = item.get("readCheck")
            if not rc or not rc.get("q") or not isinstance(rc.get("opts"), list):
                return
            bank.append(prune({
                "id": unique_id(source, rc["q"]),
                "pageId": page_id, "pageName": page_name,
                "source": source, "type": "mcq", "marks": 1,
                "readingTitle": title or None,
                "reading": reading_html or None,
                "question": rc["q"],
                "options": rc["opts"],
                "key": {"answer": rc.get("ans"), "explain": rc.get("explain") or ""},
            }))

        for item in extract_array(src, "topics", file) or []:
            if isinstance(item, dict):
                add_read_check("learn", item, item.get("content"), item.get("title"))

        for item in extract_array(src, "miscData", file) or []:
            if isinstance(item, dict):
                reading = ""
                if item.get("wrong"):
                    reading += "<p><strong>❌ Common misconception:</strong> " + item["wrong"] + "</p>"
                if item.get("correct"):
                    reading += "<p><strong>✅ The correct idea:</strong> " + item["correct"] + "</p>"
                add_read_check("misc", item, reading, "Misconception check")

        for item in extract_array(src, "examTips", file) or []:
            if isinstance(item, dict):
                title = " — ".join(x for x in [item.get("type"), item.get("title")] if x)
                add_read_check("tips", item, item.get("content"), title or "Exam tip")

        # Fill-in-the-blanks: one question per item, one mark per blank,
        # auto-marked blank-by-blank (case/space-insensitive).
        #
        # blankOptions precomputes each blank's dropdown choices (the correct
        # word + up to 3 distractors from this page's fibWords, shuffled) —
        # the SAME algorithm the topic page's own dropdown mode uses
        # (script.js's buildFIB) — but computed once here, at generation
        # time, while we still have the real answer, specifically so the
        # unlabelled option SET (never which one is correct) can go into
        # bank_questions.snapshot for Daily Revise's dropdown mode without
        # ever exposing the answer itself.
        for q in extract_array(src, "fibData", file) or []:
            if not q or not q.get("display") or not isinstance(q.get("blanks"), dict) or not q["blanks"]:
                continue
            blanks = q["blanks"]
            correct_answers = [v for v in blanks.values() if v]
            blank_options = {}
            for key, ans in blanks.items():
                if not ans:
                    continue
                distractors = [w for w in fib_words if w not in correct_answers]
                random.shuffle(distractors)
                opts = [ans] + distractors[:3]
                random.shuffle(opts)
                blank_options[key] = opts
            bank.append(prune({
                "id": unique_id("fib", q["display"]),
                "pageId": page_id, "pageName": page_name,
                "source": "fib", "type": "fib",
                "marks": len(blanks),
                "question": q["display"],
                "blankOptions": blank_options or None,
                "key": {"blanks": blanks},
            }))

        # Matching pairs become MCQs: pick the right definition for a term.
        # Distractors are the next three definitions in the list (deterministic,
        # so question ids and snapshots stay stable between rebuilds); the
        # correct option's position is derived from the term's hash.
        match_items = [m for m in (extract_array(src, "matchData", file) or [])
                       if isinstance(m, dict) and m.get("term") and m.get("def")]
        if len(match_items) >= 4:
            n = len(match_items)
            for i, m in enumerate(match_items):
                options = [match_items[(i + k) % n]["def"] for k in range(1, 4)]
                correct_pos = int(djb2(m["term"]), 16) % 4
                options.insert(correct_pos, m["def"])
                bank.append(prune({
                    "id": unique_id("match", m["term"] + "::" + m["def"]),
                    "pageId": page_id, "pageName": page_name,
                    "source": "match", "type": "mcq", "marks": 1,
                    "question": f'Which definition matches the key term “{m["term"]}”?',
                    "options": options,
                    "key": {"answer": correct_pos,
                            "explain": f'“{m["term"]}” means: {m["def"]}'},
                }))

    return bank, flash_counts, warnings


def prefix_bank(bank, slug):
    """Subject-prefixed copy: id and pageId gain '<slug>:' (bank ids are
    'pageId:source:hash', so prefixing the whole id prefixes its pageId
    part). All other fields — including key order — are untouched."""
    return [{**q, "id": f"{slug}:{q['id']}", "pageId": f"{slug}:{q['pageId']}"}
            for q in bank]


def compute_by_page(bank):
    by_page = {}
    for q in bank:
        c = by_page.setdefault(q["pageId"], {s: 0 for s in SOURCES} | {"marks": 0})
        c[q["source"]] += 1
        c["marks"] += q["marks"]
    return by_page


def compute_section_totals(pages, by_page, flash_counts):
    section_totals = {}
    for page_id, page_name, file in pages:
        if page_id not in by_page and page_id not in flash_counts:
            continue
        counts = by_page.get(page_id, {s: 0 for s in SOURCES})
        section_totals[page_id] = {s: counts[s] for s in SOURCES} | {"flashcards": flash_counts.get(page_id, 0)}
    return section_totals


# ──────────────────────────────────────────────────────────────────
# JS emitters (the two legacy headers are byte-identical to the pre-v2
# builder's output — --legacy relies on that)
# ──────────────────────────────────────────────────────────────────

def bank_js_text(bank, stamp):
    header = (
        BANNER +
        "// QUESTION BANK — GENERATED FILE, DO NOT EDIT BY HAND\n"
        "// Built by tools/build_question_bank.py from the question arrays\n"
        "// embedded in every topic page. Regenerate after editing questions:\n"
        "//     python tools/build_question_bank.py\n"
        f"// Generated: {stamp} · {len(bank)} questions\n"
        + BANNER +
        "window.QUESTION_BANK = "
    )
    return header + json.dumps(bank, ensure_ascii=False, indent=1) + ";\n"


def section_totals_js_text(section_totals, stamp):
    header = (
        BANNER +
        "// SECTION TOTALS — GENERATED FILE, DO NOT EDIT BY HAND\n"
        "// Built by tools/build_question_bank.py alongside question-bank.js.\n"
        "// The TRUE question/flashcard count per topic page and section,\n"
        "// independent of any student's progress — used to fix progress\n"
        "// stats so a topic a student has engaged with counts ALL of its\n"
        "// sections' totals, not just the ones they've personally started.\n"
        f"// Generated: {stamp}\n"
        + BANNER +
        "window.SECTION_TOTALS = "
    )
    return header + json.dumps(section_totals, ensure_ascii=False, indent=1) + ";\n"


def page_groups_js_text(manifest, stamp):
    return (
        BANNER +
        "// SUBJECT PAGE GROUPS — GENERATED FILE, DO NOT EDIT BY HAND\n"
        "// Built by tools/build_question_bank.py from this directory's\n"
        "// subject.json manifest. Declares which subject a page belongs to\n"
        "// (window.SUBJECT) and the subject's topic tree (window.PAGE_GROUPS)\n"
        "// — the same structure progress-shared.js's literal has, with\n"
        "// subject-prefixed page ids and root-absolute hrefs.\n"
        f"// Generated: {stamp}\n"
        + BANNER +
        "window.SUBJECT = " + json.dumps(subject_header(manifest), ensure_ascii=False, indent=1) + ";\n"
        "window.PAGE_GROUPS = " + json.dumps(page_groups_structure(manifest), ensure_ascii=False, indent=1) + ";\n"
    )


def subjects_index_js_text(manifests, stamp):
    subjects = [subject_header(m) | {"examDate": m["exam_date"]} for m in manifests]
    return (
        BANNER +
        "// SUBJECTS REGISTRY — GENERATED FILE, DO NOT EDIT BY HAND\n"
        "// Built by tools/build_question_bank.py from every\n"
        "// subjects/*/subject.json manifest header.\n"
        f"// Generated: {stamp}\n"
        + BANNER +
        "window.SUBJECTS = " + json.dumps(subjects, ensure_ascii=False, indent=1) + ";\n"
    )


def page_groups_all_js_text(manifests, stamp):
    all_groups = {m["slug"]: page_groups_structure(m) for m in manifests}
    return (
        BANNER +
        "// ALL PAGE GROUPS — GENERATED FILE, DO NOT EDIT BY HAND\n"
        "// Built by tools/build_question_bank.py: every subject's topic tree\n"
        "// keyed by subject slug, for cross-subject pages (hub, profile).\n"
        f"// Generated: {stamp}\n"
        + BANNER +
        "window.PAGE_GROUPS_ALL = " + json.dumps(all_groups, ensure_ascii=False, indent=1) + ";\n"
    )


def section_totals_all_js_text(merged_totals, stamp):
    return (
        BANNER +
        "// ALL SECTION TOTALS — GENERATED FILE, DO NOT EDIT BY HAND\n"
        "// Built by tools/build_question_bank.py: every subject's section\n"
        "// totals merged into one map keyed by subject-prefixed page id.\n"
        f"// Generated: {stamp}\n"
        + BANNER +
        "window.SECTION_TOTALS_ALL = " + json.dumps(merged_totals, ensure_ascii=False, indent=1) + ";\n"
        "// Every consumer (progress-shared.js, gamification.js, script.js,\n"
        "// topic-guard.js, dashboard.html) reads window.SECTION_TOTALS[pageId],\n"
        "// so cross-subject pages loading this merged file get the same shape.\n"
        "window.SECTION_TOTALS = window.SECTION_TOTALS_ALL;\n"
    )


def read_generated_section_totals(slug):
    """Previously generated subjects/<slug>/section-totals.js, if any —
    used so a --subject-filtered run can still emit complete -all files."""
    path = SUBJECTS_DIR / slug / "section-totals.js"
    if not path.exists():
        return None
    txt = path.read_text(encoding="utf-8")
    marker = "window.SECTION_TOTALS = "
    i = txt.find(marker)
    if i < 0:
        return None
    body = txt[i + len(marker):].strip()
    return json.loads(body[:-1] if body.endswith(";") else body)


# ──────────────────────────────────────────────────────────────────
# Seed SQL + optional live upload
# ──────────────────────────────────────────────────────────────────

def bank_rows(bank):
    """(question_key, page_id, page_name, source, qtype, marks, snapshot,
    answer_key) rows for the (already prefixed) bank. Deliberately excludes
    'written' questions — free-text exam-practice answers have no
    deterministic correctness signal, so they can't participate in
    auto-graded mastery. Splits each entry into a student-safe `snapshot`
    (no answer) and a hidden `answer_key` (the `key` object) — same split
    as task_questions.snapshot/answer_key, so the answer is never present
    in any student-reachable response."""
    rows = []
    skipped_written = 0
    for q in bank:
        if q.get("type") == "written":
            skipped_written += 1
            continue
        snapshot = {k: v for k, v in q.items()
                    if k not in ("id", "pageId", "pageName", "source", "type", "marks", "key")}
        answer_key = q.get("key", {})
        rows.append((q["id"], q["pageId"], q["pageName"], q["source"], q["type"],
                     q["marks"], snapshot, answer_key))
    return rows, skipped_written


# Emitted as many small numbered files (not one big file) — Supabase's SQL
# editor rejects an overly large pasted query, and one file per statement
# means there's no way to accidentally paste more than one chunk into the
# editor at once. If you have `psql` or another direct Postgres client,
# running the parts concatenated in one command works fine (no editor size
# limit applies there); the numbered files are for the
# copy-paste-into-the-web-editor workflow used by every other schema file.
#
# v2 writes per-subject directories (supabase/bank-questions-seed/<slug>/)
# with the subject_slug column; the pre-v2 files directly in
# supabase/bank-questions-seed/ are left untouched until step 3 retires them.
def write_bank_questions_seed(rows, skipped_written, slug, stamp):
    chunk_size = 100
    chunks = [rows[i:i + chunk_size] for i in range(0, len(rows), chunk_size)]

    seed_dir = ROOT / "supabase" / "bank-questions-seed" / slug
    seed_dir.mkdir(parents=True, exist_ok=True)
    for old in seed_dir.glob("*.sql"):
        old.unlink()

    for n, chunk in enumerate(chunks, start=1):
        values = []
        for (qkey, page_id, page_name, source, qtype, marks, snapshot, answer_key) in chunk:
            values.append("(" + ", ".join([
                sql_string(qkey), sql_string(slug), sql_string(page_id), sql_string(page_name),
                sql_string(source), sql_string(qtype), str(marks),
                sql_jsonb(snapshot), sql_jsonb(answer_key),
            ]) + ")")
        text = (
            SQL_BANNER +
            f"-- BANK QUESTIONS SEED ({slug}) — GENERATED FILE, DO NOT EDIT BY HAND\n"
            f"-- Part {n} of {len(chunks)}. Built by tools/build_question_bank.py.\n"
            "-- Run every part, in order, AFTER supabase/bank-questions-schema.sql.\n"
            "-- Each part is a standalone statement — paste just this one file into\n"
            "-- the Supabase SQL editor and click Run, then move to the next part.\n"
            "-- Safe to re-run (upserts by question_key).\n"
            f"-- Generated: {stamp}\n"
            + SQL_BANNER +
            "insert into bank_questions "
            "(question_key, subject_slug, page_id, page_name, source, qtype, marks, snapshot, answer_key)\n"
            "values\n" + ",\n".join(values) + "\n"
            "on conflict (question_key) do update set\n"
            "  subject_slug = excluded.subject_slug,\n"
            "  page_id = excluded.page_id, page_name = excluded.page_name,\n"
            "  source = excluded.source, qtype = excluded.qtype, marks = excluded.marks,\n"
            "  snapshot = excluded.snapshot, answer_key = excluded.answer_key,\n"
            "  updated_at = now();\n"
        )
        (seed_dir / f"{n:03d}.sql").write_text(text, encoding="utf-8")

    print(f"bank-questions-seed/{slug}/: {len(chunks)} files written, {len(rows)} rows "
          f"({skipped_written} written-type skipped)")


# Pushes bank_questions rows straight to Supabase via PostgREST, using the
# service-role key (same credential the Netlify functions already use, e.g.
# netlify/functions/_lib/adminClient.js) — bypasses RLS same as the SQL
# Editor would. ONLY runs when --upload is passed (the default build never
# touches the network); the generated SQL files are the manual fallback.
# Also upserts this subject's row into the `subjects` table from the
# manifest header.
#
# This is the ONE command that keeps everything in sync with a topic page
# edit: adding/removing/rewording a question changes what build_bank()
# produces, which (a) is always written to the local per-subject
# question-bank.js — read fresh by the teacher task/worksheet builders and
# the student index/dashboard, no server round-trip involved — and (b),
# only when --upload is passed, is reconciled into bank_questions (Daily
# Revise's source), including DELETING rows for questions that no longer
# exist in this build. Without that deletion step, a removed question would
# linger in Daily Revise's pool forever, orphaned from the topic page it
# used to live on. Already-published tasks are unaffected either way — they
# store a full snapshot at creation time (tasks-schema.sql), by design.
def upload_bank_questions(rows, manifest):
    _load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (.env) — skipping live "
              "upload; run the files in supabase/bank-questions-seed/ manually instead.",
              file=sys.stderr)
        return

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    slug = manifest["slug"]

    def post(endpoint, payload, what):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(endpoint, data=body, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                resp.read()
            return True
        except urllib.error.HTTPError as e:
            body_text = e.read().decode("utf-8", errors="replace")
            print(f"{what} upload FAILED: HTTP {e.code} {body_text}", file=sys.stderr)
        except urllib.error.URLError as e:
            print(f"{what} upload FAILED: {e}", file=sys.stderr)
        return False

    # Upsert the subjects row first — bank_questions.subject_slug references it.
    subject_row = {k: manifest[k] for k in
                   ("slug", "name", "key_stage", "level", "exam_board",
                    "spec_code", "exam_date", "colour", "icon")}
    if not post(url.rstrip("/") + "/rest/v1/subjects?on_conflict=slug",
                [subject_row], f"subjects ({slug})"):
        return
    print(f"subjects: '{slug}' row upserted.")

    endpoint = url.rstrip("/") + "/rest/v1/bank_questions?on_conflict=question_key"
    batch_size = 200
    uploaded = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        payload = [
            {
                "question_key": qkey, "subject_slug": slug,
                "page_id": page_id, "page_name": page_name,
                "source": source, "qtype": qtype, "marks": marks,
                "snapshot": snapshot, "answer_key": answer_key,
            }
            for (qkey, page_id, page_name, source, qtype, marks, snapshot, answer_key) in batch
        ]
        if not post(endpoint, payload, f"bank_questions row {i}"):
            print(f"  {uploaded} of {len(rows)} rows uploaded before the failure.", file=sys.stderr)
            return
        uploaded += len(batch)

    print(f"bank_questions: {uploaded} rows uploaded live to Supabase ({url}).")

    # Delete rows this build no longer produces for this subject — a
    # question removed (or reworded enough to get a new content-hash id)
    # must disappear from Daily Revise too, not just stop being added to.
    get_req = urllib.request.Request(
        url.rstrip("/") + "/rest/v1/bank_questions"
        f"?select=question_key&subject_slug=eq.{urllib.parse.quote(slug)}",
        headers=headers, method="GET")
    try:
        with urllib.request.urlopen(get_req, timeout=30) as resp:
            existing_keys = {row["question_key"] for row in json.loads(resp.read())}
    except (urllib.error.HTTPError, urllib.error.URLError) as e:
        print(f"bank_questions stale-row check FAILED: {e} — skipping cleanup this run "
              f"(nothing was deleted; re-run --upload later to retry).", file=sys.stderr)
        return

    new_keys = {qkey for (qkey, *_rest) in rows}
    stale = sorted(existing_keys - new_keys)
    if not stale:
        return

    del_batch = 100  # keep each DELETE's in.(...) filter comfortably under URL length limits
    deleted = 0
    for i in range(0, len(stale), del_batch):
        batch = stale[i:i + del_batch]
        in_list = ",".join(urllib.parse.quote(k, safe="") for k in batch)
        del_req = urllib.request.Request(
            url.rstrip("/") + f"/rest/v1/bank_questions?question_key=in.({in_list})",
            headers=headers, method="DELETE")
        try:
            with urllib.request.urlopen(del_req, timeout=30) as resp:
                resp.read()
            deleted += len(batch)
        except (urllib.error.HTTPError, urllib.error.URLError) as e:
            print(f"bank_questions cleanup FAILED partway: {e} "
                  f"({deleted} of {len(stale)} stale rows removed before the failure).",
                  file=sys.stderr)
            return

    print(f"bank_questions: {deleted} stale row(s) removed for '{slug}' "
          f"(questions no longer produced by this build).")


# ──────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────

def build_subject(manifest, stamp, args):
    """Build one subject's outputs. Returns its prefixed section totals."""
    slug = manifest["slug"]
    pages = question_pages(manifest)
    bank, flash_counts, warnings = build_bank(slug, pages)
    by_page = compute_by_page(bank)
    section_totals = compute_section_totals(pages, by_page, flash_counts)

    subj_dir = SUBJECTS_DIR / slug
    pbank = prefix_bank(bank, slug)
    (subj_dir / "question-bank.js").write_text(bank_js_text(pbank, stamp), encoding="utf-8")
    print(f"subjects/{slug}/question-bank.js written: {len(pbank)} questions from {len(by_page)} pages")
    for pid, c in by_page.items():
        counts = "  ".join(f"{s}:{c[s]:>3}" for s in SOURCES)
        print(f"  {pid:<38} {counts}  ({c['marks']} marks)")
    for w in warnings:
        print("WARN:", w, file=sys.stderr)

    prefixed_totals = {f"{slug}:{k}": v for k, v in section_totals.items()}
    (subj_dir / "section-totals.js").write_text(
        section_totals_js_text(prefixed_totals, stamp), encoding="utf-8")
    print(f"subjects/{slug}/section-totals.js written: {len(prefixed_totals)} pages")

    (subj_dir / "page-groups.js").write_text(page_groups_js_text(manifest, stamp), encoding="utf-8")
    print(f"subjects/{slug}/page-groups.js written")

    rows, skipped_written = bank_rows(pbank)
    write_bank_questions_seed(rows, skipped_written, slug, stamp)
    if args.upload:
        upload_bank_questions(rows, manifest)

    if args.legacy:
        if slug == "business":
            (ROOT / "question-bank.js").write_text(bank_js_text(bank, stamp), encoding="utf-8")
            (ROOT / "section-totals.js").write_text(
                section_totals_js_text(section_totals, stamp), encoding="utf-8")
            print(f"--legacy: root question-bank.js ({len(bank)} questions) + "
                  f"section-totals.js ({len(section_totals)} pages) written (unprefixed ids)")
        else:
            print(f"--legacy: skipped for '{slug}' — only business content lives at the repo root")

    return prefixed_totals


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="Build per-subject question banks + registry files from "
                    "subjects/*/subject.json manifests.")
    ap.add_argument("--subject", action="append", metavar="SLUG",
                    help="build only this subject (repeatable; default: all)")
    ap.add_argument("--legacy", action="store_true",
                    help="additionally emit the pre-v2 root question-bank.js / "
                         "section-totals.js with unprefixed ids (business only)")
    ap.add_argument("--upload", action=argparse.BooleanOptionalAction, default=False,
                    help="push rows + subject header live to Supabase "
                         "(default: --no-upload — never touches the network)")
    ap.add_argument("--seed", type=int, default=None, metavar="N",
                    help="seed the FIB-distractor RNG for reproducible output")
    args = ap.parse_args(argv)

    if args.seed is not None:
        random.seed(args.seed)

    manifests = discover_manifests()
    by_slug = {m["slug"]: m for m in manifests}
    if args.subject:
        unknown = [s for s in args.subject if s not in by_slug]
        if unknown:
            raise SystemExit(f"unknown subject(s): {', '.join(unknown)} "
                             f"(discovered: {', '.join(by_slug)})")
        to_build = [by_slug[s] for s in dict.fromkeys(args.subject)]
    else:
        to_build = manifests

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    built_totals = {}
    for manifest in to_build:
        built_totals[manifest["slug"]] = build_subject(manifest, stamp, args)

    # Cross-subject registry files always cover every DISCOVERED subject;
    # totals for subjects not rebuilt this run are reused from their
    # previously generated per-subject file.
    merged_totals = {}
    for m in manifests:
        slug = m["slug"]
        totals = built_totals.get(slug)
        if totals is None:
            totals = read_generated_section_totals(slug)
        if totals is None:
            print(f"WARN: no section totals for '{slug}' (not built this run and no "
                  f"generated subjects/{slug}/section-totals.js) — omitted from "
                  "section-totals-all.js", file=sys.stderr)
            continue
        merged_totals.update(totals)

    (ROOT / "subjects-index.js").write_text(subjects_index_js_text(manifests, stamp), encoding="utf-8")
    (ROOT / "page-groups-all.js").write_text(page_groups_all_js_text(manifests, stamp), encoding="utf-8")
    (ROOT / "section-totals-all.js").write_text(
        section_totals_all_js_text(merged_totals, stamp), encoding="utf-8")
    print(f"subjects-index.js ({len(manifests)} subjects), page-groups-all.js, "
          f"section-totals-all.js ({len(merged_totals)} pages) written")


if __name__ == "__main__":
    main()
