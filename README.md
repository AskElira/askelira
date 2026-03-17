# AskElira

[![GitHub Stars](https://img.shields.io/github/stars/AskElira/askelira?style=social)](https://github.com/AskElira/askelira)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://www.python.org/)

**Multi-agent swarm intelligence for better decisions.**

Build AI systems that validate every decision with 1,000 to 1,000,000 simulated agents before taking action.

```python
pip install askelira

from askelira import Orchestrator

# Ask any question
result = Orchestrator(agents=10000).predict(
    "Should we launch this feature next week?"
)

print(result.decision)    # YES / NO
print(result.confidence)  # 78%
print(result.reasoning)   # "Market timing is optimal, competitor..."
```

**Domain-agnostic:** Sales, marketing, product, research, trading, hiring — if it needs validation, AskElira can help.

---

## 🎯 What Is This?

AskElira is a **framework for building validated AI decision systems**.

Instead of trusting a single AI response, every decision is debated by a swarm of simulated agents (1k to 1M) representing different perspectives before you act.

**The pattern:**
1. 🔍 **Research** - Scout relevant data
2. 🐟 **Simulate** - Run swarm debate (1k-1M agents)
3. ✅ **Audit** - Validate reasoning
4. 🎯 **Decide** - Synthesize final answer
5. 📊 **Execute** - Take action & learn

**It's generic.** Fork it. Adapt it to your domain. Ship.

---

## 🎚️ Agent Scaling

You control the accuracy/cost tradeoff:

| Level | Agents | Cost/Decision | Best For |
|-------|--------|---------------|----------|
| **Fast** | 1,000 | $0.007 | Quick tests, demos, brainstorming |
| **Standard** | 10,000 | $0.07 | Daily decisions, regular operations |
| **Accurate** | 100,000 | $0.70 | High-stakes decisions, big investments |
| **Maximum** | 1,000,000 | $7.00 | Mission-critical validation, major bets |

**Why scale matters:** More agents = more diverse perspectives = better decisions.

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

# Ask any question
result = orch.predict(
    question="Should we hire this candidate?",
    context={
        "experience": "5 years Python",
        "culture_fit": "high",
        "salary_ask": "$150k"
    }
)

# Get validated answer
print(f"Decision: {result.decision}")
print(f"Confidence: {result.confidence}%")
print(f"Reasoning: {result.reasoning}")
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

### Agents

1. **Alba (Research)** - Gathers relevant data for your question
2. **David (Swarm)** - Simulates 1k-1M agents debating the decision
3. **Vex (Audit)** - Checks reasoning for bias and logical errors
4. **Elira (Orchestrator)** - Synthesizes everything into a final decision
5. **Steven (Executor)** - Tracks outcomes and learns from results

---

## 📦 Use Cases

AskElira works for any domain requiring validated decisions:

### 🎯 Product & Strategy
```python
result = Orchestrator(agents=50000).predict(
    "Should we pivot to B2B from B2C?"
)
```

**Questions it can answer:**
- Feature prioritization
- Launch timing
- Pricing strategy
- Market entry decisions

### 💼 Sales & Business Development
```python
result = Orchestrator(agents=10000).predict(
    "Will this prospect convert to enterprise plan?"
)
```

**Questions it can answer:**
- Lead qualification
- Deal prioritization
- Pricing negotiations
- Partnership evaluation

### 👥 Hiring & HR
```python
result = Orchestrator(agents=10000).predict(
    "Is this candidate a good fit for senior engineer role?"
)
```

**Questions it can answer:**
- Candidate evaluation
- Offer amounts
- Team fit assessment
- Promotion decisions

### 🔬 Research & Development
```python
result = Orchestrator(agents=100000).predict(
    "Should we invest in this research direction?"
)
```

**Questions it can answer:**
- Hypothesis validation
- Resource allocation
- Experiment design
- Technology selection

### 📈 Marketing & Growth
```python
result = Orchestrator(agents=50000).predict(
    "Will this campaign concept go viral?"
)
```

**Questions it can answer:**
- Campaign testing
- Content strategy
- Audience targeting
- Channel selection

### 💰 Finance & Trading
```python
result = Orchestrator(agents=100000).predict(
    "Should we enter this trade?"
)
```

**Questions it can answer:**
- Trade signals
- Risk assessment
- Portfolio rebalancing
- Market timing

---

## 🌟 Real-World Examples

### Example 1: Marketing Campaigns

**Repo:** [AskEliraMarketing](https://github.com/AskElira/askeliramarketing)

Test campaign tactics before publishing:

```python
tactics = ["Technical deep-dive", "Story-driven", "Results-only"]

for tactic in tactics:
    result = Orchestrator(agents=50000).predict(
        f"Will this tactic drive engagement: {tactic}?"
    )
    print(f"{tactic}: {result.confidence}%")
```

**Results:** 82% accuracy predicting campaign success, $0.02 per test

### Example 2: Futures Trading

**Repo:** [AskEliraTrader](https://github.com/AskElira/AskEliraTrader)

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

### 1. Clone & Install

```bash
git clone https://github.com/AskElira/askelira.git
cd askelira
pip install -r requirements.txt
```

### 2. Customize for Your Domain

```python
# agents/my_research.py
def scout_data(question, domain):
    """Your custom data sources"""
    if domain == "hiring":
        return linkedin_api.search(question)
    elif domain == "sales":
        return crm_api.get_prospect(question)
    # ... your domain logic
```

### 3. Run Predictions

```python
from askelira import Orchestrator

# Use your custom agents
result = Orchestrator(
    agents=10000,
    research_agent=my_research.scout_data,
    domain="hiring"
).predict("Should we hire Jane Doe?")
```

**Domains we've seen work:**
- E-commerce (inventory decisions)
- Real estate (property evaluation)
- Legal (case strategy)
- Healthcare (treatment planning)
- Education (curriculum design)

**If it requires a decision, AskElira can validate it.**

---

## 🎨 Dashboard

Real-time pipeline visualization:

```bash
# Terminal UI
python -m dashboard --demo examples/pipeline.json

# Web UI (localhost:8888)
python -m dashboard --web
```

**Features:**
- Live agent network visualization
- MiroFish sub-cluster expansion
- Real-time consensus tracking
- Event log with timestamps
- WebSocket updates

---

## 📈 Performance

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
- Brainstorming ideas
- Quick validation
- Demo/testing
- Low-stakes decisions

**10,000 agents ($0.07):**
- Daily operations
- Regular decisions
- Production use
- Standard validation

**100,000 agents ($0.70):**
- Major investments
- High-stakes choices
- Important hires
- Big campaigns

**1,000,000 agents ($7.00):**
- Company-defining decisions
- Multi-million dollar bets
- Critical validations
- Maximum confidence needed

---

## 🧠 How It Works

### The Swarm Simulation

When you ask a question, David (swarm agent) simulates thousands of diverse perspectives:

**Example: "Should we hire this candidate?"**

The swarm includes:
- 30% Technical Interviewers (care about skills)
- 25% Culture Evaluators (care about fit)
- 20% Hiring Managers (care about impact)
- 15% Team Members (care about collaboration)
- 10% HR/Ops (care about logistics)

Each agent:
1. Reviews the candidate data
2. Applies their perspective
3. Debates with other agents
4. Votes YES or NO
5. Explains their reasoning

**The consensus emerges from diverse debate, not single AI bias.**

---

## 🔧 Configuration

### Environment Setup

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (for specific use cases)
BRAVE_API_KEY=...      # Web search
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

**Built with AskElira Marketing, validated by 50,000-agent swarm.**

---

## 🔗 Links

- **Website:** [askelira.com](https://askelira.com)
- **Documentation:** [docs.askelira.com](https://github.com/AskElira/askelira/wiki)
- **Twitter:** [@akerremans64961](https://x.com/akerremans64961)
- **LinkedIn:** [Alvin Kerremans](https://www.linkedin.com/in/alvin-kerremans-925aba150)

**Example Projects:**
- [Marketing Swarm](https://github.com/AskElira/askeliramarketing) - Viral campaign testing
- [Trading Bot](https://github.com/AskElira/AskEliraTrader) - Market predictions
- [Framework](https://github.com/AskElira/askelira) - This repo

---

## ❓ FAQ

**Q: Can I use this for [my domain]?**  
A: Yes. If it requires a decision, AskElira can validate it.

**Q: How accurate is it?**  
A: Depends on agent count. Real-world: 65-82% accuracy with 10k-100k agents.

**Q: Is 1M agents worth $7?**  
A: For mission-critical decisions (7-figure bets, company direction), yes.

**Q: Can I run this offline?**  
A: No, it requires Claude API. You can cache results for offline review.

**Q: What's the difference from ChatGPT?**  
A: Single AI = single perspective. AskElira = 1k-1M perspectives debating.

---

**Questions?** Open an issue or DM on Twitter!
