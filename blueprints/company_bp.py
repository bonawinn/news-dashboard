from flask import Blueprint, jsonify
from services.company_detail import get_company_detail

company_bp = Blueprint("company", __name__)


@company_bp.route("/api/company/<ticker>")
def company_detail(ticker):
    data = get_company_detail(ticker)
    if "error" in data:
        return jsonify(data), 500
    return jsonify(data)
