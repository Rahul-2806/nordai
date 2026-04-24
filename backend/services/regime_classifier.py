REGIME_DEFINITIONS = {
    "renewable_surplus": {"label": "Renewable Surplus", "color": "green",
                          "description": "High wind/solar suppressing prices"},
    "low_wind":          {"label": "Low Wind Event",    "color": "amber",
                          "description": "Wind critically low — thermal plants filling gap"},
    "demand_spike":      {"label": "Demand Spike",      "color": "red",
                          "description": "Above-normal consumption driving prices higher"},
    "gas_to_power":      {"label": "Gas-to-Power Switch","color": "orange",
                          "description": "Gas prices feeding through to power prices"},
    "congestion":        {"label": "Grid Congestion",   "color": "purple",
                          "description": "Interconnector constraints creating price divergence"},
    "normal":            {"label": "Normal Trading",    "color": "gray",
                          "description": "Market conditions within expected parameters"},
}


def classify(avg_wind_pct: float, avg_solar_pct: float, avg_price: float,
             price_spread: float, temperature: float = 12.0) -> dict:
    scores = {k: 0.0 for k in REGIME_DEFINITIONS}
    drivers = []

    if avg_wind_pct < 15:
        scores["low_wind"] += 3.0
        drivers.append(f"Wind critically low at {avg_wind_pct:.0f}%")
    elif avg_wind_pct < 25:
        scores["low_wind"] += 1.5
        drivers.append(f"Wind below average at {avg_wind_pct:.0f}%")

    if avg_wind_pct > 55 or avg_solar_pct > 65:
        scores["renewable_surplus"] += 2.5
        drivers.append(f"Renewables elevated — wind {avg_wind_pct:.0f}%, solar {avg_solar_pct:.0f}%")

    if avg_price > 95:
        scores["demand_spike"] += 1.5
        scores["gas_to_power"] += 1.2
        drivers.append(f"Average price high at EUR {avg_price:.1f}/MWh")

    if temperature < 0:
        scores["demand_spike"] += 1.5
        drivers.append(f"Freezing temperatures ({temperature:.1f}C)")
    elif temperature > 32:
        scores["demand_spike"] += 1.2
        drivers.append(f"Heat wave ({temperature:.1f}C)")

    if price_spread > 30:
        scores["congestion"] += 2.5
        drivers.append(f"Price spread EUR {price_spread:.1f}/MWh")
    elif price_spread > 20:
        scores["congestion"] += 1.2

    top = max(scores, key=scores.get)
    top_score = scores[top]
    if top_score < 0.5:
        top = "normal"

    confidence = min(0.97, 0.50 + top_score * 0.12)
    return {
        "regime": top,
        "confidence": round(confidence, 2),
        "drivers": drivers[:4],
        "meta": REGIME_DEFINITIONS[top],
    }
