import numpy as np
import random
from datetime import datetime, timedelta, timezone


def predict_prices(prices: list, weather: dict, country: str, horizon_hours: int = 48) -> list:
    if not prices:
        return []
    return _statistical_predict(prices, horizon_hours)


def _statistical_predict(prices: list, horizon_hours: int) -> list:
    if not prices:
        return []

    recent = sorted(prices, key=lambda x: x["timestamp"])[-72:]
    vals = [p["price"] for p in recent]
    mean = float(np.mean(vals))
    std = float(np.std(vals)) if len(vals) > 1 else 5.0
    trend = (vals[-1] - vals[0]) / len(vals) if len(vals) > 1 else 0

    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    results = []

    for i in range(1, horizon_hours + 1):
        future_dt = now + timedelta(hours=i)
        hour = future_dt.hour
        curve = 1.0
        if 6 <= hour <= 9:
            curve = 1.08
        elif 17 <= hour <= 20:
            curve = 1.12
        elif 0 <= hour <= 5:
            curve = 0.88

        pred = (mean + trend * i) * curve + random.gauss(0, std * 0.1)
        uncertainty = std * (0.3 + i * 0.015)

        results.append({
            "timestamp": future_dt.isoformat(),
            "predicted_price": round(pred, 2),
            "lower_bound": round(pred - 1.96 * uncertainty, 2),
            "upper_bound": round(pred + 1.96 * uncertainty, 2),
            "confidence": round(max(0.4, 0.85 - i * 0.01), 3),
        })

    return results
