"""
config_loader.py — Load and validate pipeline JSON configs.

JSON schema:
    {
      "pipeline": {
        "name": "My Pipeline",
        "description": "What it does",
        "agents": [
          {"name": "Alba", "role": "Research", "color": "cyan"},
          ...
        ]
      },
      "metrics": {
        "track_cost": true,
        "track_time": true,
        "track_errors": true
      },
      "web": {
        "port": 8888
      }
    }
"""

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Union


@dataclass
class AgentConfig:
    name: str
    role: str
    color: str = "cyan"


@dataclass
class PipelineConfig:
    name: str
    description: str
    agents: List[AgentConfig]
    track_cost: bool = True
    track_time: bool = True
    track_errors: bool = True
    web_port: int = 8888


def load_config(path: Union[str, Path]) -> PipelineConfig:
    """
    Load a pipeline config JSON file and return a PipelineConfig.

    Raises:
        FileNotFoundError: if the config file doesn't exist.
        ValueError: if required fields are missing.
    """
    path = Path(path)
    if not path.exists():
        raise FileNotFoundError(f"Pipeline config not found: {path}")

    with open(path, encoding="utf-8") as f:
        raw = json.load(f)

    pipeline = raw.get("pipeline", {})
    metrics = raw.get("metrics", {})
    web = raw.get("web", {})

    if not pipeline.get("name"):
        raise ValueError(f"Config missing pipeline.name: {path}")

    raw_agents = pipeline.get("agents", [])
    if not raw_agents:
        raise ValueError(f"Config has no agents defined: {path}")

    agents = [
        AgentConfig(
            name=a["name"],
            role=a.get("role", a["name"]),
            color=a.get("color", "cyan"),
        )
        for a in raw_agents
    ]

    return PipelineConfig(
        name=pipeline["name"],
        description=pipeline.get("description", ""),
        agents=agents,
        track_cost=metrics.get("track_cost", True),
        track_time=metrics.get("track_time", True),
        track_errors=metrics.get("track_errors", True),
        web_port=web.get("port", 8888),
    )
