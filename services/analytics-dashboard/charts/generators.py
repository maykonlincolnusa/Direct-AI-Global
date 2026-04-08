"""
Matplotlib chart generators.
Each function returns a Matplotlib figure that can be converted to base64
or served as an image endpoint.
"""

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np
import pandas as pd
import io
import base64
from data.mock_data import (
    get_revenue_data,
    get_leads_data,
    get_conversion_funnel,
    get_channel_performance,
    get_social_metrics,
)

# ── Style ──────────────────────────────────────────────────────────────
DARK_BG = "#07101f"
SURFACE = "#0c1828"
TEXT = "#ebf2ff"
MUTED = "#93a9cb"
DIM = "#5d7498"
ORANGE = "#ff5a1f"
TEAL = "#13d5a6"
BLUE = "#5aa7ff"
GOLD = "#f0c14b"
VIOLET = "#8b7cff"
GRID = "rgba(64, 93, 132, 0.24)"

COLORS = [ORANGE, TEAL, BLUE, GOLD, VIOLET, "#ff6b9d"]


def _apply_style(fig, ax):
    """Apply the DIRECT dark theme to a matplotlib figure."""
    fig.patch.set_facecolor(DARK_BG)
    ax.set_facecolor(SURFACE)
    ax.tick_params(colors=MUTED, labelsize=9)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(DIM)
    ax.spines["bottom"].set_color(DIM)
    ax.xaxis.label.set_color(MUTED)
    ax.yaxis.label.set_color(MUTED)
    ax.title.set_color(TEXT)
    ax.grid(True, alpha=0.15, color=MUTED)


def fig_to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    plt.close(fig)
    return f"data:image/png;base64,{encoded}"


def revenue_chart() -> str:
    df = get_revenue_data()
    fig, ax = plt.subplots(figsize=(10, 4.5))
    _apply_style(fig, ax)

    months = df["mes"].dt.strftime("%b")
    x = np.arange(len(months))

    ax.fill_between(x, df["receita"], alpha=0.25, color=TEAL)
    ax.plot(x, df["receita"], color=TEAL, linewidth=2.5, label="Receita")
    ax.fill_between(x, df["despesas"], alpha=0.18, color=ORANGE)
    ax.plot(x, df["despesas"], color=ORANGE, linewidth=2, label="Despesas")

    ax.set_xticks(x)
    ax.set_xticklabels(months)
    ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda v, _: f"R$ {v/1000:.0f}k"))
    ax.set_title("Receita vs Despesas", fontsize=14, fontweight="bold", pad=16)
    ax.legend(facecolor=SURFACE, edgecolor=DIM, labelcolor=TEXT, fontsize=9)

    return fig_to_base64(fig)


def leads_by_channel_chart() -> str:
    df = get_leads_data()
    fig, ax = plt.subplots(figsize=(10, 4.5))
    _apply_style(fig, ax)

    days = df["data"].dt.strftime("%d/%m")
    x = np.arange(len(days))
    width = 0.6

    bottom = np.zeros(len(days))
    channels = ["instagram", "whatsapp", "website", "indicacao"]
    labels = ["Instagram", "WhatsApp", "Website", "Indicação"]
    colors = [ORANGE, TEAL, BLUE, GOLD]

    for ch, label, color in zip(channels, labels, colors):
        ax.bar(x, df[ch], width, bottom=bottom, color=color, label=label, alpha=0.85)
        bottom += df[ch].values

    ax.set_xticks(x[::5])
    ax.set_xticklabels(days[::5])
    ax.set_title("Leads por Canal — Últimos 30 dias", fontsize=14, fontweight="bold", pad=16)
    ax.legend(facecolor=SURFACE, edgecolor=DIM, labelcolor=TEXT, fontsize=9, loc="upper left")

    return fig_to_base64(fig)


def conversion_funnel_chart() -> str:
    df = get_conversion_funnel()
    fig, ax = plt.subplots(figsize=(8, 5))
    _apply_style(fig, ax)

    y = np.arange(len(df))
    bars = ax.barh(y, df["quantidade"], color=COLORS[:len(df)], height=0.6, alpha=0.88)

    ax.set_yticks(y)
    ax.set_yticklabels(df["etapa"], fontsize=11)
    ax.invert_yaxis()
    ax.set_title("Funil de Conversão", fontsize=14, fontweight="bold", pad=16)

    for bar, taxa in zip(bars, df["taxa"]):
        width = bar.get_width()
        ax.text(width + 40, bar.get_y() + bar.get_height() / 2,
                f"{int(width):,}  ({taxa})", va="center", color=TEXT, fontsize=10)

    ax.set_xlim(0, df["quantidade"].max() * 1.35)

    return fig_to_base64(fig)


def channel_performance_chart() -> str:
    df = get_channel_performance()
    fig, axes = plt.subplots(1, 3, figsize=(14, 4.5))
    fig.patch.set_facecolor(DARK_BG)

    metrics = [
        ("leads", "Leads por Canal", ORANGE),
        ("conversoes", "Conversões", TEAL),
        ("cac", "CAC (R$)", BLUE),
    ]

    for ax, (col, title, color) in zip(axes, metrics):
        _apply_style(fig, ax)
        y = np.arange(len(df))
        ax.barh(y, df[col], color=color, height=0.55, alpha=0.85)
        ax.set_yticks(y)
        ax.set_yticklabels(df["canal"], fontsize=9)
        ax.invert_yaxis()
        ax.set_title(title, fontsize=12, fontweight="bold", pad=12, color=TEXT)

        for i, v in enumerate(df[col]):
            ax.text(v + df[col].max() * 0.03, i, str(v), va="center", color=TEXT, fontsize=9)
        ax.set_xlim(0, df[col].max() * 1.25)

    fig.tight_layout(pad=3)
    return fig_to_base64(fig)


def social_trends_chart() -> str:
    df = get_social_metrics()
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.5))
    fig.patch.set_facecolor(DARK_BG)

    x = np.arange(len(df))

    # Followers growth
    _apply_style(fig, ax1)
    ax1.fill_between(x, df["instagram_seguidores"], alpha=0.2, color=ORANGE)
    ax1.plot(x, df["instagram_seguidores"], color=ORANGE, linewidth=2.5)
    ax1.set_xticks(x[::2])
    ax1.set_xticklabels(df["semana"][::2])
    ax1.set_title("Seguidores Instagram", fontsize=12, fontweight="bold", pad=12, color=TEXT)

    # Engagement rate
    _apply_style(fig, ax2)
    ax2.bar(x, df["instagram_engajamento"], color=TEAL, alpha=0.8, width=0.6)
    ax2.set_xticks(x[::2])
    ax2.set_xticklabels(df["semana"][::2])
    ax2.set_title("Taxa de Engajamento (%)", fontsize=12, fontweight="bold", pad=12, color=TEXT)
    ax2.yaxis.set_major_formatter(mticker.FuncFormatter(lambda v, _: f"{v:.1f}%"))

    fig.tight_layout(pad=3)
    return fig_to_base64(fig)
