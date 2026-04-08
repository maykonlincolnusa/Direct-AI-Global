"""
Mock data layer for the analytics dashboard.
Simulates business data that would come from MongoDB/API in production.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta


def get_revenue_data() -> pd.DataFrame:
    months = pd.date_range(start="2025-07-01", periods=12, freq="MS")
    np.random.seed(42)
    base_revenue = 52000
    growth = np.cumsum(np.random.uniform(2000, 8000, size=12))
    revenue = base_revenue + growth
    expenses = revenue * np.random.uniform(0.55, 0.68, size=12)

    return pd.DataFrame({
        "mes": months,
        "receita": np.round(revenue, 2),
        "despesas": np.round(expenses, 2),
        "lucro": np.round(revenue - expenses, 2)
    })


def get_leads_data() -> pd.DataFrame:
    days = pd.date_range(end=datetime.now(), periods=30, freq="D")
    np.random.seed(7)
    return pd.DataFrame({
        "data": days,
        "instagram": np.random.randint(3, 18, size=30),
        "whatsapp": np.random.randint(5, 22, size=30),
        "website": np.random.randint(2, 12, size=30),
        "indicacao": np.random.randint(0, 6, size=30),
    })


def get_conversion_funnel() -> pd.DataFrame:
    return pd.DataFrame({
        "etapa": ["Visitantes", "Leads", "Qualificados", "Propostas", "Fechados"],
        "quantidade": [4200, 680, 210, 87, 34],
        "taxa": ["100%", "16.2%", "30.9%", "41.4%", "39.1%"]
    })


def get_channel_performance() -> pd.DataFrame:
    return pd.DataFrame({
        "canal": ["Instagram", "WhatsApp", "Website", "Google Ads", "Indicação", "E-mail"],
        "leads": [312, 245, 127, 89, 64, 43],
        "conversoes": [28, 31, 12, 8, 14, 5],
        "receita": [84200, 93500, 38400, 22100, 41800, 12600],
        "cac": [45, 12, 68, 120, 8, 32]
    })


def get_kpis() -> dict:
    return {
        "receita_mensal": 84200,
        "receita_delta": 8.3,
        "leads_mes": 127,
        "leads_delta": 23,
        "taxa_conversao": 26.7,
        "conversao_delta": 2.1,
        "ticket_medio": 2476,
        "ticket_delta": -3.4,
        "cac": 42,
        "cac_delta": -15.2,
        "ltv": 8940,
        "ltv_delta": 5.7,
        "churn": 3.2,
        "churn_delta": -0.8,
        "nps": 72,
        "nps_delta": 4
    }


def get_recent_activity() -> list[dict]:
    now = datetime.now()
    return [
        {"tipo": "Novo lead", "detalhe": "Maria Silva — via Instagram", "tempo": now - timedelta(minutes=12)},
        {"tipo": "Pagamento", "detalhe": "Fatura #1042 — R$ 3.200", "tempo": now - timedelta(minutes=28)},
        {"tipo": "Arquivo", "detalhe": "Relatório Q1 2026.pdf", "tempo": now - timedelta(hours=1)},
        {"tipo": "Menção", "detalhe": "@direct_ia no Twitter", "tempo": now - timedelta(hours=2)},
        {"tipo": "Novo lead", "detalhe": "João Ferreira — via WhatsApp", "tempo": now - timedelta(hours=3)},
        {"tipo": "Conversão", "detalhe": "Ana Costa — Plano Pro", "tempo": now - timedelta(hours=4)},
        {"tipo": "Pagamento", "detalhe": "Fatura #1041 — R$ 5.800", "tempo": now - timedelta(hours=5)},
    ]


def get_social_metrics() -> pd.DataFrame:
    weeks = [f"S{i}" for i in range(1, 13)]
    np.random.seed(21)
    return pd.DataFrame({
        "semana": weeks,
        "instagram_seguidores": np.cumsum(np.random.randint(40, 180, size=12)) + 4200,
        "instagram_engajamento": np.random.uniform(2.1, 5.8, size=12).round(1),
        "facebook_alcance": np.random.randint(800, 3200, size=12),
        "tiktok_views": np.random.randint(1200, 8500, size=12),
    })
