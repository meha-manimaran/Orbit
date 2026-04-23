import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import InputPanel from '../components/InputPanel.jsx'
import PersonaCards from '../components/PersonaCards.jsx'
import SimulationFeed from '../components/SimulationFeed.jsx'
import SteerInput from '../components/SteerInput.jsx'
import SummaryPanel from '../components/SummaryPanel.jsx'
import { runSimulation, steerConversation } from '../lib/api.js'
import { INTENT_LABELS } from '../lib/constants.js'

const PHASES = ['phase1', 'phase2', 'summary']

function getPhaseState(phase, targetPhase) {
  if (phase === 'idle') return 'idle'

  const currentIndex = PHASES.indexOf(phase)
  const targetIndex = PHASES.indexOf(targetPhase)

  if (currentIndex > targetIndex) return 'done'
  if (currentIndex === targetIndex) return 'active'
  return 'idle'
}

function PhasePill({ label, state }) {
  const classes = {
    done: 'border-[#C0DD97] bg-[#EAF3DE] text-[#3B6D11]',
    active: 'border-[#1C1C1E] bg-[#1C1C1E] text-[#F5F0E8]',
    idle: 'border-[#DDD8D0] bg-[#F0EDE8] text-[#AAA]',
  }

  return (
    <div className={`rounded-full border px-3 py-1 text-[10px] ${classes[state]}`}>
      {label}
    </div>
  )
}

function shortenInput(text) {
  if (!text) return 'Stakeholder simulation'
  if (text.length <= 72) return text
  return `${text.slice(0, 69)}...`
}

export default function IndexPage({ backendReady }) {
  const [input, setInput] = useState('')
  const [submittedInput, setSubmittedInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [simulationData, setSimulationData] = useState(null)
  const [revealedPhase1, setRevealedPhase1] = useState([])
  const [revealedPhase2, setRevealedPhase2] = useState([])
  const [personas, setPersonas] = useState([])
  const [phase, setPhase] = useState('idle')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)
  const [manualIntentOverride, setManualIntentOverride] = useState(null)
  const [detectedIntent, setDetectedIntent] = useState(null)
  const [summaryStale, setSummaryStale] = useState(false)

  const timersRef = useRef([])
  const conversationHistoryRef = useRef([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const schedule = useCallback((fn, delay) => {
    const timer = setTimeout(fn, delay)
    timersRef.current.push(timer)
    return timer
  }, [])

  const revealSequence = useCallback((phase1, phase2) => {
    let phase1Index = 0
    let phase2Index = 0

    const revealPhase1 = () => {
      if (phase1Index >= phase1.length) {
        setIsTyping(false)
        setPhase('phase2')
        schedule(revealPhase2, 500)
        return
      }

      setIsTyping(true)
      schedule(() => {
        const message = phase1[phase1Index]
        setRevealedPhase1((current) => [...current, message])
        conversationHistoryRef.current.push({ persona: message.persona, phase: 'reaction', message: message.message })
        setIsTyping(false)
        phase1Index += 1
        schedule(revealPhase1, 260)
      }, 520)
    }

    const revealPhase2 = () => {
      if (phase2Index >= phase2.length) {
        setIsTyping(false)
        setPhase('summary')
        return
      }

      setIsTyping(true)
      schedule(() => {
        const message = phase2[phase2Index]
        setRevealedPhase2((current) => [...current, message])
        conversationHistoryRef.current.push({ persona: message.persona, phase: 'debate', message: message.message })
        setIsTyping(false)
        phase2Index += 1
        schedule(revealPhase2, 220)
      }, 420)
    }

    setPhase('phase1')
    revealPhase1()
  }, [schedule])

  const handleSubmit = useCallback(async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput) return

    clearTimers()
    setIsRunning(true)
    setError(null)
    setSimulationData(null)
    setRevealedPhase1([])
    setRevealedPhase2([])
    setPersonas([])
    setSummaryStale(false)
    setIsTyping(false)
    setPhase('idle')
    conversationHistoryRef.current = []

    try {
      const data = await runSimulation(trimmedInput, manualIntentOverride)
      setSimulationData(data)
      setPersonas(data.personas)
      setSubmittedInput(trimmedInput)
      if (!manualIntentOverride) {
        setDetectedIntent(data.intent)
      }
      setIsRunning(false)
      revealSequence(data.phase1_reactions, data.phase2_debate)
    } catch (err) {
      setError(err.message)
      setIsRunning(false)
    }
  }, [input, clearTimers, manualIntentOverride, revealSequence])

  const handleSteer = useCallback(async (message) => {
    if (!simulationData) return

    clearTimers()
    setPhase('phase2')
    setSummaryStale(Boolean(simulationData.summary))
    setIsTyping(false)

    setRevealedPhase2((current) => [...current, { persona: 'You', message, isUser: true }])
    conversationHistoryRef.current.push({ persona: 'user', phase: 'steer', message })

    setIsTyping(true)

    try {
      const data = await steerConversation(message, conversationHistoryRef.current, personas)
      let continuationIndex = 0

      const revealNext = () => {
        if (continuationIndex >= data.debate_continuation.length) {
          setIsTyping(false)
          return
        }

        setIsTyping(true)
        schedule(() => {
          const nextMessage = data.debate_continuation[continuationIndex]
          setRevealedPhase2((current) => [...current, nextMessage])
          conversationHistoryRef.current.push({ persona: nextMessage.persona, phase: 'debate', message: nextMessage.message })
          setIsTyping(false)
          continuationIndex += 1
          schedule(revealNext, 220)
        }, 420)
      }

      schedule(revealNext, 220)
    } catch (err) {
      setIsTyping(false)
      setError(err.message)
    }
  }, [clearTimers, personas, schedule, simulationData])

  const handleReset = useCallback(() => {
    clearTimers()
    setInput('')
    setSubmittedInput('')
    setSimulationData(null)
    setRevealedPhase1([])
    setRevealedPhase2([])
    setPersonas([])
    setPhase('idle')
    setIsTyping(false)
    setError(null)
    setManualIntentOverride(null)
    setDetectedIntent(null)
    setSummaryStale(false)
    conversationHistoryRef.current = []
  }, [clearTimers])

  const activeIntent = manualIntentOverride || detectedIntent
  const subtitle = useMemo(() => {
    if (!simulationData) {
      return 'Run a simulation to populate the reaction grid, debate feed, and summary.'
    }

    const intentText = INTENT_LABELS[simulationData.intent] || simulationData.intent
    const sourceText = simulationData.intent_source === 'manual_override' ? 'manual override' : 'auto-detected'
    return `${intentText} - ${personas.length} personas - ${sourceText}`
  }, [personas.length, simulationData])

  const showSummary = Boolean(simulationData?.summary)
  const showSummaryContent = Boolean(simulationData?.summary) && (phase === 'summary' || summaryStale)
  const steerDisabled = isTyping || isRunning || phase === 'phase1'

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="overflow-hidden rounded-[16px] border border-[#DCCFC0] bg-[#FAF8F4] lg:grid lg:min-h-[760px] lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-6 bg-[#1C1C1E] px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-[#E8A87C] text-[14px] font-bold text-[#1C1C1E]">
              O
            </div>
            <div>
              <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#F5F0E8]">Orbit</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#666]">Simulation engine</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-6">
            <InputPanel
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              isRunning={isRunning}
              backendReady={backendReady}
              activeIntent={activeIntent}
              detectedIntent={detectedIntent}
              manualIntentOverride={manualIntentOverride}
              onIntentSelect={(intentId) => {
                setManualIntentOverride((current) => {
                  if (current === intentId) return null
                  if (!current && detectedIntent === intentId) return null
                  return intentId
                })
                setError(null)
              }}
              onClearIntentOverride={() => setManualIntentOverride(null)}
            />

            <div className="space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#555]">Active personas</p>
              <PersonaCards personas={personas} />
            </div>
          </div>
        </aside>

        <main className="flex min-h-[560px] flex-col bg-[#FAF8F4]">
          <div className="border-b border-[#EAE6DF] px-5 pb-4 pt-5 md:px-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-[#1C1C1E]">{shortenInput(submittedInput || input)}</p>
                <p className="mt-1 text-[11px] text-[#999]">{subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <PhasePill label="Reactions" state={getPhaseState(phase, 'phase1')} />
                <PhasePill label="Debate" state={getPhaseState(phase, 'phase2')} />
                <PhasePill label="Summary" state={getPhaseState(phase, 'summary')} />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 md:px-7">
            {error && (
              <div className="mb-5 rounded-[10px] border border-[#E7C8BE] bg-[#FAECE8] px-4 py-3 text-[12px] text-[#A0412F]">
                {error}
              </div>
            )}

            {!simulationData && !isRunning && (
              <div className="rounded-[12px] border border-dashed border-[#D9D2C8] bg-[#F7F3ED] px-5 py-12 text-center">
                <p className="text-[13px] font-medium text-[#3A3936]">Run a simulation to see reactions, debate, and a summary.</p>
                <p className="mt-2 text-[12px] leading-6 text-[#8B857D]">
                  Orbit will detect the decision type automatically. You can then rerun with a manual override from the sidebar.
                </p>
              </div>
            )}

            {isRunning && !simulationData && (
              <div className="rounded-[12px] border border-[#E8E2D8] bg-white px-5 py-10 text-center">
                <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[#E8A87C] border-t-transparent" />
                <p className="text-[13px] font-medium text-[#1C1C1E]">Running simulation</p>
                <p className="mt-2 text-[12px] text-[#8B857D]">Fetching reactions, generating debate, and preparing the summary.</p>
              </div>
            )}

            {(simulationData || revealedPhase1.length > 0 || revealedPhase2.length > 0 || isTyping) && (
              <div className="space-y-7">
                <SimulationFeed
                  phase1Reactions={revealedPhase1}
                  phase2Debate={revealedPhase2}
                  isTyping={isTyping}
                  phase={phase}
                  personas={personas}
                />

                {showSummary && showSummaryContent && (
                  <SummaryPanel
                    summary={simulationData.summary}
                    onReset={handleReset}
                    isStale={summaryStale}
                  />
                )}

                {showSummary && !showSummaryContent && (
                  <section className="space-y-3">
                    <div className="mb-3 flex items-center gap-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#999]">Summary</p>
                      <div className="h-px flex-1 bg-[#E0DBD3]" />
                    </div>
                    <div className="rounded-[12px] border border-[#E8E2D8] bg-white px-4 py-4 text-[12px] leading-6 text-[#7A746C]">
                      Orbit will reveal the summary after the initial debate completes. The layout stays fixed so you can track the whole simulation in one place.
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          <SteerInput
            onSteer={handleSteer}
            isVisible={Boolean(simulationData)}
            disabled={steerDisabled}
          />
        </main>
      </div>
    </div>
  )
}
