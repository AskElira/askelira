# Autonomous Improvement Loop

AskElira includes a self-improving agent system that can research, debate, implement, validate, and commit improvements automatically.

## Architecture

The loop runs five phases per iteration:

1. **Alba (Research)** — Searches for relevant improvements using the Brave Search API
2. **David (Swarm Debate)** — 10,000 agents debate whether the improvement is worth implementing
3. **Claude Code (Implementation)** — Autonomously implements the winning improvement
4. **Vex (Validation)** — Audits the changes and runs tests
5. **Elira (Decision)** — Synthesizes results and decides to commit or rollback

## Security Warning

The autonomous loop uses `--permission-mode bypassPermissions` when running Claude Code. This means Claude Code can read/write any file and execute any command without confirmation.

**Only run this in trusted, sandboxed environments.**

## Configuration

Edit `.autonomous-config.json` in the project root:

```json
{
  "enabled": false,
  "loopInterval": 3600000,
  "agentCount": 10000,
  "maxIterations": 5,
  "allowedPaths": ["src/agents/", "test/", "docs/"],
  "researchQuery": "What are the latest improvements in AI multi-agent systems?"
}
```

| Field | Description | Default |
|-------|-------------|---------|
| `enabled` | Master switch — must be `true` to run | `false` |
| `loopInterval` | Milliseconds between iterations (continuous mode) | `3600000` (1 hour) |
| `agentCount` | Number of swarm agents for debates | `10000` |
| `maxIterations` | Maximum iterations before stopping | `5` |
| `allowedPaths` | Directories the loop is allowed to modify | `["src/agents/", "test/", "docs/"]` |
| `researchQuery` | What Alba researches each iteration | See config |

## Usage

### Single iteration

```bash
npm run improve
```

This runs one iteration and exits. Safe for testing.

### Files

| File | Purpose |
|------|---------|
| `scripts/autonomous-improve.js` | CLI entry point |
| `src/automation/autonomous-loop.js` | Core loop logic |
| `src/automation/claude-code-runner.js` | Claude Code execution wrapper |
| `.autonomous-config.json` | Configuration |
| `logs/autonomous/` | Iteration logs (gitignored) |
| `logs/autonomous-history.json` | Iteration history (gitignored) |

## API Status Endpoint

Check loop status via the API:

```
GET /api/autonomous/status
```

Returns:
```json
{
  "configured": true,
  "enabled": false,
  "config": { ... }
}
```
