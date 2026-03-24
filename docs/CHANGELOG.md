# Changelog

All notable changes to AskElira are documented here.

## [2.0.0] — 2026-03-19

### Initial Release

AskElira 2.0 — Visual swarm intelligence for developers.

#### Multi-Agent Swarm Pipeline
- 4-phase reasoning pipeline: Alba (Research) → David (Debate) → Vex (Audit) → Elira (Synthesis)
- Alba integrates Brave Search API for live web research
- David runs MiroFish swarm debates via OpenClaw gateway with vote clustering
- Vex validates debate quality: participation, cluster diversity, dominance, consensus strength, argument quality
- Elira synthesizes final decision with confidence score and GO/CONDITIONAL/NO-GO verdict
- Per-phase error handling with fallbacks and partial results
- 60-second timeout protection per phase

#### Hybrid Memory System
- Markdown files in `~/.askelira/memory/` organized by date
- ChromaDB vector store for semantic search across all past decisions
- `searchMemory()` for semantic queries, `getRecentDebates()` for date-range retrieval
- Human-readable, git-friendly debate logs

#### CLI
- `askelira start` — Start gateway and web UI
- `askelira swarm` — Run swarm debates with configurable agent count (1K–1M)
- `askelira history` — Search and view debate history (semantic search, date range, JSON output)
- `askelira config` — Manage configuration (get, set, list, path)
- `askelira create` — Scaffold projects from templates (trading, hiring, product)
- `askelira templates` — List available templates
- Global `--verbose` and `--cost` flags

#### Visual Web UI
- Dark theme with Tailwind CSS
- Canvas-based swarm particle visualization with phase-specific animations
- SVG circular confidence meter with animated gauge
- History sidebar with search and auto-refresh
- Real-time phase progress updates via WebSocket
- Keyboard shortcuts: `/` focus, `Ctrl+K` clear, `Escape` dismiss

#### Desktop App (Electron)
- Native macOS/Windows/Linux desktop application
- System tray with status indicator and quick actions
- Native OS notifications for debate completion, errors, gateway status
- Auto-updates with silent download and install-on-quit
- Application menu with keyboard shortcuts
- Window state persistence across sessions
- Secure IPC via contextBridge (nodeIntegration disabled)

#### Templates
- Trading Strategy Evaluator — evaluate trading strategies with swarm intelligence
- Hiring Decision Helper — swarm debate for hiring decisions
- Product Launch Evaluator — go/no-go decisions for product launches
- Interactive CLI scaffolding with `askelira create`
- Template file copying with variable substitution

#### Testing Suite
- Agent unit tests (25 tests) — Alba, David, Vex, Elira with mocked APIs
- Memory system tests (10 tests) — file-based and vector DB with mocked ChromaDB
- Swarm orchestrator tests (3 tests) — creation, defaults, debate structure
- Utility tests (25 tests) — cost calculator pricing/ledger, logger levels/formatting/file output
- Integration tests (5 tests) — full pipeline with timeout protection
- GitHub Actions CI — Node 18 + 20 matrix on every push/PR
- Jest configuration with 80% coverage thresholds

#### Utilities
- Cost calculator with per-API pricing (Brave, Anthropic Opus/Sonnet/Haiku, swarm)
- Ledger tracking with timestamps and metadata
- Structured logger with levels (debug/info/warn/error), chalk colors, file output
- Prettier configuration (single quotes, 2-space indent, trailing commas ES5)

#### Documentation
- README with installation, quick start, features, API reference, project structure
- Testing guide — running tests, writing tests, coverage, CI/CD, debugging
- Deployment guide — npm publish, Electron build, Docker, production considerations
- Desktop app guide — installation, system tray, keyboard shortcuts, notifications, auto-updates
- Custom agents guide — interface, lifecycle, examples, integration, testing
- UI guide — interface overview, components, keyboard shortcuts
- FAQ — installation, API keys, cost, accuracy, custom agents, troubleshooting
- Contributing guide — setup, architecture, adding agents, code style, PR process
