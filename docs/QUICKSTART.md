# Quick Start Guide

## 1. Install

```bash
git clone https://github.com/jellyforex/askelira
cd askelira
pip install -e .
```

Or via PyPI:

```bash
pip install askelira
```

## 2. Configure

```bash
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY at minimum
```

## 3. Run the Examples

```bash
# Trader example (~45 lines)
python examples/trader/trader_research_agent.py

# Marketing example (~45 lines)
python examples/marketing/marketing_research_agent.py
```

Expected output:
```
askelira.TraderResearchAgent | [TraderResearchAgent] Starting execution
askelira.TraderResearchAgent | [TraderResearchAgent] Completed: success=True

=== AGENT REPORT ===
Agent:    TraderResearchAgent
Success:  True
Duration: 0.00s
Seed preview: MARKET QUESTION: Will the Fed cut rates in May 2026?...
```

---

## 4. Build Your Own

### Step 1 — Create your agents

```python
from askelira.agents.base_agent import BaseAgent

class MyResearchAgent(BaseAgent):
    def execute(self, query: str, **kwargs):
        # Gather data, return seed for MiroFish
        return {
            "success": True,
            "data": {
                "seed": f"Predict: {query}. Provide probability for YES.",
                # ... your domain data
            },
            "error": None,
        }

class MySimulateAgent(BaseAgent):
    def execute(self, seed: str, **kwargs):
        from askelira.utils.mirofish_client import MiroFishClient
        from pathlib import Path

        # Write seed to temp file, run MiroFish
        client = MiroFishClient()
        seed_path = Path("/tmp/seed.txt")
        seed_path.write_text(seed)
        sim_id, report_id, markdown = client.full_run(
            seed_txt_path=seed_path,
            simulation_requirement=seed,
            project_name="my-project",
        )
        confidence, direction = 0.72, "YES"  # parse from markdown
        return {
            "success": True,
            "data": {"confidence": confidence, "direction": direction},
            "error": None,
        }

# ... implement AuditAgent, DecideAgent, ExecuteAgent similarly
```

### Step 2 — Wire into Orchestrator

```python
from askelira.orchestrator import Orchestrator

orch = Orchestrator(agents={
    "research": MyResearchAgent(),
    "simulate": MySimulateAgent(),
    "audit":    MyAuditAgent(),
    "decide":   MyDecideAgent(),
    "execute":  MyExecuteAgent(),
})

result = orch.run(query="Will X happen before Y?")
print(result["final_decision"])
```

### Step 3 — Start MiroFish (for real simulations)

```bash
# Install Docker, then:
git clone https://github.com/Shanda-Group/MiroFish
cd MiroFish
docker-compose up
# MiroFish now running at http://localhost:5001
```

---

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md) — 5-agent pattern deep dive
- See full trader implementation: [askeliratrader](https://github.com/jellyforex/askeliratrader)
- See full marketing implementation: [askeliramarketing](https://github.com/jellyforex/askeliramarketing)
