"""
SEC EDGAR financial statements via edgartools.
Computes key metrics from 10-K filings.
"""
import time
import json
from config import FINANCIAL_CACHE_TTL

_cache = {}


def _safe_div(a, b):
    if a is None or b is None or b == 0:
        return None
    return a / b


def _safe_pct(a, b):
    v = _safe_div(a, b)
    return round(v * 100, 2) if v is not None else None


def _safe_growth(new, old):
    if new is None or old is None or old == 0:
        return None
    return round(((new - old) / abs(old)) * 100, 2)


def _get_val(df, label, year_idx=0):
    """Extract a value from a pandas DataFrame by label and column index."""
    try:
        if df is None or df.empty:
            return None
        for idx in df.index:
            if label.lower() in str(idx).lower():
                vals = df.loc[idx]
                if year_idx < len(vals):
                    v = vals.iloc[year_idx]
                    if hasattr(v, 'item'):
                        return v.item()
                    return float(v) if v is not None else None
        return None
    except Exception:
        return None


def _search_val(df, keywords, year_idx=0):
    """Search for a value using multiple keyword alternatives."""
    for kw in keywords:
        val = _get_val(df, kw, year_idx)
        if val is not None:
            return val
    return None


def lookup_financials(ticker):
    """Fetch financial data for a ticker from SEC EDGAR."""
    cache_key = f"fin_{ticker}"
    now = time.time()
    if cache_key in _cache and now - _cache[cache_key]["ts"] < FINANCIAL_CACHE_TTL:
        return _cache[cache_key]["data"]

    try:
        from edgar import Company
        company = Company(ticker)
        filings = company.get_filings(form="10-K")

        if not filings or len(filings) == 0:
            return {"error": f"No 10-K filings found for {ticker}"}

        # Get the most recent 10-K
        latest = filings[0]
        xbrl = latest.xbrl()

        if xbrl is None:
            return {"error": f"Could not parse XBRL for {ticker}"}

        # Try to get financial statements
        income = None
        balance = None
        cashflow = None

        try:
            income = xbrl.statements.income
        except Exception:
            pass
        try:
            balance = xbrl.statements.balance_sheet
        except Exception:
            pass
        try:
            cashflow = xbrl.statements.cash_flow
        except Exception:
            pass

        # Extract metrics
        metrics = _compute_metrics(income, balance, cashflow)

        # Build statement data for display
        statements = {
            "income": _statement_to_dict(income),
            "balance": _statement_to_dict(balance),
            "cashflow": _statement_to_dict(cashflow),
        }

        result = {
            "ticker": ticker,
            "company": str(company),
            "metrics": metrics,
            "statements": statements,
        }

        _cache[cache_key] = {"ts": now, "data": result}
        return result

    except Exception as e:
        return {"error": f"Failed to fetch financials for {ticker}: {str(e)}"}


def _compute_metrics(income, balance, cashflow):
    """Compute 30+ financial metrics from statements."""
    m = {}

    # Income statement metrics
    m["revenue"] = _search_val(income, ["revenue", "net revenue", "total revenue", "sales"])
    m["cost_of_revenue"] = _search_val(income, ["cost of revenue", "cost of goods", "cost of sales"])
    m["gross_profit"] = _search_val(income, ["gross profit"])
    m["operating_income"] = _search_val(income, ["operating income", "income from operations"])
    m["net_income"] = _search_val(income, ["net income", "net earnings"])
    m["ebitda"] = _search_val(income, ["ebitda"])
    m["eps"] = _search_val(income, ["earnings per share", "basic eps", "diluted eps"])
    m["interest_expense"] = _search_val(income, ["interest expense"])
    m["tax_expense"] = _search_val(income, ["income tax", "tax expense", "provision for income tax"])

    # Compute gross profit if missing
    if m["gross_profit"] is None and m["revenue"] and m["cost_of_revenue"]:
        m["gross_profit"] = m["revenue"] - m["cost_of_revenue"]

    # Margins
    m["gross_margin"] = _safe_pct(m["gross_profit"], m["revenue"])
    m["operating_margin"] = _safe_pct(m["operating_income"], m["revenue"])
    m["net_margin"] = _safe_pct(m["net_income"], m["revenue"])

    # Balance sheet metrics
    m["total_assets"] = _search_val(balance, ["total assets"])
    m["total_liabilities"] = _search_val(balance, ["total liabilities"])
    m["total_equity"] = _search_val(balance, ["total equity", "stockholders equity", "shareholders equity", "total stockholders"])
    m["current_assets"] = _search_val(balance, ["total current assets", "current assets"])
    m["current_liabilities"] = _search_val(balance, ["total current liabilities", "current liabilities"])
    m["long_term_debt"] = _search_val(balance, ["long-term debt", "long term debt"])
    m["total_debt"] = _search_val(balance, ["total debt"])
    m["cash"] = _search_val(balance, ["cash and cash equivalents", "cash and equivalents"])
    m["inventory"] = _search_val(balance, ["inventory", "inventories"])
    m["accounts_receivable"] = _search_val(balance, ["accounts receivable", "receivables"])

    # Ratios
    m["current_ratio"] = _safe_div(m["current_assets"], m["current_liabilities"])
    if m["current_ratio"]:
        m["current_ratio"] = round(m["current_ratio"], 2)

    debt = m["total_debt"] or m["long_term_debt"] or 0
    m["debt_to_equity"] = _safe_div(debt, m["total_equity"])
    if m["debt_to_equity"]:
        m["debt_to_equity"] = round(m["debt_to_equity"], 2)

    m["roe"] = _safe_pct(m["net_income"], m["total_equity"])
    m["roa"] = _safe_pct(m["net_income"], m["total_assets"])

    m["asset_turnover"] = _safe_div(m["revenue"], m["total_assets"])
    if m["asset_turnover"]:
        m["asset_turnover"] = round(m["asset_turnover"], 2)

    # Interest coverage
    if m["operating_income"] and m["interest_expense"] and m["interest_expense"] != 0:
        m["interest_coverage"] = round(m["operating_income"] / abs(m["interest_expense"]), 2)
    else:
        m["interest_coverage"] = None

    # Cash flow metrics
    m["operating_cashflow"] = _search_val(cashflow, ["operating", "cash from operations", "net cash provided by operating"])
    m["capex"] = _search_val(cashflow, ["capital expenditure", "purchase of property", "payments for property"])
    m["free_cash_flow"] = None
    if m["operating_cashflow"] is not None and m["capex"] is not None:
        m["free_cash_flow"] = m["operating_cashflow"] - abs(m["capex"])

    m["dividends_paid"] = _search_val(cashflow, ["dividends paid", "payment of dividends"])

    # Growth - compare year 0 vs year 1
    rev_prev = _search_val(income, ["revenue", "net revenue", "total revenue", "sales"], 1)
    ni_prev = _search_val(income, ["net income", "net earnings"], 1)
    m["revenue_growth"] = _safe_growth(m["revenue"], rev_prev)
    m["earnings_growth"] = _safe_growth(m["net_income"], ni_prev)

    # P/E ratio (needs price data — skip for now, set None)
    m["pe_ratio"] = None

    return m


def _statement_to_dict(df):
    """Convert a pandas DataFrame statement into a serializable dict."""
    if df is None:
        return {}

    try:
        result = {}
        # Get year columns
        years = []
        for col in df.columns:
            years.append(str(col))
        result["_years"] = years

        for idx in df.index:
            label = str(idx)
            vals = []
            for col in df.columns:
                v = df.loc[idx, col]
                if hasattr(v, 'item'):
                    vals.append(v.item())
                elif v is None:
                    vals.append(None)
                else:
                    try:
                        vals.append(float(v))
                    except (ValueError, TypeError):
                        vals.append(None)
            result[label] = vals

        return result
    except Exception:
        return {}


def compare_financials(tickers):
    """Fetch and compare financials for multiple tickers."""
    companies = []
    for t in tickers:
        data = lookup_financials(t.strip().upper())
        if "error" not in data:
            companies.append({
                "ticker": data["ticker"],
                "metrics": data.get("metrics", {}),
            })
    return {"companies": companies}
