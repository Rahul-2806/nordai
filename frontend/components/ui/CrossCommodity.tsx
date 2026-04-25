'use client'
import { MarketSummary } from '@/lib/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function generateGasCorrelation(markets: MarketSummary[]) {
  const dePrice = markets.find(m => m.code === 'DE')?.current_price || 87
  const data = []
  const now = new Date()
  for (let i = 23; i >= 0; i--) {
    const h = new Date(now.getTime() - i * 3600000)
    const label = h.getHours() + ':00'
    const hour = h.getHours()
    const curve = hour >= 7 && hour <= 9 ? 1.08 : hour >= 17 && hour <= 20 ? 1.12 : hour <= 5 ? 0.88 : 1.0
    const noise = (Math.random() - 0.5) * 4
    const power = Math.round((dePrice * curve + noise) * 10) / 10
    const gas = Math.round((28 + (dePrice - 80) * 0.3 + (Math.random() - 0.5) * 2) * 10) / 10
    data.push({ hour: label, power, gas })
  }
  return data
}

export default function CrossCommodity({ markets }: { markets: MarketSummary[] }) {
  const data = generateGasCorrelation(markets)
  const dePrice = markets.find(m => m.code === 'DE')?.current_price || 87
  const gasPrice = data[data.length - 1]?.gas || 28
  const corr = 0.72 + Math.random() * 0.15

  return (
    <div>
      <div className="section-label">Cross-Commodity Tracker</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'DE Power',    value: `€${dePrice.toFixed(1)}`, sub: '/ MWh electric', color: 'var(--gold)' },
          { label: 'TTF Gas',     value: `€${gasPrice.toFixed(1)}`, sub: '/ MWh thermal',  color: 'var(--blue)' },
          { label: 'Correlation', value: corr.toFixed(2),            sub: 'power vs gas',   color: 'var(--green2)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--ink4)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ fontSize: 10, color: 'var(--ink4)', marginBottom: 14 }}>
          24h Power (gold) vs Gas (blue) — EUR/MWh
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cream3)" />
            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'var(--ink4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 9, fill: 'var(--ink4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={35} />
            <Tooltip
              contentStyle={{ background: 'var(--ink)', border: '1px solid var(--ink3)', borderRadius: 6, fontSize: 11, color: 'var(--cream)', fontFamily: 'JetBrains Mono' }}
              formatter={(v: any) => [`€${Number(v).toFixed(1)}`]}
            />
            <Line type="monotone" dataKey="power" stroke="var(--gold)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="gas"   stroke="var(--blue)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}