from flask import Blueprint, request, jsonify
from services.insiders import get_insider_trades, detect_clusters

insiders_bp = Blueprint("insiders", __name__)


@insiders_bp.route("/api/insiders/trades")
def insider_trades():
    ticker = request.args.get("ticker", "").strip().upper()
    days = request.args.get("days", "90")

    try:
        days = int(days)
    except ValueError:
        days = 90

    if not ticker:
        return jsonify({"error": "ticker required"}), 400

    data = get_insider_trades(ticker, days=days)
    return jsonify(data)


@insiders_bp.route("/api/insiders/clusters")
def insider_clusters():
    data = detect_clusters()
    return jsonify(data)
