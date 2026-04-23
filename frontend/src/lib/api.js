const DEFAULT_API_URL = 'http://localhost:8000'

function getBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL || DEFAULT_API_URL
  return configuredUrl.replace(/\/$/, '')
}

async function parseJsonOrThrow(res, action) {
  if (!res.ok) {
    throw new Error(`${action} failed: ${res.status}`)
  }

  return res.json()
}

export async function checkBackendHealth() {
  const res = await fetch(`${getBaseUrl()}/health`)
  return parseJsonOrThrow(res, 'Health check')
}

export async function runSimulation(input, intentOverride = null) {
  const res = await fetch(`${getBaseUrl()}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input,
      intent_override: intentOverride,
    }),
  })
  return parseJsonOrThrow(res, 'Simulation')
}

export async function steerConversation(message, conversationHistory, personas) {
  const res = await fetch(`${getBaseUrl()}/steer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_history: conversationHistory, personas }),
  })
  return parseJsonOrThrow(res, 'Steer')
}
