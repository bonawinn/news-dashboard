from flask import Blueprint, request, jsonify
from services.screener import run_screen, run_template, get_templates

screener_bp = Blueprint("screener", __name__)


@screener_bp.route("/api/screener/templates")
def screener_templates():
    return jsonify(get_templates())


@screener_bp.route("/api/screener/screen")
def screener_screen():
    # Build filters from query params
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


@screener_bp.route("/api/screener/template/<template_name>")
def screener_template(template_name):
    data = run_template(template_name)
    if "error" in data:
        return jsonify(data), 404
    return jsonify(data)
