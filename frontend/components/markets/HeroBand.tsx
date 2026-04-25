'use client'
import PriceTicker from './PriceTicker'
import { MarketSummary, MarketRegime } from '@/lib/types'

const REGIME_COLORS: Record<string, string> = {
  low_wind: 'var(--gold)', demand_spike: '#e05c6a',
  renewable_surplus: '#3d9e6e', gas_to_power: '#e07a2a',
  congestion: '#7a6ae8', normal: 'var(--ink4)',
}

export default function HeroBand({
  markets, regime, avgPrice,
}: {
  markets: MarketSummary[]
  regime: MarketRegime | null
  avgPrice: number
}) {
  const bullish = markets.filter(m => m.trend === 'up').length
  const avgChange = markets.length ? (markets.reduce((s, m) => s + m.change_pct, 0) / markets.length) : 0

  return (
    <div style={{ background: 'var(--ink)', paddingTop: 28, position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -80, right: -80, width: 360, height: 360,
        background: 'radial-gradient(circle, rgba(200,149,42,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '2px', color: 'var(--ink4)', textTransform: 'uppercase', marginBottom: 6 }}>
            European Electricity Intelligence
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: 'var(--cream)', fontWeight: 500, lineHeight: 1.2, marginBottom: 8 }}>
            Good morning. <span style={{ color: 'var(--gold2)' }}>Markets are live.</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--ink4)', letterSpacing: '0.3px' }}>
            {bullish} markets trending up · avg {avgChange > 0 ? '+' : ''}{avgChange.toFixed(1)}% today
            {regime && ` · ${regime.label} detected`}
          </p>
        </div>
        <div style={{ textAlign: 'right', paddingTop: 4 }}>
          <div style={{ fontSize: 9, color: 'var(--ink4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 4 }}>
            EU Avg Price
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: 'var(--gold2)', lineHeight: 1 }}>
            €{avgPrice.toFixed(1)}
          </div>
          <div style={{ fontSize: 10, color: avgChange >= 0 ? '#5cb85c' : '#e05c6a', fontFamily: 'JetBrains Mono', marginTop: 4 }}>
            {avgChange >= 0 ? '▲' : '▼'} {Math.abs(avgChange).toFixed(1)}% today
          </div>
        </div>
      </div>

      {/* Regime strip */}
      {regime && (
        <div style={{
          margin: '0 24px 0', padding: '8px 14px',
          background: '#ffffff06', border: '1px solid #ffffff10',
          borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0,
        }}>
          <div style={{
            background: REGIME_COLORS[regime.regime] || 'var(--gold)',
            color: 'var(--ink)', padding: '3px 10px', borderRadius: 4,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', whiteSpace: 'nowrap',
          }}>
            ⚡ {regime.label.toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cream3)', flex: 1 }}>
            {regime.description}
          </div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--ink4)', whiteSpace: 'nowrap' }}>
            {(regime.confidence * 100).toFixed(0)}% conf
          </div>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <PriceTicker markets={markets} />
      </div>
    </div>
  )
}
