// Landing page — route: /
// Entry point of the PEOPLElogy AI Readiness Assessment
import { useNavigate } from 'react-router-dom'

const FEATURES = [
  {
    icon: '🎯',
    title: '5-Pillar Framework',
    desc: 'Covers Strategy, Data, People, Processes, and Governance — the full AI readiness spectrum.',
  },
  {
    icon: '📊',
    title: 'Instant Benchmarking',
    desc: 'Get your AI Maturity Score immediately and see how your department compares.',
  },
  {
    icon: '🔒',
    title: 'Semi-Anonymous',
    desc: 'Only your first name and department are collected — no email required.',
  },
  {
    icon: '⏱️',
    title: '15–20 Minutes',
    desc: '60 scored questions across 5 pillars plus optional open-text insights.',
  },
]

const PILLARS = [
  { num: '01', name: 'Strategy & Leadership' },
  { num: '02', name: 'Data & Technology Infrastructure' },
  { num: '03', name: 'People & Workforce Skills' },
  { num: '04', name: 'Processes & AI Use Cases' },
  { num: '05', name: 'Governance, Risk & Responsible AI' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white font-inter">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-navy-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-extrabold text-lg leading-none">P</span>
            </div>
            <span className="font-bold text-xl tracking-tight">
              PEOPLE<span className="text-teal-400">logy</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
            <a href="/dashboard" className="hover:text-teal-400 transition-colors">
              Organisation Dashboard
            </a>
            <a href="/admin" className="hover:text-teal-400 transition-colors">
              Admin
            </a>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #0f2236 60%, #00ADA9 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#00ADA9', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: '#00ADA9', transform: 'translate(-30%, 30%)' }} />

        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-white/80 text-sm font-medium">
              AI Transformation Assessment
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
            AI Transformation —{' '}
            <span className="text-teal-400">Know Where You Stand</span>
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Benchmark your organisation's AI readiness across 5 critical pillars.
            Get your personalised AI Maturity Score and actionable insights in
            under 20 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/survey')}
              className="px-10 py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: '#00ADA9' }}
            >
              Start Assessment →
            </button>
            <a
              href="/dashboard"
              className="px-10 py-4 rounded-xl font-bold text-lg bg-white/10 border border-white/25 text-white hover:bg-white/20 transition-all"
            >
              View Dashboard
            </a>
          </div>

          <p className="mt-6 text-white/40 text-sm">
            Semi-anonymous · No email required · Results available immediately
          </p>
        </div>
      </section>

      {/* ── Feature cards ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-navy-800" style={{ color: '#1B3A5C' }}>
            Why take the assessment?
          </h2>
          <p className="text-gray-500 mt-3 text-lg">
            Designed for organisations serious about AI transformation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pillars ────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold" style={{ color: '#1B3A5C' }}>
              The 5-Pillar Framework
            </h2>
            <p className="text-gray-500 mt-3 text-lg">
              12 scored questions per pillar — 60 questions total
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PILLARS.map((p, i) => (
              <div
                key={p.num}
                className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-teal-200 transition-all hover:-translate-y-1"
              >
                <div
                  className="text-4xl font-black mb-3 opacity-20"
                  style={{ color: '#00ADA9' }}
                >
                  {p.num}
                </div>
                <p className="font-semibold text-gray-800 text-sm leading-snug">
                  {p.name}
                </p>
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl"
                  style={{
                    background: `hsl(${180 - i * 25}, 70%, ${45 + i * 5}%)`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Maturity scale ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold" style={{ color: '#1B3A5C' }}>
            AI Maturity Scale
          </h2>
          <p className="text-gray-500 mt-3">Where does your organisation stand?</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {[
            { level: 1, label: 'Awareness', pct: '0–20%', color: '#EF4444' },
            { level: 2, label: 'Exploration', pct: '21–40%', color: '#F97316' },
            { level: 3, label: 'Operational', pct: '41–60%', color: '#EAB308' },
            { level: 4, label: 'Integrated', pct: '61–80%', color: '#22C55E' },
            { level: 5, label: 'AI-Driven Enterprise', pct: '81–100%', color: '#00ADA9' },
          ].map((m) => (
            <div
              key={m.level}
              className="flex-1 rounded-2xl p-5 text-white text-center"
              style={{ background: m.color }}
            >
              <div className="text-3xl font-black opacity-50 mb-1">L{m.level}</div>
              <div className="font-bold text-sm mb-1">{m.label}</div>
              <div className="text-xs opacity-75">{m.pct}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section
        className="py-20 text-center"
        style={{ background: 'linear-gradient(135deg, #1B3A5C, #00ADA9)' }}
      >
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to assess your AI readiness?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Takes 15–20 minutes. Get your personalised score instantly.
          </p>
          <button
            onClick={() => navigate('/survey')}
            className="px-12 py-4 rounded-xl font-bold text-lg bg-white text-navy-800 hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-xl"
            style={{ color: '#1B3A5C' }}
          >
            Begin Assessment →
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-navy-900 py-8" style={{ background: '#0f2236' }}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-500 rounded-md flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">P</span>
            </div>
            <span className="text-white font-bold">
              PEOPLE<span className="text-teal-400">logy</span>
            </span>
          </div>
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} PEOPLElogy. AI Readiness Assessment Platform.
          </p>
          <div className="flex gap-4 text-white/40 text-sm">
            <a href="/dashboard" className="hover:text-teal-400 transition-colors">Dashboard</a>
            <a href="/admin" className="hover:text-teal-400 transition-colors">Admin</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
