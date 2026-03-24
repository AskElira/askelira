# AskElira Workspace Design - The AGENTS.md File

## The Core Concept

**AskElira operates within a workspace file. The AI can ONLY see what's in that file.**

This is the security boundary AND the user's control interface.

## User Experience

### Installation
```bash
npm install -g askelira
askelira init
# Creates ~/askelira/AGENTS.md
```

### The AGENTS.md File

**Location:** `~/askelira/AGENTS.md`

**Contents (Initial):**
```markdown
# AskElira Workspace

## Current Task
[Paste your goal here]

## Context
[Paste any relevant files, docs, or information here]

## Results
[AskElira will write results here]

## Build History
[Completed automations appear here]
```

## How It Works

**User adds context:**
```markdown
# AskElira Workspace

## Current Task
Build me a Google Maps scraper for hair salons in NYC

## Context
I need to:
- Scrape business names, addresses, phone numbers
- Export to CSV
- Run locally on my Mac
- Use Python (I have Python 3.9)

I already tried BeautifulSoup but got rate-limited.

## Results
[AskElira will respond here]
```

**AskElira reads ONLY this file:**
- Spawns OpenClaw subagents with this context
- Agents research, debate, build
- Writes results back to AGENTS.md

**User sees updates in real-time:**
```markdown
## Results

[Alba - Research] 
Found 3 approaches:
1. Playwright + Google Maps API
2. Selenium with proxy rotation
3. Official Places API (paid)

Recommendation: Playwright + proxy rotation

[David - Debate]
10,000 agents debated:
- Decision: GO
- Confidence: 85%
- Approach: Playwright with delay randomization

[Builder - Code]
Generated files:
- scraper.py (main script)
- config.json (settings)
- requirements.txt (dependencies)
- README.md (instructions)

Download: /Users/you/askelira/builds/2024-03-20-scraper.zip
```

## Security Model

**What AI CAN see:**
- Content of ~/askelira/AGENTS.md
- Files explicitly pasted into AGENTS.md
- Nothing else on your computer

**What AI CANNOT see:**
- Your other files
- Browser history
- Personal data
- Anything outside AGENTS.md

**User is in control:**
- You choose what to paste in
- You can clear the file anytime
- Results are sandboxed

## Access Methods

### 1. Web UI
```bash
askelira web
# Opens http://localhost:3000
# Shows AGENTS.md content
# Type in the UI → updates AGENTS.md
# Swarm runs → writes to AGENTS.md
```

### 2. CLI
```bash
askelira run "Build me a scraper"
# Appends to AGENTS.md
# Runs swarm
# Writes results to AGENTS.md
# Shows in terminal
```

### 3. Direct Edit
```bash
# Just edit the file!
nano ~/askelira/AGENTS.md
# Add your task, save
askelira sync
# Runs the task
```

## Multi-Task Management

**AGENTS.md can track multiple tasks:**

```markdown
# AskElira Workspace

## Task 1: Google Maps Scraper
Status: ✅ Complete
Download: builds/scraper-2024-03-20.zip

## Task 2: Email Automation Tool
Status: 🔄 In Progress
[Alba researching email APIs...]

## Task 3: Dashboard for Sales Data
Status: ⏳ Queued
```

## Advanced: Multiple Workspaces

```bash
askelira init ~/projects/scraper/AGENTS.md
askelira init ~/projects/email-bot/AGENTS.md

# Switch workspace
askelira workspace ~/projects/scraper/AGENTS.md
askelira run "Add proxy support"
```

## Integration with OpenClaw

**AskElira IS an OpenClaw agent!**

The AGENTS.md file IS the OpenClaw workspace file pattern.

When you run AskElira:
1. It reads ~/askelira/AGENTS.md
2. Spawns OpenClaw subagents with that context
3. Subagents operate within that context boundary
4. Results write back to AGENTS.md

**This means:**
- Users need OpenClaw installed
- AskElira uses OpenClaw's security model
- Workspace files are the standard pattern
- Everything is sandboxed by design

## Benefits

**For Users:**
- ✅ Clear what AI can see (only AGENTS.md)
- ✅ Full control (edit the file!)
- ✅ Privacy (nothing else exposed)
- ✅ Simple (one file to manage)

**For Developers:**
- ✅ Security boundary is clear
- ✅ Context is explicit
- ✅ Easy to debug (just read the file!)
- ✅ Version controllable (git commit AGENTS.md)

**For AI:**
- ✅ Clear scope (only this file)
- ✅ Focused context
- ✅ Results have a home
- ✅ No file system wandering

## Example Workflow

**Day 1: User installs AskElira**
```bash
npm install -g openclaw askelira
askelira init
# ~/askelira/AGENTS.md created
```

**Day 1: First automation**
- User opens AGENTS.md
- Pastes: "Build me a Twitter bot"
- Runs: `askelira web`
- Swarm runs, code generated
- Downloads: twitter-bot.zip

**Day 2: Another task**
- Opens AGENTS.md again
- Adds: "Analyze my CSV file" + pastes CSV data
- Runs: `askelira run`
- Gets Python script for analysis

**Day 3: Refine previous work**
- Opens AGENTS.md
- Adds: "Add error handling to Twitter bot"
- Context is still there (past tasks logged)
- AskElira builds on previous work

## File Structure

```
~/askelira/
├── AGENTS.md           # Main workspace (what AI sees)
├── builds/             # Generated code
│   ├── scraper.zip
│   └── twitter-bot.zip
├── .askelira/          # Config (hidden)
│   ├── api-keys.json   # Encrypted API keys
│   └── history.json    # Task history
└── README.md           # User guide
```

## Implementation

**Update app/page.tsx:**
```typescript
// Read ~/askelira/AGENTS.md
const workspaceContent = await fs.readFile(
  path.join(os.homedir(), 'askelira', 'AGENTS.md'),
  'utf-8'
);

// Display in UI
<textarea value={workspaceContent} onChange={...} />

// When user submits:
// 1. Append to AGENTS.md
// 2. Run swarm with AGENTS.md as context
// 3. Write results back to AGENTS.md
```

**CLI command:**
```javascript
// bin/cli.js
const workspacePath = path.join(os.homedir(), 'askelira', 'AGENTS.md');
const content = await fs.readFile(workspacePath, 'utf-8');

// Append user's task
await fs.appendFile(workspacePath, `\n## Task: ${userInput}\n`);

// Run swarm with this context
const result = await runSwarmDebate(userInput, { context: content });

// Write results
await fs.appendFile(workspacePath, `\n### Results:\n${result}\n`);
```

## The Magic

**AskElira becomes ChatGPT for your computer, but:**
- Sandboxed (only sees AGENTS.md)
- Persistent (context saved between sessions)
- Controllable (you manage the file)
- Powerful (builds working code, not just advice)

**And the workspace file IS the OpenClaw pattern we already know.**

This is clean. This is simple. This is right.
