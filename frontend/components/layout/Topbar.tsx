'use client'
import { useEffect, useState } from 'react'

const TABS = ['Markets', 'Forecast', 'Scenarios', 'Backtest', 'Analytics']

export default function Topbar({ active, onTab }: { active: string; onTab: (t: string) => void }) {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' CET')
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ background: 'var(--ink)', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 24 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, border: '1.5px solid var(--gold2)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Syne', fontWeight: 800, fontSize: 12, color: 'var(--gold2)',
        }}>N</div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--gold2)', letterSpacing: 1 }}>
          NordAI
        </span>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: 2, marginLeft: 16 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => onTab(t)} style={{
            padding: '5px 14px', fontSize: 11, letterSpacing: '1px',
            textTransform: 'uppercase', borderRadius: 3, cursor: 'pointer', border: 'none',
            background: active === t ? 'var(--gold)' : 'transparent',
            color: active === t ? 'var(--ink)' : 'var(--ink4)',
            fontWeight: active === t ? 700 : 400,
            fontFamily: 'Syne',
            transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </nav>

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: '#ffffff0e', border: '1px solid #ffffff18',
          padding: '4px 14px', borderRadius: 20,
          fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--cream3)',
        }}>
          <div className="animate-pulse-dot" style={{
            width: 6, height: 6, background: '#4caf50', borderRadius: '50%',
          }} />
          LIVE · {time}
        </div>
      </div>
    </div>
  )
}
