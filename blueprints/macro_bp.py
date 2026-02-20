from flask import Blueprint, request, jsonify
from services.macro import is_configured, get_overview, get_category, get_recession_probability

macro_bp = Blueprint("macro", __name__)


@macro_bp.route("/api/macro/status")
def macro_status():
    return jsonify({"configured": is_configured()})


@macro_bp.route("/api/macro/overview")
def macro_overview():
    data = get_overview()
    if "error" in data:
        return jsonify(data), 503
    return jsonify(data)


@macro_bp.route("/api/macro/category/<category>")
def macro_category(category):
    data = get_category(category)
    if "error" in data:
        return jsonify(data), 404
    return jsonify(data)


@macro_bp.route("/api/macro/recession")
def macro_recession():
    data = get_recession_probability()
    if "error" in data:
        return jsonify(data), 503
    return jsonify(data)
