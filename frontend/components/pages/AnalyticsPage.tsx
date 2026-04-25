'use client'
import { MarketSummary, TradingSignal, ArbitrageOpp } from '@/lib/types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import ImbalanceRisk from '@/components/ui/ImbalanceRisk'
import SentimentPanel from '@/components/ui/SentimentPanel'
import CrossCommodity from '@/components/ui/CrossCommodity'

const FLAGS: Record<string, string> = {
  DE:'🇩🇪',FR:'🇫🇷',NL:'🇳🇱',ES:'🇪🇸',BE:'🇧🇪',GB:'🇬🇧',IT:'🇮🇹',PL:'🇵🇱',AT:'🇦🇹',CH:'🇨🇭',
}

export default function AnalyticsPage({ markets, signals, arbs }: {
  markets: MarketSummary[]; signals: TradingSignal[]; arbs: ArbitrageOpp[]
}) {
  const priceData = markets.map(m => ({ name: m.code, price: m.current_price, change: m.change_pct }))
  const avgConf   = signals.length ? signals.reduce((s, x) => s + x.confidence, 0) / signals.length * 100 : 0
  const totalArb  = arbs.reduce((s, a) => s + a.net_profit, 0)
  const bullMarkets = markets.filter(m => m.trend === 'up').length
  const signalCounts = {
    BUY:  signals.filter(s => s.signal === 'BUY').length,
    HOLD: signals.filter(s => s.signal === 'HOLD').length,
    SELL: signals.filter(s => s.signal === 'SELL').length,
  }

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 6 }}>Market Intelligence</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: 'var(--ink)' }}>Analytics Dashboard</h1>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Markets Tracked',   value: markets.length.toString(),           sub: 'European exchanges' },
          { label: 'Bullish Markets',   value: `${bullMarkets}/${markets.length}`,  sub: 'trending up today' },
          { label: 'Signal Confidence', value: `${avgConf.toFixed(0)}%`,            sub: 'average across all' },
          { label: 'Total Arb Value',   value: `€${totalArb.toFixed(1)}`,           sub: 'net profit available' },
        ].map((k, i) => (
          <div key={i} className="card animate-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ fontSize: 9, color: 'var(--ink4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--ink)', marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 10, color: 'var(--ink4)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div className="section-label" style={{ marginBottom: 16 }}>Live Prices by Market</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priceData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cream3)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--ink4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--ink4)', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={35} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: 'var(--ink)', border: '1px solid var(--ink3)', borderRadius: 6, fontSize: 11, color: 'var(--cream)', fontFamily: 'JetBrains Mono' }}
                formatter={(v: any) => [`€${Number(v).toFixed(1)}`, 'Price']}
              />
              <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                {priceData.map((e, i) => <Cell key={i} fill={e.change > 0 ? '#3d9e6e' : '#c05060'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="section-label" style={{ marginBottom: 16 }}>Signal Distribution</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'BUY',  count: signalCounts.BUY,  color: 'var(--green2)', bg: '#e8f5ee' },
              { label: 'HOLD', count: signalCounts.HOLD, color: 'var(--ink4)',   bg: 'var(--cream2)' },
              { label: 'SELL', count: signalCounts.SELL, color: 'var(--rose)',   bg: '#fdf0f0' },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '16px 8px', background: s.bg, borderRadius: 8 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 38, color: s.color, marginBottom: 4 }}>{s.count}</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: s.color }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink4)', textAlign: 'center' }}>
            {signals.length} total signals · avg {avgConf.toFixed(0)}% confidence
          </div>
        </div>
      </div>

      {/* Imbalance risk */}
      <div className="card" style={{ marginBottom: 24 }}>
        <ImbalanceRisk markets={markets} />
      </div>

      {/* Cross commodity */}
      <div style={{ marginBottom: 24 }}>
        <CrossCommodity markets={markets} />
      </div>

      {/* Sentiment */}
      <div className="card" style={{ marginBottom: 24 }}>
        <SentimentPanel />
      </div>

      {/* Arb table */}
      <div className="card">
        <div className="section-label" style={{ marginBottom: 16 }}>Arbitrage Opportunities</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--cream3)' }}>
              {['Route', 'From', 'To', 'Spread', 'Trans Cost', 'Net Profit', 'Window', 'Conf'].map(h => (
                <th key={h} style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink4)', padding: '0 8px 10px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {arbs.slice(0, 8).map((a, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--cream3)' }}>
                <td style={{ padding: '10px 8px', fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                  {FLAGS[a.from_country]} {a.from_country} → {FLAGS[a.to_country]} {a.to_country}
                </td>
                <td style={{ padding: '10px 8px', fontFamily: 'JetBrains Mono', fontSize: 11 }}>€{a.from_price.toFixed(1)}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'JetBrains Mono', fontSize: 11 }}>€{a.to_price.toFixed(1)}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'JetBrains Mono', fontSize: 11 }}>€{a.spread.toFixed(1)}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--ink4)' }}>€{a.transmission_cost.toFixed(1)}</td>
                <td style={{ padding: '10px 8px', fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--green)', fontWeight: 600 }}>+€{a.net_profit.toFixed(1)}</td>
                <td style={{ padding: '10px 8px', fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--ink4)' }}>{a.window_hours.toFixed(1)}h</td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{ background: '#e8f5ee', color: 'var(--green)', padding: '2px 8px', borderRadius: 3, fontFamily: 'JetBrains Mono', fontSize: 10 }}>
                    {(a.confidence * 100).toFixed(0)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}