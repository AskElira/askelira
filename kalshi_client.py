"""
Kalshi API v2 client — RSA-authenticated REST wrapper.

Authentication: PKCS1v15 RSA-SHA256 signature over (timestamp + METHOD + path).

Key endpoints used by the agent pipeline:
  get_active_markets()  → live Kalshi binary markets for Alba's scan
  get_market(ticker)    → real bid/ask/volume for a specific market
  get_orderbook(ticker) → orderbook depth for seed enrichment
  get_balance()         → account balance for Steven's sizing check
  get_positions()       → open positions for reconciliation
  place_order(...)      → submit a trade (Steven, step 8)
  find_market(query)    → fuzzy-search active markets by keyword

Usage:
    from kalshi_client import KalshiClient, KalshiError
    k = KalshiClient()
    markets = k.get_active_markets(limit=100)
    m = k.get_market("FOMC-23DEC-B450")
"""

from __future__ import annotations

import base64
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

log = logging.getLogger("kalshi")

BASE_URL = "https://api.elections.kalshi.com/trade-api/v2"
DEMO_URL = "https://demo-api.kalshi.co/trade-api/v2"


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------
class KalshiError(Exception):
    pass


class KalshiAuthError(KalshiError):
    pass


# ---------------------------------------------------------------------------
# RSA signer (loaded once at init)
# ---------------------------------------------------------------------------
def _load_private_key(path: str):
    """Load RSA private key from PEM file. Returns None on failure."""
    try:
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend

        pem_path = Path(path)
        if not pem_path.exists():
            log.error(f"[Kalshi] Private key file not found: {pem_path}")
            return None

        with open(pem_path, "rb") as f:
            key_data = f.read()

        private_key = serialization.load_pem_private_key(
            key_data, password=None, backend=default_backend()
        )
        log.info("[Kalshi] Private key loaded successfully.")
        return private_key

    except Exception as e:
        log.error(f"[Kalshi] Failed to load private key: {e}")
        return None


def _sign(private_key, timestamp_ms: str, method: str, path: str) -> str:
    """PKCS1v15 RSA-SHA256 signature over timestamp + METHOD + path."""
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding

    msg = (timestamp_ms + method.upper() + path).encode("utf-8")
    sig = private_key.sign(msg, padding.PKCS1v15(), hashes.SHA256())
    return base64.b64encode(sig).decode("utf-8")


# ---------------------------------------------------------------------------
# KalshiClient
# ---------------------------------------------------------------------------
class KalshiClient:
    """
    Kalshi API v2 client.

    Credentials are loaded from env vars:
      KALSHI_API_KEY_ID         — key ID (UUID)
      KALSHI_PRIVATE_KEY_PATH   — path to .pem file (default ./kalshi_private_key.pem)
    """

    def __init__(
        self,
        api_key_id: str | None = None,
        private_key_path: str | None = None,
        demo: bool = False,
    ):
        self.api_key_id = api_key_id or os.getenv("KALSHI_API_KEY_ID", "")
        key_path = private_key_path or os.getenv(
            "KALSHI_PRIVATE_KEY_PATH", "./kalshi_private_key.pem"
        )
        self.base = DEMO_URL if demo else BASE_URL
        self._private_key = _load_private_key(key_path)
        self._session = requests.Session()
        self._session.headers.update({"Content-Type": "application/json"})

    # ------------------------------------------------------------------
    # Auth headers
    # ------------------------------------------------------------------
    def _auth_headers(self, method: str, path: str) -> dict:
        """Build Kalshi auth headers for a signed request."""
        if not self._private_key:
            raise KalshiAuthError(
                "Private key not loaded. Check KALSHI_PRIVATE_KEY_PATH and the key file."
            )
        if not self.api_key_id:
            raise KalshiAuthError("KALSHI_API_KEY_ID not set.")

        ts = str(int(time.time() * 1000))
        sig = _sign(self._private_key, ts, method, path)
        return {
            "KALSHI-ACCESS-KEY": self.api_key_id,
            "KALSHI-ACCESS-TIMESTAMP": ts,
            "KALSHI-ACCESS-SIGNATURE": sig,
        }

    def _path(self, endpoint: str) -> str:
        """Return the path portion of the endpoint (e.g. /trade-api/v2/markets)."""
        return f"/trade-api/v2{endpoint}"

    # ------------------------------------------------------------------
    # HTTP helpers
    # ------------------------------------------------------------------
    # Public endpoints (no auth required)
    _PUBLIC = {"/markets", "/series", "/exchange/status"}

    def _is_public(self, endpoint: str) -> bool:
        return any(endpoint.startswith(p) for p in self._PUBLIC)

    def _get(self, endpoint: str, params: dict | None = None) -> dict:
        path = self._path(endpoint)
        url = self.base + endpoint
        headers = {} if self._is_public(endpoint) else self._auth_headers("GET", path)
        try:
            r = self._session.get(url, headers=headers, params=params, timeout=15)
            r.raise_for_status()
            return r.json()
        except requests.exceptions.HTTPError as e:
            raise KalshiError(
                f"HTTP {r.status_code} on GET {endpoint}: {r.text[:300]}"
            ) from e
        except requests.exceptions.RequestException as e:
            raise KalshiError(f"Request failed on GET {endpoint}: {e}") from e

    def _post(self, endpoint: str, body: dict) -> dict:
        path = self._path(endpoint)
        url = self.base + endpoint
        headers = self._auth_headers("POST", path)
        try:
            r = self._session.post(url, headers=headers, json=body, timeout=15)
            r.raise_for_status()
            return r.json()
        except requests.exceptions.HTTPError as e:
            raise KalshiError(
                f"HTTP {r.status_code} on POST {endpoint}: {r.text[:300]}"
            ) from e
        except requests.exceptions.RequestException as e:
            raise KalshiError(f"Request failed on POST {endpoint}: {e}") from e

    # ------------------------------------------------------------------
    # Markets
    # ------------------------------------------------------------------
    # Known macro/political series on the Kalshi elections API
    MACRO_SERIES = [
        "KXFED",        # Federal Reserve rate decisions
        "KXCPI",        # CPI / inflation reports
        "KXGDP",        # GDP reports
        "KXNFP",        # Non-farm payrolls / jobs
        "KXRECESSION",  # Recession probability
        "KXTRUMP",      # Trump presidency events
        "KXHOUSE",      # House of Representatives
        "KXSENATE",     # Senate
        "KXELECTION",   # General elections
    ]

    def _parse_market(self, m: dict) -> dict:
        """Normalize a raw Kalshi market dict to our standard format."""
        # Kalshi elections API uses *_dollars fields (0.0–1.0 scale)
        last_price = float(m.get("last_price_dollars") or 0)
        prev_yes_ask = float(m.get("previous_yes_ask_dollars") or 0)
        yes_price = last_price or prev_yes_ask  # best available mid

        # Volume: open_interest_fp is number of contracts; liquidity_dollars is USD
        oi = float(m.get("open_interest_fp") or 0)
        liq = float(m.get("liquidity_dollars") or 0)
        volume_usd = liq if liq > 0 else oi  # prefer liquidity, fallback to OI

        close_time = m.get("close_time", "")
        return {
            "ticker": m.get("ticker", ""),
            "title": m.get("title", ""),
            "subtitle": m.get("subtitle", ""),
            "yes_price": round(yes_price, 4),
            "last_price_dollars": last_price,
            "no_bid_dollars": float(m.get("no_bid_dollars") or 0),
            "no_ask_dollars": float(m.get("no_ask_dollars") or 0),
            "volume": volume_usd,
            "liquidity_usd": round(volume_usd, 2),
            "open_interest": oi,
            "close_time": close_time,
            "resolution_date": close_time[:10] if close_time else "",
            "rules_primary": m.get("rules_primary", ""),
            "category": m.get("category", ""),
            "series_ticker": m.get("series_ticker", ""),
            "event_ticker": m.get("event_ticker", ""),
            "platform": "Kalshi",
        }

    def get_active_markets(
        self,
        limit: int = 200,
        series_ticker: str | None = None,
        cursor: str | None = None,
    ) -> list[dict]:
        """
        Fetch open binary markets from known macro/political series.
        Falls back to general market list if series_ticker is specified.
        Returns normalized list sorted by open interest descending.
        """
        if series_ticker:
            # Single series fetch
            params: dict[str, Any] = {"series_ticker": series_ticker, "status": "open", "limit": min(limit, 1000)}
            if cursor:
                params["cursor"] = cursor
            data = self._get("/markets", params=params)
            return [self._parse_market(m) for m in data.get("markets", [])]

        # Aggregate across all known macro series
        all_markets: list[dict] = []
        for series in self.MACRO_SERIES:
            try:
                params = {"series_ticker": series, "status": "open", "limit": 50}
                data = self._get("/markets", params=params)
                for m in data.get("markets", []):
                    all_markets.append(self._parse_market(m))
            except KalshiError:
                pass

        all_markets.sort(key=lambda x: x["open_interest"], reverse=True)
        return all_markets[:limit]

    def get_market(self, ticker: str) -> dict:
        """Fetch a single market by ticker. Returns normalized dict."""
        data = self._get(f"/markets/{ticker}")
        m = data.get("market", data)
        return self._parse_market(m)

    def get_orderbook(self, ticker: str, depth: int = 10) -> dict:
        """
        Fetch YES/NO orderbook for a market.
        Returns {"yes": [[price_cents, size], ...], "no": [[price_cents, size], ...]}
        """
        data = self._get(f"/markets/{ticker}/orderbook", params={"depth": depth})
        ob = data.get("orderbook", {})
        return {
            "yes": ob.get("yes", []),
            "no":  ob.get("no",  []),
        }

    def find_market(self, query: str, limit: int = 200) -> list[dict]:
        """
        Fuzzy-search open markets whose title contains query keywords.
        Returns ranked list (by volume) of matching markets.
        """
        keywords = set(query.lower().split())
        markets = self.get_active_markets(limit=limit)
        scored = []
        for m in markets:
            title_words = set(m["title"].lower().split())
            subtitle_words = set(m.get("subtitle", "").lower().split())
            overlap = len(keywords & (title_words | subtitle_words))
            if overlap > 0:
                scored.append((overlap, m))
        scored.sort(key=lambda x: (-x[0], -x[1]["volume"]))
        return [m for _, m in scored]

    def get_series(self, series_ticker: str) -> dict:
        """Fetch a market series (e.g. 'FOMC', 'CPI') and its markets."""
        data = self._get(f"/series/{series_ticker}")
        return data.get("series", data)

    # ------------------------------------------------------------------
    # Account
    # ------------------------------------------------------------------
    def get_balance(self) -> dict:
        """Return portfolio balance. Keys: balance (cents), payout_balance."""
        data = self._get("/portfolio/balance")
        balance_cents = data.get("balance", 0) or 0
        return {
            "balance_cents": balance_cents,
            "balance_usd": round(balance_cents / 100, 2),
            "payout_balance_cents": data.get("payout_balance", 0),
        }

    def get_positions(self, status: str = "open") -> list[dict]:
        """
        Fetch portfolio positions.
        status: 'open' | 'settled' | 'all'
        Returns list of position dicts.
        """
        data = self._get("/portfolio/positions", params={"status": status})
        positions = data.get("market_positions", [])
        result = []
        for p in positions:
            result.append({
                "ticker": p.get("ticker", ""),
                "side": p.get("side", ""),          # "yes" | "no"
                "quantity": p.get("quantity", 0),
                "avg_price_cents": p.get("avg_price", 0),
                "current_yes_bid": p.get("current_yes_bid", 0),
                "current_yes_ask": p.get("current_yes_ask", 0),
                "unrealized_pnl_cents": p.get("unrealized_pnl", 0),
                "status": p.get("status", ""),
            })
        return result

    # ------------------------------------------------------------------
    # Orders
    # ------------------------------------------------------------------
    def place_order(
        self,
        ticker: str,
        side: str,              # "yes" | "no"
        action: str,            # "buy"
        count: int,             # number of contracts
        yes_price_cents: int,   # limit price in cents (1-99)
        order_type: str = "limit",
        client_order_id: str = "",
    ) -> dict:
        """
        Place a limit order on Kalshi.

        Args:
            ticker:            Market ticker (e.g. 'FOMC-23DEC-B450')
            side:              'yes' or 'no'
            action:            'buy' (always buy — sell is handled by closing positions)
            count:             Number of contracts (min 1)
            yes_price_cents:   Limit price in cents for YES (1-99)
            order_type:        'limit' (default) or 'market'
            client_order_id:   Optional idempotency key

        Returns:
            Order dict from Kalshi.
        """
        if side not in ("yes", "no"):
            raise ValueError(f"side must be 'yes' or 'no', got: {side!r}")
        if not (1 <= yes_price_cents <= 99):
            raise ValueError(f"yes_price_cents must be 1-99, got: {yes_price_cents}")

        body: dict[str, Any] = {
            "ticker": ticker,
            "action": action,
            "side": side,
            "count": count,
            "type": order_type,
            "yes_price": yes_price_cents,
        }
        if client_order_id:
            body["client_order_id"] = client_order_id

        data = self._post("/portfolio/orders", body)
        return data.get("order", data)

    def cancel_order(self, order_id: str) -> dict:
        """Cancel an open order."""
        path = self._path(f"/portfolio/orders/{order_id}/cancel")
        url = self.base + f"/portfolio/orders/{order_id}/cancel"
        headers = self._auth_headers("DELETE", path)
        r = self._session.delete(url, headers=headers, timeout=15)
        r.raise_for_status()
        return r.json()

    def get_orders(self, status: str = "resting") -> list[dict]:
        """Fetch open orders. status: 'resting' | 'executed' | 'canceled'"""
        data = self._get("/portfolio/orders", params={"status": status})
        return data.get("orders", [])

    # ------------------------------------------------------------------
    # Seed enrichment helper — used by Alba
    # ------------------------------------------------------------------
    def build_market_context(self, ticker: str) -> str:
        """
        Build a rich text block for a Kalshi market to include in MiroFish seed files.
        """
        try:
            m = self.get_market(ticker)
        except KalshiError as e:
            return f"[Kalshi live data unavailable: {e}]"

        try:
            ob = self.get_orderbook(ticker, depth=5)
            yes_book = ob.get("yes", [])
            no_book = ob.get("no", [])
            ob_text = (
                f"Orderbook YES side (top 5): {yes_book[:5]}\n"
                f"Orderbook NO side (top 5): {no_book[:5]}"
            )
        except KalshiError:
            ob_text = "Orderbook data unavailable."

        yes_price = m["yes_price"]
        no_bid = m.get("no_bid_dollars", 0)
        # Implied YES ask from no_bid: if no_bid = 0.39, then YES ask ≈ 1 - 0.39 = 0.61
        yes_ask_implied = round(1 - no_bid, 4) if no_bid else "N/A"

        return (
            f"--- KALSHI LIVE MARKET DATA ---\n"
            f"Ticker:          {m['ticker']}\n"
            f"Title:           {m['title']}\n"
            f"YES Last Price:  {yes_price:.0%}  (implied ask {yes_ask_implied})\n"
            f"Open Interest:   {m['open_interest']:,.0f} contracts\n"
            f"Liquidity USD:   ${m['liquidity_usd']:,.2f}\n"
            f"Closes:          {m['resolution_date']}\n"
            f"Rules:           {m['rules_primary'][:300]}\n"
            f"{ob_text}\n"
            f"--- END KALSHI LIVE DATA ---"
        )


# ---------------------------------------------------------------------------
# Singleton — only creates when credentials are present
# ---------------------------------------------------------------------------
try:
    kalshi = KalshiClient()
except Exception as _e:
    log.warning(f"[Kalshi] Client init failed: {_e}")
    kalshi = None  # type: ignore
