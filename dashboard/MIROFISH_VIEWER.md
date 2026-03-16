# MiroFish Live Viewer

Watch your swarm intelligence simulations in real-time with the MiroFish Live Viewer.

## Features

- 🔮 **Live node network** - Watch agents spawn and form clusters
- 📊 **Real-time consensus meter** - See agreement forming across the swarm
- 💬 **Scrolling debate feed** - Read agent reasoning as they vote
- 🎯 **Final result** - Get the swarm's verdict with confidence score

---

## Usage

### **Demo Mode (No MiroFish Docker required)**

Preview the visualization with simulated data:

```bash
cd ~/Desktop/askelira-framework
python3 -m dashboard --mirofish
```

**What you'll see:**
- 100 agents spawning gradually
- Clusters forming (Retail Traders, Institutional, Analysts, Media)
- Consensus building toward final result
- Live debate feed with agent reasoning

---

### **Live Mode (Requires MiroFish Docker)**

Run a real MiroFish simulation with live visualization:

```bash
# 1. Start MiroFish Docker (if not running)
cd ~/path/to/mirofish
docker-compose up -d

# 2. Run live simulation
cd ~/Desktop/askelira-framework
python3 -m dashboard --mirofish --live --question "Will NQ go up today?"
```

**What happens:**

**Phase 1: Knowledge Graph Building (~30 sec)**
- Uploads your question to MiroFish
- Builds semantic graph
- Shows nodes connecting in real-time

**Phase 2: Swarm Simulation (~1-2 min)**
- Spawns 1000 AI agents
- Each agent debates the question
- Clusters form based on reasoning patterns
- Consensus meter updates live

**Phase 3: Report Generation (~30 sec)**
- Analyzes swarm debate
- Generates final verdict
- Shows confidence score

**Final Output:**
```
✅ FINAL RESULT: BULLISH (72% confidence)
```

---

## Examples

### **Trading Decision:**
```bash
python3 -m dashboard --mirofish --live --question "Will NQ futures go up tomorrow?"
```

### **Marketing Tactic:**
```bash
python3 -m dashboard --mirofish --live --question "Will a Twitter thread about AI agents get more engagement than a LinkedIn post?"
```

### **Business Question:**
```bash
python3 -m dashboard --mirofish --live --question "Should we launch the product next month or wait for Q2?"
```

---

## Architecture

```
User Question
     ↓
MiroFish API (Docker)
     ↓
Graph Building → Simulation → Report
     ↓              ↓           ↓
Live Viewer receives events
     ↓
Terminal visualization updates in real-time
     ↓
Final Result displayed
```

**Components:**

- `mirofish_viewer.py` - Terminal UI with Rich library
- `mirofish_live.py` - MiroFish API integration
- `mirofish_client.py` - HTTP client (from Polymarket project)

---

## Visualization Elements

### **Node Network (Left Panel):**
```
🧠 Agent Network
├── 🟢 Institutional (14 agents, 71% bullish)
│   ├── Institutional #0: Volume declining...
│   ├── Quant #14: Volume declining...
│   └── Institutional #18: Fed pause likely...
├── 🟡 Analysts (37 agents, 57% bullish)
│   ├── Analyst #1: Positioning defensive...
│   └── ...
└── 🟢 Retail Traders (22 agents, 64% bullish)
```

### **Metrics (Top Right):**
```
Consensus:  ████████████░░░░░░ 59.0%
Stance:     BULLISH
Agents:     100/1000

Clusters:
  Institutional  14 (1%)
  Analysts       37 (4%)
  Retail         22 (2%)
```

### **Debate Feed (Bottom Right):**
```
🔴 Institutional #91: Positioning defensive...
🔴 Media #92: Breakout above key resistance...
🟢 Retail #93: VIX is low, market calm...
📊 Consensus updated: 62.3% BULLISH
✅ FINAL: BULLISH (72% confidence)
```

---

## Colors & Symbols

| Symbol | Meaning |
|--------|---------|
| 🟢 | Bullish cluster (>60% bullish) |
| 🔴 | Bearish cluster (>60% bearish) |
| 🟡 | Mixed cluster (40-60%) |
| 📊 | Consensus update |
| ✅ | Final result |

---

## Requirements

**Demo mode:**
- Python 3.9+
- Rich library (for terminal UI)

**Live mode:**
- Python 3.9+
- Rich library
- MiroFish Docker running (http://localhost:5001)
- `mirofish_client.py` from Polymarket project

---

## Troubleshooting

### **"MiroFish unreachable" error:**

Make sure Docker is running:
```bash
docker ps | grep mirofish
```

If not running:
```bash
cd ~/path/to/mirofish
docker-compose up -d
```

### **Import error for mirofish_client:**

The live integration needs access to:
```
~/Desktop/Polymarket/mirofish_client.py
```

Make sure this file exists.

### **Demo mode works, live mode doesn't:**

Live mode requires MiroFish Docker. Use demo mode for previewing the visualization without Docker:
```bash
python3 -m dashboard --mirofish  # Demo (no Docker needed)
```

---

## Advanced Usage

### **Custom question:**
```bash
python3 -m dashboard --mirofish --live --question "Your question here"
```

### **Standalone script:**
```bash
cd ~/Desktop/askelira-framework/dashboard
python3 mirofish_live.py "Will Bitcoin hit $100k this year?"
```

---

## Integration with AskElira

The MiroFish viewer is designed to work with any AskElira agent that uses MiroFish for validation:

**Trading agents:**
```python
from dashboard.mirofish_live import MiroFishLiveIntegration

# Run David with live visualization
integration = MiroFishLiveIntegration()
result = integration.run_live_simulation(
    question="Will NQ go up?",
    context=alba_research  # Pass Alba's research
)
```

**Marketing agents:**
```python
# Validate tactic with live swarm visualization
result = integration.run_live_simulation(
    question="Will this Twitter thread get >100 likes?",
    context=tactic_description
)
```

---

## Future Enhancements

- [ ] Web UI version (browser-based)
- [ ] Export simulation video
- [ ] Multi-question comparison mode
- [ ] Agent influence graph (show which agents swayed consensus)
- [ ] Historical replay (re-watch past simulations)

---

**Built with AskElira Framework**
Part of the multi-agent orchestration platform.
