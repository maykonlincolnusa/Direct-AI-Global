"""
Dash layout definitions for the analytics dashboard.
"""

from dash import html, dcc
import dash_bootstrap_components as dbc


def kpi_card(title: str, value: str, delta: str, delta_color: str = "#13d5a6") -> dbc.Card:
    return dbc.Card(
        dbc.CardBody([
            html.Span(title, className="kpi-label"),
            html.H2(value, className="kpi-value"),
            html.Span(delta, className="kpi-delta", style={"color": delta_color}),
        ]),
        className="kpi-card",
    )


def build_dashboard_layout(kpis: dict) -> html.Div:
    return html.Div([
        # Header
        html.Div([
            html.Div([
                html.Span("DIRECT / Analytics Dashboard", className="eyebrow"),
                html.H1("Painel de Inteligência", className="page-title"),
            ]),
        ], className="page-header"),

        # KPI Row
        dbc.Row([
            dbc.Col(kpi_card(
                "Receita Mensal",
                f"R$ {kpis['receita_mensal']:,.0f}".replace(",", "."),
                f"+{kpis['receita_delta']}% vs mês anterior",
                "#13d5a6"
            ), lg=3, md=6, xs=12),
            dbc.Col(kpi_card(
                "Novos Leads",
                str(kpis["leads_mes"]),
                f"+{kpis['leads_delta']} esta semana",
                "#ff5a1f"
            ), lg=3, md=6, xs=12),
            dbc.Col(kpi_card(
                "Taxa de Conversão",
                f"{kpis['taxa_conversao']}%",
                f"+{kpis['conversao_delta']}% vs mês anterior",
                "#13d5a6"
            ), lg=3, md=6, xs=12),
            dbc.Col(kpi_card(
                "Ticket Médio",
                f"R$ {kpis['ticket_medio']:,.0f}".replace(",", "."),
                f"{kpis['ticket_delta']}% vs mês anterior",
                "#ff6b6b" if kpis["ticket_delta"] < 0 else "#13d5a6"
            ), lg=3, md=6, xs=12),
        ], className="kpi-row"),

        # Second KPI Row
        dbc.Row([
            dbc.Col(kpi_card(
                "CAC",
                f"R$ {kpis['cac']}",
                f"{kpis['cac_delta']}% vs mês anterior",
                "#13d5a6" if kpis["cac_delta"] < 0 else "#ff6b6b"
            ), lg=3, md=6, xs=12),
            dbc.Col(kpi_card(
                "LTV",
                f"R$ {kpis['ltv']:,.0f}".replace(",", "."),
                f"+{kpis['ltv_delta']}% vs mês anterior",
                "#13d5a6"
            ), lg=3, md=6, xs=12),
            dbc.Col(kpi_card(
                "Churn",
                f"{kpis['churn']}%",
                f"{kpis['churn_delta']}% vs mês anterior",
                "#13d5a6" if kpis["churn_delta"] < 0 else "#ff6b6b"
            ), lg=3, md=6, xs=12),
            dbc.Col(kpi_card(
                "NPS",
                str(kpis["nps"]),
                f"+{kpis['nps_delta']} pontos",
                "#13d5a6"
            ), lg=3, md=6, xs=12),
        ], className="kpi-row"),

        # Charts
        html.Div([
            html.Div([
                html.Div([
                    html.Span("Financeiro", className="eyebrow"),
                    html.H3("Receita vs Despesas"),
                ], className="chart-header"),
                html.Img(id="chart-revenue", className="chart-img"),
            ], className="chart-panel"),

            html.Div([
                html.Div([
                    html.Span("Aquisição", className="eyebrow"),
                    html.H3("Leads por Canal"),
                ], className="chart-header"),
                html.Img(id="chart-leads", className="chart-img"),
            ], className="chart-panel"),
        ], className="charts-row"),

        html.Div([
            html.Div([
                html.Div([
                    html.Span("Vendas", className="eyebrow"),
                    html.H3("Funil de Conversão"),
                ], className="chart-header"),
                html.Img(id="chart-funnel", className="chart-img"),
            ], className="chart-panel"),

            html.Div([
                html.Div([
                    html.Span("Redes Sociais", className="eyebrow"),
                    html.H3("Tendências Sociais"),
                ], className="chart-header"),
                html.Img(id="chart-social", className="chart-img"),
            ], className="chart-panel"),
        ], className="charts-row"),

        # Channel Performance (full width)
        html.Div([
            html.Div([
                html.Span("Desempenho", className="eyebrow"),
                html.H3("Análise por Canal"),
            ], className="chart-header"),
            html.Img(id="chart-channels", className="chart-img"),
        ], className="chart-panel chart-full"),

        # Footer
        html.Div([
            html.P("DIRECT Analytics — Gerado com Dash + Matplotlib", className="footer-text"),
        ], className="page-footer"),

    ], className="dashboard-container")
