// Individual Results page — route: /complete
// Shows personalised AI Maturity Score + radar chart after survey submission
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { PILLARS, MATURITY_LEVELS, pillarPct } from '../lib/surveyData'

// Short pillar names for chart
const PILLAR_SHORT = [
  'Strategy',
  'Data & Tech',
  'People',
  'Processes',
  'Governance',
]

// Maturity level badge colours
function MaturityBadge({ level }) {
  const ml = MATURITY_LEVELS[level]
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold text-sm"
      style={{ background: ml.color }}
    >
      <span className="text-lg font-black">L{level}</span>
      {ml.label.replace(`Level ${level}: `, '')}
    </div>
  )
}

// Score ring component
function ScoreRing({ pct, size = 160 }) {
  const r = (size - 20) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <svg width={size} height={size}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#E5E7EB" strokeWidth="12"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="#00ADA9"
        strokeWidth="12"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text
        x={size / 2} y={size / 2 + 6}
        textAnchor="middle"
        fontSize="28"
        fontWeight="800"
        fill="#1B3A5C"
      >
        {pct}%
      </text>
    </svg>
  )
}

export default function Complete() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state

  // Guard: if no state, redirect home
  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-inter">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No results found. Please complete the assessment first.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl text-white font-bold"
            style={{ background: '#00ADA9' }}
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const { firstName, department, pillarScores, overallScore, maturityLevel } = state
  const ml = MATURITY_LEVELS[maturityLevel]

  // Build radar chart data
  const radarData = PILLARS.map((p, i) => ({
    subject: PILLAR_SHORT[i],
    score: pillarPct(pillarScores[i]),
    fullMark: 100,
  }))

  // Pillar breakdown
  const pillarCards = PILLARS.map((p, i) => ({
    name: p.name,
    score: pillarScores[i],
    pct: pillarPct(pillarScores[i]),
    color: p.color,
  }))

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#00ADA9' }}>
              <span className="text-white font-extrabold text-base leading-none">P</span>
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: '#1B3A5C' }}>
              PEOPLE<span style={{ color: '#00ADA9' }}>logy</span>
            </span>
          </Link>
          <span className="text-sm text-gray-400">Assessment Complete</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero result card */}
        <div
          className="rounded-3xl overflow-hidden shadow-lg mb-8"
          style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #0f2236 100%)' }}
        >
          <div className="p-8 md:p-12">
            {/* Confetti-style top line */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-white mb-6"
              style={{ background: 'rgba(0,173,169,0.3)', border: '1px solid rgba(0,173,169,0.4)' }}
            >
              ✓ Assessment Complete
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Left: Info */}
              <div className="flex-1 text-white">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
                  Well done, {firstName}!
                </h1>
                <p className="text-white/60 mb-6 text-lg">{department}</p>

                <div className="mb-6">
                  <MaturityBadge level={maturityLevel} />
                </div>

                <p className="text-white/75 leading-relaxed text-sm max-w-md">
                  {ml.description}
                </p>
              </div>

              {/* Right: Score ring */}
              <div className="flex flex-col items-center gap-3">
                <ScoreRing pct={overallScore} size={160} />
                <p className="text-white/50 text-sm font-medium">
                  Overall AI Maturity Score
                </p>
              </div>
            </div>
          </div>

          {/* Pillar score strip */}
          <div className="grid grid-cols-5 divide-x divide-white/10 bg-white/5">
            {pillarCards.map((pc) => (
              <div key={pc.name} className="py-4 px-3 text-center">
                <div
                  className="text-lg font-bold text-white mb-0.5"
                >
                  {pc.pct}%
                </div>
                <div className="text-white/40 text-xs leading-tight hidden sm:block">
                  {PILLAR_SHORT[PILLARS.findIndex(p => p.name === pc.name)]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column: radar + pillar breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Radar chart */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold mb-4" style={{ color: '#1B3A5C' }}>
              Your Pillar Radar
            </h2>
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
                  name="Score"
                  dataKey="score"
                  stroke="#00ADA9"
                  fill="#00ADA9"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Score']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontFamily: 'Inter',
                    fontSize: 13,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Pillar breakdown */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold mb-4" style={{ color: '#1B3A5C' }}>
              Pillar Breakdown
            </h2>
            <div className="space-y-4">
              {pillarCards.map((pc, i) => (
                <div key={pc.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700">
                      P{i + 1}. {PILLAR_SHORT[i]}
                    </span>
                    <span className="font-bold" style={{ color: pc.color }}>
                      {pc.pct}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${pc.pct}%`, background: pc.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Score legend */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
                Maturity Scale
              </p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(l => (
                  <div
                    key={l}
                    className="flex-1 h-5 rounded-full text-center text-white text-xs font-bold leading-5"
                    style={{
                      background: MATURITY_LEVELS[l].color,
                      opacity: l === maturityLevel ? 1 : 0.3,
                    }}
                  >
                    L{l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Maturity description */}
        <div
          className="rounded-3xl p-6 mb-8 text-white"
          style={{ background: `linear-gradient(135deg, ${ml.color}CC, ${ml.color})` }}
        >
          <div className="flex items-start gap-4">
            <div className="text-4xl font-black opacity-30">L{maturityLevel}</div>
            <div>
              <h3 className="font-bold text-lg mb-2">{ml.label}</h3>
              <p className="text-white/80 text-sm leading-relaxed">{ml.description}</p>
              <p className="text-white/50 text-xs mt-3">Score range: {ml.range}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 sm:flex-none px-10 py-4 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 shadow-md text-center"
            style={{ background: '#1B3A5C' }}
          >
            View Organisation Dashboard →
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 sm:flex-none px-10 py-4 rounded-xl font-bold text-base transition-all hover:bg-gray-100 border border-gray-200 text-gray-600 text-center"
          >
            Return to Home
          </button>
        </div>
      </main>
    </div>
  )
}
