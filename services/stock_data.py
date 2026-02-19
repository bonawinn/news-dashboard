import time
import yfinance as yf
from config import STOCK_CACHE_TTL

_cache = {}


def get_stock_info(ticker):
    now = time.time()
    if ticker in _cache and now - _cache[ticker]["ts"] < STOCK_CACHE_TTL:
        return _cache[ticker]["data"]

    try:
        t = yf.Ticker(ticker)
        info = t.fast_info
        price = info.get("lastPrice", 0) or info.get("last_price", 0)
        prev_close = info.get("previousClose", 0) or info.get("previous_close", 0)

        if price and prev_close:
            change = price - prev_close
            change_pct = (change / prev_close) * 100
        else:
            change = 0
            change_pct = 0

        result = {
            "ticker": ticker,
            "price": round(price, 2) if price else None,
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
        }
    except Exception as e:
        print(f"[stock_data] Error fetching {ticker}: {e}")
        result = {
            "ticker": ticker,
            "price": None,
            "change": 0,
            "change_pct": 0,
        }

    _cache[ticker] = {"ts": now, "data": result}
    return result


def get_multiple_stocks(tickers, max_batch=25):
    tickers = list(set(tickers))[:max_batch]
    results = {}
    for t in tickers:
        results[t] = get_stock_info(t)
    return results
