import asyncio
from fastapi import APIRouter
from models.schemas import BacktestRequest, BacktestResult
from services.entso_client import fetch_day_ahead_prices, AREA_CODES

router = APIRouter()


@router.post("/run", response_model=BacktestResult)
async def run_backtest(req: BacktestRequest):
    country = req.countries[0].upper() if req.countries else "DE"
    capital = req.initial_capital
    equity = [{"date": req.start_date, "value": capital}]
    trades = []
    position = 0.0
    wins = losses = 0

    prices = await fetch_day_ahead_prices(AREA_CODES.get(country, AREA_CODES["DE"]))
    sorted_prices = sorted(prices, key=lambda x: x["timestamp"])

    for i in range(24, len(sorted_prices) - 1):
        window = sorted_prices[max(0, i-24):i]
        curr = sorted_prices[i]["price"]
        nxt = sorted_prices[i+1]["price"]
        avg = sum(p["price"] for p in window) / len(window) if window else curr

        signal = "hold"
        if req.strategy == "moving_avg":
            if curr < avg * 0.97:
                signal = "buy"
            elif curr > avg * 1.03:
                signal = "sell"
        elif req.strategy == "regime_based":
            signal = "buy" if curr < avg else "sell"

        if signal == "buy" and position == 0:
            position = capital * 0.1
            trades.append({"type": "BUY", "price": curr, "timestamp": sorted_prices[i]["timestamp"]})
        elif signal == "sell" and position > 0:
            pnl = position * (nxt - curr) / curr
            capital += pnl
            if pnl > 0:
                wins += 1
            else:
                losses += 1
            trades.append({"type": "SELL", "price": nxt, "pnl": round(pnl, 2), "timestamp": sorted_prices[i]["timestamp"]})
            position = 0

        if i % 6 == 0:
            equity.append({"date": sorted_prices[i]["timestamp"][:10], "value": round(capital + position, 2)})

    total_return = round((capital - req.initial_capital) / req.initial_capital * 100, 2)
    total_trades = wins + losses
    win_rate = round(wins / total_trades * 100, 1) if total_trades else 0
    values = [e["value"] for e in equity]
    peak = values[0] if values else capital
    max_dd = 0.0
    for v in values:
        if v > peak:
            peak = v
        dd = (peak - v) / peak * 100
        if dd > max_dd:
            max_dd = dd

    return BacktestResult(
        strategy=req.strategy,
        total_return_pct=total_return,
        sharpe_ratio=round(total_return / max(max_dd, 1) * 0.3, 2),
        max_drawdown_pct=round(max_dd, 2),
        win_rate=win_rate,
        total_trades=total_trades,
        equity_curve=equity,
        trade_log=trades[-20:],
    )
