"""
Long-term vector memory for the Polymarket agent pipeline.

Uses Pinecone with integrated embeddings (multilingual-e5-large) so no
separate embedding model or API call is needed.

Index: polymarket-agent-memory
Namespaces:
  research      – seed research, market analyses, sourced articles
  simulations   – MiroFish simulation results and report summaries
  calibration   – post-resolution outcomes, lessons, P&L records
  agent-memory  – agent-level notes, decisions, and reasoning traces

Usage:
    from pinecone_memory import memory

    # Store a seed document
    memory.store_research("fed-rate-2026-03", "2026-03-14", seed_text,
                          tags=["fed", "rates", "macro"])

    # Recall similar past markets before a new scan
    hits = memory.recall_similar("Federal Reserve rate decision March 2026",
                                  namespace="research", top_k=5)

    # Log a simulation result
    memory.store_simulation("fed-rate-2026-03", "NO wins 62%", 0.62, "NO")

    # Log a calibration lesson after resolution
    memory.store_calibration("fed-rate-2026-03", "WIN", "+$48", 0.62,
                              "Macro consensus seed quality was high; FOMC minutes were decisive signal.")
"""

from __future__ import annotations

import hashlib
import json
import os
import time
from datetime import datetime
from typing import Any

from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
INDEX_NAME = "polymarket-agent-memory"
EMBED_MODEL = "multilingual-e5-large"

NAMESPACES = {
    "research": "research",
    "simulations": "simulations",
    "calibration": "calibration",
    "agent-memory": "agent-memory",
}


def _make_id(namespace: str, *parts: str) -> str:
    """Deterministic ID from namespace + content parts (avoids duplicates)."""
    raw = f"{namespace}:{'|'.join(parts)}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


# ---------------------------------------------------------------------------
# AgentMemory
# ---------------------------------------------------------------------------
class AgentMemory:
    """Pinecone-backed long-term memory for the Polymarket agent pipeline."""

    def __init__(self, api_key: str | None = None):
        api_key = api_key or os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise RuntimeError("PINECONE_API_KEY not set – check your .env file.")

        try:
            from pinecone import Pinecone
        except ImportError:
            raise ImportError(
                "pinecone package not installed. Run: pip install pinecone"
            )

        self.pc = Pinecone(api_key=api_key)
        self._ensure_index()
        self.index = self.pc.Index(INDEX_NAME)

    # ------------------------------------------------------------------
    # Index bootstrap
    # ------------------------------------------------------------------
    def _ensure_index(self) -> None:
        existing = [idx.name for idx in self.pc.list_indexes()]
        if INDEX_NAME not in existing:
            print(f"[pinecone_memory] Creating index '{INDEX_NAME}' …")
            self.pc.create_index_for_model(
                name=INDEX_NAME,
                cloud="aws",
                region="us-east-1",
                embed={
                    "model": EMBED_MODEL,
                    "field_map": {"text": "text"},
                },
            )
            # Wait for index to be ready
            for _ in range(30):
                time.sleep(5)
                desc = self.pc.describe_index(INDEX_NAME)
                if desc.status.get("ready"):
                    break
            print(f"[pinecone_memory] Index ready.")
        else:
            print(f"[pinecone_memory] Connected to existing index '{INDEX_NAME}'.")

    # ------------------------------------------------------------------
    # Low-level upsert / search
    # ------------------------------------------------------------------
    def _upsert(self, namespace: str, record_id: str, text: str, meta: dict) -> None:
        record = {"_id": record_id, "text": text, **meta}
        self.index.upsert_records(namespace=namespace, records=[record])

    def _search(
        self, namespace: str, query: str, top_k: int = 5, filters: dict | None = None
    ) -> list[dict]:
        params: dict[str, Any] = {
            "namespace": namespace,
            "query": {"inputs": {"text": query}, "top_k": top_k},
        }
        if filters:
            params["query"]["filter"] = filters
        result = self.index.search(**params)
        hits = []
        for match in result.get("result", {}).get("hits", []):
            fields = match.get("fields", {}) or {}
            hits.append(
                {
                    "id": match.get("_id"),
                    "score": match.get("_score"),
                    **fields,
                }
            )
        return hits

    # ------------------------------------------------------------------
    # Research namespace
    # ------------------------------------------------------------------
    def store_research(
        self,
        market_slug: str,
        date: str,
        content: str,
        tags: list[str] | None = None,
        source: str = "",
        agent: str = "Alba",
    ) -> str:
        """Store a seed document or research note."""
        record_id = _make_id("research", market_slug, date, content[:64])
        self._upsert(
            namespace=NAMESPACES["research"],
            record_id=record_id,
            text=content,
            meta={
                "market": market_slug,
                "date": date,
                "agent": agent,
                "source": source,
                "tags": json.dumps(tags or []),
                "type": "research",
            },
        )
        print(f"[pinecone_memory] Stored research for '{market_slug}' ({record_id[:8]}…)")
        return record_id

    def recall_research(
        self,
        query: str,
        top_k: int = 5,
        market_filter: str | None = None,
    ) -> list[dict]:
        """Semantic search over past research / seed documents."""
        filters = {"market": {"$eq": market_filter}} if market_filter else None
        return self._search(NAMESPACES["research"], query, top_k, filters)

    # ------------------------------------------------------------------
    # Simulations namespace
    # ------------------------------------------------------------------
    def store_simulation(
        self,
        market_slug: str,
        result_summary: str,
        confidence: float,
        direction: str,
        date: str | None = None,
        tier: str = "",
        simulation_id: str = "",
    ) -> str:
        """Store a MiroFish simulation result."""
        date = date or datetime.utcnow().strftime("%Y-%m-%d")
        text = (
            f"Market: {market_slug}\n"
            f"Date: {date}\n"
            f"Direction: {direction}\n"
            f"Confidence: {confidence:.0%}\n"
            f"Simulation ID: {simulation_id}\n"
            f"Summary: {result_summary}"
        )
        record_id = _make_id("simulations", market_slug, date, simulation_id or direction)
        self._upsert(
            namespace=NAMESPACES["simulations"],
            record_id=record_id,
            text=text,
            meta={
                "market": market_slug,
                "date": date,
                "confidence": str(confidence),
                "direction": direction,
                "tier": tier,
                "simulation_id": simulation_id,
                "type": "simulation",
            },
        )
        print(f"[pinecone_memory] Stored simulation for '{market_slug}' → {direction} @ {confidence:.0%}")
        return record_id

    def recall_simulations(self, query: str, top_k: int = 5) -> list[dict]:
        """Semantic search over past simulation results."""
        return self._search(NAMESPACES["simulations"], query, top_k)

    # ------------------------------------------------------------------
    # Calibration namespace
    # ------------------------------------------------------------------
    def store_calibration(
        self,
        market_slug: str,
        outcome: str,
        pnl: str,
        sim_confidence: float,
        lesson: str,
        date: str | None = None,
        tier: str = "",
        direction: str = "",
    ) -> str:
        """Store a post-resolution calibration record."""
        date = date or datetime.utcnow().strftime("%Y-%m-%d")
        text = (
            f"Market: {market_slug}\n"
            f"Date: {date}\n"
            f"Outcome: {outcome}\n"
            f"Sim confidence: {sim_confidence:.0%}\n"
            f"Direction: {direction}\n"
            f"P&L: {pnl}\n"
            f"Lesson: {lesson}"
        )
        record_id = _make_id("calibration", market_slug, date, outcome)
        self._upsert(
            namespace=NAMESPACES["calibration"],
            record_id=record_id,
            text=text,
            meta={
                "market": market_slug,
                "date": date,
                "outcome": outcome,
                "pnl": pnl,
                "confidence": str(sim_confidence),
                "direction": direction,
                "tier": tier,
                "lesson": lesson,
                "type": "calibration",
            },
        )
        print(f"[pinecone_memory] Stored calibration: {market_slug} → {outcome} ({pnl})")
        return record_id

    def recall_calibration(self, query: str, top_k: int = 5) -> list[dict]:
        """Semantic search over past calibration records."""
        return self._search(NAMESPACES["calibration"], query, top_k)

    # ------------------------------------------------------------------
    # Agent-memory namespace
    # ------------------------------------------------------------------
    def store_agent_note(
        self,
        agent: str,
        note: str,
        market_slug: str = "",
        date: str | None = None,
        note_type: str = "decision",
    ) -> str:
        """Store an agent decision, reasoning trace, or general note."""
        date = date or datetime.utcnow().strftime("%Y-%m-%d")
        text = f"[{agent}] {note}"
        record_id = _make_id("agent-memory", agent, market_slug, date, note[:64])
        self._upsert(
            namespace=NAMESPACES["agent-memory"],
            record_id=record_id,
            text=text,
            meta={
                "agent": agent,
                "market": market_slug,
                "date": date,
                "note_type": note_type,
                "type": "agent-memory",
            },
        )
        print(f"[pinecone_memory] Stored agent note from {agent} ({record_id[:8]}…)")
        return record_id

    def recall_agent_memory(
        self,
        query: str,
        agent: str | None = None,
        top_k: int = 5,
    ) -> list[dict]:
        """Semantic search over agent memory, optionally filtered by agent."""
        filters = {"agent": {"$eq": agent}} if agent else None
        return self._search(NAMESPACES["agent-memory"], query, top_k, filters)

    # ------------------------------------------------------------------
    # Cross-namespace convenience
    # ------------------------------------------------------------------
    def recall_all(self, query: str, top_k_per_ns: int = 3) -> dict[str, list[dict]]:
        """Search all namespaces and return grouped results."""
        return {
            ns: self._search(ns, query, top_k_per_ns)
            for ns in NAMESPACES.values()
        }

    def get_market_memory(self, market_slug: str, top_k: int = 10) -> dict[str, list[dict]]:
        """Retrieve all stored memory for a specific market across namespaces."""
        results = {}
        for ns in NAMESPACES.values():
            hits = self._search(ns, market_slug, top_k,
                                filters={"market": {"$eq": market_slug}})
            if hits:
                results[ns] = hits
        return results

    def stats(self) -> dict:
        """Return index statistics."""
        return self.index.describe_index_stats()


# ---------------------------------------------------------------------------
# Singleton — import and use directly
# ---------------------------------------------------------------------------
try:
    memory = AgentMemory()
except Exception as e:
    print(f"[pinecone_memory] WARNING: Could not initialize Pinecone memory: {e}")
    memory = None  # type: ignore
