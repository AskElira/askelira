# CLAUDE.md
## Polymarket / Kalshi Prediction Flip Operation
### Powered by MiroFish Swarm Intelligence Engine

---

## 🔱 CORNERSTONE TOOL

**MiroFish** — https://github.com/666ghj/MiroFish

> MiroFish is the simulation backbone of this entire operation.
> Every position entered on Polymarket or Kalshi must be backed by a
> MiroFish simulation run. No simulation = no trade. This is non-negotiable.

MiroFish is a multi-agent swarm intelligence prediction engine. It ingests
real-world seed materials (news, policy docs, financial signals) and
constructs a high-fidelity parallel digital world populated by thousands of
independent AI agents with unique personalities, memory, and behavioral logic.
The engine simulates how group sentiment forms and converges — producing a
structured prediction report on any binary outcome question.

**Why MiroFish is the edge:**
- It models the *process* of opinion formation, not just its result
- Supports dynamic variable injection mid-simulation ("what if X breaks now?")
- ReportAgent produces structured output directly mappable to YES/NO confidence
- Open-source, self-hostable, fully auditable — no black-box API dependency
- Backed by Shanda Group / 22K+ GitHub stars as of March 2026

**Deployment:**
```bash
# Docker (recommended)
cp .env.example .env
docker compose up -d
# Frontend: localhost:3000 | Backend: localhost:5001

# Source
npm run dev
```

---

## 🤖 AGENT ROSTER

| Agent | Role | Has Web Search | Touches Capital |
|-------|------|:--------------:|:---------------:|
| **Elira** | Operations Manager — coordinates all agents, makes go/no-go calls | No | No |
| **Alba** | Research Analyst — scans markets, seeds MiroFish, flags uncertainty | Yes | No |
| **David** | Engineer — configures + runs MiroFish pipelines, maintains calibration log | No | No |
| **Vex** | Adversarial Auditor — tears apart David's setups before any deployment | No | No |
| **Steven** | Live Trader — executes approved positions on Polymarket / Kalshi | No | Yes |

---

## ⚡ MASTER WORKFLOW

```
Alba (market scan + seed package)
    ↓
David (MiroFish config → min. 3 simulation runs → Simulation Report)
    ↓
Vex (adversarial audit → PASS / PASS-WITH-WARNINGS / FAIL)
    ↓
Elira (final go/no-go + capital tier assignment)
    ↓
Steven (execute + monitor + resolution watch)
    ↓
David (calibration log update after every resolution)
    ↑________________________ feedback loop _______________________↑
```

**Hard rule:** No step may be skipped. Elira enforces sequence compliance.

---

## 🎯 TARGET MARKETS

**Primary Platforms:** Polymarket · Kalshi

**Market Selection Criteria:**
- Binary YES/NO resolution (maps cleanly to MiroFish prediction output)
- Liquidity > $500 in the market
- Days to resolution ≤ 14 (tighter window = less drift risk)
- Alba-assessed mispricing signal ≥ 5% vs. real-world news state
- Vex PASS or PASS-WITH-WARNINGS on simulation audit

**Market Categories (priority order):**
1. Political / regulatory decisions (high group-behavior signal)
2. Macroeconomic event outcomes (Fed, CPI, jobs data)
3. Geopolitical deadlines (treaties, sanctions, negotiations)
4. Corporate events (mergers, earnings beats, executive changes)

**Hard Blocks:**
- Markets resolving on a single unpredictable actor (one tweet = outcome)
- Alba HIGH-UNCERTAINTY flag on any active market
- Vex FAIL verdict — blocked until David reworks and resubmits
- MiroFish run variance > 15% between simulation passes

---

## 💰 CAPITAL SIZING TIERS

| Tier | MiroFish Confidence | Vex Verdict | Position Size |
|------|:-------------------:|:-----------:|:-------------:|
| 1 | 70–79% | PASS-WITH-WARNINGS or PASS | $25 |
| 2 | 80–89% | PASS | $50 |
| 3 | ≥ 90% | PASS + Vex HIGH confidence | $100 |

**Exit Rules (Steven enforces):**
- YES price +20% in our favor before expiry → take partial profit
- YES price -30% against us → flag to Elira for stop-loss review
- New information invalidates simulation premise → flag to Elira immediately

---

## 📋 DAILY OPERATIONS SEQUENCE

### Morning (session open)
1. **Alba** runs market scan → delivers Top Opportunity + Watchlist to Elira
2. **Alba** flags any major scheduled events (Fed, elections, rulings) within 14 days
3. **Elira** reviews Alba scan → assigns seed package work to David
4. **David** configures MiroFish for priority market → runs simulations

### Midday
5. **David** delivers Simulation Report → hands to Vex
6. **Vex** runs full audit checklist → delivers verdict to Elira
7. **Elira** makes go/no-go call → assigns capital tier → notifies Steven

### Afternoon / Evening
8. **Steven** executes approved positions
9. **Steven** monitors open positions → flags any resolution triggers
10. **David** updates calibration log for any resolved markets

---

## 🔬 MIROFISH SIMULATION CONFIG TEMPLATE

David uses this template when setting up each binary market simulation:

```
SIMULATION GOAL:
  Predict the binary outcome of: "[exact contract question]"
  Resolution date: [date]
  Resolution criteria: [exact contract language — copy verbatim]

SEED MATERIALS:
  [1] [source URL] — [1-sentence summary] — [recency: hours ago]
  [2] ...
  (minimum 5 sources; maximum 10; all within 72 hours for fast-moving markets)

AGENT POPULATION CONFIG:
  Domain: [political / financial / geopolitical / corporate]
  Agent mix: [e.g., 40% retail public, 30% domain experts, 20% media,
              10% institutional — adjust per market domain]
  Memory depth: standard
  Behavior logic: independent — no herding preset

VARIABLE INJECTIONS TO TEST:
  Scenario A: [baseline — no new information]
  Scenario B: [most likely breaking news in next 72 hours]
  Scenario C: [tail risk scenario — low probability, high impact]

MINIMUM RUNS: 3
STABILITY THRESHOLD: variance ≤ 15% across runs
HAND TO VEX IF: all runs complete AND variance ≤ 15%
SELF-BLOCK IF: variance > 15% OR fewer than 3 runs complete
```

---

## 🔥 VEX AUDIT CHECKLIST (mandatory before every deployment)

```
□ RESOLUTION CRITERIA MATCH
  Does simulation goal match contract language word-for-word?
  Semantic drift of any kind = FAIL

□ SEED QUALITY
  All sources < 72 hours old for fast-moving markets?
  Any single source > 50% of seed weight? Flag it.

□ AGENT POPULATION BIAS
  Is agent mix appropriate for THIS market's domain?

□ RUN STABILITY
  Variance ≤ 15% across all runs? >15% = FAIL

□ CONFIDENCE INFLATION
  Confidence > 85%? David must justify — Polymarket rarely misprices this far

□ SINGLE-POINT-OF-FAILURE
  Can one tweet / one judge / one announcement override the simulation?
  Flag as OVERRIDE RISK to Elira

□ LOOK-AHEAD CONTAMINATION
  Any seed material written after partial resolution? = FAIL, reseed required

□ CALIBRATION CHECK
  David's accuracy on this market category ≥ 60%?
  Below 60% = require manual Elira review before deployment
```

**Vex Verdicts:** `PASS` · `PASS-WITH-WARNINGS` · `FAIL`
**Fail → David reworks → resubmits to Vex → never goes directly to Elira**

---

## 📊 TRACKING & CALIBRATION

David maintains a **Calibration Log** — updated after every market resolution:

| Date | Market Question | Sim Confidence | Sim Direction | Actual Outcome | Hit/Miss | Notes |
|------|----------------|:--------------:|:-------------:|:--------------:|:--------:|-------|
| | | | | | | |

**Calibration targets:**
- Overall accuracy ≥ 65% (binary baseline = 50%, edge = 15pp above)
- Per-category accuracy tracked separately (political / financial / geopolitical)
- Any category falling below 55% for 5+ consecutive markets → Alba adjusts
  seed strategy for that category → David adjusts agent population config

---

## 🚫 PERMANENT HARD BLOCKS

| Block | Enforced By | Override Allowed |
|-------|-------------|:----------------:|
| Session FVG v3 — PnL discrepancy unresolved | N/A (legacy trading block) | No |
| Vex FAIL verdict | Elira blocks Steven | No |
| Alba HIGH-UNCERTAINTY flag | Elira hard stop | Elira discretion only |
| Run variance > 15% | David self-blocks | No |
| Missing Vex audit | Elira blocks Steven | No |
| Look-ahead contaminated seed | Vex FAIL | No — reseed required |

---

## 🗂️ FILE & FOLDER CONVENTION

```
/polymarket-ops/
├── CLAUDE.md                  ← this file
├── calibration-log.csv        ← David maintains
├── active-positions.md        ← Steven maintains
├── simulations/
│   ├── [YYYY-MM-DD]-[market-slug]/
│   │   ├── seed-package.md    ← Alba delivers
│   │   ├── mirofish-config.md ← David builds
│   │   ├── sim-report.md      ← David outputs
│   │   └── vex-audit.md       ← Vex outputs
└── resolved/
    └── [archive of closed positions with outcome]
```

---

## 📌 QUICK REFERENCE — WHO OWNS WHAT

| Decision | Owner |
|----------|-------|
| Which markets to research | Alba → Elira approves |
| MiroFish seed package | Alba |
| MiroFish simulation config + runs | David |
| Adversarial audit of simulation | Vex |
| Final go/no-go on capital deployment | Elira |
| Position execution and monitoring | Steven |
| Calibration log | David |
| Hard block enforcement | Elira |

---

*Last updated: 2026-03-14*
*MiroFish repo: https://github.com/666ghj/MiroFish*
*Operation: Polymarket / Kalshi binary prediction flipping*