"""
FRED economic indicators dashboard.
Requires free FRED API key. Gracefully degrades without it.
"""
import time
from config import FRED_API_KEY, FRED_SERIES, MACRO_CACHE_TTL

_cache = {}


def is_configured():
    """Check if FRED API key is set."""
    return bool(FRED_API_KEY)


def _get_fred():
    """Get a FRED API client."""
    from fredapi import Fred
    return Fred(api_key=FRED_API_KEY)


def get_overview():
    """Fetch overview of all macro categories with latest values and history."""
    cache_key = "macro_overview"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < MACRO_CACHE_TTL:
        return _cache[cache_key]["data"]

    if not is_configured():
        return {"error": "FRED API key not configured"}

    fred = _get_fred()
    categories = {}

    for cat_key, series_dict in FRED_SERIES.items():
        cat_name = cat_key.replace("_", " ").title()
        indicators = []

        for series_id, meta in series_dict.items():
            try:
                data = fred.get_series(series_id)
                if data is None or data.empty:
                    continue

                # Drop NaN values
                data = data.dropna()
                if data.empty:
                    continue

                latest_value = float(data.iloc[-1])
                prev_value = float(data.iloc[-2]) if len(data) > 1 else None
                change = round(latest_value - prev_value, 4) if prev_value is not None else None

                # Get last 12 data points for sparkline
                history = [float(v) for v in data.tail(12).values]

                indicators.append({
                    "series_id": series_id,
                    "name": meta["name"],
                    "unit": meta["unit"],
                    "freq": meta["freq"],
                    "value": round(latest_value, 4),
                    "change": change,
                    "date": str(data.index[-1].date()) if hasattr(data.index[-1], 'date') else str(data.index[-1]),
                    "history": history,
                })
            except Exception as e:
                indicators.append({
                    "series_id": series_id,
                    "name": meta["name"],
                    "unit": meta["unit"],
                    "error": str(e),
                })

        categories[cat_key] = {
            "name": cat_name,
            "indicators": indicators,
        }

    result = {"categories": categories}
    _cache[cache_key] = {"ts": now, "data": result}
    return result


def get_category(category):
    """Fetch detailed data for a specific macro category."""
    if not is_configured():
        return {"error": "FRED API key not configured"}

    if category not in FRED_SERIES:
        return {"error": f"Unknown category: {category}"}

    cache_key = f"macro_cat_{category}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < MACRO_CACHE_TTL:
        return _cache[cache_key]["data"]

    fred = _get_fred()
    series_dict = FRED_SERIES[category]
    indicators = []

    for series_id, meta in series_dict.items():
        try:
            data = fred.get_series(series_id)
            if data is None or data.empty:
                continue

            data = data.dropna()
            if data.empty:
                continue

            latest = float(data.iloc[-1])
            history = [float(v) for v in data.tail(24).values]

            # Calculate YoY change if enough data
            yoy_change = None
            if len(data) > 12 and meta["freq"] == "M":
                year_ago = float(data.iloc[-13])
                if year_ago != 0:
                    yoy_change = round(((latest - year_ago) / abs(year_ago)) * 100, 2)

            indicators.append({
                "series_id": series_id,
                "name": meta["name"],
                "unit": meta["unit"],
                "value": round(latest, 4),
                "yoy_change": yoy_change,
                "date": str(data.index[-1].date()) if hasattr(data.index[-1], 'date') else str(data.index[-1]),
                "history": history,
            })
        except Exception as e:
            indicators.append({
                "series_id": series_id,
                "name": meta["name"],
                "error": str(e),
            })

    cat_name = category.replace("_", " ").title()
    result = {"category": category, "name": cat_name, "indicators": indicators}

    _cache[cache_key] = {"ts": now, "data": result}
    return result


def get_recession_probability():
    """Calculate a simple recession probability score based on key indicators."""
    if not is_configured():
        return {"error": "FRED API key not configured"}

    cache_key = "recession_prob"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < MACRO_CACHE_TTL:
        return _cache[cache_key]["data"]

    fred = _get_fred()
    signals = []

    try:
        # 1. Yield curve inversion (10Y-2Y spread)
        spread = fred.get_series("T10Y2Y").dropna()
        if not spread.empty:
            val = float(spread.iloc[-1])
            signals.append(1.0 if val < 0 else 0.0)

        # 2. Unemployment trend (rising = bad)
        unemp = fred.get_series("UNRATE").dropna()
        if len(unemp) > 3:
            recent = float(unemp.iloc[-1])
            three_ago = float(unemp.iloc[-4])
            signals.append(1.0 if recent > three_ago + 0.5 else 0.0)

        # 3. ISM Manufacturing / Industrial Production
        indpro = fred.get_series("INDPRO").dropna()
        if len(indpro) > 12:
            latest = float(indpro.iloc[-1])
            year_ago = float(indpro.iloc[-13])
            signals.append(1.0 if latest < year_ago else 0.0)

        # 4. Jobless claims trend
        claims = fred.get_series("ICSA").dropna()
        if len(claims) > 4:
            recent_avg = float(claims.tail(4).mean())
            prior_avg = float(claims.iloc[-8:-4].mean()) if len(claims) > 8 else recent_avg
            signals.append(1.0 if recent_avg > prior_avg * 1.1 else 0.0)

        # 5. Financial stress
        stress = fred.get_series("STLFSI4").dropna()
        if not stress.empty:
            val = float(stress.iloc[-1])
            signals.append(1.0 if val > 1.0 else 0.5 if val > 0 else 0.0)

    except Exception:
        pass

    if signals:
        probability = round((sum(signals) / len(signals)) * 100, 1)
    else:
        probability = 0.0

    result = {"probability": probability, "signals_used": len(signals)}
    _cache[cache_key] = {"ts": now, "data": result}
    return result
