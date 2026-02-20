"""
Keyword-based sentiment scoring for news headlines.
Optional Claude-enhanced sentiment if ANTHROPIC_API_KEY is set.
"""
import hashlib
from config import ANTHROPIC_API_KEY

# Keyword lexicon for financial sentiment
BULLISH_KEYWORDS = {
    "surge", "surges", "surging", "soar", "soars", "soaring",
    "rally", "rallies", "rallying", "jump", "jumps", "jumping",
    "gain", "gains", "gaining", "rise", "rises", "rising",
    "climb", "climbs", "climbing", "bull", "bullish",
    "beat", "beats", "beating", "exceed", "exceeds", "outperform",
    "upgrade", "upgrades", "breakout", "record high", "all-time high",
    "boom", "booming", "strong", "stronger", "upbeat", "optimistic",
    "positive", "growth", "recover", "recovery", "rebound", "rebounds",
    "buy", "buying", "accumulate", "outperforms", "profit",
}

BEARISH_KEYWORDS = {
    "crash", "crashes", "crashing", "plunge", "plunges", "plunging",
    "drop", "drops", "dropping", "fall", "falls", "falling",
    "decline", "declines", "declining", "sink", "sinks", "sinking",
    "slump", "slumps", "sell", "selloff", "sell-off",
    "bear", "bearish", "miss", "misses", "downgrade", "downgrades",
    "loss", "losses", "losing", "weak", "weaker", "recession",
    "layoff", "layoffs", "bankruptcy", "default", "defaults",
    "warning", "warns", "fear", "fears", "panic", "risk",
    "negative", "cut", "cuts", "cutting", "underperform",
    "worst", "concern", "concerns", "trouble", "crisis",
}


def keyword_sentiment(text):
    """Score sentiment using keyword matching.
    Returns (label, score) where label is 'bullish'/'bearish'/'neutral'
    and score is a float from -1.0 (max bearish) to +1.0 (max bullish).
    """
    if not text:
        return "neutral", 0.0

    words = set(text.lower().split())
    bull_count = len(words & BULLISH_KEYWORDS)
    bear_count = len(words & BEARISH_KEYWORDS)

    # Also check multi-word patterns
    text_lower = text.lower()
    for phrase in ("record high", "all-time high", "all time high"):
        if phrase in text_lower:
            bull_count += 2
    for phrase in ("sell-off", "sell off", "all-time low", "all time low"):
        if phrase in text_lower:
            bear_count += 2

    total = bull_count + bear_count
    if total == 0:
        return "neutral", 0.0

    score = (bull_count - bear_count) / total
    if score > 0.15:
        return "bullish", round(score, 3)
    elif score < -0.15:
        return "bearish", round(score, 3)
    else:
        return "neutral", round(score, 3)


def score_articles(articles):
    """Add sentiment and sentiment_score to each article dict."""
    for art in articles:
        text = f"{art.get('title', '')} {art.get('description', '')}"
        label, score = keyword_sentiment(text)
        art["sentiment"] = label
        art["sentiment_score"] = score
    return articles


def claude_sentiment_available():
    """Check if Claude-enhanced sentiment is available."""
    return bool(ANTHROPIC_API_KEY)


def claude_sentiment(text):
    """Use Claude API for sentiment analysis. Returns (label, score, reasoning)."""
    if not ANTHROPIC_API_KEY:
        return None, None, "API key not configured"

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=150,
            messages=[{
                "role": "user",
                "content": f"""Analyze the financial sentiment of this headline. Respond with ONLY a JSON object:
{{"sentiment": "bullish" or "bearish" or "neutral", "score": float from -1.0 to 1.0, "reason": "brief reason"}}

Headline: {text}"""
            }],
        )
        import json
        result = json.loads(response.content[0].text)
        return result.get("sentiment", "neutral"), result.get("score", 0), result.get("reason", "")
    except Exception as e:
        return None, None, str(e)


def url_hash(url):
    """Generate hash for caching sentiment by URL."""
    return hashlib.sha256(url.encode()).hexdigest()
