import { PERSONA_COLOURS, CORE_PERSONA_IDS } from '../lib/constants.js'

function getInitial(name) {
  return name.replace(/^The /, '').charAt(0).toUpperCase()
}

export default function PersonaCards({ personas }) {
  return (
    <div>
      <p className="text-orbit-muted text-xs uppercase tracking-widest font-medium mb-4">
        Simulation Participants
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {personas.map((persona, index) => {
          const colour = PERSONA_COLOURS[persona.id] || '#6C63FF'
          const isCore = CORE_PERSONA_IDS.has(persona.id)

          return (
            <div
              key={persona.id}
              className="flex-shrink-0 w-44 bg-orbit-surface border border-orbit-border rounded-xl p-4 animate-fade-in-up"
              style={{
                animationDelay: `${index * 80}ms`,
                animationFillMode: 'both',
                opacity: 0,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                  style={{ backgroundColor: colour }}
                >
                  {getInitial(persona.name)}
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wide"
                  style={
                    isCore
                      ? { backgroundColor: '#6C63FF22', color: '#6C63FF' }
                      : { backgroundColor: '#E9456022', color: '#E94560' }
                  }
                >
                  {isCore ? 'Core' : 'Context'}
                </span>
              </div>
              <p className="text-orbit-text font-semibold text-sm leading-tight mb-1.5">
                {persona.name}
              </p>
              <p
                className="text-orbit-muted text-xs leading-relaxed"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {persona.focus}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
