'use client'
import { MarketSummary } from '@/lib/types'

const RISK_THRESHOLDS = {
  HIGH:   { min: 90, color: '#c44032', bg: '#fdf0f0', label: 'HIGH' },
  MEDIUM: { min: 75, color: '#c8952a', bg: '#fdf5e0', label: 'MED'  },
  LOW:    { min: 0,  color: '#2d6e4e', bg: '#e8f5ee', label: 'LOW'  },
}

function getRisk(price: number, avgPrice: number) {
  const ratio = price / avgPrice
  if (ratio > 1.1) return RISK_THRESHOLDS.HIGH
  if (ratio > 1.0) return RISK_THRESHOLDS.MEDIUM
  return RISK_THRESHOLDS.LOW
}

const FLAGS: Record<string, string> = {
  DE:'🇩🇪',FR:'🇫🇷',NL:'🇳🇱',ES:'🇪🇸',BE:'🇧🇪',GB:'🇬🇧',IT:'🇮🇹',PL:'🇵🇱',AT:'🇦🇹',CH:'🇨🇭',
}

export default function ImbalanceRisk({ markets }: { markets: MarketSummary[] }) {
  const avg = markets.length ? markets.reduce((s, m) => s + m.current_price, 0) / markets.length : 80

  return (
    <div>
      <div className="section-label">Imbalance Risk Meter</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {markets.map(m => {
          const risk = getRisk(m.current_price, avg)
          return (
            <div key={m.code} style={{
              background: risk.bg,
              border: `1px solid ${risk.color}30`,
              borderRadius: 8, padding: '10px 8px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{FLAGS[m.code]}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{m.code}</div>
              <div style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: 3,
                background: risk.color, color: '#fff',
                fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
              }}>{risk.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--ink3)', marginTop: 4 }}>
                €{m.current_price.toFixed(1)}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 8, textAlign: 'right' }}>
        HIGH = &gt;10% above EU avg · MED = 0–10% above · LOW = at or below avg
      </div>
    </div>
  )
}
