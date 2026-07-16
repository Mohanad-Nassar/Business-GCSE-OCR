// ══════════════════════════════════════════════════════════════
// QUESTION BANK — GENERATED FILE, DO NOT EDIT BY HAND
// Built by tools/build_question_bank.py from the question arrays
// embedded in every topic page. Regenerate after editing questions:
//     python tools/build_question_bank.py
// Generated: 2026-07-16T17:18:45Z · 72 questions
// ══════════════════════════════════════════════════════════════
window.QUESTION_BANK = [
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:f89385c7",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q1",
  "question": "<p>A computer's CPU contains registers.</p><p>Complete the table by identifying <strong>two</strong> registers and state the purpose of each register.</p><table><tr><th>Register</th><th>Purpose</th></tr><tr><td>(1)</td><td>(2)</td></tr><tr><td>(3)</td><td>(4)</td></tr></table>",
  "hint": "Pick the two registers whose purposes you can state most precisely. Start each purpose with 'Stores...' — never 'fetches' or 'takes' — and be exact about whether it stores an ADDRESS or DATA.",
  "starter": "Register 1: … — Purpose: Stores… | Register 2: … — Purpose: Stores…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark per register with its purpose)</h5>\n<ul>\n<li><strong>Program counter // PC</strong> — stores the address of the current/next instruction to be fetched // stores the address of the instruction for the current/next FE cycle</li>\n<li><strong>Memory address register // MAR</strong> — stores the address of the current/next/required instruction/data // stores the address of data/instruction about to be fetched/executed // stores the address where data/instruction is going to be stored</li>\n<li><strong>Memory data register // MDR</strong> — stores the data/instruction fetched from memory // stores data/instruction to be stored in memory // stores the data/instruction located in the memory location in the MAR</li>\n<li><strong>Accumulator // ACC</strong> — stores the result of calculations // stores data currently being processed // stores the result from the ALU</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Careful that the purpose is not an action such as fetches, takes, retrieves.</li>\n<li>Accept \"points\" to/at in place of stores.</li>\n<li>Accept: Current instruction register // CIR // Instruction register // IR — stores the instruction currently being executed.</li>\n<li>BOD memory buffer register for MDR. Accept memory address, memory data without 'register'.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Many candidates were able to identify registers that are in the CPU, most commonly the MAR and MDR. Some candidates inaccurately identified other components of the CPU such as the ALU and CU.</p>\n<p>Candidates were often able to gain the mark for a description of the MDR. Some candidates inaccurately identified the MAR or the PC as storing data instead of the address of the data. Candidates who gave the accumulator sometimes gave a response that it stored the calculations instead of the result of the calculations.</p>\n</div>",
   "modelAnswer": "Register 1: Program counter (PC) — Purpose: stores the address of the next instruction to be fetched from memory.\n\nRegister 2: MDR (Memory Data Register) — Purpose: stores the data or instruction that has been fetched from memory."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:a408379b",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q2a",
  "question": "<p>A computer has a Central Processing Unit (CPU).</p><p>Describe what happens during the fetch-execute cycle.</p>",
  "hint": "Two clear stages are enough for two marks — where instructions come FROM, and what happens to them. Use 'data/instructions', not 'information' or 'programs'.",
  "starter": "Data and instructions are fetched from…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark each, to max 2)</h5>\n<ul>\n<li>Data/instructions are fetched from memory/RAM/primary storage</li>\n<li>Data/instructions are stored using the registers // correct example of a register storing address/data</li>\n<li>Data/instructions are decoded // data/instructions are split into opcode and operand</li>\n<li>Data/instructions are executed/processed</li>\n<li>ALU performs the logical/arithmetic calculations</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>MP4 BOD \"carried out\" etc. for executed.</li>\n<li>Ignore inaccurate references to registers and components (other than MP2 correct example of a register).</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Candidates often correctly identified that data is fetched from memory, or from RAM, and are then processed. Some candidates gave a more technical description including the role of the registers in this process. The stronger responses included clear references to data or instructions being processed. Some candidates inaccurately identified that information was processed, or that programs were fetched from memory.</p>\n</div>",
   "modelAnswer": "Instructions are fetched from main memory (RAM) into the CPU.\n\nThey are then decoded and executed, and the cycle repeats for the next instruction."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:03d63150",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q2b",
  "question": "<p>Complete the table by writing the name of <strong>two</strong> registers used in the fetch-execute cycle and the purpose of each register.</p><table><tr><th>Register</th><th>Purpose</th></tr><tr><td>(1)</td><td>(2)</td></tr><tr><td>(3)</td><td>(4)</td></tr></table>",
  "hint": "1 mark per register name, 1 per matching purpose. PC and MAR store ADDRESSES; MDR stores the DATA/INSTRUCTION; the accumulator stores RESULTS.",
  "starter": "Register 1: … — Purpose: Stores… | Register 2: … — Purpose: Stores…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 for naming each register, 1 for each matching purpose)</h5>\n<ul>\n<li><strong>Program counter // PC</strong> — stores the address of the current/next instruction to be fetched // stores the address of the instruction for the current/next FE cycle</li>\n<li><strong>Memory address register // MAR</strong> — stores the address of the current/next instruction/data to be fetched // stores the address where data/instruction is to be stored</li>\n<li><strong>Memory data register // MDR</strong> — stores the data/instruction fetched from memory // stores data/instruction to be stored in memory // stores the data/instruction located in the memory location in the MAR</li>\n<li><strong>Accumulator // ACC</strong> — stores the result of calculations // stores data currently being processed // stores the result from the ALU</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Careful that the purpose is not an action such as fetches, takes, retrieves. Read full purpose and award a correct point.</li>\n<li>Accept Current instruction register // CIR // Instruction register // IR — stores the instruction currently being executed. BOD memory buffer register for MDR.</li>\n<li>If there is no register but the register is given in the purpose column, award the purpose if accurate. If the answer in the register column is incorrect, do not mark purpose.</li>\n<li>For PC and MAR, accept 'pointer' for storing address. Accept memory address, memory data.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Candidates were often able to identify one or two registers that are used in the F-E cycle. Fewer candidates were able to give a purpose in the F-E cycle. Some candidates identified that the registers were involved in the fetching or transmission of data, for example that the MAR transmits the address to RAM.</p>\n<p><strong>Misconception:</strong> a common misconception is that the program counter keeps track of how many programs have run or counts the instructions that are being processed.</p>\n</div>",
   "modelAnswer": "Register 1: Program counter (PC) — Purpose: stores the address of the next instruction to be fetched from memory.\n\nRegister 2: MAR (Memory Address Register) — Purpose: stores the address of the data or instruction that is to be fetched from memory."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:ed762212",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q3",
  "question": "<p>Complete the table by writing the missing definition or name of each of the common CPU components and registers.</p><table><tr><th>CPU component or register</th><th>Definition</th></tr><tr><td><strong>(A)</strong></td><td>Stores the address of the next instruction to be fetched from memory. Increments during each fetch-execute cycle.</td></tr><tr><td>CU (Control Unit)</td><td><strong>(B)</strong></td></tr><tr><td><strong>(C)</strong></td><td>Stores the address of the data to be fetched from or the address where the data is to be stored.</td></tr><tr><td><strong>(D)</strong></td><td>Performs mathematical calculations and logical operations.</td></tr></table>",
  "hint": "Read all four rows before answering — 'next instruction' + 'increments' is one specific register, and 'address of the data' is a different one. For the CU, say what its signals achieve, not just that it sends them.",
  "starter": "A: … | B: The CU… | C: … | D: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark for each term or definition)</h5>\n<ul>\n<li><strong>A: Program Counter // PC</strong></li>\n<li><strong>B (CU definition):</strong> (sends signals to) synchronise / control / coordinate the processor/hardware/F-E cycle/processes/flow of data // decodes instructions (in CIR) // runs F-E cycle</li>\n<li><strong>C: Memory Address Register // MAR</strong></li>\n<li><strong>D: Arithmetic Logic Unit // ALU</strong></li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Read whole answer for CU and award correct point at any stage.</li>\n<li>CU 'sends signals to components' is not enough — it isn't saying what the signal's purpose is.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question required candidates to consider the definitions and identify the component or register that was being defined, as well as giving a definition for the CU. The ALU was often correctly identified. Common errors included giving MAR for the first definition in place of the PC and then following on with the MDR for the third row because the MAR had already been given by the candidate.</p>\n<p>Many candidates demonstrated a good understanding of the CU, most commonly identifying that it controls the flow of data, that it controls the FDE cycle or that it decodes instructions.</p>\n<p><strong>Misconception:</strong> a common error was stating that the Control Unit actually performs the FDE cycle, or that it executes the instructions.</p>\n</div>",
   "modelAnswer": "A: Program counter (PC)\n\nB: Decodes instructions and sends signals to coordinate the flow of data through the processor during the fetch-execute cycle.\n\nC: MAR (Memory Address Register)\n\nD: ALU (Arithmetic Logic Unit)"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:217c3159",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q4a",
  "question": "<p>Von Neumann architecture includes registers.</p><p>Identify <strong>two</strong> registers used in Von Neumann architecture.</p>",
  "caseStudy": "<p><strong>Context</strong></p><p>A computer system has a 2.5 GHz processor and 5 GB of RAM.</p>",
  "hint": "Names only — no purposes needed here. There are four to choose from; write the two you're surest of, one per line.",
  "starter": "1: … | 2: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark each)</h5>\n<ul>\n<li>PC</li>\n<li>MAR</li>\n<li>MDR</li>\n<li>Accumulator</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept other correct registers (e.g. CIR, IR).</li>\n<li>Read first answer on each line.</li>\n</ul>\n</div>",
   "modelAnswer": "1: Program counter (PC)\n\n2: Memory address register (MAR)"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:61ecd6a4",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 1,
  "num": "Q4b(i)",
  "question": "<p>State the purpose of a CPU.</p>",
  "caseStudy": "<p><strong>Context</strong></p><p>A computer system has a 2.5 GHz processor and 5 GB of RAM.</p>",
  "hint": "One precise sentence — what does the CPU do with instructions?",
  "starter": "The CPU…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li>CPU performs the FDE cycle</li>\n<li>Process instructions</li>\n</ul>\n</div>",
   "modelAnswer": "The CPU processes instructions by carrying out the fetch-decode-execute cycle."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:248077de",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q4b(ii)",
  "question": "<p>State what is meant by a <strong>single core 2.5 GHz</strong> processor.</p>",
  "caseStudy": "<p><strong>Context</strong></p><p>A computer system has a 2.5 GHz processor and 5 GB of RAM.</p>",
  "hint": "Two definitions for two marks: one for 'single core', one for what 2.5 GHz means in cycles per second.",
  "starter": "Single core means… 2.5 GHz means…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark per bullet to max 2)</h5>\n<ul>\n<li>Single core means there is only one processor</li>\n<li>2.5 GHz means it can run 2.5 billion FDE cycles per second</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>MP1 BOD single processor.</li>\n<li>Allow instructions for MP2.</li>\n</ul>\n</div>",
   "modelAnswer": "Single core means the CPU has only one processing unit (core).\n\n2.5 GHz means it can carry out 2.5 billion fetch-execute cycles every second."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:1e7459f6",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q5",
  "question": "<p>Draw <strong>one</strong> line from each part of the processor to its correct definition.</p><p><strong>Part of the processor:</strong></p><ul><li>Control Unit (CU)</li><li>Cache</li><li>Arithmetic Logic Unit (ALU)</li><li>Register</li></ul><p><strong>Definitions:</strong></p><ul><li><strong>A</strong> — Performs mathematical operations</li><li><strong>B</strong> — Sends signals to direct the operations</li><li><strong>C</strong> — Keeps the clock in sync</li><li><strong>D</strong> — A small piece of memory inside the processor that can hold one instruction or address</li><li><strong>E</strong> — High speed memory inside the processor that stores recently used instructions</li></ul><p>(There are more definitions than parts — one definition is not used.)</p>",
  "hint": "One line from each part, exactly. There are five definitions for four parts, so one is a decoy — watch for the plausible-sounding one about the clock.",
  "starter": "CU → …, Cache → …, ALU → …, Register → …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark per correct line from component to definition)</h5>\n<ul>\n<li>Control Unit (CU) → <strong>B</strong> (sends signals to direct the operations)</li>\n<li>Cache → <strong>E</strong> (high speed memory inside the processor that stores recently used instructions)</li>\n<li>Arithmetic Logic Unit (ALU) → <strong>A</strong> (performs mathematical operations)</li>\n<li>Register → <strong>D</strong> (a small piece of memory inside the processor that can hold one instruction or address)</li>\n<li>C (\"keeps the clock in sync\") is the unused decoy.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Any 2 lines from 1 component = 0 marks for that component.</li>\n</ul>\n</div>",
   "modelAnswer": "CU → B, Cache → E, ALU → A, Register → D"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:d1fc0c8e",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q6a(i)",
  "question": "<p>The table has five components of a computer, and four statements.</p><p>Tick (✓) <strong>one or more</strong> boxes in each row to identify which component(s) each statement describes.</p><table><tr><th>Statement</th><th>MAR</th><th>MDR</th><th>Cache</th><th>Program Counter</th><th>RAM</th></tr><tr><td>It stores a single address</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>It stores frequently used instructions</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>It is a register</td><td></td><td></td><td></td><td></td><td></td></tr><tr><td>It stores all currently running data and instructions</td><td></td><td></td><td></td><td></td><td></td></tr></table>",
  "hint": "Some rows need more than one tick — but any EXTRA tick voids the whole row. 'A single address' fits exactly two of these; 'a register' fits exactly three.",
  "starter": "Row 1: … | Row 2: … | Row 3: … | Row 4: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark for correct ticks and gaps on each row)</h5>\n<ul>\n<li><strong>It stores a single address:</strong> MAR ✓, Program Counter ✓</li>\n<li><strong>It stores frequently used instructions:</strong> Cache ✓</li>\n<li><strong>It is a register:</strong> MAR ✓, MDR ✓, Program Counter ✓</li>\n<li><strong>It stores all currently running data and instructions:</strong> RAM ✓</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>If extra ticks on each row, 0 marks for that row.</li>\n</ul>\n</div>",
   "modelAnswer": "Row 1 (single address): MAR and Program Counter.\nRow 2 (frequently used instructions): Cache.\nRow 3 (is a register): MAR, MDR and Program Counter.\nRow 4 (all currently running data and instructions): RAM."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:b3ea8f11",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q6a(ii)",
  "question": "<p>Identify the name of <strong>one</strong> register not given in part (i) and describe its purpose.</p>",
  "hint": "Part (i) used MAR, MDR and the program counter — so which of the four von Neumann registers is left? Purpose starts with 'Stores…'.",
  "starter": "Register: … — Purpose: Stores…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks</h5>\n<ul>\n<li>1 mark for register, e.g. accumulator</li>\n<li>1 mark for description, e.g. stores the result of arithmetic operations</li>\n</ul>\n</div>",
   "modelAnswer": "Register: Accumulator (ACC) — Purpose: stores the results of calculations carried out by the ALU."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:254f3acd",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q6b",
  "question": "<p>Computer A has a single core, 3.2 GHz processor.</p><p>Computer B has a single core, 1.2 GHz processor.</p><p>Explain why Computer A will usually run faster than Computer B.</p>",
  "hint": "Point + development: name the higher clock speed, then chain it — more fetch-execute cycles per second, which means more instructions executed per second.",
  "starter": "Computer A has a higher clock speed, which means…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark per bullet)</h5>\n<ul>\n<li>Faster/higher clock speed</li>\n<li>3.2 GHz will run more Fetch-Execute (F-E) cycles per second</li>\n<li>…therefore the more instructions can be executed per second // by calculation</li>\n</ul>\n</div>",
   "modelAnswer": "Computer A has a higher clock speed, so it carries out more fetch-execute cycles per second.\n\nThis means it can execute more instructions per second than Computer B, so programs usually run faster."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:8a95b65d",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q7",
  "question": "<p>Identify <strong>two</strong> events that take place during the fetch-execute cycle.</p>",
  "hint": "Short, factual events — think of the three stage names plus what happens to the program counter.",
  "starter": "1: … | 2: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (AO1 1a) — 1 mark for each correct answer, to a maximum of 2</h5>\n<ul>\n<li>An instruction is fetched from memory</li>\n<li>The instruction is then decoded</li>\n<li>The decoded instruction is then executed so that the CPU performs continuously</li>\n<li>The process is repeated</li>\n<li>The program counter is incremented</li>\n<li>The instruction is transferred to the MDR</li>\n<li>The address of the instruction to be fetched is placed in the MAR</li>\n</ul>\n</div>",
   "modelAnswer": "1: An instruction is fetched from memory.\n\n2: The program counter is incremented."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:2238e91a",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 5,
  "num": "Q8(i)",
  "question": "<p>The following sentences describe the purpose of a CPU.</p><p>Complete the sentences by filling in the missing words.</p><p>CPU stands for <strong>(1)</strong> . It is the part of the computer that fetches and executes the <strong>(2)</strong> that are stored in <strong>(3)</strong> .</p><p>The CPU contains the Arithmetic <strong>(4)</strong> Unit (ALU) and the <strong>(5)</strong> Unit (CU).</p>",
  "caseStudy": "<p><strong>Context</strong></p><p>Kerry wants to buy a new computer, but she does not understand what the different parts of a computer do.</p><p>Kerry has heard of a CPU but does not know what it is.</p>",
  "hint": "Blank (2) is what the CPU executes — 'data' on its own is too vague. Blank (3) is where running programs live.",
  "starter": "(1) … (2) … (3) … (4) … (5) …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 5 marks (AO1 1a) — 1 mark for each completed word</h5>\n<p>CPU stands for <strong>Central Processing Unit</strong>. It is the part of the computer that fetches and executes the <strong>instructions</strong> that are stored in <strong>(main) memory</strong>.</p>\n<p>The CPU contains the Arithmetic <strong>Logic</strong> Unit (ALU) and the <strong>Control</strong> Unit (CU).</p>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept: RAM/registers in place of \"memory\"; BOD cache/MDR/CIR in place of memory; 'and Logic' in place of Logic.</li>\n<li>Ignore 'data' if they put 'data and instructions', but no mark for data on its own.</li>\n<li>Do not award \"command\" for instructions. BOD central processor unit. BOD logical.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Candidates tackled this question well and many were able to identify several correct missing words. CPU was regularly given correctly, as was Logic and Control. Candidates found the other two words more challenging: 'instructions' was often replaced by 'data', which is too vague because data is not executed. Memory was the most common answer for the third space, but some candidates were more specific and correctly identified registers, or memory data register. A small number put memory address register, which was incorrect because it stores the address of the instructions, not the instructions.</p>\n</div>",
   "modelAnswer": "(1) Central Processing Unit\n(2) instructions\n(3) (main) memory\n(4) Logic\n(5) Control"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:080ca444",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q8(ii)",
  "question": "<p>Kerry is looking at two computers; one has a single core processor and the other has a dual core processor.</p><p>Explain why having a dual core processor might improve the performance of the computer.</p>",
  "caseStudy": "<p><strong>Context</strong></p><p>Kerry wants to buy a new computer, but she does not understand what the different parts of a computer do.</p><p>Kerry has heard of a CPU but does not know what it is.</p>",
  "hint": "The winning idea is the two cores working AT THE SAME TIME — each core executing a separate instruction simultaneously. 'More instructions per second' alone won't score.",
  "starter": "A dual core processor has two cores, which means…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (AO1 1b, AO2 1b) — 1 mark per bullet to max 2</h5>\n<ul>\n<li>Dual core is 2 processors/cores // double the number of processors/cores</li>\n<li>Parallel processing can take place</li>\n<li>…which means each processor can execute a separate instruction at the same time // each processor can run a different part of the program at the same time // each core can process instructions independently of each other</li>\n<li>…which enables multitasking</li>\n<li>Some processes/software cannot be split between two processors so it does not increase the performance</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Needs the notion of the processors acting at the same time — not just 'it can run twice as many instructions' without 'at the same time'.</li>\n<li>Do not award \"more instructions per second\" — this could be achieved by having a faster clock speed.</li>\n<li>Allow FDE for 'executing instructions'. Do not allow 'cores can split the tasks' without how (one task for each core at the same time). BOD run more than one program at once.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>The 'why' was missed by some candidates, who repeated the question by explaining that a dual core processor improved the performance. Some identified that more processes could be run per second, but this was too vague — it is not one core completing more instructions per second, but two cores that can both process instructions at the same time; the latter part was required for the mark.</p>\n</div>",
   "modelAnswer": "A dual core processor has two cores instead of one.\n\nEach core can execute a separate instruction at the same time (parallel processing), so the computer can get through more work simultaneously."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:abf95ba1",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q8(iii)",
  "question": "<p>One computer has 64 kilobytes of cache and the other has 512 kilobytes of cache.</p><p>Explain how the cache size can affect the performance of the CPU.</p>",
  "caseStudy": "<p><strong>Context</strong></p><p>Kerry wants to buy a new computer, but she does not understand what the different parts of a computer do.</p><p>Kerry has heard of a CPU but does not know what it is.</p>",
  "hint": "Chain it: what cache stores → why that's quicker than RAM → so what a bigger cache does for performance. 'Cache is faster than RAM' alone scores nothing.",
  "starter": "Cache stores frequently used instructions, which…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (AO1 1b) — 1 mark per bullet to max 2</h5>\n<ul>\n<li>Cache stores frequently/recently/next to be used instructions/data</li>\n<li>…that can be accessed faster than accessing them from RAM</li>\n<li>…which means more cache improves the performance of the CPU // less cache decreases the performance of the CPU</li>\n<li>Too much cache can be detrimental…</li>\n<li>…as it will take longer to find the instructions in cache</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>No mark for just defining cache as being fast memory or close to the CPU.</li>\n<li>No mark for \"cache is faster than RAM\" — faster at what?</li>\n<li>BOD: more cache makes the processing faster. BOD: more cache makes the computer run faster.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question required an understanding of how the cache size improves the performance, as opposed to the why of the previous question. Many candidates were able to identify that cache stored frequently used instructions, but fewer were able to demonstrate an understanding that more cache meant improved performance. Some gave the improved performance but without a context, i.e. that the computer with more cache improved the performance.</p>\n</div>",
   "modelAnswer": "Cache stores frequently used instructions and data, which can be accessed faster than fetching them from RAM.\n\nThe computer with 512 KB can hold more of these in cache, so the CPU waits less and performance improves."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:03287cf8",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q9",
  "question": "<p>Alicia has designed a computer using Von Neumann architecture.</p><p>Describe the purpose of <strong>two</strong> registers that are used by Von Neumann architecture.</p>",
  "hint": "Name each register AND describe it fully — 'the MAR stores an address' is not enough; say WHICH address. Up to 2 marks per register.",
  "starter": "1: The … stores… | 2: The … stores…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (AO1 1a ×2, AO1 1b ×2) — 1 mark per bullet to max 2 per register</h5>\n<ul>\n<li><strong>MAR // memory address register</strong> — stores the address/location where data will be read/written/accessed/fetched // address/location of data/instruction being processed // address/location of data/instruction next to be processed</li>\n<li><strong>MDR // memory data register</strong> — stores the data/instruction that is fetched/read from memory // stores the data that is to be written to memory // stores the data/instruction from the address in the MAR // data/instruction next to be processed</li>\n<li><strong>Program counter</strong> — stores the address/location of the next instruction to be run // stores the address/location of the current instruction being run</li>\n<li><strong>Accumulator</strong> — stores the result of manipulation/process/calculation</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>\"MAR stores address\" is not enough for description. \"MDR stores the data\" is not enough for description.</li>\n<li>Allow: Current instruction register // IR — stores the instruction currently being processed. Accept MBR // Memory buffer register for MDR.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Many candidates were able to accurately name two registers. The more able were able to accurately describe the purpose of these registers. Some candidates were not specific enough in their responses to gain the descriptive marks, or repeated the name of a register without the purpose, e.g. 'The memory address register stores the address of the data'.</p>\n</div>",
   "modelAnswer": "1: The program counter stores the address of the next instruction to be fetched from memory, and increments during each fetch-execute cycle.\n\n2: The MDR (memory data register) stores the data or instruction that has been fetched from memory, ready to be used by the CPU."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:faa9a4bf",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q10",
  "question": "<p>Identify <strong>four</strong> events that take place during the fetch-execute cycle.</p>",
  "hint": "The three stages give you three events; the program counter incrementing (or the cycle repeating) gives you the fourth.",
  "starter": "1: … | 2: … | 3: … | 4: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks — 1 mark for each correct answer, to a maximum of 4</h5>\n<ul>\n<li>An instruction is fetched from memory</li>\n<li>The instruction is then decoded</li>\n<li>The decoded instruction is then executed so that the CPU performs continuously</li>\n<li>The process is repeated</li>\n<li>The program counter is incremented</li>\n<li>The instruction is transferred to the MDR</li>\n<li>The address of the instruction to be fetched is placed in the MAR</li>\n</ul>\n</div>",
   "modelAnswer": "1: An instruction is fetched from memory.\n2: The instruction is decoded.\n3: The decoded instruction is executed.\n4: The program counter is incremented."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:54e06b6f",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 3,
  "num": "Q11a",
  "question": "<p>Describe how the CPU and RAM work together to enable the tablet computer to operate.</p>",
  "caseStudy": "<p><strong>Context</strong></p><p>Dipesh is thinking of buying a tablet computer to replace his old desktop computer.</p>",
  "hint": "Three steps, three marks: where instructions are STORED, who FETCHES them from there, and what then happens to them.",
  "starter": "The instructions and data of running programs are stored in…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 3 marks</h5>\n<ul>\n<li>Instructions / programs (currently running) / data are stored in the RAM…</li>\n<li>…these are fetched from the RAM by the CPU / Processor</li>\n<li>…where the instructions are executed / instructions are processed / data is processed</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>If the candidate has described the functions of RAM and the CPU separately, only award the 2nd bullet if it is clearly stated that instructions are fetched from RAM.</li>\n<li>Mention of the fetch–execute cycle in the CPU is enough to award bullet 3.</li>\n</ul>\n</div>",
   "modelAnswer": "The instructions and data of the programs the tablet is running are stored in RAM.\n\nThe CPU fetches these instructions from RAM, then decodes and executes them — repeating this fetch-execute cycle continuously so the tablet operates."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:ca09d77e",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q11b",
  "question": "<p>The tablet computer also uses cache memory. Describe the purpose of cache memory.</p>",
  "caseStudy": "<p><strong>Context</strong></p><p>Dipesh is thinking of buying a tablet computer to replace his old desktop computer.</p>",
  "hint": "What does cache store, and what does that save the CPU from having to do?",
  "starter": "Cache stores…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks</h5>\n<ul>\n<li>To store instructions / data that is frequently used / previously used / next to be used</li>\n<li>Data does not need to be fetched from RAM</li>\n<li>Speeds up access</li>\n</ul>\n</div>",
   "modelAnswer": "Cache stores the instructions and data that are used most frequently.\n\nThis means they do not need to be fetched from RAM each time, which speeds up access and improves performance."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:d0a0e221",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "What is the purpose of the CPU?",
  "options": [
   "To provide power to the computer",
   "To store the user's documents",
   "To fetch, decode and execute instructions",
   "To display graphics on the monitor"
  ],
  "key": {
   "answer": 2,
   "explain": "The CPU processes instructions by running the fetch–decode–execute cycle continuously. Storage, power and display are handled by other components."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:f513813a",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Put the three stages of the CPU's cycle in the correct order.",
  "options": [
   "Decode → fetch → execute",
   "Fetch → execute → decode",
   "Execute → decode → fetch",
   "Fetch → decode → execute"
  ],
  "key": {
   "answer": 3,
   "explain": "The instruction is fetched from memory first, then decoded by the control unit so the CPU knows what to do, then executed."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:55c4331e",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which CPU component performs mathematical calculations and logical operations?",
  "options": [
   "Program counter",
   "Cache",
   "Control unit",
   "ALU"
  ],
  "key": {
   "answer": 3,
   "explain": "The ALU (Arithmetic Logic Unit) does all the maths and logic — comparisons, additions, AND/OR operations. The CU coordinates; it doesn't calculate."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:519d3e94",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which CPU component decodes instructions and coordinates the actions of the processor?",
  "options": [
   "The control unit",
   "The MDR",
   "The ALU",
   "The accumulator"
  ],
  "key": {
   "answer": 0,
   "explain": "The control unit decodes each instruction and sends signals to synchronise and direct the other components. Remember: it directs the work, the ALU does the maths."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:c363bc49",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "What does the program counter store?",
  "options": [
   "The address of the next instruction to be fetched",
   "The number of programs currently running",
   "The result of the last calculation",
   "The data fetched from memory"
  ],
  "key": {
   "answer": 0,
   "explain": "The PC stores the ADDRESS of the next instruction and increments each cycle. It counts nothing — despite the name."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:ac7d1deb",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Data has just been fetched from main memory. Which register is it now sitting in?",
  "options": [
   "MDR",
   "Program counter",
   "MAR",
   "Accumulator"
  ],
  "key": {
   "answer": 0,
   "explain": "The MDR (Memory Data Register) holds the data or instruction just fetched from memory. The MAR held the address it came from."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:9767ecc7",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "The ALU has just added two numbers. Where is the result stored?",
  "options": [
   "In cache",
   "In the MAR",
   "In the program counter",
   "In the accumulator"
  ],
  "key": {
   "answer": 3,
   "explain": "The accumulator stores the results of ALU calculations. The MAR and PC only ever hold addresses."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:5d66ccbf",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which TWO registers store addresses rather than data?",
  "options": [
   "MDR and accumulator",
   "Accumulator and program counter",
   "MAR and MDR",
   "Program counter and MAR"
  ],
  "key": {
   "answer": 3,
   "explain": "PC and MAR hold locations in memory (addresses); MDR holds the data/instruction itself and the accumulator holds calculation results."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:5f46b628",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "What is cache?",
  "options": [
   "The part of the CPU that performs calculations",
   "Slow memory outside the CPU used for long-term storage",
   "A register that stores one address",
   "A small amount of fast memory inside the CPU storing frequently used instructions"
  ],
  "key": {
   "answer": 3,
   "explain": "Cache is small, very fast memory inside the CPU holding frequently used instructions and data — so the CPU avoids waiting for RAM."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:1eb02bf8",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A register is best described as...",
  "options": [
   "A small, very fast storage location inside the CPU holding one piece of data or one address",
   "A large memory store for running programs",
   "A type of secondary storage",
   "A unit that decodes instructions"
  ],
  "key": {
   "answer": 0,
   "explain": "Registers are tiny storage locations inside the CPU — each holds a single value or address the CPU is using right now."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:efd23440",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "During one fetch–execute cycle, which of these events happens?",
  "options": [
   "The operating system restarts",
   "The hard drive is defragmented",
   "The RAM is wiped clean",
   "The program counter is incremented"
  ],
  "key": {
   "answer": 3,
   "explain": "Each cycle: an instruction is fetched, decoded, executed — and the program counter increments so the CPU knows where the next instruction is."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:mcq:b2ac0635",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Why can the CPU access an instruction in cache faster than the same instruction in RAM?",
  "options": [
   "Cache is bigger than RAM",
   "Cache instructions are pre-executed",
   "RAM only works when the computer is off",
   "Cache is inside (or right next to) the CPU, so there is less distance and delay"
  ],
  "key": {
   "answer": 3,
   "explain": "Cache sits inside the CPU and is built from faster memory, so frequently used instructions don't have to make the slower trip from RAM."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:tf:38432837",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "The program counter counts how many programs are currently running.",
  "key": {
   "answer": false,
   "explain": "Despite its name, the PC counts nothing — it stores the ADDRESS of the next instruction to be fetched, and increments each cycle."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:tf:85f94882",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "The MDR stores the data or instruction that has just been fetched from memory.",
  "key": {
   "answer": true,
   "explain": "That's exactly its job — the MAR says where to look in memory, and the MDR holds what was found there."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:tf:811b7d89",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "The control unit performs all the mathematical calculations in the CPU.",
  "key": {
   "answer": false,
   "explain": "Calculations and logical operations are the ALU's job. The control unit decodes instructions and coordinates the processor."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:tf:ecf587ce",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Cache is a small amount of fast memory located inside the CPU.",
  "key": {
   "answer": true,
   "explain": "Cache sits inside the CPU and stores frequently used instructions and data, so the CPU doesn't have to keep fetching them from slower RAM."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:tf:b7930696",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "The MAR stores the data that has been fetched from memory.",
  "key": {
   "answer": false,
   "explain": "The MAR only ever stores an ADDRESS — the location to fetch from or write to. The data itself goes in the MDR."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:tf:5ec91ae0",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "The accumulator stores the results of ALU calculations.",
  "key": {
   "answer": true,
   "explain": "Correct — the ALU does the maths and the accumulator holds the result. Saying it stores 'the calculations' rather than the RESULTS is a known mark-loser."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:tf:dc45c24d",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Registers are large stores of memory located on the motherboard.",
  "key": {
   "answer": false,
   "explain": "Registers are tiny — each holds one value or address — and they are inside the CPU itself, which is why they're the fastest storage in the computer."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:tf:991d7861",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "The fetch–decode–execute cycle repeats continuously while the computer is running.",
  "key": {
   "answer": true,
   "explain": "The CPU never stops cycling: fetch, decode, execute, increment the program counter, repeat — billions of times per second."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:learn:43571494",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "What is the purpose of the CPU?",
  "reading": "<h4>The brain that follows instructions</h4>\n<ul>\n<li>The <strong>CPU (Central Processing Unit)</strong> is the part of the computer that carries out all the processing.</li>\n<li>Its purpose is to <strong>fetch, decode and execute instructions</strong> — every program you run, from a game to a spreadsheet, is just a long list of instructions the CPU works through one at a time.</li>\n<li>Think of a chef working through a recipe: read the next step (fetch), work out what it means (decode), then do it (execute) — and repeat until the dish is finished.</li>\n</ul>\n<h4>Where the instructions come from</h4>\n<ul>\n<li>Programs and their data are stored in <strong>main memory (RAM)</strong> while they are running.</li>\n<li>The CPU constantly pulls instructions out of memory, processes them, and sends the results back — billions of times every second.</li>\n<li>This design — the program stored in memory alongside its data, with one processor working through it — is called <strong>von Neumann architecture</strong>, and it is how almost every computer works.</li>\n</ul>\n<h4>Say it the exam way</h4>\n<ul>\n<li>If a question asks for the <em>purpose</em> of the CPU, the safe two-part answer is: it <strong>processes instructions</strong> by <strong>carrying out the fetch–execute cycle</strong>.</li>\n</ul>",
  "question": "Which of these best states the PURPOSE of the CPU?",
  "options": [
   "It displays images on the screen",
   "It connects the computer to the internet",
   "It stores all the user's files and programs",
   "It fetches, decodes and executes instructions"
  ],
  "key": {
   "answer": 3,
   "explain": "The CPU is the processor — it works through program instructions using the fetch–decode–execute cycle. Storing files is the job of storage, not the CPU."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:learn:ccdbc1dc",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "The fetch–decode–execute cycle",
  "reading": "<h4>The cycle the CPU repeats forever</h4>\n<ul>\n<li><strong>Fetch:</strong> the next instruction is copied from main memory into the CPU. The <strong>program counter</strong> holds the address of the instruction to fetch, and it <strong>increments</strong> (moves on by one) during each cycle so the CPU knows where the next instruction is.</li>\n<li><strong>Decode:</strong> the <strong>control unit</strong> works out what the instruction actually means — what operation is needed, and what data it needs.</li>\n<li><strong>Execute:</strong> the instruction is carried out — a calculation in the ALU, moving some data, or jumping to a different instruction.</li>\n<li>Then the cycle <strong>repeats</strong>, continuously, for as long as the computer is switched on.</li>\n</ul>\n<h4>Events the exam loves to ask for</h4>\n<ul>\n<li>\"Identify events that take place during the fetch–execute cycle\" is a classic question. Safe answers: an instruction is <strong>fetched from memory</strong>; the instruction is <strong>decoded</strong>; the instruction is <strong>executed</strong>; the <strong>program counter is incremented</strong>; the process <strong>repeats</strong>.</li>\n</ul>\n<h4>How fast does this happen?</h4>\n<ul>\n<li>The <strong>clock speed</strong> tells you how many cycles happen per second — a 3&nbsp;GHz CPU runs about 3 billion fetch–execute cycles every second (much more on this in 1.1.2).</li>\n</ul>",
  "question": "During the fetch–decode–execute cycle, what does the program counter do?",
  "options": [
   "It stores the data fetched from memory",
   "It increments so it always holds the address of the next instruction",
   "It counts how many programs are open",
   "It performs the calculations"
  ],
  "key": {
   "answer": 1,
   "explain": "The program counter holds the ADDRESS of the next instruction and increments each cycle. It never counts programs — that's the classic trap."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:learn:49866916",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Inside the CPU: ALU, CU, cache and registers",
  "reading": "<h4>The four common components</h4>\n<ul>\n<li><strong>ALU (Arithmetic Logic Unit):</strong> performs the <strong>mathematical calculations</strong> (add, subtract…) and <strong>logical operations</strong> (comparisons like greater-than, AND/OR decisions).</li>\n<li><strong>CU (Control Unit):</strong> <strong>decodes instructions</strong> and sends signals to <strong>coordinate</strong> the rest of the processor — it directs the fetch–execute cycle and the flow of data. It doesn't do the maths itself; it's the conductor, not the orchestra.</li>\n<li><strong>Cache:</strong> a small amount of <strong>very fast memory inside the CPU</strong> that stores <strong>frequently used instructions and data</strong>, so the CPU doesn't have to wait for the (slower) RAM every time.</li>\n<li><strong>Registers:</strong> tiny, extremely fast storage locations inside the CPU — each one holds <strong>a single piece of data or one address</strong> that the CPU is working with right now.</li>\n</ul>\n<h4>Storage sizes, smallest to biggest</h4>\n<ul>\n<li>Register (one value) → cache (small, inside the CPU) → RAM (all currently running programs). Speed goes the opposite way: registers are fastest, RAM is slowest of the three.</li>\n</ul>\n<h4>The wording that wins marks</h4>\n<ul>\n<li>Component questions are marked on precise verbs: the ALU <strong>performs</strong> calculations, the CU <strong>decodes and coordinates</strong>, cache and registers <strong>store</strong>. Mixing these up (e.g. \"the CU executes the instructions\") is the most common way to lose the mark.</li>\n</ul>",
  "question": "A computer program needs to check whether one number is bigger than another. Which CPU component carries out this comparison?",
  "options": [
   "The ALU",
   "The program counter",
   "The control unit",
   "The cache"
  ],
  "key": {
   "answer": 0,
   "explain": "Comparisons are logical operations, and the ALU performs all mathematical calculations and logical operations. The CU decodes and coordinates; it doesn't do the comparison itself."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:learn:c9e7c67d",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Von Neumann architecture: the four registers",
  "reading": "<h4>The registers you must know by name</h4>\n<ul>\n<li><strong>Program counter (PC):</strong> stores the <strong>address</strong> of the <strong>next instruction</strong> to be fetched from memory. It increments during each fetch–execute cycle.</li>\n<li><strong>MAR (Memory Address Register):</strong> stores the <strong>address</strong> of the data or instruction that is about to be fetched from memory — or the address where data is about to be stored.</li>\n<li><strong>MDR (Memory Data Register):</strong> stores the actual <strong>data or instruction</strong> that has just been fetched from memory, or that is about to be written to memory.</li>\n<li><strong>Accumulator (ACC):</strong> stores the <strong>results of calculations</strong> carried out by the ALU.</li>\n</ul>\n<h4>The one distinction that decides the marks: address or data?</h4>\n<ul>\n<li>An <strong>address</strong> is the location — like a house number. <strong>Data</strong> is what's actually stored there — like the people inside the house.</li>\n<li><strong>PC and MAR store addresses.</strong> <strong>MDR and ACC store data.</strong> If you remember only one thing from this card, make it that line.</li>\n</ul>\n<h4>A pair that works together</h4>\n<ul>\n<li>The MAR and MDR are a team: the MAR says <em>where</em> in memory to look, and the MDR holds <em>what</em> was found there. That's why \"the MAR stores the data\" is always wrong — it only ever holds the location.</li>\n</ul>",
  "question": "Which pair of registers store an ADDRESS rather than data?",
  "options": [
   "Program counter and MAR",
   "MDR and accumulator",
   "Accumulator and program counter",
   "MDR and MAR"
  ],
  "key": {
   "answer": 0,
   "explain": "PC and MAR hold addresses (locations in memory). The MDR holds the data/instruction itself, and the accumulator holds the results of ALU calculations."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:learn:f23797b3",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Putting it together: CPU, RAM and cache in action",
  "reading": "<h4>What happens when you open an app</h4>\n<ul>\n<li>The program's <strong>instructions and data are loaded into RAM</strong> (main memory) — the CPU cannot work on things directly from the hard drive or SSD.</li>\n<li>The CPU then <strong>fetches instructions from RAM</strong>, one at a time, and <strong>executes</strong> them using the fetch–decode–execute cycle.</li>\n<li>Instructions the CPU keeps coming back to are copied into <strong>cache</strong>, so next time they can be grabbed much faster than going back to RAM.</li>\n</ul>\n<h4>Why cache makes a CPU faster (the 2-mark version)</h4>\n<ul>\n<li>Cache stores frequently used instructions and data <strong>which can be accessed faster than RAM</strong> — so a bigger cache means the CPU waits less, improving performance.</li>\n<li>One subtle extra: a <em>huge</em> cache can bring diminishing returns, because it takes longer to search through more cache.</li>\n</ul>\n<h4>Answering \"describe how the CPU and RAM work together\"</h4>\n<ul>\n<li>Three-step structure: instructions/data are <strong>stored in RAM</strong> → they are <strong>fetched from RAM by the CPU</strong> → the CPU <strong>executes/processes</strong> them. Three steps, three marks.</li>\n</ul>",
  "question": "Why does cache memory speed up the CPU?",
  "options": [
   "It permanently stores the operating system",
   "It adds more storage space for the user's files",
   "It increases the clock speed of the CPU",
   "It stores frequently used instructions that can be accessed faster than fetching them from RAM"
  ],
  "key": {
   "answer": 3,
   "explain": "Cache holds the instructions and data the CPU uses most, inside the CPU itself — so they can be accessed far faster than going out to RAM. It doesn't change the clock speed or store files."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:misc:64456bb7",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> The program counter keeps track of how many programs are running (or counts the instructions processed).</p><p><strong>✅ The correct idea:</strong> The program counter stores the ADDRESS of the next instruction to be fetched from memory, and it increments during each fetch–execute cycle. It is a signpost, not a tally. If your answer to any PC question doesn't contain the word 'address', it is almost certainly wrong.</p>",
  "question": "Which answer would earn the mark for 'state the purpose of the program counter'?",
  "options": [
   "It counts the number of fetch–execute cycles",
   "It counts the programs that are open",
   "It stores the address of the next instruction to be fetched",
   "It stores the instructions that are running"
  ],
  "key": {
   "answer": 2,
   "explain": "Only the address answer scores. Counting programs or cycles is the classic misconception, and 'stores the instructions' confuses the PC with the MDR."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:misc:e3522b5d",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> The control unit executes the instructions and does the processing itself.</p><p><strong>✅ The correct idea:</strong> The control unit DECODES instructions and sends signals to coordinate and synchronise the rest of the processor — it directs the fetch–execute cycle but doesn't do the calculations. Weak answer: 'the CU sends signals to components' (what for?). Strong answer: 'the CU decodes instructions and sends signals to coordinate the flow of data through the processor.' Say what the signals achieve.</p>",
  "question": "Which is the BEST description of the control unit?",
  "options": [
   "It performs the mathematical operations",
   "It sends signals to components",
   "It decodes instructions and coordinates the actions of the processor",
   "It stores frequently used instructions"
  ],
  "key": {
   "answer": 2,
   "explain": "Option B is the trap — it's true but incomplete, because it doesn't say what the signals do. The full answer names decoding AND coordination."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:misc:11a65f65",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> 'The MAR fetches the data from memory' — describing registers with action verbs.</p><p><strong>✅ The correct idea:</strong> Registers STORE; they don't fetch, take or retrieve. Mark schemes explicitly refuse purposes written as actions. Level 0: 'the MAR fetches data'. Level 1: 'the MAR stores an address'. Full marks: 'the MAR stores the address of the data or instruction that is to be fetched from, or written to, memory.' Always start a register's purpose with 'stores...'.</p>",
  "question": "A question asks for the purpose of the MDR. Which answer style earns the mark?",
  "options": [
   "\"The MDR is a register in the CPU\"",
   "\"The MDR moves data around the CPU\"",
   "\"The MDR stores the data or instruction fetched from memory\"",
   "\"The MDR fetches the data from RAM\""
  ],
  "key": {
   "answer": 2,
   "explain": "Registers store. Answers built on fetches/moves/takes describe actions the register doesn't perform, and 'it is a register' just restates the question."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:misc:55d4a448",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> The MAR and the PC store data, and the MDR stores an address — they're all much the same.</p><p><strong>✅ The correct idea:</strong> The address/data split is the whole game: PC and MAR store ADDRESSES (locations in memory); MDR and accumulator store DATA (the instruction/data itself, or a result). A typical error chain in table questions: writing MAR where PC belongs, then 'using up' MDR on the next row too. Check the definition for the word 'address' before you commit a register name.</p>",
  "question": "A definition in an exam table reads: 'Stores the address of the next instruction to be fetched. Increments during each cycle.' Which register is it?",
  "options": [
   "Program counter",
   "MDR",
   "Accumulator",
   "MAR"
  ],
  "key": {
   "answer": 0,
   "explain": "'Address of the NEXT INSTRUCTION' plus 'increments' can only be the program counter. The MAR stores the address currently being fetched from — no incrementing."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:misc:11af198a",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> A dual-core processor is faster because it simply runs twice as many instructions per second.</p><p><strong>✅ The correct idea:</strong> The mark is for the idea of the cores working AT THE SAME TIME: each core can execute a separate instruction (or a different part of the program) simultaneously — that's parallel processing. 'It runs more instructions per second' on its own could just describe a faster clock. And be ready for the twist: some software can't be split across cores, so performance doesn't always double.</p>",
  "question": "Which sentence correctly explains why a dual-core CPU can improve performance?",
  "options": [
   "\"Two cores mean twice the cache\"",
   "\"Each core can execute a different instruction at the same time\"",
   "\"Two cores double the clock speed\"",
   "\"It can run more instructions per second\""
  ],
  "key": {
   "answer": 1,
   "explain": "The winning idea is simultaneous execution — parallel processing. Doubling clock speed or cache isn't what a second core does, and 'more instructions per second' misses the 'at the same time' requirement."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:tips:509ebf41",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "explain — Register questions: from 0 to full marks",
  "reading": "<p>Here is the same answer to <em>\"State the purpose of the MAR\"</em> at every level:</p>\n\n<p><strong>❌ 0 marks:</strong> \"The MAR is a register inside the CPU.\"</p>\n<ul>\n<li>True, but it just restates the question — no purpose given.</li>\n</ul>\n\n<p><strong>❌ 0 marks:</strong> \"The MAR fetches the data from memory.\"</p>\n<ul>\n<li>Registers <strong>store</strong> — purposes written as actions (fetches, takes, retrieves) are refused.</li>\n</ul>\n\n<p><strong>⚠️ Borderline:</strong> \"The MAR stores an address.\"</p>\n<ul>\n<li>The verb is right, but WHICH address? Too vague to be safe.</li>\n</ul>\n\n<p><strong>✅ Full marks:</strong> \"The MAR stores the address of the data or instruction that is to be fetched from, or written to, memory.\"</p>\n\n<p><strong>The pattern for all four registers:</strong> \"Stores the…\" + address or data + what it belongs to:</p>\n<ul>\n<li>PC → stores the <strong>address of the next instruction</strong> to be fetched (and increments each cycle)</li>\n<li>MAR → stores the <strong>address</strong> of the data/instruction being fetched or written</li>\n<li>MDR → stores the <strong>data/instruction</strong> fetched from memory</li>\n<li>ACC → stores the <strong>results</strong> of ALU calculations</li>\n</ul>",
  "question": "Why does \"the MAR fetches data from memory\" score 0?",
  "options": [
   "MAR should be written in full",
   "A register's purpose is to STORE — describing it as performing an action is wrong",
   "The MAR doesn't exist",
   "It's too short"
  ],
  "key": {
   "answer": 1,
   "explain": "Registers are storage locations. The fetching is done by the CPU as a whole during the cycle — the register just holds the address or data involved."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:tips:ef7572cb",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "explain — 2-mark 'explain why it's faster' questions: the …which means… chain",
  "reading": "<p>Performance explanations (clock speed, cache, cores) are marked as <strong>point + development</strong>. One fact = 1 mark; linking it to performance = the 2nd mark.</p>\n\n<p><strong>Example: \"Explain why a 3.2 GHz CPU usually runs faster than a 1.2 GHz CPU.\" [2]</strong></p>\n\n<p><strong>⚠️ 1 mark:</strong> \"3.2 GHz is a higher clock speed.\"</p>\n<ul>\n<li>Correct point, no development — the chain stops.</li>\n</ul>\n\n<p><strong>✅ 2 marks:</strong> \"3.2 GHz is a higher clock speed, so it runs more fetch–execute cycles per second, <strong>which means</strong> more instructions can be executed per second.\"</p>\n\n<p><strong>The same chain works for cache:</strong> \"Cache stores frequently used instructions → they can be accessed faster than from RAM → so the CPU spends less time waiting.\"</p>\n\n<p><strong>Two traps:</strong></p>\n<ul>\n<li>\"Cache is faster than RAM\" alone scores nothing — faster at <em>what</em>? Name the access to instructions/data.</li>\n<li>For dual core, the development must include <strong>at the same time</strong> (parallel execution) — \"more instructions per second\" alone reads like clock speed.</li>\n</ul>",
  "question": "\"More cache improves performance\" scores 1 out of 2. What's missing?",
  "options": [
   "The chain: cache stores frequently used instructions which are accessed faster than from RAM",
   "The brand of CPU",
   "The exact size of the cache in GB",
   "A diagram"
  ],
  "key": {
   "answer": 0,
   "explain": "The second mark is for developing the point: WHAT cache stores and WHY that speeds things up (faster access than RAM). Assertions about performance without the mechanism stay on 1 mark."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:tips:b824f0a6",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "tip — Table and matching questions: play them like a puzzle",
  "reading": "<p>1.1.1 is full of table-completion and match-the-definition questions. Technique matters as much as knowledge:</p>\n\n<p><strong>1. Scan the whole table before writing anything.</strong></p>\n<ul>\n<li>A classic error chain: writing MAR in the row that should be PC, then forcing MDR into the MAR row — one early slip wrecks three rows. Pencil in all rows mentally first.</li>\n</ul>\n\n<p><strong>2. Use the address/data keyword test.</strong></p>\n<ul>\n<li>Definition contains \"address of the next instruction\" + \"increments\" → PC. \"Address\" of data being fetched/stored → MAR. \"Data/instruction fetched\" → MDR. \"Result\" → accumulator. \"Calculations/logical operations\" → ALU. \"Coordinates/decodes/signals\" → CU.</li>\n</ul>\n\n<p><strong>3. In draw-one-line matching, count the boxes.</strong></p>\n<ul>\n<li>If there are more definitions than components, at least one definition is a decoy — expect something plausible-sounding like \"keeps the clock in sync\".</li>\n<li>Drawing two lines from one component scores 0 for that component. One from, one to.</li>\n</ul>\n\n<p><strong>4. In tick-grids, extra ticks kill the row.</strong></p>\n<ul>\n<li>Each row is marked as a whole: the correct ticks AND no extras. If unsure, tick only what you're confident in — a stray extra tick turns a right answer into 0 for that row.</li>\n</ul>",
  "question": "In a tick-grid question, a student ticks the two correct boxes in a row PLUS one extra box. What happens?",
  "options": [
   "They get 2 out of 3 for the row",
   "They score 0 for that row — extra ticks void it",
   "They lose 1 mark from their total",
   "The examiner ignores the extra tick"
  ],
  "key": {
   "answer": 1,
   "explain": "Rows are all-or-nothing: right ticks with any extra tick scores 0 for that row. Tick with intent, not with hope."
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:fib:60773e51",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "The CPU's purpose is to _____, decode and _____ instructions.",
  "blankOptions": {
   "B1": [
    "data",
    "fetch",
    "increments",
    "frequently"
   ],
   "B2": [
    "address",
    "execute",
    "control",
    "increments"
   ]
  },
  "key": {
   "blanks": {
    "B1": "fetch",
    "B2": "execute"
   }
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:fib:9e0ac859",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "Instructions are decoded by the _____ unit, while calculations are performed by the _____.",
  "blankOptions": {
   "B1": [
    "fast",
    "control",
    "frequently",
    "data"
   ],
   "B2": [
    "address",
    "results",
    "ALU",
    "increments"
   ]
  },
  "key": {
   "blanks": {
    "B1": "control",
    "B2": "ALU"
   }
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:fib:f5b68e90",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "The program counter stores the _____ of the next instruction, and it _____ during each fetch–execute cycle.",
  "blankOptions": {
   "B1": [
    "execute",
    "results",
    "address",
    "frequently"
   ],
   "B2": [
    "frequently",
    "ALU",
    "increments",
    "control"
   ]
  },
  "key": {
   "blanks": {
    "B1": "address",
    "B2": "increments"
   }
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:fib:bb4d96a0",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "The MAR stores an address, but the MDR stores the _____ fetched from memory.",
  "blankOptions": {
   "B1": [
    "execute",
    "results",
    "RAM",
    "data"
   ]
  },
  "key": {
   "blanks": {
    "B1": "data"
   }
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:fib:af2dafd7",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "The accumulator stores the _____ of calculations carried out by the ALU.",
  "blankOptions": {
   "B1": [
    "control",
    "execute",
    "data",
    "results"
   ]
  },
  "key": {
   "blanks": {
    "B1": "results"
   }
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:fib:c0f8bed1",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "Cache is a small amount of _____ memory inside the CPU that stores _____ used instructions.",
  "blankOptions": {
   "B1": [
    "ALU",
    "results",
    "RAM",
    "fast"
   ],
   "B2": [
    "address",
    "results",
    "fetch",
    "frequently"
   ]
  },
  "key": {
   "blanks": {
    "B1": "fast",
    "B2": "frequently"
   }
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:fib:c75b9f99",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "While a program is running, its instructions and data are stored in main memory, also called _____.",
  "blankOptions": {
   "B1": [
    "frequently",
    "data",
    "RAM",
    "increments"
   ]
  },
  "key": {
   "blanks": {
    "B1": "RAM"
   }
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:02f4ed45",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “CPU”?",
  "options": [
   "The stage where the next instruction is copied from main memory into the CPU",
   "The component that processes instructions by carrying out the fetch–execute cycle",
   "The stage where the control unit works out what an instruction means",
   "The stage where the instruction is actually carried out"
  ],
  "key": {
   "answer": 1,
   "explain": "“CPU” means: The component that processes instructions by carrying out the fetch–execute cycle"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:f7ad3e9a",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Fetch”?",
  "options": [
   "The stage where the control unit works out what an instruction means",
   "The stage where the instruction is actually carried out",
   "Performs mathematical calculations and logical operations",
   "The stage where the next instruction is copied from main memory into the CPU"
  ],
  "key": {
   "answer": 3,
   "explain": "“Fetch” means: The stage where the next instruction is copied from main memory into the CPU"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:a2a58076",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Decode”?",
  "options": [
   "The stage where the instruction is actually carried out",
   "The stage where the control unit works out what an instruction means",
   "Performs mathematical calculations and logical operations",
   "Decodes instructions and coordinates the actions of the processor"
  ],
  "key": {
   "answer": 1,
   "explain": "“Decode” means: The stage where the control unit works out what an instruction means"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:905896ac",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Execute”?",
  "options": [
   "The stage where the instruction is actually carried out",
   "Performs mathematical calculations and logical operations",
   "Decodes instructions and coordinates the actions of the processor",
   "Small, fast memory inside the CPU storing frequently used instructions and data"
  ],
  "key": {
   "answer": 0,
   "explain": "“Execute” means: The stage where the instruction is actually carried out"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:635b1dc7",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “ALU”?",
  "options": [
   "Decodes instructions and coordinates the actions of the processor",
   "Small, fast memory inside the CPU storing frequently used instructions and data",
   "A tiny, very fast storage location inside the CPU holding a single value or address",
   "Performs mathematical calculations and logical operations"
  ],
  "key": {
   "answer": 3,
   "explain": "“ALU” means: Performs mathematical calculations and logical operations"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:b04d8205",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Control unit (CU)”?",
  "options": [
   "Small, fast memory inside the CPU storing frequently used instructions and data",
   "A tiny, very fast storage location inside the CPU holding a single value or address",
   "Stores the address of the next instruction to be fetched; increments each cycle",
   "Decodes instructions and coordinates the actions of the processor"
  ],
  "key": {
   "answer": 3,
   "explain": "“Control unit (CU)” means: Decodes instructions and coordinates the actions of the processor"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:430a2d66",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Cache”?",
  "options": [
   "A tiny, very fast storage location inside the CPU holding a single value or address",
   "Small, fast memory inside the CPU storing frequently used instructions and data",
   "Stores the address of the next instruction to be fetched; increments each cycle",
   "Stores the address of the data or instruction to be fetched from or written to memory"
  ],
  "key": {
   "answer": 1,
   "explain": "“Cache” means: Small, fast memory inside the CPU storing frequently used instructions and data"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:5fce3862",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Register”?",
  "options": [
   "Stores the address of the next instruction to be fetched; increments each cycle",
   "Stores the address of the data or instruction to be fetched from or written to memory",
   "A tiny, very fast storage location inside the CPU holding a single value or address",
   "Stores the data or instruction that has just been fetched from (or is being written to) memory"
  ],
  "key": {
   "answer": 2,
   "explain": "“Register” means: A tiny, very fast storage location inside the CPU holding a single value or address"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:3de929e4",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Program counter (PC)”?",
  "options": [
   "Stores the address of the data or instruction to be fetched from or written to memory",
   "Stores the address of the next instruction to be fetched; increments each cycle",
   "Stores the data or instruction that has just been fetched from (or is being written to) memory",
   "Stores the results of calculations carried out by the ALU"
  ],
  "key": {
   "answer": 1,
   "explain": "“Program counter (PC)” means: Stores the address of the next instruction to be fetched; increments each cycle"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:d4a24ece",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “MAR”?",
  "options": [
   "Stores the data or instruction that has just been fetched from (or is being written to) memory",
   "Stores the address of the data or instruction to be fetched from or written to memory",
   "Stores the results of calculations carried out by the ALU",
   "A computer design where the program's instructions and data are both stored in memory"
  ],
  "key": {
   "answer": 1,
   "explain": "“MAR” means: Stores the address of the data or instruction to be fetched from or written to memory"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:b6badc4a",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “MDR”?",
  "options": [
   "Stores the data or instruction that has just been fetched from (or is being written to) memory",
   "Stores the results of calculations carried out by the ALU",
   "A computer design where the program's instructions and data are both stored in memory",
   "The component that processes instructions by carrying out the fetch–execute cycle"
  ],
  "key": {
   "answer": 0,
   "explain": "“MDR” means: Stores the data or instruction that has just been fetched from (or is being written to) memory"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:0024d5cb",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Accumulator (ACC)”?",
  "options": [
   "A computer design where the program's instructions and data are both stored in memory",
   "Stores the results of calculations carried out by the ALU",
   "The component that processes instructions by carrying out the fetch–execute cycle",
   "The stage where the next instruction is copied from main memory into the CPU"
  ],
  "key": {
   "answer": 1,
   "explain": "“Accumulator (ACC)” means: Stores the results of calculations carried out by the ALU"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:match:b62fe581",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Von Neumann architecture”?",
  "options": [
   "The component that processes instructions by carrying out the fetch–execute cycle",
   "A computer design where the program's instructions and data are both stored in memory",
   "The stage where the next instruction is copied from main memory into the CPU",
   "The stage where the control unit works out what an instruction means"
  ],
  "key": {
   "answer": 1,
   "explain": "“Von Neumann architecture” means: A computer design where the program's instructions and data are both stored in memory"
  }
 }
];
