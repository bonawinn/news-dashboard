import time
import requests
from config import BRAVE_API_KEY, BRAVE_NEWS_URL, NEWS_CACHE_TTL, DEFAULT_QUERIES

_cache = {}


def _cache_key(query, freshness, count):
    return f"{query}|{freshness}|{count}"


def fetch_news(query, freshness="pd", count=20):
    key = _cache_key(query, freshness, count)
    now = time.time()
    if key in _cache and now - _cache[key]["ts"] < NEWS_CACHE_TTL:
        return _cache[key]["data"]

    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY,
    }
    params = {
        "q": query,
        "count": count,
        "freshness": freshness,
        "country": "us",
        "search_lang": "en",
    }

    try:
        resp = requests.get(BRAVE_NEWS_URL, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        print(f"[brave_news] Error fetching news for '{query}': {e}")
        return []

    results = []
    for item in data.get("results", []):
        results.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "description": item.get("description", ""),
            "source": item.get("meta_url", {}).get("hostname", "")
                      if isinstance(item.get("meta_url"), dict)
                      else item.get("source", ""),
            "age": item.get("age", ""),
            "thumbnail": (item.get("thumbnail", {}) or {}).get("src", ""),
        })

    _cache[key] = {"ts": now, "data": results}
    return results


def search_news_multi(queries=None, freshness="pd", count=20):
    if queries is None:
        queries = DEFAULT_QUERIES

    seen_urls = set()
    all_articles = []

    for q in queries:
        articles = fetch_news(q, freshness=freshness, count=count)
        for art in articles:
            if art["url"] not in seen_urls:
                seen_urls.add(art["url"])
                all_articles.append(art)

    return all_articles
