from flask import Blueprint, request, jsonify
from services.screener import run_screen, run_template, get_templates, get_filter_options

screener_bp = Blueprint("screener", __name__)


@screener_bp.route("/api/screener/templates")
def screener_templates():
    return jsonify(get_templates())


@screener_bp.route("/api/screener/screen")
def screener_screen():
    # Build filters from query params (backward compatible)
    filters = {}
    for key in request.args:
        try:
            filters[key] = float(request.args[key])
        except (ValueError, TypeError):
            pass

    if not filters:
        return jsonify({"error": "No filters provided"}), 400

    data = run_screen(filters)
    return jsonify(data)


@screener_bp.route("/api/screener/screen", methods=["POST"])
def screener_screen_advanced():
    """Advanced screen with JSON body supporting complex filter types."""
    body = request.get_json(silent=True) or {}
    filters = body.get("filters", {})

    if not filters:
        return jsonify({"error": "No filters provided"}), 400

    data = run_screen(filters)
    return jsonify(data)


@screener_bp.route("/api/screener/filter-options")
def screener_filter_options():
    return jsonify(get_filter_options())


@screener_bp.route("/api/screener/template/<template_name>")
def screener_template(template_name):
    data = run_template(template_name)
    if "error" in data:
        return jsonify(data), 404
    return jsonify(data)
