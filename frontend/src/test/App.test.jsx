import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App.jsx'

const mockSimulationResponse = {
  intent: 'feature_decision',
  intent_source: 'detected',
  personas: [
    { id: 'end_user', name: 'The End User', role: 'Real person trying to get something done' },
    { id: 'skeptic', name: 'The Skeptic', role: 'Questions assumptions, pushes back on hype' },
    { id: 'devils_advocate', name: "The Devil's Advocate", role: 'Finds the holes in any idea' },
    { id: 'power_user', name: 'The Power User', role: 'Domain expert who pushes products to their limits' },
    { id: 'builder', name: 'The Builder', role: 'Engineer evaluating technical feasibility' },
  ],
  phase1_reactions: [
    { persona: 'The End User', persona_id: 'end_user', message: 'I want this to be easy to trust.' },
    { persona: 'The Skeptic', persona_id: 'skeptic', message: 'Show me the baseline before adding friction.' },
  ],
  phase2_debate: [
    { persona: 'The Skeptic', message: 'We should validate the drop-off first.' },
    { persona: 'The Builder', message: 'Implementation complexity is not trivial here.' },
  ],
  summary: {
    overall_sentiment: 'Mixed leaning cautious.',
    strongest_support: 'The Builder saw potential if scope stays narrow.',
    biggest_concern: 'The team may add friction before proving the problem.',
    explore_next: 'Where do new users actually churn in the first week?',
  },
}

const mockSteerResponse = {
  debate_continuation: [
    { persona: 'The End User', message: 'Opt-in feels less pushy to me.' },
    { persona: 'The Builder', message: 'Opt-in also keeps the implementation smaller.' },
  ],
}

function buildFetchMock() {
  return vi.fn(async (url, options = {}) => {
    const requestUrl = String(url)

    if (requestUrl.includes('/health')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' }),
      }
    }

    if (requestUrl.includes('/simulate')) {
      return {
        ok: true,
        status: 200,
        json: async () => mockSimulationResponse,
      }
    }

    if (requestUrl.includes('/steer')) {
      return {
        ok: true,
        status: 200,
        json: async () => mockSteerResponse,
      }
    }

    throw new Error(`Unhandled fetch request: ${requestUrl}`)
  })
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve()
  })
}

async function advanceRevealTimers() {
  await act(async () => {
    await vi.runAllTimersAsync()
  })
  await flushMicrotasks()
}

describe('Orbit App', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    global.fetch = buildFetchMock()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('runs the mocked simulation flow and supports steering', async () => {
    render(<App />)

    await flushMicrotasks()

    const textarea = screen.getByPlaceholderText(/mandatory onboarding checklist/i)
    fireEvent.change(textarea, { target: { value: 'Should we add an AI meeting notes feature?' } })

    const runButton = screen.getByRole('button', { name: /run simulation/i })
    fireEvent.click(runButton)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/simulate'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          input: 'Should we add an AI meeting notes feature?',
          intent_override: null,
        }),
      }),
    )

    await advanceRevealTimers()

    expect(screen.getByText(/Mixed leaning cautious\./i)).toBeInTheDocument()
    expect(screen.queryByText(/We should validate the drop-off first\./i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /phase 2 - live debate/i }))

    expect(screen.getByText(/We should validate the drop-off first\./i)).toBeInTheDocument()

    const steerInput = screen.getByPlaceholderText(/Steer the debate/i)
    fireEvent.change(steerInput, { target: { value: 'What if we made it opt-in?' } })
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }))

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/steer'),
      expect.objectContaining({ method: 'POST' }),
    )

    await advanceRevealTimers()

    expect(screen.getByText(/Opt-in feels less pushy to me\./i)).toBeInTheDocument()
    expect(screen.getByText(/The summary reflects the last full simulation run\./i)).toBeInTheDocument()
  }, 15000)

  it('sends a manual intent override when the user changes the chip', async () => {
    render(<App />)

    await flushMicrotasks()

    const textarea = screen.getByPlaceholderText(/mandatory onboarding checklist/i)
    fireEvent.change(textarea, { target: { value: 'Should we launch this next month?' } })

    fireEvent.click(screen.getByRole('button', { name: /run simulation/i }))
    await advanceRevealTimers()

    expect(screen.getByText(/Auto-detected: Feature decision/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /strategy/i }))
    fireEvent.click(screen.getByRole('button', { name: /run simulation/i }))
    await flushMicrotasks()

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/simulate'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          input: 'Should we launch this next month?',
          intent_override: 'strategic_decision',
        }),
      }),
    )
  }, 15000)

  it('keeps the backend in warming state when the health check is unsuccessful', async () => {
    global.fetch = vi.fn(async (url) => {
      const requestUrl = String(url)

      if (requestUrl.includes('/health')) {
        return {
          ok: false,
          status: 503,
          json: async () => ({ status: 'unavailable' }),
        }
      }

      throw new Error(`Unhandled fetch request: ${requestUrl}`)
    })

    render(<App />)

    await flushMicrotasks()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })

    expect(screen.getByText(/Warming up the simulation engine/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /run simulation/i })).toBeDisabled()
  }, 15000)
})
