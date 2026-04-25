'use client'
import { useState } from 'react'
import { runScenario } from '@/lib/api'
import { MarketSummary, ScenarioResult } from '@/lib/types'

const FLAGS: Record<string,string> = {
  DE:'🇩🇪',FR:'🇫🇷',NL:'🇳🇱',ES:'🇪🇸',BE:'🇧🇪',GB:'🇬🇧',IT:'🇮🇹',PL:'🇵🇱',AT:'🇦🇹',CH:'🇨🇭',
}

export default function ScenariosPage({ markets }: { markets: MarketSummary[] }) {
  const [country, setCountry]   = useState('DE')
  const [wind, setWind]         = useState(0)
  const [solar, setSolar]       = useState(0)
  const [demand, setDemand]     = useState(0)
  const [gas, setGas]           = useState(0)
  const [result, setResult]     = useState<ScenarioResult | null>(null)
  const [loading, setLoading]   = useState(false)

  const run = async () => {
    setLoading(true)
    try {
      const r = await runScenario({ country, wind_change_pct: wind, solar_change_pct: solar, demand_change_pct: demand, gas_price_change_pct: gas })
      setResult(r)
    } catch {}
    setLoading(false)
  }

  const Slider = ({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>{label}</div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color, fontWeight: 500 }}>
          {value > 0 ? '+' : ''}{value}%
        </div>
      </div>
      <input type="range" min={-50} max={50} step={5} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--ink4)', marginTop: 2 }}>
        <span>-50%</span><span>0</span><span>+50%</span>
      </div>
    </div>
  )

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--ink4)', marginBottom: 6 }}>What-If Analysis</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: 'var(--ink)' }}>Scenario Simulator</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Controls */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="section-label">Select Market</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {markets.map(m => (
                <button key={m.code} onClick={() => setCountry(m.code)} style={{
                  padding: '6px 12px', borderRadius: 4, border: '1px solid var(--cream3)',
                  background: country === m.code ? 'var(--ink)' : 'transparent',
                  color: country === m.code ? 'var(--gold2)' : 'var(--ink3)',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Syne',
                }}>
                  {FLAGS[m.code]} {m.code}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-label">Adjust Variables</div>
            <Slider label="Wind Generation Change" value={wind} onChange={setWind} color="var(--blue)" />
            <Slider label="Solar Generation Change" value={solar} onChange={setSolar} color="var(--gold)" />
            <Slider label="Demand Change" value={demand} onChange={setDemand} color="var(--rose)" />
            <Slider label="Gas Price Change" value={gas} onChange={setGas} color="var(--ink3)" />

            <button onClick={run} disabled={loading} style={{
              width: '100%', padding: '12px', background: 'var(--ink)',
              color: 'var(--gold2)', border: 'none', borderRadius: 6,
              fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Syne', letterSpacing: '1px', marginTop: 8,
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'SIMULATING...' : 'RUN SCENARIO →'}
            </button>
          </div>
        </div>

        {/* Result */}
        <div>
          {!result ? (
            <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                <div style={{ fontSize: 13, color: 'var(--ink4)' }}>Adjust variables and run a scenario</div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-up">
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="section-label">Price Impact</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)', marginBottom: 4 }}>BASELINE</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--ink)' }}>€{result.baseline_price.toFixed(1)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--ink4)', marginBottom: 4 }}>SCENARIO</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: result.impact_pct > 0 ? 'var(--rose)' : 'var(--green2)' }}>
                      €{result.scenario_price.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div style={{
                  marginTop: 16, padding: '10px 14px', borderRadius: 6,
                  background: result.impact_pct > 0 ? '#fdf0f0' : '#e8f5ee',
                  color: result.impact_pct > 0 ? 'var(--rose)' : 'var(--green)',
                  fontSize: 14, fontWeight: 700, fontFamily: "'Playfair Display', serif", textAlign: 'center',
                }}>
                  {result.impact_pct > 0 ? '▲' : '▼'} {Math.abs(result.impact_pct).toFixed(1)}% impact
                </div>
              </div>

              <div className="card" style={{ marginBottom: 12 }}>
                <div className="section-label">AI Analysis</div>
                <div style={{ fontSize: 12, color: 'var(--ink2)', lineHeight: 1.7 }}>{result.narrative}</div>
              </div>

              {Object.keys(result.cross_market_effects).length > 0 && (
                <div className="card">
                  <div className="section-label">Cross-Market Spillover</div>
                  {Object.entries(result.cross_market_effects).map(([code, effect]: [string, any]) => (
                    <div key={code} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--cream3)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{FLAGS[code]} {code}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>
                        €{effect.new_price.toFixed(1)}
                        <span style={{ color: effect.impact > 0 ? 'var(--rose)' : 'var(--green2)', marginLeft: 6 }}>
                          {effect.impact > 0 ? '+' : ''}€{effect.impact.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
