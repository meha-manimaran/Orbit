import { useEffect, useMemo, useRef } from 'react'
import { CORE_PERSONA_IDS, NAME_TO_ID, PERSONA_COLOURS } from '../lib/constants.js'

function getPersonaId(persona, personasById) {
  if (persona?.persona_id) return persona.persona_id
  const knownPersona = personasById.get(persona?.persona)
  if (knownPersona?.id) return knownPersona.id
  return NAME_TO_ID[persona?.persona] || NAME_TO_ID[persona?.name] || null
}

function getAvatarLabel(name) {
  return (name || '')
    .replace(/^The /, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function getReactionSentiment(message) {
  const text = (message || '').toLowerCase()
  const positiveSignals = ['love', 'excited', 'strong', 'great', 'helpful', 'good idea', 'opportunity']
  const negativeSignals = ['concern', 'risk', 'friction', 'hard', 'problem', 'worry', 'against', 'skip']
  const probingSignals = ['what if', 'need to know', 'why', 'question', '?']

  const hasPositive = positiveSignals.some((signal) => text.includes(signal))
  const hasNegative = negativeSignals.some((signal) => text.includes(signal))
  const hasProbing = probingSignals.some((signal) => text.includes(signal))

  if ((hasPositive && hasNegative) || (hasPositive && hasProbing)) {
    return { label: 'Mixed', className: 'bg-[#FAEEDA] text-[#854F0B]' }
  }
  if (hasNegative) {
    return { label: 'Skeptical', className: 'bg-[#FCEBEB] text-[#A32D2D]' }
  }
  if (hasPositive) {
    return { label: 'Supportive', className: 'bg-[#EAF3DE] text-[#3B6D11]' }
  }
  if (hasProbing) {
    return { label: 'Probing', className: 'bg-[#F1EFE8] text-[#5F5E5A]' }
  }

  return { label: 'Neutral', className: 'bg-[#F1EFE8] text-[#5F5E5A]' }
}

function PhaseHeader({ children }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#999]">{children}</p>
      <div className="h-px flex-1 bg-[#E0DBD3]" />
    </div>
  )
}

function TypingPlaceholder() {
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-[#EAE6DF] bg-white px-4 py-3 animate-fade-in">
      <div className="h-7 w-7 rounded-full bg-[#E7E1D8]" />
      <div className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-[#B8B0A7] animate-pulse"
            style={{ animationDelay: `${index * 180}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function SimulationFeed({ phase1Reactions, phase2Debate, isTyping, phase, personas }) {
  const bottomRef = useRef(null)
  const personasByName = useMemo(
    () => new Map(personas.map((persona) => [persona.name, persona])),
    [personas],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [phase1Reactions.length, phase2Debate.length, isTyping, phase])

  if (!phase1Reactions.length && !phase2Debate.length && !isTyping) return null

  return (
    <div className="flex flex-col gap-7">
      <section>
        <PhaseHeader>Phase 1 - independent reactions</PhaseHeader>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {phase1Reactions.map((reaction) => {
            const personaId = getPersonaId(reaction, personasByName)
            const sentiment = getReactionSentiment(reaction.message)
            const roleLabel = personaId && CORE_PERSONA_IDS.has(personaId) ? 'core persona' : 'auto-selected'

            return (
              <article key={`${reaction.persona}-${reaction.message.slice(0, 24)}`} className="rounded-[12px] border border-[#E8E2D8] bg-white px-4 py-4 animate-fade-in-up">
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ backgroundColor: PERSONA_COLOURS[personaId] || '#A8A8B3' }}
                  >
                    {getAvatarLabel(reaction.persona)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-[#1C1C1E]">{reaction.persona.replace(/^The /, '')}</p>
                    <p className="truncate text-[10px] text-[#AAA]">{roleLabel}</p>
                  </div>
                </div>
                <p className="text-[12px] leading-6 text-[#555]">{reaction.message}</p>
                <span className={`mt-3 inline-block rounded-full px-2 py-1 text-[10px] ${sentiment.className}`}>
                  {sentiment.label}
                </span>
              </article>
            )
          })}
          {isTyping && phase === 'phase1' && <TypingPlaceholder />}
        </div>
      </section>

      {(phase2Debate.length > 0 || isTyping || phase === 'phase2' || phase === 'summary') && (
        <section>
          <PhaseHeader>Phase 2 - live debate</PhaseHeader>
          <div className="flex flex-col gap-3">
            {phase2Debate.map((message, index) => {
              const personaId = message.isUser ? 'user' : getPersonaId(message, personasByName)
              const bubbleClasses = message.isUser
                ? 'border-[#D8D1C6] bg-[#F3EFE8] text-[#2C2B29]'
                : 'border-[#EAE6DF] bg-white text-[#444]'

              return (
                <div key={`${message.persona}-${index}`} className="flex gap-3 animate-fade-in">
                  <div
                    className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: PERSONA_COLOURS[personaId] || '#A8A8B3' }}
                  >
                    {getAvatarLabel(message.persona)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline gap-2">
                      <span className="text-[12px] font-medium text-[#1C1C1E]">{message.persona.replace(/^The /, '')}</span>
                      <span className="text-[10px] text-[#C5C0B8]">just now</span>
                    </div>
                    <div className={`rounded-[12px] border px-3.5 py-2.5 text-[13px] leading-7 ${bubbleClasses}`}>
                      {message.message}
                    </div>
                  </div>
                </div>
              )
            })}
            {isTyping && phase !== 'phase1' && <TypingPlaceholder />}
          </div>
        </section>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
