# API Reference

## Table of Contents

- [Classes](#classes)
  - [Swarm](#swarm)
  - [Alba](#alba)
  - [David](#david)
  - [Vex](#vex)
  - [Elira](#elira)
  - [Logger](#logger)
- [Modules](#modules)
  - [Memory](#memory)
  - [Cost Calculator](#cost-calculator)
- [CLI Commands](#cli-commands)
- [Type Definitions](#type-definitions)

---

## Classes

### Swarm

`require('askelira/src/agents/swarm')`

Orchestrates the 4-phase debate pipeline. Each phase runs with a 60-second timeout and falls back to a safe default on failure.

#### Constructor

```javascript
new Swarm({ agents })
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agents` | `number` | `10000` | Number of agents in the swarm (1K–1M) |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `agentCount` | `number` | Number of agents configured |
| `alba` | `Alba` | Research agent instance |
| `david` | `David` | Swarm debate agent instance |
| `vex` | `Vex` | Audit agent instance |
| `elira` | `Elira` | Synthesis agent instance |

#### Methods

##### `debate(question)`

Runs the full 4-phase pipeline: Research → Debate → Audit → Synthesis.

| Parameter | Type | Description |
|-----------|------|-------------|
| `question` | `string` | The question to debate |

**Returns:** `Promise<DebateResult>`

```javascript
const swarm = new Swarm({ agents: 10000 });
const result = await swarm.debate('Should we migrate to microservices?');

console.log(result.decision);    // "yes" | "no" | "inconclusive" | "insufficient_data"
console.log(result.confidence);  // 0–100
console.log(result.actualCost);  // 0.068
```

**DebateResult object:**

| Field | Type | Description |
|-------|------|-------------|
| `question` | `string` | The original question |
| `decision` | `string` | `"yes"`, `"no"`, `"inconclusive"`, or `"insufficient_data"` |
| `confidence` | `number` | 0–100 confidence score |
| `argumentsFor` | `string[]` | Top arguments supporting "yes" |
| `argumentsAgainst` | `string[]` | Top arguments supporting "no" |
| `research` | `string \| null` | Research summary from Alba |
| `auditNotes` | `string[]` | Issues found by Vex |
| `actualCost` | `number` | Total cost in USD across all phases |
| `agentCount` | `number` | Number of agents used |
| `duration` | `number` | Total time in milliseconds |
| `timestamp` | `string` | ISO 8601 timestamp |
| `errors` | `Error[] \| undefined` | Phase errors (only if `partial` is true) |
| `partial` | `boolean` | `true` if any phase failed and used fallback |

Each error in the `errors` array has:

| Field | Type | Description |
|-------|------|-------------|
| `phase` | `string` | Agent name that failed (`"Alba"`, `"David"`, `"Vex"`, `"Elira"`) |
| `error` | `string` | Error message |
| `timestamp` | `string` | ISO 8601 timestamp |

---

### Alba

`require('askelira/src/agents/alba')`

Research agent that queries the Brave Search API for live web context. Requires `BRAVE_API_KEY` environment variable. Falls back gracefully when the key is not set.

#### Constructor

```javascript
new Alba()
```

Reads `process.env.BRAVE_API_KEY` on construction.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | `"Alba"` |
| `role` | `string` | `"Research"` |
| `apiKey` | `string \| undefined` | Brave API key from environment |

#### Methods

##### `research(question)`

Queries Brave Search and returns up to 5 results.

| Parameter | Type | Description |
|-----------|------|-------------|
| `question` | `string` | Search query |

**Returns:** `Promise<ResearchResult>`

| Field | Type | Description |
|-------|------|-------------|
| `summary` | `string` | Formatted summary of search results |
| `sources` | `Source[]` | Array of source objects |
| `context` | `object` | `{ query: string, resultCount: number }` |
| `cost` | `number` | Always `0` (Brave Search is free-tier) |

Each source object:

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Page title |
| `url` | `string` | Page URL |
| `description` | `string` | Snippet text |

**Without API key:**

```javascript
// Returns immediately with fallback
{
  summary: 'No research available (BRAVE_API_KEY not configured)',
  sources: [],
  context: {},
  cost: 0,
}
```

**Throws:** `Error` if the Brave API returns a non-OK status.

---

### David

`require('askelira/src/agents/david')`

Swarm debate agent. Creates a MiroFish swarm on the OpenClaw gateway, submits the question with research context, and clusters the resulting votes.

#### Constructor

```javascript
new David({ agents })
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `agents` | `number` | `10000` | Number of agents to deploy |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | `"David"` |
| `role` | `string` | `"Swarm"` |
| `agentCount` | `number` | Agent count |

#### Methods

##### `swarm(question, research)`

Runs the swarm debate.

| Parameter | Type | Description |
|-----------|------|-------------|
| `question` | `string` | The question to debate |
| `research` | `ResearchResult` | Output from Alba's `research()` |

**Returns:** `Promise<SwarmResult>`

| Field | Type | Description |
|-------|------|-------------|
| `argumentsFor` | `string[]` | Cluster summaries supporting "for" |
| `argumentsAgainst` | `string[]` | Cluster summaries supporting "against" |
| `clusters` | `Cluster[]` | All vote clusters sorted by vote count (descending) |
| `consensus` | `string \| null` | `"for"`, `"against"`, or `null` if no votes |
| `consensusStrength` | `number` | 0–1, absolute vote margin ratio |
| `votes` | `object` | `{ for: number, against: number, total: number }` |
| `agentCount` | `number` | Agent count used |
| `duration` | `number` | Debate time in milliseconds |
| `cost` | `number` | `agentCount * 0.000007` |

Each cluster object:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Cluster identifier |
| `stance` | `string` | `"for"`, `"against"`, or `"neutral"` |
| `summary` | `string` | Representative argument |
| `arguments` | `string[]` | All arguments in this cluster |
| `voteCount` | `number` | Number of votes in this cluster |

**Gateway API calls:**

1. `POST http://localhost:5678/v1/swarm` — Creates swarm (`{ type: "mirofish", agents, topology: "debate" }`)
2. `POST http://localhost:5678/v1/swarm/:id/debate` — Submits debate (`{ question, context, sources, rounds: 3 }`)

**Throws:** `Error` if the gateway returns a non-OK status.

---

### Vex

`require('askelira/src/agents/vex')`

Audit agent that validates the quality of a swarm debate result. Runs 5 independent checks and accumulates confidence penalties.

#### Constructor

```javascript
new Vex()
```

No parameters.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | `"Vex"` |
| `role` | `string` | `"Audit"` |

#### Methods

##### `audit(question, swarmResult)`

Validates swarm result quality.

| Parameter | Type | Description |
|-----------|------|-------------|
| `question` | `string` | The original question |
| `swarmResult` | `SwarmResult` | Output from David's `swarm()` |

**Returns:** `Promise<AuditResult>`

| Field | Type | Description |
|-------|------|-------------|
| `passed` | `boolean` | `true` if all checks pass |
| `notes` | `string[]` | Human-readable issue messages |
| `challenges` | `string[]` | Critical issue messages only |
| `issues` | `Issue[]` | Full issue objects |
| `confidenceAdjustment` | `number` | Negative number to subtract from confidence (0 if all pass) |
| `cost` | `number` | Always `0` |

Each issue object:

| Field | Type | Description |
|-------|------|-------------|
| `check` | `string` | Check name (see table below) |
| `severity` | `string` | `"critical"` or `"warning"` |
| `message` | `string` | Human-readable description |

#### Validation Checks

| # | Check | Threshold | Severity | Penalty |
|---|-------|-----------|----------|---------|
| 1 | `participation` | votes.total / agentCount >= 50% | critical | -20 |
| 2 | `cluster_quality` | clusters.length >= 2 | warning | -10 |
| 3 | `dominance` | top cluster <= 95% of total votes | warning | -15 |
| 4 | `consensus_strength` | consensusStrength >= 10% | warning | -10 |
| 5 | `argument_quality` | at least 1 argument (for or against) | critical | -30 |

---

### Elira

`require('askelira/src/agents/elira')`

Synthesis agent. Combines results from all prior phases to produce a final decision with confidence score and verdict.

#### Constructor

```javascript
new Elira()
```

No parameters.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | `"Elira"` |
| `role` | `string` | `"Synthesis"` |

#### Methods

##### `synthesize(question, { research, swarmResult, audit })`

Produces the final decision.

| Parameter | Type | Description |
|-----------|------|-------------|
| `question` | `string` | The original question |
| `research` | `ResearchResult` | Output from Alba |
| `swarmResult` | `SwarmResult` | Output from David |
| `audit` | `AuditResult` | Output from Vex |

**Returns:** `Promise<SynthesisResult>`

| Field | Type | Description |
|-------|------|-------------|
| `decision` | `string` | `"yes"`, `"no"`, `"inconclusive"`, or `"insufficient_data"` |
| `confidence` | `number` | 0–100, clamped and rounded |
| `reasoning` | `string` | Multi-sentence summary of all phases |
| `verdict` | `string` | `"GO"` (>=70), `"CONDITIONAL"` (>=40), or `"NO-GO"` (<40) |
| `argumentsFor` | `string[]` | Forwarded from swarm result |
| `argumentsAgainst` | `string[]` | Forwarded from swarm result |
| `auditPassed` | `boolean` | Whether audit passed |
| `auditIssues` | `string[]` | Audit note messages |
| `votes` | `object` | `{ for, against, total }` from swarm |
| `cost` | `number` | Sum of research + swarm + audit costs |

#### Decision Logic

1. **Confidence** = `(majorityRatio * 100) + (consensusStrength * 20) + auditAdjustment`, clamped to 0–100
2. **Decision overrides**: If critical audit failures exist AND confidence < 40 → `"insufficient_data"`
3. **Verdict thresholds**: GO >= 70, CONDITIONAL >= 40, NO-GO < 40

---

### Logger

`require('askelira/src/utils/logger')`

Structured logger with 4 levels, chalk-colored console output, and optional file output.

#### Constructor

```javascript
new Logger({ minLevel, writeToFile })
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `minLevel` | `string` | `"info"` | Minimum log level: `"debug"`, `"info"`, `"warn"`, `"error"` |
| `writeToFile` | `boolean` | `true` | Write logs to `~/.askelira/logs/YYYY-MM-DD.log` |

#### Methods

##### `debug(message, data)`
##### `info(message, data)`
##### `warn(message, data)`
##### `error(message, data)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | `string` | Log message |
| `data` | `any` | Optional data object (JSON-serialized) |

**Level priority:** debug (0) < info (1) < warn (2) < error (3). Messages below `minLevel` are suppressed.

**Console output format:**
```
2026-03-19T10:30:00.000Z [INFO ] Your message here
  {"key":"value"}
```

**File output:** Same format without color codes, appended to `~/.askelira/logs/YYYY-MM-DD.log`.

#### Default Instance

```javascript
const { logger } = require('askelira/src/utils/logger');

logger.info('Server started', { port: 3000 });
```

The default instance reads `LOG_LEVEL` and `LOG_TO_FILE` from environment variables.

---

## Modules

### Memory

`require('askelira/src/memory')`

Hybrid memory system: markdown files for human-readable logs + JSON index for search.

#### Functions

##### `init()`

Creates `~/.askelira/memory/` directory and `index.json` if they don't exist.

##### `saveToMemory(result)`

Saves a debate result to both markdown file and search index.

| Parameter | Type | Description |
|-----------|------|-------------|
| `result` | `DebateResult` | Output from `swarm.debate()` |

**Side effects:**
- Appends to `~/.askelira/memory/YYYY-MM-DD.md`
- Adds entry to `~/.askelira/memory/index.json` (capped at 1,000 entries)

##### `searchMemory(query, limit)`

Searches debate history by keyword matching.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | `string` | — | Search query |
| `limit` | `number` | `5` | Maximum results to return |

**Returns:** `Promise<SearchResult[]>`

Each result has the original index fields plus a `score` field (higher = more relevant). Scoring: +10 for exact substring match, +1 per matching word.

##### `getRecentDebates(days)`

Reads markdown files for the last N days and parses debate entries.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | `number` | `7` | Number of days to look back |

**Returns:** `ParsedDebate[]`

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | `YYYY-MM-DD` |
| `question` | `string` | Debate question |
| `decision` | `string` | Decision text |
| `confidence` | `number` | Confidence percentage |
| `cost` | `number` | Cost in USD |
| `raw` | `string` | Raw markdown section |

---

### Cost Calculator

`require('askelira/src/utils/cost-calculator')`

Tracks API costs with a session ledger.

#### Functions

##### `calculateBraveSearchCost(queryCount)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `queryCount` | `number` | `1` | Number of search queries |

**Returns:** `number` — Cost in USD ($0.005 per query).

##### `calculateAnthropicCost(model, inputTokens, outputTokens)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | `string` | Model ID (see pricing table) |
| `inputTokens` | `number` | Input token count |
| `outputTokens` | `number` | Output token count |

**Returns:** `number` — Cost in USD.

**Throws:** `Error` if model is not recognized.

**Pricing (per 1M tokens):**

| Model | Input | Output |
|-------|-------|--------|
| `claude-opus-4-6` | $15.00 | $75.00 |
| `claude-sonnet-4-5` | $3.00 | $15.00 |
| `claude-haiku-4-5` | $0.80 | $4.00 |

##### `calculateSwarmCost(agentCount)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `agentCount` | `number` | Number of agents |

**Returns:** `number` — Cost in USD ($0.000007 per agent).

##### `getTotalCost()`

**Returns:** `number` — Sum of all costs recorded in the current session ledger.

##### `getLedger()`

**Returns:** `LedgerEntry[]` — Copy of all recorded entries.

Each entry:

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `"brave_search"`, `"anthropic"`, or `"swarm"` |
| `cost` | `number` | Cost in USD |
| `metadata` | `object` | Call-specific metadata |
| `timestamp` | `string` | ISO 8601 timestamp |

##### `resetLedger()`

Clears all ledger entries. Useful between debates or test runs.

---

## CLI Commands

### `askelira start`

Start the OpenClaw gateway and web UI server.

```bash
askelira start [options]
```

| Option | Description |
|--------|-------------|
| `--no-ui` | Disable the web UI server (gateway only) |

### `askelira swarm`

Run a swarm debate from the command line.

```bash
askelira swarm [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-q, --question <text>` | Question for agents (required) | — |
| `-a, --agents <number>` | Agent count (1K–1M) | `10000` |

```bash
askelira swarm -q "Should we use GraphQL?" -a 50000
```

### `askelira history`

Search and view debate history.

```bash
askelira history [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-q, --query <text>` | Search across past debates | — |
| `-r, --recent <days>` | Show debates from last N days | `7` |
| `-l, --list` | List all debates | — |
| `--json` | Output raw JSON | — |

```bash
askelira history --query "microservices" --json
askelira history --recent 30
```

### `askelira config`

Show or edit AskElira configuration.

```bash
askelira config [options]
```

| Option | Description |
|--------|-------------|
| `-s, --set <key=value>` | Set a config value |
| `-g, --get <key>` | Get a config value |
| `-l, --list` | List all config values |
| `--path` | Show config file path |

```bash
askelira config --set BRAVE_API_KEY=your-key
askelira config --get BRAVE_API_KEY
askelira config --list
```

### `askelira create`

Scaffold a new project from a template.

```bash
askelira create [template] [options]
```

| Option | Description |
|--------|-------------|
| `-d, --dir <path>` | Output directory |
| `-l, --list` | List available templates |

| Template | Description |
|----------|-------------|
| `trading` | Evaluate a trading strategy with swarm intelligence |
| `hiring` | Evaluate hiring decisions with swarm debate |
| `product` | Should you launch this product? Swarm debate decides |

```bash
askelira create trading
askelira create hiring --dir ./eval
askelira create --list
```

### `askelira templates`

List available project templates (alias for `askelira create --list`).

```bash
askelira templates
```

### Global Flags

| Flag | Description |
|------|-------------|
| `--verbose` | Set `LOG_LEVEL=debug` for detailed output |
| `--cost` | Show cost estimate before running |
| `--version` | Show version number |
| `--help` | Show help text |

---

## Type Definitions

Quick reference for all return types used across the API.

```javascript
// DebateResult — returned by Swarm.debate()
{
  question: string,
  decision: 'yes' | 'no' | 'inconclusive' | 'insufficient_data',
  confidence: number,          // 0–100
  argumentsFor: string[],
  argumentsAgainst: string[],
  research: string | null,
  auditNotes: string[],
  actualCost: number,          // USD
  agentCount: number,
  duration: number,            // ms
  timestamp: string,           // ISO 8601
  errors: Error[] | undefined,
  partial: boolean,
}

// ResearchResult — returned by Alba.research()
{
  summary: string,
  sources: { title: string, url: string, description: string }[],
  context: { query: string, resultCount: number },
  cost: number,
}

// SwarmResult — returned by David.swarm()
{
  argumentsFor: string[],
  argumentsAgainst: string[],
  clusters: Cluster[],
  consensus: 'for' | 'against' | null,
  consensusStrength: number,   // 0–1
  votes: { for: number, against: number, total: number },
  agentCount: number,
  duration: number,            // ms
  cost: number,                // USD
}

// Cluster — element of SwarmResult.clusters
{
  id: string,
  stance: 'for' | 'against' | 'neutral',
  summary: string,
  arguments: string[],
  voteCount: number,
}

// AuditResult — returned by Vex.audit()
{
  passed: boolean,
  notes: string[],
  challenges: string[],
  issues: { check: string, severity: string, message: string }[],
  confidenceAdjustment: number,
  cost: number,
}

// SynthesisResult — returned by Elira.synthesize()
{
  decision: string,
  confidence: number,          // 0–100
  reasoning: string,
  verdict: 'GO' | 'CONDITIONAL' | 'NO-GO',
  argumentsFor: string[],
  argumentsAgainst: string[],
  auditPassed: boolean,
  auditIssues: string[],
  votes: { for: number, against: number, total: number },
  cost: number,
}

// LedgerEntry — element of getLedger()
{
  type: 'brave_search' | 'anthropic' | 'swarm',
  cost: number,
  metadata: object,
  timestamp: string,
}

// ParsedDebate — element of getRecentDebates()
{
  date: string,
  question: string,
  decision: string,
  confidence: number,
  cost: number,
  raw: string,
}
```
