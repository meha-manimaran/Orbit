import { useState } from 'react'

export default function SteerInput({ onSteer, isVisible, disabled }) {
  const [message, setMessage] = useState('')

  if (!isVisible) return null

  const handleSubmit = () => {
    if (!message.trim() || disabled) return
    onSteer(message.trim())
    setMessage('')
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-[#EAE6DF] bg-[#F5F2EC] px-5 py-4 md:flex-row md:items-center md:px-7">
      <input
        type="text"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Steer the debate - e.g. 'what if we made it opt-in?'"
        disabled={disabled}
        className="min-w-0 flex-1 rounded-[8px] border border-[#DDD8D0] bg-white px-3.5 py-2.5 text-[12px] text-[#1C1C1E] outline-none transition-colors duration-150 placeholder:text-[#9A938A] focus:border-[#E8A87C] disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        className="rounded-[8px] bg-[#1C1C1E] px-4 py-2.5 text-[12px] font-medium text-[#F5F0E8] transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Send
      </button>
    </div>
  )
}
