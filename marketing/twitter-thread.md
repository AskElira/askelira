# Twitter Launch Thread

---

**1/7 — Hook**

You ask ChatGPT a hard question and get one answer.

But one answer isn't enough when you're deciding whether to rewrite your auth system, deploy a new trading strategy, or hire candidate #3.

I built a tool that deploys 10,000 AI agents to argue both sides. Here's how it works:

---

**2/7 — Solution**

AskElira runs a 4-phase pipeline on every question:

1. Research — pulls live context from the web
2. Debate — 10K agents argue for and against
3. Audit — catches groupthink, low participation, weak consensus
4. Synthesis — final verdict: GO / CONDITIONAL / NO-GO

One command. Five seconds. $0.07.

---

**3/7 — Demo**

```
npm install -g askelira

askelira swarm -q "Should we migrate to microservices?"

Decision:   yes
Confidence: 83%
Verdict:    GO

FOR:  Team scaling, independent deploys
AGAINST: Operational complexity, 5-person team too small
Audit: all checks passed
Cost: $0.068
```

---

**4/7 — Why it works**

One LLM gives you one perspective. 10,000 agents give you clusters of independent arguments.

The audit agent (Vex) is the secret weapon. It catches:
- 96% of agents in one cluster? Suspiciously uniform. Penalty.
- Only 30% participated? Low confidence. Penalty.
- Zero arguments against? Something's wrong. Penalty.

It's the skeptical coworker you always needed.

---

**5/7 — Use cases**

Built-in templates for common decisions:

```
askelira create trading    # Deploy this strategy?
askelira create hiring     # Hire this candidate?
askelira create product    # Launch this feature?
```

Also great for: architecture decisions, vendor selection, risk assessment, code review tradeoffs.

---

**6/7 — Tech stack**

- Node.js CLI + web UI + Electron desktop app
- Real-time swarm particle visualization (Canvas)
- Hybrid memory: markdown logs + JSON search index
- 68+ tests, GitHub Actions CI, Docker support
- MIT licensed, zero lock-in, runs locally

The only external calls are Brave Search (optional) and the swarm gateway.

---

**7/7 — Call to action**

AskElira is free and open source.

Try it:
npm install -g askelira

Star it:
github.com/askelira/askelira

What would you ask 10,000 agents?
