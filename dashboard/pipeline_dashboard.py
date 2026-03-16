"""
pipeline_dashboard.py — Main dashboard class.

Wires together EventBus, AgentNodes, MetricsTracker, and the web server.
Runs a Rich Live terminal UI in a background thread so agents keep executing.

Usage:
    with PipelineDashboard("examples/trading_pipeline.json") as dash:
        dash.emit("agent_start", {"agent": "Alba", "task": "Scanning markets..."})
        # ... run agent ...
        dash.emit("agent_complete", {"agent": "Alba", "data": {...}, "cost_usd": 0.002})

    # or with a shared EventBus (agents emit to same bus externally):
    bus = EventBus()
    dash = PipelineDashboard("examples/trading_pipeline.json", bus=bus, web=True)
    dash.start()
"""

import time
import threading
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Union

from rich.align import Align
from rich.columns import Columns
from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.rule import Rule
from rich.text import Text

from .agent_node import AgentNode
from .config_loader import PipelineConfig, load_config
from .event_bus import EventBus
from .metrics_tracker import MetricsTracker

console = Console()

# Width of each node panel
NODE_WIDTH = 20
ARROW_WIDTH = 5  # " ──▶ "


class PipelineDashboard:
    """
    Generic agent pipeline visualizer.

    Two UIs run concurrently:
    - Rich terminal Live display (background thread)
    - FastAPI web server at localhost:<port> (optional, default: 8888)

    Both update in real-time via the shared EventBus.
    """

    def __init__(
        self,
        config_path: Union[str, Path],
        web: bool = True,
        bus: Optional[EventBus] = None,
    ):
        self.config: PipelineConfig = load_config(config_path)
        self.bus: EventBus = bus or EventBus()
        self.web = web

        # Build node list from config
        self.nodes: List[AgentNode] = [
            AgentNode(name=a.name, role=a.role, color=a.color)
            for a in self.config.agents
        ]
        self.node_map: Dict[str, AgentNode] = {n.name: n for n in self.nodes}

        self.metrics = MetricsTracker(total_agents=len(self.nodes))
        self.mirofish_state: dict = {}
        self.active_agent: Optional[str] = None
        self.pipeline_status: str = "idle"  # idle | running | complete | error

        # Internal state
        self._live: Optional[Live] = None
        self._thread: Optional[threading.Thread] = None
        self._running = False
        self._web_server = None

        self._register_handlers()

    # ------------------------------------------------------------------ #
    # Event handlers                                                       #
    # ------------------------------------------------------------------ #

    def _register_handlers(self) -> None:
        self.bus.on("pipeline_start", self._on_pipeline_start)
        self.bus.on("agent_start", self._on_agent_start)
        self.bus.on("agent_progress", self._on_agent_progress)
        self.bus.on("agent_complete", self._on_agent_complete)
        self.bus.on("agent_error", self._on_agent_error)
        self.bus.on("pipeline_complete", self._on_pipeline_complete)
        self.bus.on("mirofish_update", self._on_mirofish_update)

    def _on_pipeline_start(self, event: str, data: dict) -> None:
        self.pipeline_status = "running"
        self.metrics.reset_pipeline()
        for node in self.nodes:
            node.status = "waiting"
            node.progress = 0
            node.output_data = {}
            node.error = None
            node.start_time = None
            node.end_time = None
            node.cost_usd = 0.0
            node.status_text = ""

    def _on_agent_start(self, event: str, data: dict) -> None:
        node = self.node_map.get(data.get("agent", ""))
        if node:
            node.status = "active"
            node.start_time = datetime.utcnow()
            node.status_text = data.get("task", "Running...")
            node.progress = 0
        self.active_agent = data.get("agent")

    def _on_agent_progress(self, event: str, data: dict) -> None:
        node = self.node_map.get(data.get("agent", ""))
        if node:
            node.progress = int(data.get("progress", 0))
            node.status_text = data.get("status_text", "")

    def _on_agent_complete(self, event: str, data: dict) -> None:
        node = self.node_map.get(data.get("agent", ""))
        if node:
            node.status = "complete"
            node.end_time = datetime.utcnow()
            node.progress = 100
            node.output_data = data.get("data") or {}
            node.cost_usd = float(data.get("cost_usd", 0.0))
            node.status_text = ""
        self.metrics.record_agent_complete(
            agent_name=data.get("agent", ""),
            cost_usd=float(data.get("cost_usd", 0.0)),
            duration_seconds=float(data.get("duration_seconds", 0.0)),
        )
        self.mirofish_state = {}  # clear MiroFish display on agent complete

    def _on_agent_error(self, event: str, data: dict) -> None:
        node = self.node_map.get(data.get("agent", ""))
        if node:
            node.status = "error"
            node.end_time = datetime.utcnow()
            node.error = data.get("error", "Unknown error")
            node.status_text = ""
        self.metrics.record_error(data.get("agent", ""))
        self.pipeline_status = "error"

    def _on_pipeline_complete(self, event: str, data: dict) -> None:
        self.pipeline_status = "complete"
        self.active_agent = None
        self.metrics.record_run(success=data.get("approved", True))

    def _on_mirofish_update(self, event: str, data: dict) -> None:
        self.mirofish_state = data
        # Mirror progress onto the active agent node
        node = self.node_map.get(self.active_agent or "")
        if node and node.status == "active":
            pct = data.get("progress_percent", 0)
            cr = data.get("current_round", 0)
            tr = data.get("total_rounds", 0)
            node.progress = int(pct)
            node.status_text = f"Round {cr}/{tr}"

    # ------------------------------------------------------------------ #
    # Rich layout builder                                                  #
    # ------------------------------------------------------------------ #

    def _build_layout(self) -> Layout:
        layout = Layout()
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="body"),
            Layout(name="footer", size=3),
        )
        layout["body"].split_row(
            Layout(name="pipeline", ratio=7),
            Layout(name="metrics", ratio=3),
        )

        # ── Header ──────────────────────────────────────────────────── #
        status_color = {
            "idle":     "dim white",
            "running":  "yellow",
            "complete": "green",
            "error":    "red",
        }.get(self.pipeline_status, "white")

        status_dot = {
            "idle":     "○",
            "running":  "●",
            "complete": "✓",
            "error":    "✗",
        }.get(self.pipeline_status, "○")

        header_text = Text(justify="center")
        header_text.append("ASKELIRA PIPELINE", style="bold cyan")
        header_text.append("  —  ", style="dim")
        header_text.append(self.config.name, style="bold white")
        if self.active_agent:
            header_text.append(f"  →  {self.active_agent}", style="bold yellow")
        header_text.append(f"  {status_dot}", style=status_color)
        if self.web:
            header_text.append(
                f"  ◈ localhost:{self.config.web_port}", style="dim cyan"
            )
        layout["header"].update(
            Panel(Align.center(header_text), border_style="cyan", padding=(0, 1))
        )

        # ── Pipeline nodes ───────────────────────────────────────────── #
        node_renderables = []
        for i, node in enumerate(self.nodes):
            node_renderables.append(node.render())
            if i < len(self.nodes) - 1:
                arrow_style = (
                    "green"
                    if node.status == "complete"
                    else ("yellow" if node.status == "active" else "dim white")
                )
                node_renderables.append(
                    Align.center(Text("──▶", style=arrow_style), vertical="middle")
                )

        # ── Active agent detail panel ────────────────────────────────── #
        active_node = self.node_map.get(self.active_agent or "")
        if active_node and active_node.status == "active":
            pct = active_node.progress
            bar_width = 28
            filled = max(0, int(bar_width * pct / 100))
            bar = "█" * filled + "░" * (bar_width - filled)

            detail = Text()
            detail.append(f"Active: {active_node.name}", style="bold yellow")
            detail.append(f"  ({active_node.role})\n", style="dim yellow")
            detail.append(f"[{bar}] {pct:>3}%\n", style="yellow")
            if active_node.status_text:
                detail.append(f"  {active_node.status_text}", style="dim")

            # MiroFish sub-status
            if self.mirofish_state:
                phase = self.mirofish_state.get("phase", "")
                phase_labels = {
                    "graph_build": "Building knowledge graph",
                    "sim_running": "Running OASIS swarm simulation",
                    "report_gen":  "Generating simulation report",
                }
                detail.append(
                    f"\n  MiroFish: {phase_labels.get(phase, phase)}",
                    style="dim magenta",
                )

            detail_panel = Panel(detail, border_style="yellow", height=6)
        else:
            # Completed / idle summary
            completed = [n for n in self.nodes if n.status == "complete"]
            errors = [n for n in self.nodes if n.status == "error"]
            summary = Text()

            if self.pipeline_status == "complete":
                summary.append("Pipeline complete  ✓\n", style="bold green")
            elif self.pipeline_status == "error":
                summary.append("Pipeline error  ✗\n", style="bold red")
            else:
                summary.append("Waiting for pipeline to start…\n", style="dim")

            if completed:
                summary.append(
                    f"Done: {', '.join(n.name for n in completed)}\n",
                    style="dim green",
                )
            if errors:
                summary.append(
                    f"Failed: {', '.join(n.name for n in errors)}\n",
                    style="dim red",
                )

            detail_panel = Panel(summary, border_style="dim white", height=6)

        # Assemble pipeline sub-layout
        pipeline_inner = Layout()
        pipeline_inner.split_column(
            Layout(name="nodes"),
            Layout(name="detail", size=6),
        )
        pipeline_inner["nodes"].update(
            Panel(
                Columns(node_renderables, equal=False, expand=False),
                border_style="dim",
                padding=(0, 1),
            )
        )
        pipeline_inner["detail"].update(detail_panel)
        layout["pipeline"].update(pipeline_inner)

        # ── Metrics ──────────────────────────────────────────────────── #
        layout["metrics"].update(
            Panel(
                self.metrics.summary_table(),
                title="[bold dim]Metrics[/]",
                border_style="dim blue",
                padding=(0, 1),
            )
        )

        # ── Footer ───────────────────────────────────────────────────── #
        footer_text = Text(justify="center")
        footer_text.append(f"Elapsed: {self.metrics.elapsed_str()}", style="dim")
        footer_text.append("  │  ", style="dim")
        footer_text.append(f"Steps: {self.metrics.steps_complete()}", style="dim")
        footer_text.append("  │  ", style="dim")
        footer_text.append(f"Cost: ${self.metrics.total_cost:.4f}", style="dim yellow")
        if self.config.description:
            footer_text.append(f"  │  {self.config.description}", style="dim")
        layout["footer"].update(
            Panel(Align.center(footer_text), border_style="dim", padding=(0, 0))
        )

        return layout

    # ------------------------------------------------------------------ #
    # Background Live thread                                               #
    # ------------------------------------------------------------------ #

    def _run_live(self) -> None:
        with Live(
            self._build_layout(),
            console=console,
            refresh_per_second=4,
            screen=True,
        ) as live:
            self._live = live
            while self._running:
                live.update(self._build_layout())
                time.sleep(0.25)

    # ------------------------------------------------------------------ #
    # Public API                                                           #
    # ------------------------------------------------------------------ #

    def start(self) -> None:
        """Start terminal UI (background thread) and optionally web server."""
        self._running = True
        self._thread = threading.Thread(target=self._run_live, daemon=True, name="dash-live")
        self._thread.start()

        if self.web:
            try:
                from .web_server import DashboardWebServer

                self._web_server = DashboardWebServer(
                    bus=self.bus,
                    nodes=self.nodes,
                    metrics=self.metrics,
                    mirofish_state_ref=self.mirofish_state,
                    port=self.config.web_port,
                )
                self._web_server.start()
            except ImportError as e:
                console.print(
                    f"[yellow]Web server unavailable ({e}). "
                    f"Install: pip install fastapi uvicorn websockets[/]"
                )

    def stop(self) -> None:
        """Shut down terminal UI and web server."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=3)
        if self._web_server:
            self._web_server.stop()

    def emit(self, event_name: str, data: Optional[dict] = None) -> None:
        """Convenience wrapper — emit an event to the shared EventBus."""
        self.bus.emit(event_name, data or {})

    def __enter__(self) -> "PipelineDashboard":
        self.start()
        return self

    def __exit__(self, *_) -> None:
        time.sleep(0.3)
        self.stop()


# ------------------------------------------------------------------ #
# __main__ — demo mode                                                #
# ------------------------------------------------------------------ #

def _run_demo(config_path: str, web: bool = True) -> None:
    """Simulate a full pipeline run with fake events for testing."""
    import random

    config = load_config(config_path)

    with PipelineDashboard(config_path, web=web) as dash:
        dash.emit("pipeline_start", {
            "pipeline_name": config.name,
            "agent_count": len(config.agents),
        })
        time.sleep(0.5)

        for agent_cfg in config.agents:
            dash.emit("agent_start", {
                "agent": agent_cfg.name,
                "task": f"Executing {agent_cfg.role}...",
            })
            time.sleep(0.4)

            is_sim_agent = agent_cfg.role.lower() in (
                "simulation", "validation", "audit"
            )
            total_rounds = 5 if is_sim_agent else 0

            for p in range(0, 101, 5):
                dash.emit("agent_progress", {
                    "agent": agent_cfg.name,
                    "progress": p,
                    "status_text": f"Processing... {p}%",
                })
                if is_sim_agent and p % 20 == 0:
                    dash.emit("mirofish_update", {
                        "phase": "sim_running",
                        "current_round": p // 20 + 1,
                        "total_rounds": total_rounds,
                        "progress_percent": p,
                        "runner_status": "running",
                    })
                time.sleep(0.12)

            cost = round(random.uniform(0.001, 0.006), 4)
            dash.emit("agent_complete", {
                "agent": agent_cfg.name,
                "data": {
                    "status": "ok",
                    "items": random.randint(1, 20),
                    "confidence": random.randint(60, 95),
                },
                "cost_usd": cost,
                "duration_seconds": round(random.uniform(2.0, 15.0), 1),
            })
            time.sleep(0.3)

        dash.emit("pipeline_complete", {
            "approved": True,
            "total_cost": dash.metrics.total_cost,
        })
        # Let user see the final state
        time.sleep(8)


if __name__ == "__main__":
    import argparse
    import sys

    BASE = Path(__file__).parent

    parser = argparse.ArgumentParser(
        description="AskElira Pipeline Dashboard — demo runner"
    )
    parser.add_argument(
        "config",
        nargs="?",
        default=str(BASE / "examples" / "trading_pipeline.json"),
        help="Path to pipeline config JSON",
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run a simulated pipeline (no real agents needed)",
    )
    parser.add_argument(
        "--no-web",
        action="store_true",
        help="Disable web server (terminal only)",
    )
    args = parser.parse_args()

    if args.demo:
        _run_demo(args.config, web=not args.no_web)
    else:
        parser.print_help()
        sys.exit(0)
