export default function InputPanel({ input, onInputChange, onSubmit, isRunning, backendReady }) {
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !isRunning && backendReady && input.trim()) {
      onSubmit()
    }
  }

  const handleInput = (e) => {
    onInputChange(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const disabled = isRunning || !backendReady || !input.trim()

  return (
    <div className="space-y-3">
      <textarea
        value={input}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Describe your feature idea, product decision, or paste a PRD..."
        className="w-full bg-orbit-surface border border-orbit-border rounded-xl px-5 py-4 text-orbit-text text-sm placeholder:text-orbit-muted resize-none focus:outline-none focus:border-orbit-primary transition-colors duration-200 leading-relaxed"
        style={{ minHeight: '120px', overflow: 'hidden' }}
        rows={4}
      />

      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full bg-orbit-primary text-white font-medium py-3 rounded-lg text-sm transition-opacity duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isRunning ? 'Running...' : 'Run Simulation'}
      </button>

      <div className="flex items-center justify-between px-1">
        <span className="text-orbit-muted text-xs">
          {!backendReady ? 'Connecting to backend...' : 'Cmd + Enter to run'}
        </span>
        <span className="text-orbit-muted text-xs">~30 seconds</span>
      </div>
    </div>
  )
}
