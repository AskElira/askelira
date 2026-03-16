"""
Dashboard Data API for Vercel Frontend
Exports Pinecone memory + active positions for visualization

Usage (Vercel API route):
  /api/dashboard_data → GET → JSON with all dashboard data

Returns:
{
  "positions": [...],
  "calibration": [...],
  "research": [...],
  "simulations": [...],
  "stats": {...}
}
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any

# Try to import Pinecone memory (non-fatal if unavailable)
try:
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from pinecone_memory import memory as _mem
except Exception:
    _mem = None

DATA_DIR = Path(__file__).parent.parent / "data"
POSITIONS_FILE = DATA_DIR / "active_positions.json"
CALIBRATION_LOG = DATA_DIR / "calibration_log.csv"


def get_positions() -> List[Dict]:
    """Get all positions (open and closed)."""
    if not POSITIONS_FILE.exists():
        return []
    
    with open(POSITIONS_FILE, "r") as f:
        data = json.load(f)
    
    return data.get("positions", [])


def get_calibration_data() -> List[Dict]:
    """Get calibration log as JSON."""
    if not CALIBRATION_LOG.exists():
        return []
    
    import csv
    calibration = []
    
    with open(CALIBRATION_LOG, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            calibration.append(row)
    
    return calibration


def get_pinecone_research(limit: int = 50) -> List[Dict]:
    """Get recent research from Pinecone memory."""
    if not _mem:
        return []
    
    try:
        # Query recent research entries (last 30 days)
        results = _mem.recall_similar(
            query="prediction market research",
            namespace="research",
            top_k=limit
        )
        return results
    except Exception:
        return []


def get_pinecone_simulations(limit: int = 50) -> List[Dict]:
    """Get recent simulations from Pinecone memory."""
    if not _mem:
        return []
    
    try:
        # Query recent simulations
        results = _mem.recall_similar(
            query="simulation results",
            namespace="simulations",
            top_k=limit
        )
        return results
    except Exception:
        return []


def calculate_stats(positions: List[Dict], calibration: List[Dict]) -> Dict:
    """Calculate dashboard statistics."""
    open_positions = [p for p in positions if p.get("status") == "OPEN"]
    closed_positions = [p for p in positions if p.get("status") == "CLOSED"]
    
    # Overall stats
    total_deployed = sum(p.get("size", 0) for p in open_positions)
    total_pnl = sum(float(p.get("pnl", 0)) for p in closed_positions)
    
    wins = [p for p in closed_positions if float(p.get("pnl", 0)) > 0]
    losses = [p for p in closed_positions if float(p.get("pnl", 0)) < 0]
    
    win_rate = len(wins) / len(closed_positions) if closed_positions else 0
    
    # Tier breakdown
    tier_stats = {}
    for tier in [1, 2, 3]:
        tier_positions = [p for p in closed_positions if p.get("tier") == tier]
        tier_wins = [p for p in tier_positions if float(p.get("pnl", 0)) > 0]
        tier_stats[f"tier_{tier}"] = {
            "total": len(tier_positions),
            "wins": len(tier_wins),
            "win_rate": len(tier_wins) / len(tier_positions) if tier_positions else 0,
            "pnl": sum(float(p.get("pnl", 0)) for p in tier_positions)
        }
    
    # Recent performance (last 7 days)
    seven_days_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    recent_calibration = [c for c in calibration if c.get("DATE", "") >= seven_days_ago]
    recent_wins = [c for c in recent_calibration if c.get("WIN_LOSS") == "WIN"]
    
    return {
        "total_positions": len(positions),
        "open_positions": len(open_positions),
        "closed_positions": len(closed_positions),
        "total_deployed": round(total_deployed, 2),
        "total_pnl": round(total_pnl, 2),
        "win_rate": round(win_rate, 3),
        "wins": len(wins),
        "losses": len(losses),
        "tier_stats": tier_stats,
        "last_7_days": {
            "total": len(recent_calibration),
            "wins": len(recent_wins),
            "win_rate": len(recent_wins) / len(recent_calibration) if recent_calibration else 0
        },
        "timestamp": datetime.utcnow().isoformat()
    }


def get_dashboard_data() -> Dict[str, Any]:
    """
    Main export function for Vercel dashboard.
    
    Returns complete dashboard data as JSON.
    """
    positions = get_positions()
    calibration = get_calibration_data()
    
    return {
        "positions": positions,
        "calibration": calibration,
        "research": get_pinecone_research(limit=30),
        "simulations": get_pinecone_simulations(limit=30),
        "stats": calculate_stats(positions, calibration),
        "metadata": {
            "generated_at": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "source": "quantjellyfish"
        }
    }


# Vercel serverless function handler
def handler(request, response):
    """
    Vercel API route handler.
    
    Usage: /api/dashboard_data
    """
    try:
        data = get_dashboard_data()
        response.status(200).json(data)
    except Exception as e:
        response.status(500).json({
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })


# Local testing
if __name__ == "__main__":
    import json
    data = get_dashboard_data()
    print(json.dumps(data, indent=2))
