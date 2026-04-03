import { useEffect, useRef } from 'react'
import { PERSONA_COLOURS, NAME_TO_ID } from '../lib/constants.js'

function getColour(personaName, personaId) {
  if (personaId && PERSONA_COLOURS[personaId]) return PERSONA_COLOURS[personaId]
  const id = NAME_TO_ID[personaName]
  return id ? PERSONA_COLOURS[id] : '#A8A8B3'
}

function getInitial(name) {
  return (name || '').replace(/^The /, '').charAt(0).toUpperCase() || '?'
}

function TypingDots() {
  return (
    <div className="flex items-center gap-3 py-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-orbit-border flex-shrink-0" />
      <div className="flex items-center gap-1.5 py-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-orbit-muted animate-pulse"
            style={{ animationDelay: `${i * 180}ms`, animationDuration: '1s' }}
          />
        ))}
      </div>
    </div>
  )
}

function SectionHeader({ label }) {
  return (
    <div className="py-4 border-b border-orbit-border/40">
      <p className="text-orbit-muted text-xs uppercase tracking-widest font-medium">{label}</p>
    </div>
  )
}

function MessageItem({ name, personaId, message, isUser }) {
  const colour = isUser ? PERSONA_COLOURS.user : getColour(name, personaId)
  const initial = getInitial(name)

  return (
    <div className="flex items-start gap-3 py-4 border-b border-orbit-border/20 last:border-0 animate-fade-in">
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-semibold"
        style={{ backgroundColor: colour }}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-semibold mb-1.5 leading-none"
          style={{ color: colour }}
        >
          {name}
        </p>
        <p
          className={`text-sm leading-relaxed ${isUser ? 'text-orbit-muted italic' : 'text-orbit-text'}`}
        >
          {message}
        </p>
      </div>
    </div>
  )
}

export default function SimulationFeed({ phase1Reactions, phase2Debate, isTyping, phase }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [phase1Reactions.length, phase2Debate.length, isTyping])

  const hasPhase1 = phase1Reactions.length > 0
  const hasPhase2Content = phase2Debate.length > 0 || (phase !== 'phase1' && isTyping)

  if (!hasPhase1 && !isTyping) return null

  return (
    <div className="bg-orbit-surface border border-orbit-border rounded-xl overflow-hidden">
      <div className="max-h-[640px] overflow-y-auto">
        <div className="px-6">

          {/* Phase 1 */}
          {hasPhase1 && (
            <>
              <SectionHeader label="Phase 1 — Individual Reactions" />
              <div>
                {phase1Reactions.map((reaction, i) => (
                  <MessageItem
                    key={i}
                    name={reaction.persona}
                    personaId={reaction.persona_id}
                    message={reaction.message}
                  />
                ))}
                {isTyping && phase === 'phase1' && <TypingDots />}
              </div>
            </>
          )}

          {/* Phase 1 typing before first message */}
          {!hasPhase1 && isTyping && phase === 'phase1' && (
            <>
              <SectionHeader label="Phase 1 — Individual Reactions" />
              <TypingDots />
            </>
          )}

          {/* Phase 2 */}
          {hasPhase2Content && (
            <div className="mt-2">
              <SectionHeader label="Phase 2 — Debate" />
              <div>
                {phase2Debate.map((msg, i) => (
                  <MessageItem
                    key={i}
                    name={msg.persona}
                    message={msg.message}
                    isUser={msg.isUser}
                  />
                ))}
                {isTyping && phase !== 'phase1' && <TypingDots />}
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-2" />
        </div>
      </div>
    </div>
  )
}
