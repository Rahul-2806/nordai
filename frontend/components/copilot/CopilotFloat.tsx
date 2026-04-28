'use client'
import { useState, useRef, useEffect } from 'react'
import { chatWithCopilot, clearCopilotSession } from '@/lib/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  tool_used?: string | null
}

const SUGGESTIONS = [
  'Best arbitrage right now?',
  'Why is Germany expensive today?',
  'Forecast for Italy tomorrow?',
  'What is the current market regime?',
]

const TOOL_LABELS: Record<string, string> = {
  get_live_prices:  '⚡ Fetched live prices',
  get_arbitrage:    '📊 Checked arbitrage',
  get_signals:      '📈 Pulled trading signals',
  get_forecast:     '🔮 Ran price forecast',
  get_regime:       '🧠 Classified market regime',
}

export default function CopilotFloat() {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Good morning. I have live data on all European electricity markets and can call real-time tools. Ask me anything — prices, signals, arbitrage, forecasts, or market drivers.',
    },
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [unread, setUnread]     = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [open, messages])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await chatWithCopilot(msg, sessionId)
      if (res.session_id && !sessionId) setSessionId(res.session_id)
      setMessages(prev => [...prev, {
        role:     'assistant',
        content:  res.reply,
        tool_used: res.tool_used,
      }])
      if (!open) setUnread(n => n + 1)
    } catch {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: 'Connection error. Is the backend running?',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (sessionId) await clearCopilotSession(sessionId).catch(() => {})
    setSessionId(null)
    setMessages([{
      role:    'assistant',
      content: 'Session cleared. Starting fresh with live market data.',
    }])
  }

  return (
    <>
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 998,
        }} />
      )}

      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 999,
          width: 380, height: 580,
          background: 'var(--ink)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          animation: 'fadeUp 0.25s ease',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--gold)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800,
              fontSize: 13, color: 'var(--ink)', flexShrink: 0,
            }}>N</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--cream)' }}>
                NordAI Co-Pilot
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink4)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4caf50' }} />
                {sessionId ? 'Memory active · Live data connected' : 'Live data connected'}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              {sessionId && (
                <button onClick={handleClear} style={{
                  background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--ink4)', cursor: 'pointer', fontSize: 9,
                  padding: '3px 7px', borderRadius: 4, fontFamily: 'Syne',
                  letterSpacing: '0.5px',
                }}>CLEAR</button>
              )}
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none',
                color: 'var(--ink4)', cursor: 'pointer', fontSize: 18,
                lineHeight: 1, padding: '2px 6px', borderRadius: 4,
              }}>×</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 10,
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: 3,
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {m.role === 'assistant' && (
                  <div style={{
                    fontSize: 9, letterSpacing: '1px',
                    color: 'var(--ink4)', textTransform: 'uppercase', paddingLeft: 2,
                  }}>NordAI</div>
                )}
                {/* Tool use indicator */}
                {m.tool_used && (
                  <div style={{
                    fontSize: 9, color: 'var(--gold)',
                    background: 'rgba(200,146,42,0.1)',
                    border: '1px solid rgba(200,146,42,0.2)',
                    borderRadius: 4, padding: '2px 7px',
                    fontFamily: 'Syne', letterSpacing: '0.5px',
                  }}>
                    {TOOL_LABELS[m.tool_used] || `🔧 Used ${m.tool_used}`}
                  </div>
                )}
                <div style={{
                  maxWidth: '88%',
                  background: m.role === 'user' ? 'var(--gold)' : 'rgba(255,255,255,0.06)',
                  border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
                  padding: '9px 13px',
                  fontSize: 12,
                  color: m.role === 'user' ? 'var(--ink)' : 'var(--cream2)',
                  fontWeight: m.role === 'user' ? 600 : 400,
                  lineHeight: 1.6, whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 5, padding: '6px 10px' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)',
                    animation: `pulse-dot 1s ease-in-out ${i * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div style={{ padding: '0 14px 8px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)} style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, padding: '4px 10px', fontSize: 10,
                  color: 'var(--ink4)', cursor: 'pointer', fontFamily: 'Syne',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--cream2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--ink4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '10px 14px 14px',
            display: 'flex', gap: 8,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about markets, signals, arb..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, padding: '9px 12px',
                color: 'var(--cream2)', fontSize: 12,
                fontFamily: 'Syne', outline: 'none',
              }}
            />
            <button onClick={() => send()} disabled={loading} style={{
              background: 'var(--gold)', color: 'var(--ink)',
              border: 'none', borderRadius: 8, padding: '9px 14px',
              fontSize: 12, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Syne', opacity: loading ? 0.6 : 1, flexShrink: 0,
            }}>→</button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
        width: 56, height: 56, borderRadius: '50%',
        background: open ? 'var(--ink2)' : 'var(--gold)',
        border: '2px solid ' + (open ? 'var(--ink4)' : 'var(--gold3)'),
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        transition: 'all 0.2s',
        fontFamily: "'Playfair Display', serif",
        fontSize: 20, color: open ? 'var(--cream)' : 'var(--ink)', fontWeight: 600,
      }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? '×' : 'N'}
        {unread > 0 && !open && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--rose)', color: '#fff',
            fontSize: 10, fontWeight: 700, fontFamily: 'Syne',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unread}</div>
        )}
      </button>
    </>
  )
}