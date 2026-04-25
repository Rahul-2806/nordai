'use client'
import { useEffect, useState } from 'react'
import { getMorningBrief } from '@/lib/api'

export default function MorningBrief() {
  const [brief, setBrief] = useState<{ date: string; brief: string } | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getMorningBrief().then(setBrief).catch(() => {})
  }, [])

  if (!brief) return null

  return (
    <div style={{
      background: 'var(--gold4)', border: '1px solid var(--gold3)',
      borderRadius: 8, padding: '12px 16px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 9, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink3)', fontWeight: 600 }}>
            Morning Brief
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink4)' }}>· {brief.date}</div>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'var(--gold)', fontFamily: 'Syne', fontWeight: 600,
        }}>
          {open ? 'Hide ↑' : 'Read ↓'}
        </button>
      </div>
      {open && (
        <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {brief.brief}
        </div>
      )}
    </div>
  )
}
