# Launch Checklist

## GitHub Repository

- [ ] README.md polished with clear hero section, install command, and demo output
- [ ] Repository description set: "Visual swarm intelligence for developers"
- [ ] Topics added: `ai`, `swarm-intelligence`, `multi-agent`, `decision-making`, `cli`, `electron`, `trading`, `nodejs`
- [ ] Social preview image uploaded (1280x640, show logo + tagline)
- [ ] License visible (MIT)
- [ ] Issues enabled with bug report and feature request templates
- [ ] Discussions enabled for community Q&A
- [ ] GitHub Pages or link to docs in About section
- [ ] Release v2.0.0 created with release notes and Electron binaries attached
- [ ] Branch protection on `main` (require PR reviews, require CI pass)

## npm Package

- [ ] `npm publish --dry-run` succeeds without errors
- [ ] Package tested via `npx askelira --version` after publish
- [ ] Keywords optimized: ai, swarm, decision-making, multi-agent, trading, automation
- [ ] Package description is concise and searchable
- [ ] README renders correctly on npmjs.com
- [ ] `.npmignore` verified — no test files, docs, or .env in published package
- [ ] `postinstall` script runs cleanly on fresh install

## Electron Desktop App

- [ ] macOS DMG tested on Intel and Apple Silicon
- [ ] Windows installer tested
- [ ] Linux AppImage tested
- [ ] Auto-updater verified with a test release
- [ ] Code signing configured (macOS + Windows)
- [ ] Download links added to README and GitHub release

## Docker

- [ ] `docker build` succeeds
- [ ] `docker compose up` starts gateway + UI
- [ ] Health check passes
- [ ] Image pushed to Docker Hub or GitHub Container Registry

## Documentation

- [ ] All docs reviewed for accuracy
- [ ] API reference matches current code
- [ ] Quick start guide works end-to-end on a clean machine
- [ ] CHANGELOG.md has v2.0.0 entry
- [ ] CONTRIBUTING.md is welcoming and clear

---

## Social Media

### Twitter/X Thread Draft

```
1/ Introducing AskElira 2.0 — deploy 10,000 AI agents to debate your toughest decisions.

Ask a question. Get a GO / NO-GO verdict backed by swarm intelligence.

Open source. Free. Ships today.

2/ How it works:

Alba researches your question (Brave Search)
David deploys 10K agents to debate it
Vex audits the debate quality
Elira synthesizes the final verdict

4 agents. 4 phases. One decision you can trust.

3/ Every debate costs ~$0.07 for 10K agents.

You get:
- YES/NO/INCONCLUSIVE decision
- Confidence score (0-100%)
- Arguments FOR and AGAINST
- Full audit trail

4/ Install in one command:

npm install -g askelira
askelira swarm -q "Should we migrate to microservices?"

CLI, web UI, and Electron desktop app included.

5/ Built-in templates for common decisions:

askelira create trading
askelira create hiring
askelira create product

Scaffold a project, run a debate, ship faster.

6/ AskElira is MIT licensed and open source.

Star it: github.com/askelira/askelira
Install it: npm install -g askelira

PRs welcome. Templates welcome. Custom agents welcome.

What would you ask 10,000 agents?
```

### Hacker News (Show HN)

```
Title: Show HN: AskElira – Deploy 10K AI agents to debate your decisions

URL: https://github.com/askelira/askelira

Text:
Hi HN, I built AskElira, an open-source tool that runs swarm debates
to help developers make better decisions.

You ask a question like "Should we migrate to microservices?" and
AskElira deploys 10,000 agents through a 4-phase pipeline:

1. Research (Brave Search for live context)
2. Debate (MiroFish swarm with vote clustering)
3. Audit (validates participation, consensus, argument quality)
4. Synthesis (final decision with confidence score)

Cost: ~$0.07 per 10K-agent debate. Ships as CLI, web UI, and
Electron desktop app.

npm install -g askelira

Would love feedback on the architecture and agent pipeline.
The 4-phase approach (research -> debate -> audit -> synthesize)
was inspired by how good teams make decisions — gather info,
argue both sides, stress-test, then decide.
```

### Reddit r/programming

```
Title: AskElira: Open-source swarm intelligence — 10K AI agents debate your decisions

Body:
Built an open-source tool that deploys thousands of AI agents to
debate questions and return a GO/NO-GO verdict.

- 4-phase pipeline: Research → Debate → Audit → Synthesis
- CLI + Web UI + Electron desktop app
- ~$0.07 per 10K-agent debate
- MIT licensed

npm install -g askelira

GitHub: github.com/askelira/askelira

Interested in feedback on the approach. The audit phase (Vex) checks
for things like low participation, single-cluster dominance, and
weak consensus — similar to how you'd sanity-check a team vote.
```

### Reddit r/node

```
Title: AskElira 2.0 — multi-agent swarm debate tool built with Node.js

Short post focused on the technical stack: Commander CLI, Express/WS
for the UI server, Electron for desktop, chalk v4 for CJS compat,
hybrid memory with markdown + JSON index. Looking for contributors.
```

---

## Community

- [ ] Discord server created with channels: #general, #support, #showcase, #development
- [ ] Discord invite link added to README and docs
- [ ] Slack workspace created (alternative to Discord)
- [ ] GitHub Discussions enabled for async community chat
- [ ] CONTRIBUTING.md links to community channels
- [ ] Welcome bot configured for new Discord/Slack members
- [ ] Community code of conduct published

---

## Analytics and Monitoring

- [ ] npm download stats tracked (npmjs.com/package/askelira)
- [ ] GitHub star count baseline recorded
- [ ] Google Analytics or Plausible on docs site (if hosted)
- [ ] Error tracking set up (optional: Sentry for Electron app)

---

## Post-Launch (Week 1)

- [ ] Respond to all GitHub issues within 24 hours
- [ ] Engage with HN and Reddit comments
- [ ] Retweet/share community posts
- [ ] Collect feedback for v2.1 roadmap
- [ ] Write a "lessons learned" blog post
- [ ] Thank early contributors
