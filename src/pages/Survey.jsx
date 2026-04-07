// Survey page — route: /survey
// 5-pillar AI readiness assessment with Likert scoring and optional qualitative questions
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

// ── Likert scale labels ────────────────────────────────────
const LIKERT = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
]

// ── Step identifiers ───────────────────────────────────────
const STEP_INTRO = 'intro'     // collect name + department
const STEP_PILLAR = 'pillar'   // scored questions
const STEP_QUAL = 'qual'       // qualitative questions
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
  const [pillarIndex, setPillarIndex] = useState(0)  // 0-4
  const [questionIndex, setQuestionIndex] = useState(0)  // within pillar scored Qs

  // ── Answers ───────────────────────────────────────────────
  // pillarAnswers[pillarIndex][questionIndex] = 1-5
  const [pillarAnswers, setPillarAnswers] = useState(
    PILLARS.map((p) => Array(p.questions.length).fill(null))
  )
  // qualAnswers[pillarIndex][0-2] = text string
  const [qualAnswers, setQualAnswers] = useState(
    PILLARS.map(() => ['', '', ''])
  )

  const [submitError, setSubmitError] = useState('')

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
      // Move to next pillar
      setPillarIndex(pillarIndex + 1)
      setQuestionIndex(0)
      setStep(STEP_PILLAR)
    } else {
      // All pillars done — submit
      handleSubmit()
    }
  }

  function handleQualBack() {
    // Go back to last scored question of this pillar
    setStep(STEP_PILLAR)
    setQuestionIndex(totalPillarQuestions - 1)
  }

  async function handleSubmit() {
    setStep(STEP_SUBMITTING)
    setSubmitError('')

    // Compute scores
    const pillarScores = pillarAnswers.map((arr) =>
      arr.reduce((a, b) => a + (b || 0), 0)
    )
    const overallScore = computeOverallScore(pillarScores)
    const maturityLevel = getMaturityLevel(overallScore)

    // Build flat individual question columns
    const questionCols = {}
    PILLARS.forEach((pillar, pi) => {
      pillar.questions.forEach((_, qi) => {
        questionCols[`p${pi + 1}_q${qi + 1}`] = pillarAnswers[pi][qi] || 0
      })
    })

    try {
      // Get active cycle
      const { data: cycleData } = await supabase
        .from('cycles')
        .select('id')
        .eq('is_active', true)
        .single()

      const cycleId = cycleData?.id || 1

      // Insert main response
      const { data: responseData, error: responseError } = await supabase
        .from('responses')
        .insert({
          first_name: firstName.trim(),
          department,
          cycle: cycleId,
          pillar1_score: pillarScores[0],
          pillar2_score: pillarScores[1],
          pillar3_score: pillarScores[2],
          pillar4_score: pillarScores[3],
          pillar5_score: pillarScores[4],
          overall_score: overallScore,
          maturity_level: maturityLevel,
          ...questionCols,
        })
        .select('id')
        .single()

      if (responseError) throw responseError

      const responseId = responseData.id

      // Insert qualitative responses (skip empty)
      const qualRows = []
      PILLARS.forEach((pillar, pi) => {
        pillar.qualitative.forEach((_, qi) => {
          const text = qualAnswers[pi][qi]?.trim()
          if (text) {
            qualRows.push({
              response_id: responseId,
              pillar: pi + 1,
              question_number: qi + 13,
              answer: text,
              department,
              cycle: cycleId,
            })
          }
        })
      })

      if (qualRows.length > 0) {
        const { error: qualError } = await supabase
          .from('qualitative_responses')
          .insert(qualRows)
        if (qualError) console.warn('Qualitative insert error:', qualError)
      }

      // Navigate to results, passing data in location state
      navigate('/complete', {
        state: {
          firstName: firstName.trim(),
          department,
          pillarScores,
          overallScore,
          maturityLevel,
        },
      })
    } catch (err) {
      console.error('Submission error:', err)
      setSubmitError('Failed to save your responses. Please try again.')
      setStep(STEP_QUAL)
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
                      5 pillars · 12 scored questions each (rated 1–5)
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#00ADA9' }}>✓</span>
                      3 optional open-text questions per pillar
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#00ADA9' }}>✓</span>
                      Personalised AI Maturity Score at the end
                    </li>
                    <li className="flex items-start gap-2">
                      <span style={{ color: '#00ADA9' }}>✓</span>
                      Estimated time: 15–20 minutes
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
                {isLastPillar ? 'Submit Assessment →' : `Next: Pillar ${pillarIndex + 2} →`}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return null
}
