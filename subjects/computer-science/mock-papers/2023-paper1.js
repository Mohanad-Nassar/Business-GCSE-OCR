// ══════════════════════════════════════════════════════════════
// MOCK PAPER DATA — June 2023, OCR GCSE (9-1) Computer Science J277/01
// "Computer systems" (source: OCR 704760 question paper + 704882 mark
// scheme; a handful of Examiner's Comments quoted verbatim from the
// 704717 examiner's report, flagged per-question below). Verbatim
// transcription used under the site's free-school-year content policy,
// served behind the auth gate (CS-CONTENT-PLAN.md D5).
//
// Shape: window.MOCK_PAPERS['2023-p1'] = { id, title, minutes, totalMarks,
// sections: [ { title, questions: [ {num, marks, type, format, question,
// hint, starter, markScheme, modelAnswer, ...widget data} ] } ] }.
//
// Question objects reuse the site's examQuestions shape (see
// subjects/computer-science/mock-papers/2024-paper1.js, the gold-standard
// mirror for this file, and cs-lab/exam-widgets.js /
// cs-lab/exam-widgets-grids.js for the widget contract).
//
// markPoints (docs/SELF-MARK-POINTS-AUTHORING.md) are authored on every
// written/prose question whose mark scheme is NOT plainly 1-mark-per-
// bullet — i.e. every "1 mark for X, 1 mark each (max N) for Y" pair/
// chain structure below carries a grouped markPoints object so the self-
// mark checklist cannot over- or under-award against the real scheme.
//
// Cross-check note (CS-CONTENT-PLAN.md consistency pass, 2026-07-17):
// Q5a(i), Q5a(ii) and Q1c of THIS paper were separately transcribed onto
// topic pages 1.2.1-primary-storage-memory.html, 1.2.2-secondary-storage
// .html and 1.2.3-units.html by earlier/parallel agents. This file's
// question/markScheme text for those three was written to match that
// existing transcription exactly (same options, same answer key, same
// mark-scheme wording) for a QA diff.
//
// Known widget-fidelity limitations (flagged, not silently guessed):
//   - Q4a (threat/method grid): the real scheme marks three cells "(✓)
//     can be present, or not" (an optional extra tick that must NOT be
//     penalised). The tickGrid widget requires an EXACT tick set per row
//     (extra ticks void it), so those optional cells are omitted from
//     q.grid's `correct` set — a student who also ticks one of them will
//     be marked wrong by the auto-marker even though OCR would credit it.
//   - Q3b(ii) (pixel-colour grid): the real scheme is row-based (1 mark
//     for the first row of 3 cells correct, 1 mark for the remaining 9
//     cells correct AND in order) — not 1-mark-per-cell. The tableFill
//     widget marks per-cell and caps at q.marks (2), so a student who
//     gets as few as 2 of the 12 cells right scores full marks. This
//     mirrors the same per-cell/whole-mark mismatch already accepted in
//     2024-paper1.js's Q1e (binaryColumn: 8 marked digits, 2 marks) —
//     kept consistent with that established codebase pattern rather than
//     inventing a bespoke fallback for this one question.
// ══════════════════════════════════════════════════════════════

window.MOCK_PAPERS = window.MOCK_PAPERS || {};
window.MOCK_PAPERS['2023-p1'] = {
  id: '2023-p1',
  title: 'June 2023 · Paper 1 — Computer systems (J277/01)',
  minutes: 90,
  totalMarks: 80,
  sections: [
    {
      title: 'Answer ALL questions',
      questions: [
        {
          num: 'Q1a',
          marks: 1,
          type: 'mcq',
          question: '<p>Computers represent data in binary form.</p><p>Tick (✓) <strong>one</strong> box to identify the statement about binary that is true.</p>',
          options: [
            'Binary digits can only be the values 0, 1 and 2',
            'The left-most bit of a binary integer has the smallest value',
            'Binary is used because computers are made of switches that can only be on or off',
            'The smallest whole number that can be stored in 8 bits is the number 1'
          ],
          answer: 2,
          hint: 'Each of the three wrong statements is wrong for a specific, checkable reason — test each one rather than guessing which one feels right.',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>Binary is used because computers are made of switches that can only be on or off</strong> (box 3)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept cross or other indication as long as clear which one they intend.</li>' +
            '<li>2+ ticks = 0 marks.</li>' +
            '</ul></div><div class="marks-section"><h5>Examiner’s Comments</h5>' +
            '<p>This question required candidates to identify the true statement. Many responses identified that the third statement was true. Statement 1 was incorrect because binary digits cannot include the value 2. Statement 2 was incorrect because the left-most bit is the largest value. Statement 4 was most commonly given as an incorrect choice, the smallest whole number that can be stored in 8 bits is the number 0, not the number 1.</p></div>',
          modelAnswer: 'Binary is used because computers are made of switches that can only be on or off.'
        },
        {
          num: 'Q1b',
          marks: 4,
          type: 'written',
          format: 'tableFill',
          question: '<p>Complete the table by writing the missing denary, 8-bit binary or hexadecimal values.</p><table><tr><th>Denary</th><th>8-bit binary</th><th>Hexadecimal</th></tr><tr><td>(1)</td><td>00000111</td><td>7</td></tr><tr><td>49</td><td>(2)</td><td>31</td></tr><tr><td>(3)</td><td>01100110</td><td>66</td></tr><tr><td>244</td><td>11110100</td><td>(4)</td></tr></table>',
          hint: 'Convert one row at a time. Binary→denary: add up the place values of the 1s (128 64 32 16 8 4 2 1). Hex→denary: multiply the left digit by 16 and add the right digit. Denary/hex→binary: work backwards from the largest place value that still fits.',
          starter: '(1) 00000111 = … | (2) 49 = … in binary | (3) 01100110 = … | (4) 11110100 = … in hex',
          table: { headers: ['Denary', '8-bit binary', 'Hexadecimal'], rows: [[null, '00000111', '7'], ['49', null, '31'], [null, '01100110', '66'], ['244', '11110100', null]] },
          answers: { '0,0': ['7'], '1,1': ['00110001'], '2,0': ['102'], '3,2': ['F4'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark for each completed box)</h5><ul>' +
            '<li>7 → <strong>7</strong></li>' +
            '<li>49 → <strong>00110001</strong></li>' +
            '<li>01100110 → <strong>102</strong></li>' +
            '<li>11110100 → <strong>F4</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Binary must be 8 bits.</li>' +
            '<li>Ignore case in hex.</li>' +
            '<li>Ignore any calculations left in the answer box.</li>' +
            '</ul></div>',
          modelAnswer: '(1) 7\n\n(2) 00110001\n\n(3) 102\n\n(4) F4'
        },
        {
          num: 'Q1c',
          marks: 1,
          type: 'mcq',
          question: '<p>Tick (✓) <strong>one</strong> box to identify the largest file size.</p>',
          options: ['2 000 000 bytes', '2300 KB', '200 MB', '0.1 GB'],
          answer: 2,
          hint: 'Convert every option into the same unit (try MB) before comparing.',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>200MB</strong> (box 3)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept cross or other indication as long as clear which one they intend.</li>' +
            '<li>2+ ticks = 0 marks.</li>' +
            '</ul></div><div class="marks-section"><h5>Examiner’s Comments</h5>' +
            '<p>There were a range of responses given by candidates. Many candidates identified 200MB as the correct response. 2300 KB was commonly given as an incorrect response.</p></div>',
          modelAnswer: '200 MB.'
        },
        {
          num: 'Q1d',
          marks: 1,
          type: 'written',
          format: 'tickGrid',
          question: '<p>Tick (✓) <strong>two</strong> boxes to identify the two file sizes that are equal to each other.</p>',
          grid: { cols: ['4 500 000 bytes', '450 KB', '4.5 MB', '0.45 GB'], rows: [{ label: 'Tick two', correct: [0, 2] }] },
          hint: 'Convert every option into the same unit before comparing — exactly two of the four will match.',
          starter: '… and … are equal',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark for both boxes</h5><ul>' +
            '<li><strong>4 500 000 bytes</strong> (box 1)</li>' +
            '<li><strong>4.5 MB</strong> (box 3)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept cross or other indication as long as clear which one they intend.</li>' +
            '<li>1/3+ ticks = 0 marks.</li>' +
            '</ul></div><div class="marks-section"><h5>Examiner’s Comments</h5>' +
            '<p>This question required candidates to work out which of the two file sizes were the same. Candidates had to tick two boxes. Many candidates identified the two correct answers. Correct responses often had working at the side of the answer. There was a range of incorrect answers given where different combinations were selected.</p></div>',
          modelAnswer: '4 500 000 bytes and 4.5 MB are equal (4 500 000 ÷ 1 000 000 = 4.5).'
        },
        {
          num: 'Q1e',
          marks: 2,
          type: 'written',
          format: 'binaryColumn',
          question: '<p>Complete the binary addition by adding these two 8-bit binary numbers. Show all your working.</p><pre>  0 1 1 1 0 0 0 1\n+ 1 0 0 1 1 1 1 0</pre>',
          hint: 'Add column by column from the right, carrying a 1 into the next column whenever a column totals 2 or more — mark every carry so an examiner can follow your working.',
          starter: 'Working: carries shown above the sum … Answer: …',
          binary: { a: '01110001', b: '10011110', bits: 8, answer: '00001111' },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each)</h5><ul>' +
            '<li>Answer <strong>00001111</strong></li>' +
            '<li>Correct working, e.g. carries shown (might be above, below etc.)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not award the working mark for converting each number to denary and adding them together.</li>' +
            '<li>If the carries are present, and converting to denary is also present, still award the carries (the conversion can be used as a check).</li>' +
            '<li>The two marks are not dependent on each other.</li>' +
            '</ul></div>',
          modelAnswer: '01110001 + 10011110, carrying at three columns from the right, = 00001111 (the 9th carry overflows the 8-bit result and is dropped).'
        },
        {
          num: 'Q1f',
          marks: 2,
          type: 'written',
          question: '<p>Identify the binary shift that has been applied to the 8-bit binary number 10110000 to get the result 10000000.</p>',
          hint: 'Compare the two patterns bit by bit — work out which direction the 1s moved, and count how many places.',
          starter: 'Shift direction: … | Number of places: …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each)</h5><ul>' +
            '<li>Left shift</li>' +
            '<li>3 places</li>' +
            '</ul></div>',
          modelAnswer: 'A left shift of 3 places.'
        },
        {
          num: 'Q2a(i)',
          marks: 4,
          type: 'written',
          format: 'tableFill',
          question: '<p>A student is performing a range of actions on the internet using their computer. A range of protocols are used for the transmission of data by the student’s computer, and the web servers they are accessing.</p><p>Complete the table by identifying the most appropriate protocol for each of the tasks the student is performing.</p><table><tr><th>Task</th><th>Protocol</th></tr><tr><td>Requesting to view a news webpage from a web server</td><td>(1)</td></tr><tr><td>Entering a username and password to access their bank account</td><td>(2)</td></tr><tr><td>Downloading a text document from a web server</td><td>(3)</td></tr><tr><td>Checking for new emails in their inbox</td><td>(4)</td></tr></table>',
          hint: 'Think about what each task actually needs: a plain page request, a SECURE login, a file transfer, or checking a mailbox — each maps to a different protocol family.',
          starter: '(1) … (2) … (3) … (4) …',
          table: { headers: ['Task', 'Protocol'], rows: [['Requesting to view a news webpage from a web server', null], ['Entering a username and password to access their bank account', null], ['Downloading a text document from a web server', null], ['Checking for new emails in their inbox', null]] },
          answers: {
            '0,1': ['HTTP', 'HTTPS'],
            '1,1': ['HTTPS'],
            '2,1': ['FTP', 'HTTP', 'HTTPS', 'File transfer protocol'],
            '3,1': ['IMAP', 'POP', 'POP3']
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark for each protocol)</h5><ul>' +
            '<li>Requesting a webpage from a web server → <strong>HTTP // HTTPS</strong></li>' +
            '<li>Entering a username and password to access their bank account → <strong>HTTPS</strong></li>' +
            '<li>Downloading a text document from a web server → <strong>FTP // HTTP // HTTPS</strong></li>' +
            '<li>Checking for new emails in their inbox → <strong>IMAP // POP</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Mark the first answer in each box.</li>' +
            '<li>Allow the full name to be written, e.g. "file transfer (protocol)".</li>' +
            '<li>Accept POP3 or any other version.</li>' +
            '</ul></div>',
          modelAnswer: '(1) HTTPS\n\n(2) HTTPS\n\n(3) FTP\n\n(4) IMAP'
        },
        {
          num: 'Q2a(ii)',
          marks: 2,
          type: 'written',
          question: '<p>Some protocols have layers.</p><p>Give <strong>two</strong> reasons why protocols have layers.</p>',
          hint: 'Think about what splitting a job into independent layers actually buys you — for the people building the software as well as the network as a whole.',
          starter: '1. … 2. …',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2)</h5><ul>' +
            '<li>Each layer is independent // layers are not reliant on other layers</li>' +
            '<li>One layer can be changed without affecting the others // a layer can function without needing/changing/impacting any other layer // self-contained</li>' +
            '<li>Separates tasks so they can be developed independently</li>' +
            '<li>A developer can focus on only one layer // developer can specialise</li>' +
            '<li>Allows standards for individual tasks/layers to be developed // for compatibility</li>' +
            '<li>Manufacturers can develop hardware to fit into one particular layer</li>' +
            '<li>To group together similar protocols</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Max 1 mark in each answer space — the two reasons must be genuinely different.</li>' +
            '</ul></div>',
          modelAnswer: '1. Each layer works independently, so a layer can be changed or updated without affecting the others.\n\n2. It lets a developer or manufacturer specialise and focus on just one layer.'
        },
        {
          num: 'Q2b(i)',
          marks: 1,
          type: 'written',
          question: '<p>The student’s computer is part of their home Local Area Network (LAN). The LAN currently only has wired connections.</p><p>One characteristic of a LAN is that they are set up over a small geographical area.</p><p>Give <strong>one</strong> other characteristic of a LAN.</p>',
          hint: 'Think about who owns the hardware/infrastructure in a LAN, and how devices on it identify each other.',
          starter: '…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li>Uses dedicated/own/internal hardware // no external/third-party hardware/infrastructure // computers use MAC addresses to communicate within the LAN</li>' +
            '</ul></div>',
          modelAnswer: 'A LAN uses its own dedicated hardware/infrastructure, owned by the organisation or household it belongs to.'
        },
        {
          num: 'Q2b(ii)',
          marks: 4,
          type: 'written',
          question: '<p>Describe the benefits of the student changing their home LAN to include wireless connections.</p>',
          hint: 'A good answer usually pairs each benefit with a short example — "more devices can connect, e.g. TVs and phones" scores better than "more devices" alone.',
          starter: 'Wireless connections would allow…, for example…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark each, max 4)</h5><ul>' +
            '<li>Allows more devices to connect… …for example televisions, mobile phones</li>' +
            '<li>Easy to connect (devices) // easier to setup (wireless connections) // by example, e.g. easier for guests to connect their devices</li>' +
            '<li>Home is likely a small area… …so short-distance wireless is sufficient</li>' +
            '<li>Devices can move around // can use devices in different areas // can connect from anywhere in the house // can use where wires don’t reach // can access from a larger area (than wired)… …by example, e.g. student is using a laptop so does not need to be tied to one place // they don’t have to disconnect before moving // they can stay connected whilst moving</li>' +
            '<li>Cheaper to purchase/install/setup for new devices // no cost for (new/replacement) wires/hardware… …because no additional/fewer wires are needed</li>' +
            '<li>Fewer trip hazards from trailing wires // reduces risk of damage to cables // fewer cables to damage</li>' +
            '<li>More compatible // some devices only have wireless connections</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>"Easier" or "cheaper" on its own is not enough — it must be developed.</li>' +
            '</ul></div>',
          modelAnswer: 'Wireless connections would let more devices join the network easily (e.g. TVs and phones), and would let the student use their laptop from anywhere in the house rather than being tied to a wired port. It would also remove the cost and trip hazard of running new cables to every device.'
        },
        {
          num: 'Q2b(iii)',
          marks: 2,
          type: 'written',
          question: '<p>State <strong>two</strong> drawbacks of changing their home LAN to include wireless connections.</p>',
          hint: 'Think about what a wired signal has that a wireless one doesn’t: a dedicated cable with nothing else competing for it.',
          starter: '1. … 2. …',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2)</h5><ul>' +
            '<li>Prone to interference // by example</li>' +
            '<li>Limited range of signal</li>' +
            '<li>Slower rate of transmission // less bandwidth // reduced network performance // increased latency (must say what is slower/decreased — "it’s slower" alone is not enough)</li>' +
            '<li>Increased risk of security concerns // by example, e.g. a hacker could connect to the wireless connection</li>' +
            '<li>Less stable connection (not enough on its own without a reason)</li>' +
            '<li>Higher chance of collisions // higher error rate</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Mark the first drawback given in each answer space.</li>' +
            '</ul></div>',
          modelAnswer: '1. Wireless signals are prone to interference from other devices/walls.\n\n2. Wireless connections have a limited range of signal.'
        },
        {
          num: 'Q3a',
          marks: 5,
          type: 'written',
          format: 'bankCloze',
          question: '<p>Binary numbers can represent different forms of data. One form of data is characters.</p><p>Complete the description of how computers represent characters in binary using the given list of terms. Not all terms will be used.</p>',
          hint: 'Read each sentence fully before picking a word — several bank words are near-synonyms (e.g. "unique"/"different"/"similar") and only certain ones fit the exact meaning needed. For the last blank, count forward through the alphabet from F (code 70) to L.',
          starter: '(1) … (2) … (3) … (4) … (5) …',
          cloze: '<p>A character set stores ___1___ of the characters that the computer can represent. Each character is given a ___2___ binary code. Lower-case and upper-case letters in a character set are given ___3___ binary codes.</p><p>One example of a character set is ASCII. This character set uses ___4___ bits for each character. If the code value for the character ‘F’ is 70 then the code value for the character ‘L’ is ___5___.</p>',
          bank: ['2', '4', '8', '9', '16', '32', '256', '71', '72', '74', '76', '78', '80', '81', 'all', 'different', 'identical', 'one', 'repeated', 'similar', 'some', 'unique'],
          answers: ['all', ['unique', 'different'], ['unique', 'different', 'similar'], '8', '76'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 5 marks (1 mark for each completed space)</h5><ul>' +
            '<li>A character set stores <strong>all</strong> of the characters that the computer can represent.</li>' +
            '<li>Each character is given a <strong>unique/different</strong> binary code.</li>' +
            '<li>Lower-case and upper-case letters in a character set are given <strong>unique/different/similar</strong> binary codes.</li>' +
            '<li>ASCII uses <strong>8</strong> bits for each character.</li>' +
            '<li>If ‘F’ is 70, then ‘L’ is <strong>76</strong>.</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Award the same term used multiple times if it is used correctly each time.</li>' +
            '</ul></div>',
          modelAnswer: '(1) all (2) unique (3) similar (4) 8 (5) 76'
        },
        {
          num: 'Q3b(i)',
          marks: 1,
          type: 'written',
          question: '<p>Binary numbers can also represent images. The table shows the colours used in an image and the binary value for each colour.</p><table><tr><th>Colour</th><th>Binary value</th></tr><tr><td>Red</td><td>0000</td></tr><tr><td>Green</td><td>0010</td></tr><tr><td>Blue</td><td>1000</td></tr><tr><td>Purple</td><td>0110</td></tr></table><p>The metadata states that the image is 3 pixels wide by 4 pixels high. The data in the file starts in the top left of the image and goes from left-to-right, top-to-bottom.</p><p>State what is meant by <strong>metadata</strong> in an image file.</p>',
          hint: 'The question wants a definition of the term, not an example of a specific piece of metadata.',
          starter: 'Metadata is…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li>Data about the data/image/file</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The question asks for a definition, not an example. "Details about the image" / "information about the image" on its own is not enough, but read on for an example that clarifies it, e.g. "information about the image, such as the number of pixels" is benefit of the doubt.</li>' +
            '<li>Data could be described as properties/characteristics.</li>' +
            '</ul></div>',
          modelAnswer: 'Metadata is data about the image file itself, such as its width and height in pixels, rather than the actual pixel data.'
        },
        {
          num: 'Q3b(ii)',
          marks: 2,
          type: 'written',
          format: 'tableFill',
          question: '<p>The binary data stored for the image is given:</p><p>000000000110100000101000011001100110000000101000</p><p>A grid is given for the image. Each square is one pixel. Write the name of the colour in each square that the pixel will show for this image.</p><table><tr><td>(1)</td><td>(2)</td><td>(3)</td></tr><tr><td>(4)</td><td>(5)</td><td>(6)</td></tr><tr><td>(7)</td><td>(8)</td><td>(9)</td></tr><tr><td>(10)</td><td>(11)</td><td>(12)</td></tr></table>',
          hint: 'Split the 48-bit string into 12 groups of 4 bits (the colour depth), reading left to right, then top row to bottom row — then match each 4-bit group to its colour in the table above.',
          starter: 'Group the bits into 4s, then look each one up in the colour table…',
          table: { headers: [], rows: [[null, null, null], [null, null, null], [null, null, null], [null, null, null]] },
          answers: {
            '0,0': ['Red'], '0,1': ['Red'], '0,2': ['Purple'],
            '1,0': ['Blue'], '1,1': ['Green'], '1,2': ['Blue'],
            '2,0': ['Purple'], '2,1': ['Purple'], '2,2': ['Purple'],
            '3,0': ['Red'], '3,1': ['Green'], '3,2': ['Blue']
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each)</h5><ul>' +
            '<li>First row correct: <strong>red, red, purple</strong></li>' +
            '<li>Remainder correct and in the correct order: <strong>blue, green, blue, purple, purple, purple, red, green, blue</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Ignore case/spelling as long as it is legible.</li>' +
            '<li>If a candidate completes the table in the wrong layout (e.g. right-to-left, or bottom-to-top), award the second mark as a follow-through if the colours are otherwise all correct.</li>' +
            '</ul></div>',
          modelAnswer: 'Row 1: Red, Red, Purple\n\nRow 2: Blue, Green, Blue\n\nRow 3: Purple, Purple, Purple\n\nRow 4: Red, Green, Blue'
        },
        {
          num: 'Q3b(iii)',
          marks: 1,
          type: 'written',
          question: '<p>A colour depth of 4 is used. This means 4 bits are used to store the colour for each pixel.</p><p>State the maximum number of different colours that can be represented in 4-bits.</p>',
          hint: 'The number of values N bits can represent is 2 to the power N.',
          starter: '…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>16</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept any calculation that equates to 16, e.g. 2⁴.</li>' +
            '</ul></div>',
          modelAnswer: '16 (2 to the power 4).'
        },
        {
          num: 'Q3b(iv)',
          marks: 2,
          type: 'written',
          question: '<p>The colour depth is increased to 2 bytes. State <strong>two</strong> effects that this change can have on the image.</p>',
          hint: 'A bigger colour depth changes both how the image LOOKS and how much SPACE it takes up.',
          starter: '1. … 2. …',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2)</h5><ul>' +
            '<li>The quality of the image can be improved</li>' +
            '<li>The file size will increase // takes up more storage space // the image has/requires/takes up more data</li>' +
            '<li>The number of colours that can be represented/used will increase (benefit of the doubt "more colourful")</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not award "higher resolution", "image size increases", "clearer image" or "more detailed image" — these are not enough on their own.</li>' +
            '<li>"Closer to the original" is not enough on its own — there is no original image in this context.</li>' +
            '<li>Mark the first answer given in each answer space.</li>' +
            '</ul></div>',
          modelAnswer: '1. The number of colours that can be represented will increase, so the image quality can improve.\n\n2. The file size will increase, since more bits are now stored for every pixel.'
        },
        {
          num: 'Q3c(i)',
          marks: 3,
          type: 'written',
          question: '<p>A student has a text document and an image file that need to be compressed separately. The student needs to reduce the file size of both of these files as much as possible.</p><p>Identify the most suitable type of compression for the text document. Justify your choice.</p>',
          hint: 'Text files need every single character to stay exactly the same, or the document could become meaningless — think about which compression type promises that.',
          starter: 'Type of compression: … Justification: …',
          stubs: ['Type of compression', 'Justification'],
          markPoints: {
            note: 'One mark for correctly identifying lossless compression, then up to two more for a justification that develops WHY lossless suits a text file specifically.',
            groups: [
              { label: 'Your type of compression', max: 1, points: [
                { text: 'Identified lossless compression', marks: 1 } ] },
              { label: 'Your justification', max: 2, points: [
                { text: 'Says no data is lost with lossless, and the file/data can be fully reconstructed back to the original (must reference the DATA, not just "information")', marks: 1 },
                { text: 'Explains why a text file specifically needs this — e.g. the text needs all its data to open/work/make sense, or lossy compression could lose characters, spaces, case or formatting and change its meaning', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks</h5><ul>' +
            '<li>1 mark for <strong>lossless</strong></li>' +
            '<li>1 mark each to max 2 for justification, e.g.: Lossless will not remove any data // no data is lost with lossless // file/data can be fully reconstructed back to the original; Text files require all data to open/be used/work // text files will not work if any data is lost // lossy cannot (usually) be used on text files // none of the required characters/words/spaces/case/formatting/information would be lost // the text will remain accurate/not change meaning/still make sense</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not award an example of lossless (e.g. RLE) for the first mark, but follow through for the justification.</li>' +
            '<li>Do not follow through for lossy.</li>' +
            '<li>Accept the reverse phrasing, e.g. "lossy will remove data".</li>' +
            '<li>If the compression type is missing, read the justification — if it clearly states which type is meant, award it.</li>' +
            '<li>MP1 of the justification requires reference to the data (or equivalent), not "information". MP2 requires reference to the text-file context; "information" is allowed there.</li>' +
            '<li>If not a valid compression type, 0 marks overall.</li>' +
            '</ul></div>',
          modelAnswer: 'Type of compression: Lossless\n\nJustification: Lossless compression does not remove any data, so the file can be reconstructed back to exactly the original. This matters for a text document because every character, space and piece of formatting must be preserved, or the text could lose its meaning or fail to open correctly.'
        },
        {
          num: 'Q3c(ii)',
          marks: 3,
          type: 'written',
          question: '<p>Identify the most suitable type of compression for the image file. Justify your choice.</p>',
          hint: 'Images can usually lose a little detail without a viewer noticing — think about which compression type takes advantage of that to shrink the file more.',
          starter: 'Type of compression: … Justification: …',
          stubs: ['Type of compression', 'Justification'],
          markPoints: {
            note: 'One mark for correctly identifying lossy compression, then up to two more for a justification that develops WHY lossy suits an image file that must be reduced as much as possible.',
            groups: [
              { label: 'Your type of compression', max: 1, points: [
                { text: 'Identified lossy compression', marks: 1 } ] },
              { label: 'Your justification', max: 2, points: [
                { text: 'Says lossy compression reduces the file size more/more significantly than lossless', marks: 1 },
                { text: 'Says the image will only lose quality, and changes may not be noticed by the user / it removes unnoticeable or unnecessary detail', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks</h5><ul>' +
            '<li>1 mark for <strong>lossy</strong></li>' +
            '<li>1 mark each to max 2 for justification, e.g.: Will reduce the file size more/significantly (than lossless); Image will only lose quality // changes may not be noticed by the user // removes unnoticeable/unnecessary detail/content</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not award an example of lossy (e.g. reduce resolution) for the first mark, but follow through for justification.</li>' +
            '<li>Do not award lossless, but follow through for a lossless-style justification if the type is wrong, e.g. "quality/detail can be retained" or "no data will be lost (permanently)" or "file size may still be a substantial reduction".</li>' +
            '<li>If the compression type is missing, read the justification — if it clearly states which type is meant, award it.</li>' +
            '<li>Do not award simply describing how the file could be compressed (e.g. "reduce the number of colours") unless it also states this change will not be noticed.</li>' +
            '<li>"It compresses the file more" alone is not enough — compression is already in the question; the candidate must explain what that means.</li>' +
            '<li>If not a valid compression type, 0 marks overall.</li>' +
            '</ul></div>',
          modelAnswer: 'Type of compression: Lossy\n\nJustification: Lossy compression reduces the file size much more than lossless, because it permanently removes some detail from the image. Any quality lost is usually unnoticeable to the viewer, so this trade-off is worth making to get the file as small as possible.'
        },
        {
          num: 'Q4a',
          marks: 4,
          type: 'written',
          format: 'tickGrid',
          question: '<p>Tick (✓) <strong>one or more</strong> boxes on each row to identify all of the methods that can help to prevent each threat.</p>',
          grid: {
            cols: ['Anti-malware', 'Penetration testing', 'Encryption', 'Firewall'],
            rows: [
              { label: 'Spyware', correct: [0] },
              { label: 'Brute-force attack', correct: [3] },
              { label: 'Data interception', correct: [2] },
              { label: 'SQL injection', correct: [1] }
            ]
          },
          hint: 'For each threat, ask "which of these four tools actually stops or catches THIS specific threat?" — some rows also accept a second, optional tick (see the guidance below), but every row has one tick that is definitely required.',
          starter: 'Spyware: … | Brute-force attack: … | Data interception: … | SQL injection: …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark for each row)</h5><ul>' +
            '<li>Spyware → <strong>Anti-malware</strong> (Firewall may also be ticked or not — either way is accepted)</li>' +
            '<li>Brute-force attack → <strong>Firewall</strong> (Penetration testing may also be ticked or not — either way is accepted)</li>' +
            '<li>Data interception → <strong>Encryption</strong></li>' +
            '<li>SQL injection → <strong>Penetration testing</strong> (Firewall may also be ticked or not — either way is accepted)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The bracketed methods above can be present, or not, without affecting the mark.</li>' +
            '</ul></div>',
          modelAnswer: 'Spyware: Anti-malware. Brute-force attack: Firewall. Data interception: Encryption. SQL injection: Penetration testing.'
        },
        {
          num: 'Q4b',
          marks: 3,
          type: 'written',
          question: '<p>Name <strong>and</strong> describe <strong>one</strong> threat to a computer system that is not given in question 4(a).</p>',
          hint: 'Pick a threat you can describe in two distinct steps — what it does first, then what happens as a result (e.g. what it tricks the user into doing, or what it does to the data).',
          starter: 'Threat: … Description: …',
          stubs: ['Threat', 'Description'],
          markPoints: {
            note: 'One mark for naming a genuine threat not already listed in Q4(a) (anti-malware, penetration testing, encryption, firewall are the FOUR items in that question — spyware, brute-force attack, data interception and SQL injection are the four THREATS already used, so you cannot reuse them here). Up to two more marks for a description that develops in two distinct steps.',
            groups: [
              { label: 'Your threat', max: 1, points: [
                { text: 'Named a different, genuine threat — e.g. social engineering, shoulder surfing, phishing, pharming, denial-of-service, a hacker, virus/malware, trojan, worm, ransomware, or a physical threat', marks: 1 } ] },
              { label: 'Your description', max: 2, points: [
                { text: 'Described what the threat actually does / how it works', marks: 1 },
                { text: 'Gave a second, distinct detail about its effect (e.g. what happens to the data or system, or what the attacker gains/does with it)', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks</h5><ul>' +
            '<li>1 mark for the threat</li>' +
            '<li>1 mark each to max 2 for description, e.g.: Social engineering — using deception to manipulate users… …to gain personal data; Shoulder surfing — watching a person entering a password… …and using it to access an account; Phishing — fake emails sent to a person // click on link from fake email… …person sends/gives away personal data; Pharming — software that redirects a user to a fake website // use of a fake website… …person enters/gives away personal data; Denial of service // DOS // DDOS — multiple requests sent to a server (simultaneously) // server is flooded with requests… …server cannot respond/crashes/denies access/slows access; Hacker — person gaining unauthorised access to a system/account… …to delete/damage/access data; Virus/malware — software that replicates/spreads… …fills disk space, deletes/corrupts data, allows unauthorised access; Trojan — malware disguised as legitimate software… …once installed acts as a virus; Worm — software that replicates across a network… …uses up all the bandwidth; Ransomware — encrypts/corrupts/locks access to data… …cannot access data without paying a fee/meeting demands; Physical threat — damage to hardware… …deletes/corrupts data</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>If the threat named is clearly wrong, do not follow through the description.</li>' +
            '<li>If no threat is given, read the description for the name of a threat — if none is identifiable, do not award.</li>' +
            '<li>If the threat is vague, award a matching description if it clearly describes a valid threat (e.g. "social engineering" credited via a phishing/pharming/shoulder-surfing description).</li>' +
            '<li>For ransomware, "ransom" alone (without reference to it being paid) is not enough for the second description mark.</li>' +
            '</ul></div>',
          modelAnswer: 'Threat: Phishing\n\nDescription: Fake emails are sent that look like they are from a trustworthy sender, tricking the person into clicking a link. This leads the person to give away personal data such as passwords or bank details.'
        },
        {
          num: 'Q5a(i)',
          marks: 2,
          type: 'written',
          stubs: ['Primary storage', 'Secondary storage'],
          question: '<p>An artist has a computer that they use to create images. Their computer has both hardware and software. The hardware includes primary and secondary storage.</p><p>Explain why a computer needs both primary <strong>and</strong> secondary storage.</p>',
          hint: 'Two separate reasons — one for WHY primary storage is needed, one for WHY secondary storage is needed. The question is asking why they’re needed, not what they store.',
          starter: 'Primary storage is needed because…, and secondary storage is needed because…',
          markPoints: {
            note: 'One mark for a correct reason primary storage is needed, one mark for a correct reason secondary storage is needed — you must cover both sides to reach full marks.',
            groups: [
              { label: 'Your reason for primary storage', max: 1, points: [
                { text: 'Gives a correct reason primary storage is needed — e.g. to store (active) data/instructions/software the processor needs to access, or without it the computer couldn’t start up/work', marks: 1 } ] },
              { label: 'Your reason for secondary storage', max: 1, points: [
                { text: 'Gives a correct reason secondary storage is needed — e.g. to store data/files long-term/permanently, so they aren’t lost when the power is off (NOT just ‘to back up data’)', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each)</h5><ul>' +
            '<li><strong>Primary</strong> — to store (active) data/instructions/software/OS that the processor needs to access // without primary the computer won’t be able to start up/work // (ROM) so the start-up instructions are not deleted when the computer turns off // (RAM) to store the currently running data/software/instructions // (Cache) to store frequently used data/instructions</li>' +
            '<li><strong>Secondary</strong> — to store data/files long-term/permanently // without secondary the user’s files will not be stored when the power is turned off // store data not currently being used</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The question is not asking what they store, but WHY they are needed.</li>' +
            '<li>Secondary storage: not "to backup data" without reference to long-term/permanence.</li>' +
            '</ul></div><div class="marks-section"><h5>Examiner’s Comments</h5>' +
            '<p>Some candidates found this question challenging and often gave examples of each type of storage instead of answering why both are required. Some candidates were able to accurately describe the purpose of primary storage as storing currently running data and software.</p>' +
            '<p><strong>Misconception:</strong> a common misconception was that secondary storage is used when primary storage is full, or that it is only used as a backup.</p></div>',
          modelAnswer: 'Primary storage (RAM) is needed to hold the data, instructions and software the processor is currently using, so the CPU can access them directly and quickly.\n\nSecondary storage is needed to store the user’s files and programs long-term/permanently, so they are not lost when the power is turned off.'
        },
        {
          num: 'Q5a(ii)',
          marks: 2,
          type: 'written',
          stubs: ['Secondary storage device', 'Example data'],
          question: '<p>Give <strong>one</strong> example of a secondary storage device that the artist’s computer will have <strong>and</strong> an example of the data that will be stored on it.</p>',
          hint: 'Name an actual DEVICE (e.g. a hard drive or SSD), not just a type (e.g. ‘magnetic’) — and give data that would genuinely be created or used by an artist.',
          starter: 'Device: … | Example data: …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark for device, 1 mark for data)</h5><ul>' +
            '<li>Hard drive // SSD // USB (memory) stick // Flash memory card // CD // DVD, etc.</li>' +
            '<li>e.g. Images created // documents // software // files // data moved from RAM to virtual memory</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow any secondary device. Benefit of the doubt for "optical disc".</li>' +
            '<li>Question asks for device, not type of device — magnetic/optical/solid state alone is not enough.</li>' +
            '<li>Award the example even if it is stored on an incorrect secondary storage device.</li>' +
            '<li>USB on its own is not enough.</li>' +
            '</ul></div><div class="marks-section"><h5>Examiner’s Comments</h5>' +
            '<p>Candidates were required to identify a secondary storage device. Some responses identified a type of storage media (for example magnetic) instead of identifying a device (for example hard drive). Some responses gave RAM or ROM as a secondary storage device. These responses were incorrect.</p>' +
            '<p>The example data varied but many responses were able to identify the storage of files, the images or software.</p></div>',
          modelAnswer: 'Device: SSD (solid-state drive)\n\nExample data: The image files the artist has created.'
        },
        {
          num: 'Q5a(iii)',
          marks: 4,
          type: 'written',
          question: '<p>The computer has Virtual Memory (VM). The table has four statements about VM. Not all of the statements are correct.</p><p>Tick (✓) the True column for the statements that are correct. Re-write any statement that is incorrect in the False column by changing the statement to make it true.</p><table><tr><th>Statement</th><th>True (✓)</th><th>False — rewrite the statement to make it true</th></tr><tr><td>A section of primary storage is partitioned to act as virtual memory</td><td></td><td></td></tr><tr><td>Data from ROM is transferred into VM</td><td></td><td></td></tr><tr><td>VM is needed when RAM is full, or nearly full</td><td></td><td></td></tr><tr><td>Data from VM is transferred back to secondary storage when needed</td><td></td><td></td></tr></table>',
          hint: 'Only one of the four statements is already true — for the other three, name the precise memory type (RAM or secondary storage) that should replace the wrong one; "primary storage" alone is too vague to earn the mark.',
          starter: 'Statement 1: True/False — correction: … | Statement 2: … | Statement 3: … | Statement 4: …',
          markPoints: {
            note: 'One mark per statement (4 statements, 4 marks). For the one TRUE statement, tick True. For each FALSE statement, you must rewrite it correctly — naming RAM or secondary storage precisely (not the vaguer "primary storage") to earn the mark.',
            groups: [
              { label: 'Statement 1 — "A section of primary storage is partitioned to act as virtual memory"', max: 1, points: [
                { text: 'Correctly identified this as FALSE and rewrote it as "A section of SECONDARY storage is partitioned to act as virtual memory"', marks: 1 } ] },
              { label: 'Statement 2 — "Data from ROM is transferred into VM"', max: 1, points: [
                { text: 'Correctly identified this as FALSE and rewrote it as "Data from RAM is transferred into VM"', marks: 1 } ] },
              { label: 'Statement 3 — "VM is needed when RAM is full, or nearly full"', max: 1, points: [
                { text: 'Correctly ticked this statement as True (it is true as written)', marks: 1 } ] },
              { label: 'Statement 4 — "Data from VM is transferred back to secondary storage when needed"', max: 1, points: [
                { text: 'Correctly identified this as FALSE and rewrote it as "Data from VM is transferred back to RAM when needed" ("primary storage" alone is NOT precise enough)', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark per row)</h5><ul>' +
            '<li>Row 1 (false) → A section of <strong>secondary</strong> storage is partitioned to act as virtual memory</li>' +
            '<li>Row 2 (false) → Data from <strong>RAM</strong> is transferred into VM</li>' +
            '<li>Row 3 → <strong>True</strong> (as written)</li>' +
            '<li>Row 4 (false) → Data from VM is transferred back to <strong>RAM</strong> when needed</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow a description of the error in column 2 instead of a full rewrite, e.g. in row 1: "primary should be secondary".</li>' +
            '<li>Accept HDD/SSD for secondary storage in row 1.</li>' +
            '<li>Do not accept "primary" for RAM in rows 2 and 4 — it is not precise enough.</li>' +
            '</ul></div>',
          modelAnswer: 'Row 1: False — "A section of secondary storage is partitioned to act as virtual memory."\n\nRow 2: False — "Data from RAM is transferred into VM."\n\nRow 3: True.\n\nRow 4: False — "Data from VM is transferred back to RAM when needed."'
        },
        {
          num: 'Q5b',
          marks: 1,
          type: 'written',
          question: '<p>The computer has an operating system and utility software. State the need for utility software in a computer.</p>',
          hint: 'Think about the OS’s "housekeeping" jobs — what utility software actually does FOR the system, not a named example of one.',
          starter: 'Utility software is needed to…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li>Performs housekeeping actions // monitor/manage/maintain a computer system // help the computer run smoothly/efficiently // to diagnose/fix/identify problems with a computer system</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not award a named example (e.g. "antivirus") on its own.</li>' +
            '</ul></div>',
          modelAnswer: 'Utility software is needed to maintain the computer system, helping it run smoothly and diagnosing or fixing problems.'
        },
        {
          num: 'Q5c(i)',
          marks: 3,
          type: 'written',
          question: '<p>The artist uploads images to be displayed on a website. This is a client-server relationship.</p><p>Identify the computer that is acting as the <strong>client</strong> in this scenario and justify your choice.</p>',
          hint: 'The client is the one making a request and sending data outward — think about which computer is doing the uploading.',
          starter: 'Client computer: … Justification: …',
          stubs: ['Client computer', 'Justification'],
          markPoints: {
            note: 'One mark for correctly identifying the client, then up to two more for a justification that develops your answer with a second distinct detail.',
            groups: [
              { label: 'Client computer', max: 1, points: [
                { text: 'Identified the artist’s computer / the computer uploading the images as the client', marks: 1 } ] },
              { label: 'Your justification', max: 2, points: [
                { text: 'Says the client sends the files/data for storage to the web server (or that the files are stored on the web server)', marks: 1 },
                { text: 'Gives a second, distinct detail — e.g. it performs the user’s actions and sends the results, sends a request to upload/store its files, does not store data for others to access, or receives confirmation/an error back from the server', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks</h5><ul>' +
            '<li>1 mark for identification: <strong>Artist’s computer // computer uploading the images</strong> (benefit of the doubt "the artist")</li>' +
            '<li>1 mark each to max 2 for justification, e.g.: Sends the files/data for storage/to the host/web server // the files are stored on the web server; Performs the user’s actions… …and sends the results to the web server; Sends a request to the web server… …to store/upload its files; It does not store data for others to access; Confirmation of upload/error is received (from the server) for display</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>If the computer identified is incorrect, do not award the justification.</li>' +
            '<li>Be careful the justification is about the UPLOAD of images to the web server, not the download.</li>' +
            '<li>Accept "host" for web server.</li>' +
            '<li>"The user’s computer" for identification is not enough on its own — read on for justification. "The user viewing the website" (or similar) is incorrect.</li>' +
            '</ul></div>',
          modelAnswer: 'Client computer: The artist’s computer\n\nJustification: It sends a request to the web server to upload and store the image files. It performs the artist’s actions and sends the results (the images) to the server, then receives confirmation once the upload is complete.'
        },
        {
          num: 'Q5c(ii)',
          marks: 3,
          type: 'written',
          question: '<p>Identify the computer that is acting as the <strong>server</strong> in this scenario and justify your choice.</p>',
          hint: 'The server is the one that RECEIVES the request and does the storing/processing on the client’s behalf.',
          starter: 'Server computer: … Justification: …',
          stubs: ['Server computer', 'Justification'],
          markPoints: {
            note: 'One mark for correctly identifying the server, then up to two more for a justification that develops your answer with a second distinct detail.',
            groups: [
              { label: 'Server computer', max: 1, points: [
                { text: 'Identified the web server as the server', marks: 1 } ] },
              { label: 'Your justification', max: 2, points: [
                { text: 'Says the images/data are stored on, uploaded to, sent to or hosted on the web server', marks: 1 },
                { text: 'Gives a second, distinct detail — e.g. the web server receives a request from the artist’s computer, executes/responds to/processes the request, or returns confirmation or an error of the upload', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks</h5><ul>' +
            '<li>1 mark for identification: <strong>Web server</strong></li>' +
            '<li>1 mark each to max 2 for justification, e.g.: The images/data are stored on/uploaded to/sent to/hosted on the web server; Web server receives a request (from the artist’s computer to upload the images); Web server executes/responds to the request // web server is doing the processing/handling the (request to) upload; Web server returns confirmation/error of the processing/upload</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>If the computer given is incomplete/inaccurate (e.g. "server" or "website" instead of "web server"), do not award identification, but award justification — and allow follow-through in the justification if the same inaccurate term is used, e.g. "images are sent to the website" follows through for "website" instead of "web server".</li>' +
            '<li>If the computer identified is incorrect, do not award justification.</li>' +
            '</ul></div>',
          modelAnswer: 'Server computer: The web server\n\nJustification: The web server receives the artist’s upload request and stores the image files it is sent. It then processes the request and sends back confirmation once the images have been uploaded successfully.'
        },
        {
          num: 'Q5d(i)',
          marks: 4,
          type: 'written',
          question: '<p>The artist is working with a programmer on the development of a new piece of software. The software will allow users to edit images on devices such as mobile telephones. They are considering releasing the software as open source instead of proprietary.</p><p>Describe <strong>two</strong> benefits to the artist and programmer of releasing the software as proprietary.</p>',
          hint: 'The benefits must be to the ARTIST/PROGRAMMER, not the user — think about money and control over the code, then develop each with a second sentence.',
          starter: '1. … 2. …',
          stubs: ['1', '2'],
          markPoints: {
            note: 'Two DIFFERENT benefits, each marked as a pair: 1 mark for the benefit itself, 1 more for developing it with a second, distinct detail. Benefits must be to the artist/programmer, not the user, and copyright/ownership alone is not credited (both licence types give copyright).',
            groups: [
              { label: 'Your first benefit', max: 2, points: [
                { text: 'Gave a valid benefit of proprietary licensing to the artist/programmer — e.g. they can earn money/sell for a fee, or no-one can see/copy the source code', marks: 1 },
                { text: 'Developed it with a second, distinct detail — e.g. licences can stop unauthorised use, or hidden code stops it being copied/resold/tampered with', marks: 1 } ] },
              { label: 'Your second benefit', max: 2, points: [
                { text: 'Gave a DIFFERENT valid benefit of proprietary licensing', marks: 1 },
                { text: 'Developed that one with its own distinct second detail', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark each)</h5><ul>' +
            '<li>Authors can earn money… …by selling for a fee // using licences to stop unauthorised use</li>' +
            '<li>No-one can see the code… …users cannot edit/change the software // by example, e.g. inserting malware… …so it cannot be copied/resold/shared</li>' +
            '<li>More control over intellectual property // by example, e.g. restrict users, restrict what can be done with the software without permission</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The benefit is to the artist and programmer — not the user.</li>' +
            '<li>Mark the answer as a whole.</li>' +
            '<li>Do not award reference to ownership/copyright, because both licence types give copyright of the code/program.</li>' +
            '</ul></div>',
          modelAnswer: '1. Proprietary licensing lets the artist and programmer earn money by selling the software for a fee, and licences stop unauthorised copies being used for free.\n\n2. Keeping the source code hidden means no-one else can edit, copy or resell the software, giving the artist and programmer more control over their intellectual property.'
        },
        {
          num: 'Q5d(ii)',
          marks: 2,
          type: 'written',
          question: '<p>Describe <strong>one</strong> benefit to the users of releasing the software as open source.</p>',
          hint: 'This time the benefit must be to the USER, not the artist/programmer — think about what having access to the code lets a user actually do.',
          starter: '…',
          markPoints: {
            note: 'One mark for a valid benefit to users, one more for developing it with a second, distinct detail. The benefit must be to the USER, not the artist/programmer.',
            groups: [
              { label: 'Your benefit to users', max: 2, points: [
                { text: 'Gave a valid benefit of open source to users — e.g. they can view/edit the source code, or it is freely accessible/does not have to be paid for', marks: 1 },
                { text: 'Developed it with why that matters — e.g. so users can tailor/improve/adapt it, fix errors themselves, learn how the software works, or redistribute it with changes', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark for point, 1 for expansion)</h5><ul>' +
            '<li>Users can view/edit the (source) code // users can edit the program/software… …to tailor/improve/adapt it to do what they need/want // so errors can be fixed (by anyone) // users can learn how the software works</li>' +
            '<li>Freely accessible… …do not have to pay // can redistribute… …with changes</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The benefit must be to users, not the artist and programmer.</li>' +
            '</ul></div>',
          modelAnswer: 'Users can view and edit the source code themselves, so they can tailor or improve the software to do exactly what they need, or fix errors without waiting for the original developers.'
        },
        {
          num: 'Q6',
          marks: 8,
          type: 'written',
          format: 'banded',
          question: '<p>A shopping centre has a security system that includes CCTV cameras to record activities in the centre. The security system is being upgraded to include the use of facial recognition to identify, track the movements of and record individuals throughout the shopping centre.</p><p>Discuss the positive and negative impacts of this upgrade including:</p><ul><li>ethical issues</li><li>privacy issues</li><li>legal issues</li></ul>',
          hint: 'Structure your answer around the three bullet points in turn — ethical, then privacy, then legal — giving both a positive and a negative for each where you can, then weigh them up.',
          starter: 'Ethically… From a privacy point of view… Legally… Overall, weighing up both sides…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 8 marks (AO2)</h5>' +
            '<p><strong>Band 3 — High Level (6–8 marks):</strong> Thorough knowledge and understanding of a wide range of considerations; material is generally accurate and detailed. Knowledge is applied directly and consistently to the context, with explicitly relevant evidence/examples. Weighs up both sides of the discussion with thorough recognition of influencing factors, including the impact on all areas. There is a well-developed line of reasoning which is clear and logically structured; the information presented is relevant and substantiated.</p>' +
            '<p><strong>Band 2 — Mid Level (3–5 marks):</strong> Reasonable knowledge and understanding of a range of considerations; generally accurate but at times underdeveloped. Applied directly to the context although one or two opportunities are missed; evidence is for the most part implicitly relevant. Makes a reasonable attempt to discuss the impact, showing reasonable recognition of influencing factors. There is a line of reasoning presented with some structure, in the most part relevant and supported by some evidence.</p>' +
            '<p><strong>Band 1 — Low Level (1–2 marks):</strong> Basic knowledge of considerations with limited understanding shown; material is basic and contains some inaccuracies. Limited attempt to apply acquired knowledge to the context, providing nothing more than an unsupported assertion. Information is basic and communicated in an unstructured way, supported by limited evidence, and the relationship to the evidence may not be clear.</p>' +
            '<p><strong>0 marks:</strong> No attempt to answer the question or response is not worthy of credit.</p>' +
            '</div><div class="marks-section"><h5>How the marks are given</h5><p><strong>Indicative content (not prescriptive or exhaustive — some points may cover more than one ‘issue’):</strong></p><ul>' +
            '<li><strong>Legal issues:</strong> the Data Protection Act needs to be followed or the company could be fined, e.g. customers informed the system is used, data held for a specified time/reason, data kept secure; the centre is private property so customers can choose not to enter; the footage can be used to identify people committing crimes, e.g. theft, used as evidence, to make sure the correct people are caught.</li>' +
            '<li><strong>Ethical issues:</strong> users feel safer because they know any actions are being monitored and help/action will be taken if needed; if users have not done anything wrong there is no reason to be tracked/recorded so it should not impact them; users may feel unsafe because they are being watched; users may be unaware they are being recorded — they need to be informed and give consent; users do not know where the videos/data about them and their movements is stored or how it is used (a DPA reference).</li>' +
            '<li><strong>Privacy issues:</strong> users may feel it is an invasion of privacy; users are in a public place and can legally be recorded by anyone anyway; users may feel like they are being watched all the time; users have not given their permission to be tracked; users may not know the system exists.</li>' +
            '</ul></div>',
          modelAnswer: 'Legally, the shopping centre must follow the Data Protection Act — informing customers the system is in use, only holding footage for a set time, and keeping it secure, or it risks being fined. On the positive side, facial recognition can help identify people committing crimes such as theft, and the footage can be used as evidence to make sure the right people are caught.\n\nEthically, some customers will feel safer knowing that any incident will be recorded and acted on, and if they have done nothing wrong they may feel it does not affect them. Others will feel uncomfortable being tracked and recorded without clearly giving their consent, especially if they do not know how long their data is kept or how it is used.\n\nFrom a privacy point of view, customers are in a public space and could legally be filmed by CCTV anyway, but facial recognition goes further by identifying and tracking individuals by name rather than just recording the area — many customers may not even know the system exists, which feels like a greater invasion of privacy than ordinary CCTV.\n\nOverall, the upgrade has real security benefits, but the shopping centre should make the use of facial recognition clearly visible and get proper consent, to balance those benefits against customers’ privacy and ethical concerns.'
        },
        {
          num: 'Q7',
          marks: 3,
          type: 'written',
          question: '<p>A car comes with many embedded systems, for example parking sensors.</p><p>Identify <strong>one</strong> other embedded system that could be found in a car and explain why this is an embedded system.</p>',
          hint: 'Embedded systems do ONE dedicated job using their own built-in hardware, and are hard for the user to reprogram — use these ideas to explain your example.',
          starter: 'Example embedded system: … Explanation: …',
          stubs: ['Example embedded system', 'Explanation'],
          markPoints: {
            note: 'One mark for a plausible embedded system (different from the given example, parking sensors), then up to two more for explaining why it counts as embedded. Do not credit "built into the car/a larger machine" on its own — that idea is already given in the question.',
            groups: [
              { label: 'Your example', max: 1, points: [
                { text: 'Named a plausible embedded system found in a car, other than parking sensors — e.g. cruise control, sat nav, engine management, auto-lights, climate control, an infotainment system, lane assist, auto-park, auto-brake, or a dashcam', marks: 1 } ] },
              { label: 'Your explanation', max: 2, points: [
                { text: 'Gave a valid reason it counts as embedded — e.g. it has one limited/specific/dedicated task, or it has its own dedicated microprocessor', marks: 1 },
                { text: 'Gave a second, DIFFERENT valid reason — e.g. its function is hard for the user to change, or a second distinct dedicated-hardware/limited-function point', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks</h5><ul>' +
            '<li>1 mark for the example, e.g.: auto lights; auto window wipers; sat nav // GPS; air conditioning // climate control; radio/entertainment/infotainment/media system; lane assist; engine management system; auto-park; cruise control; auto-brake; follow-me; dashcam</li>' +
            '<li>1 mark each to max 2 for explanation, e.g.: Limited functions // by example, e.g. the system only checks the light and turns lights on/off; Dedicated microprocessor // by example, e.g. there is a microprocessor that is only checking the lights; Hard to change function // by example, e.g. the user cannot make the light system do any other role</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow anything that could reasonably be found in a car.</li>' +
            '<li>If it is not clear whether the example is an embedded system, read the explanation for justification, e.g. hazard lights could be embedded if they are activated automatically when the car crashes — award the example via the explanation if this occurs.</li>' +
            '<li>If the justification only gives generic features of an embedded system (not tied to the chosen example), max 1 for explanation.</li>' +
            '<li>Do not award "built into the car/larger machine" — this is already given in the question.</li>' +
            '</ul></div>',
          modelAnswer: 'Example embedded system: Cruise control\n\nExplanation: It has one limited, dedicated function — maintaining the car’s speed — using its own dedicated microprocessor, and the driver cannot reprogram it to do anything else.'
        }
      ]
    }
  ]
};
