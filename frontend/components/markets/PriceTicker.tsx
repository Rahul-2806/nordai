'use client'
import { MarketSummary } from '@/lib/types'

export default function PriceTicker({ markets }: { markets: MarketSummary[] }) {
  const items = [...markets, ...markets]

  return (
    <div style={{
      borderTop: '1px solid #ffffff10',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        display: 'flex',
        animation: 'ticker-scroll 30s linear infinite',
        width: 'max-content',
      }}>
        {items.map((m, i) => (
          <div key={i} style={{
            padding: '10px 20px',
            borderRight: '1px solid #ffffff08',
            minWidth: 100,
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 9, letterSpacing: '1.5px', color: 'var(--ink4)', textTransform: 'uppercase', marginBottom: 3 }}>
              {m.code}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 500, color: 'var(--cream)' }}>
              {m.currency === 'GBP' ? '£' : '€'}{m.current_price.toFixed(1)}
            </div>
            <div style={{
              fontSize: 9, fontFamily: 'JetBrains Mono', marginTop: 2,
              color: m.trend === 'up' ? '#5cb85c' : m.trend === 'down' ? '#e05c6a' : 'var(--ink4)',
            }}>
              {m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '—'} {Math.abs(m.change_pct).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
