# AskElira Architecture

## Overview

AskElira is a **multi-agent orchestration platform** where decisions are validated
by a 1000-agent swarm before any action is taken.

---

## Core Concepts

### 1. The 5-Agent Pattern

Every AskElira application follows this linear pipeline:

```
Research → Simulate → Audit → Decide → Execute
```

| Role | Responsibility | Pattern agent |
|---|---|---|
| **Research** | Gather data, qualify opportunity, build seed | Alba |
| **Simulate** | Run MiroFish swarm, get confidence score | David |
| **Audit** | Adversarial checks on simulation quality | Vex |
| **Decide** | Multi-gate go/no-go, tier assignment | Elira/Orb |
| **Execute** | Take action (trade, post, send) | Steven/Scribe |

The pipeline stops early if research, simulation, or decision fails.
Execute is skipped when the decision gate does not approve.

---

### 2. Agent Lifecycle

All agents inherit from `BaseAgent` and follow 4 phases:

```
initialize → execute → validate → report
```

```python
class BaseAgent(ABC):
    def run(self, **kwargs) -> Dict:
        result = self.execute(**kwargs)   # override this
        self.validate(result)             # optional override
        return self.report(result)        # timing + cost metadata
```

The `run()` wrapper catches exceptions and returns a failed report,
so the orchestrator always gets a structured response.

---

### 3. MiroFish Swarm

MiroFish ([github.com/Shanda-Group/MiroFish](https://github.com/Shanda-Group/MiroFish)):

- Self-hosted via Docker Compose — **free**, no API cost
- Spawns 1000+ AI agents with diverse personas (retail, analysts, media, etc.)
- Each agent "reads" the seed, forms an opinion, and votes
- Aggregates reasoning → confidence score (e.g. 72% YES)
- Used by both trader (market predictions) and marketing (tactic confidence)

The `MiroFishClient` in `askelira/utils/mirofish_client.py` wraps the 3-phase HTTP API:

```
A. upload_seed_and_build_graph() → graph_id, project_id
B. run_simulation()              → simulation_id
C. generate_and_fetch_report()   → markdown report
```

---

### 4. Decision Gates (Elira Pattern)

The Decide agent implements configurable validation gates before approving execution:

```python
# Example from askeliratrader (Agents/elira.py):
gates = [
    confidence >= 0.60,           # Gate 1: Simulation confidence
    vex_verdict != "FAIL",        # Gate 2: Audit passed
    calendar_verdict == "CLEAR",  # Gate 3: No blocking events
    liquidity >= 500,             # Gate 4: Sufficient liquidity
    not override_risk,            # Gate 5: No single-actor risk
    uncertainty != "HIGH",        # Gate 6: Alba uncertainty check
]
approved = all(gates)
```

All gates must pass. Failed gates are logged with reasons.

---

### 5. Research Seed Format

The seed is a plain-text file consumed by MiroFish. Structure from askeliratrader:

```
---BEGIN SEED FILE---
MARKET QUESTION: Will X happen before Y?
RESOLUTION DATE: 2026-04-01
CURRENT YES PRICE: 45%

SOURCE 1: https://example.com/article
SUMMARY: Key facts from source
DATE: 2026-03-14
TYPE: News

KEY FACTS SUPPORTING YES:
- Fact 1
- Fact 2

KEY FACTS SUPPORTING NO:
- Fact 1

CURRENT SENTIMENT: Contested
MAIN UNCERTAINTY: What could flip this
---END SEED FILE---
```

---

## Extending the Framework

### Create a Domain-Specific Agent

```python
from askelira.agents.base_agent import BaseAgent

class MySalesAgent(BaseAgent):
    def execute(self, lead: str, **kwargs):
        score = self._qualify_lead(lead)
        return {
            "success": score > 0.5,
            "data": {"lead": lead, "score": score, "seed": f"Will {lead} convert?"},
            "error": None,
        }

    def _qualify_lead(self, lead: str) -> float:
        # your domain logic
        return 0.75
```

### Build a New Use Case

1. Copy `examples/trader/` → `examples/yourapp/`
2. Implement all 5 agent classes
3. Wire into `Orchestrator`
4. Add domain-specific keys to `.env`

---

## Full Implementations

- **Trading:** [github.com/jellyforex/askeliratrader](https://github.com/jellyforex/askeliratrader)
- **Marketing:** [github.com/jellyforex/askeliramarketing](https://github.com/jellyforex/askeliramarketing)
