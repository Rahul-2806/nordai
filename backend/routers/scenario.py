import asyncio
from fastapi import APIRouter, HTTPException
from models.schemas import ScenarioRequest, ScenarioResult
from services.entso_client import fetch_all_markets, get_latest_price, AREA_CODES
from services.weather_client import fetch_all_weather, get_current_renewable_pct

router = APIRouter()

NEIGHBOURS = {"DE":["FR","NL","BE"],"FR":["DE","BE","ES"],"ES":["FR"],"NL":["DE","BE"]}


@router.post("/run", response_model=ScenarioResult)
async def run_scenario(req: ScenarioRequest):
    country = req.country.upper()
    if country not in AREA_CODES:
        raise HTTPException(status_code=404, detail="Market not found")

    all_prices, all_weather = await asyncio.gather(fetch_all_markets(), fetch_all_weather())
    baseline = get_latest_price(all_prices.get(country, [])) or 80.0

    impact = 0.0
    if req.wind_change_pct:
        impact += -req.wind_change_pct * 0.004 * baseline
    if req.solar_change_pct:
        impact += -req.solar_change_pct * 0.002 * baseline
    if req.demand_change_pct:
        impact += req.demand_change_pct * 0.007 * baseline
    if req.gas_price_change_pct:
        impact += req.gas_price_change_pct * 0.005 * baseline

    scenario_price = round(baseline + impact, 2)
    impact_pct = round((scenario_price - baseline) / baseline * 100, 2)

    cross_effects = {}
    for n in NEIGHBOURS.get(country, [])[:3]:
        n_base = get_latest_price(all_prices.get(n, [])) or 80.0
        cross_effects[n] = {"impact": round(impact * 0.4, 2), "new_price": round(n_base + impact * 0.4, 2)}

    changes = []
    if req.wind_change_pct:    changes.append(f"wind {req.wind_change_pct:+.0f}%")
    if req.solar_change_pct:   changes.append(f"solar {req.solar_change_pct:+.0f}%")
    if req.demand_change_pct:  changes.append(f"demand {req.demand_change_pct:+.0f}%")
    if req.gas_price_change_pct: changes.append(f"gas {req.gas_price_change_pct:+.0f}%")
    direction = "rise" if impact_pct > 0 else "fall"
    narrative = (
        f"If {', '.join(changes) or 'no changes'} in {country}, prices would {direction} "
        f"from EUR {baseline:.1f} to EUR {scenario_price:.1f}/MWh ({impact_pct:+.1f}%). "
        f"{'Consider increasing long positions.' if impact_pct > 3 else 'Consider reducing exposure.' if impact_pct < -3 else 'Signal remains HOLD.'}"
    )

    return ScenarioResult(
        country=country,
        baseline_price=round(baseline, 2),
        scenario_price=scenario_price,
        price_impact=round(impact, 2),
        impact_pct=impact_pct,
        cross_market_effects=cross_effects,
        narrative=narrative,
    )
