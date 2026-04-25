'use client'
import { useState } from 'react'
import { runBacktest } from '@/lib/api'
import { MarketSummary } from '@/lib/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'

export default function BacktestPage({ markets }: { markets: MarketSummary[] }) {
  const [strategy, setStrategy] = useState('moving_avg')
  const [country, setCountry]   = useState('DE')
  const [capital, setCapital]   = useState(100000)
  const [result, setResult]     = useState<any>(null)
  const [loading, setLoading]   = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const r = await runBacktest({
        strategy, countries: [country],
        start_date: '2024-01-01', end_date: '2024-12-31',
        initial_capital: capital,
      })
      setResult(r)
    } catch {}
    setLoading(false)
  }

  const STRATEGIES = [
    { id: 'moving_avg',    label: 'Moving Average Crossover' },
    { id: 'regime_based',  label: 'Regime-Based Strategy'   },
  ]

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 6 }}>Historical Testing</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: 'var(--ink)' }}>Strategy Backtester</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-label">Strategy</div>
            {STRATEGIES.map(s => (
              <div key={s.id} onClick={() => setStrategy(s.id)} style={{
                padding: '10px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 6,
                background: strategy === s.id ? 'var(--ink)' : 'var(--cream2)',
                color: strategy === s.id ? 'var(--gold2)' : 'var(--ink3)',
                fontSize: 12, fontWeight: 600, fontFamily: 'Syne',
                border: '1px solid var(--cream3)',
              }}>
                {s.label}
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-label">Market</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {markets.slice(0,6).map(m => (
                <button key={m.code} onClick={() => setCountry(m.code)} style={{
                  padding: '5px 10px', borderRadius: 4, border: '1px solid var(--cream3)',
                  background: country === m.code ? 'var(--gold)' : 'transparent',
                  color: country === m.code ? 'var(--ink)' : 'var(--ink3)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne',
                }}>{m.code}</button>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-label">Initial Capital</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[50000, 100000, 250000].map(c => (
                <button key={c} onClick={() => setCapital(c)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 4, border: '1px solid var(--cream3)',
                  background: capital === c ? 'var(--ink)' : 'transparent',
                  color: capital === c ? 'var(--gold2)' : 'var(--ink3)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne',
                }}>€{(c/1000).toFixed(0)}k</button>
              ))}
            </div>
          </div>

          <button onClick={run} disabled={loading} style={{
            width: '100%', padding: '12px', background: 'var(--ink)',
            color: 'var(--gold2)', border: 'none', borderRadius: 6,
            fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Syne', letterSpacing: '1px', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'RUNNING...' : 'RUN BACKTEST →'}
          </button>
        </div>

        <div>
          {!result ? (
            <div className="card" style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
                <div style={{ fontSize: 13, color: 'var(--ink4)' }}>Configure and run a backtest</div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-up">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total Return', value: `${result.total_return_pct > 0 ? '+' : ''}${result.total_return_pct.toFixed(1)}%`, color: result.total_return_pct > 0 ? 'var(--green2)' : 'var(--rose)' },
                  { label: 'Sharpe Ratio', value: result.sharpe_ratio.toFixed(2),         color: 'var(--ink)' },
                  { label: 'Max Drawdown', value: `-${result.max_drawdown_pct.toFixed(1)}%`, color: 'var(--rose)' },
                  { label: 'Win Rate',     value: `${result.win_rate.toFixed(0)}%`,        color: result.win_rate > 50 ? 'var(--green2)' : 'var(--rose)' },
                ].map((s,i) => (
                  <div key={i} className="card">
                    <div style={{ fontSize: 9, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="section-label" style={{ marginBottom: 16 }}>Equity Curve</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={result.equity_curve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--cream3)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--ink4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} interval={Math.floor(result.equity_curve.length / 5)} />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--ink4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={55} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--ink)', border: '1px solid var(--ink3)', borderRadius: 6, fontSize: 11, color: 'var(--cream)', fontFamily: 'JetBrains Mono' }}
                      formatter={(v: any) => [`€${Number(v).toLocaleString()}`, 'Portfolio']}
                    />
                    <ReferenceLine y={capital} stroke="var(--ink4)" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="value" stroke="var(--gold)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
