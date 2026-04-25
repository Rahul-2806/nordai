'use client'
import { TradingSignal } from '@/lib/types'

const FLAGS: Record<string, string> = {
  DE:'🇩🇪',FR:'🇫🇷',NL:'🇳🇱',ES:'🇪🇸',BE:'🇧🇪',GB:'🇬🇧',IT:'🇮🇹',PL:'🇵🇱',AT:'🇦🇹',CH:'🇨🇭',
}
const SIGNAL_COLOR = { BUY:'var(--green2)', SELL:'var(--rose)', HOLD:'var(--ink4)' }
const BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  BUY:  { bg: '#e8f5ee', color: 'var(--green)'  },
  SELL: { bg: '#fdf0f0', color: 'var(--rose)'   },
  HOLD: { bg: 'var(--cream2)', color: 'var(--ink3)' },
}

export default function SignalCard({ signal }: { signal: TradingSignal }) {
  const bs = BADGE_STYLE[signal.signal]
  const pct = Math.round(signal.confidence * 100)

  return (
    <div className="card animate-fade-up" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: SIGNAL_COLOR[signal.signal] }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingTop: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{FLAGS[signal.country] || '🏳️'}</span>
          {signal.name || signal.country}
        </div>
        <div style={{
          ...bs, padding: '3px 9px', borderRadius: 3,
          fontSize: 9, fontWeight: 700, letterSpacing: '1px', fontFamily: 'Syne',
        }}>
          {signal.signal}
        </div>
      </div>

      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'var(--ink)', marginBottom: 6 }}>
        €{signal.current_price.toFixed(1)}
        <span style={{ fontSize: 12, color: 'var(--ink4)', fontFamily: 'Syne', fontWeight: 400 }}> / MWh</span>
      </div>

      {signal.reasons.slice(0, 2).map((r, i) => (
        <div key={i} style={{ fontSize: 10, color: 'var(--ink3)', lineHeight: 1.5, marginBottom: 2 }}>
          · {r}
        </div>
      ))}

      <div style={{ height: 2, background: 'var(--cream3)', borderRadius: 1, marginTop: 10 }}>
        <div className="animate-bar-grow" style={{
          height: 2, borderRadius: 1,
          background: SIGNAL_COLOR[signal.signal],
          width: `${pct}%`,
        }} />
      </div>
      <div style={{ fontSize: 9, color: 'var(--ink4)', marginTop: 4, fontFamily: 'JetBrains Mono' }}>
        {pct}% confidence · target €{signal.target_price.toFixed(1)}
      </div>
    </div>
  )
}
