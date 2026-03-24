# AskElira 2.1 - Complete System Explanation

## What Is AskElira?

**AskElira is an autonomous automation building platform.** Users describe what automation they want in plain English, and the system builds it for them using a multi-agent architecture.

**NOT for trading** - It's for building ANY kind of automation (email systems, scrapers, schedulers, monitoring tools, etc.)

---

## The Core Concept: Buildings & Floors

### Buildings
A **building** = One complete automation project

Example: "Daily email digest of GitHub trending repos"

### Floors
A **floor** = One functional component of the automation

Example building with 6 floors:
1. **Floor 1**: GitHub data scraper
2. **Floor 2**: Email formatter
3. **Floor 3**: Email delivery system
4. **Floor 4**: Scheduler (triggers at 1pm daily)
5. **Floor 5**: Orchestration & error handling
6. **Floor 6**: Testing & deployment

Each floor must work independently AND integrate with other floors.

---

## The Agents

### 1. **Elira** (The Architect)
- **Role**: Plans the building (breaks goal into floors)
- **Input**: User's goal in plain English
- **Output**: 6 floors with clear success criteria
- **Example**: "Build 6-floor automation: scraper → formatter → delivery → scheduler → orchestration → testing"

### 2. **Alba** (The Researcher)
- **Role**: Researches HOW to build each floor
- **Input**: Floor description + success criteria
- **Output**: Technical approach (APIs, libraries, architecture)
- **Example**: "Use GitHub Trending page scraper with BeautifulSoup, requests library, retry logic..."

### 3. **Vex** (The Quality Gate)
- **Role**: Audits Alba's research AND David's code
- **Has 2 gates**:
  - **Gate 1**: Reviews Alba's research (legal? feasible? complete?)
  - **Gate 2**: Reviews David's code (works? secure? meets criteria?)
- **Output**: APPROVED or REJECTED (with specific issues to fix)
- **Example**: "REJECTED - Alba's approach violates Google ToS. Use official API instead."

### 4. **David** (The Builder)
- **Role**: Writes the actual code for the floor
- **Input**: Alba's approved research
- **Output**: Working code (Python, JS, etc.) + dependencies + documentation
- **Example**: Writes 200+ lines of Python code for GitHub scraper with error handling

### 5. **Steven** (The Monitor)
- **Role**: Monitors live floors for health/errors
- **Input**: Live automation running in production
- **Output**: Health checks, error alerts, improvement suggestions
- **Example**: "Floor 3 email delivery failing - SMTP timeout. Suggest: increase timeout to 30s"

---

## The Building Process (Step-by-Step)

### Example: "Send daily email with GitHub trending repos at 1pm EST"

#### **Step 0: Phase 0 - Business Plan (NEW!)**
**Agent**: Elira (conversational mode)
- Validates goal is legal/ethical/achievable
- Catches issues EARLY (before wasting time building)
- Refines goal through conversation

**Conversation:**
```
Elira: What do you mean by "trending"? GitHub's trending page? Most starred today?
User: GitHub's trending page, top 25 repos
Elira: Got it. Any specific languages or topics?
User: All languages, general trending
Elira: ✓ Approved! This is achievable. Here's the plan...
```

#### **Step 1: Floor Zero - Floor Planning**
**Agent**: Elira (architect mode)
- Designs 6 floors
- Each floor has: name, description, success criteria

**Output:**
```
Floor 1: GitHub Trending Scraper
  - Success: Retrieves top 25 repos with name, link, description

Floor 2: Email Formatter
  - Success: Formats repos into plain text email

Floor 3: Email Delivery System
  - Success: Sends email via SMTP

Floor 4: Scheduler & Time Zone Handling
  - Success: Triggers daily at 1pm EST

Floor 5: Orchestration & Error Handling
  - Success: Coordinates all floors, handles failures gracefully

Floor 6: Testing & Deployment
  - Success: All integration tests pass, system deployed
```

#### **Step 2: Floor 1 Building Loop**

**2.1 Alba Research (Iteration 1)**
```
Alba: "I'll use BeautifulSoup to scrape github.com/trending,
       parse repo names from <h2> tags, extract descriptions..."
```

**2.2 Vex Gate 1 Review**
```
Vex: "APPROVED - Approach is sound, uses legitimate scraping,
      includes error handling, respects rate limits."
```

**2.3 David Build**
```
David: [Writes 250 lines of Python code]
       - GitHubTrendingScraper class
       - Retry logic with exponential backoff
       - HTML parsing with BeautifulSoup
       - Error handling for network failures
```

**2.4 Vex Gate 2 Review**
```
Vex: "APPROVED - Code is production-ready, handles edge cases,
      includes logging, meets success criteria."
```

**2.5 Elira Floor Review**
```
Elira: "Floor 1 is LIVE ✓ Moving to Floor 2..."
```

#### **Step 3: Floors 2-6 Repeat**
Same process for each floor:
- Alba researches → Vex approves → David builds → Vex approves → Elira sets live

#### **Step 4: Building Complete**
All 6 floors are LIVE. User has a working automation!

#### **Step 5: Steven Monitoring**
Steven continuously monitors:
- Health checks every 5 minutes
- Alerts on errors
- Suggests improvements

---

## What "Simulation" Means in AskElira

**NOT financial market simulation!**

"Simulation" in AskElira context means:
1. **Alba simulates** different technical approaches
   - "What if we use API X vs scraping?"
   - "What if we use library Y vs Z?"
   - Alba picks the best approach

2. **David simulates** code execution paths
   - "What if the API fails?"
   - "What if the email server is down?"
   - David adds error handling for edge cases

3. **Vex simulates** failure scenarios
   - "What if this violates ToS?"
   - "What if this has security issues?"
   - Vex blocks bad approaches

**The goal**: Predict and prevent issues BEFORE building/deploying.

---

## Real Example Flow (End-to-End)

### User Goal
```
"I want automation to monitor tweets with #AI keyword
and send Slack alerts when important accounts tweet"
```

### Phase 0: Elira Conversation
```
Elira: Are you using Twitter's official API or scraping?
User: Official API
Elira: Good! Which accounts are "important"?
User: Accounts with >100K followers in tech industry
Elira: ✓ Approved! This is achievable with Twitter API v2.
```

### Floor Zero: Elira Plans
```
Floor 1: Twitter API Integration
Floor 2: Tweet Filtering Logic (keyword + follower count)
Floor 3: Importance Scorer (ML model to rank tweets)
Floor 4: Slack Webhook Integration
Floor 5: Monitoring Loop (poll every 5 minutes)
Floor 6: Deduplication & State Management
```

### Floor 1: Alba → Vex → David
```
Alba: "Use Twitter API v2 with Bearer token auth,
       search/recent endpoint with #AI query,
       filter by author_id followers_count..."

Vex Gate 1: ✓ APPROVED

David: [Writes Python code with tweepy library]

Vex Gate 2: ✓ APPROVED

Elira: Floor 1 LIVE ✓
```

### Floors 2-6: Same Process
Each floor gets built, tested, approved.

### Final Result
User has a working automation that:
- ✅ Monitors Twitter for #AI keyword
- ✅ Filters by follower count
- ✅ Scores tweet importance
- ✅ Sends Slack alerts
- ✅ Runs continuously with error handling

---

## Key Differences from Trading Systems

| Trading System | AskElira |
|----------------|----------|
| Scans markets for opportunities | Scans for automation patterns/approaches |
| Predicts price movements | Predicts best technical architecture |
| Executes trades | Executes code builds |
| Manages positions | Manages floor dependencies |
| Monitors P&L | Monitors floor health |
| Goal: Make money | Goal: Build working automation |

---

## What Alba Should Scan For

**NOT markets!**

Alba scans for:
1. **Existing automation patterns**
   - Has anyone built something similar?
   - What libraries/APIs did they use?
   - What worked? What failed?

2. **Technical feasibility**
   - Is this API available?
   - Are there rate limits?
   - What's the cost?

3. **Legal/ethical issues**
   - Does this violate ToS?
   - GDPR compliant?
   - Security risks?

4. **Alternative approaches**
   - API vs scraping?
   - Polling vs webhooks?
   - Cloud vs self-hosted?

**Alba's job**: Research and recommend the BEST technical approach for each floor.

---

## What David Should Simulate

**NOT market outcomes!**

David simulates:
1. **Edge cases**
   - What if API returns 500 error?
   - What if email server times out?
   - What if input is malformed?

2. **Error paths**
   - Retry logic
   - Fallback mechanisms
   - Graceful degradation

3. **Integration points**
   - How does Floor 1 output connect to Floor 2 input?
   - Data format compatibility?
   - Error propagation between floors?

**David's job**: Write ROBUST code that handles real-world failures.

---

## CLI Commands

### Build a New Automation
```bash
askelira build
# Starts Phase 0 conversation → Floor planning → Building
```

### Watch Building Progress
```bash
askelira watch <goalId>
# Live dashboard showing floor status, progress %
```

### Check All Buildings
```bash
askelira status
# Lists all buildings with progress
```

### View Agent Logs
```bash
askelira logs <goalId> --tail
# Live stream of Alba, David, Vex, Elira actions
```

### View Floor Details
```bash
askelira floors <goalId>
# Lists all 6 floors with status, iteration count
```

---

## Success Metrics

A building is successful when:
- ✅ All 6 floors are LIVE
- ✅ Each floor meets its success criteria
- ✅ Integration tests pass
- ✅ Steven reports "healthy" for all floors
- ✅ User has a working automation they can run

**NOT** when it makes money or predicts markets correctly!

---

## Common Misconceptions

### ❌ "AskElira predicts market movements"
**✗ NO** - AskElira predicts the best WAY to build an automation

### ❌ "Alba scans for trading opportunities"
**✗ NO** - Alba researches technical approaches and APIs

### ❌ "David executes trades"
**✗ NO** - David writes code that the user runs

### ❌ "Vex evaluates trade quality"
**✗ NO** - Vex evaluates code quality and research soundness

### ❌ "Buildings are trading strategies"
**✗ NO** - Buildings are automation projects (can be for ANYTHING)

---

## Example Building Types

AskElira can build:
- 📧 Email automation systems
- 🔍 Web scrapers
- 📊 Data analysis pipelines
- 🔔 Monitoring & alerting systems
- 📅 Scheduling systems
- 🤖 Chatbots
- 🔄 ETL (Extract, Transform, Load) workflows
- 📈 Analytics dashboards
- 🔐 Security monitoring
- 💬 Social media automation

**Anything that can be automated!**

---

## Summary for Other Claude

**Quick Answer:**

AskElira is like "Zapier but with AI agents that write custom code instead of using pre-built integrations."

**The Flow:**
1. User: "I need X automation"
2. Elira: Plans 6 floors to build it
3. Alba: Researches best tech approach for each floor
4. Vex: Quality gates (reject bad approaches)
5. David: Writes the actual code
6. Steven: Monitors after deployment

**Your Confusion Came From:**
- The term "simulation" (sounds like prediction markets)
- Alba "scanning" (sounds like market scanning)
- "Buildings" (sounds abstract)

**Reality:**
- Simulation = testing different technical approaches
- Alba scanning = researching APIs/libraries/patterns
- Buildings = complete automation projects (like GitHub repos)

---

**You can now reconfigure correctly!** 🎉

AskElira builds automations, not trading strategies. The agents are software engineers, not traders.
