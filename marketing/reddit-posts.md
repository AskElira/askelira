# Reddit Post Drafts

---

## r/programming

**Title:** AskElira: Open-source swarm intelligence — 10K AI agents debate your decisions and audit each other

**Body:**

I've been working on an open-source tool called AskElira that takes a different approach to AI-assisted decision making. Instead of asking one model for an answer, it deploys thousands of agents to argue both sides, then audits the quality of the debate before giving you a verdict.

### Architecture

The core is a 4-phase sequential pipeline:

1. **Alba (Research)** — Queries Brave Search for live context. The idea is that agents should debate with real information, not just training data.

2. **David (Debate)** — Spins up a MiroFish swarm on the OpenClaw gateway. Agents vote for or against, and votes are clustered into argument groups. You don't just get a yes/no — you get distinct clusters of reasoning.

3. **Vex (Audit)** — This is the part I'm most interested in feedback on. It runs 5 validation checks on the debate:
   - Did enough agents participate? (>50% threshold)
   - Are there at least 2 distinct clusters? (diversity check)
   - Does one cluster dominate >95%? (groupthink detection)
   - Is the vote margin meaningful? (>10% consensus strength)
   - Did the swarm produce actual arguments? (not just empty votes)

   Each failed check applies a confidence penalty. The idea is borrowed from how you'd evaluate a real team vote — unanimous agreement is sometimes a red flag.

4. **Elira (Synthesis)** — Combines everything into a final decision with a confidence score (0-100%) and a GO / CONDITIONAL / NO-GO verdict.

Each phase has a 60-second timeout and falls back gracefully. If Alba can't reach the search API, the debate still runs — just without web context. The final result tells you which phases failed via a `partial: true` flag.

### Demo

```
$ npm install -g askelira
$ askelira swarm -q "Should we rewrite auth from scratch?" -a 10000

Decision:   no
Confidence: 74%
Verdict:    GO

Arguments FOR:
  + Current auth has known vulnerabilities
  + Modern standards not supported

Arguments AGAINST:
  + Rewrite estimated at 6 weeks, existing bugs fixable in 2
  + Working auth rarely justifies full rewrite risk
  + Migration path exists without rewrite

Audit: all checks passed
Cost: $0.068
```

### Why I built it

I was backtesting trading strategies and realized I kept confirming my own bias. One model telling me "looks good" wasn't useful. I wanted adversarial reasoning — something that would actively try to poke holes in my assumptions. The audit phase came out of frustration with early versions where all 10K agents would agree on everything. Turns out you need to check whether that agreement is meaningful or just noise.

### Tech details

- Node.js, CommonJS, no external database required
- Hybrid memory: markdown files (human-readable, git-friendly) + JSON index for search
- CLI + web UI (Express/WebSocket) + Electron desktop app
- 68+ tests across 5 test suites, GitHub Actions CI
- MIT licensed

GitHub: https://github.com/askelira/askelira

I'd especially appreciate feedback on the audit phase design. Are the 5 checks sufficient? Too aggressive? What other heuristics would you add to detect low-quality consensus?

---

## r/node

**Title:** AskElira 2.0 — multi-agent swarm debate tool built entirely in Node.js (CLI + Web UI + Electron)

**Body:**

Sharing a project I've been building: AskElira is an npm package that deploys thousands of AI agents to debate a question and return a structured decision. Thought this community might find the technical choices interesting.

### What it does

You ask a question, agents argue for and against, an audit phase validates the debate quality, and you get back a decision with confidence score. The whole pipeline runs in ~5 seconds for 10K agents.

```bash
npm install -g askelira
askelira swarm -q "PostgreSQL vs DynamoDB for time-series data?" -a 10000
```

### npm package structure

```
askelira/
├── bin/cli.js              # Commander-based CLI (7 commands)
├── src/agents/             # 4 pipeline agents + orchestrator
├── src/cli/                # Command handlers (start, swarm, history, config, create)
├── src/gateway/            # OpenClaw gateway wrapper
├── src/memory/             # Hybrid storage (markdown + JSON index)
├── src/ui/                 # HTTP + WebSocket server
├── src/utils/              # Logger (chalk), cost calculator
├── electron/               # Desktop app (main, preload, menu, tray, notifications, updater)
├── public/                 # Frontend (vanilla JS, Tailwind CDN, Canvas viz)
├── templates/              # Project scaffolding (trading, hiring, product)
└── scripts/                # postinstall, version-bump, prepare-release
```

### Technical choices and tradeoffs

**chalk v4 pinned** — v5+ went ESM-only. Since the entire codebase is CommonJS (require/module.exports), I pinned chalk to ^4.1.2. Considered migrating to ESM but it would break the Electron build and `require()` usage throughout.

**No framework for the web UI** — The frontend is vanilla JS with Tailwind via CDN. Three custom components: a Canvas particle system for swarm visualization, an SVG circular gauge for the confidence meter, and a history panel. Felt like React/Vue was overkill for what's essentially one page with a form and a results panel.

**Markdown + JSON for memory** — Every debate is appended to `~/.askelira/memory/YYYY-MM-DD.md` (human-readable, git-friendly) and indexed in `index.json` for keyword search. Originally used ChromaDB for vector search but dropped it to avoid the native dependency. The JSON index with simple keyword scoring covers most use cases.

**Commander for CLI** — 7 commands with global `--verbose` and `--cost` flags. The `create` command does interactive prompts via readline (no inquirer dependency). Templates use `{{key}}` placeholder replacement.

**Electron with contextBridge** — `nodeIntegration: false`, `contextIsolation: true`. All IPC goes through a strict preload that only exposes specific methods. External URL opening validates http/https. Auto-updater via electron-updater with silent download.

### CLI commands

```bash
askelira start              # Gateway + web UI
askelira swarm -q "..."     # Run a debate
askelira history --recent 7 # View past debates
askelira config --list      # Show configuration
askelira create trading     # Scaffold from template
askelira templates          # List templates
```

### Testing

68+ tests across 5 files, all using Node's built-in `assert` module — no Jest runtime dependency for the test suite itself (Jest is there for `--coverage` only). Tests mock `globalThis.fetch` for API calls and use temp directories for filesystem tests.

```bash
npm test          # All suites
npm run test:unit # Skip integration tests
```

GitHub Actions CI runs on Node 18 + 20 for every push and PR.

### Docker

Multi-stage Dockerfile (build + runtime on `node:18-alpine`), docker-compose with health check and persistent volumes for memory/logs.

### What I'd do differently

- Would start with ESM if building from scratch today — the CJS/ESM split caused real friction with chalk and will only get worse
- The swarm visualization is fun but the Canvas particle system could use Web Workers for smoother animation at high agent counts
- Might replace the JSON index with SQLite for better query performance as debate history grows

GitHub: https://github.com/askelira/askelira

Happy to answer questions about any of the technical choices. Also looking for contributors — especially on new templates and custom agent implementations. The agent interface is simple enough that adding a new research source or audit check is ~50 lines.
