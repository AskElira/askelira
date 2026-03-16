# AskElira Framework

Generic multi-agent orchestration platform with swarm intelligence validation.

**Fork this. Adapt it to your domain. Ship.**

```
Research → Simulate → Audit → Decide → Execute
```

![Dashboard](https://img.shields.io/badge/Dashboard-Live-green) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🎯 What Is This?

AskElira is a pattern for building **5-agent AI pipelines** where every decision
is validated by a 1000-agent swarm (MiroFish) before any action is taken.

**NEW:** Real-time pipeline visualization with MiroFish node network expansion!

The framework is domain-agnostic. The same pattern powers:

| Repo | Domain | What it does |
|---|---|---|
| [askeliratrader](https://github.com/jellyforex/askeliratrader) | Prediction markets | Scans Polymarket/Kalshi → simulates → trades |
| [askeliramarketing](https://github.com/jellyforex/askeliramarketing) | Viral growth | Scouts GitHub trends → simulates → generates content |
| **this repo** | _your domain_ | Fork and adapt |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Orchestrator                        │
│                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ Research │──▶│ Simulate │──▶│  Audit   │        │
│  │  Agent   │   │  Agent   │   │  Agent   │        │
│  │ (Alba ▶) │   │(MiroFish)│   │ (Vex ▶)  │        │
│  └──────────┘   └──────────┘   └────┬─────┘        │
│                                      │               │
│                 ┌──────────┐   ┌────▼─────┐        │
│                 │ Execute  │◀──│  Decide  │        │
│                 │  Agent   │   │  Agent   │        │
│                 │(Steven ▶)│   │(Elira ▶) │        │
│                 └──────────┘   └──────────┘        │
└─────────────────────────────────────────────────────┘

▶ = full implementation in askeliratrader / askeliramarketing
```

### The 4-Phase Agent Lifecycle

Every agent in the framework follows the same lifecycle:

```python
agent.run(query="...")
  │
  ├── execute()   # your logic (override this)
  ├── validate()  # quality checks
  └── report()    # timing + cost metadata
```

### MiroFish Swarm

MiroFish ([github.com/Shanda-Group/MiroFish](https://github.com/Shanda-Group/MiroFish)) runs
locally via Docker. It spawns 1000+ AI agents with diverse personas, simulates group opinion
formation, and returns a confidence score. Free to run, no API cost.

---

## 🎨 Real-Time Dashboard

**Visualize your agent pipeline as it runs:**

```bash
# Install dependencies
pip install -e .
pip install rich fastapi "uvicorn[standard]" websockets

# Run demo mode
python -m dashboard --demo examples/trading_pipeline.json
```

**Features:**
- 🖥️ Terminal UI (Rich) + Web UI (localhost:8888)
- 🔄 Real-time updates via WebSocket
- 🧠 MiroFish node expansion (see swarm clusters debate)
- 📊 Live metrics (time, cost, accuracy)
- 🎯 Works with ANY agent pipeline

**Example configs:**
- `examples/trading_pipeline.json` - Trading system (5 agents)
- `examples/marketing_pipeline.json` - Viral marketing (5 agents)
- `examples/research_pipeline.json` - Research pipeline (3 agents)

**Browser auto-opens to:** http://localhost:8888

---

## Quick Start

```bash
git clone https://github.com/jellyforex/askelira
cd askelira
pip install -e .
```

**Try the dashboard:**

```bash
python -m dashboard --demo examples/trading_pipeline.json
```

**Run the trader example:**

```bash
python examples/trader/trader_research_agent.py
```

**Run the marketing example:**

```bash
python examples/marketing/marketing_research_agent.py
```

---

## Fork and Adapt

```python
from askelira.agents.base_agent import BaseAgent
from askelira.orchestrator import Orchestrator

class MyResearchAgent(BaseAgent):
    def execute(self, query: str, **kwargs):
        # 1. Gather your domain data
        # 2. Build a MiroFish seed string
        return {
            "success": True,
            "data": {"seed": f"Predict: {query}. YES or NO?"},
            "error": None,
        }

# Wire up all 5 agents
orch = Orchestrator(agents={
    "research": MyResearchAgent(),
    "simulate": MySimulateAgent(),   # use MiroFishClient
    "audit":    MyAuditAgent(),
    "decide":   MyDecideAgent(),
    "execute":  MyExecuteAgent(),
})

result = orch.run(query="Will X happen before Y?")
```

See `docs/QUICKSTART.md` for a step-by-step guide.

---

## Full Implementations

The examples in this repo are intentionally minimal stubs.
The full domain-specific logic lives here:

- **[askeliratrader](https://github.com/jellyforex/askeliratrader)** — Prediction market trading
  - Alba (research), David (simulation), Vex (audit), Elira/Orb (decision), Steven (execution)
  - Live Polymarket + Kalshi API integration
  - 6-gate validation, 3-tier capital sizing, P&L tracking

- **[askeliramarketing](https://github.com/jellyforex/askeliramarketing)** — Viral growth campaigns
  - GitHub Scout, Trend Analyzer, Scribe, Lens, Pixel, Elira Marketing
  - Twitter/Reddit/Show HN content generation, poster/video creation

---

## Installation

```bash
pip install askelira

# With Pinecone long-term memory:
pip install askelira[memory]
```

---

## Configuration

```bash
cp .env.example .env
# Set ANTHROPIC_API_KEY (required)
# Set MIROFISH_URL if not localhost:5001
```

---

## License

MIT — see `LICENSE`.
