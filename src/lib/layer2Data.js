// Layer 2 — Individual AI Capability Assessment data definitions

// Capability levels in ascending order
export const CAPABILITY_LABELS = [
  { label: 'AI Beginner',      color: '#E24B4A', min: 1.0, max: 1.75 },
  { label: 'AI Explorer',      color: '#EF9F27', min: 1.75, max: 2.5  },
  { label: 'AI Practitioner',  color: '#1B3A5C', min: 2.5,  max: 3.25 },
  { label: 'AI Integrator',    color: '#00ADA9', min: 3.25, max: 3.75 },
  { label: 'AI Champion',      color: '#3B6D11', min: 3.75, max: 4.0  },
]

// Cluster labels A–E
export const CLUSTER_LABELS = {
  A: 'Leadership & Strategy',
  B: 'Data & Analytics',
  C: 'Operations & Process',
  D: 'People & Culture',
  E: 'Technology & Innovation',
}

// Dimension definitions (5 scored dimensions)
export const DIMENSIONS = [
  { key: 'd1_awareness',            label: 'AI Awareness',         short: 'Awareness'    },
  { key: 'd2_tool_use',             label: 'Tool Proficiency',     short: 'Tool Use'     },
  { key: 'd3_prompt_ability',       label: 'Prompt Ability',       short: 'Prompt'       },
  { key: 'd4_opportunity_spotting', label: 'Opportunity Spotting', short: 'Opportunity'  },
  { key: 'd5_workflow_integration', label: 'Workflow Integration', short: 'Workflow'     },
]

// Derive a capability label from an overall score (1–4 scale)
export function getCapabilityLabel(score) {
  const last = CAPABILITY_LABELS.length - 1
  for (let i = 0; i <= last; i++) {
    const { min, max } = CAPABILITY_LABELS[i]
    if (score >= min && (i === last ? score <= max : score < max)) {
      return CAPABILITY_LABELS[i].label
    }
  }
  return CAPABILITY_LABELS[0].label
}
