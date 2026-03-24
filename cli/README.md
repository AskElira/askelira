# AskElira CLI

Command-line interface for AskElira 2.1 -- build automations from your terminal.

## Install

```bash
npm install -g askelira
```

Requires Node.js 18 or later.

## Quick Start

```bash
# Setup wizard
askelira init

# Authenticate
askelira login

# Create and build an automation
askelira build

# Watch progress live
askelira watch <goalId>
```

## Commands

| Command | Description |
|---------|-------------|
| `askelira init` | Setup wizard -- configure server, auth, environment |
| `askelira login` | Authenticate with your AskElira account |
| `askelira logout` | Clear stored credentials |
| `askelira whoami` | Show current logged-in user |
| `askelira build [goal]` | Create a new goal and start building |
| `askelira status [goalId]` | Show status of a goal or all goals |
| `askelira floors [goalId]` | List floors for a goal |
| `askelira logs <goalId>` | View agent logs (--tail, --agent, --floor) |
| `askelira watch <goalId>` | Live dashboard, refreshes every 3s |
| `askelira run [goalId]` | Trigger heartbeat check (--floor, --dry-run) |
| `askelira rollback [goalId]` | Rollback a floor to a previous snapshot |
| `askelira workspace [cmd]` | View workspace files (ls, cat, open) |
| `askelira start [goalId]` | Start heartbeat monitor |
| `askelira stop [goalId]` | Stop heartbeat monitor |
| `askelira heartbeat <goalId>` | View heartbeat status (--trigger) |
| `askelira completion [shell]` | Shell completion (bash, zsh, install) |

## Options

```
--json     Output as JSON (status, floors commands)
--tail     Poll for new logs (logs command)
--agent    Filter by agent name (logs command)
--floor    Filter by floor (logs, run commands)
--dry-run  Preview without executing (run command)
--trigger  Run one heartbeat cycle (heartbeat command)
```

## Configuration

Config is stored at `~/.askelira/config.json`. Set the server URL via:

- `askelira init` (interactive)
- `ASKELIRA_URL` environment variable
- `ASKELIRA_API_URL` environment variable

## Shell Completion

```bash
# Auto-install
askelira completion install

# Manual
askelira completion bash >> ~/.bashrc
askelira completion zsh >> ~/.zshrc
```

## Agents

AskElira uses 5 AI agents in a building loop:

1. **Alba** -- Research (Brave Search + URL fetcher)
2. **Vex** -- Quality auditor (Gate 1 + Gate 2)
3. **David** -- Builder (Claude Opus)
4. **Elira** -- Architect and reviewer
5. **Steven** -- Heartbeat monitor

## License

AGPL-3.0-or-later
