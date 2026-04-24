from dotenv import load_dotenv
import os
load_dotenv()
import httpx
import asyncio
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import random

ENTSO_TOKEN = os.getenv("ENTSO_TOKEN", "")
ENTSO_BASE = "https://web-api.tp.entsoe.eu/api"

AREA_CODES = {
    "DE": "10Y1001A1001A82H",
    "FR": "10YFR-RTE------C",
    "NL": "10YNL----------L",
    "ES": "10YES-REE------0",
    "BE": "10YBE----------2",
    "GB": "10YGB----------A",
    "IT": "10YIT-GRTN-----B",
    "PL": "10YPL-AREA-----S",
    "AT": "10YAT-APG------L",
    "CH": "10YCH-SWISSGRIDZ",
}

MARKET_NAMES = {
    "DE": "Germany",
    "FR": "France",
    "NL": "Netherlands",
    "ES": "Spain",
    "BE": "Belgium",
    "GB": "Great Britain",
    "IT": "Italy",
    "PL": "Poland",
    "AT": "Austria",
    "CH": "Switzerland",
}

CURRENCY = {
    "DE": "EUR", "FR": "EUR", "NL": "EUR", "ES": "EUR",
    "BE": "EUR", "GB": "GBP", "IT": "EUR", "PL": "EUR",
    "AT": "EUR", "CH": "EUR",
}


def _fmt_date(dt: datetime) -> str:
    return dt.strftime("%Y%m%d%H%M")


def _parse_prices_xml(xml_text: str) -> list:
    try:
        root = ET.fromstring(xml_text)
        ns = ""
        if root.tag.startswith("{"):
            ns = root.tag.split("}")[0] + "}"

        results = []
        for ts in root.iter(f"{ns}TimeSeries"):
            period = ts.find(f"{ns}Period")
            if period is None:
                continue
            start_el = period.find(f"{ns}timeInterval/{ns}start")
            if start_el is None:
                continue
            start_dt = datetime.fromisoformat(start_el.text.replace("Z", "+00:00"))
            resolution_el = period.find(f"{ns}resolution")
            resolution = resolution_el.text if resolution_el is not None else "PT60M"
            step_hours = 1 if resolution in ("PT60M", "PT1H") else 0.25

            for point in period.iter(f"{ns}Point"):
                pos_el = point.find(f"{ns}position")
                price_el = point.find(f"{ns}price.amount")
                if pos_el is None or price_el is None:
                    continue
                position = int(pos_el.text)
                price = float(price_el.text)
                hour_delta = (position - 1) * step_hours
                timestamp = start_dt + timedelta(hours=hour_delta)
                results.append({
                    "timestamp": timestamp.isoformat(),
                    "price": round(price, 2),
                    "currency": "EUR",
                })
        return results
    except Exception as e:
        print(f"XML parse error: {e}")
        return []


async def fetch_day_ahead_prices(area_code: str, date: Optional[datetime] = None) -> list:
    if not ENTSO_TOKEN:
        return _mock_prices(area_code)

    if date is None:
        date = datetime.now(timezone.utc)

    period_start = datetime(date.year, date.month, date.day, 0, 0, tzinfo=timezone.utc)
    period_end = period_start + timedelta(days=2)

    params = {
        "securityToken": ENTSO_TOKEN,
        "documentType": "A44",
        "in_Domain": area_code,
        "out_Domain": area_code,
        "periodStart": _fmt_date(period_start),
        "periodEnd": _fmt_date(period_end),
    }

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(ENTSO_BASE, params=params)
            resp.raise_for_status()
            parsed = _parse_prices_xml(resp.text)
            return parsed if parsed else _mock_prices(area_code)
        except Exception as e:
            print(f"ENTSO-E fetch error for {area_code}: {e}")
            return _mock_prices(area_code)


async def fetch_all_markets() -> dict:
    tasks = {code: fetch_day_ahead_prices(code) for code in AREA_CODES}
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    output = {}
    for code, result in zip(tasks.keys(), results):
        if isinstance(result, Exception) or not result:
            output[code] = _mock_prices(code)
        else:
            output[code] = result
    return output


def get_latest_price(prices: list) -> Optional[float]:
    if not prices:
        return None
    now = datetime.now(timezone.utc)
    closest = None
    min_diff = float("inf")
    for p in prices:
        try:
            ts = datetime.fromisoformat(p["timestamp"])
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            diff = abs((ts - now).total_seconds())
            if diff < min_diff:
                min_diff = diff
                closest = p["price"]
        except Exception:
            continue
    return closest


def _mock_prices(area_code: str) -> list:
    base_prices = {
        "DE": 89.4, "FR": 74.1, "NL": 86.2, "ES": 61.3,
        "BE": 85.7, "GB": 78.2, "IT": 92.1, "PL": 71.8,
        "AT": 88.1, "CH": 82.3,
    }
    base = base_prices.get(area_code, 80.0)
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    prices = []
    for i in range(-24, 48):
        hour_dt = now + timedelta(hours=i)
        hour = hour_dt.hour
        curve = 1.0
        if 6 <= hour <= 9:
            curve = 1.12
        elif 17 <= hour <= 20:
            curve = 1.18
        elif 0 <= hour <= 5:
            curve = 0.82
        noise = random.gauss(0, base * 0.03)
        prices.append({
            "timestamp": hour_dt.isoformat(),
            "price": round(base * curve + noise, 2),
            "currency": CURRENCY.get(area_code, "EUR"),
        })
    return prices
