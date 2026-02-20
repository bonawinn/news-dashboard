"""
Alert management with optional Telegram delivery.
Web UI always works; Telegram delivery only if bot token + chat ID are configured.
"""
import json
import requests
from datetime import datetime
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
from database.connection import get_session
from database.models import Alert, AlertLog


def telegram_configured():
    """Check if Telegram delivery is available."""
    return bool(TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID)


def send_telegram(message):
    """Send a message via Telegram bot."""
    if not telegram_configured():
        return False, "Telegram not configured (TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID required)"

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
    }

    try:
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        return True, "Message sent"
    except requests.RequestException as e:
        return False, str(e)


def list_alerts():
    """List all alerts."""
    session = get_session()
    try:
        alerts = session.query(Alert).filter(Alert.enabled == True).order_by(Alert.created_at.desc()).all()
        return {
            "alerts": [
                {
                    "id": a.id,
                    "name": a.name,
                    "alert_type": a.alert_type,
                    "config": json.loads(a.config_json) if a.config_json else {},
                    "enabled": a.enabled,
                    "last_triggered": a.last_triggered.isoformat() if a.last_triggered else None,
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                }
                for a in alerts
            ],
            "telegram_configured": telegram_configured(),
        }
    finally:
        session.close()


def create_alert(name, alert_type, config):
    """Create a new alert."""
    session = get_session()
    try:
        alert = Alert(
            name=name,
            alert_type=alert_type,
            config_json=json.dumps(config),
            enabled=True,
        )
        session.add(alert)
        session.commit()
        return {"id": alert.id, "name": alert.name, "alert_type": alert.alert_type}
    except Exception as e:
        session.rollback()
        return {"error": str(e)}
    finally:
        session.close()


def delete_alert(alert_id):
    """Delete an alert by ID."""
    session = get_session()
    try:
        alert = session.query(Alert).filter(Alert.id == alert_id).first()
        if not alert:
            return {"error": "Alert not found"}
        session.delete(alert)
        session.commit()
        return {"deleted": True}
    except Exception as e:
        session.rollback()
        return {"error": str(e)}
    finally:
        session.close()


def test_telegram():
    """Send a test message to Telegram."""
    if not telegram_configured():
        return {
            "error": "Telegram not configured. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to .env"
        }

    ok, msg = send_telegram(
        "<b>Alpha Terminal</b>\nTest notification sent successfully at "
        + datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    if ok:
        return {"message": "Test message sent to Telegram!"}
    else:
        return {"error": f"Failed to send: {msg}"}
