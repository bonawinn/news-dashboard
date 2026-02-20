"""
Equity screener using yfinance for quick stock metrics.
Supports template-based and custom filter screening.
"""
import time
import yfinance as yf
from config import SCREENER_CACHE_TTL, SCREENER_TEMPLATES

_cache = {}

# Universe of popular US stocks to screen (S&P 500 subset + popular picks)
SCREEN_UNIVERSE = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B",
    "UNH", "JNJ", "JPM", "V", "PG", "XOM", "HD", "MA", "CVX", "MRK",
    "ABBV", "LLY", "PEP", "KO", "COST", "AVGO", "WMT", "MCD", "CSCO",
    "ACN", "CRM", "AMD", "ADBE", "TXN", "NEE", "NFLX", "TMO", "UNP",
    "PM", "INTC", "LOW", "HON", "AMGN", "CAT", "BA", "GS", "BLK",
    "SPGI", "AXP", "DE", "ISRG", "MDLZ", "GILD", "SYK", "ADI", "MMC",
    "VRTX", "LRCX", "REGN", "ETN", "PANW", "SCHW", "BKNG", "CI",
    "MO", "CB", "SO", "DUK", "CME", "ZTS", "BSX", "NOW", "PYPL",
    "SNPS", "CDNS", "APD", "CMG", "ICE", "SHW", "MCO", "PLD", "CL",
    "USB", "WM", "TGT", "ORLY", "GD", "NOC", "EMR", "FDX", "NSC",
    "PLTR", "COIN", "SQ", "ROKU", "SNAP", "UBER", "LYFT", "ABNB",
]


def _fetch_stock_metrics(ticker):
    """Fetch key metrics for a single stock."""
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}

        return {
            "ticker": ticker,
            "name": info.get("shortName", info.get("longName", ticker)),
            "price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "pb_ratio": info.get("priceToBook"),
            "roe": _pct(info.get("returnOnEquity")),
            "roa": _pct(info.get("returnOnAssets")),
            "debt_to_equity": info.get("debtToEquity"),
            "current_ratio": info.get("currentRatio"),
            "gross_margin": _pct(info.get("grossMargins")),
            "operating_margin": _pct(info.get("operatingMargins")),
            "net_margin": _pct(info.get("profitMargins")),
            "dividend_yield": _pct(info.get("dividendYield")),
            "payout_ratio": _pct(info.get("payoutRatio")),
            "revenue_growth": _pct(info.get("revenueGrowth")),
            "earnings_growth": _pct(info.get("earningsGrowth")),
            "market_cap": info.get("marketCap"),
            "52w_change": _pct(info.get("52WeekChange")),
            "beta": info.get("beta"),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e)}


def _pct(val):
    """Convert decimal ratio to percentage."""
    if val is None:
        return None
    return round(val * 100, 2)


def _apply_filters(stock, filters):
    """Check if a stock passes all filter criteria."""
    for key, value in filters.items():
        if value is None:
            continue

        if key.endswith("_min"):
            metric_key = key[:-4]
            metric_val = stock.get(metric_key)
            if metric_val is None:
                return False
            if metric_val < value:
                return False
        elif key.endswith("_max"):
            metric_key = key[:-4]
            metric_val = stock.get(metric_key)
            if metric_val is None:
                return False
            if metric_val > value:
                return False

    return True


def run_screen(filters):
    """Run a screen with custom filters. Returns matching stocks."""
    cache_key = f"screen_{hash(frozenset(filters.items()))}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < SCREENER_CACHE_TTL:
        return _cache[cache_key]["data"]

    results = []
    for ticker in SCREEN_UNIVERSE:
        metrics = _fetch_stock_metrics(ticker)
        if "error" in metrics:
            continue
        if _apply_filters(metrics, filters):
            results.append(metrics)

    results.sort(key=lambda x: x.get("market_cap") or 0, reverse=True)
    data = {"results": results, "total_screened": len(SCREEN_UNIVERSE)}

    _cache[cache_key] = {"ts": now, "data": data}
    return data


def run_template(template_name):
    """Run a pre-defined screener template."""
    tpl = SCREENER_TEMPLATES.get(template_name)
    if not tpl:
        return {"error": f"Unknown template: {template_name}"}

    return run_screen(tpl["filters"])


def get_templates():
    """Return available screener templates."""
    return {"templates": SCREENER_TEMPLATES}
