import axios from 'axios'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7860'
const api = axios.create({ baseURL: BASE, timeout: 60000 })

export async function getAllMarkets() {
  const r = await api.get('/api/market/all')
  return r.data
}

export async function getAllSignals() {
  const r = await api.get('/api/signals/all')
  return r.data
}

export async function getArbitrage() {
  const r = await api.get('/api/arbitrage/opportunities')
  return r.data
}

export async function getRegime() {
  const r = await api.get('/api/regime/current')
  return r.data
}

export async function getForecast(country: string, hours = 48) {
  const r = await api.get(`/api/forecast/${country}?hours=${hours}`)
  return r.data
}

export async function getMarketWeather(country: string) {
  const r = await api.get(`/api/market/weather/${country}`)
  return r.data
}

export async function getMorningBrief() {
  const r = await api.get('/api/briefing/today')
  return r.data
}

export async function getSentiment() {
  const r = await api.get('/api/sentiment/news')
  return r.data
}

// ── Agentic Co-Pilot (v2) — persistent memory + tool use ─────────────
export async function chatWithCopilot(
  message: string,
  session_id?: string | null,
) {
  const r = await api.post('/api/copilot/chat', {
    message,
    session_id: session_id || null,
  })
  return r.data as {
    reply: string
    session_id: string
    tool_used: string | null
    sources: string[]
  }
}

export async function clearCopilotSession(session_id: string) {
  const r = await api.delete(`/api/copilot/session/${session_id}`)
  return r.data
}

export async function runScenario(payload: {
  country: string
  wind_change_pct?: number
  solar_change_pct?: number
  demand_change_pct?: number
  gas_price_change_pct?: number
}) {
  const r = await api.post('/api/scenario/run', payload)
  return r.data
}

export async function runBacktest(payload: {
  strategy: string
  countries: string[]
  start_date: string
  end_date: string
  initial_capital?: number
}) {
  const r = await api.post('/api/backtest/run', payload)
  return r.data
}