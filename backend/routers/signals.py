import asyncio
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from services.entso_client import fetch_all_markets, get_latest_price, AREA_CODES, MARKET_NAMES
from services.weather_client import fetch_all_weather, get_current_renewable_pct
from services.ml_engine import predict_prices

router = APIRouter()


def _generate_signal(country, current_price, forecast_price, wind_pct, solar_pct, temperature, avg_price):
    reasons = []
    score = 0.0

    pct_diff = (forecast_price - current_price) / current_price * 100
    if pct_diff > 3:
        score += 1.5
        reasons.append(f"Forecast up {pct_diff:.1f}% in 24h")
    elif pct_diff < -3:
        score -= 1.5
        reasons.append(f"Forecast down {abs(pct_diff):.1f}% in 24h")

    if wind_pct < 20:
        score += 1.2
        reasons.append(f"Wind critically low ({wind_pct:.0f}%) — thermal gap")
    elif wind_pct > 55:
        score -= 1.0
        reasons.append(f"Wind surplus ({wind_pct:.0f}%) suppressing prices")

    if solar_pct > 65:
        score -= 0.8
        reasons.append(f"Solar at {solar_pct:.0f}% — midday surplus")

    if temperature < 2:
        score += 1.0
        reasons.append(f"Cold snap ({temperature:.1f}C) driving heating demand")
    elif temperature > 30:
        score += 0.8
        reasons.append(f"Heat wave ({temperature:.1f}C) — AC demand peak")

    if current_price > avg_price * 1.12:
        score -= 0.5
        reasons.append(f"Price above EU avg — reversion likely")
    elif current_price < avg_price * 0.88:
        score += 0.5
        reasons.append(f"Price below EU avg — support expected")

    if score >= 1.5:
        signal = "BUY"
        confidence = min(0.97, 0.60 + score * 0.08)
        target = round(current_price * 1.04, 2)
    elif score <= -1.5:
        signal = "SELL"
        confidence = min(0.97, 0.60 + abs(score) * 0.08)
        target = round(current_price * 0.96, 2)
    else:
        signal = "HOLD"
        confidence = 0.55 + abs(score) * 0.05
        target = current_price

    return {"signal": signal, "confidence": round(confidence, 3), "target": target, "reasons": reasons[:4]}


@router.get("/all")
async def get_all_signals():
    all_prices, all_weather = await asyncio.gather(fetch_all_markets(), fetch_all_weather())
    current_prices = {}
    for code in AREA_CODES:
        lp = get_latest_price(all_prices.get(code, []))
        if lp:
            current_prices[code] = lp

    avg_price = sum(current_prices.values()) / len(current_prices) if current_prices else 80.0
    now_str = datetime.now(timezone.utc).isoformat()
    signals = []

    for code in AREA_CODES:
        if code not in current_prices:
            continue
        current = current_prices[code]
        prices = all_prices.get(code, [])
        weather = all_weather.get(code, {})
        renew = get_current_renewable_pct(weather)
        forecasts = predict_prices(prices, weather, code, 24)
        forecast_24h = forecasts[-1]["predicted_price"] if forecasts else current
        sig = _generate_signal(code, current, forecast_24h, renew["wind_pct"], renew["solar_pct"], renew["temperature"], avg_price)
        signals.append({
            "country": code,
            "name": MARKET_NAMES[code],
            "signal": sig["signal"],
            "current_price": round(current, 2),
            "target_price": sig["target"],
            "confidence": sig["confidence"],
            "reasons": sig["reasons"],
            "timestamp": now_str,
        })

    return {"signals": signals, "timestamp": now_str}


@router.get("/{country}")
async def get_signal(country: str):
    country = country.upper()
    if country not in AREA_CODES:
        raise HTTPException(status_code=404, detail=f"Market '{country}' not found")
    result = await get_all_signals()
    for s in result["signals"]:
        if s["country"] == country:
            return s
    raise HTTPException(status_code=500, detail="Signal generation failed")
