// Individual Results page — route: /complete
// Shows Layer 1 org readiness + Layer 2 personal capability + gap analysis
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
import { DIMENSIONS, CAPABILITY_LABELS } from '../lib/layer2Data'

const PILLAR_SHORT = ['Strategy', 'Data & Tech', 'People', 'Processes', 'Governance']

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

function ScoreRing({ pct, size = 140, color = '#00ADA9' }) {
  const r = (size - 20) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth="12" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
      <text
        x={size/2} y={size/2 + 6}
        textAnchor="middle" fontSize="26" fontWeight="800" fill="#1B3A5C"
      >
        {pct}%
      </text>
    </svg>
  )
}

function DimBar({ label, pct, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className="h-2.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function Complete() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state

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

  const { firstName, department, clusterLabel, pillarScores, overallScore, maturityLevel, layer2 } = state
  const ml = MATURITY_LEVELS[maturityLevel]

  const radarData = PILLARS.map((p, i) => ({
    subject: PILLAR_SHORT[i],
    score: pillarPct(pillarScores[i]),
    fullMark: 100,
  }))

  const pillarCards = PILLARS.map((p, i) => ({
    name: p.name,
    pct: pillarPct(pillarScores[i]),
    color: p.color,
  }))

  // Layer 2 dimension bars (each score out of 4 → %)
  const dimKeys = ['d1','d2','d3','d4','d5']
  const dimLabels = Object.values(DIMENSIONS)
  const dimColors = ['#00ADA9','#1B3A5C','#7C3AED','#059669','#DC2626']
  const dimBars = layer2
    ? dimKeys.map((k, i) => ({
        label: dimLabels[i],
        pct: Math.round((layer2[k] / 4) * 100),
        color: dimColors[i],
      }))
    : []

  // Gap analysis
  let gapMessage = null
  let gapColor = '#22C55E'
  let gapIcon = '≈'
  if (layer2) {
    const diff = overallScore - layer2.overallPct
    if (diff > 20) {
      gapMessage = 'Your organisation may be further ahead than your personal toolkit. Investing in personal AI skills development will help you keep pace with organisational ambitions.'
      gapColor = '#F97316'
      gapIcon = '↑'
    } else if (diff < -20) {
      gapMessage = 'You are ahead of the organisation — your personal AI capability exceeds the current organisational maturity. You could play a key role in driving adoption.'
      gapColor = '#00ADA9'
      gapIcon = '★'
    } else {
      gapMessage = 'You are well aligned with your organisation\'s AI maturity. Your personal capability mirrors where the organisation currently stands.'
      gapColor = '#22C55E'
      gapIcon = '✓'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
          <span className="text-sm text-gray-400">Assessment Complete</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">

        {/* ── Hero banner ── */}
        <div
          className="rounded-3xl overflow-hidden shadow-lg"
          style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #0f2236 100%)' }}
        >
          <div className="p-8 md:p-12">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-white mb-6"
              style={{ background: 'rgba(0,173,169,0.3)', border: '1px solid rgba(0,173,169,0.4)' }}
            >
              ✓ Assessment Complete
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-1">
              Well done, {firstName}!
            </h1>
            <p className="text-white/50 text-sm">
              {department}{clusterLabel ? ` · ${clusterLabel}` : ''}
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 1 — Organisation Readiness (Layer 1)
        ══════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ background: '#1B3A5C' }}
            >1</div>
            <h2 className="text-xl font-extrabold" style={{ color: '#1B3A5C' }}>
              Organisation AI Readiness
            </h2>
          </div>

          {/* Score + badge row */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-4">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing pct={overallScore} size={140} color="#00ADA9" />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-gray-400 mb-2 font-medium uppercase tracking-wider">
                  Overall AI Maturity Score
                </p>
                <div className="mb-4">
                  <MaturityBadge level={maturityLevel} />
                </div>
                <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                  {ml.description}
                </p>
              </div>
            </div>
          </div>

          {/* Radar + pillar breakdown */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold mb-3" style={{ color: '#1B3A5C' }}>Pillar Radar</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#6B7280', fontSize: 10, fontFamily: 'Inter' }}
                  />
                  <PolarRadiusAxis
                    angle={90} domain={[0, 100]}
                    tick={{ fill: '#9CA3AF', fontSize: 8 }} tickCount={5}
                  />
                  <Radar
                    name="Score" dataKey="score"
                    stroke="#00ADA9" fill="#00ADA9" fillOpacity={0.25} strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Score']}
                    contentStyle={{ borderRadius:'12px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', fontFamily:'Inter', fontSize:12 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold mb-4" style={{ color: '#1B3A5C' }}>Pillar Breakdown</h3>
              <div className="space-y-3">
                {pillarCards.map((pc, i) => (
                  <div key={pc.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">P{i+1}. {PILLAR_SHORT[i]}</span>
                      <span className="font-bold" style={{ color: pc.color }}>{pc.pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pc.pct}%`, background: pc.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {/* Maturity scale */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Maturity Scale</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(l => (
                    <div
                      key={l}
                      className="flex-1 h-5 rounded-full text-center text-white text-xs font-bold leading-5"
                      style={{ background: MATURITY_LEVELS[l].color, opacity: l === maturityLevel ? 1 : 0.25 }}
                    >L{l}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SECTION 2 — Personal AI Capability (Layer 2)
        ══════════════════════════════════════════════════════ */}
        {layer2 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: '#7C3AED' }}
              >2</div>
              <h2 className="text-xl font-extrabold" style={{ color: '#1B3A5C' }}>
                Your Personal AI Capability
              </h2>
            </div>

            {/* Score + label card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-4">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreRing pct={layer2.overallPct} size={140} color={layer2.capabilityColor} />
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm text-gray-400 mb-2 font-medium uppercase tracking-wider">
                    Personal Capability Score
                  </p>
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold text-sm mb-3"
                    style={{ background: layer2.capabilityColor }}
                  >
                    {layer2.capabilityLabel}
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-md">
                    {clusterLabel && (
                      <span className="block font-medium text-gray-700 mb-1">
                        Role group: {clusterLabel}
                      </span>
                    )}
                    Your primary learning focus is{' '}
                    <strong>{layer2.learningFocus}</strong>.
                    {layer2.secondaryFocus && (
                      <> Developing <strong>{layer2.secondaryFocus}</strong> will further accelerate your capabilities.</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Dimension bars */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold mb-4" style={{ color: '#1B3A5C' }}>
                Capability Dimensions
              </h3>
              <div className="space-y-4">
                {dimBars.map((d) => (
                  <DimBar key={d.label} label={d.label} pct={d.pct} color={d.color} />
                ))}
              </div>

              {/* Capability scale legend */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Capability Scale</p>
                <div className="flex gap-1 flex-wrap">
                  {CAPABILITY_LABELS.map(({ label, color }) => (
                    <div
                      key={label}
                      className="flex-1 min-w-0 h-5 rounded-full text-center text-white text-xs font-bold leading-5 px-1 truncate"
                      style={{
                        background: color,
                        opacity: label === layer2.capabilityLabel ? 1 : 0.25,
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════
            SECTION 3 — Gap Analysis
        ══════════════════════════════════════════════════════ */}
        {layer2 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: '#059669' }}
              >3</div>
              <h2 className="text-xl font-extrabold" style={{ color: '#1B3A5C' }}>
                Alignment Gap
              </h2>
            </div>

            <div
              className="rounded-3xl p-6"
              style={{ background: `${gapColor}15`, border: `2px solid ${gapColor}40` }}
            >
              {/* Visual comparison */}
              <div className="flex items-center gap-4 mb-6">
                {/* Org score */}
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                    Organisation Readiness
                  </p>
                  <div className="text-4xl font-black" style={{ color: '#00ADA9' }}>
                    {overallScore}%
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-1">
                    {ml.label.replace(`Level ${maturityLevel}: `, '')}
                  </div>
                </div>

                {/* Gap indicator */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl font-black shadow"
                    style={{ background: gapColor }}
                  >
                    {gapIcon}
                  </div>
                  <div className="text-xs font-bold" style={{ color: gapColor }}>
                    {Math.abs(overallScore - layer2.overallPct)}pt gap
                  </div>
                </div>

                {/* Personal score */}
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
                    Personal Capability
                  </p>
                  <div className="text-4xl font-black" style={{ color: layer2.capabilityColor }}>
                    {layer2.overallPct}%
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-1">
                    {layer2.capabilityLabel}
                  </div>
                </div>
              </div>

              {/* Dual progress bars */}
              <div className="space-y-3 mb-5">
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                    <span>Organisation Readiness</span>
                    <span>{overallScore}%</span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-700"
                      style={{ width: `${overallScore}%`, background: '#00ADA9' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                    <span>Personal Capability</span>
                    <span>{layer2.overallPct}%</span>
                  </div>
                  <div className="w-full bg-white/60 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-700"
                      style={{ width: `${layer2.overallPct}%`, background: layer2.capabilityColor }}
                    />
                  </div>
                </div>
              </div>

              {/* Interpretation */}
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.6)' }}
              >
                <p className="text-sm font-medium" style={{ color: '#1B3A5C' }}>
                  {gapMessage}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2 pb-6">
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
