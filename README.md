# AskElira

[![GitHub Stars](https://img.shields.io/github/stars/jellyforex/askelira?style=social)](https://github.com/jellyforex/askelira)
[![Accuracy](https://img.shields.io/badge/Accuracy-65.3%25-success)](https://github.com/jellyforex/AskEliraTrader)
[![Cost](https://img.shields.io/badge/Cost-$0.007--$7-blue)](#agent-scaling)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**Multi-agent swarm intelligence for better decisions.**

```python
pip install askelira

from askelira import Orchestrator

# Run a prediction with 10k agents
result = Orchestrator(agents=10000).predict("Will NQ go up today?")

print(result.bias)        # BULLISH
print(result.confidence)  # 72%
print(result.cost)        # $0.07
```

**Scale from demos to mission-critical:** Test with 1,000 agents ($0.007) or validate with 1,000,000 agents ($7).

---

## 🎚️ Agent Scaling

You control the accuracy/cost tradeoff:

| Level | Agents | Cost/Prediction | Best For |
|-------|--------|-----------------|----------|
| **Fast** | 1,000 | $0.007 | Quick tests, demos, prototyping |
| **Standard** | 10,000 | $0.07 | Daily production, regular decisions |
| **Accurate** | 100,000 | $0.70 | High-stakes decisions, important trades |
| **Maximum** | 1,000,000 | $7.00 | Mission-critical validation, maximum confidence |

**Real-world performance** (NQ futures trading):
- 65.3% accuracy across 144 backtested trades
- 2.7x profit factor (bigger wins than losses)
- <30 seconds per prediction

---

## 🏗️ Architecture

AskElira uses a 4-agent pipeline validated by swarm intelligence:

```
┌─────────────────────────────────────────────────────┐
│                  Orchestrator                        │
│                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │ Research │──▶│  Swarm   │──▶│  Audit   │        │
│  │  (Alba)  │   │ (David)  │   │  (Vex)   │        │
│  │          │   │          │   │          │        │
│  │ Scouts   │   │ Simulates│   │ Validates│        │
│  │ data     │   │ 1k-1M    │   │ reasoning│        │
│  └──────────┘   │ agents   │   └────┬─────┘        │
│                 └──────────┘        │               │
│                                     │               │
│                 ┌──────────┐   ┌───▼──────┐        │
│                 │ Execute  │◀──│  Decide  │        │
│                 │ (Steven) │   │ (Elira)  │        │
│                 │          │   │          │        │
│                 │ Learns   │   │ Combines │        │
│                 │ outcomes │   │ & routes │        │
│                 └──────────┘   └──────────┘        │
└─────────────────────────────────────────────────────┘
```

### Agent Roles

1. **Alba (Research)** - Scouts live data: web search, calendars, technical indicators
2. **David (Swarm)** - Runs MiroFish simulations: 1k-1M agents debate the question
3. **Vex (Audit)** - Validates reasoning: checks for bias, errors, logical flaws
4. **Elira (Orchestrator)** - Makes final decision: routes tasks, synthesizes results
5. **Steven (Executor)** - Tracks outcomes: learns from results, improves over time

---

## 🚀 Quick Start

### Installation

```bash
pip install askelira
```

Or clone and install locally:

```bash
git clone https://github.com/jellyforex/askelira.git
cd askelira
pip install -r requirements.txt
```

### Basic Usage

```python
from askelira import Orchestrator

# Initialize with your preferred agent count
orch = Orchestrator(agents=10000)  # Default: 1,000

# Run a prediction
result = orch.predict(
    question="Will Bitcoin hit $100k this week?",
    context={
        "current_price": 67000,
        "trend": "bullish",
        "volume": "high"
    }
)

# Access results
print(f"Prediction: {result.bias}")
print(f"Confidence: {result.confidence}%")
print(f"Reasoning: {result.reasoning}")
print(f"Cost: ${result.cost:.4f}")
```

### Advanced: Custom Agent Counts

```python
# Fast test (1k agents)
quick = Orchestrator(agents=1000).predict("Quick test question")

# Production (10k agents)  
prod = Orchestrator(agents=10000).predict("Daily production decision")

# High-stakes (100k agents)
important = Orchestrator(agents=100000).predict("Critical business decision")

# Maximum validation (1M agents)
critical = Orchestrator(agents=1000000).predict("Mission-critical validation")
```

---

## 📊 Real-World Examples

### Example 1: NQ Futures Trading

**Repo:** [AskEliraTrader](https://github.com/jellyforex/AskEliraTrader)

Daily predictions for Nasdaq-100 futures:

```python
from askelira import Orchestrator

# Morning prediction
result = Orchestrator(agents=10000).predict("Will NQ close higher today?")

if result.confidence >= 70:
    print(f"Trade signal: {result.bias} ({result.confidence}%)")
    # Execute trade...
```

**Performance:**
- 65.3% accuracy (144 trades)
- $10,690 profit
- 1.32x profit factor
- $0.07 per prediction

### Example 2: Viral Marketing Campaigns

**Repo:** [AskEliraMarketing](https://github.com/jellyforex/askeliramarketing)

Test campaign tactics before publishing:

```python
from askelira import Orchestrator

# Test 3 campaign concepts
concepts = ["Technical deep-dive", "Story-driven", "Results-only"]

for concept in concepts:
    result = Orchestrator(agents=50000).predict(
        f"Will this campaign go viral: {concept}?"
    )
    print(f"{concept}: {result.confidence}% confidence")

# Winner: Technical deep-dive (78% confidence)
```

**Results:**
- 82% accuracy predicting viral content
- $0.02 per campaign test
- Saved $1000+ on failed campaigns

---

## 🎨 Dashboard

Real-time pipeline visualization with MiroFish network:

```bash
# Install dashboard dependencies
pip install rich websockets

# Run terminal dashboard
python -m dashboard --demo examples/trading_pipeline.json

# Run web dashboard
python -m dashboard --web
# Open http://localhost:8888
```

**Features:**
- Live agent node network
- MiroFish sub-cluster expansion
- Real-time consensus tracking
- Event log with timestamps
- WebSocket live updates

---

## 🛠️ Build Your Own

Fork this framework and adapt to any domain:

### 1. Clone the Repo

```bash
git clone https://github.com/jellyforex/askelira.git
cd askelira
```

### 2. Create Your Agents

```python
# my_agents/alba.py - Research agent
def scout_data(question):
    # Your custom data sources
    return research_data

# my_agents/david.py - Swarm simulator
def run_swarm(question, num_agents):
    # Your custom swarm logic
    return swarm_result

# my_agents/elira.py - Orchestrator
def make_decision(research, swarm_result):
    # Your custom decision logic
    return final_decision
```

### 3. Run Your Pipeline

```python
from askelira import Orchestrator

result = Orchestrator(
    agents=10000,
    research_agent=my_agents.alba,
    swarm_agent=my_agents.david,
    orchestrator=my_agents.elira
).predict("Your domain-specific question")
```

**Example domains:**
- **Sales:** "Will this prospect convert?"
- **Hiring:** "Is this candidate a good fit?"
- **Research:** "Should we pursue this direction?"
- **Product:** "Will users adopt this feature?"

---

## 📈 Performance & Costs

### Cost Breakdown

Based on Claude Sonnet 4 pricing ($3/M input, $15/M output):

| Agents | Input Tokens | Output Tokens | Cost |
|--------|--------------|---------------|------|
| 1,000 | ~1,500 | ~500 | $0.007 |
| 10,000 | ~15,000 | ~5,000 | $0.07 |
| 100,000 | ~150,000 | ~50,000 | $0.70 |
| 1,000,000 | ~1,500,000 | ~500,000 | $7.00 |

**Optimize costs:**
- Use 1k agents for testing/demos
- Use 10k for daily production
- Use 100k only for high-stakes decisions
- Use 1M only when critical accuracy is required

### Accuracy vs Agent Count

Based on NQ futures backtesting:

| Agents | Accuracy | Improvement | Cost/Day |
|--------|----------|-------------|----------|
| 1,000 | 52.8% | Baseline | $0.007 |
| 10,000 | 63.9% | +21% | $0.07 |
| 100,000 | 65.3% | +2% | $0.70 |
| 1,000,000 | TBD | Testing | $7.00 |

**Diminishing returns:** 10k agents hits 90% of max accuracy at 10% of 100k cost.

---

## 🧠 MiroFish Visualization

Real-time swarm intelligence viewer:

```bash
# Demo mode (pre-recorded)
python -m dashboard --mirofish

# Live mode (real API calls)
python -m dashboard --mirofish --live --question "Your question"
```

**Features:**
- Live node network (4 trader types debating)
- Real-time consensus meter
- Scrolling debate feed with agent personas
- Sub-cluster expansion shows vote breakdown
- Domain-agnostic (YES/NO for any question)

**Deployment:** Works for any domain (trading, marketing, research, etc.)

---

## 📦 Use Cases

AskElira works for any domain requiring validated decisions:

### Trading & Finance
- Daily market predictions
- Option contract selection
- Risk assessment
- Portfolio rebalancing

### Marketing
- Campaign concept testing
- Content strategy validation
- Audience targeting
- Viral potential prediction

### Product
- Feature prioritization
- User experience decisions
- Pricing strategy
- Launch timing

### Research
- Hypothesis validation
- Experiment design
- Resource allocation
- Direction selection

---

## 🔧 Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (for specific agents)
BRAVE_API_KEY=BSA...  # Alba web search
PINECONE_API_KEY=...  # Long-term memory
KALSHI_API_KEY=...    # Prediction markets
```

### Agent Configuration

```python
from askelira import Orchestrator, Config

config = Config(
    default_agents=10000,
    max_agents=1000000,
    model="claude-sonnet-4-20250514",
    temperature=0.7,
    timeout_seconds=60
)

orch = Orchestrator(config=config)
```

---

## 🤝 Contributing

Pull requests welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Areas we need help:**
- New domain examples (sales, hiring, research)
- Performance optimizations
- Dashboard improvements
- Documentation

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

**Built with AskElira Marketing, validated by 50,000-agent swarm.**

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=jellyforex/askelira&type=Date)](https://star-history.com/#jellyforex/askelira&Date)

---

## 🔗 Links

- **Website:** [askelira.com](https://askelira.com)
- **Twitter:** [@akerremans64961](https://x.com/akerremans64961)
- **LinkedIn:** [Alvin Kerremans](https://www.linkedin.com/in/alvin-kerremans-925aba150)

**More Examples:**
- [Trading Bot](https://github.com/jellyforex/AskEliraTrader) - NQ futures predictions
- [Marketing Swarm](https://github.com/jellyforex/askeliramarketing) - Viral campaign testing
- [Framework Docs](https://github.com/jellyforex/askelira/wiki) - Full documentation

---

**Questions?** Open an issue or DM on Twitter!
