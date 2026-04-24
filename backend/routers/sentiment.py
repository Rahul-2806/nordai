from fastapi import APIRouter
from services.news_scraper import fetch_energy_news, get_aggregate_sentiment

router = APIRouter()


@router.get("/news")
async def get_news_sentiment():
    news = await fetch_energy_news(max_items=10)
    agg = get_aggregate_sentiment(news)
    return {"items": news, "aggregate": agg}


@router.get("/aggregate")
async def get_aggregate():
    news = await fetch_energy_news(max_items=10)
    return get_aggregate_sentiment(news)
