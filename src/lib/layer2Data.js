// PEOPLElogy — Layer 2: Individual AI Capability Assessment Data
// Cluster routing, questions per cluster, scoring logic

// ── Department → Cluster mapping ─────────────────────────────
export const CLUSTER_MAP = {
  "Corporate Strategy": "A",
  "International": "A",
  "Partnerships": "A",
  "HR": "A",
  "Finance & Accounting": "A",
  "Sales": "B",
  "Project Management / CS / Sales Ops": "B",
  "Discovery": "B",
  "Community": "B",
  "Marketing": "C",
  "Branding": "C",
  "Digital Team": "C",
  "Digital (Main)": "C",
  "Technology": "D",
  "Product & Innovation": "D",
  "Development": "D",
  "Training Team": "E",
  "Other": "E",
}

export const CLUSTER_LABELS = {
  A: "Leaders & Strategy",
  B: "Commercial & Client",
  C: "Creative & Marketing",
  D: "Technical & Delivery",
  E: "L&D & People",
}

export function getCluster(department) {
  return CLUSTER_MAP[department] || "E"
}

// ── Capability labels based on overall score ─────────────────
export const CAPABILITY_LABELS = [
  { min: 1.0, max: 1.5, label: 'AI Beginner',     color: '#EF4444' },
  { min: 1.5, max: 2.5, label: 'AI Explorer',     color: '#F97316' },
  { min: 2.5, max: 3.2, label: 'AI Practitioner', color: '#EAB308' },
  { min: 3.2, max: 3.7, label: 'AI Integrator',   color: '#22C55E' },
  { min: 3.7, max: 4.0, label: 'AI Champion',     color: '#00ADA9' },
]

export function getCapabilityLabel(score) {
  const s = Math.max(1, Math.min(4, score))
  // Boundaries belong to the upper tier (e.g. 1.5 → Explorer, not Beginner)
  // Use s >= min && s < max, except the final tier which uses s <= max
  for (let i = 0; i < CAPABILITY_LABELS.length; i++) {
    const c = CAPABILITY_LABELS[i]
    const isLast = i === CAPABILITY_LABELS.length - 1
    if (s >= c.min && (isLast ? s <= c.max : s < c.max)) return c.label
  }
  return 'AI Beginner'
}

export function getCapabilityColor(score) {
  const s = Math.max(1, Math.min(4, score))
  // Boundaries belong to the upper tier (e.g. 1.5 → Explorer, not Beginner)
  for (let i = 0; i < CAPABILITY_LABELS.length; i++) {
    const c = CAPABILITY_LABELS[i]
    const isLast = i === CAPABILITY_LABELS.length - 1
    if (s >= c.min && (isLast ? s <= c.max : s < c.max)) return c.color
  }
  return '#EF4444'
}

// ── Dimension definitions ────────────────────────────────────
export const DIMENSIONS = {
  D1: 'Awareness',
  D2: 'Tool Use',
  D3: 'Prompt Ability',
  D4: 'Opportunity Spotting',
  D5: 'Workflow Integration',
}

export const LEARNING_FOCUS = {
  D1: 'AI fundamentals and tool awareness',
  D2: 'Daily AI tool habit building',
  D3: 'Prompt engineering skills',
  D4: 'AI opportunity identification in your role',
  D5: 'Workflow automation and redesign',
}

// ── Cluster A Questions (Leaders & Strategy) ─────────────────
const CLUSTER_A = [
  {
    id: 1, dimension: 'D1', type: 'single_select',
    text: 'When a team member suggests using AI for a new task, how do you typically respond?',
    options: [
      { text: 'Approve without needing context', score: 2 },
      { text: 'Ask for the use case and data classification first', score: 4 },
      { text: 'I am usually unsure what to do', score: 1 },
      { text: 'I usually decline until there is a formal process', score: 1 },
    ],
  },
  {
    id: 2, dimension: 'D2', type: 'single_select',
    text: 'In the past month, how often have you personally used an AI tool (Claude, Copilot, ChatGPT) in your work?',
    options: [
      { text: 'Never', score: 1 },
      { text: '1 to 2 times', score: 2 },
      { text: 'Weekly', score: 3 },
      { text: 'Daily', score: 4 },
    ],
  },
  {
    id: 3, dimension: 'D3', type: 'single_select',
    text: 'When you use an AI tool, how do you usually interact with it?',
    options: [
      { text: 'I type short one-line questions', score: 1 },
      { text: 'I give detailed context and instructions', score: 4 },
      { text: 'I copy prompts from others', score: 2 },
      { text: 'I have not used one yet', score: 1 },
    ],
  },
  {
    id: 4, dimension: 'D4', type: 'single_select',
    text: 'Think of your biggest time drain this week. Could AI have helped reduce it?',
    options: [
      { text: 'Yes, I know exactly how', score: 4 },
      { text: 'Possibly, but I am unsure how', score: 2 },
      { text: 'I do not think so', score: 1 },
      { text: 'I have not thought about it', score: 1 },
    ],
  },
  {
    id: 5, dimension: 'D4', type: 'multi_select',
    text: 'A department head asks you to approve an AI pilot. What do you need before deciding? (select all that apply)',
    options: [
      { text: 'ROI estimate' },
      { text: 'Data security review' },
      { text: 'Tool compliance check' },
      { text: 'Team training plan' },
      { text: 'I would approve immediately' },
    ],
    scoreLogic: 'approve_pilot',
  },
  {
    id: 6, dimension: 'D1', type: 'single_select',
    text: "Are you aware of PEOPLElogy's AI Governance Policy published this year?",
    options: [
      { text: 'Yes, I have read it', score: 4 },
      { text: 'I know it exists but have not read it', score: 2 },
      { text: 'I have not seen it', score: 1 },
      { text: 'I did not know we had one', score: 1 },
    ],
  },
  {
    id: 7, dimension: 'D5', type: 'single_select',
    text: 'Have you personally changed how you do any part of your job because of AI in the last 3 months?',
    options: [
      { text: 'Yes, significantly', score: 4 },
      { text: 'Yes, small changes', score: 3 },
      { text: 'Not yet but planning to', score: 2 },
      { text: 'No', score: 1 },
    ],
  },
  {
    id: 8, dimension: 'D2', type: 'multi_select',
    text: 'Which AI tools have you personally used for work in the last month? (select all that apply)',
    options: [
      { text: 'Claude' }, { text: 'ChatGPT' }, { text: 'Copilot' },
      { text: 'Adobe AI' }, { text: 'None' }, { text: 'Other' },
    ],
    scoreLogic: 'tools_count',
  },
  {
    id: 9, dimension: 'D4', type: 'single_select',
    text: 'Your team spends 3 hours weekly compiling a report manually. What is your next step?',
    options: [
      { text: 'Ask IT to investigate AI options', score: 3 },
      { text: 'Try it myself first', score: 4 },
      { text: 'Raise it in the next team meeting', score: 2 },
      { text: 'Wait for a formal process', score: 1 },
    ],
  },
  {
    id: 10, dimension: 'D5', type: 'single_select',
    text: 'How confident are you explaining to your team what AI should and should not be used for at PEOPLElogy?',
    options: [
      { text: 'Very confident', score: 4 },
      { text: 'Somewhat confident', score: 3 },
      { text: 'Not very confident', score: 2 },
      { text: 'Not at all confident', score: 1 },
    ],
  },
]

// ── Cluster B Questions (Commercial & Client) ────────────────
const CLUSTER_B = [
  {
    id: 1, dimension: 'D2', type: 'single_select',
    text: 'When writing a client proposal or email, do you use AI to help draft, structure or refine it?',
    options: [
      { text: 'Always', score: 4 }, { text: 'Sometimes', score: 3 },
      { text: 'Rarely', score: 2 }, { text: 'Never tried it', score: 1 },
    ],
  },
  {
    id: 2, dimension: 'D3', type: 'single_select',
    text: 'You need to write a proposal for a new client in an unfamiliar industry. How do you use AI?',
    options: [
      { text: 'Ask Claude to write it from scratch without context', score: 2 },
      { text: 'Give Claude context, structure and constraints, then refine', score: 4 },
      { text: 'Use AI for research only, write manually', score: 2 },
      { text: 'I do not use AI for this', score: 1 },
    ],
  },
  {
    id: 3, dimension: 'D1', type: 'single_select',
    text: 'A client asks if PEOPLElogy uses AI to generate proposal content. How do you respond?',
    options: [
      { text: 'Deny it', score: 1 },
      { text: 'Confirm it and explain our governance process', score: 4 },
      { text: 'I am unsure what to say', score: 1 },
      { text: 'Change the topic', score: 1 },
    ],
  },
  {
    id: 4, dimension: 'D2', type: 'single_select',
    text: 'How often do you use AI for research or gathering background on clients or industries?',
    options: [
      { text: 'Daily', score: 4 }, { text: 'Weekly', score: 3 },
      { text: 'Occasionally', score: 2 }, { text: 'Never', score: 1 },
    ],
  },
  {
    id: 5, dimension: 'D5', type: 'multi_select',
    text: 'Which of these have you actually done using AI in the past month? (select all that apply)',
    options: [
      { text: 'Drafted a proposal' }, { text: 'Summarised a meeting' },
      { text: 'Researched a client' }, { text: 'Created a report' },
      { text: 'Replied to a client email' }, { text: 'None' },
    ],
    scoreLogic: 'b_tasks_done',
  },
  {
    id: 6, dimension: 'D3', type: 'single_select',
    text: 'You paste a client brief into Claude and get a generic unhelpful response. What do you do?',
    options: [
      { text: 'Give up and write manually', score: 1 },
      { text: 'Refine the prompt with more specific context', score: 4 },
      { text: 'Try a different tool', score: 2 },
      { text: 'Ask a colleague to do it', score: 1 },
    ],
  },
  {
    id: 7, dimension: 'D4', type: 'open_text',
    text: 'Which of your current weekly tasks do you think AI could reduce the most time on?',
    defaultScore: 3,
  },
  {
    id: 8, dimension: 'D1', type: 'single_select',
    text: 'You receive an AI-generated summary of a client call. How much do you trust it without reviewing the original?',
    options: [
      { text: 'Fully trust it and send immediately', score: 1 },
      { text: 'Trust it but verify the key points', score: 4 },
      { text: 'Review everything before using', score: 3 },
      { text: 'I would not use AI for this', score: 2 },
    ],
  },
  {
    id: 9, dimension: 'D2', type: 'single_select',
    text: 'How comfortable are you using Copilot inside Microsoft 365 (Word, Outlook, Teams)?',
    options: [
      { text: 'Very comfortable, use it daily', score: 4 },
      { text: 'Some experience', score: 3 },
      { text: 'Tried it once or twice', score: 2 },
      { text: 'Never used it', score: 1 },
    ],
  },
  {
    id: 10, dimension: 'D5', type: 'single_select',
    text: 'Estimate how many hours per week you save by using AI tools in your current role.',
    options: [
      { text: '0 hours', score: 1 }, { text: 'Less than 1 hour', score: 2 },
      { text: '1 to 3 hours', score: 3 }, { text: 'More than 3 hours', score: 4 },
    ],
  },
]

// ── Cluster C Questions (Creative & Marketing) ───────────────
const CLUSTER_C = [
  {
    id: 1, dimension: 'D2', type: 'multi_select',
    text: 'Which AI tools do you currently use for creative or marketing work? (select all that apply)',
    options: [
      { text: 'Claude' }, { text: 'ChatGPT' }, { text: 'Adobe Firefly' },
      { text: 'Canva AI' }, { text: 'Copilot' }, { text: 'None' }, { text: 'Other' },
    ],
    scoreLogic: 'tools_count',
  },
  {
    id: 2, dimension: 'D3', type: 'single_select',
    text: 'You need 10 LinkedIn posts for the month. How do you use AI to produce them efficiently?',
    options: [
      { text: 'Generate all 10 and post directly without editing', score: 2 },
      { text: 'Generate drafts with brand context, edit each one', score: 4 },
      { text: 'Use AI for ideas only, write manually', score: 2 },
      { text: 'I do not use AI for this', score: 1 },
    ],
  },
  {
    id: 3, dimension: 'D5', type: 'single_select',
    text: 'Has AI changed how you produce content in the last 3 months?',
    options: [
      { text: 'Yes, significantly faster and better quality', score: 4 },
      { text: 'Yes, some improvement', score: 3 },
      { text: 'Minimal change', score: 2 },
      { text: 'Not yet', score: 1 },
    ],
  },
  {
    id: 4, dimension: 'D1', type: 'single_select',
    text: 'AI-generated content goes out and receives criticism for being generic. What went wrong?',
    options: [
      { text: 'The prompt lacked brand voice and audience context', score: 4 },
      { text: 'AI is not good enough for creative work yet', score: 1 },
      { text: 'The reviewer should have caught it before publishing', score: 2 },
      { text: 'AI-generated content is always generic', score: 1 },
    ],
  },
  {
    id: 5, dimension: 'D3', type: 'single_select',
    text: "When prompting AI for creative content, how do you ensure it matches PEOPLElogy's brand voice?",
    options: [
      { text: 'I include brand guidelines and tone examples in the prompt', score: 4 },
      { text: 'I edit the output to match tone after generating', score: 3 },
      { text: 'I do not, I adjust manually after', score: 2 },
      { text: 'I am not sure how to do this', score: 1 },
    ],
  },
  {
    id: 6, dimension: 'D4', type: 'multi_select',
    text: 'Which tasks in your role take the most time but could be AI-assisted? (select top 2)',
    options: [
      { text: 'Writing copy' }, { text: 'Creating visuals' },
      { text: 'Monthly reporting' }, { text: 'Campaign planning' },
      { text: 'Social media scheduling' }, { text: 'Email drafting' },
    ],
    scoreLogic: 'c_tasks_top2',
  },
  {
    id: 7, dimension: 'D2', type: 'single_select',
    text: 'How often do you use Adobe AI (Firefly or Generative Fill) in your design or content work?',
    options: [
      { text: 'Daily', score: 4 }, { text: 'Weekly', score: 3 },
      { text: 'Occasionally', score: 2 }, { text: 'Never used it', score: 1 },
    ],
  },
  {
    id: 8, dimension: 'D5', type: 'open_text',
    text: "Describe the last time you used AI to complete a creative task faster than you could manually. Type 'not yet' if you have not.",
    defaultScore: 3,
    specialScoring: 'c_open_text',
  },
  {
    id: 9, dimension: 'D1', type: 'single_select',
    text: 'You are about to use AI to generate an image for a client-facing campaign. What do you check first?',
    options: [
      { text: 'Copyright status and data classification', score: 4 },
      { text: 'Whether the prompt quality is good', score: 3 },
      { text: 'Client approval', score: 2 },
      { text: 'Nothing, I just use it', score: 1 },
    ],
  },
  {
    id: 10, dimension: 'D4', type: 'single_select',
    text: 'If you had an AI tool that auto-generates your monthly social media calendar from a brief, how would you use it?',
    options: [
      { text: 'Use it directly as the final calendar', score: 2 },
      { text: 'Use it as a strong starting draft to refine', score: 4 },
      { text: 'Use it only for initial ideas', score: 3 },
      { text: 'I would not trust it', score: 1 },
    ],
  },
]

// ── Cluster D Questions (Technical & Delivery) ───────────────
const CLUSTER_D = [
  {
    id: 1, dimension: 'D2', type: 'multi_select',
    text: 'Which AI-assisted tools have you used in the past month? (select all that apply)',
    options: [
      { text: 'Claude' }, { text: 'GitHub Copilot' }, { text: 'ChatGPT' },
      { text: 'Cursor' }, { text: 'Notion AI' }, { text: 'n8n or Make' },
      { text: 'None' }, { text: 'Other' },
    ],
    scoreLogic: 'tools_count',
  },
  {
    id: 2, dimension: 'D5', type: 'single_select',
    text: 'Have you built, automated or meaningfully improved any workflow using AI in the last 3 months?',
    options: [
      { text: 'Yes, multiple workflows', score: 4 },
      { text: 'Yes, one workflow', score: 3 },
      { text: 'In progress', score: 2 },
      { text: 'Not yet', score: 1 },
    ],
  },
  {
    id: 3, dimension: 'D3', type: 'single_select',
    text: 'When using Claude for technical tasks (code, architecture, docs), how do you structure your prompt?',
    options: [
      { text: 'I include role, context, constraints and output format', score: 4 },
      { text: 'I describe what I want in plain language', score: 2 },
      { text: 'I paste code and ask it to fix without context', score: 1 },
      { text: 'I do not use AI for technical work', score: 1 },
    ],
  },
  {
    id: 4, dimension: 'D4', type: 'open_text',
    text: 'Which engineering or product task in your role is most repetitive and could be automated with AI?',
    defaultScore: 3,
  },
  {
    id: 5, dimension: 'D1', type: 'single_select',
    text: 'A stakeholder asks you to add AI to an existing product feature. What is your first question?',
    options: [
      { text: 'What specific problem are we solving with AI?', score: 4 },
      { text: 'What is the budget?', score: 2 },
      { text: 'Which AI tool should we use?', score: 2 },
      { text: 'I would start building a prototype immediately', score: 3 },
    ],
  },
  {
    id: 6, dimension: 'D5', type: 'single_select',
    text: 'How comfortable are you integrating an AI API (Claude or OpenAI) into a product or internal tool?',
    options: [
      { text: 'Very comfortable, I have done it before', score: 4 },
      { text: 'Some experience, could do it with reference', score: 3 },
      { text: 'I would need significant guidance', score: 2 },
      { text: 'No experience at all', score: 1 },
    ],
  },
  {
    id: 7, dimension: 'D3', type: 'single_select',
    text: 'You need Claude to produce structured JSON output from unstructured text. Can you write a prompt that reliably does this?',
    options: [
      { text: 'Yes, confidently', score: 4 },
      { text: 'I would attempt it with some trial and error', score: 3 },
      { text: 'I am not sure how to approach this', score: 2 },
      { text: 'No', score: 1 },
    ],
  },
  {
    id: 8, dimension: 'D2', type: 'single_select',
    text: 'How often do you use AI to assist with documentation, specs or technical writing?',
    options: [
      { text: 'Daily', score: 4 }, { text: 'Weekly', score: 3 },
      { text: 'Occasionally', score: 2 }, { text: 'Never', score: 1 },
    ],
  },
  {
    id: 9, dimension: 'D4', type: 'single_select',
    text: 'You are scoping a new internal tool. At what stage do you consider AI capabilities?',
    options: [
      { text: 'From the very start, it is a default consideration', score: 4 },
      { text: 'During design phase if it seems to fit', score: 3 },
      { text: 'Only if a stakeholder requests it', score: 2 },
      { text: 'I have not built with AI yet', score: 1 },
    ],
  },
  {
    id: 10, dimension: 'D1', type: 'single_select',
    text: 'A junior developer asks if they can use ChatGPT to write production code. What is your response?',
    options: [
      { text: 'Yes, with mandatory code review', score: 4 },
      { text: 'Yes, without restriction', score: 1 },
      { text: 'No, it is a security risk', score: 2 },
      { text: 'It depends on the data classification of the codebase', score: 4 },
    ],
  },
]

// ── Cluster E Questions (L&D & People) ──────────────────────
const CLUSTER_E = [
  {
    id: 1, dimension: 'D2', type: 'single_select',
    text: 'Do you use AI to help design, write or improve training content or facilitation materials?',
    options: [
      { text: 'Yes, regularly', score: 4 }, { text: 'Occasionally', score: 3 },
      { text: 'Tried it once', score: 2 }, { text: 'Never', score: 1 },
    ],
  },
  {
    id: 2, dimension: 'D3', type: 'single_select',
    text: 'You need to create a session plan for a leadership workshop. How do you use AI to speed this up?',
    options: [
      { text: 'Ask Claude to generate a full session plan with no context', score: 2 },
      { text: 'Give Claude the module objectives, audience and format, then refine', score: 4 },
      { text: 'Use AI for activity ideas only, write the plan manually', score: 2 },
      { text: 'I do not use AI for session planning', score: 1 },
    ],
  },
  {
    id: 3, dimension: 'D4', type: 'multi_select',
    text: 'Which part of your L&D role could AI most meaningfully improve? (select all that apply)',
    options: [
      { text: 'Content writing' }, { text: 'Assessment design' },
      { text: 'Participant communication' }, { text: 'Post-programme reports' },
      { text: 'Facilitation prep' }, { text: 'None' },
    ],
    scoreLogic: 'tools_count',
  },
  {
    id: 4, dimension: 'D1', type: 'single_select',
    text: 'A participant asks during a workshop whether AI will replace their job. How confident are you answering this clearly?',
    options: [
      { text: 'Very confident, I have a clear and balanced answer', score: 4 },
      { text: 'Somewhat confident', score: 3 },
      { text: 'Not very confident', score: 2 },
      { text: 'Not at all confident', score: 1 },
    ],
  },
  {
    id: 5, dimension: 'D5', type: 'single_select',
    text: 'Have you used AI to generate or improve a post-programme evaluation or report in the last 3 months?',
    options: [
      { text: 'Yes', score: 4 },
      { text: 'No but I am planning to', score: 2 },
      { text: 'No', score: 1 },
      { text: 'I did not know I could do this', score: 1 },
    ],
  },
  {
    id: 6, dimension: 'D3', type: 'single_select',
    text: 'You want Claude to write 5 scenario-based assessment questions for a leadership module. What do you include in your prompt?',
    options: [
      { text: 'Module topic, learning objectives, target audience and desired format', score: 4 },
      { text: 'Just the module topic', score: 2 },
      { text: 'The full module content without structure', score: 2 },
      { text: 'I would not know what to include', score: 1 },
    ],
  },
  {
    id: 7, dimension: 'D2', type: 'single_select',
    text: 'Have you used Copilot in Word or PowerPoint to speed up building training decks or proposals?',
    options: [
      { text: 'Yes, regularly', score: 4 },
      { text: 'Tried it a few times', score: 3 },
      { text: 'I know it exists but have not tried it', score: 2 },
      { text: 'I was not aware of this feature', score: 1 },
    ],
  },
  {
    id: 8, dimension: 'D4', type: 'single_select',
    text: 'How much of your content writing (module guides, facilitator notes, workbooks) could realistically be first-drafted by AI?',
    options: [
      { text: 'Most of it, AI handles first drafts well', score: 4 },
      { text: 'About half', score: 3 },
      { text: 'A small portion only', score: 2 },
      { text: 'None, it needs to be fully human-written', score: 1 },
    ],
  },
  {
    id: 9, dimension: 'D1', type: 'single_select',
    text: 'A client asks whether their programme content was AI-generated. What is the right response?',
    options: [
      { text: 'Be transparent and explain our AI-assisted process and governance', score: 4 },
      { text: 'Avoid confirming or denying', score: 1 },
      { text: 'Say no', score: 1 },
      { text: 'It depends on the client relationship', score: 2 },
    ],
  },
  {
    id: 10, dimension: 'D5', type: 'open_text',
    text: 'If you had 1 hour per week dedicated to learning AI tools for your L&D role, what would you focus on first?',
    defaultScore: 3,
  },
]

// ── Master questions map ──────────────────────────────────────
export const CLUSTER_QUESTIONS = { A: CLUSTER_A, B: CLUSTER_B, C: CLUSTER_C, D: CLUSTER_D, E: CLUSTER_E }

// ── Multi-select scoring ──────────────────────────────────────
export function scoreMultiSelect(selected, question) {
  const logic = question.scoreLogic
  const noneText = 'None'
  const hasNone = selected.includes(noneText)

  if (logic === 'tools_count') {
    const real = selected.filter(s => s !== noneText && s !== 'Other')
    if (hasNone || real.length === 0) return 1
    if (real.length === 1) return 2
    if (real.length === 2) return 3
    return 4
  }
  if (logic === 'approve_pilot') {
    if (selected.includes('I would approve immediately')) return 1
    const valid = ['ROI estimate','Data security review','Tool compliance check','Team training plan']
    const count = selected.filter(s => valid.includes(s)).length
    if (count >= 3) return 4
    if (count === 2) return 3
    if (count === 1) return 2
    return 1
  }
  if (logic === 'b_tasks_done') {
    if (hasNone || selected.length === 0) return 1
    if (selected.length === 1) return 2
    if (selected.length <= 3) return 3
    return 4
  }
  if (logic === 'c_tasks_top2') {
    if (selected.length === 0) return 1
    if (selected.length === 1) return 2
    return 4
  }
  // fallback: tools_count style
  if (hasNone || selected.length === 0) return 1
  if (selected.length === 1) return 2
  if (selected.length === 2) return 3
  return 4
}

// ── Open-text scoring ─────────────────────────────────────────
export function scoreOpenText(text, questionId, cluster) {
  const t = (text || '').trim().toLowerCase()
  // Cluster C Q8: specific scoring
  if (cluster === 'C' && questionId === 8) {
    if (!t || t === 'not yet') return 1
    if (t.length > 20) return 4
    return 3
  }
  // All others: default score (shows awareness)
  return 3
}

// ── Compute Layer 2 scores ────────────────────────────────────
export function computeLayer2Scores(answers, questions, cluster) {
  const rawScores = questions.map((q, i) => {
    const ans = answers[i]
    if (q.type === 'single_select') {
      const idx = typeof ans === 'number' ? ans : -1
      return q.options?.[idx]?.score ?? 1
    }
    if (q.type === 'multi_select') {
      const sel = Array.isArray(ans) ? ans : []
      return scoreMultiSelect(sel, q)
    }
    if (q.type === 'open_text') {
      return scoreOpenText(ans, q.id, cluster)
    }
    return 1
  })

  // Group scores by dimension
  const dimScores = { D1: [], D2: [], D3: [], D4: [], D5: [] }
  questions.forEach((q, i) => {
    if (dimScores[q.dimension]) dimScores[q.dimension].push(rawScores[i])
  })

  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 1

  const d1 = avg(dimScores.D1)
  const d2 = avg(dimScores.D2)
  const d3 = avg(dimScores.D3)
  const d4 = avg(dimScores.D4)
  const d5 = avg(dimScores.D5)

  const dimAvgs = { D1: d1, D2: d2, D3: d3, D4: d4, D5: d5 }
  const overall = avg([d1, d2, d3, d4, d5])

  // Find lowest and second-lowest dimensions
  const sorted = Object.entries(dimAvgs).sort((a, b) => a[1] - b[1])
  const learningFocus = LEARNING_FOCUS[sorted[0][0]]
  const secondaryFocus = LEARNING_FOCUS[sorted[1][0]]

  return {
    d1: Math.round(d1 * 100) / 100,
    d2: Math.round(d2 * 100) / 100,
    d3: Math.round(d3 * 100) / 100,
    d4: Math.round(d4 * 100) / 100,
    d5: Math.round(d5 * 100) / 100,
    overall: Math.round(overall * 100) / 100,
    capabilityLabel: getCapabilityLabel(overall),
    capabilityColor: getCapabilityColor(overall),
    learningFocus,
    secondaryFocus,
    lowestDim: sorted[0][0],
    rawScores,
    // Overall as percentage (score/4 * 100)
    overallPct: Math.round((overall / 4) * 100),
  }
}
