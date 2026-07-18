# Authoring self-mark points (`markPoints`) — ALL subjects

**Read this before writing any exam question with a written/prose answer.**

**Platform standard (owner, 2026-07-18):** tick-the-mark-scheme self-marking is
THE marking model for **every subject**. Live in Computer Science, Additional
Maths and Spanish (all via `cs-lab/exam-widgets.js`); **Business and Economics
are to be migrated to it** (they currently use older marking). Any new subject
wires `/cs-lab/exam-widgets.js` before `/script.js` and authors `q.markPoints`.
Written for AI content builders.

**Mark each mark-scheme mark as its own tick — including sub-bullets.** When a
scheme point has sub-parts ("(a) fruit / cereals (1 each)"; "(c) …avoid… /
…because… / …bad for health…"), each creditable sub-part is its own point
inside the group, and the group `max` equals that part's tariff. Do not collapse
a 3-mark sentence into one tick — the student must be able to award exactly the
marks a real examiner would, no more, no less.

## What the student sees

After submitting a written answer, the student marks it **like an examiner**:
every creditable point appears as a tick-box, they tick what their answer
actually achieved, and the ticks add up to their recorded mark. They love this
because it teaches the mark scheme itself — so the ticks **must** award the
same marks a real examiner would.

## The one rule that matters

> **The tick list must be able to produce full marks for a correct answer,
> and only for a correct answer.**

Ask yourself: *"If a student writes a perfect answer, can they tick their way
to exactly `q.marks`? If they write half an answer, do they land on half?"*
If the answer to either is no, you must author `markPoints`.

## When you can skip `markPoints` (the default)

If the scheme is plainly **1 mark per bullet**, and the student is expected to
make *every* bullet they tick, the widget's fallback (parsing the mark
scheme's first `.marks-section` bullets, 1 mark each, capped at `q.marks`) is
already correct. Leave `markPoints` out.

✅ Safe examples:
- *"State two events in the fetch–execute cycle [2]"* — 7 bullets listed, 1
  mark each, cap 2. Student ticks the 2 they gave. Correct.
- *"Complete the table [4]"* — 4 bullets, one per cell, all four answered.

## When you MUST author `markPoints`

Any scheme where **one bullet is not worth exactly one mark**. These phrases
in a scheme are red flags — if you see them, stop and author `markPoints`:

| Phrase in the scheme | What it really means |
|---|---|
| "1 for naming each X, 1 for each matching purpose" | each X the student gives = **2** marks |
| "max 2 marks per benefit / per register / per answer space" | grouped: each item is its own mini-scheme |
| "1 mark each for benefit + application" | point + development pairs |
| "1 additional mark for development" | 2-mark chain, not 2 independent points |
| "mark in pairs" | grouped |

### The failure this prevents (a real bug, 2026-07-17)

*"Complete the table by writing the name of two registers and the purpose of
each"* **[4 marks]**, scheme: *"1 for naming each register, 1 for each matching
purpose"*. The scheme lists 4 bullets (PC, MAR, MDR, ACC) — but the student
only names **two** registers, and each is worth **2** marks. With the fallback
the student ticked the 2 registers they gave and scored **2/4** for a perfect
answer. The bullets were an *option list*, not a mark list.

## The shape

Two forms. Use the grouped one for anything compound.

```js
// FLAT — a simple list of independent points. Rarely needed (the fallback
// already does this); use it only to reword bullets more clearly for students.
markPoints: [
  'Says the CPU processes instructions',
  { text: 'Mentions the fetch–execute cycle', marks: 1 },
]
```

```js
// GROUPED — one group per THING THE STUDENT PRODUCED. This is the important one.
markPoints: {
  note: 'One sentence telling the student how to mark: what each group is, ' +
        'and any rule that changes the award (e.g. wrong name ⇒ no purpose mark).',
  groups: [
    {
      label: 'Your first register',   // student-facing; name it after THEIR answer
      max: 2,                          // cap for this group (the "max 2 per X" rule)
      points: [
        { text: 'Named a register used in the fetch–execute cycle (PC, MAR, MDR, ACC)', marks: 1 },
        { text: 'Gave a purpose that matches THAT register (says what it stores)', marks: 1 },
      ],
    },
    {
      label: 'Your second register', max: 2, points: [
        { text: 'Named a DIFFERENT register', marks: 1 },
        { text: 'Gave a purpose that matches that second register', marks: 1 },
      ],
    },
  ],
}
```

Marking maths: each group sums its ticked points → capped at `group.max` →
groups added together → capped at `q.marks`.

## Rules for writing the points

1. **Group by what the student wrote, not by what the scheme lists.** "Your
   first benefit" / "Your second benefit" — not "Speed" / "Security". The
   student picks any two; the groups are slots, and the *options* go inside
   the point text.
2. **`q.marks` must be reachable.** Sum the group maxes: it should equal
   `q.marks` (never less — a student who aces it must be able to hit full).
3. **One tick = one decision.** If a tick needs two independent judgements
   ("named it AND explained it"), split it into two points.
4. **Write points as questions the student can honestly answer about their own
   words.** "Gave a purpose that says what it STORES (not 'fetches')" beats
   "Purpose correct" — bake the accept/reject rule into the tick text.
5. **Put the refusal rules in the tick text or the `note`**, not only in the
   mark scheme below (e.g. "cost does NOT count", "if the register name is
   wrong, its purpose earns nothing", "an example from the extract, not any
   example").
6. **Never invent marks the scheme doesn't give.** The point structure must be
   traceable to the real scheme's wording.
7. **Levelled/banded answers (6/8-markers) don't use `markPoints`** — set
   `format: 'banded'` instead and the student picks a band + mark from the
   descriptors.

## Checklist before you ship a question

- [ ] Read the scheme's "How the marks are given" — does any red-flag phrase appear?
- [ ] Do the group maxes sum to `q.marks`?
- [ ] Could a perfect answer tick to exactly `q.marks`? Could a half answer land on half?
- [ ] Does each tick need only ONE judgement?
- [ ] Are the accept/reject rules visible in the tick text or `note`?

## Safety net

`cs-lab/exam-widgets.js` logs a console warning when a scheme *looks* compound
(matches the red-flag phrases) but has no `markPoints`. It cannot catch every
case — e.g. "4 bullets, 4 marks" looks fine but is wrong when the student only
answers two of them. **The checklist above is the real guard, not the warning.**

To audit a whole subject, mirror the script pattern used on 2026-07-17: strip
the scheme HTML to text, test it against the red-flag regex, and list any
question that matches without `markPoints` — then hand-review each hit (there
are false positives: "1 mark for each correct answer to a maximum of 2" is
genuinely 1-per-bullet and needs nothing).
