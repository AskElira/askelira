# AskElira CLI Complete Guide

**Version:** 2.1.0
**Description:** ChatGPT for Automations - AI agents that build working code

---

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Setup & Configuration](#setup--configuration)
4. [Core Commands](#core-commands)
5. [Building Automations](#building-automations)
6. [Monitoring & Debugging](#monitoring--debugging)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)

---

## Installation

### Global Install
```bash
npm install -g askelira
```

### Local Development
```bash
cd /path/to/askelira-bundled-npm
npm install
npm link
```

### Verify Installation
```bash
askelira --version
# Should show: 2.1.0

askelira --help
# Shows all available commands
```

---

## Quick Start

### 1. Initial Setup
```bash
# Run the setup wizard
askelira init

# This will:
# - Configure your server (local/cloud/custom)
# - Set up authentication
# - Configure Anthropic API key
# - Verify environment
```

### 2. Create Your First Automation
```bash
# Start interactive build wizard
askelira build

# You'll be prompted for:
# - What to build (min 20 characters)
# - Business context (optional)
# - Industry, tools, notes
```

### 3. Monitor Progress
```bash
# Live dashboard (refreshes every 3s)
askelira watch <goalId>

# Check status
askelira status

# View logs
askelira logs <goalId> --tail
```

---

## Setup & Configuration

### `askelira init`
**Interactive setup wizard**

Configures:
- **Server URL**: Local (http://localhost:3000), Cloud (https://askelira.com), or Custom
- **Authentication**: Email + API key
- **Anthropic API Key**: For Claude AI agent reasoning
- **Environment Check**: Validates Node.js, config, connectivity

**Example:**
```bash
askelira init

# Prompts:
# 1. Select server: Local development / AskElira Cloud / Custom
# 2. Authentication: Email and API key
# 3. Anthropic API Key: sk-ant-api03-...
# 4. Verification and summary
```

**Config Location:**
- `~/.askelira/config.json` - Authentication & server URL
- `~/.askelira/.env` - Anthropic API key
- `~/.askelira/memory/` - Agent memory storage

---

## Core Commands

### Authentication

#### `askelira login`
Authenticate with AskElira account

```bash
askelira login
# Prompts for email and API key
# Stores credentials in ~/.askelira/config.json
```

#### `askelira logout`
Clear stored credentials

```bash
askelira logout
# Removes authentication from config
```

#### `askelira whoami`
Show current logged-in user

```bash
askelira whoami
# Output: Currently authenticated as: user@example.com
```

---

## Building Automations

### `askelira build [goalText]`
**Create a new automation from scratch**

**Interactive Mode:**
```bash
askelira build

# Wizard prompts:
# 1. What do you want to build? (min 20 chars)
# 2. Add business context? (Y/n)
# 3. Industry: (optional)
# 4. Tools/platforms: (optional)
# 5. Other context: (optional)
```

**Direct Mode:**
```bash
askelira build "Bitcoin price tracker that fetches from CoinGecko API every hour and logs to CSV"
```

**What Happens:**
1. **Goal Created** - System creates a goal record
2. **Elira Designs** - AI architect designs a multi-floor building plan
3. **Blueprint Review** - You approve or modify the plan
4. **Building Starts** - Agent team begins construction:
   - **Alba** researches each floor
   - **Vex** audits research quality
   - **David** builds the implementation
   - **Vex** audits code quality
   - **Elira** finalizes and deploys
   - **Steven** monitors health continuously

**Output:**
```
✔ Goal created: 055b9738-8d9d-4fcf-a3f9-bc94df9e6a02
✔ Blueprint ready: 5 floors designed

Building Blueprint
──────────────────────────────────────────
  Floor 1: Project Setup & Dependencies
    ✓ Package.json exists with all dependencies...

  Floor 2: CoinGecko API Integration
    ✓ Successfully fetches current Bitcoin price...

  [...]

? Start building this 5-floor plan? (Y/n)
✔ Building started!
```

---

## Monitoring & Debugging

### `askelira status [goalId]`
**Show building status**

**All Goals:**
```bash
askelira status

# Output:
# ID                                    Status      Floors  Progress
# ────────────────────────────────────────────────────────────────
# 055b9738-...  BUILDING    5/5     Floor 3 (60%)
# b5dd384b-...  BUILDING    6/6     Floor 1 (15%)
```

**Specific Goal:**
```bash
askelira status 055b9738-8d9d-4fcf-a3f9-bc94df9e6a02

# Output:
# Goal: Bitcoin price tracker
# Status: BUILDING
# Progress: 60% (Floor 3 of 5)
#
# Floors:
#   ✓ Floor 1: Project Setup [LIVE]
#   ✓ Floor 2: API Integration [LIVE]
#   ⏳ Floor 3: CSV Writer [BUILDING]
#   ⏸ Floor 4: Scheduler [PENDING]
#   ⏸ Floor 5: Testing [PENDING]
```

### `askelira watch <goalId>`
**Live building dashboard (refreshes every 3s)**

```bash
askelira watch 055b9738-8d9d-4fcf-a3f9-bc94df9e6a02
```

**Dashboard:**
```
┌─ AskElira Watch ─────────────────────────────────────┐
│ Goal: Bitcoin price tracker                          │
│ Status: [BUILDING]  Progress: ████████░░ 60%         │
├──────────────────────────────────────────────────────┤
│ Floors                                               │
│   F1 Project Setup         [LIVE] ✓                  │
│   F2 API Integration       [LIVE] ✓                  │
│   F3 CSV Writer            [BUILDING] (iter 2)       │
│   F4 Scheduler             [PENDING]                 │
│   F5 Testing               [PENDING]                 │
├──────────────────────────────────────────────────────┤
│ Recent Activity                                      │
│   14:23:45 Vex gate2 approved                        │
│   14:22:10 David Build complete                      │
│   14:20:33 Vex gate1 approved                        │
│   14:19:15 Alba Research complete                    │
├──────────────────────────────────────────────────────┤
│ q quit  l logs  Refreshing every 3s...               │
│ Last updated: 2:23:50 PM                             │
└──────────────────────────────────────────────────────┘
```

**Controls:**
- `q` - Quit watch mode
- `l` - View logs
- Auto-refreshes every 3 seconds

### `askelira logs <goalId> [options]`
**View agent execution logs**

**Basic Usage:**
```bash
askelira logs 055b9738-8d9d-4fcf-a3f9-bc94df9e6a02
```

**Options:**
- `--tail` - Stream logs in real-time
- `--floor <number>` - Filter by floor number
- `--agent <name>` - Filter by agent (Alba, Vex, David, Elira, Steven)
- `--limit <n>` - Show last N entries

**Examples:**
```bash
# Stream live logs
askelira logs 055b9738... --tail

# Show Floor 3 logs only
askelira logs 055b9738... --floor 3

# Show only David's build logs
askelira logs 055b9738... --agent David

# Last 50 entries
askelira logs 055b9738... --limit 50
```

**Output:**
```
[2026-03-22 14:19:15] Alba     Floor 3  Research   Iteration 1
  Researching CSV file writing patterns for Node.js...

[2026-03-22 14:20:33] Vex      Floor 3  Gate 1     Iteration 1
  ✓ APPROVED (confidence: 87%)
  Research quality: Excellent. Comprehensive coverage...

[2026-03-22 14:20:45] David    Floor 3  Building   Iteration 1
  Generating CSV writer implementation...

[2026-03-22 14:22:10] David    Floor 3  Complete   Iteration 1
  ✓ Build complete: csvWriter.js (245 lines)
```

### `askelira floors <goalId>`
**List all floors for a building**

```bash
askelira floors 055b9738-8d9d-4fcf-a3f9-bc94df9e6a02
```

**Output:**
```
Building: Bitcoin price tracker
Total Floors: 5

┌────┬────────────────────────┬────────────┬───────────┬────────────┐
│ #  │ Name                   │ Status     │ Iteration │ Complexity │
├────┼────────────────────────┼────────────┼───────────┼────────────┤
│ 1  │ Project Setup          │ LIVE       │ 1         │ low        │
│ 2  │ API Integration        │ LIVE       │ 2         │ low        │
│ 3  │ CSV Writer             │ BUILDING   │ 1         │ low        │
│ 4  │ Scheduler              │ PENDING    │ 0         │ medium     │
│ 5  │ Testing                │ PENDING    │ 0         │ low        │
└────┴────────────────────────┴────────────┴───────────┴────────────┘
```

---

## Advanced Features

### `askelira heartbeat <goalId> [options]`
**Monitor or trigger Steven health checks**

**View Current Heartbeat:**
```bash
askelira heartbeat 055b9738-8d9d-4fcf-a3f9-bc94df9e6a02
```

**Options:**
- `--start` - Start heartbeat monitoring
- `--stop` - Stop heartbeat monitoring
- `--status` - Check heartbeat status
- `--interval <seconds>` - Set check interval (default: 300s)

**Examples:**
```bash
# Start monitoring (checks every 5 min)
askelira heartbeat 055b9738... --start

# Stop monitoring
askelira heartbeat 055b9738... --stop

# Check status
askelira heartbeat 055b9738... --status
```

### `askelira run <goalId> [options]`
**Manually trigger a heartbeat check**

```bash
askelira run 055b9738-8d9d-4fcf-a3f9-bc94df9e6a02

# Options:
# --dry-run    Preview what would be checked
# --force      Force check even if recently checked
```

### `askelira rollback <goalId>`
**Rollback a floor to a previous snapshot**

```bash
askelira rollback 055b9738-8d9d-4fcf-a3f9-bc94df9e6a02

# Interactive:
# 1. Select floor to rollback
# 2. Choose snapshot version
# 3. Confirm rollback
```

### `askelira workspace [subcommand]`
**Manage workspace files**

**Subcommands:**
```bash
# List all workspace files
askelira workspace list

# Read a specific file
askelira workspace read <goalId> <path>

# Show workspace tree
askelira workspace tree <goalId>
```

**Examples:**
```bash
# List files for a goal
askelira workspace list 055b9738...

# Read generated code
askelira workspace read 055b9738... src/csvWriter.js

# View full structure
askelira workspace tree 055b9738...
```

### `askelira start <goalId>`
**Start heartbeat monitor daemon**

```bash
askelira start 055b9738-8d9d-4fcf-a3f9-bc94df9e6a02

# Steven will continuously monitor:
# - Floor health (errors, crashes)
# - Performance metrics
# - Auto-recovery attempts
```

### `askelira stop <goalId>`
**Stop heartbeat monitor**

```bash
askelira stop 055b9738-8d9d-4fcf-a3f9-bc94df9e6a02
```

### `askelira completion [shell]`
**Generate shell completion scripts**

```bash
# Bash
askelira completion bash >> ~/.bashrc

# Zsh
askelira completion zsh >> ~/.zshrc

# Fish
askelira completion fish > ~/.config/fish/completions/askelira.fish

# Install (auto-detect shell)
askelira completion install
```

---

## Workflow Examples

### Example 1: Simple Automation
```bash
# 1. Setup
askelira init

# 2. Create automation
askelira build "Send daily email digest of Hacker News top stories"

# 3. Monitor
askelira watch <goalId>

# 4. Check when complete
askelira status <goalId>
```

### Example 2: Complex Multi-Floor Building
```bash
# 1. Create with context
askelira build

# Wizard:
# What: "E-commerce product scraper with price tracking"
# Industry: "E-commerce"
# Tools: "Node.js, Puppeteer, PostgreSQL"
# Context: "Track 100+ products from Amazon, eBay, Walmart"

# 2. Monitor in real-time
askelira watch <goalId>

# 3. In another terminal, stream logs
askelira logs <goalId> --tail

# 4. Check specific floor
askelira floors <goalId>

# 5. If issue occurs, check heartbeat
askelira heartbeat <goalId> --status
```

### Example 3: Production Monitoring
```bash
# 1. Build is live
askelira status <goalId>
# Status: LIVE (all floors operational)

# 2. Start continuous monitoring
askelira start <goalId>

# 3. Check logs periodically
askelira logs <goalId> --agent Steven --limit 20

# 4. If error detected
askelira run <goalId> --force

# 5. Rollback if needed
askelira rollback <goalId>
```

---

## Configuration Files

### `~/.askelira/config.json`
**Authentication & Server**
```json
{
  "apiKey": "sk-ant-api03-...",
  "email": "user@example.com",
  "customerId": "usr_...",
  "baseUrl": "http://localhost:3000"
}
```

### `~/.askelira/.env`
**API Keys & Environment**
```bash
# Anthropic Claude API (for agent reasoning)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Brave Search API (for Alba research agent)
BRAVE_API_KEY=your_brave_api_key_here

# Default agent count for swarms
AGENT_COUNT=10000
```

### `~/.askelira/memory/`
**Agent Memory Storage**
- Persistent memory across sessions
- Pattern learning
- Historical context

---

## Environment Variables

### Required
```bash
ANTHROPIC_API_KEY      # Claude AI for agent reasoning
```

### Optional
```bash
BRAVE_API_KEY          # Web search for research
NEXTAUTH_URL           # Server URL (auto-detected)
CRON_SECRET           # Building loop security
DATABASE_URL          # PostgreSQL connection
```

---

## Troubleshooting

### Building Stuck at 0%
**Symptom:** Floor shows 0% progress for hours

**Diagnosis:**
```bash
# Check server logs
askelira logs <goalId> --tail

# Check floor status
askelira floors <goalId>

# Check if continuation is failing
curl http://localhost:3000/api/health
```

**Common Fixes:**
1. **Wrong Port:** Check `NEXTAUTH_URL` in `.env` matches server port
2. **API Key:** Verify `ANTHROPIC_API_KEY` is correct
3. **Model ID:** Ensure using `claude-sonnet-4-5-20250929`

**See:** `BUILDING_LOOP_FIX.md` for detailed fix

### Authentication Errors
```bash
# Clear and re-authenticate
askelira logout
askelira login

# Or reset config
rm ~/.askelira/config.json
askelira init
```

### API Key Issues
```bash
# Test Anthropic key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-5-20250929","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'

# Should return valid response, not 401
```

### Server Connection Failed
```bash
# Check if server is running
lsof -ti:3000

# Start server if needed
npm run dev

# Or configure for production
askelira init
# Select: AskElira Cloud (https://askelira.com)
```

---

## Tips & Best Practices

### 1. Be Specific in Build Prompts
```bash
# ❌ Too vague
askelira build "automation"

# ✓ Specific and detailed
askelira build "LinkedIn job application bot that applies to 10 software engineer roles daily with customized cover letters"
```

### 2. Monitor During Building
```bash
# Use watch in one terminal
askelira watch <goalId>

# And logs in another
askelira logs <goalId> --tail
```

### 3. Start Heartbeat for Production
```bash
# Once building is live
askelira start <goalId>

# Steven will auto-recover from errors
```

### 4. Use Shell Completion
```bash
askelira completion install
# Enables tab-completion for all commands
```

### 5. Understand Iterations
- Vex may reject Alba's research 2-6 times (normal!)
- Each rejection improves quality
- Patience = better automations
- Check logs to see why rejections happen

---

## Command Quick Reference

| Command | Description | Usage |
|---------|-------------|-------|
| `init` | Setup wizard | `askelira init` |
| `build` | Create automation | `askelira build [goal]` |
| `status` | Check progress | `askelira status [goalId]` |
| `watch` | Live dashboard | `askelira watch <goalId>` |
| `logs` | View logs | `askelira logs <goalId> [opts]` |
| `floors` | List floors | `askelira floors <goalId>` |
| `heartbeat` | Health monitoring | `askelira heartbeat <goalId>` |
| `start` | Start monitor | `askelira start <goalId>` |
| `stop` | Stop monitor | `askelira stop <goalId>` |
| `run` | Manual check | `askelira run <goalId>` |
| `rollback` | Restore snapshot | `askelira rollback <goalId>` |
| `workspace` | File management | `askelira workspace <cmd>` |
| `login` | Authenticate | `askelira login` |
| `logout` | Clear auth | `askelira logout` |
| `whoami` | Show user | `askelira whoami` |
| `completion` | Shell completion | `askelira completion install` |

---

## Getting Help

### In-CLI Help
```bash
# General help
askelira --help

# Command-specific help
askelira build --help
askelira logs --help
```

### Documentation
- `README.md` - Project overview
- `BUILD_AUDIT_COMPLETE.md` - System verification
- `BUILDING_LOOP_FIX.md` - Common fixes
- `ASKELIRA_CLI_GUIDE.md` - This guide

### Support
- GitHub Issues: https://github.com/askelira/askelira/issues
- Documentation: https://askelira.com/docs

---

**Version:** 2.1.0
**Last Updated:** 2026-03-22
**Status:** Production Ready ✅
