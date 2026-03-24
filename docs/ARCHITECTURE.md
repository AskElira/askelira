# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Entry Points                       │
│                                                         │
│  ┌──────────┐   ┌──────────┐   ┌────────────────────┐  │
│  │  CLI     │   │  Web UI  │   │  Electron Desktop  │  │
│  │ bin/cli  │   │ public/  │   │  electron/main.js  │  │
│  └────┬─────┘   └────┬─────┘   └────────┬───────────┘  │
│       │              │                   │              │
└───────┼──────────────┼───────────────────┼──────────────┘
        │              │                   │
        ▼              ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                    Service Layer                        │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐                   │
│  │  Gateway     │   │  UI Server   │                   │
│  │  :5678       │   │  :3000       │                   │
│  │  OpenClaw    │   │  HTTP + WS   │                   │
│  └──────┬───────┘   └──────┬───────┘                   │
│         │                  │                            │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    Agent Pipeline                       │
│                                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │  Alba  │→ │ David  │→ │  Vex   │→ │ Elira  │       │
│  │Research│  │ Debate │  │ Audit  │  │Synthesize│      │
│  └────────┘  └────────┘  └────────┘  └────────┘       │
│                                                         │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Storage Layer                        │
│                                                         │
│  ┌──────────────────┐   ┌──────────────────┐           │
│  │  Markdown Files  │   │  JSON Index      │           │
│  │  ~/.askelira/    │   │  ~/.askelira/    │           │
│  │  memory/*.md     │   │  memory/index.json│          │
│  └──────────────────┘   └──────────────────┘           │
│                                                         │
│  ┌──────────────────┐   ┌──────────────────┐           │
│  │  Log Files       │   │  Configuration   │           │
│  │  ~/.askelira/    │   │  ~/.askelira/    │           │
│  │  logs/*.log      │   │  .env            │           │
│  └──────────────────┘   └──────────────────┘           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Agent Pipeline

The core of AskElira is a 4-phase sequential pipeline orchestrated by the `Swarm` class. Each phase receives the output of previous phases and produces structured data for downstream consumers.

```
Question (string)
    │
    ▼
┌────────────────────────────────────────────────┐
│  Phase 1: ALBA (Research)                      │
│                                                │
│  Input:  question                              │
│  Action: Query Brave Search API (up to 5 hits) │
│  Output: { summary, sources[], context, cost } │
│  Timeout: 60s                                  │
│  Fallback: empty summary, no sources           │
└───────────────────┬────────────────────────────┘
                    │ ResearchResult
                    ▼
┌────────────────────────────────────────────────┐
│  Phase 2: DAVID (Swarm Debate)                 │
│                                                │
│  Input:  question + ResearchResult             │
│  Action: POST /v1/swarm (create)               │
│          POST /v1/swarm/:id/debate (run)       │
│          Cluster votes locally                 │
│  Output: { clusters[], votes, consensus,       │
│            argumentsFor[], argumentsAgainst[],  │
│            consensusStrength, cost }            │
│  Timeout: 60s                                  │
│  Fallback: empty clusters, zero votes          │
└───────────────────┬────────────────────────────┘
                    │ SwarmResult
                    ▼
┌────────────────────────────────────────────────┐
│  Phase 3: VEX (Audit)                          │
│                                                │
│  Input:  question + SwarmResult                │
│  Action: Run 5 validation checks               │
│  Output: { passed, notes[], issues[],          │
│            confidenceAdjustment, cost }         │
│  Timeout: 60s                                  │
│  Fallback: failed audit, -20 penalty           │
└───────────────────┬────────────────────────────┘
                    │ AuditResult
                    ▼
┌────────────────────────────────────────────────┐
│  Phase 4: ELIRA (Synthesis)                    │
│                                                │
│  Input:  question + ResearchResult             │
│          + SwarmResult + AuditResult            │
│  Action: Calculate confidence, determine       │
│          decision, build reasoning              │
│  Output: { decision, confidence, verdict,      │
│            reasoning, argumentsFor/Against,     │
│            votes, cost }                        │
│  Timeout: 60s                                  │
│  Fallback: inconclusive, 0 confidence, NO-GO   │
└───────────────────┬────────────────────────────┘
                    │ SynthesisResult
                    ▼
             DebateResult (final)
```

### Error Handling

Each phase is wrapped by `Swarm._runPhase()`:

```
fn() ──→ _withTimeout(60s) ──→ Success: return result
                               │
                               └→ Error/Timeout: log error,
                                  push to errors[], return fallback
```

If any phase fails, the pipeline continues with the fallback value. The final `DebateResult` has `partial: true` and an `errors` array describing which phases failed.

---

## Memory System Architecture

```
saveToMemory(result)
    │
    ├──→ saveToFile(result)
    │       │
    │       └──→ Append to ~/.askelira/memory/YYYY-MM-DD.md
    │            Format: Markdown with ## heading, **bold** fields
    │
    └──→ saveToIndex(result)
            │
            └──→ Append to ~/.askelira/memory/index.json
                 Format: JSON array of { id, question, decision, ... }
                 Capped at 1,000 entries (FIFO)

searchMemory(query)
    │
    └──→ Read index.json
         Score each entry by keyword relevance
         Return top N results sorted by score

getRecentDebates(days)
    │
    └──→ For each day in range:
           Read YYYY-MM-DD.md (if exists)
           Split on "---" separator
           Parse fields via regex
           Return ParsedDebate[]
```

### File Structure

```
~/.askelira/
├── memory/
│   ├── index.json          # Search index (JSON array, max 1000 entries)
│   ├── 2026-03-19.md       # Today's debates
│   ├── 2026-03-18.md       # Yesterday's debates
│   └── ...
├── logs/
│   ├── 2026-03-19.log      # Today's logs
│   └── ...
└── .env                    # Configuration (API keys, settings)
```

### Markdown Format

Each debate is appended as a section separated by `---`:

```markdown
---

## 14:30:00 — Should we use GraphQL?

**Decision:** yes
**Confidence:** 78%
**Agents:** 10,000
**Cost:** $0.068
**Duration:** 4200ms

### Arguments For
- Flexible queries
- Strong typing

### Arguments Against
- Complexity
- Caching challenges

### Audit Notes
- All checks passed
```

---

## UI–Gateway–Agent Communication

### Request Flow

```
┌──────────┐    HTTP/WS     ┌──────────┐    HTTP     ┌──────────┐
│  Browser  │ ──────────→  │ UI Server │ ─────────→ │  Swarm   │
│  or       │ ←────────── │  :3000    │ ←───────── │ Pipeline │
│  Electron │   JSON/WS    └─────┬────┘             └────┬─────┘
└──────────┘                     │                       │
                                 │                       │ HTTP
                                 │                       ▼
                                 │               ┌──────────────┐
                                 │               │   OpenClaw   │
                                 │               │   Gateway    │
                                 │               │   :5678      │
                                 │               └──────────────┘
                                 │
                                 │ WebSocket
                                 ▼
                          Real-time updates
                          (phase progress,
                           swarm status)
```

### HTTP Endpoints (UI Server)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/swarm` | Start a new debate |
| GET | `/api/history` | Retrieve debate history |
| GET | `/api/status` | Gateway status |
| GET | `/*` | Static files (public/) |

### WebSocket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Server → Client | `phase` | `{ name, status, data }` |
| Server → Client | `result` | `DebateResult` |
| Server → Client | `error` | `{ message }` |
| Client → Server | `subscribe` | `{ debateId }` |

### Electron IPC

The Electron app uses `contextBridge` for secure communication between the renderer process and main process:

```
┌─────────────────┐     contextBridge      ┌─────────────────┐
│  Renderer       │ ◄──── preload.js ────► │  Main Process   │
│  (public/*.js)  │     window.askelira    │  (electron/     │
│                 │                        │   main.js)      │
│  Calls:         │     IPC Channels:      │  Handles:       │
│  startSwarm()   │ ──► start-swarm ─────► │  Run pipeline   │
│  getHistory()   │ ──► get-history ─────► │  Read memory    │
│  getStatus()    │ ──► get-status ──────► │  Check gateway  │
│  getConfig()    │ ──► get-config ──────► │  Read .env      │
└─────────────────┘                        └─────────────────┘
```

Security constraints:
- `nodeIntegration: false` — renderer has no Node.js access
- `contextIsolation: true` — preload runs in isolated context
- `openExternal()` validates URLs are http/https only

---

## Data Flow: Complete Debate Lifecycle

```
1. User submits question
   │
   ├─ CLI:      askelira swarm -q "..."
   ├─ Web UI:   POST /api/swarm { question, agents }
   └─ Electron: ipcRenderer.invoke('start-swarm', { question, agents })
       │
       ▼
2. Swarm.debate(question) begins
   │
   ├─ Phase 1: Alba.research(question)
   │    └─ GET https://api.search.brave.com/res/v1/web/search?q=...
   │
   ├─ Phase 2: David.swarm(question, research)
   │    ├─ POST http://localhost:5678/v1/swarm
   │    └─ POST http://localhost:5678/v1/swarm/:id/debate
   │
   ├─ Phase 3: Vex.audit(question, swarmResult)
   │    └─ (local computation, no external calls)
   │
   └─ Phase 4: Elira.synthesize(question, { research, swarmResult, audit })
        └─ (local computation, no external calls)
       │
       ▼
3. DebateResult returned
   │
   ├─ Displayed to user (CLI/UI/Electron)
   ├─ saveToMemory(result)
   │    ├─ Append to ~/.askelira/memory/YYYY-MM-DD.md
   │    └─ Append to ~/.askelira/memory/index.json
   └─ Cost recorded to ledger
```

---

## Component Dependency Graph

```
bin/cli.js
 ├── src/cli/start.js ──→ src/gateway/index.js
 │                    ──→ src/ui/server.js
 ├── src/cli/swarm.js ──→ src/agents/swarm.js
 ├── src/cli/history.js ──→ src/memory/index.js
 ├── src/cli/config.js
 └── src/cli/create.js

src/agents/swarm.js
 ├── src/agents/alba.js ──→ Brave Search API (external)
 ├── src/agents/david.js ──→ OpenClaw Gateway (localhost:5678)
 ├── src/agents/vex.js
 └── src/agents/elira.js

src/ui/server.js
 ├── src/agents/swarm.js
 ├── src/memory/index.js
 └── public/* (static files)

electron/main.js
 ├── electron/preload.js
 ├── electron/menu.js
 ├── electron/tray.js
 ├── electron/notifications.js
 ├── electron/updater.js
 ├── src/gateway/index.js
 └── src/ui/server.js

src/memory/index.js ──→ ~/.askelira/memory/ (filesystem)
src/utils/logger.js ──→ ~/.askelira/logs/ (filesystem)
src/utils/cost-calculator.js (in-memory ledger, no I/O)
```

---

## Extensibility Patterns

### Adding a New Agent

1. Create `src/agents/my-agent.js` implementing the phase interface
2. Import in `src/agents/swarm.js`
3. Add a new `_runPhase()` call in `debate()` with a fallback object
4. Pass the agent's output to downstream phases

```javascript
// src/agents/swarm.js
const { MyAgent } = require('./my-agent');

class Swarm {
  constructor(opts) {
    // ...existing agents...
    this.myAgent = new MyAgent();
  }

  async debate(question) {
    // ...existing phases...

    // New phase between Vex and Elira
    const extra = await this._runPhase('MyAgent',
      () => this.myAgent.run(question, swarmResult),
      { result: null, cost: 0 },
      errors
    );
    totalCost += extra.cost || 0;

    // Pass to Elira
    const synthesis = await this._runPhase('Elira',
      () => this.elira.synthesize(question, { research, swarmResult, audit, extra }),
      // ...fallback...
    );
  }
}
```

### Replacing an Agent

Override the agent instance before calling `debate()`:

```javascript
const swarm = new Swarm({ agents: 10000 });
swarm.alba = new MyCustomResearchAgent();
const result = await swarm.debate('...');
```

### Adding a CLI Command

1. Create `src/cli/my-command.js` exporting an async function
2. Register in `bin/cli.js`:

```javascript
program
  .command('my-command')
  .description('Description')
  .option('-f, --flag <value>', 'Option description')
  .action(require('../src/cli/my-command'));
```

### Adding a UI API Endpoint

Add a route in `src/ui/server.js`:

```javascript
// In the request handler
if (url === '/api/my-endpoint' && method === 'GET') {
  const data = await myFunction();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
  return;
}
```

### Adding an Electron IPC Channel

1. Add handler in `electron/main.js`:

```javascript
ipcMain.handle('my-channel', async (event, args) => {
  return await doSomething(args);
});
```

2. Expose in `electron/preload.js`:

```javascript
contextBridge.exposeInMainWorld('askelira', {
  myMethod: (args) => ipcRenderer.invoke('my-channel', args),
});
```

### Adding a Vex Validation Check

Add a new private method in `src/agents/vex.js` and call it from `audit()`:

```javascript
// In audit()
const myCheck = this._checkMyThing(swarmResult);
if (!myCheck.passed) {
  issues.push(myCheck.issue);
  confidenceAdjustment += myCheck.penalty;
}

// New method
_checkMyThing(swarmResult) {
  if (/* condition fails */) {
    return {
      passed: false,
      issue: { check: 'my_check', severity: 'warning', message: '...' },
      penalty: -10,
    };
  }
  return { passed: true };
}
```

### Adding a Template

1. Add an entry to the `TEMPLATES` object in `src/cli/create.js`:

```javascript
const TEMPLATES = {
  // ...existing...
  mytemplate: {
    name: 'My Template',
    description: 'What this template does',
    fields: [
      { key: 'name', prompt: 'Project name', default: 'my-project' },
    ],
  },
};
```

2. Optionally add template files in `templates/mytemplate/` with `{{key}}` placeholders.
