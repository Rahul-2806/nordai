'use client'
import { ArbitrageOpp } from '@/lib/types'

export default function ArbPanel({ opps }: { opps: ArbitrageOpp[] }) {
  return (
    <div>
      <div className="section-label">Arbitrage Opportunities</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {opps.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--ink4)', padding: '12px 0' }}>No opportunities detected</div>
        )}
        {opps.slice(0, 5).map((o, i) => (
          <div key={i} className="card animate-fade-up" style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '10px 14px',
            animationDelay: `${i * 0.07}s`,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: o.net_profit > 10 ? 'var(--gold2)' : o.net_profit > 5 ? 'var(--gold)' : 'var(--ink4)',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {o.from_country}
                <span style={{ color: 'var(--gold)', fontSize: 14 }}>→</span>
                {o.to_country}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 2, fontFamily: 'JetBrains Mono' }}>
                Spread €{o.spread.toFixed(1)} · Trans €{o.transmission_cost.toFixed(1)} · {o.window_hours.toFixed(1)}h window
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--green)' }}>
                +€{o.net_profit.toFixed(1)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--ink4)', fontFamily: 'JetBrains Mono' }}>
                {(o.confidence * 100).toFixed(0)}% conf
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
