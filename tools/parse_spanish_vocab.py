#!/usr/bin/env python3
"""Extract AQA GCSE Spanish (8692) Appendix 2 vocabulary into a structured JSON wordbank.

Source: resources/spanish/spec/AQA-8692-SP-2024-v1.3.pdf (gitignored, teacher-supplied).
Outputs:
  - resources/spanish/wordbank/spanish-vocab.json (gitignored) — raw/debug copy.
  - subjects/spanish/vocab-bank.js (TRACKED, ships to students) — `window.VOCAB_BANK`,
    same "generated file" convention as subjects/spanish/question-bank.js (built by
    tools/build_question_bank.py). resources/ is globally gitignored, so the JSON
    alone can never reach production — the JS copy is what Vocab Lab actually loads.

The appendix is a 6-column table (rank | part of speech | Headword | English
equivalent | Tier | Selection principle), printed TWICE — once as the
"Foundation tier vocabulary" list (pages 61-77, tier=F, plus a shared tail of
F/H multi-word-phrases and C-tagged culture words) and once as the "Higher
tier vocabulary" list (pages 78-101, tier=H, same F/H tail repeated
verbatim). This script parses both listings with position-based table
extraction (column x-ranges, not line-splitting — the PDF's per-row line
layout is NOT consistent across sections, e.g. rank+pos share one text line
in some blocks but not others) and de-duplicates the byte-identical F/H tail
that both tier tables print for reference.

Column x-ranges are calibrated against this exact PDF's word bounding boxes
(see the dev notes in SPANISH-CONTENT-PLAN.md / conversation history) — if
AQA reflows the appendix in a future spec version, re-derive them with
page.get_text("words") before trusting the output.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import fitz  # PyMuPDF

REPO_ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = REPO_ROOT / "resources" / "spanish" / "spec" / "AQA-8692-SP-2024-v1.3.pdf"
OUT_PATH = REPO_ROOT / "resources" / "spanish" / "wordbank" / "spanish-vocab.json"
JS_BANK_PATH = REPO_ROOT / "subjects" / "spanish" / "vocab-bank.js"

# Column x0 bins (points). The Foundation table (pages 61-77) and Higher
# table (pages 78-101) are two independently laid-out tables in this PDF —
# the Higher table's columns sit ~2-5pt further left (e.g. headword x0=78.7
# vs 81.8, english x0=177.5 vs 180.6) — so bins must have margin for BOTH,
# derived from surveying word x0 clusters across sample pages of each table.
# Tier/selection values are column-centered, not left-aligned: a lone "F"/"H"
# sits further right than the wider "F/H", so those bins need margin too.
COL_RANK = (0, 40)
COL_POS = (40, 74)
COL_HEADWORD = (74, 172)
COL_ENGLISH = (172, 520)
COL_TIER = (520, 547)
COL_SELECTION = (547, 620)

HEADER_ZONE_MAX_Y = 159.0  # caption + column-title rows sit above this on the first page of each section

VALID_TIERS = {"F", "H", "F/H"}
VALID_SELECTION = {"R", "O", "O>", "C"}


def col_of(x0):
    for name, (lo, hi) in (
        ("rank", COL_RANK), ("pos", COL_POS), ("headword", COL_HEADWORD),
        ("english", COL_ENGLISH), ("tier", COL_TIER), ("selection", COL_SELECTION),
    ):
        if lo <= x0 < hi:
            return name
    return None


def group_pos_cells(pos_words):
    """pos_words: list of (x0,y0,x1,y1,text) sorted by y0. Merge same-line words
    (e.g. 'n' + '(m)' -> 'n (m)') into cells; each cell's y0 = an entry boundary."""
    cells = []
    cur = None
    for w in pos_words:
        x0, y0, x1, y1, text = w[0], w[1], w[2], w[3], w[4]
        if cur is None or (y0 - cur["y0"]) > 3.0:
            if cur:
                cells.append(cur)
            cur = {"y0": y0, "words": [text]}
        else:
            cur["words"].append(text)
    if cur:
        cells.append(cur)
    return [(c["y0"], " ".join(c["words"])) for c in cells]


def _legend_start_y(words):
    """The 'R = Required / O = ... / O> = ...' key sits below the last real
    table row on the final page of each tier table, as plain text (not part
    of the 6-column layout) — find where it starts so it can be excluded."""
    ys = [w[1] for w in words if w[4] == "Required"]
    return min(ys) if ys else None


def parse_page(page, exclude_header):
    words = page.get_text("words")  # x0,y0,x1,y1,text,block,line,word_no
    words = [w for w in words if not (exclude_header and w[1] < HEADER_ZONE_MAX_Y)]
    legend_y = _legend_start_y(words)
    if legend_y is not None:
        words = [w for w in words if w[1] < legend_y - 0.5]
    words.sort(key=lambda w: (w[1], w[0]))

    by_col = {"rank": [], "pos": [], "headword": [], "english": [], "tier": [], "selection": []}
    for w in words:
        c = col_of(w[0])
        if c:
            by_col[c].append(w)

    pos_cells = group_pos_cells(by_col["pos"])
    if not pos_cells:
        return []
    boundaries = [y0 for y0, _ in pos_cells] + [10**9]

    def bucket_text(colname, i):
        lo, hi = boundaries[i], boundaries[i + 1]
        toks = [w for w in by_col[colname] if lo - 0.5 <= w[1] < hi - 0.5]
        toks.sort(key=lambda w: (w[1], w[0]))
        return " ".join(t[4] for t in toks).strip()

    entries = []
    for i, (y0, pos_text) in enumerate(pos_cells):
        rank_raw = bucket_text("rank", i)
        headword = bucket_text("headword", i)
        english = bucket_text("english", i)
        tier = bucket_text("tier", i).strip()
        selection = bucket_text("selection", i).strip()
        entries.append({
            "rank_raw": rank_raw, "pos": pos_text, "headword": headword,
            "english": english, "tier": tier, "selection": selection,
            "page": page.number + 1,
        })
    return entries


def resolve_ranks(entries):
    """Blank rank cell = continuation of the previous rank group (e.g. el/la/los/las
    all rank 1). Explicit 'n/a' = genuinely unranked (thematic add beyond top 2000)."""
    current = None
    for e in entries:
        raw = e.pop("rank_raw")
        if raw == "":
            e["rank"] = current
        elif raw == "n/a":
            current = None
            e["rank"] = None
        else:
            current = int(raw)
            e["rank"] = current
    return entries


def parse_section(doc, page_range, exclude_header_on):
    all_entries = []
    for pno in page_range:
        page = doc[pno]
        all_entries.extend(parse_page(page, exclude_header=(pno in exclude_header_on)))
    return resolve_ranks(all_entries)


def validate(entries, label):
    problems = []
    for e in entries:
        if not e["pos"]:
            problems.append(f'{label} p{e["page"]}: empty pos near headword={e["headword"]!r}')
        if not e["headword"]:
            problems.append(f'{label} p{e["page"]}: empty headword (pos={e["pos"]!r} english={e["english"]!r})')
        if not e["english"]:
            problems.append(f'{label} p{e["page"]}: empty english for headword={e["headword"]!r}')
        if e["tier"] not in VALID_TIERS:
            problems.append(f'{label} p{e["page"]}: bad tier {e["tier"]!r} for headword={e["headword"]!r}')
        if e["selection"] not in VALID_SELECTION:
            problems.append(f'{label} p{e["page"]}: bad selection {e["selection"]!r} for headword={e["headword"]!r}')
    return problems


def main():
    if not PDF_PATH.exists():
        print(f"Missing spec PDF: {PDF_PATH}", file=sys.stderr)
        sys.exit(1)

    doc = fitz.open(PDF_PATH)

    # 0-indexed page numbers: Foundation = printed pages 61-77 -> index 60-76
    #                          Higher     = printed pages 78-101 -> index 77-100
    foundation = parse_section(doc, range(60, 77), exclude_header_on={60})
    higher = parse_section(doc, range(77, 101), exclude_header_on={77})

    problems = validate(foundation, "Foundation") + validate(higher, "Higher")
    if problems:
        print(f"{len(problems)} validation problems found:", file=sys.stderr)
        for p in problems[:50]:
            print("  " + p, file=sys.stderr)
        sys.exit(2)

    # De-duplicate the F/H tail (multi-word phrases + culture words) that both
    # tier tables print verbatim. Assert exact equality before dropping —
    # never silently merge entries whose text differs between the two copies.
    fh_foundation = [e for e in foundation if e["tier"] == "F/H"]
    fh_higher = [e for e in higher if e["tier"] == "F/H"]

    def fh_key(e):
        return (e["pos"], e["headword"], e["english"], e["selection"])

    fh_f_by_key = {fh_key(e): e for e in fh_foundation}
    fh_h_by_key = {fh_key(e): e for e in fh_higher}
    mismatches = []
    for k in set(fh_f_by_key) & set(fh_h_by_key):
        f_e, h_e = fh_f_by_key[k], fh_h_by_key[k]
        if f_e["rank"] != h_e["rank"]:
            mismatches.append((k, f_e, h_e))
    if mismatches:
        print(f"{len(mismatches)} F/H tail rank mismatches between Foundation and Higher copies:", file=sys.stderr)
        for k, f_e, h_e in mismatches[:20]:
            print(f"  {k}: foundation rank={f_e['rank']} vs higher rank={h_e['rank']}", file=sys.stderr)
        sys.exit(3)

    # A handful of headwords are tagged inconsistently between the two tier
    # tables' printings of the "shared" tail (e.g. AQA prints "lo bueno" as
    # tier F in the Foundation table but tier F/H in the Higher table's copy
    # of the same entry) — a discrepancy in the source PDF itself, not a
    # parse error. Surface every one rather than silently picking a side;
    # the entry still reaches the wordbank via its Foundation-table tier tag
    # (already included in f_tier_only/h_tier_only below), so nothing taught
    # is lost — only the disputed tier label is decided (conservatively, in
    # favour of whichever table's OWN printing is more restrictive).
    only_in_foundation = set(fh_f_by_key) - set(fh_h_by_key)
    only_in_higher = set(fh_h_by_key) - set(fh_f_by_key)
    discrepancies = []
    for k in only_in_foundation:
        discrepancies.append({"headword": k[1], "pos": k[0], "note": "tagged F/H only in the Foundation table's printing"})
    for k in only_in_higher:
        discrepancies.append({"headword": k[1], "pos": k[0], "note": "tagged F/H only in the Higher table's printing"})
    if discrepancies:
        print(f"{len(discrepancies)} tier-tag discrepancies between the two table printings (see 'source_discrepancies' in the output JSON):", file=sys.stderr)
        for d in discrepancies:
            print(f"  {d['headword']!r} ({d['pos']}): {d['note']}", file=sys.stderr)

    f_tier_only = [e for e in foundation if e["tier"] == "F"]
    h_tier_only = [e for e in higher if e["tier"] == "H"]
    merged = f_tier_only + h_tier_only + fh_foundation  # one copy of the F/H tail

    for i, e in enumerate(merged):
        e["id"] = f'{e["tier"].replace("/", "").lower()}-{i:04d}-{_slug(e["headword"])}'

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": "AQA-8692-SP-2024-v1.3.pdf, Appendix 2",
        "extracted_pages": {"foundation": "61-77", "higher": "78-101"},
        "counts": {
            "foundation_tier_F": len(f_tier_only),
            "higher_tier_H": len(h_tier_only),
            "shared_F_H": len(fh_foundation),
            "total": len(merged),
        },
        "selection_legend": {
            "R": "Required",
            "O": "Optional within the top 2000 words",
            "O>": "Optional outside the top 2000 words",
            "C": "Culture-specific vocabulary (label inferred from context; AQA does not define this code in the printed legend)",
        },
        "source_discrepancies": discrepancies,
        "entries": merged,
    }
    OUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Wrote {len(merged)} entries to {OUT_PATH}")
    print(f"  Foundation (F): {len(f_tier_only)}")
    print(f"  Higher (H):     {len(h_tier_only)}")
    print(f"  Shared (F/H):   {len(fh_foundation)}")

    _emit_js_bank(merged)
    print(f"Wrote {len(merged)} entries to {JS_BANK_PATH}")


def _emit_js_bank(entries):
    """Tracked, servable twin of the JSON output — see module docstring. Mirrors
    subjects/spanish/question-bank.js's own generated-file header convention."""
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    header = (
        "// ══════════════════════════════════════════════════════════════\n"
        "// SPANISH VOCAB BANK — GENERATED FILE, DO NOT EDIT BY HAND\n"
        "// Built by tools/parse_spanish_vocab.py from Appendix 2 of the AQA 8692\n"
        "// spec (resources/spanish/spec/, gitignored). Regenerate after a spec\n"
        "// update:\n"
        "//     python tools/parse_spanish_vocab.py\n"
        f"// Generated: {stamp} · {len(entries)} entries\n"
        "// ══════════════════════════════════════════════════════════════\n"
    )
    body = "window.VOCAB_BANK = " + json.dumps(entries, ensure_ascii=False, indent=1) + ";\n"
    JS_BANK_PATH.parent.mkdir(parents=True, exist_ok=True)
    JS_BANK_PATH.write_text(header + body, encoding="utf-8")


def _slug(s):
    import re
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:40] or "x"


if __name__ == "__main__":
    main()
