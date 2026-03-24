# AskElira 2.1

[![Tests](https://github.com/askelira/askelira/actions/workflows/test.yml/badge.svg)](https://github.com/askelira/askelira/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/askelira.svg)](https://www.npmjs.com/package/askelira)
[![License](https://img.shields.io/github/license/askelira/askelira)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

AskElira is an autonomous build platform that turns a plain-text goal into working code through a multi-agent pipeline. Each agent researches, builds, audits, and approves — producing verified output with zero manual intervention.

## Agent Pipeline

Every goal flows through six stages in sequence:

| Step | Agent | Role |
|------|-------|------|
| 1 | **Alba** | Research — web search, pattern matching, risk analysis |
| 2 | **Vex Gate 1** | Audit Alba's research for quality and completeness |
| 3 | **David** | Build — generates code, configs, and file artifacts |
| 4 | **Vex Gate 2** | Audit David's output for correctness and security |
| 5 | **Elira** | Final review — approve, reject, or request iteration |
| 6 | **Finalize** | Persist results, notify, advance to next floor |

If Vex or Elira rejects, the pipeline loops back to Alba (up to 5 iterations).

## Setup

```bash
# 1. Install
npm install

# 2. Initialize workspace (creates ~/askelira/ with SOUL.md, AGENTS.md, TOOLS.md)
npx askelira init

# 3. Onboard with OpenClaw gateway
openclaw onboard

# 4. Copy env and fill in your keys
cp .env.example .env

# 5. Start dev server
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env`. Key variables:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key for all agent reasoning |
| `SEARCH_PROVIDER` | Search backend: `auto`, `tavily`, `brave`, `perplexity` |
| `TAVILY_API_KEY` | Tavily search API key (used when SEARCH_PROVIDER=tavily or auto) |
| `BRAVE_SEARCH_API_KEY` | Brave Search API key (fallback when Tavily unavailable) |
| `OPENCLAW_GATEWAY_URL` | WebSocket URL for OpenClaw gateway (`ws://127.0.0.1:18789`) |
| `OPENCLAW_GATEWAY_TOKEN` | Auth token for gateway connection |
| `AGENT_ROUTING_MODE` | Agent routing strategy: `gateway`, `direct`, `gateway-only` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token for notifications |
| `TELEGRAM_CHAT_ID` | Telegram chat ID to receive notifications |
| `POSTGRES_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth session encryption key |
| `NEXTAUTH_URL` | Base URL for auth callbacks (`http://localhost:3000`) |
| `CRON_SECRET` | Secret for authenticating cron/internal API calls |

## Routing Modes

Set `AGENT_ROUTING_MODE` to control how agent calls are dispatched:

| Mode | Behavior |
|------|----------|
| `gateway` | Prefer OpenClaw gateway, fall back to direct Anthropic API on failure (default) |
| `direct` | Always call Anthropic API directly, bypass gateway entirely |
| `gateway-only` | Require gateway — fail hard if gateway is unavailable |

The gateway client connects with Ed25519 device identity signing, circuit breaker (3 failures / 60s window opens for 300s), and auto-reconnect with exponential backoff.

## Search Providers

Set `SEARCH_PROVIDER` to control Alba's web research:

| Provider | Notes |
|----------|-------|
| `auto` | Try Tavily first, fall back to Brave, then Perplexity |
| `tavily` | Tavily Search API only |
| `brave` | Brave Search API only |
| `perplexity` | Perplexity API only |

## Telegram Notifications

When `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set, AskElira sends notifications on:

- **Gateway connected** — successful WebSocket handshake
- **Floor live** — a floor starts its agent pipeline
- **Goal met** — all floors approved and finalized
- **Floor blocked** — a floor exceeded max iterations
- **Circuit breaker open** — gateway degraded after repeated failures

## Requirements

- **Node.js 22.16+**
- **OpenClaw gateway** running locally (`openclaw onboard` to set up)
- At least one search API key (Tavily or Brave) for Alba research
- PostgreSQL for goal/floor persistence

## License

AGPL-3.0-or-later
