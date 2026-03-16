# AskElira Framework - Generic Agent Pipeline Dashboard

**Build location:** `~/Desktop/askelira-framework/dashboard/`

---

## 🎯 Goal

Create a **generic agent pipeline visualizer** that works for ANY multi-agent workflow:

- ✅ Trading: Alba → David → Vex → Elira → Steven
- ✅ Marketing: Alba → Trend → Scribe → Lens → Pixel
- ✅ Research: Alba → David → Elira
- ✅ Custom: Any agent sequence you define

---

## 📋 Requirements

### **1. Generic Node System**

**Input:** List of agent names in sequence
```python
agents = ["Alba", "David", "Elira"]
# OR
agents = ["Alba", "Trend", "Scribe", "Lens", "Pixel"]
# OR any custom sequence
```

**Output:** Visual pipeline with real-time status

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  Alba   │ ────▶│  David  │ ────▶│  Elira  │
│         │      │         │      │         │
└─────────┘      └─────────┘      └─────────┘
  ⏳ Active       ⏸️ Waiting      ⏸️ Waiting
```

### **2. Event-Driven Updates**

**Events:**
```python
emit("agent_start", {"agent": "Alba", "task": "Gathering data..."})
emit("agent_progress", {"agent": "Alba", "progress": 50, "status": "Fetching news..."})
emit("agent_complete", {"agent": "Alba", "data": {...}})
emit("agent_error", {"agent": "Alba", "error": "API timeout"})
```

**Dashboard responds:**
- Update node status (⏸️ → ⏳ → ✅ → ❌)
- Show progress bars
- Display agent output
- Track metrics

### **3. Flexible Data Display**

**Each agent can show different data:**

**Alba (Research):**
```python
{
  "sources_found": 12,
  "api_calls": 2,
  "data_quality": "high"
}
```

**David (Simulation):**
```python
{
  "model": "claude-sonnet-4",
  "confidence": 68,
  "votes": {"yes": 680, "no": 320}
}
```

**Scribe (Content):**
```python
{
  "pieces_created": 5,
  "word_count": 1247,
  "platforms": ["Twitter", "Reddit"]
}
```

**Dashboard adapts:** Shows whatever data the agent provides

### **4. Pipeline Metrics**

**Track across all agents:**
- Total time elapsed
- Current step (3/5 complete)
- Success rate (if running multiple iterations)
- Cost tracking (API calls, tokens)
- Error count

### **5. Configuration File**

**`pipeline_config.json`:**
```json
{
  "pipeline": {
    "name": "NQ Trading",
    "agents": [
      {"name": "Alba", "role": "Research", "color": "cyan"},
      {"name": "David", "role": "Simulation", "color": "yellow"},
      {"name": "Elira", "role": "Decision", "color": "green"}
    ]
  },
  "metrics": {
    "track_cost": true,
    "track_time": true,
    "track_errors": true
  }
}
```

---

## 🏗️ File Structure

```
~/Desktop/askelira-framework/dashboard/
├── pipeline_dashboard.py         # Main dashboard class
├── agent_node.py                 # Agent node renderer
├── event_bus.py                  # Event system
├── metrics_tracker.py            # Metrics collection
├── config_loader.py              # Load pipeline configs
└── examples/
    ├── trading_pipeline.json     # NQ trading example
    ├── marketing_pipeline.json   # Marketing example
    └── research_pipeline.json    # Research example
```

---

## 💻 Implementation Details

### **Core Classes:**

**1. PipelineDashboard:**
```python
class PipelineDashboard:
    def __init__(self, config_path):
        self.load_config(config_path)
        self.setup_nodes()
        self.setup_event_listeners()
    
    def on_agent_start(self, agent_name):
        # Update node status to "active"
        
    def on_agent_complete(self, agent_name, data):
        # Update node status to "complete"
        # Store agent output
        
    def render(self):
        # Return Rich Layout with all nodes + metrics
```

**2. AgentNode:**
```python
class AgentNode:
    def __init__(self, name, role, color):
        self.name = name
        self.role = role
        self.color = color
        self.status = "waiting"  # waiting|active|complete|error
        self.data = {}
        self.progress = 0
    
    def render(self):
        # Return Rich Panel with node visualization
```

**3. EventBus:**
```python
class EventBus:
    def emit(self, event_name, data):
        # Trigger registered callbacks
        
    def on(self, event_name, callback):
        # Register event listener
```

---

## 🎨 Visual Design

### **Full Dashboard Layout:**

```
╔══════════════════════════════════════════════════════════════════╗
║              🚀 ASKELIRA PIPELINE - NQ Trading                   ║
╚══════════════════════════════════════════════════════════════════╝

Pipeline: [Alba] ────▶ [David] ────▶ [Elira]
Status:    ✅           ⏳             ⏸️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Step: David (Simulation)
Progress: ████████████░░░░░░░░░░░░░░░░░░░░ 40%
Status: Running swarm simulation...

Agent Output:
  Alba (Research):
    • Sources: 12 found
    • API Calls: 2/2
    • Quality: High
  
  David (Simulation):
    • Model: Claude Sonnet 4
    • Progress: 40%
    • Status: Simulating 1000 traders...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Metrics:
  Time Elapsed: 00:01:23
  Steps Complete: 1 / 3
  API Cost: $0.02
  Errors: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Usage Examples

### **Example 1: NQ Trading**
```python
from dashboard import PipelineDashboard

dashboard = PipelineDashboard("examples/trading_pipeline.json")

# In your trading script:
dashboard.emit("agent_start", {"agent": "Alba"})
# ... Alba runs ...
dashboard.emit("agent_complete", {"agent": "Alba", "data": {...}})

dashboard.emit("agent_start", {"agent": "David"})
# ... David runs ...
dashboard.emit("agent_complete", {"agent": "David", "data": {...}})
```

### **Example 2: Marketing Campaign**
```python
dashboard = PipelineDashboard("examples/marketing_pipeline.json")

# Agents: Alba → Trend → Scribe → Lens → Pixel
for agent in ["Alba", "Trend", "Scribe", "Lens", "Pixel"]:
    dashboard.emit("agent_start", {"agent": agent})
    # ... agent runs ...
    dashboard.emit("agent_complete", {"agent": agent, "data": {...}})
```

---

## ✅ Acceptance Criteria

1. **Generic:** Works with ANY agent sequence (no hardcoded trading logic)
2. **Event-driven:** Updates in real-time via event bus
3. **Configurable:** Pipeline defined in JSON config file
4. **Visual:** Beautiful Rich terminal UI with colors/progress
5. **Metrics:** Tracks time, cost, errors, success rate
6. **Reusable:** Can be imported and used in any AskElira project

---

## 🚀 Implementation Steps

### **Phase 1: Core Classes (30 min)**
1. Create `event_bus.py` - Event system
2. Create `agent_node.py` - Node renderer
3. Create `config_loader.py` - Load JSON configs

### **Phase 2: Dashboard (45 min)**
1. Create `pipeline_dashboard.py` - Main class
2. Implement node layout rendering
3. Add event listeners
4. Add metrics tracking

### **Phase 3: Examples (15 min)**
1. Create `examples/trading_pipeline.json`
2. Create `examples/marketing_pipeline.json`
3. Create `examples/research_pipeline.json`

### **Phase 4: Testing (30 min)**
1. Test with trading pipeline
2. Test with marketing pipeline
3. Fix bugs, polish UI

---

## 📦 Dependencies

```bash
pip install rich  # Already installed
```

No other dependencies needed! Pure Python + Rich library.

---

## 🎯 Success Criteria

**When complete:**
- [ ] Can visualize any agent pipeline from JSON config
- [ ] Real-time updates via event bus
- [ ] Tracks metrics (time, cost, errors)
- [ ] Works in NQ trader
- [ ] Works in marketing swarm
- [ ] Can be shipped to other projects

---

**Ready for Claude Code!** 🚀

Paste this entire file into Claude Code and ask it to build the framework.
