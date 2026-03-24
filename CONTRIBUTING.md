# Contributing to AskElira

Thanks for your interest in contributing to AskElira! Whether you're fixing a bug, adding a new agent, or improving documentation, your help makes the project better for everyone.

## Getting Started

### Prerequisites

- Node.js >= 18
- Git

### Setup

```bash
# Clone the repo
git clone https://github.com/askelira/askelira.git
cd askelira

# Install dependencies
npm install

# Copy the environment template
cp .env.template ~/.askelira/.env

# (Optional) Add your Brave Search API key for Alba research
# Edit ~/.askelira/.env and set BRAVE_API_KEY=your_key_here
```

### Verify your setup

```bash
# Run unit tests
node test/swarm.test.js

# Run integration tests
node test/integration.test.js

# Try a quick swarm (100 agents, cheap)
node examples/basic.js
```

## Architecture

AskElira uses a 4-phase pipeline. Every question flows through these agents in order:

```
Question
  │
  ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   Alba   │────▶│  David   │────▶│   Vex    │────▶│  Elira   │
│ Research │     │  Debate  │     │  Audit   │     │Synthesis │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
  │                │                │                │
  │ Brave API      │ MiroFish       │ Validation     │ Decision
  │ Sources        │ Clusters       │ Issues         │ Confidence
  │ Context        │ Votes          │ Adjustments    │ Verdict
  ▼                ▼                ▼                ▼
                                                  Result
```

### Key files

| File | Purpose |
|------|---------|
| `bin/cli.js` | CLI entry point, command routing |
| `src/agents/swarm.js` | Orchestrates the 4-phase pipeline |
| `src/agents/alba.js` | Research via Brave Search API |
| `src/agents/david.js` | Swarm debate via MiroFish gateway |
| `src/agents/vex.js` | Debate validation and auditing |
| `src/agents/elira.js` | Final synthesis and verdict |
| `src/memory/index.js` | Hybrid storage (files + ChromaDB) |
| `src/gateway/index.js` | OpenClaw gateway wrapper |
| `src/utils/cost-calculator.js` | API cost tracking |
| `src/utils/logger.js` | Logging with file output |

## Adding a New Agent

Agents are simple classes with a single async method. Here's the pattern:

```javascript
// src/agents/my-agent.js

class MyAgent {
  constructor() {
    this.name = 'MyAgent';
    this.role = 'Description of what it does';
  }

  async run(question, context) {
    // Your logic here
    return {
      result: 'your output',
      cost: 0,
    };
  }
}

module.exports = { MyAgent };
```

### Agent contract

Every agent method must return an object with at least:
- A `cost` field (number, in USD)
- Relevant output data for downstream agents

### Wiring it into the pipeline

1. Create your agent in `src/agents/`
2. Import it in `src/agents/swarm.js`
3. Add a phase call in `Swarm.debate()` using `_runPhase()` for error handling
4. Define a fallback object for graceful degradation
5. Add tests in `test/`

## Testing

### Running tests

```bash
# Unit tests
node test/swarm.test.js

# Integration tests (runs all 4 phases)
node test/integration.test.js
```

### Writing tests

We use Node's built-in `assert` module. No framework required.

```javascript
const assert = require('assert');

async function testMyFeature() {
  const result = await myFunction();
  assert.ok(result, 'Result should exist');
  assert.strictEqual(typeof result.value, 'string');
  console.log('PASS: my feature');
}
```

### Test guidelines

- Every new agent needs at least one test
- Test both success and failure paths
- Use 100 agents for test swarms (cheap and fast)
- Integration tests should use `withTimeout()` to prevent hangs
- Tests should be runnable without API keys (agents degrade gracefully)

## Code Style

### General rules

- CommonJS (`require`/`module.exports`) — no ESM
- Single quotes for strings
- 2-space indentation
- Semicolons required
- `const` by default, `let` when reassignment is needed, never `var`

### Naming

- Files: `kebab-case.js`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### Patterns

- Agents are classes with async methods
- CLI commands are exported async functions
- Errors are handled with try/catch, never swallowed silently
- Cost is tracked on every external API call

## Pull Request Process

### Before you start

1. Check existing [issues](https://github.com/askelira/askelira/issues) for related work
2. For large changes, open an issue first to discuss the approach
3. Fork the repo and create a feature branch from `main`

### Branch naming

```
feature/add-new-agent
fix/swarm-timeout-bug
docs/update-readme
```

### Making your PR

1. Make your changes on a feature branch
2. Run all tests and make sure they pass
3. Add tests for new functionality
4. Keep commits focused — one logical change per commit
5. Write a clear PR description explaining what and why

### PR checklist

- [ ] Tests pass (`node test/swarm.test.js && node test/integration.test.js`)
- [ ] New features have tests
- [ ] No `console.log` debugging left in code (use `logger` instead)
- [ ] Cost tracking added for any new external API calls
- [ ] Fallback defined in `swarm.js` if adding a new pipeline phase

### Review

- PRs need one approving review before merge
- Maintainers may suggest changes — this is collaborative, not adversarial
- We aim to review PRs within 48 hours

## Questions?

- Open an [issue](https://github.com/askelira/askelira/issues) for bugs or feature requests
- Start a [discussion](https://github.com/askelira/askelira/discussions) for questions or ideas

Welcome aboard!
