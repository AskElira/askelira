# Roadmap

## Current: v2.0.0

Released March 2026. See [CHANGELOG.md](./CHANGELOG.md) for full details.

- 4-phase agent pipeline (Alba, David, Vex, Elira)
- Hybrid memory (markdown + JSON index)
- CLI with 7 commands
- Web UI with swarm visualization
- Electron desktop app
- 3 project templates (trading, hiring, product)
- 68+ unit and integration tests

---

## v2.1 — Templates and Agent Marketplace

**Target:** Q2 2026

### More Templates

- **Security audit** — Evaluate security posture of a system or codebase
- **Investment thesis** — Should you invest in this company/asset?
- **Technical debt** — Prioritize which tech debt to address first
- **Architecture review** — Evaluate proposed architecture changes
- **Vendor selection** — Compare vendors for a procurement decision
- **Risk assessment** — Comprehensive risk analysis for business decisions

### Agent Marketplace

Community-built agents that can be installed and swapped into the pipeline.

- `askelira install @community/reddit-research` — Replace Alba with Reddit-based research
- `askelira install @community/strict-audit` — Stricter Vex with custom thresholds
- Agent registry hosted on npm (scoped packages under `@askelira-agents/`)
- Discovery via `askelira marketplace search <keyword>`
- Version pinning and compatibility checks

### Other v2.1 Improvements

- Configurable phase timeouts (currently hardcoded at 60s)
- Debate history export (CSV, JSON, PDF)
- Batch mode: run multiple questions from a file
- Cost budgets: set a max spend per debate or per day
- Webhook notifications on debate completion

---

## v2.2 — Real-Time Collaboration

**Target:** Q3 2026

### Shared Debates

- Multiple users observe the same debate in real time
- Shared room URLs: `https://app.askelira.com/room/abc123`
- Live cursors showing who's viewing which phase
- Chat sidebar for team discussion during debates

### Team Workspaces

- Shared debate history across a team
- Role-based access: admin, member, viewer
- Team API keys and shared cost tracking
- SSO integration (Google, GitHub, SAML)

### Debate Annotations

- Add notes and tags to completed debates
- Upvote/downvote individual arguments
- Mark debates as "acted on" or "deferred"
- Link related debates together

### UI Improvements

- Dark/light theme toggle
- Mobile-responsive layout
- Drag-and-drop argument reordering
- Side-by-side debate comparison view

---

## v3.0 — Distributed Swarms

**Target:** Q1 2027

### Distributed Agent Execution

- Agents run across multiple nodes instead of a single gateway
- Horizontal scaling: add nodes to increase throughput
- Geographic distribution for latency-sensitive decisions
- Fault tolerance: debate continues if nodes drop

### Persistent Agent Memory

- Agents remember past debates and learn from outcomes
- Cross-debate context: "Last time we debated microservices, the team chose monolith"
- Agent specialization: agents develop expertise in domains over time
- Memory sharing between agents within a debate

### Blockchain Integration

- Immutable debate records on-chain for audit trails
- Cryptographic proof that a decision was made by N agents at time T
- Decentralized agent voting with verifiable tallies
- Smart contract triggers: automatically execute actions based on GO verdicts
- Token-gated access to premium agent pools

### Advanced Analytics

- Decision outcome tracking: was the swarm right?
- Confidence calibration: how well do confidence scores predict outcomes?
- Agent performance metrics: which agents contribute most to accuracy?
- Cost optimization recommendations based on historical data
- Dashboard with trends, accuracy over time, cost per decision

### Plugin System

- Formal plugin API for extending all layers (agents, UI, storage, transport)
- Plugin lifecycle hooks: onDebateStart, onPhaseComplete, onDebateEnd
- Plugin configuration via `askelira.config.json`
- Hot-reload plugins without restarting

---

## Backlog

Ideas under consideration, not yet scheduled.

- **Voice input** — Ask questions via microphone
- **Slack/Discord bot** — Run debates from chat
- **GitHub Actions integration** — Swarm debates in CI/CD (e.g., "should we merge this PR?")
- **RAG integration** — Feed codebase or documents as context instead of web search
- **Multi-language support** — Debates in languages other than English
- **Offline mode** — Run debates with local models (Ollama, llama.cpp)
- **Decision trees** — Chain multiple debates into conditional flows
- **A/B testing** — Run the same question with different agent counts and compare
- **Custom scoring** — User-defined confidence formulas
- **Audit log export** — SOC 2 / compliance-friendly audit trails

---

## Community Feedback

The roadmap is shaped by community input. Here's how to contribute:

### Request a Feature

Open an issue with the `feature-request` label:

```
https://github.com/askelira/askelira/issues/new?labels=feature-request
```

Include:
- What problem does this solve?
- Who benefits from this feature?
- Any implementation ideas?

### Vote on Priorities

React with a thumbs-up on existing feature request issues to signal priority. The most-requested features get scheduled first.

### Contribute Directly

See [CONTRIBUTING.md](../CONTRIBUTING.md) for setup instructions. Areas where contributions are especially welcome:

- **New templates** — Low barrier, high impact
- **Agent implementations** — Research agents for different APIs, stricter audit checks
- **UI components** — New visualizations, accessibility improvements
- **Documentation** — Tutorials, guides, translations
- **Tests** — Improve coverage, add edge cases

### Join the Discussion

- GitHub Discussions for open-ended ideas
- Issues for specific bugs or feature requests
- PRs for code contributions

### What We Won't Build

To keep AskElira focused, some things are intentionally out of scope:

- General-purpose chatbot features (AskElira is for decisions, not conversation)
- Built-in LLM hosting (use OpenClaw, Ollama, or cloud APIs)
- Proprietary lock-in (all data stays local by default, all formats are open)
