'use client'
import { useEffect, useState } from 'react'
import { getForecast, getMarketWeather } from '@/lib/api'
import { MarketSummary, TradingSignal, ForecastPoint } from '@/lib/types'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const FLAGS: Record<string,string> = {
  DE:'🇩🇪',FR:'🇫🇷',NL:'🇳🇱',ES:'🇪🇸',BE:'🇧🇪',GB:'🇬🇧',IT:'🇮🇹',PL:'🇵🇱',AT:'🇦🇹',CH:'🇨🇭',
}
const SIGNAL_COLOR = { BUY:'var(--green2)', SELL:'var(--rose)', HOLD:'var(--ink4)' }

export default function MarketDetail({
  country, market, signal, onBack,
}: { country: string; market: MarketSummary | null; signal: TradingSignal | null; onBack: () => void }) {
  const [forecast, setForecast] = useState<ForecastPoint[]>([])
  const [weather, setWeather]   = useState<any>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getForecast(country, 48), getMarketWeather(country)])
      .then(([f, w]) => { setForecast(f.forecasts || []); setWeather(w) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [country])

  const chartData = forecast.slice(0, 24).map(f => ({
    time: new Date(f.timestamp).getHours() + ':00',
    price: f.predicted_price,
    upper: f.upper_bound,
    lower: f.lower_bound,
  }))

  return (
    <div className="animate-fade-up">
      {/* Back button */}
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 12, color: 'var(--ink4)', fontFamily: 'Syne',
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
        padding: 0,
      }}>
        ← Back to overview
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 28, marginBottom: 4 }}>{FLAGS[country] || '🏳️'}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--ink)', marginBottom: 4 }}>
            {market?.name || country}
          </h2>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--ink4)' }}>
            {market?.currency === 'GBP' ? '£' : '€'}{market?.current_price.toFixed(1)} / MWh
            <span style={{ color: market?.trend === 'up' ? 'var(--green2)' : 'var(--rose)', marginLeft: 8 }}>
              {market?.trend === 'up' ? '▲' : '▼'} {Math.abs(market?.change_pct || 0).toFixed(1)}%
            </span>
          </div>
        </div>
        {signal && (
          <div style={{
            background: signal.signal === 'BUY' ? '#e8f5ee' : signal.signal === 'SELL' ? '#fdf0f0' : 'var(--cream2)',
            color: SIGNAL_COLOR[signal.signal],
            padding: '8px 20px', borderRadius: 6, textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Syne' }}>{signal.signal}</div>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}>{Math.round(signal.confidence * 100)}% conf</div>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Current Price', value: `€${market?.current_price.toFixed(1)}`, sub: 'MWh' },
          { label: 'Wind Generation', value: `${weather?.forecast?.[0]?.wind_pct?.toFixed(0) || '—'}%`, sub: 'capacity' },
          { label: 'Solar Generation', value: `${weather?.forecast?.[0]?.solar_pct?.toFixed(0) || '—'}%`, sub: 'capacity' },
        ].map((s, i) => (
          <div key={i} className="card">
            <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: 'var(--ink)' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Signal reasons */}
      {signal && signal.reasons.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>Why {signal.signal}?</div>
          {signal.reasons.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--ink2)', padding: '6px 0', borderBottom: i < signal.reasons.length - 1 ? '1px solid var(--cream3)' : 'none' }}>
              · {r}
            </div>
          ))}
        </div>
      )}

      {/* Forecast chart */}
      <div className="card">
        <div className="section-label" style={{ marginBottom: 16 }}>24h Price Forecast</div>
        {loading ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--ink4)' }}>Loading forecast...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--gold)"  stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--gold)"  stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--ink4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--ink4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: 'var(--ink)', border: '1px solid var(--ink3)', borderRadius: 6, fontSize: 11, color: 'var(--cream)', fontFamily: 'JetBrains Mono' }}
                formatter={(v: any) => [`€${Number(v).toFixed(1)}`, 'Price']}
              />
              <Area type="monotone" dataKey="price" stroke="var(--gold)" strokeWidth={2} fill="url(#priceGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
