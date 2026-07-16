#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Randomise the position of the correct answer in authored quiz questions.

Problem: in the authored `mcqData` and `readCheck` questions the correct answer
was almost always written first, so a student guessing "A" scored ~82% on the
Economics quiz.

Scope: ONLY `opts:` / `ans:` pairs (mcqData + every readCheck in topics /
miscData / examTips). Real exam questions use `options:` / `answer:` and are
NEVER touched - their option order is the OCR paper's own and must stay verbatim.

IDEMPOTENT: the target order is derived from (question text + the SET of
options), never from their current order - the options are canonically sorted
first, then permuted with an MD5-seeded RNG. So re-running is a no-op and never
churns the diff, however many times it is applied.

Usage:  python shuffle_mcq_options.py [--apply] [subject ...]
"""
import re, sys, glob, hashlib, random
from collections import Counter

BASE = (r'c:/Users/MohanadNassar(Avanti/OneDrive - Avanti Schools Trust/Desktop/'
        r'VS-Code/Business website copies --June2026/Business-GCSE-OCR - Copy - Copy')

# an explain/prose that names a position would be made wrong by shuffling
POSREF = re.compile(r'\b(?:[Oo]ption [A-D]\b|answer [A-D]\b|[A-D] is (?:wrong|right|correct|imprecise)'
                    r'|the first option|the last option|options [A-D])')

# opts is always on a single line; ans follows on the next
PAIR = re.compile(r'( *)opts: \[([^\n]*?)\],\n( *)ans: (\d+),')


def split_top(body):
    """Split a JS array body on top-level commas, respecting quoting."""
    out, cur, instr, esc = [], '', None, False
    for c in body:
        if instr:
            cur += c
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == instr:
                instr = None
        else:
            if c in '"\'`':
                instr = c; cur += c
            elif c == ',':
                out.append(cur); cur = ''
            else:
                cur += c
    if cur.strip():
        out.append(cur)
    return [x.strip() for x in out]


def nearest_context(src, pos, back=900):
    """The enclosing question object's text, to find q: and explain:."""
    return src[max(0, pos - back): pos + 900]


def process(src):
    changed = skipped = 0
    out, last = [], 0
    for m in PAIR.finditer(src):
        opts = split_top(m.group(2))
        ans = int(m.group(4))
        if len(opts) < 2 or ans >= len(opts):
            continue
        ctx = nearest_context(src, m.start())
        # find this question's text (nearest preceding q:) for a stable seed
        qs = re.findall(r'q:\s*"([^"]*)"', src[max(0, m.start() - 900):m.start()])
        qtext = qs[-1] if qs else opts[0]
        # skip if the explanation names an option position
        exm = re.search(r'explain:\s*"((?:[^"\\]|\\.)*)"', src[m.end():m.end() + 1200])
        if exm and POSREF.search(exm.group(1)):
            skipped += 1
            continue
        correct = opts[ans]
        if opts.count(correct) != 1:
            skipped += 1          # duplicate option text: can't re-locate safely
            continue
        # Canonicalise FIRST so the target order depends only on the question
        # text + the option SET, never on the order we happen to find. This is
        # what makes the transform idempotent.
        canon = sorted(opts)
        seed = int(hashlib.md5(qtext.encode('utf-8')).hexdigest()[:8], 16)
        perm = list(range(len(canon)))
        random.Random(seed).shuffle(perm)
        new_opts = [canon[i] for i in perm]
        new_ans = new_opts.index(correct)
        if new_opts == opts and new_ans == ans:
            continue  # already in the target arrangement - nothing to write
        rep = '%sopts: [%s],\n%sans: %d,' % (m.group(1), ', '.join(new_opts), m.group(3), new_ans)
        out.append(src[last:m.start()]); out.append(rep); last = m.end()
        changed += 1
    out.append(src[last:])
    return ''.join(out), changed, skipped


def main():
    apply = '--apply' in sys.argv
    subjects = [a for a in sys.argv[1:] if not a.startswith('--')] or \
               ['economics', 'business', 'computer-science']
    grand = Counter(); tc = ts = 0
    for subj in subjects:
        for f in sorted(glob.glob(BASE + '/subjects/' + subj + '/*.html')):
            src = open(f, encoding='utf-8').read()
            if 'opts: [' not in src:
                continue
            new, c, s = process(src)
            tc += c; ts += s
            if apply and c:
                open(f, 'w', encoding='utf-8', newline='\n').write(new)
            grand.update(re.findall(r'ans: (\d)', new))
    tot = sum(grand.values()) or 1
    print('%s %d questions | skipped (explain names a position): %d'
          % ('APPLIED to' if apply else 'DRY-RUN would change', tc, ts))
    print('resulting ans distribution:', dict(sorted(grand.items())),
          '-> %.0f%% option A' % (100 * grand['0'] / tot))


if __name__ == '__main__':
    main()