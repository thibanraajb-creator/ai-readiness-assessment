// Admin Dashboard — route: /admin
// PIN-protected (123456). Full analytics, export, qualitative viewer, trend chart.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList,
  LineChart, Line, Legend,
} from 'recharts'
import {
  fetchResponses, fetchCycles, fetchQualitative,
  fetchLayer2, computeOrgStats, computeDeptStats, computeTrend,
  PILLAR_SHORT, PILLAR_KEYS,
} from '../lib/dashboardUtils'
import { PILLARS, MATURITY_LEVELS, DEPARTMENTS } from '../lib/surveyData'
import { DIMENSIONS, CLUSTER_LABELS, CAPABILITY_LABELS } from '../lib/layer2Data'

const CAP_LABELS = CAPABILITY_LABELS.map((c) => c.label)
const CAP_COLORS = CAPABILITY_LABELS.map((c) => c.color)
const CLUSTER_ORDER = ['A','B','C','D','E']
const CAP_COLOR_MAP = Object.fromEntries(CAPABILITY_LABELS.map(c => [c.label, c.color]))
const CLUSTER_COLOR = {A:'#00ADA9',B:'#1B3A5C',C:'#F59E0B',D:'#534AB7',E:'#3B6D11'}
const DIM_FIELDS = ['d1_awareness','d2_tool_use','d3_prompt_ability','d4_opportunity_spotting','d5_workflow_integration']
const DIM_LABELS_LIST = ['AI Awareness','Tool Proficiency','Prompt Ability','Opportunity Spotting','Workflow Integration']
const DIM_SHORT = ['Awareness','Tool Use','Prompt','Opportunity','Workflow']

const ADMIN_PIN = '123456'

// ── Logo ──────────────────────────────────────────────────
function Logo() {
  return (
    <Link to="/" className="flex items-center">
      <img
        src="/peoplelogy-logo-transparent.png"
        alt="PEOPLElogy"
        style={{ height: '36px', width: 'auto', display: 'block' }}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }}
      />
      <span style={{ display: 'none', fontWeight: '900', fontSize: '20px' }}>
        <span style={{ color: '#1B3A5C' }}>PEOPLE</span><span style={{ color: '#00ADA9' }}>logy</span>
      </span>
    </Link>
  )
}

// ── PIN Entry Screen ──────────────────────────────────────
function PinEntry({ onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      onUnlock()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center font-inter"
      style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #0f2236 100%)' }}
    >
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: '#00ADA9' }}
            >
              <span className="text-white font-extrabold text-2xl">🔐</span>
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/50 text-sm">Enter your PIN to continue</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Admin PIN
              </label>
              <input
                ref={inputRef}
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                maxLength={6}
                className={`w-full px-4 py-3 rounded-xl border-2 text-gray-800 text-center text-xl tracking-widest font-bold focus:outline-none transition-all ${
                  error ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
                style={error ? {} : { borderColor: pin ? '#00ADA9' : '' }}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-sm text-center mt-2 font-medium">
                  Incorrect PIN. Please try again.
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={pin.length < 4}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#00ADA9' }}
            >
              Unlock Dashboard →
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
              ← Back to Public Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, sub, accent, badge }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-3xl font-extrabold" style={{ color: accent || '#1B3A5C' }}>{value}</span>
      {sub && <span className="text-sm text-gray-400">{sub}</span>}
      {badge && (
        <span
          className="inline-block text-xs font-bold text-white px-2 py-0.5 rounded-full mt-1 self-start"
          style={{ background: accent || '#00ADA9' }}
        >
          {badge}
        </span>
      )}
    </div>
  )
}

// ── Dept Completion Table ─────────────────────────────────
function CompletionTable({ deptStats, headcounts, onHeadcountChange }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-3 pr-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Department
            </th>
            <th className="text-center py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Responses
            </th>
            <th className="text-center py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Expected
            </th>
            <th className="text-center py-3 px-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Completion
            </th>
            <th className="text-center py-3 pl-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              Avg Score
            </th>
          </tr>
        </thead>
        <tbody>
          {DEPARTMENTS.map((dept) => {
            const found = deptStats.find((d) => d.dept === dept)
            const count = found?.count || 0
            const expected = headcounts[dept] || 0
            const pct = expected > 0 ? Math.min(100, Math.round((count / expected) * 100)) : null
            return (
              <tr key={dept} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-3 pr-4 font-medium text-gray-700">{dept}</td>
                <td className="py-3 px-4 text-center font-bold" style={{ color: '#1B3A5C' }}>
                  {count}
                </td>
                <td className="py-3 px-4 text-center">
                  <input
                    type="number"
                    min="0"
                    value={headcounts[dept] || ''}
                    onChange={(e) => onHeadcountChange(dept, e.target.value)}
                    placeholder="—"
                    className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none"
                    style={{ '--tw-ring-color': '#00ADA9' }}
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  {pct !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: pct >= 80 ? '#22C55E' : pct >= 50 ? '#00ADA9' : '#EF4444',
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold w-10 text-right text-gray-600">
                        {pct}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-300 text-xs">Set expected</span>
                  )}
                </td>
                <td className="py-3 pl-4 text-center font-bold" style={{ color: '#00ADA9' }}>
                  {found ? `${found.overall}%` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Qualitative viewer ────────────────────────────────────
function QualitativeViewer({ qualData, filterDept }) {
  const [activePillar, setActivePillar] = useState(1)

  const filtered = qualData.filter(
    (q) =>
      q.pillar === activePillar &&
      (!filterDept || q.department === filterDept)
  )

  // Group by question number
  const byQuestion = {}
  filtered.forEach((q) => {
    if (!byQuestion[q.question_number]) byQuestion[q.question_number] = []
    byQuestion[q.question_number].push(q)
  })

  return (
    <div>
      {/* Pillar tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PILLARS.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePillar(p.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activePillar === p.id
                ? 'text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
            style={activePillar === p.id ? { background: p.color } : {}}
          >
            P{p.id}: {p.name.split('&')[0].trim().split('/')[0].trim()}
          </button>
        ))}
      </div>

      {Object.entries(byQuestion).length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          No qualitative responses for this pillar{filterDept ? ' / department' : ''} yet.
        </p>
      ) : (
        Object.entries(byQuestion).map(([qNum, answers]) => {
          const pillarObj = PILLARS[activePillar - 1]
          const qText = pillarObj.qualitative[qNum - 13]
          return (
            <div key={qNum} className="mb-8">
              <h4 className="font-semibold text-gray-700 mb-3 text-sm">
                Q{qNum}: {qText}
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  ({answers.length} response{answers.length !== 1 ? 's' : ''})
                </span>
              </h4>
              <div className="space-y-2">
                {answers.map((a, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                  >
                    <p className="text-sm text-gray-700 leading-relaxed">{a.answer}</p>
                    <p className="text-xs text-gray-400 mt-2">{a.department}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Layer 2 CSV Export ────────────────────────────────────
function exportL2CSV(rows, allResponses) {
  if (!rows.length) return
  const withNames = rows.map(r => {
    const resp = allResponses.find(ar => ar.id === r.response_id)
    return { ...r, first_name: resp?.first_name || '' }
  })
  const headers = ['first_name','department','cluster','cycle','submitted_at',
    'capability_label','overall_capability_score',
    'd1_awareness','d2_tool_use','d3_prompt_ability','d4_opportunity_spotting','d5_workflow_integration',
    'primary_learning_focus','secondary_learning_focus','is_champion']
  const rows2 = withNames.map(r =>
    headers.map(h => {
      const v = r[h]
      if (v === null || v === undefined) return ''
      if (typeof v === 'string' && v.includes(',')) return `"${v}"`
      return v
    }).join(',')
  )
  const csv = [headers.join(','), ...rows2].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `layer2-capability-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Layer 1 CSV Export ────────────────────────────────────
function exportCSV(responses) {
  if (!responses.length) return

  const headers = [
    'id', 'first_name', 'department', 'cycle', 'submitted_at',
    'pillar1_score', 'pillar2_score', 'pillar3_score', 'pillar4_score', 'pillar5_score',
    'overall_score', 'maturity_level',
    ...Array.from({ length: 5 }, (_, pi) =>
      Array.from({ length: 12 }, (_, qi) => `p${pi + 1}_q${qi + 1}`)
    ).flat(),
  ]

  const rows = responses.map((r) =>
    headers.map((h) => {
      const v = r[h]
      if (v === null || v === undefined) return ''
      if (typeof v === 'string' && v.includes(',')) return `"${v}"`
      return v
    }).join(',')
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ai-readiness-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF Export ────────────────────────────────────────────
async function exportPDF(reportRef) {
  const { default: jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')

  const canvas = await html2canvas(reportRef.current, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * pageWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(`peoplogy-ai-readiness-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── Main Admin component ──────────────────────────────────
export default function Admin() {
  const [unlocked, setUnlocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(0)

  // Data
  const [allResponses, setAllResponses] = useState([])
  const [cycles, setCycles] = useState([])
  const [qualData, setQualData] = useState([])
  const [headcounts, setHeadcounts] = useState({})
  const [layer2Rows, setLayer2Rows] = useState([])
  const [filteredL2, setFilteredL2] = useState([])

  // Filters
  const [selectedCycleId, setSelectedCycleId] = useState(null)
  const [filterDept, setFilterDept] = useState('')
  const [filterCluster, setFilterCluster] = useState('')

  // Derived
  const [orgStats, setOrgStats] = useState(null)
  const [deptStats, setDeptStats] = useState([])
  const [trendData, setTrendData] = useState([])

  // Export
  const reportRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  // Load data on unlock
  useEffect(() => {
    if (!unlocked) return
    loadAll()
  }, [unlocked])

  async function loadAll() {
    setLoading(true)
    try {
      const [cyc, allResp, qual, l2] = await Promise.all([
        fetchCycles(),
        fetchResponses(null),  // all cycles
        fetchQualitative(),
        fetchLayer2(),
      ])
      setCycles(cyc)
      setAllResponses(allResp)
      setQualData(qual)
      setLayer2Rows(l2)

      const active = cyc.find((c) => c.is_active) || cyc[cyc.length - 1]
      if (active) setSelectedCycleId(active.id)
      setTrendData(computeTrend(allResp, cyc))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Re-compute stats when filter changes
  useEffect(() => {
    let filtered = allResponses
    if (selectedCycleId) filtered = filtered.filter((r) => r.cycle === selectedCycleId)
    if (filterDept) filtered = filtered.filter((r) => r.department === filterDept)
    setOrgStats(computeOrgStats(filtered))
    setDeptStats(computeDeptStats(filtered))

    let fl2 = layer2Rows
    if (selectedCycleId) fl2 = fl2.filter((r) => r.cycle === selectedCycleId)
    if (filterDept) fl2 = fl2.filter((r) => r.department === filterDept)
    if (filterCluster) fl2 = fl2.filter((r) => r.cluster === filterCluster)
    setFilteredL2(fl2)
  }, [allResponses, layer2Rows, selectedCycleId, filterDept, filterCluster])

  function handleHeadcountChange(dept, value) {
    setHeadcounts((prev) => ({ ...prev, [dept]: Number(value) || 0 }))
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      await exportPDF(reportRef)
    } finally {
      setExporting(false)
    }
  }

  // ── Pillar strength analysis ──────────────────────────────
  const pillarRankings = orgStats
    ? PILLARS.map((p, i) => ({
        name: p.name,
        shortName: PILLAR_SHORT[i],
        pct: orgStats.pillarAvgPcts[i],
        color: p.color,
        index: i,
      })).sort((a, b) => b.pct - a.pct)
    : []

  const top3 = pillarRankings.slice(0, 3)
  const bottom3 = [...pillarRankings].sort((a, b) => a.pct - b.pct).slice(0, 3)

  // Radar data
  const radarData = orgStats
    ? PILLARS.map((p, i) => ({
        subject: PILLAR_SHORT[i],
        score: orgStats.pillarAvgPcts[i],
        fullMark: 100,
      }))
    : []

  // Bar data
  const barData = deptStats.map((d) => ({
    name: d.dept.length > 16 ? d.dept.substring(0, 14) + '…' : d.dept,
    fullName: d.dept,
    score: d.overall,
    count: d.count,
  }))

  // ── Layer 2 computations ──────────────────────────────────
  // Panel 1: Capability distribution
  const capDistMap = {}
  filteredL2.forEach((r) => { capDistMap[r.capability_label] = (capDistMap[r.capability_label] || 0) + 1 })
  const capDistData = CAP_LABELS.map((label, i) => ({ label, count: capDistMap[label] || 0, color: CAP_COLORS[i] }))

  // Panel 2: Capability score by department
  const deptCapMap = {}
  filteredL2.forEach((r) => {
    if (!deptCapMap[r.department]) deptCapMap[r.department] = { sum: 0, count: 0 }
    deptCapMap[r.department].sum += r.overall_capability_score || 0
    deptCapMap[r.department].count++
  })
  const capByDept = Object.entries(deptCapMap).map(([dept, v]) => {
    const avg = v.sum / v.count
    return {
      dept: dept.length > 20 ? dept.substring(0, 18) + '…' : dept,
      fullDept: dept,
      avgScore: Math.round(avg * 10) / 10,
      color: avg > 3 ? '#00ADA9' : avg >= 2 ? '#EAB308' : '#EF4444',
    }
  }).sort((a, b) => b.avgScore - a.avgScore)

  // Panel 3: Perception vs capability gap (per dept)
  const gapChartData = deptStats
    .map((ds) => {
      const cap = deptCapMap[ds.dept]
      if (!cap) return null
      const capPct = Math.round((cap.sum / cap.count / 4) * 100)
      return {
        dept: ds.dept.length > 14 ? ds.dept.substring(0, 12) + '…' : ds.dept,
        fullDept: ds.dept,
        orgPct: ds.overall,
        capabilityPct: capPct,
        gap: Math.abs(ds.overall - capPct),
        flagged: Math.abs(ds.overall - capPct) > 20,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.gap - a.gap)

  // Panel 4: Learning needs
  const learningMap = {}
  filteredL2.forEach((r) => {
    const f = r.primary_learning_focus || 'Unknown'
    learningMap[f] = (learningMap[f] || 0) + 1
  })
  const learningData = Object.entries(learningMap)
    .map(([focus, count]) => ({ focus, count }))
    .sort((a, b) => b.count - a.count)

  // Panel 5: AI Champions by cluster
  const champByCluster = {}
  filteredL2.filter((r) => r.is_champion).forEach((r) => {
    const cl = r.cluster || '?'
    champByCluster[cl] = (champByCluster[cl] || 0) + 1
  })
  const totalChampions = Object.values(champByCluster).reduce((a, b) => a + b, 0)

  // Panel 6: Open text insights
  const openTexts = filteredL2.flatMap((r) => {
    const out = []
    if (['B','D','E'].includes(r.cluster) && r.l2_q4 && r.l2_q4.trim().length > 3) {
      out.push({ cluster: r.cluster, dept: r.department, q: 'Q4', text: r.l2_q4 })
    }
    if (r.cluster === 'C' && r.l2_q8 && r.l2_q8.trim().length > 3) {
      out.push({ cluster: 'C', dept: r.department, q: 'Q8 (AI Creative Tools)', text: r.l2_q8 })
    }
    return out
  })

  // ── Gap analysis computations ─────────────────────────────
  const fieldAvg = (rows, field) => rows.length ? rows.reduce((s,r) => s+(r[field]||0),0)/rows.length : 0
  const getMode = (arr) => {
    if (!arr.length) return '—'
    const freq = {}
    arr.forEach(v => { if (v) freq[v] = (freq[v] || 0) + 1 })
    return Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—'
  }
  const orgCapLabel = getMode(filteredL2.map(r => r.capability_label))
  const avgCapScorePct = filteredL2.length ? Math.round(fieldAvg(filteredL2,'overall_capability_score')*25) : 0
  const capByDeptBarData = Object.entries(deptCapMap)
    .map(([dept,v]) => { const pct = Math.round((v.sum/v.count)*25); return {name:dept.length>24?dept.substring(0,22)+'…':dept, fullName:dept, score:pct} })
    .sort((a,b)=>b.score-a.score)
  const orgReadinessAvg = orgStats ? orgStats.overallAvg : 0
  const capAvgPct = filteredL2.length ? Math.round(fieldAvg(filteredL2,'overall_capability_score')*25) : 0
  const overallGap = orgReadinessAvg - capAvgPct
  const gapMsg = overallGap > 20
    ? "Your organisation's AI strategy is ahead of your people's capability. Priority: accelerate individual skill building before scaling further."
    : overallGap < -20
    ? "Your people are more capable than your systems support. Priority: update governance, tools and processes to match your team's readiness."
    : "Organisation strategy and individual capability are well aligned. Priority: maintain momentum and push toward Level 4."

  const deptGapRows = deptStats.map(ds => {
    const cap = deptCapMap[ds.dept]
    if (!cap) return null
    const capPct = Math.round((cap.sum/cap.count)*25)
    return {dept:ds.dept, orgPct:ds.overall, capPct, gap:ds.overall-capPct}
  }).filter(Boolean).sort((a,b)=>b.gap-a.gap)

  const dimAvgPcts = DIM_FIELDS.map(f => filteredL2.length ? Math.round(fieldAvg(filteredL2,f)*25) : 0)
  const dimRadarData = DIM_SHORT.map((s,i)=>({subject:s,score:dimAvgPcts[i],fullMark:100}))

  // Priority flags
  const priorityFlags = []
  if (filteredL2.length > 0 && dimAvgPcts.some(v=>v>0)) {
    const lowestDimIdx = dimAvgPcts.indexOf(Math.min(...dimAvgPcts))
    const dimFlagData = [
      {title:'AI fundamentals training should be the first initiative', action:'Run AI awareness workshops across all teams in the first 30 days.'},
      {title:'Daily AI tool adoption is the bottleneck — focus on habit building', action:'Introduce a curated set of AI tools with a structured 21-day habit challenge.'},
      {title:'Prompt engineering training needed org-wide', action:'Run prompt engineering bootcamps — start with ChatGPT/Copilot basics.'},
      {title:'Use case identification workshops needed per department', action:'Facilitate department-level AI opportunity mapping sessions.'},
      {title:'Workflow redesign workshops needed — people are not yet applying AI to their processes', action:'Launch workflow redesign sprints — map current vs AI-augmented process flows.'},
    ]
    priorityFlags.push(dimFlagData[lowestDimIdx])
  }
  if (orgStats && orgStats.pillarAvgPcts.length) {
    const lowestPillarIdx = orgStats.pillarAvgPcts.indexOf(Math.min(...orgStats.pillarAvgPcts))
    const pillarFlagData = [
      {title:'AI strategy alignment is critically low', action:'Leadership must formally endorse and communicate the AI strategy.'},
      {title:'Data infrastructure is the primary bottleneck', action:'Prioritise data governance and centralisation before scaling AI.'},
      {title:'Workforce capability is the weakest org pillar — prioritise training investment', action:'Prioritise training investment — skills development is urgent.'},
      {title:'Processes are not yet AI-ready', action:'Map and digitise core workflows before introducing AI tools.'},
      {title:'AI governance awareness is critically low — publish and socialise the policy', action:'Publish and socialise the AI governance policy organisation-wide.'},
    ]
    priorityFlags.push(pillarFlagData[lowestPillarIdx])
  }
  const topFlags = priorityFlags.slice(0,3)

  // Respondent join (first_name from responses table)
  const respondentRows = filteredL2.map(r => {
    const resp = allResponses.find(ar => ar.id === r.response_id)
    return { ...r, first_name: resp?.first_name || '—' }
  })

  function handleGenerateRoadmap() {
    const lowestDimLabel = filteredL2.length ? DIM_LABELS_LIST[dimAvgPcts.indexOf(Math.min(...dimAvgPcts))] : 'N/A'
    const lowestPillarLabel = orgStats ? PILLAR_SHORT[orgStats.pillarAvgPcts.indexOf(Math.min(...orgStats.pillarAvgPcts))] : 'N/A'
    const prompt = [
      'Based on the Gap Analysis data below, generate my updated PEOPLElogy AI Transformation Roadmap with specific priorities, timelines and initiatives mapped to the real assessment results:',
      `- Organisation AI Readiness Score: ${orgReadinessAvg}%`,
      `- Individual Capability Average: ${capAvgPct}%`,
      `- Overall Gap: ${overallGap>0?'+':''}${overallGap} points`,
      `- Lowest capability dimension: ${lowestDimLabel}`,
      `- Weakest organisation pillar: ${lowestPillarLabel}`,
      `- Priority flags: ${topFlags.map(f=>f?.title).filter(Boolean).join('; ')}`,
    ].join('\n')
    navigator.clipboard?.writeText(prompt)
      .then(()=>alert('Roadmap prompt copied to clipboard! Paste it into Claude or your AI assistant.'))
      .catch(()=>alert('Copy failed. Prompt:\n\n'+prompt))
  }

  // ── PIN guard ─────────────────────────────────────────────
  if (!unlocked) {
    return <PinEntry onUnlock={() => setUnlocked(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span
              className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
              style={{ background: '#1B3A5C' }}
            >
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Cycle filter */}
            {cycles.length > 0 && (
              <select
                value={selectedCycleId || ''}
                onChange={(e) => setSelectedCycleId(Number(e.target.value) || null)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none"
              >
                <option value="">All Cycles</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            )}

            {/* Dept filter */}
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* Cluster filter */}
            <select
              value={filterCluster}
              onChange={(e) => setFilterCluster(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none"
            >
              <option value="">All Clusters</option>
              {CLUSTER_ORDER.map(cl => <option key={cl} value={cl}>Cluster {cl} — {CLUSTER_LABELS[cl]}</option>)}
            </select>

            {/* Export buttons */}
            <button
              onClick={() => exportCSV(allResponses)}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 flex items-center gap-2"
            >
              📥 L1 CSV
            </button>
            <button
              onClick={() => exportL2CSV(filteredL2, allResponses)}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 flex items-center gap-2"
            >
              📥 L2 CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="px-4 py-2 text-sm font-bold rounded-xl text-white flex items-center gap-2 disabled:opacity-60"
              style={{ background: '#1B3A5C' }}
            >
              {exporting ? '⏳ Exporting…' : '📄 PDF Report'}
            </button>

            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500"
            >
              Public View
            </Link>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto">
            {['Organisation Readiness','Employee Capability','Gap Analysis'].map((tab,i) => (
              <button key={i} onClick={()=>setActiveTab(i)}
                className="px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors"
                style={{borderBottomColor:activeTab===i?'#00ADA9':'transparent',color:activeTab===i?'#00ADA9':'#6B7280'}}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main report content (Tab 0 captured for PDF) */}
      <div ref={activeTab===0 ? reportRef : undefined}>
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-red-700">
              <p className="font-semibold">Failed to load data</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {/* ══ TAB 0: ORG READINESS ══ */}
          {activeTab === 0 && (
          <>
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold" style={{ color: '#1B3A5C' }}>Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">
              Full analytics view · {filterDept || 'All Departments'} ·{' '}
              {cycles.find((c) => c.id === selectedCycleId)?.label || 'All Cycles'}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: '#00ADA9', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <>
              {/* ── Top stats ───────────────────────────────── */}
              {orgStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard
                    label="Total Responses"
                    value={orgStats.total}
                    sub="in filtered view"
                    accent="#1B3A5C"
                  />
                  <StatCard
                    label="Overall Score"
                    value={`${orgStats.overallAvg}%`}
                    sub="AI Maturity Score"
                    accent="#00ADA9"
                  />
                  <StatCard
                    label="Maturity Level"
                    value={`L${orgStats.maturityLevel}`}
                    badge={MATURITY_LEVELS[orgStats.maturityLevel].label.replace(
                      `Level ${orgStats.maturityLevel}: `, ''
                    )}
                    accent={MATURITY_LEVELS[orgStats.maturityLevel].color}
                  />
                  <StatCard
                    label="Depts w/ Responses"
                    value={deptStats.length}
                    sub={`of ${DEPARTMENTS.length} departments`}
                    accent="#6366F1"
                  />
                </div>
              )}

              {/* ── Strongest / Weakest Pillars ─────────────── */}
              {orgStats && pillarRankings.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Top 3 strongest */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: '#1B3A5C' }}>
                      <span className="text-green-500 text-lg">↑</span> Top 3 Strongest Pillars
                    </h3>
                    <div className="space-y-3">
                      {top3.map((p, i) => (
                        <div key={p.index} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-green-600 bg-green-50 rounded-full w-6 h-6 flex items-center justify-center">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{p.shortName}</span>
                              <span className="font-bold text-green-600">{p.pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{ width: `${p.pct}%`, background: '#22C55E' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom 3 weakest */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: '#1B3A5C' }}>
                      <span className="text-red-500 text-lg">↓</span> Top 3 Weakest Pillars
                    </h3>
                    <div className="space-y-3">
                      {bottom3.map((p, i) => (
                        <div key={p.index} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-red-600 bg-red-50 rounded-full w-6 h-6 flex items-center justify-center">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{p.shortName}</span>
                              <span className="font-bold text-red-500">{p.pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{ width: `${p.pct}%`, background: '#EF4444' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Charts row ───────────────────────────────── */}
              {orgStats && (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Radar */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>
                      Organisation Radar
                    </h2>
                    <p className="text-xs text-gray-400 mb-4">
                      Average scores across all 5 pillars
                    </p>
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter' }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 100]}
                          tick={{ fill: '#9CA3AF', fontSize: 9 }}
                          tickCount={5}
                        />
                        <Radar
                          name="Org Avg"
                          dataKey="score"
                          stroke="#00ADA9"
                          fill="#00ADA9"
                          fillOpacity={0.2}
                          strokeWidth={2.5}
                        />
                        <Tooltip
                          formatter={(v) => [`${v}%`, 'Avg Score']}
                          contentStyle={{
                            borderRadius: '12px', border: 'none',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            fontFamily: 'Inter', fontSize: 12,
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Dept bar chart */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>
                      Score by Department
                    </h2>
                    <p className="text-xs text-gray-400 mb-4">
                      Average overall AI maturity score per department
                    </p>
                    {barData.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-12">No data for current filter</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={barData}
                          margin={{ top: 24, right: 16, left: -20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }}
                            angle={-40}
                            textAnchor="end"
                            interval={0}
                            height={70}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Inter' }}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip
                            formatter={(v, _, props) => [
                              `${v}% (${props.payload?.count} response${props.payload?.count !== 1 ? 's' : ''})`,
                              props.payload?.fullName || 'Score',
                            ]}
                            contentStyle={{
                              borderRadius: '12px', border: 'none',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                              fontFamily: 'Inter', fontSize: 12,
                            }}
                          />
                          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                            {barData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.score >= 61 ? '#00ADA9' : entry.score >= 41 ? '#1B3A5C' : '#EF4444'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}

              {/* ── Trend chart ──────────────────────────────── */}
              {trendData.length > 1 && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
                  <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>
                    Score Trend Across Cycles
                  </h2>
                  <p className="text-xs text-gray-400 mb-4">
                    Organisation-wide AI Maturity Score over time
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendData} margin={{ top: 10, right: 24, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis
                        dataKey="cycle"
                        tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter' }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Inter' }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        formatter={(v) => [`${v}%`, 'Avg Score']}
                        contentStyle={{
                          borderRadius: '12px', border: 'none',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          fontFamily: 'Inter', fontSize: 12,
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="score"
                        name="Org Avg Score"
                        stroke="#00ADA9"
                        strokeWidth={3}
                        dot={{ fill: '#00ADA9', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* ── Completion rate by department ────────────── */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>
                  Department Completion Rate
                </h2>
                <p className="text-xs text-gray-400 mb-6">
                  Set expected headcount per department to track completion percentage
                </p>
                <CompletionTable
                  deptStats={deptStats}
                  headcounts={headcounts}
                  onHeadcountChange={handleHeadcountChange}
                />
              </div>

              {/* ── Qualitative responses ────────────────────── */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
                <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>
                  Qualitative Responses
                </h2>
                <p className="text-xs text-gray-400 mb-6">
                  Open-text answers from respondents, grouped by pillar
                  {filterDept ? ` · ${filterDept}` : ''}
                </p>
                <QualitativeViewer
                  qualData={qualData.filter((q) =>
                    (!selectedCycleId || q.cycle === selectedCycleId) &&
                    (!filterDept || q.department === filterDept)
                  )}
                  filterDept={filterDept}
                />
              </div>

            </>
          )}
          </>
          )}

          {/* ══ TAB 1: EMPLOYEE CAPABILITY ══ */}
          {activeTab === 1 && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold" style={{ color: '#1B3A5C' }}>Employee Capability Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Individual AI capability results · {filterDept||'All Departments'} · {filterCluster?`Cluster ${filterCluster}`:'All Clusters'}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-32"><div className="w-12 h-12 rounded-full border-4 animate-spin" style={{borderColor:'#00ADA9',borderTopColor:'transparent'}}/></div>
            ) : filteredL2.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">🧠</div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">Layer 2 data not yet available</h3>
                <p className="text-gray-400 text-sm">Once respondents complete the individual capability assessment, results will appear here.</p>
              </div>
            ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Responses" value={filteredL2.length} sub="completed Part 2" accent="#1B3A5C" />
                <StatCard label="Org Capability Level" value={orgCapLabel} sub="most common" accent={CAP_COLOR_MAP[orgCapLabel]||'#1B3A5C'} />
                <StatCard label="Avg Capability Score" value={`${avgCapScorePct}%`} sub="organisation average" accent="#00ADA9" />
                <StatCard label="AI Champions" value={totalChampions} sub={`${filteredL2.length?Math.round(totalChampions/filteredL2.length*100):0}% of respondents`} accent="#3B6D11" badge={totalChampions>0?`${totalChampions} identified`:undefined} />
              </div>

              {/* Capability distribution */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-base font-bold mb-1" style={{color:'#1B3A5C'}}>Capability level distribution</h2>
                <p className="text-xs text-gray-400 mb-3">Count of respondents by capability level</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {CAPABILITY_LABELS.map(c => (
                    <div key={c.label} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{background:CAP_COLOR_MAP[c.label]||c.color}}/>
                      <span className="text-xs text-gray-600">{c.label}</span>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={capDistData} layout="vertical" margin={{top:0,right:40,left:110,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false}/>
                    <XAxis type="number" allowDecimals={false} tick={{fill:'#9CA3AF',fontSize:10,fontFamily:'Inter'}}/>
                    <YAxis type="category" dataKey="label" width={110} tick={{fill:'#6B7280',fontSize:10,fontFamily:'Inter'}}/>
                    <Tooltip formatter={v=>[v,'Respondents']} contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)',fontFamily:'Inter',fontSize:12}}/>
                    <Bar dataKey="count" radius={[0,6,6,0]}>
                      <LabelList dataKey="count" position="right" style={{fill:'#1B3A5C',fontSize:11,fontWeight:700}}/>
                      {capDistData.map((entry,i)=>(<Cell key={i} fill={entry.color||'#94A3B8'}/>))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Dimension radar + bars */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-base font-bold mb-1" style={{color:'#1B3A5C'}}>Average scores across 5 capability dimensions</h2>
                <p className="text-xs text-gray-400 mb-4">Organisation average per dimension (converted to %)</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={dimRadarData} cx="50%" cy="50%" outerRadius="65%">
                      <PolarGrid stroke="#E5E7EB"/>
                      <PolarAngleAxis dataKey="subject" tick={{fill:'#6B7280',fontSize:10,fontFamily:'Inter'}}/>
                      <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fill:'#9CA3AF',fontSize:8}} tickCount={5}/>
                      <Radar name="Avg" dataKey="score" stroke="#1B3A5C" fill="#00ADA9" fillOpacity={0.25} strokeWidth={2}/>
                      <Tooltip formatter={v=>[`${v}%`,'Score']} contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)',fontFamily:'Inter',fontSize:12}}/>
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 self-center">
                    {DIM_LABELS_LIST.map((label,i)=>(
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{label}</span>
                          <span className="font-bold" style={{color:'#00ADA9'}}>{dimAvgPcts[i]}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{width:`${dimAvgPcts[i]}%`,background:'#00ADA9'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cap by dept */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-base font-bold mb-1" style={{color:'#1B3A5C'}}>Average capability score by department</h2>
                <p className="text-xs text-gray-400 mb-4">
                  <span style={{color:'#E24B4A'}}>●</span> Below 50% &nbsp;
                  <span style={{color:'#EF9F27'}}>●</span> 50–70% &nbsp;
                  <span style={{color:'#00ADA9'}}>●</span> Above 70%
                </p>
                {capByDeptBarData.length===0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No department data</p>
                ) : (
                  <div style={{height:capByDeptBarData.length*40+80}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={capByDeptBarData} layout="vertical" margin={{top:0,right:50,left:140,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false}/>
                        <XAxis type="number" domain={[0,100]} tick={{fill:'#9CA3AF',fontSize:10,fontFamily:'Inter'}} tickFormatter={v=>`${v}%`}/>
                        <YAxis type="category" dataKey="name" width={140} tick={{fill:'#6B7280',fontSize:10,fontFamily:'Inter'}}/>
                        <Tooltip formatter={(v,_,props)=>[`${v}%`,props.payload?.fullName||'Score']} contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)',fontFamily:'Inter',fontSize:12}}/>
                        <Bar dataKey="score" radius={[0,6,6,0]}>
                          <LabelList dataKey="score" position="right" style={{fill:'#1B3A5C',fontSize:11,fontWeight:700}} formatter={v=>`${v}%`}/>
                          {capByDeptBarData.map((d,i)=>(<Cell key={i} fill={d.score>=70?'#00ADA9':d.score>=50?'#EF9F27':'#E24B4A'}/>))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Learning needs */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-base font-bold mb-1" style={{color:'#1B3A5C'}}>What your people need to learn</h2>
                <p className="text-xs text-gray-400 mb-6">Primary learning focus areas — use this to prioritise your weekly learning time</p>
                {learningData.length===0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">No learning focus data available</p>
                ) : (
                  <div className="space-y-3">
                    {learningData.map(({focus,count},i)=>(
                      <div key={focus} className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0" style={{background:i===0?'#00ADA9':'#1B3A5C'}}>{i+1}</div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-gray-800">{focus}</span>
                            <span className="font-bold" style={{color:'#00ADA9'}}>{count} staff</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full" style={{width:`${Math.round(count/filteredL2.length*100)}%`,background:i===0?'#00ADA9':'#1B3A5C'}}/>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Champions by cluster */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-base font-bold mb-1" style={{color:'#1B3A5C'}}>AI Champions identified</h2>
                <p className="text-xs text-gray-400 mb-1">Grouped by role cluster — {totalChampions} total</p>
                <p className="text-xs mb-4 font-medium" style={{color:'#00ADA9'}}>These are your internal AI ambassadors — involve them in the habit change plan.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {CLUSTER_ORDER.map(cl=>{
                    const cnt = champByCluster[cl]||0
                    const clusterTotal = filteredL2.filter(r=>r.cluster===cl).length
                    return (
                      <div key={cl} className="rounded-2xl p-4 border" style={{borderColor:CLUSTER_COLOR[cl]+'44',background:CLUSTER_COLOR[cl]+'0A'}}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center" style={{background:CLUSTER_COLOR[cl]}}>{cl}</div>
                          <span className="text-lg font-black" style={{color:CLUSTER_COLOR[cl]}}>{cnt}</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">{CLUSTER_LABELS[cl]}</p>
                        <p className="text-xs text-gray-400">{clusterTotal} respondent{clusterTotal!==1?'s':''}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Open texts */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-base font-bold mb-1" style={{color:'#1B3A5C'}}>What staff say AI could help most</h2>
                <p className="text-xs text-gray-400 mb-6">Free-text responses from Clusters B/D/E (Q4) and Cluster C (Q8)</p>
                {openTexts.length===0 ? (
                  <p className="text-gray-400 text-sm text-center py-6">No open text responses yet</p>
                ) : (
                  <div className="space-y-3">
                    {openTexts.map((t,i)=>(
                      <div key={i} className="pl-4 py-3 pr-4 rounded-2xl bg-gray-50" style={{borderLeft:'3px solid #00ADA9'}}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{background:CLUSTER_COLOR[t.cluster]||'#1B3A5C'}}>Cluster {t.cluster}</span>
                          <span className="text-xs text-gray-400">{t.dept}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{t.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
            )}
          </>
          )}

          {/* ══ TAB 2: GAP ANALYSIS ══ */}
          {activeTab === 2 && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold" style={{color:'#1B3A5C'}}>Gap Analysis Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Organisation readiness vs individual capability · {filterDept||'All Departments'}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-32"><div className="w-12 h-12 rounded-full border-4 animate-spin" style={{borderColor:'#00ADA9',borderTopColor:'transparent'}}/></div>
            ) : (filteredL2.length===0||!orgStats) ? (
              <div className="space-y-4">
                {!orgStats && <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-gray-400">No organisation readiness data available yet.</div>}
                {filteredL2.length===0 && (
                  <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                    <div className="text-5xl mb-4">🧠</div>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Layer 2 data not yet available</h3>
                    <p className="text-gray-400 text-sm">Once respondents complete the individual capability assessment, results will appear here.</p>
                  </div>
                )}
              </div>
            ) : (
            <>
              {/* Critical gap */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
                <h2 className="text-base font-bold mb-1" style={{color:'#1B3A5C'}}>The critical gap</h2>
                <p className="text-xs text-gray-400 mb-6">Organisation readiness (Layer 1) vs individual capability (Layer 2)</p>
                <div className="flex items-center justify-center gap-6 mb-6">
                  <div className="text-center flex-1">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Organisation Readiness</p>
                    <div className="text-5xl font-black" style={{color:'#1B3A5C'}}>{orgReadinessAvg}%</div>
                    <p className="text-xs text-gray-400 mt-1">AI Maturity Score</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg" style={{background:Math.abs(overallGap)>20?'#EF4444':'#22C55E'}}>
                      {overallGap>0?'↓':overallGap<0?'↑':'≈'}
                    </div>
                    <div className="text-sm font-bold text-gray-600">{Math.abs(overallGap)}pt gap</div>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Individual Capability</p>
                    <div className="text-5xl font-black" style={{color:'#00ADA9'}}>{capAvgPct}%</div>
                    <p className="text-xs text-gray-400 mt-1">Capability Score</p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Organisation Readiness</span><span>{orgReadinessAvg}%</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-4"><div className="h-4 rounded-full" style={{width:`${orgReadinessAvg}%`,background:'#1B3A5C'}}/></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Individual Capability</span><span>{capAvgPct}%</span></div>
                    <div className="w-full bg-gray-100 rounded-full h-4"><div className="h-4 rounded-full" style={{width:`${capAvgPct}%`,background:'#00ADA9'}}/></div>
                  </div>
                </div>
                <div className="rounded-2xl p-4" style={{background:Math.abs(overallGap)>20?'#FEF2F2':'#F0FDF4',border:`1px solid ${Math.abs(overallGap)>20?'#FECACA':'#BBF7D0'}`}}>
                  <p className="text-sm font-medium text-gray-700">{gapMsg}</p>
                </div>
              </div>

              {/* Dept gap table */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-base font-bold mb-1" style={{color:'#1B3A5C'}}>Perception vs capability gap by department</h2>
                <p className="text-xs text-gray-400 mb-6">Sorted by gap size (biggest first)</p>
                {deptGapRows.length===0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No departments have both Layer 1 and Layer 2 responses yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Department</th>
                          <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Org Readiness</th>
                          <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Capability</th>
                          <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Gap</th>
                          <th className="text-center py-3 pl-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptGapRows.map(row=>{
                          let badgeText,badgeBg
                          if(row.gap>20){badgeText='Skills gap — urgent';badgeBg='#EF4444'}
                          else if(row.gap>=10){badgeText='Monitor';badgeBg='#F59E0B'}
                          else if(row.gap>=-10){badgeText='Aligned';badgeBg='#00ADA9'}
                          else{badgeText='Capability ahead';badgeBg='#1B3A5C'}
                          return (
                            <tr key={row.dept} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="py-3 pr-4 font-medium text-gray-700">{row.dept}</td>
                              <td className="py-3 px-3 text-center font-bold" style={{color:'#1B3A5C'}}>{row.orgPct}%</td>
                              <td className="py-3 px-3 text-center font-bold" style={{color:'#00ADA9'}}>{row.capPct}%</td>
                              <td className="py-3 px-3 text-center font-bold" style={{color:row.gap>10?'#EF4444':row.gap<-10?'#1B3A5C':'#22C55E'}}>{row.gap>0?'+':''}{row.gap}</td>
                              <td className="py-3 pl-3 text-center"><span className="text-xs font-bold text-white px-2 py-1 rounded-full" style={{background:badgeBg}}>{badgeText}</span></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Dual radar */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-base font-bold mb-1" style={{color:'#1B3A5C'}}>Where the gaps are deepest</h2>
                <p className="text-xs text-gray-400 mb-6">Organisation perception vs employee actual capability</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-center text-gray-500 mb-2 uppercase tracking-wider">Organisation sees itself as...</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                        <PolarGrid stroke="#E5E7EB"/>
                        <PolarAngleAxis dataKey="subject" tick={{fill:'#6B7280',fontSize:10,fontFamily:'Inter'}}/>
                        <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fill:'#9CA3AF',fontSize:8}} tickCount={5}/>
                        <Radar name="Org Readiness" dataKey="score" stroke="#1B3A5C" fill="#1B3A5C" fillOpacity={0.2} strokeWidth={2}/>
                        <Tooltip formatter={v=>[`${v}%`,'Score']} contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)',fontFamily:'Inter',fontSize:12}}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-center text-gray-500 mb-2 uppercase tracking-wider">Employees are actually at...</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <RadarChart data={dimRadarData} cx="50%" cy="50%" outerRadius="65%">
                        <PolarGrid stroke="#E5E7EB"/>
                        <PolarAngleAxis dataKey="subject" tick={{fill:'#6B7280',fontSize:10,fontFamily:'Inter'}}/>
                        <PolarRadiusAxis angle={90} domain={[0,100]} tick={{fill:'#9CA3AF',fontSize:8}} tickCount={5}/>
                        <Radar name="Capability" dataKey="score" stroke="#00ADA9" fill="#00ADA9" fillOpacity={0.2} strokeWidth={2}/>
                        <Tooltip formatter={v=>[`${v}%`,'Score']} contentStyle={{borderRadius:'12px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)',fontFamily:'Inter',fontSize:12}}/>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Priority flags */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-base font-bold mb-1" style={{color:'#1B3A5C'}}>What this means for your roadmap</h2>
                <p className="text-xs text-gray-400 mb-6">Auto-generated priority flags based on assessment data</p>
                <div className="space-y-4 mb-6">
                  {topFlags.filter(Boolean).map((flag,i)=>(
                    <div key={i} className="rounded-2xl p-5" style={{borderLeft:'4px solid #EF4444',background:'#FEF2F2'}}>
                      <p className="font-bold text-gray-800 text-sm mb-1">{flag.title}</p>
                      <p className="text-sm text-gray-600">{flag.action}</p>
                    </div>
                  ))}
                  {topFlags.length===0 && <p className="text-gray-400 text-sm text-center py-4">Not enough data to generate flags yet</p>}
                </div>
                <button onClick={handleGenerateRoadmap} className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90" style={{background:'linear-gradient(135deg,#1B3A5C,#00ADA9)'}}>
                  Generate full roadmap from this data ↗
                </button>
              </div>

              {/* Individual respondent table (admin-only) */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold" style={{color:'#1B3A5C'}}>Individual respondent breakdown</h2>
                  <button onClick={()=>exportL2CSV(filteredL2,allResponses)} className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 flex items-center gap-2">
                    📥 Export CSV
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-6">Semi-anonymous — first name only · {filteredL2.length} respondent{filteredL2.length!==1?'s':''}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 pr-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="text-left py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Department</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cluster</th>
                        <th className="text-center py-3 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Capability Level</th>
                        <th className="text-left py-3 pl-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Learning Focus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {respondentRows.map((r,i)=>(
                        <tr key={r.id||i} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 pr-4 font-medium text-gray-700">{r.first_name}</td>
                          <td className="py-3 px-3 text-gray-600">{r.department}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{background:CLUSTER_COLOR[r.cluster]||'#1B3A5C'}}>
                              {r.cluster} — {CLUSTER_LABELS[r.cluster]}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{background:CAP_COLOR_MAP[r.capability_label]||'#1B3A5C'}}>
                              {r.capability_label}
                            </span>
                          </td>
                          <td className="py-3 pl-3 text-gray-600 text-sm">{r.primary_learning_focus||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
            )}
          </>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6" style={{ background: '#0f2236' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-white/40 text-sm">
            © {new Date().getFullYear()} PEOPLElogy · Admin Dashboard
          </span>
          <button
            onClick={() => setUnlocked(false)}
            className="text-white/40 text-sm hover:text-red-400 transition-colors"
          >
            Lock Dashboard
          </button>
        </div>
      </footer>
    </div>
  )
}
