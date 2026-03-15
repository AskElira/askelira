# 🔮 AskElira

**Ask Elira anything. She predicts binary outcomes using 5 AI agents + swarm intelligence.**

Will the Lakers win? Will Bitcoin hit $100K? Who wins the election?

**Elira researches, simulates crowd behavior, validates, and gives you predictions.** Optionally, she can auto-trade on her predictions.

Open source (MIT). Built for prediction markets, adaptable for sports, crypto, futures, forex, or any yes/no outcome.

---

## 🎯 What Elira Does

**Ask her any binary question:**
```
"Ask Elira: Will the Lakers beat the Warriors?"
"Ask Elira: Will Trump win in 2028?"
"Ask Elira: Will Bitcoin reach $100K by June?"
"Ask Elira: Will the Fed cut rates in March?"
```

**How she answers:**
1. 🔍 **Researches** (web search, news, data)
2. 🧠 **Simulates** (thousands of AI agents predict via swarm intelligence)
3. 🛡️ **Validates** (quality checks, catches bad logic)
4. 🎯 **Predicts** (gives you confidence % + direction)
5. 💰 **Trades** (optional: auto-execute on prediction markets/brokers)

---

## ⚡ Quick Start

```bash
# 1. Clone
git clone https://github.com/jellyforex/askelira.git
cd askelira

# 2. Install
pip install -r requirements.txt

# 3. Setup
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# 4. Start MiroFish (swarm intelligence engine)
cd MiroFish/Mirofish && docker-compose up -d && cd ../..

# 5. Ask Elira anything
./start_paper_trading.sh --once
```

**First prediction takes ~5-8 minutes.** Results appear in `data/active_positions.json`

---

## 🤖 Meet Elira's Team

**Elira orchestrates 5 specialized AI agents:**

| Agent | Role | What They Do |
|-------|------|--------------|
| **Alba** | Research Analyst | Web search, market scan, news gathering, data collection |
| **David** | Simulation Engineer | Runs MiroFish swarm intelligence (thousands of AI agents predict) |
| **Vex** | Quality Auditor | Validates predictions, catches bad logic, blocks flawed reasoning |
| **Elira** | Decision Maker | Coordinates team, makes final call, talks to you |
| **Steven** | Executor | Places trades (if enabled), tracks positions, manages exits |

**+ MiroFish:** Swarm intelligence engine (simulates crowd behavior to predict outcomes)

---

## 🎨 Two Modes

### **Mode 1: Prediction Only** (Default)
```bash
ELIRA_MODE=predict
```
- Get predictions with confidence scores
- No trading, just insights
- Free (except API costs ~$0.01/prediction)

**Example:**
```
You: "Will Bitcoin hit $100K by June?"
Elira: "68% likely YES (based on swarm simulation of 1000 trader agents)"
```

### **Mode 2: Auto-Trade** (Optional)
```bash
ELIRA_MODE=trade
```
- Elira auto-executes trades on her predictions
- Paper trading (safe) or real money (requires broker API)
- Confidence-based position sizing

**Example:**
```
You: "Will Bitcoin hit $100K by June?"
Elira: "68% YES. Current odds: 2.4x payout. 
        Should I bet $25? (Tier 1 confidence)"
You: "Yes"
Elira: "✅ Position opened: $25 on YES"
```

---

## 🧠 How It Works

```
You ask: "Will the Warriors beat the Lakers?"
    ↓
Alba researches:
  → Game stats, injury reports, betting odds
  → Recent performance, head-to-head records
  → Expert predictions, crowd sentiment
    ↓
David simulates:
  → 1000 AI "sports bettors" predict the game
  → MiroFish swarm intelligence models crowd consensus
  → Outputs: 72% Warriors, 28% Lakers
    ↓
Vex validates:
  → Checks data quality (no stale stats)
  → Verifies logic (no contradictions)
  → Blocks prediction if flawed
    ↓
Elira decides:
  → "Warriors 72% likely to win"
  → Optional: "Want me to bet $50?"
    ↓
Steven executes (if trading enabled):
  → Places bet on sportsbook
  → Tracks position
  → Alerts on result
```

**Self-learning:** Stores all outcomes → learns from wins/losses → improves over time.

---

## 🎯 What Elira Predicts (Default)

**Built for prediction markets:**
- Polymarket (US politics, world events, economics)
- Kalshi (regulated prediction markets)
- Sports betting (via adaptation)

**Prediction categories:**
- 🗳️ Politics (elections, policies, resignations)
- 📊 Economics (Fed rates, CPI, GDP)
- 🏀 Sports (game outcomes, championships)
- 💰 Markets (stock moves, crypto prices)
- 🌍 World events (treaties, conflicts, climate)

---

## 🔧 Adapt Elira for YOUR Use Case

**With 4-6 hours of customization, Elira can predict:**

### **NQ/ES Futures** (bullish/bearish today)
- Alba → Economic data + market news
- Steven → Broker API (IBKR, TastyTrade)
- [Guide: `docs/CUSTOM_USE_CASES.md`](docs/CUSTOM_USE_CASES.md)

### **Crypto** (BTC/ETH up/down)
- Alba → On-chain data + crypto news
- Steven → Exchange API (Binance, Coinbase)

### **Forex** (EUR/USD direction)
- Alba → Central bank data + economic indicators
- Steven → Forex broker API

### **Sports** (team wins/loses)
- Alba → Game stats + injury reports
- Steven → Sportsbook API

**MiroFish adapts automatically.** It models crowd behavior for ANY domain.

---

## 📊 Accuracy Targets

| Prediction Type | Target Accuracy |
|-----------------|-----------------|
| Overall | ≥65% |
| High Confidence (≥80%) | ≥75% |
| Politics | ≥70% |
| Economics | ≥68% |
| Sports | ≥63% |

**With self-learning:** Accuracy improves over time as Elira learns from outcomes.

---

## 💰 Cost

**Per prediction:** ~$0.015 (Claude API)
- Alba research: ~$0.005
- Vex validation: ~$0.006
- David postmortem: ~$0.001
- MiroFish: $0 (self-hosted)

**ROI:** With 65% accuracy, profitable after ~5 winning trades.

---

## 🚀 Deployment

### **Prediction Mode (Safe)**
```bash
./start_paper_trading.sh --schedule
```
Daily predictions at 09:00, monitoring at 08:45.

### **Trading Mode** (Requires setup)
1. Set `ELIRA_MODE=trade` in `.env`
2. Implement broker API in `Agents/steven.py`:
   - Polymarket: `_execute_polymarket_trade()`
   - Kalshi: `_execute_kalshi_trade()`
   - Your broker: IBKR, TastyTrade, etc.

---

## 📚 Documentation

- [How to Deploy](DEPLOYMENT_READY.md)
- [Adapt for Your Use Case](docs/CUSTOM_USE_CASES.md)
- [How Validation Works](VEX_SUMMARY.md)
- [System Architecture](BUILD_STATUS.md)
- [MiroFish Integration](claude.md)

---

## 🌐 Use Cases

**What people are building:**
- Sports betting edge finder
- Political prediction tracker
- Crypto swing trader
- NQ futures predictor
- Forex direction caller

**Share yours!** Submit PRs with your custom adaptations.

---

## 📜 License

MIT — Use freely, modify, build products.

---

## 🙏 Credits

- **MiroFish** — https://github.com/666ghj/MiroFish
- **Anthropic Claude** — LLM backbone
- **Pinecone** — Vector memory
- Built by **Jelly** (2026)

---

## ⚠️ Disclaimer

Educational purposes. Not financial advice.

Predictions involve uncertainty. Trading involves risk. Paper trade first. Verify logic. Use at your own risk.

---

**🔮 Ask Elira anything. She'll figure it out.**

Domain: **askelira.com** (coming soon)

[Get Started](#-quick-start) | [Adapt Elira](docs/CUSTOM_USE_CASES.md) | [Documentation](#-documentation)
