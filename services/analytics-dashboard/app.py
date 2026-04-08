"""
DIRECT Analytics Dashboard — Dash + Matplotlib
Runs on port 8050 by default.
"""

import os
from dash import Dash
import dash_bootstrap_components as dbc
from flask_cors import CORS
from dotenv import load_dotenv

from data.mock_data import get_kpis
from layouts.dashboard import build_dashboard_layout
from callbacks.dashboard_callbacks import register_callbacks

load_dotenv()

PORT = int(os.getenv("ANALYTICS_PORT", "8050"))
DEBUG = os.getenv("ANALYTICS_DEBUG", "true").lower() == "true"

# ── App ────────────────────────────────────────────────────────────────
app = Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    title="DIRECT Analytics",
    update_title=None,
    suppress_callback_exceptions=True,
)

CORS(app.server)

# ── Layout ─────────────────────────────────────────────────────────────
kpis = get_kpis()
app.layout = build_dashboard_layout(kpis)

# ── Callbacks ──────────────────────────────────────────────────────────
register_callbacks(app)

# ── Server ─────────────────────────────────────────────────────────────
server = app.server

if __name__ == "__main__":
    print(f"\n  DIRECT Analytics Dashboard")
    print(f"  ➜  http://localhost:{PORT}/\n")
    app.run(debug=DEBUG, host="0.0.0.0", port=PORT)
