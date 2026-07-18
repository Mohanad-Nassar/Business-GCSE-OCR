// ══════════════════════════════════════════════════════════════
// MOCK PAPER DATA — June 2022, OCR GCSE (9-1) Computer Science J277/02
// "Computational thinking, algorithms and programming" (source: OCR 677831
// question paper + 677962 mark scheme). Verbatim transcription used under
// the site's free-school-year content policy, served behind the auth gate
// (CS-CONTENT-PLAN.md D5).
//
// Shape + widget data-field conventions: see the header comment in the
// sibling file 2024-paper1.js (same contract). This file additionally uses
// the same widget set as 2024-paper2.js:
//   format:'tickGrid'   q.grid = { cols: string[], rows: [ { label, correct: number[] (0-based col idx) } ] }
//   format:'tableFill'  q.table = { headers: string[], rows: (string|null)[][] } (null = blank cell)
//                        q.answers = { "r,c": string[] accepted answers } keyed 0-based into rows[]
//   format:'bankCloze'  q.cloze = HTML with ___1___.. blanks; q.bank = string[] (word bank incl. distractors)
//                        q.answers = string[] correct word per blank (an entry may itself be an
//                        array of accepted alternatives, e.g. ['stops','crashes'])
//   format:'traceTable' q.trace = { columns: string[], rows: (string|null)[][] }
//                        (expected values a correct trace produces; null = a cell that does not
//                        change/output on that row)
//   format:'codeWrite'  free-response code area (no extra field); used where the question gives NO
//                        code skeleton, only a blank space to write a full algorithm from scratch
//   (format omitted)    plain state/describe/explain/drawing items — renders as the 'lines' widget,
//                        ep-answer-area + self-mark against markScheme
//
// 2022-specific structural notes (flagged per the task brief, not normalised
// to later years):
// - Section A carries NO per-section timing advice ("Answer all the
//   questions." is the only preamble) — 2024 papers add "we advise you to
//   spend approximately 50 minutes on Section A", this series does not.
// - Section B's advice says "at least 40 minutes" (2024 says
//   "approximately 40 minutes") — transcribed verbatim, not normalised.
// - The whole of Section B is a SINGLE numbered question (Q5, worth all 30
//   marks) rather than being split across several top-level numbers the way
//   2024's Section B is (Q9) — this is simply how OCR numbered this series;
//   sub-part lettering (a)/(b)/(c)/(d)/(e) is transcribed as printed.
// - Q2(a)(i) and Q2(b) are hand-drawn diagram/flowchart questions (no
//   printed answer text to transcribe, just blank boxes) — handled the same
//   way as the equivalent drawing questions in 2024-paper2.js: format is
//   omitted, the question stem explains it is a drawing question, and
//   hint/starter/modelAnswer describe the correct diagram in words.
// ══════════════════════════════════════════════════════════════

window.MOCK_PAPERS = window.MOCK_PAPERS || {};
window.MOCK_PAPERS['2022-p2'] = {
  id: '2022-p2',
  title: 'June 2022 · Paper 2 — Computational thinking, algorithms and programming (J277/02)',
  minutes: 90,
  totalMarks: 80,
  sections: [
    {
      title: 'Section A — answer all the questions.',
      questions: [
        {
          num: 'Q1a',
          marks: 4,
          type: 'written',
          format: 'tickGrid',
          question: '<p>Tick (✓) one box in each row to identify whether the OCR Reference Language code given is an example of selection or iteration.</p><table><tr><th>OCR Reference Language code</th><th>Selection</th><th>Iteration</th></tr>' +
            '<tr><td><pre>for i = 1 to 10\n    print(i)\nnext i</pre></td><td></td><td></td></tr>' +
            '<tr><td><pre>while score != 0\n    playgame()\nendwhile</pre></td><td></td><td></td></tr>' +
            '<tr><td><pre>if playerHit() then\n    score = 0\nendif</pre></td><td></td><td></td></tr>' +
            '<tr><td><pre>switch bonus:\n    case 0:\n        score = 9\n    case 1:\n        score = 7\n    case 2:\n        score = 5\nendswitch</pre></td><td></td><td></td></tr></table>',
          hint: 'for and while both repeat code until a condition changes (iteration); if and switch both choose between different paths without repeating (selection).',
          starter: 'for loop → Iteration | while loop → Iteration | if statement → Selection | switch statement → Selection',
          grid: { cols: ['Selection', 'Iteration'], rows: [
            { label: 'for i = 1 to 10 / print(i) / next i', correct: [1] },
            { label: 'while score != 0 / playgame() / endwhile', correct: [1] },
            { label: 'if playerHit() then / score = 0 / endif', correct: [0] },
            { label: 'switch bonus: case 0/1/2 … endswitch', correct: [0] }
          ]},
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO2 1b)</h5><p>1 mark per correct row.</p><ul>' +
            '<li><strong>for</strong> loop → Iteration</li>' +
            '<li><strong>while</strong> loop → Iteration</li>' +
            '<li><strong>if</strong> statement → Selection</li>' +
            '<li><strong>switch</strong> statement → Selection</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>No mark given if both boxes in a row ticked.</li>' +
            '<li>Accept any response (ticks, crosses, etc) that clearly indicates the candidate’s choice.</li>' +
            '</ul></div>',
          modelAnswer: 'for → Iteration\n\nwhile → Iteration\n\nif → Selection\n\nswitch → Selection'
        },
        {
          num: 'Q1b',
          marks: 1,
          type: 'written',
          question: '<p>Write pseudocode to increment the value held in the variable <code>score</code> by one.</p>',
          hint: 'You need to both add one AND store the result back into score — an expression that just evaluates to score+1 without overwriting score is not enough.',
          starter: 'score = score + 1',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO3 2b)</h5><ul>' +
            '<li><strong>score = score + 1</strong> // score +=1 // score++</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow other logically correct answers that result in score increasing by one and being overwritten. Do not accept score + 1 / score = +1.</li>' +
            '<li>Accept valid structured English answers that refer to score increasing and overwriting the existing value by one, e.g. "score becomes/equals score plus one".</li>' +
            '<li>Ignore any superfluous code that does not affect the outcome.</li>' +
            '</ul></div>',
          modelAnswer: 'score = score + 1'
        },
        {
          num: 'Q1c',
          marks: 2,
          type: 'written',
          question: '<p>State the name of each of the following computational thinking techniques.</p><p>Breaking a complex problem down into smaller problems.</p><p>Hiding or removing irrelevant details from a problem to reduce the complexity.</p>',
          hint: 'The first definition describes splitting a big problem into manageable chunks; the second describes ignoring detail that is not needed — these are two of the standard computational thinking techniques.',
          starter: '1. Decomposition 2. Abstraction',
          stubs: ['Breaking a complex problem down into smaller problems', 'Hiding or removing irrelevant details from a problem to reduce the complexity'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1 1a)</h5><ul>' +
            '<li><strong>Decomposition</strong></li>' +
            '<li><strong>Abstraction</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Correct answer only. Ignore spelling errors.</li>' +
            '</ul></div>',
          modelAnswer: 'Breaking a complex problem down into smaller problems: Decomposition\n\nHiding or removing irrelevant details from a problem to reduce the complexity: Abstraction'
        },
        {
          num: 'Q2a(i)',
          marks: 3,
          type: 'written',
          question: '<p>A fast food restaurant offers half-price meals if the customer is a student or has a discount card. The offer is not valid on Saturdays.</p><p>A computer system is used to identify whether the customer can have a half-price meal.</p><p>The table identifies the three inputs to the computer system:</p><table><tr><th>Input</th><th>Value</th></tr><tr><td>A</td><td>Is a student</td></tr><tr><td>B</td><td>Has a discount card</td></tr><tr><td>C</td><td>The current day is Saturday</td></tr></table><p>The logic system <strong>P = (A OR B) AND NOT C</strong> is used.</p><p>Complete the following logic diagram for <strong>P = (A OR B) AND NOT C</strong> by drawing one logic gate in each box.</p><p><em>This is a drawing question — sketch the three boxes on paper as logic gates, then describe your completed diagram below as a check of your answer.</em></p><pre>Inputs: A, B, C (A and B feed Box 1; C feeds Box 2; Box 1 and Box 2 both feed Box 3)          Output: P</pre>',
          hint: 'Work outward from the brackets: Box 1 combines A and B (OR), Box 2 inverts C (NOT), and Box 3 combines both of those results (AND) to give P.',
          starter: 'Box 1 = OR gate (inputs A, B). Box 2 = NOT gate (input C). Box 3 = AND gate (inputs: Box 1 output, Box 2 output) → P.',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO2 1b)</h5><ul>' +
            '<li><strong>A OR B</strong> — an OR gate with inputs A and B</li>' +
            '<li><strong>NOT C</strong> — a NOT gate with input C</li>' +
            '<li><strong>AND gate</strong> — combining the (A OR B) output and the NOT C output to give P</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>1 mark per gate. Correct symbols must be used.</li>' +
            '<li>NOT gate must have a circle for inversion; OR and AND must not have a circle.</li>' +
            '<li>Mark the shape of each gate, not the name written if given. Ignore any writing/notes.</li>' +
            '<li>Lines do not have to be drawn or joined up, but if they are, gates must have the correct number of inputs/outputs. Penalise once then FT.</li>' +
            '</ul></div>',
          modelAnswer: 'Box 1: OR gate with inputs A and B.\n\nBox 2: NOT gate with input C.\n\nBox 3: AND gate combining the Box 1 output and the Box 2 output to give P.'
        },
        {
          num: 'Q2a(ii)',
          marks: 2,
          type: 'written',
          question: '<p>A truth table can be produced for this logic circuit.</p><p>Describe the purpose of a truth table.</p>',
          hint: 'Think about what a truth table shows for EVERY possible input combination, not just what one logic gate does.',
          starter: 'A truth table shows every possible combination of inputs, and…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1 1b)</h5><ul>' +
            '<li>To show all possible inputs (to the logic circuit)…</li>' +
            '<li>…and the associated/dependent output (for each input)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>For the 2nd mark point, it must be clear that the output is linked to the input values given.</li>' +
            '<li>"All possible combinations of inputs and outputs" gains the first mark (all possible inputs) but not the second.</li>' +
            '<li>"The output for each possible input" gains both marks.</li>' +
            '</ul></div>',
          modelAnswer: 'A truth table shows every possible combination of input values for a logic circuit, together with the resulting output for each of those combinations.'
        },
        {
          num: 'Q2a(iii)',
          marks: 1,
          type: 'written',
          question: '<p>State how many rows (excluding any headings) would be required in a truth table for the logic expression:</p><p><strong>P = (A OR B) AND NOT C</strong></p>',
          hint: 'The number of rows in a full truth table is 2 to the power of the number of different inputs — count how many different input letters appear.',
          starter: 'There are 3 inputs (A, B, C), so 2^3 = …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO2 1a)</h5><ul>' +
            '<li><strong>8</strong> // eight</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept other answers that equate to 8 (e.g. 2^3).</li>' +
            '</ul></div>',
          modelAnswer: '8'
        },
        {
          num: 'Q2b',
          marks: 5,
          type: 'written',
          question: '<p>The restaurant needs an algorithm designing to help employees work out if a customer can have a half price meal or not. It should:</p><ul><li>input required data</li><li>decide if the customer is entitled to a discount</li><li>output the result of the calculation.</li></ul><p>Design the algorithm using a flowchart.</p><p><em>This is a drawing question — sketch the flowchart on paper using the correct symbol shapes, then describe your completed flowchart below as a check of your answer.</em></p>',
          hint: 'Input all three variables (student, discount card, Saturday) using parallelogram shapes, then use diamond decision shapes to check all three conditions before outputting the correct result — every path must eventually reach End.',
          starter: 'Start → input isStudent, hasDiscountCard, isSaturday → decision: is it Saturday? → decision: is student OR has discount card? → output "half price" or "full price" → End',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 5 marks (AO3 2a)</h5><ul>' +
            '<li>Start and end/stop with all boxes connected, no boxes that do not lead to another box (no arrows needed)</li>' +
            '<li>Input three variables using parallelogram shape</li>' +
            '<li>Checks all three criteria (day, student, discount card) using diamond shape(s) with two lines from each</li>' +
            '<li>…Outputs "full price" with correct conditions using parallelogram shape</li>' +
            '<li>…Outputs "half price" with correct conditions using parallelogram shape</li>' +
            '</ul><table><tr><th>Saturday</th><th>Student</th><th>Discount Card</th><th>Outcome</th></tr>' +
            '<tr><td>N</td><td>N</td><td>N</td><td>Full price</td></tr>' +
            '<tr><td>N</td><td>N</td><td>Y</td><td>Half price</td></tr>' +
            '<tr><td>N</td><td>Y</td><td>N</td><td>Half price</td></tr>' +
            '<tr><td>N</td><td>Y</td><td>Y</td><td>Half price</td></tr>' +
            '<tr><td>Y</td><td>N</td><td>N</td><td>Full price</td></tr>' +
            '<tr><td>Y</td><td>N</td><td>Y</td><td>Full price</td></tr>' +
            '<tr><td>Y</td><td>Y</td><td>N</td><td>Full price</td></tr>' +
            '<tr><td>Y</td><td>Y</td><td>Y</td><td>Full price</td></tr></table></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Question asks for a flowchart. Answers as pseudocode, high level language or other forms are not acceptable (NAQ).</li>' +
            '<li>BP4 and BP5 only to be awarded if all decisions ensure correct output and it is clear what the decisions are. FT for incorrect shapes used or no inputs as long as decisions are logically correct. Must attempt all three decisions.</li>' +
            '<li>Allow calculation of half price / full price instead of a message but this must still be output.</li>' +
            '<li>Inputs/decisions may be presented as individual or combined boxes but must still store as three variables.</li>' +
            '<li>Penalise lack of parallelogram for input/output once only then FT.</li>' +
            '<li>BOD parallelogram shapes if not sure whether input or output as long as context is clear (e.g. inputs at start, outputs at end).</li>' +
            '</ul></div>',
          modelAnswer: 'Start → input isStudent, hasDiscountCard, isSaturday (parallelograms) → decision: is it Saturday? If Yes → output "Full price". If No → decision: is the customer a student OR do they have a discount card? If Yes → output "Half price"; if No → output "Full price" → End.'
        },
        {
          num: 'Q2c',
          marks: 2,
          type: 'written',
          question: '<p>The restaurant adds a service charge to the cost of a meal depending on the number of people at a table. If there are more than five people 5% is added to the total cost of each meal.</p><p>Customers can also choose to leave a tip, this is optional and the customer can choose between a percentage of the cost, or a set amount.</p><p>Identify all the additional inputs that will be required for this change to the algorithm.</p>',
          hint: 'Two separate new pieces of data need to be input: something about the table size, and something about the tip choice/amount.',
          starter: '1. Number of people at the table 2. Whether the tip is a percentage or a set amount, and its value',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO3 2a)</h5><ul>' +
            '<li>Number of people (at the table) // whether there are more than 5 people or not</li>' +
            '<li>Choice between percentage and value // actual value of both percentage, value</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Ignore additional inputs that would be sensible, such as cost of the meal.</li>' +
            '<li>Accept inputs in the form of pseudocode / high-level language.</li>' +
            '<li>Max 1 if other irrelevant inputs given.</li>' +
            '<li>"Whether to leave a tip or not" or "Amount of tip" NE (not enough) for BP2. Must address both the percentage and value of tip if asked for. BOD "type of tip" for BP2.</li>' +
            '</ul></div>',
          modelAnswer: 'The number of people at the table (to check if more than 5), and the tip choice — whether the customer wants a percentage of the cost or a fixed value, plus that percentage or value.'
        },
        {
          num: 'Q2d(i)',
          marks: 2,
          type: 'written',
          question: '<p>Each member of staff that works in the restaurant is given a Staff ID. This is calculated using the following algorithm.</p><pre>01  surname = input("Enter surname")\n02  year = input("Enter starting year")\n03  staffID = surname + str(year)\n04  while staffID.length &lt; 10\n05       staffID = staffID + "x"\n06  endwhile\n07  print("ID " + staffID)</pre><p>Define the term <strong>casting</strong> and give the line number where casting has been used in the algorithm.</p>',
          hint: 'Casting means converting a value from one data type to another — look for the line that turns the number year into text so it can be joined onto a string.',
          starter: 'Definition: converting one data type into another. Line number: 03',
          stubs: ['Definition', 'Line number'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1 1b, AO2 2b)</h5><ul>' +
            '<li>Convert/change one data type to another</li>' +
            '<li>Line 03 // 3 // three</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not accept "change to string" — this is the use in this example but not a definition.</li>' +
            '</ul></div>',
          modelAnswer: 'Definition: casting means converting a value from one data type into another.\n\nLine number: 03 (str(year) converts the integer year into a string)'
        },
        {
          num: 'Q2d(ii)',
          marks: 4,
          type: 'written',
          format: 'traceTable',
          question: '<p>Each member of staff that works in the restaurant is given a Staff ID. This is calculated using the following algorithm.</p><pre>01  surname = input("Enter surname")\n02  year = input("Enter starting year")\n03  staffID = surname + str(year)\n04  while staffID.length &lt; 10\n05       staffID = staffID + "x"\n06  endwhile\n07  print("ID " + staffID)</pre><p>Complete the following trace table for the given algorithm when the surname "Kofi" and the year 2021 are entered.</p><p>You may not need to use all rows in the table.</p>',
          hint: 'Trace line by line: after line 03 staffID is "Kofi2021" (8 characters, still less than 10, so the loop runs), and it gains one "x" each pass through lines 05–06 until its length reaches 10.',
          starter: 'Line 01: surname=Kofi | Line 02: year=2021 | Line 03: staffID=Kofi2021 | Line 05: staffID=Kofi2021x | Line 05: staffID=Kofi2021xx | Line 07: Output "ID Kofi2021xx"',
          trace: { columns: ['Line number', 'surname', 'year', 'staffID', 'Output'], rows: [
            ['01', 'Kofi', null, null, null],
            ['02', null, '2021', null, null],
            ['03', null, null, 'Kofi2021', null],
            ['05', null, null, 'Kofi2021x', null],
            ['05', null, null, 'Kofi2021xx', null],
            ['07', null, null, null, 'ID Kofi2021xx']
          ]},
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO3 2c)</h5><ul>' +
            '<li>Kofi2021 as staffID on line 03</li>' +
            '<li>Kofi2021x as staffID on line 05</li>' +
            '<li>Kofi2021xx as staffID on line 05</li>' +
            '<li>ID Kofi2021xx output on line 07 as the first and only output</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Max 2 if in incorrect order. Ignore misspelling of Kofi.</li>' +
            '<li>Penalise lack of/errors with line numbers once then FT. Ignore capitalisation. Ignore additional lines unless the outcome is impacted.</li>' +
            '<li>staffID does not have a space in it. Output does have a space in it. Penalise spaces once then FT. Do not penalise unless obvious.</li>' +
            '<li>Quotes around the answer are OK, but do not allow quotes around partial answers, e.g. "ID" Kofi2021xx is incorrect.</li>' +
            '</ul></div>',
          modelAnswer: 'Line 01: surname = Kofi\n\nLine 02: year = 2021\n\nLine 03: staffID = Kofi2021\n\nLine 05: staffID = Kofi2021x\n\nLine 05: staffID = Kofi2021xx\n\nLine 07: Output "ID Kofi2021xx"'
        },
        {
          num: 'Q3a',
          marks: 3,
          type: 'written',
          question: '<p>A program stores the following list of positive and negative numbers. The numbers need sorting into ascending order using a merge sort.</p><pre>45   12   -99   100   -13   0   17   -27</pre><p>The first step is to divide the list into individual lists of one number each. This has been done for you.</p><pre>[45]  [12]  [-99]  [100]  [-13]  [0]  [17]  [-27]</pre><p>Complete the merge sort of the data by showing each step of the process.</p>',
          hint: 'Merge pairs of single-item lists into sorted pairs first, then merge those pairs into two sorted lists of four, then merge those two lists of four into the final sorted list of eight.',
          starter: 'Step 1 (pairs): [12,45] [-99,100] [-13,0] [-27,17]\nStep 2 (fours): [-99,12,45,100] [-27,-13,0,17]\nStep 3 (final): [-99,-27,-13,0,12,17,45,100]',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO2 1b)</h5><ul>' +
            '<li>Merge into correct sorted lists of size 2 (12 45 / -99 100 / -13 0 / -27 17)</li>' +
            '<li>Merge into correct sorted lists of size 4 (-99 12 45 100 / -27 -13 0 17) …</li>' +
            '<li>…Merge into correct sorted list of size 8 (-99 -27 -13 0 12 17 45 100)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not credit BP3 simply for a sorted list.</li>' +
            '<li>Groups of numbers must clearly be the correct size.</li>' +
            '<li>Do not allow answers that show lists being merged and then sorted in place — this is incorrect.</li>' +
            '</ul></div>',
          modelAnswer: 'Step 1 (pairs of 2): [12, 45]  [-99, 100]  [-13, 0]  [-27, 17]\n\nStep 2 (groups of 4): [-99, 12, 45, 100]  [-27, -13, 0, 17]\n\nStep 3 (final merge of 8): [-99, -27, -13, 0, 12, 17, 45, 100]'
        },
        {
          num: 'Q3b',
          marks: 4,
          type: 'written',
          question: '<p>Once the numbers are in order, a binary search can be run on the data.</p><p>Describe the steps a binary search will follow to look for a number in a sorted list.</p>',
          hint: 'There are 4 separate steps to mention: picking the middle value, comparing it to the target, discarding the correct half, and repeating until the number is found (or the list runs out).',
          starter: 'Select the middle number… compare it to the target… if the target is larger, discard the left half… repeat…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO1 1b)</h5><p>Any four bullet points for 1 mark each.</p><ul>' +
            '<li>Select/choose/pick the middle number (or left/right of middle as an even number) and …</li>' +
            '<li>…check if the selected number is equal to/matches the target number (not just compare)</li>' +
            '<li>…if the searched number is larger, discard the left half // if the searched number is smaller, discard the right half</li>' +
            '<li>Repeat until number found</li>' +
            '<li>… or remaining list is of size 1 / 0 (number not found)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not allow "split the list in half" on its own as the first step — this is incorrect.</li>' +
            '<li>Can get BP1 and 2 in one step (e.g. "check if the middle number is the one we’re looking for").</li>' +
            '<li>For BP3, accept focussing on the correct half.</li>' +
            '<li>Repeat (BP4) must be in the context of an attempt at a binary search. Allow correct reference to recursion.</li>' +
            '<li>"until number is not in the list" is NE (not enough) for the final BP. Need to explain how this is known.</li>' +
            '</ul></div>',
          modelAnswer: 'Select the middle number of the list and check whether it matches the target. If the target is larger, discard the left half of the list; if it is smaller, discard the right half. Repeat this process on the remaining half until the number is found, or the remaining list has no items left.'
        },
        {
          num: 'Q3c',
          marks: 2,
          type: 'written',
          question: '<p>A linear search could be used instead of a binary search.</p><p>Describe the steps a linear search would follow when searching for a number that is not in the given list.</p>',
          hint: 'Say where the search starts, and be explicit that it checks EVERY value, one after another, in order.',
          starter: 'Start with the first value in the list, then check every value in order…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1 1b)</h5><p>1 mark each.</p><ul>' +
            '<li>Starting with the first value</li>' +
            '<li>Checking all values in order</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The 2nd bullet point must cover both ideas of checking all of the values AND being done in order.</li>' +
            '<li>"Checks each value" / "one by one" / "step by step" by itself is NE (not enough) — does not say in order.</li>' +
            '<li>Do not accept "repeat until value found" for BP2 (the question says the number is not in the list).</li>' +
            '<li>"Checks each value from beginning to end" implies order, so gets both BP1 and BP2.</li>' +
            '</ul></div>',
          modelAnswer: 'A linear search starts with the first value in the list, then checks every value in order, one after another, until it has checked the last value in the list.'
        },
        {
          num: 'Q4a',
          marks: 2,
          type: 'written',
          question: '<p>Jack is writing a program to add up some numbers. His first attempt at the program is shown.</p><pre>a = input("Enter a number")\nb = input("Enter a number")\nc = input("Enter a number")\nd = input("Enter a number")\ne = input("Enter a number")\nf = (a + b + c + d + e)\nprint(f)</pre><p>Give two ways that the maintainability of this program could be improved.</p>',
          hint: 'Pick two DIFFERENT techniques (not two examples of the same one) — think about comments, sensible variable names, subroutines, or using a loop to shorten the repeated input lines.',
          starter: '1. Add comments explaining what the code does. 2. Use meaningful variable names instead of a, b, c, d, e, f.',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO2 1b)</h5><p>Any two bullet points for one mark each.</p><ul>' +
            '<li>Add comments</li>' +
            '<li>Name variables sensibly</li>' +
            '<li>Put into subroutine / procedure / function</li>' +
            '<li>Use loop / iteration</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not accept indentation (no code to sensibly indent in this example).</li>' +
            '<li>"Use a subroutine" is not enough. Must be clear that existing code will be put into a new subroutine.</li>' +
            '</ul></div>',
          modelAnswer: '1. Use meaningful variable names (e.g. num1, num2… instead of a, b, c…) so the purpose of each variable is clear.\n\n2. Use a loop to repeat the input statement instead of writing five separate near-identical lines.'
        },
        {
          num: 'Q4b(i)',
          marks: 2,
          type: 'written',
          format: 'tableFill',
          question: '<p>Jack’s program uses the addition <code>(+)</code> arithmetic operator. This adds together two numbers.</p><p>State the purpose of each of the arithmetic operators in the table.</p>',
          hint: 'These are two of the remaining basic arithmetic operators — one combines two numbers by repeated addition, the other splits one number into equal parts of another.',
          starter: '* → Multiplication | / → Division',
          table: { headers: ['Arithmetic operator', 'Purpose'], rows: [['*', null], ['/', null]] },
          answers: { '0,1': ['Multiplication'], '1,1': ['Division', 'Floor division', 'Integer division', 'Division with no remainder'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1 1a)</h5><ul>' +
            '<li><strong>*</strong> → Multiplication</li>' +
            '<li><strong>/</strong> → Division</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept other correct answers that mean the same.</li>' +
            '<li>Accept floor / integer division // division with no remainder (Python v2.x) for /.</li>' +
            '</ul></div>',
          modelAnswer: '* → Multiplication\n\n/ → Division'
        },
        {
          num: 'Q4b(ii)',
          marks: 5,
          type: 'written',
          format: 'bankCloze',
          question: '<p>Complete the description of programming languages and translators by writing the correct term from the box in each space.</p>',
          hint: 'Work through the paragraph in order — each blank’s job (type of language, what an interpreter does on error, how many errors a compiler tolerates, what a compiler produces, and how its output runs) narrows the word list before you pick.',
          starter: '(1) high-level (2) stops (3) no (4) executable (5) without',
          cloze: '<p>Jack writes his program in a ___1___ language. This needs to be translated into assembly or machine code before it can be executed. This is done using a translator.</p><p>One type of translator is an interpreter. This converts one line of code and then executes it, before moving to the next line. It ___2___ when an error is found, and when corrected continues running from the same position. This translator is helpful when debugging code.</p><p>A second type of translator is a compiler. This converts all of the code and produces an error report. The code will not run until there are ___3___ errors. The ___4___ file produced can be run ___5___ the compiler.</p>',
          bank: ['continues', 'crashes', 'debugging', 'error', 'executable', 'high-level', 'interpreter', 'language', 'low-level', 'many', 'no', 'one', 'stops', 'with', 'without'],
          answers: ['high-level', ['stops', 'crashes'], 'no', 'executable', 'without'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 5 marks (AO1 1b, AO2 1b)</h5><ul>' +
            '<li>(1) <strong>high-level</strong></li>' +
            '<li>(2) <strong>stops</strong> // crashes</li>' +
            '<li>(3) <strong>no</strong></li>' +
            '<li>(4) <strong>executable</strong></li>' +
            '<li>(5) <strong>without</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Ignore spelling errors.</li>' +
            '</ul></div>',
          modelAnswer: '(1) high-level (2) stops (3) no (4) executable (5) without'
        },
        {
          num: 'Q4c',
          marks: 6,
          type: 'written',
          format: 'codeWrite',
          question: '<p>Jack decides to improve his program. He wants to be able to input how many numbers to add together each time the algorithm runs, and also wants it to calculate and display the average of these numbers.</p><p>Write an algorithm to:</p><ul><li>ask the user to input the quantity of numbers they want to enter and read this value as input</li><li>repeatedly take a number as input, until the quantity of numbers the user input has been entered</li><li>calculate and output the total of these numbers</li><li>calculate and output the average of these numbers.</li></ul>',
          hint: 'Structure it in this order: input the quantity first, then a loop that runs that many times taking a number each time and adding it to a running total, then two separate outputs — the total, and the total divided by the quantity.',
          starter: 'num = input("Enter how many numbers")\nfor x = 1 to num\n  temp = input("Enter a number")\n  total = total + temp\nnext x\nprint(total)\nprint(total / num)',
          lines: 12,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 6 marks (AO3 2b, AO3 2c)</h5><ul>' +
            '<li>Input and stores/uses value with message</li>' +
            '<li>Attempt at repeating…</li>' +
            '<li>…correctly repeats the number of times given as input</li>' +
            '<li>…correctly takes a number as input within the loop and calculates the total of these numbers</li>' +
            '<li>…correctly calculates an average (total/num)</li>' +
            '<li>Outputs both total and average</li>' +
            '</ul><pre>num = input("Enter how many numbers")\nfor x = 1 to num\n     temp = input("Enter a number")\n     total = total + temp\nnext x\nprint(total)\nprint(total / num)</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>If a flow chart is used, correct shapes are needed.</li>' +
            '<li>Allow a tolerance of 1 with the number of loops for BP3 with for loops.</li>' +
            '<li>BP1 requires input with a message (can be two statements, e.g. print and then input, or combined). Input must be stored or used.</li>' +
            '<li>BP3, 4, 5 must be logically correct to be credited. Ignore non-initialisation of total.</li>' +
            '<li>BP5 can be given as FT as long as an attempt has been made at working out a total within the loop.</li>' +
            '<li>BP6 can be given as FT as long as an attempt has been made at total and average (not necessarily in a loop).</li>' +
            '</ul></div>',
          modelAnswer: 'num = input("Enter how many numbers")\nfor x = 1 to num\n  temp = input("Enter a number")\n  total = total + temp\nnext x\nprint(total)\nprint(total / num)'
        }
      ]
    },
    {
      title: 'Section B — we advise you to spend at least 40 minutes on this section. Some questions require you to respond using either the OCR Exam Reference Language or a high-level programming language you have studied; these are clearly shown.',
      questions: [
        {
          num: 'Q5a(i)',
          marks: 2,
          type: 'written',
          format: 'tableFill',
          question: '<p>Customers at a hotel can stay between 1 and 5 (inclusive) nights and can choose between a basic room or a premium room.</p><p>A typical booking record is shown in the table:</p><table><tr><td><code>firstName</code></td><td>Amaya</td></tr><tr><td><code>surname</code></td><td>Taylor-Ling</td></tr><tr><td><code>nights</code></td><td>3</td></tr><tr><td><code>room</code></td><td>Premium</td></tr><tr><td><code>stayComplete</code></td><td>False</td></tr></table><p>State the most appropriate data type for the following fields:</p>',
          hint: 'Look at the example VALUE for each field, not its name: nights is a whole number, room is a short piece of text.',
          starter: 'Nights → Integer | Room → String',
          table: { headers: ['Field', 'Data type'], rows: [['Nights', null], ['Room', null]] },
          answers: { '0,1': ['Integer'], '1,1': ['String'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO3 2a)</h5><ul>' +
            '<li>Nights → <strong>Integer</strong></li>' +
            '<li>Room → <strong>String</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept other valid data types from high-level languages (e.g. byte, short for integers).</li>' +
            '<li>Do not accept descriptions (e.g. "whole number", "text"). Do not accept "character(s)" for string.</li>' +
            '</ul></div>',
          modelAnswer: 'Nights → Integer\n\nRoom → String'
        },
        {
          num: 'Q5a(ii)',
          marks: 1,
          type: 'written',
          question: '<p>Give the name of one field that could be stored as a Boolean data type.</p>',
          hint: 'Look for the field whose example value is True or False.',
          starter: 'stayComplete',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO3 2a)</h5><ul>' +
            '<li><strong>stayComplete</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Ignore spaces or misspelling as long as recognisable.</li>' +
            '</ul></div>',
          modelAnswer: 'stayComplete'
        },
        {
          num: 'Q5a(iii)',
          marks: 4,
          type: 'written',
          format: 'codeWrite',
          question: '<p>Booking records are stored in a database table called <code>TblBookings</code>.</p><p>The following SQL statement is written to display all customer bookings that stay more than one night.</p><pre>SELECT ALL\nFROM TblBookings\nIF Nights &lt; 1</pre><p>The SQL statement is incorrect.</p><p>Rewrite the SQL statement so that it is correct.</p>',
          hint: 'Three separate fixes are needed: list the actual field names instead of the keyword ALL, keep FROM as it is, and replace IF with the correct SQL keyword for filtering rows, with a condition meaning MORE than one night.',
          starter: 'SELECT FirstName, Surname, Nights, Room, StayComplete\nFROM TblBookings\nWHERE Nights > 1',
          lines: 8,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO3 1, AO3 2c)</h5><ul>' +
            '<li>SELECT FirstName, Surname, Nights, Room, StayComplete // SELECT *</li>' +
            '<li>FROM TblBookings</li>' +
            '<li>WHERE</li>' +
            '<li>Nights &gt; 1 // Nights &gt;= 2 // Nights BETWEEN 2 AND 5</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Order of fields for BP1 not important but must show all fields and be separated by commas.</li>' +
            '<li>Ignore capitalisation and spacing. Spelling must be correct. Ignore quotes around numeric values or field/table names.</li>' +
            '<li>Allow other logically valid SQL statements.</li>' +
            '<li>Ignore reference to stayComplete or other valid SQL code that would not affect the output.</li>' +
            '<li>Max 3 if in the wrong order or if it includes any extra invalid code.</li>' +
            '</ul></div>',
          modelAnswer: 'SELECT FirstName, Surname, Nights, Room, StayComplete\nFROM TblBookings\nWHERE Nights > 1'
        },
        {
          num: 'Q5b(i)',
          marks: 5,
          type: 'written',
          format: 'codeWrite',
          question: '<p>When a new booking is recorded, the details are entered into a program to validate the values. The following criteria are checked:</p><ul><li>firstName and surname are not empty</li><li>room is either "basic" or "premium"</li><li>nights is between 1 and 5 (inclusive).</li></ul><p>If any invalid data is found "NOT ALLOWED" is displayed.</p><p>If all data is valid "ALLOWED" is displayed.</p><p>Complete the following program to validate the inputs. You must use either OCR Exam Reference Language or a high-level programming language that you have studied.</p><pre>firstName = input("Enter a first name")\nsurname = input("Enter a surname")\nroom = input("Enter basic or premium")\nnights = input("Enter between 1 and 5 nights")\nstayComplete = False</pre>',
          hint: 'Check all three criteria with separate IF statements (each setting a "valid" flag to False if it fails), then a final IF that only prints ALLOWED if all three passed — check BOTH boundaries for nights.',
          starter: 'valid = True\nif firstName == "" or surname == "" then\n  valid = False\nendif\nif room != "basic" and room != "premium" then\n  valid = False\nendif\nif nights < 1 or nights > 5 then\n  valid = False\nendif\nif valid then\n  print("ALLOWED")\nelse\n  print("NOT ALLOWED")\nendif',
          lines: 10,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 5 marks (AO3 2a)</h5><p><strong>Note:</strong> output marks are given if the entire system produces the correct output. For example, if a user enters a valid name and room but an invalid number of nights, the system should say "NOT ALLOWED". If this works and produces the correct response no matter which input is invalid, BP4 should be given. The same holds for valid output — if (and only if) three valid inputs result in "ALLOWED" being output, BP5 should be given. For any output marks to be given, a sensible attempt must have been made at all three checks; these may not be completely correct (and may have been penalised in BPs 1 to 3) but should be enough to allow the FT marks for output.</p><ul>' +
            '<li>Checks that both firstname and surname are not empty…</li>' +
            '<li>Checks that room is either "basic" or "premium"…</li>' +
            '<li>Checks that nights is between 1 and 5 (inclusive)…</li>' +
            '<li>…Outputs "NOT ALLOWED" (or equivalent) if any of the 3 checks are invalid (must check all three)</li>' +
            '<li>…Outputs "ALLOWED" (or equivalent) only if all three checks are valid (must check all three)</li>' +
            '</ul><pre>valid = True\nif firstname == "" or surname == "" then\n     valid = False\nend if\nif room != "basic" and room != "premium" then\n     valid = False\nendif\nif nights &lt; 1 or nights &gt; 5 then\n    valid = False\nendif\n\nif valid then\n     print("ALLOWED")\nelse\n     print("NOT ALLOWED")\nendif</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Must have some attempt at all three checks to give the output mark(s). Check for nights must check both upper and lower limits.</li>' +
            '<li>Iteration can be used as validation if input is repeatedly asked for until a valid answer is given.</li>' +
            '<li>Do not accept logically incorrect Boolean conditions such as "if firstname or surname == empty string".</li>' +
            '<li>Do not accept &gt; or &lt; for &gt;=, &lt;=. Ignore capitalisation.</li>' +
            '<li>BP1 to 3 can check for valid or invalid inputs. Pay particular attention to use of AND / OR — only give marks for output if these work together correctly.</li>' +
            '<li>Candidates do not need to state which language they are using — mark for logical correctness, not the syntax of any particular language. Variable names must be correct/consistent.</li>' +
            '</ul></div>',
          modelAnswer: 'valid = True\nif firstName == "" or surname == "" then\n  valid = False\nendif\nif room != "basic" and room != "premium" then\n  valid = False\nendif\nif nights < 1 or nights > 5 then\n  valid = False\nendif\nif valid then\n  print("ALLOWED")\nelse\n  print("NOT ALLOWED")\nendif'
        },
        {
          num: 'Q5b(ii)',
          marks: 3,
          type: 'written',
          format: 'tableFill',
          question: '<p>Complete the following test plan to check whether the number of nights is validated correctly.</p>',
          hint: 'Normal = a typical value well inside the range; Boundary = exactly on the edge of the allowed range (1 or 5); Erroneous = a value outside the range, or not even a number.',
          starter: 'Row 1 type: Normal | Row 2 data: 1 (or 5) | Row 3 data: e.g. 7 (or a non-numeric value)',
          table: { headers: ['Test data (number of nights)', 'Type of test', 'Expected output'], rows: [['2', null, 'ALLOWED'], [null, 'Boundary', 'ALLOWED'], [null, 'Erroneous / Invalid', 'NOT ALLOWED']] },
          answers: {
            '0,1': ['Normal', 'Typical', 'Valid', 'Acceptable'],
            '1,0': ['1', '5'],
            '2,0': ['0', '6', '7', '-1', 'bananas', 'any value less than 1', 'any value greater than 5', 'any non-numeric value']
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO3 2c)</h5><ul>' +
            '<li><strong>Normal</strong></li>' +
            '<li><strong>1 or 5</strong> (not 0 or 6 as says allowed)</li>' +
            '<li>Any numeric value except 1 to 5 // any non-numeric input (e.g. "bananas")</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow other descriptions that mean normal (e.g. valid / typical / acceptable).</li>' +
            '</ul></div>',
          modelAnswer: 'Row 1: Normal\n\nRow 2: 1 (or 5)\n\nRow 3: 7 (or any value outside 1–5, or a non-numeric value)'
        },
        {
          num: 'Q5c(i)',
          marks: 4,
          type: 'written',
          format: 'codeWrite',
          question: '<p>A Basic room costs £60 each night. A Premium room costs £80 each night.</p><p>Create a function, <code>newPrice()</code>, that takes the number of nights and the type of room as parameters, calculates and returns the price to pay.</p><p>You do not have to validate these parameters.</p><p>You must use either OCR Exam Reference Language or a high-level programming language that you have studied.</p>',
          hint: 'Define the function with two parameters, use selection to pick the right nightly rate for the room type, multiply by the number of nights, then RETURN (not print) the result.',
          starter: 'function newPrice(nights, room)\n  if room == "basic" then\n    price = 60 * nights\n  elseif room == "premium" then\n    price = 80 * nights\n  endif\n  return price\nendfunction',
          lines: 8,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO3 2b)</h5><ul>' +
            '<li>Function header for newPrice…</li>' +
            '<li>…taking (at least) two parameters</li>' +
            '<li>…correctly calculates price based on parameters (if present) within the function…</li>' +
            '<li>…returns this calculated price</li>' +
            '</ul><pre>function newPrice(nights, room)\n  if room == "basic" then\n    price = 60 * nights\n  elseif room == "premium" then\n     price = 80 * nights\n  endif\n  return price\nendfunction</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>BP1 must be clear that a new function is being defined, e.g. function / def keyword. Allow FT for subsequent marks if not present.</li>' +
            '<li>Ignore any code outside the attempt at the function definition.</li>' +
            '<li>Ignore additional parameters. Ignore inputs or additional code as long as these do not overwrite parameters or affect the operation of the function.</li>' +
            '<li>If inputs are used instead of parameters, FT for BP3. Allow use of else for the second room type in BP3.</li>' +
            '<li>An attempt at calculation is needed to award BP4. Must return (not output) the value. Return can be done e.g. in VB by assigning to the function name (e.g. newPrice = price).</li>' +
            '</ul></div>',
          modelAnswer: 'function newPrice(nights, room)\n  if room == "basic" then\n    price = 60 * nights\n  elseif room == "premium" then\n    price = 80 * nights\n  endif\n  return price\nendfunction'
        },
        {
          num: 'Q5c(ii)',
          marks: 3,
          type: 'written',
          format: 'codeWrite',
          question: '<p>Write program code, that uses <code>newPrice()</code>, to output the price of staying in a Premium room for 5 nights.</p><p>You must use either OCR Exam Reference Language or a high-level programming language that you have studied.</p>',
          hint: 'Call newPrice() with the two correct argument values (order does not matter as long as it matches your function), and print the result it returns.',
          starter: 'print(newPrice("premium", 5))',
          lines: 6,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO3 2b)</h5><ul>' +
            '<li>Call function newPrice…</li>' +
            '<li>…with ("premium", 5) as parameters</li>' +
            '<li>…Output the returned value</li>' +
            '</ul><pre>print(newPrice("premium", 5))\n\nx = newPrice(5, "premium")\nprint(x)</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Order of parameters not important.</li>' +
            '<li>"premium" must use string delimiters (e.g. "quotes").</li>' +
            '<li>Do not allow function definitions for BP1.</li>' +
            '<li>Ignore capitalisation of newPrice.</li>' +
            '<li>The candidate could store the returned value in a variable and then print this, or store parameters in variables before passing in — these are all acceptable.</li>' +
            '<li>Ignore any superfluous code given. Do not credit answers where newPrice is overwritten prior to use.</li>' +
            '<li>Ignore spaces. Allow the function call if brackets are missing (e.g. newprice instead of newprice()).</li>' +
            '</ul></div>',
          modelAnswer: 'print(newPrice("premium", 5))'
        },
        {
          num: 'Q5d',
          marks: 2,
          type: 'written',
          question: '<p>The hotel has nine rooms that are numbered from room 0 to room 8.</p><p>The number of people currently staying in each room is stored in an array with the identifier <code>room</code>. The index of <code>room</code> represents the room number.</p><table><tr><th>Index</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td></tr><tr><th>Data</th><td>2</td><td>1</td><td>3</td><td>2</td><td>1</td><td>0</td><td>0</td><td>4</td><td>1</td></tr></table><p>The following program counts how many people are currently staying in the hotel.</p><pre>for count = 1 to 8\n     total = 0\n     total = total + room[count]\nnext count\nprint(total)</pre><p>When tested, the program is found to contain two logic errors.</p><p>Describe how the program can be refined to remove these logic errors.</p>',
          hint: 'One error is about which room indexes the loop visits (it skips one), and the other is about where a line sits relative to the loop (it wipes out the running total on every pass).',
          starter: 'Change the loop to "for count = 0 to 8" so index 0 is included, and move "total = 0" to before the loop starts so it is not reset every time round.',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO3 2c)</h5><ul>' +
            '<li>For loop changed to include 0</li>' +
            '<li>total = 0 moved to before the loop starts / removed</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow the loop changed to 0 to 8 or 0 to 9 (Python).</li>' +
            '<li>Do not accept moving total outside the loop — NE (not enough), it could be moved to after the loop which would still be a logic error. Do not accept moving it to the top of the loop.</li>' +
            '<li>Accept corrected code shown. Accept reference to count variable limits for BP1.</li>' +
            '</ul></div>',
          modelAnswer: 'Change the loop so it starts from 0 (for count = 0 to 8), so that room[0] is included. Also move "total = 0" so it happens once before the loop starts, not inside the loop, otherwise total is reset back to 0 on every pass.'
        },
        {
          num: 'Q5e',
          marks: 6,
          type: 'written',
          format: 'codeWrite',
          question: '<p>The hotel car park charges £4 per hour. If the car is electric, this price is halved to £2 per hour.</p><p>Write an algorithm to:</p><ul><li>take as input the number of hours the user has parked and whether their car is electric or not</li><li>calculate and output the total price</li><li>repeat continually until the user enters 0 hours.</li></ul><p>You must use either OCR Exam Reference Language or a high level programming language that you have studied.</p>',
          hint: 'Structure: a loop that keeps running until 0 hours is entered, taking BOTH inputs each pass, choosing the correct rate with selection, then calculating and printing the price before looping again.',
          starter: 'hours = 1\nwhile hours != 0\n  hours = input("Enter hours")\n  electric = input("enter Y for electric or N")\n  if electric == "Y" then\n    price = hours * 2\n  elseif electric == "N" then\n    price = hours * 4\n  endif\n  print(price)\nendwhile',
          lines: 12,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 6 marks (AO3 2c)</h5><ul>' +
            '<li>Inputs hours AND electric (two separate inputs), storing or using these</li>' +
            '<li>Checks if the car is electric (IF/Select statement)…</li>' +
            '<li>…correctly calculates and outputs the price (hours * 2 // price / 2) for electric</li>' +
            '<li>…correctly calculates and outputs the price (hours * 4 // electric price * 2) for non-electric</li>' +
            '<li>Attempt at repetition of BP1 to 4…</li>' +
            '<li>…until 0 hours entered</li>' +
            '</ul><pre>while hours != 0\n   hours = input("Enter hours")\n   electric = input("enter Y for electric or N")\n   if electric == "Y" then\n        price = hours * 2\n   elseif electric == "N" then\n        price = hours * 4\n   endif\n   print(price)\nendwhile</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Initialisation of price and hours is not necessary, but if present hours must be non-zero for BP6 to be given.</li>' +
            '<li>BP5 must include all points attempted. Can still be credited if any of BP1 to 4 are not attempted / incorrect.</li>' +
            '<li>BP6 can be given as FT even if BP5 (the loop) is in the wrong place / does not include all required code. BP6 could be achieved as repeated function calls / recursion.</li>' +
            '<li>Initial input outside of the loop that is then also included within the loop is fine — e.g. hours input outside the loop but repeated again at the end of the loop.</li>' +
            '<li>Do not accept "while hours &gt; 0" (could be -1). Do not penalise answers where 0 is output when the loop exits.</li>' +
            '</ul></div>',
          modelAnswer: 'hours = 1\nwhile hours != 0\n  hours = input("Enter hours")\n  electric = input("enter Y for electric or N")\n  if electric == "Y" then\n    price = hours * 2\n  elseif electric == "N" then\n    price = hours * 4\n  endif\n  print(price)\nendwhile'
        }
      ]
    }
  ]
};
