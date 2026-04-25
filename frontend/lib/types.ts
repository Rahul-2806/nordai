export interface MarketSummary {
  code: string
  name: string
  current_price: number
  currency: string
  change_pct: number
  change_abs: number
  prev_price: number
  trend: 'up' | 'down' | 'neutral'
}

export interface TradingSignal {
  country: string
  name: string
  signal: 'BUY' | 'SELL' | 'HOLD'
  current_price: number
  target_price: number
  confidence: number
  reasons: string[]
  timestamp: string
}

export interface ArbitrageOpp {
  from_country: string
  to_country: string
  from_price: number
  to_price: number
  spread: number
  transmission_cost: number
  net_profit: number
  window_hours: number
  confidence: number
}

export interface MarketRegime {
  regime: string
  label: string
  confidence: number
  drivers: string[]
  affected_markets: string[]
  description: string
  color: string
}

export interface ForecastPoint {
  timestamp: string
  predicted_price: number
  lower_bound: number
  upper_bound: number
  confidence: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ScenarioResult {
  country: string
  baseline_price: number
  scenario_price: number
  price_impact: number
  impact_pct: number
  cross_market_effects: Record<string, { impact: number; new_price: number }>
  narrative: string
}
