import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function SteerInput({ onSteer, isVisible, disabled }) {
  const [message, setMessage] = useState('')

  if (!isVisible) return null

  const handleSubmit = () => {
    if (!message.trim() || disabled) return
    onSteer(message.trim())
    setMessage('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2 bg-orbit-surface border border-orbit-border rounded-xl px-4 py-3 transition-opacity duration-200">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Steer the conversation..."
        disabled={disabled}
        className="flex-1 bg-transparent text-orbit-text text-sm placeholder:text-orbit-muted focus:outline-none disabled:opacity-50 min-w-0"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        className="w-8 h-8 rounded-lg bg-orbit-primary flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity duration-200 hover:opacity-90"
      >
        <ArrowRight size={14} className="text-white" />
      </button>
    </div>
  )
}
