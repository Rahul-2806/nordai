import httpx
import asyncio
import random
from datetime import datetime, timedelta, timezone

COUNTRY_COORDS = {
    "DE": {"lat": 51.2, "lon": 10.5, "name": "Germany"},
    "FR": {"lat": 46.2, "lon": 2.2,  "name": "France"},
    "NL": {"lat": 52.3, "lon": 5.3,  "name": "Netherlands"},
    "ES": {"lat": 40.4, "lon": -3.7, "name": "Spain"},
    "BE": {"lat": 50.5, "lon": 4.5,  "name": "Belgium"},
    "GB": {"lat": 52.4, "lon": -1.9, "name": "Great Britain"},
    "IT": {"lat": 42.5, "lon": 12.6, "name": "Italy"},
    "PL": {"lat": 52.1, "lon": 19.4, "name": "Poland"},
    "AT": {"lat": 47.5, "lon": 14.5, "name": "Austria"},
    "CH": {"lat": 46.8, "lon": 8.2,  "name": "Switzerland"},
}

BASE_URL = "https://api.open-meteo.com/v1/forecast"


async def fetch_weather(country_code: str, hours: int = 48) -> dict:
    coords = COUNTRY_COORDS.get(country_code)
    if not coords:
        return _mock_weather(country_code, hours)

    params = {
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "hourly": "windspeed_10m,shortwave_radiation,temperature_2m,cloudcover",
        "wind_speed_unit": "ms",
        "forecast_days": 3,
        "timezone": "Europe/Berlin",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            wind = hourly.get("windspeed_10m", [])
            solar = hourly.get("shortwave_radiation", [])
            temp = hourly.get("temperature_2m", [])
            cloudcover = hourly.get("cloudcover", [])

            result = []
            for i in range(min(hours, len(times))):
                wind_val = wind[i] if i < len(wind) else 0
                solar_val = solar[i] if i < len(solar) else 0
                temp_val = temp[i] if i < len(temp) else 15
                cloud_val = cloudcover[i] if i < len(cloudcover) else 50
                wind_pct = min(100, round(wind_val / 25 * 100, 1))
                solar_pct = min(100, round(solar_val / 800 * 100, 1))
                result.append({
                    "timestamp": times[i],
                    "wind_speed": round(wind_val, 1),
                    "wind_pct": wind_pct,
                    "solar_w": round(solar_val, 1),
                    "solar_pct": solar_pct,
                    "temperature": round(temp_val, 1),
                    "cloud_cover": cloud_val,
                })
            return {"country": country_code, "name": coords["name"], "forecast": result}
        except Exception as e:
            print(f"OpenMeteo error for {country_code}: {e}")
            return _mock_weather(country_code, hours)


async def fetch_all_weather() -> dict:
    tasks = {code: fetch_weather(code) for code in COUNTRY_COORDS}
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    output = {}
    for code, result in zip(tasks.keys(), results):
        if isinstance(result, Exception):
            output[code] = _mock_weather(code, 48)
        else:
            output[code] = result
    return output


def get_current_renewable_pct(weather_data: dict) -> dict:
    forecast = weather_data.get("forecast", [])
    if not forecast:
        return {"wind_pct": 30.0, "solar_pct": 20.0, "temperature": 12.0}
    current = forecast[0]
    return {
        "wind_pct": current.get("wind_pct", 30.0),
        "solar_pct": current.get("solar_pct", 20.0),
        "temperature": current.get("temperature", 12.0),
    }


def _mock_weather(country_code: str, hours: int) -> dict:
    defaults = {
        "DE": {"wind": 38, "solar": 20, "temp": 8},
        "FR": {"wind": 22, "solar": 35, "temp": 12},
        "NL": {"wind": 55, "solar": 18, "temp": 9},
        "ES": {"wind": 30, "solar": 72, "temp": 22},
        "BE": {"wind": 40, "solar": 22, "temp": 10},
        "GB": {"wind": 60, "solar": 15, "temp": 7},
        "IT": {"wind": 18, "solar": 65, "temp": 18},
        "PL": {"wind": 28, "solar": 25, "temp": 6},
        "AT": {"wind": 15, "solar": 30, "temp": 5},
        "CH": {"wind": 12, "solar": 35, "temp": 4},
    }
    d = defaults.get(country_code, {"wind": 30, "solar": 30, "temp": 12})
    forecast = []
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    for i in range(hours):
        hour_dt = now + timedelta(hours=i)
        hour = hour_dt.hour
        solar_mult = 0 if (hour < 6 or hour > 20) else abs(hour - 13) / 7
        solar_val = max(0, round(d["solar"] * (1 - solar_mult) + random.gauss(0, 5), 1))
        wind_val = max(0, round(d["wind"] + random.gauss(0, 8), 1))
        forecast.append({
            "timestamp": hour_dt.isoformat(),
            "wind_speed": round(wind_val * 25 / 100, 1),
            "wind_pct": wind_val,
            "solar_w": round(solar_val * 8, 1),
            "solar_pct": solar_val,
            "temperature": round(d["temp"] + random.gauss(0, 2), 1),
            "cloud_cover": random.randint(20, 80),
        })
    return {
        "country": country_code,
        "name": COUNTRY_COORDS.get(country_code, {}).get("name", country_code),
        "forecast": forecast,
    }
