"""
Equity screener using yfinance for quick stock metrics.
Supports template-based and custom filter screening with ~45 filters
across Descriptive, Fundamental, and Technical categories.
"""
import time
import numpy as np
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

MARKET_CAP_PRESETS = {
    "nano": (0, 50_000_000),
    "micro": (50_000_000, 300_000_000),
    "small": (300_000_000, 2_000_000_000),
    "mid": (2_000_000_000, 10_000_000_000),
    "large": (10_000_000_000, 200_000_000_000),
    "mega": (200_000_000_000, float("inf")),
}

SECTORS = [
    "Technology", "Healthcare", "Financial Services", "Consumer Cyclical",
    "Communication Services", "Industrials", "Consumer Defensive",
    "Energy", "Utilities", "Real Estate", "Basic Materials",
]

EXCHANGES = ["NMS", "NYQ", "NGM", "PCX", "BTS"]

# Technical filter keys (used to decide whether to compute technicals)
TECHNICAL_KEYS = {
    "perf_1w", "perf_1m", "perf_3m", "perf_6m", "perf_1y",
    "volatility", "rsi", "sma20", "sma50", "sma200",
    "sma20_dist", "sma50_dist", "sma200_dist",
    "gap", "change_pct", "atr", "high_20d_dist", "low_20d_dist",
    "high_52w_dist", "low_52w_dist",
}


def _pct(val):
    """Convert decimal ratio to percentage."""
    if val is None:
        return None
    return round(val * 100, 2)


def _safe_get(info, *keys):
    """Try multiple keys in info dict, return first non-None."""
    for k in keys:
        v = info.get(k)
        if v is not None:
            return v
    return None


def _fetch_stock_metrics(ticker):
    """Fetch descriptive + fundamental metrics for a single stock."""
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}

        price = _safe_get(info, "currentPrice", "regularMarketPrice")
        avg_vol = info.get("averageVolume")
        cur_vol = _safe_get(info, "volume", "regularMarketVolume")
        rel_vol = None
        if avg_vol and cur_vol and avg_vol > 0:
            rel_vol = round(cur_vol / avg_vol, 2)

        return {
            "ticker": ticker,
            "name": info.get("shortName", info.get("longName", ticker)),
            "price": price,
            # Descriptive
            "exchange": info.get("exchange"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "avg_volume": avg_vol,
            "current_volume": cur_vol,
            "relative_volume": rel_vol,
            "analyst_recommendation": info.get("recommendationKey"),
            "short_float": _pct(info.get("shortPercentOfFloat")),
            "options_available": info.get("options") is not None or bool(info.get("options")),
            # Fundamental - valuation
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "peg_ratio": info.get("pegRatio"),
            "pb_ratio": info.get("priceToBook"),
            "price_to_sales": info.get("priceToSalesTrailing12Months"),
            "ev_to_ebitda": info.get("enterpriseToEbitda"),
            "ev_to_revenue": info.get("enterpriseToRevenue"),
            "eps_trailing": info.get("trailingEps"),
            # Fundamental - profitability
            "roe": _pct(info.get("returnOnEquity")),
            "roa": _pct(info.get("returnOnAssets")),
            "gross_margin": _pct(info.get("grossMargins")),
            "operating_margin": _pct(info.get("operatingMargins")),
            "net_margin": _pct(info.get("profitMargins")),
            # Fundamental - financial health
            "debt_to_equity": info.get("debtToEquity"),
            "current_ratio": info.get("currentRatio"),
            "quick_ratio": info.get("quickRatio"),
            # Fundamental - dividends
            "dividend_yield": _pct(info.get("dividendYield")),
            "payout_ratio": _pct(info.get("payoutRatio")),
            # Fundamental - growth
            "revenue_growth": _pct(info.get("revenueGrowth")),
            "earnings_growth": _pct(info.get("earningsGrowth")),
            # Fundamental - ownership
            "insider_pct": _pct(info.get("heldPercentInsiders")),
            "institutional_pct": _pct(info.get("heldPercentInstitutions")),
            "short_ratio": info.get("shortRatio"),
            # Size
            "market_cap": info.get("marketCap"),
            "52w_change": _pct(info.get("52WeekChange")),
            "beta": info.get("beta"),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e)}


def _fetch_technical_metrics(ticker):
    """Compute technical indicators from price history. Only called when needed."""
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="1y")
        if hist.empty or len(hist) < 5:
            return {}

        close = hist["Close"].values
        high = hist["High"].values
        low = hist["Low"].values
        current = close[-1]

        # Performance returns
        def _ret(n):
            if len(close) > n and close[-n - 1] != 0:
                return round(((current - close[-n - 1]) / close[-n - 1]) * 100, 2)
            return None

        # RSI(14)
        rsi = None
        if len(close) >= 15:
            deltas = np.diff(close[-(15):])
            gains = np.where(deltas > 0, deltas, 0)
            losses = np.where(deltas < 0, -deltas, 0)
            avg_gain = np.mean(gains)
            avg_loss = np.mean(losses)
            if avg_loss > 0:
                rs = avg_gain / avg_loss
                rsi = round(100 - (100 / (1 + rs)), 2)
            else:
                rsi = 100.0

        # SMAs
        sma20 = round(float(np.mean(close[-20:])), 2) if len(close) >= 20 else None
        sma50 = round(float(np.mean(close[-50:])), 2) if len(close) >= 50 else None
        sma200 = round(float(np.mean(close[-200:])), 2) if len(close) >= 200 else None

        def _dist(sma):
            if sma and sma != 0:
                return round(((current - sma) / sma) * 100, 2)
            return None

        # ATR(14)
        atr = None
        if len(close) >= 15:
            trs = []
            for i in range(-14, 0):
                tr = max(high[i] - low[i], abs(high[i] - close[i - 1]), abs(low[i] - close[i - 1]))
                trs.append(tr)
            atr = round(float(np.mean(trs)), 2)

        # Volatility (annualized std of daily returns)
        volatility = None
        if len(close) >= 21:
            daily_rets = np.diff(close[-21:]) / close[-21:-1]
            volatility = round(float(np.std(daily_rets) * np.sqrt(252) * 100), 2)

        # Gap (previous close vs today's open)
        gap = None
        if len(hist) >= 2:
            prev_close = close[-2]
            today_open = hist["Open"].values[-1]
            if prev_close != 0:
                gap = round(((today_open - prev_close) / prev_close) * 100, 2)

        # Change %
        change_pct = None
        if len(close) >= 2 and close[-2] != 0:
            change_pct = round(((current - close[-2]) / close[-2]) * 100, 2)

        # 20d/52w high/low distance
        high_20d = float(np.max(high[-20:])) if len(high) >= 20 else None
        low_20d = float(np.min(low[-20:])) if len(low) >= 20 else None
        high_52w = float(np.max(high))
        low_52w = float(np.min(low))

        return {
            "perf_1w": _ret(5),
            "perf_1m": _ret(21),
            "perf_3m": _ret(63),
            "perf_6m": _ret(126),
            "perf_1y": _ret(252) if len(close) > 252 else _ret(len(close) - 1),
            "volatility": volatility,
            "rsi": rsi,
            "sma20": sma20,
            "sma50": sma50,
            "sma200": sma200,
            "sma20_dist": _dist(sma20),
            "sma50_dist": _dist(sma50),
            "sma200_dist": _dist(sma200),
            "gap": gap,
            "change_pct": change_pct,
            "atr": atr,
            "high_20d_dist": _dist(high_20d),
            "low_20d_dist": _dist(low_20d),
            "high_52w_dist": _dist(high_52w),
            "low_52w_dist": _dist(low_52w),
        }
    except Exception:
        return {}


def _needs_technicals(filters):
    """Check if any filter key requires technical computation."""
    for key in filters:
        base = key.replace("_min", "").replace("_max", "")
        if base in TECHNICAL_KEYS:
            return True
    return False


def _apply_filters(stock, filters):
    """Check if a stock passes all filter criteria."""
    for key, value in filters.items():
        if value is None:
            continue

        # String match filters
        if key in ("exchange", "sector", "industry", "analyst_recommendation"):
            stock_val = stock.get(key)
            if stock_val is None:
                return False
            if isinstance(value, list):
                if stock_val not in value:
                    return False
            else:
                if stock_val != value:
                    return False
            continue

        # Market cap preset range
        if key == "market_cap_range":
            mc = stock.get("market_cap")
            if mc is None:
                return False
            preset = MARKET_CAP_PRESETS.get(value)
            if preset:
                if mc < preset[0] or mc >= preset[1]:
                    return False
            continue

        # Boolean filters
        if key == "options_available":
            if stock.get("options_available") != value:
                return False
            continue

        # Numeric min/max filters
        if key.endswith("_min"):
            metric_key = key[:-4]
            metric_val = stock.get(metric_key)
            if metric_val is None:
                return False
            try:
                if float(metric_val) < float(value):
                    return False
            except (ValueError, TypeError):
                return False
        elif key.endswith("_max"):
            metric_key = key[:-4]
            metric_val = stock.get(metric_key)
            if metric_val is None:
                return False
            try:
                if float(metric_val) > float(value):
                    return False
            except (ValueError, TypeError):
                return False

    return True


def run_screen(filters):
    """Run a screen with custom filters. Returns matching stocks."""
    cache_key = f"screen_{hash(str(sorted(filters.items())))}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < SCREENER_CACHE_TTL:
        return _cache[cache_key]["data"]

    need_tech = _needs_technicals(filters)

    results = []
    for ticker in SCREEN_UNIVERSE:
        metrics = _fetch_stock_metrics(ticker)
        if "error" in metrics:
            continue
        if need_tech:
            tech = _fetch_technical_metrics(ticker)
            metrics.update(tech)
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


def get_filter_options():
    """Return available dropdown values for screener filters."""
    return {
        "exchanges": EXCHANGES,
        "sectors": SECTORS,
        "market_cap_presets": list(MARKET_CAP_PRESETS.keys()),
        "recommendations": ["strong_buy", "buy", "hold", "sell", "strong_sell"],
    }
