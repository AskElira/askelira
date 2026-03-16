"""
Polymarket public data client — no API key required.

Uses the Gamma API (https://gamma-api.polymarket.com) which provides
real-time market data including YES prices, liquidity, and volume.

Key methods:
  get_top_markets(limit)    → top markets sorted by liquidity
  get_market(condition_id)  → single market by condition ID
  find_market(query)        → keyword search over active markets
  build_market_context(m)   → rich seed text block for MiroFish

Usage:
    from polymarket_client import polymarket
    top = polymarket.get_top_markets(limit=50)
    hits = polymarket.find_market("Federal Reserve rate decision")
"""

from __future__ import annotations

import logging
from typing import Any

import requests

log = logging.getLogger("polymarket")

GAMMA_BASE = "https://gamma-api.polymarket.com"

# Category keywords to deprioritize (sports/gaming noise)
_SPORTS_KEYWORDS = {
    "nba", "nfl", "nhl", "mlb", "soccer", "tennis", "cricket", "rugby",
    "esports", "cs2", "dota", "league of legends", "valorant", "formula",
    "mma", "ufc", "boxing", "golf", "basketball", "football", "baseball",
    "hockey", "match", "game 1", "game 2", "set 1", "set 2", "kills",
    "over/under", "spread", "moneyline",
}


def _is_macro(question: str) -> bool:
    """True if the market question looks like a macro/political/news market."""
    q = question.lower()
    return not any(kw in q for kw in _SPORTS_KEYWORDS)


class PolymarketClient:
    """Public Polymarket Gamma API client — no authentication required."""

    def __init__(self, timeout: int = 15):
        self._session = requests.Session()
        self._session.headers.update({"Accept": "application/json"})
        self._timeout = timeout

    def _get(self, path: str, params: dict | None = None) -> Any:
        url = GAMMA_BASE + path
        try:
            r = self._session.get(url, params=params, timeout=self._timeout)
            r.raise_for_status()
            return r.json()
        except requests.exceptions.HTTPError as e:
            raise RuntimeError(f"Polymarket HTTP {r.status_code} on {path}: {r.text[:200]}") from e
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Polymarket request failed: {e}") from e

    def _normalize(self, m: dict) -> dict:
        """Normalize a Gamma API market dict to our standard format."""
        # outcomePrices: ["0.62", "0.38"] — index 0 is YES price
        prices = m.get("outcomePrices", ["0", "1"])
        try:
            yes_price = float(prices[0]) if prices else 0.0
        except (ValueError, TypeError):
            yes_price = 0.0

        # Liquidity and volume
        liquidity = float(m.get("liquidityNum") or m.get("liquidity") or 0)
        volume = float(m.get("volumeNum") or m.get("volume") or 0)
        volume_24h = float(m.get("volume24hr") or 0)

        end_date = m.get("endDate", m.get("endDateIso", ""))
        resolution_date = end_date[:10] if end_date else ""

        return {
            "condition_id": m.get("conditionId", ""),
            "question": m.get("question", ""),
            "description": m.get("description", "")[:400],
            "yes_price": round(yes_price, 4),
            "no_price": round(1 - yes_price, 4),
            "liquidity_usd": round(liquidity, 2),
            "volume_usd": round(volume, 2),
            "volume_24h_usd": round(volume_24h, 2),
            "resolution_date": resolution_date,
            "end_date": end_date,
            "active": m.get("active", True),
            "closed": m.get("closed", False),
            "tags": [t.get("label", "") for t in m.get("tags", [])],
            "platform": "Polymarket",
        }

    def get_top_markets(
        self,
        limit: int = 50,
        macro_only: bool = True,
    ) -> list[dict]:
        """
        Fetch top active markets sorted by liquidity (descending).
        If macro_only=True, filters out sports/gaming noise.
        """
        data = self._get(
            "/markets",
            params={
                "active": "true",
                "closed": "false",
                "limit": min(limit * 3 if macro_only else limit, 500),
                "order": "liquidityNum",
                "ascending": "false",
            },
        )
        markets = [self._normalize(m) for m in (data if isinstance(data, list) else [])]
        if macro_only:
            markets = [m for m in markets if _is_macro(m["question"])]
        return markets[:limit]

    def get_market(self, condition_id: str) -> dict:
        """Fetch a single Polymarket market by condition ID."""
        data = self._get(f"/markets/{condition_id}")
        if isinstance(data, list) and data:
            return self._normalize(data[0])
        if isinstance(data, dict):
            return self._normalize(data)
        raise RuntimeError(f"Unexpected Polymarket response for {condition_id}")

    def find_market(self, query: str, limit: int = 100, macro_only: bool = True) -> list[dict]:
        """
        Keyword search over active Polymarket markets.
        Returns matches ranked by keyword overlap then liquidity.
        """
        keywords = set(query.lower().split())
        all_markets = self.get_top_markets(limit=limit, macro_only=macro_only)
        scored = []
        for m in all_markets:
            text = (m["question"] + " " + m["description"]).lower()
            overlap = sum(1 for kw in keywords if kw in text)
            if overlap > 0:
                scored.append((overlap, m["liquidity_usd"], m))
        scored.sort(key=lambda x: (-x[0], -x[1]))
        return [m for _, _, m in scored]

    def build_market_context(self, market: dict) -> str:
        """
        Build a rich text block for a Polymarket market to include in MiroFish seed files.
        """
        return (
            f"--- POLYMARKET LIVE MARKET DATA ---\n"
            f"Question:      {market['question']}\n"
            f"YES Price:     {market['yes_price']:.0%}  (NO={market['no_price']:.0%})\n"
            f"Liquidity:     ${market['liquidity_usd']:,.0f}\n"
            f"24h Volume:    ${market['volume_24h_usd']:,.0f}\n"
            f"Total Volume:  ${market['volume_usd']:,.0f}\n"
            f"Resolves:      {market['resolution_date']}\n"
            f"Description:   {market['description'][:250]}\n"
            f"--- END POLYMARKET LIVE DATA ---"
        )

    def top_markets_context(self, limit: int = 20) -> str:
        """
        Build a summary of top markets for Alba's scan_markets prompt injection.
        """
        markets = self.get_top_markets(limit=limit, macro_only=True)
        if not markets:
            return ""
        lines = [f"LIVE POLYMARKET MARKETS (top {len(markets)} by liquidity):"]
        for m in markets:
            lines.append(
                f"  {m['question'][:70]} | "
                f"YES={m['yes_price']:.0%} | "
                f"liq=${m['liquidity_usd']:,.0f} | "
                f"closes {m['resolution_date']}"
            )
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
try:
    polymarket = PolymarketClient()
except Exception as _e:
    log.warning(f"[Polymarket] Client init failed: {_e}")
    polymarket = None  # type: ignore
