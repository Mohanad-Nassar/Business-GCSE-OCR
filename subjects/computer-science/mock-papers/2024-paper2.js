// ══════════════════════════════════════════════════════════════
// MOCK PAPER DATA — June 2024, OCR GCSE (9-1) Computer Science J277/02
// "Computational thinking, algorithms and programming" (source: OCR 727535
// question paper + 727653 mark scheme). Verbatim transcription used under
// the site's free-school-year content policy, served behind the auth gate
// (CS-CONTENT-PLAN.md D5).
//
// Shape + widget data-field conventions: see the header comment in the
// sibling file 2024-paper1.js (same contract). This file additionally uses:
//   format:'truthTable' q.truth = { inputs: string[], output: string, pairRows: true,
//                                    rows: [ { in: (0|1)[], out: 0|1 } ] }
//   format:'traceTable' q.trace = { columns: string[], rows: (string|null)[][] }
//                        (expected values a correct trace produces; null = a
//                        cell the paper says candidates "may not need to use")
//   format:'codeGaps'   q.gaps = { code: string (___1___.. tokens, kept inside a <pre>
//                        in `question` too for context), answers: string[] per gap }
//   format:'codeWrite'  free-response code area (no extra field); used where the
//                        question gives NO code skeleton, only a blank space to write
//                        a full algorithm from scratch (contrast with codeGaps, which
//                        gives a skeleton with specific blanks to fill)
// ══════════════════════════════════════════════════════════════

window.MOCK_PAPERS = window.MOCK_PAPERS || {};
window.MOCK_PAPERS['2024-p2'] = {
  id: '2024-p2',
  title: 'June 2024 · Paper 2 — Computational thinking, algorithms and programming (J277/02)',
  minutes: 90,
  totalMarks: 80,
  sections: [
    {
      title: 'Section A — we advise you to spend approximately 50 minutes on Section A.',
      questions: [
        {
          num: 'Q1',
          marks: 3,
          type: 'written',
          format: 'tickGrid',
          question: '<p>Tick (✓) one box in each row to identify the programming construct where each keyword is used.</p><table><tr><th>Keyword</th><th>Selection</th><th>Iteration</th></tr><tr><td><code>if</code></td><td></td><td></td></tr><tr><td><code>for</code></td><td></td><td></td></tr><tr><td><code>while</code></td><td></td><td></td></tr></table>',
          hint: '"if" chooses between paths (selection); "for" and "while" both repeat code (iteration).',
          starter: 'if → Selection | for → Iteration | while → Iteration',
          grid: { cols: ['Selection', 'Iteration'], rows: [{ label: 'if', correct: [0] }, { label: 'for', correct: [1] }, { label: 'while', correct: [1] }] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO1)</h5><ul>' +
            '<li><strong>if</strong> → Selection</li>' +
            '<li><strong>for</strong> → Iteration</li>' +
            '<li><strong>while</strong> → Iteration</li>' +
            '</ul></div>',
          modelAnswer: 'if → Selection\n\nfor → Iteration\n\nwhile → Iteration'
        },
        {
          num: 'Q2',
          marks: 4,
          type: 'written',
          question: '<p>An algorithm decides if a number is odd or even. An odd number divided by 2 will give the remainder 1.</p><p>The flowchart statements have been written for the algorithm, but the flowchart is incomplete. Complete the flowchart.</p><p><em>This is a drawing question — sketch the flowchart on paper using the correct symbol shapes, then describe your completed flowchart below as a check of your answer.</em></p><pre>Start\n  ↓\n(parallelogram) INPUT num\n  ↓\n(diamond) if num MOD 2 == 0 ?\n  ├─ (labelled branch) ──→ (parallelogram) OUTPUT "Odd"\n  └─ (labelled branch) ──→ (parallelogram) OUTPUT "Even"\n  ↓ (both branches join)\nEnd</pre>',
          hint: 'Use the correct OCR symbol for each box (rounded = start/end, parallelogram = input/output, diamond = decision), label both branches of the decision (True/False or Yes/No), and make sure BOTH branches eventually join up and reach End.',
          starter: 'Start → INPUT num (parallelogram) → decision diamond "num MOD 2 == 0" → False/No branch to OUTPUT "Odd" → True/Yes branch to OUTPUT "Even" → both join → End',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO2)</h5><ul>' +
            '<li>Correct shape for all three inputs AND outputs (parallelogram)</li>' +
            '<li>Correct shape for the decision (diamond)</li>' +
            '<li>True and False // Yes and No labelled correctly (true/Yes linking to "Even")</li>' +
            '<li>All lines joined up correctly and link to End.</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>No need for arrows — lines are acceptable.</li>' +
            '<li>BOD for correct answers that include a loop back to the start.</li>' +
            '</ul></div>',
          modelAnswer: 'Start (rounded) → INPUT num (parallelogram) → decision diamond "num MOD 2 == 0": if True/Yes, follow that branch to OUTPUT "Even" (parallelogram); if False/No, follow that branch to OUTPUT "Odd" (parallelogram) — both branches then join and lead to End (rounded).'
        },
        {
          num: 'Q3a',
          marks: 2,
          type: 'written',
          question: '<p>State what is meant by the term syntax error. Give one example of a syntax error in a program.</p>',
          hint: 'A syntax error breaks the RULES of the language (so it won’t even run) — that’s different from a logic error, which runs but gives the wrong result.',
          starter: 'Definition: … Example: …',
          stubs: ['Definition', 'Example'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1)</h5><ul>' +
            '<li><strong>Definition (max 1 mark, must be clearly different from a logic error):</strong> (an error that) breaks the rules/grammar of the programming language // stops the program from running // does not allow the program to run/crash the program // does not allow the program to translate</li>' +
            '<li><strong>Suitable example (1 mark), e.g.:</strong> misspelling a keyword (e.g. "printt" instead of "print"); missing/extra symbol (e.g. missing bracket, missing semicolon); mismatched quotes; invalid variable/function names (e.g. starting with a number or including a space); incorrect use of operators; using a reserved keyword as a variable name (e.g. print = 3); incorrect capitalisation of keywords (e.g. "Print" instead of "print"); incorrect indentation of code blocks; missing concatenation (e.g. print(score x))</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>BOD "code"/"program" etc. for the definition mark.</li>' +
            '<li>Do not allow answers linked to data types. "Incorrect grammar" by itself is not enough.</li>' +
            '<li>Do not allow "stop working", "does not work", etc. — too vague.</li>' +
            '<li>Do not accept missing quotation marks, e.g. print(hello) (could be a variable name).</li>' +
            '<li>BOD given code that could cause a syntax error in a high-level language.</li>' +
            '</ul></div>',
          modelAnswer: 'Definition: a syntax error is where code breaks the grammar/rules of the programming language, which stops it from running.\n\nExample: missing a closing bracket, e.g. print("Hello"'
        },
        {
          num: 'Q3b',
          marks: 4,
          type: 'written',
          question: '<p>A student writes an algorithm to input two numbers and add them together to create a total. If the total is between 10 and 20 inclusive, "success" is output. If the total is not between 10 and 20 inclusive, "warning" is output.</p><pre>01 num1 = input("Enter a number")\n02 num2 = input("Enter a number")\n03 total = num1 + num1\n04 if total &gt;= 10 then\n05     print("success")\n06 else\n07     print("warning")\n08 endif</pre><p>The algorithm does not work correctly. Identify the line number of the two logic errors in the algorithm and refine the code to correct each logic error.</p>',
          hint: 'Trace it through by hand: line 03 adds the wrong two variables together, and line 04 only ever checks the LOWER boundary, never the upper one.',
          starter: 'Line number: 03. Correction: … | Line number: 04. Correction: …',
          stubs: ['Line number (1st error) / Correction', 'Line number (2nd error) / Correction'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO3, 1 mark each)</h5><ul>' +
            '<li>Line 03</li>' +
            '<li><strong>total = num1 + num2</strong></li>' +
            '<li>Line 04</li>' +
            '<li><strong>if total &gt;= 10 and total &lt;= 20 then</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow other logically-equivalent code that fixes the problem identified and introduces no further errors, e.g. total = int(num1) + int(num2), or if 10 &lt;= total &lt;= 20.</li>' +
            '<li>Allow descriptions of changes as long as it is clear exactly what will change; do not allow ambiguous descriptions of changes to the code.</li>' +
            '<li>Ignore a missing "then" from line 04. Ignore capitalisation.</li>' +
            '</ul></div>',
          modelAnswer: 'Line number: 03. Correction: total = num1 + num2 (was adding num1 to itself).\n\nLine number: 04. Correction: if total >= 10 and total <= 20 then (was never checking the upper boundary of 20).'
        },
        {
          num: 'Q3c(i)',
          marks: 3,
          type: 'written',
          question: '<p>Show how a binary search will be used to find the number 10 in the following data set:</p><pre>1   2   5   6   7   10   20</pre>',
          hint: 'Binary search always starts by picking the MIDDLE value of the current range, then throws away the half that can’t contain the target.',
          starter: 'Compare to the middle value (6)… since 10 > 6, discard the left half and keep the right half… compare to the new middle value (10)…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO2, 1 mark each)</h5><ul>' +
            '<li>Compare to / pick out the middle value (which is 6)</li>' +
            '<li>Discard only the left side // retain only the right side (because 6 &lt; 10)…</li>' +
            '<li>…compare to / pick out (the middle value which is now) 10</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>MP1 can be given for a generic description; MP2 and MP3 must be linked to the data set given.</li>' +
            '<li>For MP2, the candidate must remove 1, 2, 5 and 6 from the list if discussing individual numbers. Allow follow-through for MP3 if this is done incorrectly.</li>' +
            '</ul></div>',
          modelAnswer: 'The middle value of the 7-item list is 6 (index 3). Since 10 is greater than 6, the left half (1, 2, 5, 6) is discarded, leaving (7, 10, 20). The new middle value is 10 — this matches the target, so it is found.'
        },
        {
          num: 'Q3c(ii)',
          marks: 1,
          type: 'written',
          question: '<p>State one pre-requisite for a binary search algorithm.</p>',
          hint: 'Think about what condition the data set must already be in before a binary search can be used at all.',
          starter: 'The data must be…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO1)</h5><ul>' +
            '<li><strong>Data must be sorted / in order</strong></li>' +
            '</ul></div>',
          modelAnswer: 'The data set must already be sorted (in order).'
        },
        {
          num: 'Q3c(iii)',
          marks: 1,
          type: 'mcq',
          question: '<p>Tick (✓) one box to identify the name of the sorting algorithm that splits data into individual items before recombining in order.</p>',
          options: ['Bubble sort', 'Insertion sort', 'Merge sort'],
          answer: 2,
          hint: 'This "split apart then merge back together in order" description is the defining feature of one specific sort.',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO1)</h5><ul>' +
            '<li><strong>Merge sort</strong></li>' +
            '</ul></div>',
          modelAnswer: 'Merge sort'
        },
        {
          num: 'Q4a',
          marks: 2,
          type: 'written',
          question: '<p>A program allows users to search for and watch videos. Users give a rating to the videos they watch.</p><p>Identify one input and one output for the program.</p>',
          hint: 'An input is data the user gives TO the program; an output is data the program gives back to the user.',
          starter: 'Input: … Output: …',
          stubs: ['Input', 'Output'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1, 1 mark for a suitable input, 1 for a suitable output)</h5><ul>' +
            '<li><strong>Input e.g.</strong> name/keyword for the video to search for // search text; controls for watching the video (e.g. play/pause); rating given to a video</li>' +
            '<li><strong>Output e.g.</strong> video to be watched // audio; results of a search; (total/overall/average) rating of a video; number of views of a video; confirmation of data entry/data validity; messages to the user (e.g. "enter a rating", "your rating has been saved") in quotation marks</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow input/print pseudocode statements if they meet the mark point(s) — does not have to be valid pseudocode.</li>' +
            '<li>Do not allow examples of inputs, e.g. "music videos".</li>' +
            '</ul></div>',
          modelAnswer: 'Input: the search text typed by the user to find a video.\n\nOutput: the list of matching videos returned by the search.'
        },
        {
          num: 'Q4b',
          marks: 2,
          type: 'written',
          question: '<p>Describe one method of defensive design that can be used when creating the program.</p>',
          hint: 'Name ONE method (e.g. validation, authentication, maintainability) and describe it with an example specific to this video program — don’t list several methods.',
          starter: 'One method is… this means…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1, only 1 method — name/description/example, or description + example)</h5><ul>' +
            '<li><strong>Authentication</strong> — checking users are allowed to access the site/know the identity of users, by example (e.g. username and password)</li>' +
            '<li><strong>Anticipating misuse // preventing misuse</strong> — stopping the user breaking/hacking into the system, by example (e.g. restricting entry to integers)</li>' +
            '<li><strong>Validation</strong> — check/only allow sensible data to be entered, by example (e.g. restrict ratings to 1–10 / presence check / format check)</li>' +
            '<li><strong>Input sanitisation</strong> — removing invalid/special characters, by example (e.g. remove quotation marks/semicolons)</li>' +
            '<li><strong>Maintainability</strong> — ensuring the program can be understood by others, by example (e.g. modularisation/comments)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow validation/input sanitisation/passwords as an expansion of "anticipating misuse".</li>' +
            '<li>Allow the mark for a description with no/an incorrect name.</li>' +
            '<li>Allow any 2 points from the mark scheme as long as they are clearly linked to a single defensive design method.</li>' +
            '</ul></div>',
          modelAnswer: 'One method is validation — checking that data entered is sensible before it is accepted, for example only allowing a rating between 1 and 10 to be submitted.'
        },
        {
          num: 'Q5a',
          marks: 4,
          type: 'written',
          format: 'truthTable',
          question: '<p>Complete the truth table for <strong>P = (A AND B) OR C</strong></p><table><tr><th>A</th><th>B</th><th>C</th><th>P</th></tr><tr><td>0</td><td>0</td><td>0</td><td></td></tr><tr><td>0</td><td>0</td><td>1</td><td></td></tr><tr><td>0</td><td>1</td><td>0</td><td></td></tr><tr><td>0</td><td>1</td><td>1</td><td></td></tr><tr><td>1</td><td>0</td><td>0</td><td></td></tr><tr><td>1</td><td>0</td><td>1</td><td></td></tr><tr><td>1</td><td>1</td><td>0</td><td></td></tr><tr><td>1</td><td>1</td><td>1</td><td></td></tr></table>',
          hint: 'Work out (A AND B) first for each row, then OR that result with C — do it column by column, not row by row.',
          starter: 'P = 0, 1, 0, 1, 0, 1, 1, 1 (top row to bottom row)',
          truth: { inputs: ['A', 'B', 'C'], output: 'P', pairRows: true, rows: [
            { in: [0, 0, 0], out: 0 }, { in: [0, 0, 1], out: 1 },
            { in: [0, 1, 0], out: 0 }, { in: [0, 1, 1], out: 1 },
            { in: [1, 0, 0], out: 0 }, { in: [1, 0, 1], out: 1 },
            { in: [1, 1, 0], out: 1 }, { in: [1, 1, 1], out: 1 }
          ]},
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO2, 1 mark per group of 2 rows)</h5><ul>' +
            '<li>Rows 1–2 (C=0, C=1 with A=0,B=0): P = 0, 1</li>' +
            '<li>Rows 3–4 (A=0,B=1): P = 0, 1</li>' +
            '<li>Rows 5–6 (A=1,B=0): P = 0, 1</li>' +
            '<li>Rows 7–8 (A=1,B=1): P = 1, 1</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept True/False etc. in place of 1/0.</li>' +
            '</ul></div>',
          modelAnswer: 'P (top to bottom): 0, 1, 0, 1, 0, 1, 1, 1'
        },
        {
          num: 'Q5b',
          marks: 3,
          type: 'written',
          question: '<p>Draw a logic circuit for <strong>P = NOT A AND (B OR C)</strong></p><p><em>This is a drawing question — sketch the circuit on paper using correct gate symbols, then describe your completed circuit below as a check of your answer.</em></p><pre>Inputs: A, B, C          Output: P</pre>',
          hint: 'Build it in the same order as the expression: a NOT gate on A, an OR gate combining B and C, then an AND gate combining those two results to give P.',
          starter: 'A → NOT gate → (one AND input). B and C → OR gate → (other AND input). Both → AND gate → P.',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO3, 1 mark each)</h5><ul>' +
            '<li><strong>NOT A</strong> — a NOT gate with input A</li>' +
            '<li><strong>B OR C</strong> — an OR gate with inputs B and C</li>' +
            '<li><strong>AND gate with two inputs</strong> — combining the NOT A output and the B OR C output to give P</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Max 2 marks if the circuit is not logically correct, or has any additional/missing gates.</li>' +
            '<li>Shapes of gates must be correct with the correct number of inputs; ignore annotation of gate names.</li>' +
            '<li>The NOT gate must include the small circle (bubble); other gates must not include a circle.</li>' +
            '</ul></div>',
          modelAnswer: 'A feeds into a NOT gate. B and C feed into a 2-input OR gate. The outputs of the NOT gate and the OR gate both feed into a 2-input AND gate, whose output is P.'
        },
        {
          num: 'Q6a',
          marks: 3,
          type: 'written',
          format: 'tableFill',
          question: '<p>The variable <code>message</code> is assigned a value.</p><pre>message = "abcd1234"</pre><p>Complete the table to show the output when each statement executes. The first output has been completed for you.</p><table><tr><th>Statement</th><th>Output</th></tr><tr><td><code>print(message.length)</code></td><td>8</td></tr><tr><td><code>print(message.upper)</code></td><td></td></tr><tr><td><code>print(message.left(4))</code></td><td></td></tr><tr><td><code>print(int(message.right(4))*2)</code></td><td></td></tr></table>',
          hint: '.upper capitalises every character; .left(4) takes the first 4 characters; .right(4) takes the last 4 characters, and int() converts that text to a number before doubling it.',
          starter: 'ABCD1234 | abcd | 2468',
          table: { headers: ['Statement', 'Output'], rows: [['print(message.length)', '8'], ['print(message.upper)', null], ['print(message.left(4))', null], ['print(int(message.right(4))*2)', null]] },
          answers: { '1,1': ['ABCD1234'], '2,1': ['abcd'], '3,1': ['2468'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO2, 1 mark for each output)</h5><ul>' +
            '<li><code>print(message.upper)</code> → <strong>ABCD1234</strong> (upper case)</li>' +
            '<li><code>print(message.left(4))</code> → <strong>abcd</strong> (lower case)</li>' +
            '<li><code>print(int(message.right(4))*2)</code> → <strong>2468</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Case must be correct but BOD if ambiguous. Allow quotation marks in the answer.</li>' +
            '</ul></div>',
          modelAnswer: 'ABCD1234, abcd, 2468'
        },
        {
          num: 'Q6b',
          marks: 3,
          type: 'written',
          format: 'codeWrite',
          question: '<p>Write an algorithm in pseudocode to:</p><ul><li>store "Hello" in the variable <code>word1</code></li><li>store "Everyone" in the variable <code>word2</code></li><li>concatenate <code>word1</code> and <code>word2</code> to store "HelloEveryone" in the variable <code>message</code></li></ul>',
          hint: 'Three separate lines: assign word1, assign word2, then combine them into message using whatever concatenation operator your language uses (+, &, or a concat function).',
          starter: 'word1 = "Hello"\nword2 = "Everyone"\nmessage = word1 + word2',
          lines: 6,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO3, 1 mark per bullet point)</h5><ul>' +
            '<li>Storing both strings correctly in word1 and word2</li>' +
            '<li>Correct concatenation (word1 then word2)…</li>' +
            '<li>…storing the result in the variable message</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Example: word1 = "Hello", word2 = "Everyone", message = word1 + word2</li>' +
            '<li>Accept &amp; / + / . etc. as valid concatenation methods. Allow sensible concatenation functions, e.g. concat(). Do not allow commas.</li>' +
            '<li>Do not allow == for assigning a value to a string. Do not allow spaces in variable names — penalise once then follow through.</li>' +
            '<li>Ignore additional code given. Ignore case. A reasonable attempt at the concatenation bullet is needed to access the "storing in message" bullet.</li>' +
            '</ul></div>',
          modelAnswer: 'word1 = "Hello"\nword2 = "Everyone"\nmessage = word1 + word2'
        },
        {
          num: 'Q7a',
          marks: 2,
          type: 'written',
          question: '<p>Programs can be written in high-level languages or low-level languages. Give two reasons why some programs are written in a low-level language.</p>',
          hint: 'Think about speed, direct hardware control, and translation — these are the classic reasons low-level code is chosen.',
          starter: '1. … 2. …',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (AO1, 1 mark each, max 2)</h5><ul>' +
            '<li>(Machine code) does not need to be translated/compiled/interpreted</li>' +
            '<li>Direct control of hardware/memory</li>' +
            '<li>Faster execution time</li>' +
            '<li>Code can be optimised/shorter code/uses less memory</li>' +
            '<li>Can program for specific hardware</li>' +
            '<li>Assembly language is fast to translate</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>"More efficient" by itself is too vague. Mark the first answer on each line.</li>' +
            '</ul></div>',
          modelAnswer: '1. It gives direct control over the hardware and memory.\n\n2. It executes faster because it does not need translating first.'
        },
        {
          num: 'Q7b',
          marks: 3,
          type: 'written',
          question: '<p>Describe the benefits of using a compiler instead of an interpreter when writing a program.</p>',
          hint: 'Focus on what happens AFTER translation is complete (a standalone executable, no translator needed by the end user) rather than just "it translates the whole thing at once".',
          starter: 'A compiler produces… which means the end user…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO1, 1 mark each, max 3)</h5><ul>' +
            '<li>Can produce an executable file</li>' +
            '<li>The program/code runs/executes faster than the interpreted version</li>' +
            '<li>End users do not need a translator</li>' +
            '<li>Can be run again/multiple times without re-translating // only needs to translate once</li>' +
            '<li>End users have no access to source code, distributed with no source code … cannot steal/copy/modify the code/program</li>' +
            '<li>Shows all/multiple errors // shows errors at the end (of compilation) // creates an error file</li>' +
            '<li>Compiler can optimise the code</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow in reverse (e.g. "interpreter translates every time").</li>' +
            '<li>Do not allow "no access to source code" unless clearly talking about the end user; allow if in the context of distribution.</li>' +
            '<li>Do not allow descriptions of HOW a compiler translates (e.g. "translates the whole code in one go").</li>' +
            '<li>"Faster/quicker" by itself is too vague.</li>' +
            '</ul></div>',
          modelAnswer: 'A compiler translates the whole program into an executable file in advance, so the end user does not need a translator installed and the program runs faster. It also means the source code is not distributed, so it cannot easily be copied or modified by others.'
        },
        {
          num: 'Q8a',
          marks: 4,
          type: 'written',
          question: '<p>An algorithm stores the position of a character on a straight line as an integer. A user can move the character left or right.</p><p>The following algorithm generates one random number between 1 and 512 (inclusive) to store as the position, prompts the user to input a direction to move (left or right), and takes a direction as input until a valid direction is input.</p><pre>p = random(1, 512)\nprint("The position is ", p)\na = ""\nwhile a != "left" and a != "right"\n     a = input("Enter direction, left or right")\nendwhile</pre><p>Describe two ways to improve the maintainability of the algorithm.</p>',
          hint: 'Pick two DIFFERENT maintainability techniques (not two examples of the same one) and give a concrete example for THIS algorithm each time, e.g. name an actual meaningful variable or an actual comment.',
          starter: '1. … for example, in this algorithm… 2. … for example, in this algorithm…',
          stubs: ['1', '2'],
          markPoints: {
            note: 'Each way is marked as its own group, up to 2 marks: 1 for naming the technique and saying why it helps, 1 for an example taken from THIS algorithm. Your two ways must be different techniques.',
            groups: [
              { label: 'Your first way', max: 2, points: [
                { text: 'Named a maintainability technique (meaningful identifiers, comments, subroutines or constants) AND said why it helps', marks: 1 },
                { text: 'Gave a concrete example for THIS algorithm (e.g. rename p to position, or store 512 as a constant)', marks: 1 } ] },
              { label: 'Your second way', max: 2, points: [
                { text: 'Named a DIFFERENT maintainability technique AND said why it helps', marks: 1 },
                { text: 'Gave a concrete example of that one for THIS algorithm', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO2, max 2 marks per group)</h5><ul>' +
            '<li><strong>Meaningful identifiers</strong> // meaningful variable names … to describe/show what they store/the purpose of the variable … an example of a meaningful variable identifier for this algorithm</li>' +
            '<li><strong>Comments</strong> … to make it easier for other programmers to follow/understand (part of) the code // explains what the code does // easier to debug … an example of a suitable comment for this algorithm</li>' +
            '<li><strong>Use of subroutines</strong> … to reuse blocks of code // make code easier to follow … an example of a subroutine for this algorithm</li>' +
            '<li><strong>Use of constants</strong> … to store data that will not change during program execution // so data can be changed in one place only … an example of a constant for this algorithm (e.g. store 512 as a constant)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not accept "what variables do" — incorrect verb, variables store/hold data.</li>' +
            '<li>BOD notes (and alternatives) for comments. Do not allow "instructions".</li>' +
            '<li>Do not allow indentation (already done in the program given). Allow whitespace/blank lines (same expansions as comments).</li>' +
            '<li>Do not award the expansion without being clear which method is being discussed — "makes it easier to understand" by itself is too vague.</li>' +
            '</ul></div>',
          modelAnswer: '1. Use meaningful variable names — for example, renaming "p" to "position" and "a" to "direction" would make the algorithm easier to follow.\n\n2. Use constants — for example, storing 512 as a constant such as MAX_POSITION, so the boundary only needs to be changed in one place if it ever changes.'
        },
        {
          num: 'Q8b',
          marks: 6,
          type: 'written',
          format: 'codeGaps',
          question: '<p>If the character moves left, 5 is subtracted from the position. If the character moves right, 5 is added to the position. The position of the character can only be between 1 and 512 inclusive.</p><p>The function <code>moveCharacter()</code>:</p><ul><li>takes the direction (left or right) and current position as parameters</li><li>changes position based on direction</li><li>sets position to 1 if the new position is less than 1</li><li>sets position to 512 if the new position is greater than 512</li><li>returns the new position.</li></ul><p>Complete the function <code>moveCharacter()</code></p><pre>function moveCharacter(direction, position)\n\n\n\n\nendfunction</pre>',
          hint: 'There are three separate jobs to do in order: (1) change position by ±5 based on direction, (2) clamp it back into range if it went below 1 or above 512, (3) return the final position.',
          starter: 'if direction == "left" then\n  position = position - 5\nelseif direction == "right" then\n  position = position + 5\nendif',
          gaps: {
            code: 'function moveCharacter(direction, position)\n\n___1___\n\nreturn position\n\nendfunction',
            answers: ['if direction == "left" then\n  position = position - 5\nelseif direction == "right" then\n  position = position + 5\nendif\n\nif position < 1 then\n  position = 1\nelseif position > 512 then\n  position = 512\nendif']
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 6 marks (AO3, 1 mark each, max 6)</h5><ul>' +
            '<li>Appropriate use of both parameters and no additional inputs/incorrect overwrites that affect the outcome of the algorithm</li>' +
            '<li>Attempt at selection…</li>' +
            '<li>…correctly checking if direction is "left" and subtracting 5 from position (or equivalent)</li>' +
            '<li>…correctly checking if direction is "right" and adding 5 to position (or equivalent)</li>' +
            '<li>Ensuring position (or equivalent) is between 1 and 512 inclusive</li>' +
            '<li>Returning the updated position</li>' +
            '</ul><pre>if direction == "left" then\n  position = position - 5\nelseif direction == "right" then\n  position = position + 5\nendif\n\nif position &lt; 1 then\n  position = 1\nelseif position &gt; 512 then\n  position = 512\nendif\n\nreturn position</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow "else" for the direction/clamp checks (validated in question 8a).</li>' +
            '<li>Allow &lt;=, &gt;= and equivalents (e.g. &lt;= 0) for the clamp-check mark.</li>' +
            '<li>Do not award the clamp-check mark if it comes before the direction checks (it would alter the position value too early).</li>' +
            '<li>The "returning the updated position" mark is only given if an attempt is made at calculating the new position — the calculation can be partial/incorrect.</li>' +
            '<li>Ignore a repeat of the function header/end. Accept flowchart/structured English but it must not just repeat the question.</li>' +
            '<li>If the response uses a loop to incorrectly change position multiple times, do not award the "appropriate use of parameters" mark.</li>' +
            '<li>For minor syntax errors (e.g. missing quotation marks or == for assignment, spaces in variable names) penalise once then follow through.</li>' +
            '</ul></div>',
          modelAnswer: 'if direction == "left" then\n  position = position - 5\nelseif direction == "right" then\n  position = position + 5\nendif\n\nif position < 1 then\n  position = 1\nelseif position > 512 then\n  position = 512\nendif\n\nreturn position'
        }
      ]
    },
    {
      title: 'Section B — we advise you to spend approximately 40 minutes on Section B. Some questions require you to respond using either the OCR Exam Reference Language or a high-level programming language you have studied; these are clearly shown.',
      questions: [
        {
          num: 'Q9a(i)',
          marks: 3,
          type: 'written',
          format: 'tableFill',
          question: '<p>Students take part in a sports day. The students are put into teams. Students gain points depending on their result and the year group they are in. The points are added to the team score. The team with the most points at the end of the sports day wins.</p><p>Data about the teams and students is stored in a sports day program. Identify the most appropriate data type for each variable used by the program. Each data type must be different.</p><table><tr><th>Variable</th><th>Example</th><th>Data type</th></tr><tr><td><code>teamName</code></td><td>"Super-Team"</td><td></td></tr><tr><td><code>studentYearGroup</code></td><td>11</td><td></td></tr><tr><td><code>javelinThrow</code></td><td>18.2</td><td></td></tr></table>',
          hint: 'Look at the example value, not the variable name: text in quotes is a String, a whole number is an Integer, a number with a decimal point is a Real/Float.',
          starter: 'teamName → String | studentYearGroup → Integer | javelinThrow → Real',
          table: { headers: ['Variable', 'Example', 'Data type'], rows: [['teamName', '"Super-Team"', null], ['studentYearGroup', '11', null], ['javelinThrow', '18.2', null]] },
          answers: { '0,2': ['String'], '1,2': ['Integer'], '2,2': ['Real', 'Float'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO3)</h5><ul>' +
            '<li>teamName → <strong>String</strong></li>' +
            '<li>studentYearGroup → <strong>Integer</strong></li>' +
            '<li>javelinThrow → <strong>Real / Float</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept alternative equivalent correct data types (e.g. single/double/decimal for javelinThrow).</li>' +
            '<li>Do not accept "char" for teamName.</li>' +
            '</ul></div>',
          modelAnswer: 'teamName → String\n\nstudentYearGroup → Integer\n\njavelinThrow → Real'
        },
        {
          num: 'Q9a(ii)',
          marks: 4,
          type: 'written',
          format: 'codeGaps',
          question: '<p>The student names for a team are stored in an array with the identifier <code>theTeam</code>. An example of the data in this array is shown:</p><table><tr><th>Index</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td></tr><tr><th>Data</th><td>Ali</td><td>Eve</td><td>Ling</td><td>Nina</td><td>Sarah</td><td>Tom</td></tr></table><p>A linear search function is used to find whether a student is in the team. The function takes a student name as a parameter, returns True if the student name is in the array, and returns False if the student name is not in the array.</p><p>Complete the design of an algorithm for the linear search function.</p><pre>function linearSearch(studentName)\n\n    for count = 0 to ___1___\n\n        if theTeam[___2___] == ___3___ then\n\n             return ___4___\n\n        endif\n\n    next count\n\n    return False\n\nendfunction</pre>',
          hint: 'The loop needs to visit every index of the array (0 up to the last index), check the item at the CURRENT loop position against the parameter, and return True the moment it matches.',
          starter: '(1) theTeam.length() - 1 (2) count (3) studentName (4) True',
          gaps: { code: 'for count = 0 to ___1___\n    if theTeam[___2___] == ___3___ then\n        return ___4___\n    endif\nnext count', answers: ['theTeam.length() - 1', 'count', 'studentName', 'True'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO3)</h5><ul>' +
            '<li>(1) <strong>theTeam.length() - 1 // 5</strong></li>' +
            '<li>(2) <strong>count</strong></li>' +
            '<li>(3) <strong>studentName</strong></li>' +
            '<li>(4) <strong>True</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept 6 // theTeam.length() for (1) (Python-style, where the range excludes the endpoint). Accept alternative length functions, e.g. len().</li>' +
            '<li>Accept count = 5 (and equivalents) for (1). Accept "True" for (4).</li>' +
            '<li>Do not allow obvious spaces in variable names. Ignore capitalisation.</li>' +
            '</ul></div>',
          modelAnswer: '(1) theTeam.length() - 1\n\n(2) count\n\n(3) studentName\n\n(4) True'
        },
        {
          num: 'Q9b',
          marks: 4,
          type: 'written',
          format: 'traceTable',
          question: '<p>This algorithm calculates the number of points a student gets for the distance they throw in the javelin:</p><pre>01   javelinThrow = input("Enter distance")\n02   yearGroup = input("Enter year group")\n03   if javelinThrow &gt;= 20.0 then\n04       score = 3\n05   elseif javelinThrow &gt;= 10.0 then\n06       score = 2\n07   else\n08       score = 1\n09   endif\n10   if yearGroup != 11 then\n11       score = score * 2\n12   endif\n13   print("The score is", score)</pre><p>Complete the trace table for the algorithm when a student in year 10 throws a distance of 14.3. You may not need to use all the rows in the table.</p><table><tr><th>Line number</th><th>javelinThrow</th><th>yearGroup</th><th>score</th><th>Output</th></tr></table>',
          hint: 'Trace line by line: 14.3 fails the ">= 20.0" check but passes the ">= 10.0" check (score=2), then year 10 ≠ 11 doubles it (score=4) — the table should have exactly 4 rows where something changes.',
          starter: 'Line 01: javelinThrow=14.3 | Line 02: yearGroup=10 | Line 06: score=2 | Line 11: score=4 | Line 13: Output "The score is 4"',
          trace: { columns: ['Line number', 'javelinThrow', 'yearGroup', 'score', 'Output'], rows: [
            ['01', '14.3', null, null, null],
            ['02', '14.3', '10', null, null],
            ['06', null, null, '2', null],
            ['11', null, null, '4', null],
            ['13', null, null, null, 'The score is 4']
          ]},
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO3, 1 mark each)</h5><ul>' +
            '<li>javelinThrow set to 14.3 on line 01, and yearGroup set to 10 on line 02</li>' +
            '<li>score set to 2 on line 06</li>' +
            '<li>score set to 4 on line 11</li>' +
            '<li>"The score is 4" output on line 13, with no additional outputs (allow input statements)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The answer may include lines where no change or output happens (i.e. lines 3, 4, 5, 7, 8, 9, 10, 12). Where a variable does not change, its current value may be repeated on subsequent lines.</li>' +
            '<li>Max 3 marks if the rows are in the wrong order or there are additional (incorrect) changes. Penalise line numbers once then follow through.</li>' +
            '<li>Allow follow-through for the score-4 mark, using the candidate’s current value of score.</li>' +
            '<li>The output mark must not include a comma. Ignore superfluous spaces and quotation marks.</li>' +
            '<li>Treat any entry in the output column as an output, even if it is "x", "-" or "0".</li>' +
            '</ul></div>',
          modelAnswer: 'Line 01: javelinThrow = 14.3\n\nLine 02: yearGroup = 10\n\nLine 06: score = 2\n\nLine 11: score = 4\n\nLine 13: Output "The score is 4"'
        },
        {
          num: 'Q9c(i)',
          marks: 4,
          type: 'written',
          format: 'codeWrite',
          question: '<p>The height a student jumps in the high jump needs to be input and validated. The height is entered in centimetres (cm) and must be between 40.0 and 180.0 inclusive.</p><p>Write an algorithm to take the height jumped as input and output "VALID" or "NOT VALID" depending on the height input. You must use either OCR Exam Reference Language or a high-level programming language you have studied.</p>',
          hint: 'One input, one condition checking BOTH boundaries at once (either with "and" checking valid, or "or" checking invalid — just be consistent about which way round VALID/NOT VALID goes), then two matching print/output statements.',
          starter: 'h = input("Enter height jumped")\nif h >= 40 and h <= 180 then\n  print("VALID")\nelse\n  print("NOT VALID")\nendif',
          lines: 8,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO3, 1 mark each)</h5><ul>' +
            '<li>Inputs a value from the user and stores/uses it</li>' +
            '<li>Checks the minimum value (&gt;= 40.0 // &lt; 40)</li>' +
            '<li>Checks the maximum value (&lt;= 180.0 // &gt; 180)</li>' +
            '<li>…outputs both VALID/NOT VALID correctly based on the checks</li>' +
            '</ul><pre>Example 1 (checking for valid input)\nh = input("Enter height jumped")\nif h &gt;= 40 and h &lt;= 180 then\n    print("valid")\nelse\n    print("not valid")\nendif\n\nExample 2 (checking for invalid input)\nh = input("Enter height jumped")\nif h &lt; 40 or h &gt; 180 then\n    print("not valid")\nelse\n    print("valid")\nendif</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Answers using AND/OR for the boundary-checking marks must be logically correct, e.g. "if height &gt;= 40 and height &lt;= 180". Do not accept "if height &gt;= 40 and &lt;= 180".</li>' +
            '<li>Answers using OR will reverse the output logic for the final mark (see Example 2).</li>' +
            '<li>The output mark needs a reasonable attempt at either boundary check; you need to be sure what is being checked to decide which way round valid/invalid should be.</li>' +
            '<li>Allow follow-through for the output mark if a reasonable attempt at validating is made (must include at least one boundary).</li>' +
            '<li>Ignore conversion to int on input. "input" cannot be used as a variable name.</li>' +
            '<li>Greater-than/less-than symbols must be appropriate for a high-level language/ERL — do not accept "=&gt;" (wrong way round) or "≥" (not available on keyboard). No obvious spaces in variable names — penalise once then follow through.</li>' +
            '</ul></div>',
          modelAnswer: 'h = input("Enter height jumped")\nif h >= 40 and h <= 180 then\n  print("VALID")\nelse\n  print("NOT VALID")\nendif'
        },
        {
          num: 'Q9c(ii)',
          marks: 3,
          type: 'written',
          format: 'tableFill',
          question: '<p>The algorithm is tested using a range of tests. Complete the table to identify an example of test data for each type of test.</p><table><tr><th>Test data (height jumped in cm)</th><th>Type of test</th><th>Expected output</th></tr><tr><td></td><td>Normal</td><td>"VALID"</td></tr><tr><td></td><td>Boundary</td><td>"VALID"</td></tr><tr><td></td><td>Erroneous</td><td>"NOT VALID"</td></tr></table>',
          hint: 'Normal = a sensible value well inside the range; Boundary = exactly on the edge of the range (40 or 180); Erroneous = a value outside the range, or not even a number.',
          starter: 'Normal: 100 | Boundary: 40 (or 180) | Erroneous: 200 (or -5, or "abc")',
          table: { headers: ['Test data (height jumped in cm)', 'Type of test', 'Expected output'], rows: [[null, 'Normal', '"VALID"'], [null, 'Boundary', '"VALID"'], [null, 'Erroneous', '"NOT VALID"']] },
          answers: {
            '0,0': ['any value between 40 and 180 inclusive, e.g. 100'],
            '1,0': ['40', '180'],
            '2,0': ['any value less than 40', 'any value greater than 180', 'any non-numeric value, e.g. abc']
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (AO3, 1 mark each)</h5><ul>' +
            '<li><strong>Normal:</strong> any normal value between 40 and 180 inclusive</li>' +
            '<li><strong>Boundary:</strong> 40.0 // 180.0</li>' +
            '<li><strong>Erroneous:</strong> any value less than 40 // any value greater than 180 // any non-numeric value</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>No need to include decimals, e.g. accept 50. Ignore "cm" if given.</li>' +
            '<li>The answer must be actual data (e.g. 50), not a description of data (e.g. "a value between 40 and 180"). If a description is given for the erroneous row, do not accept this as a non-numeric example.</li>' +
            '</ul></div>',
          modelAnswer: 'Normal: 100\n\nBoundary: 40\n\nErroneous: 200'
        },
        {
          num: 'Q9d',
          marks: 4,
          type: 'written',
          format: 'codeGaps',
          question: '<p>The individual results for each student in each event are stored in a database. The database table <code>TblResult</code> stores the times of students in the 100 m race. Some of the data is shown:</p><table><tr><th>StudentID</th><th>YearGroup</th><th>TeamName</th><th>Time</th></tr><tr><td>11GC1</td><td>11</td><td>Valiants</td><td>20.3</td></tr><tr><td>10VE1</td><td>10</td><td>Super-Team</td><td>19.7</td></tr><tr><td>10SM1</td><td>10</td><td>Super-Team</td><td>19.2</td></tr><tr><td>11JP2</td><td>11</td><td>Champions</td><td>19.65</td></tr></table><p>Complete the SQL statement to show the Student ID and team name of all students who are in year group 11</p><pre>SELECT StudentID, ___1___\nFROM ___2___\n___3___ ___4___</pre>',
          hint: 'You need one more column after StudentID, the table name on FROM, and a WHERE clause that filters YearGroup to exactly 11.',
          starter: '(1) TeamName (2) TblResult (3) WHERE (4) YearGroup = 11',
          gaps: { code: 'SELECT StudentID, ___1___\nFROM ___2___\n___3___ ___4___', answers: ['TeamName', 'TblResult', 'WHERE', 'YearGroup = 11'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (AO3, 1 mark each)</h5><ul>' +
            '<li>(1) <strong>TeamName</strong> only in the first space</li>' +
            '<li>(2) <strong>TblResult</strong> in the second space</li>' +
            '<li>(3) <strong>WHERE</strong></li>' +
            '<li>(4) <strong>YearGroup = 11</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Max 3 marks if not in the correct order or includes other logical errors.</li>' +
            '<li>Ignore capitals. Do not accept * or additional fields for (1).</li>' +
            '<li>Spelling must be accurate (e.g. not "TblResults"). No spaces in field names — penalise obvious spaces once then follow through.</li>' +
            '<li>Allow quotation marks around field names, the table name, and 11. Accept == for (3)/(4) (invalid SQL but works in some environments).</li>' +
            '</ul></div>',
          modelAnswer: 'SELECT StudentID, TeamName\nFROM TblResult\nWHERE YearGroup = 11'
        },
        {
          num: 'Q9e(i)',
          marks: 1,
          type: 'written',
          question: '<p>Abstraction and decomposition have been used in the design of the sports day program. Identify one way that abstraction has been used in the design of this program.</p>',
          hint: 'Abstraction means leaving out or simplifying detail that isn’t needed — give an example specific to THIS sports day program, not a textbook definition of abstraction.',
          starter: 'The program focuses on… and ignores…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO3)</h5><ul>' +
            '<li>Any example of simplification/removing data or focusing on data (in the design), e.g. "focus on student names and events"; "ignore data such as students’ favourite subjects"; "store year groups instead of ages or DOB"; "shows student IDs instead of full student details"</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Must be applicable to this program (students and a sports day), not a generic description of what abstraction is. Give BOD where this is unclear.</li>' +
            '</ul></div>',
          modelAnswer: 'The program stores only a StudentID rather than a student’s full personal details, ignoring information that isn’t needed for the sports day.'
        },
        {
          num: 'Q9e(ii)',
          marks: 1,
          type: 'written',
          question: '<p>Identify one way that decomposition has been used in the design of this program.</p>',
          hint: 'Decomposition means breaking the whole program/database down into smaller, manageable parts — name a specific split, like separate tables or separate subroutines per event.',
          starter: 'The program/database is broken down into…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark (AO3)</h5><ul>' +
            '<li>Any example of breaking the program down into sections/subroutines, or breaking the database down into tables, e.g. "splits the program up into different events"; "separates the validation routines into subroutines"; "breaks the database down into a table per event"</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Must be applicable to this program, not a generic description of what decomposition is. Give BOD where this is unclear.</li>' +
            '<li>Do not give answers discussing splitting into fields (e.g. splitting into StudentID, YearGroup, etc.). BOD if the answer discusses one table but suggests other tables could be used.</li>' +
            '<li>Do not give answers relating simply to data being split into smaller groups, unless it clearly relates to how data is decomposed into database tables. Allow reference to "sports day" to mean the sports day program.</li>' +
            '</ul></div>',
          modelAnswer: 'The database is broken down into a separate table for each event (e.g. TblResult for the 100 m race), rather than storing everything in one giant table.'
        },
        {
          num: 'Q9f',
          marks: 6,
          type: 'written',
          format: 'codeWrite',
          question: '<p>An algorithm works out which team has won (has the highest score). Write an algorithm to:</p><ul><li>prompt the user to enter a team name and score, or to enter "stop" to stop entering new teams</li><li>repeatedly take team names and scores as input until the user enters "stop"</li><li>calculate which team has the highest score</li><li>output the team name and score of the winning team in an appropriate message.</li></ul><p>You must use either OCR Exam Reference Language or a high-level programming language you have studied.</p>',
          hint: 'Structure it in the same order as the bullet points: a loop that keeps asking for a team+score until "stop", tracking the best score and its team name as you go, then print both once the loop ends.',
          starter: 'highscore = 0\nteam = ""\nwhile team != "stop"\n  team = input("enter team name")\n  if team != "stop" then\n    score = input("enter score")\n    if score > highscore then\n      highscore = score\n      highteam = team\n    endif\n  endif\nendwhile\nprint(highteam)\nprint(highscore)',
          lines: 12,
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 6 marks (AO3, 1 mark each)</h5><ul>' +
            '<li>Input team name AND score and store/use them separately</li>' +
            '<li>Attempt at using iteration…</li>' +
            '<li>…to enter team/score until "stop" is entered</li>' +
            '<li>Calculates the highest score</li>' +
            '<li>Calculates the winning team name…</li>' +
            '<li>…outputs the highest score and team name</li>' +
            '</ul><pre>Example 1\nhighscore = 0\nwhile team != "stop"\n    team = input("enter team name")\n    score = input("enter score")\n    if score &gt; highscore then\n        highscore = score\n        highteam = team\n    endif\nendwhile\nprint(highscore)\nprint(highteam)\n\nExample 2 (alternative)\nscores = []\nteams = []\nwhile team != "stop"\n    team = input("enter team name")\n    score = input("enter score")\n    scores.append(score)\n    teams.append(team)\nendwhile\nhighscore = max[scores]\nhighteam = teams[scores.index(highscore)]\nprint(highscore)\nprint(highteam)</pre></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>For the iteration mark, allow "stop" to be entered for either team name or score (or both). Allow a third input (e.g. "do you wish to stop?"). Allow use of "break" (or equivalent) to exit the loop.</li>' +
            '<li>Allow use of recursive function(s) for the iteration marks.</li>' +
            '<li>Initialisation of variables is not needed — assume variables are 0 or an empty string if not set.</li>' +
            '<li>Ignore that multiple teams could get the same high score — assume only one team has the highest score.</li>' +
            '<li>The "calculates highest score/team" marks could be done in many ways — allow any logically valid method, including max/sum functions and arrays/lists.</li>' +
            '<li>Allow follow-through for the final output mark if an attempt is made at calculating the highest score/name.</li>' +
            '<li>If the answer simply asks for multiple entries without using iteration, the two iteration marks cannot be accessed, but all others are available.</li>' +
            '<li>For minor syntax errors (e.g. missing quotation marks or == for assignment, spaces in variable names) penalise once then follow through. "input" cannot be used as a variable name.</li>' +
            '</ul></div>',
          modelAnswer: 'highscore = 0\nteam = ""\nwhile team != "stop"\n  team = input("enter team name")\n  if team != "stop" then\n    score = input("enter score")\n    if score > highscore then\n      highscore = score\n      highteam = team\n    endif\n  endif\nendwhile\nprint(highteam)\nprint(highscore)'
        }
      ]
    }
  ]
};
