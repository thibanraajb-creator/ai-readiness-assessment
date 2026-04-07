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
  computeOrgStats, computeDeptStats, computeTrend,
  PILLAR_SHORT, PILLAR_KEYS,
} from '../lib/dashboardUtils'
import { PILLARS, MATURITY_LEVELS, DEPARTMENTS } from '../lib/surveyData'

const ADMIN_PIN = '123456'

// ── Logo ──────────────────────────────────────────────────
function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#00ADA9' }}>
        <span className="text-white font-extrabold text-base leading-none">P</span>
      </div>
      <span className="font-bold text-lg tracking-tight" style={{ color: '#1B3A5C' }}>
        PEOPLE<span style={{ color: '#00ADA9' }}>logy</span>
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

// ── CSV Export ────────────────────────────────────────────
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

  // Data
  const [allResponses, setAllResponses] = useState([])
  const [cycles, setCycles] = useState([])
  const [qualData, setQualData] = useState([])
  const [headcounts, setHeadcounts] = useState({})

  // Filters
  const [selectedCycleId, setSelectedCycleId] = useState(null)
  const [filterDept, setFilterDept] = useState('')

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
      const [cyc, allResp, qual] = await Promise.all([
        fetchCycles(),
        fetchResponses(null),  // all cycles
        fetchQualitative(),
      ])
      setCycles(cyc)
      setAllResponses(allResp)
      setQualData(qual)

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
  }, [allResponses, selectedCycleId, filterDept])

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

            {/* Export buttons */}
            <button
              onClick={() => exportCSV(allResponses)}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 flex items-center gap-2"
            >
              📥 CSV
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

      {/* Main report content (captured for PDF) */}
      <div ref={reportRef}>
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold" style={{ color: '#1B3A5C' }}>
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Full analytics view · {filterDept || 'All Departments'} ·{' '}
              {cycles.find((c) => c.id === selectedCycleId)?.label || 'All Cycles'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-red-700">
              <p className="font-semibold">Failed to load data</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div
                className="w-12 h-12 rounded-full border-4 animate-spin"
                style={{ borderColor: '#00ADA9', borderTopColor: 'transparent' }}
              />
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
