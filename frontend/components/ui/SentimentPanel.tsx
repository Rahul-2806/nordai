'use client'
import { useEffect, useState } from 'react'
import { getSentiment } from '@/lib/api'

interface NewsItem {
  title: string
  sentiment: number
  label: string
  timestamp: string
}

export default function SentimentPanel() {
  const [news, setNews]   = useState<NewsItem[]>([])
  const [agg, setAgg]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSentiment()
      .then(d => { setNews(d.items || []); setAgg(d.aggregate) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sentColor = agg?.label === 'bullish' ? 'var(--green2)' : agg?.label === 'bearish' ? 'var(--rose)' : 'var(--ink4)'

  return (
    <div>
      <div className="section-label">Market Sentiment</div>

      {agg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '12px 16px', background: 'var(--cream)',
          border: '1px solid var(--cream3)', borderRadius: 8, marginBottom: 12,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: sentColor }}>
              {agg.score > 0 ? '+' : ''}{(agg.score * 100).toFixed(0)}
            </div>
            <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink4)' }}>score</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: sentColor, textTransform: 'capitalize', marginBottom: 4 }}>
              {agg.label} Market Sentiment
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 10, color: 'var(--green2)' }}>▲ {agg.bullish} bullish</span>
              <span style={{ fontSize: 10, color: 'var(--ink4)' }}>— {agg.neutral} neutral</span>
              <span style={{ fontSize: 10, color: 'var(--rose)' }}>▼ {agg.bearish} bearish</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 48, borderRadius: 6 }} />
          ))
        ) : (
          news.slice(0, 5).map((n, i) => (
            <div key={i} style={{
              padding: '10px 14px',
              background: 'var(--cream)', border: '1px solid var(--cream3)',
              borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10,
              borderLeft: `3px solid ${n.label === 'bullish' ? 'var(--green2)' : n.label === 'bearish' ? 'var(--rose)' : 'var(--ink4)'}`,
            }}>
              <div style={{ flex: 1, fontSize: 11, color: 'var(--ink2)', lineHeight: 1.4 }}>{n.title}</div>
              <div style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3,
                background: n.label === 'bullish' ? '#e8f5ee' : n.label === 'bearish' ? '#fdf0f0' : 'var(--cream2)',
                color: n.label === 'bullish' ? 'var(--green)' : n.label === 'bearish' ? 'var(--rose)' : 'var(--ink4)',
                whiteSpace: 'nowrap', letterSpacing: '0.5px',
              }}>{n.label.toUpperCase()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
