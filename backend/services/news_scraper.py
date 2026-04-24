from datetime import datetime, timezone

BULLISH_WORDS = ["surge", "spike", "rise", "jump", "soar", "high", "peak", "shortage", "cold", "outage", "cut"]
BEARISH_WORDS = ["drop", "fall", "decline", "low", "surplus", "warm", "mild", "oversupply", "cheap", "plunge"]


def _score_sentiment(text: str) -> float:
    text_lower = text.lower()
    bull = sum(1 for w in BULLISH_WORDS if w in text_lower)
    bear = sum(1 for w in BEARISH_WORDS if w in text_lower)
    total = bull + bear
    if total == 0:
        return 0.0
    return round((bull - bear) / total, 2)


async def fetch_energy_news(max_items: int = 10) -> list:
    return _mock_news()[:max_items]


def get_aggregate_sentiment(news_items: list) -> dict:
    if not news_items:
        return {"score": 0.0, "label": "neutral", "count": 0}
    scores = [n["sentiment"] for n in news_items]
    avg = sum(scores) / len(scores)
    return {
        "score": round(avg, 2),
        "label": "bullish" if avg > 0.1 else ("bearish" if avg < -0.1 else "neutral"),
        "count": len(news_items),
        "bullish": sum(1 for s in scores if s > 0.1),
        "bearish": sum(1 for s in scores if s < -0.1),
        "neutral": sum(1 for s in scores if -0.1 <= s <= 0.1),
    }


def _mock_news() -> list:
    now = datetime.now(timezone.utc).isoformat()
    return [
        {"title": "German wind generation falls 35% below seasonal average",
         "summary": "Thermal plants stepping in as Nordsee farms underperform.",
         "sentiment": 0.6, "label": "bullish", "timestamp": now},
        {"title": "Spain sets new solar generation record amid summer heat",
         "summary": "Iberian solar output suppressing day-ahead prices.",
         "sentiment": -0.5, "label": "bearish", "timestamp": now},
        {"title": "French nuclear fleet returns to 84% availability",
         "summary": "EDF confirms reactors back online after maintenance.",
         "sentiment": -0.3, "label": "bearish", "timestamp": now},
        {"title": "Cold snap forecast for Central Europe next week",
         "summary": "Heating demand expected to push German prices above EUR 100/MWh.",
         "sentiment": 0.7, "label": "bullish", "timestamp": now},
        {"title": "ENTSO-E warns of interconnector congestion on DE-FR border",
         "summary": "Cross-border capacity constrained until grid upgrade completes.",
         "sentiment": 0.4, "label": "bullish", "timestamp": now},
    ]
