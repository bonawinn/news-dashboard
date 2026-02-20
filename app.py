import os
from flask import Flask, render_template, send_from_directory
from database.connection import init_db


def create_app():
    app = Flask(__name__)

    init_db()

    # Register blueprints
    from blueprints.news_bp import news_bp
    from blueprints.financials_bp import financials_bp
    from blueprints.screener_bp import screener_bp
    from blueprints.insiders_bp import insiders_bp
    from blueprints.macro_bp import macro_bp
    from blueprints.alerts_bp import alerts_bp

    app.register_blueprint(news_bp)
    app.register_blueprint(financials_bp)
    app.register_blueprint(screener_bp)
    app.register_blueprint(insiders_bp)
    app.register_blueprint(macro_bp)
    app.register_blueprint(alerts_bp)

    react_dir = os.path.join(app.static_folder, "react")

    @app.route("/")
    def index():
        index_path = os.path.join(react_dir, "index.html")
        if os.path.exists(index_path):
            return send_from_directory(react_dir, "index.html")
        return render_template("index.html")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
