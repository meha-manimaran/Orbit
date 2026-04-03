import { useState, useRef, useCallback } from 'react'
import InputPanel from '../components/InputPanel.jsx'
import PersonaCards from '../components/PersonaCards.jsx'
import SimulationFeed from '../components/SimulationFeed.jsx'
import SteerInput from '../components/SteerInput.jsx'
import SummaryPanel from '../components/SummaryPanel.jsx'
import { runSimulation, steerConversation } from '../lib/api.js'

export default function IndexPage({ backendReady }) {
  const [input, setInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [simulationData, setSimulationData] = useState(null)
  const [revealedPhase1, setRevealedPhase1] = useState([])
  const [revealedPhase2, setRevealedPhase2] = useState([])
  const [personas, setPersonas] = useState([])
  const [phase, setPhase] = useState('idle')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)

  const timersRef = useRef([])
  const conversationHistoryRef = useRef([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const schedule = useCallback((fn, delay) => {
    const t = setTimeout(fn, delay)
    timersRef.current.push(t)
    return t
  }, [])

  const revealSequence = useCallback((phase1, phase2) => {
    let p1i = 0
    let p2i = 0

    const nextP1 = () => {
      if (p1i >= phase1.length) {
        setIsTyping(false)
        setPhase('phase2')
        schedule(nextP2, 600)
        return
      }
      setIsTyping(true)
      schedule(() => {
        const msg = phase1[p1i]
        setRevealedPhase1(prev => [...prev, msg])
        conversationHistoryRef.current.push({
          persona: msg.persona,
          phase: 'reaction',
          message: msg.message,
        })
        setIsTyping(false)
        p1i++
        schedule(nextP1, 400)
      }, 800)
    }

    const nextP2 = () => {
      if (p2i >= phase2.length) {
        setIsTyping(false)
        setPhase('summary')
        return
      }
      setIsTyping(true)
      schedule(() => {
        const msg = phase2[p2i]
        setRevealedPhase2(prev => [...prev, msg])
        conversationHistoryRef.current.push({
          persona: msg.persona,
          phase: 'debate',
          message: msg.message,
        })
        setIsTyping(false)
        p2i++
        schedule(nextP2, 300)
      }, 600)
    }

    nextP1()
  }, [schedule])

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return
    clearTimers()
    setIsRunning(true)
    setError(null)
    setSimulationData(null)
    setRevealedPhase1([])
    setRevealedPhase2([])
    setPersonas([])
    setPhase('idle')
    setIsTyping(false)
    conversationHistoryRef.current = []

    try {
      const data = await runSimulation(input.trim())
      setSimulationData(data)
      setPersonas(data.personas)
      setIsRunning(false)
      setPhase('phase1')
      revealSequence(data.phase1_reactions, data.phase2_debate)
    } catch (err) {
      setError(err.message)
      setIsRunning(false)
    }
  }, [input, clearTimers, revealSequence])

  const handleSteer = useCallback(async (message) => {
    clearTimers()
    setIsTyping(false)

    const userEntry = { persona: 'user', phase: 'steer', message }
    setRevealedPhase2(prev => [...prev, { persona: 'You', message, isUser: true }])
    conversationHistoryRef.current.push(userEntry)

    setIsTyping(true)

    try {
      const data = await steerConversation(
        message,
        conversationHistoryRef.current,
        personas,
      )
      const continuation = data.debate_continuation
      let i = 0

      const revealNext = () => {
        if (i >= continuation.length) {
          setIsTyping(false)
          setPhase('summary')
          return
        }
        setIsTyping(true)
        schedule(() => {
          const msg = continuation[i]
          setRevealedPhase2(prev => [...prev, msg])
          conversationHistoryRef.current.push({
            persona: msg.persona,
            phase: 'debate',
            message: msg.message,
          })
          setIsTyping(false)
          i++
          schedule(revealNext, 300)
        }, 600)
      }

      schedule(revealNext, 300)
    } catch (err) {
      setIsTyping(false)
      setError(err.message)
    }
  }, [clearTimers, schedule, personas])

  const handleReset = useCallback(() => {
    clearTimers()
    setInput('')
    setSimulationData(null)
    setRevealedPhase1([])
    setRevealedPhase2([])
    setPersonas([])
    setPhase('idle')
    setIsTyping(false)
    setError(null)
    conversationHistoryRef.current = []
  }, [clearTimers])

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-7 h-7 rounded-md bg-orbit-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm leading-none">O</span>
          </div>
          <h1 className="text-xl font-semibold text-orbit-text tracking-tight">Orbit</h1>
        </div>
        <p className="text-orbit-muted text-sm pl-10">Multi-agent simulation engine for product managers</p>
      </header>

      {/* Input — idle state only */}
      {phase === 'idle' && (
        <InputPanel
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          isRunning={isRunning}
          backendReady={backendReady}
        />
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-orbit-surface border border-orbit-border rounded-xl text-sm text-orbit-accent">
          Something went wrong: {error}
        </div>
      )}

      {/* Loading */}
      {isRunning && (
        <div className="flex items-center gap-3 py-12">
          <div className="w-5 h-5 rounded-full border-2 border-orbit-primary border-t-transparent animate-spin flex-shrink-0" />
          <span className="text-orbit-muted text-sm">Running simulation — this takes about 30 seconds...</span>
        </div>
      )}

      {/* Simulation output */}
      {phase !== 'idle' && personas.length > 0 && (
        <div className="space-y-8">
          <PersonaCards personas={personas} />

          <SimulationFeed
            phase1Reactions={revealedPhase1}
            phase2Debate={revealedPhase2}
            isTyping={isTyping}
            phase={phase}
          />

          <SteerInput
            onSteer={handleSteer}
            isVisible={phase === 'phase2'}
            disabled={isTyping}
          />

          {phase === 'summary' && simulationData?.summary && (
            <SummaryPanel
              summary={simulationData.summary}
              onReset={handleReset}
            />
          )}
        </div>
      )}
    </div>
  )
}
