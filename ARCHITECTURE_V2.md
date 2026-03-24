# AskElira 2.1 - OpenClaw Native

## The Vision

**One Install. Add Keys. Full Automation.**

```bash
npm install -g openclaw askelira
askelira setup
# Enter API keys
# Done. Full automation ready.
```

## Architecture

### User Experience

```
User: "Build me a Google Maps scraper"
  ↓
AskElira Web UI (localhost:3000)
  ↓
OpenClaw Orchestration Layer
  ↓
Subagent Swarm:
  - Alba (Research)
  - David (10k Debate)
  - Vex (Audit)
  - Elira (Synthesize)
  - Builder (Code Generation)
  - Tester (Validation)
  ↓
Download: google-maps-scraper.zip
```

### Tech Stack

**Removed:**
- ❌ Claude Code CLI (subprocess hell)
- ❌ Manual permission approvals
- ❌ Fragile PTY integration

**Added:**
- ✅ OpenClaw subagents (full control)
- ✅ Multi-model orchestration
- ✅ Programmatic sessions
- ✅ Real-time streaming

### Installation

```bash
# Step 1: Install OpenClaw
npm install -g openclaw

# Step 2: Install AskElira
npm install -g askelira

# Step 3: Setup
askelira setup
> Enter ANTHROPIC_API_KEY: sk-ant-***
> Enter BRAVE_API_KEY: BSA***
> Enter OPENAI_API_KEY (optional): ***
✅ Configuration saved!

# Step 4: Run
askelira web
# Opens http://localhost:3000
```

### Package Structure

```json
{
  "name": "askelira",
  "version": "2.1.0",
  "peerDependencies": {
    "openclaw": "^1.0.0"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "@react-three/fiber": "^8.0.0",
    "three": "^0.150.0"
  }
}
```

### Agent Implementation (OpenClaw Subagents)

**Alba (Research):**
```javascript
const albaAgent = await sessions_spawn({
  runtime: "subagent",
  agentId: "askelira-alba",
  task: `Research: ${userQuestion}`,
  thinking: "medium",
  mode: "run"
});
```

**David (10k Swarm):**
```javascript
const davidAgent = await sessions_spawn({
  runtime: "subagent", 
  agentId: "askelira-david",
  task: `Debate with 10k agents: ${userQuestion}\nContext: ${albaResults}`,
  model: "opus-4.6", // Heavy thinking
  thinking: "high",
  mode: "run"
});
```

**Builder (Code Gen):**
```javascript
const builderAgent = await sessions_spawn({
  runtime: "subagent",
  agentId: "askelira-builder",
  task: `Build: ${buildPlan}\n\nRequirements:\n${requirements}`,
  model: "opus-4.6",
  thinking: "high",
  mode: "run",
  cwd: "./output"
});
```

### Autoresearch (Default Enabled)

**Browser automation via OpenClaw:**
```javascript
// OpenClaw has browser control built-in!
const research = await browser({
  action: "navigate",
  url: topResult.url,
  snapshot: true
});
```

### Benefits

**For Users:**
- One install command
- Add API keys once
- Full automation immediately
- No subprocess debugging
- Works on Mac/Linux/Windows

**For Us:**
- Full programmatic control
- Multi-model orchestration
- Real-time progress tracking
- Session persistence
- Easier debugging

**For OpenClaw:**
- Killer use case (autonomous automation)
- Showcases subagent power
- Real-world orchestration example

## Migration Path

1. ✅ Remove Claude Code references
2. ✅ Convert agents to OpenClaw subagents
3. ✅ Update installation docs
4. ✅ Add `askelira setup` command
5. ✅ Enable autoresearch by default
6. ✅ Test full workflow
7. ✅ Deploy

## Dependencies

```
User's Machine
  ↓
OpenClaw (orchestration)
  ↓
AskElira (UI + agents)
  ↓
Anthropic API (via user's key)
  ↓
Brave Search API (via user's key)
```

**Clean. Simple. Powerful.**

## The Goal

> "Connect APIs. Get full automation."

That's it. That's AskElira 2.1.
