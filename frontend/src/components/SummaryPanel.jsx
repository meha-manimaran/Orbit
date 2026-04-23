import { useState } from 'react'
import { Check, Copy, RotateCcw } from 'lucide-react'

function SummaryCard({ title, content }) {
  return (
    <div className="rounded-[12px] border border-[#E8E2D8] bg-white px-4 py-4">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#E8A87C]">{title}</p>
      <p className="text-[12px] leading-6 text-[#444]">{content}</p>
    </div>
  )
}

export default function SummaryPanel({ summary, onReset, isStale }) {
  const [copied, setCopied] = useState(false)

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
      // Clipboard not available.
    }
  }

  return (
    <section className="space-y-3">
      <div className="mb-3 flex items-center gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#999]">Summary</p>
        <div className="h-px flex-1 bg-[#E0DBD3]" />
      </div>

      {isStale && (
        <div className="rounded-[10px] border border-[#E8D6C6] bg-[#F7EFE6] px-3 py-2 text-[11px] leading-5 text-[#7B5B45]">
          The summary reflects the last full simulation run. Rerun the simulation if you want the summary refreshed after new steering.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SummaryCard title="Overall sentiment" content={summary.overall_sentiment} />
        <SummaryCard title="Strongest support" content={summary.strongest_support} />
        <SummaryCard title="Biggest concern" content={summary.biggest_concern} />
        <SummaryCard title="Explore next" content={summary.explore_next} />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#DDD8D0] bg-[#F0EDE8] px-3 py-2 text-[11px] font-medium text-[#555] transition-colors duration-150 hover:text-[#1C1C1E]"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy summary'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#1C1C1E] px-3 py-2 text-[11px] font-medium text-[#F5F0E8] transition-opacity duration-150 hover:opacity-90"
        >
          <RotateCcw size={12} />
          New simulation
        </button>
      </div>
    </section>
  )
}
