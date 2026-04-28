---
title: NordAI Backend
emoji: ⚡
colorFrom: yellow
colorTo: orange
sdk: docker
pinned: false
---

# NordAI v2 — European Electricity Trading Intelligence

Agentic FastAPI backend for NordAI trading platform.

## Features
- Real-time ENTSO-E electricity prices (10 markets)
- Agentic Co-Pilot with persistent memory + tool use
- Proactive alert agent — scans every 30 min, emails arbitrage windows
- Trading signals, arbitrage detection, regime classification
- Price forecasting, backtesting, news sentiment

## Stack
FastAPI · Groq LLaMA 3.3 70B · Supabase · APScheduler · ENTSO-E API · OpenMeteo