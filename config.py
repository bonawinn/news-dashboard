import os
from dotenv import load_dotenv

load_dotenv()

# --- API Keys ---
BRAVE_API_KEY = os.getenv("BRAVE_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
FRED_API_KEY = os.getenv("FRED_API_KEY", "")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# --- Brave News ---
BRAVE_NEWS_URL = "https://api.search.brave.com/res/v1/news/search"

DEFAULT_QUERIES = [
    "US stock market news today",
    "Wall Street equities",
    "S&P 500 Nasdaq Dow Jones news",
]

# --- Cache TTLs (seconds) ---
NEWS_CACHE_TTL = 300       # 5 minutes
STOCK_CACHE_TTL = 120      # 2 minutes
FINANCIAL_CACHE_TTL = 3600 # 1 hour
SCREENER_CACHE_TTL = 900   # 15 minutes
INSIDER_CACHE_TTL = 1800   # 30 minutes
MACRO_CACHE_TTL = 3600     # 1 hour

# --- FRED Series ---
FRED_SERIES = {
    "growth": {
        "GDP": {"name": "Real GDP", "unit": "Bil. $", "freq": "Q"},
        "A191RL1Q225SBEA": {"name": "Real GDP Growth Rate", "unit": "%", "freq": "Q"},
        "INDPRO": {"name": "Industrial Production", "unit": "Index", "freq": "M"},
        "RSAFS": {"name": "Retail Sales", "unit": "Mil. $", "freq": "M"},
    },
    "labor": {
        "UNRATE": {"name": "Unemployment Rate", "unit": "%", "freq": "M"},
        "PAYEMS": {"name": "Nonfarm Payrolls", "unit": "Thou.", "freq": "M"},
        "ICSA": {"name": "Initial Jobless Claims", "unit": "Thou.", "freq": "W"},
        "JTSJOL": {"name": "Job Openings (JOLTS)", "unit": "Thou.", "freq": "M"},
        "AHETPI": {"name": "Avg Hourly Earnings", "unit": "$/hr", "freq": "M"},
    },
    "inflation": {
        "CPIAUCSL": {"name": "CPI (All Items)", "unit": "Index", "freq": "M"},
        "CPILFESL": {"name": "Core CPI", "unit": "Index", "freq": "M"},
        "PCEPI": {"name": "PCE Price Index", "unit": "Index", "freq": "M"},
        "PCEPILFE": {"name": "Core PCE", "unit": "Index", "freq": "M"},
        "T5YIE": {"name": "5Y Breakeven Inflation", "unit": "%", "freq": "D"},
    },
    "rates": {
        "FEDFUNDS": {"name": "Fed Funds Rate", "unit": "%", "freq": "M"},
        "DGS2": {"name": "2Y Treasury Yield", "unit": "%", "freq": "D"},
        "DGS10": {"name": "10Y Treasury Yield", "unit": "%", "freq": "D"},
        "T10Y2Y": {"name": "10Y-2Y Spread", "unit": "%", "freq": "D"},
        "BAMLH0A0HYM2": {"name": "HY Credit Spread", "unit": "%", "freq": "D"},
    },
    "housing": {
        "HOUST": {"name": "Housing Starts", "unit": "Thou.", "freq": "M"},
        "PERMIT": {"name": "Building Permits", "unit": "Thou.", "freq": "M"},
        "CSUSHPINSA": {"name": "Case-Shiller Home Price", "unit": "Index", "freq": "M"},
        "MORTGAGE30US": {"name": "30Y Mortgage Rate", "unit": "%", "freq": "W"},
    },
    "sentiment": {
        "UMCSENT": {"name": "U. of Michigan Sentiment", "unit": "Index", "freq": "M"},
        "VIXCLS": {"name": "VIX", "unit": "Index", "freq": "D"},
        "STLFSI4": {"name": "Financial Stress Index", "unit": "Index", "freq": "W"},
    },
}

# --- Screener Templates ---
SCREENER_TEMPLATES = {
    "buffett_style": {
        "name": "Buffett-Style Value",
        "description": "High ROE, reasonable P/E, consistent earnings",
        "filters": {
            "roe_min": 15,
            "pe_max": 25,
            "debt_equity_max": 1.0,
            "market_cap_min": 10_000_000_000,
        },
    },
    "deep_value": {
        "name": "Deep Value",
        "description": "Low P/E, low P/B, high dividend yield",
        "filters": {
            "pe_max": 12,
            "pb_max": 1.5,
            "dividend_yield_min": 2.0,
        },
    },
    "quality_growth": {
        "name": "Quality Growth",
        "description": "High revenue growth, high margins, strong ROE",
        "filters": {
            "revenue_growth_min": 15,
            "gross_margin_min": 40,
            "roe_min": 18,
        },
    },
    "dividend_income": {
        "name": "Dividend Income",
        "description": "High yield, sustainable payout, consistent dividends",
        "filters": {
            "dividend_yield_min": 3.0,
            "payout_ratio_max": 75,
            "market_cap_min": 5_000_000_000,
        },
    },
    "momentum": {
        "name": "Momentum",
        "description": "Strong recent price performance, high volume",
        "filters": {
            "52w_change_min": 20,
            "market_cap_min": 1_000_000_000,
        },
    },
}
