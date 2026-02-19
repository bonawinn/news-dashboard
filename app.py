from flask import Flask, render_template, request, jsonify
from services.brave_news import search_news_multi
from services.ticker_extractor import extract_tickers_from_articles
from services.stock_data import get_multiple_stocks
from config import DEFAULT_QUERIES

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/news")
def api_news():
    q = request.args.get("q", "").strip()
    freshness = request.args.get("freshness", "pd")

    if q:
        queries = [q]
    else:
        queries = DEFAULT_QUERIES

    articles = search_news_multi(queries=queries, freshness=freshness)
    articles, all_tickers = extract_tickers_from_articles(articles)

    return jsonify({
        "articles": articles,
        "tickers": all_tickers,
    })


@app.route("/api/stocks")
def api_stocks():
    tickers_param = request.args.get("tickers", "")
    if not tickers_param:
        return jsonify({})

    tickers = [t.strip().upper() for t in tickers_param.split(",") if t.strip()]
    data = get_multiple_stocks(tickers)
    return jsonify(data)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
