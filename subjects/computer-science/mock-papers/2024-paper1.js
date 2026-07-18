// ══════════════════════════════════════════════════════════════
// MOCK PAPER DATA — June 2024, OCR GCSE (9-1) Computer Science J277/01
// "Computer systems" (source: OCR 727534 question paper + 727652 mark
// scheme). Verbatim transcription used under the site's free-school-year
// content policy, served behind the auth gate (CS-CONTENT-PLAN.md D5).
//
// Shape: window.MOCK_PAPERS['2024-p1'] = { id, title, minutes, totalMarks,
// sections: [ { title, questions: [ {num, marks, type, format, question,
// hint, starter, markScheme, modelAnswer, ...widget data} ] } ] }.
//
// Question objects reuse the site's examQuestions shape (see
// subjects/computer-science/1.1.1-architecture-of-the-cpu.html). `format`
// is omitted for plain state/describe/explain/calculate items (renders as
// the 'lines' widget, ep-answer-area + self-mark against markScheme).
//
// Widget data-field conventions (cs-lab/exam-widgets-grids.js and
// exam-widgets-code.js are stubs as of authoring — these shapes are the
// natural, self-marking-friendly read of each paper layout; documented
// here as the contract for whoever finishes those widgets):
//   type:'mcq'          options: string[]; answer: 0-based index into options
//   format:'tickGrid'   q.grid = { cols: string[], rows: [ { label, correct: number[] (0-based col idx) } ] }
//   format:'tableFill'  q.table = { headers: string[], rows: (string|null)[][] } (null = blank cell)
//                        q.answers = { "r,c": string[] accepted answers } keyed 0-based into rows[]
//                        (open-choice tables, e.g. "any 2 of these 4 registers", carry
//                        q.table.openChoice = true and rely on markScheme self-mark instead)
//   format:'bankCloze'  q.cloze = HTML with ___1___.. blanks; q.bank = string[] (word bank incl. distractors)
//                        q.answers = string[] correct word per blank, in blank-number order
//   format:'binaryColumn' q.binary = { a: string, b: string, bits: 8, answer: string }
//   format:'banded'/'lines' — no extra field (exam-widgets.js already implements both)
// ══════════════════════════════════════════════════════════════

window.MOCK_PAPERS = window.MOCK_PAPERS || {};
window.MOCK_PAPERS['2024-p1'] = {
  id: '2024-p1',
  title: 'June 2024 · Paper 1 — Computer systems (J277/01)',
  minutes: 90,
  totalMarks: 80,
  sections: [
    {
      title: 'Answer all the questions.',
      questions: [
        {
          num: 'Q1a',
          marks: 3,
          type: 'written',
          format: 'tableFill',
          question: '<p>The following table has either the binary or denary value of 3 numbers.</p><p>Complete the table by converting the 8-bit binary number into denary and the denary number into 8-bit binary.</p><table><tr><th>8-bit Binary</th><th>Denary</th></tr><tr><td>11110000</td><td>(1)</td></tr><tr><td>(2)</td><td>105</td></tr><tr><td>00011110</td><td>(3)</td></tr></table>',
          hint: 'Convert one row at a time. For binary→denary, add up the place values of the 1s (128 64 32 16 8 4 2 1). For denary→binary, take away the largest place value that fits, repeat.',
          starter: '(1) 11110000 = … | (2) 105 = … in binary | (3) 00011110 = …',
          table: { headers: ['8-bit Binary', 'Denary'], rows: [['11110000', null], [null, '105'], ['00011110', null]] },
          answers: { '0,1': ['240'], '1,0': ['01101001'], '2,1': ['30'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark each)</h5><ul>' +
            '<li>11110000 → <strong>240</strong></li>' +
            '<li>105 → <strong>01101001</strong></li>' +
            '<li>00011110 → <strong>30</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Binary must be 8-bits.</li>' +
            '</ul></div>',
          modelAnswer: '11110000 = 240\n\n105 = 01101001\n\n00011110 = 30'
        },
        {
          num: 'Q1b',
          marks: 4,
          type: 'written',
          format: 'tableFill',
          question: '<p>Complete the table by writing the answer to each statement.</p><table><tr><th>Statement</th><th>Answer</th></tr><tr><td>The smallest denary number that can be represented by a 4-bit binary number</td><td>(1)</td></tr><tr><td>The largest denary number that can be represented by a 6-bit binary number</td><td>(2)</td></tr><tr><td>The maximum number of different colours that can be represented with a colour depth of 7-bits</td><td>(3)</td></tr><tr><td>The minimum number of bits needed to represent 150 different characters in a character set</td><td>(4)</td></tr></table>',
          hint: 'Smallest binary value is all 0s; largest is all 1s (2^bits − 1). Colour depth and character-set size both use 2^bits — for the last one, find the smallest bits where 2^bits ≥ 150.',
          starter: '(1) 0 | (2) 63 | (3) 128 | (4) 8',
          table: { headers: ['Statement', 'Answer'], rows: [['The smallest denary number that can be represented by a 4-bit binary number', null], ['The largest denary number that can be represented by a 6-bit binary number', null], ['The maximum number of different colours that can be represented with a colour depth of 7-bits', null], ['The minimum number of bits needed to represent 150 different characters in a character set', null]] },
          answers: { '0,1': ['0'], '1,1': ['63'], '2,1': ['128'], '3,1': ['8'] },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark each)</h5><ul>' +
            '<li>Smallest denary from a 4-bit number: <strong>0</strong></li>' +
            '<li>Largest denary from a 6-bit number: <strong>63</strong></li>' +
            '<li>Maximum colours with a 7-bit colour depth: <strong>128</strong></li>' +
            '<li>Minimum bits to represent 150 characters: <strong>8</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept calculations that equate to the same answer.</li>' +
            '<li>Accept any number of 0s for the first answer (e.g. 0000).</li>' +
            '</ul></div>',
          modelAnswer: '(1) 0\n\n(2) 63\n\n(3) 128\n\n(4) 8'
        },
        {
          num: 'Q1c',
          marks: 1,
          type: 'written',
          question: '<p>Show the result of a left binary shift of 4 places on the binary number 00001111.</p>',
          hint: 'Shifting left moves every bit 4 places towards the most-significant end; the vacated bits on the right fill with 0.',
          starter: '00001111 shifted left 4 = …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>11110000</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Ignore leading 0s.</li>' +
            '</ul></div>',
          modelAnswer: '11110000'
        },
        {
          num: 'Q1d',
          marks: 3,
          type: 'written',
          question: '<p>Describe how to convert a 2-digit hexadecimal number into denary. Use an example in your answer.</p>',
          hint: 'Two clear steps: what you do with the LEFT digit, then what you do with the RIGHT digit — then work a real example all the way through.',
          starter: 'Multiply the first/left digit by 16… then add the value of the second digit… for example…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks</h5><ul>' +
            '<li>1 mark for an example 2-digit hex number correctly converted into denary.</li>' +
            '<li>1 mark each (max 2) for describing/showing each stage, either: <strong>Multiplying</strong> — multiply the left/first digit by 16, add the value of the second digit (without additional calculation); <strong>or Converting</strong> — convert each digit into 4-bit binary, combine and convert the 8-bit binary to denary.</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>No marks for converting denary to hex.</li>' +
            '<li>If the example has an inaccurate result (e.g. they convert A to 11), the method marks can still be awarded.</li>' +
            '<li>No requirement to show how letters are used.</li>' +
            '</ul></div>',
          modelAnswer: 'Multiply the value of the first (left) digit by 16, then add the value of the second (right) digit. For example, 2A: 2 × 16 = 32, plus A (10) = 42, so 2A in hex is 42 in denary.'
        },
        {
          num: 'Q1e',
          marks: 2,
          type: 'written',
          format: 'binaryColumn',
          question: '<p>Add these two 8-bit binary numbers using binary addition. Show your working out.</p><pre>  01101011\n+ 00001111</pre>',
          hint: 'Add column by column from the right, carrying a 1 into the next column whenever a column totals 2 or more — mark each carry so the examiner can follow your working.',
          starter: 'Working: carries shown above each column … Answer: …',
          binary: { a: '01101011', b: '00001111', bits: 8, answer: '01111010' },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks</h5><ul>' +
            '<li>1 mark for correct working (4 carries).</li>' +
            '<li>1 mark for answer <strong>01111010</strong>.</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not award the working mark for conversion to denary and back.</li>' +
            '<li>Carries must be on the correct values, but could be shown above, below, etc.</li>' +
            '</ul></div>',
          modelAnswer: '01101011 + 00001111, carrying at columns 1, 2, 4 and 5 from the right = 01111010'
        },
        {
          num: 'Q2a(i)',
          marks: 2,
          type: 'written',
          question: '<p>An airport has computers that are connected together on a Local Area Network (LAN). Each computer has an IP address and a MAC address.</p><p>Give one valid example of an IPv4 address and one valid example of an IPv6 address.</p>',
          hint: 'IPv4 = four denary groups (0–255) separated by full stops. IPv6 = up to eight hex groups separated by colons — a real, validly-formed example of each, not a description.',
          starter: 'IPv4: … | IPv6: …',
          stubs: ['IPv4', 'IPv6'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark for each valid IP)</h5><ul>' +
            '<li><strong>IPv4:</strong> 4 groups of denary numbers between 0 and 255 separated by full stops (example: 123.16.46.72)</li>' +
            '<li><strong>IPv6:</strong> 8 groups of hex numbers between 0 and FFFF separated by colons. A double colon can appear once and replaces any number of groups of consecutive 0000 (example: 0252:5985:89ab:cdde:a57f:89ad:efcd:00fe)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>For IPv6, each hex number can be between 1 and 4 digits.</li>' +
            '</ul></div>',
          modelAnswer: 'IPv4: 192.168.1.10\n\nIPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334'
        },
        {
          num: 'Q2a(ii)',
          marks: 2,
          type: 'written',
          question: '<p>Describe the format of a MAC address.</p>',
          hint: 'Cover length, how it is grouped, and what its two halves each identify.',
          starter: 'A MAC address is… it is made up of…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2)</h5><ul>' +
            '<li>(Usually presented in) hexadecimal / denary / binary</li>' +
            '<li>6 groups of numbers // 12 (hex) numbers, each group has paired/2-digit (hex) numbers / 8-bit binary number</li>' +
            '<li>48 bits long</li>' +
            '<li>Separated by colons/hyphens</li>' +
            '<li>The first half/part contains the manufacturer ID // identifies the manufacturer</li>' +
            '<li>The second half/part contains the serial number // identifies the device</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>"Numbers" on its own for MP1 is not enough (NE).</li>' +
            '<li>Allow both marks for a valid example.</li>' +
            '<li>"6 pairs of numbers" gets MP2 and MP3; "4 pairs of numbers" gets MP3.</li>' +
            '</ul></div>',
          modelAnswer: 'A MAC address is usually written in hexadecimal as 6 pairs of digits (12 hex digits, 48 bits), separated by colons. The first half identifies the manufacturer, and the second half is a unique serial number for the device.'
        },
        {
          num: 'Q2b(i)',
          marks: 4,
          type: 'written',
          question: '<p>The airport currently has wired connections in their Local Area Network. Describe two benefits to the airport of using wired connections in their network.</p>',
          hint: 'Give a general networking benefit, then apply it to the airport specifically — unapplied answers cap out at 3 marks even with a valid second point.',
          starter: '1. … for example, at the airport this means… 2. … for example, at the airport this means…',
          stubs: ['1', '2'],
          markPoints: {
            note: 'Each benefit is marked in a PAIR: 1 mark for the benefit itself, 1 more for expanding it with a real application to the airport. Mark your two answer spaces separately.',
            groups: [
              { label: 'Your first benefit', max: 2, points: [
                { text: 'Gave a valid benefit of wired connections (speed/bandwidth, security, reliability/little interference, or long range) — cost does NOT count', marks: 1 },
                { text: 'Expanded it with a direct application to the airport (e.g. reduces delays at check-in, passenger data is not intercepted)', marks: 1 } ] },
              { label: 'Your second benefit', max: 2, points: [
                { text: 'Gave a DIFFERENT valid benefit of wired connections', marks: 1 },
                { text: 'Expanded that one with a direct application to the airport', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark each for benefit + application, max 4)</h5><ul>' +
            '<li>Fast connection/speed // high bandwidth // consistent bandwidth … e.g. reduces delays at check-in</li>' +
            '<li>Secure // unlikely to have unauthorised access/be hacked // data transmissions are likely to be safe … e.g. so passenger/staff/aeroplane data is not intercepted</li>' +
            '<li>Little interference // little chance of data loss // reliable … e.g. flight status is received without delay</li>' +
            '<li>Long range transmission … e.g. the airport has a large floor area/terminals</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Mark in pairs: mark each benefit space to the candidate’s benefit. An expansion/application for a benefit can be awarded in the other answer space.</li>' +
            '<li>1 benefit and 1 expansion for each answer space; max 2 marks per answer space.</li>' +
            '<li>Max 3 marks if the expansions have no direct application to the airport and its computers connecting using wired connections.</li>' +
            '<li>Do not accept cost. The question is not a comparison to wireless, but accept answers worded that way.</li>' +
            '<li>"Fast" on its own is not enough; "faster to connect" is not enough (could mean setting up the connection rather than bandwidth).</li>' +
            '</ul></div>',
          modelAnswer: '1. Wired connections give fast, high, consistent bandwidth — at the airport this reduces delays when checking in large numbers of passengers.\n\n2. Wired connections are more secure and less likely to be intercepted — at the airport this keeps passenger and flight data safe from unauthorised access.'
        },
        {
          num: 'Q2b(ii)',
          marks: 3,
          type: 'written',
          question: '<p>Explain the reasons why the airport should also allow the network to be accessed using a wireless connection.</p>',
          hint: 'Think about staff mobility, scalability of connecting new devices, and devices that cannot physically plug in — up to 3 separate reasons.',
          starter: 'A wireless connection would allow…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark each, max 3)</h5><ul>' +
            '<li>Staff do not need to be in one place // movement of staff // can work whilst moving to another part of the airport // can be accessed from any location (in range)</li>' +
            '<li>Staff can be more responsive to customers/requests</li>' +
            '<li>Allows a larger number of connections/devices // more scalable … without the disruption/cost of installing more cables</li>' +
            '<li>Some devices do not allow a physical/wired connection // allows a wider range of device types (or by example, e.g. vehicles/mobile devices/aeroplanes)</li>' +
            '<li>Easier to add/connect more devices</li>' +
            '<li>Do not need to find/use a physical connection/wire // can connect where there isn’t a cable/connection</li>' +
            '<li>For use as a backup if the wired connection fails</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not award cost or range on their own.</li>' +
            '<li>Allow explanation of how a wireless network benefits the passenger as well as the airport and staff.</li>' +
            '<li>Allow in reverse if clear, e.g. "wired restricts staff to one location".</li>' +
            '</ul></div>',
          modelAnswer: 'Wireless would let staff move around the airport while staying connected, so they can respond to passengers more quickly. It also makes it easier to add more devices without running new cables, and allows devices such as handheld scanners that cannot use a wired connection.'
        },
        {
          num: 'Q2c(i)',
          marks: 3,
          type: 'written',
          question: '<p>One office in the airport has five computers connected to one switch. There are two printers in the office that can be accessed by all computers. The computers are connected using a star topology.</p><p>Draw a diagram to show how the five computers, switch and two printers are connected in a star topology.</p><p><em>This is a drawing question — sketch the diagram on paper first, then describe what you drew below as a check of your answer (e.g. which devices connect directly to the switch).</em></p>',
          hint: 'A star topology needs every device (all 5 computers and both printers) connected by its own cable directly to the central switch — nothing connects to anything else.',
          starter: 'All 5 computers connect directly to the switch… both printers also connect directly to the switch…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark each for drawing showing:)</h5><ul>' +
            '<li>5 computers, 2 printers and 1 switch, all clearly labelled</li>' +
            '<li>All devices directly connected to the switch // all computers connected to the switch and each printer to a switch/computer(s)</li>' +
            '<li>Only 8 devices and no additional connections other than to the switch (or central device, or printers to only one computer each)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow any type of computer, e.g. PC, laptop. Do not accept "client" for computer.</li>' +
            '<li>For MP1 there must be at least 5 computers, at least 2 printers, at least 1 switch.</li>' +
            '</ul></div>',
          modelAnswer: 'A central switch, with a separate cable running out to each of the 5 computers and to each of the 2 printers — 8 spokes total, nothing connected to anything except the switch.'
        },
        {
          num: 'Q2c(ii)',
          marks: 2,
          type: 'written',
          question: '<p>Give one benefit and one drawback of the office using a star topology instead of a mesh topology.</p>',
          hint: 'A mesh has a direct cable between every pair of devices — compare against that when picking your benefit/drawback of the star.',
          starter: 'Benefit: … Drawback: …',
          stubs: ['Benefit', 'Drawback'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks</h5><ul>' +
            '<li>1 mark for a benefit e.g. easier to add new nodes // easier to set up (BOD); central device can monitor/control transmissions; faster data transmission; fewer data collisions; one connection/computer breaking still leaves the network working; less cost of cables</li>' +
            '<li>1 mark for a drawback e.g. switch fails → the network fails // reliant on a central (working) device // single point of failure; extra cost of the central device/switch</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>"Speed", "cheaper", etc. on their own are not enough. A server is irrelevant.</li>' +
            '<li>Read the whole benefit and award a valid benefit; read the whole drawback and award a valid drawback. Do not award contradictory statements.</li>' +
            '</ul></div>',
          modelAnswer: 'Benefit: it is easier to add a new computer — you just run one cable to the switch, rather than to every other device.\n\nDrawback: if the switch fails, the whole office network goes down, because every device depends on it.'
        },
        {
          num: 'Q2c(iii)',
          marks: 3,
          type: 'written',
          question: '<p>Describe the role of the switch in the star topology.</p>',
          hint: 'Explain how it knows WHERE to send data, not just that it "connects" devices.',
          starter: 'The switch connects… it records the addresses of devices… it directs data…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark each, max 3)</h5><ul>' +
            '<li>Connects the devices together in the network // allows devices to communicate in the network</li>' +
            '<li>Receives data from (all) devices in the star topology</li>' +
            '<li>Records/registers/stores the address of devices connected to it … in a table</li>' +
            '<li>Uses the MAC address of devices</li>' +
            '<li>Directs data to its destination … if the address isn’t recorded, transmits to all devices</li>' +
            '</ul></div>',
          modelAnswer: 'The switch connects all the devices in the star topology together. It receives data from any connected device, keeps a record of the MAC addresses of devices connected to it, and uses this to direct incoming data only to its correct destination.'
        },
        {
          num: 'Q3a',
          marks: 4,
          type: 'written',
          format: 'tableFill',
          question: '<p>A computer has an operating system and utility software. The table contains operating system functions and a task that each function performs.</p><p>Complete the table by writing the two missing function names and a task performed by the two given functions.</p><table><tr><th>Function</th><th>Task</th></tr><tr><td>(A)</td><td>Moves data from secondary storage to RAM</td></tr><tr><td>Peripheral management</td><td>(B)</td></tr><tr><td>(C)</td><td>Allows the user to create, name and delete folders</td></tr><tr><td>User interface</td><td>(D)</td></tr></table>',
          hint: 'Match each given task to the OS function that does it, then think of one task for each function that’s already named.',
          starter: 'A: … | B: … | C: … | D: …',
          table: { headers: ['Function', 'Task'], rows: [[null, 'Moves data from secondary storage to RAM'], ['Peripheral management', null], [null, 'Allows the user to create, name and delete folders'], ['User interface', null]] },
          answers: {
            '0,0': ['Memory management', 'managing memory'],
            '1,1': ['Receiving data from input devices', 'Transmitting data to output devices', 'Installing device drivers', 'Downloading device drivers', 'Allows communication from input device', 'Allows communication to output device'],
            '2,0': ['File management', 'managing files'],
            '3,1': ['Outputting data to the user', 'Receiving input from the user', 'Allows user to communicate with the computer', 'Allows user to control the computer', 'Creating a GUI', 'Displaying a GUI', 'command prompt interface']
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark for function, 1 mark for task)</h5><ul>' +
            '<li><strong>A: Memory management // managing memory</strong></li>' +
            '<li><strong>B (Peripheral management task):</strong> receiving data from input devices // transmitting data to output devices // installing/downloading device drivers // allows communication from input device / to output device</li>' +
            '<li><strong>C: File management // managing files</strong> (do not award "folder management")</li>' +
            '<li><strong>D (User interface task):</strong> outputting data to the user // receiving input from the user // allows user to communicate/interact with/control the computer // creating/displaying/allowing interaction with a GUI/command prompt interface</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>BOD "storage" for memory in the first function.</li>' +
            '<li>Peripheral: allow input and output devices by example.</li>' +
            '<li>The task for peripheral management needs to extend "manage" — "manage output devices" is not enough.</li>' +
            '</ul></div>',
          modelAnswer: 'A: Memory management\n\nB: Receiving data from input devices and transmitting data to output devices.\n\nC: File management\n\nD: Outputting data to the user and receiving input from the user (e.g. via a GUI).'
        },
        {
          num: 'Q3b',
          marks: 6,
          type: 'written',
          format: 'bankCloze',
          question: '<p>Complete the description of utility system software using the words provided in the box. Not all words are used.</p>',
          hint: 'Read each sentence fully before picking a word — several words in the bank are near-synonyms (e.g. "amount"/"quantity", "apart"/"separate") and only one fits the exact meaning needed.',
          starter: '(1) … (2) … (3) … (4) … (5) … (6) …',
          cloze: '<p>___1___ software changes data using a ___2___. If the changed data is intercepted, it cannot be ___3___. This software does not stop the data from being intercepted.</p><p>___4___ software analyses the data on a disk to find files that have been split and stored in separate locations. The split files are moved to be ___5___ in storage and the free space is moved together. This does not provide more storage space on the disk, instead it makes the ___6___ of the data faster because the read head does not have to move as far to access the next part of the file.</p>',
          bank: ['access', 'amount', 'apart', 'compression', 'consecutive', 'defragmentation', 'deleted', 'encryption', 'key', 'lock', 'quantity', 'separate', 'speed', 'understood'],
          answers: ['encryption', 'key', 'understood', 'defragmentation', 'consecutive', 'access'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 6 marks (1 mark for each term)</h5><ul>' +
            '<li>(1) <strong>encryption</strong></li>' +
            '<li>(2) <strong>key</strong></li>' +
            '<li>(3) <strong>understood</strong></li>' +
            '<li>(4) <strong>defragmentation</strong></li>' +
            '<li>(5) <strong>consecutive</strong></li>' +
            '<li>(6) <strong>access</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Mark the first answer in each space.</li>' +
            '</ul></div>',
          modelAnswer: '(1) encryption (2) key (3) understood (4) defragmentation (5) consecutive (6) access'
        },
        {
          num: 'Q4',
          marks: 8,
          type: 'written',
          format: 'banded',
          question: '<p>A computer programmer has developed a computer game that they want to release for users to download over the internet. The programmer needs to decide whether to release the game as open source or proprietary software.</p><p>Discuss the features, benefits and drawbacks of each type of licence for this program and make a recommendation to the programmer.</p><p>You should include the following in your answer:</p><ul><li>features of each licence</li><li>legal and ethical issues of each licence</li><li>benefits and drawbacks of each licence.</li></ul>',
          hint: 'Structure it exactly like the bullet list: features, then legal/ethical, then benefits/drawbacks for BOTH licence types, and finish with a justified recommendation — that structure alone pushes you into Band 3.',
          starter: 'Open source software… whereas proprietary software… Legally and ethically… The benefits and drawbacks of each are… Overall, I would recommend…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 8 marks (AO2)</h5>' +
            '<p><strong>Band 3 — High Level (6–8 marks):</strong> Thorough knowledge and understanding of a wide range of considerations; material is generally accurate and detailed. Knowledge is applied directly and consistently to the context, with explicitly relevant evidence/examples. Weighs up both sides of the discussion with thorough recognition of influencing factors. Well-developed, clear, logically structured line of reasoning; relevant and substantiated. Covers all required elements (legal/ethical, benefits, drawbacks) for both licences and includes a justified recommendation; the top of the band makes a clear, structured recommendation to the programmer.</p>' +
            '<p><strong>Band 2 — Mid Level (3–5 marks):</strong> Reasonable knowledge and understanding of a range of considerations; generally accurate but at times underdeveloped. Applied directly to the context although one or two opportunities are missed; evidence mostly implicitly relevant. Reasonable attempt to discuss the impact on most areas. Some structure, mostly relevant, supported by some evidence. Includes one or more of legal/ethical, benefits, drawbacks for open source and proprietary, or a justified recommendation without clearly referencing the bullet points.</p>' +
            '<p><strong>Band 1 — Low Level (1–2 marks):</strong> Basic knowledge with limited understanding; material is basic with some inaccuracies. Limited attempt to apply knowledge to the context; nothing more than an unsupported assertion. Basic, unstructured information with limited evidence, relationship to evidence may be unclear. Limited to facts about open source and/or proprietary.</p>' +
            '<p><strong>0 marks:</strong> No attempt to answer the question or response not worthy of credit.</p>' +
            '</div><div class="marks-section"><h5>How the marks are given</h5><p><strong>Indicative content (not prescriptive or exhaustive):</strong></p><ul>' +
            '<li><strong>Licence features:</strong> Open source — usually free, can access/change source code, redistribute. Proprietary — purchased at a cost, cannot access/change code.</li>' +
            '<li><strong>Legal and ethical issues:</strong> both provide copyright. Open source allows more people to take the code and possibly change it to resell, or adapt it in their own programs to resell or claim as their own (reverse for proprietary). Open source allows more people access to the game because there is likely no cost (reverse for proprietary).</li>' +
            '<li><strong>Benefits and drawbacks:</strong> Open source — wider customer base, more exposure, users can alter it to improve it/fix bugs, but limited documentation and little financial gain for the programmer. Proprietary — lets the programmer earn money and gives more control over the program, usually well tested, but more restrictions and cannot be adapted to meet user needs.</li>' +
            '<li><strong>Decision:</strong> either would be appropriate; the justification needs to be clearly for this scenario.</li>' +
            '</ul></div>',
          modelAnswer: 'Open source software makes its source code freely available, so other programmers can view, change and redistribute it, whereas proprietary software is sold under licence with the source code kept private, so it cannot legally be changed or redistributed.\n\nLegally and ethically, both licences give the programmer copyright over their original work. Open source is more ethically generous — it lets more people access and improve the game for free — but it also lets others resell or rebrand modified copies of it. Proprietary software protects the programmer’s ability to profit and control the product, but restricts access for users who cannot pay.\n\nThe benefit of open source is a wider audience and community-driven bug fixes and improvements; the drawback is little guaranteed income and inconsistent documentation. The benefit of proprietary is a reliable income stream and full control over quality and updates; the drawback is a smaller potential audience and all support/testing costs fall on the programmer.\n\nI would recommend proprietary software, because the programmer is releasing this individually and is more likely to want to be paid for their work and keep control over how the game develops, without giving away the code for others to resell.'
        },
        {
          num: 'Q5a(i)',
          marks: 1,
          type: 'mcq',
          question: '<p>A musician uses a computer to make and record music. Tick (✓) one box to identify the correct description of sound sampling.</p>',
          options: [
            'The frequency of the wave is measured a set number of times each second.',
            'The amplitude of the wave is measured at set intervals.',
            'The digital sound wave is measured a set number of times each second.',
            'The analogue sound wave’s resolution is measured at set intervals.'
          ],
          answer: 1,
          hint: 'Sampling measures the height (amplitude) of the analogue wave, not its frequency or "resolution" — and it’s the analogue wave being sampled, not a digital one.',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>The amplitude of the wave is measured at set intervals.</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>2 or more ticks = 0 marks.</li>' +
            '</ul></div>',
          modelAnswer: 'The amplitude of the wave is measured at set intervals.'
        },
        {
          num: 'Q5a(ii)',
          marks: 2,
          type: 'written',
          question: '<p>Explain how changing the bit depth will affect the sound file.</p>',
          hint: 'Link bit depth to the number of possible amplitude values, then say what that changes about the resulting file (size and/or quality).',
          starter: 'Increasing the bit depth means… which will…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2)</h5><ul>' +
            '<li>The number of bits per sample will change // by example, more/fewer bits per sample</li>' +
            '<li>The file size will change // by example, the file size will increase/decrease</li>' +
            '<li>There will be a change in the accuracy of each sample/amplitude/sound // by example, more precise amplitudes // a wider/smaller range of amplitudes can be recorded</li>' +
            '<li>The quality will change // there will be a different amount of distortion // by example, the quality will improve/decline</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>MP3 needs to clearly say a wider range of amplitudes can be recorded (i.e. more different values), not that there are more amplitudes/samples per second.</li>' +
            '<li>MP3 — "more amplitudes can be measured" is BOD, but "more amplitudes measured per second" is incorrect.</li>' +
            '<li>BOD "sound" for "amplitude", e.g. for MP3 "a larger range of sounds can be recorded."</li>' +
            '</ul></div>',
          modelAnswer: 'Increasing the bit depth increases the number of bits used to store each sample, so a wider range of amplitude values can be recorded more precisely, which increases sound quality but also increases the file size.'
        },
        {
          num: 'Q5b(i)',
          marks: 4,
          type: 'written',
          question: '<p>The musician has run out of storage space on their secondary storage device and needs to buy a replacement. Identify whether the musician should buy a magnetic secondary storage device or a solid state secondary storage device for their computer. Justify your choice.</p>',
          hint: 'Pick a type first, then give up to 4 justification points that only make sense for the type you picked (not a generic list of pros and cons of both).',
          starter: 'Type: … Justification: …',
          stubs: ['Type', 'Justification'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (no mark for type; 1 mark each point matching the type, max 4)</h5><ul>' +
            '<li><strong>Magnetic e.g.</strong> usually cheaper cost to purchase per unit of data; sufficient/good durability for what is needed (e.g. computer unlikely to move regularly); sufficient/fast speed of access, no significant delays storing/reading data; (long-term) reliable/longevity, unlikely to need replacing/break from over-use; high capacity, e.g. large sound files or higher bit depth.</li>' +
            '<li><strong>Solid state e.g.</strong> cost often equates to magnetic per quantity, not expensive per unit of data; durable/robust, no moving parts, so the computer can be moved without risk of losing data; fast speed of access, no significant delays; high capacity, nearly the same/higher capacity than magnetic; small in physical size/portable; produces less sound when running; requires little/less power so running costs are reduced; drives do not get fragmented files/need defragging.</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>MP1 needs to be cost per unit, e.g. "it costs less per GB than other storage types" — not just "it is cheap to buy".</li>' +
            '<li>Allow the reverse argument for each, e.g. for magnetic: "magnetic is not as robust but the computer will not be moved" gets 1 mark for not moving and 1 mark for solid state’s robustness not being required.</li>' +
            '<li>If no type is given on line 1, read the answer to look for a type and then award justification. If no type is identified anywhere in the answer, 0 marks.</li>' +
            '</ul></div>',
          modelAnswer: 'Type: Solid state\n\nJustification: Solid state drives have no moving parts, so they are more durable if the musician’s computer gets knocked or moved. They also have fast access speeds, so there are no delays loading or saving large sound files, and they run silently, which matters when recording audio.'
        },
        {
          num: 'Q5b(ii)',
          marks: 1,
          type: 'written',
          question: '<p>Identify one other type of secondary storage.</p>',
          hint: 'Name a storage TYPE (a category), not a brand or a specific device model.',
          starter: '…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>Optical</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>BOD "optic". Do not award an example of optical storage (e.g. "DVD") in place of the type.</li>' +
            '</ul></div>',
          modelAnswer: 'Optical storage.'
        },
        {
          num: 'Q5b(iii)',
          marks: 1,
          type: 'mcq',
          question: '<p>Tick (✓) one box to identify the smallest secondary storage capacity.</p>',
          options: ['2.1 GB', '300 MB', '200 000 KB', '0.0021 TB'],
          answer: 2,
          hint: 'Convert everything into the same unit (KB) before comparing.',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>200 000 KB</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>2 or more ticks = 0 marks.</li>' +
            '</ul></div>',
          modelAnswer: '200 000 KB'
        },
        {
          num: 'Q5b(iv)',
          marks: 2,
          type: 'written',
          question: '<p>The musician’s recordings have an average (mean) file size of 3 MB. The musician has 1000 recordings.</p><p>Calculate an estimate of the storage space in GB that the 1000 files will require, assuming they are each 3 MB in size. Show your working out.</p>',
          hint: 'Total size in MB first (3 × 1000), then convert MB to GB (÷ 1000) — show both steps as your working.',
          starter: 'Working: 3 × 1000 = … MB, ÷ 1000 = … GB. Answer: … GB',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks</h5><ul>' +
            '<li>1 mark for the answer <strong>3 GB</strong>.</li>' +
            '<li>1 mark for working, e.g. 3 × 1000 ÷ 1000, or 3 × 1000, or 3000 ÷ 1000, or 3 ÷ 1000, or 0.003 × 1000.</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow 2.9296875 (or an approximation) if dividing by 1024.</li>' +
            '<li>Allow addition of metadata, e.g. 10% added — can be awarded for both the working and the answer mark.</li>' +
            '<li>Not all of the working needs to be correct to get the working mark. Ignore mentions of MB/GB in the working.</li>' +
            '</ul></div>',
          modelAnswer: 'Working: 3 MB × 1000 recordings = 3000 MB; 3000 MB ÷ 1000 = 3 GB. Answer: 3 GB'
        },
        {
          num: 'Q6a',
          marks: 2,
          type: 'written',
          question: '<p>A computer has a Central Processing Unit (CPU). Describe what happens during the fetch-execute cycle.</p>',
          hint: 'Two clear stages are enough: where instructions/data come FROM, and what happens to them once fetched.',
          starter: 'Data and instructions are fetched from…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each)</h5><ul>' +
            '<li>Data/instructions are fetched from memory/RAM/primary storage</li>' +
            '<li>Data/instructions are stored using the registers // correct example of a register storing address/data</li>' +
            '<li>Data/instructions are decoded // split into opcode and operand</li>' +
            '<li>Data/instructions are executed/processed</li>' +
            '<li>ALU performs the logical/arithmetic calculations</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>MP4 BOD "carried out" etc. for executed.</li>' +
            '<li>Ignore inaccurate references to registers and components (other than MP2’s correct example of a register).</li>' +
            '</ul></div>',
          modelAnswer: 'Instructions are fetched from main memory (RAM) into the CPU. They are then decoded and executed, and the cycle repeats for the next instruction.'
        },
        {
          num: 'Q6b',
          marks: 4,
          type: 'written',
          format: 'tableFill',
          question: '<p>Complete the table by writing the name of two registers used in the fetch-execute cycle and the purpose of each register.</p><table><tr><th>Register</th><th>Purpose</th></tr><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table>',
          hint: 'Pick the two registers whose purposes you can state most precisely — always start with "Stores…", never an action word like "fetches".',
          starter: 'Register 1: … — Purpose: Stores… | Register 2: … — Purpose: Stores…',
          table: { headers: ['Register', 'Purpose'], rows: [[null, null], [null, null]], openChoice: true },
          markPoints: {
            note: 'You gave two registers, and each one is marked on its own: 1 mark for the name, 1 more for a purpose that matches THAT register. (If a register name is wrong, its purpose earns nothing.)',
            groups: [
              { label: 'Your first register', max: 2, points: [
                { text: 'Named a register used in the fetch–execute cycle — PC, MAR, MDR or Accumulator (also accept CIR / IR)', marks: 1 },
                { text: 'Gave a purpose that correctly matches that register (must say what it STORES — not “fetches”/“takes”/“retrieves”)', marks: 1 } ] },
              { label: 'Your second register', max: 2, points: [
                { text: 'Named a DIFFERENT register used in the fetch–execute cycle', marks: 1 },
                { text: 'Gave a purpose that correctly matches that second register', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark for naming a register, 1 mark for its matching purpose — any two of the four)</h5><ul>' +
            '<li><strong>Program counter // PC</strong> — stores the address of the current/next instruction to be fetched // stores the address of the instruction for the current/next FE cycle</li>' +
            '<li><strong>Memory address register // MAR</strong> — stores the address of the current/next instruction/data to be fetched // stores the address where data/instruction is to be stored</li>' +
            '<li><strong>Memory data register // MDR</strong> — stores the data/instruction fetched from memory // stores data/instruction to be stored in memory // stores the data/instruction located in the memory location in the MAR</li>' +
            '<li><strong>Accumulator // ACC</strong> — stores the result of calculations // stores data currently being processed // stores the result from the ALU</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Careful that the purpose is not an action such as fetches, takes, retrieves. Read the full purpose and award a correct point.</li>' +
            '<li>Accept Current instruction register // CIR // Instruction register // IR — stores the instruction currently being executed. BOD "memory buffer register" for MDR.</li>' +
            '<li>If no register is given but the register is identifiable from the purpose column, award the purpose if accurate. If the register given is incorrect, do not mark the purpose.</li>' +
            '<li>For PC and MAR, accept "pointer" for storing address. Accept "memory address", "memory data".</li>' +
            '</ul></div>',
          modelAnswer: 'Register 1: Program counter (PC) — Purpose: stores the address of the next instruction to be fetched from memory.\n\nRegister 2: MAR (Memory Address Register) — Purpose: stores the address of the data or instruction that is to be fetched from memory.'
        },
        {
          num: 'Q6c',
          marks: 3,
          type: 'written',
          question: '<p>Give three characteristics of a CPU that can affect its performance.</p>',
          hint: 'Name a specific measurable characteristic (a "what"), not a vague word like "speed" on its own.',
          starter: '1. … 2. … 3. …',
          stubs: ['1', '2', '3'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark each, max 3)</h5><ul>' +
            '<li>Clock speed</li>' +
            '<li>Cache size</li>' +
            '<li>Number of cores</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>"Clock", "cache", "speed", "cores" on their own are not enough.</li>' +
            '</ul></div>',
          modelAnswer: '1. Clock speed\n\n2. Cache size\n\n3. Number of cores'
        },
        {
          num: 'Q7a',
          marks: 3,
          type: 'written',
          question: '<p>A car has a ‘Follow Me’ system that uses a cruise control feature to allow the car to follow the car in front of it. It will keep the same speed and distance without the driver’s intervention. The cruise control system is an example of an embedded system.</p><p>Explain the reasons why the ‘Follow Me’ system is an example of an embedded system.</p>',
          hint: 'Embedded systems have ONE specific job, are built inside a bigger device, and usually can’t be reprogrammed or updated by the user — use these ideas.',
          starter: 'The ‘Follow Me’ system is embedded because…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark each, max 3)</h5><ul>' +
            '<li>Has a specific purpose // it only performs one/a limited task // dedicated to the Follow Me system</li>' +
            '<li>Built within a larger device/car</li>' +
            '<li>Dedicated/specific/its own hardware/sensors</li>' +
            '<li>Has a microprocessor</li>' +
            '<li>Built-in operating system/software // software is all in firmware/ROM … its instructions/operation does not/is hard to change/update</li>' +
            '<li>It is a control system // it is automated</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>MP2 — BOD reference to it being "built into" a reasonable "something".</li>' +
            '</ul></div>',
          modelAnswer: 'The ‘Follow Me’ system is built into the car and only performs one specific task — following the vehicle in front — rather than being a general-purpose computer. Its software is stored in firmware and cannot easily be changed by the driver.'
        },
        {
          num: 'Q7b(i)',
          marks: 2,
          type: 'written',
          question: '<p>The car’s system has Read Only Memory (ROM) and Random Access Memory (RAM). State two items that will be stored in the ROM for the ‘Follow Me’ system.</p>',
          hint: 'ROM holds things needed BEFORE the system can even start running, or fixed data that never changes while it runs.',
          starter: '1. … 2. …',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2)</h5><ul>' +
            '<li>Start-up instructions // BIOS // bootstrap // where to find the OS</li>' +
            '<li>Firmware // program/instructions to run the Follow Me system // instructions for operation</li>' +
            '<li>An example of data being stored, e.g. the maximum speed, the minimum distance</li>' +
            '<li>Operating System // OS</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>MP2 "programs" on its own is not enough.</li>' +
            '<li>Allow two marks for two distinct examples of instructions or data, e.g. "the maximum speed ‘Follow Me’ can operate" and "the minimum distance the car in front can be".</li>' +
            '</ul></div>',
          modelAnswer: '1. The firmware/program that runs the ‘Follow Me’ system.\n\n2. The maximum speed the system can operate at.'
        },
        {
          num: 'Q7b(ii)',
          marks: 3,
          type: 'written',
          question: '<p>The RAM will store currently running data and instructions. State three items of data that will be stored in the RAM for the ‘Follow Me’ system.</p>',
          hint: 'These should be values that change moment to moment while the car is driving, not fixed settings.',
          starter: '1. … 2. … 3. …',
          stubs: ['1', '2', '3'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark each, max 3)</h5><ul>' +
            '<li>Current distance from the car in front</li>' +
            '<li>Set distance from the car in front</li>' +
            '<li>Current speed of the vehicle</li>' +
            '<li>Current speed of the vehicle in front</li>' +
            '<li>Reading from a sensor</li>' +
            '<li>Driver actions (e.g. moving the wheel/braking)</li>' +
            '<li>Direction the car (in front) is travelling (e.g. turning)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>"Speed" or "distance" on its own is not enough.</li>' +
            '<li>BOD reference to a camera taking images of what is in front.</li>' +
            '</ul></div>',
          modelAnswer: '1. The current distance from the car in front.\n\n2. The current speed of the vehicle.\n\n3. Live readings from the car’s sensors.'
        },
        {
          num: 'Q7b(iii)',
          marks: 2,
          type: 'written',
          question: '<p>Explain why the ‘Follow Me’ system does not need virtual memory.</p>',
          hint: 'Virtual memory is needed when RAM fills up — explain why that situation won’t happen here.',
          starter: 'The system only needs to store… so it is unlikely to…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2)</h5><ul>' +
            '<li>Only stores a small amount of data in RAM // only stores specific/few items in RAM … unlikely to run out of RAM // there is enough space in RAM</li>' +
            '<li>No secondary storage to use/needed as virtual memory</li>' +
            '<li>Few/one program(s)/instruction(s) running at a time // no memory intensive tasks</li>' +
            '<li>Dedicated hardware will be optimised for the system // RAM is designed to meet the system’s requirements</li>' +
            '</ul></div>',
          modelAnswer: 'The system only stores a small, fixed set of data (like speed and distance readings) and runs a single dedicated program, so it will never run out of RAM and never needs to swap data out to secondary storage.'
        }
      ]
    }
  ]
};
