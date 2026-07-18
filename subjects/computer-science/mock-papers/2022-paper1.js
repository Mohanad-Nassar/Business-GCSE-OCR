// ══════════════════════════════════════════════════════════════
// MOCK PAPER DATA — June 2022, OCR GCSE (9-1) Computer Science J277/01
// "Computer systems" (source: OCR 677830 question paper + 677961 mark
// scheme). Verbatim transcription used under the site's free-school-year
// content policy, served behind the auth gate (CS-CONTENT-PLAN.md D5).
//
// Shape: window.MOCK_PAPERS['2022-p1'] = { id, title, minutes, totalMarks,
// sections: [ { title, questions: [ {num, marks, type, format, question,
// hint, starter, markScheme, modelAnswer, ...widget data} ] } ] }.
//
// Question objects reuse the site's examQuestions shape (see
// subjects/computer-science/1.1.1-architecture-of-the-cpu.html). `format`
// is omitted for plain state/describe/explain/calculate items (renders as
// the 'lines' widget, ep-answer-area + self-mark against markScheme).
//
// Widget data-field conventions (same contract as mock-papers/2024-paper1.js
// and 2024-paper2.js — mirrored here so this file stands alone):
//   type:'mcq'          options: string[]; answer: 0-based index into options
//   format:'tickGrid'   q.grid = { cols: string[], rows: [ { label, correct: number[] (0-based col idx) } ] }
//   format:'tableFill'  q.table = { headers: string[], rows: (string|null)[][] } (null = blank cell)
//                        q.answers = { "r,c": string[] accepted answers } keyed 0-based into rows[]
//   format:'bankCloze'  q.cloze = HTML with ___1___.. blanks; q.bank = string[] (word bank incl. distractors)
//                        q.answers = string[] correct word per blank, in blank-number order
//   format:'banded'/'lines' — no extra field (exam-widgets.js already implements both)
//
// 2022 structural note: this was the first live J277 series after the
// COVID "advance information" period, but the paper itself is a normal,
// full-length 80-mark/7-question paper with the same rubric and question
// mix as later years — no reduced content or optional sections to flag.
// ══════════════════════════════════════════════════════════════

window.MOCK_PAPERS = window.MOCK_PAPERS || {};
window.MOCK_PAPERS['2022-p1'] = {
  id: '2022-p1',
  title: 'June 2022 · Paper 1 — Computer systems (J277/01)',
  minutes: 90,
  totalMarks: 80,
  sections: [
    {
      title: 'Answer all the questions.',
      questions: [
        {
          num: 'Q1a',
          marks: 4,
          type: 'written',
          format: 'tickGrid',
          question: '<p>Computers represent data in binary form.</p><p>Tick (✓) one box in each row to identify the binary unit equivalent of each of the given file sizes.</p><table><tr><th>File size</th><th>2 megabytes</th><th>2 petabytes</th><th>2 kilobytes</th><th>2 bytes</th><th>2 gigabytes</th></tr><tr><td>2000 bytes</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>2000 terabytes</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>16 bits</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>4 nibbles</td><td></td><td></td><td></td><td></td><td></td></tr></table>',
          hint: 'Convert every file size onto the same footing before comparing — remember 8 bits = 1 byte, so 16 bits and 4 nibbles (4 × 4 bits = 16 bits) are actually the same size.',
          starter: '2000 bytes → 2 kilobytes | 2000 terabytes → 2 petabytes | 16 bits → 2 bytes | 4 nibbles → 2 bytes',
          grid: { cols: ['2 megabytes', '2 petabytes', '2 kilobytes', '2 bytes', '2 gigabytes'], rows: [
            { label: '2000 bytes', correct: [2] },
            { label: '2000 terabytes', correct: [1] },
            { label: '16 bits', correct: [3] },
            { label: '4 nibbles', correct: [3] }
          ]},
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark for each row)</h5><ul>' +
            '<li>2000 bytes → <strong>2 kilobytes</strong></li>' +
            '<li>2000 terabytes → <strong>2 petabytes</strong></li>' +
            '<li>16 bits → <strong>2 bytes</strong></li>' +
            '<li>4 nibbles → <strong>2 bytes</strong></li>' +
            '</ul></div>',
          modelAnswer: '2000 bytes → 2 kilobytes\n\n2000 terabytes → 2 petabytes\n\n16 bits → 2 bytes\n\n4 nibbles → 2 bytes'
        },
        {
          num: 'Q1b',
          marks: 2,
          type: 'written',
          question: '<p>Convert the denary number 221 into 8 bit binary. Show your working.</p>',
          hint: 'Take away the largest place value (128, 64, 32…) that still fits, write a 1, and repeat with what is left — write a 0 anywhere a place value does not fit.',
          starter: '221 = 128 + … Working: … Answer: …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks</h5><ul>' +
            '<li>1 mark for working, e.g. dividing by 2, or writing the powers/values with the binary below, subtracting.</li>' +
            '<li>1 mark for answer <strong>11011101</strong>.</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>No follow-through for the answer from incorrect working.</li>' +
            '<li>Award the working mark if the binary is back-to-front, i.e. worked out against the place values 1 2 4 8 16 32 64 128 giving 1 0 1 1 1 0 1 1.</li>' +
            '</ul></div>',
          modelAnswer: '221 = 128 + 64 + 16 + 8 + 4 + 1 = 11011101'
        },
        {
          num: 'Q1c',
          marks: 2,
          type: 'written',
          question: '<p>Convert the hexadecimal number 2F into denary. Show your working.</p>',
          hint: 'Multiply the left digit by 16, then add the value of the right digit — or convert each hex digit to 4-bit binary first and combine.',
          starter: '2 × 16 = … + F (15) = … Answer: …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks</h5><ul>' +
            '<li>1 mark for working, e.g. multiplying by 16 (2 × 16 + 15), or converting to binary first (0010 1111).</li>' +
            '<li>1 mark for answer <strong>47</strong>.</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>No follow-through for the answer from incorrect working.</li>' +
            '</ul></div>',
          modelAnswer: '2 × 16 = 32, + 15 (F) = 47'
        },
        {
          num: 'Q1d',
          marks: 1,
          type: 'written',
          question: '<p>Convert the binary number 10110000 into hexadecimal.</p>',
          hint: 'Split into two 4-bit nibbles (1011 and 0000) and convert each nibble to a single hex digit separately.',
          starter: '1011 = … 0000 = … Answer: …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>B0</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Correct answer only.</li>' +
            '</ul></div>',
          modelAnswer: 'B0'
        },
        {
          num: 'Q1e',
          marks: 1,
          type: 'written',
          question: '<p>Identify how many unique values can be represented by 4 bits.</p>',
          hint: 'The number of unique values n bits can represent is 2 to the power of n.',
          starter: '2 to the power of 4 = …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>16</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Correct answer only.</li>' +
            '</ul></div>',
          modelAnswer: '16'
        },
        {
          num: 'Q1f',
          marks: 1,
          type: 'written',
          question: '<p>Perform a binary shift of 3 places right on the binary number 10001110.</p>',
          hint: 'Shifting right moves every bit 3 places towards the least-significant end; the vacated bits on the left fill with 0, and the rightmost bits fall off the end.',
          starter: '10001110 shifted right 3 = …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>00010001</strong></li>' +
            '</ul></div>',
          modelAnswer: '00010001'
        },
        {
          num: 'Q2',
          marks: 4,
          type: 'written',
          format: 'tableFill',
          question: '<p>Complete the table by writing the missing definition or name of each of the common CPU components and registers.</p><table><tr><th>CPU component or register</th><th>Definition</th></tr><tr><td></td><td>Stores the address of the next instruction to be fetched from memory. Increments during each fetch-execute cycle.</td></tr><tr><td>CU (Control Unit)</td><td></td></tr><tr><td></td><td>Stores the address of the data to be fetched from or the address where the data is to be stored.</td></tr><tr><td></td><td>Performs mathematical calculations and logical operations.</td></tr></table>',
          hint: 'Match each given definition to the register that does that job, then think of what the CU and the two blank definitions should say.',
          starter: 'Row 1 name: … | CU definition: … | Row 3 name: … | Row 4 name: …',
          table: { headers: ['CPU component or register', 'Definition'], rows: [[null, 'Stores the address of the next instruction to be fetched from memory. Increments during each fetch-execute cycle.'], ['CU (Control Unit)', null], [null, 'Stores the address of the data to be fetched from or the address where the data is to be stored.'], [null, 'Performs mathematical calculations and logical operations.']] },
          answers: {
            '0,0': ['Program Counter', 'PC'],
            '1,1': ['Synchronises the processor', 'Controls the processor', 'Coordinates the fetch-execute cycle', 'Sends signals to control the hardware/processes/flow of data', 'Decodes instructions in the CIR', 'Runs the fetch-execute cycle'],
            '2,0': ['Memory Address Register', 'MAR'],
            '3,0': ['Arithmetic Logic Unit', 'ALU']
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark for each term or definition)</h5><ul>' +
            '<li><strong>Program Counter // PC</strong> — stores the address of the next instruction to be fetched from memory. Increments in each fetch-execute cycle.</li>' +
            '<li><strong>CU (Control Unit)</strong> — (sends signals to) synchronise/control/coordinate the processor/hardware/fetch-execute cycle/processes/flow of data // decodes instructions (in CIR) // runs the fetch-execute cycle</li>' +
            '<li><strong>Memory Address Register // MAR</strong> — stores the address of the data to be fetched from, or the address where the data is to be stored.</li>' +
            '<li><strong>Arithmetic Logic Unit // ALU</strong> — performs the mathematical and logical calculations.</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Read the whole answer for CU and award a correct point at any stage.</li>' +
            '<li>CU "sends signals to components" on its own is not enough — it does not say what the signal’s purpose is.</li>' +
            '</ul></div>',
          modelAnswer: 'Row 1: Program Counter (PC)\n\nCU (Control Unit): synchronises/controls the processor and coordinates the fetch-execute cycle.\n\nRow 3: Memory Address Register (MAR)\n\nRow 4: Arithmetic Logic Unit (ALU)'
        },
        {
          num: 'Q3a(i)',
          marks: 3,
          type: 'written',
          question: '<p>A library has a LAN (Local Area Network).</p><p>The LAN allows access by both wired and wireless devices.</p><p>Users have reported that the network sometimes runs very slowly.</p><p>Explain why the number of devices using the network at the same time can affect the performance of the network.</p>',
          hint: 'Link the number of devices to bandwidth being shared, then explain what that sharing does to each device’s share and to waiting/collisions.',
          starter: 'More devices means the available bandwidth is…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark each, max 3)</h5><ul>' +
            '<li>Slower transmission of data // less data can be transmitted at the same time // the transmission rate decreases // time to send/receive increases</li>' +
            '<li>(More devices mean) more data is being transmitted (at a time)</li>' +
            '<li>Bandwidth will be split between all the devices (sending data) // each device uses some of the bandwidth … this means that there is less bandwidth for each device</li>' +
            '<li>Devices have to wait longer before they can transmit // increased latency</li>' +
            '<li>If the maximum bandwidth is used then devices cannot transmit</li>' +
            '<li>Central device/switch/router has to handle more requests and may run slower</li>' +
            '<li>More collisions (likely) // higher error rate … more data has to be retransmitted</li>' +
            '<li>Loss of more packets … more data has to be retransmitted</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The question is why. More devices do not decrease the bandwidth of the network — they decrease the amount allocated/available to each device.</li>' +
            '<li>Do not accept "higher contention ratio" — this term means the number of users on a connection, so it just repeats the question.</li>' +
            '</ul></div>',
          modelAnswer: 'When more devices transmit at the same time, the network’s total bandwidth has to be shared between them, so each device gets a smaller share and has to wait longer, which slows the connection down for everyone.'
        },
        {
          num: 'Q3a(ii)',
          marks: 1,
          type: 'written',
          question: '<p>Identify one other factor that can affect the performance of the network.</p>',
          hint: 'Think beyond the number of devices — the medium, the hardware, or the distance data has to travel all matter too.',
          starter: '…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark, e.g.</h5><ul>' +
            '<li>Bandwidth</li>' +
            '<li>Interference (by example)</li>' +
            '<li>Wired // wireless // transmission medium</li>' +
            '<li>Type/amount of data being transmitted</li>' +
            '<li>Central hardware performance (by example, e.g. router/switch)</li>' +
            '<li>Error rate</li>' +
            '<li>Distance between nodes</li>' +
            '<li>Topology // physical layout</li>' +
            '<li>Wireless repeaters</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not award "the number of users" — the question is about the performance of the network as a whole, not an individual device.</li>' +
            '</ul></div>',
          modelAnswer: 'The amount of interference on a wireless connection.'
        },
        {
          num: 'Q3b',
          marks: 7,
          type: 'written',
          format: 'bankCloze',
          question: '<p>Users can access websites from the library computers.</p><p>Complete the description of accessing websites using the given list of terms. Not all terms will be used.</p>',
          hint: 'Work through the paragraph in order — each blank’s job (device, address, boundary number, separator) narrows the word list down before you pick.',
          starter: '(1) … (2) … (3) … (4) … (5) … (6) … (7) …',
          cloze: '<p>A website is hosted on a ___1___. The computers that access the websites are called ___2___.</p><p>The user enters the ___3___ into a web browser. The web browser sends a request to the ___4___ for the matching IP (Internet Protocol) address. If found the IP address is returned. A request is then sent to this IP address.</p><p>An IPv4 address is made of 4 groups of digits. Each group can be between the denary values ___5___ and ___6___. The groups of digits are separated by a ___7___.</p>',
          bank: ['0', '1', '127', '128', '255', '256', 'Colon', 'Domain Name Server', 'Embedded systems', 'File server', 'Full stop', 'Hyphen', 'Internet protocol', 'MAC address', 'Router', 'Uniform Resource Locator', 'Web server', 'Clients'],
          answers: ['Web server', 'Clients', 'Uniform Resource Locator', 'Domain Name Server', '0', '255', 'Full stop'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 7 marks (1 mark for each completed term)</h5><ul>' +
            '<li>(1) <strong>Web server</strong></li>' +
            '<li>(2) <strong>Clients</strong></li>' +
            '<li>(3) <strong>Uniform Resource Locator</strong></li>' +
            '<li>(4) <strong>Domain Name Server</strong></li>' +
            '<li>(5) <strong>0</strong></li>' +
            '<li>(6) <strong>255</strong></li>' +
            '<li>(7) <strong>Full stop</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Words are given so must match exactly, however accept "domain name system" for Domain Name Server, and accept URL, DNS.</li>' +
            '<li>Accept 0 and 255 in either order for blanks (5) and (6).</li>' +
            '<li>Do not allow "server" alone for (1) — "file server" is another option in the bank and it would be ambiguous.</li>' +
            '</ul></div>',
          modelAnswer: '(1) Web server (2) Clients (3) Uniform Resource Locator (4) Domain Name Server (5) 0 (6) 255 (7) Full stop'
        },
        {
          num: 'Q3c',
          marks: 2,
          type: 'written',
          question: '<p>The wired connection is an Ethernet connection. Ethernet is considered a standard.</p><p>Explain why Ethernet is a standard.</p>',
          hint: 'A "standard" is about being universally adopted and compatible, not simply about being a good connection — though the benefits that made it popular also count.',
          starter: 'Ethernet is used by… which allows…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2), e.g.</h5><ul>' +
            '<li>Ethernet is used by (mostly) all manufacturers // Ethernet is used in many devices</li>' +
            '<li>To allow compatibility with other devices</li>' +
            '<li>Ethernet has a high bandwidth</li>' +
            '<li>Ethernet has inbuilt security</li>' +
            '<li>Ethernet is a proven/reliable connection</li>' +
            '<li>Ethernet is low cost for purchase/installation/maintenance (compared to other wired connections)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept a description of what a standard is, and/or benefits of Ethernet (i.e. why it has become a standard).</li>' +
            '</ul></div>',
          modelAnswer: 'Ethernet is used by almost all manufacturers, so devices from different companies are compatible with each other, which is why it has become the standard wired connection.'
        },
        {
          num: 'Q3d',
          marks: 3,
          type: 'written',
          question: '<p>The network has several routers.</p><p>Identify three tasks carried out by a router.</p>',
          hint: 'Focus on what a router actually DOES with packets, not what it is used for in general — the question is about tasks, not benefits.',
          starter: '1. … 2. … 3. …',
          stubs: ['1', '2', '3'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark each, max 3), e.g.</h5><ul>' +
            '<li>Receive packets</li>' +
            '<li>Forward/sending/transmitting packets</li>' +
            '<li>Maintain a routing table (by description)</li>' +
            '<li>Identify the most efficient path to the destination / correct IP / correct location</li>' +
            '<li>Assign IP addresses to nodes/devices</li>' +
            '<li>Converts packets from one protocol to another</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The question is about tasks carried out by a router, not the use of a router in a network.</li>' +
            '</ul></div>',
          modelAnswer: '1. Receives packets of data.\n\n2. Forwards/transmits packets towards their destination.\n\n3. Identifies the most efficient path for a packet to take.'
        },
        {
          num: 'Q3e',
          marks: 2,
          type: 'written',
          question: '<p>The library does not use encryption when data is transmitted through the network.</p><p>Give two reasons why the library should use encryption.</p>',
          hint: 'Think about what happens to intercepted data, and about the library’s legal duty to protect it.',
          starter: '1. … 2. …',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2), e.g.</h5><ul>' +
            '<li>Data cannot be understood if intercepted // the data will be meaningless</li>' +
            '<li>So that only authorised users can access the confidential material // protect confidential/personal/user/library data</li>' +
            '<li>To follow legislation/the Data Protection Act</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The question is about transmission, not storage.</li>' +
            '<li>Candidates might answer in terms of why encryption is good, or why the current (unencrypted) system is not good. If it is not clear which they mean, the reverse of each mark point can still be given.</li>' +
            '</ul></div>',
          modelAnswer: '1. If the data is intercepted while it is being sent, encryption means it cannot be understood without the key.\n\n2. The library has a legal duty under the Data Protection Act to keep personal data secure.'
        },
        {
          num: 'Q3f',
          marks: 2,
          type: 'written',
          question: '<p>Protocols are used to transmit data through the network and over the internet.</p><p>Identify one protocol that can be used to perform each of the following tasks:</p>',
          hint: 'Both answers can be given as the full name or the abbreviation — either is accepted.',
          starter: 'Send an email: … | Access a website securely: …',
          stubs: ['Send an email', 'Access a website securely'],
          stubLines: [1, 1],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each)</h5><ul>' +
            '<li>Send an email: <strong>SMTP // simple mail transfer protocol</strong></li>' +
            '<li>Access a website securely: <strong>HTTPS // hypertext transfer protocol secure</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Mark the first answer given on each line.</li>' +
            '<li>If the abbreviation given is inaccurate, check whether it is written out in full (and vice versa).</li>' +
            '</ul></div>',
          modelAnswer: 'Send an email: SMTP\n\nAccess a website securely: HTTPS'
        },
        {
          num: 'Q4',
          marks: 8,
          type: 'written',
          format: 'banded',
          question: '<p>Social networking websites use artificial intelligence (AI) to monitor posts from users.</p><p>Discuss the positive and negative uses of AI by social networking websites including:</p><ul><li>Legal issues</li><li>Ethical issues</li><li>Privacy issues</li></ul>',
          hint: 'Cover all three named issues for BOTH the positive and negative side of AI monitoring, and finish by weighing them up — that structure alone pushes you into the top band.',
          starter: 'Legally, AI monitoring… Ethically, it… In terms of privacy… Overall, the positives/negatives outweigh…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 8 marks (AO2)</h5>' +
            '<p><strong>Band 3 — High Level (6–8 marks):</strong> Thorough knowledge and understanding of a wide range of considerations; material is generally accurate and detailed. Knowledge and understanding are applied directly and consistently to the context provided, with explicitly relevant evidence/examples. Weighs up both sides of the discussion, including reference to the impact on all areas, showing thorough recognition of influencing factors. Well-developed line of reasoning which is clear and logically structured; information presented is relevant and substantiated.</p>' +
            '<p><strong>Band 2 — Mid Level (3–5 marks):</strong> Reasonable knowledge and understanding of a range of considerations; generally accurate but at times underdeveloped. Applied directly to the context although one or two opportunities are missed; evidence/examples for the most part implicitly relevant. Reasonable attempt to discuss the impact on most areas, showing reasonable recognition of influencing factors. Line of reasoning with some structure; information in the most part relevant and supported by some evidence.</p>' +
            '<p><strong>Band 1 — Low Level (1–2 marks):</strong> Basic knowledge with limited understanding shown; material is basic and contains some inaccuracies. Limited attempt to apply knowledge and understanding to the context provided; nothing more than an unsupported assertion. Information is basic and communicated in an unstructured way, supported by limited evidence; the relationship to the evidence may not be clear.</p>' +
            '<p><strong>0 marks:</strong> No attempt to answer the question or response is not worthy of credit.</p>' +
            '</div><div class="marks-section"><h5>How the marks are given</h5><p><strong>Indicative content (not prescriptive or exhaustive):</strong></p><ul>' +
            '<li><strong>Legal issues:</strong> the Copyright Designs and Patents Act — AI can check for plagiarism automatically and highlight posts, e.g. videos or images. The Data Protection Act — needs to make sure rules are followed so that the AI algorithm does not breach security. AI can check that materials are all legal. The user has agreed the terms when signing up, so should expect monitoring.</li>' +
            '<li><strong>Ethical issues:</strong> users may not want everything they post monitoring. AI may incorrectly block users/posts. AI can limit plagiarism. AI can make sure inappropriate/illegal posts are not published. The website will need to tell users what it is doing and they must agree to it. Records of monitoring reports may be stored and used for other purposes. Users may feel safer using the website because they know inappropriate material will not be published.</li>' +
            '<li><strong>Privacy issues:</strong> users may feel like they are being watched all the time. Terms and conditions may sign away their rights to privacy when using the website. People may prefer a computer analysing their posts than people reading them.</li>' +
            '</ul></div>',
          modelAnswer: 'Legally, AI monitoring can automatically check posts against the Copyright Designs and Patents Act, catching plagiarised videos or images, and helps the site enforce the Data Protection Act by controlling what personal data the algorithm itself processes. However, users technically agreed to this monitoring when they accepted the site’s terms and conditions, even if they do not realise the extent of it.\n\nEthically, AI monitoring can quickly remove illegal or harmful posts and reduce plagiarism, which can make users feel safer on the platform. On the other hand, AI can incorrectly block legitimate posts, and many users may simply not want everything they post to be automatically analysed.\n\nIn terms of privacy, users may feel constantly watched, and the records generated by monitoring could potentially be used for purposes beyond moderation. Some users may actually prefer a computer analysing their data rather than a human reading it personally.\n\nOverall, I think the benefits of catching illegal and harmful content quickly outweigh the drawbacks, provided the website is transparent with users about exactly what is monitored and why.'
        },
        {
          num: 'Q5a',
          marks: 2,
          type: 'written',
          question: '<p>A software development company wants to protect their computer systems and data from unauthorised access.</p><p>Identify two methods of physical security that the company could use to protect their computer systems.</p>',
          hint: 'Physical security means something that stops a person physically reaching the hardware — not software.',
          starter: '1. … 2. …',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2), e.g.</h5><ul>' +
            '<li>Locks</li>' +
            '<li>Keycard entry</li>' +
            '<li>Biometric entry to room</li>' +
            '<li>Passcode entry to room</li>' +
            '<li>Alarms</li>' +
            '<li>Security guards/team</li>' +
            '<li>CCTV</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The "secure room/device" in this scenario is understood to be the company’s premises.</li>' +
            '<li>Mark the first answer given in each answer space.</li>' +
            '<li>Do not award "password" — but do award a passcode/keyword used on a door.</li>' +
            '</ul></div>',
          modelAnswer: '1. Keycard entry to the building/server room.\n\n2. CCTV cameras monitoring the premises.'
        },
        {
          num: 'Q5b',
          marks: 6,
          type: 'written',
          question: '<p>Identify and describe two software-based security methods that the company can use to protect their computer systems and data.</p>',
          hint: 'Name your method first — if the examiner cannot tell what it is, your description points cannot be awarded. Pick two genuinely different methods, not two versions of the same idea.',
          starter: 'Method 1: … Description: … Method 2: … Description: …',
          stubs: ['Method 1', 'Description', 'Method 2', 'Description'],
          stubLines: [1, 3, 1, 3],
          markPoints: {
            note: 'Mark the method name first — if it is wrong, do not tick description points for that method. Your two methods must be genuinely different: if your second method just repeats the first (e.g. giving "password" and then "locking out after failed attempts" as if they were separate), the whole answer is capped at 3 marks total.',
            groups: [
              { label: 'Your first method', max: 3, points: [
                { text: 'Named a valid software-based security method (e.g. anti-malware, anti-virus, anti-spyware, firewall, encryption, user access levels, or passwords/biometrics/authentication/two-step authentication)', marks: 1 },
                { text: 'Gave a first correct description point that matches THAT method', marks: 1 },
                { text: 'Gave a second correct description point that matches THAT method', marks: 1 } ] },
              { label: 'Your second method', max: 3, points: [
                { text: 'Named a DIFFERENT valid software-based security method', marks: 1 },
                { text: 'Gave a first correct description point that matches that second method', marks: 1 },
                { text: 'Gave a second correct description point that matches that second method', marks: 1 } ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 6 marks (1 mark for each name, 1 mark per bullet for matching description, to max 2 each)</h5><ul>' +
            '<li><strong>Anti-malware</strong> — scans for/identifies virus/spyware/malware; compares data to a database of malware; alerts user and requests action; quarantines/deletes virus/spyware/malware; stops the download of virus/spyware/malware</li>' +
            '<li><strong>Firewall</strong> — scans incoming and outgoing traffic; compares traffic to a criteria; blocks traffic that is unauthorised; blocks incoming/outgoing traffic</li>' +
            '<li><strong>Encryption</strong> — scrambles data, using an algorithm, so if intercepted it cannot be understood; key needed to decrypt</li>' +
            '<li><strong>User access levels</strong> — data can be read/write/read-write (by example); prevents accidental changes; limits data users can access</li>' +
            '<li><strong>Anti-virus</strong> — scans for/identifies virus/malware; compares data to a database of viruses/malware; alerts user and requests action; quarantines/deletes virus/spyware; stops the download of virus/malware</li>' +
            '<li><strong>Anti-spyware</strong> — scans for/identifies spyware/keylogger; compares data to a database of spyware; alerts user and requests action; quarantines/deletes spyware; stops the download of spyware/malware</li>' +
            '<li><strong>Passwords/biometrics/authentication</strong> — code/fingerprint etc. has to be correctly entered to gain access; strong password (letters, numbers, symbols) / fingerprint is unique to the individual; harder/impossible for a brute-force attack to succeed; lock after set number of failed attempts</li>' +
            '<li><strong>Two-step authentication</strong> — a code is sent to the user’s separate device; an unauthorised person will need access to this device as well</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Mark the method first. If the method is wrong, do not read on. If the method is unclear, or part of a description of a method, read the full answer.</li>' +
            '<li>If the second method is a repeat of the first (for example password, and then locking out), mark the whole answer for a max of 3.</li>' +
            '</ul></div>',
          modelAnswer: 'Method 1: Firewall\n\nDescription: it scans incoming and outgoing network traffic and compares it against a set of rules, blocking any traffic that is not authorised.\n\nMethod 2: Encryption\n\nDescription: it scrambles data using an algorithm before it is stored or sent, so that if it is intercepted it cannot be understood without the correct key.'
        },
        {
          num: 'Q5c',
          marks: 5,
          type: 'written',
          format: 'tickGrid',
          question: '<p>Tick (✓) one box on each row to identify the legislation that would cover each of the given events.</p><table><tr><th>Event</th><th>The Data Protection Act (2018)</th><th>Computer Misuse Act (1990)</th><th>Copyright Designs and Patents Act (1988)</th></tr><tr><td>A company transmits personal data to another company without the individual’s permission.</td><td></td><td></td><td></td></tr><tr><td>A school accidentally publishes their students’ addresses on the school website.</td><td></td><td></td><td></td></tr><tr><td>The interface for a piece of software is replicated by a rival company.</td><td></td><td></td><td></td></tr><tr><td>A user leaves a computer logged on and another person leaves them a message on their desktop.</td><td></td><td></td><td></td></tr><tr><td>A student guesses their teacher’s password and accesses their computer account.</td><td></td><td></td><td></td></tr></table>',
          hint: 'Ask yourself what actually happened: was personal data mishandled (DPA), was a computer accessed without permission (CMA), or was someone’s original work copied (Copyright)?',
          starter: 'Row 1 → DPA | Row 2 → DPA | Row 3 → Copyright | Row 4 → CMA | Row 5 → CMA',
          grid: { cols: ['The Data Protection Act (2018)', 'Computer Misuse Act (1990)', 'Copyright Designs and Patents Act (1988)'], rows: [
            { label: 'A company transmits personal data to another company without the individual’s permission.', correct: [0] },
            { label: 'A school accidentally publishes their students’ addresses on the school website.', correct: [0] },
            { label: 'The interface for a piece of software is replicated by a rival company.', correct: [2] },
            { label: 'A user leaves a computer logged on and another person leaves them a message on their desktop.', correct: [1] },
            { label: 'A student guesses their teacher’s password and accesses their computer account.', correct: [1] }
          ]},
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 5 marks (1 mark for each row)</h5><ul>' +
            '<li>A company transmits personal data without permission → <strong>The Data Protection Act (2018)</strong></li>' +
            '<li>A school publishes students’ addresses → <strong>The Data Protection Act (2018)</strong></li>' +
            '<li>A software interface is replicated by a rival company → <strong>Copyright Designs and Patents Act (1988)</strong></li>' +
            '<li>A message is left on a logged-on desktop → <strong>Computer Misuse Act (1990)</strong></li>' +
            '<li>A student guesses a password and accesses an account → <strong>Computer Misuse Act (1990)</strong></li>' +
            '</ul></div>',
          modelAnswer: 'Row 1 → Data Protection Act (2018)\n\nRow 2 → Data Protection Act (2018)\n\nRow 3 → Copyright Designs and Patents Act (1988)\n\nRow 4 → Computer Misuse Act (1990)\n\nRow 5 → Computer Misuse Act (1990)'
        },
        {
          num: 'Q6a(i)',
          marks: 3,
          type: 'written',
          question: '<p>A student is creating a range of documents for a school project.</p><p>The student records a podcast about computer science.</p><p>Describe how an analogue sound wave is converted into digital form.</p>',
          hint: 'Cover what property of the wave gets measured, how often it is measured, and how each measurement ends up stored.',
          starter: 'The sound wave is sampled… the amplitude is measured… at regular intervals…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark per bullet, max 3)</h5><ul>' +
            '<li>(Analogue) sound wave is sampled</li>' +
            '<li>…amplitude/height (of the wave) is measured</li>' +
            '<li>…at set/regular time intervals (by example)</li>' +
            '<li>Each sample/measurement is stored as a binary number</li>' +
            '<li>The binary number for each sample is stored sequentially</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not award "the frequency of the wave is measured" for the second bullet.</li>' +
            '</ul></div>',
          modelAnswer: 'The analogue sound wave is sampled — its amplitude is measured at regular, fixed time intervals, and each measurement is stored as a binary number, one after another.'
        },
        {
          num: 'Q6a(ii)',
          marks: 3,
          type: 'written',
          format: 'tickGrid',
          question: '<p>Tick (✓) one or more boxes on each row to identify the effect(s) that each change will have on the sound file.</p><table><tr><th>Change</th><th>File size increases</th><th>File size decreases</th><th>Accuracy increases</th><th>Accuracy decreases</th></tr><tr><td>Duration changes from 10 minutes to 20 minutes</td><td></td><td></td><td></td><td></td></tr><tr><td>Sample rate changes from 44 kilohertz to 8 kilohertz</td><td></td><td></td><td></td><td></td></tr><tr><td>Bit depth changes from 8 bits to 16 bits</td><td></td><td></td><td></td><td></td></tr></table>',
          hint: 'Duration only ever changes file size, not accuracy. Sample rate and bit depth both change accuracy AND file size together — work out the direction of each separately.',
          starter: 'Duration → file size increases only | Sample rate → file size decreases + accuracy decreases | Bit depth → file size increases + accuracy increases',
          grid: { cols: ['File size increases', 'File size decreases', 'Accuracy increases', 'Accuracy decreases'], rows: [
            { label: 'Duration changes from 10 minutes to 20 minutes', correct: [0] },
            { label: 'Sample rate changes from 44 kilohertz to 8 kilohertz', correct: [1, 3] },
            { label: 'Bit depth changes from 8 bits to 16 bits', correct: [0, 2] }
          ]},
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark for each row)</h5><ul>' +
            '<li>Duration 10→20 minutes → <strong>File size increases</strong></li>' +
            '<li>Sample rate 44kHz→8kHz → <strong>File size decreases, Accuracy decreases</strong></li>' +
            '<li>Bit depth 8 bits→16 bits → <strong>File size increases, Accuracy increases</strong></li>' +
            '</ul></div>',
          modelAnswer: 'Duration change: File size increases.\n\nSample rate change: File size decreases and accuracy decreases.\n\nBit depth change: File size increases and accuracy increases.'
        },
        {
          num: 'Q6b(i)',
          marks: 1,
          type: 'written',
          question: '<p>The student writes a report about volcanoes.</p><p>The computer stores text using the ASCII character set.</p><p>Part of the ASCII character set is shown:</p><table><tr><th>Character</th><th>ASCII denary code</th></tr><tr><td>M</td><td>77</td></tr><tr><td>N</td><td>78</td></tr><tr><td>O</td><td>79</td></tr><tr><td>P</td><td>80</td></tr><tr><td>Q</td><td>81</td></tr></table><p>Identify the character that will be represented by the ASCII denary code 84.</p>',
          hint: 'The codes in the table increase by 1 for each next letter of the alphabet — count on from Q (81) to 84.',
          starter: 'Q=81, R=82, S=83, T=84 → …',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>T</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Case sensitive — mark the first letter given.</li>' +
            '</ul></div>',
          modelAnswer: 'T'
        },
        {
          num: 'Q6b(ii)',
          marks: 1,
          type: 'written',
          question: '<p>Identify a second character set.</p>',
          hint: 'Name a character set that can represent many more characters/languages than ASCII.',
          starter: '…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark</h5><ul>' +
            '<li><strong>Unicode</strong></li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept any other valid character set.</li>' +
            '</ul></div>',
          modelAnswer: 'Unicode'
        },
        {
          num: 'Q6c',
          marks: 3,
          type: 'written',
          question: '<p>The student takes a photograph of their science experiment. The image file includes metadata.</p><p>Identify three pieces of metadata that is often stored with an image.</p>',
          hint: 'Metadata describes the image file itself (its properties or how it was captured), not the content shown in the photo.',
          starter: '1. … 2. … 3. …',
          stubs: ['1', '2', '3'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 3 marks (1 mark each, max 3), e.g.</h5><ul>' +
            '<li>Height</li>' +
            '<li>Width</li>' +
            '<li>Colour/bit depth</li>' +
            '<li>Date</li>' +
            '<li>Geolocation</li>' +
            '<li>File size</li>' +
            '<li>File type</li>' +
            '<li>Compression type</li>' +
            '<li>Author</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Accept anything reasonable, but not features of the image itself, e.g. names of people in the photo.</li>' +
            '<li>Award "resolution" for height or width, but max 2 marks total across resolution/dimensions/image size/height/width.</li>' +
            '<li>"Colour" on its own is not enough. "Size" on its own is not enough.</li>' +
            '<li>Needs to be what is stored, e.g. the date is stored, but the age of the image is not stored.</li>' +
            '</ul></div>',
          modelAnswer: '1. The height and width of the image (dimensions).\n\n2. The colour/bit depth used.\n\n3. The date the photo was taken.'
        },
        {
          num: 'Q6d(i)',
          marks: 2,
          type: 'written',
          question: '<p>The student compresses all their documents before emailing them to their teacher.</p><p>Give two benefits of compressing the data before it is emailed.</p>',
          hint: 'Think about what a smaller file means both for sending it and for the space it takes up once received.',
          starter: '1. … 2. …',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2), e.g.</h5><ul>' +
            '<li>Reduces file size</li>' +
            '<li>Takes less time to transmit // faster to upload // faster to download</li>' +
            '<li>Requires less storage space (on the server/device)</li>' +
            '<li>May otherwise exceed email storage/attachment limits</li>' +
            '<li>Uses less bandwidth to transmit</li>' +
            '<li>Uses less data to send (e.g. mobile data)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Mark the first answer given in each answer space.</li>' +
            '</ul></div>',
          modelAnswer: '1. The files take up less storage space once received.\n\n2. They take less time to upload and download.'
        },
        {
          num: 'Q6d(ii)',
          marks: 2,
          type: 'written',
          question: '<p>Explain why lossy compression may not be appropriate to compress all of the student’s files.</p>',
          hint: 'Think about what lossy compression does to data permanently, and about the type of file (text) where that would be a problem.',
          starter: 'Lossy compression permanently removes data, so…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each, max 2)</h5><ul>' +
            '<li>Data will be permanently lost // not all data is recoverable</li>' +
            '<li>Text files cannot be compressed with lossy compression</li>' +
            '<li>The teacher requires the original/high quality image/video/sound files</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>The second mark point requires identifying that the files contain text and that text cannot be compressed with lossy compression.</li>' +
            '</ul></div>',
          modelAnswer: 'Lossy compression permanently removes some of the data to shrink the file, which cannot be recovered. For any text documents in the report this would corrupt the text, so lossy compression is not appropriate for those files.'
        },
        {
          num: 'Q7a(i)',
          marks: 1,
          type: 'written',
          question: '<p>A smart television allows the user to search the Internet and watch videos online.</p><p>The smart television has both RAM and ROM.</p><p>State the difference between RAM and ROM.</p>',
          hint: 'Focus on whether data survives with the power off, and whether the contents can normally be changed.',
          starter: 'ROM is… whereas RAM is…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 1 mark, e.g.</h5><ul>' +
            '<li>ROM is non-volatile, RAM is volatile (by description)</li>' +
            '<li>The content of ROM cannot (usually) be changed, the content of RAM can be changed</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Read the whole answer.</li>' +
            '</ul></div>',
          modelAnswer: 'ROM is non-volatile, so it keeps its data when the power is off, whereas RAM is volatile and loses its data when the power is off.'
        },
        {
          num: 'Q7a(ii)',
          marks: 2,
          type: 'written',
          question: '<p>Give two examples of data that the smart television could store in RAM.</p>',
          hint: 'Pick things that change while the TV is running, not the software itself being installed.',
          starter: '1. … 2. …',
          stubs: ['1', '2'],
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks (1 mark each to max 2), e.g.</h5><ul>' +
            '<li>Web browser/application that is running</li>' +
            '<li>(Parts of the) operating system currently running</li>' +
            '<li>Current video/film/TV programme being watched</li>' +
            '<li>Data being downloaded/buffered</li>' +
            '<li>Button pressed by the user</li>' +
            '<li>Current volume</li>' +
            '<li>Current channel being watched</li>' +
            '<li>Source being watched (e.g. HDMI1)</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Allow anything reasonable but it must be clearly RAM, e.g. not just "stores the software/OS" (this is secondary storage).</li>' +
            '<li>Do not award brand names without exemplification.</li>' +
            '</ul></div>',
          modelAnswer: '1. The video currently being streamed/buffered.\n\n2. The current volume level.'
        },
        {
          num: 'Q7b(i)',
          marks: 2,
          type: 'written',
          question: '<p>The smart television has secondary storage.</p><p>State, using an example, why the smart television needs secondary storage.</p>',
          hint: 'Give one example of what is stored, and one reason it needs to be non-volatile/permanent storage.',
          starter: 'For example, the… this needs to be stored permanently because…',
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 2 marks</h5><ul>' +
            '<li>1 mark for an example, e.g. the OS, web browser software, a recorded show, user preferences.</li>' +
            '<li>1 mark for: to store data once the computer is turned off / permanently // for non-volatile storage.</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Both marks can be awarded by example, e.g. "To install software that will not be lost when the TV is turned off" gets 1 mark for software and 1 mark for it not being lost when turned off.</li>' +
            '<li>Do not award brand names without exemplification.</li>' +
            '</ul></div>',
          modelAnswer: 'For example, the operating system needs to be stored in secondary storage so that it is not lost and can still be loaded the next time the television is turned on.'
        },
        {
          num: 'Q7b(ii)',
          marks: 4,
          type: 'written',
          question: '<p>Identify one appropriate type of secondary storage for the smart television. Justify your choice.</p>',
          hint: 'Pick a type first, then give up to three justification points that only make sense for the type you picked.',
          starter: 'Secondary storage type: … Justification: …',
          stubs: ['Secondary storage type', 'Justification'],
          stubLines: [1, 4],
          markPoints: {
            note: '1 mark for a correctly chosen type; 1 mark per justification point that genuinely matches that type, up to a max of 3. Justification must match the chosen type — reasons for the wrong type earn nothing.',
            groups: [
              { label: 'Your storage type', max: 1, points: [
                { text: 'Named an appropriate type — magnetic OR solid state (an optical type is not appropriate here and cannot be awarded)', marks: 1 }
              ] },
              { label: 'Your justification', max: 3, points: [
                { text: 'Gave a capacity reason matching your type (e.g. large storage capacity for storing software/videos/HD content)', marks: 1 },
                { text: "Gave a reason linked to the TV not being moved (e.g. magnetic: durability/portability isn't required because it stays still; solid state: durable/robust if it ever IS moved)", marks: 1 },
                { text: 'Gave a cost reason matching your type (e.g. low cost to purchase, so the TV is cheaper to manufacture/buy)', marks: 1 },
                { text: 'Gave another correct reason matching your type (e.g. solid state: fast data access makes the TV more responsive / runs quieter / produces less heat / uses less energy / compact; magnetic: the device is small enough to fit inside the TV / longevity and reliability)', marks: 1 }
              ] }
            ]
          },
          markScheme: '<div class="marks-section"><h5>Mark Scheme — 4 marks (1 mark for choice of magnetic or solid state; 1 mark per bullet to max 3 for justification) e.g.</h5><ul>' +
            '<li><strong>Magnetic:</strong> large storage capacity … for storing software/videos/HD; television unlikely to be moved … therefore durability/portability not required; cost to purchase is low … so the TV will be cheaper to manufacture/purchase; device will fit in a TV // device is small; longevity // reliable.</li>' +
            '<li><strong>Solid state:</strong> large storage capacity … for storing software/videos/HD; television may be moved … therefore durable/robust/portable; fast data access … television will be more responsive; cost to purchase is low … so the TV is not too expensive to manufacture/purchase; run quieter; produce less heat; use less energy; compact // lightweight … so TV can be made smaller/lighter.</li>' +
            '</ul></div><div class="marks-section"><h5>How the marks are given</h5><ul>' +
            '<li>Do not award a specific device, e.g. hard disk — the question asks for a type. Follow-through is allowed for justification, to max 3. If both a device and a type are given, award, e.g. solid state drive, SSD, magnetic hard disk drive.</li>' +
            '<li>Mark the first secondary storage type given.</li>' +
            '<li>If no secondary storage type is given, read the justification for a type — do not award the type mark, but mark the justification (max 3).</li>' +
            '<li>Justification must match the choice.</li>' +
            '<li>If the type is inappropriate, e.g. optical, do not award.</li>' +
            '</ul></div>',
          modelAnswer: 'Secondary storage type: Solid state\n\nJustification: solid state storage runs quietly and produces very little heat, which suits a television in a living room. It also has fast data access, so menus and apps feel responsive, and it uses less energy to run.'
        }
      ]
    }
  ]
};
