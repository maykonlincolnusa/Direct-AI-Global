"""
Dash callbacks — render Matplotlib charts on page load.
"""

from dash import Input, Output, callback
from charts.generators import (
    revenue_chart,
    leads_by_channel_chart,
    conversion_funnel_chart,
    channel_performance_chart,
    social_trends_chart,
)


def register_callbacks(app):
    @app.callback(
        [
            Output("chart-revenue", "src"),
            Output("chart-leads", "src"),
            Output("chart-funnel", "src"),
            Output("chart-channels", "src"),
            Output("chart-social", "src"),
        ],
        Input("chart-revenue", "id"),  # trigger on load
    )
    def render_all_charts(_):
        return (
            revenue_chart(),
            leads_by_channel_chart(),
            conversion_funnel_chart(),
            channel_performance_chart(),
            social_trends_chart(),
        )
