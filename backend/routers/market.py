import asyncio
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone

from services.entso_client import (
    fetch_day_ahead_prices, fetch_all_markets,
    get_latest_price, AREA_CODES, MARKET_NAMES, CURRENCY
)
from services.weather_client import fetch_weather, fetch_all_weather, get_current_renewable_pct
from models.schemas import AllMarketsResponse, MarketSummary, MarketDetail, PricePoint

router = APIRouter()


@router.get("/all", response_model=AllMarketsResponse)
async def get_all_markets():
    all_prices, all_weather = await asyncio.gather(
        fetch_all_markets(),
        fetch_all_weather(),
    )
    summaries = []
    for code in AREA_CODES:
        prices = all_prices.get(code, [])
        if not prices:
            continue
        sorted_prices = sorted(prices, key=lambda x: x["timestamp"])
        now = datetime.now(timezone.utc)
        current_price = None
        prev_price = None
        for p in sorted_prices:
            try:
                ts = datetime.fromisoformat(p["timestamp"])
                if ts.tzinfo is None:
                    from datetime import timezone as tz
                    ts = ts.replace(tzinfo=tz.utc)
                if ts <= now:
                    prev_price = current_price
                    current_price = p["price"]
            except Exception:
                continue
        if current_price is None:
            current_price = sorted_prices[0]["price"]
        if prev_price is None:
            prev_price = current_price
        change_abs = round(current_price - prev_price, 2)
        change_pct = round((change_abs / prev_price * 100) if prev_price else 0, 2)
        trend = "up" if change_abs > 0.1 else ("down" if change_abs < -0.1 else "neutral")
        summaries.append(MarketSummary(
            code=code,
            name=MARKET_NAMES[code],
            current_price=round(current_price, 2),
            currency=CURRENCY.get(code, "EUR"),
            change_pct=change_pct,
            change_abs=change_abs,
            prev_price=round(prev_price, 2),
            trend=trend,
        ))
    return AllMarketsResponse(
        markets=summaries,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/{country}")
async def get_market_detail(country: str):
    country = country.upper()
    if country not in AREA_CODES:
        raise HTTPException(status_code=404, detail=f"Market '{country}' not found")
    prices_raw, weather_data = await asyncio.gather(
        fetch_day_ahead_prices(AREA_CODES[country]),
        fetch_weather(country),
    )
    renewable = get_current_renewable_pct(weather_data)
    current = get_latest_price(prices_raw) or 0.0
    return {
        "code": country,
        "name": MARKET_NAMES[country],
        "prices": prices_raw,
        "current_price": round(current, 2),
        "currency": CURRENCY.get(country, "EUR"),
        "wind_pct": renewable["wind_pct"],
        "solar_pct": renewable["solar_pct"],
        "temperature": renewable["temperature"],
    }


@router.get("/weather/{country}")
async def get_market_weather(country: str):
    country = country.upper()
    if country not in AREA_CODES:
        raise HTTPException(status_code=404, detail=f"Market '{country}' not found")
    return await fetch_weather(country)


@router.get("/renewables/all")
async def get_all_renewables():
    weather_all = await fetch_all_weather()
    return {code: get_current_renewable_pct(wdata) for code, wdata in weather_all.items()}
