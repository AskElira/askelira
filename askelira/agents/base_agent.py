"""
Base Agent class for AskElira framework.

All domain-specific agents (trading, marketing, sales) inherit from this.
Provides standard interface: initialize, execute, validate, report.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging
from datetime import datetime


class BaseAgent(ABC):
    """
    Abstract base class for all AskElira agents.

    Implements the standard 4-phase agent lifecycle:
    1. Initialize - Setup, config, API clients
    2. Execute   - Core agent logic (override this)
    3. Validate  - Check outputs, ensure quality
    4. Report    - Return results + metadata

    Example::

        class MyAgent(BaseAgent):
            def execute(self, query: str, **kwargs) -> Dict[str, Any]:
                return {"success": True, "data": {"result": "..."}, "error": None}

        agent = MyAgent("my-agent")
        report = agent.run(query="hello")
    """

    def __init__(self, name: str, config: Optional[Dict] = None):
        """
        Args:
            name:   Human-readable agent identifier (used in logs).
            config: Optional dict of agent-specific settings.
        """
        self.name = name
        self.config = config or {}
        self.log = logging.getLogger(f"askelira.{name}")
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.cost: float = 0.0

    @abstractmethod
    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Core agent logic. Override in every subclass.

        Returns:
            Dict with at minimum:

            - ``success`` (bool)
            - ``data`` (Any — agent-specific output)
            - ``error`` (Optional[str])
        """

    def validate(self, result: Dict[str, Any]) -> bool:
        """
        Validate agent output. Override for custom validation rules.

        Args:
            result: Output from :meth:`execute`.

        Returns:
            ``True`` if valid, ``False`` otherwise.
        """
        return result.get("success", False)

    def report(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate agent execution report with timing and cost metadata.

        Returns:
            Dict containing agent name, success flag, timestamp,
            duration, cost, data, and error.
        """
        duration = 0.0
        if self.start_time and self.end_time:
            duration = (self.end_time - self.start_time).total_seconds()
        return {
            "agent": self.name,
            "success": result.get("success", False),
            "timestamp": datetime.utcnow().isoformat(),
            "duration_seconds": duration,
            "cost_usd": self.cost,
            "data": result.get("data"),
            "error": result.get("error"),
        }

    def run(self, **kwargs) -> Dict[str, Any]:
        """
        Full agent execution: execute → validate → report.

        Any exception raised by :meth:`execute` is caught and returned
        as a failed report so the orchestrator can handle it gracefully.

        Args:
            **kwargs: Passed directly to :meth:`execute`.

        Returns:
            Agent report dict (see :meth:`report`).
        """
        self.start_time = datetime.utcnow()
        self.log.info(f"[{self.name}] Starting execution")

        try:
            result = self.execute(**kwargs)
            self.end_time = datetime.utcnow()

            if not self.validate(result):
                self.log.warning(f"[{self.name}] Validation failed")
                result["success"] = False
                result["error"] = result.get("error", "Validation failed")

            report = self.report(result)
            self.log.info(f"[{self.name}] Completed: success={report['success']}")
            return report

        except Exception as e:
            self.end_time = datetime.utcnow()
            self.log.error(f"[{self.name}] Error: {e}")
            return self.report({"success": False, "data": None, "error": str(e)})
