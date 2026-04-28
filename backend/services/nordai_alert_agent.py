"""
NordAI Proactive Alert Agent
Runs every 30 minutes autonomously — scans all markets,
detects high-confidence arbitrage windows, emails alerts via Brevo.
"""
import os
import asyncio
import httpx
from datetime import datetime
from groq import Groq

BREVO_API_KEY  = os.getenv("BREVO_API_KEY", "")
ALERT_EMAIL    = os.getenv("ALERT_EMAIL", "")
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")
SELF_URL       = os.getenv("SELF_URL", "http://localhost:8000")
MIN_SPREAD     = float(os.getenv("MIN_ALERT_SPREAD", "15.0"))  # EUR/MWh threshold

async def fetch_market_snapshot() -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        prices_r   = await client.get(f"{SELF_URL}/api/market/prices")
        arb_r      = await client.get(f"{SELF_URL}/api/arbitrage/opportunities")
        signals_r  = await client.get(f"{SELF_URL}/api/signals/all")
        regime_r   = await client.get(f"{SELF_URL}/api/regime/current")

    return {
        "prices":       prices_r.json()   if prices_r.status_code   == 200 else {},
        "arbitrage":    arb_r.json()      if arb_r.status_code      == 200 else {},
        "signals":      signals_r.json()  if signals_r.status_code  == 200 else {},
        "regime":       regime_r.json()   if regime_r.status_code   == 200 else {},
        "timestamp":    datetime.utcnow().isoformat(),
    }

def build_alert_prompt(snapshot: dict) -> str:
    opps     = snapshot["arbitrage"].get("opportunities", [])
    signals  = snapshot["signals"].get("signals", [])
    regime   = snapshot["regime"]

    high_conf = [o for o in opps if float(o.get("spread", 0)) >= MIN_SPREAD]

    lines = [
        f"Market snapshot at {snapshot['timestamp']} UTC",
        f"Regime: {regime.get('regime','?').upper()} | Volatility: {regime.get('volatility','?')}",
        f"\nTop arbitrage opportunities (spread >= EUR {MIN_SPREAD}/MWh):",
    ]

    if high_conf:
        for o in high_conf[:5]:
            lines.append(
                f"  {o.get('buy_market')} → {o.get('sell_market')}: "
                f"EUR {float(o.get('spread',0)):.1f}/MWh | {o.get('confidence','?')} confidence"
            )
    else:
        lines.append("  None above threshold.")

    buy_signals = [s for s in signals if s.get("signal") in ("BUY", "STRONG_BUY")]
    if buy_signals:
        lines.append(f"\nBuy signals: {', '.join(s.get('market','?') for s in buy_signals[:4])}")

    return "\n".join(lines)

def generate_ai_summary(market_context: str) -> str:
    if not GROQ_API_KEY:
        return market_context

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are NordAI, an autonomous electricity trading agent. "
                        "Write a concise 3-sentence trading alert email body based on the market data. "
                        "Be specific with numbers. End with one clear action recommendation."
                    ),
                },
                {"role": "user", "content": market_context},
            ],
            max_tokens=200,
            temperature=0.2,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"{market_context}\n\n(AI summary unavailable: {e})"

async def send_email_alert(subject: str, body: str):
    if not BREVO_API_KEY or not ALERT_EMAIL:
        print(f"[NordAI Agent] Email not configured. Alert: {subject}")
        return

    payload = {
        "sender":     {"name": "NordAI Agent", "email": "alerts@nordai.app"},
        "to":         [{"email": ALERT_EMAIL}],
        "subject":    subject,
        "htmlContent": f"""
        <div style="font-family:monospace;background:#0a0a0f;color:#e8e4d8;padding:24px;border-radius:8px">
            <h2 style="color:#c8922a;margin-bottom:16px">⚡ NordAI Market Alert</h2>
            <pre style="color:#e8e4d8;white-space:pre-wrap;line-height:1.6">{body}</pre>
            <hr style="border-color:#333;margin:20px 0"/>
            <p style="color:#888;font-size:12px">
                Sent by NordAI Autonomous Agent · {datetime.utcnow().strftime('%Y-%m-%d %H:%M')} UTC<br/>
                <a href="https://nordai-beta.vercel.app" style="color:#c8922a">Open NordAI Dashboard</a>
            </p>
        </div>
        """,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://api.brevo.com/v3/smtp/email",
            json=payload,
            headers={
                "api-key":      BREVO_API_KEY,
                "Content-Type": "application/json",
            },
        )
        if resp.status_code in (200, 201):
            print(f"[NordAI Agent] Alert sent: {subject}")
        else:
            print(f"[NordAI Agent] Email failed: {resp.status_code} {resp.text}")

async def run_alert_scan():
    print(f"[NordAI Agent] Scanning markets at {datetime.utcnow().isoformat()} UTC...")

    try:
        snapshot = await fetch_market_snapshot()
    except Exception as e:
        print(f"[NordAI Agent] Snapshot error: {e}")
        return

    opps      = snapshot["arbitrage"].get("opportunities", [])
    high_conf = [o for o in opps if float(o.get("spread", 0)) >= MIN_SPREAD]

    if not high_conf:
        print("[NordAI Agent] No significant opportunities. No alert sent.")
        return

    market_context = build_alert_prompt(snapshot)
    ai_summary     = generate_ai_summary(market_context)

    best = high_conf[0]
    subject = (
        f"⚡ NordAI Alert: {best.get('buy_market')} → {best.get('sell_market')} "
        f"EUR {float(best.get('spread',0)):.1f}/MWh opportunity"
    )

    await send_email_alert(subject, ai_summary)

def start_scheduler(app):
    """Call this from main.py lifespan to start the background agent."""
    from apscheduler.schedulers.asyncio import AsyncIOScheduler

    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        run_alert_scan,
        trigger="interval",
        minutes=30,
        id="market_alert_scan",
        replace_existing=True,
    )
    scheduler.start()
    print("[NordAI Agent] Proactive alert agent started — scanning every 30 minutes.")
    return scheduler
