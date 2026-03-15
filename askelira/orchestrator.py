"""
AskElira Orchestrator — 5-Agent Pipeline.

Generic orchestration pattern extracted from the AskElira trading and
marketing implementations:

    Research → Simulate → Audit → Decide → Execute

Full implementations:
  - Trading:    github.com/jellyforex/askeliratrader  (Agents/elira.py)
  - Marketing:  github.com/jellyforex/askeliramarketing  (Agents/elira_marketing.py)
"""

from typing import Dict, Any, Optional
import logging

from .agents.base_agent import BaseAgent

log = logging.getLogger("askelira.orchestrator")


class Orchestrator:
    """
    Coordinates a 5-agent workflow.

    Agents execute in sequence:

    1. **research**  — Gather domain-specific data, produce a seed.
    2. **simulate**  — Run MiroFish swarm on the seed, get confidence score.
    3. **audit**     — Adversarial checks on simulation quality (Vex pattern).
    4. **decide**    — Final go/no-go logic with configurable gates (Elira pattern).
    5. **execute**   — Take action only if decision is approved.

    Example::

        from askelira import Orchestrator
        from my_agents import ResAgent, SimAgent, AuditAgent, DecideAgent, ExecAgent

        orch = Orchestrator({
            "research": ResAgent(),
            "simulate": SimAgent(),
            "audit":    AuditAgent(),
            "decide":   DecideAgent(),
            "execute":  ExecAgent(),
        })

        result = orch.run(query="Will X happen before Y date?")
    """

    REQUIRED_AGENTS = ("research", "simulate", "audit", "decide", "execute")

    def __init__(self, agents: Dict[str, BaseAgent]):
        """
        Args:
            agents: Dict keyed by role name. Must include all 5 roles:
                    ``research``, ``simulate``, ``audit``, ``decide``, ``execute``.

        Raises:
            ValueError: If any required agent role is missing.
        """
        for role in self.REQUIRED_AGENTS:
            if role not in agents:
                raise ValueError(f"Missing required agent role: '{role}'")
        self.agents = agents
        self.state: Dict[str, Any] = {}

    def run(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Execute the full 5-agent pipeline for *query*.

        Pipeline stops early if research, simulation, or decision fails.
        Execute is skipped when the decision agent does not approve.

        Args:
            query:    The question or task to process.
            **kwargs: Forwarded to each agent's ``run()`` call.

        Returns:
            Dict with keys: ``success``, ``query``, ``pipeline`` (per-agent
            reports), ``final_decision``, ``executed``.
        """
        log.info("=" * 60)
        log.info("ASKELIRA PIPELINE START")
        log.info(f"Query: {query}")
        log.info("=" * 60)

        # Phase 1: Research
        research = self.agents["research"].run(query=query, **kwargs)
        self.state["research"] = research
        if not research["success"]:
            return self._fail("Research failed", research)

        # Phase 2: Simulate
        simulate = self.agents["simulate"].run(
            seed=research["data"].get("seed") if research["data"] else None,
            **kwargs,
        )
        self.state["simulate"] = simulate
        if not simulate["success"]:
            return self._fail("Simulation failed", simulate)

        # Phase 3: Audit (non-blocking — warnings are surfaced to decide)
        audit = self.agents["audit"].run(
            research=research, simulation=simulate, **kwargs
        )
        self.state["audit"] = audit

        # Phase 4: Decide
        decide = self.agents["decide"].run(
            research=research, simulation=simulate, audit=audit, **kwargs
        )
        self.state["decide"] = decide
        if not decide["success"]:
            return self._fail("Decision failed", decide)

        # Phase 5: Execute (only if approved)
        approved = (decide["data"] or {}).get("approved", False)
        if approved:
            execute = self.agents["execute"].run(decision=decide, **kwargs)
        else:
            log.warning("Decision NOT approved — skipping execution phase")
            execute = {"success": False, "data": None, "error": "Not approved"}
        self.state["execute"] = execute

        log.info("=" * 60)
        log.info(f"PIPELINE COMPLETE | approved={approved} executed={execute.get('success')}")
        log.info("=" * 60)

        return {
            "success": decide["success"],
            "query": query,
            "pipeline": self.state,
            "final_decision": decide["data"],
            "executed": execute.get("success", False),
        }

    def _fail(self, reason: str, result: Dict) -> Dict:
        """Return a standardised failure dict and log the error."""
        log.error(f"Pipeline failed at '{result.get('agent')}': {reason}")
        return {
            "success": False,
            "error": reason,
            "failed_at": result.get("agent"),
            "pipeline": self.state,
        }
