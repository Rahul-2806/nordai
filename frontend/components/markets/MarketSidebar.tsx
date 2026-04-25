'use client'
import { MarketSummary } from '@/lib/types'

const FLAGS: Record<string, string> = {
  DE:'🇩🇪',FR:'🇫🇷',NL:'🇳🇱',ES:'🇪🇸',BE:'🇧🇪',GB:'🇬🇧',IT:'🇮🇹',PL:'🇵🇱',AT:'🇦🇹',CH:'🇨🇭',
}

export default function MarketSidebar({
  markets, selected, onSelect,
}: { markets: MarketSummary[]; selected: string; onSelect: (c: string) => void }) {
  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ padding: '0 16px', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 10 }}>
        Markets
      </div>
      {markets.map(m => (
        <div key={m.code} onClick={() => onSelect(m.code)}
          style={{
            padding: '8px 16px', cursor: 'pointer', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
            background: selected === m.code ? 'var(--cream2)' : 'transparent',
            borderLeft: selected === m.code ? '3px solid var(--gold)' : '3px solid transparent',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (selected !== m.code) e.currentTarget.style.background = 'var(--cream2)' }}
          onMouseLeave={e => { if (selected !== m.code) e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{FLAGS[m.code] || '🏳️'}</span>
            {m.name}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>
              {m.currency === 'GBP' ? '£' : '€'}{m.current_price.toFixed(1)}
            </div>
            <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: m.trend === 'up' ? '#5cb85c' : m.trend === 'down' ? '#e05c6a' : 'var(--ink4)' }}>
              {m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '—'}{Math.abs(m.change_pct).toFixed(1)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
