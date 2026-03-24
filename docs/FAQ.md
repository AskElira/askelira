# Frequently Asked Questions

## Installation

### Node.js version requirements?

AskElira requires Node.js 18 or higher. Check your version:

```bash
node --version
```

### npm install fails with permission errors?

Use `npx` instead of global install, or fix npm permissions:

```bash
npx askelira swarm -q "Your question"
```

Or install with proper permissions:

```bash
npm install -g askelira --unsafe-perm
```

### postinstall script fails?

The postinstall script creates `~/.askelira/memory/` and checks for OpenClaw. If it fails:

```bash
mkdir -p ~/.askelira/memory
npm install -g openclaw
```

---

## API Keys

### Do I need an API key to use AskElira?

AskElira works without API keys, but with reduced functionality:
- **Without BRAVE_API_KEY**: Alba skips live research and returns a fallback. Swarm debates still run but without web context.
- **With BRAVE_API_KEY**: Full research phase with live web results.

### How do I set up my Brave Search API key?

1. Sign up at https://brave.com/search/api/
2. Create an API key
3. Set it:

```bash
askelira config --set BRAVE_API_KEY=your-key-here
```

Or add to `~/.askelira/.env`:

```
BRAVE_API_KEY=your-key-here
```

### Are API keys stored securely?

Keys are stored in `~/.askelira/.env` with standard file permissions. The CLI masks keys when displaying config. Never commit `.env` files to version control.

---

## Cost

### How much does a swarm debate cost?

Cost depends on agent count:

| Agents | Approximate Cost |
|--------|-----------------|
| 1,000 | $0.007 |
| 10,000 | $0.07 |
| 50,000 | $0.35 |
| 100,000 | $0.70 |

Brave Search queries add ~$0.005 per query.

### How do I track costs?

Use the `--cost` flag to see estimates before running:

```bash
askelira swarm -q "Your question" --cost
```

Every result includes an `actualCost` field. The cost calculator ledger tracks all API calls.

### Is there a free tier?

AskElira itself is free and open source. Costs come from the underlying APIs (Brave Search, OpenClaw gateway).

---

## Accuracy

### How accurate are swarm decisions?

Accuracy depends on:
- **Agent count**: More agents = more diverse perspectives
- **Question clarity**: Specific, well-framed questions get better results
- **Research quality**: Questions with available web context score higher

The confidence score (0-100%) indicates how strongly agents agree. Scores above 70% are "GO" verdicts.

### What does the confidence score mean?

| Confidence | Verdict | Meaning |
|-----------|---------|---------|
| 70-100% | GO | Strong consensus, high reliability |
| 40-69% | CONDITIONAL | Mixed signals, proceed with caution |
| 0-39% | NO-GO | Weak consensus, insufficient data |

### Can I trust the decision for production/business use?

AskElira is a decision support tool, not an oracle. Use it to surface arguments and perspectives you might miss, but combine it with your own judgment.

---

## Custom Agents

### How do I add a custom agent?

Create a new file in `src/agents/` following the agent interface:

```javascript
class MyAgent {
  constructor() {
    this.name = 'MyAgent';
    this.role = 'Custom';
  }

  async execute(question, context) {
    // Your logic here
    return { result: '...', cost: 0 };
  }
}

module.exports = { MyAgent };
```

See `docs/CUSTOM_AGENTS.md` for the full guide.

### Can I replace one of the default agents?

Yes. Import your agent and pass it to the Swarm constructor, or modify the pipeline in `src/agents/swarm.js`.

### Can I add more than 4 phases?

Yes. Add a new phase in `swarm.js` using the `_runPhase` pattern with a fallback object.

---

## Troubleshooting

### "Cannot find module 'openclaw'"

OpenClaw is listed as a dependency but must be available. Install it:

```bash
npm install -g openclaw
```

### "Gateway offline" or connection refused

1. Check if the gateway is running: `curl http://localhost:5678/health`
2. Check if port 5678 is in use: `lsof -i :5678`
3. Restart: `askelira start`
4. Check logs: `~/.askelira/logs/`

### Tests fail with "Cannot find module 'chalk'"

Install dependencies:

```bash
npm install
```

Chalk v4 is pinned for CommonJS compatibility. Do not upgrade to v5+ (ESM only).

### Electron app shows blank window

1. Check if the UI server started: Open `http://localhost:3000` in a browser
2. Force reload: `Cmd/Ctrl + Shift + R`
3. Check DevTools: `Cmd/Ctrl + Shift + I`
4. Reset app data: Delete `~/Library/Application Support/AskElira/`

### "Brave API error: 429"

Rate limited. Wait a moment and retry, or reduce the frequency of research queries.

### Memory files growing too large

Old debate files accumulate in `~/.askelira/memory/`. Clean up:

```bash
# Remove files older than 30 days
find ~/.askelira/memory -name "*.md" -mtime +30 -delete
```

---

## Performance

### How do I speed up debates?

1. **Reduce agent count** — 1K-5K for quick decisions
2. **Skip research** — Unset `BRAVE_API_KEY` to skip the Alba phase
3. **Use the `--no-ui` flag** — Saves resources when running headless

### How do I improve decision quality?

1. **Increase agent count** — 50K+ for important decisions
2. **Ask specific questions** — "Should we migrate our auth service to OAuth 2.0?" beats "Should we change auth?"
3. **Provide context** — Detailed questions give agents more to work with
4. **Check audit notes** — Vex flags quality issues in the swarm results

### What's the maximum agent count?

The CLI accepts up to 1,000,000 agents. In practice, 100K agents is a good upper limit for reasonable latency and cost.
