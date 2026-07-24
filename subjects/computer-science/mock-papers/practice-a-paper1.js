// Practice Paper A · Paper 1 — Computer systems (J277/01)
// ORIGINAL clean-room content, authored from the OCR J277 specification.
// NOT transcribed from any OCR paper, mark scheme or examiner report.
window.MOCK_PAPERS = window.MOCK_PAPERS || {};
window.MOCK_PAPERS['practice-a-p1'] = {
  id: 'practice-a-p1',
  title: 'Practice Paper A · Paper 1 — Computer systems',
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
          caseStudy: "",
          question: `<p>Tick <strong>one</strong> box to identify the main purpose of the CPU in a computer system.</p>`,
          options: [
            "To fetch, decode and execute instructions",
            "To store data permanently, even when the computer is switched off",
            "To provide a graphical interface for users to interact with software and files",
            "To convert analogue input signals into digital form for other components to use"
          ],
          answer: 0,
          hint: "The CPU's job is carrying out program instructions, not storing data or handling a user interface — those belong to other parts of the system.",
          starter: "",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 1 mark</h5>
<ul>
<li>To fetch, decode and execute instructions</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark for the correct option only. Two or more ticks scores 0.</li>
</ul>
</div>`,
          modelAnswer: "To fetch, decode and execute instructions."
        },
        {
          num: "Q2",
          marks: 1,
          type: "mcq",
          caseStudy: "",
          question: `<p>Tick <strong>one</strong> box to identify the correct statement about ROM.</p>`,
          options: [
            "ROM is volatile memory, so its contents are lost whenever the computer's power is turned off",
            "ROM is used to temporarily hold the programs and data a user currently has open on their computer",
            "ROM stores the startup instructions the computer needs and cannot normally be changed by the user",
            "ROM typically offers a significantly larger overall storage capacity than a computer's secondary storage devices, such as an SSD"
          ],
          answer: 2,
          hint: "Think about which memory is non-volatile and holds fixed start-up instructions, rather than temporary working data.",
          starter: "",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 1 mark</h5>
<ul>
<li>ROM stores the startup instructions the computer needs and cannot normally be changed by the user</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark for the correct option only. Two or more ticks scores 0.</li>
</ul>
</div>`,
          modelAnswer: "ROM stores the startup instructions the computer needs and cannot normally be changed by the user."
        },
        {
          num: "Q3",
          marks: 2,
          type: "written",
          caseStudy: "",
          question: `<p>A washing machine's controller is described as an <strong>embedded system</strong>, rather than a general-purpose computer system. Give two reasons why.</p>`,
          hint: "Think about what a washing machine's controller is built to do compared with a laptop, and what software it can and can't run.",
          starter: "One reason is… A second reason is…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 2 marks (1 mark per reason, up to 2)</h5>
<ul>
<li>Award 1 mark for: it is designed to carry out one specific, dedicated function (controlling the wash cycle), rather than many different tasks</li>
<li>Award 1 mark for: it is built into a larger device/product, rather than being a stand-alone computer</li>
<li>Accept: it has no general-purpose operating system, or the user cannot install and run other software on it, or it typically uses cheaper/lower-power hardware suited to one task</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark for each distinct, valid reason, to a maximum of 2. Two versions of the same reason score only 1 mark.</li>
</ul>
</div>`,
          modelAnswer: "It is designed to perform one specific, dedicated task — running the wash cycle — rather than lots of different tasks. It is also built into the washing machine itself, with no general-purpose operating system that would let a user install and run other software on it."
        },
        {
          num: "Q4",
          marks: 2,
          type: "written",
          caseStudy: "",
          question: `<p>A school stores each student's photo as a 4 megabyte (MB) file. Calculate the total storage, in gigabytes (GB), needed for 500 student photos. Show your working. Use the specification's ×1,000 convention.</p>`,
          hint: "First find the total in megabytes, then convert megabytes into gigabytes using ×1,000.",
          starter: "Total in MB = … Total in GB = …",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 2 marks</h5>
<ul>
<li>Award 1 mark for: 500 × 4 = 2,000 MB</li>
<li>Award 1 mark for: 2,000 ÷ 1,000 = 2 GB</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Accept a correct final answer with correct working shown even if the intermediate step is not stated separately. Accept 1.95 GB if ÷1,024 is used consistently instead.</li>
</ul>
</div>`,
          modelAnswer: "500 × 4 = 2,000 MB. 2,000 ÷ 1,000 = 2 GB."
        },
        {
          num: "Q5",
          marks: 4,
          type: "written",
          caseStudy: "",
          question: `<p>Describe the fetch-decode-execute cycle, referring to the Program Counter (PC), Memory Address Register (MAR), Memory Data Register (MDR) and Accumulator (ACC) in your answer.</p>`,
          hint: "Work through the cycle in order: which register holds the next address, which register is loaded with that address, which register receives what comes back from memory, and where a result ends up.",
          starter: "The Program Counter (PC)… The MAR… The MDR… Finally…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 4 marks (1 mark per point, up to 4)</h5>
<ul>
<li>Award 1 mark for: the PC holds the address of the next instruction to be fetched, and is incremented so it points to the following instruction</li>
<li>Award 1 mark for: the address held in the PC is copied into the MAR, ready to fetch from that location in memory</li>
<li>Award 1 mark for: the instruction or data found at that address is copied into the MDR, and the instruction is then decoded so the CPU knows what to do</li>
<li>Award 1 mark for: the instruction is executed, for example by the ALU carrying out a calculation, with the result able to be stored in the ACC</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award marks for any 4 of the points above described in a logical order. A description that never mentions what a named register actually stores cannot gain that register's mark.</li>
</ul>
</div>`,
          modelAnswer: "The Program Counter (PC) holds the address of the next instruction and is incremented after each fetch. That address is copied into the Memory Address Register (MAR). The instruction stored at that address in memory is then copied into the Memory Data Register (MDR), where it can be decoded. Finally, the instruction is executed — for example, the ALU may carry out a calculation and store the result in the Accumulator (ACC)."
        },
        {
          num: "Q6",
          marks: 4,
          type: "written",
          caseStudy: "",
          question: `<p>(a) Convert the denary number 173 into an 8-bit binary number. Show your working. [2]</p><p>(b) Convert your answer to part (a) into hexadecimal. [1]</p><p>(c) State one reason why Unicode is needed instead of ASCII to represent some text. [1]</p>`,
          hint: "For (a), work down through the place values 128, 64, 32, 16, 8, 4, 2, 1. For (b), split your 8-bit answer into two nibbles of 4 bits each.",
          starter: "(a) 173 in binary is… (b) In hexadecimal this is… (c) Unicode is needed because…",
          markPoints: {
            note: "Three groups: the binary conversion (up to 2), the hexadecimal conversion (up to 1), and the reason Unicode is needed (up to 1).",
            groups: [
              {
                label: "(a) Binary conversion", max: 2, points: [
                  { text: "Shows correct working, e.g. 173 = 128 + 32 + 8 + 4 + 1", marks: 1 },
                  { text: "Gives the correct 8-bit answer: 10101101", marks: 1 }
                ]
              },
              {
                label: "(b) Hexadecimal conversion", max: 1, points: [
                  { text: "Gives the correct hexadecimal value AD (from nibbles 1010 and 1101)", marks: 1 }
                ]
              },
              {
                label: "(c) Reason for Unicode", max: 1, points: [
                  { text: "Gives a valid reason, e.g. Unicode can represent far more characters/symbols than ASCII, including characters from many world languages and symbols such as emoji, which ASCII's limited character set cannot store", marks: 1 }
                ]
              }
            ]
          },
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 4 marks</h5>
<ul>
<li>(a) Award 1 mark for correct working (e.g. 173 = 128 + 32 + 8 + 4 + 1) and 1 mark for the correct answer 10101101</li>
<li>(b) Award 1 mark for AD (splitting 10101101 into nibbles 1010 and 1101)</li>
<li>(c) Award 1 mark for a valid reason, e.g. Unicode can represent characters from many more languages and symbols (such as emoji) than ASCII's limited 128-character set</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>In part (b), a hexadecimal answer that correctly follows from an incorrect part (a) binary answer can still gain the mark, provided the method used to split and convert the nibbles is correct.</li>
</ul>
</div>`,
          modelAnswer: "(a) 173 = 128 + 32 + 8 + 4 + 1, so 173 in 8-bit binary is 10101101. (b) Splitting 10101101 into nibbles gives 1010 (A) and 1101 (D), so the hexadecimal value is AD. (c) Unicode is needed because it can represent characters and symbols from many more languages, plus symbols like emoji, than ASCII's limited character set is able to store."
        },
        {
          num: "Q7",
          marks: 2,
          type: "written",
          caseStudy: "",
          question: `<p>Add the following two 8-bit binary numbers: <strong>01011010</strong> + <strong>00100111</strong>. Show your working and give your answer as an 8-bit binary number.</p>`,
          hint: "Add column by column from the right, carrying a 1 into the next column whenever a column totals 2 or more.",
          starter: "01011010 + 00100111 = …",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 2 marks</h5>
<ul>
<li>Award 1 mark for correct working/carries shown</li>
<li>Award 1 mark for the correct final answer: 10000001</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Accept the answer alone with no working shown for both marks, provided it is correct.</li>
</ul>
</div>`,
          modelAnswer: "01011010 (90) + 00100111 (39) = 10000001 (129)."
        },
        {
          num: "Q8",
          marks: 2,
          type: "written",
          caseStudy: "",
          question: `<p>The 8-bit binary number <strong>00001101</strong> represents the denary value 13. State the result, in binary, of performing a two-place left binary shift on this number, and give the resulting denary value.</p>`,
          hint: "Each place shifted left doubles the value — shifting left twice multiplies the original value by four.",
          starter: "After a 2-place left shift, the binary is… which is denary…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 2 marks</h5>
<ul>
<li>Award 1 mark for the correct binary result: 00110100</li>
<li>Award 1 mark for the correct denary value: 52</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Accept 52 reached by reasoning that a 2-place left shift multiplies the original value by four (13 × 4 = 52), rather than by re-converting from binary.</li>
</ul>
</div>`,
          modelAnswer: "A two-place left shift on 00001101 gives 00110100, which is 52 in denary — the same as multiplying 13 by four."
        },
        {
          num: "Q9",
          marks: 5,
          type: "written",
          caseStudy: `<p>A school is buying new laptops for its computing department, and is comparing several models with different clock speeds, numbers of cores, and cache sizes.</p>`,
          question: `<p>Explain how each of the following affects the performance of a CPU: clock speed, number of cores, and cache size. In your answer about cores, state one type of software that would particularly benefit from a higher core count.</p>`,
          hint: "For each factor, say what it actually is, then say how changing it affects how much work the CPU can get through.",
          starter: "Clock speed affects performance because… Having more cores means… Cache size affects performance because…",
          markPoints: {
            note: "Three groups: clock speed (up to 2), number of cores including a valid example (up to 2), and cache size (up to 1).",
            groups: [
              {
                label: "Clock speed", max: 2, points: [
                  { text: "A higher clock speed means more instruction cycles can be carried out per second", marks: 1 },
                  { text: "So more instructions can be fetched, decoded and executed in a given time, generally increasing performance", marks: 1 }
                ]
              },
              {
                label: "Number of cores", max: 2, points: [
                  { text: "More cores allow more instructions or threads to be processed at the same time", marks: 1 },
                  { text: "This particularly benefits software designed to use multiple cores, e.g. video editing software or software running many programs/tasks at once", marks: 1 }
                ]
              },
              {
                label: "Cache size", max: 1, points: [
                  { text: "A larger cache stores more frequently used data and instructions closer to the CPU, reducing the need to fetch them from slower RAM, which improves speed", marks: 1 }
                ]
              }
            ]
          },
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 5 marks</h5>
<ul>
<li>Clock speed: award 1 mark for more cycles/instructions processed per second, and 1 mark for linking this to overall performance</li>
<li>Cores: award 1 mark for more instructions/threads processed simultaneously, and 1 mark for a valid example of software that benefits, e.g. video editing or multitasking-heavy software</li>
<li>Cache: award 1 mark for storing frequently used data closer to the CPU, reducing trips to slower RAM</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Each of the three groups is marked independently — a strong answer on one factor cannot make up for a missing point on another.</li>
</ul>
</div>`,
          modelAnswer: "A higher clock speed means the CPU can carry out more instruction cycles every second, so it can fetch, decode and execute more instructions in a given amount of time, generally improving performance. Having more cores lets the CPU process more instructions or threads at the same time — this particularly benefits software designed to make use of multiple cores, such as video editing software. A larger cache stores frequently used data and instructions closer to the CPU, reducing how often it needs to fetch data from slower RAM, which also improves speed."
        },
        {
          num: "Q10",
          marks: 3,
          type: "written",
          format: "tickGrid",
          caseStudy: "",
          question: `<p>Tick (✓) <strong>one</strong> box in each row to identify which type of secondary storage the statement best describes.</p>`,
          grid: {
            cols: ["Optical", "Magnetic", "Solid-state"],
            rows: [
              { label: "Uses a laser to read and write data on a spinning disc", correct: [0] },
              { label: "Stores data using magnetised regions on a spinning metal disc", correct: [1] },
              { label: "Has no moving parts, making it more durable and generally faster to access data than the other two types", correct: [2] }
            ]
          },
          hint: "Match each description to its defining physical feature: a laser and a disc, a magnetised spinning disc, or no moving parts at all.",
          starter: "Row 1: … | Row 2: … | Row 3: …",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 3 marks (1 mark for each row)</h5>
<ul>
<li>Row 1 (laser reading a spinning disc) → <strong>Optical</strong></li>
<li>Row 2 (magnetised regions on a spinning disc) → <strong>Magnetic</strong></li>
<li>Row 3 (no moving parts, most durable/fastest access) → <strong>Solid-state</strong></li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark per row. Each row is marked independently; two ticks in the same row scores 0 for that row.</li>
</ul>
</div>`,
          modelAnswer: "Row 1: Optical. Row 2: Magnetic. Row 3: Solid-state."
        },
        {
          num: "Q11",
          marks: 6,
          type: "written",
          caseStudy: `<p>A graphic designer is preparing an image for a client's website.</p>`,
          question: `<p>(a) The image has a resolution of 300 × 200 pixels and a colour depth of 8 bits per pixel. Calculate the file size of the uncompressed image in kilobytes (KB). Show your working. Use the specification's ×1,000 convention. [3]</p><p>(b) Explain the effect on the image's file size, and on its quality, of increasing the colour depth to 24 bits per pixel. [2]</p><p>(c) State one difference between lossy and lossless compression. [1]</p>`,
          hint: "For (a): total pixels × bits per pixel gives total bits; divide by 8 for bytes, then by 1,000 for kilobytes.",
          starter: "(a) Total pixels = … Total bits = … File size = … (b) Increasing colour depth… (c) The difference is…",
          markPoints: {
            note: "Three groups: the file-size calculation (up to 3), the colour-depth explanation (up to 2), and the compression difference (up to 1).",
            groups: [
              {
                label: "(a) File-size calculation", max: 3, points: [
                  { text: "Calculates the total number of pixels: 300 × 200 = 60,000 pixels", marks: 1 },
                  { text: "Calculates the total number of bits and converts to bytes: 60,000 × 8 = 480,000 bits = 60,000 bytes", marks: 1 },
                  { text: "Gives the correct final answer: 60 KB", marks: 1 }
                ]
              },
              {
                label: "(b) Effect of colour depth", max: 2, points: [
                  { text: "States that increasing the colour depth increases the file size", marks: 1 },
                  { text: "Explains why: more bits are used to store the colour of each pixel, allowing more possible colours to be shown, improving image quality", marks: 1 }
                ]
              },
              {
                label: "(c) Lossy vs lossless", max: 1, points: [
                  { text: "States a genuine difference, e.g. lossy compression permanently removes some data/detail so the file cannot be restored exactly, whereas lossless compression only removes redundant data so the original can be restored exactly", marks: 1 }
                ]
              }
            ]
          },
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 6 marks</h5>
<ul>
<li>(a) Award 1 mark for 60,000 pixels, 1 mark for 480,000 bits / 60,000 bytes, 1 mark for 60 KB</li>
<li>(b) Award 1 mark for stating file size increases, 1 mark for explaining that more bits per pixel allow more possible colours/higher quality</li>
<li>(c) Award 1 mark for a valid difference, e.g. lossy compression loses some data permanently and cannot be fully restored, whereas lossless compression can be restored exactly</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>In part (a), accept a correct method carried through consistently even if an earlier step contains an arithmetic slip, provided the final working is shown.</li>
</ul>
</div>`,
          modelAnswer: "(a) 300 × 200 = 60,000 pixels. 60,000 × 8 = 480,000 bits = 60,000 bytes = 60 KB. (b) Increasing the colour depth to 24 bits per pixel increases the file size, because more bits are used to store the colour of each pixel — this allows far more possible colours to be represented, improving the image's quality. (c) Lossy compression permanently removes some data or detail, so the file cannot be restored exactly, whereas lossless compression only removes redundant data, so the original file can be restored exactly."
        },
        {
          num: "Q12",
          marks: 3,
          type: "written",
          caseStudy: `<p>A podcast producer records a short voice clip.</p>`,
          question: `<p>The clip is recorded using a sample rate of 44,100 Hz, a bit depth of 16 bits, in mono, lasting 2 seconds. Calculate the file size of the uncompressed recording in kilobits (kb). Show your working. Use the specification's ×1,000 convention.</p>`,
          hint: "Multiply sample rate × bit depth to get bits per second, then multiply by the duration in seconds, then convert to kilobits.",
          starter: "Bits per second = … Total bits = … File size in kilobits = …",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 3 marks</h5>
<ul>
<li>Award 1 mark for: 44,100 × 16 = 705,600 bits per second</li>
<li>Award 1 mark for: 705,600 × 2 = 1,411,200 bits</li>
<li>Award 1 mark for: 1,411,200 ÷ 1,000 = 1,411.2 kilobits</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Accept 1,411.2 kb or a value expressed as approximately 1.4 megabits, provided the working shown is correct.</li>
</ul>
</div>`,
          modelAnswer: "44,100 × 16 = 705,600 bits per second. 705,600 × 2 = 1,411,200 bits. 1,411,200 ÷ 1,000 = 1,411.2 kilobits."
        },
        {
          num: "Q13",
          marks: 1,
          type: "mcq",
          caseStudy: "",
          question: `<p>Tick <strong>one</strong> box to identify a situation where lossy compression would be an appropriate choice.</p>`,
          options: [
            "Compressing a legal contract that a court requires to remain exactly, byte-for-byte identical after decompression, with absolutely no loss of any data whatsoever",
            "Compressing a company's exact financial accounts spreadsheet",
            "Archiving an album's original master recording for permanent storage",
            "Streaming music to a phone app, where a small drop in audio quality is acceptable for a smaller file"
          ],
          answer: 3,
          hint: "Lossy compression is appropriate when a small, unnoticeable loss of quality is an acceptable trade-off for a smaller file — not when every bit of the original data must be kept.",
          starter: "",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 1 mark</h5>
<ul>
<li>Streaming music to a phone app, where a small drop in audio quality is acceptable for a smaller file</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Award 1 mark for the correct option only. Two or more ticks scores 0.</li>
</ul>
</div>`,
          modelAnswer: "Streaming music to a phone app, where a small drop in audio quality is acceptable for a smaller file."
        },
        {
          num: "Q14",
          marks: 4,
          type: "written",
          format: "matchLine",
          caseStudy: "",
          question: `<p>Draw <strong>one</strong> line from each piece of network hardware or software to the job it actually performs.</p><p>(There are more job descriptions than hardware items — one description is not used.)</p>`,
          match: {
            left: ["Switch", "Router", "DNS server", "Wireless Access Point (WAP)"],
            right: [
              "Connects one network to a different network, for example connecting a home network to the internet",
              "Connects wired devices within a single LAN and forwards data to the correct device using its MAC address",
              "Allows devices to connect to a network without cables, using radio signals",
              "Translates a human-readable domain name into the matching IP address",
              "Stores shared files and resources centrally for other devices on a network to access"
            ],
            answer: { "0": 1, "1": 0, "2": 3, "3": 2 },
            decoys: [4]
          },
          hint: "Match each item to what it actually DOES — one job description (storing shared files) does not belong to any of these four items.",
          starter: "Switch → …, Router → …, DNS server → …, WAP → …",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 4 marks (1 mark per correct line)</h5>
<ul>
<li>Switch → connects wired devices within a single LAN, forwarding data using MAC addresses</li>
<li>Router → connects one network to a different network, such as the internet</li>
<li>DNS server → translates a domain name into the matching IP address</li>
<li>Wireless Access Point (WAP) → allows devices to connect to a network without cables, using radio signals</li>
<li>The unused description ("stores shared files and resources centrally") is a decoy describing a file server, not any of these four items.</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Each line is marked independently. Two lines drawn from one hardware item scores 0 for that item.</li>
</ul>
</div>`,
          modelAnswer: "Switch: connects wired devices within a single LAN using MAC addresses. Router: connects one network to a different network. DNS server: translates a domain name into an IP address. WAP: allows devices to connect wirelessly using radio signals."
        },
        {
          num: "Q15",
          marks: 6,
          type: "written",
          caseStudy: `<p>A small design studio is setting up a new office LAN and is choosing between a star topology and a full mesh topology.</p>`,
          question: `<p>(a) Describe one advantage and one disadvantage of using a star topology compared to a full mesh topology. [2]</p><p>(b) Describe one advantage and one disadvantage of using a full mesh topology compared to a star topology. [2]</p><p>(c) State two factors, other than the topology chosen, that could affect the performance of the studio's network. [2]</p>`,
          hint: "For (a) and (b), think about what happens if the central device fails, and how many cables each layout actually needs. For (c), think about what is being shared between users and how the network is being used.",
          starter: "(a) A star topology's advantage is… its disadvantage is… (b) A mesh topology's advantage is… its disadvantage is… (c) Two performance factors are…",
          markPoints: {
            note: "Three groups: star topology (up to 2), mesh topology (up to 2), and other performance factors (up to 2).",
            groups: [
              {
                label: "(a) Star topology", max: 2, points: [
                  { text: "Advantage: cheaper/simpler to install and expand, as each device only needs one cable to the central switch, or a single cable/device failure only affects that one device", marks: 1 },
                  { text: "Disadvantage: if the central switch/hub fails, the whole network goes down", marks: 1 }
                ]
              },
              {
                label: "(b) Mesh topology", max: 2, points: [
                  { text: "Advantage: more reliable/resilient, as data can be re-routed if one cable or device fails, so there is no single point of failure", marks: 1 },
                  { text: "Disadvantage: expensive/complex to install and expand, since every device needs a direct cable to every other device", marks: 1 }
                ]
              },
              {
                label: "(c) Other performance factors", max: 2, points: [
                  { text: "Any two of: the number of devices/users connected at once; the available bandwidth; whether connections are wired or wireless; interference affecting wireless signals; the error rate on the network; the network hardware being used", marks: 1 }
                ]
              }
            ]
          },
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 6 marks</h5>
<ul>
<li>(a) Star advantage: cheaper/simpler to install and expand, or a single device/cable failure only affects that device. Star disadvantage: the whole network fails if the central switch fails</li>
<li>(b) Mesh advantage: no single point of failure, data can be re-routed. Mesh disadvantage: expensive/complex to install and expand as it needs far more cabling</li>
<li>(c) Award 1 mark each for any two of: number of devices/users; available bandwidth; wired or wireless connections; interference; error rate; the network hardware in use</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Each group is marked independently. A star point cannot be credited against the mesh group, or vice versa.</li>
</ul>
</div>`,
          modelAnswer: "(a) A star topology is cheaper and simpler to install and expand, since each device only needs one cable to the central switch; its disadvantage is that if the central switch fails, the whole network goes down. (b) A mesh topology is more resilient, since data can be re-routed if one cable or device fails, meaning there is no single point of failure; its disadvantage is that it is expensive and complex to install, since every device needs a direct cable to every other device. (c) Two other performance factors are the number of devices actively using the network at once, and the available bandwidth of the connection."
        },
        {
          num: "Q16",
          marks: 5,
          type: "written",
          caseStudy: `<p>A retail company's network has recently been the target of several different security threats.</p>`,
          question: `<p>Explain how each of the following threats could compromise the company's network security: (a) phishing [2] (b) a brute-force attack [2] (c) SQL injection [1]</p>`,
          hint: "For each threat, say what the attacker actually does, and what they are trying to achieve by doing it.",
          starter: "(a) Phishing works by… (b) A brute-force attack works by… (c) SQL injection works by…",
          markPoints: {
            note: "Three groups: phishing (up to 2), brute-force attack (up to 2), SQL injection (up to 1).",
            groups: [
              {
                label: "(a) Phishing", max: 2, points: [
                  { text: "The attacker sends fraudulent emails or messages that appear to be from a trusted source", marks: 1 },
                  { text: "This tricks a user into revealing personal or login data, or clicking a malicious link/attachment", marks: 1 }
                ]
              },
              {
                label: "(b) Brute-force attack", max: 2, points: [
                  { text: "The attacker uses automated software to try large numbers of different password combinations", marks: 1 },
                  { text: "This continues until the correct password is found, giving the attacker unauthorised access to an account", marks: 1 }
                ]
              },
              {
                label: "(c) SQL injection", max: 1, points: [
                  { text: "The attacker enters malicious SQL code into an input field, such as a login form, to access, change or delete data held in the company's database", marks: 1 }
                ]
              }
            ]
          },
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 5 marks</h5>
<ul>
<li>(a) Award 1 mark for fraudulent messages impersonating a trusted source, 1 mark for tricking the user into revealing data or clicking a malicious link</li>
<li>(b) Award 1 mark for automated software trying many password combinations, 1 mark for gaining unauthorised access once the correct password is found</li>
<li>(c) Award 1 mark for entering malicious SQL code into an input field to access/change/delete database data</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Each group is marked independently against its own threat.</li>
</ul>
</div>`,
          modelAnswer: "(a) Phishing works by sending fraudulent emails or messages that appear to come from a trusted source, tricking the victim into revealing login or personal details, or clicking a malicious link. (b) A brute-force attack uses automated software to try huge numbers of password combinations until the correct one is found, giving the attacker unauthorised access to an account. (c) SQL injection involves entering malicious SQL code into an input field, such as a login form, so the database runs the attacker's command instead of the data it expected."
        },
        {
          num: "Q17",
          marks: 5,
          type: "written",
          format: "bankCloze",
          caseStudy: "",
          question: `<p>Complete the passage below about keeping a network secure using words from the word bank. Not all words will be used, and each word may be used once, more than once, or not at all.</p>`,
          cloze: `<p>A ___1___ can be placed between a trusted internal network and an untrusted external network, such as the internet, to monitor and filter incoming and outgoing traffic. Before a new system goes live, a company may hire ethical hackers to carry out ___2___, deliberately trying to find weaknesses so they can be fixed. Sensitive data can be protected, even if it is intercepted, by using ___3___ to scramble it into an unreadable form. Giving each employee only the access they need to do their job is an example of using ___4___. Physical security measures, such as ID badges and locked server rooms, help to prevent ___5___ to hardware.</p>`,
          bank: ["firewall", "penetration testing", "encryption", "user access levels", "unauthorised physical access", "anti-malware software", "a password policy", "biometrics"],
          answers: {
            "1": ["firewall"],
            "2": ["penetration testing"],
            "3": ["encryption"],
            "4": ["user access levels"],
            "5": ["unauthorised physical access"]
          },
          hint: "Read each whole sentence before choosing — three of the bank words are deliberate decoys.",
          starter: "(1) … (2) … (3) … (4) … (5) …",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 5 marks (1 mark for each completed term)</h5>
<p>A <strong>firewall</strong> can be placed between a trusted internal network and an untrusted external network to monitor and filter traffic. A company may hire ethical hackers to carry out <strong>penetration testing</strong>. Sensitive data can be protected using <strong>encryption</strong> to scramble it. Giving each employee only the access they need is an example of using <strong>user access levels</strong>. Physical security measures help to prevent <strong>unauthorised physical access</strong> to hardware.</p>
</div>`,
          modelAnswer: "(1) firewall (2) penetration testing (3) encryption (4) user access levels (5) unauthorised physical access"
        },
        {
          num: "Q18",
          marks: 5,
          type: "written",
          caseStudy: "",
          question: `<p>Describe three different functions of an operating system, other than providing a user interface. For two of the functions you name, include a brief example of what the operating system actually does.</p>`,
          hint: "Name three genuinely different functions first, then add a short example for two of them.",
          starter: "One function is memory management, which… A second function is… A third function is…",
          markPoints: {
            note: "Two groups: memory management with an example (up to 2), peripheral management/drivers with an example (up to 2), plus 1 further mark for naming any one additional valid function.",
            groups: [
              {
                label: "Memory management", max: 2, points: [
                  { text: "States that the operating system allocates/manages RAM space for running programs and processes", marks: 1 },
                  { text: "Gives a valid example, e.g. moves data into virtual memory (using disk space) when RAM is full", marks: 1 }
                ]
              },
              {
                label: "Peripheral management / drivers", max: 2, points: [
                  { text: "States that the operating system manages communication between the computer and peripheral devices, such as a printer or mouse", marks: 1 },
                  { text: "Gives a valid example, e.g. uses device drivers that translate general OS commands into a form a specific device understands", marks: 1 }
                ]
              },
              {
                label: "A third function", max: 1, points: [
                  { text: "Names any one further valid function, e.g. multitasking (switching the processor between programs so they appear to run at once), user management (accounts and access rights), or file management (organising files into folders)", marks: 1 }
                ]
              }
            ]
          },
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 5 marks</h5>
<ul>
<li>Memory management: award 1 mark for allocating/managing RAM, 1 mark for a valid example such as using virtual memory when RAM is full</li>
<li>Peripheral management: award 1 mark for managing communication with devices, 1 mark for a valid example such as using device drivers</li>
<li>A third function: award 1 mark for naming any further valid function, e.g. multitasking, user management, or file management</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>The three functions named must be genuinely different from each other and from providing a user interface.</li>
</ul>
</div>`,
          modelAnswer: "Memory management allocates and manages the RAM space needed for running programs, for example moving data into virtual memory on the disk when RAM becomes full. Peripheral management controls communication between the computer and connected devices, using device drivers to translate general operating system commands into a form a specific device such as a printer understands. A third function is multitasking, which rapidly switches the processor between different programs so they appear to run at the same time."
        },
        {
          num: "Q19",
          marks: 5,
          type: "written",
          caseStudy: `<p>A user notices that their laptop has become slow, and that files are taking up more storage space than expected.</p>`,
          question: `<p>Explain how each of the following types of utility software could help: (a) disk defragmentation software [2] (b) file compression software [2] (c) backup software [1]</p>`,
          hint: "For each type of utility software, say what it actually does, then say how that fixes the specific problem described.",
          starter: "(a) Disk defragmentation software would help by… (b) File compression software would help by… (c) Backup software would help by…",
          markPoints: {
            note: "Three groups: defragmentation (up to 2), file compression (up to 2), backup (up to 1).",
            groups: [
              {
                label: "(a) Disk defragmentation", max: 2, points: [
                  { text: "Reorganises fragmented files so the parts of each file are stored together (contiguously) on the disk", marks: 1 },
                  { text: "This reduces the movement needed for the read/write head to access files, improving speed", marks: 1 }
                ]
              },
              {
                label: "(b) File compression", max: 2, points: [
                  { text: "Reduces the size of files, for example by removing redundant data", marks: 1 },
                  { text: "This frees up storage space and/or makes files quicker to transfer", marks: 1 }
                ]
              },
              {
                label: "(c) Backup software", max: 1, points: [
                  { text: "Makes a copy of files/data so they can be restored if the original is lost, corrupted, or the storage device fails", marks: 1 }
                ]
              }
            ]
          },
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 5 marks</h5>
<ul>
<li>(a) Award 1 mark for reorganising fragmented files so their parts are stored together, 1 mark for linking this to faster file access</li>
<li>(b) Award 1 mark for reducing file size, 1 mark for linking this to freeing storage space or faster transfer</li>
<li>(c) Award 1 mark for making a copy of data so it can be restored if lost or corrupted</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Answers must link each type of utility software back to the laptop's actual problems (slow performance, files using too much space) to gain the second mark in (a) and (b).</li>
</ul>
</div>`,
          modelAnswer: "(a) Disk defragmentation software reorganises fragmented files so that all the parts of each file are stored together on the disk, reducing how far the read/write head has to move to access them, which speeds the laptop up. (b) File compression software reduces the size of files, for example by removing redundant data, freeing up storage space and making files quicker to transfer. (c) Backup software makes a copy of the user's files, so they can be restored if the original is lost, corrupted, or the storage device fails."
        },
        {
          num: "Q20",
          marks: 6,
          type: "written",
          caseStudy: `<p>A local retailer is reviewing how UK legislation affects the way it uses computer systems.</p>`,
          question: `<p>For each piece of legislation, describe one way it affects how the retailer must use its computer systems: (a) Data Protection Act 2018 [2] (b) Computer Misuse Act 1990 [2] (c) Copyright, Designs and Patents Act 1988 [2]</p>`,
          hint: "For each Act, name what it actually controls, and give a specific effect that would change how the retailer runs its systems.",
          starter: "(a) The Data Protection Act 2018 means the retailer must… (b) The Computer Misuse Act 1990 means… (c) The Copyright, Designs and Patents Act 1988 means…",
          markPoints: {
            note: "Three groups, one per Act, each worth up to 2 marks.",
            groups: [
              {
                label: "(a) Data Protection Act 2018", max: 2, points: [
                  { text: "The retailer must keep customers' personal data accurate, secure and up to date, and only use it for the purpose it was collected for", marks: 1 },
                  { text: "Customers have the right to see the data the retailer holds about them and request it be corrected or deleted", marks: 1 }
                ]
              },
              {
                label: "(b) Computer Misuse Act 1990", max: 2, points: [
                  { text: "It is a criminal offence to access a computer system or data without authorisation", marks: 1 },
                  { text: "It is also an offence to modify data or software without authorisation, for example by spreading malware", marks: 1 }
                ]
              },
              {
                label: "(c) Copyright, Designs and Patents Act 1988", max: 2, points: [
                  { text: "It is illegal to copy or distribute someone else's work, such as software or images, without the owner's permission", marks: 1 },
                  { text: "It protects the creator's right to be credited for their work and to control how it is used or sold", marks: 1 }
                ]
              }
            ]
          },
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 6 marks</h5>
<ul>
<li>(a) Award 1 mark for keeping personal data accurate/secure and used only for its intended purpose, 1 mark for customers' right to see/correct/delete their data</li>
<li>(b) Award 1 mark for making unauthorised access to a system/data a criminal offence, 1 mark for making unauthorised modification of data/software an offence</li>
<li>(c) Award 1 mark for making it illegal to copy/distribute someone else's work without permission, 1 mark for protecting the creator's right to be credited/control their work</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given</h5>
<ul>
<li>Each Act is marked independently, up to 2 marks each.</li>
</ul>
</div>`,
          modelAnswer: "(a) The Data Protection Act 2018 means the retailer must keep customers' personal data accurate, secure and up to date, and only use it for the purpose it was originally collected for; customers also have the right to see the data held about them and request it be corrected or deleted. (b) The Computer Misuse Act 1990 makes it a criminal offence for anyone to access the retailer's computer systems or data without authorisation, and also makes it an offence to modify data or software without authorisation, for example by spreading malware. (c) The Copyright, Designs and Patents Act 1988 means the retailer cannot copy or distribute someone else's work, such as software or images, without the owner's permission, and protects the right of creators to be credited for and control how their own work is used."
        },
        {
          num: "Q21",
          marks: 8,
          type: "written",
          format: "banded",
          caseStudy: `<p>A local council is planning to replace all of its paper-based library records with a new computer system that will store and process residents' personal data. The council is also deciding whether to build the system using proprietary software or open-source software.</p>`,
          question: `<p>Discuss the ethical, legal and environmental impacts of the council's change to a computer system, and the impacts of its choice between proprietary and open-source software.</p><p>In your answer you might consider:</p><ul><li>how residents' privacy and personal data could be affected</li><li>the council's legal responsibilities when storing and processing personal data</li><li>the environmental impact of replacing paper records with a computer system</li><li>the impacts of choosing proprietary software compared with open-source software</li><li>an overall recommendation, with reasons</li></ul>`,
          hint: "Use all five bullet points as your plan. Explain each impact clearly, link it to the council's library records specifically, and weigh the different considerations against each other before giving your recommendation.",
          starter: "Moving to a computer system could affect residents' privacy because…",
          markScheme: `<div class="marks-section">
<h5>Mark Scheme — 8 marks (levelled) — indicative content</h5>
<p>The following is indicative of possible points candidates may refer to, but is not prescriptive or exhaustive:</p>
<ul>
<li><strong>Ethical impacts</strong> — residents may be concerned about who can access their personal library records and how that data might be used; there is a risk of data being used for purposes beyond what it was originally collected for.</li>
<li><strong>Legal impacts</strong> — the council must comply with the Data Protection Act 2018 when storing and processing residents' personal data, and is legally responsible for keeping that data secure and accurate.</li>
<li><strong>Environmental impacts</strong> — replacing paper records reduces paper use and printing, which could lower the council's environmental footprint, but the new computer system itself uses electricity and hardware that has its own environmental cost, including manufacture, ongoing energy use, and eventual e-waste.</li>
<li><strong>Proprietary vs open-source software</strong> — proprietary software usually comes with dedicated support and training and is commercially tested, but the council must pay licence fees and cannot view or modify the source code; open-source software is usually free to use and modify, and its source code can be checked or improved by the community, but it may have less official support and could require more in-house technical expertise to maintain securely.</li>
<li><strong>Recommendation</strong> — a strong answer weighs the convenience, cost and support of each option against the privacy, security and environmental considerations, and reaches a clear, reasoned view for this specific council library scenario.</li>
</ul>
</div>
<div class="marks-section">
<h5>How the marks are given — levels of response</h5>
<ul>
<li><strong>Mark Band 3 — High Level (7–8 marks):</strong> A thorough, well-balanced discussion covering multiple impact areas — ethical, legal, environmental, and open-source versus proprietary — with clear, developed reasoning and relevant examples linked directly to the council's library records scenario. Different viewpoints are weighed against each other, and the answer reaches a justified conclusion.</li>
<li><strong>Mark Band 2 — Mid Level (4–6 marks):</strong> A reasonable discussion covering more than one impact area, with some development and occasional links to the scenario, but points may be less balanced or not fully explained. Little or no attempt to weigh viewpoints against each other or reach a conclusion.</li>
<li><strong>Mark Band 1 — Low Level (1–3 marks):</strong> One or more relevant impacts are identified but with little or no development, explanation, or link to the scenario. The discussion may be little more than a simple list of points.</li>
<li><strong>0 marks:</strong> No relevant response, or a response that does not relate to the question.</li>
</ul>
</div>`,
          modelAnswer: "Moving to a computer system could affect residents' privacy, since their personal library records would now be stored digitally, raising ethical concerns about who can access that data and whether it might ever be used for a purpose beyond simply managing library loans. Legally, the council must comply with the Data Protection Act 2018, keeping residents' data accurate, secure, and used only for its intended purpose, or it risks breaking the law.\n\nEnvironmentally, replacing paper records reduces the council's paper use and printing, which is a genuine benefit, but the new system itself has its own environmental cost — the hardware must be manufactured, it uses electricity continuously, and it will eventually become e-waste.\n\nThe council's choice of software also matters. Proprietary software usually comes with dedicated support and has been commercially tested, but requires ongoing licence fees and gives the council no ability to view or modify the source code. Open-source software is usually free and can be checked or improved by the wider community, but the council may need more in-house technical expertise to keep it secure without official support.\n\nOn balance, I would recommend the council use proprietary software with strong data protection safeguards built in, since reliable support matters more than cost savings when residents' personal data is involved, even though this means paying ongoing licence fees rather than benefiting from open-source software's lower cost and greater transparency."
        }
      ]
    }
  ]
};
