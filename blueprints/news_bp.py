from flask import Blueprint, request, jsonify
from services.brave_news import search_news_multi
from services.ticker_extractor import extract_tickers_from_articles
from services.stock_data import get_multiple_stocks
from services.sentiment import score_articles, claude_sentiment, claude_sentiment_available
from config import DEFAULT_QUERIES

news_bp = Blueprint("news", __name__)


@news_bp.route("/api/news")
def api_news():
    q = request.args.get("q", "").strip()
    freshness = request.args.get("freshness", "pd")

    if q:
        queries = [q]
    else:
        queries = DEFAULT_QUERIES

    articles = search_news_multi(queries=queries, freshness=freshness)
    articles, all_tickers = extract_tickers_from_articles(articles)
    articles = score_articles(articles)

    return jsonify({
        "articles": articles,
        "tickers": all_tickers,
        "claude_available": claude_sentiment_available(),
    })


@news_bp.route("/api/stocks")
def api_stocks():
    tickers_param = request.args.get("tickers", "")
    if not tickers_param:
        return jsonify({})

    tickers = [t.strip().upper() for t in tickers_param.split(",") if t.strip()]
    data = get_multiple_stocks(tickers)
    return jsonify(data)


@news_bp.route("/api/news/sentiment/claude", methods=["POST"])
def api_claude_sentiment():
    """Get Claude-enhanced sentiment for a single headline."""
    data = request.get_json(force=True)
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "text required"}), 400

    label, score, reason = claude_sentiment(text)
    if label is None:
        return jsonify({"error": reason}), 503

    return jsonify({
        "sentiment": label,
        "score": score,
        "reason": reason,
    })
