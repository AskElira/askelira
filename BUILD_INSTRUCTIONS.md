# BUILD INSTRUCTIONS FOR ASKELIRA FRAMEWORK

**Paste this entire prompt into Claude Code (VSCode) after opening this workspace.**

---

## 🎯 GOAL

Build the **AskElira Framework** - a generic, reusable multi-agent orchestration platform that can be adapted to ANY domain (trading, marketing, sales, research, etc.).

## 📂 CURRENT WORKSPACE

Location: `~/Desktop/askelira-framework/`

Structure:
```
askelira-framework/
├── askelira/              (core framework code)
│   ├── agents/            (base agent classes)
│   └── utils/             (shared utilities)
├── examples/
│   ├── trader/            (trading use case demo)
│   ├── marketing/         (marketing use case demo)
│   └── sales/             (sales use case demo - future)
├── docs/                  (documentation)
├── README.md              (main README - framework overview)
├── LICENSE                (MIT)
└── .gitignore
```

## 🏗️ WHAT TO BUILD

### Phase 1: Core Framework Files

**1. askelira/agents/base_agent.py**

Generic base class ALL agents inherit from.

```python
"""
Base Agent class for AskElira framework.

All domain-specific agents (trading, marketing, sales) inherit from this.
Provides standard interface: initialize, execute, validate, report.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging
from datetime import datetime

class BaseAgent(ABC):
    """
    Abstract base class for all AskElira agents.
    
    Implements the standard 4-phase agent lifecycle:
    1. Initialize - Setup, config, API clients
    2. Execute - Core agent logic
    3. Validate - Check outputs, ensure quality
    4. Report - Return results + metadata
    """
    
    def __init__(self, name: str, config: Optional[Dict] = None):
        self.name = name
        self.config = config or {}
        self.log = logging.getLogger(f"askelira.{name}")
        self.start_time = None
        self.end_time = None
        self.cost = 0.0
        
    @abstractmethod
    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Core agent logic. Override in subclasses.
        
        Returns:
            Dict with at minimum:
            - success: bool
            - data: Any (agent-specific output)
            - error: Optional[str]
        """
        pass
    
    def validate(self, result: Dict[str, Any]) -> bool:
        """
        Validate agent output. Override for custom validation.
        
        Args:
            result: Output from execute()
            
        Returns:
            True if valid, False otherwise
        """
        return result.get("success", False)
    
    def report(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate agent execution report.
        
        Returns:
            Dict with execution metadata
        """
        return {
            "agent": self.name,
            "success": result.get("success", False),
            "timestamp": datetime.utcnow().isoformat(),
            "duration_seconds": (self.end_time - self.start_time).total_seconds() if self.start_time and self.end_time else 0,
            "cost_usd": self.cost,
            "data": result.get("data"),
            "error": result.get("error")
        }
    
    def run(self, **kwargs) -> Dict[str, Any]:
        """
        Full agent execution: execute → validate → report
        
        Args:
            **kwargs: Passed to execute()
            
        Returns:
            Agent report dict
        """
        self.start_time = datetime.utcnow()
        self.log.info(f"[{self.name}] Starting execution")
        
        try:
            result = self.execute(**kwargs)
            self.end_time = datetime.utcnow()
            
            if not self.validate(result):
                self.log.warning(f"[{self.name}] Validation failed")
                result["success"] = False
                result["error"] = result.get("error", "Validation failed")
            
            report = self.report(result)
            self.log.info(f"[{self.name}] Completed: {report['success']}")
            return report
            
        except Exception as e:
            self.end_time = datetime.utcnow()
            self.log.error(f"[{self.name}] Error: {e}")
            return self.report({
                "success": False,
                "data": None,
                "error": str(e)
            })
```

**2. askelira/agents/research_agent.py**

Generic research agent (Alba pattern).

```python
"""
Generic Research Agent (Alba pattern).

Gathers information, scans sources, generates seeds for simulation.
Adapt for any domain: market data, GitHub repos, sales leads, etc.
"""

from .base_agent import BaseAgent
from typing import Dict, Any, List

class ResearchAgent(BaseAgent):
    """
    Research agent that gathers domain-specific information.
    
    Override execute() to implement your research logic.
    """
    
    def __init__(self, config: Dict = None):
        super().__init__("ResearchAgent", config)
        
    def execute(self, query: str, sources: List[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Execute research.
        
        Args:
            query: Research question/topic
            sources: List of data sources to query
            
        Returns:
            Dict with research findings
        """
        # Override this in domain-specific implementations
        raise NotImplementedError("Implement execute() in your domain-specific research agent")
    
    def scan_sources(self, sources: List[str]) -> List[Dict]:
        """Scan multiple sources. Override for custom logic."""
        return []
    
    def generate_seed(self, findings: List[Dict]) -> str:
        """Generate simulation seed from research. Override for custom logic."""
        return ""
```

**3. askelira/utils/cost_tracker.py**

Copy from ~/Desktop/Polymarket/utils/cost_tracker.py (already battle-tested).

**4. askelira/utils/mirofish_client.py**

Copy from ~/Desktop/marketing-swarm/workspace/askelira/mirofish_client.py (swarm integration).

**5. askelira/orchestrator.py**

Generic 5-agent orchestration pipeline.

```python
"""
AskElira Orchestrator - 5-Agent Pipeline

Generic orchestration pattern:
Research → Simulate → Audit → Decide → Execute
"""

from typing import Dict, Any, List, Optional
from .agents.base_agent import BaseAgent
import logging

log = logging.getLogger("askelira.orchestrator")

class Orchestrator:
    """
    Coordinates 5-agent workflow.
    
    Agents execute in sequence:
    1. Research - Gather data
    2. Simulate - MiroFish swarm validation
    3. Audit - Adversarial checks
    4. Decide - Final decision logic
    5. Execute - Take action
    """
    
    def __init__(self, agents: Dict[str, BaseAgent]):
        """
        Args:
            agents: Dict with keys: research, simulate, audit, decide, execute
        """
        required = ["research", "simulate", "audit", "decide", "execute"]
        for agent_type in required:
            if agent_type not in agents:
                raise ValueError(f"Missing required agent: {agent_type}")
        
        self.agents = agents
        self.state = {}
        
    def run(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Execute full 5-agent pipeline.
        
        Args:
            query: The question/task to process
            **kwargs: Additional config
            
        Returns:
            Dict with pipeline results
        """
        log.info("=" * 60)
        log.info(f"ASKELIRA ORCHESTRATION PIPELINE")
        log.info(f"Query: {query}")
        log.info("=" * 60)
        
        # Phase 1: Research
        research_result = self.agents["research"].run(query=query, **kwargs)
        if not research_result["success"]:
            return self._fail("Research failed", research_result)
        self.state["research"] = research_result
        
        # Phase 2: Simulate (MiroFish swarm)
        simulate_result = self.agents["simulate"].run(
            seed=research_result["data"].get("seed"),
            **kwargs
        )
        if not simulate_result["success"]:
            return self._fail("Simulation failed", simulate_result)
        self.state["simulate"] = simulate_result
        
        # Phase 3: Audit
        audit_result = self.agents["audit"].run(
            research=research_result,
            simulation=simulate_result,
            **kwargs
        )
        self.state["audit"] = audit_result
        
        # Phase 4: Decide
        decision_result = self.agents["decide"].run(
            research=research_result,
            simulation=simulate_result,
            audit=audit_result,
            **kwargs
        )
        if not decision_result["success"]:
            return self._fail("Decision failed", decision_result)
        self.state["decide"] = decision_result
        
        # Phase 5: Execute (only if approved)
        if decision_result["data"].get("approved", False):
            execute_result = self.agents["execute"].run(
                decision=decision_result,
                **kwargs
            )
            self.state["execute"] = execute_result
        else:
            log.warning("Decision not approved - skipping execution")
            execute_result = {"success": False, "data": None, "error": "Not approved"}
            self.state["execute"] = execute_result
        
        # Return full pipeline state
        return {
            "success": decision_result["success"],
            "query": query,
            "pipeline": self.state,
            "final_decision": decision_result["data"],
            "executed": execute_result.get("success", False)
        }
    
    def _fail(self, reason: str, result: Dict) -> Dict:
        """Handle pipeline failure."""
        log.error(f"Pipeline failed: {reason}")
        return {
            "success": False,
            "error": reason,
            "failed_at": result["agent"],
            "pipeline": self.state
        }
```

---

### Phase 2: Example Implementations

**examples/trader/trader_research_agent.py**

Minimal trading research agent (shows how to extend BaseAgent).

```python
"""
Trading Research Agent - Extends BaseAgent for prediction markets.

This is a MINIMAL example. Full implementation: github.com/jellyforex/askeliratrader
"""

import sys
sys.path.insert(0, '../../')  # Add framework to path

from askelira.agents.base_agent import BaseAgent
from typing import Dict, Any

class TraderResearchAgent(BaseAgent):
    """
    Research agent for prediction markets.
    Scans Polymarket/Kalshi, gathers market data, generates prediction seed.
    """
    
    def __init__(self, config: Dict = None):
        super().__init__("TraderResearchAgent", config)
        
    def execute(self, query: str, **kwargs) -> Dict[str, Any]:
        """
        Research market question.
        
        Example:
            query = "Will Bitcoin hit $150k in 2025?"
            
        Returns research findings + seed for simulation.
        """
        self.log.info(f"Researching market: {query}")
        
        # In real implementation:
        # 1. Search Polymarket/Kalshi for similar questions
        # 2. Scrape current odds, liquidity, volume
        # 3. Gather relevant news/data
        # 4. Generate seed for MiroFish
        
        # Minimal example output:
        return {
            "success": True,
            "data": {
                "market_question": query,
                "current_odds": {"yes": 0.45, "no": 0.55},
                "liquidity": 50000,
                "seed": f"Predict: {query}. Current market: 45% YES. What's your vote?"
            },
            "error": None
        }

# Example usage
if __name__ == "__main__":
    agent = TraderResearchAgent()
    result = agent.run(query="Will Bitcoin hit $150k in 2025?")
    print(result)
```

**examples/marketing/marketing_research_agent.py**

Minimal marketing research agent (GitHub Scout pattern).

```python
"""
Marketing Research Agent - Extends BaseAgent for viral campaigns.

This is a MINIMAL example. Full implementation: github.com/jellyforex/askeliramarketing
"""

import sys
sys.path.insert(0, '../../')

from askelira.agents.base_agent import BaseAgent
from typing import Dict, Any

class MarketingResearchAgent(BaseAgent):
    """
    Research agent for viral marketing.
    Scouts GitHub trending repos, extracts viral tactics.
    """
    
    def __init__(self, config: Dict = None):
        super().__init__("MarketingResearchAgent", config)
        
    def execute(self, target_repo: str, **kwargs) -> Dict[str, Any]:
        """
        Research viral tactics for target repo.
        
        Example:
            target_repo = "jellyforex/askelira"
            
        Returns trending repos + tactics + seed for simulation.
        """
        self.log.info(f"Researching tactics for: {target_repo}")
        
        # In real implementation:
        # 1. Scrape GitHub trending (topic: ai-agents, ml)
        # 2. Extract tactics (README hooks, demo videos, Show HN posts)
        # 3. Analyze what made them trend
        # 4. Generate seed for MiroFish validation
        
        # Minimal example output:
        return {
            "success": True,
            "data": {
                "target_repo": target_repo,
                "trending_repos": [
                    {"name": "example/repo", "stars": 1200, "tactic": "Concrete demo"}
                ],
                "tactics": [
                    "Concrete results demos",
                    "3-step installation",
                    "Show HN launch"
                ],
                "seed": f"Should {target_repo} use 'concrete results demos' tactic? Trending repos with 80% success rate."
            },
            "error": None
        }

# Example usage
if __name__ == "__main__":
    agent = MarketingResearchAgent()
    result = agent.run(target_repo="jellyforex/askelira")
    print(result)
```

---

### Phase 3: Documentation

**README.md**

Use the comprehensive framework README I gave you in Prompt #2 (the one with architecture diagram, use cases, quick start, etc.).

**docs/ARCHITECTURE.md**

```markdown
# AskElira Architecture

## Overview

AskElira is a **multi-agent orchestration platform** with **swarm intelligence validation**.

## Core Concepts

### 1. 5-Agent Pattern

Every AskElira application follows this pattern:

```
Research → Simulate → Audit → Decide → Execute
```

### 2. Agent Lifecycle

All agents inherit from `BaseAgent` and implement:

1. **Initialize** - Setup, config, API clients
2. **Execute** - Core logic (override this)
3. **Validate** - Output checks
4. **Report** - Return results + metadata

### 3. MiroFish Swarm

- Spawns 1000+ AI agents with diverse personas
- Each agent votes on the question
- Aggregates reasoning → confidence score

### 4. Orchestration

The `Orchestrator` class coordinates agents:

```python
orchestrator = Orchestrator(agents={
    "research": ResearchAgent(),
    "simulate": SimulateAgent(),
    "audit": AuditAgent(),
    "decide": DecideAgent(),
    "execute": ExecuteAgent()
})

result = orchestrator.run(query="Your question here")
```

## Extending the Framework

### Create a Domain-Specific Agent

```python
from askelira.agents.base_agent import BaseAgent

class MyCustomAgent(BaseAgent):
    def execute(self, **kwargs):
        # Your logic here
        return {
            "success": True,
            "data": {"result": "..."},
            "error": None
        }
```

### Build a New Use Case

1. Copy `examples/trader/` → `examples/yourapp/`
2. Implement domain-specific agents
3. Wire up to `Orchestrator`
4. Run!

## Full Implementations

- **Trading:** [github.com/jellyforex/askeliratrader](https://github.com/jellyforex/askeliratrader)
- **Marketing:** [github.com/jellyforex/askeliramarketing](https://github.com/jellyforex/askeliramarketing)
```

**docs/QUICKSTART.md**

```markdown
# Quick Start Guide

## Installation

```bash
git clone https://github.com/jellyforex/askelira
cd askelira
pip install -r requirements.txt
```

## Run Example (Trading)

```bash
cd examples/trader
python trader_research_agent.py
```

## Build Your Own

1. Create new directory: `examples/myapp/`
2. Extend `BaseAgent`:

```python
from askelira.agents.base_agent import BaseAgent

class MyResearchAgent(BaseAgent):
    def execute(self, query, **kwargs):
        # Your research logic
        return {"success": True, "data": {...}}
```

3. Wire up orchestrator:

```python
from askelira.orchestrator import Orchestrator

orchestrator = Orchestrator(agents={
    "research": MyResearchAgent(),
    # ... other agents
})

result = orchestrator.run(query="Your question")
```

## Next Steps

- Read [ARCHITECTURE.md](ARCHITECTURE.md)
- See full implementations:
  - [AskElira Trader](https://github.com/jellyforex/askeliratrader)
  - [AskElira Marketing](https://github.com/jellyforex/askeliramarketing)
```

---

### Phase 4: Configuration Files

**requirements.txt**

```
anthropic>=0.18.0
requests>=2.31.0
python-dotenv>=1.0.0
pinecone-client>=3.0.0
```

**.env.example**

```bash
# AskElira Framework Configuration

# Required
ANTHROPIC_API_KEY=your_key_here

# Optional (for memory/learning)
PINECONE_API_KEY=your_key_here
PINECONE_INDEX_NAME=askelira-memory

# Optional (for alternative LLMs)
OPENAI_API_KEY=your_key_here
```

**LICENSE**

```
MIT License

Copyright (c) 2026 Jelly (@jellyforex)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## ✅ VERIFICATION

After building, verify:

```bash
# Run trader example
cd examples/trader
python trader_research_agent.py

# Run marketing example
cd examples/marketing
python marketing_research_agent.py

# Check structure
ls -R askelira/
```

Expected output:
- Both examples run without errors
- Print agent execution reports
- Show framework inheritance working

---

## 🎯 SUCCESS CRITERIA

✅ `askelira/` core framework complete (BaseAgent, Orchestrator, utils)
✅ 2 example implementations (trader, marketing) showing how to extend
✅ Full documentation (README, ARCHITECTURE, QUICKSTART)
✅ Config files (.env.example, requirements.txt, LICENSE)
✅ Examples run successfully

---

## 📝 AFTER YOU FINISH

Show me:
1. Directory tree (all files created)
2. Output from running trader example
3. Output from running marketing example
4. First 30 lines of README.md

This becomes the **generic framework** that powers all 3 repos:
- jellyforex/askelira (this framework)
- jellyforex/askeliratrader (full trading impl)
- jellyforex/askeliramarketing (full marketing impl)

**Start building NOW!**
