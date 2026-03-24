# Show HN: AskElira 2.0 – Visual swarm intelligence for developers

**URL:** https://github.com/askelira/askelira

---

Hi HN,

I've been building AskElira, an open-source tool that throws 10,000 AI agents at a question and lets them fight it out. You get back a decision, a confidence score, and the best arguments from both sides.

## The problem

Developers make high-stakes decisions all the time — migrate to microservices or stay monolith? Ship before the holiday or wait? Hire this candidate or keep looking? You can ask one LLM, but you get one perspective. You can poll your team, but groupthink kicks in. Neither gives you structured, adversarial reasoning at scale.

## What AskElira does

You ask a question, pick how many agents to deploy (default 10K), and the tool runs a 4-phase pipeline:

1. **Alba** (Research) — hits Brave Search to pull live context about your question
2. **David** (Debate) — spins up a MiroFish swarm where agents argue for and against, then clusters their votes
3. **Vex** (Audit) — sanity-checks the debate: was participation high enough? Did one cluster dominate? Is the consensus real or noise?
4. **Elira** (Synthesis) — takes everything and produces a final YES/NO/INCONCLUSIVE with a confidence score and GO/NO-GO verdict

The whole thing takes ~5 seconds and costs about $0.07 for 10K agents.

## Quick demo

```
$ npm install -g askelira
$ askelira swarm -q "Should we rewrite auth from scratch?"

Starting 10,000 agent swarm...

Decision:   no
Confidence: 74%
Verdict:    GO

Arguments FOR:
  + Current auth has 3 known vulnerabilities
  + Modern standards (OAuth 2.1) not supported

Arguments AGAINST:
  + Rewrite estimated at 6 weeks, existing bugs fixable in 2
  + Working auth rarely justifies full rewrite risk
  + Migration path exists without rewrite

Audit: all checks passed
Cost: $0.068
```

There's also a web UI with a real-time swarm particle visualization (kind of mesmerizing to watch 10K dots cluster in real time), and an Electron desktop app with system tray and native notifications.

## Why I built this

I was backtesting trading strategies and kept second-guessing myself. "Is this strategy actually good or am I just seeing what I want to see?" I wanted something that would actively argue against my assumptions. One agent saying "looks good" isn't helpful. Ten thousand agents forming clusters of independent arguments? That's harder to dismiss.

The audit phase (Vex) turned out to be the most valuable part. It catches things like: "Hey, 96% of agents are in one cluster — that's suspiciously uniform, penalizing confidence by 15%." It's the equivalent of your skeptical coworker who asks the uncomfortable questions.

## Tech stack

- Node.js, CommonJS throughout (chalk v4 pinned because v5 went ESM-only)
- Commander for CLI, Express + WebSocket for the UI server
- Electron with contextBridge for the desktop app
- Canvas particle system for the swarm visualization
- Markdown + JSON index for debate memory (no external DB required)

Everything runs locally. The only external calls are Brave Search (optional, for research context) and the OpenClaw gateway (for the actual swarm execution).

## What's next

- **v2.1:** Agent marketplace — install community-built agents from npm (`askelira install @community/reddit-research`)
- **v2.2:** Real-time collaboration — share a debate URL with your team and watch it together
- **v3.0:** Distributed swarms across multiple nodes, persistent agent memory

The whole thing is MIT licensed. Would love feedback on the architecture, especially the 4-phase pipeline design. Is the audit phase doing enough? Should Vex be stricter or more lenient? What other checks would you add?

GitHub: https://github.com/askelira/askelira
