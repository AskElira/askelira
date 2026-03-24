# Press Kit

## One-Liner

AskElira is an open-source tool that deploys 10,000 AI agents to debate your decisions and return a verdict you can trust.

## Boilerplate (50 words)

AskElira is an open-source swarm intelligence platform for developers. It runs a 4-phase pipeline — research, debate, audit, synthesis — across thousands of AI agents to produce structured decisions with confidence scores. Available as a CLI, web UI, and desktop app. MIT licensed.

## Boilerplate (100 words)

AskElira is an open-source decision intelligence tool that deploys thousands of AI agents to debate both sides of a question. Instead of relying on a single AI response, AskElira runs a 4-phase pipeline: Alba researches the topic using live web data, David orchestrates a swarm debate with vote clustering, Vex audits the debate for groupthink and quality, and Elira synthesizes a final GO / CONDITIONAL / NO-GO verdict with a confidence score. A 10,000-agent debate takes about five seconds and costs $0.07. Available as a Node.js CLI, web UI with real-time visualization, and Electron desktop app.

---

## Key Features

- **10,000-agent swarm debates** — Thousands of agents argue both sides simultaneously
- **4-phase pipeline** — Research, Debate, Audit, Synthesis — every answer is challenged before it reaches you
- **Audit phase** — Detects groupthink, low participation, and weak consensus
- **$0.07 per debate** — Full cost transparency on every query
- **CLI + Web UI + Desktop App** — Three interfaces, one tool
- **Hybrid memory** — Every decision logged in human-readable markdown
- **Project templates** — Scaffold trading, hiring, and product evaluations in one command
- **Open source** — MIT licensed, extensible, community-driven

---

## Problem / Solution

### Problem

Developers and teams make high-stakes decisions daily — architecture choices, hiring calls, product launches, trading strategies. Asking one AI model gives one perspective. Polling a team introduces groupthink. Neither approach provides structured, adversarial reasoning at scale.

### Solution

AskElira deploys thousands of AI agents that independently argue for and against a proposition. An audit phase validates the quality of the debate — checking participation rates, cluster diversity, and consensus strength. The result is a structured decision with a confidence score, supporting arguments from both sides, and a clear GO / NO-GO verdict.

---

## Founder

**Alvin Kerremans** — Creator of AskElira

Alvin built AskElira out of frustration with confirmation bias in trading strategy backtesting. After realizing that a single AI model would simply confirm whatever hypothesis he presented, he designed a system where thousands of agents actively argue against assumptions. The audit phase — which catches suspiciously uniform agreement — came from the insight that unanimous consensus in a large group is often a sign of poor reasoning, not strong agreement.

---

## Screenshots

Available in the repository:

- **CLI output** — Terminal showing a complete debate result with decision, confidence, arguments
- **Web UI** — Dark-themed interface with swarm particle visualization and confidence gauge
- **Desktop app** — Electron app with system tray and native notifications
- **Swarm visualization** — Canvas particle system showing agent clusters forming in real time

Request high-resolution screenshots: press@askelira.com

---

## Demo Video Script (60 seconds)

```
[0:00–0:05]  Title card: "AskElira — 10,000 agents. One decision."

[0:05–0:12]  Terminal: npm install -g askelira
             Voiceover: "Install AskElira in one command."

[0:12–0:22]  Terminal: askelira swarm -q "Should we rewrite auth from scratch?"
             Voiceover: "Ask any question. Ten thousand agents debate it."

[0:22–0:32]  Show pipeline phases appearing:
             "Alba: researching... David: debating... Vex: auditing... Elira: synthesizing..."
             Voiceover: "Four phases. Research. Debate. Audit. Synthesize."

[0:32–0:42]  Result appears: Decision: no, Confidence: 74%, Arguments for and against
             Voiceover: "You get a decision, confidence score, and the best arguments from both sides."

[0:42–0:50]  Switch to web UI with swarm visualization
             Voiceover: "Watch it happen in real time."

[0:50–0:57]  Show confidence meter animating, decision badge appearing
             Voiceover: "Every debate is saved. Every dollar is tracked."

[0:57–1:00]  End card: "github.com/askelira/askelira — Open source. Free. Try it today."
```

---

## Ready-to-Use Quotes

> "One AI gives you one answer. Ten thousand agents give you a structured debate."
> — Alvin Kerremans, creator of AskElira

> "The audit phase is the most valuable part. It catches the things humans miss — suspiciously uniform agreement, low participation, weak consensus."
> — Alvin Kerremans

> "We built AskElira because hard decisions deserve more than a single perspective."
> — Alvin Kerremans

> "A 10,000-agent debate costs seven cents and takes five seconds. That's cheaper and faster than a team meeting."
> — Alvin Kerremans

---

## Key Numbers

| Metric | Value |
|--------|-------|
| Agents per debate | 1,000 – 1,000,000 |
| Default agent count | 10,000 |
| Cost per 10K-agent debate | ~$0.07 |
| Debate duration | ~5 seconds |
| Pipeline phases | 4 (Research, Debate, Audit, Synthesis) |
| Audit checks | 5 (participation, clusters, dominance, consensus, arguments) |
| Test coverage | 68+ tests across 5 suites |
| License | MIT |

---

## Brand Assets

### Logo

- `electron/assets/icon.svg` — Vector logo (blue-purple gradient sphere, "AE" monogram)
- `electron/assets/icon.png` — 512x512 PNG
- `build/icon.icns` — macOS icon set

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#6366f1` | Indigo — logo, buttons, links |
| Primary Dark | `#3730a3` | Indigo 800 — gradients, hover states |
| Primary Light | `#818cf8` | Indigo 400 — highlights, accents |
| Background | `#0f172a` | Slate 900 — dark UI background |
| Surface | `#1e293b` | Slate 800 — cards, panels |
| Text | `#f8fafc` | Slate 50 — primary text |
| Text Muted | `#94a3b8` | Slate 400 — secondary text |
| Success | `#22c55e` | Green 500 — GO verdict, online status |
| Warning | `#eab308` | Yellow 500 — CONDITIONAL verdict |
| Error | `#ef4444` | Red 500 — NO-GO verdict, errors |

### Typography

- **UI:** Inter, Helvetica, Arial, sans-serif
- **Code:** System monospace

---

## Media Contact

**Email:** press@askelira.com

For interview requests, demo access, high-resolution assets, or additional information.

---

## Links

| Resource | URL |
|----------|-----|
| GitHub | https://github.com/askelira/askelira |
| npm | https://www.npmjs.com/package/askelira |
| Documentation | https://github.com/askelira/askelira/tree/main/docs |
| Issues | https://github.com/askelira/askelira/issues |
