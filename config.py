import os
from dotenv import load_dotenv

load_dotenv()

BRAVE_API_KEY = os.getenv("BRAVE_API_KEY", "")
BRAVE_NEWS_URL = "https://api.search.brave.com/res/v1/news/search"

DEFAULT_QUERIES = [
    "US stock market news today",
    "Wall Street equities",
    "S&P 500 Nasdaq Dow Jones news",
]

NEWS_CACHE_TTL = 300  # 5 minutes
STOCK_CACHE_TTL = 120  # 2 minutes
