// ══════════════════════════════════════════════════════════════
// MOCK PAPER DATA — June 2023, OCR GCSE (9-1) Computer Science J277/02
// "Computational thinking, algorithms and programming" (source: OCR 704761
// question paper + 704883 mark scheme). Verbatim transcription used under
// the site's free-school-year content policy, served behind the auth gate
// (CS-CONTENT-PLAN.md D5).
//
// Shape + widget data-field conventions: see the header comment in the
// sibling file 2024-paper1.js (same contract) and 2024-paper2.js (adds the
// truthTable/traceTable/codeGaps/codeWrite conventions this file reuses).
// This paper does not need truthTable (its two truth tables are read-only
// context the student names a gate FOR, not fills in) or codeFunction (no
// question gives a fixed header/footer to complete between).
// ══════════════════════════════════════════════════════════════

window.MOCK_PAPERS = window.MOCK_PAPERS || {};
window.MOCK_PAPERS['2023-p2'] = {
  id: '2023-p2',
  title: 'June 2023 · Paper 2 — Computational thinking, algorithms and programming (J277/02)',
  minutes: 90,
  totalMarks: 80,
  sections: [
    {
      title: 'Section A',
      questions: [
        {
          num: 'Q1a',
          marks: 4,
          type: 'written',
          format: 'tickGrid',
          question: '<p>The table contains four statements about programming languages.</p><p>Tick (✓) one box in each row to identify whether each statement describes a low-level programming language or a high-level programming language.</p><table><tr><th>Statement</th><th>Low-level</th><th>High-level</th></tr><tr><td>The same language can be used on computers that use different hardware</td><td></td><td></td></tr><tr><td>It allows the user to directly manipulate memory</td><td></td><td></td></tr><tr><td>It allows the user to write English-like words</td><td></td><td></td></tr><tr><td>It always needs to be translated into object code or machine code</td><td></td><td></td></tr></table>',
          hint: 'Low-level code talks directly to the hardware/memory of ONE machine; high-level code is portable, reads like English, and always needs translating before it can run.',
          starter: 'Portable across hardware → High-level | Directly manipulates memory → Low-level | English-like words → High-level | Always needs translating → High-level',
          grid: { cols: ['Low-level', 'High-level'], rows: [
            { label: 'The same language can be used on computers that use different hardware', correct: [1] },
            { label: 'It allows the user to directly manipulate memory', correct: [0] },
            { label: 'It allows the user to write English-like words', correct: [1] },
            { label: 'It always needs to be translated into object code or machine code', correct: [1] }
          ]},
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO1 1b)</h5><ul>' +
            '<li>1 mark per row</li>' +
            '<li>The same language can be used on computers that use different hardware → <strong>High-level</strong></li>' +
            '<li>It allows the user to directly manipulate memory → <strong>Low-level</strong></li>' +
            '<li>It allows the user to write English-like words → <strong>High-level</strong></li>' +
            '<li>It always needs to be translated into object code or machine code → <strong>High-level</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>No mark if more than 1 tick for that row.</li>' +
            '<li>Allow other indications of choice (e.g. cross) as long as clear.</li>' +
            '</ul></div>',
          modelAnswer: 'Portable across hardware → High-level\n\nDirectly manipulates memory → Low-level\n\nEnglish-like words → High-level\n\nAlways needs translating → High-level'
        },
        {
          num: 'Q1b',
          marks: 1,
          type: 'written',
          format: 'codeWrite',
          question: '<p>The variables <code>num1</code> and <code>num2</code> store integers.</p><p>Write pseudocode to add the integers stored in <code>num1</code> and <code>num2</code>. Store the result in a variable with the identifier <code>total</code></p>',
          hint: 'One line: add the two variables together and assign the result to a new variable called total.',
          starter: 'total = num1 + num2',
          lines: 2,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO3 2b)</h5><ul>' +
            '<li><strong>total = num1 + num2</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow other logically valid responses that result in total storing the correct value. Accept other suitable assignment operators.</li>' +
            '<li>e.g. total = sum(num1, num2); total = num2 + num1; x = num1 + num2, total = x</li>' +
            '<li>Ignore any values given to the variable. Ignore capitalisation and minor misspelling. Ignore superfluous code that does not affect outcome.</li>' +
            '</ul></div>',
          modelAnswer: 'total = num1 + num2'
        },
        {
          num: 'Q1c(i)',
          marks: 1,
          type: 'written',
          format: 'codeGaps',
          question: '<p>Three incomplete pseudocode algorithms are given with a description of the purpose of each algorithm. Write the missing arithmetic operator for each algorithm.</p><p>Outputting 12 to the power of 2.</p><pre>print(12 ___1___ 2)</pre>',
          hint: 'You need the operator that means "raised to the power of" — a single symbol, not a word with spaces.',
          starter: '^',
          gaps: { code: 'print(12 ___1___ 2)', answers: ['^'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO2 1a)</h5><ul>' +
            '<li><strong>print(12 ^ 2)</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept ** or other sensible operator that indicates raising to a power.</li>' +
            '<li>If a pseudocode operator is given, it must be a single word/symbol (e.g. pow), not containing spaces.</li>' +
            '</ul></div>',
          modelAnswer: '^'
        },
        {
          num: 'Q1c(ii)',
          marks: 1,
          type: 'written',
          format: 'codeGaps',
          question: '<p>Working out if a number is odd or even.</p><pre>number = 53\nif number ___1___ 2 == 0 then\n   print("Even number")\nelse\n   print("Odd number")\nendif</pre>',
          hint: 'You need the operator that gives the REMAINDER after dividing by 2 — checking if that remainder is 0 tells you the number is even.',
          starter: 'MOD',
          gaps: { code: 'if number ___1___ 2 == 0 then', answers: ['MOD'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO2 1a)</h5><ul>' +
            '<li><strong>if number MOD 2 == 0 then</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept % or other sensible operator that indicates modulus.</li>' +
            '<li>If a pseudocode operator is given, it must be a single word/symbol (e.g. modulo), not containing spaces.</li>' +
            '</ul></div>',
          modelAnswer: 'MOD'
        },
        {
          num: 'Q1c(iii)',
          marks: 1,
          type: 'written',
          format: 'codeGaps',
          question: '<p>Finding the difference between two measurements.</p><pre>measurement1 = 300\nmeasurement2 = 100\ndifference = measurement1 ___1___ measurement2</pre>',
          hint: 'A "difference" between two values is found by subtracting one from the other.',
          starter: '-',
          gaps: { code: 'difference = measurement1 ___1___ measurement2', answers: ['-'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO2 1a)</h5><ul>' +
            '<li><strong>difference = measurement1 - measurement2</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept other sensible operator that indicates subtraction.</li>' +
            '<li>If a pseudocode operator is given, it must be a single word/symbol (e.g. minus), not containing spaces.</li>' +
            '</ul></div>',
          modelAnswer: '-'
        },
        {
          num: 'Q1d',
          marks: 3,
          type: 'written',
          format: 'traceTable',
          question: '<p>Read the following pseudocode algorithm:</p><pre>01  start = 3\n02  do\n03    print(start)\n04    start = start - 1\n05  until start == -1\n06  print("Finished")</pre><p>Complete the following trace table for the given algorithm.</p><table><tr><th>Line number</th><th>start</th><th>Output</th></tr></table>',
          hint: 'This is a do-until loop, so line 03 always runs at least once before the condition on line 05 is even checked. Trace start from 3 down to -1, one line at a time.',
          starter: 'Line 01: start=3 | Line 03: Output 3 | Line 04: start=2 | Line 03: Output 2 | Line 04: start=1 | Line 03: Output 1 | Line 04: start=0 | Line 03: Output 0 | Line 04: start=-1 | Line 06: Output Finished',
          trace: { columns: ['Line number', 'start', 'Output'], rows: [
            ['01', '3', null],
            ['03', null, '3'],
            ['04', '2', null],
            ['03', null, '2'],
            ['04', '1', null],
            ['03', null, '1'],
            ['04', '0', null],
            ['03', null, '0'],
            ['04', '-1', null],
            ['06', null, 'Finished']
          ]},
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO3 2c, 1 mark each)</h5><ul>' +
            '<li>start is set to 3 on line 01 and 3 is output on line 03.</li>' +
            '<li>2, 1 and 0 are output on the next 3 iterations, with start updated to 2, 1, 0, -1 on the correct line numbers.</li>' +
            '<li>Finished is output on line 06</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Ignore lines 02 and 05 in the answer unless these change or output any values.</li>' +
            '<li>Candidate may repeat the start value when unchanged — this is acceptable.</li>' +
            '<li>Penalise incorrect or missing line numbers or additional output once only, then follow through. This includes where a variable change and output appear on the same line.</li>' +
            '<li>-1 must not be output for the 2nd mark point.</li>' +
            '<li>Penalise missing or incorrect output once only for the 1st mark point, and follow through for missing or incorrect output for the 2nd mark point.</li>' +
            '<li>"Finished" may be with or without quotes. Ignore case or minor spelling error.</li>' +
            '<li>Max 2 marks if any incorrect output or changes to start.</li>' +
            '<li>Do not accept calculated values of start (e.g. 3-1).</li>' +
            '</ul></div>',
          modelAnswer: 'Line 01: start = 3\n\nLine 03: Output 3\n\nLine 04: start = 2\n\nLine 03: Output 2\n\nLine 04: start = 1\n\nLine 03: Output 1\n\nLine 04: start = 0\n\nLine 03: Output 0\n\nLine 04: start = -1\n\nLine 06: Output "Finished"'
        },
        {
          num: 'Q2a',
          marks: 2,
          type: 'written',
          question: '<p>This pseudocode algorithm totals all the numbers in the 0-indexed array <code>scores</code></p><pre>01  total = 0\n02  for scoreCount = 1 to scores.length - 1\n03      scores[scoreCount] = total + total\n04  next scoreCount\n05  print(total)</pre><p>The function <code>length</code> returns the number of elements in the array.</p><p>The algorithm contains several errors. Two types of errors in a program are syntax and logic errors.</p><p>State what is meant by a syntax error and a logic error.</p>',
          hint: 'A syntax error stops the program running at all (breaks the language rules); a logic error lets the program run but gives the wrong result.',
          starter: 'Syntax error: … Logic error: …',
          stubs: ['Syntax error', 'Logic error'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1 1a, 1 mark each)</h5><ul>' +
            '<li><strong>Syntax error:</strong> error in the rules/grammar (of the programming language) // (the) program does not (fully) run/translate/execute/start (BOD)</li>' +
            '<li><strong>Logic error:</strong> produces (an) incorrect/unexpected result/output // (the) program runs/does not crash</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Question asks for a definition. Examples may strengthen the response but are not acceptable by themselves.</li>' +
            '<li>Do not allow "error/problem in the code, does not work / does not do what designed/intended to do" for either — this applies to both.</li>' +
            '<li>"Error in the syntax" or "error in the logic" are not enough, even with examples.</li>' +
            '</ul></div>',
          modelAnswer: 'Syntax error: an error that breaks the rules/grammar of the programming language, which stops the program running or translating.\n\nLogic error: an error that produces an incorrect or unexpected result, but the program still runs without crashing.'
        },
        {
          num: 'Q2b',
          marks: 4,
          type: 'written',
          question: '<p>Identify <strong>two</strong> logic errors in the pseudocode algorithm from Question 2. Write the refined line to correct each error.</p><pre>01  total = 0\n02  for scoreCount = 1 to scores.length - 1\n03      scores[scoreCount] = total + total\n04  next scoreCount\n05  print(total)</pre>',
          hint: 'One error is in the loop bounds (element 0 of the array is never included); the other is in what line 03 actually calculates and stores.',
          starter: 'Line number: 02. Correction: for scoreCount = 0 to scores.length - 1 | Line number: 03. Correction: total = total + scores[scoreCount]',
          stubs: ['Line number (1st error) / Correction', 'Line number (2nd error) / Correction'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO3 2c, 1 mark for each line number correctly identified, 1 mark for each matching correction)</h5><ul>' +
            '<li>Line number: <strong>02</strong>. Correction: <strong>for scoreCount = 0 to scores.length - 1</strong></li>' +
            '<li>Line number: <strong>03</strong>. Correction: <strong>total = scores[scoreCount] + total</strong> // total = total + scores[scoreCount] // total += scores[scoreCount]</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Correction must match the line number given. If the wrong line number is given, do not mark the correction. If no line number is given, mark the correction only.</li>' +
            '<li>Do not penalise if the response removes "-1" from scores.length as long as it starts at 0. Do not penalise potential off-by-1 errors for looping (Python-style).</li>' +
            '<li>Do not penalise case or minor spelling errors as long as the intention is clear. Allow a description of the change that would be made (e.g. "change 1 to 0").</li>' +
            '<li>The first correction fixes the indexing error so element 0 is included (this could be done on line 03 instead, e.g. scores[scoreCount-1]). The second correction fixes the addition of total.</li>' +
            '<li>If both errors are fixed on line 03 alone, full marks should be given, e.g. total = total + scores[scoreCount-1]</li>' +
            '</ul></div>',
          modelAnswer: 'Line number: 02. Correction: for scoreCount = 0 to scores.length - 1 (was skipping element 0).\n\nLine number: 03. Correction: total = total + scores[scoreCount] (was overwriting an array element instead of accumulating the total).'
        },
        {
          num: 'Q3a',
          marks: 2,
          type: 'written',
          question: '<p>An insertion sort is one type of sorting algorithm. A student has written a pseudocode algorithm to perform an insertion sort on a 1D array <code>names</code>.</p><pre>names = ["Kareem", "Sarah", "Zac", "Sundip", "Anika"]\nfor count = 1 to names.length - 1\n    pos = count\n    while (pos > 0 and names[pos] < names[pos - 1])\n        temp = names[pos]\n        names[pos] = names[pos - 1]\n        names[pos - 1] = temp\n        pos = pos - 1\n    endwhile\nnext count</pre><p>Describe the purpose of the variable <code>temp</code> in the insertion sort pseudocode algorithm.</p>',
          hint: 'Think about why you cannot just write names[pos] = names[pos-1] straight away and then names[pos-1] = names[pos] — the first line would overwrite the value you still need for the second line, unless something holds onto it first.',
          starter: 'temp holds the value of names[pos] so it is not lost when …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO2 1b, 1 mark each)</h5><ul>' +
            '<li>Stores/holds data/value/name/names[pos] so (the value) can be changed/swapped/moved/overwritten/inserted without being lost.</li>' +
            '<li>(The stored value) will be assigned to names[pos-1]</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not allow answers that clearly refer to storing the position/index (or any other out-of-context data) for the first mark point — it is the name itself that is being stored, not the position. If unclear, give BOD.</li>' +
            '<li>e.g. do not allow "holds the values of the index / holds value for position of the name".</li>' +
            '<li>Allow follow-through for the second mark point.</li>' +
            '</ul></div>',
          modelAnswer: 'temp stores the value of names[pos] before it gets overwritten by names[pos-1], so that stored value is not lost — it is then assigned to names[pos-1] to complete the swap.'
        },
        {
          num: 'Q3b',
          marks: 2,
          type: 'written',
          question: '<p>An insertion sort contains a nested loop; a loop within a loop. In this pseudocode algorithm the outer loop is a count-controlled loop and the inner loop is a condition-controlled loop.</p><p>Explain why the inner loop needs to be a condition-controlled loop.</p>',
          hint: 'Ask yourself: before the algorithm runs, does it know in advance exactly how many swaps a single item will need to reach its correct position?',
          starter: 'The number of swaps needed is not known in advance, so the loop must keep running while/until a condition is met.',
          markPoints: {
            note: 'Two independent ideas, each worth 1 mark: why a fixed-count loop would not work here, and what a condition-controlled loop does instead (linked to this algorithm).',
            groups: [
              { label: 'Why it cannot be count-controlled', max: 1, points: [
                { text: 'Says we do not know in advance how many iterations/swaps are needed, or how many times the value will change position, or how many times a condition-controlled loop needs to run', marks: 1 } ] },
              { label: 'What the condition-controlled loop does here', max: 1, points: [
                { text: 'Explains a condition-controlled loop runs while/until a condition is true/false/met, applied to this algorithm (e.g. repeats while names[pos-1] is larger than names[pos] / while a further swap is needed; will swap until in the correct position; or that it is more efficient than iterating a fixed number of times)', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO2 1b, max 1 mark from each of the two ideas below)</h5><ul>' +
            '<li>Do not know how many iterations/swaps needed // do not know (at run time) how many times the value will change positions // do not know how many times a condition-controlled loop will need to run/execute</li>' +
            '<li>Condition-controlled loops run while/until a condition is true/is false/is met // repeats while value in [pos-1] is larger than value in [pos] // while (a further) swap needed // will swap value until in correct position // will swap whilst in incorrect position // more efficient than / does not need to iterate as many times as a count-controlled/for loop</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Max 1 mark from each section, 2 marks total.</li>' +
            '<li>Do not allow "while names are in the wrong order".</li>' +
            '<li>The second mark point must have reference to checking a condition/condition being met, not just having a condition.</li>' +
            '</ul></div>',
          modelAnswer: 'We do not know in advance how many swaps each value will need to reach its correct position, so a fixed-count loop would not work. A condition-controlled loop keeps swapping while names[pos-1] is larger than names[pos], stopping as soon as the value is in the correct place.'
        },
        {
          num: 'Q3c(i)',
          marks: 2,
          type: 'written',
          question: '<p>A bubble sort is another type of sorting algorithm.</p><p>Describe <strong>one</strong> difference between an insertion sort and a bubble sort.</p>',
          hint: 'Pick ONE difference and describe both sides of it — how insertion sort behaves AND how bubble sort behaves for that same feature (e.g. how each one moves values around, or which one is more efficient and why).',
          starter: 'Insertion sort … whereas bubble sort …',
          markPoints: {
            note: 'Both halves of the SAME difference must be given to score both marks — one side describing insertion sort, one side describing bubble sort.',
            groups: [
              { label: 'Insertion sort side of your difference', max: 1, points: [
                { text: 'Describes a correct insertion-sort behaviour matching your named difference (e.g. inserts/moves values into the correct position; starts on the 2nd value; builds a sorted partition from the start of the array; completes in one pass; more efficient/faster with fewer comparisons, especially on more scrambled data)', marks: 1 } ] },
              { label: 'Bubble sort side of your difference', max: 1, points: [
                { text: 'Describes the matching bubble-sort behaviour for the SAME difference (e.g. compares/swaps pairs of values; repeats while a swap has been made / needs multiple passes; moves the highest value up the array each pass; less efficient/slower with more comparisons)', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1 1b, 1 mark each for insertion and bubble sort, max 2)</h5><ul>' +
            '<li><strong>Insertion sort:</strong> inserts/moves values into correct position; inserts value once (then in correct position); stops when end of array reached // completes in one pass through the array; moves items down the array/left; start of array becomes sorted first; creates a sorted array within an array // has a sorted/unsorted partition/section/list; starts on 2nd value; more efficient/faster than bubble sort … because fewer iterations/comparisons (on average) … when data more scrambled</li>' +
            '<li><strong>Bubble sort:</strong> compares/swaps pairs of values; value is repeatedly moved/swapped (until in correct position); repeats if a swap has been made // needs multiple passes; will complete a final iteration once sorted (to check for no swaps needed); moves items up the array; end of array becomes sorted first; moves/bubbles the highest value to the top; less efficient/slower than insertion sort (on large sets of values) … more iterations/comparisons (on average) … when data more scrambled</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Answer must reference both bubble sort and insertion sort for 2 marks, except if the efficiency mark plus expansion is given.</li>' +
            '<li>Allow reference to big O for efficiency discussion. Only award the efficiency mark once, and only award "fewer iterations" once.</li>' +
            '<li>Do not accept "completes in one iteration" for insertion sort. Accept list/data/values etc. for array.</li>' +
            '<li>"When data more scrambled" only makes sense when discussing efficiency/speed — do not give marks for saying either can handle data that is more scrambled (they both can sort data however it is arranged).</li>' +
            '<li>Do not accept "bubble/insertion sort does not" for the second mark.</li>' +
            '</ul></div>',
          modelAnswer: 'Insertion sort inserts each value into its correct position as it goes, building up a sorted section at the start of the array, whereas bubble sort repeatedly compares and swaps pairs of adjacent values, needing multiple full passes through the array.'
        },
        {
          num: 'Q3c(ii)',
          marks: 2,
          type: 'written',
          question: '<p>Describe <strong>two</strong> similarities between an insertion sort and a bubble sort.</p>',
          hint: 'List two things they both do or both need — both produce a sorted list, both use loops, both compare/swap pairs of values, both need a temporary variable, and so on.',
          starter: '1. Both … 2. Both …',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1 1b, 1 mark each to max 2)</h5><ul>' +
            '<li>Both produce a sorted list/array</li>' +
            '<li>Both work in place/without duplicating data/without using divide and conquer</li>' +
            '<li>Both need a temporary variable</li>' +
            '<li>Both swap values</li>' +
            '<li>Both use loops/iteration/repeats, and both loops are nested/inside each other</li>' +
            '<li>Both (may) need multiple passes</li>' +
            '<li>Both use selection</li>' +
            '<li>Both work with an array/list data structure, and work from left to right</li>' +
            '<li>Both build up a sorted list one item at a time (after every pass)</li>' +
            '<li>Both compare (pairs of) values</li>' +
            '<li>Both are (typically) less efficient/slower than merge sort (or other sorting algorithms)</li>' +
            '<li>Both inefficient/slow for larger/unsorted lists // efficient for small/(nearly) sorted lists</li>' +
            '<li>Both start by comparing the first two values</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow reference to both sorting/putting items into order for the first mark point. "Allows sorting of numbers and strings" meets this too.</li>' +
            '<li>Allow answers relating to not needing additional memory. Allow "breaking into smaller lists" as divide and conquer.</li>' +
            '<li>If the answer is a general statement (e.g. "uses loops"), assume the candidate is talking about both algorithms doing this.</li>' +
            '</ul></div>',
          modelAnswer: '1. Both produce a fully sorted array/list by the end.\n\n2. Both compare and swap pairs of values, using a temporary variable to hold one value during the swap.'
        },
        {
          num: 'Q4a',
          marks: 3,
          type: 'written',
          question: '<p>A garden floodlight system uses inputs from sensors and switches to decide whether it should be turned on. The table shows the inputs into the system and the meaning of each input value:</p><table><tr><th>Letter</th><th>Input device</th><th>Input of 1</th><th>Input of 0</th></tr><tr><td>A</td><td>Motion sensor</td><td>Motion is detected</td><td>Motion is not detected</td></tr><tr><td>B</td><td>Light sensor</td><td>Light levels indicate it is daytime</td><td>Light levels indicate it is nighttime</td></tr><tr><td>C</td><td>Light switch</td><td>The switch is turned on</td><td>The switch is turned off</td></tr></table><p>The floodlight (Q) is designed to be on (Q = 1) when the switch is turned on and the motion sensor detects motion at nighttime.</p><p>Draw a logic diagram for the floodlight.</p><p><em>This is a drawing question — sketch the circuit on paper using correct gate symbols, then describe your completed circuit below as a check of your answer.</em></p><pre>Inputs: A, B, C          Output: Q</pre>',
          hint: 'Nighttime means B = 0, so you need a NOT gate on B first. Then combine that with A (motion) and C (switch) using two 2-input AND gates.',
          starter: 'A → (one AND input). B → NOT gate → (other AND input of a second AND gate, alongside C). Combine both AND gates → Q.',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO3 2a, 1 mark each, max 2 if not a fully correct circuit)</h5><ul>' +
            '<li>NOT B</li>' +
            '<li>AND gate with A / C as one direct input…</li>' +
            '<li>…second AND gate with the other (unused) A / C as a direct input and the output of the previous stage as the other input</li>' +
            '</ul><p>Fully correct circuit is any of:</p><ul>' +
            '<li>Q = (A AND NOT B) AND C</li>' +
            '<li>Q = A AND (NOT B AND C)</li>' +
            '<li>Q = (A AND C) AND NOT B</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Shapes of logic gates must be correct. The NOT gate must include a circle for inversion; no other gates should include a circle.</li>' +
            '<li>AND gates must have two different inputs; the NOT gate must have one input. All gates must have one output.</li>' +
            '<li>A correct system will always have NOT B and two other AND gates correctly joined. Accept alternative systems that produce the correct output.</li>' +
            '<li>Accept (BOD) a three-input AND gate for the 2nd and 3rd mark points if used correctly.</li>' +
            '<li>OK if inputs/outputs are not joined up to A/B/C/Q as long as the intention is clear. If lines cross on the diagram, give BOD.</li>' +
            '<li>If (A AND C) AND NOT B is drawn, allow NOT B as the first input for the 3rd mark point.</li>' +
            '</ul></div>',
          modelAnswer: 'B feeds into a NOT gate (giving NOT B, i.e. nighttime). A feeds directly into a 2-input AND gate along with the output of a second AND gate that combines NOT B and C. Equivalently: Q = (A AND NOT B) AND C.'
        },
        {
          num: 'Q4b',
          marks: 2,
          type: 'written',
          question: '<p>Identify the logic gates for truth table 1 and truth table 2.</p><p>Truth table 1:</p><table><tr><th>A</th><th>B</th><th>Output</th></tr><tr><td>0</td><td>0</td><td>0</td></tr><tr><td>0</td><td>1</td><td>1</td></tr><tr><td>1</td><td>0</td><td>1</td></tr><tr><td>1</td><td>1</td><td>1</td></tr></table><p>Logic gate 1: .......................................................</p><p>Truth table 2:</p><table><tr><th>A</th><th>B</th><th>Output</th></tr><tr><td>0</td><td>0</td><td>0</td></tr><tr><td>0</td><td>1</td><td>0</td></tr><tr><td>1</td><td>0</td><td>0</td></tr><tr><td>1</td><td>1</td><td>1</td></tr></table><p>Logic gate 2: .......................................................</p>',
          hint: 'Table 1 outputs 1 whenever EITHER input is 1 — that is one specific gate. Table 2 only outputs 1 when BOTH inputs are 1 — that is a different gate.',
          starter: 'Logic gate 1: OR | Logic gate 2: AND',
          stubs: ['Logic gate 1', 'Logic gate 2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO2 1a, 1 mark each)</h5><ul>' +
            '<li>Logic gate 1: <strong>OR</strong></li>' +
            '<li>Logic gate 2: <strong>AND</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow A OR B // B OR A for logic gate 1. Allow A AND B // B AND A for logic gate 2.</li>' +
            '<li>If a logic statement is provided with multiple gates (e.g. A OR B AND C) this is incorrect.</li>' +
            '<li>Allow use of symbols (e.g. ∨, + for OR; ∧, . for AND). Allow correct drawing of the logic gates instead of naming them.</li>' +
            '</ul></div>',
          modelAnswer: 'Logic gate 1: OR\n\nLogic gate 2: AND'
        },
        {
          num: 'Q5a(i)',
          marks: 2,
          type: 'written',
          question: '<p>Charlie is developing an adding game. The rules of the game are:</p><ul><li>the player is asked 3 addition questions</li><li>each question asks the player to add together two random whole numbers between 1 and 10 inclusive</li><li>if the player gets the correct answer, 1 is added to their score</li><li>at the end of the game their score is displayed.</li></ul><p>Charlie has been told that the game will need to be tested before giving it to the players.</p><p>Explain why programs should be tested before use.</p>',
          hint: 'Give two DIFFERENT reasons, e.g. what testing checks FOR (bugs, requirements) and what happens as a RESULT of testing (fixes, a more robust program).',
          starter: '1. … 2. …',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1 1b, 1 mark each to max 2)</h5><ul>' +
            '<li>Check the program works (as intended) // meets user requirements // gives the correct output/result</li>' +
            '<li>Find/detect/check for errors/bugs</li>' +
            '<li>Check the program does not crash // is robust // executes/runs</li>' +
            '<li>To try and break the program // destructive testing</li>' +
            '<li>Test for/improve usability/user experience/performance // check user feedback is suitable</li>' +
            '<li>Allow any errors to be fixed // make changes/improvements as a result of testing</li>' +
            '<li>Ensure no problems/issues (fixed when released)</li>' +
            '<li>Defensive design considerations / anticipating misuse / so it cannot be misused</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow answers that explain what would happen if the program were not tested (e.g. "there might be bugs").</li>' +
            '</ul></div>',
          modelAnswer: '1. To find and fix any bugs before players use the game.\n\n2. To check the program meets the requirements and gives the correct output every time.'
        },
        {
          num: 'Q5a(ii)',
          marks: 2,
          type: 'written',
          question: '<p>Complete the table by naming and describing <strong>one</strong> type of test that should be used on Charlie’s program before releasing it.</p><table><tr><th>Test type</th><th>Description</th></tr><tr><td></td><td></td></tr></table>',
          hint: 'Name ONE type of test (e.g. final/terminal, iterative, normal, boundary, erroneous, black-box, white-box) and describe what it actually checks — don’t just repeat the name.',
          starter: 'Test type: … Description: …',
          stubs: ['Test type', 'Description'],
          markPoints: {
            note: 'Both parts describe the SAME test type — a name with no matching description, or a description that just repeats the name, only earns the first mark.',
            groups: [
              { label: 'Your test type', max: 2, points: [
                { text: 'Named a suitable type of test (e.g. final/terminal testing, iterative/incremental testing, normal testing, boundary/extreme testing, invalid/erroneous testing, black-box testing, white-box testing)', marks: 1 },
                { text: 'Gave a description that matches the named type and adds real detail, not just repeating the name (e.g. "completed at the end of development" / "tests data on the edge of what is acceptable")', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 AO1 1a, 1 AO2 1b — 1 mark for name, 1 mark for matching description)</h5><ul>' +
            '<li><strong>Final/terminal testing</strong> — completed at the end of development/before release, to test the product as a whole</li>' +
            '<li><strong>Iterative/incremental testing</strong> — completed during development, after each module is completed, testing a module in isolation</li>' +
            '<li><strong>Normal testing</strong> — test using data that should be accepted/is expected to work/pass</li>' +
            '<li><strong>Boundary/extreme testing</strong> — test using data on the edge of being acceptable/unacceptable, or the highest/lowest value</li>' +
            '<li><strong>Invalid/erroneous testing</strong> — test using data that should be rejected/is not acceptable/causes an error</li>' +
            '<li>Allow: <strong>Black box testing</strong> — testing without access/knowledge of a system’s workings; <strong>White box testing</strong> — testing with access/knowledge of a system’s workings</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow other sensible descriptive names for testing. The description must match the test type.</li>' +
            '<li>Must be a description, not just an example — but an example may support the description.</li>' +
            '<li>Do not accept descriptions that simply repeat the type of test without further clarification (e.g. "boundary, testing the boundary"). Do not accept examples of validation (e.g. type test, range check).</li>' +
            '<li>"Data that is not expected" is not enough for invalid/erroneous unless clarified.</li>' +
            '</ul></div>',
          modelAnswer: 'Test type: Boundary testing\n\nDescription: uses data right on the edge of what is acceptable, e.g. the highest or lowest value the game allows, to check the program handles it correctly.'
        },
        {
          num: 'Q5a(iii)',
          marks: 4,
          type: 'written',
          question: '<p>Complete the table by identifying and describing <strong>two</strong> features of an IDE that can be used when testing a program.</p><table><tr><th>Feature</th><th>Description</th></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table>',
          hint: 'Pick two DIFFERENT IDE features (e.g. debugger, breakpoints, stepping, variable watch, error reporting, run-time/output window) and describe what each one actually does — a description must say more than the name already does.',
          starter: 'Feature 1: … Description: … | Feature 2: … Description: …',
          stubs: ['Feature 1 name', 'Feature 1 description', 'Feature 2 name', 'Feature 2 description'],
          markPoints: {
            note: 'One group per feature you named. A description that just restates the feature’s name earns the name mark only, not the description mark.',
            groups: [
              { label: 'Your first IDE feature', max: 2, points: [
                { text: 'Named a feature of an IDE (e.g. translator/compiler/interpreter, run-time environment/output window, error reporting/diagnostics, debugger, stepping, variable watch, breakpoints, text/code editor, pretty printing/keyword highlighting, keyword completion)', marks: 1 },
                { text: 'Gave a description that adds real detail beyond the feature’s name', marks: 1 } ] },
              { label: 'Your second IDE feature', max: 2, points: [
                { text: 'Named a DIFFERENT IDE feature', marks: 1 },
                { text: 'Gave a matching description for that second feature', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO2 1b, 1 mark for feature + 1 mark for matching description, per feature)</h5><ul>' +
            '<li><strong>Translator/compiler/interpreter</strong> — converts to low-level/machine code, allows the program to be executed/run, produces an executable file (compiler only), stops execution when an error is found (interpreter only)</li>' +
            '<li><strong>Run-time environment/output window</strong> — allows program/code to be run/executed, shows the output of the program/code</li>' +
            '<li><strong>Error reporting/diagnostics</strong> — identifies location/detail of errors, suggests fixes</li>' +
            '<li><strong>Debugger</strong> — finds errors; <strong>Stepping</strong> — executes/runs the program line by line; <strong>Variable watch</strong> — see the contents/data held in variables; <strong>Break points</strong> — allow the program to stop at a chosen/set position</li>' +
            '<li><strong>Text/code editor</strong> — allows program code to be written/entered/changed, allows errors to be fixed</li>' +
            '<li><strong>Pretty printing // keyword highlighting</strong> — allows keywords/variables to be coloured/identified; <strong>Keyword completion // syntax suggestion</strong> — suggests code/syntax when the first part is entered</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow other sensible names for features. The description must add more than is given in the identification of the feature, e.g. "keyword highlighting, highlights keywords" is 1 mark for the feature only.</li>' +
            '<li>If compiler and interpreter are given as two distinct features, allow both (with suitable descriptions). Do not allow translator AND compiler/interpreter as two separate features.</li>' +
            '<li>The description must match the feature. "Finding errors" is not enough for a description of error reporting.</li>' +
            '<li>Allow sensible references to AI where appropriate, with a sensible description of use. Allow other sensible features of an IDE (e.g. line numbering, auto indent, collapsed blocks) with a suitable description.</li>' +
            '</ul></div>',
          modelAnswer: 'Feature 1: Debugger. Description: lets you step through the code line by line and inspect the current value of every variable, to help find where a bug happens.\n\nFeature 2: Error reporting / diagnostics. Description: identifies the line and type of an error when the program fails to run, and often suggests a fix.'
        },
        {
          num: 'Q5b',
          marks: 6,
          type: 'written',
          question: '<p>Validating inputs can reduce errors when a program is being run.</p><p>Identify <strong>two</strong> methods of validation and explain how they can be used on this game.</p><p>Validation method 1 .................................................. Use ...........................................................................................................</p><p>Validation method 2 .................................................. Use ...........................................................................................................</p>',
          hint: 'The rules say answers are whole numbers between 1 and 10 added together, and the player types in an answer — think about what checks would actually make sense for THAT answer, e.g. is it a number, and is it a sensible size.',
          starter: 'Validation method 1: Type check. Use: … | Validation method 2: Range check. Use: …',
          stubs: ['Validation method 1 / Use', 'Validation method 2 / Use'],
          markPoints: {
            note: 'One group per validation method — each method can earn up to 3 marks: naming it, explaining how the check applies to THIS game, and giving a concrete example/program code.',
            groups: [
              { label: 'Your first validation method', max: 3, points: [
                { text: 'Named a suitable validation method (e.g. range check, type check, presence check, length check, format check, look-up/table check)', marks: 1 },
                { text: 'Explained how the check applies to THIS game (e.g. checks the input is between sensible limits, or is a whole number, or is not blank) — not just repeating the name of the check', marks: 1 },
                { text: 'Gave a concrete example specific to this game (an example value/range, or actual/described program code)', marks: 1 } ] },
              { label: 'Your second validation method', max: 3, points: [
                { text: 'Named a DIFFERENT validation method', marks: 1 },
                { text: 'Explained how that second check applies to THIS game', marks: 1 },
                { text: 'Gave a concrete example specific to this game for that second method', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 6 marks (4 AO2 1b, 2 AO1 1a — 1 mark for method, 1 mark to max 2 for each use)</h5><ul>' +
            '<li><strong>Range check</strong> — checks upper/max, lower/min boundaries; makes sure the player’s answer/input is between sensible limits (e.g. 20 or less, between 2 and 20 inclusive) // not negative; by example of program code</li>' +
            '<li><strong>Type check</strong> — makes sure the data input is of the correct data type; makes sure the answer/input is an integer (or equivalent, e.g. whole number)</li>' +
            '<li><strong>Presence check</strong> — makes sure a value is input/not blank; reference to the answer/input; by example of program code</li>' +
            '<li><strong>Length check</strong> — limits the number of characters // checks maximum/minimum string length; the answer/input must be 1 or 2 characters</li>' +
            '<li><strong>Format check</strong> — makes sure the data input follows a set pattern; checks the answer/input consists of only 1 or 2 numeric digits; by example of program code</li>' +
            '<li><strong>Look-up/table check</strong> — makes sure the data input is one from an allowed set of values; checks that the answer/input is one of [2, 3…20] inclusive; by example of program code</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Validation must be applied to the rules of the game as given; do not accept uses related to input not asked for (e.g. names, passwords).</li>' +
            '<li>Do not accept uses that simply repeat the name of the check (e.g. "range check, checks a range of numbers").</li>' +
            '<li>For a range check, values must be sensible (e.g. 1 to 50), and allow an input of 2 to 20. Do not allow 1 / 10 by itself (the answer could be over this).</li>' +
            '<li>For a length check, it must be clear that the string version of the input data is being checked to award the use marks.</li>' +
            '<li>Accept alternative names or descriptions (e.g. existence check, boundary check) but the name of the check must be sensible. Mark each answer as a whole, ignore the method/use headings.</li>' +
            '<li>Do not accept defensive design elements (e.g. input sanitisation, authentication). Examples of program code can be actual code (e.g. if inp&gt;=2 and inp&lt;=20) or identification of the technique (e.g. "use an IF statement to limit values to between 1 and 20"). Do not accept code that just shows casting.</li>' +
            '</ul></div>',
          modelAnswer: 'Validation method 1: Type check. Use: makes sure the answer entered is a whole number, e.g. checking int(answer) does not raise an error before comparing it to the correct sum.\n\nValidation method 2: Range check. Use: since two numbers between 1 and 10 are added, checks the answer entered is between 2 and 20 inclusive before treating it as a sensible attempt, e.g. if answer >= 2 and answer <= 20 then …'
        },
        {
          num: 'Q5c',
          marks: 6,
          type: 'written',
          format: 'codeWrite',
          question: '<p>Write an algorithm to play this game. The rules are repeated from the start of the question here:</p><ul><li>the player is asked 3 addition questions</li><li>each question asks the player to add together two random whole numbers between 1 and 10 inclusive</li><li>if the player gets the correct answer, 1 is added to their score</li><li>at the end of the game their score is displayed.</li></ul>',
          hint: 'Structure it in the same order as the bullets: initialise a score before any loop, then repeat 3 times generating two random numbers, asking for the sum, checking it, and updating the score — then print the score once at the end.',
          starter: 'score = 0\nfor count = 1 to 3\n   num1 = random(1, 10)\n   num2 = random(1, 10)\n   ans = input("What is " + num1 + " + " + num2 + "?")\n   if ans == num1 + num2 then\n      score = score + 1\n   endif\nnext count\nprint("You scored " + score)',
          lines: 12,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 6 marks (AO3 2b, 1 mark each to max 6)</h5><ul>' +
            '<li>Initialise/declare score (to zero) before use, outside of any loop</li>' +
            '<li>Generates 2 random numbers between 1 and 10</li>' +
            '<li>Inputs an answer from the user, displaying suitable numbers</li>' +
            '<li>Checks if the input is the correct answer…</li>' +
            '<li>…if correct, adds 1 to score</li>' +
            '<li>Repeats the above 3 times (for the bullet points attempted)</li>' +
            '<li>Outputs the score after a reasonable attempt at counting</li>' +
            '</ul><pre>score = 0\nfor count = 1 to 3\n   num1 = random(1, 10)\n   num2 = random(1, 10)\n   ans = input("What is " +num1 +  " + " + num2 + "?")\n   if ans = num1 + num2 then\n      score = score + 1\n   end if\nnext count\nprint("You scored " + score)</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>No need to cast data to string/integer.</li>' +
            '<li>If random numbers are chosen, the input-checking mark point must use these. If no random numbers are chosen, allow manually setting values.</li>' +
            '<li>The "repeats 3 times" mark point can be awarded for either a loop repeating 3 times or the same code written out 3 times.</li>' +
            '<li>The "if correct, adds 1 to score" mark point can be given follow-through if a sensible attempt is made at the correctness check.</li>' +
            '<li>Do not award the "repeats 3 times" mark point if the same numbers are used for every question — new values must be picked each time.</li>' +
            '<li>Do not penalise potential off-by-1 errors for looping (Python-style) or random number generation.</li>' +
            '</ul></div>',
          modelAnswer: 'score = 0\nfor count = 1 to 3\n   num1 = random(1, 10)\n   num2 = random(1, 10)\n   ans = input("What is " + num1 + " + " + num2 + "?")\n   if ans == num1 + num2 then\n      score = score + 1\n   endif\nnext count\nprint("You scored " + score)'
        }
      ]
    },
    {
      title: 'Section B — we advise you to spend at least 40 minutes on this section. Some questions require you to respond using either the OCR Exam Reference Language or a high-level programming language you have studied; these are clearly shown.',
      questions: [
        {
          num: 'Q6a',
          marks: 4,
          type: 'written',
          format: 'tickGrid',
          question: '<p>OCR Security Services is a company that installs intruder alarm systems in commercial buildings. The systems use a computer that is connected to the door sensors and window sensors.</p><p>The following data is stored in the system:</p><table><tr><th>Data stored</th><th>Variable identifier</th><th>Example data</th></tr><tr><td>The user’s name</td><td><code>UserName</code></td><td>Admin123</td></tr><tr><td>A telephone number to call when the alarm is activated</td><td><code>EmergencyPhoneNumber</code></td><td>+449999999999</td></tr><tr><td>Whether a door sensor is activated</td><td><code>DoorSensorActive</code></td><td>True</td></tr><tr><td>Whether a window sensor is activated</td><td><code>WindowSensorActive</code></td><td>True</td></tr><tr><td>A timer that counts, to the nearest second, how long a door sensor has been activated</td><td><code>DoorActiveTime</code></td><td>100</td></tr><tr><td>A timer that counts, to the nearest second, how long a window sensor has been activated</td><td><code>WindowActiveTime</code></td><td>100</td></tr><tr><td>Whether the system is armed</td><td><code>SystemArmed</code></td><td>True</td></tr><tr><td>Whether the system is in test mode</td><td><code>TestModeActive</code></td><td>True</td></tr></table><p>Below is a table showing some variables within the program. Tick (✓) one box in each row to identify the most appropriate data type for each variable.</p><table><tr><th>Variable</th><th>Boolean</th><th>Char</th><th>String</th><th>Integer</th><th>Real</th></tr><tr><td><code>UserName</code></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td><code>EmergencyPhoneNumber</code></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td><code>DoorSensorActive</code></td><td></td><td></td><td></td><td></td><td></td></tr><tr><td><code>DoorActiveTime</code></td><td></td><td></td><td></td><td></td><td></td></tr></table>',
          hint: 'A phone number is stored as text (it has a leading + and is never used in arithmetic), True/False values are Boolean, and a whole-number timer is an Integer.',
          starter: 'UserName → String | EmergencyPhoneNumber → String | DoorSensorActive → Boolean | DoorActiveTime → Integer',
          grid: { cols: ['Boolean', 'Char', 'String', 'Integer', 'Real'], rows: [
            { label: 'UserName', correct: [2] },
            { label: 'EmergencyPhoneNumber', correct: [2] },
            { label: 'DoorSensorActive', correct: [0] },
            { label: 'DoorActiveTime', correct: [3] }
          ]},
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO3 2a, 1 mark for each row)</h5><ul>' +
            '<li>UserName → <strong>String</strong></li>' +
            '<li>EmergencyPhoneNumber → <strong>String</strong></li>' +
            '<li>DoorSensorActive → <strong>Boolean</strong></li>' +
            '<li>DoorActiveTime → <strong>Integer</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>No mark if more than 1 tick on a row.</li>' +
            '<li>Allow other indications of choice (e.g. cross) as long as clear.</li>' +
            '</ul></div>',
          modelAnswer: 'UserName → String\n\nEmergencyPhoneNumber → String\n\nDoorSensorActive → Boolean\n\nDoorActiveTime → Integer'
        },
        {
          num: 'Q6b',
          marks: 4,
          type: 'written',
          format: 'codeWrite',
          question: '<p>The alarm has an algorithm that decides whether to sound the alarm by checking the data that is stored in the following three variables.</p><ul><li><code>SystemArmed</code></li><li><code>DoorSensorActive</code></li><li><code>WindowSensorActive</code></li></ul><p>The alarm will only sound when the alarm has been activated <strong>and</strong> one or both of the door and window sensors are activated. When the system needs to sound the alarm it calls the pre-written procedure <code>SoundAlarm()</code></p><p>Write a program that checks the data in the variables and calls <code>SoundAlarm()</code> when appropriate.</p><p>You must use <strong>either</strong>:</p><ul><li>OCR Exam Reference Language, or</li><li>A high-level programming language that you have studied.</li></ul>',
          hint: 'One selection statement: check SystemArmed is true AND (DoorSensorActive is true OR WindowSensorActive is true), and only call SoundAlarm() inside that combined check.',
          starter: 'if SystemArmed then\n  if DoorSensorActive then\n    SoundAlarm()\n  else if WindowSensorActive then\n    SoundAlarm()\n  endif\nendif',
          lines: 8,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO3 2b, 1 mark each)</h5><ul>' +
            '<li>Attempt at using selection / condition-controlled loop</li>' +
            '<li>Checking if system armed // while system armed</li>' +
            '<li>If Door Sensor active OR Window Sensor active (both checks required)</li>' +
            '<li>Calling SoundAlarm correctly</li>' +
            '</ul><pre>Example answer 1\nif SystemArmed then\n   if DoorSensorActive then\n      SoundAlarm()\n   else if WindowSensorActive then\n      SoundAlarm()\n  endif\nendif\n\nExample answer 3\nif SystemArmed and (DoorSensorActive or WindowSensorActive) then\n   SoundAlarm()\nendif</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Selection could be done using an IF statement, CASE statement or any other sensible valid method.</li>' +
            '<li>Allow reference to AlarmActivated or equivalent instead of SystemArmed. Ignore any inputs or modification of variables.</li>' +
            '<li>Allow True/False as strings. Allow checking against strings (e.g. if SystemArmed == "active"). Allow checking armed/disarmed for the 2nd and 3rd mark points.</li>' +
            '<li>Only award the 4th mark point if SoundAlarm is correctly called/not called in every situation. If issues on previous lines (e.g. lack of brackets where needed) mean this is not the case, do not award it — e.g. "if SystemArmed and DoorSensorActive or WindowSensorActive then" is not logically valid (it sounds the alarm when not armed if the window sensor is active).</li>' +
            '<li>Checking could be done by evaluating the variable directly (if SystemArmed) or by comparison (if SystemArmed == True).</li>' +
            '</ul></div>',
          modelAnswer: 'if SystemArmed then\n  if DoorSensorActive then\n    SoundAlarm()\n  else if WindowSensorActive then\n    SoundAlarm()\n  endif\nendif'
        },
        {
          num: 'Q6c(i)',
          marks: 1,
          type: 'written',
          question: '<p>The alarm system can also have motion sensors. Each type of sensor has a code. The code for each sensor is given in the table:</p><table><tr><th>Code</th><th>Sensor</th></tr><tr><td>MS</td><td>Motion sensor</td></tr><tr><td>DS</td><td>Door sensor</td></tr><tr><td>WS</td><td>Window sensor</td></tr></table><p>A program is written to reset the sensors. The program asks the user to enter the code for the sensor they want to reset, calls the prewritten function <code>CheckSensorCode()</code> to check whether the code entered is a valid code, and reads the sensor number as input if the code is valid, calling <code>ResetSensor()</code> for the sensor.</p><pre>01  sensorType = input("Enter code of the type of sensor to reset")\n02  if(CheckSensorCode(sensorType)) then\n03      sensorNumber = input("Please input the number of the sensor to reset")\n04      sensorID = sensorType + sensorNumber\n05      ResetSensor(sensorID)\n06  endif</pre><p>Give the line number where there is concatenation.</p>',
          hint: 'Concatenation joins two pieces of text together with + — look for the line that builds one string out of two others.',
          starter: 'Line 04',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO3 1)</h5><ul>' +
            '<li><strong>Line 04</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Only line 04 combines sensorType and sensorNumber with +, so only line 04 is accepted.</li>' +
            '</ul></div>',
          modelAnswer: 'Line 04'
        },
        {
          num: 'Q6c(ii)',
          marks: 1,
          type: 'written',
          question: '<p>Give the identifier of a variable used in the program shown in the previous part (the sensor-reset program).</p>',
          hint: 'Any one of the three variable names in the code will do.',
          starter: 'sensorType',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO3 1)</h5><ul>' +
            '<li>1 mark from: <strong>sensorType</strong> // <strong>sensorNumber</strong> // <strong>sensorID</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not penalise case, spacing or minor misspellings.</li>' +
            '</ul></div>',
          modelAnswer: 'sensorType'
        },
        {
          num: 'Q6c(iii)',
          marks: 1,
          type: 'written',
          question: '<p>Identify the data type of the data returned by the function <code>CheckSensorCode()</code> in the sensor-reset program.</p>',
          hint: 'The function is used directly as the condition of an if statement, so it must return one of two values: true or false.',
          starter: 'Boolean',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO3 1)</h5><ul>' +
            '<li><strong>Boolean</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Ignore minor misspelling. Accept "Bool".</li>' +
            '</ul></div>',
          modelAnswer: 'Boolean'
        },
        {
          num: 'Q6c(iv)',
          marks: 1,
          type: 'written',
          question: '<p>Give the line number that contains a function call in the sensor-reset program.</p><pre>01  sensorType = input("Enter code of the type of sensor to reset")\n02  if(CheckSensorCode(sensorType)) then\n03      sensorNumber = input("Please input the number of the sensor to reset")\n04      sensorID = sensorType + sensorNumber\n05      ResetSensor(sensorID)\n06  endif</pre>',
          hint: 'input() and CheckSensorCode() and ResetSensor() are all function calls — any one line number that uses one of them is accepted.',
          starter: 'Line 02',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO3 1)</h5><ul>' +
            '<li>1 mark from: <strong>Line 01</strong> // <strong>Line 02</strong> // <strong>Line 03</strong> // <strong>Line 05</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Any one of the listed lines is accepted.</li>' +
            '</ul></div>',
          modelAnswer: 'Line 02'
        },
        {
          num: 'Q6c(v)',
          marks: 2,
          type: 'written',
          question: '<p>Identify <strong>two</strong> programming constructs that have been used in the sensor-reset program.</p><pre>01  sensorType = input("Enter code of the type of sensor to reset")\n02  if(CheckSensorCode(sensorType)) then\n03      sensorNumber = input("Please input the number of the sensor to reset")\n04      sensorID = sensorType + sensorNumber\n05      ResetSensor(sensorID)\n06  endif</pre>',
          hint: 'There are exactly two constructs in this program: the lines just run one after another (one construct), and there is a single if statement (another construct).',
          starter: '1. Sequence 2. Selection',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO3 1, 1 mark each)</h5><ul>' +
            '<li><strong>Selection</strong></li>' +
            '<li><strong>Sequence</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Ignore minor spelling errors/differences. Do not accept examples (e.g. "IF").</li>' +
            '</ul></div>',
          modelAnswer: '1. Sequence\n\n2. Selection'
        },
        {
          num: 'Q6d',
          marks: 3,
          type: 'written',
          format: 'codeWrite',
          question: '<p>The alarm system has a log that stores a record each time a sensor is triggered. This is called an event. The record format is given in the table:</p><table><tr><th>Fieldname</th><th>Description</th></tr><tr><td><code>Date</code></td><td>The date the event happened</td></tr><tr><td><code>SensorID</code></td><td>The sensor that was activated</td></tr><tr><td><code>SensorType</code></td><td>The type of sensor that was activated – Door, Motion or Window</td></tr><tr><td><code>Length</code></td><td>The number of seconds the sensor was triggered (to the nearest second)</td></tr></table><p>The log is stored in a database table called <code>events</code>. The current contents of <code>events</code> is shown:</p><table><tr><th>Date</th><th>SensorID</th><th>SensorType</th><th>Length</th></tr><tr><td>05/02/2023</td><td>WS2</td><td>Window</td><td>38</td></tr><tr><td>05/02/2023</td><td>MS1</td><td>Motion</td><td>2</td></tr><tr><td>06/02/2023</td><td>DS3</td><td>Door</td><td>1</td></tr><tr><td>06/02/2023</td><td>MS2</td><td>Motion</td><td>3</td></tr><tr><td>06/02/2023</td><td>MS1</td><td>Motion</td><td>2</td></tr><tr><td>07/02/2023</td><td>WS1</td><td>Window</td><td>24</td></tr><tr><td>07/02/2023</td><td>DS1</td><td>Door</td><td>1</td></tr></table><p>Write an SQL statement to display the sensor IDs of the door sensors that have been triggered for more than 20 seconds.</p>',
          hint: 'Select the SensorID column, from the events table, where the SensorType is "Door" and the Length is greater than 20 — both conditions joined with AND.',
          starter: 'SELECT SensorID\nFROM events\nWHERE SensorType = "Door" AND Length > 20',
          lines: 6,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO3 2c, 1 mark each)</h5><ul>' +
            '<li>SELECT SensorID // SELECT *</li>' +
            '<li>FROM events</li>' +
            '<li>WHERE Length &gt; 20 AND SensorType = "Door" // WHERE SensorType = "Door" AND Length &gt; 20</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Max 2 marks if out of order or anything extra affects the output.</li>' +
            '<li>The SELECT clause can select multiple fields as long as SensorID is included.</li>' +
            '<li>Ignore case. Only penalise spaces if obvious. Field names must be correct.</li>' +
            '<li>"Door" must be in quotation marks for the WHERE mark point. Allow quotation marks for field names and the table name.</li>' +
            '<li>The WHERE clause can use == or = for equivalence. Allow alternative WHERE clauses that are logically correct (e.g. WHERE Length &gt;= 21).</li>' +
            '</ul></div>',
          modelAnswer: 'SELECT SensorID\nFROM events\nWHERE SensorType = "Door" AND Length > 20'
        },
        {
          num: 'Q6e',
          marks: 6,
          type: 'written',
          format: 'codeWrite',
          question: '<p>A program written in a high-level language is used to access the data from the database. This program has a procedure, <code>SaveLogs()</code>, that stores the data to an external text file.</p><p>The procedure <code>SaveLogs()</code>:</p><ul><li>takes the string of data to be stored to the text file as a parameter</li><li>takes the filename of the text file as a parameter</li><li>stores the string of data to the text file.</li></ul><p>Write the procedure <code>SaveLogs()</code></p><p>You must use <strong>either</strong>:</p><ul><li>OCR Exam Reference Language, or</li><li>A high-level programming language that you have studied.</li></ul>',
          hint: 'Four steps in order: define the procedure with two parameters, open the file using the filename parameter, write the data parameter to it, then close the file.',
          starter: 'procedure SaveLogs(data, filename)\n   logFile = open(filename)\n   logFile.writeLine(data)\n   logFile.close()\nendprocedure',
          lines: 8,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 6 marks (AO3 2b, 1 mark each)</h5><ul>' +
            '<li>Define procedure SaveLogs…</li>' +
            '<li>…with two valid parameters</li>' +
            '<li>Open file (for write/append)…</li>' +
            '<li>…using the file name passed in as a parameter</li>' +
            '<li>Write data to file…</li>' +
            '<li>…using the data passed in as a parameter</li>' +
            '<li>Close file</li>' +
            '</ul><pre>procedure SaveLogs(data, filename)\n   logFile = open(filename)\n   logFile.writeLine(data)\n   logFile.close()\nendprocedure</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Must be clear that the answer is a procedure definition — do not credit calling the procedure for the "Define" mark point. Allow a function definition.</li>' +
            '<li>If parameters are later overwritten, do not credit the "two valid parameters" mark point but follow-through for the write/close mark points.</li>' +
            '<li>Closing the text file does not need reference to the file name/object — "close file" is enough. However, if a reference is given it must be correct.</li>' +
            '<li>If code is given outside of the procedure, do not give the "using the file name" and "using the data" mark points.</li>' +
            '<li>Allow follow-through for multiple occurrences of the same mistake (e.g. not using the filename correctly for both open and close).</li>' +
            '</ul></div>',
          modelAnswer: 'procedure SaveLogs(data, filename)\n   logFile = open(filename)\n   logFile.writeLine(data)\n   logFile.close()\nendprocedure'
        },
        {
          num: 'Q6f(i)',
          marks: 1,
          type: 'written',
          question: '<p>OCR Security Services need to identify the total number of seconds the sensors have been activated on a specific date. The data from the database table <code>events</code> is imported into the program written in a high-level programming language. The program stores the data in a two-dimensional (2D) string array with the identifier <code>arrayEvents</code></p><p>The data to be stored is shown in the table.</p><table><tr><th>Date</th><th>SensorID</th><th>SensorType</th><th>Length</th></tr><tr><td>05/02/2023</td><td>WS2</td><td>Window</td><td>38</td></tr><tr><td>05/02/2023</td><td>MS1</td><td>Motion</td><td>2</td></tr><tr><td>06/02/2023</td><td>DS3</td><td>Door</td><td>1</td></tr><tr><td>06/02/2023</td><td>MS2</td><td>Motion</td><td>3</td></tr><tr><td>06/02/2023</td><td>MS1</td><td>Motion</td><td>2</td></tr><tr><td>07/02/2023</td><td>WS1</td><td>Window</td><td>24</td></tr><tr><td>07/02/2023</td><td>DS1</td><td>Door</td><td>1</td></tr></table><p>In this table, the value of <code>events[1, 1]</code> contains "MS1".</p><p>An array can only store data of one data type. Any non-string data must be converted to a string before storing in the array.</p><p>Identify the process that converts integer data to string data.</p>',
          hint: 'This process changes the DATA TYPE of a value without changing what it represents.',
          starter: 'Casting',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO3 2a)</h5><ul>' +
            '<li><strong>Casting / cast</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept "type casting". Do not accept "conversion". Do not accept examples of casting.</li>' +
            '</ul></div>',
          modelAnswer: 'Casting'
        },
        {
          num: 'Q6f(ii)',
          marks: 6,
          type: 'written',
          format: 'codeWrite',
          question: '<p>The data from the database table <code>events</code> is stored in a two-dimensional (2D) string array with the identifier <code>arrayEvents</code>, shown below (where <code>events[1, 1]</code> contains "MS1").</p><table><tr><th>Date</th><th>SensorID</th><th>SensorType</th><th>Length</th></tr><tr><td>05/02/2023</td><td>WS2</td><td>Window</td><td>38</td></tr><tr><td>05/02/2023</td><td>MS1</td><td>Motion</td><td>2</td></tr><tr><td>06/02/2023</td><td>DS3</td><td>Door</td><td>1</td></tr><tr><td>06/02/2023</td><td>MS2</td><td>Motion</td><td>3</td></tr><tr><td>06/02/2023</td><td>MS1</td><td>Motion</td><td>2</td></tr><tr><td>07/02/2023</td><td>WS1</td><td>Window</td><td>24</td></tr><tr><td>07/02/2023</td><td>DS1</td><td>Door</td><td>1</td></tr></table><p>Write a program that:</p><ul><li>asks the user to input a date</li><li>totals the number of seconds sensors have been activated on the date input</li><li>outputs the calculated total in an appropriate message including the date, for example: Sensors were activated for 40 seconds on 05/02/2023</li></ul><p>You must use <strong>either</strong>:</p><ul><li>OCR Exam Reference Language, or</li><li>A high-level programming language that you have studied.</li></ul>',
          hint: 'Loop through all 7 rows (index 0 to 6) of the array, compare column 0 (the date) to the date input, and if it matches add column 3 (the length) to a running total — then print the total and the date once the loop finishes.',
          starter: 'total = 0\ndate = input("Please enter date")\nfor count = 0 to events.length-1\n  if events[0, count] == date then\n     total = total + events[3,count]\n  endif\nnext count\nprint("There were " + total + " events on " + date)',
          lines: 12,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 6 marks (AO3 2b, 1 mark each to max 6)</h5><ul>' +
            '<li>Input a date and store it in a variable / use it directly</li>' +
            '<li>Access all seven (indexes 0 to 6) events in the array // loop for each event in the array</li>' +
            '<li>Attempt at selection…</li>' +
            '<li>…to compare the date input against the date in the array (element 0)</li>' +
            '<li>…adding the length (element 3) from the array to the total if the dates match</li>' +
            '<li>Outputting the calculated total and date in an appropriate message at the end</li>' +
            '</ul><pre>total = 0\ndate = input("Please enter date")\nfor count = 0 to events.length-1\n  if events[0, count] == date then\n     total = total + events[3,count]\n  endif\nnext count\nprint("There were " + total + " events on " + date)</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The "access all seven events" mark point can be achieved either by iteration accessing each event or by manually repeating code to access each event. Must be 0 to 6, not 1 to 7.</li>' +
            '<li>Allow reference to events (the table given) or arrayEvents (the 2D array) in the answer as long as it is used consistently.</li>' +
            '<li>Allow off-by-1 errors (Python-style) for the loop, looping to array length or array length - 1. Allow "for each item in array" or any other suitable loop.</li>' +
            '<li>The comparing/adding mark points allow the array reference to be either column-major or row-major.</li>' +
            '<li>Output can either be once at the end or on every iteration, as long as it is output at the end. Only give the output mark if an attempt is made to calculate the total within the algorithm.</li>' +
            '<li>Do not penalise capitalisation or minor misspellings of variable names.</li>' +
            '</ul></div>',
          modelAnswer: 'total = 0\ndate = input("Please enter date")\nfor count = 0 to events.length-1\n  if events[0, count] == date then\n     total = total + events[3,count]\n  endif\nnext count\nprint("There were " + total + " events on " + date)'
        }
      ]
    }
  ]
};
