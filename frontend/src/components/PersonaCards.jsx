import { CORE_PERSONA_IDS, PERSONA_COLOURS } from '../lib/constants.js'

function getAvatarLabel(name) {
  return name
    .replace(/^The /, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function formatName(name) {
  return name.replace(/^The /, '')
}

export default function PersonaCards({ personas }) {
  if (!personas.length) {
    return (
      <div className="rounded-[12px] border border-[#2E2E30] bg-[#252527] px-3 py-3 text-[11px] leading-5 text-[#747478]">
        Active personas appear here after Orbit detects or applies a decision type.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {personas.map((persona, index) => {
        const isCore = CORE_PERSONA_IDS.has(persona.id)
        return (
          <div
            key={persona.id}
            className="flex items-center gap-3 rounded-[8px] border border-[#2E2E30] bg-[#252527] px-3 py-2 animate-fade-in-up"
            style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both', opacity: 0 }}
          >
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ backgroundColor: PERSONA_COLOURS[persona.id] || '#E8A87C' }}
            >
              {getAvatarLabel(persona.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-[#D0D0D0]">{formatName(persona.name)}</p>
              <p className="truncate text-[10px] text-[#666]">{persona.role}</p>
            </div>
            <div className={`rounded-full px-2 py-0.5 text-[9px] ${isCore ? 'bg-[#1C1C1E] text-[#777]' : 'bg-[#1C1C1E] text-[#E8A87C]'}`}>
              {isCore ? 'core' : 'auto'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
