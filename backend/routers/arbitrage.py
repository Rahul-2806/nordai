from fastapi import APIRouter
from services.entso_client import fetch_all_markets, get_latest_price, AREA_CODES

router = APIRouter()

NEIGHBOURS = {
    "DE": ["FR","NL","BE","PL","AT","CH"],
    "FR": ["DE","BE","ES","IT","CH"],
    "NL": ["DE","BE","GB"],
    "ES": ["FR"],
    "BE": ["DE","FR","NL","GB"],
    "GB": ["NL","BE"],
    "IT": ["FR","AT","CH"],
    "PL": ["DE"],
    "AT": ["DE","IT","CH"],
    "CH": ["DE","FR","IT","AT"],
}

TRANSMISSION_COSTS = {
    ("DE","FR"):4.2,("DE","NL"):3.8,("DE","BE"):4.0,("DE","PL"):4.8,
    ("DE","AT"):3.5,("DE","CH"):3.8,("FR","BE"):3.5,("FR","ES"):5.0,
    ("FR","IT"):5.5,("FR","CH"):3.8,("NL","BE"):3.0,("NL","GB"):6.5,
    ("BE","GB"):6.5,("IT","AT"):4.5,("AT","CH"):3.2,
}


def _get_cost(a, b):
    return TRANSMISSION_COSTS.get((a,b), TRANSMISSION_COSTS.get((b,a), 5.0))


@router.get("/opportunities")
async def get_arbitrage_opportunities():
    all_prices = await fetch_all_markets()
    current = {}
    for code in AREA_CODES:
        lp = get_latest_price(all_prices.get(code, []))
        if lp:
            current[code] = lp

    opps = []
    seen = set()
    for src, neighbours in NEIGHBOURS.items():
        if src not in current:
            continue
        for dst in neighbours:
            if dst not in current:
                continue
            key = tuple(sorted([src, dst]))
            if key in seen:
                continue
            seen.add(key)
            spread = abs(current[src] - current[dst])
            src_hi = src if current[src] > current[dst] else dst
            dst_lo = dst if current[src] > current[dst] else src
            cost = _get_cost(src_hi, dst_lo)
            net = round(spread - cost, 2)
            if net > 0:
                opps.append({
                    "from_country": src_hi,
                    "to_country": dst_lo,
                    "from_price": round(current[src_hi], 2),
                    "to_price": round(current[dst_lo], 2),
                    "spread": round(spread, 2),
                    "transmission_cost": cost,
                    "net_profit": net,
                    "window_hours": round(2 + net / 10, 1),
                    "confidence": round(min(0.95, 0.5 + net / 30), 2),
                })

    opps.sort(key=lambda x: x["net_profit"], reverse=True)
    return {"opportunities": opps[:8]}
