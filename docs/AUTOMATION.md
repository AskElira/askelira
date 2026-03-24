# Automation Features

## 1. Autoresearch (Alba's Deep Research)

Alba uses **two-layer research** for richer context:

**Layer 1: Brave Search** (fast, API-based)  
**Layer 2: Browser Scraping** (deep content extraction)

### How it works

When autoresearch is enabled:
- Alba performs Brave Search (top 5 results)
- Launches headless browser to scrape top 3 URLs
- Extracts main article content (up to 2000 chars each)
- Combines snippets + deep content
- Passes enriched context to David

### Benefits
- Deeper understanding of complex topics
- Competitor analysis built-in
- More accurate decisions
- Goes beyond search snippet limitations

### Privacy & Performance
- Headless mode (no GUI, no cookies)
- 10-second timeout per site
- ~$0.001 cost
- Adds 2-3 seconds to debate

**Toggle:** Users can disable via checkbox on homepage.

---

## 2. "Build This" — Claude Code Automation

Turns swarm debate decisions into working code automatically.

## How It Works

1. **Swarm Debate** — 10,000 agents debate your question
2. **Decision** — You see the GO/NO-GO verdict with arguments
3. **Build This** — Click to generate implementation code from the decision
4. **Download** — Get all generated files as a downloadable bundle

## Architecture

```
Results Page
  └─ BuildButton (triggers build)
       └─ POST /api/build (SSE stream)
            ├─ build-generator.ts (converts swarm results → prompt)
            ├─ claude-code-runner.js (executes Claude Code)
            └─ BuildProgress (shows live steps + output)
```

### Build Pipeline

| Step | Description |
|------|-------------|
| 1. Generate Prompt | Converts swarm decision, arguments, and research into a structured Claude Code prompt |
| 2. Run Claude Code | Executes the prompt via `claude-code-runner.js` with SSE progress streaming |
| 3. Collect Files | Parses Claude Code output into individual files |
| 4. Package Results | Bundles files for download |

## Rate Limits

| Tier | Monthly Builds | Notes |
|------|---------------|-------|
| Free | 0 | Upgrade required |
| Pro ($20/mo) | 5 | Included in plan |
| Enterprise ($200/mo) | Unlimited | No restrictions |

## API

### POST /api/build

Requires authentication. Streams SSE events during build.

**Request:**
```json
{
  "question": "Should we use GraphQL?",
  "decision": "yes",
  "confidence": 78,
  "argumentsFor": ["Type safety", "Single endpoint"],
  "research": "GraphQL adoption grew 40% in 2025..."
}
```

**SSE Events:**

```
data: {"type": "step", "step": {"id": 1, "label": "Generating build prompt", "status": "done"}}

data: {"type": "progress", "text": "Creating src/schema.graphql..."}

event: done
data: {"type": "complete", "files": [{"path": "src/schema.graphql", "content": "..."}]}
```

**Error Response (429):**
```json
{
  "error": "Build limit reached (5/5). Upgrade for more builds.",
  "tier": "Pro",
  "buildsUsed": 5,
  "buildLimit": 5
}
```

## Components

### BuildButton
Trigger button shown on the results page. Sends swarm data to `/api/build` and opens the progress modal.

### BuildProgress
Full-screen modal showing:
- Step-by-step progress with status indicators
- Live Claude Code output log
- Generated file list on completion
- Download button for bundled output

## Fallback Mode

When Claude Code CLI is not installed, the API generates a structured scaffold with:
- README.md with the decision context
- package.json with project metadata
- index.js starter file

This ensures the feature works in all environments.

## Files

| File | Purpose |
|------|---------|
| `components/BuildButton.tsx` | UI trigger button |
| `components/BuildProgress.tsx` | Progress modal with SSE consumption |
| `app/api/build/route.ts` | API endpoint with auth + tier checks |
| `lib/build-generator.ts` | Prompt generation + output parsing |
| `lib/tiers.ts` | Build limits per tier |
| `src/automation/claude-code-runner.js` | Claude Code CLI wrapper |
