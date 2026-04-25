'use client'
import { useState, useEffect } from 'react'
import { getForecast } from '@/lib/api'
import { MarketSummary, ForecastPoint } from '@/lib/types'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const FLAGS: Record<string,string> = {
  DE:'🇩🇪',FR:'🇫🇷',NL:'🇳🇱',ES:'🇪🇸',BE:'🇧🇪',GB:'🇬🇧',IT:'🇮🇹',PL:'🇵🇱',AT:'🇦🇹',CH:'🇨🇭',
}

export default function ForecastPage({ markets }: { markets: MarketSummary[] }) {
  const [country, setCountry]   = useState('DE')
  const [hours, setHours]       = useState(48)
  const [forecast, setForecast] = useState<ForecastPoint[]>([])
  const [loading, setLoading]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const f = await getForecast(country, hours)
      setForecast(f.forecasts || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [country, hours])

  const chartData = forecast.map(f => ({
    time: new Date(f.timestamp).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }),
    price: f.predicted_price,
    upper: f.upper_bound,
    lower: f.lower_bound,
    conf:  Math.round(f.confidence * 100),
  }))

  const market = markets.find(m => m.code === country)

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 6 }}>Price Forecasting</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: 'var(--ink)' }}>
          24–72h Ahead Predictions
        </h1>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {markets.map(m => (
            <button key={m.code} onClick={() => setCountry(m.code)} style={{
              padding: '6px 14px', borderRadius: 5, border: '1px solid var(--cream3)',
              background: country === m.code ? 'var(--ink)' : 'var(--cream)',
              color: country === m.code ? 'var(--gold2)' : 'var(--ink3)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne',
              transition: 'all 0.15s',
            }}>
              {FLAGS[m.code]} {m.code}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {[24, 48, 72].map(h => (
            <button key={h} onClick={() => setHours(h)} style={{
              padding: '6px 14px', borderRadius: 5, border: '1px solid var(--cream3)',
              background: hours === h ? 'var(--gold)' : 'var(--cream)',
              color: hours === h ? 'var(--ink)' : 'var(--ink3)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne',
            }}>{h}h</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {market && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Current Price', value: `€${market.current_price.toFixed(1)}` },
            { label: 'Forecast High', value: forecast.length ? `€${Math.max(...forecast.map(f=>f.upper_bound)).toFixed(1)}` : '—' },
            { label: 'Forecast Low',  value: forecast.length ? `€${Math.min(...forecast.map(f=>f.lower_bound)).toFixed(1)}` : '—' },
            { label: 'Avg Confidence', value: forecast.length ? `${Math.round(forecast.reduce((s,f)=>s+f.confidence,0)/forecast.length*100)}%` : '—' },
          ].map((s,i) => (
            <div key={i} className="card">
              <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'var(--ink)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div className="section-label" style={{ marginBottom: 20 }}>
          {FLAGS[country]} {market?.name} — {hours}h Forecast
        </div>
        {loading ? (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--ink4)' }}>Generating forecast...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--gold)"  stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--gold)"  stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--gold3)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--gold3)" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cream3)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--ink4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} interval={Math.floor(chartData.length / 6)} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--ink4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={45} />
              <Tooltip
                contentStyle={{ background: 'var(--ink)', border: '1px solid var(--ink3)', borderRadius: 6, fontSize: 11, color: 'var(--cream)', fontFamily: 'JetBrains Mono' }}
                formatter={(v: any, n: string) => [`€${Number(v).toFixed(1)}`, n]}
              />
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandGrad)" strokeWidth={0} />
              <Area type="monotone" dataKey="lower" stroke="none" fill="var(--cream)" strokeWidth={0} />
              <Area type="monotone" dataKey="price" stroke="var(--gold)" strokeWidth={2.5} fill="url(#fGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
