// ══════════════════════════════════════════════════════════════
// QUESTION BANK — GENERATED FILE, DO NOT EDIT BY HAND
// Built by tools/build_question_bank.py from the question arrays
// embedded in every topic page. Regenerate after editing questions:
//     python tools/build_question_bank.py
// Generated: 2026-07-17T19:29:31Z · 417 questions
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
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:5430891e",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q5",
  "question": "<p>Draw <strong>one</strong> line from each part of the processor to its correct definition.</p><p>(There are more definitions than parts — one definition is not used.)</p>",
  "hint": "One line from each part, exactly. There are five definitions for four parts, so one is a decoy — watch for the plausible-sounding one about the clock.",
  "starter": "CU → …, Cache → …, ALU → …, Register → …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark per correct line from component to definition)</h5>\n<ul>\n<li>Control Unit (CU) → <strong>B</strong> (sends signals to direct the operations)</li>\n<li>Cache → <strong>E</strong> (high speed memory inside the processor that stores recently used instructions)</li>\n<li>Arithmetic Logic Unit (ALU) → <strong>A</strong> (performs mathematical operations)</li>\n<li>Register → <strong>D</strong> (a small piece of memory inside the processor that can hold one instruction or address)</li>\n<li>C (\"keeps the clock in sync\") is the unused decoy.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Any 2 lines from 1 component = 0 marks for that component.</li>\n</ul>\n</div>",
   "modelAnswer": "CU → B, Cache → E, ALU → A, Register → D"
  }
 },
 {
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:20102b0a",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q6a(i)",
  "question": "<p>The table has five components of a computer, and four statements.</p><p>Tick (✓) <strong>one or more</strong> boxes in each row to identify which component(s) each statement describes.</p>",
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
  "id": "computer-science:1-1-1-architecture-of-the-cpu:exam:d806aa32",
  "pageId": "computer-science:1-1-1-architecture-of-the-cpu",
  "pageName": "1.1.1 Architecture of the CPU",
  "source": "exam",
  "type": "written",
  "marks": 5,
  "num": "Q8(i)",
  "question": "<p>The following sentences describe the purpose of a CPU.</p><p>Complete the sentences by filling in the missing words.</p>",
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
   "To supply power to every other component in the case",
   "To render and display graphics on the monitor",
   "To fetch, decode and execute instructions",
   "To permanently store the user's files and documents"
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
   "ALU",
   "Control unit"
  ],
  "key": {
   "answer": 2,
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
   "The ALU, which carries out calculations",
   "The control unit",
   "The MDR, which holds fetched data",
   "The accumulator, which stores results"
  ],
  "key": {
   "answer": 1,
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
   "The actual data that was just fetched from memory",
   "The address of the next instruction to fetch",
   "The result of the most recent ALU calculation",
   "The number of programs currently open and running"
  ],
  "key": {
   "answer": 1,
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
   "Program counter",
   "MAR",
   "Accumulator",
   "MDR"
  ],
  "key": {
   "answer": 3,
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
   "In the program counter",
   "In the MAR",
   "In the accumulator",
   "In cache"
  ],
  "key": {
   "answer": 2,
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
   "Accumulator and program counter",
   "Program counter and MAR",
   "MAR and MDR",
   "MDR and accumulator"
  ],
  "key": {
   "answer": 1,
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
   "Slow, large-capacity memory outside the CPU, used for long-term file storage and backups",
   "A single register that stores one memory address for the CPU",
   "The part of the CPU that performs all calculations and logic",
   "Small, very fast memory inside the CPU holding frequently used instructions"
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
   "A tiny, very fast CPU storage location holding one value or address",
   "A large area of memory used to hold currently running programs and their data",
   "A processing unit that decodes and interprets program instructions",
   "A type of secondary storage used to store files permanently"
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
   "The program counter is incremented",
   "Every byte of RAM is cleared and reset",
   "The entire operating system reboots",
   "The hard drive is automatically defragmented"
  ],
  "key": {
   "answer": 0,
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
   "Cache has a much larger storage capacity than RAM",
   "Cache sits inside the CPU, so data travels a much shorter distance",
   "RAM only stores data while the computer is switched off",
   "Instructions stored in cache have already been executed once in advance"
  ],
  "key": {
   "answer": 1,
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
   "It fetches, decodes and executes instructions",
   "It permanently stores all the user's files and programs",
   "It connects the whole computer to the internet",
   "It displays moving images on the screen"
  ],
  "key": {
   "answer": 0,
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
   "It stores the actual data that has just been fetched from memory",
   "It increments each cycle to point to the next instruction",
   "It counts how many programs are currently open and running",
   "It performs the CPU's mathematical calculations"
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
   "The control unit",
   "The program counter",
   "The cache",
   "The ALU"
  ],
  "key": {
   "answer": 3,
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
   "MDR and MAR",
   "Accumulator and program counter",
   "Program counter and MAR",
   "MDR and accumulator"
  ],
  "key": {
   "answer": 2,
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
   "It adds extra long-term storage space for the user's own files",
   "It holds frequently used instructions, which load faster than from RAM",
   "It permanently stores a full backup copy of the entire operating system",
   "It physically increases the CPU's underlying clock speed"
  ],
  "key": {
   "answer": 1,
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
   "It stores the address of the next instruction to fetch",
   "It counts the total number of fetch–execute cycles completed",
   "It counts how many programs are currently open",
   "It stores every instruction that is currently running"
  ],
  "key": {
   "answer": 0,
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
   "It performs all the CPU's mathematical operations directly",
   "It sends signals to synchronise the other components",
   "It decodes instructions and coordinates the processor",
   "It permanently stores the most frequently used program instructions"
  ],
  "key": {
   "answer": 2,
   "explain": "Option B is the trap — it's true but incomplete, because it only covers coordination and leaves out decoding. The full answer names decoding AND coordination."
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
   "\"The MDR stores the data fetched from memory\"",
   "\"The MDR actively moves data around the CPU\"",
   "\"The MDR is just a general register in the CPU\"",
   "\"The MDR actively fetches data from RAM\""
  ],
  "key": {
   "answer": 0,
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
   "Program counter (PC)",
   "MAR (Memory Address Register)",
   "MDR (Memory Data Register)",
   "Accumulator (ACC)"
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
   "\"Having two cores automatically doubles the cache size\"",
   "\"It can process more instructions every single second\"",
   "\"Each core runs a separate instruction simultaneously\"",
   "\"Two cores always double the CPU's clock speed\""
  ],
  "key": {
   "answer": 2,
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
   "The MAR does not actually exist as a real CPU register",
   "The answer given is simply too short for the mark",
   "Registers STORE data — describing them as performing an action is wrong",
   "Register names must always be spelled out in full rather than abbreviated like MAR"
  ],
  "key": {
   "answer": 2,
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
   "The specific brand and full model name of the CPU",
   "A fully labelled diagram showing every one of the CPU's components",
   "The precise size of the cache, given exactly in megabytes or gigabytes",
   "The chain: cache stores instructions accessible faster than RAM"
  ],
  "key": {
   "answer": 3,
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
   "The examiner simply ignores the extra tick mark",
   "They still receive partial credit of 2 out of 3 for the row",
   "They score 0 for that row — extra ticks void it",
   "They simply lose 1 mark from their overall total"
  ],
  "key": {
   "answer": 2,
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
    "frequently",
    "results",
    "fetch",
    "ALU"
   ],
   "B2": [
    "execute",
    "results",
    "increments",
    "RAM"
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
    "results",
    "fetch",
    "control",
    "fast"
   ],
   "B2": [
    "fast",
    "execute",
    "RAM",
    "ALU"
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
    "address",
    "RAM",
    "ALU",
    "execute"
   ],
   "B2": [
    "control",
    "fast",
    "increments",
    "ALU"
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
    "data",
    "address",
    "fetch",
    "RAM"
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
    "results",
    "RAM",
    "control",
    "data"
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
    "RAM",
    "increments",
    "ALU",
    "fast"
   ],
   "B2": [
    "control",
    "ALU",
    "execute",
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
    "increments",
    "data",
    "fetch",
    "RAM"
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
   "Stores the address of the data or instruction to be fetched from or written to memory",
   "Performs mathematical calculations and logical operations",
   "The component that processes instructions by carrying out the fetch–execute cycle",
   "Decodes instructions and coordinates the actions of the processor"
  ],
  "key": {
   "answer": 2,
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
   "A tiny, very fast storage location inside the CPU holding a single value or address",
   "Stores the address of the data or instruction to be fetched from or written to memory",
   "The stage where the next instruction is copied from main memory into the CPU",
   "The component that processes instructions by carrying out the fetch–execute cycle"
  ],
  "key": {
   "answer": 2,
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
   "Small, fast memory inside the CPU storing frequently used instructions and data",
   "The component that processes instructions by carrying out the fetch–execute cycle"
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
   "The component that processes instructions by carrying out the fetch–execute cycle",
   "Decodes instructions and coordinates the actions of the processor",
   "Performs mathematical calculations and logical operations"
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
   "Stores the results of calculations carried out by the ALU",
   "Performs mathematical calculations and logical operations",
   "Small, fast memory inside the CPU storing frequently used instructions and data",
   "Stores the data or instruction that has just been fetched from (or is being written to) memory"
  ],
  "key": {
   "answer": 1,
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
   "The stage where the next instruction is copied from main memory into the CPU",
   "Decodes instructions and coordinates the actions of the processor",
   "A computer design where the program's instructions and data are both stored in memory",
   "Stores the results of calculations carried out by the ALU"
  ],
  "key": {
   "answer": 1,
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
   "Stores the address of the data or instruction to be fetched from or written to memory",
   "Small, fast memory inside the CPU storing frequently used instructions and data",
   "Stores the address of the next instruction to be fetched; increments each cycle"
  ],
  "key": {
   "answer": 2,
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
   "The component that processes instructions by carrying out the fetch–execute cycle",
   "Small, fast memory inside the CPU storing frequently used instructions and data",
   "A tiny, very fast storage location inside the CPU holding a single value or address",
   "Decodes instructions and coordinates the actions of the processor"
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
   "Stores the address of the next instruction to be fetched; increments each cycle",
   "Stores the results of calculations carried out by the ALU",
   "Performs mathematical calculations and logical operations",
   "Small, fast memory inside the CPU storing frequently used instructions and data"
  ],
  "key": {
   "answer": 0,
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
   "Stores the address of the data or instruction to be fetched from or written to memory",
   "Stores the data or instruction that has just been fetched from (or is being written to) memory",
   "Small, fast memory inside the CPU storing frequently used instructions and data",
   "The component that processes instructions by carrying out the fetch–execute cycle"
  ],
  "key": {
   "answer": 0,
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
   "A tiny, very fast storage location inside the CPU holding a single value or address",
   "A computer design where the program's instructions and data are both stored in memory",
   "Stores the data or instruction that has just been fetched from (or is being written to) memory",
   "Stores the address of the data or instruction to be fetched from or written to memory"
  ],
  "key": {
   "answer": 2,
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
   "Small, fast memory inside the CPU storing frequently used instructions and data",
   "Stores the results of calculations carried out by the ALU",
   "The component that processes instructions by carrying out the fetch–execute cycle",
   "A tiny, very fast storage location inside the CPU holding a single value or address"
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
   "Performs mathematical calculations and logical operations",
   "The component that processes instructions by carrying out the fetch–execute cycle",
   "A computer design where the program's instructions and data are both stored in memory",
   "The stage where the next instruction is copied from main memory into the CPU"
  ],
  "key": {
   "answer": 2,
   "explain": "“Von Neumann architecture” means: A computer design where the program's instructions and data are both stored in memory"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:exam:03164a3b",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "exam",
  "type": "written",
  "marks": 3,
  "num": "Q1",
  "question": "<p>A computer has a Central Processing Unit (CPU).</p><p>Give <strong>three</strong> characteristics of a CPU that can affect its performance.</p>",
  "hint": "Write each one in full — the measurable part matters. One-word answers like 'clock' or 'cores' are too ambiguous to credit.",
  "starter": "1: … | 2: … | 3: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 3 marks (1 mark each to max 3)</h5>\n<ul>\n<li>Clock speed</li>\n<li>Cache size</li>\n<li>Number of cores</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>'clock' 'cache' 'speed' 'cores' on its own is NE (not enough).</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Candidates were often able to identify at least one characteristic of a CPU, most commonly the clock speed and number of cores. Some responses were not precise enough as to the characteristics, for example stating 'clock' or 'core' without reference to the speed of the clock, or the number of cores, which were too ambiguous.</p>\n</div>",
   "modelAnswer": "1: Clock speed\n\n2: Cache size\n\n3: Number of cores"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:exam:458943e6",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "exam",
  "type": "written",
  "marks": 1,
  "num": "Q2(a)",
  "question": "<p>The specification of two CPUs is shown in Fig. 1.</p><p>When running a 3D flight simulator, Computer 1 is likely to run faster than Computer 2.</p><p>Using the information in Fig. 1, identify <strong>one</strong> reason for this.</p>",
  "caseStudy": "<p><strong>Fig. 1</strong> — the specification of two CPUs:</p><table><tr><th>Computer 1</th><th>Computer 2</th></tr><tr><td>Clock Speed: 1 GHz</td><td>Clock Speed: 1.4 GHz</td></tr><tr><td>Cache size: 2 MB</td><td>Cache size: 2 MB</td></tr><tr><td>Number of Cores: 4</td><td>Number of Cores: 2</td></tr></table>",
  "hint": "Compare the two spec boxes and find the ONLY thing Computer 1 is ahead on.",
  "starter": "Computer 1 has…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark (AO2 1a)</h5>\n<ul>\n<li>It has more cores.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Although Computer 1 has a lower clock speed than the CPU in Computer 2 it has more cores, which means that it can be faster than Computer 2.</li>\n<li>Any answer relating to splitting a program into processes that be carried out consecutively will be accepted.</li>\n</ul>\n</div>",
   "modelAnswer": "Computer 1 has more cores (4 rather than 2), so more of the flight simulator's work can be processed at the same time."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:exam:68fd4c03",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q2(b)",
  "question": "<p>Identify <strong>two</strong> other parts of a computer that are not in Fig. 1, which could improve the performance of the computers.</p>",
  "caseStudy": "<p><strong>Fig. 1</strong> — the specification of two CPUs:</p><table><tr><th>Computer 1</th><th>Computer 2</th></tr><tr><td>Clock Speed: 1 GHz</td><td>Clock Speed: 1.4 GHz</td></tr><tr><td>Cache size: 2 MB</td><td>Cache size: 2 MB</td></tr><tr><td>Number of Cores: 4</td><td>Number of Cores: 2</td></tr></table>",
  "hint": "Fig. 1 only lists CPU characteristics — so name components elsewhere in the machine that still affect speed.",
  "starter": "1: … | 2: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (AO2 1a)</h5>\n<ul>\n<li>RAM</li>\n<li>SSD</li>\n<li>HDD</li>\n<li>Graphics card (GPU)</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Marks can be awarded for other appropriate responses, e.g. Motherboard, Sound card.</li>\n</ul>\n</div>",
   "modelAnswer": "1: RAM\n\n2: Graphics card (GPU)"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:exam:f47d6963",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q2(c)",
  "question": "<p>Explain <strong>one</strong> reason why the cache size affects the performance of the CPU.</p>",
  "caseStudy": "<p><strong>Fig. 1</strong> — the specification of two CPUs:</p><table><tr><th>Computer 1</th><th>Computer 2</th></tr><tr><td>Clock Speed: 1 GHz</td><td>Clock Speed: 1.4 GHz</td></tr><tr><td>Cache size: 2 MB</td><td>Cache size: 2 MB</td></tr><tr><td>Number of Cores: 4</td><td>Number of Cores: 2</td></tr></table>",
  "hint": "Point + development. Identify what cache does for the CPU, then say 'which means…' and finish the chain with the effect on performance.",
  "starter": "Data can be transferred faster from cache than from RAM, which means…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (AO2 1a)</h5>\n<ul>\n<li>data is transferred faster (1)… …which makes a CPU more efficient (1)</li>\n<li>It is faster to transfer to and from cache (1)… …than transferring to and from RAM (1).</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>1 mark to be awarded for each correct identification and 1 mark to be awarded for the associated explanation to a maximum of 2 marks.</li>\n</ul>\n</div>",
   "modelAnswer": "Instructions and data can be transferred to the CPU faster from cache than from RAM, which means the CPU spends less time waiting and works more efficiently."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:exam:b2d775b7",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q4(a)",
  "question": "<p>The CPU has a clock speed of 3.8 GHz.</p><p>Describe what is meant by a clock speed of 3.8 GHz.</p>",
  "hint": "Two halves for two marks: what clock speed measures, and what the number 3.8 GHz actually translates to. Don't forget 'per second'.",
  "starter": "Clock speed is the number of…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (AO1 1b, AO2 1a) — 1 mark per bullet to max 2</h5>\n<ul>\n<li>The number of FDE cycles run per given time/second // the frequency that the clock 'ticks'</li>\n<li>3.8 billion cycles/instructions …</li>\n<li>…per second</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Do not award: how fast the computer is // speed of CPU</li>\n<li>3.8 = 3,800,000,000</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question was answered well with many candidates able to demonstrate an understanding of the clock speed of a computer. Fewer candidates correctly translated the 3.8 GHz into the correct number of instructions/FDE cycles performed. Less able candidates did not identify an appropriate time frame, for example 'the number of instructions it can process' has a different meaning to 'the number of instructions it can process per second'. Another common misconception was it is the number of instructions it can perform at a time, a processor can only perform one instruction at a time.</p>\n</div>",
   "modelAnswer": "Clock speed is the number of fetch–execute cycles the CPU carries out per second.\n\n3.8 GHz means it carries out about 3.8 billion (3,800,000,000) of those cycles every second."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:exam:d8bd1425",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "exam",
  "type": "written",
  "marks": 3,
  "num": "Q4(b)",
  "question": "<p>Alicia says:</p><p>\"My computer has a quad-core processor, so it will run twice as fast as a computer with a dual-core processor\".</p><p>Explain why this statement is not always true.</p>",
  "hint": "Three marks = three distinct reasons. Think about the tasks, the software, and the OTHER characteristics that differ between two machines.",
  "starter": "The statement is not always true because…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 3 marks (AO1 1b, AO2 2b) — 1 mark per bullet to max 3, e.g.</h5>\n<ul>\n<li>Software may be designed to run on 1 core and not multiple cores // depends on the task(s) …some tasks cannot be split across cores</li>\n<li>Clock speed also affects speed // dual core may have a faster clock speed // quad-core may have slower clock speed …so one task may be run faster/slower</li>\n<li>RAM size also affects speed // Quad-core may have less RAM // amount of VM being used</li>\n<li>Cache size also affects speed // Quad-core may have less cache</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Allow marks for other components that could affect the speed e.g. secondary storage access speed, onboard GPU.</li>\n<li>Award description of concurrent processing.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Most candidates were able to identify other features that could also have an impact on the speed of the computer such as the processor speed, amount of RAM etc. The more able candidates were also able to identify that the tasks being performed will also impact on the speed, for example how software may not be optimised for quad-core, or that a process may have to wait for a different process to finish execution before it can be processed.</p>\n</div>",
   "modelAnswer": "Some tasks cannot be split across cores, and software must be written to use multiple cores — otherwise the extra cores are not used.\n\nThe dual-core computer may have a faster clock speed, so it runs a single task more quickly.\n\nThe quad-core computer may have less RAM or less cache, both of which also affect performance."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:exam:fe331938",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q5(a)",
  "question": "<p>Quinn's current computer specification is shown in Fig. 4.</p><p>Describe the benefits of a dual core processor over a single core processor.</p>",
  "caseStudy": "<p><strong>Fig. 4</strong> — Quinn's current computer specification:</p><ul><li>1.5 GHz Dual Core Processor</li><li>1GB RAM</li><li>100GB Hard Drive</li><li>64KB Cache</li><li>Touchscreen</li><li>Integrated camera and speakers</li><li>2 × USB 3.0 ports</li><li>2 × USB 2.0 ports</li><li>Blu-ray drive</li><li>2GB Graphics Card</li></ul>",
  "hint": "You must give the splitting/multitasking idea FIRST — 'it is faster' only earns a mark once you've said what makes it faster.",
  "starter": "Tasks can be split between the two processors, so…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (2 from)</h5>\n<ul>\n<li>Tasks can split between the processors… …tasks / processes / software / can be processed faster …more processes completed per second</li>\n<li>Allows multitasking // Run more than one process / task / instruction / data at a time / per clock cycle… … tasks / processes / software / can be processed faster …more processes completed per second</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>MUST have given splitting tasks, or multi-tasking to allow speed.</li>\n<li>Faster can only be given a mark if the first bullet(s) have been given.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question was answered fairly well, candidates were able to express that two processes could be carried out at once, and they then often got a second mark for identifying that this made it faster. Some candidates could not clearly express what was being processed, or simply stated that it was faster which was insufficient as the actual processes are not carried out faster, it is faster because it is completing two processes at the same time.</p>\n</div>",
   "modelAnswer": "Tasks can be split between the two cores, so two processes can be carried out at the same time.\n\nThis means more processes are completed per second, and the computer can multitask more smoothly."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:exam:eefd9aa6",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q5(b)(i)",
  "question": "<p>Quinn is considering upgrading the RAM.</p><p>Describe <strong>two</strong> differences between RAM and ROM.</p>",
  "caseStudy": "<p><strong>Fig. 4</strong> — Quinn's current computer specification:</p><ul><li>1.5 GHz Dual Core Processor</li><li>1GB RAM</li><li>100GB Hard Drive</li><li>64KB Cache</li><li>Touchscreen</li><li>Integrated camera and speakers</li><li>2 × USB 3.0 ports</li><li>2 × USB 2.0 ports</li><li>Blu-ray drive</li><li>2GB Graphics Card</li></ul>",
  "hint": "Write BOTH sides of each difference in the same space — 'RAM is volatile, whereas ROM is non-volatile'. Describing only RAM in box 1 and only ROM in box 2 loses marks.",
  "starter": "Difference 1: RAM …, whereas ROM … | Difference 2: RAM …, whereas ROM …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (Max 2 per difference, 1 for RAM, 1 for ROM) e.g.</h5>\n<ul>\n<li>RAM is volatile / ROM is non-volatile</li>\n<li>RAM stores currently running instructions / programs / applications / OS / data — ROM stores boot-up instructions / bios</li>\n<li>RAM can be changed / ROM (normally) cannot be changed</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Do not allow e.g. \"ROM is not…\" for the 2nd mark.</li>\n<li>Mark in pairs.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question was answered well, with candidates able to express the differences between RAM and ROM, although many candidates gave a full description of one in the first difference space, and a full description of the second in the second difference space. Candidates should be writing both sides of the difference in the given space. Some candidates only gave one side of the difference, or did not full describe both sides.</p>\n</div>",
   "modelAnswer": "Difference 1: RAM is volatile, so it loses its contents when the power is turned off, whereas ROM is non-volatile and keeps its contents.\n\nDifference 2: RAM stores the programs and data currently running, whereas ROM stores the boot-up instructions (the BIOS)."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:exam:b9026c53",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q5(b)(ii)",
  "question": "<p>Quinn has decided to upgrade the RAM on his computer. Explain why this would improve the computer's performance.</p>",
  "caseStudy": "<p><strong>Fig. 4</strong> — Quinn's current computer specification:</p><ul><li>1.5 GHz Dual Core Processor</li><li>1GB RAM</li><li>100GB Hard Drive</li><li>64KB Cache</li><li>Touchscreen</li><li>Integrated camera and speakers</li><li>2 × USB 3.0 ports</li><li>2 × USB 2.0 ports</li><li>Blu-ray drive</li><li>2GB Graphics Card</li></ul>",
  "hint": "Look at Quinn's spec — he only has 1GB of RAM. Think about what happens when RAM fills up, and what the computer has to use instead.",
  "starter": "With more RAM, …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (2 from)</h5>\n<ul>\n<li>More instructions / programs / applications can run at the same time / be held in RAM</li>\n<li>Open software faster / respond faster</li>\n<li>More memory space for current programs</li>\n<li>Run more memory intensive programs / relevant example e.g. computer games / graphic rendering</li>\n<li>reduces use of Virtual Memory …..less use of hard drive which is slower to access</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Many candidates were able to identify that virtual memory would be relied on less. Fewer candidates could identify that more programs could be open at once, a common error was that the computer could store more data or more programs which was referring to secondary storage.</p>\n</div>",
   "modelAnswer": "With more RAM, more programs and data can be held in memory at the same time, so more can run at once and they respond faster.\n\nIt also reduces the use of virtual memory, so the computer relies less on the hard drive, which is much slower to access."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:exam:83f65e00",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "exam",
  "type": "written",
  "marks": 6,
  "num": "Q5(b)(iii)*",
  "question": "<p>*After upgrading the RAM, Quinn could make further changes to improve his computer's performance.</p><p>Identify the changes and explain how these changes would improve performance.</p><p><em>The quality of your written communication will be assessed in your answer.</em></p>",
  "caseStudy": "<p><strong>Fig. 4</strong> — Quinn's current computer specification:</p><ul><li>1.5 GHz Dual Core Processor</li><li>1GB RAM</li><li>100GB Hard Drive</li><li>64KB Cache</li><li>Touchscreen</li><li>Integrated camera and speakers</li><li>2 × USB 3.0 ports</li><li>2 × USB 2.0 ports</li><li>Blu-ray drive</li><li>2GB Graphics Card</li></ul>",
  "hint": "Several upgrades, each with a detailed 'how'. Don't re-explain RAM (that was the last question), and avoid peripherals like touchscreens — they don't affect performance.",
  "starter": "One change Quinn could make is… This would improve performance because…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 6 marks (levelled, QWC assessed) — indicative content</h5>\n<ul>\n<li><strong>Increase processor clock speed</strong> — Run more FE cycles per second; Faster response; Smoother actions; Less likely to freeze</li>\n<li><strong>Add more cores</strong> — Run more tasks simultaneously; Better performance for programs that are programmed for multi-core systems, e.g. new computer games</li>\n<li><strong>Increase cache size</strong> — Cache stores frequently used instructions / programs / data; Can store more so increase access speed to more frequently used instructions / programs / data</li>\n<li><strong>New graphics card</strong> — Can carry out more processes for CPU; Can improve speed and quality of graphics</li>\n<li><strong>Change hard disk drive to SSD</strong> — faster read / write speed</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given — levels of response</h5>\n<ul>\n<li><strong>High Level Response (5–6):</strong> Several upgrades are identified and there is a detailed explanation of how each of these will impact the computer given in the example. There will be few if any errors in spelling, grammar and punctuation. Technical terms will be used appropriately and correctly.</li>\n<li><strong>Medium Level Response (3–4):</strong> Upgrades are identified, although how these would improve the performance may be weak. There may be occasional errors in spelling, grammar and punctuation. Technical terms will be mainly correct.</li>\n<li><strong>Low Level Response (1–2):</strong> There is an attempt to identify upgrades that could be made. There may be little or no explanation of how these improve performance. The points are poorly expressed or are not related to the context. There is limited, if any, use of technical terms. Errors in grammar, punctuation and spelling may be intrusive.</li>\n<li>Allow defragmentation and reducing the read time for the hard disk.</li>\n<li>Do not allow hard drive if referring to secondary storage size, allow for increasing amount of VM.</li>\n<li>Do not allow: Increasing RAM; Upgrading components that do not affect performance (e.g. peripherals).</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question was answered well by the majority of candidates, who were able to give a structured response. Most candidates could identify a number of different improvements that could be made. A small number of candidates did not answer the question, and gave a description of how RAM improvers the computer, repeating their response to Q.6(b)(ii). Some candidates described hardware that would not affect the performance, such as using a touch screen and adding a printer.</p>\n</div>",
   "modelAnswer": "Quinn could increase the processor's clock speed. This would run more fetch–execute cycles every second, so the computer responds faster and is less likely to freeze.\n\nHe could increase the cache size from 64KB. Cache stores the instructions used most frequently, so a larger cache means more of them are held close to the CPU and fetched without waiting for RAM.\n\nHe could replace the 100GB hard drive with an SSD. An SSD has much faster read and write speeds, so programs and files load more quickly.\n\nHe could also add more cores, allowing more tasks to be processed at the same time — although this only helps for software written for multi-core systems."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:exam:f27d8bce",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "exam",
  "type": "written",
  "marks": 8,
  "num": "Q6",
  "question": "<p>Even though the computer devices they own still work, people often want to buy the most up-to-date models, such as the latest smartphone.</p><p>Discuss the impact of people wanting to upgrade to the latest smartphone.</p><p>In your answer you might consider the impact on:</p><ul><li>stakeholders</li><li>technology</li><li>ethical issues</li><li>environmental issues</li></ul>",
  "hint": "Use all four bullets as your plan — the top band needs all the areas AND both sides weighed. Make chains: point → effect → consequence. Spend about 10–12 minutes.",
  "starter": "One impact on stakeholders is… This means… As a result…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 8 marks (levelled) — indicative content</h5>\n<p>The following is indicative of possible factors/evidence that candidates may refer to but is not prescriptive or exhaustive:</p>\n<ul>\n<li><strong>Stakeholders</strong> — Can adversely affect people in this country and abroad: health issues; financially; socially; culturally. The phone manufacturers. The phone shops/networks.</li>\n<li><strong>Technology</strong> — The type of devices that are disposed of; Modern phones poorly designed for durability; Phones hardware not upgradeable/replaceable; Proprietary technology used by some manufacturers.</li>\n<li><strong>Environmental</strong> — Reference to e-waste (people dispose of their devices in landfill even if they are in good working order); Some equipment is also sent abroad to be disposed of; Leads to excessive landfill (in this country and/or abroad, e.g. Africa and Asia); Toxic waste released into land, ground water, air; Waste of resources — precious metals in phones.</li>\n<li><strong>Ethical Issues</strong> — Contributes to ill health; Contributes to the digital divide; Contributes to social divide; Problem of confidential data stored on the devices; Puts social pressure on parents to pay for their children to upgrade; Puts social pressure on the public to upgrade; Can lead to bullying of those who cannot afford the latest technology; Phone manufacturers intentionally designing fragile phones so they need to be replaced more often; High cost of new devices.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given — levels of response</h5>\n<ul>\n<li><strong>Mark Band 3 — High Level (6–8 marks):</strong> The candidate demonstrates a thorough knowledge and understanding of a wide range of considerations in relation to the question; the material is generally accurate and detailed. The candidate is able to apply their knowledge and understanding directly and consistently to the context provided. Evidence/examples will be explicitly relevant to the explanation. The candidate is able to weigh up both sides of the discussion and includes reference to the impact on all areas showing thorough recognition of influencing factors. There is a well-developed line of reasoning which is clear and logically structured. The information presented is relevant and substantiated.</li>\n<li><strong>Mark Band 2 — Mid Level (3–5 marks):</strong> The candidate demonstrates reasonable knowledge and understanding of a range of considerations in relation to the question; the material is generally accurate but at times underdeveloped. The candidate is able to apply their knowledge and understanding directly to the context provided although one or two opportunities are missed. Evidence/examples are for the most part implicitly relevant to the explanation. The candidate makes a reasonable attempt to discuss the impact on most areas, showing reasonable recognition of influencing factors. There is a line of reasoning presented with some structure. The information presented is in the most part relevant and supported by some evidence.</li>\n<li><strong>Mark Band 1 — Low Level (1–2 marks):</strong> The candidate demonstrates a basic knowledge of considerations with limited understanding shown; the material is basic and contains some inaccuracies. The candidate makes a limited attempt to apply acquired knowledge and understanding to the context provided. The candidate provides nothing more than an unsupported assertion. The information is basic and communicated in an unstructured way. The information is supported by limited evidence and the relationship to the evidence may not be clear.</li>\n<li><strong>0 marks:</strong> No attempt to answer the question or response is not worthy of credit.</li>\n</ul>\n</div>",
   "modelAnswer": "Stakeholders: phone manufacturers and networks benefit financially from frequent upgrades, but consumers are affected too — the high cost of new devices puts financial and social pressure on families, and those who cannot afford the latest model can face bullying.\n\nTechnology: many modern phones are poorly designed for durability and their hardware cannot be upgraded or replaced, so the only option is to buy a new device. Some manufacturers use proprietary technology, which locks users in further.\n\nEthical: constant upgrading widens the digital divide between those who can and cannot afford new technology, and old devices often still hold confidential data. Some argue manufacturers deliberately design phones with short lifespans.\n\nEnvironmental: working phones are thrown away, creating e-waste that goes to landfill here or is shipped abroad to countries in Africa and Asia. Toxic materials leak into land, groundwater and air, and precious metals inside the phones are wasted.\n\nOn balance, while the industry and its customers gain from newer, more capable technology, the environmental and ethical costs of replacing working devices are severe — and they fall hardest on people who did not choose the upgrade cycle."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:db3431b4",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which three characteristics of a CPU affect its performance?",
  "options": [
   "Clock speed, cache size, number of cores",
   "RAM, ROM, cache",
   "Clock speed, RAM size, hard drive size",
   "Number of cores, screen size, graphics card"
  ],
  "key": {
   "answer": 0,
   "explain": "Those are the only three the specification asks about. RAM, storage and the graphics card affect the computer's performance, but they are not characteristics of the CPU itself."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:bd45d138",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Clock speed is measured in hertz. What does 1 Hz mean?",
  "options": [
   "One instruction stored in cache",
   "One fetch–execute cycle per second",
   "One billion fetch–execute cycles per second",
   "One core completing an instruction"
  ],
  "key": {
   "answer": 1,
   "explain": "1 Hz = one cycle per second. So gigahertz (GHz) means billions of fetch–execute cycles every second."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:49f5fbb2",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A CPU has a clock speed of 3.8 GHz. How many fetch–execute cycles is that per second?",
  "options": [
   "3.8 thousand",
   "3.8 million",
   "3.8 billion",
   "3.8 trillion"
  ],
  "key": {
   "answer": 2,
   "explain": "Giga means billion, so 3.8 GHz = 3.8 billion (3,800,000,000) cycles every second."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:4cbd0cd1",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Why is 'it can process 3.8 billion instructions' NOT a full answer for what 3.8 GHz means?",
  "options": [
   "The number is wrong — giga means million, not billion",
   "It leaves out the time frame — it must be per second",
   "It should say 'data' instead of 'instructions', since the CPU processes data",
   "GHz measures the size of the cache, not the number of instructions"
  ],
  "key": {
   "answer": 1,
   "explain": "Without 'per second' the statement means nothing — 3.8 billion instructions over what period? Examiners refuse answers with no time frame."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:555ee404",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "What does cache store?",
  "options": [
   "All of the user's saved files and folders",
   "The instructions and data used most frequently",
   "The boot-up instructions used to start the computer",
   "A complete copy of everything currently running"
  ],
  "key": {
   "answer": 1,
   "explain": "Cache holds frequently (or recently, or next-to-be) used instructions and data, right inside the CPU, so they can be fetched without going out to slower RAM."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:d024043d",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Why does increasing the cache size usually improve performance?",
  "options": [
   "It raises the CPU's clock speed, so more cycles happen every second",
   "More frequently used instructions sit closer to the CPU, so RAM is used less often",
   "It adds an extra processing core, so two separate instructions can run at exactly the same time",
   "It increases the amount of RAM installed inside the computer"
  ],
  "key": {
   "answer": 1,
   "explain": "A bigger cache holds more of what the CPU keeps reaching for, so there are fewer slow trips out to RAM and less waiting."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:ef70cc29",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which statement about a very large cache is TRUE?",
  "options": [
   "More cache always improves performance without any limit whatsoever",
   "Beyond a point, extra cache helps less because it takes longer to search",
   "Cache size has no effect on performance, only clock speed and cores matter",
   "A large cache completely replaces the need for RAM in a modern computer"
  ],
  "key": {
   "answer": 1,
   "explain": "Cache is expensive and a very large cache takes longer to search through, so the benefit tails off — a genuinely creditworthy point in the mark scheme."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:168dc3de",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "What is a core?",
  "options": [
   "A block of cache memory used to store frequently accessed instructions",
   "A processing unit that can run its own fetch–execute cycle",
   "The internal clock inside the CPU that controls its cycle timing",
   "A type of RAM used to temporarily hold currently running programs"
  ],
  "key": {
   "answer": 1,
   "explain": "Each core is a complete processing unit, so a dual-core CPU can execute two separate instructions at the same time."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:cd5329ff",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A dual-core processor may improve performance because...",
  "options": [
   "it runs exactly twice as many instructions in every single second",
   "each core can execute a separate instruction at the same time",
   "it automatically doubles the clock speed of the entire processor",
   "it removes the need for any cache memory inside the CPU"
  ],
  "key": {
   "answer": 1,
   "explain": "The creditworthy idea is parallel processing — the cores working simultaneously. 'Twice as many instructions per second' is refused because a faster clock could do that too."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:3149ca29",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Alicia says a quad-core computer must run twice as fast as a dual-core one. Why is she not always right?",
  "options": [
   "Quad-core processors have no cache memory built into them at all",
   "Some tasks cannot be split across cores, and software must be written to use them",
   "Four cores will always run slower than two, whatever the software",
   "Clock speed makes no difference to performance at all, only the number of cores matters"
  ],
  "key": {
   "answer": 1,
   "explain": "Extra cores only help when the work can actually be divided and the software is written for multiple cores. Clock speed, cache and RAM differences matter too."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:20db184d",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Computer 1: 1 GHz, 4 cores. Computer 2: 1.4 GHz, 2 cores (same cache). Why might Computer 1 run a 3D flight simulator faster?",
  "options": [
   "It has a higher clock speed than Computer 2, so instructions run faster",
   "It has more cache than Computer 2, so it fetches from RAM less often",
   "It has more cores, so more work can be processed at the same time",
   "It has more RAM installed than Computer 2, so more can be loaded at once"
  ],
  "key": {
   "answer": 2,
   "explain": "Core count is Computer 1's only advantage — and demanding software like a flight simulator is written to split work across cores, outweighing the slightly faster clock."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:mcq:0388a9fa",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which of these is NOT a characteristic of the CPU, but WOULD improve a computer's performance?",
  "options": [
   "Increasing the CPU's cache size",
   "Increasing the CPU's clock speed",
   "Adding more cores to the CPU",
   "Upgrading the amount of RAM"
  ],
  "key": {
   "answer": 3,
   "explain": "RAM is one of the 'other parts' of the computer. It improves performance (less reliance on slow virtual memory) but it is not a characteristic of the CPU."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:tf:67815a44",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Writing 'clock' as a characteristic of the CPU is enough to earn the mark.",
  "key": {
   "answer": false,
   "explain": "It must be 'clock speed'. Every CPU has a clock — what varies, and what affects performance, is how fast it ticks. The same applies to 'cores' (say 'number of cores') and 'cache' (say 'cache size')."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:tf:b84d8bf0",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "A clock speed of 2 GHz means the CPU carries out 2 billion fetch–execute cycles per second.",
  "key": {
   "answer": true,
   "explain": "Correct — giga means billion, and hertz means cycles per second."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:tf:0ccb4af0",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "A single core can execute several instructions at exactly the same time.",
  "key": {
   "answer": false,
   "explain": "One core handles one instruction at a time — it is simply very fast. Executing instructions genuinely simultaneously is what extra cores provide."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:tf:e10c6bdd",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "A quad-core processor always runs twice as fast as a dual-core processor.",
  "key": {
   "answer": false,
   "explain": "Only if the work can be split and the software is written to use four cores. Clock speed, cache and RAM also differ between machines — this exact claim is a favourite exam question."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:tf:ee64bacb",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Cache can be accessed faster than RAM.",
  "key": {
   "answer": true,
   "explain": "True — but on its own that sentence earns nothing in an exam. You must add what it leads to: fewer slow trips to RAM, so the CPU waits less and performance improves."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:tf:1466864b",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Increasing cache size improves performance without limit — the more the better, always.",
  "key": {
   "answer": false,
   "explain": "Beyond a point the benefit tails off: a very large cache takes longer to search, and cache is expensive. Recognising that limit is a creditworthy point."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:tf:4303c004",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "RAM is volatile and ROM is non-volatile.",
  "key": {
   "answer": true,
   "explain": "Correct — RAM loses its contents when the power goes off; ROM keeps the boot-up instructions permanently."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:tf:fc459520",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Adding more RAM helps because it reduces how much the computer has to use virtual memory.",
  "key": {
   "answer": true,
   "explain": "Yes — when RAM fills up the computer overflows onto secondary storage (virtual memory), which is far slower. More RAM means less of that swapping."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:learn:65ce059d",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "What actually makes a CPU fast?",
  "reading": "<h4>The three characteristics you must know</h4>\n<ul>\n<li>OCR only ever asks about <strong>three</strong> characteristics of the CPU itself:</li>\n<li><strong>Clock speed</strong> — how many fetch–execute cycles it can run each second.</li>\n<li><strong>Cache size</strong> — how much very fast memory sits inside the CPU.</li>\n<li><strong>Number of cores</strong> — how many processing units the CPU has.</li>\n<li>Learn those three as a set. A question worth 3 marks that says \"give three characteristics of a CPU that affect its performance\" is asking for exactly this list.</li>\n</ul>\n<h4>Say the whole phrase, every time</h4>\n<ul>\n<li>The single most expensive mistake on this topic is writing half the term. <strong>\"Clock\" is not an answer — \"clock speed\" is.</strong> <strong>\"Cores\" is not an answer — \"number of cores\" is.</strong> \"Cache\" on its own is not an answer — \"cache size\" is.</li>\n<li>Why? Because a characteristic must be something that can be <em>measured or changed</em>. Every CPU has a clock and has cores; what differs between CPUs is the <strong>speed</strong> of the clock and the <strong>number</strong> of cores.</li>\n</ul>\n<h4>The CPU isn't the whole story</h4>\n<ul>\n<li>Other parts of the computer also affect how fast it feels: <strong>RAM</strong>, <strong>secondary storage</strong> (an SSD instead of a hard disk drive), and the <strong>graphics card (GPU)</strong>.</li>\n<li>Keep these in a separate mental box. If a question says \"characteristics of <em>the CPU</em>\", RAM scores nothing. If it says \"other parts that could improve performance\", RAM/SSD/GPU are exactly what's wanted.</li>\n</ul>",
  "question": "A question asks for three characteristics of a CPU that affect performance. Which answer would score full marks?",
  "options": [
   "Clock, cache and cores, without stating speed, size or number",
   "Clock speed, cache size, number of cores",
   "RAM capacity, SSD storage space, graphics card power",
   "Processing speed, internal memory, power consumption"
  ],
  "key": {
   "answer": 1,
   "explain": "The three characteristics must be stated in full — it is the clock SPEED, the cache SIZE and the NUMBER of cores that vary between CPUs. RAM/SSD/GPU are other parts of the computer, not characteristics of the CPU."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:learn:102314ba",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Clock speed — how many cycles per second?",
  "reading": "<h4>What clock speed actually measures</h4>\n<ul>\n<li>The CPU has a <strong>clock</strong> that \"ticks\" at a fixed rate. On each tick the CPU carries out one <strong>fetch–execute cycle</strong>.</li>\n<li><strong>Clock speed is the number of fetch–execute cycles the CPU can carry out per second.</strong> It is measured in <strong>hertz (Hz)</strong>: 1 Hz = 1 cycle per second.</li>\n<li><strong>GHz (gigahertz) = billions of cycles per second.</strong> So a <strong>3.8 GHz</strong> processor performs about <strong>3.8 billion fetch–execute cycles every second</strong> (3,800,000,000).</li>\n</ul>\n<h4>The exam translation you must be able to do</h4>\n<ul>\n<li>\"Describe what is meant by a clock speed of 3.8 GHz\" wants <strong>two</strong> things: what clock speed <em>is</em> (cycles/instructions per second), and the <strong>number</strong> (3.8 billion per second).</li>\n<li>Notice the phrase <strong>\"per second\"</strong>. \"It can process 3.8 billion instructions\" means nothing without a time frame — and it will not be credited.</li>\n</ul>\n<h4>Higher clock speed → better performance</h4>\n<ul>\n<li>More cycles per second means more instructions executed per second, so programs run faster.</li>\n<li>Everyday example: a 3.2 GHz CPU gets through more work each second than a 1.2 GHz CPU, so the same program finishes sooner.</li>\n</ul>\n<h4>One core does one instruction at a time</h4>\n<ul>\n<li>A common misunderstanding: clock speed is <em>not</em> \"how many instructions it does at once\". A single core executes <strong>one instruction at a time</strong> — it just does them extremely quickly, one after another.</li>\n<li>Doing things genuinely <em>at the same time</em> is what extra cores are for (next card but one).</li>\n</ul>",
  "question": "Which answer best describes a clock speed of 2.5 GHz?",
  "options": [
   "The computer is 2.5 times faster than normal",
   "It can carry out 2.5 billion fetch–execute cycles per second",
   "It can process 2.5 billion instructions all at exactly the same moment",
   "It has 2.5 GB of cache memory built into the CPU"
  ],
  "key": {
   "answer": 1,
   "explain": "Clock speed = fetch–execute cycles per second, and 'giga' means billion — so 2.5 GHz is 2.5 billion cycles every second. Not 'at the same time': one core handles one instruction at a time."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:learn:8e5b0e94",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Cache size — a small, fast shortcut",
  "reading": "<h4>A quick recap of what cache is</h4>\n<ul>\n<li><strong>Cache</strong> is a small amount of <strong>very fast memory inside the CPU</strong>. It stores the instructions and data that are <strong>used most frequently</strong> (or are about to be used next).</li>\n<li>The point of it: fetching something from cache is <strong>much faster than fetching it from RAM</strong>. Less waiting = more work done.</li>\n</ul>\n<h4>Why a BIGGER cache improves performance</h4>\n<ul>\n<li>A bigger cache can hold <strong>more</strong> of those frequently used instructions and data.</li>\n<li>So the CPU finds what it needs in cache more often, and has to go out to the slower RAM less often.</li>\n<li>Less time waiting for RAM → the CPU spends more of its time actually processing → better performance. A computer with 512 KB of cache will generally outperform an identical one with 64 KB.</li>\n</ul>\n<h4>The chain the examiner wants</h4>\n<ul>\n<li>Never stop at \"cache is faster than RAM\" — <em>faster at what?</em> That alone earns nothing. Build the chain:</li>\n<li><strong>Cache stores frequently used instructions → these can be accessed faster than from RAM → so more cache means the CPU waits less and performance improves.</strong></li>\n</ul>\n<h4>The clever extra: more isn't infinitely better</h4>\n<ul>\n<li>Cache is expensive, and a very large cache takes <strong>longer to search</strong> — so beyond a point, extra cache stops helping and can even slow things slightly.</li>\n<li>This is a genuinely creditworthy point in the mark scheme, and it's the sort of nuance that separates a top answer.</li>\n</ul>",
  "question": "Why does a computer with 512 KB of cache usually outperform an identical one with 64 KB?",
  "options": [
   "Cache is directly faster than RAM, which alone speeds up every calculation",
   "More frequently used instructions fit in cache, so the CPU fetches from RAM less often",
   "A bigger cache increases the CPU's clock speed, so more cycles run every second",
   "A bigger cache permanently stores the user's files, so nothing needs to reload from disk"
  ],
  "key": {
   "answer": 1,
   "explain": "The mark comes from the CHAIN: more cache holds more frequently used instructions → fewer trips to slower RAM → less waiting → better performance. 'Cache is faster than RAM' on its own is not enough — faster at what?"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:learn:1deb411a",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Number of cores — doing things at the same time",
  "reading": "<h4>What a core is</h4>\n<ul>\n<li>A <strong>core</strong> is a complete processing unit — it can run its own fetch–execute cycle. A <strong>dual core</strong> CPU has 2; a <strong>quad core</strong> has 4.</li>\n<li>Each core can execute <strong>a separate instruction at the same time</strong> as the others. This is called <strong>parallel processing</strong>.</li>\n</ul>\n<h4>Why more cores can improve performance</h4>\n<ul>\n<li>Work can be <strong>split between the cores</strong> and processed simultaneously, so more instructions are completed in the same period of time.</li>\n<li>It also makes <strong>multitasking</strong> smoother — one core can handle your game while another handles the music playing in the background.</li>\n</ul>\n<h4>The three words that earn the mark: \"at the same time\"</h4>\n<ul>\n<li>Examiners are strict here. \"A dual core can run twice as many instructions\" is <strong>not</strong> enough — that could just be a faster clock.</li>\n<li>You must say the cores act <strong>simultaneously</strong>: <em>each core can execute a separate instruction at the same time.</em> That is the idea being tested.</li>\n</ul>\n<h4>Why twice the cores ≠ twice the speed</h4>\n<ul>\n<li><strong>Some tasks cannot be split.</strong> If a job must be done in order — step 2 needs the answer from step 1 — extra cores sit idle.</li>\n<li><strong>Software must be written to use multiple cores.</strong> Older programs designed for one core get no benefit from three spare ones.</li>\n<li>So a quad core is <em>not</em> automatically twice as fast as a dual core. This exact claim is a favourite exam question.</li>\n</ul>",
  "question": "Which explanation of dual-core performance would earn the mark?",
  "options": [
   "It can run exactly twice as many instructions every single second",
   "Each core can execute a separate instruction at the same time",
   "It automatically doubles the CPU's clock speed to run faster",
   "It gives the CPU twice as much cache to store instructions in"
  ],
  "key": {
   "answer": 1,
   "explain": "The creditworthy idea is simultaneous execution — parallel processing. 'Twice as many instructions per second' is refused because a faster clock could achieve that; it misses the 'at the same time' point entirely."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:learn:87b92f1b",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Putting the three together (and why it's never simple)",
  "reading": "<h4>Comparing two CPU specifications</h4>\n<ul>\n<li>Exam questions love giving you two spec boxes and asking which is faster, and why. The trick: <strong>the winner is rarely ahead on everything.</strong></li>\n<li>Worked example — Computer 1: 1 GHz, 4 cores. Computer 2: 1.4 GHz, 2 cores. Which runs a 3D flight simulator better?</li>\n<li>Computer 1, <strong>because it has more cores</strong>. A flight simulator is exactly the kind of demanding software written to split work across cores — so four cores working simultaneously beat a slightly faster clock on two.</li>\n<li>Notice what a full answer does: it names the characteristic that <em>differs and matters</em>, and links it to the task.</li>\n</ul>\n<h4>The characteristics interact</h4>\n<ul>\n<li>A high clock speed with a tiny cache means the CPU is fast but keeps waiting for RAM.</li>\n<li>Lots of cores with software that can't use them is wasted silicon.</li>\n<li>That's why the spec says you must understand the effect of these characteristics <strong>individually and in combination</strong>.</li>\n</ul>\n<h4>How to improve a computer's performance (a whole-machine view)</h4>\n<ul>\n<li><strong>Increase the clock speed</strong> → more FE cycles per second → faster response, smoother action.</li>\n<li><strong>Add more cores</strong> → more tasks run simultaneously → better for software written for multi-core.</li>\n<li><strong>Increase cache size</strong> → more frequently used instructions held close to the CPU → faster access.</li>\n<li><strong>Add a better graphics card</strong> → takes graphics work off the CPU → improves speed and image quality.</li>\n<li><strong>Swap an HDD for an SSD</strong> → much faster read/write → programs and files load quicker.</li>\n<li>Each one only earns full marks when you say <strong>how</strong> it improves performance, not just that it does.</li>\n</ul>",
  "question": "Computer A: 1 GHz, 4 cores. Computer B: 1.4 GHz, 2 cores. Both have 2 MB cache. Why might A run a demanding 3D game better?",
  "options": [
   "It has a higher clock speed than Computer B, so each instruction runs faster",
   "It has more cores, so more of the work can be processed at the same time",
   "It has a bigger cache than Computer B, so it fetches from RAM less often",
   "It has more RAM installed than Computer B, so more of the game loads at once"
  ],
  "key": {
   "answer": 1,
   "explain": "A's only advantage is its core count — and demanding software like a 3D game is usually written to split work across cores, so four working simultaneously outweigh B's slightly faster clock."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:learn:ff08701f",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "RAM, virtual memory and why upgrading RAM helps",
  "reading": "<h4>RAM is not a CPU characteristic — but it does affect performance</h4>\n<ul>\n<li>Exam questions on this topic often drift into RAM, because it is one of the \"other parts\" that changes how fast a computer feels. Know the difference between the two ideas.</li>\n<li><strong>RAM</strong> holds the programs and data that are <strong>currently running</strong>. The CPU fetches instructions from RAM.</li>\n</ul>\n<h4>Why more RAM improves performance</h4>\n<ul>\n<li><strong>More programs/data can be held in RAM at once</strong>, so more can run at the same time and they respond faster.</li>\n<li>It allows more memory-hungry software (video editing, 3D games) to run properly.</li>\n<li>Crucially: it <strong>reduces the use of virtual memory</strong>. When RAM fills up, the computer starts using space on the <strong>secondary storage</strong> as overflow — and that is far slower to access. Less swapping = a noticeably faster machine.</li>\n</ul>\n<h4>The RAM vs ROM difference (a guaranteed exam pair)</h4>\n<ul>\n<li><strong>Volatility:</strong> RAM is <strong>volatile</strong> (contents lost when power is off); ROM is <strong>non-volatile</strong> (contents kept).</li>\n<li><strong>Contents:</strong> RAM stores currently running programs, data and the OS; ROM stores the <strong>boot-up instructions</strong> (the BIOS).</li>\n<li><strong>Changeability:</strong> RAM can be written to and changed constantly; ROM normally cannot be changed.</li>\n<li>When asked for a <em>difference</em>, write <strong>both sides in the same space</strong>: \"RAM is volatile, whereas ROM is non-volatile.\" Describing only RAM in box 1 and only ROM in box 2 is the classic way to lose these marks.</li>\n</ul>",
  "question": "Why does adding more RAM usually make a computer feel faster?",
  "options": [
   "It increases the CPU's clock speed, so more cycles are completed each second",
   "More running programs fit in RAM, so less virtual memory is used",
   "It adds more processing cores to the CPU, enabling parallel execution of tasks",
   "It permanently stores more files and programs even when the power is switched off"
  ],
  "key": {
   "answer": 1,
   "explain": "More RAM means more currently running programs and data fit in fast memory, so the computer swaps out to virtual memory (on much slower secondary storage) far less often."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:misc:3b234384",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Listing 'clock', 'cache' and 'cores' as the three characteristics of a CPU.</p><p><strong>✅ The correct idea:</strong> Each one is missing the part that actually varies. It is the clock <strong>speed</strong>, the cache <strong>size</strong> and the <strong>number of</strong> cores. Real candidates lost marks here for exactly this: writing 'clock' or 'core' without saying speed or number is too ambiguous to credit. Three words cost three marks.</p>",
  "question": "Which list would score all 3 marks?",
  "options": [
   "Clock, cache and cores, missing the qualifying words",
   "Clock speed, cache size, number of cores",
   "Processing speed, internal memory, number of processors",
   "The CPU, RAM and ROM inside the computer"
  ],
  "key": {
   "answer": 1,
   "explain": "The characteristic must be the measurable quantity — speed of the clock, size of the cache, number of the cores."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:misc:f916e158",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> 'A dual core processor is better because it can run twice as many instructions per second.'</p><p><strong>✅ The correct idea:</strong> This is refused, because a faster clock speed could achieve the very same thing — so the sentence doesn't show you understand cores at all. The mark needs the words <strong>at the same time</strong>: each core can execute a separate instruction simultaneously. Weak: 'more processes run per second.' Strong: 'each of the two cores can process a different instruction at the same time.'</p>",
  "question": "Why is 'it runs more instructions per second' refused as an explanation of dual-core benefit?",
  "options": [
   "It is factually wrong, since dual cores never increase throughput",
   "A faster clock speed could also do that — it doesn't show understanding of cores",
   "It should say 'per minute' rather than 'per second', since that's how exams phrase timing",
   "Cores don't affect how many instructions a CPU can process"
  ],
  "key": {
   "answer": 1,
   "explain": "The examiner needs evidence you understand parallel processing specifically, and only 'at the same time' shows that."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:misc:c7f35eb4",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Explaining cache with 'cache is faster than RAM' and stopping there.</p><p><strong>✅ The correct idea:</strong> Faster at <em>what</em>? That question is exactly why this scores zero. Also refused: simply defining cache as 'fast memory close to the CPU'. Build the full chain instead: <strong>cache stores frequently used instructions → they can be accessed faster than from RAM → so more cache means less waiting and better CPU performance.</strong> Many candidates got the first link and stopped; the marks are in the last one.</p>",
  "question": "Which answer completes the chain properly?",
  "options": [
   "Cache is fast memory located near the CPU, and simply being near the CPU is what improves performance, regardless of what it stores",
   "Cache is faster than RAM, so replacing all of a computer's RAM with cache would make it run instructions with no waiting at all",
   "Cache holds frequently used instructions, which are fetched faster than from RAM, so the CPU waits less and performance improves",
   "Cache stores the boot-up instructions needed to start the computer, in the same way that ROM stores the BIOS permanently"
  ],
  "key": {
   "answer": 2,
   "explain": "Only the third links what cache stores → why that's quicker → what it does for performance. The others either overstate what mere proximity to the CPU does, misapply the idea (cache can't simply replace RAM), or describe something cache doesn't store."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:misc:2210308c",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> 'A clock speed of 3.8 GHz means the computer is fast' — or 'it can process 3.8 billion instructions'.</p><p><strong>✅ The correct idea:</strong> The first just repeats the question ('fast' is not a measurement) and is explicitly not credited. The second forgets the <strong>time frame</strong> — 3.8 billion instructions over what period? A full answer has both halves: <strong>clock speed is the number of fetch–execute cycles per second</strong>, and <strong>3.8 GHz = 3.8 billion cycles every second</strong>. A further trap: it is not the number of instructions done <em>at a time</em> — one core does one instruction at a time.</p>",
  "question": "Which is a full 2-mark answer for 'describe what is meant by a clock speed of 3.8 GHz'?",
  "options": [
   "The computer is very fast and can run any modern piece of software smoothly",
   "It performs 3.8 billion instructions in total, however long the program actually takes to run",
   "It is the number of fetch–execute cycles per second — 3.8 billion of them every second",
   "It can do 3.8 billion instructions at exactly the same time, using multiple cores"
  ],
  "key": {
   "answer": 2,
   "explain": "Two marks, two halves: what clock speed measures (cycles per second) and the translation of the number (3.8 billion per second)."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:misc:535ca43e",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> For 'describe two differences between RAM and ROM', writing everything about RAM in box 1 and everything about ROM in box 2.</p><p><strong>✅ The correct idea:</strong> A <strong>difference</strong> needs both sides in the <em>same</em> space: 'RAM is volatile, whereas ROM is non-volatile.' Candidates who described RAM fully in the first box and ROM fully in the second gave two descriptions, not two differences — and lost marks for it. Each difference space is marked as its own pair: 1 mark for the RAM side, 1 for the ROM side.</p>",
  "question": "Which is properly written as ONE difference?",
  "options": [
   "Difference 1: RAM is volatile. Difference 2: ROM stores the BIOS.",
   "Difference 1: RAM is volatile, whereas ROM is non-volatile.",
   "Difference 1: RAM is memory. Difference 2: ROM is memory.",
   "Difference 1: RAM is fast."
  ],
  "key": {
   "answer": 1,
   "explain": "One difference = both sides, contrasted, in the same answer space. The others give one side only, or two unrelated descriptions."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:misc:c02c11a2",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> When asked how to improve a computer's performance, suggesting a touchscreen, a printer, or a bigger hard drive.</p><p><strong>✅ The correct idea:</strong> Peripherals don't make the processor work faster, and extra <em>storage space</em> is not extra speed — candidates genuinely lost marks for both. Stick to changes that affect processing: increase the <strong>clock speed</strong>, add <strong>cores</strong>, increase <strong>cache</strong>, fit a better <strong>graphics card</strong>, or swap an HDD for an <strong>SSD</strong> (faster read/write). And always say <strong>how</strong> the change improves performance — naming it alone is only half the mark.</p>",
  "question": "Which suggestion would earn marks for improving performance?",
  "options": [
   "Add a touchscreen, which lets the user interact with the screen directly and quickly",
   "Add a printer so the computer can produce paper copies of documents",
   "Replace the hard disk drive with an SSD, which has faster read/write speeds",
   "Buy a bigger monitor so more windows can be seen on the screen at once"
  ],
  "key": {
   "answer": 2,
   "explain": "An SSD genuinely speeds up loading. Peripherals like touchscreens, printers and monitors change how you interact with the computer, not how fast it processes."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:tips:513ecf8b",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "explain — 2-mark 'explain' questions: the …which means… chain",
  "reading": "<p>Almost every 2-mark explain on this topic is marked as <strong>point + development</strong>: 1 mark for identifying the right thing, 1 mark for the consequence you link to it. Here is the same answer to <em>\"Explain one reason why the cache size affects the performance of the CPU\"</em> at every level:</p>\n\n<p><strong>❌ 0 marks:</strong> \"Cache is fast memory close to the CPU.\"</p>\n<ul>\n<li>A definition, not a reason. Explicitly not creditworthy — the question asked about <em>performance</em>.</li>\n</ul>\n\n<p><strong>❌ 0 marks:</strong> \"Cache is faster than RAM.\"</p>\n<ul>\n<li>Faster at <em>what</em>? The examiner's own objection. Nothing is linked to performance.</li>\n</ul>\n\n<p><strong>⚠️ 1 mark:</strong> \"Data can be transferred faster from cache.\"</p>\n<ul>\n<li>A correct identification — but the chain stops before it reaches performance.</li>\n</ul>\n\n<p><strong>✅ 2 marks:</strong> \"Data is transferred faster from cache than from RAM <strong>(1)</strong>, <strong>which means</strong> the CPU spends less time waiting and works more efficiently <strong>(1)</strong>.\"</p>\n\n<p><strong>The pattern for every 2-marker here:</strong> name the thing → \"…which means…\" → the effect on performance. If your answer has no linking phrase, you are probably on 1 mark.</p>",
  "question": "You've written 'a bigger cache stores more frequently used instructions'. What must you add for the second mark?",
  "options": [
   "The price of cache, since more expensive components always perform better",
   "The consequence — the CPU fetches from RAM less often, so performance improves",
   "The name of the CPU, so the examiner knows exactly which model you mean",
   "How many cores it has, since that is a completely separate CPU characteristic from cache"
  ],
  "key": {
   "answer": 1,
   "explain": "The second mark is always the development: the effect your point has on performance. Use 'which means…' to force yourself to write it."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:tips:f65c688f",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "evaluate — The 6-mark levelled question (marked with a *)",
  "reading": "<p>A question like <em>\"*Identify the changes and explain how these changes would improve performance\"</em> is <strong>not</strong> point-marked — it is placed in a <strong>band</strong>, and your spelling, grammar and use of technical terms count.</p>\n\n<p><strong>The three bands, in plain terms:</strong></p>\n<ul>\n<li><strong>Low (1–2):</strong> upgrades are named, with little or no explanation of how they help. Points poorly expressed or not linked to the context.</li>\n<li><strong>Mid (3–4):</strong> upgrades identified, but <em>how</em> they improve performance is weak or thin.</li>\n<li><strong>High (5–6):</strong> <strong>several</strong> upgrades, each with a <strong>detailed explanation</strong> of its impact on <em>this</em> computer, written accurately with correct technical terms.</li>\n</ul>\n\n<p><strong>How to land in the top band — a repeatable structure.</strong> For each upgrade write two sentences:</p>\n<ul>\n<li><em>Upgrade:</em> \"Increase the clock speed.\" <em>Impact:</em> \"This runs more fetch–execute cycles per second, so the computer responds faster and is less likely to freeze.\"</li>\n<li><em>Upgrade:</em> \"Increase the cache size.\" <em>Impact:</em> \"More frequently used instructions are stored close to the CPU, so it fetches from slower RAM less often.\"</li>\n<li><em>Upgrade:</em> \"Replace the hard disk drive with an SSD.\" <em>Impact:</em> \"Read and write speeds are much faster, so programs and files load more quickly.\"</li>\n</ul>\n\n<p><strong>Three traps that cost real marks:</strong></p>\n<ul>\n<li><strong>Answering the previous question again.</strong> If an earlier part was about upgrading RAM, do not re-explain RAM here — that earns nothing.</li>\n<li><strong>Suggesting things that don't affect performance</strong> — a touchscreen, a printer, a bigger monitor.</li>\n<li><strong>Naming without explaining.</strong> A list of five upgrades with no \"how\" sits in the low band; two upgrades explained well beat five listed.</li>\n</ul>",
  "question": "A student lists six upgrades but explains none of them. Which band is that?",
  "options": [
   "High (5–6) — they identified lots of upgrades, which is what matters most",
   "Mid (3–4) — several upgrades are identified, each with at least a brief attempt at explaining them",
   "Low (1–2) — upgrades named with little or no explanation of how they improve performance",
   "Full marks — every upgrade correctly named earns the maximum available"
  ],
  "key": {
   "answer": 2,
   "explain": "The band descriptors reward DETAILED EXPLANATION of impact, not the number of items. A long unexplained list is the definition of the low band."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:tips:bc01c060",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "evaluate — The 8-mark 'Discuss' — the one extended response on Paper 1",
  "reading": "<p>Paper 1 has exactly one of these. On this topic it looks like: <em>\"Discuss the impact of people wanting to upgrade to the latest smartphone\"</em>, with bullets suggesting you consider <strong>stakeholders, technology, ethical issues and environmental issues</strong>.</p>\n\n<p><strong>Those bullets are the plan — use all of them.</strong> The top band explicitly requires \"reference to the impact on <strong>all</strong> areas\". Missing one caps you.</p>\n\n<p><strong>What each band needs:</strong></p>\n<ul>\n<li><strong>Band 1 (1–2):</strong> basic knowledge, unsupported assertions, unstructured.</li>\n<li><strong>Band 2 (3–5):</strong> reasonable knowledge applied to the context, but underdeveloped and one or two areas missed.</li>\n<li><strong>Band 3 (6–8):</strong> thorough and detailed; applied <strong>consistently</strong> to the context; <strong>weighs up both sides</strong>; a well-developed, logically structured line of reasoning.</li>\n</ul>\n\n<p><strong>A structure that reaches band 3:</strong></p>\n<ul>\n<li>Take each bullet in turn and make a <strong>chain</strong>: point → effect → consequence. E.g. <em>Environmental:</em> \"Phones are replaced while still working <strong>→</strong> they go to landfill as e-waste, often shipped abroad <strong>→</strong> toxic materials leak into the ground and precious metals are wasted.\"</li>\n<li><strong>Weigh both sides.</strong> Upgrading isn't purely bad: manufacturers and phone shops gain business, and newer technology can be more efficient. A one-sided answer cannot reach the top band.</li>\n<li><strong>Finish with a short conclusion</strong> that actually judges the issue, rather than restating your points.</li>\n</ul>\n\n<p><strong>Timing:</strong> around 10–12 minutes. Spend the first minute jotting one idea under each of the four bullets — that plan is what produces the \"logically structured\" reasoning the band demands.</p>",
  "question": "An answer covers environmental impact in brilliant detail and ignores the other three bullets. What limits the mark?",
  "options": [
   "Nothing — depth on one bullet is all that the mark scheme actually requires",
   "The top band needs the impact on ALL the areas, weighed on both sides",
   "It should have been longer, since length alone determines the band awarded",
   "Environmental issues are not creditworthy in this particular exam question"
  ],
  "key": {
   "answer": 1,
   "explain": "Band 3 requires thorough coverage across the areas AND weighing both sides. Brilliant depth on one bullet is a band 2 answer at best."
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:fib:e47433b9",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "fib",
  "type": "fib",
  "marks": 3,
  "question": "The three characteristics of a CPU that affect performance are clock _____, cache _____ and the number of _____.",
  "blankOptions": {
   "B1": [
    "billion",
    "speed",
    "frequently",
    "RAM"
   ],
   "B2": [
    "size",
    "billion",
    "software",
    "virtual"
   ],
   "B3": [
    "cores",
    "second",
    "frequently",
    "billion"
   ]
  },
  "key": {
   "blanks": {
    "B1": "speed",
    "B2": "size",
    "B3": "cores"
   }
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:fib:85851d8a",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "Clock speed is the number of fetch–execute _____ carried out per _____.",
  "blankOptions": {
   "B1": [
    "cycles",
    "RAM",
    "time",
    "software"
   ],
   "B2": [
    "RAM",
    "billion",
    "second",
    "speed"
   ]
  },
  "key": {
   "blanks": {
    "B1": "cycles",
    "B2": "second"
   }
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:fib:ee5327b5",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "A clock speed of 3.8 GHz means about 3.8 _____ cycles every second.",
  "blankOptions": {
   "B1": [
    "speed",
    "second",
    "time",
    "billion"
   ]
  },
  "key": {
   "blanks": {
    "B1": "billion"
   }
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:fib:0b6e8e3d",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "Cache stores the instructions and data that are used most _____, and it can be accessed faster than _____.",
  "blankOptions": {
   "B1": [
    "frequently",
    "speed",
    "software",
    "cycles"
   ],
   "B2": [
    "RAM",
    "cycles",
    "time",
    "cores"
   ]
  },
  "key": {
   "blanks": {
    "B1": "frequently",
    "B2": "RAM"
   }
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:fib:bf68c906",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "Each core can execute a separate instruction at the same _____ — this is called _____ processing.",
  "blankOptions": {
   "B1": [
    "size",
    "split",
    "time",
    "cores"
   ],
   "B2": [
    "size",
    "parallel",
    "volatile",
    "cycles"
   ]
  },
  "key": {
   "blanks": {
    "B1": "time",
    "B2": "parallel"
   }
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:fib:1da993fa",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "Doubling the cores does not double the speed, because some tasks cannot be _____ and the _____ must be written to use several cores.",
  "blankOptions": {
   "B1": [
    "second",
    "split",
    "boot-up",
    "volatile"
   ],
   "B2": [
    "size",
    "second",
    "software",
    "billion"
   ]
  },
  "key": {
   "blanks": {
    "B1": "split",
    "B2": "software"
   }
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:fib:9d5ef6ab",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "RAM is _____, whereas ROM is non-volatile and stores the _____ instructions.",
  "blankOptions": {
   "B1": [
    "volatile",
    "cores",
    "time",
    "size"
   ],
   "B2": [
    "RAM",
    "frequently",
    "billion",
    "boot-up"
   ]
  },
  "key": {
   "blanks": {
    "B1": "volatile",
    "B2": "boot-up"
   }
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:fib:12359317",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "Adding more RAM improves performance because the computer relies less on _____ memory, which is stored on much slower secondary storage.",
  "blankOptions": {
   "B1": [
    "virtual",
    "cycles",
    "second",
    "software"
   ]
  },
  "key": {
   "blanks": {
    "B1": "virtual"
   }
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:31f47c95",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Clock speed”?",
  "options": [
   "Volatile memory holding the programs and data currently running",
   "Faster read/write speeds than a hard disk drive, so programs load quicker",
   "The number of fetch–execute cycles the CPU carries out per second",
   "Non-volatile memory holding the boot-up instructions (BIOS)"
  ],
  "key": {
   "answer": 2,
   "explain": "“Clock speed” means: The number of fetch–execute cycles the CPU carries out per second"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:82720735",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Hertz (Hz)”?",
  "options": [
   "The unit of clock speed — one cycle per second",
   "Small, very fast memory inside the CPU holding frequently used instructions and data",
   "Space on secondary storage used as overflow when RAM is full — much slower to access",
   "A processing unit that can run its own fetch–execute cycle"
  ],
  "key": {
   "answer": 0,
   "explain": "“Hertz (Hz)” means: The unit of clock speed — one cycle per second"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:0c144bbf",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Gigahertz (GHz)”?",
  "options": [
   "Volatile memory holding the programs and data currently running",
   "A processing unit that can run its own fetch–execute cycle",
   "Billions of fetch–execute cycles per second",
   "More frequently used instructions held close to the CPU, so fewer slow trips to RAM"
  ],
  "key": {
   "answer": 2,
   "explain": "“Gigahertz (GHz)” means: Billions of fetch–execute cycles per second"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:bc06b20b",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Cache”?",
  "options": [
   "Several cores each executing a separate instruction simultaneously",
   "Non-volatile memory holding the boot-up instructions (BIOS)",
   "More frequently used instructions held close to the CPU, so fewer slow trips to RAM",
   "Small, very fast memory inside the CPU holding frequently used instructions and data"
  ],
  "key": {
   "answer": 3,
   "explain": "“Cache” means: Small, very fast memory inside the CPU holding frequently used instructions and data"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:eececb40",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Bigger cache size”?",
  "options": [
   "A CPU with two cores, able to execute two instructions at the same time",
   "More frequently used instructions held close to the CPU, so fewer slow trips to RAM",
   "A processing unit that can run its own fetch–execute cycle",
   "Faster read/write speeds than a hard disk drive, so programs load quicker"
  ],
  "key": {
   "answer": 1,
   "explain": "“Bigger cache size” means: More frequently used instructions held close to the CPU, so fewer slow trips to RAM"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:27321ddc",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Core”?",
  "options": [
   "More frequently used instructions held close to the CPU, so fewer slow trips to RAM",
   "Billions of fetch–execute cycles per second",
   "Small, very fast memory inside the CPU holding frequently used instructions and data",
   "A processing unit that can run its own fetch–execute cycle"
  ],
  "key": {
   "answer": 3,
   "explain": "“Core” means: A processing unit that can run its own fetch–execute cycle"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:2d1ae9f3",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Dual core”?",
  "options": [
   "Non-volatile memory holding the boot-up instructions (BIOS)",
   "A CPU with two cores, able to execute two instructions at the same time",
   "Volatile memory holding the programs and data currently running",
   "A processing unit that can run its own fetch–execute cycle"
  ],
  "key": {
   "answer": 1,
   "explain": "“Dual core” means: A CPU with two cores, able to execute two instructions at the same time"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:f6670354",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Parallel processing”?",
  "options": [
   "Billions of fetch–execute cycles per second",
   "A CPU with two cores, able to execute two instructions at the same time",
   "Several cores each executing a separate instruction simultaneously",
   "Space on secondary storage used as overflow when RAM is full — much slower to access"
  ],
  "key": {
   "answer": 2,
   "explain": "“Parallel processing” means: Several cores each executing a separate instruction simultaneously"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:a8d8ca57",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Multitasking”?",
  "options": [
   "Running more than one program at once, made smoother by extra cores",
   "More frequently used instructions held close to the CPU, so fewer slow trips to RAM",
   "Non-volatile memory holding the boot-up instructions (BIOS)",
   "Volatile memory holding the programs and data currently running"
  ],
  "key": {
   "answer": 0,
   "explain": "“Multitasking” means: Running more than one program at once, made smoother by extra cores"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:dd37f250",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Why more cores isn't always faster”?",
  "options": [
   "Some tasks cannot be split, and software must be written to use them",
   "The number of fetch–execute cycles the CPU carries out per second",
   "Several cores each executing a separate instruction simultaneously",
   "Small, very fast memory inside the CPU holding frequently used instructions and data"
  ],
  "key": {
   "answer": 0,
   "explain": "“Why more cores isn't always faster” means: Some tasks cannot be split, and software must be written to use them"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:482c2ab9",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “RAM”?",
  "options": [
   "Several cores each executing a separate instruction simultaneously",
   "Volatile memory holding the programs and data currently running",
   "Running more than one program at once, made smoother by extra cores",
   "More frequently used instructions held close to the CPU, so fewer slow trips to RAM"
  ],
  "key": {
   "answer": 1,
   "explain": "“RAM” means: Volatile memory holding the programs and data currently running"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:a74ea477",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “ROM”?",
  "options": [
   "Some tasks cannot be split, and software must be written to use them",
   "The unit of clock speed — one cycle per second",
   "Non-volatile memory holding the boot-up instructions (BIOS)",
   "More frequently used instructions held close to the CPU, so fewer slow trips to RAM"
  ],
  "key": {
   "answer": 2,
   "explain": "“ROM” means: Non-volatile memory holding the boot-up instructions (BIOS)"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:885d0ceb",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Virtual memory”?",
  "options": [
   "Some tasks cannot be split, and software must be written to use them",
   "The number of fetch–execute cycles the CPU carries out per second",
   "Space on secondary storage used as overflow when RAM is full — much slower to access",
   "Volatile memory holding the programs and data currently running"
  ],
  "key": {
   "answer": 2,
   "explain": "“Virtual memory” means: Space on secondary storage used as overflow when RAM is full — much slower to access"
  }
 },
 {
  "id": "computer-science:1-1-2-cpu-performance:match:27b5d052",
  "pageId": "computer-science:1-1-2-cpu-performance",
  "pageName": "1.1.2 CPU Performance",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Upgrading to an SSD”?",
  "options": [
   "More frequently used instructions held close to the CPU, so fewer slow trips to RAM",
   "Running more than one program at once, made smoother by extra cores",
   "Faster read/write speeds than a hard disk drive, so programs load quicker",
   "Some tasks cannot be split, and software must be written to use them"
  ],
  "key": {
   "answer": 2,
   "explain": "“Upgrading to an SSD” means: Faster read/write speeds than a hard disk drive, so programs load quicker"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:exam:4c64e085",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "exam",
  "type": "written",
  "marks": 3,
  "num": "Q1",
  "question": "<p>A car has a 'Follow Me' system that uses a cruise control feature to allow the car to follow the car in front of it. It will keep the same speed and distance without the driver's intervention. The cruise control system is an example of an embedded system.</p><p>Explain the reasons why the 'Follow Me' system is an example of an embedded system.</p>",
  "hint": "Three marks means three DIFFERENT characteristics, each applied to the Follow Me system. Most candidates get 'single purpose' and stop — work down your list for the third.",
  "starter": "The Follow Me system is an embedded system because…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 3 marks (1 mark each to max 3)</h5>\n<ul>\n<li>Has a specific purpose // it only performs one/limited task // dedicated to the Follow Me system</li>\n<li>Built within a larger device/car</li>\n<li>Dedicated/specific/its own hardware / sensors</li>\n<li>Has a microprocessor</li>\n<li>Built-in operating system/software // software is all in firmware/ROM … it's instructions/operation does not/is hard to change/update</li>\n<li>It is a control system // it is automated</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>MP2 BOD reference to it being 'built into' 'something' reasonable.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question required candidates to apply their understanding of embedded systems to a different system. Candidates were often able to identify the key features of embedded systems that were relevant to this scenario. The most common points being that the system has a single purpose. Some candidates also identified that the system is built within a larger system, being the car. Fewer candidates were able to provide a third point. Those that did most commonly identified the dedicated hardware or gave an example such as the sensors are only providing data for this system.</p>\n</div>",
   "modelAnswer": "It has one specific purpose — it only keeps the car at a set speed and distance from the car in front, and does nothing else.\n\nIt is built into a larger device: the car itself.\n\nIt has its own dedicated hardware and sensors, which only provide data for this system, and its instructions are held in firmware so they cannot easily be changed."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:exam:294c9bf3",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "exam",
  "type": "written",
  "marks": 3,
  "num": "Q2",
  "question": "<p>A car comes with many embedded systems, for example parking sensors.</p><p>Identify <strong>one other</strong> embedded system that could be found in a car and explain why this is an embedded system.</p>",
  "hint": "The example must be in a CAR (a washing machine scores nothing here). And don't say 'it's built into the car' — the question already told you that.",
  "starter": "Example: … | Explanation: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 3 marks (1 mark for example; 1 mark each to max 2 for explanation)</h5>\n<p><strong>1 mark for example, e.g.</strong></p>\n<ul>\n<li>Auto lights</li>\n<li>Auto window wipers</li>\n<li>Sat nav // GPS</li>\n<li>Airconditioning // climate control</li>\n<li>Radio/entertainment/infotainment system/media system</li>\n<li>Lane assist</li>\n<li>Engine management system</li>\n<li>Auto-park</li>\n<li>Cruise control</li>\n<li>Auto-brake</li>\n<li>Follow-me</li>\n<li>Dashcam</li>\n</ul>\n<p><strong>1 mark each to max 2 for explanation:</strong></p>\n<ul>\n<li>Limited functions // by example e.g. the system only checks the light and turns lights on/off</li>\n<li>Dedicated microprocessor // by example e.g. there is a microprocessor that is only checking the lights</li>\n<li>Hard to change function // by example e.g. the user cannot make the light system do any other role</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Allow anything that could be reasonably within a car.</li>\n<li>If example is not clear if it's an embedded system, read explanation for justification e.g. hazard lights – could be embedded if they are activated automatically when the car crashes. Award the example in the explanation if this occurs.</li>\n<li>If justification is generic features of an embedded system max 1 for explanation.</li>\n<li>Do not award 'built into the car/larger machine' because this is in the question.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question required candidates to consider embedded systems within a car. There were a range of possible systems, the most common being GPS or satellite navigation systems. Other common responses included automated lights, automated wipers, and parking sensors. The most common explanation was that the system has a single (or limited) purpose, but few candidates expanded beyond this. Some candidates repeated that it was built into the car but this was provided in the question. Some candidates provided examples of embedded systems such as a washing machine, a microwave and a fridge/freezer. This was not appropriate to the context of the question.</p>\n</div>",
   "modelAnswer": "Example embedded system: The automatic headlights.\n\nExplanation: The system has only one limited function — it checks the light level outside and switches the headlights on or off. It has its own dedicated microprocessor that does nothing but monitor that sensor, and the driver cannot make the light system perform any other role."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:exam:d275f2a5",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "exam",
  "type": "written",
  "marks": 3,
  "num": "Q3",
  "question": "<p>Ali's tablet computer has an operating system.</p><p>Ali thinks his tablet is an embedded system.</p><p>State whether Ali is correct or incorrect, justifying your choice.</p>",
  "hint": "Whichever choice you make, you MUST apply each point to the tablet — a justification with no reference to the tablet caps you at 2 marks.",
  "starter": "Choice: Ali is … | Justification: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 3 marks (1 mark per bullet to max 3) e.g.</h5>\n<p><strong>Incorrect:</strong></p>\n<ul>\n<li>Embedded system has one/few functions …tablet has multiple functions // tablet is general purpose</li>\n<li>Embedded system is single chip …tablet has multiple chips combined</li>\n<li>Embedded system is part of a larger system … tablet is a self-contained system</li>\n<li>You can update the software</li>\n</ul>\n<p><strong>Correct:</strong></p>\n<ul>\n<li>Embedded system has one/few functions ….the tablet may only be able to perform a small number of tasks …tablet has a specific purpose …tablet's hardware is fixed …does not need/require/allow expansion</li>\n<li>Embedded systems has firmware ..you cannot update the OS in a tablet (usually)</li>\n<li>Embedded system is part of a larger system …tablet may have one microprocessor built into it</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Max 2 if there is no application to the tablet.</li>\n</ul>\n</div>",
   "modelAnswer": "Choice: Ali is incorrect.\n\nJustification: An embedded system has only one or a few dedicated functions, but a tablet is general purpose and has multiple functions — you can use it for almost any task.\n\nAn embedded system is built into a larger device, whereas the tablet is a self-contained system in its own right.\n\nThe software on an embedded system is firmware and cannot normally be changed, but Ali can install and update software on his tablet whenever he likes."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:exam:afcde17a",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q4",
  "question": "<p>The following paragraph describes embedded systems.</p><p>Complete the paragraph by selecting terms from the list and writing them in the correct places. <strong>Not all terms are used.</strong></p>",
  "hint": "Read each whole sentence before choosing. Several terms are deliberate decoys — if you use every word, something has gone wrong.",
  "starter": "(1) … (2) … (3) … (4) …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark for each completed term)</h5>\n<p>Embedded systems have limited <strong>functions</strong>. They are often built into a <strong>larger</strong> machine. Two examples of embedded systems are a <strong>washing machine</strong> and automated <strong>lights</strong> in a car.</p>\n</div>",
   "modelAnswer": "(1) functions\n(2) larger\n(3) washing machine\n(4) lights"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:exam:70ac4718",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "exam",
  "type": "mcq",
  "marks": 1,
  "num": "Q5(i)",
  "question": "<p>Xander's tablet computer comes with system software, including an operating system and utility system software.</p><p>Xander also has a smart watch.</p><p>Tick (✓) <strong>one</strong> box to show whether the smart watch or the laptop is an example of an embedded system.</p>",
  "options": [
   "Smart watch",
   "Laptop"
  ],
  "hint": "Which of the two can only ever do its own small set of jobs?",
  "key": {
   "answer": 0,
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark (AO2 1a)</h5>\n<ul>\n<li><strong>Smart watch</strong> — CAO (correct answer only)</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question was answered correctly by the majority of candidates who were able to identify that a smart watch is an example of an embedded system.</p>\n</div>",
   "modelAnswer": "Smart watch"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:exam:a9b9bf12",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q5(ii)",
  "question": "<p>Justify your choice to part (i).</p>",
  "hint": "Apply it to the smart watch (or say why the laptop is not one) — a generic definition of an embedded system scores nothing here.",
  "starter": "A smart watch is…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (AO2 1b) — 1 mark per bullet for justification to max 2</h5>\n<ul>\n<li>A smart watch is not a general-purpose computer … which means the smart watch has one/limited/specific/dedicated function(s)</li>\n<li>Smart watch has a microprocessor … on a single circuit board</li>\n<li>It is a computer system that is built within the watch</li>\n<li>Runs firmware</li>\n<li>Smart watch has built-in OS // difficult to change/manipulate the OS/function</li>\n<li>Smart watch has few components all essential to its purpose</li>\n<li>Smart watch has specific hardware required to function i.e. speaker/headphones</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Answers must be applied to scenario. Do not award generic definitions.</li>\n<li>Allow opposite reasons for why a laptop is not an embedded system but do not allow repeated points.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Candidates were able to gain marks for explaining why a smart watch is an embedded system or why a laptop is not or a combination of the two. The most common answers referred to the limited features of a smart watch, while a laptop is a general-purpose computer that can perform any number of tasks. Some candidates gave a generic definition of an embedded system which was insufficient because the question required candidates to apply their knowledge to the scenario.</p>\n</div>",
   "modelAnswer": "A smart watch is not a general-purpose computer, which means it has only limited, dedicated functions such as telling the time and tracking your steps.\n\nIts operating system is built in and is difficult to change, whereas a laptop can run any software the user chooses to install."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:exam:ce6d81fa",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "exam",
  "type": "written",
  "marks": 1,
  "num": "Q6(a)",
  "question": "<p>Gareth's Sat Nav contains an embedded system. Define what is meant by an 'embedded system'.</p>",
  "hint": "One sentence. The examiner wants the 'built into another device' idea.",
  "starter": "An embedded system is…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li>A computer system that is built into another device</li>\n</ul>\n</div>",
   "modelAnswer": "An embedded system is a computer system that is built into another device to carry out one specific task."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:exam:ca6af0dc",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "exam",
  "type": "written",
  "marks": 3,
  "num": "Q6(b)",
  "question": "<p>Identify <strong>three</strong> devices, other than a Sat Nav, that contain embedded systems.</p>",
  "hint": "Three quick answers — no explanation needed, and no marks for detail. Just don't repeat the Sat Nav.",
  "starter": "1: … | 2: … | 3: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 3 marks — three devices from:</h5>\n<ul>\n<li>Dishwasher</li>\n<li>MP3 player</li>\n<li>Washing machine</li>\n<li>Mobile phone</li>\n<li>Manufacturing equipment</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>1 mark to be awarded for each correct example identified to a maximum of 3 marks.</li>\n<li>There are many other examples of devices with embedded systems which may be acceptable.</li>\n</ul>\n</div>",
   "modelAnswer": "1: Washing machine\n\n2: Microwave oven\n\n3: Traffic lights"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:7cbb9001",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which best defines an embedded system?",
  "options": [
   "Any computer that has no physical keyboard attached to it at all",
   "A computer system built into a larger device to perform one specific task",
   "A computer that runs on rechargeable batteries instead of mains electricity",
   "A very small laptop with a stripped-down operating system already installed"
  ],
  "key": {
   "answer": 1,
   "explain": "Two halves: built INTO a larger device, and dedicated to one specific (or limited) task. Size, batteries and keyboards are irrelevant."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:6c3520ff",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which of these is an embedded system?",
  "options": [
   "A desktop PC with a full operating system used for browsing and office work",
   "A laptop with a full operating system used for work and browsing",
   "A washing machine that runs one fixed wash programme automatically",
   "A tablet with a touchscreen used for apps, browsing and video streaming"
  ],
  "key": {
   "answer": 2,
   "explain": "The washing machine's computer does one job forever. The other three are general-purpose computers you can install any software on."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:af3e37d8",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Why is a laptop NOT an embedded system?",
  "options": [
   "It is too expensive for an average household budget to justify",
   "It is general purpose — you can install any software you like",
   "It has a microprocessor, since every modern computer needs one",
   "It uses an operating system that loads fresh each time it boots"
  ],
  "key": {
   "answer": 1,
   "explain": "General purpose is the opposite of embedded. Having a microprocessor or an OS doesn't decide it — embedded systems have those too."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:841f262e",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "An embedded system's program is usually stored as firmware in ROM. What does this mean in practice?",
  "options": [
   "The user can install and remove new apps whenever they like",
   "The instructions are fixed and normally cannot be changed by the user",
   "The program is deleted permanently every time the power is switched off",
   "The system needs a hard drive to store its operating system"
  ],
  "key": {
   "answer": 1,
   "explain": "Firmware in ROM is permanent and non-volatile — it starts instantly and the user doesn't update or replace it. That's why there's no app store on your dishwasher."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:d602c780",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which phrase would actually earn a mark when describing an embedded system?",
  "options": [
   "It has a microprocessor, just like any general-purpose computer",
   "It has a dedicated microprocessor doing only this job",
   "It is electronic and needs a power supply to work",
   "It has a circuit board holding its electronic components"
  ],
  "key": {
   "answer": 1,
   "explain": "Every computer has a microprocessor, so that fact distinguishes nothing. 'Dedicated' is the word that carries the meaning."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:8fa64734",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A question asks for an embedded system found in a car. Which answer earns the mark?",
  "options": [
   "A microwave used to heat food in the kitchen",
   "A washing machine used to wash clothes at home",
   "The anti-lock braking system fitted to the car",
   "A games console used to play video games at home"
  ],
  "key": {
   "answer": 2,
   "explain": "Read the context. The first two ARE embedded systems, but they're not in a car — candidates lost this exact mark in the real exam."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:4a7e28e3",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Ali says his tablet is an embedded system. Which reason shows he is incorrect?",
  "options": [
   "Tablets have touchscreens, and touchscreens are only found on embedded systems",
   "A tablet has multiple functions and is general purpose, unlike an embedded system",
   "Tablets are portable, and only embedded systems are designed to be portable",
   "Tablets use rechargeable batteries, whereas embedded systems always run on mains power only"
  ],
  "key": {
   "answer": 1,
   "explain": "The deciding characteristic is purpose: an embedded system does one dedicated job; a tablet does anything you install on it."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:24b24605",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which statement is TRUE about a smartphone?",
  "options": [
   "It is an embedded system, since it only runs the apps that come pre-installed on it",
   "It is general purpose, but it contains embedded systems inside it",
   "It contains no embedded systems at all, only general-purpose software",
   "It is firmware — permanent software stored directly in its ROM chip"
  ],
  "key": {
   "answer": 1,
   "explain": "A neat distinction: the phone itself is a general-purpose computer, but components inside it (battery management, camera stabilisation) are embedded systems."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:1ea36468",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Why is a smart watch classed as an embedded system?",
  "options": [
   "It is small enough to be worn comfortably on your wrist all day",
   "It is not a general-purpose computer — it has limited, dedicated functions",
   "It connects to a phone over Bluetooth to sync data, notifications and health tracking",
   "It has a touchscreen you can tap and swipe to interact with it"
  ],
  "key": {
   "answer": 1,
   "explain": "Limited, dedicated function is the reason. Size, touchscreens and connectivity say nothing about whether something is embedded."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:869d5946",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which is a typical characteristic of an embedded system?",
  "options": [
   "It can be expanded with new hardware whenever the user wants",
   "It has few components, all essential to its purpose",
   "It runs any software the user installs",
   "It always has a large screen"
  ],
  "key": {
   "answer": 1,
   "explain": "Embedded systems are built with only what the one job needs — few components, dedicated hardware, limited functions."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:fbd3859a",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A cruise control system keeps a car at a set distance from the car in front, with no driver input. Which characteristic does this best show?",
  "options": [
   "It is general purpose, so it could be reprogrammed to do any task",
   "It is an automated control system with a specific purpose",
   "It can run any software the driver chooses to install on it",
   "It has a large amount of storage for the driver's personal files"
  ],
  "key": {
   "answer": 1,
   "explain": "It senses something and responds automatically without the user — an automated control system dedicated to that one task."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:mcq:dc07aa4b",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A 3-mark question asks you to explain why a system is embedded. What should your answer contain?",
  "options": [
   "One very detailed point about the system's single specific purpose",
   "Three separate characteristics of embedded systems, each applied to the scenario",
   "A definition copied word-for-word from the textbook, with no reference to the scenario at all",
   "A list of other embedded systems found in similar everyday devices"
  ],
  "key": {
   "answer": 1,
   "explain": "Three marks means three distinct points — and each must be applied to the scenario. Real candidates commonly gave one point and stopped."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:tf:3897bfac",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "An embedded system is any computer that is physically small.",
  "key": {
   "answer": false,
   "explain": "Size has nothing to do with it. An engine management system is powerful and complex, but it's embedded because it's dedicated to one job inside a larger machine."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:tf:a0e31797",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "A washing machine contains an embedded system.",
  "key": {
   "answer": true,
   "explain": "Correct — a computer built into the machine, doing exactly one job: running the wash programme you selected."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:tf:80d3ab55",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "A tablet computer is an embedded system because it has a microprocessor and an operating system.",
  "key": {
   "answer": false,
   "explain": "Both are true of tablets, and neither makes something embedded. A tablet is self-contained, general purpose, and you can install whatever you like on it."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:tf:bb1624f2",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "The software in an embedded system is usually firmware stored in ROM.",
  "key": {
   "answer": true,
   "explain": "Yes — fixed, non-volatile, instant to start, and normally not changeable by the user. It's why you can't install apps on a microwave."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:tf:f1103f28",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "A smartphone is a general-purpose computer, but it contains embedded systems inside it.",
  "key": {
   "answer": true,
   "explain": "A neat distinction worth knowing: the phone itself runs anything you install, but its battery-management and camera-stabilisation chips are dedicated embedded systems."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:tf:15be2790",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Writing 'an embedded system has limited functions' is enough to justify why a smart watch is embedded.",
  "key": {
   "answer": false,
   "explain": "That's a generic definition, and the mark scheme explicitly refuses those on justify questions. Apply it: '…and the smart watch only tracks time, steps and heart rate'."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:tf:ae75d7b9",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "If a question says a system is 'built into the car', you can earn a mark by saying it is built into the car.",
  "key": {
   "answer": false,
   "explain": "That point is already in the question, so it shows no knowledge of your own — it is explicitly not awarded. Use a different characteristic instead."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:tf:3f51843b",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Embedded systems are often control systems that respond automatically without the user.",
  "key": {
   "answer": true,
   "explain": "True — automatic headlights sense the light level and switch on by themselves; cruise control maintains speed and distance with no driver input."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:learn:177f479e",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "What is an embedded system?",
  "reading": "<h4>The definition to learn word-for-word</h4>\n<ul>\n<li><strong>An embedded system is a computer system built into a larger device, dedicated to carrying out one specific task (or a small, limited set of tasks).</strong></li>\n<li>That single sentence has both halves examiners look for: it is <strong>built into</strong> something else, and it has <strong>one specific purpose</strong>.</li>\n<li>The washing machine on your kitchen floor contains a computer. You never think of it as a computer, because it only ever does one job — that's exactly what makes it embedded.</li>\n</ul>\n<h4>Embedded doesn't mean small or simple</h4>\n<ul>\n<li>An engine management system in a car is doing extraordinary work thousands of times a second. It's still embedded, because it is <em>dedicated</em> to that one job inside a larger machine.</li>\n<li>The opposite of \"embedded\" is not \"big\" — it's <strong>general purpose</strong>. A laptop is general purpose because you can install anything on it and make it do almost any task.</li>\n</ul>\n<h4>The word \"dedicated\"</h4>\n<ul>\n<li>You'll see this word all over the mark schemes: <strong>dedicated hardware</strong>, <strong>dedicated microprocessor</strong>, <strong>dedicated to one function</strong>.</li>\n<li>It means \"reserved for this one job and nothing else\". The microprocessor inside a set of automatic headlights does nothing but check the light level and switch the lights — it will never run a spreadsheet.</li>\n</ul>",
  "question": "Which is the best definition of an embedded system?",
  "options": [
   "Any general-purpose computer that happens to be physically small",
   "A computer system built into a larger device to perform one specific task",
   "A computer system that has no screen or keyboard connected to it",
   "A computer that cannot connect to the internet or download any new software updates"
  ],
  "key": {
   "answer": 1,
   "explain": "Both halves matter: built INTO a larger device, and dedicated to one specific (or limited) task. Size and screens have nothing to do with it — an engine management system is powerful, and plenty of general-purpose computers are small."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:learn:ec5f7bd8",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "The characteristics of an embedded system",
  "reading": "<h4>The list that earns the marks</h4>\n<ul>\n<li><strong>One specific purpose</strong> — it performs a single task, or only a few limited functions.</li>\n<li><strong>Built into a larger device</strong> — it is part of a bigger machine, not a machine in its own right.</li>\n<li><strong>Dedicated hardware</strong> — its own microprocessor and sensors, used only for this system.</li>\n<li><strong>Hard to change</strong> — the program is usually stored in ROM as <strong>firmware</strong>, so it isn't updated or replaced the way you install apps on a phone.</li>\n<li><strong>Often a control system</strong> — it senses something and responds automatically, without the user telling it to.</li>\n<li><strong>Few components</strong>, all essential to its purpose; typically small, cheap and low-power.</li>\n</ul>\n<h4>Why \"it has a microprocessor\" alone isn't worth much</h4>\n<ul>\n<li>Every computer has a microprocessor — so that fact doesn't distinguish anything. The creditworthy version is <strong>\"it has a <em>dedicated</em> microprocessor\"</strong>, i.e. one doing only this job.</li>\n</ul>\n<h4>Firmware — the reason your washing machine has no app store</h4>\n<ul>\n<li><strong>Firmware</strong> is software stored permanently in ROM. It boots instantly, never gets deleted, and normally cannot be changed by the user.</li>\n<li>That's why you can't install a game on your dishwasher: its instructions are fixed in hardware-level storage, not loaded from a disk like on a general-purpose computer.</li>\n</ul>",
  "question": "Which statement about an embedded system's software is correct?",
  "options": [
   "Users install and update apps on it freely, just like on a phone",
   "Its program is usually firmware stored in ROM and is hard to change",
   "It has no software at all, only electronic circuits and wires",
   "It downloads and installs a brand new operating system every time it starts"
  ],
  "key": {
   "answer": 1,
   "explain": "Embedded systems normally run firmware held in ROM — fixed, instant to start, and not something the user updates or replaces."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:learn:94beb044",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Embedded vs general purpose — the question they always ask",
  "reading": "<h4>The test to apply</h4>\n<ul>\n<li>Ask yourself: <strong>\"Can I install whatever I like on it and make it do a completely different job?\"</strong></li>\n<li><strong>Yes</strong> → it's a <strong>general-purpose</strong> computer (laptop, desktop, tablet, smartphone).</li>\n<li><strong>No — it does its one job forever</strong> → it's an <strong>embedded system</strong> (smart watch, washing machine, sat nav, microwave).</li>\n</ul>\n<h4>Worked comparison: smart watch vs laptop</h4>\n<ul>\n<li><strong>Smart watch = embedded.</strong> It is not a general-purpose computer: it has limited, dedicated functions; a microprocessor on a single circuit board; a built-in OS that you cannot really change; and few components, all essential to its purpose.</li>\n<li><strong>Laptop = general purpose.</strong> You can install any software you like and use it for any number of tasks; its hardware can be expanded; its OS can be updated or even replaced.</li>\n</ul>\n<h4>Is a tablet an embedded system? (No — and here's the reasoning)</h4>\n<ul>\n<li>A tablet has <strong>multiple functions</strong> and is <strong>general purpose</strong>; an embedded system has one or few.</li>\n<li>A tablet is a <strong>self-contained system</strong>, not part of a larger machine.</li>\n<li>You can <strong>update or install software</strong> on a tablet freely.</li>\n</ul>\n<h4>The nuance that impresses: a phone <em>contains</em> embedded systems</h4>\n<ul>\n<li>A smartphone is a <strong>general-purpose computer</strong> — but the camera-stabilising module and the battery-management chip inside it <em>are</em> embedded systems.</li>\n<li>So the question \"is this device an embedded system?\" is different from \"does this device contain embedded systems?\". Read the question carefully.</li>\n</ul>",
  "question": "Why is a tablet NOT an embedded system?",
  "options": [
   "It is too small to contain a full operating system, storage chip or microprocessor",
   "It is general purpose — it has many functions and you can install new software",
   "It has a microprocessor, exactly like every embedded system does",
   "It uses electricity, exactly like every embedded system does too"
  ],
  "key": {
   "answer": 1,
   "explain": "Embedded systems do one dedicated job inside a larger device and can't easily be repurposed. A tablet is a self-contained, general-purpose computer you can install anything on."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:learn:be194509",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "A range of examples (the spec wants breadth)",
  "reading": "<h4>Around the house</h4>\n<ul>\n<li><strong>Washing machine</strong> — runs the chosen programme: fill, wash, spin, drain.</li>\n<li><strong>Microwave, dishwasher, fridge/freezer, oven</strong> — each with one job and a control panel.</li>\n<li><strong>Central heating thermostat</strong> — senses temperature, switches the boiler.</li>\n<li><strong>TV remote, printer, digital camera, MP3 player.</strong></li>\n</ul>\n<h4>Inside a car (a favourite exam context)</h4>\n<ul>\n<li><strong>Engine management system</strong>, <strong>anti-lock brakes</strong>, <strong>parking sensors</strong>, <strong>cruise control</strong> (including \"follow me\" adaptive systems), <strong>automatic lights</strong>, <strong>automatic windscreen wipers</strong>, <strong>climate control</strong>, <strong>sat nav / GPS</strong>, <strong>lane assist</strong>, <strong>auto-park</strong>, <strong>dashcam</strong>.</li>\n<li><strong>Watch the context.</strong> If the question says \"in a car\", answering \"a washing machine\" scores nothing — real candidates lost marks doing exactly that.</li>\n</ul>\n<h4>Worn, medical and industrial</h4>\n<ul>\n<li><strong>Smart watch</strong>, <strong>fitness tracker</strong>, <strong>pacemaker</strong>, <strong>insulin pump</strong>.</li>\n<li><strong>Traffic lights</strong>, <strong>manufacturing/robotic equipment</strong>, <strong>vending machines</strong>, <strong>ticket machines</strong>, <strong>lifts</strong>, <strong>security alarms</strong>.</li>\n</ul>\n<h4>Learn three you can always reach for</h4>\n<ul>\n<li>Keep a reliable trio in your head — <strong>washing machine, sat nav, traffic lights</strong> — for any \"identify three devices containing embedded systems\" question. Then swap them for context-appropriate ones when the question sets a scene.</li>\n</ul>",
  "question": "A question asks you to identify an embedded system found in a CAR. Which answer earns the mark?",
  "options": [
   "A washing machine used to wash clothes at home",
   "A microwave used to heat and cook food",
   "The engine management system fitted inside the car",
   "A desktop computer used for browsing and general office work"
  ],
  "key": {
   "answer": 2,
   "explain": "The context is the car. Washing machines and microwaves are embedded systems, but they're not in a car — candidates genuinely lost this mark by ignoring the scenario."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:learn:98bc1df8",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "How to answer: apply it, don't define it",
  "reading": "<h4>The single biggest mark-loser on this topic</h4>\n<ul>\n<li>Questions here almost always give you a <strong>scenario</strong> — Ali's tablet, Xander's smart watch, the car's 'Follow Me' system — and ask you to <strong>justify</strong> or <strong>explain</strong>.</li>\n<li>Writing a textbook definition of an embedded system earns <strong>nothing</strong>. The mark scheme is explicit: <em>answers must be applied to the scenario; do not award generic definitions.</em></li>\n</ul>\n<h4>The two-part sentence that always works</h4>\n<ul>\n<li><strong>Feature → applied to this device.</strong></li>\n<li>❌ Generic: \"An embedded system has limited functions.\"</li>\n<li>✅ Applied: \"An embedded system has limited functions, <strong>and the smart watch</strong> only tracks time, steps and heart rate — it cannot be used for any task you like.\"</li>\n<li>Same feature. The second one scores.</li>\n</ul>\n<h4>Don't hand back the question</h4>\n<ul>\n<li>If the question already tells you the system is \"built into the car\", you cannot earn a mark by saying \"it is built into the car\". That point is <strong>in the question</strong>, so it shows no knowledge of your own.</li>\n<li>Reach for a different characteristic instead: dedicated microprocessor, limited functions, firmware that can't be changed.</li>\n</ul>\n<h4>Count the marks, make that many points</h4>\n<ul>\n<li>A 3-mark \"explain why this is an embedded system\" wants <strong>three separate characteristics</strong>. Many candidates give one good point and stop — which caps them at 1.</li>\n<li>Have the list ready: specific purpose · built into a larger device · dedicated hardware/microprocessor · firmware, hard to change · automated control system.</li>\n</ul>",
  "question": "A 2-mark question asks you to justify why a smart watch is an embedded system. Which answer scores?",
  "options": [
   "An embedded system is a computer system that is built into a larger device and performs one specific purpose",
   "A smart watch is not a general-purpose computer — it has limited, dedicated functions",
   "Smart watches are small enough to be worn comfortably on a wrist",
   "It has a microprocessor, which every general-purpose computer also has"
  ],
  "key": {
   "answer": 1,
   "explain": "Only the second applies the feature to THIS device. The first is a textbook definition — explicitly not credited on a justify question — and the last two say nothing that distinguishes an embedded system."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:misc:f3ec46fd",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Answering a 'justify' question with a textbook definition: 'An embedded system is built into a larger device and has one purpose.'</p><p><strong>✅ The correct idea:</strong> The mark scheme for these questions says it outright: <strong>answers must be applied to the scenario; do not award generic definitions.</strong> Candidates who gave a perfect definition of an embedded system scored zero, because the question asked about <em>this</em> smart watch or <em>this</em> tablet. Use the two-part sentence: <strong>feature → applied to this device.</strong> Weak: 'embedded systems have limited functions.' Strong: 'embedded systems have limited functions, and the smart watch only tracks time, steps and heart rate — it cannot be used for any task you like.'</p>",
  "question": "Why does a flawless definition of an embedded system score 0 on a 'justify your choice' question?",
  "options": [
   "Definitions are always wrong on every type of exam question",
   "The question needs the characteristic applied to the device in the scenario",
   "It is too short to cover all the required assessment objectives",
   "Definitions belong only in the conclusion, never at the start of an exam answer"
  ],
  "key": {
   "answer": 1,
   "explain": "Justify and explain questions test application. The knowledge is only creditworthy once it is attached to the device in front of you."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:misc:bc13c033",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Giving 'it is built into the car' as a reason why a car system is embedded — when the question already told you it's in the car.</p><p><strong>✅ The correct idea:</strong> You cannot earn marks by handing the question back. This point is <strong>in the stem</strong>, so it is explicitly not awarded — real candidates repeated it and got nothing. Reach for a characteristic the question <em>hasn't</em> given you: it has <strong>limited functions</strong> (the system only checks the light level and switches the lights), it has a <strong>dedicated microprocessor</strong>, or its function is <strong>hard to change</strong>.</p>",
  "question": "The question states: 'A car comes with many embedded systems, for example parking sensors.' Which explanation would earn a mark?",
  "options": [
   "It is built into the car, exactly as the question already states",
   "It is part of a larger machine, just like every embedded system is",
   "It has a dedicated microprocessor that only monitors the sensors",
   "The car contains it, along with many other embedded systems too"
  ],
  "key": {
   "answer": 2,
   "explain": "The first, second and fourth are all just restating what the question already said. Only the dedicated-microprocessor point adds knowledge of your own."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:misc:019bceb9",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> For 'identify an embedded system in a car', answering 'a washing machine' or 'a microwave'.</p><p><strong>✅ The correct idea:</strong> These <em>are</em> embedded systems — but they are not in a car, and the examiner report notes candidates genuinely gave them and scored nothing. <strong>The context sets the answer.</strong> For a car, use: engine management, anti-lock brakes, parking sensors, cruise control, automatic lights or wipers, climate control, sat nav, lane assist. Always re-read the scenario before you pick your example.</p>",
  "question": "What went wrong when candidates answered 'washing machine' to a question about embedded systems in a car?",
  "options": [
   "A washing machine is not an embedded system at all, in any context",
   "The answer ignored the context — it's valid, just not an example found in a car",
   "Washing machines have no microprocessor or any dedicated hardware components at all",
   "The spelling of 'washing machine' was wrong in the candidate's answer"
  ],
  "key": {
   "answer": 1,
   "explain": "The example itself is fine; it just doesn't answer the question that was asked. Context-appropriate examples are the whole point of an applied question."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:misc:d9d27713",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Saying 'it has a microprocessor' as a characteristic that makes something embedded.</p><p><strong>✅ The correct idea:</strong> Every computer has a microprocessor — a laptop, a games console, a server. So the fact distinguishes nothing and adds no knowledge. The creditworthy version is <strong>'it has a <em>dedicated</em> microprocessor'</strong>, i.e. one doing only this job and nothing else — better still, prove it with an example: 'there is a microprocessor that does nothing but check the light level'.</p>",
  "question": "Which version of the microprocessor point is worth a mark?",
  "options": [
   "It has a microprocessor, just like every other type of computer",
   "It is controlled by electronics, like nearly all modern devices",
   "It has a dedicated microprocessor that only monitors the light level",
   "It contains a chip, which almost every modern electronic device also has"
  ],
  "key": {
   "answer": 2,
   "explain": "'Dedicated', ideally with an example of the one job it does, is what shows understanding of an embedded system."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:misc:ae8a1808",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Answering a 3-mark 'explain why this is an embedded system' with one good point, written at length.</p><p><strong>✅ The correct idea:</strong> Three marks means <strong>three separate characteristics</strong>. The examiner report is blunt: most candidates got the 'single purpose' point, some added 'built into a larger system', but <strong>few could produce a third</strong>. Keep the list ready and work down it: <strong>specific purpose · built into a larger device · dedicated hardware/microprocessor · firmware that is hard to change · automated control system</strong>. Three short applied sentences beat one long one every time.</p>",
  "question": "A 3-mark question asks why the 'Follow Me' cruise control is an embedded system. What's the best structure?",
  "options": [
   "One very detailed paragraph focused only on its single specific purpose",
   "Three different characteristics, each linked to the Follow Me system",
   "A definition of an embedded system copied straight from a textbook",
   "A list of other cars that also come fitted with cruise control"
  ],
  "key": {
   "answer": 1,
   "explain": "One mark per characteristic, to a maximum of three — so three distinct points, each applied to the system in the question."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:misc:a173dd17",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Thinking that because a smartphone runs apps, nothing inside it can be an embedded system.</p><p><strong>✅ The correct idea:</strong> Both things are true at once. The <strong>phone as a whole</strong> is a general-purpose computer — you install what you like. But <strong>inside it</strong> sit embedded systems: the battery-management chip, the camera-stabilisation module. So watch the exact wording: <em>'Is this device an embedded system?'</em> and <em>'Does this device contain embedded systems?'</em> have different answers for a phone.</p>",
  "question": "Which statement about a smartphone is correct?",
  "options": [
   "It is an embedded system, since every part of it does one fixed job",
   "It is general purpose overall, but contains embedded systems inside it",
   "It contains no embedded systems anywhere inside it, only general-purpose software",
   "It is firmware — instructions stored permanently inside a ROM chip"
  ],
  "key": {
   "answer": 1,
   "explain": "The device itself is general purpose; specific dedicated components inside it are embedded systems. Read whether the question asks 'is' or 'contains'."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:tips:c966d276",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "explain — 'Justify' and 'explain' questions: from 0 to full marks",
  "reading": "<p>Nearly every question on this topic gives you a scenario and asks you to justify or explain. Here is the same answer to <em>\"Justify why the smart watch is an example of an embedded system\"</em> <strong>[2]</strong> at every level:</p>\n\n<p><strong>❌ 0 marks:</strong> \"An embedded system is a computer built into a larger device with one specific purpose.\"</p>\n<ul>\n<li>A textbook-perfect definition — and worth nothing. The mark scheme says: <em>answers must be applied to the scenario; do not award generic definitions.</em></li>\n</ul>\n\n<p><strong>⚠️ 1 mark:</strong> \"A smart watch is not a general-purpose computer.\"</p>\n<ul>\n<li>Applied to the device, so it scores — but it stops there. The second mark needs a development.</li>\n</ul>\n\n<p><strong>✅ 2 marks:</strong> \"A smart watch is not a general-purpose computer <strong>(1)</strong>, which means it only has limited, dedicated functions such as tracking your steps and heart rate — you cannot install any software you like on it <strong>(1)</strong>.\"</p>\n\n<p><strong>The formula:</strong> feature of an embedded system → <em>\"…and this device…\"</em> → the specific evidence from the scenario.</p>\n\n<p><strong>Bonus technique:</strong> you're also allowed to argue the opposite way — \"a laptop <em>is</em> general purpose because you can install any software\" — as long as you don't just repeat the same point twice in different words.</p>",
  "question": "You've written 'a smart watch is not a general-purpose computer'. What earns the second mark?",
  "options": [
   "Saying the exact same point again, just phrased in slightly different words",
   "Adding what its limited, dedicated functions actually are on this device",
   "Defining an embedded system in general, textbook terms",
   "Naming a completely different embedded system as an example"
  ],
  "key": {
   "answer": 1,
   "explain": "The second mark is the development: the specific evidence from the scenario that proves your point."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:tips:abfc2297",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "tip — Counting the marks — and never repeating the question",
  "reading": "<p><strong>1. The tariff tells you how many points to make.</strong></p>\n<ul>\n<li><em>\"Explain the reasons why the 'Follow Me' system is an example of an embedded system\"</em> <strong>[3]</strong> = <strong>three</strong> separate characteristics, each applied.</li>\n<li>The examiner report on this exact question: most candidates got \"single purpose\", some added \"built into the car\", but <strong>few managed a third point</strong>. That third mark is sitting there for anyone with the list memorised.</li>\n<li><strong>Your list:</strong> specific purpose · built into a larger device · dedicated hardware / microprocessor · firmware, hard to change · automated control system.</li>\n</ul>\n\n<p><strong>2. Never hand the question back.</strong></p>\n<ul>\n<li>If the stem says \"A car comes with many embedded systems…\", then <strong>\"it is built into the car\"</strong> earns nothing — that point is in the question.</li>\n<li>Cross it off your list for that question and use the next characteristic instead.</li>\n</ul>\n\n<p><strong>3. Match the example to the context.</strong></p>\n<ul>\n<li>Asked for an embedded system <strong>in a car</strong>? Engine management, ABS, parking sensors, cruise control, automatic lights or wipers, climate control, sat nav.</li>\n<li>Candidates who wrote \"washing machine\" or \"microwave\" for a car question scored zero — right idea, wrong scene.</li>\n</ul>\n\n<p><strong>4. \"Identify three devices\" = three quick words.</strong></p>\n<ul>\n<li>No explanation needed, no marks for detail — just three valid devices. Keep a reliable trio ready: <strong>washing machine, sat nav, traffic lights</strong>.</li>\n</ul>",
  "question": "A question says: 'Parking sensors are an embedded system in a car. Identify one other embedded system in a car and explain why.' Which explanation is refused?",
  "options": [
   "It has a dedicated microprocessor",
   "It only performs one limited function",
   "It is built into the car",
   "The user cannot change what it does"
  ],
  "key": {
   "answer": 2,
   "explain": "'Built into the car' is stated in the question itself, so it cannot earn a mark — it shows no knowledge of your own."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:tips:418e448b",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "tip — The word-bank question: read the sentence, not just the list",
  "reading": "<p>This topic often gives a paragraph with gaps and a <strong>bank of terms</strong> — with the warning <em>\"Not all terms are used\"</em>. Those spare terms are deliberate traps.</p>\n\n<p><strong>How to beat it:</strong></p>\n<ul>\n<li><strong>Read the whole sentence first</strong>, then choose. \"Embedded systems have limited ……\" — <em>functions</em> fits; <em>applications</em> and <em>range</em> are plausible-looking decoys.</li>\n<li><strong>Watch the grammar.</strong> \"built into a …… machine\" needs an adjective (<em>larger</em>), not a noun (<em>laptop</em>).</li>\n<li><strong>Use each term once</strong>, and expect several to be left over. If you've used every word, you've made a mistake.</li>\n<li><strong>Do the ones you're sure of first</strong> — eliminating terms makes the harder gaps much easier.</li>\n</ul>\n\n<p><strong>Classic decoy pairs to watch for:</strong></p>\n<ul>\n<li><em>microprocessor</em> vs <em>processor</em> — both look right; the sentence decides.</li>\n<li><em>larger</em> vs <em>smaller</em> — an embedded system is built into a <strong>larger</strong> machine.</li>\n<li><em>functions</em> vs <em>applications</em> — embedded systems have limited <strong>functions</strong>.</li>\n</ul>",
  "question": "In 'They are often built into a …… machine', which term fits and why?",
  "options": [
   "laptop — it is a type of general-purpose computing machine, so the word fits grammatically",
   "larger — the gap needs an adjective, and embedded systems sit inside bigger devices",
   "smaller — embedded systems are usually physically small in size",
   "processor — it is simply a computer part found inside a machine"
  ],
  "key": {
   "answer": 1,
   "explain": "Grammar plus meaning: the gap needs an adjective before 'machine', and the whole point of embedded is being built into something LARGER."
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:fib:55393339",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "An embedded system is a computer built into a _____ device, dedicated to one _____ task.",
  "blankOptions": {
   "B1": [
    "larger",
    "functions",
    "microwave",
    "ROM"
   ],
   "B2": [
    "specific",
    "definition",
    "ROM",
    "functions"
   ]
  },
  "key": {
   "blanks": {
    "B1": "larger",
    "B2": "specific"
   }
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:fib:c8b09a56",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "Embedded systems have limited _____ and often use _____ hardware reserved for that one job.",
  "blankOptions": {
   "B1": [
    "functions",
    "definition",
    "firmware",
    "specific"
   ],
   "B2": [
    "dedicated",
    "lights",
    "ROM",
    "specific"
   ]
  },
  "key": {
   "blanks": {
    "B1": "functions",
    "B2": "dedicated"
   }
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:fib:0b9c8737",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "The program of an embedded system is usually stored as _____ in _____, so the user cannot easily change it.",
  "blankOptions": {
   "B1": [
    "lights",
    "microwave",
    "firmware",
    "dedicated"
   ],
   "B2": [
    "general",
    "ROM",
    "lights",
    "larger"
   ]
  },
  "key": {
   "blanks": {
    "B1": "firmware",
    "B2": "ROM"
   }
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:fib:d0d3c36f",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "The opposite of an embedded system is a _____ purpose computer, such as a laptop or _____.",
  "blankOptions": {
   "B1": [
    "general",
    "dedicated",
    "lights",
    "apply"
   ],
   "B2": [
    "engine",
    "lights",
    "microwave",
    "tablet"
   ]
  },
  "key": {
   "blanks": {
    "B1": "general",
    "B2": "tablet"
   }
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:fib:4a0d65e6",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "Two household examples of embedded systems are a _____ machine and a _____.",
  "blankOptions": {
   "B1": [
    "tablet",
    "engine",
    "lights",
    "washing"
   ],
   "B2": [
    "engine",
    "microwave",
    "tablet",
    "general"
   ]
  },
  "key": {
   "blanks": {
    "B1": "washing",
    "B2": "microwave"
   }
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:fib:9f98b0a8",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "In a car, the _____ management system and the automatic _____ are both embedded systems.",
  "blankOptions": {
   "B1": [
    "tablet",
    "ROM",
    "general",
    "engine"
   ],
   "B2": [
    "general",
    "dedicated",
    "washing",
    "lights"
   ]
  },
  "key": {
   "blanks": {
    "B1": "engine",
    "B2": "lights"
   }
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:fib:63290626",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "Saying 'it has a microprocessor' earns nothing — you must say it has a _____ microprocessor.",
  "blankOptions": {
   "B1": [
    "apply",
    "washing",
    "engine",
    "dedicated"
   ]
  },
  "key": {
   "blanks": {
    "B1": "dedicated"
   }
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:fib:03e46dd9",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "On a justify question you must _____ the characteristic to the device in the question — a generic _____ scores nothing.",
  "blankOptions": {
   "B1": [
    "apply",
    "lights",
    "specific",
    "washing"
   ],
   "B2": [
    "firmware",
    "definition",
    "lights",
    "engine"
   ]
  },
  "key": {
   "blanks": {
    "B1": "apply",
    "B2": "definition"
   }
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:00d8d13e",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Embedded system”?",
  "options": [
   "General purpose overall, but contains embedded systems inside it",
   "A computer that can run any software and perform many different tasks",
   "A computer system built into a larger device to perform one specific task",
   "Justify questions need the characteristic applied to the device in the scenario"
  ],
  "key": {
   "answer": 2,
   "explain": "“Embedded system” means: A computer system built into a larger device to perform one specific task"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:59601b7c",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “General-purpose computer”?",
  "options": [
   "A wearable embedded system with limited, dedicated functions",
   "NOT embedded — a self-contained, general-purpose computer",
   "Justify questions need the characteristic applied to the device in the scenario",
   "A computer that can run any software and perform many different tasks"
  ],
  "key": {
   "answer": 3,
   "explain": "“General-purpose computer” means: A computer that can run any software and perform many different tasks"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:a952f93a",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Dedicated hardware”?",
  "options": [
   "A medical embedded system dedicated to regulating a heartbeat",
   "A computer that can run any software and perform many different tasks",
   "Software stored permanently in ROM that the user normally cannot change",
   "Components and a microprocessor reserved for this one system only"
  ],
  "key": {
   "answer": 3,
   "explain": "“Dedicated hardware” means: Components and a microprocessor reserved for this one system only"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:a99508ee",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Firmware”?",
  "options": [
   "Software stored permanently in ROM that the user normally cannot change",
   "NOT embedded — a self-contained, general-purpose computer",
   "A system that senses something and responds automatically, without the user",
   "A computer that can run any software and perform many different tasks"
  ],
  "key": {
   "answer": 0,
   "explain": "“Firmware” means: Software stored permanently in ROM that the user normally cannot change"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:b3213baf",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Control system”?",
  "options": [
   "An embedded control system that sequences signals automatically",
   "Justify questions need the characteristic applied to the device in the scenario",
   "Components and a microprocessor reserved for this one system only",
   "A system that senses something and responds automatically, without the user"
  ],
  "key": {
   "answer": 3,
   "explain": "“Control system” means: A system that senses something and responds automatically, without the user"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:0d9c0a3a",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Washing machine”?",
  "options": [
   "General purpose overall, but contains embedded systems inside it",
   "A household embedded system that runs the selected wash programme",
   "A computer that can run any software and perform many different tasks",
   "Software stored permanently in ROM that the user normally cannot change"
  ],
  "key": {
   "answer": 1,
   "explain": "“Washing machine” means: A household embedded system that runs the selected wash programme"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:6bf72b4f",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Engine management system”?",
  "options": [
   "A computer that can run any software and perform many different tasks",
   "An embedded control system that sequences signals automatically",
   "A wearable embedded system with limited, dedicated functions",
   "An embedded system in a car that controls how the engine runs"
  ],
  "key": {
   "answer": 3,
   "explain": "“Engine management system” means: An embedded system in a car that controls how the engine runs"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:3f33b98e",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Sat nav”?",
  "options": [
   "A system that senses something and responds automatically, without the user",
   "An embedded system dedicated to navigation",
   "A household embedded system that runs the selected wash programme",
   "A computer that can run any software and perform many different tasks"
  ],
  "key": {
   "answer": 1,
   "explain": "“Sat nav” means: An embedded system dedicated to navigation"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:03f4946a",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Smart watch”?",
  "options": [
   "A household embedded system that runs the selected wash programme",
   "A wearable embedded system with limited, dedicated functions",
   "Justify questions need the characteristic applied to the device in the scenario",
   "An embedded system in a car that controls how the engine runs"
  ],
  "key": {
   "answer": 1,
   "explain": "“Smart watch” means: A wearable embedded system with limited, dedicated functions"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:fa640d69",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Traffic lights”?",
  "options": [
   "A household embedded system that runs the selected wash programme",
   "Components and a microprocessor reserved for this one system only",
   "An embedded control system that sequences signals automatically",
   "An embedded system in a car that controls how the engine runs"
  ],
  "key": {
   "answer": 2,
   "explain": "“Traffic lights” means: An embedded control system that sequences signals automatically"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:041f2bfe",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Pacemaker”?",
  "options": [
   "A computer system built into a larger device to perform one specific task",
   "Software stored permanently in ROM that the user normally cannot change",
   "An embedded control system that sequences signals automatically",
   "A medical embedded system dedicated to regulating a heartbeat"
  ],
  "key": {
   "answer": 3,
   "explain": "“Pacemaker” means: A medical embedded system dedicated to regulating a heartbeat"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:240f8e65",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Tablet”?",
  "options": [
   "A household embedded system that runs the selected wash programme",
   "NOT embedded — a self-contained, general-purpose computer",
   "A computer system built into a larger device to perform one specific task",
   "A wearable embedded system with limited, dedicated functions"
  ],
  "key": {
   "answer": 1,
   "explain": "“Tablet” means: NOT embedded — a self-contained, general-purpose computer"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:2466996c",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Smartphone”?",
  "options": [
   "A system that senses something and responds automatically, without the user",
   "General purpose overall, but contains embedded systems inside it",
   "Justify questions need the characteristic applied to the device in the scenario",
   "An embedded control system that sequences signals automatically"
  ],
  "key": {
   "answer": 1,
   "explain": "“Smartphone” means: General purpose overall, but contains embedded systems inside it"
  }
 },
 {
  "id": "computer-science:1-1-3-embedded-systems:match:cf4f68cb",
  "pageId": "computer-science:1-1-3-embedded-systems",
  "pageName": "1.1.3 Embedded Systems",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Why generic answers fail”?",
  "options": [
   "Software stored permanently in ROM that the user normally cannot change",
   "Justify questions need the characteristic applied to the device in the scenario",
   "Components and a microprocessor reserved for this one system only",
   "An embedded system dedicated to navigation"
  ],
  "key": {
   "answer": 1,
   "explain": "“Why generic answers fail” means: Justify questions need the characteristic applied to the device in the scenario"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:7bb55bee",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 1,
  "num": "Q7(a)(i)",
  "question": "<p>State the difference between RAM and ROM.</p>",
  "caseStudy": "<p>A smart television allows the user to search the Internet and watch videos online.</p><p>The smart television has both RAM and ROM.</p>",
  "hint": "This is asking for a DIFFERENCE — write both sides in one sentence: 'RAM is ___, whereas ROM is ___.' Naming only one side is not enough.",
  "starter": "RAM is …, whereas ROM is …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li>ROM is non-volatile, RAM is volatile // by description</li>\n<li>Content of ROM cannot (usually) be changed, content of RAM can be changed</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Read the whole answer.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question was answered well, with many candidates correctly identifying that RAM is volatile and ROM is non-volatile. When a difference is required, candidates must make sure they are giving both sides of the difference — \"RAM is volatile\" is not enough on its own. Some candidates gave the purpose of RAM and ROM; this is a difference in use, not a fundamental difference between the two.</p>\n</div>",
   "modelAnswer": "RAM is volatile, whereas ROM is non-volatile — RAM loses its contents when the power is off, but ROM keeps them."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:7cedfd7c",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q7(a)(ii)",
  "question": "<p>Give <strong>two</strong> examples of data that the smart television could store in RAM.</p>",
  "caseStudy": "<p>A smart television allows the user to search the Internet and watch videos online.</p><p>The smart television has both RAM and ROM.</p>",
  "hint": "Think about what's ACTIVE right now — the programme currently being watched, data being buffered, the button just pressed — not the app or the OS as a whole (that's spread across RAM and secondary storage).",
  "starter": "1: … | 2: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark each to max 2), e.g.</h5>\n<ul>\n<li>Web browser/application that is running</li>\n<li>(Parts of the) operating system currently running</li>\n<li>Current video/film/TV programme being watched</li>\n<li>Data being downloaded/buffered</li>\n<li>Button pressed by the user</li>\n<li>Current volume</li>\n<li>Current channel being watched</li>\n<li>Source being watched (e.g. HDMI1)</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Allow anything reasonable but it must be clearly RAM, e.g. not just \"stores the software/OS\" (this is secondary storage).</li>\n<li>Do not award brand names without exemplification.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Some candidates found this question challenging. Many responses were generic applications such as \"a streaming service\" or \"a TV programme\" — a TV programme will not be stored in RAM in its entirety, but the parts currently or about to be watched would be. Likewise, an application in its entirety will not be stored in RAM, but the parts being used will be. The most commonly correct responses were the recording currently being watched, the data received from the remote control, and the websites being accessed.</p>\n</div>",
   "modelAnswer": "1: The TV programme currently being watched (or about to be watched)\n\n2: Data being downloaded or buffered while streaming"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:20348dfc",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "Q5(a)(i)",
  "question": "<p>Explain why a computer needs both primary <strong>and</strong> secondary storage.</p>",
  "caseStudy": "<p>An artist has a computer that they use to create images. Their computer has both hardware and software.</p><p>The hardware includes primary and secondary storage.</p>",
  "hint": "Two separate reasons — one for WHY primary storage is needed, one for WHY secondary storage is needed. The question is asking why they're needed, not what they store.",
  "starter": "Primary storage is needed because…, and secondary storage is needed because…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark each)</h5>\n<ul>\n<li><strong>Primary</strong> — to store (active) data/instructions/software/OS that the processor needs to access // without primary the computer won't be able to start up/work // (ROM) so the start-up instructions are not deleted when the computer turns off // (RAM) to store the currently running data/software/instructions // (Cache) to store frequently used data/instructions</li>\n<li><strong>Secondary</strong> — to store data/files long-term/permanently // without secondary the user's files will not be stored when the power is turned off // store data not currently being used</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>The question is not asking what they store, but WHY they are needed.</li>\n<li>Secondary storage: not \"to backup data\" without reference to long-term/permanence.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Some candidates found this question challenging and often gave examples of each type of storage instead of answering why both are required. Some candidates were able to accurately describe the purpose of primary storage as storing currently running data and software.</p>\n<p><strong>Misconception:</strong> a common misconception was that secondary storage is used when primary storage is full, or that it is only used as a backup.</p>\n</div>",
   "modelAnswer": "Primary storage (RAM) is needed to hold the data, instructions and software the processor is currently using, so the CPU can access them directly and quickly.\n\nSecondary storage is needed to store the user's files and programs long-term/permanently, so they are not lost when the power is turned off."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:d420b2ad",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q5(a)(iii)",
  "question": "<p>The computer has Virtual Memory (VM).</p><p>The table has four statements about VM. Not all of the statements are correct.</p><p>Tick (✓) the <strong>True</strong> column for the statements that are correct.</p><p>Re-write any statement that is incorrect by changing it to make it true.</p>",
  "caseStudy": "<p>An artist has a computer that they use to create images. Their computer has both hardware and software.</p><p>The hardware includes primary and secondary storage.</p>",
  "hint": "One row is true as it stands. For the other three, be precise: SECONDARY storage (not primary) in row 1, and RAM (not just 'primary storage') in rows 2 and 4 — 'primary storage' also includes ROM and cache, so it isn't precise enough.",
  "starter": "Row 1: False — … | Row 2: False — … | Row 3: True | Row 4: False — …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark for each row)</h5>\n<ul>\n<li>Row 1 — False: a section of <strong>secondary</strong> storage is partitioned to act as virtual memory</li>\n<li>Row 2 — False: data from <strong>RAM</strong> is transferred into VM</li>\n<li>Row 3 — True</li>\n<li>Row 4 — False: data from VM is transferred back to <strong>RAM</strong> when needed</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Allow a description of the error in place of a full rewrite, e.g. row 1: \"primary should be secondary\".</li>\n<li>Accept HDD/SSD for secondary storage in row 1.</li>\n<li>Do not accept \"primary storage\" for RAM in rows 2 and 4.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>In this question candidates needed to consider each statement, identify whether it was true or false, and if it was false, re-write it to make it true. Candidates commonly identified the third statement as being true. The first statement was often correctly altered to identify that secondary storage was used. The second statement was sometimes changed correctly to RAM, but at other times was changed to secondary storage. The final statement was often changed to \"primary storage\", which was not enough, because primary storage would include ROM and cache and so is not precise enough to describe how VM works.</p>\n</div>",
   "modelAnswer": "Row 1: False — a section of SECONDARY storage is partitioned to act as virtual memory.\n\nRow 2: False — data from RAM is transferred into VM.\n\nRow 3: True.\n\nRow 4: False — data from VM is transferred back to RAM when needed."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:ebb80210",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "mcq",
  "marks": 1,
  "num": "P1",
  "question": "<p>Refer to the games console described above.</p><p>The ROM inside the console stores a short program that runs automatically the moment the console is switched on, before the console's operating system has loaded.</p><p>What is the correct term for this ROM-stored, start-up program?</p>",
  "options": [
   "The boot-up (bootstrap) program",
   "A temporary save file that is automatically created the first time a new game is installed",
   "The console's virtual memory partition",
   "A firmware update that is downloaded from the internet each time the console starts"
  ],
  "caseStudy": "<p>A games console has 8GB of RAM built in. When the console is switched on, it runs a start-up program stored in its ROM before loading the console's operating system.</p><p>Players can install and run several games and apps on the console.</p>",
  "hint": "This is the fixed program ROM's whole job is to store — the one instruction set that starts the computer up before anything else can run.",
  "key": {
   "answer": 0,
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li>The boot-up (bootstrap) program — CAO (correct answer only)</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Only the correct option scores; there is no credit for a partial or vague description.</li>\n</ul>\n</div>",
   "modelAnswer": "The boot-up (bootstrap) program."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:8e4f4c34",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 1,
  "num": "P2",
  "question": "<p>State why the weather station's processor needs to load its measurement program into RAM, rather than running it directly from its permanent storage.</p>",
  "caseStudy": "<p>A school has installed an automatic weather station on its roof. The weather station is a small embedded computer that measures temperature, rainfall and wind speed every minute, and sends the readings to the school's server.</p><p>The weather station has both RAM and ROM.</p>",
  "hint": "Think about speed — one type of storage is far too slow for the processor to use directly.",
  "starter": "The processor needs RAM because…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li>Permanent/secondary storage is too slow for the processor to access directly, so the program must be loaded into RAM // RAM can be accessed (almost) instantly by the processor</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept any answer that correctly identifies the speed difference between the two types of storage.</li>\n<li>Do not accept \"RAM is bigger\" or \"RAM never loses data\" — RAM is volatile, and size is not the reason given here.</li>\n</ul>\n</div>",
   "modelAnswer": "Because permanent storage is far too slow for the processor to use directly — the program has to be loaded into RAM, which the processor can access almost instantly."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:3bb57339",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "P3",
  "question": "<p>While the student is editing a video, the PC's power is suddenly cut and the PC switches off without warning.</p><p>Describe what happens to the unsaved edits in the video project, and explain why this happens.</p>",
  "caseStudy": "<p>A student uses a desktop PC to edit video footage for a media studies project. The PC has 16GB of RAM, and the video-editing software often has several large video files open at once.</p>",
  "hint": "Two things to cover: WHAT happens to the unsaved edits, and WHY — one particular property of RAM is the reason.",
  "starter": "What happens: … Why: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark for what happens, 1 mark for why)</h5>\n<ul>\n<li>The unsaved edits are lost // deleted (1)</li>\n<li>Because RAM is volatile, so its contents are lost when the power is removed (1)</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept \"the project reverts to the last save\" as equivalent to \"lost\".</li>\n<li>The reason must reference volatility/loss of power specifically, not a vague \"RAM stopped working\".</li>\n</ul>\n</div>",
   "modelAnswer": "The unsaved edits to the video project are lost. This happens because RAM is volatile, so everything held in it disappears the instant the power is removed — the project reverts to whatever was last saved to secondary storage."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:e01d541d",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "P4",
  "question": "<p>Give <strong>two</strong> examples of data that would be held in the weather station's RAM while it is running.</p>",
  "caseStudy": "<p>A school has installed an automatic weather station on its roof. The weather station is a small embedded computer that measures temperature, rainfall and wind speed every minute, and sends the readings to the school's server.</p><p>The weather station has both RAM and ROM.</p>",
  "hint": "Think about what's happening RIGHT NOW — the reading just taken, the measurement being sent — not data that has already been saved permanently.",
  "starter": "1: … | 2: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark each to max 2), e.g.</h5>\n<ul>\n<li>The temperature/rainfall/wind speed reading currently being measured</li>\n<li>The reading currently being prepared/sent to the school's server</li>\n<li>(Parts of) the operating system/monitoring program currently running</li>\n<li>The time the next reading is due to be taken</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Allow anything reasonable that is clearly data in current use, not data already stored permanently on the server.</li>\n</ul>\n</div>",
   "modelAnswer": "1: The temperature (or rainfall/wind speed) reading currently being measured\n\n2: The reading that is currently being prepared to send to the school's server"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:cdbaed56",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "mcq",
  "marks": 1,
  "num": "P5",
  "question": "<p>One of the 4GB laptops starts to run out of RAM during a lesson, so the operating system creates some virtual memory.</p><p>Where does this virtual memory actually exist?</p>",
  "options": [
   "In a partitioned section of the laptop's secondary storage, such as its SSD",
   "Inside the laptop's ROM chip, alongside the boot-up instructions",
   "Inside the CPU itself, in the same physical chip as the cache",
   "In a temporary area of RAM that is set aside and hidden from other programs"
  ],
  "caseStudy": "<p>A school issues laptops to students for use in lessons. Some of the laptops have 4GB of RAM, while others have 8GB of RAM.</p><p>Students often have several applications and browser tabs open at the same time during a lesson.</p>",
  "hint": "Virtual memory is not extra RAM — it's borrowed space from somewhere else in the computer, somewhere with plenty of spare capacity.",
  "key": {
   "answer": 0,
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li>In a partitioned section of the laptop's secondary storage — CAO</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Only the correct option scores.</li>\n</ul>\n</div>",
   "modelAnswer": "In a partitioned section of the laptop's secondary storage (e.g. its SSD)."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:4ac43416",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 3,
  "num": "P6",
  "question": "<p>A player installs several new games, and the console's 8GB of RAM becomes full while multiple games and apps are open at once.</p><p>Explain how virtual memory allows the console to keep running in this situation.</p>",
  "caseStudy": "<p>A games console has 8GB of RAM built in. When the console is switched on, it runs a start-up program stored in its ROM before loading the console's operating system.</p><p>Players can install and run several games and apps on the console.</p>",
  "hint": "Walk through it as a sequence: what triggers it, what moves where, and what happens when that data is needed again.",
  "starter": "When RAM becomes full, …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 3 marks (1 mark per point to max 3)</h5>\n<ul>\n<li>RAM being full/nearly full triggers the operating system to act</li>\n<li>Data/instructions that are not currently needed are moved out of RAM into virtual memory on secondary storage, freeing up space in RAM</li>\n<li>This frees enough space in RAM for the game/app that needs to run right now</li>\n<li>That data is transferred back into RAM again when it is next needed</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Award any 3 of the points above.</li>\n<li>Do not accept \"RAM gets bigger\" — virtual memory does not physically increase RAM.</li>\n</ul>\n</div>",
   "modelAnswer": "When RAM becomes full, the operating system moves data and instructions that aren't currently needed out of RAM into virtual memory, which is a section of secondary storage. This frees up enough space in RAM for the games/apps that are actually being used right now. When the swapped-out data is needed again, it is transferred back into RAM."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:da950979",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "P7",
  "question": "<p>The table has four statements about the weather station's memory. Tick (✓) <strong>one</strong> box in each row to show which component the statement describes.</p>",
  "caseStudy": "<p>A school has installed an automatic weather station on its roof. The weather station is a small embedded computer that measures temperature, rainfall and wind speed every minute, and sends the readings to the school's server.</p><p>The weather station has both RAM and ROM.</p>",
  "hint": "Match each statement to exactly one component — this table has one correct answer per row, not several.",
  "starter": "Row 1: … | Row 2: … | Row 3: … | Row 4: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark for each correctly ticked row)</h5>\n<ul>\n<li>Non-volatile, stores the boot-up instructions: <strong>ROM</strong></li>\n<li>Volatile, holds the readings currently being processed: <strong>RAM</strong></li>\n<li>Overflow section of secondary storage when RAM is nearly full: <strong>Virtual memory</strong></li>\n<li>Small, extremely fast, built into the processor: <strong>Cache</strong></li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>If more than one box is ticked in a row, 0 marks for that row.</li>\n</ul>\n</div>",
   "modelAnswer": "Row 1 (non-volatile, boot-up instructions): ROM.\nRow 2 (volatile, holds readings currently being processed): RAM.\nRow 3 (overflow on secondary storage when RAM is nearly full): Virtual memory.\nRow 4 (small, fast, built into the processor): Cache."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:fb7ec6de",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "P8",
  "question": "<p>A student notices that one of the 4GB laptops feels slow and laggy when they have many browser tabs and apps open at once during a lesson.</p><p>Explain, in terms of RAM and virtual memory, why this happens.</p>",
  "caseStudy": "<p>A school issues laptops to students for use in lessons. Some of the laptops have 4GB of RAM, while others have 8GB of RAM.</p><p>Students often have several applications and browser tabs open at the same time during a lesson.</p>",
  "hint": "Build a chain: what state is RAM in → what the operating system does about it → what has to happen when an old tab is clicked on again → why that specific step is slow.",
  "starter": "With many tabs and apps open, RAM becomes…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark per point to max 4)</h5>\n<ul>\n<li>RAM becomes full or nearly full because so many tabs/apps are open at once</li>\n<li>The operating system moves data/tabs that aren't currently being used out of RAM into virtual memory on secondary storage</li>\n<li>When the student switches back to one of those tabs, its data has to be transferred back into RAM</li>\n<li>This transfer is slow because secondary storage is much slower to access than RAM, which is why the laptop feels laggy</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Do not accept \"the laptop is old\" or \"too many tabs use up the internet\" — the explanation must be in terms of RAM/virtual memory.</li>\n</ul>\n</div>",
   "modelAnswer": "With many tabs and apps open, the laptop's 4GB of RAM becomes full or nearly full. The operating system responds by moving the data for tabs that aren't currently being looked at out of RAM and into virtual memory on secondary storage, to free up space. When the student clicks back onto one of those tabs, its data has to be transferred back into RAM before it can be used again. Because secondary storage is much slower to access than RAM, this back-and-forth transfer is what makes the laptop feel slow and laggy."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:592d5c90",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 6,
  "num": "P9",
  "question": "<p>The PC's 16GB of RAM sometimes fills up when several large video files are open in the editing software at once, so the operating system uses virtual memory.</p><p>Explain how virtual memory allows the PC to keep working in this situation, <strong>and</strong> explain why relying on virtual memory heavily can make the video-editing software feel slow to use.</p>",
  "caseStudy": "<p>A student uses a desktop PC to edit video footage for a media studies project. The PC has 16GB of RAM, and the video-editing software often has several large video files open at once.</p>",
  "hint": "Two halves, three marks each: first explain the MECHANISM of virtual memory (what moves, where, and back again), then explain the PERFORMANCE cost (why the swap itself takes time).",
  "starter": "Virtual memory helps because… However, relying on it heavily is slow because…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 6 marks (1 mark per point to max 3 in each half)</h5>\n<ul>\n<li><strong>How VM keeps the PC working (max 3)</strong> — virtual memory is a partitioned section of secondary storage used as overflow for RAM; footage not currently needed is moved out of RAM into virtual memory, freeing space; that data is transferred back into RAM when it is next needed</li>\n<li><strong>Why heavy use slows editing (max 3)</strong> — secondary storage is much slower to access than RAM; the software/CPU has to wait while data is swapped in and out; repeatedly swapping large video files causes noticeable lag/stutter while editing</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Award up to 3 marks in each half independently — a strong answer on only one half is capped at 3.</li>\n<li>Do not accept \"the PC needs more RAM\" alone as an explanation of the slowdown — the point must describe the swapping mechanism.</li>\n</ul>\n</div>",
   "modelAnswer": "Virtual memory is a partitioned section of the PC's secondary storage that acts as overflow for RAM. When the 16GB of RAM fills up, footage that isn't currently being worked on is moved out of RAM into virtual memory, freeing up space for the footage that is active. When that footage is needed again, it is transferred back into RAM.\n\nHowever, relying on this heavily slows the software down, because secondary storage is much slower to access than RAM. Every time data has to be swapped in or out, the software has to wait for that slow transfer to finish — with several large video files being swapped repeatedly, this causes noticeable lag, stuttering or freezing while editing."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:exam:b1265995",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "exam",
  "type": "written",
  "marks": 8,
  "num": "P10",
  "question": "<p>The school is deciding whether to buy new laptops with 4GB of RAM, which are cheaper, or 8GB of RAM, which cost more.</p><p>Discuss the impact that the amount of RAM in the school's laptops could have on students' experience of using multiple applications during lessons.</p><p>In your answer you might consider:</p><ul><li>how RAM and virtual memory work</li><li>the effect on performance</li><li>the effect on students' learning</li><li>the cost to the school</li></ul>",
  "caseStudy": "<p>A school issues laptops to students for use in lessons. Some of the laptops have 4GB of RAM, while others have 8GB of RAM.</p><p>Students often have several applications and browser tabs open at the same time during a lesson.</p>",
  "hint": "Use all four bullets as your plan. Explain the mechanism (RAM full → virtual memory → slower), then follow it through to a REAL consequence for a lesson, and weigh the RAM cost against that consequence for a top-band answer.",
  "starter": "With only 4GB of RAM, students who open several applications at once will find that…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 8 marks (levelled) — indicative content</h5>\n<p>The following is indicative of possible factors/evidence that candidates may refer to but is not prescriptive or exhaustive:</p>\n<ul>\n<li><strong>How RAM/virtual memory work</strong> — RAM holds the data/instructions currently in use; with less RAM (4GB) it fills up sooner when several applications/tabs are open; the operating system then relies on virtual memory, swapping data out to (and back from) secondary storage more often.</li>\n<li><strong>Effect on performance</strong> — 8GB of RAM can hold more open applications at once without needing virtual memory, so it stays responsive; 4GB laptops will lag, freeze briefly or respond slowly as data is swapped in and out of the much slower secondary storage; the more applications open at once, the more noticeable this becomes.</li>\n<li><strong>Effect on students' learning</strong> — lag/freezing during a lesson can interrupt a student's work, waste lesson time, and cause frustration; students on 4GB laptops may be forced to keep fewer tabs/programs open at once, limiting what tasks they can do compared to peers on 8GB devices.</li>\n<li><strong>Cost to the school</strong> — 4GB laptops are cheaper, allowing the school to buy more devices or spend the savings elsewhere; 8GB laptops cost more per device, so the school may afford fewer of them or have to prioritise which students/subjects get them.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given — levels of response</h5>\n<ul>\n<li><strong>Mark Band 3 — High Level (6–8 marks):</strong> Thorough knowledge and understanding of RAM/virtual memory, applied directly and consistently to the school laptop context. The response weighs up both sides (performance/learning impact against cost) and covers all four areas from the bullet list with clear, logically structured reasoning.</li>\n<li><strong>Mark Band 2 — Mid Level (3–5 marks):</strong> Reasonable knowledge of RAM/virtual memory, generally accurate but at times underdeveloped or only partly applied to the context. Most of the four areas are addressed, with some structure, though the discussion may not fully weigh both sides.</li>\n<li><strong>Mark Band 1 — Low Level (1–2 marks):</strong> Basic knowledge with limited understanding shown; the material may contain inaccuracies or barely refer to the laptop context. Little more than an unsupported assertion, e.g. \"4GB is worse than 8GB\" with no working explanation of why.</li>\n<li><strong>0 marks:</strong> No attempt to answer the question or response is not worthy of credit.</li>\n</ul>\n</div>",
   "modelAnswer": "With only 4GB of RAM, students who open several applications at once will find that RAM fills up much sooner than on an 8GB laptop. Once RAM is nearly full, the operating system starts using virtual memory, moving data that isn't currently needed out of RAM and into a partitioned area of secondary storage, and moving it back again whenever it's next needed.\n\nBecause secondary storage is far slower to access than RAM, this swapping makes the 4GB laptops noticeably laggier — programs take longer to respond, and switching back to an app that was swapped out can cause a brief freeze. On the 8GB laptops, more applications can stay in RAM at once, so this happens far less often and the laptop stays responsive.\n\nFor students, this can mean lost lesson time, frustration, and having to keep fewer tabs or programs open than classmates on 8GB devices, which could limit what tasks they can complete in a lesson.\n\nHowever, 4GB laptops are cheaper, so the school could buy more devices for the same budget, or spend the savings on other resources. On balance, the extra 4GB is likely to noticeably improve the day-to-day experience of using multiple applications, but the school has to weigh that benefit against being able to afford fewer laptops overall."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:b4b4ad51",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Why can't the CPU run a program directly from secondary storage?",
  "options": [
   "Secondary storage only stores files, never the program code itself, so there is nothing to run directly",
   "Secondary storage is far slower to access than RAM, so the program is loaded into RAM first",
   "Secondary storage is a type of ROM, and ROM cannot be used to run user programs directly",
   "The operating system automatically deletes a program from secondary storage as soon as it starts running"
  ],
  "key": {
   "answer": 1,
   "explain": "Secondary storage is permanent but too slow for the CPU to use directly, so a program's code and data are loaded into RAM before it can run."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:3ba167d9",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which best describes RAM?",
  "options": [
   "Non-volatile memory that permanently stores the boot-up instructions needed to start the computer",
   "Volatile memory that holds the programs, data and parts of the OS currently in use",
   "A type of secondary storage device used to store the user's files and programs permanently",
   "Memory built into the CPU that can never be written to once it has been manufactured"
  ],
  "key": {
   "answer": 1,
   "explain": "RAM holds whatever is currently running and is volatile — it loses its contents when the power is off."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:3ba1a367",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which best describes ROM?",
  "options": [
   "Volatile memory that loses all of its contents every time the computer is switched off",
   "Non-volatile memory that stores the boot-up instructions and normally cannot be changed",
   "Memory used to store the user's saved documents and files permanently, even after the power is off",
   "A partitioned section of secondary storage used as overflow space when RAM is full"
  ],
  "key": {
   "answer": 1,
   "explain": "ROM is non-volatile and holds the fixed boot-up instructions the computer needs every time it starts."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:4d6ed5d7",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "What happens to the contents of RAM when the power is turned off?",
  "options": [
   "They are saved automatically to ROM",
   "They are lost",
   "They are compressed",
   "Nothing changes"
  ],
  "key": {
   "answer": 1,
   "explain": "RAM is volatile, so everything in it disappears the instant power is removed."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:d0611fae",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A smart TV stores its start-up instructions somewhere that must survive being switched off and can't normally be altered. Which type of memory is this?",
  "options": [
   "RAM",
   "ROM",
   "Virtual memory",
   "Cache"
  ],
  "key": {
   "answer": 1,
   "explain": "Instructions that must survive power-off and stay fixed are stored in ROM, which is non-volatile and normally unchangeable."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:962e5ade",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which of these would normally be found in RAM while a computer is running?",
  "options": [
   "The washing machine's control program (embedded in ROM)",
   "The document currently open in a word processor",
   "A file saved permanently on the hard drive but not open",
   "The manufacturer's original factory boot settings"
  ],
  "key": {
   "answer": 1,
   "explain": "RAM holds what's currently in use — an open document — not permanently stored, unopened files or fixed boot instructions."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:70c51924",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Why does a computer use virtual memory?",
  "options": [
   "To physically increase the amount of RAM chips fitted inside the computer",
   "To give the CPU a small, extremely fast store for its most frequently used instructions",
   "To act as extra space when RAM is full or nearly full, using secondary storage",
   "To replace the boot-up instructions normally held in ROM when the computer starts"
  ],
  "key": {
   "answer": 2,
   "explain": "Virtual memory is overflow space on secondary storage, used when RAM runs low — it doesn't physically enlarge RAM."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:06c67b39",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Where does virtual memory physically exist?",
  "options": [
   "Inside the CPU, alongside the registers used to hold data being processed",
   "In a partitioned section of secondary storage, such as part of the hard drive or SSD",
   "Inside ROM, alongside the fixed boot-up instructions the computer needs every time it starts",
   "In the cache, next to the frequently used instructions and data stored there"
  ],
  "key": {
   "answer": 1,
   "explain": "Virtual memory is a section of secondary storage (e.g. the SSD or hard drive) set aside to act as overflow for RAM."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:915a01b3",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "When RAM starts to fill up, what does the operating system do?",
  "options": [
   "Permanently deletes whichever files it judges to be the least important, to free up space in RAM",
   "Moves data that isn't currently needed out of RAM into virtual memory on secondary storage",
   "Increases the CPU's clock speed so it can process the backlog of data more quickly",
   "Copies the extra data into ROM, since ROM has spare capacity to hold it temporarily"
  ],
  "key": {
   "answer": 1,
   "explain": "Data not currently needed is swapped out of RAM into virtual memory, freeing up space for what's needed right now."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:363962d3",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Why can heavy use of virtual memory make a computer feel slower?",
  "options": [
   "Storing data in virtual memory uses noticeably more electricity than storing the same data in RAM",
   "Secondary storage is much slower to access than RAM, so swapping data in and out takes time",
   "Virtual memory permanently deletes any data that gets swapped out of RAM into it",
   "Using virtual memory automatically reduces the CPU's clock speed while it is active"
  ],
  "key": {
   "answer": 1,
   "explain": "Every swap in or out of virtual memory means waiting on secondary storage, which is far slower than RAM."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:325029aa",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "What is cache, and where does it sit in the memory hierarchy?",
  "options": [
   "The largest, slowest type of storage in the computer, used to hold permanent files",
   "A small, very fast store inside the CPU that sits between the CPU and RAM",
   "A partitioned section of secondary storage used as overflow space when RAM runs low",
   "The same non-volatile memory as ROM, just given a different name by manufacturers"
  ],
  "key": {
   "answer": 1,
   "explain": "Cache is small, very fast memory inside the CPU that holds frequently used instructions and data — faster than RAM, but smaller."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:mcq:64d9dc5b",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Put these in order from FASTEST to SLOWEST to access:",
  "options": [
   "Registers, cache, RAM, secondary storage",
   "Secondary storage, RAM, cache, registers",
   "RAM, registers, secondary storage, cache",
   "Cache, secondary storage, RAM, registers"
  ],
  "key": {
   "answer": 0,
   "explain": "Registers are fastest (inside the CPU), then cache, then RAM, then secondary storage, which is slowest but has by far the most capacity."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:tf:30e5241f",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "RAM is non-volatile, so it keeps its contents when the power is off.",
  "key": {
   "answer": false,
   "explain": "RAM is volatile — it is ROM that is non-volatile. Everything in RAM is lost the instant the power is removed."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:tf:352f4433",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "ROM normally cannot be changed once the computer is manufactured.",
  "key": {
   "answer": true,
   "explain": "Correct — ROM is read-only. This is deliberate: it protects the boot-up instructions the computer relies on every time it starts."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:tf:e69499e0",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "A computer could run all its programs directly from secondary storage without ever using RAM.",
  "key": {
   "answer": false,
   "explain": "Secondary storage is far too slow for the CPU to use directly. Programs must be loaded into RAM before they can run."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:tf:d04c441c",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Virtual memory is a section of secondary storage used as overflow when RAM is nearly full.",
  "key": {
   "answer": true,
   "explain": "Correct — the operating system partitions part of secondary storage to act as extra space for RAM when it's running low."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:tf:aacb0f13",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Once data is swapped out of RAM into virtual memory, it stays there permanently and never returns.",
  "key": {
   "answer": false,
   "explain": "Virtual memory is two-way. Data is transferred back into RAM whenever it is needed again."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:tf:7421ce84",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Cache sits between the CPU and RAM, storing frequently used instructions and data.",
  "key": {
   "answer": true,
   "explain": "Correct — cache is faster and smaller than RAM, and holds the instructions/data the CPU keeps reaching for."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:tf:7d8cc268",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Using a lot of virtual memory usually makes a computer run faster.",
  "key": {
   "answer": false,
   "explain": "The opposite — secondary storage is far slower than RAM, so heavy swapping in and out of virtual memory slows the computer down."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:tf:76fdfc93",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "The instructions that start a computer up (the bootstrap program) are stored in ROM.",
  "key": {
   "answer": true,
   "explain": "Correct — ROM's whole job is to hold these boot-up instructions safely, unchanged, across every power-off."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:learn:4ae2945e",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Why does a computer need primary storage?",
  "reading": "<h4>Why can't the CPU just use secondary storage?</h4>\n<ul>\n<li>A computer's <strong>secondary storage</strong> — its SSD or hard drive — holds files and programs <em>permanently</em>, but it is far too <strong>slow</strong> for the CPU to work from directly.</li>\n<li><strong>Primary storage</strong> is the memory the CPU is wired to and can access almost instantly. Before any program can run, it must first be <strong>loaded</strong> from secondary storage into primary storage.</li>\n<li>Everyday example: double-clicking a game icon doesn't run the game straight off the hard drive — it copies the game's code and data into RAM first, which is why there's a short pause while it \"loads\".</li>\n</ul>\n<h4>Two very different jobs</h4>\n<ul>\n<li>Primary storage actually covers <strong>two</strong> different types of memory with opposite jobs: <strong>RAM</strong>, which holds whatever is currently running, and <strong>ROM</strong>, which holds the fixed instructions needed to start the computer up.</li>\n<li>Both sit inside primary storage because both must be instantly accessible to the CPU — but what they store, and whether they can be changed, are completely different (next two cards).</li>\n</ul>",
  "question": "Why can't a program run directly from an SSD or hard drive?",
  "options": [
   "Secondary storage can only hold data files, never the actual program code itself, so there is nothing to load",
   "Secondary storage is far too slow for the CPU to access directly, so the program is loaded into RAM first",
   "The CPU has no physical connection to secondary storage, so data cannot move between them at all",
   "Programs are always stored permanently in ROM instead of on secondary storage"
  ],
  "key": {
   "answer": 1,
   "explain": "Secondary storage is permanent but slow. The CPU needs data at the speed of primary storage, so programs are loaded into RAM before they run."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:learn:808cb51c",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "RAM — the computer's working memory",
  "reading": "<h4>What RAM actually holds</h4>\n<ul>\n<li><strong>RAM (Random Access Memory)</strong> holds the programs, data and parts of the operating system that are <strong>currently running</strong>. As soon as you open an app, its code and data are copied into RAM.</li>\n<li>RAM is <strong>volatile</strong> — everything inside it is <strong>lost the instant the power is switched off</strong>. That's why unsaved work disappears if a computer suddenly loses power.</li>\n</ul>\n<h4>RAM can be read AND written</h4>\n<ul>\n<li>Unlike ROM, the CPU can both <strong>read from</strong> and <strong>write to</strong> RAM constantly — that's essential, because the contents of RAM change every fraction of a second as programs run.</li>\n<li>Everyday example: typing this sentence changes the contents of RAM instantly; nothing is written to the hard drive until you actually save.</li>\n</ul>\n<h4>Why the amount of RAM matters</h4>\n<ul>\n<li>RAM has a fixed, limited size. The more RAM a computer has, the more programs and data it can hold <strong>at once</strong> without running out of space — which is exactly the problem virtual memory exists to solve (later card).</li>\n</ul>",
  "question": "Which of these is true about RAM?",
  "options": [
   "It is non-volatile, and keeps all of its contents safely even when the power is switched off",
   "It is volatile, and holds the programs and data currently in use",
   "It can only be read from by the CPU, and can never be written to at all",
   "It stores the fixed instructions that start the computer up when it is switched on"
  ],
  "key": {
   "answer": 1,
   "explain": "RAM is volatile — its contents vanish without power — and it holds whatever is currently running, not permanent files (that's secondary storage) or start-up instructions (that's ROM)."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:learn:ac661e72",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "ROM — the permanent, unchanging instructions",
  "reading": "<h4>What ROM actually holds</h4>\n<ul>\n<li><strong>ROM (Read Only Memory)</strong> stores the <strong>boot-up instructions</strong> — the very first program a computer runs the moment it is switched on, sometimes called the <strong>bootstrap program</strong>. Its job is to start loading the operating system from secondary storage into RAM.</li>\n<li>ROM is <strong>non-volatile</strong> — its contents <strong>survive</strong> the power being switched off. That's essential: the computer needs those instructions to be there, unchanged, every single time it starts.</li>\n</ul>\n<h4>Why \"read only\"?</h4>\n<ul>\n<li>ROM <strong>normally cannot be changed</strong> once it is set. The CPU can read from it, but not write new data to it.</li>\n<li>This is a deliberate design choice, not a limitation: if the boot-up instructions could be casually overwritten — by a virus, a bug, or a power cut mid-write — the computer might never start again.</li>\n</ul>\n<h4>ROM is not \"extra storage\"</h4>\n<ul>\n<li>ROM is tiny and dedicated to one job. It never stores your files, photos or installed apps — that is secondary storage's job.</li>\n</ul>",
  "question": "Why must ROM be non-volatile?",
  "options": [
   "So it can permanently store all of the user's saved files, documents and photos",
   "So the boot-up instructions needed to start the computer are always there, even after a power cut",
   "Because ROM is significantly faster to access than RAM for the CPU to use",
   "Because the entire operating system runs directly from ROM the whole time the computer is switched on"
  ],
  "key": {
   "answer": 1,
   "explain": "The bootstrap/boot-up instructions in ROM must survive every power-off so the computer can always start up and begin loading the operating system."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:learn:fef8e38a",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "RAM vs ROM — the three differences",
  "reading": "<h4>The three differences examiners ask for</h4>\n<table><tr><th></th><th>RAM</th><th>ROM</th></tr>\n<tr><td><strong>Volatility</strong></td><td>Volatile — loses contents when power is off</td><td>Non-volatile — keeps contents when power is off</td></tr>\n<tr><td><strong>Contents</strong></td><td>Currently running programs, data and parts of the OS</td><td>The boot-up (bootstrap) instructions</td></tr>\n<tr><td><strong>Changeability</strong></td><td>Can be written to and changed constantly</td><td>Normally cannot be changed</td></tr>\n</table>\n<h4>Answer BOTH sides, in the same space</h4>\n<ul>\n<li>A \"state the difference\" question is only worth full marks when you write <strong>both</strong> halves together: <em>\"RAM is volatile, whereas ROM is non-volatile.\"</em></li>\n<li>Writing everything about RAM first and everything about ROM afterwards, in separate sentences, is marked as <strong>two descriptions</strong>, not one difference — and it is a genuine, common way to lose the mark.</li>\n</ul>",
  "question": "Which answer correctly states ONE difference between RAM and ROM?",
  "options": [
   "RAM stores the programs and data that are currently running on the computer.",
   "ROM is non-volatile, so it does not need power to keep its contents safe.",
   "RAM is volatile, whereas ROM is non-volatile.",
   "RAM and ROM are both examples of memory used inside every modern computer."
  ],
  "key": {
   "answer": 2,
   "explain": "A difference needs both sides contrasted together in the same sentence. The first two options only describe one side each; the last isn't a difference at all."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:learn:3a8fc244",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Virtual memory — borrowing space from secondary storage",
  "reading": "<h4>The problem virtual memory solves</h4>\n<ul>\n<li>RAM is fast, but it is also limited in size and expensive. Sometimes a computer needs to run more programs and data <strong>at once</strong> than will physically fit in RAM.</li>\n<li><strong>Virtual memory</strong> is the operating system's solution: it <strong>partitions a section of secondary storage</strong> to act as an overflow extension of RAM.</li>\n</ul>\n<h4>How data moves between RAM and virtual memory</h4>\n<ul>\n<li>When RAM is <strong>full, or nearly full</strong>, the operating system moves data that <strong>isn't currently needed</strong> out of RAM and into virtual memory on secondary storage. This frees up space in RAM for whatever needs to run right now.</li>\n<li>When that data is needed again, it is transferred <strong>back</strong> from virtual memory into RAM. Virtual memory is a two-way system — data does not stay there forever.</li>\n<li>Everyday example: with many browser tabs and apps open at once, an older, untouched tab may be swapped out to virtual memory; switching back to it feels briefly slower while it's swapped back into RAM.</li>\n</ul>\n<h4>The trade-off: it's much slower</h4>\n<ul>\n<li>Secondary storage is dramatically slower to access than RAM. Using virtual memory heavily makes a computer feel sluggish, because the CPU keeps waiting for data to be swapped in and out.</li>\n<li>This is exactly why <strong>adding more RAM</strong> improves performance — it reduces how often the computer has to fall back on slow virtual memory.</li>\n</ul>",
  "question": "When does the operating system start using virtual memory?",
  "options": [
   "As soon as the computer is switched on",
   "When RAM is full or nearly full",
   "When ROM is full",
   "Whenever a file is saved"
  ],
  "key": {
   "answer": 1,
   "explain": "Virtual memory is overflow space used specifically when RAM is running out — not something used constantly by default."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:learn:b624a20f",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Cache and the memory hierarchy",
  "reading": "<h4>Where cache fits</h4>\n<ul>\n<li><strong>Cache</strong> is a small amount of very fast memory built into the CPU. It stores the instructions and data used <strong>most frequently</strong>, so the CPU can fetch them without the delay of going all the way out to RAM.</li>\n<li>Cache sits <strong>between the CPU and RAM</strong> in terms of both speed and size: faster and smaller than RAM, but slower and bigger than the CPU's own registers.</li>\n</ul>\n<h4>The memory hierarchy</h4>\n<ul>\n<li>Every layer of storage trades <strong>speed</strong> against <strong>capacity and cost</strong>. Moving down the hierarchy, each layer gets <strong>slower, bigger and cheaper per byte</strong>:</li>\n</ul>\n<svg viewBox=\"0 0 480 230\" width=\"100%\" height=\"230\" role=\"img\" aria-label=\"Memory hierarchy diagram, fastest and smallest at the top narrowing down to slowest and largest at the bottom: registers, cache, RAM, secondary storage\">\n<rect x=\"160\" y=\"10\" width=\"160\" height=\"42\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/>\n<text x=\"240\" y=\"36\" text-anchor=\"middle\" fill=\"currentColor\" font-size=\"14\">Registers</text>\n<rect x=\"130\" y=\"62\" width=\"220\" height=\"42\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/>\n<text x=\"240\" y=\"88\" text-anchor=\"middle\" fill=\"currentColor\" font-size=\"14\">Cache</text>\n<rect x=\"90\" y=\"114\" width=\"300\" height=\"42\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/>\n<text x=\"240\" y=\"140\" text-anchor=\"middle\" fill=\"currentColor\" font-size=\"14\">RAM (primary storage)</text>\n<rect x=\"30\" y=\"166\" width=\"420\" height=\"42\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/>\n<text x=\"240\" y=\"192\" text-anchor=\"middle\" fill=\"currentColor\" font-size=\"14\">Secondary storage</text>\n<text x=\"10\" y=\"20\" fill=\"currentColor\" font-size=\"11\">faster</text>\n<text x=\"10\" y=\"215\" fill=\"currentColor\" font-size=\"11\">bigger &amp; cheaper</text>\n<line x1=\"10\" y1=\"28\" x2=\"10\" y2=\"200\" stroke=\"currentColor\" stroke-width=\"1\"/>\n</svg>\n<ul>\n<li><strong>Registers</strong> (inside the CPU) — tiny, fastest of all, hold the data being processed right now.</li>\n<li><strong>Cache</strong> — very fast, small, holds frequently used instructions and data.</li>\n<li><strong>RAM (primary storage)</strong> — fast, holds everything currently running.</li>\n<li><strong>Secondary storage</strong> — slow, but huge and permanent; also where virtual memory lives.</li>\n</ul>",
  "question": "Put these in order from fastest to slowest to access.",
  "options": [
   "Registers, cache, RAM, secondary storage",
   "Cache, registers, secondary storage, RAM",
   "RAM, cache, registers, secondary storage",
   "Secondary storage, cache, RAM, registers"
  ],
  "key": {
   "answer": 0,
   "explain": "Registers (inside the CPU) are fastest, then cache, then RAM, then secondary storage — each step down trades speed for more (cheaper) capacity."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:misc:c24af834",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> 'RAM is just extra storage space, like a bigger hard drive.'</p><p><strong>✅ The correct idea:</strong> RAM and secondary storage do completely different jobs. RAM is <strong>temporary working memory</strong> — it loses everything when the power is off, and only holds what's <em>currently</em> running. A hard drive or SSD stores files <strong>permanently</strong>. Wanting to store more photos and documents needs more secondary storage, not more RAM.</p>",
  "question": "A student wants to permanently store thousands more photos. What should they upgrade?",
  "options": [
   "RAM, since more working memory helps programs run more smoothly",
   "ROM, since it can be reprogrammed to hold extra file storage",
   "Secondary storage, since it stores files permanently in large amounts",
   "Cache, since it can be expanded to hold as many extra photo files as needed"
  ],
  "key": {
   "answer": 2,
   "explain": "Permanent files need more secondary storage. RAM is temporary working memory and is lost when the power is off."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:misc:526741bc",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> 'The computer can run programs directly from the SSD or hard drive without needing RAM.'</p><p><strong>✅ The correct idea:</strong> The CPU cannot work directly with secondary storage — it is far too slow. Every program's code and data must first be <strong>loaded into RAM</strong>, which the CPU can access almost instantly. That loading pause is exactly what you see when an app or game first opens.</p>",
  "question": "Why does an app take a moment to 'load' when you open it?",
  "options": [
   "It is being installed onto the computer for the very first time",
   "Its code and data are being copied from secondary storage into RAM",
   "It is checking an online server for the latest software updates",
   "The instructions stored in ROM are being rewritten to match the app"
  ],
  "key": {
   "answer": 1,
   "explain": "The CPU needs the app in RAM before it can run it, since secondary storage is too slow to use directly."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:misc:bdc7868a",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> 'ROM can be freely rewritten by the user, just like RAM.'</p><p><strong>✅ The correct idea:</strong> ROM normally <strong>cannot</strong> be changed once it is set. That's the entire point — the boot-up instructions must be there, exactly the same, every single time the computer starts. RAM is the one that is constantly read and written to as programs run.</p>",
  "question": "Why is ROM designed so it normally cannot be changed?",
  "options": [
   "To save money during manufacturing, since fixed memory chips are cheaper to produce",
   "So the boot-up instructions are always intact and reliable, even after a power cut or a fault",
   "Because ROM physically has no spare capacity left for any new data to ever be written into it at all",
   "Because the entire operating system is permanently stored and run from inside ROM"
  ],
  "key": {
   "answer": 1,
   "explain": "If the boot-up instructions could be casually overwritten, the computer might fail to start at all — so ROM is fixed by design."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:misc:5a970b9e",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> 'Virtual memory makes the computer's RAM permanently bigger.'</p><p><strong>✅ The correct idea:</strong> Virtual memory does not create more real RAM. It is <strong>slow overflow space on secondary storage</strong>, used temporarily to hold data that isn't needed right now. Because secondary storage is much slower than RAM, relying on virtual memory a lot makes a computer feel sluggish, not faster.</p>",
  "question": "What is virtual memory actually made from?",
  "options": [
   "Extra RAM chips that are physically fitted inside the CPU itself",
   "A partitioned section of secondary storage, such as the hard drive",
   "A dedicated partition of ROM set aside for temporary overflow data",
   "The CPU's cache memory, temporarily repurposed for overflow storage"
  ],
  "key": {
   "answer": 1,
   "explain": "Virtual memory is space borrowed from secondary storage — it doesn't physically add RAM to the computer."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:misc:98a05649",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> 'Once data is swapped into virtual memory, it stays there and never returns to RAM.'</p><p><strong>✅ The correct idea:</strong> Virtual memory works <strong>both ways</strong>. Data is moved out of RAM into virtual memory to free up space, and moved <strong>back</strong> into RAM whenever it's needed again — that back-and-forth is exactly why heavy use of virtual memory slows a computer down.</p>",
  "question": "What happens when data that has been swapped into virtual memory is needed again?",
  "options": [
   "Nothing — it stays in virtual memory permanently",
   "It is transferred back into RAM",
   "It is deleted and reloaded from ROM",
   "The CPU reads it directly from secondary storage without using RAM"
  ],
  "key": {
   "answer": 1,
   "explain": "Virtual memory is a two-way system: data is swapped back into RAM as soon as it's needed again."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:misc:7fe98429",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> For 'state the difference between RAM and ROM', writing everything about RAM first, then everything about ROM afterwards, as two separate points.</p><p><strong>✅ The correct idea:</strong> A <strong>difference</strong> needs both sides written together in the <em>same</em> answer space: 'RAM is volatile, whereas ROM is non-volatile.' Describing RAM fully and then describing ROM fully is marked as two separate descriptions, not one difference — real candidates lost marks for exactly this pattern, and others lost the mark by describing what RAM/ROM are <em>used for</em> rather than a fundamental difference between them.</p>",
  "question": "Which is properly written as ONE difference between RAM and ROM?",
  "options": [
   "RAM stores currently running programs. ROM stores boot-up instructions.",
   "RAM is volatile, whereas ROM is non-volatile.",
   "RAM is fast.",
   "ROM is used to start the computer."
  ],
  "key": {
   "answer": 1,
   "explain": "One difference = both sides, directly contrasted, in the same sentence. The others give only one side, or describe use rather than a fundamental difference."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:tips:08b37047",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "tip — 1-mark 'state the difference' — both sides, one sentence",
  "reading": "<p>When OCR asks you to <strong>state the difference</strong> between RAM and ROM, the mark is only released when your answer contrasts <strong>both sides together</strong>. Here's the same idea at every level:</p>\n\n<p><strong>❌ 0 marks:</strong> \"RAM is volatile.\"</p>\n<ul>\n<li>True, but it's only half a difference. On its own this doesn't say what ROM does differently.</li>\n</ul>\n\n<p><strong>❌ 0 marks (real candidate pattern):</strong> \"RAM stores the currently running programs. ROM stores the boot-up instructions.\"</p>\n<ul>\n<li>This describes what each one is <em>used for</em>, not a fundamental difference — and each sentence stands alone rather than being contrasted, so it reads as two descriptions, not one difference.</li>\n</ul>\n\n<p><strong>✅ 1 mark:</strong> \"RAM is volatile, <strong>whereas</strong> ROM is non-volatile.\"</p>\n<ul>\n<li>Both sides, one sentence, one direct contrast. \"Whereas\" (or \"but\"/\"while\") is doing the work here — it forces you to say both halves.</li>\n</ul>\n\n<p><strong>The pattern for every 1-mark difference:</strong> \"[RAM] is ___, whereas [ROM] is ___.\" If your sentence could be true without mentioning the other one at all, it isn't a difference yet.</p>",
  "question": "Which answer would score the mark for 'state the difference between RAM and ROM'?",
  "options": [
   "ROM is non-volatile, so its contents survive a power cut.",
   "RAM is volatile, whereas ROM is non-volatile.",
   "RAM stores the operating system, while ROM stores the BIOS setup.",
   "RAM and ROM are both essential types of computer memory."
  ],
  "key": {
   "answer": 1,
   "explain": "Only the second option contrasts both sides in one sentence. The others give one side only, describe use rather than a difference, or aren't a difference at all."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:tips:f0728dca",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "explain — 2-mark 'explain why both are needed' — two separate reasons",
  "reading": "<p>\"Explain why a computer needs both primary <strong>and</strong> secondary storage\" [2] is marked as <strong>two separate 1-mark reasons</strong> — one for primary, one for secondary. It is NOT a point-plus-development chain; you need to earn each side on its own.</p>\n\n<p><strong>❌ 0/2:</strong> \"Primary storage stores data and secondary storage stores files.\"</p>\n<ul>\n<li>This says <em>what</em> they store, not <em>why</em> each is needed — the examiner's own note is explicit that this question is not about what they store.</li>\n</ul>\n\n<p><strong>⚠️ 1/2:</strong> \"A computer needs primary storage so the processor can access the data and instructions it's currently using.\"</p>\n<ul>\n<li>A correct, creditworthy reason for primary — but nothing has been said about secondary storage yet, so only 1 mark is available.</li>\n</ul>\n\n<p><strong>✅ 2/2:</strong> \"Primary storage is needed so the processor can access the data, instructions and software it's currently using <strong>(1)</strong>. Secondary storage is needed to store the user's files and programs long-term, so they aren't lost when the power is turned off <strong>(1)</strong>.\"</p>\n\n<p><strong>The trap examiners flagged:</strong> a common misconception is that secondary storage is \"only used as a backup\", or is \"used when primary storage is full\" — neither is the real reason. Secondary storage's job is <strong>long-term, permanent</strong> storage of files, independent of how full RAM is.</p>",
  "question": "A student writes a strong reason for needing primary storage, but says nothing about secondary storage. What mark do they get?",
  "options": [
   "0 out of 2",
   "1 out of 2 — each side is worth its own mark",
   "2 out of 2, because primary is the harder half",
   "It depends on word count"
  ],
  "key": {
   "answer": 1,
   "explain": "The two marks are independent — one for a correct reason for primary storage, one for a correct reason for secondary storage. Only covering one side caps you at 1."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:tips:4a9cabf0",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "evaluate — The virtual memory True/False table — precision matters",
  "reading": "<p>A common 4-mark format gives four statements about virtual memory and asks you to tick the ones that are <strong>true</strong>, and <strong>rewrite</strong> the false ones to make them true — one mark per row.</p>\n\n<p><strong>What real candidates got right and wrong on this exact question:</strong></p>\n<ul>\n<li>Almost everyone correctly spotted \"VM is needed when RAM is full, or nearly full\" as <strong>true</strong> — that's the easy row.</li>\n<li>\"A section of primary storage is partitioned to act as virtual memory\" was usually corrected well, to <strong>secondary</strong> storage.</li>\n<li>\"Data from ROM is transferred into VM\" was sometimes corrected to RAM — but sometimes wrongly changed to \"secondary storage\" instead, which misses the point (data moves <em>from RAM</em>, not from secondary storage, into virtual memory).</li>\n<li>\"Data from VM is transferred back to secondary storage when needed\" was frequently corrected to just \"<strong>primary storage</strong>\" — and that was <strong>not precise enough</strong>. Primary storage includes ROM and cache as well as RAM; the mark scheme specifically wants <strong>RAM</strong> named.</li>\n</ul>\n\n<p><strong>The rule this teaches:</strong> when you correct a VM statement, name <strong>RAM</strong> and <strong>secondary storage</strong> specifically — never the vaguer \"primary storage\" — because virtual memory is defined as data moving between RAM and secondary storage, not primary storage in general.</p>",
  "question": "A student corrects 'Data from VM is transferred back to secondary storage when needed' by writing 'transferred back to primary storage'. Why does this not score the mark?",
  "options": [
   "It should have been left uncorrected, since the original statement was already true",
   "'Primary storage' is too vague — it includes ROM and cache, not just RAM",
   "The word order in the correction is wrong and needs to be rearranged",
   "Virtual memory never transfers any data back into RAM once it has been swapped out"
  ],
  "key": {
   "answer": 1,
   "explain": "The precise correction is RAM, not the broader term 'primary storage', which also covers ROM and cache and so doesn't accurately describe how VM works."
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:fib:29afd061",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "RAM is _____, so its contents are lost the moment the power is switched off.",
  "blankOptions": {
   "B1": [
    "RAM",
    "volatile",
    "cache",
    "boot-up"
   ]
  },
  "key": {
   "blanks": {
    "B1": "volatile"
   }
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:fib:b5a17928",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "ROM is _____, so its contents survive being switched off and normally cannot be changed.",
  "blankOptions": {
   "B1": [
    "boot-up",
    "secondary",
    "non-volatile",
    "needed"
   ]
  },
  "key": {
   "blanks": {
    "B1": "non-volatile"
   }
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:fib:2567b58d",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "ROM stores the _____ instructions that run the moment a computer is switched on.",
  "blankOptions": {
   "B1": [
    "virtual",
    "volatile",
    "boot-up",
    "RAM"
   ]
  },
  "key": {
   "blanks": {
    "B1": "boot-up"
   }
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:fib:4cb42e17",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "Before the CPU can run a program, it must be loaded from secondary storage into _____.",
  "blankOptions": {
   "B1": [
    "secondary",
    "needed",
    "RAM",
    "cache"
   ]
  },
  "key": {
   "blanks": {
    "B1": "RAM"
   }
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:fib:e0f921ce",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "A section of secondary storage acts as _____ memory when RAM is full or nearly full.",
  "blankOptions": {
   "B1": [
    "virtual",
    "non-volatile",
    "RAM",
    "volatile"
   ]
  },
  "key": {
   "blanks": {
    "B1": "virtual"
   }
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:fib:2b2d7d20",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "Data that is moved out of RAM into virtual memory is brought back in again when it is next _____.",
  "blankOptions": {
   "B1": [
    "non-volatile",
    "virtual",
    "needed",
    "volatile"
   ]
  },
  "key": {
   "blanks": {
    "B1": "needed"
   }
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:fib:ef1c8e61",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "The small, very fast store inside the CPU that holds frequently used data is called the _____.",
  "blankOptions": {
   "B1": [
    "boot-up",
    "RAM",
    "secondary",
    "cache"
   ]
  },
  "key": {
   "blanks": {
    "B1": "cache"
   }
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:fib:fe213f73",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "From fastest to slowest to access: registers, cache, RAM, then _____ storage.",
  "blankOptions": {
   "B1": [
    "needed",
    "non-volatile",
    "cache",
    "secondary"
   ]
  },
  "key": {
   "blanks": {
    "B1": "secondary"
   }
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:db3a60f1",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Primary storage”?",
  "options": [
   "Non-volatile memory holding the boot-up instructions, which normally cannot be changed",
   "RAM is limited in size, but a computer may need to run more than it can hold at once",
   "Registers, then cache, then RAM, then secondary storage",
   "Memory directly accessible to the CPU, needed to run any program or instruction"
  ],
  "key": {
   "answer": 3,
   "explain": "“Primary storage” means: Memory directly accessible to the CPU, needed to run any program or instruction"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:ad962627",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Secondary storage”?",
  "options": [
   "Storage that holds data and programs permanently, but is too slow for the CPU to use directly",
   "Registers, then cache, then RAM, then secondary storage",
   "Data is transferred back into RAM when it is needed again",
   "RAM is limited in size, but a computer may need to run more than it can hold at once"
  ],
  "key": {
   "answer": 0,
   "explain": "“Secondary storage” means: Storage that holds data and programs permanently, but is too slow for the CPU to use directly"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:93709b24",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “RAM (Random Access Memory)”?",
  "options": [
   "A section of secondary storage used as overflow when RAM is full or nearly full",
   "Registers, then cache, then RAM, then secondary storage",
   "Volatile memory holding the programs, data and OS currently running",
   "Storage that holds data and programs permanently, but is too slow for the CPU to use directly"
  ],
  "key": {
   "answer": 2,
   "explain": "“RAM (Random Access Memory)” means: Volatile memory holding the programs, data and OS currently running"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:badf8f82",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “ROM (Read Only Memory)”?",
  "options": [
   "The first program run when a computer is switched on, stored in ROM",
   "A section of secondary storage used as overflow when RAM is full or nearly full",
   "Non-volatile memory holding the boot-up instructions, which normally cannot be changed",
   "RAM is limited in size, but a computer may need to run more than it can hold at once"
  ],
  "key": {
   "answer": 2,
   "explain": "“ROM (Read Only Memory)” means: Non-volatile memory holding the boot-up instructions, which normally cannot be changed"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:47ad6c66",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Volatile”?",
  "options": [
   "Data is transferred back into RAM when it is needed again",
   "The first program run when a computer is switched on, stored in ROM",
   "Loses its contents when the power is turned off",
   "A section of secondary storage used as overflow when RAM is full or nearly full"
  ],
  "key": {
   "answer": 2,
   "explain": "“Volatile” means: Loses its contents when the power is turned off"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:df69871e",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Non-volatile”?",
  "options": [
   "Keeps its contents even when the power is turned off",
   "The first program run when a computer is switched on, stored in ROM",
   "Memory directly accessible to the CPU, needed to run any program or instruction",
   "Non-volatile memory holding the boot-up instructions, which normally cannot be changed"
  ],
  "key": {
   "answer": 0,
   "explain": "“Non-volatile” means: Keeps its contents even when the power is turned off"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:c2283951",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Boot-up (bootstrap) instructions”?",
  "options": [
   "RAM is limited in size, but a computer may need to run more than it can hold at once",
   "The first program run when a computer is switched on, stored in ROM",
   "Storage that holds data and programs permanently, but is too slow for the CPU to use directly",
   "Keeps its contents even when the power is turned off"
  ],
  "key": {
   "answer": 1,
   "explain": "“Boot-up (bootstrap) instructions” means: The first program run when a computer is switched on, stored in ROM"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:bf98de9a",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Virtual memory”?",
  "options": [
   "Memory directly accessible to the CPU, needed to run any program or instruction",
   "RAM is limited in size, but a computer may need to run more than it can hold at once",
   "Small, very fast memory inside the CPU, storing frequently used instructions and data",
   "A section of secondary storage used as overflow when RAM is full or nearly full"
  ],
  "key": {
   "answer": 3,
   "explain": "“Virtual memory” means: A section of secondary storage used as overflow when RAM is full or nearly full"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:cc826cb8",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Why virtual memory is needed”?",
  "options": [
   "The computer slows down noticeably, because secondary storage is much slower to access than RAM",
   "Small, very fast memory inside the CPU, storing frequently used instructions and data",
   "A section of secondary storage used as overflow when RAM is full or nearly full",
   "RAM is limited in size, but a computer may need to run more than it can hold at once"
  ],
  "key": {
   "answer": 3,
   "explain": "“Why virtual memory is needed” means: RAM is limited in size, but a computer may need to run more than it can hold at once"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:9a02529b",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Moving data into virtual memory”?",
  "options": [
   "Data not currently needed is transferred from RAM to secondary storage to free up space",
   "The first program run when a computer is switched on, stored in ROM",
   "A section of secondary storage used as overflow when RAM is full or nearly full",
   "Loses its contents when the power is turned off"
  ],
  "key": {
   "answer": 0,
   "explain": "“Moving data into virtual memory” means: Data not currently needed is transferred from RAM to secondary storage to free up space"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:69bbccb9",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Moving data back from virtual memory”?",
  "options": [
   "Memory directly accessible to the CPU, needed to run any program or instruction",
   "RAM is limited in size, but a computer may need to run more than it can hold at once",
   "Data is transferred back into RAM when it is needed again",
   "Small, very fast memory inside the CPU, storing frequently used instructions and data"
  ],
  "key": {
   "answer": 2,
   "explain": "“Moving data back from virtual memory” means: Data is transferred back into RAM when it is needed again"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:83b74995",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Effect of heavy virtual memory use”?",
  "options": [
   "A section of secondary storage used as overflow when RAM is full or nearly full",
   "Small, very fast memory inside the CPU, storing frequently used instructions and data",
   "The computer slows down noticeably, because secondary storage is much slower to access than RAM",
   "RAM is limited in size, but a computer may need to run more than it can hold at once"
  ],
  "key": {
   "answer": 2,
   "explain": "“Effect of heavy virtual memory use” means: The computer slows down noticeably, because secondary storage is much slower to access than RAM"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:eefee2b8",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Cache”?",
  "options": [
   "A section of secondary storage used as overflow when RAM is full or nearly full",
   "Data not currently needed is transferred from RAM to secondary storage to free up space",
   "Small, very fast memory inside the CPU, storing frequently used instructions and data",
   "Non-volatile memory holding the boot-up instructions, which normally cannot be changed"
  ],
  "key": {
   "answer": 2,
   "explain": "“Cache” means: Small, very fast memory inside the CPU, storing frequently used instructions and data"
  }
 },
 {
  "id": "computer-science:1-2-1-primary-storage-memory:match:f0bb97aa",
  "pageId": "computer-science:1-2-1-primary-storage-memory",
  "pageName": "1.2.1 Primary Storage (Memory)",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Memory hierarchy (fastest to slowest)”?",
  "options": [
   "Storage that holds data and programs permanently, but is too slow for the CPU to use directly",
   "The computer slows down noticeably, because secondary storage is much slower to access than RAM",
   "Volatile memory holding the programs, data and OS currently running",
   "Registers, then cache, then RAM, then secondary storage"
  ],
  "key": {
   "answer": 3,
   "explain": "“Memory hierarchy (fastest to slowest)” means: Registers, then cache, then RAM, then secondary storage"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:1cc6151e",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "2022 Q7(b)(i)",
  "question": "<p>State, using an example, why the smart television needs secondary storage.</p>",
  "caseStudy": "<p>A smart television allows the user to search the Internet and watch videos online.</p><p>The smart television has secondary storage.</p>",
  "hint": "Give ONE concrete example of what's stored (the OS, an app, a recorded show) AND the reason it must survive being switched off — both halves are needed for 2 marks.",
  "starter": "For example, [something specific] needs to be stored, because…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark each to max 2)</h5>\n<ul>\n<li>1 mark for example, e.g. the OS, web browser software, recorded show, user preferences</li>\n<li>1 mark for: to store data once the computer is turned off / permanently // for non-volatile storage</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Allow 2 marks by example, e.g. \"To install software that will not be lost when the TV is turned off\" gets 1 mark for software and 1 mark for not being lost when turned off.</li>\n<li>Do not award brand names without exemplification.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question was answered well by many candidates. Many candidates correctly identified an example, most commonly downloaded videos, the operating system, or applications. Fewer were able to expand this as to why, for example stating that it was needed for the computer to work.</p>\n<p><strong>Misconception:</strong> a common misunderstanding was that it is needed as a backup for when the television fails.</p>\n</div>",
   "modelAnswer": "For example, the operating system needs to be stored on the smart TV's secondary storage, because it must remain there permanently even when the television is switched off — RAM alone would lose this data every time the power is cut."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:3d628f8d",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "2023 Q5(a)(ii)",
  "question": "<p>An artist has a computer that they use to create images.</p><p>Give one example of a secondary storage device that the artist's computer will have, and an example of the data that will be stored on it.</p>",
  "hint": "Name an actual DEVICE (e.g. a hard drive or SSD), not just a type (e.g. 'magnetic') — and give data that would genuinely be created or used by an artist.",
  "starter": "Device: … | Example data: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark for device, 1 mark for data)</h5>\n<ul>\n<li>Hard drive // SSD // USB (memory) stick // Flash memory card // CD // DVD, etc.</li>\n<li>e.g. Images created // documents // software // files // data moved from RAM to virtual memory</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Allow any secondary device. Benefit of the doubt for \"optical disc\".</li>\n<li>Question asks for device, not type of device — magnetic/optical/solid state alone is not enough.</li>\n<li>Award the example even if it is stored on an incorrect secondary storage device.</li>\n<li>USB on its own is not enough.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Candidates were required to identify a secondary storage device. Some responses identified a type of storage media (for example magnetic) instead of identifying a device (for example hard drive). Some responses gave RAM or ROM as a secondary storage device. These responses were incorrect.</p>\n<p>The example data varied but many responses were able to identify the storage of files, the images or software.</p>\n</div>",
   "modelAnswer": "Device: SSD (solid-state drive)\n\nExample data: The image files the artist has created."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:6d610896",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "2022 Q7(b)(ii)",
  "question": "<p>Identify one appropriate type of secondary storage for the smart television. Justify your choice.</p>",
  "caseStudy": "<p>A smart television allows the user to search the Internet and watch videos online.</p><p>The smart television has secondary storage.</p>",
  "hint": "Name a TYPE (magnetic or solid state — optical isn't suitable here) first, then give reasons that only make sense for that type in a television that mostly stays in one place.",
  "starter": "Type: … | Justification: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark for choice of magnetic or solid state; 1 mark per bullet to max 3 for justification) e.g.</h5>\n<ul>\n<li><strong>Magnetic:</strong> large storage capacity … for storing software/videos/HD; television unlikely to be moved … therefore durability/portability not required; cost to purchase is low … so the TV will be cheaper to manufacture/purchase; device will fit in a TV // device is small; longevity // reliable.</li>\n<li><strong>Solid state:</strong> large storage capacity … for storing software/videos/HD; television may be moved … therefore durable/robust/portable; fast data access … television will be more responsive; cost to purchase is low … so the TV is not too expensive to manufacture/purchase; run quieter; produce less heat; use less energy; compact // lightweight … so TV can be made smaller/lighter.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Do not award a specific device, e.g. hard disk — the question asks for a type. Follow-through is allowed for justification, to max 3. If both a device and a type are given, award, e.g. solid state drive, SSD, magnetic hard disk drive.</li>\n<li>Mark the first secondary storage type given.</li>\n<li>If no secondary storage type is given, read the justification for a type — do not award the type mark, but mark the justification (max 3).</li>\n<li>Justification must match the choice.</li>\n<li>If the type is inappropriate, e.g. optical, do not award.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Many candidates were able to correctly justify their choice of secondary storage. A few candidates gave a type of storage, instead giving a specific device such as a hard drive. There were some good examples of application in responses. For example, expanding the feature of high capacity to the need to download high-definition movies which can take up large amounts of storage. Another application commonly given was the need for a responsive television which was provided by the fast data access speeds.</p>\n</div>",
   "modelAnswer": "Type: Solid state\n\nJustification: A solid-state drive has no moving parts, so it won't be damaged if the television is knocked or moved. It also has fast data access, which keeps the television responsive when loading apps or streaming video, and it runs quietly and produces little heat, which suits a device that's switched on for long periods."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:3ccc40fe",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "Q5b(i)",
  "question": "<p>The musician has run out of storage space on their secondary storage device and needs to buy a replacement. Identify whether the musician should buy a magnetic secondary storage device or a solid state secondary storage device for their computer. Justify your choice.</p>",
  "hint": "Pick a type first, then give up to 4 justification points that only make sense for the type you picked (not a generic list of pros and cons of both).",
  "starter": "Type: … Justification: …",
  "key": {
   "markScheme": "<div class=\"marks-section\"><h5>Mark Scheme — 4 marks (no mark for type; 1 mark each point matching the type, max 4)</h5><ul>\n<li><strong>Magnetic e.g.</strong> usually cheaper cost to purchase per unit of data; sufficient/good durability for what is needed (e.g. computer unlikely to move regularly); sufficient/fast speed of access, no significant delays storing/reading data; (long-term) reliable/longevity, unlikely to need replacing/break from over-use; high capacity, e.g. large sound files or higher bit depth.</li>\n<li><strong>Solid state e.g.</strong> cost often equates to magnetic per quantity, not expensive per unit of data; durable/robust, no moving parts, so the computer can be moved without risk of losing data; fast speed of access, no significant delays; high capacity, nearly the same/higher capacity than magnetic; small in physical size/portable; produces less sound when running; requires little/less power so running costs are reduced; drives do not get fragmented files/need defragging.</li>\n</ul></div><div class=\"marks-section\"><h5>How the marks are given</h5><ul>\n<li>MP1 needs to be cost per unit, e.g. \"it costs less per GB than other storage types\" — not just \"it is cheap to buy\".</li>\n<li>Allow the reverse argument for each, e.g. for magnetic: \"magnetic is not as robust but the computer will not be moved\" gets 1 mark for not moving and 1 mark for solid state's robustness not being required.</li>\n<li>If no type is given on line 1, read the answer to look for a type and then award justification. If no type is identified anywhere in the answer, 0 marks.</li>\n</ul></div>",
   "modelAnswer": "Type: Solid state\n\nJustification: Solid state drives have no moving parts, so they are more durable if the musician's computer gets knocked or moved. They also have fast access speeds, so there are no delays loading or saving large sound files, and they run silently, which matters when recording audio."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:95c163ca",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 1,
  "num": "Q5b(ii)",
  "question": "<p>Identify one other type of secondary storage.</p>",
  "hint": "Name a storage TYPE (a category), not a brand or a specific device model.",
  "starter": "…",
  "key": {
   "markScheme": "<div class=\"marks-section\"><h5>Mark Scheme — 1 mark</h5><ul>\n<li><strong>Optical</strong></li>\n</ul></div><div class=\"marks-section\"><h5>How the marks are given</h5><ul>\n<li>BOD \"optic\". Do not award an example of optical storage (e.g. \"DVD\") in place of the type.</li>\n</ul></div>",
   "modelAnswer": "Optical storage."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:b56a8853",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "mcq",
  "marks": 1,
  "num": "S1",
  "question": "<p>Refer to the library's open day promotional disc described above.</p><p>Which type of secondary storage is most suitable for producing hundreds of cheap, identical copies of the demo to give away?</p>",
  "options": [
   "Magnetic storage, because hard disk drives are the cheapest way of all to store any amount of data",
   "Optical storage, because discs are very cheap to mass-produce identical copies of",
   "Solid-state storage, because USB sticks have no moving parts and are extremely fast to access",
   "Primary storage, because RAM can be copied and given away at almost no cost per copy"
  ],
  "caseStudy": "<p>A public library has several PCs available for anyone to use to browse the internet and write documents. During an upcoming open day, the library wants to hand out a promotional disc to hundreds of visitors, containing a demo of educational software.</p>",
  "hint": "Think about which factor matters most for handing out hundreds of cheap, identical copies — not overall capacity or access speed.",
  "key": {
   "answer": 1,
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li>Optical storage, because discs are very cheap to mass-produce identical copies of — CAO (correct answer only)</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Only the correct option scores; there is no credit for a plausible-sounding reason attached to the wrong type.</li>\n</ul>\n</div>",
   "modelAnswer": "Optical storage, because discs are very cheap to mass-produce identical copies of."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:edd0888f",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "mcq",
  "marks": 1,
  "num": "S2",
  "question": "<p>Refer to the technician's bootable installer described above.</p><p>The technician says her installer is stored on \"a solid-state device\". Which statement about this description is correct?</p>",
  "options": [
   "'Solid-state' names the TYPE of storage technology being used; 'USB memory stick' or 'SSD' would be an example of the actual DEVICE",
   "'Solid-state' is a brand name used by only one specific manufacturer of USB memory sticks and SSDs",
   "'Solid-state' and a specific device such as a USB memory stick always mean exactly the same single thing, so either word can always be used interchangeably in any answer",
   "'Solid-state' actually describes a type of primary storage rather than a type of secondary storage device"
  ],
  "caseStudy": "<p>A computing technician has created a bootable installer for a new operating system. She uses it to install the same operating system onto many different desktop computers in a school's IT suite, one after another.</p>",
  "hint": "A TYPE is the family (magnetic/optical/solid-state). A DEVICE is the actual product (USB stick, SSD, HDD, DVD). Which one is 'solid-state'?",
  "key": {
   "answer": 0,
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li>'Solid-state' names the type; a USB memory stick/SSD would be the device — CAO</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Only the correct option scores.</li>\n</ul>\n</div>",
   "modelAnswer": "'Solid-state' names the type of storage technology; 'USB memory stick' or 'SSD' would be the specific device."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:4b51f56c",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "S3",
  "question": "<p>Describe how a magnetic hard disk drive stores data.</p>",
  "hint": "Think about what physically changes on the disk itself, and how that pattern is then read back.",
  "starter": "A magnetic hard disk drive stores data by…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark each)</h5>\n<ul>\n<li>Data is stored by magnetising tiny areas of a spinning disk (platter)</li>\n<li>A moving read/write head detects (or changes) the magnetised pattern to read (or write) the data</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept \"magnetic field\" for \"magnetised\".</li>\n<li>Do not accept a description of use instead of mechanism, e.g. \"it stores files\", without reference to magnetising the disk.</li>\n</ul>\n</div>",
   "modelAnswer": "A magnetic hard disk drive stores data by magnetising tiny areas of a spinning disk called a platter. A moving read/write head detects the pattern of magnetised areas to read the data, or changes them to write new data."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:49fc421e",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "S4",
  "question": "<p>Describe how a DVD stores data.</p>",
  "hint": "Think about the physical pattern on the disc's surface, and what device reads that pattern.",
  "starter": "A DVD stores data as…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark each)</h5>\n<ul>\n<li>Data is stored as a pattern of tiny pits and flat areas (lands) on the disc's surface</li>\n<li>A laser reads the disc, detecting how light reflects differently off the pits and the lands</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept \"bumps\"/\"dents\" for pits.</li>\n<li>The second mark must reference a laser specifically, not just \"a sensor\".</li>\n</ul>\n</div>",
   "modelAnswer": "A DVD stores data as a pattern of tiny pits and flat areas, called lands, on its surface. A laser reads the disc by detecting how light reflects differently off the pits compared to the lands."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:6a6dfd7e",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "S5",
  "question": "<p>Describe how a solid-state drive (SSD) stores data.</p>",
  "hint": "Think about what an SSD is made of inside, and what it does NOT have compared to a hard disk drive.",
  "starter": "An SSD stores data by…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks (1 mark each)</h5>\n<ul>\n<li>Data is stored electronically in flash memory cells/chips</li>\n<li>The SSD has no moving parts, unlike a magnetic hard disk drive</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept \"chips\"/\"transistors\" for flash memory cells.</li>\n<li>\"No moving parts\" must be stated explicitly for the second mark, not just implied.</li>\n</ul>\n</div>",
   "modelAnswer": "An SSD stores data electronically in flash memory cells. Unlike a magnetic hard disk drive, it has no moving parts."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:a47d85e7",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 3,
  "num": "S6",
  "question": "<p>Refer to the data centre described above.</p><p>A new employee says the data centre should avoid magnetic storage because \"one large hard disk drive costs more money to buy than one small USB stick.\" Explain why comparing the price of individual devices like this is misleading, and state which type of storage is actually cheaper for the data centre's needs.</p>",
  "caseStudy": "<p>A cloud storage company runs a data centre that permanently archives billions of customer files. Once a file has been stored for 30 days, it is very rarely opened again. The data centre's storage devices are installed in racks and never move once fitted.</p>",
  "hint": "Cost should be compared per gigabyte of storage, not per device — a bigger device naturally costs more to buy even if it works out cheaper for the amount of data it holds.",
  "starter": "This is misleading because…, so the cheaper type for the data centre is…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 3 marks (1 mark per point to max 3)</h5>\n<ul>\n<li>Cost should be compared per gigabyte / per unit of storage, not by the price of a single whole device</li>\n<li>A large hard disk drive stores far more data than a small USB stick, so its higher price does not mean it is more expensive per gigabyte</li>\n<li>Magnetic storage is actually cheaper for the data centre, since it has the lowest cost per gigabyte at very large capacities</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Do not award simply restating that \"the employee is wrong\" without an explanation referencing cost per gigabyte/unit of storage.</li>\n<li>Allow reversed reasoning that reaches the same conclusion via capacity, e.g. discussing how much data each device holds for its price.</li>\n</ul>\n</div>",
   "modelAnswer": "Comparing the price of one device to another isn't a fair comparison, because cost should be measured per gigabyte, not per whole device. A large hard disk drive holds far more data than a small USB stick, so even though it costs more to buy, it is cheaper per gigabyte. For the data centre's huge archive, magnetic storage is actually the cheaper option, because it has the lowest cost per gigabyte at very large capacities."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:f8892885",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "S7",
  "question": "<p>The table has four statements about secondary storage. Tick (✓) <strong>one</strong> box in each row to show which type of storage technology the statement describes.</p>",
  "hint": "Match each statement to exactly one type — this table has one correct answer per row, not several.",
  "starter": "Row 1: … | Row 2: … | Row 3: … | Row 4: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark for each correctly ticked row)</h5>\n<ul>\n<li>Magnetises tiny areas of a spinning disk: <strong>Magnetic</strong></li>\n<li>Pattern of pits and lands, read by a laser: <strong>Optical</strong></li>\n<li>No moving parts, resistant to being dropped: <strong>Solid-state</strong></li>\n<li>Lowest cost per gigabyte at very high capacities: <strong>Magnetic</strong></li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>If more than one box is ticked in a row, 0 marks for that row.</li>\n</ul>\n</div>",
   "modelAnswer": "Row 1 (magnetises areas of a spinning disk): Magnetic.\nRow 2 (pits and lands read by a laser): Optical.\nRow 3 (no moving parts, resistant to drops): Solid-state.\nRow 4 (lowest cost per gigabyte at high capacities): Magnetic."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:a40e95c0",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 6,
  "num": "S8",
  "question": "<p>Refer to the wildlife photographer described above.</p><p>Explain why solid-state storage is generally more suitable than magnetic storage for the portable device she uses to back up her memory cards in the field. Refer to <strong>at least three</strong> different factors in your answer.</p>",
  "caseStudy": "<p>A wildlife photographer spends several days at a time in remote locations, photographing animals in extreme weather. Every evening she backs up that day's memory cards onto a portable storage device, often working in dusty or damp conditions.</p>",
  "hint": "Pick three different factors (e.g. durability, portability, speed, reliability) and for each one, explain WHY it matters specifically for working in remote, rough field conditions — a bare list of facts about solid-state storage isn't enough on its own.",
  "starter": "One reason solid-state storage suits the photographer's field backups is…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 6 marks (1 mark for a valid factor, 1 mark for linking it to the scenario, per factor, up to 3 factors)</h5>\n<ul>\n<li><strong>Durability</strong> — no moving parts, so it survives being dropped/knocked/exposed to dust or damp in the field without losing photos</li>\n<li><strong>Portability</strong> — small and light, so it is easy to carry between remote locations with limited luggage space</li>\n<li><strong>Speed</strong> — fast data access, so a full day's memory cards can be backed up quickly each evening without wasting limited battery/generator time</li>\n<li><strong>Reliability</strong> — works consistently without corrupting files, so irreplaceable wildlife photos, taken once and never repeatable, are not lost</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Do not credit cost as an advantage — solid-state usually costs more per gigabyte than magnetic storage, so it would not support this argument.</li>\n<li>Each factor needs both the fact AND a link to the field-backup scenario for 2 marks; a fact alone scores 1.</li>\n<li>Award a maximum of 3 factors (6 marks); do not credit a repeated 4th idea.</li>\n</ul>\n</div>",
   "modelAnswer": "Solid-state storage has no moving parts, so it is far more durable than magnetic storage — it can survive being dropped, knocked or exposed to dust and damp around a campfire without losing the day's photos.\n\nIt is also small and light, which matters because the photographer has limited space to carry equipment between remote locations for several days at a time.\n\nFinally, solid-state storage has fast data access, so a full day's memory cards can be backed up quickly each evening without wasting limited battery power — important when there's no mains electricity nearby to recharge devices."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:exam:5bcc053d",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "exam",
  "type": "written",
  "marks": 8,
  "num": "S9",
  "question": "<p>Refer to the delivery fleet described above.</p><p>The logistics company is deciding whether to fit magnetic hard disk drives or solid-state drives inside the dashcams in its delivery vans.</p><p>Discuss which type of secondary storage the company should choose for the dashcams.</p><p>In your answer you might consider:</p><ul><li>how each type of storage works</li><li>the effect of vibration and constant use inside a moving vehicle</li><li>the capacity needed to record continuous video</li><li>the cost of fitting the chosen storage across the whole fleet</li></ul>",
  "caseStudy": "<p>A logistics company is fitting a dashcam to every van in its delivery fleet. Each dashcam records continuous video while the van is being driven and must keep working despite constant vibration from the road.</p>",
  "hint": "Use all four bullets as your plan. Explain the mechanism, weigh durability against constant vibration, weigh capacity for continuous recording, then weigh the cost of your choice ACROSS THE WHOLE FLEET (not just one van) for a top-band answer.",
  "starter": "Given that dashcams in a moving vehicle experience constant vibration, …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 8 marks (levelled) — indicative content</h5>\n<p>The following is indicative of possible factors/evidence that candidates may refer to but is not prescriptive or exhaustive:</p>\n<ul>\n<li><strong>How each type works</strong> — magnetic storage stores data by magnetising areas of a spinning disk, read by a moving head; solid-state storage stores data electronically in flash memory chips, with no moving parts.</li>\n<li><strong>Effect of vibration/constant use</strong> — a dashcam sits inside a vehicle that is constantly moving and vibrating while driving; a magnetic drive's spinning disk and moving read/write head are more likely to be damaged or fail under constant vibration; solid-state has no moving parts, so it is far more durable in this environment and less likely to corrupt or lose footage.</li>\n<li><strong>Capacity for continuous recording</strong> — continuous video recording, especially if overwriting older footage in a loop, needs reasonably high capacity, but not as much as long-term archival; both technologies can offer enough capacity for this; solid-state capacities are now high enough for continuous dashcam footage without being excessive.</li>\n<li><strong>Cost across the fleet</strong> — solid-state usually costs more per gigabyte than magnetic storage; fitting one to every van in a large fleet multiplies this extra cost significantly, which the company must weigh against the reduced risk of a device failing on the road; magnetic storage is cheaper across a large fleet but carries a higher risk of failure/data loss from vibration, potentially losing footage needed as evidence after an incident.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given — levels of response</h5>\n<ul>\n<li><strong>Mark Band 3 — High Level (6–8 marks):</strong> Thorough knowledge and understanding of magnetic and solid-state storage, applied directly and consistently to the dashcam/fleet context. The response weighs up both sides (durability/reliability under vibration against cost across the whole fleet) and covers all four bullet areas with clear, logically structured reasoning, reaching a justified conclusion.</li>\n<li><strong>Mark Band 2 — Mid Level (3–5 marks):</strong> Reasonable knowledge of magnetic and solid-state storage, generally accurate but at times underdeveloped or only partly applied to the vehicle context. Most of the four areas are addressed, with some structure, though the discussion may not fully weigh both sides or reach a clear conclusion.</li>\n<li><strong>Mark Band 1 — Low Level (1–2 marks):</strong> Basic knowledge with limited understanding shown; the material may contain inaccuracies or barely refer to the dashcam/fleet context. Little more than an unsupported assertion, e.g. \"solid-state is better\" with no working explanation of why.</li>\n<li><strong>0 marks:</strong> No attempt to answer the question or response is not worthy of credit.</li>\n</ul>\n</div>",
   "modelAnswer": "Magnetic storage works by magnetising tiny areas of a spinning disk, read by a moving read/write head, while solid-state storage stores data electronically in flash memory chips with no moving parts at all.\n\nBecause a dashcam sits inside a vehicle that is constantly vibrating and moving while it's driven, this difference matters a lot: a magnetic drive's spinning disk and moving head are far more likely to be damaged or to fail under that constant vibration, which could mean losing footage exactly when it's needed most, such as after an accident. Solid-state storage has no moving parts, so it copes with vibration far better and is much less likely to corrupt or lose footage.\n\nFor capacity, continuous video recording needs a reasonably large amount of storage, especially if it loops and overwrites older footage, but modern solid-state drives now offer enough capacity for this without needing the very largest capacities magnetic storage can reach.\n\nHowever, solid-state storage usually costs more per gigabyte than magnetic storage, and fitting every van in a large delivery fleet with solid-state drives would multiply that extra cost considerably. On balance, the risk of losing evidence footage from a failed magnetic drive under constant vibration is a serious drawback for a fleet dashcam, so the company should choose solid-state storage despite the higher cost, because reliability in this vibrating environment matters more than saving money per device."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:adfd588c",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Why does a computer need secondary storage as well as RAM?",
  "options": [
   "Because RAM is too slow to be useful without extra hardware assisting it",
   "Because RAM is volatile, so anything that must be kept has to survive being switched off",
   "Because secondary storage makes the CPU carry out instructions more quickly",
   "Because RAM can only hold a very small number of files compared to secondary storage devices"
  ],
  "key": {
   "answer": 1,
   "explain": "RAM is volatile — its contents are lost when the power goes off. Secondary storage is non-volatile, so the OS, apps and files survive being switched off."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:7ec1e3e3",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which secondary storage technology has no moving parts?",
  "options": [
   "Magnetic",
   "Optical",
   "Solid-state",
   "All three have moving parts"
  ],
  "key": {
   "answer": 2,
   "explain": "Solid-state devices store data electronically in flash memory chips — there is nothing spinning or moving inside."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:642a0699",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A hard disk drive is an example of which storage technology?",
  "options": [
   "Optical",
   "Solid-state",
   "Magnetic",
   "Primary"
  ],
  "key": {
   "answer": 2,
   "explain": "A hard disk drive stores data by magnetising tiny areas of a spinning disk, which makes it magnetic storage."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:8ee44813",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A DVD is an example of which storage technology?",
  "options": [
   "Magnetic",
   "Optical",
   "Solid-state",
   "Primary"
  ],
  "key": {
   "answer": 1,
   "explain": "DVDs, CDs and Blu-ray discs store data as a pattern read by a laser, which makes them optical storage."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:438abd0d",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A film studio wants to distribute millions of identical, cheap copies of a new movie to shops. Which storage technology suits this best?",
  "options": [
   "Magnetic hard disk drives",
   "Optical discs",
   "Solid-state drives",
   "RAM"
  ],
  "key": {
   "answer": 1,
   "explain": "Optical discs are very cheap to mass-produce, which is exactly what large-scale, low-cost distribution needs — even though their capacity and speed are lower."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:f1877aab",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A photographer needs a device to carry between locations that will keep working if it's dropped in a camera bag. Which technology is the best fit?",
  "options": [
   "Magnetic hard disk drive",
   "Optical disc",
   "Solid-state drive",
   "Either magnetic or optical — they are equally durable"
  ],
  "key": {
   "answer": 2,
   "explain": "Solid-state storage has no moving parts, so it survives being knocked or dropped far better than magnetic storage, and it's small and light to carry."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:0a8d30de",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which factor describes how much data a storage device can hold?",
  "options": [
   "Speed",
   "Capacity",
   "Portability",
   "Reliability"
  ],
  "key": {
   "answer": 1,
   "explain": "Capacity is how much data a device can store."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:d40e2e5f",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which factor describes how quickly data can be read from or written to a device?",
  "options": [
   "Capacity",
   "Cost",
   "Speed",
   "Durability"
  ],
  "key": {
   "answer": 2,
   "explain": "Speed is how quickly data can be transferred to or from the device."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:1f2118cf",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which factor is being tested when a device is dropped repeatedly to see if it survives?",
  "options": [
   "Reliability",
   "Durability",
   "Portability",
   "Cost"
  ],
  "key": {
   "answer": 1,
   "explain": "Durability is how well a device withstands physical damage such as drops and knocks."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:75fd3371",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which factor is being tested when a device is left running for a year to see how often it fails or corrupts files, even without being dropped?",
  "options": [
   "Durability",
   "Portability",
   "Reliability",
   "Capacity"
  ],
  "key": {
   "answer": 2,
   "explain": "Reliability is how consistently a device keeps working correctly over time — a separate idea from surviving physical damage."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:228dd571",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which statement comparing an SSD to a magnetic hard disk drive is TRUE?",
  "options": [
   "The SSD is usually slower to access data but cheaper to buy per gigabyte",
   "The SSD is usually faster to access data but more expensive per gigabyte",
   "The SSD always has a lower storage capacity than any hard disk drive",
   "The hard disk drive has no moving parts, unlike the SSD"
  ],
  "key": {
   "answer": 1,
   "explain": "SSDs have no moving parts, so they access data faster, but they typically cost more per gigabyte than magnetic storage."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:mcq:bc6f5ded",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A company's server stores a huge, rarely-accessed archive and must keep the cost as low as possible. Which type of storage is the best fit?",
  "options": [
   "Solid-state, because it is the fastest of the three storage families to access",
   "Optical, because a single disc can hold more data than a magnetic hard disk drive",
   "Magnetic, because it offers very high capacity at a low cost per gigabyte",
   "None of these — only RAM should ever be used for long-term company archives"
  ],
  "key": {
   "answer": 2,
   "explain": "For a huge, cheap, rarely-moved archive, magnetic storage's high capacity and low cost per GB make it the natural fit — speed matters less if the data is rarely accessed."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:tf:8187b6f8",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "RAM counts as a type of secondary storage.",
  "key": {
   "answer": false,
   "explain": "RAM is primary storage. Secondary storage is a completely separate category — hard disk drives, SSDs, optical discs, USB sticks and memory cards."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:tf:5bf49700",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Secondary storage is non-volatile, meaning it keeps its data when the power is switched off.",
  "key": {
   "answer": true,
   "explain": "Correct — that permanence is exactly why the operating system, apps and files can still be there next time the device is turned on."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:tf:784cbc50",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Solid-state storage devices contain moving parts, just like magnetic hard disk drives.",
  "key": {
   "answer": false,
   "explain": "SSDs and USB sticks store data electronically in flash memory chips — there is nothing spinning or moving inside them, which is exactly why they are more durable."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:tf:adecbee1",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "A single optical disc typically holds far less data than a modern magnetic hard disk drive.",
  "key": {
   "answer": true,
   "explain": "Correct — a Blu-ray disc holds around 50 GB at most, while hard disk drives are commonly sold in multiple-terabyte capacities."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:tf:265062aa",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Solid-state drives are generally more durable than magnetic hard disk drives because they have no moving parts to damage if the device is knocked.",
  "key": {
   "answer": true,
   "explain": "Correct — without a spinning disk or moving read/write head, there is far less that can be damaged by a knock or a drop."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:tf:d494eb98",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Solid-state storage is always the cheapest option per gigabyte.",
  "key": {
   "answer": false,
   "explain": "Magnetic storage is usually the cheapest per gigabyte for very large capacities; solid-state typically costs more per GB, even though prices are falling."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:tf:d0a34915",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Durability and reliability mean exactly the same thing.",
  "key": {
   "answer": false,
   "explain": "Durability is about surviving physical damage (drops, knocks); reliability is about the device working consistently over time without failing or corrupting data, even if it is never dropped."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:tf:53e5c98a",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "If a question asks for a secondary storage device, naming a type such as 'magnetic' instead of a specific device like 'hard disk drive' is enough to earn the mark.",
  "key": {
   "answer": false,
   "explain": "Real exam answers were marked down for this. A type (magnetic/optical/solid-state) is a category, not a device. If the question asks for a device, name an actual product such as a hard disk drive, SSD, DVD or USB memory stick."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:learn:adfd588c",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Why does a computer need secondary storage?",
  "reading": "<h4>RAM alone isn't enough</h4>\n<ul>\n<li><strong>RAM (primary storage) is volatile</strong> — everything held in it disappears the moment the power is switched off. If a computer only had RAM, every file, app and setting would vanish every time it was turned off.</li>\n<li><strong>Secondary storage is non-volatile</strong> — data written to it stays there permanently, whether the power is on or off, until it is deliberately changed or deleted.</li>\n</ul>\n<h4>What actually needs to be kept</h4>\n<ul>\n<li>The <strong>operating system</strong> itself, so the computer can start up again.</li>\n<li><strong>Installed software/apps</strong>, so they don't need reinstalling every session.</li>\n<li><strong>The user's own files</strong> — documents, photos, videos, saved games — anything created or downloaded that must still be there tomorrow.</li>\n<li>Everyday example: a game you install on a laptop is still there the next morning only because it was written to secondary storage, not RAM.</li>\n</ul>\n<h4>Answering \"why does it need secondary storage?\"</h4>\n<ul>\n<li>Exam questions want TWO things: a specific example of what is stored, and the reason it must survive being switched off (non-volatile, permanent storage).</li>\n<li>\"So it can store things\" on its own repeats the question and earns nothing — name what, and say why it must last.</li>\n</ul>",
  "question": "Why does a computer need secondary storage as well as RAM?",
  "options": [
   "Because RAM is too slow to run modern software without another device to help it",
   "Because RAM is volatile, so anything kept must survive the power being switched off",
   "Because secondary storage takes over some of the processor's own calculations to speed it up",
   "Because RAM cannot be written to, so all new data must be saved somewhere else instead"
  ],
  "key": {
   "answer": 1,
   "explain": "RAM loses everything when the power goes off. Secondary storage is non-volatile, so the OS, apps and files can still be there next time the device is switched on."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:learn:b23fb850",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "The three families of secondary storage",
  "reading": "<h4>Three technologies, one job</h4>\n<ul>\n<li>Every secondary storage device belongs to one of three families. The exam only needs you to know WHICH family a device belongs to and how it compares — not how the technology works inside.</li>\n<li><strong>Magnetic storage</strong> — stores data by magnetising tiny areas of a spinning disk or a length of tape. Example: a <strong>hard disk drive (HDD)</strong>.</li>\n<li><strong>Optical storage</strong> — stores data as a pattern read by a laser. Example: a <strong>CD, DVD or Blu-ray disc</strong>.</li>\n<li><strong>Solid-state storage</strong> — stores data electronically in flash memory chips, with <strong>no moving parts</strong>. Example: an <strong>SSD</strong>, a <strong>USB memory stick</strong>, or an <strong>SD memory card</strong>.</li>\n</ul>\n<h4>Device vs type — a real exam trap</h4>\n<ul>\n<li>A <strong>type</strong> is the family (magnetic / optical / solid-state). A <strong>device</strong> is the actual product (hard disk drive, DVD, SSD, USB stick).</li>\n<li>If a question asks for a <em>device</em>, \"magnetic\" on its own is not enough — you must name an actual device. If a question asks for a <em>type</em>, naming a specific device instead of the family is marked down too. Read the question carefully and answer with the right one.</li>\n</ul>\n<h4>What you don't need to know (NR)</h4>\n<ul>\n<li>The specification does not require the <strong>internal component parts</strong> of each medium — you don't need to explain how magnetism flips a bit, how a laser reads a pit, or how a flash memory cell traps a charge. Focus entirely on comparing the devices, not building them.</li>\n</ul>",
  "question": "Which of these is a solid-state storage device?",
  "options": [
   "Hard disk drive, commonly found inside older desktop computers and servers",
   "DVD or Blu-ray disc, commonly used to distribute films and software",
   "USB memory stick, commonly carried in a pocket or bag between computers",
   "Magnetic tape, commonly used for large-scale backup archives"
  ],
  "key": {
   "answer": 2,
   "explain": "A USB memory stick stores data electronically in flash memory with no moving parts, which makes it solid-state. The hard disk drive is magnetic; the DVD and Blu-ray disc are optical."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:learn:c6b42d98",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "How do you judge which device suits a scenario?",
  "reading": "<h4>The six factors you must know</h4>\n<ul>\n<li>Every \"choose a suitable device\" question is judged against the SAME six factors. Learn them as a set:</li>\n<li><strong>Capacity</strong> — how much data the device can hold.</li>\n<li><strong>Speed</strong> — how quickly data can be read from or written to the device.</li>\n<li><strong>Portability</strong> — how easily the device can be physically carried and used with different computers.</li>\n<li><strong>Durability</strong> — how well the device survives physical damage, such as being dropped, knocked, or used in extreme conditions.</li>\n<li><strong>Reliability</strong> — how consistently the device keeps working over time without failing or corrupting data, even if it's never mishandled.</li>\n<li><strong>Cost</strong> — the price of the device, usually compared <strong>per gigabyte</strong> so devices of different sizes can be compared fairly.</li>\n</ul>\n<table><tr><th>Factor</th><th>Magnetic (HDD)</th><th>Optical (DVD/BD)</th><th>Solid-state (SSD/USB)</th></tr>\n<tr><td>Capacity</td><td>Very high</td><td>Low</td><td>High</td></tr>\n<tr><td>Speed</td><td>Medium</td><td>Slowest</td><td>Fastest</td></tr>\n<tr><td>Portability</td><td>Low</td><td>High</td><td>High</td></tr>\n<tr><td>Durability</td><td>Low (moving parts)</td><td>Medium (scratches)</td><td>High (no moving parts)</td></tr>\n<tr><td>Reliability</td><td>Good if undisturbed</td><td>Degrades over time</td><td>Very good</td></tr>\n<tr><td>Cost per GB</td><td>Lowest</td><td>Low per disc</td><td>Highest</td></tr>\n</table>\n<h4>Durability vs reliability — don't merge these</h4>\n<ul>\n<li>They sound similar but test different things. Durability = survives being dropped or knocked. Reliability = keeps working correctly over time, even sitting still. A device can be durable but unreliable (survives drops, occasionally corrupts a file) — or reliable but not durable (never fails on a desk, but cracks the moment it's dropped).</li>\n</ul>\n<h4>Turning a scenario into an answer</h4>\n<ul>\n<li>Read the scenario for clue words and match them to a factor: \"carried around\" → portability; \"dropped\" or \"outdoors\" → durability; \"large HD files\" → capacity; \"must feel responsive\" → speed; \"on a tight budget\" → cost.</li>\n<li>Worked example: a field researcher needs a device to carry between remote sites that might get knocked in a backpack. <strong>Solid-state</strong> fits, because it has no moving parts, so it survives being knocked far better than a magnetic drive (<strong>durability</strong>), and it's small and light to carry (<strong>portability</strong>).</li>\n<li>Full marks always needs: ONE chosen type, then two or more reasons that are actually about THAT type, linked to THAT scenario — not a generic list of pros and cons for every storage family.</li>\n</ul>",
  "question": "A tablet aimed at young children needs a secondary storage device that will keep working if it's dropped. Which factor matters most here?",
  "options": [
   "Cost",
   "Capacity",
   "Durability",
   "Portability"
  ],
  "key": {
   "answer": 2,
   "explain": "Surviving being dropped is a durability question — how well the device withstands physical damage."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:learn:ba8a6f4b",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Magnetic storage — hard disk drives",
  "reading": "<h4>The strengths</h4>\n<ul>\n<li><strong>Capacity — very high.</strong> Magnetic hard disk drives are available in huge capacities (multiple terabytes) relatively cheaply, which makes them ideal for storing large amounts of data.</li>\n<li><strong>Cost — the lowest cost per gigabyte</strong> of the three families. This is the cheapest way to store a large amount of data.</li>\n</ul>\n<h4>The weaknesses</h4>\n<ul>\n<li><strong>Speed — slower</strong> than solid-state, because data has to be physically located by a moving read/write head on a spinning disk.</li>\n<li><strong>Durability — lower.</strong> The moving parts (a spinning disk and a read/write head) can be damaged if the drive is dropped or knocked, especially while it's running.</li>\n<li><strong>Portability — lower.</strong> Magnetic drives are usually built into a machine that stays in one place, rather than being carried around.</li>\n</ul>\n<h4>When magnetic storage is the right answer</h4>\n<ul>\n<li>Whenever a scenario describes a device that <strong>stays in one place</strong> and needs to store <strong>a very large amount of data as cheaply as possible</strong> — a desktop PC, a server, or a smart TV that sits on a shelf.</li>\n</ul>",
  "question": "Why is a magnetic hard disk drive often chosen for a device that never moves and needs to store a lot of data cheaply?",
  "options": [
   "It has the fastest access speed of the three storage families available",
   "It has very high capacity at a low cost per gigabyte, suiting data that just sits still",
   "It has no moving parts, so it survives being dropped or knocked without damage",
   "It is the smallest and lightest of the three storage families, ideal for carrying around daily"
  ],
  "key": {
   "answer": 1,
   "explain": "Magnetic storage's strengths are high capacity and low cost per GB. Its weakness — lower durability from moving parts — stops mattering as much if the device is never moved."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:learn:3c2ccc5d",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Optical storage — CDs, DVDs and Blu-ray discs",
  "reading": "<h4>The strengths</h4>\n<ul>\n<li><strong>Cost — very cheap to produce</strong>, which makes optical discs ideal for distributing thousands or millions of identical copies of software, music or films.</li>\n<li><strong>Portability — high.</strong> Discs are small, thin and light, and can be played in any compatible drive.</li>\n</ul>\n<h4>The weaknesses</h4>\n<ul>\n<li><strong>Capacity — much lower</strong> than magnetic or solid-state storage. A CD holds around 700 MB, a DVD around 4.7 GB, and a Blu-ray disc up to around 50 GB — far less than a modern hard disk drive or SSD.</li>\n<li><strong>Speed — the slowest</strong> of the three families to read and write.</li>\n<li><strong>Durability/reliability — discs can be scratched</strong>, and their data layer can degrade over time (sometimes called \"disc rot\"), so they're not the best choice for long-term, heavily-used storage.</li>\n</ul>\n<h4>When optical storage is the right answer</h4>\n<ul>\n<li>Whenever a scenario is about <strong>distributing many identical, cheap copies</strong> of something — a film studio releasing a movie, a magazine giving away a cover-mounted disc, or software being sold in a shop.</li>\n</ul>",
  "question": "A film studio wants to release millions of identical, cheap copies of a new movie to be sold in shops. Which storage technology best fits this?",
  "options": [
   "Magnetic hard disk drives",
   "Optical discs",
   "Solid-state drives",
   "RAM"
  ],
  "key": {
   "answer": 1,
   "explain": "Optical discs are very cheap to mass-produce, which makes them the natural fit for distributing huge numbers of identical copies, even though their capacity and speed are lower than the alternatives."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:learn:5d1ce064",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Solid-state storage — SSDs, USB sticks and memory cards",
  "reading": "<h4>The strengths</h4>\n<ul>\n<li><strong>Speed — the fastest</strong> of the three families, because there's nothing physically moving to locate the data.</li>\n<li><strong>Durability — the highest.</strong> With no moving parts, solid-state devices survive being dropped or knocked far better than a magnetic drive.</li>\n<li><strong>Portability — high.</strong> USB sticks and memory cards are small, light and robust enough to fit in a pocket.</li>\n<li>Other genuine advantages: they run <strong>silently</strong>, produce <strong>less heat</strong>, and use <strong>less power</strong> than magnetic drives.</li>\n</ul>\n<h4>The weakness</h4>\n<ul>\n<li><strong>Cost — usually more expensive per gigabyte</strong> than magnetic storage, especially at very large capacities (though the gap keeps narrowing).</li>\n</ul>\n<h4>When solid-state storage is the right answer</h4>\n<ul>\n<li>Whenever a scenario needs a device that is <strong>moved around</strong>, must <strong>feel fast and responsive</strong>, or has to <strong>survive rough handling</strong> — a laptop that travels with its owner, a smartphone, a camera, or a rugged tablet used by young children.</li>\n</ul>",
  "question": "A photographer needs a memory card to carry between locations that will keep working if it's dropped in a camera bag. Which technology fits best?",
  "options": [
   "Magnetic hard disk drive",
   "Optical disc",
   "Solid-state storage",
   "Either magnetic or optical — they are equally durable"
  ],
  "key": {
   "answer": 2,
   "explain": "Solid-state storage has no moving parts, so it is far more durable when knocked or dropped, and it's small and light to carry — exactly what a portable memory card needs."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:misc:b440defe",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> 'Secondary storage is only needed as a backup, in case something goes wrong.'</p><p><strong>✅ The correct idea:</strong> This was a genuine misconception examiners saw in real answers. Secondary storage isn't an emergency spare copy — it's where the operating system, apps and files live permanently, all the time, in normal everyday use. Without it, nothing would still be there the next time the device is switched on.</p>",
  "question": "Why is 'it's needed as a backup' not a full answer for why a device needs secondary storage?",
  "options": [
   "Backups are actually stored in RAM, so secondary storage doesn't need to be mentioned in the answer at all",
   "It undersells the everyday role — the OS, apps and files live there permanently, not just for backup",
   "Secondary storage can't actually hold backup copies of any files or programs",
   "It's actually a complete and correct answer that earns full marks either way"
  ],
  "key": {
   "answer": 1,
   "explain": "Secondary storage's main job is everyday, permanent storage of the OS, apps and files — not just insurance against failure."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:misc:66c26e5c",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> 'Secondary storage is only used when RAM gets full' — treating secondary storage in general as the same thing as virtual memory.</p><p><strong>✅ The correct idea:</strong> This mixes up two different ideas. Virtual memory is a specific technique where RAM overflows onto secondary storage when RAM is nearly full — that's a narrower topic (1.2.1). Secondary storage's main job is much broader: it stores the OS, apps and every file permanently, all the time, whether or not RAM is full.</p>",
  "question": "Which statement correctly separates secondary storage from virtual memory?",
  "options": [
   "They are the same thing, and exam answers can use either term to mean exactly the same idea",
   "Secondary storage holds data permanently; virtual memory just uses it as overflow when RAM is nearly full",
   "Virtual memory only exists on solid-state drives, and can never be used with a magnetic hard disk drive at all",
   "Secondary storage is only ever used once RAM has become completely full and cannot accept any more data"
  ],
  "key": {
   "answer": 1,
   "explain": "Secondary storage is used constantly for permanent storage. Virtual memory is one specific, narrower use of it that only kicks in when RAM is nearly full."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:misc:b20c6758",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Naming a TYPE of storage (e.g. 'magnetic') when the question asks for a DEVICE.</p><p><strong>✅ The correct idea:</strong> Real candidates lost marks for exactly this. A type is a category — magnetic, optical or solid-state. A device is an actual product — a hard disk drive, an SSD, a DVD, a USB memory stick. If the question says 'device', name the device; if it says 'type', name the type. The other direction catches people too: naming a specific device when a question explicitly asks for a type is also marked down.</p>",
  "question": "A question asks 'give one example of a secondary storage device'. Which answer is correct?",
  "options": [
   "Magnetic storage",
   "Solid-state storage",
   "Hard disk drive",
   "Optical storage"
  ],
  "key": {
   "answer": 2,
   "explain": "The question asks for a device (an actual product), not a type (a category). 'Hard disk drive' is a device; the others are types."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:misc:7057bbd4",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> 'RAM' or 'ROM' given as an answer to a secondary storage question.</p><p><strong>✅ The correct idea:</strong> RAM and ROM are always primary storage — never secondary storage, no matter how the question is worded. Real candidates who wrote RAM or ROM as their secondary storage device scored zero. Keep the two categories completely separate.</p>",
  "question": "Which of these could correctly be given as an example of secondary storage?",
  "options": [
   "RAM, since it also stores data while the computer is switched on",
   "ROM, since it also stores data permanently inside the computer's own chips",
   "A solid-state drive (SSD), since it is a genuine secondary storage device",
   "Cache, since it also holds data the processor is currently using"
  ],
  "key": {
   "answer": 2,
   "explain": "RAM, ROM and cache are all primary storage. An SSD is a secondary storage device."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:misc:9a0410f7",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Justifying a choice of device with generic pros and cons of BOTH magnetic AND solid-state storage, instead of committing to one.</p><p><strong>✅ The correct idea:</strong> The mark scheme requires you to pick ONE type first, then give reasons that support that specific choice for that specific scenario. Hedging with 'magnetic is cheap but solid-state is fast' doesn't commit to an answer and loses marks — and reasons that don't match your chosen type score nothing, even if they're true statements about the other type.</p>",
  "question": "Why does listing pros of BOTH magnetic and solid-state storage lose marks in a 'justify your choice' question?",
  "options": [
   "Because mark schemes never award any marks for cost or capacity, only ever for speed-related reasons",
   "Because the question needs ONE committed choice, with reasons that all match that same chosen type",
   "Because magnetic and solid-state storage are actually the exact same technology",
   "Because listing pros of both types is always worth full marks anyway"
  ],
  "key": {
   "answer": 1,
   "explain": "Justification must match your chosen type. A hedged, two-sided answer doesn't commit to a choice, so the reasons can't be credited against it."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:misc:c59802dd",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Durability and reliability are treated as the same idea.</p><p><strong>✅ The correct idea:</strong> They test different things. Durability is about surviving physical punishment — drops, knocks, extreme temperatures. Reliability is about the device working consistently over time without failing or corrupting data, even if it's never mishandled. A device can be one without being the other, so keep them as separate factors when you justify a choice.</p>",
  "question": "A device survives being dropped repeatedly but occasionally corrupts files even when it's never been knocked. Which factor is the problem?",
  "options": [
   "Durability",
   "Capacity",
   "Reliability",
   "Portability"
  ],
  "key": {
   "answer": 2,
   "explain": "The device is durable (it survives drops) but not reliable (it fails on its own, without being mishandled)."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:tips:2888ee70",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "explain — The 2-mark 'why does it need secondary storage' ladder",
  "reading": "<p>A question like \"State, using an example, why the [device] needs secondary storage\" is marked as an example plus its reason — 1 mark for a correct example of what's stored, 1 mark for the actual reason it must be kept. Watch this answer move up the ladder:</p>\n\n<p><strong>❌ 0 marks:</strong> \"So it can store things.\"</p>\n<ul>\n<li>No example, and \"store things\" just repeats the question without saying WHY.</li>\n</ul>\n\n<p><strong>⚠️ 1 mark:</strong> \"So it can store the operating system.\"</p>\n<ul>\n<li>A correct example — but no reason has been given for why it needs to be on secondary storage rather than RAM.</li>\n</ul>\n\n<p><strong>✅ 2 marks:</strong> \"So it can store the operating system, which needs to stay on the device permanently, even when it is switched off.\"</p>\n\n<p><strong>The pattern for every question shaped like this:</strong> name something specific that is stored → say why it needs to survive being switched off (or why it's too big or too permanent for RAM alone).</p>",
  "question": "You've written 'so it can store apps'. What must you add for the second mark?",
  "options": [
   "The exact brand name and model number of the storage device that the apps happen to be installed on",
   "A reason why apps must survive the power being switched off, since they are needed permanently",
   "The exact price that the storage device originally cost when it was first purchased new",
   "A description of exactly how quickly the apps load once they have finally been opened"
  ],
  "key": {
   "answer": 1,
   "explain": "The second mark is always the reason: apps must persist even when the power is off, which is exactly what non-volatile secondary storage provides."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:tips:5c2dffef",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "explain — The 4-mark 'identify a type and justify' ladder",
  "reading": "<p>The most common exam question on this topic is shaped like: \"Identify an appropriate type of secondary storage for [scenario]. Justify your choice.\" It always needs TWO things in the right order: a type, then reasons that genuinely apply to THAT type in THIS scenario.</p>\n\n<p><strong>❌ 0 marks:</strong> \"A hard drive, because storage is good.\"</p>\n<ul>\n<li>Names a specific device rather than a type, and \"storage is good\" isn't a reason at all.</li>\n</ul>\n\n<p><strong>⚠️ 1 mark:</strong> \"Solid state, because it's the best kind of storage.\"</p>\n<ul>\n<li>A valid type — but \"best kind\" isn't linked to anything about THIS scenario, so no justification marks are earned.</li>\n</ul>\n\n<p><strong>⚠️ 2 marks:</strong> \"Solid state, because it's fast and doesn't have moving parts.\"</p>\n<ul>\n<li>Two genuine solid-state facts, but neither is connected to the actual scenario — a strong answer explains WHY speed or durability matters HERE.</li>\n</ul>\n\n<p><strong>✅ Full marks (typical shape):</strong> \"Solid state, because it has no moving parts so it won't be damaged if the device is knocked or moved <strong>(1)</strong>, it has fast data access so the device stays responsive <strong>(1)</strong>, it runs quietly and produces little heat, which suits a device that's on constantly <strong>(1)</strong>, and its capacity is high enough for the files involved <strong>(1)</strong>.\"</p>\n\n<p>Two rules that catch real candidates out: name a TYPE first (magnetic/optical/solid-state), not a brand or model — and make sure every justification point clearly matches the type you chose. Some mark schemes even give a mark just for a valid type; others put all the marks into the justification and simply use your stated type to decide which list of reasons applies to you. Either way, get the type right first.</p>",
  "question": "You justify 'solid state' using 'it's cheap and it's the newest technology.' Why does this earn few or no marks?",
  "options": [
   "Because 'the newest technology' is always automatically awarded marks in every single OCR mark scheme",
   "Neither reason is genuine: 'newest' isn't a real factor, and it isn't usually the cheapest option",
   "The answer given is simply too short to be marked at all, regardless of what it says",
   "You must always choose magnetic storage over solid state for every single scenario"
  ],
  "key": {
   "answer": 1,
   "explain": "Justification marks need genuine factors (capacity/speed/portability/durability/reliability/cost) linked to the scenario. 'Newest' isn't one of the six factors, and solid-state usually costs MORE per GB, not less."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:tips:66721fc0",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "tip — Reading a scenario for the right factor",
  "reading": "<p>Before you write anything, scan the scenario for clue words and match them to one of the six factors — capacity, speed, portability, durability, reliability, cost.</p>\n<ul>\n<li><strong>\"carried around\" / \"moved between locations\" / \"fits in a bag\"</strong> → portability (and often durability too).</li>\n<li><strong>\"dropped\" / \"knocked\" / \"rough handling\" / \"outdoors\"</strong> → durability.</li>\n<li><strong>\"large files\" / \"high-definition\" / \"years of data\"</strong> → capacity.</li>\n<li><strong>\"responsive\" / \"loads quickly\" / \"no delay\"</strong> → speed.</li>\n<li><strong>\"budget\" / \"affordable\" / \"large numbers of them are needed\"</strong> → cost.</li>\n<li><strong>\"must not lose data\" / \"used constantly for years\"</strong> → reliability.</li>\n</ul>\n<p>Most 4-mark justify questions want you to spot two or three of these clues and build a reason around each — not to recite a generic list of pros and cons for every storage type. If the scenario doesn't mention movement at all, don't spend a mark on portability; if it says nothing about cost, don't invent a cost point.</p>",
  "question": "A scenario says a device will 'sit inside a desktop PC on an office desk and store years of company records.' Which factors are the strongest clues here?",
  "options": [
   "Portability and durability",
   "Capacity and cost",
   "Speed only",
   "Durability only"
  ],
  "key": {
   "answer": 1,
   "explain": "'Years of company records' points to capacity, and a device that just sits on a desk being stored cheaply points to cost — portability and durability barely matter here."
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:fib:0cd3e5d1",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "Secondary storage is _____, meaning it keeps its data even when the power is switched off.",
  "blankOptions": {
   "B1": [
    "faster",
    "costlier",
    "distributing",
    "non-volatile"
   ]
  },
  "key": {
   "blanks": {
    "B1": "non-volatile"
   }
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:fib:ea43c183",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "Hard disk drives store data using _____ storage technology.",
  "blankOptions": {
   "B1": [
    "distributing",
    "capacity",
    "magnetic",
    "non-volatile"
   ]
  },
  "key": {
   "blanks": {
    "B1": "magnetic"
   }
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:fib:07da9c07",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "CDs, DVDs and Blu-ray discs use _____ storage, read by a laser.",
  "blankOptions": {
   "B1": [
    "non-volatile",
    "distributing",
    "optical",
    "magnetic"
   ]
  },
  "key": {
   "blanks": {
    "B1": "optical"
   }
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:fib:4ebe4f26",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "SSDs and USB memory sticks use _____ storage, which has no moving parts.",
  "blankOptions": {
   "B1": [
    "non-volatile",
    "optical",
    "capacity",
    "solid-state"
   ]
  },
  "key": {
   "blanks": {
    "B1": "solid-state"
   }
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:fib:633bdefd",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "The six factors used to judge a storage device are capacity, speed, portability, durability, _____ and cost.",
  "blankOptions": {
   "B1": [
    "solid-state",
    "costlier",
    "reliability",
    "non-volatile"
   ]
  },
  "key": {
   "blanks": {
    "B1": "reliability"
   }
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:fib:90c89efe",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "How much data a device can hold is called its _____.",
  "blankOptions": {
   "B1": [
    "non-volatile",
    "costlier",
    "capacity",
    "reliability"
   ]
  },
  "key": {
   "blanks": {
    "B1": "capacity"
   }
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:fib:225246ba",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "Compared to a magnetic hard drive, a solid-state drive is usually _____ to access but _____ per gigabyte to buy.",
  "blankOptions": {
   "B1": [
    "solid-state",
    "capacity",
    "optical",
    "faster"
   ],
   "B2": [
    "distributing",
    "reliability",
    "capacity",
    "costlier"
   ]
  },
  "key": {
   "blanks": {
    "B1": "faster",
    "B2": "costlier"
   }
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:fib:4ddc9de5",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "Optical discs are cheap to produce, which makes them well suited to _____ software or films to many customers.",
  "blankOptions": {
   "B1": [
    "distributing",
    "capacity",
    "non-volatile",
    "reliability"
   ]
  },
  "key": {
   "blanks": {
    "B1": "distributing"
   }
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:b7b9735b",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Capacity”?",
  "options": [
   "How much data a storage device can hold",
   "Fits a device that gets carried between locations and dropped often",
   "Fits a laptop that must boot up and load programs quickly",
   "How consistently a device keeps working over time without failing or corrupting data"
  ],
  "key": {
   "answer": 0,
   "explain": "“Capacity” means: How much data a storage device can hold"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:cf93ec7f",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Speed”?",
  "options": [
   "Stores data as a pattern read by a laser, e.g. on a CD or DVD",
   "How easily a device can be physically carried and used with different computers",
   "How much data a storage device can hold",
   "How quickly data can be read from or written to a device"
  ],
  "key": {
   "answer": 3,
   "explain": "“Speed” means: How quickly data can be read from or written to a device"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:0a3cc1c0",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Portability”?",
  "options": [
   "Stores data by magnetising areas of a spinning disk or a length of tape",
   "How well a device withstands physical damage, such as being dropped or knocked",
   "Fits a device that gets carried between locations and dropped often",
   "How easily a device can be physically carried and used with different computers"
  ],
  "key": {
   "answer": 3,
   "explain": "“Portability” means: How easily a device can be physically carried and used with different computers"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:0a3674d0",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Durability”?",
  "options": [
   "How well a device withstands physical damage, such as being dropped or knocked",
   "Keeps its data even when the power is switched off",
   "Fits a desktop PC or server that never moves and needs huge capacity as cheaply as possible",
   "Stores data electronically in flash memory chips, with no moving parts"
  ],
  "key": {
   "answer": 0,
   "explain": "“Durability” means: How well a device withstands physical damage, such as being dropped or knocked"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:25a3769b",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Reliability”?",
  "options": [
   "Fits a device that gets carried between locations and dropped often",
   "How consistently a device keeps working over time without failing or corrupting data",
   "The price of a device, usually compared per gigabyte so different sizes can be compared fairly",
   "How well a device withstands physical damage, such as being dropped or knocked"
  ],
  "key": {
   "answer": 1,
   "explain": "“Reliability” means: How consistently a device keeps working over time without failing or corrupting data"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:aa974d77",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Cost”?",
  "options": [
   "How well a device withstands physical damage, such as being dropped or knocked",
   "Fits distributing millions of identical, cheap copies of a film or piece of software",
   "How consistently a device keeps working over time without failing or corrupting data",
   "The price of a device, usually compared per gigabyte so different sizes can be compared fairly"
  ],
  "key": {
   "answer": 3,
   "explain": "“Cost” means: The price of a device, usually compared per gigabyte so different sizes can be compared fairly"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:3e1a5e28",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Non-volatile storage”?",
  "options": [
   "Stores data by magnetising areas of a spinning disk or a length of tape",
   "Stores data electronically in flash memory chips, with no moving parts",
   "Keeps its data even when the power is switched off",
   "How well a device withstands physical damage, such as being dropped or knocked"
  ],
  "key": {
   "answer": 2,
   "explain": "“Non-volatile storage” means: Keeps its data even when the power is switched off"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:a4500f97",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Magnetic storage”?",
  "options": [
   "Fits a desktop PC or server that never moves and needs huge capacity as cheaply as possible",
   "The price of a device, usually compared per gigabyte so different sizes can be compared fairly",
   "Stores data by magnetising areas of a spinning disk or a length of tape",
   "How quickly data can be read from or written to a device"
  ],
  "key": {
   "answer": 2,
   "explain": "“Magnetic storage” means: Stores data by magnetising areas of a spinning disk or a length of tape"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:d683946e",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Optical storage”?",
  "options": [
   "Keeps its data even when the power is switched off",
   "Stores data as a pattern read by a laser, e.g. on a CD or DVD",
   "Fits a device that gets carried between locations and dropped often",
   "Fits distributing millions of identical, cheap copies of a film or piece of software"
  ],
  "key": {
   "answer": 1,
   "explain": "“Optical storage” means: Stores data as a pattern read by a laser, e.g. on a CD or DVD"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:6ad1fb9f",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Solid-state storage”?",
  "options": [
   "Stores data electronically in flash memory chips, with no moving parts",
   "Fits a desktop PC or server that never moves and needs huge capacity as cheaply as possible",
   "How easily a device can be physically carried and used with different computers",
   "How quickly data can be read from or written to a device"
  ],
  "key": {
   "answer": 0,
   "explain": "“Solid-state storage” means: Stores data electronically in flash memory chips, with no moving parts"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:d2bb79c4",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Magnetic hard disk drive”?",
  "options": [
   "Stores data by magnetising areas of a spinning disk or a length of tape",
   "The price of a device, usually compared per gigabyte so different sizes can be compared fairly",
   "Fits a desktop PC or server that never moves and needs huge capacity as cheaply as possible",
   "Fits distributing millions of identical, cheap copies of a film or piece of software"
  ],
  "key": {
   "answer": 2,
   "explain": "“Magnetic hard disk drive” means: Fits a desktop PC or server that never moves and needs huge capacity as cheaply as possible"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:b8237bae",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Optical disc (DVD/Blu-ray)”?",
  "options": [
   "How easily a device can be physically carried and used with different computers",
   "Fits distributing millions of identical, cheap copies of a film or piece of software",
   "The price of a device, usually compared per gigabyte so different sizes can be compared fairly",
   "How much data a storage device can hold"
  ],
  "key": {
   "answer": 1,
   "explain": "“Optical disc (DVD/Blu-ray)” means: Fits distributing millions of identical, cheap copies of a film or piece of software"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:6f895a91",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Solid-state drive (SSD)”?",
  "options": [
   "How quickly data can be read from or written to a device",
   "Fits a laptop that must boot up and load programs quickly",
   "Stores data by magnetising areas of a spinning disk or a length of tape",
   "How much data a storage device can hold"
  ],
  "key": {
   "answer": 1,
   "explain": "“Solid-state drive (SSD)” means: Fits a laptop that must boot up and load programs quickly"
  }
 },
 {
  "id": "computer-science:1-2-2-secondary-storage:match:ea410904",
  "pageId": "computer-science:1-2-2-secondary-storage",
  "pageName": "1.2.2 Secondary Storage",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “USB memory stick or SD card”?",
  "options": [
   "Stores data electronically in flash memory chips, with no moving parts",
   "Fits a device that gets carried between locations and dropped often",
   "How consistently a device keeps working over time without failing or corrupting data",
   "Keeps its data even when the power is switched off"
  ],
  "key": {
   "answer": 1,
   "explain": "“USB memory stick or SD card” means: Fits a device that gets carried between locations and dropped often"
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:e9b77e88",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "2022 Q1(a)",
  "question": "<p>Computers represent data in binary form.</p><p>Tick (✓) <strong>one</strong> box in each row to identify the binary unit equivalent of each of the given file sizes.</p>",
  "hint": "Work out each file size using ×1,000 steps (bytes→KB→MB→GB→TB→PB), then find the matching column. Two different rows can share the same correct column.",
  "starter": "Row 1: … | Row 2: … | Row 3: … | Row 4: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark for each row)</h5>\n<ul>\n<li>2000 bytes → <strong>2 kilobytes</strong></li>\n<li>2000 terabytes → <strong>2 petabytes</strong></li>\n<li>16 bits → <strong>2 bytes</strong></li>\n<li>4 nibbles → <strong>2 bytes</strong></li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>Candidates needed to calculate each file size into a different binary unit to identify which is the equivalent. This question was often answered well by candidates who were able to accurately identify the equivalent binary units. Most commonly accurate were the 200 bytes into kilobytes and 16 bits into 2 bytes. Fewer candidates converted 2000 terabytes into 2 petabytes.</p>\n</div>",
   "modelAnswer": "Row 1 (2000 bytes): 2 kilobytes.\nRow 2 (2000 terabytes): 2 petabytes.\nRow 3 (16 bits): 2 bytes.\nRow 4 (4 nibbles): 2 bytes."
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:ae8541c4",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "mcq",
  "marks": 1,
  "num": "2023 Q1(a)",
  "question": "<p>Computers represent data in binary form.</p><p>Tick (✓) <strong>one</strong> box to identify the statement about binary that is true.</p>",
  "options": [
   "Binary digits can only be the values 0, 1 and 2",
   "The left-most bit of a binary integer has the smallest value",
   "Binary is used because computers are made of switches that can only be on or off",
   "The smallest whole number that can be stored in 8 bits is the number 1"
  ],
  "hint": "Each of the three wrong statements is wrong for a specific, checkable reason — test each one rather than guessing which 'feels' right.",
  "key": {
   "answer": 2,
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li><strong>Binary is used because computers are made of switches that can only be on or off</strong> (box 3)</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept cross or other indication as long as clear which one they intend.</li>\n<li>2+ ticks = 0 marks.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question required candidates to identify the true statement. Many responses identified that the third statement was true. Statement 1 was incorrect because binary digits cannot include the value 2. Statement 2 was incorrect because the left-most bit is the largest value. Statement 4 was most commonly given as an incorrect choice, the smallest whole number that can be stored in 8 bits is the number 0, not the number 1.</p>\n</div>",
   "modelAnswer": "Binary is used because computers are made of switches that can only be on or off."
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:6c98dc5a",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "mcq",
  "marks": 1,
  "num": "2023 Q1(c)",
  "question": "<p>Tick (✓) <strong>one</strong> box to identify the largest file size.</p>",
  "options": [
   "2 000 000 bytes",
   "2300 KB",
   "200 MB",
   "0.1 GB"
  ],
  "hint": "Convert every option into the same unit (try MB) before comparing.",
  "key": {
   "answer": 2,
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li><strong>200MB</strong> (box 3)</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept cross or other indication as long as clear which one they intend.</li>\n<li>2+ ticks = 0 marks.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>There were a range of responses given by candidates. Many candidates identified 200MB as the correct response. 2300 KB was commonly given as an incorrect response.</p>\n</div>",
   "modelAnswer": "200 MB."
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:babc343c",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "written",
  "marks": 1,
  "num": "2023 Q1(d)",
  "question": "<p>Tick (✓) <strong>two</strong> boxes to identify the two file sizes that are equal to each other.</p>",
  "hint": "Convert every option into the same unit before comparing — exactly two of the four will match.",
  "starter": "… and … are equal",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark for both boxes</h5>\n<ul>\n<li><strong>4 500 000 bytes</strong> (box 1)</li>\n<li><strong>4.5 MB</strong> (box 3)</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept cross or other indication as long as clear which one they intend.</li>\n<li>1/3+ ticks = 0 marks.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>Examiner's Comments</h5>\n<p>This question required candidates to work out which of the two file sizes were the same. Candidates had to tick two boxes. Many candidates identified the two correct answers. Correct responses often had working at the side of the answer. There was a range of incorrect answers given where different combinations were selected.</p>\n</div>",
   "modelAnswer": "4 500 000 bytes and 4.5 MB are equal (4 500 000 ÷ 1 000 000 = 4.5)."
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:51ab7fd0",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "2024 Q5(b)(iv)",
  "question": "<p>The musician’s recordings have an average (mean) file size of 3 MB. The musician has 1000 recordings.</p><p>Calculate an estimate of the storage space in GB that the 1000 files will require, assuming they are each 3 MB in size. Show your working out.</p>",
  "hint": "Total size in MB first (3 × 1000), then convert MB to GB (÷ 1000) — show both steps as your working.",
  "starter": "Working: 3 × 1000 = … MB, ÷ 1000 = … GB. Answer: … GB",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks</h5>\n<ul>\n<li>1 mark for the answer <strong>3 GB</strong>.</li>\n<li>1 mark for working, e.g. 3 × 1000 ÷ 1000, or 3 × 1000, or 3000 ÷ 1000, or 3 ÷ 1000, or 0.003 × 1000.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Allow 2.9296875 (or an approximation) if dividing by 1024.</li>\n<li>Allow addition of metadata, e.g. 10% added — can be awarded for both the working and the answer mark.</li>\n<li>Not all of the working needs to be correct to get the working mark. Ignore mentions of MB/GB in the working.</li>\n</ul>\n</div>",
   "modelAnswer": "Working: 3 MB × 1000 recordings = 3000 MB; 3000 MB ÷ 1000 = 3 GB. Answer: 3 GB"
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:db959d13",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "mcq",
  "marks": 1,
  "num": "U1",
  "question": "<p>Which list shows these four units in order from SMALLEST to LARGEST?</p>",
  "options": [
   "byte, bit, nibble, kilobyte",
   "nibble, byte, bit, kilobyte",
   "bit, nibble, byte, kilobyte",
   "kilobyte, byte, nibble, bit"
  ],
  "hint": "Start from the smallest possible unit — the one that holds a single 0 or 1 — and climb the ladder one step at a time.",
  "key": {
   "answer": 2,
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li>bit, nibble, byte, kilobyte — CAO (correct answer only)</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Only the correct option scores; there is no credit for a partially correct order.</li>\n</ul>\n</div>",
   "modelAnswer": "bit, nibble, byte, kilobyte."
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:bd0f426c",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "written",
  "marks": 1,
  "num": "U2",
  "question": "<p>The drone's camera converts each photo directly into binary before storing it on the memory card. State why this data must be stored using binary (1s and 0s), rather than any other number system.</p>",
  "caseStudy": "<p>A hobbyist company builds small camera drones. Each drone has an onboard camera that captures aerial photos during a flight, storing them directly onto a removable memory card fitted inside the drone.</p><p>The drone's flight computer also runs a program that controls the propellers and camera automatically during flight.</p>",
  "hint": "Think about the physical hardware, not convenience — what are the only two states a switch inside a chip can be in?",
  "starter": "The data must be binary because…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li>Computer/memory hardware is built from millions of tiny electronic components (transistors/switches) that can only be in one of two physical states — on or off — so only binary (two-value) data can be represented directly // there is no reliable third or fourth physical state to represent extra digits</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept any answer that correctly links binary to the two physical states of the hardware.</li>\n<li>Do not accept \"binary is simpler/easier for programmers\" or \"it saves space\" — neither is the real reason.</li>\n</ul>\n</div>",
   "modelAnswer": "Because the drone's memory chips (and the rest of its hardware) are built from millions of tiny electronic switches that can only be in one of two physical states — on or off. There is no reliable third state, so binary (1s and 0s) is the only form of data those switches can represent directly."
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:c2e2c26b",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "written",
  "marks": 2,
  "num": "U3",
  "question": "<p>Each sensor reading is logged into the spreadsheet as a 25-character line of text, using 8 bits to store each character. Calculate the storage space, in bytes, needed for one logged reading. Show your working.</p>",
  "caseStudy": "<p>A school's environment club has fitted sensors around the school field that record data such as temperature and humidity. A pupil manually copies each reading into a spreadsheet as a short line of text, ready to be analysed later.</p>",
  "hint": "Use the text file-size formula: bits per character × number of characters. Work the answer out in bits first, then convert to bytes.",
  "starter": "Working: 8 × 25 = … bits, ÷ 8 = … bytes. Answer: … bytes",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 2 marks</h5>\n<ul>\n<li>1 mark for valid working, e.g. 8 × 25 = 200 (bits) // 200 ÷ 8</li>\n<li>1 mark for the answer: 25 bytes</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept any correct method that reaches bits first, then converts to bytes by dividing by 8.</li>\n<li>Award the working mark even if the final answer is wrong, provided the method shown is valid.</li>\n</ul>\n</div>",
   "modelAnswer": "Working: 8 bits × 25 characters = 200 bits. 200 ÷ 8 = 25 bytes. Answer: 25 bytes"
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:07e2d2a4",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "U4",
  "question": "<p>A sprite is 16 pixels tall and 16 pixels wide, using a colour depth of 4 bits per pixel. The developer wants every sprite file to be under 200 bytes.</p><p>Calculate the sprite's file size in bytes, and state whether it is within the developer's 200-byte budget. Show your working, including how much spare capacity (in bytes) is left if it is within budget.</p>",
  "caseStudy": "<p>An indie developer is creating a retro-style video game. Every character and object in the game is drawn as a small, blocky sprite — a tiny bitmap image made up of a grid of coloured pixels, deliberately kept small to match the game's old-school look.</p>",
  "hint": "Use the image formula: colour depth × height × width, in bits first — then convert to bytes before comparing to the 200-byte budget.",
  "starter": "Working: 4 × 16 × 16 = … bits, ÷ 8 = … bytes. Compared to 200 bytes: … Spare capacity: … bytes",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks</h5>\n<ul>\n<li>1 mark for working: 4 × 16 × 16 = 1024 (bits)</li>\n<li>1 mark for working: 1024 ÷ 8 = 128 (bytes)</li>\n<li>1 mark for the answer: 128 bytes</li>\n<li>1 mark for stating the sprite is within budget with the correct spare capacity: 200 − 128 = 72 bytes</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Own-figure/follow-through applies to the last two marks — if an earlier step is wrong, the comparison and spare-capacity marks can still be awarded using the candidate's own (wrong) file size, provided the method used is correct.</li>\n<li>Do not award the spare-capacity mark if the within/over budget conclusion is missing or wrong.</li>\n</ul>\n</div>",
   "modelAnswer": "Working: 4 × 16 × 16 = 1024 bits. 1024 ÷ 8 = 128 bytes. The sprite is 128 bytes, which is within the developer's 200-byte budget, leaving 200 − 128 = 72 bytes of spare capacity."
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:cc47afe4",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "written",
  "marks": 4,
  "num": "U5",
  "question": "<p>Complete the table by converting each given value into the unit requested. Use the specification's ×1,000 convention.</p>",
  "hint": "Nibble → bits doesn't use the ×1,000 rule (a nibble is 4 bits) — every other row does.",
  "starter": "Row 1: … | Row 2: … | Row 3: … | Row 4: …",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 4 marks (1 mark for each row)</h5>\n<ul>\n<li>3 nibbles = 12 bits</li>\n<li>5,000 bytes = 5 kilobytes</li>\n<li>2 gigabytes = 2,000 megabytes</li>\n<li>0.5 terabytes = 500 gigabytes</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Accept the numeric value with or without the unit written alongside it.</li>\n<li>Each row is marked independently.</li>\n</ul>\n</div>",
   "modelAnswer": "Row 1: 12 bits. Row 2: 5 kilobytes. Row 3: 2,000 megabytes. Row 4: 500 gigabytes."
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:2a08a2f1",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "mcq",
  "marks": 1,
  "num": "U6",
  "question": "<p>The podcast host records a short clip lasting 30 seconds at a sample rate of 8,000 Hz, using an 8-bit depth. What is the resulting file size, in kilobytes, using the specification's ×1,000 convention?</p>",
  "options": [
   "240 KB",
   "24 KB",
   "2,400 KB",
   "1,920 KB"
  ],
  "caseStudy": "<p>A podcast host records episodes using a laptop and uploads the finished audio files to an online hosting service, which gives every free account a limited amount of storage space.</p>",
  "hint": "Use the sound formula (sample rate × duration × bit depth) to get bits first, then divide by 8 for bytes and by 1,000 for kilobytes.",
  "key": {
   "answer": 0,
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 1 mark</h5>\n<ul>\n<li>240 KB — CAO (correct answer only)</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Only the correct option scores. Working: 8,000 × 30 × 8 = 1,920,000 bits ÷ 8 = 240,000 bytes ÷ 1,000 = 240 KB.</li>\n</ul>\n</div>",
   "modelAnswer": "240 KB (8,000 × 30 × 8 = 1,920,000 bits; ÷8 = 240,000 bytes; ÷1,000 = 240 KB)."
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:d6b40bb8",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "written",
  "marks": 6,
  "num": "U7",
  "question": "<p>The podcast host uploads finished episodes to a hosting service that gives free accounts 2 GB of storage. Each episode is recorded at a sample rate of 16,000 Hz, with an 8-bit depth, and lasts 600 seconds (10 minutes). The host wants to upload 4 episodes recorded this way.</p><p>Calculate whether all 4 episodes will fit within the 2 GB of free storage, showing your full working and stating how much spare capacity (in MB) is left if they do fit.</p>",
  "caseStudy": "<p>A podcast host records episodes using a laptop and uploads the finished audio files to an online hosting service, which gives every free account a limited amount of storage space.</p>",
  "hint": "Work in stages: one episode's size in bits → bytes → MB, then multiply by 4 episodes, then compare the total to 2 GB converted into MB.",
  "starter": "One episode: 16,000 × 600 × 8 = … bits, ÷ 8 = … bytes, ÷ 1,000 ÷ 1,000 = … MB. Four episodes: … × 4 = … MB. 2 GB = … MB. Spare: … MB",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 6 marks</h5>\n<ul>\n<li>1 mark: 16,000 × 600 × 8 = 76,800,000 (bits)</li>\n<li>1 mark: 76,800,000 ÷ 8 = 9,600,000 (bytes)</li>\n<li>1 mark: 9,600,000 ÷ 1,000 ÷ 1,000 = 9.6 (MB)</li>\n<li>1 mark: 9.6 × 4 = 38.4 (MB, for all four episodes)</li>\n<li>1 mark: 2 GB converted to 2,000 MB</li>\n<li>1 mark: correct conclusion — the episodes fit, with 2,000 − 38.4 = 1,961.6 MB spare</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Own-figure/follow-through applies throughout: each step's mark can be awarded using the candidate's own value carried forward from an earlier (even incorrect) step, provided the method used at that step is correct.</li>\n<li>The final conclusion mark requires both a correct fit/no-fit statement AND a spare-capacity figure consistent with their own total.</li>\n</ul>\n</div>",
   "modelAnswer": "One episode: 16,000 × 600 × 8 = 76,800,000 bits. 76,800,000 ÷ 8 = 9,600,000 bytes. 9,600,000 ÷ 1,000 ÷ 1,000 = 9.6 MB.\n\nFour episodes: 9.6 × 4 = 38.4 MB. 2 GB = 2,000 MB.\n\nSince 38.4 MB is far less than 2,000 MB, all four episodes will fit, with 2,000 − 38.4 = 1,961.6 MB of spare capacity remaining."
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:01ad1086",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "written",
  "marks": 3,
  "num": "U8",
  "question": "<p>Describe how increasing the colour depth used for a sprite, and increasing its resolution, would each affect the sprite's file size and its visual quality.</p>",
  "caseStudy": "<p>An indie developer is creating a retro-style video game. Every character and object in the game is drawn as a small, blocky sprite — a tiny bitmap image made up of a grid of coloured pixels, deliberately kept small to match the game's old-school look.</p>",
  "hint": "Two separate factors to describe — colour depth and resolution — linking each one back to both file size AND quality.",
  "starter": "A higher colour depth would… A higher resolution would…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 3 marks (1 mark per point to max 3)</h5>\n<ul>\n<li>A higher colour depth stores more bits per pixel, increasing the file size, but allows more possible colours per pixel (better/richer quality)</li>\n<li>A higher resolution (more pixels) increases the file size, because there is more pixel data to store, but shows more visual detail (better quality)</li>\n<li>Both a higher colour depth and a higher resolution increase file size — a real trade-off against visual quality, which matters for a retro-style game where sprites are deliberately kept small</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given</h5>\n<ul>\n<li>Award 1 mark per point to a maximum of 3.</li>\n<li>Full marks needs both colour depth and resolution addressed, plus a valid comment on the size/quality trade-off (or an equally strong development of one factor).</li>\n</ul>\n</div>",
   "modelAnswer": "A higher colour depth means more bits are used to store each pixel's colour, which increases the file size — but it also allows more possible colours, giving a richer, higher-quality image. A higher resolution means the sprite is made of more pixels, so there is more data to store (a bigger file), but it shows finer detail. Because retro-style games deliberately want tiny sprite files, a real trade-off exists between using a higher colour depth/resolution for better quality and keeping files small."
  }
 },
 {
  "id": "computer-science:1-2-3-units:exam:3e8cdfd9",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "exam",
  "type": "written",
  "marks": 8,
  "num": "U9",
  "question": "<p>The drone company is trying to decide on camera settings for a new model. Setting A uses a high resolution and high colour depth, producing the best-quality photos but larger files. Setting B uses a lower resolution and lower colour depth, producing smaller files but lower-quality photos.</p><p>Discuss the impact that choosing between Setting A and Setting B could have on a single flight, during which the drone's memory card has a fixed, limited capacity.</p><p>In your answer you might consider:</p><ul><li>how colour depth and resolution affect file size</li><li>the effect on how many photos can be stored on the memory card during one flight</li><li>the effect on the usefulness of the photos once the drone lands</li><li>which setting you would recommend, and why</li></ul>",
  "caseStudy": "<p>A hobbyist company builds small camera drones. Each drone has an onboard camera that captures aerial photos during a flight, storing them directly onto a removable memory card fitted inside the drone.</p><p>The drone's flight computer also runs a program that controls the propellers and camera automatically during flight.</p>",
  "hint": "Use all four bullets as your plan. Explain the mechanism (bigger files → fewer photos fit), follow it through to a REAL consequence of the flight, and weigh photo quality against photo quantity for a top-band answer.",
  "starter": "With Setting A, each photo file will be…",
  "key": {
   "markScheme": "<div class=\"marks-section\">\n<h5>Mark Scheme — 8 marks (levelled) — indicative content</h5>\n<p>The following is indicative of possible factors/evidence that candidates may refer to but is not prescriptive or exhaustive:</p>\n<ul>\n<li><strong>How colour depth/resolution affect file size</strong> — Setting A's higher colour depth stores more bits per pixel, and its higher resolution means more pixels overall; both increase file size (bits = colour depth × height × width). Setting B's lower values mean a smaller file size per photo.</li>\n<li><strong>Effect on how many photos fit</strong> — the memory card's capacity is fixed, so larger Setting A photos mean fewer photos can be stored during one flight; Setting B's smaller photos mean many more can be stored before the card fills up.</li>\n<li><strong>Effect on the usefulness of the photos</strong> — Setting A's higher quality/detail may matter for close inspection or publication, but running out of card space mid-flight could mean missing important later photos; Setting B captures more of the flight but each photo shows less fine detail, which may not be good enough for the drone's purpose.</li>\n<li><strong>Recommendation</strong> — the better choice depends on the drone's actual task: Setting A suits short flights needing a few high-quality images, Setting B suits long flights needing continuous coverage where running out of storage would be worse than lower detail.</li>\n</ul>\n</div>\n<div class=\"marks-section\">\n<h5>How the marks are given — levels of response</h5>\n<ul>\n<li><strong>Mark Band 3 — High Level (6–8 marks):</strong> Thorough knowledge and understanding of colour depth, resolution and file-size capacity, applied directly and consistently to the drone context. The response weighs up both settings (quality against quantity/storage) and covers all four areas from the bullet list with clear, logically structured reasoning, ending in a justified recommendation.</li>\n<li><strong>Mark Band 2 — Mid Level (3–5 marks):</strong> Reasonable knowledge, generally accurate but at times underdeveloped or only partly applied to the drone context. Most of the four areas are addressed, with some structure, though the discussion may not fully weigh both settings or the recommendation may be unjustified.</li>\n<li><strong>Mark Band 1 — Low Level (1–2 marks):</strong> Basic knowledge with limited understanding shown; the material may contain inaccuracies or barely refer to the drone context. Little more than an unsupported assertion, e.g. \"Setting A is better\" with no working explanation of why.</li>\n<li><strong>0 marks:</strong> No attempt to answer the question or response is not worthy of credit.</li>\n</ul>\n</div>",
   "modelAnswer": "With Setting A, each photo file will be larger, because both a higher colour depth (more bits per pixel) and a higher resolution (more pixels) increase the number of bits that have to be stored per photo. With Setting B, each photo file will be much smaller, since fewer bits are used per pixel and there are fewer pixels overall.\n\nBecause the memory card has a fixed, limited capacity, this directly affects how many photos can be captured during a single flight: Setting A will fill the card after relatively few photos, while Setting B allows far more photos to be stored before the card is full.\n\nThis has a real effect once the drone lands: Setting A's photos will show more fine detail, which matters if the images need close inspection, but the drone risks running out of storage and missing photos later in the flight. Setting B's photos will show less detail but allow continuous coverage of the whole flight without running out of space.\n\nOn balance, Setting A is the better choice for a short flight where a small number of high-quality images matter most, while Setting B is better for a long flight where capturing the whole mission without running out of storage is more important than the fine detail of each individual photo."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:30ad7b61",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "What is a nibble?",
  "options": [
   "2 bits",
   "4 bits",
   "8 bits",
   "16 bits"
  ],
  "key": {
   "answer": 1,
   "explain": "A nibble is 4 bits — half of a byte."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:6ee6fe51",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "How many bits make up a byte?",
  "options": [
   "4",
   "8",
   "10",
   "16"
  ],
  "key": {
   "answer": 1,
   "explain": "A byte is 8 bits, or two nibbles."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:10cbcba2",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Using the specification's ×1,000 convention, which unit comes immediately after the megabyte on the ladder?",
  "options": [
   "Kilobyte",
   "Terabyte",
   "Gigabyte",
   "Petabyte"
  ],
  "key": {
   "answer": 2,
   "explain": "The ladder runs bit → nibble → byte → kilobyte → megabyte → gigabyte → terabyte → petabyte."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:9d0b7a20",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Using the ×1,000 convention, how many bytes are in 3 kilobytes?",
  "options": [
   "30",
   "300",
   "3,000",
   "30,000"
  ],
  "key": {
   "answer": 2,
   "explain": "1 kilobyte = 1,000 bytes, so 3 kilobytes = 3 × 1,000 = 3,000 bytes."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:bfbf1022",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Using the ×1,000 convention, how many megabytes are in 2 gigabytes?",
  "options": [
   "20",
   "200",
   "2,000",
   "20,000"
  ],
  "key": {
   "answer": 2,
   "explain": "1 gigabyte = 1,000 megabytes, so 2 gigabytes = 2 × 1,000 = 2,000 megabytes."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:72ba6493",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Why must a computer store all of its data as binary?",
  "options": [
   "Binary is quicker for a programmer to type than denary",
   "Its hardware is built from switches that can only be on or off",
   "Binary numbers use noticeably fewer digits than denary numbers do",
   "Binary makes every file automatically smaller and quicker to load"
  ],
  "key": {
   "answer": 1,
   "explain": "A transistor only has two physical states — on and off — so binary (0/1) is the only form of data the hardware can represent."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:25e41ba5",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A sound is recorded for 3 seconds at a sample rate of 20,000 Hz with an 8-bit depth. What is its file size in KB?",
  "options": [
   "60 KB",
   "6 KB",
   "48 KB",
   "480 KB"
  ],
  "key": {
   "answer": 0,
   "explain": "20,000 × 3 × 8 = 480,000 bits. 480,000 ÷ 8 = 60,000 bytes. 60,000 ÷ 1,000 = 60 KB."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:4828a71b",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "An image is 100 pixels tall and 100 pixels wide, with a colour depth of 4 bits. What is its file size in bytes?",
  "options": [
   "5,000 bytes",
   "40,000 bytes",
   "1,250 bytes",
   "10,000 bytes"
  ],
  "key": {
   "answer": 0,
   "explain": "4 × 100 × 100 = 40,000 bits. 40,000 ÷ 8 = 5,000 bytes."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:52d1bce5",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A text file has 2,000 characters stored at 8 bits per character. What is its file size in KB?",
  "options": [
   "2 KB",
   "16 KB",
   "0.2 KB",
   "250 KB"
  ],
  "key": {
   "answer": 0,
   "explain": "8 × 2,000 = 16,000 bits. 16,000 ÷ 8 = 2,000 bytes. 2,000 ÷ 1,000 = 2 KB."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:ceaea3a2",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which of these file sizes is the LARGEST?",
  "options": [
   "150,000 KB",
   "140 MB",
   "0.2 GB",
   "0.00013 TB"
  ],
  "key": {
   "answer": 2,
   "explain": "Converting everything to MB: 150,000 KB = 150 MB; 140 MB; 0.2 GB = 200 MB; 0.00013 TB = 130 MB. 0.2 GB is the largest at 200 MB."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:ce0cb478",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "Which value have some OCR mark schemes also accepted as an alternative to ×1,000 when converting between units such as KB and MB?",
  "options": [
   "100",
   "500",
   "1,024",
   "10,000"
  ],
  "key": {
   "answer": 2,
   "explain": "1,024 = 2 to the power 10, a value that fits neatly into binary. It is occasionally accepted as an alternative, but ×1,000 is the specification's default and gives cleaner working."
  }
 },
 {
  "id": "computer-science:1-2-3-units:mcq:37fa6f1b",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "mcq",
  "type": "mcq",
  "marks": 1,
  "question": "A memory card holds 16 GB. Each photo is 2 MB. Roughly how many photos will fit?",
  "options": [
   "80",
   "800",
   "8,000",
   "80,000"
  ],
  "key": {
   "answer": 2,
   "explain": "16 GB = 16,000 MB. 16,000 ÷ 2 = 8,000 photos."
  }
 },
 {
  "id": "computer-science:1-2-3-units:tf:37912c1b",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "A byte is made up of 4 bits.",
  "key": {
   "answer": false,
   "explain": "4 bits is a nibble. A byte is 8 bits — two nibbles."
  }
 },
 {
  "id": "computer-science:1-2-3-units:tf:c0d48f63",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Using the specification's convention, 1 kilobyte is equal to 1,000 bytes.",
  "key": {
   "answer": true,
   "explain": "Correct — OCR's default step between units on this course is ×1,000."
  }
 },
 {
  "id": "computer-science:1-2-3-units:tf:fdecae93",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "A megabyte is larger than a gigabyte.",
  "key": {
   "answer": false,
   "explain": "The opposite is true: 1 gigabyte = 1,000 megabytes, so a gigabyte is far larger."
  }
 },
 {
  "id": "computer-science:1-2-3-units:tf:407acce3",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Binary is used in computers because it is easier for programmers to type only two digits.",
  "key": {
   "answer": false,
   "explain": "The real reason is hardware, not typing convenience: a transistor can only be on or off, giving exactly two physical states."
  }
 },
 {
  "id": "computer-science:1-2-3-units:tf:6e339157",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "The image file-size formula multiplies colour depth by the image's height and width in pixels.",
  "key": {
   "answer": true,
   "explain": "Correct — file size (bits) = colour depth × height × width."
  }
 },
 {
  "id": "computer-science:1-2-3-units:tf:e89438f8",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "The sound file-size formula does not need to know how long the recording lasts.",
  "key": {
   "answer": false,
   "explain": "Duration is one of the three factors: file size (bits) = sample rate × duration × bit depth. Leaving it out gives the wrong answer."
  }
 },
 {
  "id": "computer-science:1-2-3-units:tf:23dc7d22",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Some OCR mark schemes have also accepted answers calculated using 1,024 instead of 1,000.",
  "key": {
   "answer": true,
   "explain": "True — 1,000 is the specification's default and gives cleaner non-calculator arithmetic, but 1,024 (2 to the power 10) has occasionally been accepted as an alternative."
  }
 },
 {
  "id": "computer-science:1-2-3-units:tf:7f3f69c4",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "tf",
  "type": "tf",
  "marks": 1,
  "question": "Before comparing or adding file sizes, you should convert every value onto the same unit.",
  "key": {
   "answer": true,
   "explain": "Correct — comparing '2,300 KB' with '200 MB' directly is meaningless until both are written in the same unit."
  }
 },
 {
  "id": "computer-science:1-2-3-units:learn:46b136cb",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Why must computer data be stored in binary?",
  "reading": "<h4>The real reason — switches, not simplicity</h4>\n<ul>\n<li>Every value inside a computer — a number, a letter, a photo, a song — is ultimately stored as <strong>binary digits (bits)</strong>: 0s and 1s.</li>\n<li>The reason is physical, not a design choice made for convenience. Computers are built from millions of tiny electronic <strong>switches (transistors)</strong> that can only be in one of <strong>two states</strong>: <strong>on</strong> or <strong>off</strong>. \"On\" naturally represents 1; \"off\" represents 0.</li>\n<li>There is no reliable third or fourth state for a switch to sit in, so binary is the only form of data the hardware can physically represent. It isn't that binary is \"easier\" — it's the only option.</li>\n</ul>\n<h4>The building blocks, smallest to largest</h4>\n<ul>\n<li>A single <strong>bit</strong> is the smallest unit of data a computer can store — it holds exactly one 0 or one 1.</li>\n<li>A <strong>nibble</strong> is <strong>4 bits</strong>.</li>\n<li>A <strong>byte</strong> is <strong>8 bits</strong> — two nibbles. Almost every calculation in this topic ends with converting your answer into bytes (or a unit built from bytes).</li>\n</ul>\n<h4>Why the exam keeps coming back to this</h4>\n<ul>\n<li>OCR's papers on this topic are <strong>non-calculator</strong>, so really they are testing whether you know the chain bit → nibble → byte → kilobyte… well enough to convert cleanly in your head, not whether you can do long division.</li>\n</ul>",
  "question": "Why is data stored in binary inside a computer?",
  "options": [
   "Because binary numbers are quicker for programmers to type out",
   "Because computers are built from switches that can only be on or off",
   "Because binary numbers always take up less storage space than denary",
   "Because early computer designers agreed on it as a shared standard"
  ],
  "key": {
   "answer": 1,
   "explain": "It comes down to hardware, not convenience: a transistor can only be on or off, giving exactly two states — 1 and 0. There is no natural third state to build a switch around."
  }
 },
 {
  "id": "computer-science:1-2-3-units:learn:8a329fb7",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "The unit ladder: bit → nibble → byte → KB → MB → GB → TB → PB",
  "reading": "<h4>Learn the ladder as one climbing sequence</h4>\n<table>\n<tr><th>Unit</th><th>Size</th></tr>\n<tr><td>Nibble</td><td>4 bits</td></tr>\n<tr><td>Byte</td><td>8 bits</td></tr>\n<tr><td>Kilobyte (KB)</td><td>1,000 bytes</td></tr>\n<tr><td>Megabyte (MB)</td><td>1,000 kilobytes</td></tr>\n<tr><td>Gigabyte (GB)</td><td>1,000 megabytes</td></tr>\n<tr><td>Terabyte (TB)</td><td>1,000 gigabytes</td></tr>\n<tr><td>Petabyte (PB)</td><td>1,000 terabytes</td></tr>\n</table>\n<h4>The step is always ×1,000</h4>\n<ul>\n<li>From kilobyte upwards, every step up the ladder is the same: <strong>multiply by 1,000</strong> to go up a unit, <strong>divide by 1,000</strong> to go down.</li>\n<li>So 3 kilobytes = 3,000 bytes; 2,000 megabytes = 2 gigabytes; 2,000 terabytes = 2 petabytes.</li>\n<li>Real candidates find the far ends of the ladder hardest — converting straight from terabytes to petabytes is where marks are most often lost, because it feels like \"too big a number\" to trust. Do the same ×1,000 / ÷1,000 step anyway.</li>\n</ul>\n<h4>The one exception you should know about</h4>\n<ul>\n<li>Some computer scientists instead treat each step as <strong>×1,024</strong> (because 1,024 = 2<sup>10</sup>, a \"round number\" in binary), which is technically how your operating system often reports file sizes.</li>\n<li>OCR's specification uses the <strong>1,000× convention</strong> for this course, and that is what you should use by default. Mark schemes have occasionally also accepted an equivalent answer worked out using 1,024 — but 1,000 is the one to reach for first, and it produces far cleaner numbers on a non-calculator paper.</li>\n</ul>",
  "question": "Using the specification's ×1,000 convention, how many kilobytes are in 5 megabytes?",
  "options": [
   "500 KB",
   "5,000 KB",
   "50,000 KB",
   "5 KB"
  ],
  "key": {
   "answer": 1,
   "explain": "One megabyte is 1,000 kilobytes, so 5 megabytes is 5 × 1,000 = 5,000 kilobytes."
  }
 },
 {
  "id": "computer-science:1-2-3-units:learn:78981f2d",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Comparing file sizes and calculating storage capacity",
  "reading": "<h4>Rule one: convert to the SAME unit before you compare</h4>\n<ul>\n<li>Exam questions love mixing units on purpose — \"which is bigger, 2,300 KB or 200 MB?\" You cannot compare the numbers 2,300 and 200 directly; you must convert them onto the same ladder step first.</li>\n<li>2,300 KB ÷ 1,000 = 2.3 MB. Now compare 2.3 MB against 200 MB — 200 MB is far bigger, even though \"2,300\" looked like the larger number.</li>\n<li>The trap only works if you compare the raw numbers without converting. Always ask \"same unit?\" before you tick an answer.</li>\n</ul>\n<h4>Worked example: calculating how much storage you need</h4>\n<table>\n<tr><th>Step</th><th>What you do</th><th>Result</th></tr>\n<tr><td>1</td><td>A school stores 500 student photos, each averaging 4 MB. Find the TOTAL size in MB.</td><td>500 × 4 = 2,000 MB</td></tr>\n<tr><td>2</td><td>Convert MB into GB by dividing by 1,000 (the next step up the ladder).</td><td>2,000 ÷ 1,000 = 2 GB</td></tr>\n<tr><td>3</td><td>State the answer in the unit the question asked for, with working shown.</td><td>2 GB</td></tr>\n</table>\n<h4>The \"own-figure\" rule</h4>\n<ul>\n<li>OCR's calculation questions usually give <strong>one mark for the correct final answer</strong> and a <strong>separate mark for showing valid working</strong> (e.g. the multiplication and the division step). If your working is sound but you slip on the arithmetic, you can still pick up the working mark — so always write every step down, even on a non-calculator paper.</li>\n</ul>",
  "question": "A phone stores 200 songs averaging 5 MB each. What is the total storage needed, in GB?",
  "options": [
   "1 GB",
   "0.1 GB",
   "10 GB",
   "100 GB"
  ],
  "key": {
   "answer": 0,
   "explain": "200 × 5 = 1,000 MB. 1,000 MB ÷ 1,000 = 1 GB."
  }
 },
 {
  "id": "computer-science:1-2-3-units:learn:beb09f54",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Worked example: calculating a sound file's size",
  "reading": "<h4>The formula</h4>\n<ul>\n<li><strong>File size (bits) = sample rate (Hz) × duration (seconds) × bit depth (bits per sample)</strong></li>\n<li><strong>Sample rate</strong> is how many samples of the sound wave are taken every second, measured in <strong>hertz (Hz)</strong>.</li>\n<li><strong>Bit depth</strong> is how many bits are used to store the value of each sample. A bigger bit depth records the sound wave's height more precisely.</li>\n</ul>\n<h4>Worked example</h4>\n<table>\n<tr><th>Step</th><th>What you do</th><th>Result</th></tr>\n<tr><td>1</td><td>A 4-second recording is sampled at 10,000 Hz with an 8-bit depth. Multiply sample rate × duration × bit depth.</td><td>10,000 × 4 × 8 = 320,000 bits</td></tr>\n<tr><td>2</td><td>Always answer a file-size formula in BITS first, then convert. Divide by 8 to get bytes.</td><td>320,000 ÷ 8 = 40,000 bytes</td></tr>\n<tr><td>3</td><td>Convert bytes into a sensible unit by dividing by 1,000.</td><td>40,000 ÷ 1,000 = 40 KB</td></tr>\n</table>\n<h4>What increases the file size?</h4>\n<ul>\n<li>Increasing <strong>any</strong> of the three factors increases the file size: a <strong>higher sample rate</strong>, a <strong>longer duration</strong>, or a <strong>greater bit depth</strong> all mean more bits are stored.</li>\n<li>Sample rate and bit depth also affect <strong>quality</strong> — more samples and a more precise value per sample both make the digital copy closer to the original analogue sound wave.</li>\n</ul>",
  "question": "A sound is recorded for 2 seconds at a sample rate of 5,000 Hz with a bit depth of 8 bits. What is the file size in KB?",
  "options": [
   "10 KB",
   "80 KB",
   "1 KB",
   "800 KB"
  ],
  "key": {
   "answer": 0,
   "explain": "5,000 × 2 × 8 = 80,000 bits. 80,000 ÷ 8 = 10,000 bytes. 10,000 ÷ 1,000 = 10 KB."
  }
 },
 {
  "id": "computer-science:1-2-3-units:learn:6ae253a4",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Worked example: calculating an image file's size",
  "reading": "<h4>The formula</h4>\n<ul>\n<li><strong>File size (bits) = colour depth (bits per pixel) × height (pixels) × width (pixels)</strong></li>\n<li>An image is made of a grid of <strong>pixels</strong>. Each pixel stores a binary code for its colour — the number of bits used for that code is the <strong>colour depth</strong>.</li>\n<li><strong>Resolution</strong> is the number of pixels that make up the image (height × width) — more pixels means more detail, but also a bigger file.</li>\n</ul>\n<h4>Worked example</h4>\n<table>\n<tr><th>Step</th><th>What you do</th><th>Result</th></tr>\n<tr><td>1</td><td>An image is 100 pixels tall and 200 pixels wide, with a colour depth of 8 bits. Multiply colour depth × height × width.</td><td>8 × 100 × 200 = 160,000 bits</td></tr>\n<tr><td>2</td><td>Convert bits into bytes by dividing by 8.</td><td>160,000 ÷ 8 = 20,000 bytes</td></tr>\n<tr><td>3</td><td>Convert bytes into a sensible unit by dividing by 1,000.</td><td>20,000 ÷ 1,000 = 20 KB</td></tr>\n</table>\n<h4>Quality vs file size — always a trade-off</h4>\n<ul>\n<li>A <strong>higher colour depth</strong> allows more possible colours per pixel (better quality) but stores more bits per pixel (bigger file).</li>\n<li>A <strong>higher resolution</strong> (more pixels) shows more detail but multiplies the file size directly — doubling both height and width roughly quadruples the file size.</li>\n<li><strong>Metadata</strong> (extra information stored with the image, such as its dimensions, the date it was taken or the camera used) adds a small amount on top of the pixel data itself.</li>\n</ul>",
  "question": "An image is 50 pixels tall and 100 pixels wide, with a colour depth of 8 bits. What is the file size in bytes?",
  "options": [
   "5,000 bytes",
   "40,000 bytes",
   "1,250 bytes",
   "800 bytes"
  ],
  "key": {
   "answer": 0,
   "explain": "8 × 50 × 100 = 40,000 bits. 40,000 ÷ 8 = 5,000 bytes."
  }
 },
 {
  "id": "computer-science:1-2-3-units:learn:55a380b5",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "learn",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Worked example: calculating a text file's size",
  "reading": "<h4>The formula</h4>\n<ul>\n<li><strong>File size (bits) = bits per character × number of characters</strong></li>\n<li>Every character in a text file (a letter, digit, space or punctuation mark) is stored as a binary code. The number of bits used for each character is given to you in the question — always use THAT number, not one you remember from elsewhere.</li>\n</ul>\n<h4>Worked example</h4>\n<table>\n<tr><th>Step</th><th>What you do</th><th>Result</th></tr>\n<tr><td>1</td><td>A document has 500 characters, stored using 8 bits per character. Multiply bits per character × number of characters.</td><td>8 × 500 = 4,000 bits</td></tr>\n<tr><td>2</td><td>Convert bits into bytes by dividing by 8.</td><td>4,000 ÷ 8 = 500 bytes</td></tr>\n<tr><td>3</td><td>State the answer in the unit asked for (bytes here — the number is too small to need converting further).</td><td>500 bytes</td></tr>\n</table>\n<h4>The pattern across all three formulas</h4>\n<ul>\n<li>Notice all three file-size formulas share the same shape: a <strong>\"per unit\" factor</strong> (bits per sample / bits per pixel / bits per character) multiplied by <strong>however many of that unit there are</strong> (samples taken / pixels in the image / characters in the file).</li>\n<li>Work in <strong>bits first</strong>, every time — then convert (÷8 for bytes, ÷1,000 per step after that) into whatever unit the question wants.</li>\n</ul>",
  "question": "A text file has 1,000 characters stored at 8 bits per character. What is the file size in KB?",
  "options": [
   "1 KB",
   "8 KB",
   "0.1 KB",
   "125 KB"
  ],
  "key": {
   "answer": 0,
   "explain": "8 × 1,000 = 8,000 bits. 8,000 ÷ 8 = 1,000 bytes. 1,000 ÷ 1,000 = 1 KB."
  }
 },
 {
  "id": "computer-science:1-2-3-units:misc:d8492d4f",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Mixing up nibble and byte — remembering a byte as 4 bits.</p><p><strong>✅ The correct idea:</strong> A <strong>nibble</strong> is 4 bits; a <strong>byte</strong> is 8 bits (two nibbles). If you always picture a nibble as \"half a byte\", the two stay locked together and you cannot swap them by accident.</p>",
  "question": "Which pairing is correct?",
  "options": [
   "Nibble = 8 bits, byte = 4 bits",
   "Nibble = 4 bits, byte = 8 bits",
   "Nibble = 2 bits, byte = 4 bits",
   "Nibble and byte are the same size"
  ],
  "key": {
   "answer": 1,
   "explain": "A nibble is 4 bits and a byte is 8 bits — a byte is exactly two nibbles."
  }
 },
 {
  "id": "computer-science:1-2-3-units:misc:3f049a69",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Comparing file sizes written in different units without converting them onto the same unit first, and assuming the bigger-looking number wins — e.g. thinking 2,300 KB must be more than 200 MB because 2,300 is a bigger number than 200.</p><p><strong>✅ The correct idea:</strong> You cannot compare the raw digits when the units are different. Convert both figures onto the same unit first: 2,300 KB ÷ 1,000 = <strong>2.3 MB</strong>, which is far smaller than <strong>200 MB</strong>. Always ask \"are these in the same unit?\" before deciding which is bigger.</p>",
  "question": "Which is actually larger: 2,300 KB or 200 MB?",
  "options": [
   "2,300 KB, since 2,300 is a bigger raw number than 200",
   "200 MB, because 2,300 KB only converts to 2.3 MB",
   "The two values are exactly equal in size",
   "It cannot be worked out without a calculator"
  ],
  "key": {
   "answer": 1,
   "explain": "2,300 KB = 2.3 MB, which is much smaller than 200 MB. Converting to the same unit is the only safe way to compare."
  }
 },
 {
  "id": "computer-science:1-2-3-units:misc:1a61259e",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Believing the smallest whole number that can be stored in 8 bits is 1.</p><p><strong>✅ The correct idea:</strong> It is <strong>0</strong> (represented as 00000000). Every bit can be 0, and a computer does not skip zero — it is a perfectly normal value to store, and often the smallest one available.</p>",
  "question": "What is the smallest whole number that can be stored in 8 bits?",
  "options": [
   "0",
   "1",
   "8",
   "255"
  ],
  "key": {
   "answer": 0,
   "explain": "00000000 represents 0, which is a valid value 8 bits can store — and the smallest one."
  }
 },
 {
  "id": "computer-science:1-2-3-units:misc:05637503",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Finishing a file-size calculation and leaving the answer in bits, even though the question asked for the size in KB or MB.</p><p><strong>✅ The correct idea:</strong> The three formulas always give you an answer in <strong>bits</strong> first — that is only the first step. You must then divide by 8 to reach bytes, and keep dividing by 1,000 for each unit up the ladder until you reach the unit the question actually asked for.</p>",
  "question": "A calculation using the sound formula gives 80,000 bits. The question asks for the answer in KB. What should you do next?",
  "options": [
   "Write down 80,000 as the final answer, already correct in KB",
   "Divide by 8 to get bytes, then divide by 1,000 to get KB",
   "Multiply the bits total by 8 to reach bytes",
   "Divide the whole bits total by 1,000 only, then stop working"
  ],
  "key": {
   "answer": 1,
   "explain": "80,000 bits ÷ 8 = 10,000 bytes, then ÷ 1,000 = 10 KB. Both conversion steps are needed to reach the unit asked for."
  }
 },
 {
  "id": "computer-science:1-2-3-units:misc:d6a4bdba",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Believing binary is used in computers simply because it is a simpler or more convenient choice.</p><p><strong>✅ The correct idea:</strong> It is not a preference — it is forced by the hardware. A computer is built from millions of transistors, and a transistor can only physically be <strong>on</strong> or <strong>off</strong>. Binary (1 and 0) is the only representation that fits that hardware.</p>",
  "question": "Why can't a computer use denary (0–9) internally instead of binary?",
  "options": [
   "Denary would make written programs far too easy to read",
   "Its switches (transistors) can only be in one of two physical states",
   "Denary numbers always take up noticeably more space than binary ones",
   "It could, but no manufacturer has ever built one"
  ],
  "key": {
   "answer": 1,
   "explain": "The hardware itself only has two physical states available, so only a two-value (binary) system can be represented directly."
  }
 },
 {
  "id": "computer-science:1-2-3-units:misc:7d7431ae",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "misc",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "Misconception check",
  "reading": "<p><strong>❌ Common misconception:</strong> Assuming every unit conversion on this course must use ×1,024, and getting messy, error-prone arithmetic on a non-calculator paper as a result.</p><p><strong>✅ The correct idea:</strong> Reach for <strong>×1,000</strong> first — it is this specification's convention and produces clean numbers you can do in your head (exactly what a non-calculator paper needs). 1,024 is only occasionally accepted as an alternative, not the expected method.</p>",
  "question": "On a non-calculator OCR paper, which conversion factor should you use by default between KB, MB, GB etc.?",
  "options": [
   "1,000",
   "1,024",
   "1,000 for KB→MB only, then 1,024 after that",
   "Either — the exam always accepts both with no working shown"
  ],
  "key": {
   "answer": 0,
   "explain": "1,000 is the specification's default convention and gives clean non-calculator arithmetic; 1,024 has only occasionally been accepted as an alternative."
  }
 },
 {
  "id": "computer-science:1-2-3-units:tips:855d632a",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "explain — Show-your-working ladder: the 2-mark capacity calculation",
  "reading": "<p>A typical question: <em>\"500 photos average 4 MB each. Calculate an estimate of the storage space in GB that the 500 files will require. Show your working out.\"</em> [2 marks] Here is the same answer at every level:</p>\n\n<p><strong>❌ 0 marks:</strong> \"2 GB\"</p>\n<ul>\n<li>No working shown. Even a correct final answer with nothing behind it risks losing the working mark entirely if it happens to be wrong.</li>\n</ul>\n\n<p><strong>⚠️ 1 mark:</strong> \"500 × 4 = 2000 MB\"</p>\n<ul>\n<li>Valid working is shown (1 mark) but the answer was never converted into GB and stated as a final answer — the second mark is for the CONVERTED answer in the unit asked for.</li>\n</ul>\n\n<p><strong>✅ 2 marks:</strong> \"500 × 4 = 2000 MB <strong>(1)</strong>. 2000 ÷ 1000 = 2 GB <strong>(1)</strong>.\"</p>\n\n<p><strong>Why this matters even if your arithmetic slips:</strong> OCR marks the WORKING and the ANSWER as separate marks. If you multiply correctly but make a small slip converting units, you keep the working mark — but only if you actually wrote the working down. On a non-calculator paper, always show every step.</p>",
  "question": "You calculate 500 × 4 = 2000 MB correctly, but then wrongly divide by 100 instead of 1,000 and write '20 GB'. What mark do you get out of 2?",
  "options": [
   "0, because the final stated answer is wrong",
   "1 — the working mark for the correct multiplication step",
   "2, since your working clearly shows you understood the method",
   "It depends entirely on which calculator you used"
  ],
  "key": {
   "answer": 1,
   "explain": "The multiplication step (500 × 4 = 2000 MB) is valid working, so it earns the working mark even though the final conversion — and therefore the answer mark — was wrong."
  }
 },
 {
  "id": "computer-science:1-2-3-units:tips:63cf9aee",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "tip — Comparing file sizes without a calculator: convert first, always",
  "reading": "<p>Whenever a question gives you file sizes in different units and asks which is biggest, smallest, or equal, the trap is comparing the raw numbers before converting.</p>\n\n<p><strong>The three-step method:</strong></p>\n<ul>\n<li><strong>1. Pick ONE unit</strong> to convert everything into — usually whichever unit most of the options are already close to.</li>\n<li><strong>2. Convert every option</strong> using ×1,000 / ÷1,000 per step, writing the converted value next to each option.</li>\n<li><strong>3. Compare the converted values</strong>, not the original numbers.</li>\n</ul>\n\n<p><strong>Worked example — which of these is equal to 3 MB?</strong></p>\n<ul>\n<li>3,000 KB → ÷1,000... wait, KB→MB is ÷1,000, so 3,000 ÷ 1,000 = <strong>3 MB</strong>. Equal.</li>\n<li>0.003 GB → ×1,000 to get MB: 0.003 × 1,000 = <strong>3 MB</strong>. Also equal!</li>\n<li>Both convert to exactly 3 MB — a reminder that more than one option can be correct in a \"tick two boxes\" style question, and that the trick is almost always hiding an equivalent value in a different unit.</li>\n</ul>",
  "question": "A question gives four file sizes in four different units and asks you to tick the largest. What should you do FIRST?",
  "options": [
   "Tick whichever of the four raw numbers looks the biggest",
   "Convert every option into the same unit before comparing",
   "Add all four of the given numbers together",
   "Assume the very first option is a decoy"
  ],
  "key": {
   "answer": 1,
   "explain": "Raw numbers in different units cannot be compared directly — converting everything onto the same unit first is the only reliable method."
  }
 },
 {
  "id": "computer-science:1-2-3-units:tips:40e2ef5d",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "tips",
  "type": "mcq",
  "marks": 1,
  "readingTitle": "explain — Tick-one-box unit questions: what the 1 mark actually needs",
  "reading": "<p>Single tick-box questions on this topic are worth only 1 mark, but they are rarely a lucky guess — three of the four options are usually wrong for a specific, checkable reason.</p>\n\n<p><strong>❌ Common wrong pick:</strong> choosing an option because it \"sounds right\" or uses a familiar-looking number, without actually converting or checking it.</p>\n\n<p><strong>✅ The reliable method:</strong> work out (or convert) EVERY option before you tick anything, and eliminate the ones you can prove are wrong. For a \"which statement about binary is true\" style question, check each statement against something you know for certain — e.g. a binary digit can only ever be 0 or 1, so any statement mentioning a third digit value is automatically false.</p>\n\n<p><strong>One tick only.</strong> Every mark scheme on this topic states that ticking two or more boxes scores zero, even if one of them is correct — so if you are unsure, commit to your best-evidenced single answer rather than hedging.</p>",
  "question": "You are fairly confident the answer is box 3, but tick box 1 as well just in case. What mark do you get?",
  "options": [
   "1 mark, since box 3 is the box that was actually correct",
   "0 marks — two or more ticks always scores zero on these questions",
   "0.5 marks awarded automatically as partial credit",
   "It depends entirely on which of the two ticked boxes the examiner prefers"
  ],
  "key": {
   "answer": 1,
   "explain": "OCR's mark schemes for single tick-box questions award 0 marks the moment two or more boxes are ticked, regardless of whether the correct box is among them."
  }
 },
 {
  "id": "computer-science:1-2-3-units:fib:a499b906",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "A _____ is the smallest unit of data a computer can store, and it can only hold the value 0 or 1.",
  "blankOptions": {
   "B1": [
    "1000",
    "bit",
    "8",
    "width"
   ]
  },
  "key": {
   "blanks": {
    "B1": "bit"
   }
  }
 },
 {
  "id": "computer-science:1-2-3-units:fib:00be0d28",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "fib",
  "type": "fib",
  "marks": 2,
  "question": "A nibble is made up of _____ bits, and a byte is made up of _____ bits.",
  "blankOptions": {
   "B1": [
    "4",
    "1000",
    "characters",
    "switches"
   ],
   "B2": [
    "bits",
    "1000",
    "width",
    "8"
   ]
  },
  "key": {
   "blanks": {
    "B1": "4",
    "B2": "8"
   }
  }
 },
 {
  "id": "computer-science:1-2-3-units:fib:7a125b16",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "Computers store data in binary because they are built from millions of tiny _____ that can only be on or off.",
  "blankOptions": {
   "B1": [
    "bit depth",
    "bits",
    "switches",
    "characters"
   ]
  },
  "key": {
   "blanks": {
    "B1": "switches"
   }
  }
 },
 {
  "id": "computer-science:1-2-3-units:fib:ba4e5a54",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "Going up the unit ladder from kilobyte to petabyte, each step is _____ times bigger than the one before.",
  "blankOptions": {
   "B1": [
    "bits",
    "4",
    "1000",
    "bit"
   ]
  },
  "key": {
   "blanks": {
    "B1": "1000"
   }
  }
 },
 {
  "id": "computer-science:1-2-3-units:fib:06009749",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "The formula for a sound file's size is sample rate × duration × _____.",
  "blankOptions": {
   "B1": [
    "bits",
    "bit depth",
    "width",
    "characters"
   ]
  },
  "key": {
   "blanks": {
    "B1": "bit depth"
   }
  }
 },
 {
  "id": "computer-science:1-2-3-units:fib:005088bf",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "The formula for an image file's size is colour depth × height × _____.",
  "blankOptions": {
   "B1": [
    "1000",
    "width",
    "bit depth",
    "bit"
   ]
  },
  "key": {
   "blanks": {
    "B1": "width"
   }
  }
 },
 {
  "id": "computer-science:1-2-3-units:fib:bfc60b7e",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "The formula for a text file's size is bits per character × number of _____.",
  "blankOptions": {
   "B1": [
    "characters",
    "width",
    "bits",
    "8"
   ]
  },
  "key": {
   "blanks": {
    "B1": "characters"
   }
  }
 },
 {
  "id": "computer-science:1-2-3-units:fib:c4d34e02",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "fib",
  "type": "fib",
  "marks": 1,
  "question": "A file-size calculation should always be worked out in _____ first, then converted into the unit the question asks for.",
  "blankOptions": {
   "B1": [
    "bits",
    "characters",
    "switches",
    "bit depth"
   ]
  },
  "key": {
   "blanks": {
    "B1": "bits"
   }
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:35ed2895",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Bit”?",
  "options": [
   "8 bits, or two nibbles",
   "The total amount of data a storage device can hold",
   "1,000 kilobytes",
   "The smallest unit of data a computer can store — a single 0 or 1"
  ],
  "key": {
   "answer": 3,
   "explain": "“Bit” means: The smallest unit of data a computer can store — a single 0 or 1"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:8f8a3acb",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Nibble”?",
  "options": [
   "4 bits",
   "1,000 bytes",
   "1,000 gigabytes",
   "The number of samples taken of a sound wave each second, measured in Hz"
  ],
  "key": {
   "answer": 0,
   "explain": "“Nibble” means: 4 bits"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:abd435bd",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Byte”?",
  "options": [
   "8 bits, or two nibbles",
   "The smallest unit of data a computer can store — a single 0 or 1",
   "The number of bits used to store the value of each sound sample",
   "The number of bits used to store the colour of each pixel in an image"
  ],
  "key": {
   "answer": 0,
   "explain": "“Byte” means: 8 bits, or two nibbles"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:59ea0f0e",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Kilobyte (KB)”?",
  "options": [
   "The total amount of data a storage device can hold",
   "1,000 bytes",
   "1,000 terabytes",
   "1,000 kilobytes"
  ],
  "key": {
   "answer": 1,
   "explain": "“Kilobyte (KB)” means: 1,000 bytes"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:2792190a",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Megabyte (MB)”?",
  "options": [
   "The number of pixels that make up an image (height × width)",
   "1,000 kilobytes",
   "8 bits, or two nibbles",
   "1,000 gigabytes"
  ],
  "key": {
   "answer": 1,
   "explain": "“Megabyte (MB)” means: 1,000 kilobytes"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:b3e4b0ed",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Gigabyte (GB)”?",
  "options": [
   "1,000 gigabytes",
   "The number of pixels that make up an image (height × width)",
   "1,000 megabytes",
   "1,000 terabytes"
  ],
  "key": {
   "answer": 2,
   "explain": "“Gigabyte (GB)” means: 1,000 megabytes"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:190cabac",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Terabyte (TB)”?",
  "options": [
   "Computers are built from switches (transistors) that can only be on or off",
   "1,000 gigabytes",
   "1,000 kilobytes",
   "The number of bits used to store the colour of each pixel in an image"
  ],
  "key": {
   "answer": 1,
   "explain": "“Terabyte (TB)” means: 1,000 gigabytes"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:0f4d883a",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Petabyte (PB)”?",
  "options": [
   "Computers are built from switches (transistors) that can only be on or off",
   "The number of pixels that make up an image (height × width)",
   "The number of samples taken of a sound wave each second, measured in Hz",
   "1,000 terabytes"
  ],
  "key": {
   "answer": 3,
   "explain": "“Petabyte (PB)” means: 1,000 terabytes"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:160d6a7a",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Why data must be binary”?",
  "options": [
   "Computers are built from switches (transistors) that can only be on or off",
   "The total amount of data a storage device can hold",
   "The number of bits used to store the colour of each pixel in an image",
   "1,000 terabytes"
  ],
  "key": {
   "answer": 0,
   "explain": "“Why data must be binary” means: Computers are built from switches (transistors) that can only be on or off"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:666f54a8",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Sample rate”?",
  "options": [
   "1,000 bytes",
   "1,000 megabytes",
   "The smallest unit of data a computer can store — a single 0 or 1",
   "The number of samples taken of a sound wave each second, measured in Hz"
  ],
  "key": {
   "answer": 3,
   "explain": "“Sample rate” means: The number of samples taken of a sound wave each second, measured in Hz"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:fead2948",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Bit depth (sound)”?",
  "options": [
   "The number of bits used to store the value of each sound sample",
   "The number of samples taken of a sound wave each second, measured in Hz",
   "The total amount of data a storage device can hold",
   "The number of bits used to store the colour of each pixel in an image"
  ],
  "key": {
   "answer": 0,
   "explain": "“Bit depth (sound)” means: The number of bits used to store the value of each sound sample"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:c46f6bfa",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Colour depth”?",
  "options": [
   "1,000 terabytes",
   "1,000 bytes",
   "Computers are built from switches (transistors) that can only be on or off",
   "The number of bits used to store the colour of each pixel in an image"
  ],
  "key": {
   "answer": 3,
   "explain": "“Colour depth” means: The number of bits used to store the colour of each pixel in an image"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:15e71d48",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Resolution”?",
  "options": [
   "The number of pixels that make up an image (height × width)",
   "8 bits, or two nibbles",
   "Computers are built from switches (transistors) that can only be on or off",
   "1,000 megabytes"
  ],
  "key": {
   "answer": 0,
   "explain": "“Resolution” means: The number of pixels that make up an image (height × width)"
  }
 },
 {
  "id": "computer-science:1-2-3-units:match:ec69ae6e",
  "pageId": "computer-science:1-2-3-units",
  "pageName": "1.2.3 Units",
  "source": "match",
  "type": "mcq",
  "marks": 1,
  "question": "Which definition matches the key term “Capacity”?",
  "options": [
   "1,000 kilobytes",
   "The total amount of data a storage device can hold",
   "The smallest unit of data a computer can store — a single 0 or 1",
   "4 bits"
  ],
  "key": {
   "answer": 1,
   "explain": "“Capacity” means: The total amount of data a storage device can hold"
  }
 }
];
