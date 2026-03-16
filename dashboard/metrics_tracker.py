"""
metrics_tracker.py — Pipeline-wide metrics collection.

Tracks elapsed time, cost, step completion, error count, and success rate
across multiple pipeline runs (for loop mode).
"""

from datetime import datetime
from typing import Dict, Optional

from rich.table import Table
from rich.text import Text


class MetricsTracker:
    """
    Accumulates metrics emitted by agents and exposes Rich + JSON renderers.

    Usage:
        tracker = MetricsTracker(total_agents=5)

        # called by dashboard event handlers
        tracker.record_agent_complete("Alba", cost_usd=0.002, duration_seconds=12.4)
        tracker.record_error("David")
        tracker.record_run(success=True)

        # render
        table = tracker.summary_table()  # Rich Table
        d = tracker.to_dict()            # JSON-serializable dict
    """

    def __init__(self, total_agents: int):
        self.total_agents = total_agents
        self.start_time: datetime = datetime.utcnow()

        self.total_cost: float = 0.0
        self.error_count: int = 0
        self.complete_count: int = 0

        # Multi-run tracking (for loop/scheduler mode)
        self.run_count: int = 0
        self.success_count: int = 0

        self._agent_costs: Dict[str, float] = {}
        self._agent_durations: Dict[str, float] = {}

    # ------------------------------------------------------------------ #
    # Recording                                                            #
    # ------------------------------------------------------------------ #

    def record_agent_complete(
        self,
        agent_name: str,
        cost_usd: float = 0.0,
        duration_seconds: float = 0.0,
    ) -> None:
        self.total_cost += cost_usd
        self.complete_count += 1
        self._agent_costs[agent_name] = cost_usd
        self._agent_durations[agent_name] = duration_seconds

    def record_error(self, agent_name: str) -> None:
        self.error_count += 1

    def record_run(self, success: bool) -> None:
        self.run_count += 1
        if success:
            self.success_count += 1

    def reset_pipeline(self) -> None:
        """Reset per-pipeline counters but keep run-level stats."""
        self.complete_count = 0
        self.total_cost = 0.0
        self.error_count = 0
        self._agent_costs.clear()
        self._agent_durations.clear()
        self.start_time = datetime.utcnow()

    # ------------------------------------------------------------------ #
    # Formatted accessors                                                  #
    # ------------------------------------------------------------------ #

    def elapsed_str(self) -> str:
        """Return HH:MM:SS elapsed since pipeline start."""
        secs = int((datetime.utcnow() - self.start_time).total_seconds())
        h = secs // 3600
        m = (secs % 3600) // 60
        s = secs % 60
        return f"{h:02d}:{m:02d}:{s:02d}"

    def steps_complete(self) -> str:
        """Return 'X / N' completed agents."""
        return f"{self.complete_count} / {self.total_agents}"

    def success_rate(self) -> str:
        """Return success rate as percentage (across runs)."""
        if self.run_count == 0:
            return "N/A"
        return f"{int(self.success_count / self.run_count * 100)}%"

    # ------------------------------------------------------------------ #
    # Renderers                                                            #
    # ------------------------------------------------------------------ #

    def summary_table(self) -> Table:
        """Rich Table for the terminal metrics panel."""
        t = Table(box=None, show_header=False, padding=(0, 1), expand=True)
        t.add_column("Label", style="dim", no_wrap=True)
        t.add_column("Value", style="bold white", no_wrap=True)

        t.add_row("Elapsed", self.elapsed_str())
        t.add_row("Steps", self.steps_complete())
        t.add_row("Cost", f"${self.total_cost:.4f}")

        error_style = "bold red" if self.error_count > 0 else "white"
        t.add_row("Errors", Text(str(self.error_count), style=error_style))

        if self.run_count > 0:
            t.add_row("Runs", str(self.run_count))
            t.add_row("Win Rate", self.success_rate())

        return t

    def to_dict(self) -> dict:
        """JSON-serializable snapshot for web server."""
        return {
            "elapsed": self.elapsed_str(),
            "steps": self.steps_complete(),
            "complete_count": self.complete_count,
            "total_agents": self.total_agents,
            "total_cost": round(self.total_cost, 6),
            "error_count": self.error_count,
            "run_count": self.run_count,
            "success_count": self.success_count,
            "success_rate": self.success_rate(),
        }
