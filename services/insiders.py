"""
Insider trading via SEC EDGAR Form 4 filings using edgartools.
Detects buying clusters (3+ insiders buying within 30 days).
"""
import time
from datetime import datetime, timedelta
from config import INSIDER_CACHE_TTL

_cache = {}


def get_insider_trades(ticker, days=90):
    """Fetch insider trades for a ticker from SEC EDGAR Form 4 filings."""
    cache_key = f"insider_{ticker}_{days}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < INSIDER_CACHE_TTL:
        return _cache[cache_key]["data"]

    try:
        from edgar import Company
        company = Company(ticker)
        filings = company.get_filings(form="4")

        if not filings or len(filings) == 0:
            return {"trades": [], "ticker": ticker}

        cutoff = datetime.now() - timedelta(days=days)
        trades = []

        # Process up to 50 most recent filings
        for filing in filings[:50]:
            try:
                filing_date = None
                if hasattr(filing, 'filing_date'):
                    filing_date = filing.filing_date
                elif hasattr(filing, 'date'):
                    filing_date = filing.date

                if filing_date:
                    if isinstance(filing_date, str):
                        filing_date = datetime.strptime(filing_date, "%Y-%m-%d")
                    elif hasattr(filing_date, 'to_pydatetime'):
                        filing_date = filing_date.to_pydatetime()

                    if filing_date < cutoff:
                        continue

                # Try to parse the Form 4 XML
                form4 = filing.obj()
                if form4 is None:
                    continue

                insider_name = ""
                insider_title = ""

                if hasattr(form4, 'reporting_owner'):
                    owner = form4.reporting_owner
                    if hasattr(owner, 'name'):
                        insider_name = str(owner.name)
                    if hasattr(owner, 'title'):
                        insider_title = str(owner.title)

                # Extract transactions
                transactions = []
                if hasattr(form4, 'transactions'):
                    transactions = form4.transactions if form4.transactions else []
                elif hasattr(form4, 'non_derivative_transactions'):
                    transactions = form4.non_derivative_transactions or []

                for txn in transactions:
                    trade_type = "Unknown"
                    shares = 0
                    price = 0

                    if hasattr(txn, 'acquired_disposed'):
                        ad = str(txn.acquired_disposed).upper()
                        trade_type = "Purchase" if ad == "A" else "Sale"
                    elif hasattr(txn, 'transaction_code'):
                        code = str(txn.transaction_code).upper()
                        trade_type = "Purchase" if code == "P" else "Sale" if code == "S" else code

                    if hasattr(txn, 'shares'):
                        shares = int(txn.shares or 0)
                    elif hasattr(txn, 'transaction_shares'):
                        shares = int(txn.transaction_shares or 0)

                    if hasattr(txn, 'price'):
                        price = float(txn.price or 0)
                    elif hasattr(txn, 'price_per_share'):
                        price = float(txn.price_per_share or 0)

                    value = shares * price

                    trades.append({
                        "ticker": ticker,
                        "insider_name": insider_name,
                        "title": insider_title,
                        "trade_type": trade_type,
                        "shares": shares,
                        "price": round(price, 2),
                        "value": round(value, 2),
                        "filing_date": filing_date.strftime("%Y-%m-%d") if filing_date else "",
                    })

            except Exception:
                continue

        # Sort by date descending
        trades.sort(key=lambda t: t.get("filing_date", ""), reverse=True)
        result = {"trades": trades, "ticker": ticker}

        _cache[cache_key] = {"ts": now, "data": result}
        return result

    except Exception as e:
        return {"error": str(e), "trades": [], "ticker": ticker}


def detect_clusters(days=90, min_insiders=3):
    """Detect buying clusters: tickers where 3+ insiders bought within 30 days."""
    # Screen a set of popular tickers for insider buying activity
    tickers_to_check = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
        "JPM", "BAC", "WFC", "GS", "MS",
        "JNJ", "PFE", "UNH", "MRK", "ABBV",
        "XOM", "CVX", "COP",
        "DIS", "NFLX", "CMCSA",
    ]

    clusters = []
    cutoff_30d = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    for ticker in tickers_to_check:
        try:
            data = get_insider_trades(ticker, days=days)
            trades = data.get("trades", [])

            # Filter to buys in last 30 days
            recent_buys = [
                t for t in trades
                if t.get("trade_type", "").lower() in ("purchase", "p", "buy")
                and t.get("filing_date", "") >= cutoff_30d
            ]

            # Group by unique insider
            insiders = {}
            for t in recent_buys:
                name = t.get("insider_name", "Unknown")
                if name not in insiders:
                    insiders[name] = []
                insiders[name].append(t)

            if len(insiders) >= min_insiders:
                cluster_trades = []
                for name, ts in insiders.items():
                    # Pick the largest trade per insider
                    best = max(ts, key=lambda x: x.get("value", 0))
                    cluster_trades.append(best)

                cluster_trades.sort(key=lambda x: x.get("value", 0), reverse=True)

                clusters.append({
                    "ticker": ticker,
                    "insider_count": len(insiders),
                    "total_value": sum(t.get("value", 0) for t in cluster_trades),
                    "trades": cluster_trades,
                })

        except Exception:
            continue

    clusters.sort(key=lambda c: c.get("total_value", 0), reverse=True)
    return {"clusters": clusters}
