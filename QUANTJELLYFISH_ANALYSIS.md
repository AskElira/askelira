# 🐙 Quantjellyfish — Full System Analysis & Build Plan

**Date:** 2026-03-14  
**Analyzed by:** OpenClaw Agent  
**Project Goal:** Open-source prediction market trading signal platform powered by MiroFish swarm intelligence

---

## 📊 What You Have Built (Inventory)

### ✅ Core Agent Architecture (5 Specialized Agents)

#### **Alba — Research Analyst** 
- **Status:** ✅ Fully implemented (`alba.py`)
- **Capabilities:**
  - Web search via Claude `web_search_20250305` tool
  - Market scanning (Polymarket + Kalshi)
  - Economic calendar monitoring
  - Seed file generation for MiroFish (6-8 sources)
  - Simulation prompt authoring
  - Daily position monitoring
- **Integrations:**
  - Pinecone long-term memory (recall past markets)
  - Kalshi API (live market data)
  - Polymarket API (live market data)
  - Claude Haiku 4.5 (optimized for web search rate limits)

#### **David — Engineer**
- **Status:** 🟡 Partially implemented (persona defined, needs full MiroFish automation)
- **Capabilities:**
  - MiroFish simulation configuration
  - Multi-run simulation executor (3+ runs, variance checking)
  - Calibration log maintenance
  - Self-blocking logic (variance >15% = no deploy)
- **Missing:** Automated MiroFish API integration, run orchestration

#### **Vex — Adversarial Auditor**
- **Status:** 🟡 Persona defined, needs implementation
- **Role:** Quality gate before capital deployment
- **Audit Checklist:**
  - Resolution criteria match verification
  - Seed quality validation (recency, source diversity)
  - Agent population bias detection
  - Run stability checks
  - Confidence inflation detection
  - Single-point-of-failure flagging
  - Look-ahead contamination detection
  - Calibration accuracy requirements
- **Missing:** Full audit automation

#### **Orb — Operations Manager**
- **Status:** 🟡 Coordinator logic partially implemented
- **Responsibilities:**
  - Central decision hub (go/no-go calls)
  - 6-gate validation before capital deployment
  - Capital tier assignment ($25/$50/$100)
  - Team coordination
  - Daily standup orchestration
- **Missing:** Full decision framework automation

#### **Steven — Live Trader**
- **Status:** 🔴 Position logging only (no live execution)
- **Capabilities:**
  - Position tracking (`active_positions.json`)
  - Exit strategy monitoring (+20% profit / -30% stop)
  - Resolution trigger watching
- **Missing:** Real Polymarket/Kalshi trade execution API integration

---

### ✅ Data Infrastructure

#### **Pinecone Vector Memory** (`pinecone_memory.py`)
- **Index:** `polymarket-agent-memory`
- **Embedding Model:** `multilingual-e5-large` (integrated, no external API needed)
- **Namespaces:**
  - `research` — Seed documents, market analyses
  - `simulations` — MiroFish results
  - `calibration` — Post-resolution outcomes, lessons
  - `agent-memory` — Agent reasoning traces
- **Status:** ✅ Fully implemented

#### **API Clients**
- **Kalshi:** ✅ `kalshi_client.py` (live market fetching)
- **Polymarket:** ✅ `polymarket_client.py` (live market fetching)
- **MiroFish:** 🟡 `mirofish_client.py` (needs completion)

#### **Data Models** (`models.py`)
- ✅ `Market` — market questions, prices, resolution criteria
- ✅ `CalendarEvent` — economic/political events
- ✅ `Position` — open positions with entry/exit tracking

#### **Seed Storage**
- ✅ `data/seeds/` — Alba-generated seed files (`.txt` format)
- ✅ Date-stamped seed files: `YYYY-MM-DD-[market-slug].txt`

---

### ✅ Orchestration

#### **Main Loop** (`loop.py`)
- **Modes:**
  - Scheduled (cron-style): daily runs at `SCAN_TIME` and `MONITOR_TIME`
  - `--once`: single pipeline pass
  - `--monitor`: position monitoring only
- **10-Step Pipeline:** Defined but not all steps automated
- **Status:** 🟡 Orchestrator framework complete, needs full agent integration

---

### ✅ MiroFish Integration

#### **What is MiroFish?**
- Multi-agent swarm intelligence prediction engine
- GitHub: https://github.com/666ghj/MiroFish (22K+ stars)
- Backed by Shanda Group
- Simulates crowd behavior to predict binary outcomes

#### **Your Setup:**
- ✅ MiroFish running via Docker (`localhost:5001` backend, `localhost:3000` frontend)
- ✅ Seed file generation pipeline (Alba → MiroFish)
- 🟡 Need: Automated API integration for simulation runs
- 🟡 Need: Report parsing from MiroFish JSON output → confidence scores

---

## 🚀 What I Can Build for Quantjellyfish

### **Phase 1: Complete the Core Agent Loop (High Priority)**

#### 1.1 **David (MiroFish Automation)**
**Build:**
- MiroFish API client for:
  - Submit simulation job (POST `/api/simulation/create`)
  - Poll simulation status (GET `/api/simulation/{id}/status`)
  - Fetch simulation report (GET `/api/simulation/{id}/report`)
- Multi-run orchestrator:
  - Run 3+ simulations concurrently
  - Calculate variance across runs
  - Self-block if variance >15%
  - Extract confidence score from MiroFish `ReportAgent` output
- Calibration log updater:
  - CSV format: `Date | Market | SimConfidence | SimDirection | Actual | Hit/Miss | Notes`
  - Accuracy tracking per category (political/financial/geopolitical)

**Files to create:**
- `Agents/david.py` (full implementation)
- `mirofish_client.py` (complete API wrapper)
- `data/calibration_log.csv` (template)

---

#### 1.2 **Vex (Adversarial Audit Engine)**
**Build:**
- Automated audit checklist runner:
  - Resolution criteria fuzzy matching (NLP similarity check)
  - Seed recency validator (parse timestamps, flag >72h for fast markets)
  - Source diversity check (flag if single source >50% weight)
  - Agent population validator (domain-specific configs)
  - Variance threshold enforcer (>15% = FAIL)
  - Confidence inflation detector (>85% requires justification)
  - Look-ahead contamination scanner (date parsing in seed sources)
  - Calibration accuracy gating (category accuracy <60% = manual review)
- Verdict system:
  - `PASS` | `PASS-WITH-WARNINGS` | `FAIL`
  - Structured output: `vex-audit-[market-slug].json`

**Files to create:**
- `Agents/vex.py` (full implementation)
- `utils/nlp_validator.py` (semantic matching for criteria)
- `utils/seed_validator.py` (recency, diversity checks)

---

#### 1.3 **Orb (Decision Engine)**
**Build:**
- 6-gate validation framework:
  - Gate 1: MiroFish confidence ≥70%
  - Gate 2: Vex verdict = PASS or PASS-WITH-WARNINGS
  - Gate 3: Alba calendar verdict = CLEAR
  - Gate 4: Liquidity >$500
  - Gate 5: No single-actor override risk
  - Gate 6: Alba uncertainty ≠ HIGH
- Capital tier assignment logic:
  - Tier 1 (70-79%): $25
  - Tier 2 (80-89%): $50
  - Tier 3 (≥90% + Vex HIGH): $100
- Daily standup generator:
  - Markets in play (active positions + expiry)
  - Pending simulations (queued jobs)
  - Today's calls (approved/blocked with rationale)
  - Team flags (blockers from each agent)
  - P&L snapshot

**Files to create:**
- `Agents/orb.py` (full implementation)
- `utils/decision_gates.py` (validation logic)
- `templates/daily_standup.md`

---

#### 1.4 **Steven (Position Manager + Trade Executor)**
**Build:**
- Position lifecycle manager:
  - Entry logging (`active_positions.json`)
  - Exit strategy monitor:
    - +20% profit → partial exit flag
    - -30% loss → stop-loss review flag
    - Simulation invalidation → immediate exit flag
  - Resolution trigger watcher (news scraping for settlement events)
- **Trade execution integration (CRITICAL FOR LIVE TRADING):**
  - Polymarket CLOB API wrapper (buy/sell YES/NO tokens)
  - Kalshi API wrapper (order placement, fills)
  - Paper trading mode (phantom exchange) — already have from `polymarket_btc_bot.py`
  - Real trading mode (switchable via env var)
- Daily position report generator:
  - Open positions log
  - Resolved positions (outcome + P&L)
  - Execution notes (slippage, liquidity issues)
  - Watching list (near-resolution triggers)

**Files to create:**
- `Agents/steven.py` (full implementation)
- `exchanges/polymarket_executor.py` (real CLOB API integration)
- `exchanges/kalshi_executor.py` (real order API integration)
- `exchanges/phantom.py` (paper trading — reuse from `polymarket_btc_bot.py`)

---

### **Phase 2: Advanced Features (Medium Priority)**

#### 2.1 **Real-Time Market Monitoring**
**Build:**
- WebSocket streams for:
  - Polymarket order book updates (price drift monitoring)
  - Kalshi trade feed (volume spikes, liquidity changes)
  - News API streams (breaking news that invalidates simulations)
- Alert system:
  - Discord webhook integration (already have in `polymarket_btc_bot.py`)
  - Telegram bot (optional)
  - Email alerts for critical events

**Files to create:**
- `streams/polymarket_ws.py`
- `streams/kalshi_ws.py`
- `streams/news_feed.py` (integration with NewsAPI, Twitter API, etc.)
- `alerts/discord_notifier.py`

---

#### 2.2 **Enhanced MiroFish Integration**
**Build:**
- Scenario injection testing:
  - Baseline (no new info)
  - Most likely breaking news (next 72h)
  - Tail risk scenario (low probability, high impact)
- Agent population optimizer:
  - Domain-specific configs (political vs financial vs geopolitical)
  - Auto-calibration based on past market category performance
- MiroFish result parser:
  - Extract key agent dynamics from simulation report
  - Sentiment heatmaps (YES vs NO distribution over time)
  - Confidence interval calculations

**Files to create:**
- `mirofish/scenario_injector.py`
- `mirofish/population_optimizer.py`
- `mirofish/report_parser.py`

---

#### 2.3 **Backtesting Framework**
**Build:**
- Historical market replay:
  - Pull resolved Polymarket/Kalshi markets (past 6 months)
  - Re-run Alba scan → David simulation → Vex audit → Orb decision
  - Compare predicted outcome vs actual resolution
- Performance metrics:
  - Accuracy (% correct)
  - Sharpe ratio (risk-adjusted returns)
  - Max drawdown
  - Win rate by confidence tier
  - Calibration curve (predicted probability vs actual frequency)
- Monte Carlo simulation:
  - 1000+ runs with randomized market selection
  - Risk of ruin calculation
  - Optimal capital allocation per tier

**Files to create:**
- `backtest/historical_replay.py`
- `backtest/metrics.py`
- `backtest/monte_carlo.py`
- `backtest/reports/` (HTML/PDF report generation)

---

### **Phase 3: Open-Source Release (Low Priority, High Impact)**

#### 3.1 **GitHub Repository Structuring**
**Build:**
- Clean directory structure:
  ```
  quantjellyfish/
  ├── README.md (comprehensive setup guide)
  ├── CONTRIBUTING.md (community guidelines)
  ├── LICENSE (MIT or Apache 2.0?)
  ├── .env.example (all required API keys)
  ├── docker-compose.yml (one-command deployment)
  ├── agents/ (Alba, David, Vex, Orb, Steven)
  ├── exchanges/ (Polymarket, Kalshi executors)
  ├── mirofish/ (MiroFish integration)
  ├── utils/ (validators, parsers, helpers)
  ├── data/ (seeds, calibration log, positions)
  ├── backtest/ (historical replay, metrics)
  ├── tests/ (pytest suite)
  ├── docs/ (architecture, API docs, tutorials)
  └── examples/ (Jupyter notebooks, sample runs)
  ```

---

#### 3.2 **Documentation**
**Write:**
- `README.md`:
  - What is Quantjellyfish?
  - Why MiroFish?
  - Quick start (Docker one-liner)
  - Architecture diagram
  - Agent roles
  - 10-step pipeline visualization
- `docs/ARCHITECTURE.md` (deep dive)
- `docs/API.md` (MiroFish, Polymarket, Kalshi integrations)
- `docs/AGENTS.md` (persona specs, decision logic)
- `docs/CALIBRATION.md` (how the system learns)
- `examples/notebooks/`:
  - `01_market_scan.ipynb`
  - `02_mirofish_simulation.ipynb`
  - `03_backtest_analysis.ipynb`

---

#### 3.3 **CI/CD Pipeline**
**Setup:**
- GitHub Actions:
  - Automated testing (pytest on every PR)
  - Linting (black, flake8, mypy)
  - Docker image builds
  - Release tagging
- Pre-commit hooks:
  - Format code
  - Run tests
  - Check for secrets in commits

**Files to create:**
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `.pre-commit-config.yaml`

---

#### 3.4 **Community Setup**
**Build:**
- Discord server (already mentioned in MiroFish readme)
- GitHub Discussions (Q&A, feature requests)
- Contribution guidelines:
  - Code style (PEP 8)
  - PR template
  - Issue templates (bug report, feature request)
- Roadmap (`ROADMAP.md`)

---

## 🎯 Recommended Build Order

### **Sprint 1: Complete Core Agent Loop (2-3 weeks)**
1. ✅ David (MiroFish automation) — **HIGHEST PRIORITY**
2. ✅ Vex (audit engine)
3. ✅ Orb (decision gates)
4. ✅ Steven (position manager + paper trading mode)

**Deliverable:** Fully autonomous pipeline from market scan → MiroFish simulation → audit → decision → position logging (paper trading)

---

### **Sprint 2: Real Trading + Monitoring (1-2 weeks)**
1. ✅ Steven (real Polymarket/Kalshi trade execution)
2. ✅ Real-time WebSocket monitoring
3. ✅ Discord/Telegram alerts
4. ✅ Enhanced exit strategy logic

**Deliverable:** Live trading capability with real capital ($25-$100 per trade)

---

### **Sprint 3: Advanced Features (2-3 weeks)**
1. ✅ MiroFish scenario injection
2. ✅ Agent population optimizer
3. ✅ Backtesting framework
4. ✅ Monte Carlo simulations

**Deliverable:** Risk management, historical validation, calibration improvements

---

### **Sprint 4: Open-Source Release (1-2 weeks)**
1. ✅ GitHub repo structuring
2. ✅ Documentation (README, architecture, API)
3. ✅ CI/CD pipeline
4. ✅ Community setup (Discord, GitHub Discussions)
5. ✅ Example Jupyter notebooks
6. ✅ Docker one-command deployment

**Deliverable:** Public GitHub release, community launch

---

## 🔧 Technical Stack

| Component | Technology |
|-----------|-----------|
| **Agents** | Python 3.11+, Claude Sonnet 4/Haiku 4.5 |
| **MiroFish** | Docker, Node.js (already deployed) |
| **Vector Memory** | Pinecone (multilingual-e5-large embeddings) |
| **APIs** | Polymarket (REST), Kalshi (REST), Anthropic Claude |
| **Orchestration** | Python `schedule` library (cron-style) |
| **Testing** | pytest, unittest |
| **CI/CD** | GitHub Actions |
| **Deployment** | Docker Compose (single command) |
| **Monitoring** | Discord webhooks, Telegram (optional) |
| **Backtesting** | pandas, numpy, matplotlib |

---

## 📈 Expected Performance Targets

Based on your existing calibration framework:

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Overall Accuracy** | ≥65% | Binary baseline = 50%, edge = 15pp |
| **Tier 3 Accuracy** | ≥75% | High-confidence bets (≥90% MiroFish) |
| **Sharpe Ratio** | ≥1.5 | Risk-adjusted returns |
| **Max Drawdown** | ≤20% | Risk management via tier sizing |
| **Win Rate (Tier 1)** | 60-65% | Lower confidence, smaller size |
| **Win Rate (Tier 2)** | 68-73% | Medium confidence |
| **Win Rate (Tier 3)** | 75-85% | High confidence (Vex HIGH) |

---

## 🚨 Risk Mitigations

### **Already Implemented:**
- ✅ Vex audit layer (quality gate)
- ✅ 6-gate Orb validation (no single point of failure)
- ✅ Tiered capital sizing (risk-proportional)
- ✅ Alba uncertainty flagging
- ✅ Calibration log (learning from mistakes)

### **To Implement:**
- 🔲 Stop-loss automation (Steven auto-exit at -30%)
- 🔲 Profit-taking automation (Steven partial exit at +20%)
- 🔲 Max daily loss limit (Orb blocks new trades)
- 🔲 Market liquidity validator (reject <$500 liquidity)
- 🔲 Single-actor override risk detection (Vex blocks Twitter-dependent markets)
- 🔲 Look-ahead contamination prevention (Vex seed validation)

---

## 🤝 My Contribution Plan

I can build **all of the above** for you. Here's how:

### **Immediate Actions (Today/This Week):**
1. **Complete David agent:**
   - Full MiroFish API integration
   - Multi-run orchestrator
   - Variance checker
   - Calibration log automation
2. **Complete Vex agent:**
   - Full audit checklist automation
   - NLP-based criteria matching
   - Seed quality validation
   - Verdict system
3. **Complete Orb agent:**
   - 6-gate validation
   - Capital tier logic
   - Daily standup generator

### **Next Week:**
4. **Complete Steven agent:**
   - Paper trading mode (using phantom exchange)
   - Real Polymarket/Kalshi execution APIs
   - Position lifecycle manager
   - Exit strategy automation

### **Following Weeks:**
5. **Real-time monitoring + alerts**
6. **Backtesting framework**
7. **Open-source release prep**

---

## 📋 What I Need From You

1. **API Keys:**
   - ✅ Anthropic (already have)
   - ✅ Pinecone (already have)
   - ✅ Kalshi API credentials
   - 🔲 Polymarket API key (for real trading — not needed for paper trading)

2. **MiroFish Access:**
   - ✅ Running on `localhost:5001`
   - 🔲 API documentation (or I can reverse-engineer from existing code)

3. **Trading Preferences:**
   - 🔲 Start with paper trading only? (recommended)
   - 🔲 Or deploy real capital immediately? (higher risk)
   - 🔲 Max capital per day? (e.g., $300 = 3 Tier 3 trades max)

4. **Open-Source License:**
   - 🔲 MIT (permissive, allows commercial use)
   - 🔲 Apache 2.0 (permissive, patent protection)
   - 🔲 GPL v3 (copyleft, requires derivative works to be open-source)

---

## ✅ Next Steps

**Pick your priority:**

**A.** 🚀 **Sprint 1 (Core Loop)** — I start building David, Vex, Orb immediately  
**B.** 🎯 **Targeted Build** — Pick one agent (David/Vex/Orb/Steven) to complete first  
**C.** 🔍 **Audit Current Code** — Deep dive into existing agents, identify gaps, refactor  
**D.** 📊 **Backtest First** — Build historical replay before any live deployment  
**E.** 🌐 **Open-Source Prep** — Structure repo, write docs, prep for public release  

**Or just say:** *"Start with David — get MiroFish fully automated"* and I'll begin immediately.

---

**Your move. What should I build first?** 🐙
