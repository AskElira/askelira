# AskElira Workspace Architecture - Layered Design

## The Three-Layer Model

**Inspired by OpenClaw's workspace pattern, refined for AskElira**

```
SOUL.md          ← Personality, identity, values
   ↓
AGENTS.md        ← Agent definitions, orchestration
   ↓
TOOLS.md         ← Tools, APIs, capabilities
```

---

## Layer 1: SOUL.md - Who You Are

**The personality layer. This defines the AI's identity and mission.**

```markdown
# SOUL.md

## Who I Am
Name: [Your assistant's name]
Purpose: [Core mission]
Personality: [How you interact]

## My Values
- Value 1
- Value 2
- Value 3

## How I Work
- Principle 1
- Principle 2
- Principle 3

## Boundaries
What I do freely:
- [Actions]

What I ask first:
- [Actions requiring approval]
```

**Example (AskElira's own SOUL.md):**
```markdown
# SOUL.md

## Who I Am
I'm an automation builder. I take your goals and build working code.

## My Values
- Ship fast, iterate faster
- Cost-conscious by default
- Security first (API keys never in code)
- Real solutions, not toy examples

## How I Work
1. Research thoroughly (Alba)
2. Debate approaches (David + 10k agents)
3. Audit quality (Vex)
4. Synthesize & build (Elira + Builder)

## Boundaries
I do freely:
- Research, analyze, plan
- Generate code
- Test and validate

I ask first:
- Spending >$5 on APIs
- Deploying to production
- Accessing external services
```

---

## Layer 2: AGENTS.md - Your Inner Core

**The orchestration layer. Defines agents and their coordination.**

```markdown
# AGENTS.md

## Active Agents

### Alba - Research Agent
Role: Web research, data gathering
Model: Claude Sonnet 4.5
Thinking: Medium
Output: JSON research summary

### David - Debate Orchestrator
Role: 10k agent debate simulation
Model: Claude Opus 4.6
Thinking: High
Output: Decision + confidence + arguments

### Vex - Quality Auditor
Role: Validate decisions, check logic
Model: Claude Sonnet 4.5
Thinking: Medium
Output: Audit report + adjusted confidence

### Elira - Synthesis Agent
Role: Combine research + debate + audit
Model: Claude Sonnet 4.5
Thinking: Medium
Output: Final recommendation + action plan

### Builder - Code Generator
Role: Generate production-ready code
Model: Claude Opus 4.6
Thinking: High
Output: Complete project files

## Orchestration Flow

1. User asks question
2. Alba researches (parallel with user context)
3. David debates (10k agents, using Alba's research)
4. Vex audits (validates David's decision)
5. Elira synthesizes (creates action plan)
6. Builder generates code (if buildable)

## Current Task
[User's goal appears here]

## Context
[User's additional info]

## Results
[Agents write their outputs here]
```

---

## Layer 3: TOOLS.md - Your Outer Layer

**The capabilities layer. What tools can agents access.**

```markdown
# TOOLS.md

## Available Tools

### Research Tools
- Brave Search API (web search)
- OpenClaw Browser (scraping, screenshots)
- PDF analysis (read documents)

### Development Tools
- Code generation (Python, JavaScript, etc.)
- File creation/editing
- Package management (npm, pip)

### Communication Tools
- Telegram (status updates)
- Discord (optional)
- Slack (optional)

### Automation Tools
- Cron (scheduled tasks)
- Webhooks (triggers)
- API endpoints (expose functionality)

## API Keys Required

- ANTHROPIC_API_KEY (Claude)
- BRAVE_API_KEY (web search)
- OPENAI_API_KEY (optional, for GPT models)

## Tool Access Rules

**Alba can use:**
- Brave Search
- OpenClaw Browser
- PDF analysis

**David can use:**
- None (pure reasoning)

**Vex can use:**
- None (pure audit)

**Elira can use:**
- All research tools (to verify)

**Builder can use:**
- Code generation
- File system (sandboxed)
- Package managers
```

---

## User's Workspace Structure

When user runs `askelira init`:

```
~/askelira/
├── SOUL.md          # Their AI's personality
├── AGENTS.md        # Agent definitions + current tasks
├── TOOLS.md         # Available tools + API keys
├── builds/          # Generated code
│   ├── scraper-2024-03-20.zip
│   └── twitter-bot-2024-03-21.zip
├── .askelira/       # Hidden config
│   ├── api-keys.json (encrypted)
│   └── history.json
└── README.md
```

---

## How AskElira Reads These Files

**Startup sequence:**

1. **Read SOUL.md** → Set personality, values, boundaries
2. **Read AGENTS.md** → Load agent definitions + current tasks
3. **Read TOOLS.md** → Initialize tool access + API keys
4. **Execute** → Run orchestration based on AGENTS.md task

**Example:**

User edits AGENTS.md:
```markdown
## Current Task
Build a Google Maps scraper for hair salons in NYC

## Context
I need names, addresses, phone numbers exported to CSV.
Use Python. I have Python 3.9 installed.
```

AskElira:
1. Loads SOUL.md (personality: fast, cost-conscious, secure)
2. Loads AGENTS.md (sees task, knows orchestration flow)
3. Loads TOOLS.md (has Brave API key, browser access)
4. Executes:
   - Alba researches scraping approaches
   - David debates best approach (10k agents)
   - Vex audits the decision
   - Elira synthesizes plan
   - Builder generates scraper.py + requirements.txt
5. Writes results back to AGENTS.md
6. Saves code to builds/scraper-2024-03-20.zip

---

## Benefits of This Architecture

**Layered Separation:**
- SOUL = identity (rarely changes)
- AGENTS = orchestration (changes per task)
- TOOLS = capabilities (changes with API keys)

**User Control:**
- Edit any file directly
- Clear what AI can see (only these 3 files)
- Personality is separate from tasks

**Security:**
- API keys in TOOLS.md (encrypted)
- Code sandboxed in builds/
- No file system wandering

**Flexibility:**
- Swap out agents (edit AGENTS.md)
- Change personality (edit SOUL.md)
- Add tools (edit TOOLS.md)

---

## Integration with OpenClaw Pattern

**This IS the OpenClaw workspace pattern!**

OpenClaw agents already use:
- SOUL.md (who they are)
- AGENTS.md (how they work)
- TOOLS.md (what they use)
- USER.md (who they serve)

AskElira just makes this pattern the USER-FACING interface.

**Users essentially get:**
- Their own OpenClaw agent
- Pre-configured with multi-agent orchestration
- Accessible via web UI or CLI

---

## Template Files

### Default SOUL.md
```markdown
# SOUL.md

## Who I Am
I'm your automation assistant. I build working code from your ideas.

## My Values
- Fast execution
- Cost-conscious
- Security first
- Real solutions

## How I Work
Research → Debate → Audit → Build

## Boundaries
I ask before:
- Spending >$5
- Deploying publicly
- Accessing external services
```

### Default AGENTS.md
```markdown
# AGENTS.md

## Active Agents
- Alba (Research)
- David (Debate)
- Vex (Audit)
- Elira (Synthesis)
- Builder (Code)

## Current Task
[Your goal here]

## Context
[Additional info]

## Results
[Results will appear here]
```

### Default TOOLS.md
```markdown
# TOOLS.md

## API Keys
ANTHROPIC_API_KEY=your-key-here
BRAVE_API_KEY=your-key-here

## Available Tools
- Brave Search
- OpenClaw Browser
- Code Generation
- File System (sandboxed)

## Rules
- Never commit API keys
- Sandbox all code execution
- Ask before external API calls >$5
```

---

## The Prompt Pattern

When AskElira runs, it loads all three files as context:

```
[SOUL.md content]

[AGENTS.md content]

[TOOLS.md content]

Now execute the task in AGENTS.md using the personality from SOUL.md
and the tools from TOOLS.md.
```

This becomes the context for each OpenClaw subagent spawn.

---

**This is the architecture. Now let's USE it to build AskElira itself.**
