import asyncio
import os
from fastapi import APIRouter
from datetime import datetime, timezone
from services.entso_client import fetch_all_markets, get_latest_price, AREA_CODES, MARKET_NAMES
from services.weather_client import fetch_all_weather, get_current_renewable_pct

router = APIRouter()


@router.get("/today")
async def get_morning_brief():
    all_prices, all_weather = await asyncio.gather(fetch_all_markets(), fetch_all_weather())
    today = datetime.now(timezone.utc).strftime("%A, %d %B %Y")
    summary = []
    for code in ["DE","FR","NL","ES","BE","IT"]:
        lp = get_latest_price(all_prices.get(code, []))
        if lp:
            r = get_current_renewable_pct(all_weather.get(code, {}))
            summary.append(f"{code}: EUR {lp:.1f}/MWh | Wind {r['wind_pct']:.0f}% | Solar {r['solar_pct']:.0f}%")

    groq_key = os.getenv("GROQ_API_KEY", "")
    if not groq_key:
        return {"date": today, "brief": "Add GROQ_API_KEY to enable AI briefings.", "markets": summary}

    prompt = f"""Write a professional European electricity market morning brief for {today}.

Market snapshot:
{chr(10).join(summary)}

Format: 2-sentence overview, top 2 price drivers, one cross-border opportunity, one risk to watch.
Under 200 words. Use specific numbers. Professional tone."""

    try:
        from groq import Groq
        client = Groq(api_key=groq_key)
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.4,
        )
        brief = resp.choices[0].message.content
    except Exception as e:
        brief = f"Brief generation failed: {e}"

    return {"date": today, "brief": brief, "markets": summary}
