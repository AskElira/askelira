# Contributing to AskElira

Thanks for your interest in contributing to AskElira! Whether you're fixing a bug, adding a new agent, or improving documentation, your help makes the project better for everyone.

## Getting Started

### Prerequisites

- Node.js >= 18
- Git
- PostgreSQL (or Vercel Postgres for cloud)

### Setup

```bash
# Clone the repo
git clone https://github.com/askelira/askelira.git
cd askelira

# Install dependencies (--legacy-peer-deps required for react 18 / drei peer conflict)
npm install --legacy-peer-deps

# Copy the environment template
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start the dev server
npm run dev
```

### Verify your setup

```bash
# TypeScript compilation (must be 0 errors)
npx tsc --noEmit

# Run the smoke test
npm run smoke

# Production build check
npm run build
```

## Architecture

AskElira 2.1 uses a 5-agent building pipeline. Each floor in a building flows through these agents:

```
Goal
  |
  v
+--------+     +---------+     +--------+     +---------+     +--------+
|  Alba  |---->| Vex G1  |---->| David  |---->| Vex G2  |---->| Elira  |
|Research|     |Pre-Audit |     | Build  |     |Post-Aud |     | Review |
+--------+     +---------+     +--------+     +---------+     +--------+
  |               |                |               |               |
  | Brave+Tavily  | JSON audit     | Opus model    | Quality gate  | Strategic
  | URL fetcher   | Go/No-Go       | Code output   | Score 0-100   | alignment
  | Confidence    |                | Source URLs   |               | Live/Block
  v               v                v               v               v
                                                                Floor Live
                                                                   |
                                                                   v
                                                          Steven (Heartbeat)
                                                          Health monitoring
```

### Key directories

| Directory | Purpose |
|-----------|---------|
| `lib/` | Core business logic (agents, DB, search, billing) |
| `app/api/` | Next.js API routes |
| `app/` | Next.js pages and layout |
| `components/` | React components (inline styles, no Tailwind) |
| `hooks/` | React hooks (useBuilding, etc.) |
| `cli/` | Standalone CLI package |
| `scripts/` | Migrations, seeds, tests |

### Key files

| File | Purpose |
|------|---------|
| `lib/step-runner.ts` | Orchestrates the 5-agent pipeline per floor |
| `lib/building-loop.ts` | Manages floor iteration and auto-chaining |
| `lib/heartbeat.ts` | Steven's health monitoring runtime |
| `lib/pipeline-state.ts` | Shared state tracking (request IDs, locks, tokens) |
| `lib/agent-router.ts` | Routes agent calls (Gateway vs Direct) |
| `lib/web-search.ts` | Multi-provider search (Tavily, Brave, Perplexity) |
| `lib/building-manager.ts` | All database operations |
| `lib/agent-prompts.ts` | Agent system prompts |
| `lib/error-classifier.ts` | Error categorization |
| `lib/subscription-manager.ts` | Stripe billing operations |

## Code Style

### General rules

- TypeScript with strict mode
- 2-space indentation
- Single quotes for strings
- Semicolons required
- `const` by default, `let` when reassignment is needed, never `var`

### Naming

- Files: `kebab-case.ts`
- Classes/Interfaces: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- DB columns: `snake_case`

### Patterns

- React components use **inline styles only** (no Tailwind, no styled-jsx)
- CSS custom properties defined in `app/globals.css` (--accent, --surface, --panel, etc.)
- Database: `@vercel/postgres` with `sql` tagged template literals
- Dynamic imports for DB calls in API routes (fallback for local dev without DB)
- Agents return JSON; all prompts specify output schema
- All API routes use `NextRequest`/`NextResponse`
- Error handling: try/catch everywhere, never swallow silently (at minimum console.error)
- Agent calls should never crash the pipeline -- always fallback gracefully

### Agent conventions

- Alba, Vex1, Vex2, Elira use `claude-sonnet-4-5`
- David uses `claude-opus-4-5` (can be escalated from Sonnet when Vex2 score < 60)
- Steven uses `claude-sonnet-4-5` (never Opus)
- All agent outputs must be valid JSON matching the schema in `lib/agent-prompts.ts`

## Adding a New Agent

1. Add the system prompt to `lib/agent-prompts.ts`
2. Add the step function to `lib/step-runner.ts` following the existing pattern
3. Wire it into the pipeline in `lib/building-loop.ts`
4. Add error classification patterns to `lib/error-classifier.ts` if needed
5. Update `AGENTS.md` with the new agent's documentation

## Pull Request Process

### Before you start

1. Check existing [issues](https://github.com/askelira/askelira/issues) for related work
2. For large changes, open an issue first to discuss the approach
3. Fork the repo and create a feature branch from `main`

### Branch naming

```
feature/add-new-agent
fix/pipeline-timeout-bug
docs/update-agents-md
```

### PR checklist

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npm run build` passes
- [ ] New features have corresponding documentation in AGENTS.md
- [ ] No `console.log` debugging left (use descriptive log prefixes like `[Heartbeat]`, `[Pipeline]`)
- [ ] No hardcoded API keys or secrets
- [ ] Agent prompts include output schema
- [ ] Database changes have idempotent migration in `scripts/`
- [ ] Error handling follows try/catch pattern (never crash the pipeline)

### Review

- PRs need one approving review before merge
- We aim to review PRs within 48 hours
- Keep commits focused -- one logical change per commit

## Questions?

- Open an [issue](https://github.com/askelira/askelira/issues) for bugs or feature requests
- Start a [discussion](https://github.com/askelira/askelira/discussions) for questions or ideas

Welcome aboard!
