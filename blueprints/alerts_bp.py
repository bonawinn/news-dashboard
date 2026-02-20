from flask import Blueprint, request, jsonify
from services.alerts import list_alerts, create_alert, delete_alert, test_telegram

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/api/alerts/list")
def alerts_list():
    return jsonify(list_alerts())


@alerts_bp.route("/api/alerts/create", methods=["POST"])
def alerts_create():
    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    alert_type = data.get("alert_type", "").strip()
    config = data.get("config", {})

    if not name or not alert_type:
        return jsonify({"error": "name and alert_type required"}), 400

    result = create_alert(name, alert_type, config)
    if "error" in result:
        return jsonify(result), 500
    return jsonify(result), 201


@alerts_bp.route("/api/alerts/delete/<int:alert_id>", methods=["DELETE"])
def alerts_delete(alert_id):
    result = delete_alert(alert_id)
    if "error" in result:
        return jsonify(result), 404
    return jsonify(result)


@alerts_bp.route("/api/alerts/test", methods=["POST"])
def alerts_test():
    result = test_telegram()
    if "error" in result:
        return jsonify(result), 503
    return jsonify(result)
