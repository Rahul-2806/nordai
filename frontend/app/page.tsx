'use client'
import { useEffect, useState, useCallback } from 'react'
import Topbar from '@/components/layout/Topbar'
import HeroBand from '@/components/markets/HeroBand'
import MarketSidebar from '@/components/markets/MarketSidebar'
import SignalCard from '@/components/signals/SignalCard'
import ArbPanel from '@/components/arbitrage/ArbPanel'
import CopilotFloat from '@/components/copilot/CopilotFloat'
import MorningBrief from '@/components/ui/MorningBrief'
import SentimentPanel from '@/components/ui/SentimentPanel'
import ImbalanceRisk from '@/components/ui/ImbalanceRisk'
import CrossCommodity from '@/components/ui/CrossCommodity'
import ForecastPage from '@/components/pages/ForecastPage'
import ScenariosPage from '@/components/pages/ScenariosPage'
import BacktestPage from '@/components/pages/BacktestPage'
import AnalyticsPage from '@/components/pages/AnalyticsPage'
import MarketDetail from '@/components/markets/MarketDetail'
import { getAllMarkets, getAllSignals, getArbitrage, getRegime } from '@/lib/api'
import { MarketSummary, TradingSignal, ArbitrageOpp, MarketRegime } from '@/lib/types'

export default function Dashboard() {
  const [tab, setTab]           = useState('Markets')
  const [markets, setMarkets]   = useState<MarketSummary[]>([])
  const [signals, setSignals]   = useState<TradingSignal[]>([])
  const [arbs, setArbs]         = useState<ArbitrageOpp[]>([])
  const [regime, setRegime]     = useState<MarketRegime | null>(null)
  const [selected, setSelected] = useState('DE')
  const [loading, setLoading]   = useState(true)
  const [showDetail, setShowDetail] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview'|'sentiment'|'risk'|'commodity'>('overview')

  const avgPrice = markets.length
    ? markets.reduce((s, m) => s + m.current_price, 0) / markets.length : 0

  const refresh = useCallback(async () => {
    try {
      const [m, s, a, r] = await Promise.all([
        getAllMarkets(), getAllSignals(), getArbitrage(), getRegime(),
      ])
      setMarkets(m.markets || [])
      setSignals(s.signals || [])
      setArbs(a.opportunities || [])
      setRegime(r)
    } catch (e) {
      console.error('Fetch error', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [refresh])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--gold2)', marginBottom: 10 }}>NordAI</div>
        <div style={{ fontSize: 11, color: 'var(--ink4)', letterSpacing: '3px', textTransform: 'uppercase' }}>Loading market data...</div>
      </div>
    </div>
  )

  const SECTIONS = [
    { id: 'overview',   label: 'Overview'    },
    { id: 'sentiment',  label: 'Sentiment'   },
    { id: 'risk',       label: 'Risk Meter'  },
    { id: 'commodity',  label: 'Gas & Power' },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <Topbar active={tab} onTab={(t) => { setTab(t); setShowDetail(false) }} />

      {tab === 'Forecast'  && <ForecastPage  markets={markets} />}
      {tab === 'Scenarios' && <ScenariosPage markets={markets} />}
      {tab === 'Backtest'  && <BacktestPage  markets={markets} />}
      {tab === 'Analytics' && <AnalyticsPage markets={markets} signals={signals} arbs={arbs} />}

      {tab === 'Markets' && (
        <>
          <HeroBand markets={markets} regime={regime} avgPrice={avgPrice} />

          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr' }}>
            {/* Sidebar */}
            <div style={{ borderRight: '1px solid var(--cream3)', background: 'var(--cream)', minHeight: 'calc(100vh - 260px)' }}>
              <MarketSidebar
                markets={markets}
                selected={selected}
                onSelect={(code) => { setSelected(code); setShowDetail(true) }}
              />
            </div>

            {/* Main content */}
            <div style={{ background: 'var(--cream)', overflowY: 'auto' }}>

              {showDetail ? (
                <div style={{ padding: 24 }}>
                  <MarketDetail
                    country={selected}
                    market={markets.find(m => m.code === selected) || null}
                    signal={signals.find(s => s.country === selected) || null}
                    onBack={() => setShowDetail(false)}
                  />
                </div>
              ) : (
                <>
                  {/* Section tabs */}
                  <div style={{
                    display: 'flex', gap: 0,
                    borderBottom: '1px solid var(--cream3)',
                    padding: '0 24px',
                    background: 'var(--cream)',
                    position: 'sticky', top: 0, zIndex: 10,
                  }}>
                    {SECTIONS.map(s => (
                      <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                        padding: '12px 16px', border: 'none', background: 'none',
                        cursor: 'pointer', fontFamily: 'Syne', fontSize: 11,
                        fontWeight: activeSection === s.id ? 700 : 400,
                        color: activeSection === s.id ? 'var(--ink)' : 'var(--ink4)',
                        borderBottom: activeSection === s.id ? '2px solid var(--gold)' : '2px solid transparent',
                        letterSpacing: '0.5px', transition: 'all 0.15s',
                      }}>{s.label}</button>
                    ))}
                  </div>

                  <div style={{ padding: 24 }}>
                    {activeSection === 'overview' && (
                      <>
                        <MorningBrief />
                        <div className="section-label">Trading Signals</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
                          {signals.slice(0, 6).map((s, i) => <SignalCard key={i} signal={s} />)}
                        </div>
                        <ArbPanel opps={arbs} />
                      </>
                    )}

                    {activeSection === 'sentiment' && (
                      <div className="card">
                        <SentimentPanel />
                      </div>
                    )}

                    {activeSection === 'risk' && (
                      <div className="card">
                        <ImbalanceRisk markets={markets} />
                      </div>
                    )}

                    {activeSection === 'commodity' && (
                      <CrossCommodity markets={markets} />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <CopilotFloat />
    </div>
  )
}