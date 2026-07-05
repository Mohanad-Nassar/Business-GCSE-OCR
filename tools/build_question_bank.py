#!/usr/bin/env python3
"""
QUESTION BANK BUILDER

Extracts the examQuestions / mcqData / tfData arrays embedded in every
topic page and emits question-bank.js, the flat question bank used by
the teacher task builder (teacher-tasks.html) and the student task
player (task.html). Also emits section-totals.js, a tiny per-page/
per-section question-count lookup (window.SECTION_TOTALS) used by
progress-shared.js and dashboard.html so progress stats can show the
TRUE total for every section of a topic a student has engaged with —
not just the sections they happen to have already started. It's a
separate, small file (not the ~4MB question-bank.js) because the
student/teacher dashboards need it on every page load.

Run from the repo root whenever a topic page's questions change:

    python tools/build_question_bank.py

Question IDs are content-hashed (pageId:source:hash of question text),
so they stay stable when questions are reordered. Editing a question's
text gives it a new id — existing tasks are safe because each task
stores a full snapshot of its questions in the database at creation.

The topic pages contain no template interpolation (${...}) or string
concatenation inside these arrays, so a static-literal parser suffices;
the parser below raises on anything it does not understand rather than
guessing.
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Filename <-> pageId mapping — keep in sync with PAGE_GROUPS in
# progress-shared.js. The overview page 2_4_marketing_mix.html has no
# question arrays and is intentionally absent.
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


def djb2(text: str) -> str:
    h = 5381
    for ch in text:
        h = ((h * 33) + ord(ch)) & 0xFFFFFFFF
    return format(h, "08x")


def prune(d: dict) -> dict:
    return {k: v for k, v in d.items() if v is not None}


def main():
    bank = []
    warnings = []
    flash_counts = {}

    for page_id, page_name, file in PAGES:
        full = ROOT / file
        if not full.exists():
            warnings.append(f"missing file: {file}")
            continue
        src = full.read_text(encoding="utf-8")
        seen = set()

        # Flashcards aren't gradable questions, so they're not part of the
        # task-builder bank — but their count is still needed for progress
        # totals (see section-totals.js below).
        flash_counts[page_id] = len(extract_array(src, "flashcards", file) or [])

        def unique_id(source, text):
            base = f"{page_id}:{source}:{djb2(text)}"
            qid, n = base, 2
            while qid in seen:
                qid = f"{base}-{n}"
                n += 1
            seen.add(qid)
            return qid

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
                "caseStudy": q.get("caseStudy") or None,
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
        for q in extract_array(src, "fibData", file) or []:
            if not q or not q.get("display") or not isinstance(q.get("blanks"), dict) or not q["blanks"]:
                continue
            bank.append(prune({
                "id": unique_id("fib", q["display"]),
                "pageId": page_id, "pageName": page_name,
                "source": "fib", "type": "fib",
                "marks": len(q["blanks"]),
                "question": q["display"],
                "key": {"blanks": q["blanks"]},
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

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    header = (
        "// ══════════════════════════════════════════════════════════════\n"
        "// QUESTION BANK — GENERATED FILE, DO NOT EDIT BY HAND\n"
        "// Built by tools/build_question_bank.py from the question arrays\n"
        "// embedded in every topic page. Regenerate after editing questions:\n"
        "//     python tools/build_question_bank.py\n"
        f"// Generated: {stamp} · {len(bank)} questions\n"
        "// ══════════════════════════════════════════════════════════════\n"
        "window.QUESTION_BANK = "
    )
    out = ROOT / "question-bank.js"
    out.write_text(header + json.dumps(bank, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")

    sources = ["exam", "mcq", "tf", "learn", "misc", "tips", "fib", "match"]
    by_page = {}
    for q in bank:
        c = by_page.setdefault(q["pageId"], {s: 0 for s in sources} | {"marks": 0})
        c[q["source"]] += 1
        c["marks"] += q["marks"]
    print(f"question-bank.js written: {len(bank)} questions from {len(by_page)} pages")
    for pid, c in by_page.items():
        counts = "  ".join(f"{s}:{c[s]:>3}" for s in sources)
        print(f"  {pid:<38} {counts}  ({c['marks']} marks)")
    for w in warnings:
        print("WARN:", w, file=sys.stderr)

    section_totals = {}
    for page_id, page_name, file in PAGES:
        if page_id not in by_page and page_id not in flash_counts:
            continue
        counts = by_page.get(page_id, {s: 0 for s in sources})
        section_totals[page_id] = {s: counts[s] for s in sources} | {"flashcards": flash_counts.get(page_id, 0)}

    st_header = (
        "// ══════════════════════════════════════════════════════════════\n"
        "// SECTION TOTALS — GENERATED FILE, DO NOT EDIT BY HAND\n"
        "// Built by tools/build_question_bank.py alongside question-bank.js.\n"
        "// The TRUE question/flashcard count per topic page and section,\n"
        "// independent of any student's progress — used to fix progress\n"
        "// stats so a topic a student has engaged with counts ALL of its\n"
        "// sections' totals, not just the ones they've personally started.\n"
        f"// Generated: {stamp}\n"
        "// ══════════════════════════════════════════════════════════════\n"
        "window.SECTION_TOTALS = "
    )
    (ROOT / "section-totals.js").write_text(
        st_header + json.dumps(section_totals, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(f"section-totals.js written: {len(section_totals)} pages")


if __name__ == "__main__":
    main()
