"""
Generic Research Agent (Alba pattern).

Gathers information, scans sources, generates seeds for simulation.
Adapt for any domain: market data, GitHub repos, sales leads, etc.

Full implementations:
  - Trading:    github.com/jellyforex/askeliratrader  (Agents/alba.py)
  - Marketing:  github.com/jellyforex/askeliramarketing  (Agents/github_scout.py)
"""

from typing import Dict, Any, List
from .base_agent import BaseAgent


class ResearchAgent(BaseAgent):
    """
    Generic research agent — gathers domain-specific information and
    produces a structured seed for downstream simulation.

    Override :meth:`execute` to implement your research logic.
    Optionally override :meth:`scan_sources` and :meth:`generate_seed`
    for a more modular implementation.

    Example::

        class MyResearchAgent(ResearchAgent):
            def execute(self, query: str, **kwargs) -> Dict[str, Any]:
                findings = self.scan_sources(["https://example.com"])
                seed = self.generate_seed(findings)
                return {"success": True, "data": {"seed": seed}, "error": None}
    """

    def __init__(self, config: Dict = None):
        super().__init__("ResearchAgent", config)

    def execute(self, query: str, sources: List[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Execute research for *query* across *sources*.

        Args:
            query:   Research question or topic.
            sources: Optional list of data source URLs / identifiers.

        Returns:
            Dict with ``success``, ``data`` (including ``seed`` key), ``error``.
        """
        raise NotImplementedError(
            "Implement execute() in your domain-specific research agent. "
            "See examples/trader/ and examples/marketing/ for reference."
        )

    def scan_sources(self, sources: List[str]) -> List[Dict]:
        """
        Scan multiple sources and return structured findings.

        Override this for custom scraping / API logic.

        Args:
            sources: List of URLs, tickers, repo names, etc.

        Returns:
            List of finding dicts (schema is domain-specific).
        """
        return []

    def generate_seed(self, findings: List[Dict]) -> str:
        """
        Convert research findings into a MiroFish simulation seed string.

        Override this to control how context is formatted for the swarm.

        Args:
            findings: Output from :meth:`scan_sources`.

        Returns:
            Plain-text seed string consumed by MiroFish.
        """
        return ""
