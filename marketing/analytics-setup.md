# Analytics Setup

## Tools

### GitHub Stars Tracker

Track star growth over time using **Star History** (star-history.com).

Embed in README or docs:

```
https://star-history.com/#askelira/askelira&Date
```

Also track via GitHub API:

```bash
gh api repos/askelira/askelira --jq '.stargazers_count'
```

Set up a weekly cron (GitHub Actions or local) to log star count:

```yaml
# .github/workflows/stats.yml
name: Weekly Stats
on:
  schedule:
    - cron: '0 9 * * 1' # Monday 9 AM UTC
jobs:
  log:
    runs-on: ubuntu-latest
    steps:
      - run: |
          STARS=$(gh api repos/askelira/askelira --jq '.stargazers_count')
          FORKS=$(gh api repos/askelira/askelira --jq '.forks_count')
          echo "$(date +%Y-%m-%d),${STARS},${FORKS}" >> stats.csv
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### npm Download Stats

**Weekly downloads:** https://www.npmjs.com/package/askelira

**API endpoint:**

```bash
curl -s https://api.npmjs.org/downloads/point/last-week/askelira | jq '.downloads'
```

**Badge for README:**

```markdown
![npm downloads](https://img.shields.io/npm/dw/askelira)
```

**Historical data:** https://npm-stat.com/charts.html?package=askelira

### Google Analytics (Docs Site)

If hosting docs on a static site (GitHub Pages, Vercel, Netlify):

1. Create a GA4 property at analytics.google.com
2. Add the measurement ID to the docs template:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Key events to track:**
- Page views (docs sections)
- Outbound clicks (GitHub, npm install command copy)
- Scroll depth on README and API docs

### PostHog (App Usage)

For optional, privacy-respecting usage analytics in the CLI and Electron app.

**Setup:**

```bash
npm install posthog-node
```

```javascript
const { PostHog } = require('posthog-node');
const posthog = new PostHog('phc_XXXXXXXXXX', { host: 'https://app.posthog.com' });

// Track debate
posthog.capture({
  distinctId: anonymousId,
  event: 'debate_completed',
  properties: {
    agentCount: result.agentCount,
    decision: result.decision,
    confidence: result.confidence,
    duration: result.duration,
    partial: result.partial,
  },
});
```

**Important:** Always make analytics opt-in. Respect `DO_NOT_TRACK` environment variable:

```javascript
if (process.env.DO_NOT_TRACK === '1') return;
```

**Events to track:**
- `cli_command` — which command was run (start, swarm, history, config, create)
- `debate_completed` — agent count, decision, confidence, duration
- `template_created` — which template was used
- `app_launched` — Electron app opened
- `error_occurred` — phase failures (anonymized, no question content)

**Never track:**
- Question text
- API keys
- User identity
- Debate arguments or results content

### Twitter/X Analytics

Use Twitter's built-in analytics at analytics.twitter.com:

- Impressions per tweet
- Engagement rate (likes + retweets + replies / impressions)
- Profile visits
- Follower growth
- Link clicks (to GitHub, npm)

Track which content types perform best:
- Launch threads vs use case threads vs technical deep-dives
- Code snippets vs screenshots vs plain text
- Question prompts ("What would you ask?") vs statements

---

## Metrics to Track

### Growth Metrics

| Metric | Source | Target (Month 1) | Target (Month 3) |
|--------|--------|-------------------|-------------------|
| GitHub stars | GitHub API | 500 | 2,000 |
| npm weekly downloads | npm API | 200 | 1,000 |
| Discord members | Discord | 100 | 500 |
| Twitter followers | Twitter | 300 | 1,500 |
| GitHub forks | GitHub API | 30 | 150 |

### Usage Metrics

| Metric | Source | Description |
|--------|--------|-------------|
| Debates per week | PostHog | Total debates run across all users |
| Avg agent count | PostHog | What agent counts people actually use |
| Template usage | PostHog | Which templates are most popular |
| CLI vs UI vs Electron | PostHog | Interface preference |
| Error rate | PostHog | % of debates with partial results |

### Engagement Metrics

| Metric | Source | Description |
|--------|--------|-------------|
| Issues opened per week | GitHub API | Community engagement signal |
| Issues closed per week | GitHub API | Responsiveness signal |
| PR submissions | GitHub API | Contributor health |
| Discussion posts | GitHub API | Community activity |
| Discord messages per day | Discord | Community vitality |

### Retention Metrics

| Metric | Description |
|--------|-------------|
| D1 retention | % of installers who run a debate within 24h |
| D7 retention | % of installers who run a debate in week 2 |
| D30 retention | % of users active after 30 days |
| Repeat usage | Avg debates per user per week |

### Conversion Funnel

```
npm page view
    │
    ▼
npm install (download)
    │
    ▼
First debate run
    │
    ▼
Second debate (within 7 days)
    │
    ▼
Template created or custom agent built
    │
    ▼
GitHub star or contribution
```

Track drop-off at each stage. Optimize the stages with the biggest drop.

---

## Dashboard

Create a simple dashboard (Notion, Google Sheets, or Grafana) that updates weekly:

| Metric | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|
| GitHub stars | | | | |
| npm downloads | | | | |
| Discord members | | | | |
| Debates run | | | | |
| Issues opened | | | | |
| Issues closed | | | | |
| PRs merged | | | | |
| Twitter impressions | | | | |

Review every Monday. Adjust social calendar and content strategy based on what's working.
