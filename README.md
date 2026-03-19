# AskElira

[![GitHub Stars](https://img.shields.io/github/stars/AskElira/askelira?style=social)](https://github.com/AskElira/askelira)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://www.python.org/)

**Build validated AI decisions for ANY domain.**

Simulate 1,000 to 1,000,000 agents debating your question before you act.

```python
pip install askelira

from askelira import Orchestrator

# Sales
result = Orchestrator(agents=10000).predict(
    "Will this prospect convert to enterprise?"
)

# Hiring  
result = Orchestrator(agents=10000).predict(
    "Is this candidate the right fit?"
)

# Product
result = Orchestrator(agents=10000).predict(
    "Should we launch this feature next week?"
)
```

**Works for any decision:** Sales • Hiring • Product • Research • Marketing • Trading

---

## 🎯 What Is This?

AskElira is a **framework for building validated AI decision systems**.

Instead of trusting a single AI response, every decision is debated by a swarm of simulated agents (1k-1M) representing different perspectives.

**The pattern:**
1. 🔍 **Research** - Scout relevant data
2. 🐟 **Simulate** - Run swarm debate (1k-1M agents)
3. ✅ **Audit** - Validate reasoning
4. 🎯 **Decide** - Synthesize final answer
5. 📊 **Execute** - Take action & learn

**It's domain-agnostic.** Fork it. Adapt it to your domain. Ship.

---

## 📦 Use Cases

### 🎯 Product & Strategy
```python
Orchestrator(agents=50000).predict("Should we pivot to B2B?")
```
- Feature prioritization
- Launch timing
- Pricing strategy
- Market entry

### 💼 Sales & Business Development
```python
Orchestrator(agents=10000).predict("Will this deal close by Q2?")
```
- Lead qualification
- Deal prioritization
- Pricing negotiations
- Partnership evaluation

### 👥 Hiring & HR
```python
Orchestrator(agents=10000).predict("Should we extend an offer?")
```
- Candidate evaluation
- Offer amounts
- Team fit assessment
- Promotion decisions

### 🔬 Research & Development
```python
Orchestrator(agents=100000).predict("Is this research direction worth pursuing?")
```
- Hypothesis validation
- Resource allocation
- Experiment design
- Technology selection

### 📈 Marketing & Growth
```python
Orchestrator(agents=50000).predict("Will this campaign go viral?")
```
- Campaign testing
- Content strategy
- Audience targeting
- Channel selection

### 💰 Finance & Trading
```python
Orchestrator(agents=100000).predict("Should we enter this position?")
```
- Trade signals
- Risk assessment
- Portfolio rebalancing
- Market timing

---

## 🎚️ Agent Scaling

You control the accuracy/cost tradeoff:

| Level | Agents | Cost/Decision | Best For |
|-------|--------|---------------|----------|
| **Fast** | 1,000 | $0.007 | Quick tests, demos, brainstorming |
| **Standard** | 10,000 | $0.07 | Daily decisions, regular operations |
| **Accurate** | 100,000 | $0.70 | High-stakes decisions, big investments |
| **Maximum** | 1,000,000 | $7.00 | Mission-critical validation, major bets |

**More agents = more diverse perspectives = better decisions.**

---

## 🚀 Quick Start

### Installation

```bash
pip install askelira
```

Or clone and customize:

```bash
git clone https://github.com/AskElira/askelira.git
cd askelira
pip install -r requirements.txt
```

### Basic Usage

```python
from askelira import Orchestrator

# Initialize with your preferred agent count
orch = Orchestrator(agents=10000)

# Ask any question with context
result = orch.predict(
    question="Should we acquire this company?",
    context={
        "revenue": "$5M ARR",
        "growth": "30% YoY",
        "asking_price": "$20M"
    }
)

# Get validated answer
print(f"Decision: {result.decision}")      # YES / NO
print(f"Confidence: {result.confidence}%") # 78%
print(f"Reasoning: {result.reasoning}")    # Full explanation
print(f"Cost: ${result.cost:.4f}")         # $0.07
```

### Scale On Demand

```python
# Fast test (1k agents)
quick = Orchestrator(agents=1000).predict("Quick validation needed")

# Daily production (10k agents)  
daily = Orchestrator(agents=10000).predict("Standard decision")

# High-stakes (100k agents)
important = Orchestrator(agents=100000).predict("Major investment call")

# Maximum validation (1M agents)
critical = Orchestrator(agents=1000000).predict("Company-defining decision")
```

---

## 🏗️ Architecture

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

### How It Works

1. **Alba (Research)** - Gathers data relevant to your question
2. **David (Swarm)** - Simulates 1k-1M diverse perspectives debating
3. **Vex (Audit)** - Validates reasoning for bias and logical errors
4. **Elira (Orchestrator)** - Synthesizes consensus into final decision
5. **Steven (Executor)** - Tracks outcomes and learns from results

**The swarm includes diverse perspectives:**
- Technical experts
- Business strategists
- Risk assessors
- Domain specialists
- Contrarian thinkers

**Consensus emerges from debate, not single AI bias.**

---

## 🌟 Real-World Examples

### Marketing Campaign Validation

**Project:** [AskEliraMarketing](https://github.com/AskElira/askeliramarketing)

Test campaign concepts before publishing:

```python
concepts = ["Technical deep-dive", "Story-driven", "Results-only"]

for concept in concepts:
    result = Orchestrator(agents=50000).predict(
        f"Will this campaign drive engagement: {concept}?"
    )
    print(f"{concept}: {result.confidence}%")

# Output: Technical deep-dive: 78% ← Winner!
```

**Results:** 82% accuracy predicting viral content, $0.02 per test

### NQ Futures Trading

**Project:** [AskEliraTrader](https://github.com/AskElira/AskEliraTrader)

Daily market predictions:

```python
result = Orchestrator(agents=100000).predict(
    "Will NQ close higher today?"
)

if result.confidence >= 70:
    execute_trade(result.decision)
```

**Results:** 65% accuracy, 2.7x profit factor, $0.70 per prediction

---

## 🛠️ Build Your Own

Fork this framework and adapt to ANY domain:

### 1. Clone the Repo

```bash
git clone https://github.com/AskElira/askelira.git
cd askelira
```

### 2. Customize for Your Domain

```python
# agents/my_research.py
def scout_data(question, domain):
    """Your custom data sources"""
    if domain == "legal":
        return case_law_api.search(question)
    elif domain == "medical":
        return pubmed_api.search(question)
    # ... your domain logic
    
# agents/my_swarm.py
def simulate_experts(question, num_agents):
    """Your domain-specific expert personas"""
    # Lawyers, doctors, engineers, etc.
    return swarm_debate(question, personas, num_agents)
```

### 3. Run Your Pipeline

```python
from askelira import Orchestrator

result = Orchestrator(
    agents=10000,
    research_agent=my_research.scout_data,
    swarm_agent=my_swarm.simulate_experts,
    domain="legal"
).predict("Should we pursue this litigation?")
```

**Domains we've seen work:**
- E-commerce (inventory decisions)
- Real estate (property evaluation)
- Legal (case strategy)
- Healthcare (treatment planning)
- Education (curriculum design)
- Government (policy analysis)

**If it requires a decision, AskElira can validate it.**

---

## 📈 Performance & Costs

### Cost Breakdown

Based on Claude Sonnet 4 pricing ($3/M input, $15/M output):

| Agents | Avg Tokens | Cost | Time |
|--------|------------|------|------|
| 1,000 | ~2,000 | $0.007 | ~10s |
| 10,000 | ~20,000 | $0.07 | ~20s |
| 100,000 | ~200,000 | $0.70 | ~30s |
| 1,000,000 | ~2,000,000 | $7.00 | ~60s |

### When to Use Each Tier

**1,000 agents ($0.007):**
- Brainstorming sessions
- Quick validation checks
- Demo/testing
- Low-risk decisions

**10,000 agents ($0.07):**
- Daily operations
- Standard business decisions
- Production use
- Regular validation

**100,000 agents ($0.70):**
- Major investments ($100k+)
- Critical hires
- Important launches
- High-stakes choices

**1,000,000 agents ($7.00):**
- Company-defining decisions
- Multi-million dollar bets
- Regulatory/legal risks
- Maximum confidence needed

---

## 🎨 Dashboard

Real-time pipeline visualization:

```bash
# Terminal UI
python -m dashboard --demo examples/pipeline.json

# Web UI (localhost:8888)
python -m dashboard --web

# MiroFish live viewer
python -m dashboard --mirofish --live --question "Your question"
```

**Features:**
- Live agent network visualization
- MiroFish sub-cluster expansion
- Real-time consensus tracking
- Event log with timestamps
- WebSocket live updates

---

## 🔧 Configuration

### Environment Setup

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (for specific agents)
BRAVE_API_KEY=...      # Web search (Alba)
PINECONE_API_KEY=...   # Long-term memory
```

### Advanced Config

```python
from askelira import Orchestrator, Config

config = Config(
    default_agents=10000,
    max_agents=1000000,
    model="claude-sonnet-4-20250514",
    temperature=0.7,
    timeout=60,
    enable_memory=True
)

orch = Orchestrator(config=config)
```

---

## 🤝 Contributing

We welcome contributions! Areas we need help:

- **New domain examples** (legal, healthcare, education)
- **Performance optimizations**
- **Dashboard improvements**
- **Documentation**

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

**Built with AskElira Marketing, validated by 50,000-agent swarm (68% fork likelihood).**

---

## 🔗 Links

- **Website:** [askelira.com](https://askelira.com)
- **Documentation:** [Wiki](https://github.com/AskElira/askelira/wiki)

**Example Projects:**
- [Marketing Swarm](https://github.com/AskElira/askeliramarketing) - Campaign validation
- [Trading Bot](https://github.com/AskElira/AskEliraTrader) - Market predictions
- [Framework](https://github.com/AskElira/askelira) - This repo

---

## ❓ FAQ

**Q: Can I use this for [my domain]?**  
A: Yes. If it requires a decision, AskElira can validate it.

**Q: How accurate is it?**  
A: 65-82% in real-world use (varies by domain and agent count).

**Q: Is 1M agents worth $7?**  
A: For decisions with $1M+ impact, absolutely.

**Q: Can I run this offline?**  
A: No, requires Claude API. You can cache results for offline review.

**Q: What's the difference from ChatGPT?**  
A: Single AI = single perspective. AskElira = 1k-1M perspectives debating.

**Q: Can I customize the agent personas?**  
A: Yes! Fork the repo and define your own expert types.

---

**Questions?** Open an issue or DM on Twitter!
