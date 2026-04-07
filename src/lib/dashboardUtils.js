// Shared utilities for Dashboard and Admin pages
import { supabase } from './supabase'
import { DEPARTMENTS, PILLARS, getMaturityLevel, pillarPct } from './surveyData'

// Pillar key names used in DB and display
export const PILLAR_KEYS = ['pillar1_score', 'pillar2_score', 'pillar3_score', 'pillar4_score', 'pillar5_score']
export const PILLAR_SHORT = ['Strategy', 'Data & Tech', 'People', 'Processes', 'Governance']

// Fetch all responses for a given cycle (or all cycles if cycleId is null)
export async function fetchResponses(cycleId = null) {
  let query = supabase.from('responses').select('*').order('submitted_at', { ascending: true })
  if (cycleId) query = query.eq('cycle', cycleId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Fetch all cycles
export async function fetchCycles() {
  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .order('id', { ascending: true })
  if (error) throw error
  return data || []
}

// Fetch qualitative responses, optionally filtered by cycle and department
export async function fetchQualitative({ cycleId = null, department = null } = {}) {
  let query = supabase
    .from('qualitative_responses')
    .select('*')
    .order('pillar', { ascending: true })
  if (cycleId) query = query.eq('cycle', cycleId)
  if (department) query = query.eq('department', department)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Compute org-wide stats from an array of response rows
export function computeOrgStats(responses) {
  if (!responses.length) return null

  const total = responses.length

  // Average pillar percentages
  const pillarAvgPcts = PILLAR_KEYS.map((key) => {
    const avg = responses.reduce((s, r) => s + (r[key] || 0), 0) / total
    return Math.round(pillarPct(avg))
  })

  const overallAvg = Math.round(
    pillarAvgPcts.reduce((a, b) => a + b, 0) / pillarAvgPcts.length
  )
  const maturityLevel = getMaturityLevel(overallAvg)

  return { total, pillarAvgPcts, overallAvg, maturityLevel }
}

// Compute per-department average scores
export function computeDeptStats(responses) {
  const deptMap = {}
  DEPARTMENTS.forEach((d) => {
    deptMap[d] = { count: 0, pillarSums: [0, 0, 0, 0, 0] }
  })

  responses.forEach((r) => {
    const dept = r.department
    if (!deptMap[dept]) {
      deptMap[dept] = { count: 0, pillarSums: [0, 0, 0, 0, 0] }
    }
    deptMap[dept].count++
    PILLAR_KEYS.forEach((key, i) => {
      deptMap[dept].pillarSums[i] += r[key] || 0
    })
  })

  return Object.entries(deptMap)
    .filter(([, v]) => v.count > 0)
    .map(([dept, v]) => {
      const pillarPcts = v.pillarSums.map((s) => Math.round(pillarPct(s / v.count)))
      const overall = Math.round(pillarPcts.reduce((a, b) => a + b, 0) / pillarPcts.length)
      return { dept, count: v.count, pillarPcts, overall }
    })
    .sort((a, b) => b.overall - a.overall)
}

// Compute trend data: avg overall score per cycle
export function computeTrend(allResponses, cycles) {
  return cycles.map((c) => {
    const cycleResps = allResponses.filter((r) => r.cycle === c.id)
    if (!cycleResps.length) return { cycle: c.label, score: 0 }
    const stats = computeOrgStats(cycleResps)
    return { cycle: c.label, score: stats?.overallAvg || 0 }
  })
}
