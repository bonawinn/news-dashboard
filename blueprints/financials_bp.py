from flask import Blueprint, request, jsonify
from services.financials import lookup_financials, compare_financials

financials_bp = Blueprint("financials", __name__)


@financials_bp.route("/api/financials/lookup")
def financials_lookup():
    ticker = request.args.get("ticker", "").strip().upper()
    if not ticker:
        return jsonify({"error": "ticker required"}), 400

    data = lookup_financials(ticker)
    if "error" in data:
        return jsonify(data), 404

    return jsonify(data)


@financials_bp.route("/api/financials/compare")
def financials_compare():
    raw = request.args.get("tickers", "")
    if not raw:
        return jsonify({"error": "tickers required (comma-separated)"}), 400

    tickers = [t.strip().upper() for t in raw.split(",") if t.strip()]
    if len(tickers) < 2:
        return jsonify({"error": "Need at least 2 tickers"}), 400

    data = compare_financials(tickers)
    return jsonify(data)
