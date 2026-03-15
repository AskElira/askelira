"""
Shared dataclasses for the Polymarket MiroFish agent loop.
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Market:
    question: str
    platform: str              # "Polymarket" | "Kalshi"
    yes_price: float           # 0.0–1.0
    resolution_date: str       # "YYYY-MM-DD"
    resolution_criteria: str   # verbatim contract language
    liquidity: float           # USD
    why_mispriced: str
    uncertainty: str           # "LOW" | "MEDIUM" | "HIGH"
    slug: str = ""             # url-safe slug for filenames

    def __post_init__(self):
        if not self.slug:
            import re
            self.slug = re.sub(r"[^a-z0-9]+", "-", self.question.lower())[:60].strip("-")


@dataclass
class CalendarEvent:
    date: str
    event: str
    impact: str                # "HIGH" | "MEDIUM" | "LOW"
    could_flip: bool


@dataclass
class SimResult:
    simulation_id: str
    report_id: str
    confidence: float          # 0.0–1.0 (averaged across runs)
    direction: str             # "YES" | "NO"
    markdown: str              # full MiroFish report text
    variance: float            # std dev across 3 runs (0.0–1.0)
    run_confidences: list = field(default_factory=list)  # per-run raw values


@dataclass
class VexVerdict:
    verdict: str               # "PASS" | "PASS-WITH-WARNINGS" | "FAIL"
    findings: list             # list of strings
    confidence: str            # "HIGH" | "MEDIUM" | "LOW" | "DO NOT DEPLOY"
    override_risk: bool = False


@dataclass
class Position:
    market: str
    platform: str
    direction: str             # "YES" | "NO"
    entry_price: float
    size: float                # USD
    resolution_date: str
    resolution_trigger: str    # what event closes this
    status: str                # "OPEN" | "CLOSED"
    pnl: float
    opened_at: str             # ISO timestamp
    closed_at: Optional[str] = None
    sim_confidence: float = 0.0
    tier: int = 1
    position_id: str = ""

    def __post_init__(self):
        if not self.position_id:
            import uuid
            self.position_id = str(uuid.uuid4())[:8]
