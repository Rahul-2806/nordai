from pydantic import BaseModel
from typing import Optional, List


class PricePoint(BaseModel):
    timestamp: str
    price: float
    currency: str


class MarketSummary(BaseModel):
    code: str
    name: str
    current_price: float
    currency: str
    change_pct: float
    change_abs: float
    prev_price: float
    trend: str


class MarketDetail(BaseModel):
    code: str
    name: str
    prices: List[PricePoint]
    current_price: float
    currency: str
    wind_pct: float
    solar_pct: float
    temperature: float


class AllMarketsResponse(BaseModel):
    markets: List[MarketSummary]
    timestamp: str


class ForecastPoint(BaseModel):
    timestamp: str
    predicted_price: float
    lower_bound: float
    upper_bound: float
    confidence: float


class ForecastResponse(BaseModel):
    country: str
    horizon_hours: int
    forecasts: List[ForecastPoint]
    model: str
    r2_score: float
    mae: float


class TradingSignal(BaseModel):
    country: str
    signal: str
    current_price: float
    target_price: float
    confidence: float
    reasons: List[str]
    regime: str
    timestamp: str


class ArbitrageOpportunity(BaseModel):
    from_country: str
    to_country: str
    from_price: float
    to_price: float
    spread: float
    transmission_cost: float
    net_profit: float
    window_hours: float
    confidence: float


class MarketRegime(BaseModel):
    regime: str
    label: str
    confidence: float
    drivers: List[str]
    affected_markets: List[str]
    description: str
    color: str


class ScenarioRequest(BaseModel):
    country: str
    wind_change_pct: float = 0.0
    solar_change_pct: float = 0.0
    demand_change_pct: float = 0.0
    gas_price_change_pct: float = 0.0
    horizon_hours: int = 24


class ScenarioResult(BaseModel):
    country: str
    baseline_price: float
    scenario_price: float
    price_impact: float
    impact_pct: float
    cross_market_effects: dict
    narrative: str


class CopilotRequest(BaseModel):
    message: str
    conversation_history: List[dict] = []


class CopilotResponse(BaseModel):
    reply: str
    sources: List[str] = []


class BacktestRequest(BaseModel):
    strategy: str
    countries: List[str]
    start_date: str
    end_date: str
    initial_capital: float = 100000.0
    params: dict = {}


class BacktestResult(BaseModel):
    strategy: str
    total_return_pct: float
    sharpe_ratio: float
    max_drawdown_pct: float
    win_rate: float
    total_trades: int
    equity_curve: List[dict]
    trade_log: List[dict]
