# AskElira 2.0 — UI Guide

## Quick Start

Start AskElira with the web interface:

```bash
askelira start
```

This launches two servers:
- **Gateway**: `http://localhost:5678` (OpenClaw backend)
- **Web UI**: `http://localhost:3000` (open this in your browser)

To run the UI server standalone:

```bash
npm run start:ui
```

To disable the UI and run gateway-only:

```bash
askelira start --no-ui
```

---

## Using the Interface

### Main Layout

The UI has three areas:

```
┌──────────────┬──────────────────────────────────┐
│              │  Header (status badge)            │
│   History    ├──────────────────────────────────┤
│   Sidebar    │  Question Input + Agent Slider    │
│              ├──────────────────────────────────┤
│  (search,    │                                  │
│   recent     │  Results Area                    │
│   debates)   │  (decision, confidence, args)    │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

### Question Input

Type your question in the input field at the top of the main area.

- Press **Enter** or click **Run Swarm** to submit
- Questions should be decision-oriented: "Should we...", "Is it worth...", "Which is better..."
- Be specific — "Should we use Redis for session caching?" works better than "What database?"

### Agent Slider

The slider below the input controls how many agents participate in the debate.

| Agents | Best For | Est. Cost |
|--------|----------|-----------|
| 100 | Quick test, development | $0.0007 |
| 1,000 | Simple questions | $0.0070 |
| 10,000 | Production decisions (default) | $0.0700 |
| 50,000 | High-stakes decisions | $0.3500 |
| 100,000 | Maximum confidence | $0.7000 |

The cost estimate updates in real time as you drag the slider.

### Submit Button

- Turns gray and shows "Running..." during execution
- Disabled until the current swarm completes
- Results appear below once all 4 phases finish

---

## Understanding Results

### Decision Card

The top card shows the final answer:

```
┌─────────────────────────────────┐
│  Decision          Confidence   │
│  YES               83%          │
│  ████████████████░░░░           │
└─────────────────────────────────┘
```

- **Decision**: YES (green), NO (red), or INCONCLUSIVE (yellow)
- **Confidence**: 0-100% with animated color bar
  - 75-100%: Green — strong consensus
  - 50-74%: Yellow — moderate agreement
  - 0-49%: Red — weak or split

### Confidence Meter

The circular gauge visualizes confidence with color-coded arcs:

- **Red arc** (0-49%): Agents are divided, low agreement
- **Yellow arc** (50-74%): Moderate consensus, some disagreement
- **Green arc** (75-100%): Strong consensus, high agreement

The gauge animates smoothly from 0 to the final value.

### Arguments For / Against

Two side-by-side panels show the strongest arguments from each side:

```
┌─ Arguments For ──┬─ Arguments Against ─┐
│ + Lower latency  │ - Migration cost    │
│ + Better scaling  │ - Team learning     │
│ + Industry trend  │ - Added complexity  │
└──────────────────┴─────────────────────┘
```

- **Green (+)** arguments support the "yes" side
- **Red (-)** arguments support the "no" side
- Arguments are ranked by cluster vote count

### Audit Notes

Below the arguments, Vex's audit results appear:

- **"All checks passed"** (green) — debate quality is high
- Warning items appear in yellow with `!` prefix
- Common warnings:
  - Low vote participation
  - Single cluster dominance
  - Weak consensus margin

### Stats Panel

The bottom-right card shows execution details:

| Stat | Description |
|------|-------------|
| Cost | Actual API cost for this debate |
| Duration | Wall time from submit to result |
| Agents | Number of agents that participated |

---

## Swarm Visualization

During execution, the canvas area shows a live particle animation:

1. **Research phase** — Particles float in neutral indigo, evenly spread
2. **Debate phase** — Particles split into green (for) and red (against) clusters, connection lines appear between aligned agents
3. **Audit phase** — Clusters tighten, movement slows
4. **Synthesis phase** — Particles merge toward the winning side
5. **Complete** — Particles settle into a calm final state

The visualization adapts to the actual for/against vote ratio.

---

## History Panel

The left sidebar shows past debates.

### Viewing History

- Recent debates appear as cards with question, decision, confidence, and date
- Click any card to load that question into the input field
- Selected card is highlighted with an indigo accent border

### Searching

Type in the search bar at the top of the sidebar to filter debates:

- Filters by question text, decision, and date
- Filtering is instant (client-side)
- Clear the search to see all debates again

### Auto-Refresh

History reloads from the server every 30 seconds. Click the **Refresh** button in the sidebar footer to reload manually.

### Storage

Debates are stored in two places:

- **`~/.askelira/memory/YYYY-MM-DD.md`** — Markdown files, one per day
- **ChromaDB vector store** — For semantic search ("find debates similar to...")

---

## Cost Estimates

AskElira shows cost at every step:

1. **Before running** — Estimated cost appears below the agent slider
2. **During execution** — Cost accumulates across phases
3. **After completion** — Actual cost shown in the Stats panel

### Cost Breakdown

| Component | Cost |
|-----------|------|
| Per agent | $0.000007 |
| Brave Search (Alba) | ~$0.005/query |
| Anthropic API (if used) | Varies by model |

### Keeping Costs Low

- Use 100 agents for testing and development
- Use 10,000 agents for real decisions
- Only scale to 50K-100K for high-stakes questions
- The `--cost` CLI flag shows estimates before execution

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Submit question / run swarm |
| `/` | Focus the question input |
| `Ctrl+K` | Focus the history search |
| `Escape` | Clear current input / close detail view |

---

## Status Badge

The top-right corner shows gateway status:

- **Green dot** + "Gateway Online" — Ready to run swarms
- **Yellow dot** + "Gateway Offline" — Gateway not detected, start it with `askelira start`
- **Red dot** + "Disconnected" — Cannot reach the UI server

Status refreshes automatically every 30 seconds.

---

## Troubleshooting

**UI won't load**
- Verify the server is running: `npm run start:ui`
- Check port 3000 is free: `lsof -i :3000`

**"Gateway Offline" badge**
- Start the gateway: `askelira start`
- Check port 5678 is free: `lsof -i :5678`

**No results returning**
- Check the browser console for errors
- Verify OpenClaw is installed: `openclaw --version`
- Try a smaller agent count (100) for testing

**History not showing**
- Ensure `~/.askelira/memory/` exists
- Run at least one debate to populate history
- Click Refresh in the sidebar footer
