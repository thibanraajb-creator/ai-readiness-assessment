// Public Dashboard — route: /dashboard
// Organisation-wide AI readiness overview, visible to all respondents
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts'
import {
  fetchResponses, fetchCycles,
  computeOrgStats, computeDeptStats,
  PILLAR_SHORT,
} from '../lib/dashboardUtils'
import { PILLARS, MATURITY_LEVELS } from '../lib/surveyData'

// ── Shared UI components ──────────────────────────────────

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

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <span className="text-3xl font-extrabold" style={{ color: accent || '#1B3A5C' }}>{value}</span>
      {sub && <span className="text-sm text-gray-400">{sub}</span>}
    </div>
  )
}

function PillarCard({ pillar, avgPct, index }) {
  const ml = Object.values(MATURITY_LEVELS).find(
    (m, i) => {
      const ranges = [[0,20],[21,40],[41,60],[61,80],[81,100]]
      return avgPct >= ranges[i][0] && avgPct <= ranges[i][1]
    }
  )
  // Simple level computation
  const level = avgPct <= 20 ? 1 : avgPct <= 40 ? 2 : avgPct <= 60 ? 3 : avgPct <= 80 ? 4 : 5
  const levelInfo = MATURITY_LEVELS[level]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
            Pillar {index + 1}
          </p>
          <p className="text-sm font-bold text-gray-800">{pillar.name}</p>
        </div>
        <div
          className="text-xl font-extrabold"
          style={{ color: pillar.color }}
        >
          {avgPct}%
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div
          className="h-2 rounded-full"
          style={{ width: `${avgPct}%`, background: pillar.color }}
        />
      </div>

      <span
        className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full text-white"
        style={{ background: levelInfo.color }}
      >
        {levelInfo.label}
      </span>
    </div>
  )
}

// ── Custom bar label ──────────────────────────────────────
function CustomBarLabel({ x, y, width, value }) {
  return (
    <text x={x + width / 2} y={y - 6} fill="#6B7280" textAnchor="middle" fontSize={11}>
      {value}%
    </text>
  )
}

// ── Main component ────────────────────────────────────────
export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cycles, setCycles] = useState([])
  const [selectedCycleId, setSelectedCycleId] = useState(null)
  const [responses, setResponses] = useState([])
  const [orgStats, setOrgStats] = useState(null)
  const [deptStats, setDeptStats] = useState([])

  // Load cycles on mount
  useEffect(() => {
    fetchCycles()
      .then((data) => {
        setCycles(data)
        const active = data.find((c) => c.is_active) || data[data.length - 1]
        if (active) setSelectedCycleId(active.id)
      })
      .catch((err) => setError(err.message))
  }, [])

  // Load responses when cycle changes
  useEffect(() => {
    if (selectedCycleId === null && cycles.length === 0) return
    setLoading(true)
    fetchResponses(selectedCycleId)
      .then((data) => {
        setResponses(data)
        setOrgStats(computeOrgStats(data))
        setDeptStats(computeDeptStats(data))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedCycleId])

  // Radar data
  const radarData = orgStats
    ? PILLARS.map((p, i) => ({
        subject: PILLAR_SHORT[i],
        score: orgStats.pillarAvgPcts[i],
        fullMark: 100,
      }))
    : []

  // Bar chart data (all departments, sorted)
  const barData = deptStats.map((d) => ({
    name: d.dept.length > 16 ? d.dept.substring(0, 14) + '…' : d.dept,
    fullName: d.dept,
    score: d.overall,
    count: d.count,
  }))

  const currentCycle = cycles.find((c) => c.id === selectedCycleId)

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            {/* Cycle selector */}
            {cycles.length > 0 && (
              <select
                value={selectedCycleId || ''}
                onChange={(e) => setSelectedCycleId(Number(e.target.value))}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none"
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            )}
            <Link
              to="/survey"
              className="px-4 py-2 rounded-xl text-sm font-bold text-white hidden md:inline-flex"
              style={{ background: '#00ADA9' }}
            >
              Take Assessment
            </Link>
            <Link
              to="/admin"
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold" style={{ color: '#1B3A5C' }}>
            Organisation AI Readiness Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {currentCycle ? currentCycle.label : 'All Cycles'} · Public View
          </p>
        </div>

        {/* ── Error / Loading ──────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 text-red-700">
            <p className="font-semibold">Failed to load data</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs mt-2 text-red-400">
              Ensure your Supabase credentials are configured in .env and the schema has been applied.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div
              className="w-12 h-12 rounded-full border-4 animate-spin"
              style={{ borderColor: '#00ADA9', borderTopColor: 'transparent' }}
            />
          </div>
        ) : !orgStats ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No data yet</h2>
            <p className="text-gray-400 mb-6">Be the first to complete the assessment.</p>
            <Link
              to="/survey"
              className="inline-block px-8 py-3 rounded-xl font-bold text-white"
              style={{ background: '#00ADA9' }}
            >
              Start Assessment →
            </Link>
          </div>
        ) : (
          <>
            {/* ── Top stats ────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Responses"
                value={orgStats.total}
                sub="submitted assessments"
                accent="#1B3A5C"
              />
              <StatCard
                label="AI Maturity Score"
                value={`${orgStats.overallAvg}%`}
                sub="organisation average"
                accent="#00ADA9"
              />
              <StatCard
                label="Maturity Level"
                value={`L${orgStats.maturityLevel}`}
                sub={MATURITY_LEVELS[orgStats.maturityLevel].label.replace(`Level ${orgStats.maturityLevel}: `, '')}
                accent={MATURITY_LEVELS[orgStats.maturityLevel].color}
              />
              <StatCard
                label="Departments"
                value={deptStats.length}
                sub="with responses"
                accent="#6366F1"
              />
            </div>

            {/* ── Charts row ───────────────────────────────── */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Org radar */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>
                  Organisation Radar
                </h2>
                <p className="text-xs text-gray-400 mb-4">Average scores across all 5 pillars</p>
                <ResponsiveContainer width="100%" height={280}>
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
                        fontFamily: 'Inter', fontSize: 13,
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Department bar chart */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold mb-1" style={{ color: '#1B3A5C' }}>
                  Score by Department
                </h2>
                <p className="text-xs text-gray-400 mb-4">
                  Average overall AI maturity score per department
                </p>
                {barData.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-12">No department data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
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
                      <Bar dataKey="score" radius={[6, 6, 0, 0]} label={<CustomBarLabel />}>
                        {barData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.score >= 61 ? '#00ADA9' : entry.score >= 41 ? '#1B3A5C' : '#94A3B8'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Pillar breakdown cards ────────────────────── */}
            <div className="mb-6">
              <h2 className="text-base font-bold mb-4" style={{ color: '#1B3A5C' }}>
                Pillar Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {PILLARS.map((p, i) => (
                  <PillarCard
                    key={p.id}
                    pillar={p}
                    avgPct={orgStats.pillarAvgPcts[i]}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 mt-8" style={{ background: '#0f2236' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-white/40 text-sm">
            © {new Date().getFullYear()} PEOPLElogy AI Readiness Assessment
          </span>
          <Link to="/admin" className="text-white/40 text-sm hover:text-teal-400 transition-colors">
            Admin Dashboard
          </Link>
        </div>
      </footer>
    </div>
  )
}
