"""
Cost Tracking for Quantjellyfish Paper Trading
Tracks API costs (Claude, Pinecone) vs paper profit to calculate ROI
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

DATA_DIR = Path(__file__).parent.parent / "data"
COST_LOG = DATA_DIR / "cost_log.json"

# API cost estimates (per call)
COSTS = {
    "claude_haiku": 0.00025,      # $0.25 per 1M input tokens (~1K tokens avg)
    "claude_sonnet": 0.003,        # $3 per 1M input tokens (~1K tokens avg)
    "pinecone_query": 0.00001,     # Negligible (~$0.40/mo flat)
    "pinecone_upsert": 0.00001,
    "mirofish_simulation": 0.00,   # Self-hosted (Docker), no API cost
}

# Estimated usage per pipeline run
PIPELINE_COSTS = {
    "alba_market_scan": COSTS["claude_haiku"] * 2,       # 2 web searches
    "alba_calendar": COSTS["claude_haiku"],
    "alba_seed_file": COSTS["claude_haiku"] * 3,         # 3-4 web searches
    "alba_sim_prompt": COSTS["claude_haiku"],
    "david_simulation": COSTS["mirofish_simulation"] * 3,  # 3 runs (free)
    "vex_audit": COSTS["claude_sonnet"] * 2,            # 2 NLP checks
    "orb_decision": 0.0,                                 # Logic only
    "steven_execute": 0.0,                               # Paper trading
    "pinecone_storage": COSTS["pinecone_upsert"] * 5,   # ~5 vectors
}

TOTAL_PIPELINE_COST = sum(PIPELINE_COSTS.values())  # ~$0.015 per run


def load_cost_log() -> Dict:
    """Load cost log from JSON."""
    if not COST_LOG.exists():
        return {"total_cost": 0.0, "total_profit": 0.0, "runs": []}
    with open(COST_LOG, "r") as f:
        return json.load(f)


def save_cost_log(data: Dict) -> None:
    """Save cost log to JSON."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(COST_LOG, "w") as f:
        json.dump(data, f, indent=2)


def log_pipeline_run(
    approved: bool,
    position_size: Optional[float] = None,
    sim_confidence: Optional[float] = None
) -> Dict:
    """
    Log a pipeline run with estimated costs.
    
    Args:
        approved: Whether position was approved
        position_size: Size of position (if approved)
        sim_confidence: Simulation confidence
    
    Returns:
        Updated cost summary
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


def log_resolution(position_pnl: float) -> Dict:
    """
    Log position resolution and update profit tracking.
    
    Args:
        position_pnl: Realized P&L from position
    
    Returns:
        Updated cost summary
    """
    cost_log = load_cost_log()
    cost_log["total_profit"] += position_pnl
    save_cost_log(cost_log)
    return cost_log


def get_roi_summary() -> Dict:
    """
    Calculate ROI summary.
    
    Returns:
        {
            "total_cost": float,
            "total_profit": float,
            "net_profit": float,
            "roi": float,
            "run_count": int,
            "cost_per_run": float,
            "profit_per_run": float
        }
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
    # Example usage
    print("Estimated cost per pipeline run:", f"${TOTAL_PIPELINE_COST:.4f}")
    print("\nBreakdown:")
    for step, cost in PIPELINE_COSTS.items():
        if cost > 0:
            print(f"  {step}: ${cost:.4f}")
    
    summary = get_roi_summary()
    print("\nCurrent ROI Summary:")
    print(f"  Total cost: ${summary['total_cost']:.4f}")
    print(f"  Total profit: ${summary['total_profit']:.2f}")
    print(f"  Net profit: ${summary['net_profit']:.2f}")
    print(f"  ROI: {summary['roi']:.1f}%")
    print(f"  Runs: {summary['run_count']}")
