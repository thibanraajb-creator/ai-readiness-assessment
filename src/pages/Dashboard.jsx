// Public Dashboard — route: /dashboard
// 3-tab: Organisation Readiness | Employee Capability | Gap Analysis
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList,
} from 'recharts'
import {
  fetchResponses, fetchCycles, fetchLayer2,
  computeOrgStats, computeDeptStats, PILLAR_SHORT,
} from '../lib/dashboardUtils'
import { PILLARS, MATURITY_LEVELS } from '../lib/surveyData'
import { CAPABILITY_LABELS, CLUSTER_LABELS } from '../lib/layer2Data'

const CAP_COLOR = {
  'AI Beginner':'#E24B4A','AI Explorer':'#EF9F27',
  'AI Practitioner':'#1B3A5C','AI Integrator':'#00ADA9','AI Champion':'#3B6D11',
}
const CLUSTER_COLOR = {A:'#00ADA9',B:'#1B3A5C',C:'#F59E0B',D:'#534AB7',E:'#3B6D11'}
const DIM_FIELDS  = ['d1_awareness','d2_tool_use','d3_prompt_ability','d4_opportunity_spotting','d5_workflow_integration']
const DIM_LABELS  = ['AI Awareness','Tool Proficiency','Prompt Ability','Opportunity Spotting','Workflow Integration']
const DIM_SHORT   = ['Awareness','Tool Use','Prompt','Opportunity','Workflow']

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

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-3xl font-extrabold" style={{ color: accent || '#1B3A5C' }}>{value}</span>
      {sub && <span className="text-sm text-gray-400">{sub}</span>}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: '#00ADA9', borderTopColor: 'transparent' }} />
    </div>
  )
}

function EmptyL2() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
      <div className="text-5xl mb-4">🧠</div>
      <h3 className="text-lg font-bold text-gray-700 mb-2">Layer 2 data not yet available</h3>
      <p className="text-gray-400 text-sm max-w-sm mx-auto">
        Once respondents complete the individual capability assessment, results will appear here.
      </p>
    </div>
  )
}

function PillarCard({ pillar, avgPct, index }) {
  const level = avgPct <= 20 ? 1 : avgPct <= 40 ? 2 : avgPct <= 60 ? 3 : avgPct <= 80 ? 4 : 5
  const levelInfo = MATURITY_LEVELS[level]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Pillar {index + 1}</p>
          <p className="text-sm font-bold text-gray-800">{pillar.name}</p>
        </div>
        <div className="text-xl font-extrabold" style={{ color: pillar.color }}>{avgPct}%</div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div className="h-2 rounded-full" style={{ width: `${avgPct}%`, background: pillar.color }} />
      </div>
      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: levelInfo.color }}>
        {levelInfo.label}
      </span>
    </div>
  )
}

function getMode(arr) {
  if (!arr.length) return '—'
  const freq = {}
  arr.forEach(v => { if (v) freq[v] = (freq[v] || 0) + 1 })
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
}

function fieldAvg(rows, field) {
  if (!rows.length) return 0
  return rows.reduce((s, r) => s + (r[field] || 0), 0) / rows.length
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cycles, setCycles] = useState([])
  const [selectedCycleId, setSelectedCycleId] = useState(null)
  const [responses, setResponses] = useState([])
  const [orgStats, setOrgStats] = useState(null)
  const [deptStats, setDeptStats] = useState([])
  const [l2Loading, setL2Loading] = useState(true)
  const [l2Rows, setL2Rows] = useState([])

  useEffect(() => {
    fetchCycles()
      .then(data => {
        setCycles(data)
        const active = data.find(c => c.is_active) || data[data.length - 1]
        if (active) setSelectedCycleId(active.id)
      })
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    if (selectedCycleId === null && cycles.length === 0) return
    setLoading(true)
    setL2Loading(true)
    Promise.all([fetchResponses(selectedCycleId), fetchLayer2(selectedCycleId)])
      .then(([l1, l2]) => {
        setResponses(l1)
        setOrgStats(computeOrgStats(l1))
        setDeptStats(computeDeptStats(l1))
        setL2Rows(l2)
      })
      .catch(err => setError(err.message))
      .finally(() => { setLoading(false); setL2Loading(false) })
  }, [selectedCycleId])

  // L1 derived
  const radarData = orgStats
    ? PILLARS.map((p, i) => ({ subject: PILLAR_SHORT[i], score: orgStats.pillarAvgPcts[i], fullMark: 100 }))
    : []
  const barData = deptStats.map(d => ({
    name: d.dept.length > 16 ? d.dept.substring(0, 14) + '…' : d.dept,
    fullName: d.dept, score: d.overall, count: d.count,
  }))

  // L2 derived
  const l2Total = l2Rows.length
  const orgCapLabel = getMode(l2Rows.map(r => r.capability_label))
  const avgCapPct = l2Total ? Math.round(fieldAvg(l2Rows, 'overall_capability_score') * 25) : 0
  const champCount = l2Rows.filter(r => r.is_champion).length
  const capDistData = CAPABILITY_LABELS.map(c => ({
    label: c.label,
    count: l2Rows.filter(r => r.capability_label === c.label).length,
  }))
  const dimAvgPcts = DIM_FIELDS.map(f => l2Total ? Math.round(fieldAvg(l2Rows, f) * 25) : 0)
  const dimRadarData = DIM_SHORT.map((s, i) => ({ subject: s, score: dimAvgPcts[i], fullMark: 100 }))
  const deptCapMap = {}
  l2Rows.forEach(r => {
    if (!deptCapMap[r.department]) deptCapMap[r.department] = { sum: 0, count: 0 }
    deptCapMap[r.department].sum += r.overall_capability_score || 0
    deptCapMap[r.department].count++
  })
  const capByDeptData = Object.entries(deptCapMap)
    .map(([dept, v]) => {
      const pct = Math.round((v.sum / v.count) * 25)
      return { name: dept.length > 24 ? dept.substring(0, 22) + '…' : dept, fullName: dept, score: pct }
    })
    .sort((a, b) => b.score - a.score)
  const learningMap = {}
  l2Rows.forEach(r => { if (r.primary_learning_focus) learningMap[r.primary_learning_focus] = (learningMap[r.primary_learning_focus] || 0) + 1 })
  const learningData = Object.entries(learningMap).map(([focus, count]) => ({ focus, count })).sort((a, b) => b.count - a.count)
  const champByCluster = {}
  l2Rows.filter(r => r.is_champion).forEach(r => { champByCluster[r.cluster] = (champByCluster[r.cluster] || 0) + 1 })
  const openTexts = l2Rows.flatMap(r => {
    const out = []
    if (['B','D','E'].includes(r.cluster) && r.l2_q4?.trim().length > 3) out.push({ cluster: r.cluster, dept: r.department, text: r.l2_q4 })
    if (r.cluster === 'C' && r.l2_q8?.trim().length > 3) out.push({ cluster: 'C', dept: r.department, text: r.l2_q8 })
    return out
  })

  // Gap derived
  const orgReadinessAvg = orgStats ? orgStats.overallAvg : 0
  const capAvg = l2Total ? Math.round(fieldAvg(l2Rows, 'overall_capability_score') * 25) : 0
  const overallGap = orgReadinessAvg - capAvg
  const gapMsg = overallGap > 20
    ? "Your organisation's AI strategy is ahead of your people's capability. Priority: accelerate individual skill building before scaling further."
    : overallGap < -20
    ? "Your people are more capable than your systems support. Priority: update governance, tools and processes to match your team's readiness."
    : "Organisation strategy and individual capability are well aligned. Priority: maintain momentum and push toward Level 4."
  const deptGapRows = deptStats.map(ds => {
    const cap = deptCapMap[ds.dept]
    if (!cap) return null
    const capPct = Math.round((cap.sum / cap.count) * 25)
    return { dept: ds.dept, orgPct: ds.overall, capPct, gap: ds.overall - capPct }
  }).filter(Boolean).sort((a, b) => b.gap - a.gap)

  const priorityFlags = []
  if (l2Total > 0 && dimAvgPcts.some(v => v > 0)) {
    const idx = dimAvgPcts.indexOf(Math.min(...dimAvgPcts))
    const dimFlagData = [
      { title: 'AI fundamentals training should be the first initiative', action: 'Run AI awareness workshops across all teams in the first 30 days.' },
      { title: 'Daily AI tool adoption is the bottleneck — focus on habit building', action: 'Introduce a curated set of AI tools with a structured 21-day habit challenge.' },
      { title: 'Prompt engineering training needed org-wide', action: 'Run prompt engineering bootcamps — start with ChatGPT/Copilot basics.' },
      { title: 'Use case identification workshops needed per department', action: 'Facilitate department-level AI opportunity mapping sessions.' },
      { title: 'Workflow redesign workshops needed — people are not yet applying AI to their processes', action: 'Launch workflow redesign sprints — map current vs AI-augmented process flows.' },
    ]
    priorityFlags.push(dimFlagData[idx])
  }
  if (orgStats && orgStats.pillarAvgPcts.length) {
    const idx = orgStats.pillarAvgPcts.indexOf(Math.min(...orgStats.pillarAvgPcts))
    const pillarFlagData = [
      { title: 'AI strategy alignment is critically low', action: 'Leadership must formally endorse and communicate the AI strategy.' },
      { title: 'Data infrastructure is the primary bottleneck', action: 'Prioritise data governance and centralisation before scaling AI.' },
      { title: 'Workforce capability is the weakest org pillar — prioritise training investment', action: 'Prioritise training investment — skills development is urgent.' },
      { title: 'Processes are not yet AI-ready', action: 'Map and digitise core workflows before introducing AI tools.' },
      { title: 'AI governance awareness is critically low — publish and socialise the policy', action: 'Publish and socialise the AI governance policy organisation-wide.' },
    ]
    priorityFlags.push(pillarFlagData[idx])
  }
  const topFlags = priorityFlags.slice(0, 3)

  function handleGenerateRoadmap() {
    const lowestDimLabel = l2Total ? DIM_LABELS[dimAvgPcts.indexOf(Math.min(...dimAvgPcts))] : 'N/A'
    const lowestPillarLabel = orgStats ? PILLAR_SHORT[orgStats.pillarAvgPcts.indexOf(Math.min(...orgStats.pillarAvgPcts))] : 'N/A'
    const prompt = [
      'Based on the Gap Analysis data below, generate my updated PEOPLElogy AI Transformation Roadmap:',
      `- Organisation AI Readiness Score: ${orgReadinessAvg}%`,
      `- Individual Capability Average: ${capAvg}%`,
      `- Overall Gap: ${overallGap > 0 ? '+' : ''}${overallGap} points`,
      `- Lowest capability dimension: ${lowestDimLabel}`,
      `- Weakest organisation pillar: ${lowestPillarLabel}`,
      `- Priority flags: ${topFlags.map(f => f?.title).filter(Boolean).join('; ')}`,
    ].join('\n')
    navigator.clipboard?.writeText(prompt)
      .then(() => alert('Roadmap prompt copied to clipboard! Paste it into Claude or your AI assistant.'))
      .catch(() => alert('Copy failed. Prompt:\n\n' + prompt))
  }

  const currentCycle = cycles.find(c => c.id === selectedCycleId)

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            {cycles.length > 0 && (
              <select
                value={selectedCycleId || ''}
                onChange={e => setSelectedCycleId(Number(e.target.value))}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none"
              >
                {cycles.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            )}
            <Link to="/survey" className="px-4 py-2 rounded-xl text-sm font-bold text-white hidden md:inline-flex" style={{ background: '#00ADA9' }}>
              Take Assessment
            </Link>
            <Link to="/admin" className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50">
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex overflow-x-auto">
            {['Organisation Readiness', 'Employee Capability', 'Gap Analysis'].map((tab, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className="px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors"
                style={{ borderBottomColor: activeTab === i ? '#00ADA9' : 'transparent', color: activeTab === i ? '#00ADA9' : '#6B7280' }}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

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
              <h1 className="text-2xl font-extrabold" style={{ color: '#1B3A5C' }}>Organisation AI Readiness Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">{currentCycle ? currentCycle.label : 'All Cycles'} · Public View</p>
            </div>
            {loading ? <Spinner /> : !orgStats ? (
              <div className="text-center py-24">
                <div className="text-5xl mb-4">📊</div>
                <h2 className="text-xl font-bold text-gray-700 mb-2">No data yet</h2>
                <p className="text-gray-400 mb-6">Be the first to complete the assessment.</p>
                <Link to="/survey" className="inline-block px-8 py-3 rounded-xl font-bold text-white" style={{ background: '#00ADA9' }}>Start Assessment →</Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard label="Total Responses" value={orgStats.total} sub="submitted assessments" accent="#1B3A5C" />
                  <StatCard label="AI Maturity Score" value={`${orgStats.overallAvg}%`} sub="organisation average" accent="#00ADA9" />
                  <StatCard label="Maturity Level" value={`L${orgStats.maturityLevel}`} sub={MATURITY_LEVELS[orgStats.maturityLevel].label.replace(`Level ${orgStats.maturityLevel}: `, '')} accent={MATURITY_LEVELS[orgStats.maturityLevel].color} />
                  <StatCard label="Departments" value={deptStats.length} sub="with responses" accent="#6366F1" />
                </div>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>Organisation Radar</h2>
                    <p className="text-xs text-gray-400 mb-4">Average scores across all 5 pillars</p>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Inter' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 9 }} tickCount={5} />
                        <Radar name="Org Avg" dataKey="score" stroke="#00ADA9" fill="#00ADA9" fillOpacity={0.2} strokeWidth={2.5} />
                        <Tooltip formatter={v => [`${v}%`, 'Avg Score']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: 13 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>Score by Department</h2>
                    <p className="text-xs text-gray-400 mb-4">Average overall AI maturity score per department</p>
                    {barData.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-12">No department data</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={barData} margin={{ top: 24, right: 16, left: -20, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }} angle={-40} textAnchor="end" interval={0} height={70} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Inter' }} tickFormatter={v => `${v}%`} />
                          <Tooltip formatter={(v, _, props) => [`${v}% (${props.payload?.count} response${props.payload?.count !== 1 ? 's' : ''})`, props.payload?.fullName || 'Score']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: 12 }} />
                          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                            {barData.map((entry, i) => <Cell key={i} fill={entry.score >= 61 ? '#00ADA9' : entry.score >= 41 ? '#1B3A5C' : '#94A3B8'} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
                <div className="mb-6">
                  <h2 className="text-base font-bold mb-4" style={{ color: '#1B3A5C' }}>Pillar Breakdown</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {PILLARS.map((p, i) => <PillarCard key={p.id} pillar={p} avgPct={orgStats.pillarAvgPcts[i]} index={i} />)}
                  </div>
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
              <p className="text-gray-400 text-sm mt-1">Individual AI capability assessment results across your workforce</p>
            </div>
            {l2Loading ? <Spinner /> : l2Total === 0 ? <EmptyL2 /> : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatCard label="Total Responses" value={l2Total} sub="completed Part 2" accent="#1B3A5C" />
                  <StatCard label="Org Capability Level" value={orgCapLabel} sub="most common level" accent={CAP_COLOR[orgCapLabel] || '#1B3A5C'} />
                  <StatCard label="Avg Capability Score" value={`${avgCapPct}%`} sub="organisation average" accent="#00ADA9" />
                  <StatCard label="AI Champions" value={champCount} sub={`${l2Total ? Math.round(champCount / l2Total * 100) : 0}% of respondents`} accent="#3B6D11" />
                </div>

                {/* Panel 2: Distribution */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>Capability level distribution</h2>
                  <p className="text-xs text-gray-400 mb-3">Count of respondents by capability level</p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {CAPABILITY_LABELS.map(c => (
                      <div key={c.label} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: CAP_COLOR[c.label] || c.color }} />
                        <span className="text-xs text-gray-600">{c.label}</span>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={capDistData} layout="vertical" margin={{ top: 0, right: 40, left: 110, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Inter' }} />
                      <YAxis type="category" dataKey="label" width={110} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }} />
                      <Tooltip formatter={v => [v, 'Respondents']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: 12 }} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                        <LabelList dataKey="count" position="right" style={{ fill: '#1B3A5C', fontSize: 11, fontWeight: 700 }} />
                        {capDistData.map((entry, i) => <Cell key={i} fill={CAP_COLOR[entry.label] || '#94A3B8'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Panel 3: Dimension radar */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>Average scores across 5 capability dimensions</h2>
                  <p className="text-xs text-gray-400 mb-4">Organisation average per dimension (converted to %)</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={260}>
                      <RadarChart data={dimRadarData} cx="50%" cy="50%" outerRadius="65%">
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 8 }} tickCount={5} />
                        <Radar name="Avg" dataKey="score" stroke="#1B3A5C" fill="#00ADA9" fillOpacity={0.25} strokeWidth={2} />
                        <Tooltip formatter={v => [`${v}%`, 'Score']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: 12 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="space-y-3 self-center">
                      {DIM_LABELS.map((label, i) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{label}</span>
                            <span className="font-bold" style={{ color: '#00ADA9' }}>{dimAvgPcts[i]}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="h-2 rounded-full" style={{ width: `${dimAvgPcts[i]}%`, background: '#00ADA9' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Panel 4: Cap by dept */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>Average capability score by department</h2>
                  <p className="text-xs text-gray-400 mb-4">
                    <span style={{ color: '#E24B4A' }}>●</span> Below 50% &nbsp;
                    <span style={{ color: '#EF9F27' }}>●</span> 50–70% &nbsp;
                    <span style={{ color: '#00ADA9' }}>●</span> Above 70%
                  </p>
                  {capByDeptData.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No department data</p>
                  ) : (
                    <div style={{ height: capByDeptData.length * 40 + 80 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={capByDeptData} layout="vertical" margin={{ top: 0, right: 50, left: 140, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10, fontFamily: 'Inter' }} tickFormatter={v => `${v}%`} />
                          <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }} />
                          <Tooltip formatter={(v, _, props) => [`${v}%`, props.payload?.fullName || 'Score']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: 12 }} />
                          <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                            <LabelList dataKey="score" position="right" style={{ fill: '#1B3A5C', fontSize: 11, fontWeight: 700 }} formatter={v => `${v}%`} />
                            {capByDeptData.map((d, i) => <Cell key={i} fill={d.score >= 70 ? '#00ADA9' : d.score >= 50 ? '#EF9F27' : '#E24B4A'} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Panel 5: Learning needs */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>What your people need to learn</h2>
                  <p className="text-xs text-gray-400 mb-6">Primary learning focus areas — use this to prioritise your weekly learning time</p>
                  {learningData.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">No learning focus data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {learningData.map(({ focus, count }, i) => (
                        <div key={focus} className="flex items-center gap-4">
                          <div className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0" style={{ background: i === 0 ? '#00ADA9' : '#1B3A5C' }}>{i + 1}</div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-semibold text-gray-800">{focus}</span>
                              <span className="font-bold" style={{ color: '#00ADA9' }}>{count} staff</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className="h-2 rounded-full" style={{ width: `${Math.round(count / l2Total * 100)}%`, background: i === 0 ? '#00ADA9' : '#1B3A5C' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Panel 6: Champions by cluster */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>AI Champions identified</h2>
                  <p className="text-xs text-gray-400 mb-1">Grouped by role cluster — {champCount} total</p>
                  <p className="text-xs mb-4 font-medium" style={{ color: '#00ADA9' }}>These are your internal AI ambassadors — involve them in the habit change plan.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {['A','B','C','D','E'].map(cl => {
                      const cnt = champByCluster[cl] || 0
                      const clusterTotal = l2Rows.filter(r => r.cluster === cl).length
                      return (
                        <div key={cl} className="rounded-2xl p-4 border" style={{ borderColor: CLUSTER_COLOR[cl] + '44', background: CLUSTER_COLOR[cl] + '0A' }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center" style={{ background: CLUSTER_COLOR[cl] }}>{cl}</div>
                            <span className="text-lg font-black" style={{ color: CLUSTER_COLOR[cl] }}>{cnt}</span>
                          </div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">{CLUSTER_LABELS[cl]}</p>
                          <p className="text-xs text-gray-400">{clusterTotal} respondent{clusterTotal !== 1 ? 's' : ''}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Panel 7: Open texts */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>What staff say AI could help most</h2>
                  <p className="text-xs text-gray-400 mb-6">Direct input from your team on where AI adds value</p>
                  {openTexts.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">No open text responses yet</p>
                  ) : (
                    <div className="space-y-3">
                      {openTexts.map((t, i) => (
                        <div key={i} className="pl-4 py-3 pr-4 rounded-2xl bg-gray-50" style={{ borderLeft: '3px solid #00ADA9' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background: CLUSTER_COLOR[t.cluster] || '#1B3A5C' }}>Cluster {t.cluster}</span>
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
              <h1 className="text-2xl font-extrabold" style={{ color: '#1B3A5C' }}>Gap Analysis Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Comparing organisation strategy readiness vs individual capability</p>
            </div>
            {(loading || l2Loading) ? <Spinner /> : (l2Total === 0 || !orgStats) ? (
              <div className="space-y-4">
                {!orgStats && <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-gray-400">No organisation readiness data available yet.</div>}
                {l2Total === 0 && <EmptyL2 />}
              </div>
            ) : (
              <>
                {/* Panel 1: Critical gap */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
                  <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>The critical gap</h2>
                  <p className="text-xs text-gray-400 mb-6">Organisation readiness (Layer 1) vs individual capability (Layer 2)</p>
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="text-center flex-1">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Organisation Readiness</p>
                      <div className="text-5xl font-black" style={{ color: '#1B3A5C' }}>{orgReadinessAvg}%</div>
                      <p className="text-xs text-gray-400 mt-1">AI Maturity Score</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg" style={{ background: Math.abs(overallGap) > 20 ? '#EF4444' : '#22C55E' }}>
                        {overallGap > 0 ? '↓' : overallGap < 0 ? '↑' : '≈'}
                      </div>
                      <div className="text-sm font-bold text-gray-600">{Math.abs(overallGap)}pt gap</div>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Individual Capability</p>
                      <div className="text-5xl font-black" style={{ color: '#00ADA9' }}>{capAvg}%</div>
                      <p className="text-xs text-gray-400 mt-1">Capability Score</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Organisation Readiness</span><span>{orgReadinessAvg}%</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-4"><div className="h-4 rounded-full" style={{ width: `${orgReadinessAvg}%`, background: '#1B3A5C' }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Individual Capability</span><span>{capAvg}%</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-4"><div className="h-4 rounded-full" style={{ width: `${capAvg}%`, background: '#00ADA9' }} /></div>
                    </div>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: Math.abs(overallGap) > 20 ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${Math.abs(overallGap) > 20 ? '#FECACA' : '#BBF7D0'}` }}>
                    <p className="text-sm font-medium text-gray-700">{gapMsg}</p>
                  </div>
                </div>

                {/* Panel 2: Dept gap table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>Perception vs capability gap by department</h2>
                  <p className="text-xs text-gray-400 mb-6">Sorted by gap size — biggest first</p>
                  {deptGapRows.length === 0 ? (
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
                          {deptGapRows.map(row => {
                            let badgeText, badgeBg
                            if (row.gap > 20) { badgeText = 'Skills gap — urgent'; badgeBg = '#EF4444' }
                            else if (row.gap >= 10) { badgeText = 'Monitor'; badgeBg = '#F59E0B' }
                            else if (row.gap >= -10) { badgeText = 'Aligned'; badgeBg = '#00ADA9' }
                            else { badgeText = 'Capability ahead'; badgeBg = '#1B3A5C' }
                            return (
                              <tr key={row.dept} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="py-3 pr-4 font-medium text-gray-700">{row.dept}</td>
                                <td className="py-3 px-3 text-center font-bold" style={{ color: '#1B3A5C' }}>{row.orgPct}%</td>
                                <td className="py-3 px-3 text-center font-bold" style={{ color: '#00ADA9' }}>{row.capPct}%</td>
                                <td className="py-3 px-3 text-center font-bold" style={{ color: row.gap > 10 ? '#EF4444' : row.gap < -10 ? '#1B3A5C' : '#22C55E' }}>{row.gap > 0 ? '+' : ''}{row.gap}</td>
                                <td className="py-3 pl-3 text-center"><span className="text-xs font-bold text-white px-2 py-1 rounded-full" style={{ background: badgeBg }}>{badgeText}</span></td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Panel 3: Dual radar */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>Where the gaps are deepest</h2>
                  <p className="text-xs text-gray-400 mb-6">Organisation perception vs employee actual capability</p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold text-center text-gray-500 mb-2 uppercase tracking-wider">Organisation sees itself as...</p>
                      <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                          <PolarGrid stroke="#E5E7EB" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 8 }} tickCount={5} />
                          <Radar name="Org Readiness" dataKey="score" stroke="#1B3A5C" fill="#1B3A5C" fillOpacity={0.2} strokeWidth={2} />
                          <Tooltip formatter={v => [`${v}%`, 'Score']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: 12 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-center text-gray-500 mb-2 uppercase tracking-wider">Employees are actually at...</p>
                      <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={dimRadarData} cx="50%" cy="50%" outerRadius="65%">
                          <PolarGrid stroke="#E5E7EB" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 8 }} tickCount={5} />
                          <Radar name="Capability" dataKey="score" stroke="#00ADA9" fill="#00ADA9" fillOpacity={0.2} strokeWidth={2} />
                          <Tooltip formatter={v => [`${v}%`, 'Score']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontSize: 12 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Panel 4: Priority flags + roadmap button */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>What this means for your roadmap</h2>
                  <p className="text-xs text-gray-400 mb-6">Auto-generated priority flags based on your assessment data</p>
                  <div className="space-y-4 mb-8">
                    {topFlags.filter(Boolean).map((flag, i) => (
                      <div key={i} className="rounded-2xl p-5" style={{ borderLeft: '4px solid #EF4444', background: '#FEF2F2' }}>
                        <p className="font-bold text-gray-800 text-sm mb-1">{flag.title}</p>
                        <p className="text-sm text-gray-600">{flag.action}</p>
                      </div>
                    ))}
                    {topFlags.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Not enough data to generate flags yet</p>}
                  </div>
                  <button onClick={handleGenerateRoadmap} className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #1B3A5C, #00ADA9)' }}>
                    Generate full roadmap from this data ↗
                  </button>
                </div>
              </>
            )}
          </>
        )}

      </main>

      <footer className="border-t border-gray-100 py-6 mt-8" style={{ background: '#0f2236' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-white/40 text-sm">© {new Date().getFullYear()} PEOPLElogy AI Readiness Assessment</span>
          <Link to="/admin" className="text-white/40 text-sm hover:text-teal-400 transition-colors">Admin Dashboard</Link>
        </div>
      </footer>
    </div>
  )
}
