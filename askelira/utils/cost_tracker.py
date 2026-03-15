"""
Cost Tracker for AskElira Framework.

Tracks API costs (Claude, Pinecone) vs realized value to calculate ROI.
Persists a JSON log at ``data/cost_log.json`` relative to the project root.

Adapted from the AskElira Trader implementation.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

DATA_DIR = Path(__file__).parent.parent.parent / "data"
COST_LOG = DATA_DIR / "cost_log.json"

# API cost estimates (per call) — adjust for your usage
COSTS = {
    "claude_haiku": 0.00025,     # $0.25 per 1M input tokens (~1K tokens avg)
    "claude_sonnet": 0.003,      # $3 per 1M input tokens (~1K tokens avg)
    "pinecone_query": 0.00001,   # Negligible (~$0.40/mo flat)
    "pinecone_upsert": 0.00001,
    "mirofish_simulation": 0.00, # Self-hosted (Docker), no API cost
}

# Override with your domain-specific step costs
PIPELINE_COSTS: Dict[str, float] = {
    "research": COSTS["claude_haiku"] * 3,   # ~3 API calls
    "simulate": COSTS["mirofish_simulation"], # free (self-hosted)
    "audit": COSTS["claude_sonnet"],
    "decide": 0.0,                            # logic only
    "execute": 0.0,                           # domain-specific
}

TOTAL_PIPELINE_COST = sum(PIPELINE_COSTS.values())


def load_cost_log() -> Dict:
    """Load cost log from JSON. Returns empty log if file does not exist."""
    if not COST_LOG.exists():
        return {"total_cost": 0.0, "total_profit": 0.0, "runs": []}
    with open(COST_LOG, "r") as f:
        return json.load(f)


def save_cost_log(data: Dict) -> None:
    """Persist cost log to JSON."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(COST_LOG, "w") as f:
        json.dump(data, f, indent=2)


def log_pipeline_run(
    approved: bool,
    position_size: Optional[float] = None,
    sim_confidence: Optional[float] = None,
) -> Dict:
    """
    Log a pipeline run with estimated costs.

    Args:
        approved:        Whether the decision gate approved execution.
        position_size:   Size/value of action taken (if approved).
        sim_confidence:  Simulation confidence score (0.0–1.0).

    Returns:
        Updated cost log dict.
    """
    cost_log = load_cost_log()
    run = {
        "timestamp": datetime.utcnow().isoformat(),
        "cost": TOTAL_PIPELINE_COST,
        "approved": approved,
        "position_size": position_size or 0.0,
        "sim_confidence": sim_confidence,
    }
    cost_log["runs"].append(run)
    cost_log["total_cost"] += TOTAL_PIPELINE_COST
    save_cost_log(cost_log)
    return cost_log


def log_resolution(realized_value: float) -> Dict:
    """
    Log realized value after an action resolves.

    Args:
        realized_value: Profit/value realized (can be negative).

    Returns:
        Updated cost log dict.
    """
    cost_log = load_cost_log()
    cost_log["total_profit"] += realized_value
    save_cost_log(cost_log)
    return cost_log


def get_roi_summary() -> Dict:
    """
    Calculate ROI summary across all logged runs.

    Returns:
        Dict with total_cost, total_profit, net_profit, roi, run_count,
        cost_per_run, profit_per_run.
    """
    cost_log = load_cost_log()
    total_cost = cost_log.get("total_cost", 0.0)
    total_profit = cost_log.get("total_profit", 0.0)
    run_count = len(cost_log.get("runs", []))

    return {
        "total_cost": round(total_cost, 4),
        "total_profit": round(total_profit, 2),
        "net_profit": round(total_profit - total_cost, 2),
        "roi": round((total_profit / total_cost - 1) * 100, 1) if total_cost > 0 else 0.0,
        "run_count": run_count,
        "cost_per_run": round(total_cost / run_count, 4) if run_count > 0 else 0.0,
        "profit_per_run": round(total_profit / run_count, 2) if run_count > 0 else 0.0,
    }


if __name__ == "__main__":
    print(f"Estimated cost per pipeline run: ${TOTAL_PIPELINE_COST:.4f}")
    summary = get_roi_summary()
    print(f"ROI: {summary['roi']:.1f}%  |  Net: ${summary['net_profit']:.2f}  |  Runs: {summary['run_count']}")
