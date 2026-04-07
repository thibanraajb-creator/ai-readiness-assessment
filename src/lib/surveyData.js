// ============================================================
// PEOPLElogy AI Readiness Assessment — Survey Data
// All 5 pillars with 12 scored questions + 3 qualitative each
// ============================================================

export const DEPARTMENTS = [
  'Sales & Business Development',
  'Product & Technology',
  'Marketing',
  'Operations',
  'Finance & Admin',
  'HR & People',
  'Leadership / C-Suite',
  'L&D / Delivery',
  'Project Management',
  'Branding',
  'Acquisition',
  'Corporate Strategy',
  'Digital Team',
]

// Maturity level definitions
export const MATURITY_LEVELS = {
  1: {
    label: 'Level 1: Awareness',
    description:
      'Your organisation is beginning to explore AI concepts. Leadership is aware of AI but formal strategy, data infrastructure, and skilled talent are largely absent. The journey starts here — building foundational understanding is the critical first step.',
    color: '#EF4444',
    range: '0–20%',
  },
  2: {
    label: 'Level 2: Exploration',
    description:
      'Your organisation is actively exploring AI possibilities. Some initiatives or pilot projects may be underway, but adoption is fragmented and lacks systematic coordination. Focus on consolidating data assets, formalising strategy, and building cross-functional awareness.',
    color: '#F97316',
    range: '21–40%',
  },
  3: {
    label: 'Level 3: Operational',
    description:
      'AI is being operationalised in pockets of your organisation. You have functional data infrastructure, some trained talent, and defined use cases. The priority now is scaling successful pilots, integrating AI into core workflows, and establishing robust governance.',
    color: '#EAB308',
    range: '41–60%',
  },
  4: {
    label: 'Level 4: Integrated',
    description:
      'AI is embedded across multiple business functions with clear governance and measurable outcomes. Your organisation demonstrates strong data maturity, skilled workforce capabilities, and strategic alignment. Continue expanding AI use cases and building enterprise-wide AI culture.',
    color: '#22C55E',
    range: '61–80%',
  },
  5: {
    label: 'Level 5: AI-Driven Enterprise',
    description:
      'Congratulations — your organisation operates as a leading AI-Driven Enterprise. AI is central to your competitive strategy, deeply integrated into operations, and governed by robust ethical frameworks. Focus on innovation, responsible AI leadership, and sustaining your competitive advantage.',
    color: '#00ADA9',
    range: '81–100%',
  },
}

// Compute maturity level from overall percentage score
export function getMaturityLevel(pct) {
  if (pct <= 20) return 1
  if (pct <= 40) return 2
  if (pct <= 60) return 3
  if (pct <= 80) return 4
  return 5
}

// Compute pillar percentage from raw score (max 60)
export function pillarPct(score) {
  return Math.round((score / 60) * 100)
}

// Compute overall score from 5 pillar scores
export function computeOverallScore(pillarScores) {
  const pcts = pillarScores.map(pillarPct)
  const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length
  return Math.round(avg)
}

// ============================================================
// PILLAR DEFINITIONS
// ============================================================
export const PILLARS = [
  // ── PILLAR 1 ──────────────────────────────────────────────
  {
    id: 1,
    key: 'strategy',
    name: 'Strategy & Leadership',
    description:
      "Assesses how well AI is embedded into your organisation's strategic direction, leadership commitment, resource allocation, and formal planning.",
    color: '#00ADA9',
    questions: [
      'Our organisation has a clearly defined AI strategy aligned with overall business objectives.',
      'AI is recognised by leadership as a key driver of innovation and competitive advantage.',
      'AI initiatives are aligned with the organisation\'s digital transformation strategy.',
      'Senior leadership actively champions AI adoption within the organisation.',
      'There is a designated executive sponsor or AI champion responsible for driving AI initiatives.',
      'Leadership regularly discusses AI opportunities during strategic planning or management meetings.',
      'The organisation has allocated budget or funding specifically for AI initiatives.',
      'Resources are available to support AI experimentation and pilot projects.',
      'The organisation is willing to invest in AI talent, training, and infrastructure.',
      'The organisation has a formal roadmap or plan for AI adoption over the next 2–3 years.',
      'AI initiatives have clear milestones and success metrics.',
      'There is a process for prioritising AI opportunities based on business impact.',
    ],
    qualitative: [
      'What are the top three business challenges where AI could provide value?',
      'What are the biggest barriers preventing AI adoption in your organisation?',
      "What is the organisation's expected timeline for AI adoption?",
    ],
  },

  // ── PILLAR 2 ──────────────────────────────────────────────
  {
    id: 2,
    key: 'data',
    name: 'Data & Technology Infrastructure',
    description:
      'Evaluates the quality, accessibility, and governance of your data assets, and the readiness of your technology infrastructure to support AI workloads.',
    color: '#1B3A5C',
    questions: [
      "Most of our organisation's operational and business data is digitised and stored in electronic systems.",
      'Relevant business data is accessible across departments when needed.',
      'The organisation maintains historical datasets that can be used for analytics and AI modelling.',
      'Data used within the organisation is accurate, consistent, and well maintained.',
      'There are defined processes for data cleaning, validation, and management.',
      'The organisation maintains a centralised data repository or data warehouse.',
      'The organisation has formal policies governing data usage, ownership, and access.',
      'Data security and privacy practices are implemented to protect sensitive information.',
      'There are defined roles such as data stewards or data governance teams responsible for managing data assets.',
      'The organisation uses modern IT infrastructure such as cloud platforms or scalable computing environments.',
      'Systems such as ERP, CRM, and operational platforms are digitally integrated and capable of sharing data.',
      'The organisation has the computing capability required for advanced analytics or AI workloads.',
    ],
    qualitative: [
      'What are the primary sources of business data in your organisation?',
      'What are the biggest challenges in managing data within your organisation?',
      "How would you describe your organisation's current analytics capability?",
    ],
  },

  // ── PILLAR 3 ──────────────────────────────────────────────
  {
    id: 3,
    key: 'people',
    name: 'People & Workforce Skills',
    description:
      "Measures your workforce's AI literacy, the availability of specialist AI talent, and your organisation's commitment to continuous digital skills development.",
    color: '#7C3AED',
    questions: [
      'Employees in the organisation have a basic understanding of AI and its potential business impact.',
      'Leadership and management understand how AI can transform business operations.',
      'The organisation promotes awareness of emerging technologies such as AI, automation, and data analytics.',
      'Employees are trained to use AI-powered productivity tools such as AI assistants and generative AI tools.',
      'Managers are able to identify opportunities where AI can improve processes or decision-making.',
      'Staff are encouraged to experiment with data-driven decision-making and analytics tools.',
      'The organisation employs or has access to data scientists, machine learning engineers, or AI specialists.',
      'The IT or technical team possesses skills in data engineering, analytics, or machine learning development.',
      'The organisation has the capability to develop, customise, or deploy AI solutions internally or with partners.',
      'The organisation provides structured AI training or digital skills development programs.',
      'Employees are given opportunities to upgrade their skills in data analytics, AI, or emerging technologies.',
      'The organisation encourages continuous learning and professional development in digital technologies.',
    ],
    qualitative: [
      'Which workforce group in your organisation requires the most AI training?',
      'What are the biggest challenges in developing AI capabilities in your organisation?',
      'Which AI skill areas are most important for your organisation?',
    ],
  },

  // ── PILLAR 4 ──────────────────────────────────────────────
  {
    id: 4,
    key: 'processes',
    name: 'Processes & AI Use Cases',
    description:
      'Examines the degree to which business processes are digitised, AI use cases have been identified and piloted, and AI solutions are successfully integrated into operations.',
    color: '#059669',
    questions: [
      "Most of our organisation's core business processes are digitised and supported by digital systems.",
      'Business workflows are documented and clearly defined.',
      'The organisation has implemented process automation or digital workflow systems.',
      'The organisation has identified specific business areas where AI could improve efficiency or decision-making.',
      'Departments are encouraged to propose AI or automation initiatives.',
      'The organisation has a process to evaluate and prioritise AI use cases based on business value.',
      'The organisation has conducted AI or advanced analytics pilot projects.',
      'AI initiatives are tested through proof-of-concept or prototype development.',
      'Successful AI pilots are scaled into operational systems.',
      'AI solutions are integrated with existing enterprise systems such as ERP, CRM, or operational platforms.',
      'AI insights are used to support operational decision-making.',
      'AI tools are embedded into daily workflows or business applications.',
    ],
    qualitative: [
      'Which departments in your organisation could benefit most from AI?',
      'Which processes are currently most time-consuming or inefficient?',
      'Which AI capabilities would create the most value for your organisation?',
    ],
  },

  // ── PILLAR 5 ──────────────────────────────────────────────
  {
    id: 5,
    key: 'governance',
    name: 'Governance, Risk & Responsible AI',
    description:
      'Assesses your governance structures, regulatory compliance posture, risk management processes, and commitment to ethical, transparent AI deployment.',
    color: '#DC2626',
    questions: [
      'The organisation has a defined governance structure overseeing AI initiatives.',
      'There is a designated team, committee, or responsible officer for AI governance.',
      'AI initiatives follow approved organisational policies or guidelines.',
      'The organisation complies with data protection regulations and privacy laws.',
      'Sensitive data used in AI systems is securely managed and protected.',
      'Access to data used for AI development is controlled and monitored.',
      'The organisation has processes to assess risks associated with AI systems.',
      'AI models are tested to ensure accuracy, reliability, and robustness.',
      'There are procedures to manage potential failures or unintended consequences of AI systems.',
      'The organisation considers ethical implications when deploying AI systems.',
      'AI models are evaluated to detect and mitigate bias or unfair outcomes.',
      'AI decisions are designed to be transparent and explainable where appropriate.',
    ],
    qualitative: [
      'What are the biggest concerns regarding AI adoption in your organisation?',
      'Which regulations or policies affect AI adoption in your organisation?',
      'What measures are currently in place to ensure responsible use of AI?',
    ],
  },
]
