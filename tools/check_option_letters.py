#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Catch MCQ explanations whose option-letter references are wrong.

    python tools/check_option_letters.py [--subject slug]...

WHY THIS EXISTS
    shuffle_mcq_options.py reorders `opts` and rewrites `ans`. It cannot rewrite
    prose, so any explanation naming a POSITION ("Correct answer: B", "Options A
    and C are...") silently becomes wrong the moment the options move — the quiz
    then tells students the wrong letter, and nothing fails. Run this after any
    shuffle, and after editing an explain.

    The durable fix for a flagged question is to name the option TEXT rather than
    its letter ("Reducing output contradicts..." not "Option A contradicts..."),
    which no future shuffle can invalidate.

WHAT IT FLAGS (deliberately only unambiguous errors)
    1. An answer claim naming the wrong letter:  "Correct answer: B" when ans=C.
    2. A letter named as a DISTRACTOR that is actually the answer:
       "Options A and C are wrong" when ans=A.

WHAT IT DOES NOT FLAG, and why
    A distractor list may legitimately mention a SUBSET, or split across
    sentences ("Options A and B are financial. Option D is a fringe benefit."),
    so "named set != full complement" is not an error and reporting it buries the
    real ones in noise. It also cannot tell whether a letter's DESCRIPTION
    matches that option's text — "Options C and D (reducing output)" when
    reducing output is option A is a real bug this will not catch. Letter-free
    explanations are what actually removes the whole class.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

BLOCK = re.compile(
    r'\{\s*q:\s*"((?:[^"\\]|\\.)*)"\s*,\s*'
    r'opts:\s*\[(.*?)\]\s*,\s*'
    r'ans:\s*(\d+)\s*,\s*'
    r'explain:\s*"((?:[^"\\]|\\.)*)"', re.S)

# "Correct answer: B" / "The answer is B" — a claim about WHICH option is right.
# The letter must not be followed by a word: "Correct answer: A vertical
# takeover" and "Correct answer: A £1 discount shop" are the article "a", not
# option A. Requiring a boundary that is not the start of another word costs a
# few true positives but removes a large class of false ones.
ANSWER_CLAIM = re.compile(
    r'(?:[Cc]orrect answer(?:\s+is)?:?\s*|[Tt]he answer is\s+)([A-D])(?=[\s.,;:)\]]*(?:$|[.,;:)\]]))')

# "Options A, C and D ..." / "Option B ..." — a claim about DISTRACTORS.
SET_CLAIM = re.compile(r'[Oo]ptions?\s+((?:[A-D]\b[,\s]*(?:and\s+)?){1,4})')
LETTER = re.compile(r'\b([A-D])\b')


def check_file(path: Path):
    src = path.read_text(encoding="utf-8")
    out = []
    for m in BLOCK.finditer(src):
        q, optsraw, ans, explain = m.group(1), m.group(2), int(m.group(3)), m.group(4)
        opts = re.findall(r'"((?:[^"\\]|\\.)*)"', optsraw)
        if len(opts) < 2:
            continue
        ansL = "ABCD"[ans]
        issues = []
        for L in ANSWER_CLAIM.findall(explain):
            if L != ansL:
                issues.append(f'says "correct answer: {L}" but the answer is {ansL}')
        for grp in SET_CLAIM.findall(explain):
            named = set(LETTER.findall(grp))
            if ansL in named:
                issues.append(f'calls {ansL} a distractor, but {ansL} is the answer')
        if issues:
            out.append((q, opts, ans, explain, issues))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--subject", action="append", dest="subjects")
    args = ap.parse_args()
    subjects = args.subjects or [p.name for p in (ROOT / "subjects").iterdir()
                                 if p.is_dir()]
    total = bad = 0
    for slug in sorted(subjects):
        for f in sorted((ROOT / "subjects" / slug).glob("*.html")):
            found = check_file(f)
            total += 1
            for q, opts, ans, explain, issues in found:
                bad += 1
                print("=" * 78)
                print(f"{slug}/{f.name}")
                print(f"  Q  {q}")
                for i, o in enumerate(opts):
                    mark = " <-- ans" if i == ans else "        "
                    print(f'     {"ABCD"[i]}{mark}  {o}')
                print(f"  EXPLAIN: {explain}")
                for it in issues:
                    print(f"     !! {it}")
                print()
    print(f"{total} page(s) scanned — {bad} wrong letter reference(s).")
    if bad:
        print("Rewrite each to name the option TEXT, not its letter, so no future "
              "shuffle can break it again.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
