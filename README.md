# NordAI — European Electricity Trading Intelligence Platform

<div align="center">

![NordAI](https://img.shields.io/badge/NordAI-v1.0-c8952a?style=for-the-badge&labelColor=1a1510)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A full-stack, AI-powered European electricity market intelligence platform built for professional energy traders.**

*Real-time ENTSO-E prices · ML forecasting · LLM Co-Pilot · Cross-border arbitrage detection · Market regime classification*

[Live Demo](https://nordai.vercel.app) · [API Docs](https://nordai-backend.hf.space/docs) · [Report Bug](https://github.com/yourusername/nordai/issues)

</div>

---

## What is NordAI?

NordAI is a production-grade trading intelligence platform that aggregates real-time European electricity market data, applies machine learning models to forecast prices, detects cross-border arbitrage opportunities, and provides an AI Co-Pilot powered by Groq LLaMA to answer trader questions in natural language.

Built as a demonstration of how modern AI engineering can augment energy trading operations — directly targeting the kind of internal tooling that proprietary trading firms like Cobblestone Energy build in-house.

---

## Features

### Live Market Intelligence
- **Real-time prices** from ENTSO-E Transparency Platform across 10 European bidding zones (DE, FR, NL, ES, BE, GB, IT, PL, AT, CH)
- **Animated price ticker** with live change percentages
- **Market regime classifier** — detects Low Wind Events, Renewable Surplus, Demand Spikes, Gas-to-Power Switches, Grid Congestion
- **Morning Market Brief** — AI-generated daily summary via Groq LLaMA

### Trading Signals
- **BUY / SELL / HOLD** signals per market with confidence scores
- **Explainability layer** — every signal includes plain-English reasoning (wind %, demand, interconnector capacity)
- **Signal confidence bars** with target price calculations
- Auto-refreshes every 30 seconds

### Cross-Border Arbitrage Detection
- Identifies profitable arbitrage routes between neighbouring markets
- Calculates net profit after transmission costs
- Shows estimated window duration and confidence
- Sorted by net profit — highest opportunity first

### Price Forecasting
- **24h / 48h / 72h ahead** price predictions per market
- Statistical ensemble model with confidence intervals
- Area chart with upper/lower bounds
- Per-market accuracy metrics (R² and MAE)

### AI Co-Pilot (RAG-powered)
- Floating chat interface powered by **Groq LLaMA 3.3 70B**
- Injected with live market context on every message
- Answers questions like *"Why is Germany €87 right now?"* with real data
- Conversation history maintained across messages
- Quick-suggestion buttons for common trader queries

### Scenario Simulator
- What-if analysis: adjust wind, solar, demand, gas price simultaneously
- Fundamental price impact model with cross-market spillover
- AI narrative explanation of results
- Instant re-calculation on variable change

### Strategy Backtester
- Test Moving Average Crossover and Regime-Based strategies
- Historical equity curve with Recharts visualization
- KPIs: Total Return, Sharpe Ratio, Max Drawdown, Win Rate
- Configurable initial capital (€50k / €100k / €250k)

### Analytics Dashboard
- Live price bar chart across all markets (green = up, red = down)
- Signal distribution (BUY/SELL/HOLD counts)
- **Imbalance Risk Meter** — per-country risk classification (HIGH/MED/LOW) vs EU average
- **Cross-Commodity Tracker** — DE Power vs TTF Gas correlation chart
- **News Sentiment Engine** — energy market news scored bullish/bearish
- Full arbitrage opportunities table

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| API Framework | FastAPI 0.115 |
| ML Models | Statistical ensemble (extensible to XGBoost + LightGBM) |
| LLM | Groq API (llama-3.3-70b-versatile) |
| Market Data | ENTSO-E Transparency Platform API |
| Weather Data | OpenMeteo API |
| Database | Supabase (PostgreSQL + pgvector) |
| Deployment | Hugging Face Spaces (Docker) |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | CSS Variables + Tailwind |
| Charts | Recharts |
| Animations | CSS keyframes + Framer Motion |
| Fonts | Playfair Display + Syne + JetBrains Mono |
| Deployment | Vercel |

### AI / Data Pipeline
| Component | Detail |
|-----------|--------|
| Price Forecasting | Seasonal decomposition + trend extrapolation (XGBoost/LightGBM ready) |
| Market Regime | Rule-based scoring classifier (6 regimes) |
| Trading Signals | Hybrid rule + ML signal generation with confidence scoring |
| Arbitrage Detection | Graph-based neighbour traversal with transmission cost model |
| RAG Co-Pilot | Live context injection → Groq LLaMA → structured response |
| News Sentiment | Keyword NLP scoring with bullish/bearish classification |

---

## API Reference

All endpoints are live at `https://nordai-backend.hf.space`

```
GET  /api/market/all                  — All market prices + trend
GET  /api/market/{country}            — Market detail + weather
GET  /api/forecast/{country}?hours=48 — ML price forecast
GET  /api/signals/all                 — BUY/SELL/HOLD signals
GET  /api/arbitrage/opportunities     — Cross-border arb detector
GET  /api/regime/current              — Market regime classifier
POST /api/scenario/run                — Scenario simulator
POST /api/copilot/chat                — AI Co-Pilot (Groq + RAG)
GET  /api/briefing/today              — Morning market brief
GET  /api/sentiment/news              — News sentiment scores
POST /api/backtest/run                — Strategy backtester
```

---

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- ENTSO-E API token (free at [transparency.entsoe.eu](https://transparency.entsoe.eu))
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\Activate
pip install -r requirements.txt
cp .env.example .env
# Add your keys to .env
uvicorn main:app --reload --port 7860
```

Visit `http://localhost:7860/docs` for the full Swagger UI.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:7860
npm run dev
```

Visit `http://localhost:3000`

---

## Project Structure

```
nordai/
├── backend/
│   ├── main.py                    # FastAPI entry point
│   ├── routers/
│   │   ├── market.py              # Live prices (ENTSO-E)
│   │   ├── forecast.py            # ML price predictions
│   │   ├── signals.py             # Trading signal engine
│   │   ├── arbitrage.py           # Cross-border arb detector
│   │   ├── regime.py              # Market regime classifier
│   │   ├── scenario.py            # Scenario simulator
│   │   ├── copilot.py             # AI Co-Pilot (Groq + RAG)
│   │   ├── briefing.py            # Morning brief generator
│   │   ├── backtest.py            # Strategy backtester
│   │   └── sentiment.py           # News sentiment NLP
│   └── services/
│       ├── entso_client.py        # ENTSO-E API wrapper
│       ├── weather_client.py      # OpenMeteo API wrapper
│       ├── ml_engine.py           # ML forecasting engine
│       ├── groq_client.py         # Groq LLM wrapper
│       ├── news_scraper.py        # Energy news NLP
│       └── regime_classifier.py   # Market regime logic
└── frontend/
    ├── app/
    │   ├── page.tsx               # Main dashboard
    │   └── globals.css            # NordAI design system
    └── components/
        ├── layout/Topbar.tsx
        ├── markets/               # Market components
        ├── signals/               # Signal cards
        ├── copilot/               # AI Co-Pilot float
        ├── ui/                    # Shared UI components
        └── pages/                 # Tab pages
```

---

## Deployment

### Backend → Hugging Face Spaces

```bash
# Create a new Space at huggingface.co (Docker, public)
# Clone the space and push backend/ contents
git clone https://huggingface.co/spaces/USERNAME/nordai-backend
cp -r backend/* nordai-backend/
cd nordai-backend
git add . && git commit -m "Deploy NordAI backend"
git push
# Add secrets: ENTSO_TOKEN, GROQ_API_KEY in Space settings
```

### Frontend → Vercel

```bash
cd frontend
npx vercel --prod
# Set environment variable: NEXT_PUBLIC_API_URL=https://USERNAME-nordai-backend.hf.space
```

---

## Roadmap

- [ ] Always-on agentic market monitor (autonomous alerts)
- [ ] Trader performance journal with AI scoring
- [ ] EU ETS carbon price integration
- [ ] Flutter mobile app
- [ ] WebSocket real-time price streaming
- [ ] PostgreSQL price history with pgvector RAG
- [ ] PDF report export
- [ ] ENTSO-E generation forecast integration

---

## About

Built by **Rahul** — Full Stack Developer & Data Scientist from Kerala, India.  
Targeting international Software Engineer / Data Scientist roles in European energy markets.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=flat-square&logo=linkedin)](https://linkedin.com/in/yourprofile)
[![Portfolio](https://img.shields.io/badge/Portfolio-rahulaiportfolio.online-c8952a?style=flat-square)](https://rahulaiportfolio.online)

---

<div align="center">
<sub>Built with FastAPI · Next.js · Groq LLaMA · ENTSO-E · OpenMeteo</sub>
</div>