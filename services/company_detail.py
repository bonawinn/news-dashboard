"""
Company detail service — aggregates all data needed for the company detail page.
Uses yfinance for price, fundamentals, and financial statements.
"""
import time
import yfinance as yf
from config import DETAIL_CACHE_TTL

_cache = {}


def _safe(val, default=None):
    """Return val if not None/NaN, else default."""
    if val is None:
        return default
    try:
        import math
        if math.isnan(val):
            return default
    except (TypeError, ValueError):
        pass
    return val


def _pct(val):
    if val is None:
        return None
    return round(val * 100, 2)


def _df_to_dict(df):
    """Convert a yfinance DataFrame (rows=items, cols=dates) to serializable dict."""
    if df is None or df.empty:
        return {}
    result = {}
    cols = [str(c)[:10] if hasattr(c, 'strftime') else str(c)[:10] for c in df.columns]
    result["_periods"] = cols
    for idx in df.index:
        row_label = str(idx)
        vals = []
        for c in df.columns:
            v = df.loc[idx, c]
            try:
                import math
                if v is None or (isinstance(v, float) and math.isnan(v)):
                    vals.append(None)
                else:
                    vals.append(float(v))
            except (TypeError, ValueError):
                vals.append(None)
        result[row_label] = vals
    return result


def get_company_detail(ticker):
    """Return all data for the company detail page."""
    cache_key = f"detail_{ticker.upper()}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < DETAIL_CACHE_TTL:
        return _cache[cache_key]["data"]

    try:
        t = yf.Ticker(ticker.upper())
        info = t.info or {}

        price = _safe(info.get("currentPrice")) or _safe(info.get("regularMarketPrice"))
        prev_close = _safe(info.get("previousClose") or info.get("regularMarketPreviousClose"))
        change = round(price - prev_close, 2) if price and prev_close else None
        change_pct = round((change / prev_close) * 100, 2) if change and prev_close else None

        header = {
            "price": price,
            "change": change,
            "change_pct": change_pct,
            "volume": _safe(info.get("volume") or info.get("regularMarketVolume")),
            "bid": _safe(info.get("bid")),
            "bid_size": _safe(info.get("bidSize")),
            "ask": _safe(info.get("ask")),
            "ask_size": _safe(info.get("askSize")),
            "day_low": _safe(info.get("dayLow") or info.get("regularMarketDayLow")),
            "day_high": _safe(info.get("dayHigh") or info.get("regularMarketDayHigh")),
            "fifty_two_week_low": _safe(info.get("fiftyTwoWeekLow")),
            "fifty_two_week_high": _safe(info.get("fiftyTwoWeekHigh")),
        }

        overview = {
            "name": info.get("shortName") or info.get("longName") or ticker,
            "address": ", ".join(filter(None, [
                info.get("address1"),
                info.get("city"),
                info.get("state"),
                info.get("country"),
            ])),
            "website": info.get("website"),
            "description": info.get("longBusinessSummary"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "logo_url": info.get("logo_url"),
            "employees": _safe(info.get("fullTimeEmployees")),
            "ceo": info.get("companyOfficers", [{}])[0].get("name") if info.get("companyOfficers") else None,
        }

        snapshot = {
            "market_info": {
                "exchange": info.get("exchange"),
                "currency": info.get("currency"),
                "float_shares": _safe(info.get("floatShares")),
                "shares_outstanding": _safe(info.get("sharesOutstanding")),
                "market_cap": _safe(info.get("marketCap")),
            },
            "company_stats": {
                "employees": _safe(info.get("fullTimeEmployees")),
                "insider_pct": _pct(info.get("heldPercentInsiders")),
                "institutional_pct": _pct(info.get("heldPercentInstitutions")),
            },
            "valuation": {
                "trailing_pe": _safe(info.get("trailingPE")),
                "forward_pe": _safe(info.get("forwardPE")),
                "peg_ratio": _safe(info.get("pegRatio")),
                "price_to_sales": _safe(info.get("priceToSalesTrailing12Months")),
                "price_to_book": _safe(info.get("priceToBook")),
                "ev_to_ebitda": _safe(info.get("enterpriseToEbitda")),
                "ev_to_revenue": _safe(info.get("enterpriseToRevenue")),
                "enterprise_value": _safe(info.get("enterpriseValue")),
            },
            "dividends": {
                "dividend_yield": _pct(info.get("dividendYield")),
                "trailing_annual_yield": _pct(info.get("trailingAnnualDividendYield")),
                "payout_ratio": _pct(info.get("payoutRatio")),
                "ex_dividend_date": str(info.get("exDividendDate", "")) if info.get("exDividendDate") else None,
            },
            "risk": {
                "beta": _safe(info.get("beta")),
                "short_pct_of_float": _pct(info.get("shortPercentOfFloat")),
                "short_ratio": _safe(info.get("shortRatio")),
            },
        }

        # Financial statements
        def _get_stmts(annual_attr, quarterly_attr):
            annual_df = getattr(t, annual_attr, None)
            quarterly_df = getattr(t, quarterly_attr, None)
            return {
                "yearly": _df_to_dict(annual_df) if annual_df is not None else {},
                "quarterly": _df_to_dict(quarterly_df) if quarterly_df is not None else {},
            }

        statements = {
            "income": _get_stmts("income_stmt", "quarterly_income_stmt"),
            "balance": _get_stmts("balance_sheet", "quarterly_balance_sheet"),
            "cashflow": _get_stmts("cashflow", "quarterly_cashflow"),
        }

        # Analyst estimates
        estimates = {
            "target_low": _safe(info.get("targetLowPrice")),
            "target_mean": _safe(info.get("targetMeanPrice")),
            "target_median": _safe(info.get("targetMedianPrice")),
            "target_high": _safe(info.get("targetHighPrice")),
            "recommendation": info.get("recommendationKey"),
            "recommendation_mean": _safe(info.get("recommendationMean")),
            "num_analysts": _safe(info.get("numberOfAnalystOpinions")),
        }

        data = {
            "ticker": ticker.upper(),
            "header": header,
            "overview": overview,
            "snapshot": snapshot,
            "statements": statements,
            "estimates": estimates,
        }

        _cache[cache_key] = {"ts": now, "data": data}
        return data

    except Exception as e:
        return {"ticker": ticker.upper(), "error": str(e)}
