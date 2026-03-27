"""ASCII chart rendering for oav-cli metrics commands."""

from typing import Any

try:
    import asciichartpy as _acp

    def _plot(series: list[float], cfg: dict) -> str:  # type: ignore[return]
        return _acp.plot(series, cfg)

except ImportError:
    def _plot(series: list[float], cfg: dict) -> str:
        """Fallback when asciichartpy is not installed."""
        if not series:
            return "(no data)"
        max_v = max(series)
        min_v = min(series)
        rows: list[str] = []
        height = cfg.get("height", 8)
        for row_idx in range(height, 0, -1):
            threshold = min_v + (max_v - min_v) * (row_idx / height)
            line = "".join("*" if v >= threshold else " " for v in series)
            rows.append(f"|{line}")
        rows.append("+" + "-" * len(series))
        return "\n".join(rows)


def token_chart(hourly_tokens: list[float], title: str = "Token Usage (24h)") -> str:
    """Render an ASCII line chart of hourly token usage.

    Args:
        hourly_tokens: List of token counts per hour (oldest first).
        title: Chart title printed above the chart.

    Returns:
        Multi-line string suitable for printing to a terminal.
    """
    if not hourly_tokens:
        return f"{title}\n(no data)"

    chart = _plot(
        hourly_tokens,
        {"height": 8, "format": "{:8,.0f}"},
    )
    return f"{title}\n{chart}"


def cost_chart(hourly_costs: list[float], title: str = "Cost USD (24h)") -> str:
    """Render an ASCII line chart of hourly cost in USD."""
    if not hourly_costs:
        return f"{title}\n(no data)"

    chart = _plot(
        hourly_costs,
        {"height": 8, "format": "{:8.4f}"},
    )
    return f"{title}\n{chart}"


def xp_chart(hourly_xp: list[float], title: str = "XP Gained (24h)") -> str:
    """Render an ASCII line chart of XP gains per hour."""
    if not hourly_xp:
        return f"{title}\n(no data)"

    chart = _plot(
        hourly_xp,
        {"height": 6, "format": "{:8,.0f}"},
    )
    return f"{title}\n{chart}"
