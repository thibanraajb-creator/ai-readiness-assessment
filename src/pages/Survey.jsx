// Survey page — route: /survey
// Layer 1: 5-pillar org readiness (60 questions) → Transition → Layer 2: individual capability (10 questions)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  PILLARS,
  DEPARTMENTS,
  computeOverallScore,
  getMaturityLevel,
  pillarPct,
} from '../lib/surveyData'
import {
  getCluster,
  CLUSTER_LABELS,
  CLUSTER_QUESTIONS,
  computeLayer2Scores,
  scoreMultiSelect,
  scoreOpenText,
} from '../lib/layer2Data'

// ── Likert scale labels ────────────────────────────────────
const LIKERT = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
]

// ── Step identifiers ───────────────────────────────────────
const STEP_INTRO = 'intro'
const STEP_PILLAR = 'pillar'
const STEP_QUAL = 'qual'
const STEP_TRANSITION = 'transition'   // bridge between Layer 1 and Layer 2
const STEP_L2 = 'layer2'              // Layer 2 individual questions
const STEP_SUBMITTING = 'submitting'

// ── Logo component (reused) ────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center" style={{ background: '#00ADA9' }}>
        <span className="text-white font-extrabold text-base leading-none">P</span>
      </div>
      <span className="font-bold text-lg tracking-tight" style={{ color: '#1B3A5C' }}>
        PEOPLE<span style={{ color: '#00ADA9' }}>logy</span>
      </span>
    </div>
  )
}

export default function Survey() {
  const navigate = useNavigate()

  // ── Respondent info ──────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [department, setDepartment] = useState('')
  const [introError, setIntroError] = useState('')

  // ── Navigation state ─────────────────────────────────────
  const [step, setStep] = useState(STEP_INTRO)
  const [pillarIndex, setPillarIndex] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)

  // ── Layer 1 answers ───────────────────────────────────────
  const [pillarAnswers, setPillarAnswers] = useState(
    PILLARS.map((p) => Array(p.questions.length).fill(null))
  )
  const [qualAnswers, setQualAnswers] = useState(
    PILLARS.map(() => ['', '', ''])
  )

  // ── Layer 2 state ─────────────────────────────────────────
  const [l2QuestionIndex, setL2QuestionIndex] = useState(0)
  // answers: index for single_select, array of strings for multi_select, string for open_text
  const [l2Answers, setL2Answers] = useState(Array(10).fill(null))
  // Layer 1 submission result (needed to link Layer 2)
  const [l1ResponseId, setL1ResponseId] = useState(null)
  const [l1CycleId, setL1CycleId] = useState(1)
  const [l1Scores, setL1Scores] = useState(null)

  const [submitError, setSubmitError] = useState('')

  // ── Derived: cluster ──────────────────────────────────────
  const cluster = department ? getCluster(department) : 'E'
  const clusterLabel = CLUSTER_LABELS[cluster]
  const l2Questions = CLUSTER_QUESTIONS[cluster] || []

  // ── Derived state ────────────────────────────────────────
  const currentPillar = PILLARS[pillarIndex]
  const totalPillarQuestions = currentPillar.questions.length  // always 12

  // Total question progress across all pillars (scored only)
  const totalScored = PILLARS.length * 12
  const answeredScored = pillarAnswers.reduce(
    (acc, arr) => acc + arr.filter((v) => v !== null).length,
    0
  )

  // ── Handlers ─────────────────────────────────────────────
  function handleIntroNext() {
    if (!firstName.trim()) {
      setIntroError('Please enter your first name.')
      return
    }
    if (!department) {
      setIntroError('Please select your department.')
      return
    }
    setIntroError('')
    setStep(STEP_PILLAR)
    setPillarIndex(0)
    setQuestionIndex(0)
  }

  function handleAnswer(value) {
    const updated = pillarAnswers.map((arr, pi) =>
      pi === pillarIndex
        ? arr.map((v, qi) => (qi === questionIndex ? value : v))
        : arr
    )
    setPillarAnswers(updated)

    // Auto-advance after a short delay
    setTimeout(() => {
      if (questionIndex < totalPillarQuestions - 1) {
        setQuestionIndex(questionIndex + 1)
      } else {
        // All scored questions for this pillar done → qualitative
        setStep(STEP_QUAL)
      }
    }, 280)
  }

  function handlePrevQuestion() {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1)
    } else if (pillarIndex > 0) {
      // Go back to previous pillar's qual section
      setPillarIndex(pillarIndex - 1)
      setStep(STEP_QUAL)
    }
  }

  function handleQualChange(qIdx, value) {
    const updated = qualAnswers.map((arr, pi) =>
      pi === pillarIndex
        ? arr.map((v, qi) => (qi === qIdx ? value : v))
        : arr
    )
    setQualAnswers(updated)
  }

  function handleQualNext() {
    if (pillarIndex < PILLARS.length - 1) {
      setPillarIndex(pillarIndex + 1)
      setQuestionIndex(0)
      setStep(STEP_PILLAR)
    } else {
      // Layer 1 complete — save to Supabase then show transition screen
      handleLayer1Submit()
    }
  }

  function handleQualBack() {
    // Go back to last scored question of this pillar
    setStep(STEP_PILLAR)
    setQuestionIndex(totalPillarQuestions - 1)
  }

  // ── Layer 1 submit: save to Supabase, then show transition ──
  async function handleLayer1Submit() {
    setStep(STEP_SUBMITTING)
    setSubmitError('')

    const pillarScores = pillarAnswers.map((arr) =>
      arr.reduce((a, b) => a + (b || 0), 0)
    )
    const overallScore = computeOverallScore(pillarScores)
    const maturityLevel = getMaturityLevel(overallScore)

    const questionCols = {}
    PILLARS.forEach((pillar, pi) => {
      pillar.questions.forEach((_, qi) => {
        questionCols[`p${pi + 1}_q${qi + 1}`] = pillarAnswers[pi][qi] || 0
      })
    })

    try {
      const { data: cycleData } = await supabase
        .from('cycles').select('id').eq('is_active', true).single()
      const cycleId = cycleData?.id || 1
      setL1CycleId(cycleId)

      const { data: responseData, error: responseError } = await supabase
        .from('responses')
        .insert({
          first_name: firstName.trim(), department, cycle: cycleId,
          pillar1_score: pillarScores[0], pillar2_score: pillarScores[1],
          pillar3_score: pillarScores[2], pillar4_score: pillarScores[3],
          pillar5_score: pillarScores[4],
          overall_score: overallScore, maturity_level: maturityLevel,
          ...questionCols,
        })
        .select('id').single()

      if (responseError) throw responseError

      const responseId = responseData.id
      setL1ResponseId(responseId)
      setL1Scores({ pillarScores, overallScore, maturityLevel })

      // Save qualitative responses
      const qualRows = []
      PILLARS.forEach((pillar, pi) => {
        pillar.qualitative.forEach((_, qi) => {
          const text = qualAnswers[pi][qi]?.trim()
          if (text) qualRows.push({
            response_id: responseId, pillar: pi + 1,
            question_number: qi + 13, answer: text, department, cycle: cycleId,
          })
        })
      })
      if (qualRows.length > 0) {
        await supabase.from('qualitative_responses').insert(qualRows)
      }

      // Show transition screen
      setStep(STEP_TRANSITION)
    } catch (err) {
      console.error('Layer 1 submission error:', err)
      setSubmitError('Failed to save your responses. Please try again.')
      setStep(STEP_QUAL)
    }
  }

  // ── Layer 2 submit: score + save individual_capability ────
  async function handleLayer2Submit() {
    setStep(STEP_SUBMITTING)
    setSubmitError('')

    const scores = computeLayer2Scores(l2Answers, l2Questions, cluster)

    // Build raw answer strings for l2_q1..l2_q10
    const rawCols = {}
    l2Questions.forEach((q, i) => {
      const ans = l2Answers[i]
      if (q.type === 'single_select') {
        rawCols[`l2_q${i + 1}`] = q.options?.[ans]?.text || ''
      } else if (q.type === 'multi_select') {
        rawCols[`l2_q${i + 1}`] = Array.isArray(ans) ? ans.join('; ') : ''
      } else {
        rawCols[`l2_q${i + 1}`] = ans || ''
      }
    })

    try {
      const { error } = await supabase.from('individual_capability').insert({
        response_id: l1ResponseId,
        department,
        cluster,
        cycle: l1CycleId,
        d1_awareness: scores.d1,
        d2_tool_use: scores.d2,
        d3_prompt_ability: scores.d3,
        d4_opportunity_spotting: scores.d4,
        d5_workflow_integration: scores.d5,
        overall_capability_score: scores.overall,
        capability_label: scores.capabilityLabel,
        primary_learning_focus: scores.learningFocus,
        secondary_learning_focus: scores.secondaryFocus,
        is_champion: scores.capabilityLabel === 'AI Champion',
        ...rawCols,
      })
      if (error) throw error

      navigate('/complete', {
        state: {
          firstName: firstName.trim(),
          department,
          cluster,
          clusterLabel,
          pillarScores: l1Scores.pillarScores,
          overallScore: l1Scores.overallScore,
          maturityLevel: l1Scores.maturityLevel,
          layer2: scores,
        },
      })
    } catch (err) {
      console.error('Layer 2 submission error:', err)
      setSubmitError('Failed to save Layer 2. Please try again.')
      setStep(STEP_L2)
    }
  }

  // ── Progress bar ─────────────────────────────────────────
  function ProgressBar() {
    const pct = step === STEP_INTRO ? 0
      : step === STEP_SUBMITTING ? 100
      : (() => {
          const completedPillars = pillarIndex
          const completedInCurrent = step === STEP_QUAL ? totalPillarQuestions : questionIndex
          const done = completedPillars * totalPillarQuestions + completedInCurrent
          return Math.round((done / totalScored) * 100)
        })()

    return (
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#00ADA9' }}
        />
      </div>
    )
  }

  // ── Render: Intro ─────────────────────────────────────────
  if (step === STEP_INTRO) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter flex flex-col">
        <header className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Logo />
            <span className="text-sm text-gray-400">AI Readiness Assessment</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white mb-6"
                style={{ background: '#00ADA9' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Before you begin
              </div>

              <h1 className="text-2xl font-bold mb-2" style={{ color: '#1B3A5C' }}>
                Let's get started
              </h1>
              <p className="text-gray-500 mb-8">
                We only need a couple of details — no email required.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleIntroNext()}
                    placeholder="Enter your first name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                    style={{ '--tw-ring-color': '#00ADA9' }}
                    onFocus={(e) => (e.target.style.borderColor = '#00ADA9')}
                    onBlur={(e) => (e.target.style.borderColor = '')}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 bg-white focus:outline-none transition-all appearance-none"
                    onFocus={(e) => (e.target.style.borderColor = '#00ADA9')}
                    onBlur={(e) => (e.target.style.borderColor = '')}
                  >
                    <option value="">Select your department…</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {introError && (
                  <p className="text-red-500 text-sm">{introError}</p>
                )}

                {/* What to expect */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    What to expect
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#00ADA9' }}>✓</span>
                      Part 1: 5 pillars · 12 scored questions each (rated 1–5)
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#00ADA9' }}>✓</span>
                      Part 2: 10 personal AI capability questions tailored to your role
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#00ADA9' }}>✓</span>
                      Dual results: org readiness score + personal capability score
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#00ADA9' }}>✓</span>
                      Estimated time: 20–25 minutes
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleIntroNext}
                  className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90 active:scale-95 shadow-md"
                  style={{ background: '#00ADA9' }}
                >
                  Begin Assessment →
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Render: Submitting ────────────────────────────────────
  if (step === STEP_SUBMITTING) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full border-4 border-t-transparent mx-auto mb-6 animate-spin"
            style={{ borderColor: '#00ADA9', borderTopColor: 'transparent' }}
          />
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1B3A5C' }}>
            Calculating your results…
          </h2>
          <p className="text-gray-400">Saving your responses securely.</p>
          {submitError && (
            <p className="text-red-500 mt-4 text-sm">{submitError}</p>
          )}
        </div>
      </div>
    )
  }

  // ── Render: Pillar scored questions ──────────────────────
  if (step === STEP_PILLAR) {
    const currentAnswer = pillarAnswers[pillarIndex][questionIndex]
    const pillarProgress = Math.round(((questionIndex) / totalPillarQuestions) * 100)

    return (
      <div className="min-h-screen bg-gray-50 font-inter flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <Logo />
              <span className="text-sm text-gray-400">
                Q{answeredScored} of {totalScored}
              </span>
            </div>
            <ProgressBar />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            {/* Pillar badge */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="text-xs font-bold text-white px-3 py-1 rounded-full"
                style={{ background: currentPillar.color }}
              >
                Pillar {currentPillar.id} of {PILLARS.length}
              </div>
              <span className="text-sm font-semibold text-gray-500">
                {currentPillar.name}
              </span>
            </div>

            {/* Pillar mini-progress */}
            <div className="mb-2 flex justify-between text-xs text-gray-400">
              <span>Question {questionIndex + 1} of {totalPillarQuestions}</span>
              <span>{pillarProgress}% of pillar</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1 mb-8">
              <div
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: `${pillarProgress}%`,
                  background: currentPillar.color,
                }}
              />
            </div>

            {/* Question card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              {pillarIndex === 0 && questionIndex === 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-700">
                    <strong>How to answer:</strong> Rate each statement from 1 (Strongly Disagree)
                    to 5 (Strongly Agree) based on your organisation's current state.
                  </p>
                </div>
              )}

              <p className="text-lg font-semibold text-gray-800 leading-relaxed mb-8">
                {currentPillar.questions[questionIndex]}
              </p>

              {/* Likert buttons */}
              <div className="grid grid-cols-5 gap-2">
                {LIKERT.map((opt) => {
                  const isSelected = currentAnswer === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${
                        isSelected
                          ? 'border-transparent text-white shadow-md'
                          : 'border-gray-100 text-gray-600 hover:border-gray-300 bg-white'
                      }`}
                      style={
                        isSelected
                          ? { background: '#00ADA9', borderColor: '#00ADA9' }
                          : {}
                      }
                    >
                      <span className="text-2xl font-bold">{opt.value}</span>
                      <span className="text-xs text-center leading-tight hidden sm:block">
                        {opt.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Scale legend (mobile) */}
              <div className="flex justify-between text-xs text-gray-400 mt-3 sm:hidden">
                <span>Strongly Disagree</span>
                <span>Strongly Agree</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={handlePrevQuestion}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-100 transition-all"
              >
                ← Back
              </button>
              {currentAnswer !== null && (
                <button
                  onClick={() => {
                    if (questionIndex < totalPillarQuestions - 1) {
                      setQuestionIndex(questionIndex + 1)
                    } else {
                      setStep(STEP_QUAL)
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{ background: '#00ADA9' }}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Render: Qualitative questions ─────────────────────────
  if (step === STEP_QUAL) {
    const isLastPillar = pillarIndex === PILLARS.length - 1

    return (
      <div className="min-h-screen bg-gray-50 font-inter flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <Logo />
              <span className="text-sm text-gray-400">
                Pillar {pillarIndex + 1} of {PILLARS.length} — Qualitative
              </span>
            </div>
            <ProgressBar />
          </div>
        </header>

        <main className="flex-1 px-4 py-8">
          <div className="w-full max-w-2xl mx-auto">
            {/* Pillar badge */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="text-xs font-bold text-white px-3 py-1 rounded-full"
                style={{ background: currentPillar.color }}
              >
                Pillar {currentPillar.id} — Reflection
              </div>
              <span className="text-sm font-semibold text-gray-500">
                {currentPillar.name}
              </span>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
              <div className="mb-6 p-4 rounded-xl border" style={{ background: '#f0fdfc', borderColor: '#b2f0ed' }}>
                <p className="text-sm font-medium" style={{ color: '#00ADA9' }}>
                  ✓ Scored questions complete for this pillar.{' '}
                  <span className="font-normal text-gray-600">
                    The following questions are optional — feel free to skip any or all.
                  </span>
                </p>
              </div>

              <h2 className="text-lg font-bold mb-6" style={{ color: '#1B3A5C' }}>
                Open-text reflection questions
              </h2>

              <div className="space-y-6">
                {currentPillar.qualitative.map((q, qi) => (
                  <div key={qi}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Q{qi + 13}.{' '}
                      <span className="font-normal text-gray-600">{q}</span>
                      <span className="ml-2 text-xs text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={qualAnswers[pillarIndex][qi]}
                      onChange={(e) => handleQualChange(qi, e.target.value)}
                      rows={3}
                      placeholder="Share your thoughts… (or leave blank to skip)"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none resize-none transition-all text-sm"
                      onFocus={(e) => (e.target.style.borderColor = '#00ADA9')}
                      onBlur={(e) => (e.target.style.borderColor = '')}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={handleQualBack}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-100 transition-all"
              >
                ← Back to Scored Questions
              </button>
              <button
                onClick={handleQualNext}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-md"
                style={{ background: isLastPillar ? '#1B3A5C' : '#00ADA9' }}
              >
                {isLastPillar ? 'Continue to Part 2 →' : `Next: Pillar ${pillarIndex + 2} →`}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Render: Transition screen ─────────────────────────────
  if (step === STEP_TRANSITION) {
    return (
      <div className="min-h-screen bg-gray-50 font-inter flex flex-col">
        <header className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Logo />
            <span className="text-sm text-gray-400">Part 1 Complete</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 text-center">
              {/* Success tick */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: '#00ADA9' }}
              >
                <span className="text-white text-2xl font-bold">✓</span>
              </div>

              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold text-white mb-4"
                style={{ background: '#1B3A5C' }}
              >
                Part 2 of 2 — About you
              </div>

              <h1 className="text-2xl font-extrabold mb-3" style={{ color: '#1B3A5C' }}>
                Organisation assessment complete!
              </h1>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Now we'd like to understand your personal AI capability. 10 questions
                tailored to your role. Takes about 8 minutes.
              </p>

              {/* Cluster badge */}
              <div
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 mb-8 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #1B3A5C, #00ADA9)' }}
              >
                <span className="text-lg font-black opacity-60">
                  {cluster}
                </span>
                You are in the <strong>{clusterLabel}</strong> group
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-left mb-8">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#00ADA9' }}>✓</span>
                    10 questions specifically for <strong>{clusterLabel}</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#00ADA9' }}>✓</span>
                    Mix of multiple choice and short text questions
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: '#00ADA9' }}>✓</span>
                    Your personal AI capability score + learning focus
                  </li>
                </ul>
              </div>

              <button
                onClick={() => { setL2QuestionIndex(0); setStep(STEP_L2) }}
                className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all hover:opacity-90 active:scale-95 shadow-md"
                style={{ background: '#00ADA9' }}
              >
                Start Part 2 →
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Render: Layer 2 questions ─────────────────────────────
  if (step === STEP_L2) {
    const q = l2Questions[l2QuestionIndex]
    if (!q) return null
    const currentL2Answer = l2Answers[l2QuestionIndex]
    const isLastQ = l2QuestionIndex === l2Questions.length - 1
    const l2Pct = Math.round((l2QuestionIndex / l2Questions.length) * 100)

    function handleL2SingleSelect(optionIndex) {
      const updated = l2Answers.map((a, i) => i === l2QuestionIndex ? optionIndex : a)
      setL2Answers(updated)
      setTimeout(() => {
        if (!isLastQ) setL2QuestionIndex(l2QuestionIndex + 1)
      }, 280)
    }

    function handleL2MultiToggle(optionText) {
      const current = Array.isArray(currentL2Answer) ? currentL2Answer : []
      const updated = current.includes(optionText)
        ? current.filter(x => x !== optionText)
        : [...current, optionText]
      setL2Answers(l2Answers.map((a, i) => i === l2QuestionIndex ? updated : a))
    }

    function handleL2TextChange(text) {
      setL2Answers(l2Answers.map((a, i) => i === l2QuestionIndex ? text : a))
    }

    function handleL2Next() {
      if (!isLastQ) setL2QuestionIndex(l2QuestionIndex + 1)
      else handleLayer2Submit()
    }

    function handleL2Back() {
      if (l2QuestionIndex > 0) setL2QuestionIndex(l2QuestionIndex - 1)
      else setStep(STEP_TRANSITION)
    }

    // Check if current question has an answer
    const hasAnswer = q.type === 'open_text'
      ? true  // open text is always skippable
      : q.type === 'multi_select'
      ? Array.isArray(currentL2Answer) && currentL2Answer.length > 0
      : currentL2Answer !== null

    return (
      <div className="min-h-screen bg-gray-50 font-inter flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <Logo />
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: '#1B3A5C' }}
                >
                  {clusterLabel}
                </span>
                <span className="text-sm text-gray-400">
                  Q{l2QuestionIndex + 1} of {l2Questions.length}
                </span>
              </div>
            </div>
            {/* Layer 2 progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${l2Pct}%`, background: '#1B3A5C' }}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            {/* Part label */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="text-xs font-bold text-white px-3 py-1 rounded-full"
                style={{ background: '#1B3A5C' }}
              >
                Part 2 — Personal AI Capability
              </div>
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                {q.dimension} · {['Awareness','Tool Use','Prompt Ability','Opportunity Spotting','Workflow Integration'][['D1','D2','D3','D4','D5'].indexOf(q.dimension)]}
              </span>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <p className="text-lg font-semibold text-gray-800 leading-relaxed mb-8">
                {q.text}
              </p>

              {/* Single select */}
              {q.type === 'single_select' && (
                <div className="space-y-3">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => handleL2SingleSelect(oi)}
                      className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all hover:scale-[1.01] active:scale-95 text-sm font-medium ${
                        currentL2Answer === oi
                          ? 'text-white border-transparent shadow-md'
                          : 'border-gray-100 text-gray-700 hover:border-gray-300 bg-white'
                      }`}
                      style={currentL2Answer === oi ? { background: '#00ADA9' } : {}}
                    >
                      <span className="font-bold mr-3" style={{ color: currentL2Answer === oi ? 'rgba(255,255,255,0.7)' : '#00ADA9' }}>
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}

              {/* Multi select */}
              {q.type === 'multi_select' && (
                <div>
                  <p className="text-xs text-gray-400 mb-4">Select all that apply</p>
                  <div className="space-y-3">
                    {q.options.map((opt, oi) => {
                      const selected = Array.isArray(currentL2Answer) && currentL2Answer.includes(opt.text)
                      return (
                        <button
                          key={oi}
                          onClick={() => handleL2MultiToggle(opt.text)}
                          className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all text-sm font-medium flex items-center gap-3 ${
                            selected
                              ? 'text-white border-transparent shadow-md'
                              : 'border-gray-100 text-gray-700 hover:border-gray-300 bg-white'
                          }`}
                          style={selected ? { background: '#1B3A5C' } : {}}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                              selected ? 'border-white' : 'border-gray-300'
                            }`}
                          >
                            {selected && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          {opt.text}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Open text */}
              {q.type === 'open_text' && (
                <div>
                  <textarea
                    value={currentL2Answer || ''}
                    onChange={(e) => handleL2TextChange(e.target.value)}
                    rows={4}
                    placeholder="Type your answer here… (or leave blank to skip)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none resize-none transition-all text-sm"
                    onFocus={(e) => (e.target.style.borderColor = '#00ADA9')}
                    onBlur={(e) => (e.target.style.borderColor = '')}
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-2">Optional — your answer is stored anonymously for learning needs analysis.</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={handleL2Back}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-100 transition-all"
              >
                ← Back
              </button>
              {(hasAnswer || q.type === 'open_text') && (
                <button
                  onClick={handleL2Next}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shadow-md"
                  style={{ background: isLastQ ? '#1B3A5C' : '#00ADA9' }}
                >
                  {isLastQ ? 'Submit & See Results →' : 'Next →'}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return null
}
