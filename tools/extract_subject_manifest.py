#!/usr/bin/env python3
"""
SUBJECT MANIFEST EXTRACTOR (one-time helper, kept for re-runs)

Generates subjects/business/subject.json — the manifest that becomes the
single source of truth for the multi-subject pipeline (see
MULTI-SUBJECT-PLAN.md) — by parsing the two literals that define the
Business subject today, so nothing is ever hand-transcribed:

  * PAGE_GROUPS  — the topic tree in progress-shared.js (JS literal,
                   parsed with build_question_bank.JsLiteralParser)
  * PAGES        — the question-bearing page list in
                   tools/build_question_bank.py (Python literal)

Pages that appear in PAGE_GROUPS but not in PAGES (the 2_4_marketing_mix
overview page) are marked "noQuestions": true. Where the two literals
disagree on a page's display name (PAGE_GROUPS abbreviates a few), the
PAGE_GROUPS name becomes "name" and the PAGES name is preserved as
"bankName" — the build pipeline uses bankName (falling back to name) as
the question bank's pageName, so legacy output stays byte-identical.

The script asserts, before writing anything, that the manifest is a
lossless merge: every PAGES entry maps 1:1 to a manifest page with
matching file+id+name, and every PAGE_GROUPS page appears exactly once.

Run from the repo root:

    python tools/extract_subject_manifest.py

Re-runnable for as long as both source literals still exist (the PAGES
literal is retained in build_question_bank.py, marked legacy, precisely
so this cross-check can be repeated until the step-4 restructure).
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

import build_question_bank as bqb  # noqa: E402  (JsLiteralParser + PAGES)

# Subject header — the locked product decisions from MULTI-SUBJECT-PLAN.md.
SUBJECT_HEADER = {
    "slug": "business",
    "name": "GCSE Business",
    "key_stage": "ks4",
    "level": "GCSE",
    "exam_board": "OCR",
    "spec_code": "J204",
    "exam_date": "2027-05-12",
    "colour": "#7a5c9e",
    "icon": "\U0001F4BC",  # 💼
}


def parse_page_groups():
    """Parse the const PAGE_GROUPS = [...] literal out of progress-shared.js."""
    src_path = ROOT / "progress-shared.js"
    src = src_path.read_text(encoding="utf-8")
    m = re.search(r"const\s+PAGE_GROUPS\s*=\s*\[", src)
    if not m:
        raise SystemExit(
            "ERROR: 'const PAGE_GROUPS = [' not found in progress-shared.js.\n"
            "If the literal has already moved out (step-4 restructure), this\n"
            "one-time extractor's job is done — subjects/business/subject.json\n"
            "is the source of truth now."
        )
    parser = bqb.JsLiteralParser(src, m.end() - 1)
    try:
        return parser.parse_array()
    except ValueError as e:
        raise SystemExit(f"ERROR parsing PAGE_GROUPS in progress-shared.js: {e}")


def get_pages_literal():
    pages = getattr(bqb, "PAGES", None)
    if not pages:
        raise SystemExit(
            "ERROR: PAGES literal not found in tools/build_question_bank.py.\n"
            "It is retained there (marked legacy) for this script's cross-check;\n"
            "if it has been removed, the manifest is already the source of truth."
        )
    return pages


def manifest_page(node, bank_by_id):
    """Convert one PAGE_GROUPS page node (recursively) to manifest shape."""
    out = {"id": node["id"], "name": node["name"]}
    if node.get("sub"):
        out["sub"] = node["sub"]
    out["file"] = node["href"]
    if node["id"] in bank_by_id:
        bank_name, bank_file = bank_by_id[node["id"]]
        if bank_file != node["href"]:
            raise SystemExit(
                f"ERROR: page '{node['id']}' file mismatch: "
                f"PAGES has {bank_file!r}, PAGE_GROUPS has {node['href']!r}"
            )
        if bank_name != node["name"]:
            out["bankName"] = bank_name
    else:
        out["noQuestions"] = True
    if node.get("children"):
        out["children"] = [manifest_page(c, bank_by_id) for c in node["children"]]
    return out


def flat_manifest_pages(groups):
    """All manifest pages in document order (parents before children)."""
    def rec(pages):
        for p in pages:
            yield p
            yield from rec(p.get("children") or [])
    for g in groups:
        yield from rec(g["pages"])


def flat_pg_pages(page_groups):
    """All PAGE_GROUPS page nodes in document order (parents before children)."""
    def rec(pages):
        for p in pages:
            yield p
            yield from rec(p.get("children") or [])
    for g in page_groups:
        yield from rec(g["pages"])


def verify(manifest, pages_literal, page_groups):
    """Assert the manifest is a lossless 1:1 merge of PAGES + PAGE_GROUPS."""
    flat = list(flat_manifest_pages(manifest["groups"]))
    by_id = {}
    for p in flat:
        assert p["id"] not in by_id, f"duplicate manifest page id {p['id']}"
        by_id[p["id"]] = p

    # 1. Every PAGES entry maps 1:1 to a manifest page: matching file + id +
    #    name (via bankName when the display name was abbreviated).
    for pid, pname, pfile in pages_literal:
        assert pid in by_id, f"PAGES entry {pid} missing from manifest"
        p = by_id[pid]
        assert p["file"] == pfile, f"{pid}: file {p['file']!r} != PAGES {pfile!r}"
        assert p.get("bankName", p["name"]) == pname, \
            f"{pid}: name {p.get('bankName', p['name'])!r} != PAGES {pname!r}"
        assert not p.get("noQuestions"), f"{pid} is in PAGES but marked noQuestions"

    # 2. Every PAGE_GROUPS page appears exactly once, unchanged.
    pg_flat = list(flat_pg_pages(page_groups))
    assert len(pg_flat) == len(flat), \
        f"page count mismatch: PAGE_GROUPS {len(pg_flat)} vs manifest {len(flat)}"
    for node in pg_flat:
        p = by_id.get(node["id"])
        assert p is not None, f"PAGE_GROUPS page {node['id']} missing from manifest"
        assert p["name"] == node["name"], f"{node['id']}: name mismatch"
        assert p["file"] == node["href"], f"{node['id']}: href mismatch"
        assert p.get("sub") == node.get("sub"), f"{node['id']}: sub mismatch"
        assert bool(p.get("children")) == bool(node.get("children")), \
            f"{node['id']}: children mismatch"

    # 3. noQuestions pages are exactly PAGE_GROUPS minus PAGES.
    bank_ids = {pid for pid, _, _ in pages_literal}
    no_q = sorted(p["id"] for p in flat if p.get("noQuestions"))
    expected_no_q = sorted(set(by_id) - bank_ids)
    assert no_q == expected_no_q, f"noQuestions {no_q} != expected {expected_no_q}"

    # 4. Group metadata carried over intact.
    assert len(manifest["groups"]) == len(page_groups)
    for mg, pg in zip(manifest["groups"], page_groups):
        for key in ("id", "title", "sub", "colour"):
            assert mg.get(key) == pg.get(key), f"group {pg['id']}: {key} mismatch"

    print(f"verify OK: {len(flat)} pages ({len(pages_literal)} with questions, "
          f"{len(no_q)} noQuestions: {', '.join(no_q)}), "
          f"{len(manifest['groups'])} groups")


def main():
    page_groups = parse_page_groups()
    pages_literal = get_pages_literal()
    bank_by_id = {pid: (pname, pfile) for pid, pname, pfile in pages_literal}
    if len(bank_by_id) != len(pages_literal):
        raise SystemExit("ERROR: duplicate ids in PAGES literal")

    manifest = dict(SUBJECT_HEADER)
    manifest["groups"] = []
    for g in page_groups:
        group = {"id": g["id"], "title": g["title"], "sub": g["sub"],
                 "colour": g["colour"],
                 "pages": [manifest_page(p, bank_by_id) for p in g["pages"]]}
        manifest["groups"].append(group)

    verify(manifest, pages_literal, page_groups)

    out = ROOT / "subjects" / manifest["slug"] / "subject.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
                   encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
