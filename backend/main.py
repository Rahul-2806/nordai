from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import market, forecast, signals, arbitrage, regime, scenario, copilot, alerts, briefing, backtest, sentiment


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("NordAI backend starting...")
    yield
    print("NordAI backend shutting down...")


app = FastAPI(
    title="NordAI API",
    description="European Electricity Trading Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market.router,    prefix="/api/market",    tags=["Market Data"])
app.include_router(forecast.router,  prefix="/api/forecast",  tags=["Forecasting"])
app.include_router(signals.router,   prefix="/api/signals",   tags=["Trading Signals"])
app.include_router(arbitrage.router, prefix="/api/arbitrage", tags=["Arbitrage"])
app.include_router(regime.router,    prefix="/api/regime",    tags=["Market Regime"])
app.include_router(scenario.router,  prefix="/api/scenario",  tags=["Scenarios"])
app.include_router(copilot.router,   prefix="/api/copilot",   tags=["AI Co-Pilot"])
app.include_router(alerts.router,    prefix="/api/alerts",    tags=["Alerts"])
app.include_router(briefing.router,  prefix="/api/briefing",  tags=["Market Briefing"])
app.include_router(backtest.router,  prefix="/api/backtest",  tags=["Backtester"])
app.include_router(sentiment.router, prefix="/api/sentiment", tags=["News Sentiment"])


@app.get("/")
def root():
    return {"status": "online", "platform": "NordAI", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}