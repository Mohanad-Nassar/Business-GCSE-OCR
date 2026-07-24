// Practice Paper A · Paper 2 — Computational thinking, algorithms & programming (J277/02)
// ORIGINAL clean-room content, authored from the OCR J277 specification.
// NOT transcribed from any OCR paper, mark scheme or examiner report.
window.MOCK_PAPERS = window.MOCK_PAPERS || {};
window.MOCK_PAPERS['practice-a-p2'] = {
  id: 'practice-a-p2',
  title: 'Practice Paper A · Paper 2 — Algorithms & programming',
  minutes: 90,
  totalMarks: 80,
  sections: [
    {
      title: 'Answer all the questions.',
      questions: [
        {
          num: "Q1",
          marks: 1,
          type: "mcq",
          question: `<p>Tick <strong>one</strong> box to identify the language in which every instruction is already in a form the processor can execute directly, with no translation step needed before it can run.</p>`,
          options: ["A high-level language such as Python", "Assembly language", "Machine code", "A markup language such as HTML"],
          answer: 2,
          hint: "Assembly language still needs an assembler to translate it before the processor can run it — think about which option runs with NO translation step at all.",
          starter: "",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 1 mark</h5>
<ul>
<li><strong>Machine code</strong></li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Only the correct option scores; 2 or more ticks scores 0.</li>
</ul>
</div>`,
          modelAnswer: "Machine code."
        },
        {
          num: "Q2",
          marks: 1,
          type: "mcq",
          question: `<p>A program stores whether a customer has opted in to marketing emails (yes/no). Tick <strong>one</strong> box to identify the most suitable data type for this value.</p>`,
          options: ["Integer", "Boolean", "String", "Real (float)"],
          answer: 1,
          hint: "The value can only ever be one of two states — that points straight at one specific data type.",
          starter: "",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 1 mark</h5>
<ul>
<li><strong>Boolean</strong></li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Only the correct option scores; 2 or more ticks scores 0.</li>
</ul>
</div>`,
          modelAnswer: "Boolean."
        },
        {
          num: "Q3",
          marks: 2,
          type: "written",
          question: `<p>Explain what is meant by <strong>decomposition</strong> when solving a computing problem, and give one benefit of using it.</p>`,
          hint: "First define the term itself, then give a separate reason why splitting the problem up actually helps.",
          starter: "Decomposition means…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 2 marks</h5>
<ul>
<li>Decomposition means breaking a large or complex problem down into smaller, more manageable sub-problems</li>
<li>Benefit — accept any one: each sub-problem is easier to understand, solve or test individually; different sub-problems can be worked on separately (e.g. by different programmers); the overall problem becomes far more manageable once split up</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>1 mark for the definition, 1 mark for a valid benefit, to a maximum of 2.</li>
</ul>
</div>`,
          modelAnswer: "Decomposition means breaking a large, complex problem down into smaller sub-problems. This is useful because each smaller sub-problem is easier to understand, solve and test on its own."
        },
        {
          num: "Q4",
          marks: 2,
          type: "written",
          stubs: ["1", "2"],
          question: `<p>State <strong>two</strong> features of well-written source code that make it easier for another programmer to maintain.</p>`,
          hint: "Think about how the code LOOKS on the page as well as what the programmer has chosen to call things.",
          starter: "1: … 2: …",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 2 marks (1 mark per correct feature, max 2)</h5>
<ul>
<li>Meaningful, sensible variable/function/procedure names</li>
<li>Consistent indentation that shows the structure of the code (e.g. loops, selection)</li>
<li>Comments explaining what sections of the code do</li>
<li>Sensible use of white space/blank lines to separate sections of code</li>
<li>Splitting the code into subprograms (functions/procedures) rather than one long block</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Accept any two distinct valid features from the list above, or an equally valid alternative.</li>
</ul>
</div>`,
          modelAnswer: "1: Using meaningful, sensible variable names instead of single letters. 2: Using consistent indentation so the structure of loops and selection is clear at a glance."
        },
        {
          num: "Q5",
          marks: 3,
          type: "written",
          question: `<p>State what the <code>MOD</code> and <code>DIV</code> operators each calculate, then explain how <code>MOD</code> could be used to check whether an integer stored in the variable <code>n</code> is even.</p>`,
          hint: "MOD and DIV both come from doing a division — one gives you what's left over, the other gives you the whole-number result. Then think about what remainder every even number leaves when divided by 2.",
          starter: "MOD calculates… DIV calculates… To check if n is even…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 3 marks</h5>
<ul>
<li><code>MOD</code> calculates the remainder left over after one integer is divided by another</li>
<li><code>DIV</code> calculates the whole-number (integer) result of dividing one integer by another, discarding any remainder</li>
<li>To check if <code>n</code> is even, test whether <code>n MOD 2 == 0</code> is true — every even number leaves a remainder of 0 when divided by 2</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark per correct point, to a maximum of 3.</li>
</ul>
</div>`,
          modelAnswer: "MOD gives the remainder after dividing one integer by another, while DIV gives the whole-number result of the division with any remainder thrown away. To check whether n is even, the program can test if n MOD 2 == 0, since every even number divides by 2 with nothing left over."
        },
        {
          num: "Q6",
          marks: 3,
          type: "written",
          question: `<p>A list of 500 names is <strong>not</strong> sorted. Explain why a binary search could not be used to search this list reliably, and state what would need to be done before a binary search could be used.</p>`,
          hint: "Think about the middle-item test a binary search relies on at every step, and why that test stops making sense once the order of the data can't be trusted.",
          starter: "A binary search works by repeatedly…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 3 marks</h5>
<ul>
<li>A binary search repeatedly checks the middle item and uses it to eliminate one half of the remaining list, which only works because the data is in order</li>
<li>On an unsorted list this halving logic breaks down — the search could eliminate the half that actually contains the target item, so it could report the item is missing when it is really there</li>
<li>The list would need to be sorted (e.g. using a sorting algorithm) before a binary search could be used on it</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark per correct point, to a maximum of 3.</li>
</ul>
</div>`,
          modelAnswer: "A binary search works by repeatedly checking the middle item of the list and using the order of the data to eliminate one half of the remaining items each time. If the list is not sorted, this halving logic no longer works reliably, so the search could eliminate the half that actually contains the item being searched for and wrongly report that it isn't there. Before a binary search could be used, the list would first need to be sorted into order."
        },
        {
          num: "Q7",
          marks: 4,
          type: "written",
          format: "truthTable",
          question: `<p>Complete the truth table below for the logic expression <code>P = NOT (A AND B)</code>. Click each output cell to cycle it through <code>–</code>, <code>0</code> and <code>1</code>.</p>`,
          truth: {
            inputs: ["A", "B"],
            output: "P",
            rows: [
              { in: [0, 0], out: 1 },
              { in: [0, 1], out: 1 },
              { in: [1, 0], out: 1 },
              { in: [1, 1], out: 0 }
            ]
          },
          hint: "Work out A AND B first for each row, then apply NOT to flip that result.",
          starter: "",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 4 marks (1 mark per correct row)</h5>
<ul>
<li>A=0, B=0 → A AND B = 0 → P = <strong>1</strong></li>
<li>A=0, B=1 → A AND B = 0 → P = <strong>1</strong></li>
<li>A=1, B=0 → A AND B = 0 → P = <strong>1</strong></li>
<li>A=1, B=1 → A AND B = 1 → P = <strong>0</strong></li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>1 mark for each row whose output is correct.</li>
</ul>
</div>`,
          modelAnswer: "P is 1 for every row except A=1, B=1, where A AND B is true so NOT makes P false (0)."
        },
        {
          num: "Q8",
          marks: 4,
          type: "written",
          question: `<p>Explain the difference between a <strong>syntax error</strong> and a <strong>logic error</strong> in a program, giving an example of each.</p>`,
          hint: "One of these stops the program from running at all; the other lets it run but gives the wrong result. Give a short concrete example for each.",
          starter: "A syntax error is… for example… A logic error is… for example…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 4 marks</h5>
<ul>
<li>A syntax error is a mistake that breaks the rules (grammar) of the programming language, so the program cannot be translated/run at all</li>
<li>Example of a syntax error, e.g. missing an <code>endif</code>, misspelling a keyword, missing a bracket or quotation mark</li>
<li>A logic error is a mistake that does not break the language's rules, so the program still runs, but it produces the wrong result</li>
<li>Example of a logic error, e.g. using <code>&lt;</code> instead of <code>&lt;=</code> in a condition, or adding instead of subtracting</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark per correct point, to a maximum of 4.</li>
</ul>
</div>`,
          modelAnswer: "A syntax error breaks the rules of the programming language, so the program cannot even be translated or run, e.g. forgetting the closing endif of an if statement. A logic error does not break any rule, so the program runs, but it produces the wrong result, e.g. using < instead of <= so a boundary value is missed."
        },
        {
          num: "Q9",
          marks: 4,
          type: "written",
          format: "tableFill",
          question: `<p>The algorithm below adds up only the even values in the array <code>a</code>.</p>
<pre>array a = [3, 8, 5, 12]
total = 0
for i = 0 to 3
    if a[i] MOD 2 == 0 then
        total = total + a[i]
    endif
next i
print(total)</pre>
<p>Complete the trace table by writing the value of <code>total</code> after each iteration of the loop.</p>`,
          table: {
            headers: ["i", "a[i]", "total after this iteration"],
            rows: [
              [0, 3, null],
              [1, 8, null],
              [2, 5, null],
              [3, 12, null]
            ]
          },
          answers: {
            "0,2": "0",
            "1,2": "8",
            "2,2": "8",
            "3,2": "20"
          },
          hint: "total only changes on the iterations where a[i] MOD 2 == 0 is true — on every other iteration, write down the value total already had.",
          starter: "",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 4 marks (1 mark per correct row)</h5>
<ul>
<li>i=0: a[0]=3 is odd, so total stays <strong>0</strong></li>
<li>i=1: a[1]=8 is even, so total becomes <strong>8</strong></li>
<li>i=2: a[2]=5 is odd, so total stays <strong>8</strong></li>
<li>i=3: a[3]=12 is even, so total becomes <strong>20</strong></li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>1 mark for each row where the value of total is correct.</li>
</ul>
</div>`,
          modelAnswer: "total: 0, 8, 8, 20 — the final value printed is 20."
        },
        {
          num: "Q10",
          marks: 3,
          type: "written",
          format: "tickGrid",
          question: `<p>Tick <strong>one</strong> box in each row to identify which sorting algorithm each statement describes.</p>`,
          grid: {
            cols: ["Bubble sort", "Merge sort", "Insertion sort"],
            rows: [
              { label: "Repeatedly compares each pair of adjacent items in the list and swaps them if they are in the wrong order, making repeated passes through the list", correct: [0] },
              { label: "Repeatedly splits the list in half until each part holds only one item, then combines the parts back together in the correct order", correct: [1] },
              { label: "Builds up a sorted section of the list one item at a time, inserting each new item directly into its correct position within that section", correct: [2] }
            ]
          },
          hint: "Match each statement to its ONE defining action — repeated adjacent swaps, splitting-then-combining, or building up a sorted section one item at a time.",
          starter: "Row 1: … | Row 2: … | Row 3: …",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 3 marks (1 mark per row)</h5>
<ul>
<li>Row 1 → <strong>Bubble sort</strong></li>
<li>Row 2 → <strong>Merge sort</strong></li>
<li>Row 3 → <strong>Insertion sort</strong></li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Each row is marked independently; 2+ ticks in a single row scores 0 for that row.</li>
</ul>
</div>`,
          modelAnswer: "Row 1: Bubble sort. Row 2: Merge sort. Row 3: Insertion sort."
        },
        {
          num: "Q11",
          marks: 4,
          type: "written",
          format: "matchLine",
          question: `<p>Draw <strong>one</strong> line from each IDE tool to the description that correctly matches it.</p><p>(There are more descriptions than tools — one description is not used.)</p>`,
          match: {
            left: ["Editor", "Error diagnostics", "Run-time environment", "Translator"],
            right: [
              "Provides colour-coding, line numbering and auto-indentation to make source code easier to read and write",
              "Highlights syntax errors and lets the programmer step through code and inspect variable values to help find the cause of a fault",
              "Lets a programmer run and test a program directly within the IDE, without needing separate software to execute it",
              "Converts source code into a form the processor can execute, either by compiling it in one go or interpreting it line by line",
              "Automatically formats a document into columns and page numbers ready for printing"
            ],
            answer: { "0": 0, "1": 1, "2": 2, "3": 3 },
            decoys: [4]
          },
          hint: "Match each tool to what it actually DOES for the programmer — one of the five descriptions is about document formatting, not an IDE tool at all.",
          starter: "Editor → …, Error diagnostics → …, Run-time environment → …, Translator → …",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 4 marks (1 mark per correct line)</h5>
<ul>
<li>Editor → <strong>A</strong> (colour-coding, line numbering, auto-indentation)</li>
<li>Error diagnostics → <strong>B</strong> (highlights syntax errors, lets the programmer step through code and inspect variables)</li>
<li>Run-time environment → <strong>C</strong> (runs and tests the program from within the IDE)</li>
<li>Translator → <strong>D</strong> (converts source code into an executable form, by compiling or interpreting)</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>1 mark for each correct line. Two lines drawn from one tool score 0 for that tool.</li>
<li>Description E (document formatting for printing) is a decoy and is not used by any of the four tools.</li>
</ul>
</div>`,
          modelAnswer: "Editor → helps write and read code. Error diagnostics → finds and helps fix faults. Run-time environment → runs/tests the program in the IDE. Translator → converts source code so it can be executed."
        },
        {
          num: "Q12",
          marks: 4,
          type: "written",
          question: `<p>State what is output by each <code>print</code> statement when the following code runs.</p>
<pre>s = "Computer Science"
t = s.substring(0, 8)
u = s.substring(9, s.length - 9)
print(t.upper)
print(u.lower)
print(t + " " + u.upper)
print(t.length)</pre>`,
          hint: "s.substring(start, len) counts from 0 and takes len characters — work out t and u first, then apply .upper/.lower/.length to what you found.",
          starter: "Line 1: … Line 2: … Line 3: … Line 4: …",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 4 marks</h5>
<p>Working: t = "Computer" (characters 0–7), u = "Science" (7 characters starting at index 9).</p>
<ul>
<li>Line 1 (<code>t.upper</code>): <strong>COMPUTER</strong></li>
<li>Line 2 (<code>u.lower</code>): <strong>science</strong></li>
<li>Line 3 (<code>t + " " + u.upper</code>): <strong>Computer SCIENCE</strong></li>
<li>Line 4 (<code>t.length</code>): <strong>8</strong></li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark for each correct output line, to a maximum of 4.</li>
</ul>
</div>`,
          modelAnswer: "COMPUTER / science / Computer SCIENCE / 8"
        },
        {
          num: "Q13",
          marks: 5,
          type: "written",
          question: `<p>A teacher stores the test scores of 3 students across 4 tests in a 2D array called <code>scores</code>, where <code>scores[s][t]</code> holds the score of student <code>s</code> in test <code>t</code> (both indexed from 0).</p><p>Write an algorithm, using a nested loop, that calculates and prints the total score for <strong>each</strong> student.</p>`,
          hint: "You need two loops: the outer one moves through the students, the inner one adds up that one student's four test scores before you print anything.",
          starter: "for s = 0 to 2…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 5 marks</h5>
<ul>
<li>Outer loop correctly iterates once for each student, e.g. <code>for s = 0 to 2</code></li>
<li>A running total variable is reset to 0 inside the outer loop, before the inner loop starts</li>
<li>Inner loop correctly iterates once for each test, e.g. <code>for t = 0 to 3</code></li>
<li>Each test score is correctly added to the running total, e.g. <code>total = total + scores[s][t]</code></li>
<li>The total is printed once per student, after the inner loop has finished (not inside it)</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark per correct point, to a maximum of 5. Award marks for the algorithm's logic even if the exact ERL syntax used differs slightly.</li>
</ul>
</div>`,
          modelAnswer: "for s = 0 to 2\n    total = 0\n    for t = 0 to 3\n        total = total + scores[s][t]\n    next t\n    print(total)\nnext s"
        },
        {
          num: "Q14",
          marks: 5,
          type: "written",
          question: `<p>A program asks the user to enter their age (in whole years) and a 4-digit PIN. Design an input validation check for <strong>each</strong> of the following, naming the type of check and describing what it does for this specific input:</p><ul><li>(a) the age must be sensible for a human</li><li>(b) the PIN must contain exactly 4 characters, all of which are digits</li><li>(c) an age value must actually be entered before the program continues</li></ul>`,
          hint: "Name the TYPE of check first for each part, then describe what it actually rejects for THAT input — don't just repeat the question back.",
          starter: "(a) … (b) … (c) …",
          markPoints: {
            note: "Three groups, one per validation check the question asks for. Each group needs the check correctly NAMED and correctly described for that specific input to earn its marks.",
            groups: [
              {
                label: "(a) Age check", max: 2, points: [
                  { text: "Names the check as a RANGE check", marks: 1 },
                  { text: "Describes it for THIS input, e.g. rejects the age if it is below 0 or above a sensible maximum such as 120", marks: 1 }
                ]
              },
              {
                label: "(b) PIN check", max: 2, points: [
                  { text: "Names the check as a FORMAT check (or a length check)", marks: 1 },
                  { text: "Describes it for THIS input, e.g. rejects the entry unless it is exactly 4 characters long and every character is a digit", marks: 1 }
                ]
              },
              {
                label: "(c) Presence check", max: 1, points: [
                  { text: "Names it as a PRESENCE check AND says it rejects the entry if the age field was left empty/nothing was typed in", marks: 1 }
                ]
              }
            ]
          },
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 5 marks</h5>
<ul>
<li>(a) Range check — rejects the age if it is below 0 or above a sensible maximum such as 120</li>
<li>(b) Format check (or length check) — rejects the PIN unless it is exactly 4 characters long and every character is a digit</li>
<li>(c) Presence check — rejects the entry if the age field was left empty/nothing was entered</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>(a) 2 marks: 1 for naming a range check, 1 for describing it correctly for age.</li>
<li>(b) 2 marks: 1 for naming a format/length check, 1 for describing it correctly for the PIN.</li>
<li>(c) 1 mark: naming a presence check and describing it correctly for age, together.</li>
</ul>
</div>`,
          modelAnswer: "(a) A range check, rejecting the age unless it is between 0 and a sensible maximum such as 120. (b) A format check, rejecting the PIN unless it is exactly 4 characters long and every character is a digit. (c) A presence check, rejecting the entry if no age was typed in at all."
        },
        {
          num: "Q15",
          marks: 5,
          type: "written",
          question: `<p>Explain the difference between a <strong>function</strong> and a <strong>procedure</strong>, and explain why breaking a program up into subprograms (functions and procedures) is good practice.</p>`,
          hint: "Cover what they have in common first, then the one key difference between them, then two separate reasons subprograms are useful.",
          starter: "A function and a procedure are both…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 5 marks</h5>
<ul>
<li>Both are named, reusable blocks of code that can be called (and can usually accept parameters/arguments)</li>
<li>A function returns a value to the code that called it</li>
<li>A procedure performs a task but does not return a value</li>
<li>Benefit — using subprograms means code that is needed more than once can be written once and called from multiple places, instead of being duplicated</li>
<li>Benefit — subprograms make a program easier to read, test and maintain, since each one can be understood and checked on its own</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark per correct point, to a maximum of 5.</li>
</ul>
</div>`,
          modelAnswer: "A function and a procedure are both named, reusable blocks of code that can be called, often with parameters. The key difference is that a function returns a value to the code that called it, while a procedure just performs a task and does not return a value. Splitting a program into subprograms is good practice because code needed more than once can be written once and called wherever it's needed, instead of being duplicated, and because each subprogram is easier to read, test and maintain on its own."
        },
        {
          num: "Q16",
          marks: 4,
          type: "written",
          question: `<p>The list <code>[8, 3, 6, 1]</code> is to be sorted into ascending order using a bubble sort, which compares each pair of adjacent items and swaps them if they are in the wrong order, then repeats this until a full pass makes no swaps. Show the state of the list after <strong>each</strong> pass, and explain how the algorithm knows when to stop.</p>`,
          hint: "Go left to right comparing pairs, swapping when the left one is bigger — write down the whole list again at the end of each pass.",
          starter: "After pass 1: … After pass 2: … After pass 3: …",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 4 marks</h5>
<ul>
<li>After pass 1: <strong>[3, 6, 1, 8]</strong> (8↔3 swap, 8↔6 swap, 8↔1 swap)</li>
<li>After pass 2: <strong>[3, 1, 6, 8]</strong> (3,6 no swap, 6↔1 swap, 6,8 no swap)</li>
<li>After pass 3: <strong>[1, 3, 6, 8]</strong> — the list is now sorted (3↔1 swap, 3,6 no swap, 6,8 no swap)</li>
<li>States that the algorithm stops once a full pass is made with no swaps, which confirms the list is sorted — this happens on the pass immediately after pass 3</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark per correct point, to a maximum of 4. Award the pass marks even if the stopping-rule point is missed, and vice versa.</li>
</ul>
</div>`,
          modelAnswer: "After pass 1: [3, 6, 1, 8]. After pass 2: [3, 1, 6, 8]. After pass 3: [1, 3, 6, 8], which is sorted. The algorithm knows to stop once it completes a full pass with no swaps, which happens on the pass after pass 3."
        },
        {
          num: "Q17",
          marks: 6,
          type: "written",
          question: `<p>A school stores student records in a database table called <code>Students</code>, with fields <code>StudentID</code>, <code>Name</code> and <code>YearGroup</code>.</p><p>(a) Write an SQL statement to select the <code>Name</code> and <code>YearGroup</code> of every student in year group 11.</p><p>(b) The same data is also kept in a text file, one student per line. Write ERL pseudocode that opens this file for reading, reads and prints every line until the end of the file, then closes the file.</p>`,
          hint: "(a) SELECT the fields you want, FROM the table, WHERE the condition holds. (b) You need open → a loop that checks for the end of the file → close, in that order.",
          starter: "(a) SELECT … (b) myFile = openRead(…)",
          markPoints: {
            note: "Two groups: the SQL statement in (a), and the file-handling pseudocode in (b).",
            groups: [
              {
                label: "(a) SQL statement", max: 3, points: [
                  { text: "SELECT clause lists exactly Name and YearGroup (no other fields)", marks: 1 },
                  { text: "FROM clause names the correct table, Students", marks: 1 },
                  { text: "WHERE clause correctly filters for YearGroup = 11", marks: 1 }
                ]
              },
              {
                label: "(b) File handling pseudocode", max: 3, points: [
                  { text: "Opens the file for reading before doing anything else with it", marks: 1 },
                  { text: "Uses a loop that checks for the end of the file and reads/prints a line on each pass", marks: 1 },
                  { text: "Closes the file after all lines have been read", marks: 1 }
                ]
              }
            ]
          },
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 6 marks</h5>
<ul>
<li>(a) <code>SELECT Name, YearGroup FROM Students WHERE YearGroup = 11</code></li>
<li>(b) Opens the file for reading; loops, reading and printing a line each time, until the end of the file is reached; then closes the file</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>(a) 1 mark each for correct SELECT fields, correct FROM table, correct WHERE condition (max 3).</li>
<li>(b) 1 mark each for opening the file first, for a correctly structured read-until-end-of-file loop, and for closing the file (max 3).</li>
</ul>
</div>`,
          modelAnswer: "(a) SELECT Name, YearGroup FROM Students WHERE YearGroup = 11\n(b) myFile = openRead(\"students.txt\")\nwhile NOT myFile.endOfFile\n    data = myFile.readLine()\n    print(data)\nendwhile\nmyFile.close()"
        },
        {
          num: "Q18",
          marks: 6,
          type: "written",
          question: `<p>The algorithm below is intended to input a positive whole number <code>n</code> and print every <strong>even</strong> number from 1 to <code>n</code>. It contains one syntax error and one logic error.</p>
<pre>01  input n
02  for i = 1 to n
03      if i MOD 2 == 1 then
04          print(i)
05      endfor
06  next i</pre>
<p>(a) Identify the syntax error and state the correct line. (b) Identify the logic error and state the correct line. (c) State what the algorithm as originally written would print for <code>n = 6</code>, and what the corrected algorithm would print for <code>n = 6</code>.</p>`,
          hint: "The syntax error stops the algorithm from being valid ERL at all — look at what closes the IF block. The logic error still runs fine, it just tests the wrong condition for the word 'even'.",
          starter: "(a) The syntax error is… (b) The logic error is… (c) Original output: … Corrected output: …",
          markPoints: {
            note: "Three groups: the syntax error, the logic error, and tracing the outputs.",
            groups: [
              {
                label: "Syntax error", max: 2, points: [
                  { text: "Identifies line 5 ('endfor') as the syntax error — the IF block opened on line 3 is never correctly closed", marks: 1 },
                  { text: "Gives the correct fix: line 5 should read 'endif'", marks: 1 }
                ]
              },
              {
                label: "Logic error", max: 2, points: [
                  { text: "Identifies line 3's condition as the logic error — it currently selects ODD numbers (i MOD 2 == 1), not even ones", marks: 1 },
                  { text: "Gives the correct fix: the condition should read 'i MOD 2 == 0'", marks: 1 }
                ]
              },
              {
                label: "Tracing the outputs", max: 2, points: [
                  { text: "States that the original algorithm would print 1, 3, 5 for n = 6 (the odd numbers)", marks: 1 },
                  { text: "States that the corrected algorithm would print 2, 4, 6 for n = 6 (the even numbers)", marks: 1 }
                ]
              }
            ]
          },
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 6 marks</h5>
<ul>
<li>(a) Syntax error: line 5, <code>endfor</code>, does not correctly close the <code>if</code> block opened on line 3 — it should read <code>endif</code></li>
<li>(b) Logic error: line 3's condition, <code>i MOD 2 == 1</code>, selects odd numbers, not even ones — it should read <code>i MOD 2 == 0</code></li>
<li>(c) Original (uncorrected) algorithm for n=6: <strong>1, 3, 5</strong>. Corrected algorithm for n=6: <strong>2, 4, 6</strong></li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>(a) 1 mark for identifying line 5, 1 mark for the correct fix (max 2).</li>
<li>(b) 1 mark for identifying line 3, 1 mark for the correct fix (max 2).</li>
<li>(c) 1 mark for each correct output list (max 2).</li>
</ul>
</div>`,
          modelAnswer: "(a) Line 5 ('endfor') is the syntax error — it should be 'endif' to close the if-block. (b) Line 3's condition is the logic error — 'i MOD 2 == 1' selects odd numbers, so it should be 'i MOD 2 == 0'. (c) The original algorithm prints 1, 3, 5 for n=6; the corrected algorithm prints 2, 4, 6."
        },
        {
          num: "Q19",
          marks: 6,
          type: "written",
          question: `<p>Write an algorithm, using an array, a loop and selection, that:</p><ul><li>asks the user to input 5 whole numbers and stores them in an array called <code>scores</code></li><li>prints <code>"PASS"</code> for any score that is 50 or more, and <code>"FAIL"</code> for any score below 50</li><li>after all 5 scores have been entered, prints their average</li></ul>`,
          hint: "One count-controlled loop can do all of this: input the score into the array, test it with an if statement, and add it to a running total ready for the average once the loop ends.",
          starter: "array scores[5]\ntotal = 0\nfor i = 0 to 4…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 6 marks</h5>
<ul>
<li>An array is correctly declared and used to store the 5 scores</li>
<li>A count-controlled loop correctly runs exactly 5 times, e.g. <code>for i = 0 to 4</code></li>
<li>Each input value is correctly stored into an element of the array, e.g. <code>input scores[i]</code></li>
<li>Selection correctly tests each score against 50 (e.g. <code>if scores[i] >= 50 then</code>)</li>
<li>"PASS" and "FAIL" are printed from the correct branch of the selection for each score</li>
<li>A running total of the scores is correctly accumulated, and the average (total ÷ 5) is calculated and printed after the loop has finished</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark per correct point, to a maximum of 6. Credit the logic even where the exact ERL syntax used differs slightly.</li>
</ul>
</div>`,
          modelAnswer: "array scores[5]\ntotal = 0\nfor i = 0 to 4\n    input scores[i]\n    if scores[i] >= 50 then\n        print(\"PASS\")\n    else\n        print(\"FAIL\")\n    endif\n    total = total + scores[i]\nnext i\naverage = total / 5\nprint(average)"
        },
        {
          num: "Q20",
          marks: 8,
          type: "written",
          format: "banded",
          question: `<p>A small library wants a program to help staff issue books to members. Each book has a unique 4-digit book ID. When a staff member enters a book ID, the program should check whether that book is currently available, and if so, mark it as issued.</p><p>Design an algorithm for this system, and explain how you would make sure it is robust and reliable. In your answer you might consider:</p><ul><li>how you would break the overall problem down into smaller sub-tasks</li><li>what data structure(s) you would use to hold data about the books, and why</li><li>the algorithm itself, including any selection and/or iteration it needs</li><li>how you would validate the book ID entered by staff</li><li>how you would test the finished program</li></ul>`,
          hint: "Use the bullet list as your plan. Work through decomposition, your data structure choice, the algorithm's logic, validation, and testing — then make sure each part is applied to THIS library system, not written in the abstract.",
          starter: "I would decompose this problem into…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 8 marks (levelled) — indicative content</h5>
<p>The following is indicative of possible factors/evidence that candidates may refer to but is not prescriptive or exhaustive:</p>
<ul>
<li><strong>Decomposition</strong> — the problem could be split into sub-tasks such as: looking up a book by its ID, checking whether it is available, marking it as issued, and validating the ID that was entered.</li>
<li><strong>Data structure</strong> — the books could be held as an array of records (or parallel arrays), each storing a book's ID, title and an available/issued status; a record groups the related fields for one book together, and an array lets every book be searched through by looping over it.</li>
<li><strong>Algorithm</strong> — the program would need to search the array for a record whose ID matches the one entered (a linear search is sufficient here, or a binary search if the array of IDs is kept sorted), then use selection to check the status field: if available, change the status to issued; if not, tell the user it cannot be issued.</li>
<li><strong>Validation</strong> — the entered book ID could be checked with a format check (exactly 4 digits) and/or a presence check (something was actually entered) before the program tries to search for it, so invalid input cannot cause a crash or a wasted search.</li>
<li><strong>Testing</strong> — the program should be tested with normal data (a valid ID for a book that is available), boundary data (e.g. the smallest/largest valid ID), and erroneous data (e.g. an ID that is the wrong length, or one that does not exist), checking each case gives the correct outcome.</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given — levels of response</h5>
<ul>
<li><strong>Band 3 — Thorough (6–8 marks):</strong> Accurate, well-developed coverage of most or all of the bullet points, clearly applied to this library system throughout. The algorithm's logic is correct and its structure (selection/iteration, data structure choice) is justified, and validation and testing are both addressed with specific, relevant detail.</li>
<li><strong>Band 2 — Reasonable (3–5 marks):</strong> Reasonable coverage of several bullet points with mostly accurate knowledge, but application to the library scenario may be partial or generic in places, or one area (e.g. testing, or validation) may be underdeveloped.</li>
<li><strong>Band 1 — Basic (1–2 marks):</strong> Basic or list-like coverage with limited explanation, little clear application to this system, or significant gaps in the algorithm's logic.</li>
<li><strong>0 marks:</strong> No attempt to answer the question, or response is not worthy of credit.</li>
</ul>
</div>`,
          modelAnswer: "I would decompose the problem into: finding a book by its ID, checking whether it's available, and marking it as issued. I'd store the books as an array of records, each holding an ID, title and an available/issued status, since a record keeps each book's related data together and an array lets me search through every book. The algorithm would loop through the array (a linear search) looking for a record whose ID matches the one entered, then use an if statement to check its status: if available, change it to issued; if not, print a message saying it cannot be issued. Before searching, I would validate the entered ID with a format check (must be exactly 4 digits) and a presence check (something must have been entered), so bad input is rejected before it reaches the search. Finally, I would test the program with normal data (an available book's real ID), boundary data (the smallest and largest valid IDs), and erroneous data (an ID of the wrong length, and one that doesn't exist in the array), checking each gives the correct result."
        }
      ]
    }
  ]
};
