"""
AskElira Framework — generic multi-agent orchestration platform.

Quick start::

    from askelira import BaseAgent, Orchestrator

    class MyAgent(BaseAgent):
        def execute(self, query: str, **kwargs):
            return {"success": True, "data": {"result": "..."}, "error": None}

See docs/QUICKSTART.md or https://github.com/jellyforex/askelira for more.
"""

from .agents.base_agent import BaseAgent
from .agents.research_agent import ResearchAgent
from .orchestrator import Orchestrator

__version__ = "0.1.0"
__all__ = ["BaseAgent", "ResearchAgent", "Orchestrator"]
