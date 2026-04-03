import { useState } from 'react'
import { Copy, Check, RotateCcw } from 'lucide-react'

function getSentimentAccent(sentiment) {
  const lower = (sentiment || '').toLowerCase()
  if (lower.includes('positive') && !lower.includes('negative') && !lower.includes('mixed')) {
    return '#4CAF82'
  }
  if (lower.includes('negative') && !lower.includes('positive')) {
    return '#E94560'
  }
  return '#F0A500'
}

function Card({ title, content, accentColour, fullWidth }) {
  return (
    <div
      className={`bg-orbit-surface rounded-xl p-5 border border-orbit-border animate-fade-in-up ${fullWidth ? 'col-span-2' : ''}`}
      style={{ borderLeft: `3px solid ${accentColour}` }}
    >
      <p className="text-orbit-muted text-xs uppercase tracking-widest font-medium mb-3">{title}</p>
      <p className="text-orbit-text text-sm leading-relaxed">{content}</p>
    </div>
  )
}

export default function SummaryPanel({ summary, onReset }) {
  const [copied, setCopied] = useState(false)
  const sentimentAccent = getSentimentAccent(summary.overall_sentiment)

  const handleCopy = async () => {
    const text = [
      `Overall Sentiment\n${summary.overall_sentiment}`,
      `Strongest Support\n${summary.strongest_support}`,
      `Biggest Concern\n${summary.biggest_concern}`,
      `Explore Next\n${summary.explore_next}`,
    ].join('\n\n')

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }

  return (
    <div className="animate-fade-in-up">
      <p className="text-orbit-muted text-xs uppercase tracking-widest font-medium mb-4">
        Simulation Summary
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Sentiment spans full width */}
        <div
          className="col-span-2 bg-orbit-surface rounded-xl p-5 border animate-fade-in-up"
          style={{ borderColor: sentimentAccent, borderLeft: `3px solid ${sentimentAccent}` }}
        >
          <p className="text-orbit-muted text-xs uppercase tracking-widest font-medium mb-3">
            Overall Sentiment
          </p>
          <p className="text-orbit-text text-sm leading-relaxed">{summary.overall_sentiment}</p>
        </div>

        <Card
          title="Strongest Support"
          content={summary.strongest_support}
          accentColour="#4CAF82"
        />

        <Card
          title="Biggest Concern"
          content={summary.biggest_concern}
          accentColour="#E94560"
        />

        <Card
          title="Explore Next"
          content={summary.explore_next}
          accentColour="#6C63FF"
          fullWidth
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2.5 bg-orbit-surface border border-orbit-border rounded-lg text-orbit-muted text-sm hover:text-orbit-text transition-colors duration-200"
        >
          <RotateCcw size={13} />
          Run Another Simulation
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 bg-orbit-primary text-white rounded-lg text-sm hover:opacity-90 transition-opacity duration-200"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy Summary'}
        </button>
      </div>
    </div>
  )
}
