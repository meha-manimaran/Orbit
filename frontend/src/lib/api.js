const BASE_URL = import.meta.env.VITE_API_URL

export async function runSimulation(input, intentOverride = null) {
  const res = await fetch(`${BASE_URL}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input,
      intent_override: intentOverride,
    }),
  })
  if (!res.ok) throw new Error(`Simulation failed: ${res.status}`)
  return res.json()
}

export async function steerConversation(message, conversationHistory, personas) {
  const res = await fetch(`${BASE_URL}/steer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation_history: conversationHistory, personas }),
  })
  if (!res.ok) throw new Error(`Steer failed: ${res.status}`)
  return res.json()
}
