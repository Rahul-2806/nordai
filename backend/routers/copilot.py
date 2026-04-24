import asyncio
import os
from fastapi import APIRouter, HTTPException
from models.schemas import CopilotRequest, CopilotResponse
from services.entso_client import fetch_all_markets, get_latest_price, AREA_CODES, MARKET_NAMES
from services.weather_client import fetch_all_weather, get_current_renewable_pct

router = APIRouter()

SYSTEM_PROMPT = """You are NordAI, an expert European electricity market analyst.
You have real-time access to day-ahead prices across DE, FR, NL, ES, BE, GB, IT, PL markets,
wind/solar forecasts, and cross-border arbitrage opportunities.
Give concise, data-driven trading insights. Always cite specific prices and percentages.
Keep answers under 150 words unless complex analysis is requested. Be direct and actionable."""


def _build_context(all_prices, all_weather):
    lines = ["=== LIVE MARKET DATA ==="]
    for code in ["DE","FR","NL","ES","BE","GB","IT","PL"]:
        lp = get_latest_price(all_prices.get(code, []))
        if lp is None:
            continue
        r = get_current_renewable_pct(all_weather.get(code, {}))
        lines.append(f"{code} ({MARKET_NAMES[code]}): EUR {lp:.1f}/MWh | Wind {r['wind_pct']:.0f}% | Solar {r['solar_pct']:.0f}% | Temp {r['temperature']:.1f}C")
    prices = {c: get_latest_price(all_prices.get(c,[])) for c in AREA_CODES if get_latest_price(all_prices.get(c,[]))}
    if prices:
        hi = max(prices, key=prices.get)
        lo = min(prices, key=prices.get)
        lines.append(f"\nMax spread: {hi} EUR {prices[hi]:.1f} vs {lo} EUR {prices[lo]:.1f} = EUR {prices[hi]-prices[lo]:.1f}/MWh")
        lines.append(f"EU average: EUR {sum(prices.values())/len(prices):.1f}/MWh")
    return "\n".join(lines)


@router.post("/chat", response_model=CopilotResponse)
async def chat(request: CopilotRequest):
    groq_key = os.getenv("GROQ_API_KEY", "")
    if not groq_key:
        return CopilotResponse(
            reply="Add your GROQ_API_KEY to the .env file to enable the AI Co-Pilot.",
            sources=[],
        )

    all_prices, all_weather = await asyncio.gather(fetch_all_markets(), fetch_all_weather())
    context = _build_context(all_prices, all_weather)

    messages = [{"role": "system", "content": SYSTEM_PROMPT + "\n\n" + context}]
    for msg in request.conversation_history[-8:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": request.message})

    try:
        from groq import Groq
        client = Groq(api_key=groq_key)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=400,
            temperature=0.3,
        )
        reply = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

    return CopilotResponse(reply=reply, sources=["ENTSO-E", "OpenMeteo"])


@router.get("/context")
async def get_context():
    all_prices, all_weather = await asyncio.gather(fetch_all_markets(), fetch_all_weather())
    return {"context": _build_context(all_prices, all_weather)}
