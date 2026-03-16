"""
AskElira Pipeline Dashboard
---------------------------
Generic agent pipeline visualizer for any multi-agent workflow.

Quick start:
    from dashboard import PipelineDashboard

    with PipelineDashboard("examples/trading_pipeline.json") as dash:
        dash.emit("agent_start",    {"agent": "Alba", "task": "Scanning..."})
        dash.emit("agent_complete", {"agent": "Alba", "data": {}, "cost_usd": 0.002})

Web UI auto-starts at http://localhost:8888 (configurable in JSON).
"""

from .pipeline_dashboard import PipelineDashboard
from .event_bus import EventBus
from .config_loader import load_config, PipelineConfig, AgentConfig

__all__ = [
    "PipelineDashboard",
    "EventBus",
    "load_config",
    "PipelineConfig",
    "AgentConfig",
]
