import re
from tickers import TICKER_MAP, AMBIGUOUS_TICKERS

# Common uppercase words that are NOT tickers
FALSE_POSITIVES = {
    "CEO", "CFO", "COO", "CTO", "IPO", "SEC", "ETF", "FDA", "FED",
    "GDP", "CPI", "NYSE", "NYSE", "DOJ", "FBI", "IRS", "IMF", "ECB",
    "API", "USA", "USD", "EUR", "GBP", "JPY", "GDP", "EPS", "P/E",
    "Q1", "Q2", "Q3", "Q4", "YTD", "ATH", "ATL", "EOD", "AH",
    "IPO", "SPAC", "REIT", "ESG", "ETF", "PE", "VC", "M&A",
    "THE", "AND", "FOR", "BUT", "NOT", "YOU", "HER", "HIS",
    "NEW", "TOP", "BIG", "OLD", "HOT", "KEY", "FEW", "OUR",
    "ANY", "MAY", "CAN", "HAS", "HAD", "ITS", "WAS", "ARE",
    "WHO", "HOW", "WHY", "SAY", "SET", "SAW", "RUN", "CUT",
    "PUT", "HIT", "LET", "GOT", "GET", "END", "TRY", "BUY",
    "OWN", "PAY", "WIN", "WON", "ADD", "AGO", "ACE", "AIM",
    "BET", "BIT", "CAP", "DAY", "DIP", "ERA", "EYE", "FIT",
    "GAP", "HIGH", "LOW", "MIX", "OPT", "PRO", "RAW", "ROW",
    "TAX", "WAR", "WAY", "ALSO", "JUST", "OVER", "INTO", "MORE",
    "MOST", "MUCH", "ONLY", "VERY", "WHEN", "EVEN", "BACK",
    "DOWN", "EACH", "EVER", "FROM", "FULL", "HALF", "HERE",
    "HIGH", "HOLD", "JUMP", "KEEP", "LAST", "LATE", "LEAD",
    "LIFT", "LIKE", "LINE", "LIST", "LONG", "LOOK", "LOSE",
    "LOST", "MADE", "MAKE", "MARK", "MISS", "MOVE", "MUCH",
    "MUST", "NEAR", "NEED", "NEXT", "OPEN", "OVER", "PART",
    "PAST", "PEAK", "PLAN", "PLAY", "PLUS", "POLL", "PULL",
    "PUSH", "RATE", "REAL", "RIDE", "RISE", "RISK", "ROAD",
    "RULE", "RUSH", "SAID", "SALE", "SAME", "SELL", "SENT",
    "SHOW", "SHUT", "SIDE", "SIGN", "SLIP", "SLOW", "SNAP",
    "SOAR", "SOME", "STAY", "STEP", "STOP", "SURE", "TAKE",
    "TALK", "TELL", "THAN", "THAT", "THEM", "THEN", "THEY",
    "THIS", "TIME", "TOLL", "TOOK", "TURN", "UNIT", "UPON",
    "WARN", "WEEK", "WELL", "WENT", "WERE", "WHAT", "WILL",
    "WITH", "WORD", "WORK", "WRAP", "YEAR", "ZERO",
    "AFTER", "RALLY", "SURGE", "STOCK", "SHARE", "TRADE",
    "GAINS", "FALLS", "DROPS", "JUMPS", "WATCH", "ALERT",
    "BREAK", "CLOSE", "CRASH", "INDEX", "LOWER", "MIXED",
    "BRIEF", "CHART", "CLIMB", "DAILY", "EARLY", "FIRST",
    "FRESH", "GIVES", "GOING", "AHEAD", "MAJOR", "OFFER",
    "OTHER", "POINT", "PRICE", "READY", "REPORT",
}

_cashtag_re = re.compile(r"\$([A-Z]{1,5})\b")
_upper_word_re = re.compile(r"\b([A-Z]{2,5})\b")

# Build a reverse map: lowercase company name words -> ticker
_company_to_ticker = {}
for ticker, name in TICKER_MAP.items():
    _company_to_ticker[name.lower()] = ticker


def extract_tickers(text):
    """Extract stock tickers from a headline/description using 3 tiers."""
    if not text:
        return []

    found = {}

    # Tier 1: $CASHTAG pattern (highest confidence)
    for match in _cashtag_re.finditer(text):
        sym = match.group(1)
        if sym in TICKER_MAP:
            found[sym] = True

    # Tier 2: uppercase word matching (skip ambiguous + false positives)
    for match in _upper_word_re.finditer(text):
        word = match.group(1)
        if word in FALSE_POSITIVES:
            continue
        if word in AMBIGUOUS_TICKERS:
            continue
        if word in TICKER_MAP:
            found[word] = True

    # Tier 3: company name substring matching
    text_lower = text.lower()
    for company_name, ticker in _company_to_ticker.items():
        if len(company_name) >= 4 and company_name in text_lower:
            found[ticker] = True

    return list(found.keys())


def extract_tickers_from_articles(articles):
    """Add 'tickers' list to each article dict."""
    all_tickers = set()
    for art in articles:
        combined = f"{art.get('title', '')} {art.get('description', '')}"
        tickers = extract_tickers(combined)
        art["tickers"] = tickers
        all_tickers.update(tickers)
    return articles, list(all_tickers)
