import asyncio
from fastapi import APIRouter
from services.entso_client import fetch_all_markets, get_latest_price, AREA_CODES
from services.weather_client import fetch_all_weather, get_current_renewable_pct
from services.regime_classifier import classify, REGIME_DEFINITIONS

router = APIRouter()


@router.get("/current")
async def get_current_regime():
    all_prices, all_weather = await asyncio.gather(fetch_all_markets(), fetch_all_weather())

    prices = {}
    for code in AREA_CODES:
        lp = get_latest_price(all_prices.get(code, []))
        if lp:
            prices[code] = lp

    wind_vals, solar_vals, temp_vals = [], [], []
    for code, wdata in all_weather.items():
        r = get_current_renewable_pct(wdata)
        wind_vals.append(r["wind_pct"])
        solar_vals.append(r["solar_pct"])
        temp_vals.append(r["temperature"])

    avg_wind  = sum(wind_vals)  / len(wind_vals)  if wind_vals  else 30.0
    avg_solar = sum(solar_vals) / len(solar_vals) if solar_vals else 20.0
    avg_temp  = sum(temp_vals)  / len(temp_vals)  if temp_vals  else 12.0
    avg_price = sum(prices.values()) / len(prices) if prices else 80.0
    spread    = (max(prices.values()) - min(prices.values())) if len(prices) > 1 else 0.0

    result = classify(avg_wind, avg_solar, avg_price, spread, avg_temp)
    meta = result["meta"]

    return {
        "regime": result["regime"],
        "label": meta["label"],
        "confidence": result["confidence"],
        "drivers": result["drivers"],
        "affected_markets": list(prices.keys())[:6],
        "description": meta["description"],
        "color": meta["color"],
    }
