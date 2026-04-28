import asyncio
import os
import json
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from groq import Groq
from supabase import create_client

from services.entso_client import (
    fetch_all_markets, get_latest_price,
    AREA_CODES, MARKET_NAMES
)
from services.weather_client import fetch_all_weather, get_current_renewable_pct

router = APIRouter()

# ── CLIENTS ──────────────────────────────────────────────────────────
def get_groq():
    return Groq(api_key=os.environ["GROQ_API_KEY"])

def get_supabase():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# ── SCHEMAS ───────────────────────────────────────────────────────────
class AgentChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None   # null = new session

class AgentChatResponse(BaseModel):
    reply: str
    session_id: str
    tool_used: Optional[str] = None
    sources: list[str] = []

# ── SYSTEM PROMPT ─────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are NordAI, an expert autonomous European electricity trading agent.
You have access to live market tools. When the user asks about prices, arbitrage, signals,
forecasts, or market conditions — you MUST call the appropriate tool first, then answer.

Available tools:
- get_live_prices: Get current prices for all 10 markets
- get_arbitrage: Get current cross-border arbitrage opportunities
- get_signals: Get current trading signals
- get_forecast: Get price forecasts for a market (param: market_code e.g. DE, FR)
- get_regime: Get current market regime classification

Always cite exact prices and percentages. Be direct and actionable.
Keep answers under 200 words unless deep analysis is requested."""

# ── TOOL DEFINITIONS ─────────────────────────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_live_prices",
            "description": "Get current day-ahead electricity prices for all European markets",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_arbitrage",
            "description": "Get current cross-border arbitrage opportunities between markets",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_signals",
            "description": "Get current buy/sell trading signals for all markets",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_forecast",
            "description": "Get price forecast for a specific market",
            "parameters": {
                "type": "object",
                "properties": {
                    "market_code": {
                        "type": "string",
                        "description": "Market code: DE, FR, NL, ES, BE, GB, IT, PL, NO, DK",
                    }
                },
                "required": ["market_code"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_regime",
            "description": "Get current market regime classification (bull/bear/volatile/stable)",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]

# ── TOOL EXECUTOR ─────────────────────────────────────────────────────
async def execute_tool(name: str, args: dict) -> str:
    try:
        if name == "get_live_prices":
            all_prices, all_weather = await asyncio.gather(
                fetch_all_markets(), fetch_all_weather()
            )
            lines = []
            for code in ["DE", "FR", "NL", "ES", "BE", "GB", "IT", "PL"]:
                lp = get_latest_price(all_prices.get(code, []))
                if lp is None:
                    continue
                r = get_current_renewable_pct(all_weather.get(code, {}))
                lines.append(
                    f"{code} ({MARKET_NAMES[code]}): EUR {lp:.1f}/MWh | "
                    f"Wind {r['wind_pct']:.0f}% | Solar {r['solar_pct']:.0f}%"
                )
            prices = {
                c: get_latest_price(all_prices.get(c, []))
                for c in AREA_CODES
                if get_latest_price(all_prices.get(c, []))
            }
            if prices:
                hi = max(prices, key=prices.get)
                lo = min(prices, key=prices.get)
                lines.append(
                    f"\nSpread: {hi} EUR {prices[hi]:.1f} vs {lo} EUR {prices[lo]:.1f} "
                    f"= EUR {prices[hi]-prices[lo]:.1f}/MWh"
                )
                lines.append(f"EU avg: EUR {sum(prices.values())/len(prices):.1f}/MWh")
            return "\n".join(lines)

        elif name == "get_arbitrage":
            import httpx
            base = os.getenv("SELF_URL", "http://localhost:8000")
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{base}/api/arbitrage/opportunities")
                data = resp.json()
            opps = data.get("opportunities", [])[:5]
            if not opps:
                return "No significant arbitrage opportunities currently."
            lines = [f"Top {len(opps)} arbitrage opportunities:"]
            for o in opps:
                lines.append(
                    f"  {o.get('buy_market','?')} → {o.get('sell_market','?')}: "
                    f"EUR {o.get('spread',0):.1f}/MWh | "
                    f"Confidence: {o.get('confidence','?')}"
                )
            return "\n".join(lines)

        elif name == "get_signals":
            import httpx
            base = os.getenv("SELF_URL", "http://localhost:8000")
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{base}/api/signals/all")
                data = resp.json()
            signals = data.get("signals", [])[:6]
            if not signals:
                return "No trading signals available."
            lines = ["Current trading signals:"]
            for s in signals:
                lines.append(
                    f"  {s.get('market','?')}: {s.get('signal','?')} | "
                    f"Strength: {s.get('strength','?')} | "
                    f"Price: EUR {s.get('price',0):.1f}/MWh"
                )
            return "\n".join(lines)

        elif name == "get_forecast":
            import httpx
            market_code = args.get("market_code", "DE").upper()
            base = os.getenv("SELF_URL", "http://localhost:8000")
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{base}/api/forecast/price",
                    params={"area_code": market_code}
                )
                data = resp.json()
            forecasts = data.get("forecasts", [])[:6]
            if not forecasts:
                return f"No forecast data for {market_code}."
            lines = [f"Price forecast for {market_code}:"]
            for f in forecasts:
                lines.append(
                    f"  {f.get('hour','?')}h: EUR {f.get('predicted_price',0):.1f}/MWh"
                )
            return "\n".join(lines)

        elif name == "get_regime":
            import httpx
            base = os.getenv("SELF_URL", "http://localhost:8000")
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(f"{base}/api/regime/current")
                data = resp.json()
            return (
                f"Market regime: {data.get('regime','unknown').upper()} | "
                f"Confidence: {data.get('confidence',0):.0%} | "
                f"Volatility: {data.get('volatility','?')}"
            )

        return f"Tool {name} executed successfully."

    except Exception as e:
        return f"Tool {name} error: {str(e)}"

# ── MEMORY HELPERS ────────────────────────────────────────────────────
def load_history(session_id: str) -> list:
    try:
        sb = get_supabase()
        result = (
            sb.table("copilot_sessions")
            .select("messages")
            .eq("session_id", session_id)
            .single()
            .execute()
        )
        return result.data["messages"] if result.data else []
    except Exception:
        return []

def save_history(session_id: str, messages: list):
    try:
        sb = get_supabase()
        sb.table("copilot_sessions").upsert({
            "session_id": session_id,
            "messages":   messages,
            "updated_at": datetime.utcnow().isoformat(),
        }).execute()
    except Exception as e:
        print(f"Memory save error: {e}")

# ── MAIN AGENT ENDPOINT ───────────────────────────────────────────────
@router.post("/chat", response_model=AgentChatResponse)
async def agent_chat(request: AgentChatRequest):
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    # Session management
    session_id = request.session_id or str(uuid.uuid4())
    history    = load_history(session_id)

    # Add user message
    history.append({"role": "user", "content": request.message})

    # Build messages for LLM (system + last 12 turns)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += history[-12:]

    client     = get_groq()
    tool_used  = None

    try:
        # First call — may trigger tool use
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_tokens=600,
            temperature=0.3,
        )

        msg = response.choices[0].message

        # Handle tool calls
        if msg.tool_calls:
            tool_call  = msg.tool_calls[0]
            tool_name  = tool_call.function.name
            tool_args  = json.loads(tool_call.function.arguments or "{}")
            tool_used  = tool_name

            tool_result = await execute_tool(tool_name, tool_args)

            # Second call with tool result
            messages.append({"role": "assistant", "content": None, "tool_calls": [
                {
                    "id":       tool_call.id,
                    "type":     "function",
                    "function": {
                        "name":      tool_name,
                        "arguments": json.dumps(tool_args),
                    },
                }
            ]})
            messages.append({
                "role":         "tool",
                "tool_call_id": tool_call.id,
                "content":      tool_result,
            })

            response2 = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=500,
                temperature=0.3,
            )
            reply = response2.choices[0].message.content
        else:
            reply = msg.content

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

    # Save to memory
    history.append({"role": "assistant", "content": reply})
    save_history(session_id, history[-20:])  # Keep last 20 turns

    return AgentChatResponse(
        reply=reply,
        session_id=session_id,
        tool_used=tool_used,
        sources=["ENTSO-E", "OpenMeteo"] if tool_used else [],
    )

@router.delete("/session/{session_id}")
def clear_session(session_id: str):
    try:
        sb = get_supabase()
        sb.table("copilot_sessions").delete().eq("session_id", session_id).execute()
        return {"status": "cleared", "session_id": session_id}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

@router.get("/context")
async def get_context():
    all_prices, all_weather = await asyncio.gather(fetch_all_markets(), fetch_all_weather())
    lines = []
    for code in ["DE", "FR", "NL", "ES", "BE", "GB", "IT", "PL"]:
        lp = get_latest_price(all_prices.get(code, []))
        if lp is None:
            continue
        r = get_current_renewable_pct(all_weather.get(code, {}))
        lines.append(
            f"{code} ({MARKET_NAMES[code]}): EUR {lp:.1f}/MWh | "
            f"Wind {r['wind_pct']:.0f}% | Solar {r['solar_pct']:.0f}%"
        )
    return {"context": "\n".join(lines)}