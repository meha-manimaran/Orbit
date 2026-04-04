import { INTENT_OPTIONS, INTENT_LABELS } from '../lib/constants.js'

export default function InputPanel({
  input,
  onInputChange,
  onSubmit,
  isRunning,
  backendReady,
  activeIntent,
  detectedIntent,
  manualIntentOverride,
  onIntentSelect,
  onClearIntentOverride,
}) {
  const handleKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !isRunning && backendReady && input.trim()) {
      onSubmit()
    }
  }

  const handleInput = (event) => {
    onInputChange(event.target.value)
    event.target.style.height = 'auto'
    event.target.style.height = `${event.target.scrollHeight}px`
  }

  const disabled = isRunning || !backendReady || !input.trim()
  const helperText = manualIntentOverride
    ? `Manual override: ${INTENT_LABELS[manualIntentOverride]}`
    : detectedIntent
      ? `Auto-detected: ${INTENT_LABELS[detectedIntent]}`
      : 'Intent will be auto-detected when you run the simulation.'

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#555]">Your idea</p>
        <textarea
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="What if we added a mandatory onboarding checklist before users could access the main product?"
          className="min-h-[140px] w-full resize-none rounded-[10px] border border-[#333] bg-[#252527] px-3.5 py-3 text-[12px] leading-6 text-[#E8E8E8] outline-none transition-colors duration-150 placeholder:text-[#5A5A5D] focus:border-[#E8A87C]"
          style={{ overflow: 'hidden' }}
          rows={6}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#555]">Decision type</p>
          {manualIntentOverride && detectedIntent && (
            <button
              type="button"
              onClick={onClearIntentOverride}
              className="text-[10px] text-[#A68A73] transition-colors duration-150 hover:text-[#E8A87C]"
            >
              Use auto
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {INTENT_OPTIONS.map((option) => {
            const isActive = activeIntent === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onIntentSelect(option.id)}
                disabled={isRunning}
                className={`rounded-full border px-2.5 py-1 text-[10px] transition-all duration-150 ${
                  isActive
                    ? 'border-[#E8A87C] bg-[#3D2E1E] text-[#E8A87C]'
                    : 'border-[#333] bg-[#252527] text-[#888] hover:border-[#E8A87C] hover:text-[#E8A87C]'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <p className="text-[10px] leading-4 text-[#6C6C70]">{helperText}</p>
      </div>

      <div className="mt-auto space-y-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="w-full rounded-[10px] bg-[#E8A87C] px-3 py-2.5 text-[13px] font-semibold text-[#1C1C1E] transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRunning ? 'Running...' : 'Run simulation'}
        </button>
        <p className="text-[10px] leading-4 text-[#666]">
          {!backendReady ? 'Connecting to backend...' : 'Cmd/Ctrl + Enter. Typical run time: about 30 seconds.'}
        </p>
      </div>
    </div>
  )
}
