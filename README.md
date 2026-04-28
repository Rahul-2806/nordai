# NordAI v2 — European Electricity Trading Intelligence Platform

> A full-stack AI trading intelligence platform for European electricity markets — featuring real-time ENTSO-E prices, an agentic Co-Pilot with persistent memory and tool use, autonomous proactive alerts, ML forecasting, cross-border arbitrage detection, and market regime classification.

**Live Demo:** [nordai-beta.vercel.app](https://nordai-beta.vercel.app) &nbsp;|&nbsp; **Backend:** [RAHULSR2806/nordai-backend](https://huggingface.co/spaces/RAHULSR2806/nordai-backend)

---

## What is NordAI?

NordAI is a production-grade electricity trading intelligence platform built for professional energy traders. It aggregates real-time European market data, applies ML models for price forecasting and regime classification, detects cross-border arbitrage opportunities, and provides an autonomous AI Co-Pilot that reasons over live data using tool use.

Built to demonstrate the kind of internal trading intelligence tooling that proprietary energy firms build in-house.

---

## Features

| Module | Description |
|--------|-------------|
| Live Market Dashboard | Real-time day-ahead prices for DE, FR, NL, ES, BE, GB, IT, PL, NO, DK |
| Agentic Co-Pilot | Groq LLaMA 3.3 70B with persistent memory + 5 live tools |
| Proactive Alert Agent | Autonomous scanner — emails arbitrage windows every 30 min |
| Trading Signals | Buy/sell/hold signals with strength scores per market |
| Arbitrage Detection | Cross-border spread analysis with confidence scoring |
| Market Regime | ML-based regime classification (bull/bear/volatile/stable) |
| Price Forecasting | XGBoost-based 48-hour price forecasts per market |
| Scenario Analysis | What-if modeling for wind, solar, demand, gas price changes |
| Backtester | Historical strategy backtesting with P&L simulation |
| News Sentiment | Real-time energy news sentiment analysis |
| Morning Briefing | AI-generated daily market summary |

---

## Agentic Co-Pilot — v2 Upgrade

The Co-Pilot is not just a chatbot — it's a stateful AI agent with:

- **Persistent memory** — conversation history stored in Supabase per session. The agent remembers what you discussed earlier in the session.
- **Tool use** — 5 live tools the agent calls autonomously mid-conversation:
  - `get_live_prices` — fetches real-time ENTSO-E prices
  - `get_arbitrage` — pulls current cross-border spreads
  - `get_signals` — retrieves trading signals
  - `get_forecast` — runs price forecast for a specific market
  - `get_regime` — classifies current market regime
- **Tool transparency** — the UI shows exactly which tool the agent called for each response

---

## Proactive Alert Agent

An APScheduler background agent that runs autonomously every 30 minutes:

1. Fetches live snapshot — prices, arbitrage, signals, regime
2. Filters opportunities above configurable EUR/MWh threshold
3. Generates AI summary using Groq LLaMA
4. Emails alert via Brevo with specific markets and spreads

No manual triggering needed — the agent watches the markets for you.

---

## Tech Stack

**Frontend:** Next.js 15 · TypeScript · Tailwind CSS · Axios · Recharts

**Backend:** FastAPI (Python 3.11) · Uvicorn · Docker

**AI:** Groq LLaMA 3.3 70B · Tool use · APScheduler

**Data:** ENTSO-E Transparency Platform · OpenMeteo · NewsAPI

**ML:** XGBoost · scikit-learn · pandas · numpy

**Database:** Supabase (PostgreSQL) — copilot session memory

**Infra:** Hugging Face Spaces (backend) · Vercel (frontend)

**Alerts:** Brevo SMTP

---

## Architecture

```
nordai/
├── frontend/                  # Next.js 15
│   ├── app/page.tsx           # Main dashboard
│   ├── components/
│   │   ├── copilot/           # Agentic Co-Pilot float
│   │   ├── markets/           # Market sidebar, hero band
│   │   ├── signals/           # Signal cards
│   │   ├── arbitrage/         # Arbitrage panel
│   │   └── pages/             # Forecast, Scenarios, Backtest, Analytics
│   └── lib/
│       ├── api.ts             # All API calls including agentic copilot
│       └── types.ts           # TypeScript interfaces
└── backend/                   # FastAPI
    ├── main.py                # App entry + APScheduler lifespan
    ├── routers/               # 11 route modules
    │   ├── copilot.py         # Agentic Co-Pilot with tool use + memory
    │   ├── market.py          # Live ENTSO-E prices
    │   ├── signals.py         # Trading signals
    │   ├── arbitrage.py       # Cross-border arbitrage
    │   ├── forecast.py        # XGBoost price forecasting
    │   ├── regime.py          # Market regime classification
    │   └── ...
    └── services/
        ├── alert_agent.py     # Autonomous proactive alert scanner
        ├── entso_client.py    # ENTSO-E API client
        ├── groq_client.py     # Groq LLM client
        ├── ml_engine.py       # XGBoost models
        └── weather_client.py  # OpenMeteo wind/solar data
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key (free at console.groq.com)
- Supabase account
- Brevo account (for email alerts)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env
# Fill in your keys
uvicorn main:app --reload --port 7860
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:7860
npm run dev
```

---

## Environment Variables

```env
# Groq
GROQ_API_KEY=your_key

# Supabase (for Co-Pilot memory)
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_KEY=your_service_role_key

# Brevo (for proactive email alerts)
BREVO_API_KEY=your_key
ALERT_EMAIL=your@email.com

# Alert config
SELF_URL=https://your-hf-space.hf.space
MIN_ALERT_SPREAD=15.0
```

---

## Supabase Schema

```sql
create table copilot_sessions (
  id          bigserial primary key,
  session_id  text unique not null,
  messages    jsonb default '[]',
  updated_at  timestamptz default now()
);
```

---

## Deployment

**Backend:** Hugging Face Spaces (Docker, port 7860). Push backend files to HF Space repo. Add all env vars as Space secrets.

**Frontend:** Vercel. Connect GitHub repo, set `NEXT_PUBLIC_API_URL` to your HF Space URL.

---

## Built by

**Rahul** — Full Stack Developer & Data Scientist  
[rahulaiportfolio.online](https://rahulaiportfolio.online) · [GitHub](https://github.com/Rahul-2806) · Kollam, Kerala, India