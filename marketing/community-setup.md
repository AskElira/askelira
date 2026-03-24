# Community Setup Guide

## Discord Server

### Server Name

AskElira Community

### Channel Structure

**Information**
- `#welcome` — Read-only. Rules, links, getting started
- `#announcements` — Read-only. Releases, breaking changes, events
- `#roles` — Self-assign roles (Developer, Contributor, Trader, User)

**General**
- `#general` — Open discussion about AskElira and swarm intelligence
- `#introductions` — New members introduce themselves
- `#off-topic` — Non-AskElira chat

**Support**
- `#help` — Installation, configuration, troubleshooting
- `#bug-reports` — Quick bug reports (direct to GitHub Issues for tracking)
- `#feature-ideas` — Casual feature requests before they become GitHub issues

**Showcase**
- `#showcase` — Share what you've built with AskElira
- `#custom-agents` — Share and discuss community-built agents
- `#templates` — Share custom templates
- `#results` — Interesting debate results and decisions

**Development**
- `#development` — Contributing, architecture discussions, code review
- `#pull-requests` — PR discussion and review requests
- `#ci-cd` — Build status, deployment discussion
- `#roadmap` — v2.1, v2.2, v3.0 planning

**Voice**
- `#community-call` — Weekly/biweekly voice chat for contributors

### Roles

| Role | Color | Permissions |
|------|-------|-------------|
| Admin | Red | Full access |
| Moderator | Orange | Manage messages, mute, kick |
| Contributor | Green | Access to #development channels |
| Trader | Blue | Cosmetic, self-assignable |
| User | Gray | Default |

### Bots

- **Welcome bot** — Greets new members, sends DM with getting started guide
- **GitHub bot** — Posts new releases, issues, and PR activity to #announcements
- **Role bot** — Reaction-based role assignment in #roles

### Welcome DM

```
Welcome to the AskElira community!

Here's how to get started:

1. Read the rules in #welcome
2. Introduce yourself in #introductions
3. Install AskElira: npm install -g askelira
4. Ask questions in #help
5. Share what you build in #showcase

Docs: https://github.com/askelira/askelira
```

---

## GitHub Discussions

### Categories

| Category | Description | Format |
|----------|-------------|--------|
| Announcements | Releases and updates (maintainers only) | Announcement |
| Q&A | Installation, usage, troubleshooting | Question/Answer |
| Ideas | Feature proposals and brainstorming | Open-ended |
| Show and Tell | Share projects, custom agents, results | Open-ended |
| General | Everything else | Open-ended |

### Pinned Discussions

- "Welcome to AskElira Discussions" — Rules, links, how to ask good questions
- "Roadmap Discussion — What should we build next?" — Community input on priorities
- "Custom Agent Gallery" — Index of community-built agents

---

## Slack Workspace

### Workspace Name

AskElira

### Channels

| Channel | Purpose |
|---------|---------|
| `#general` | Main discussion |
| `#help` | Support and troubleshooting |
| `#development` | Contributing and code discussion |
| `#releases` | Automated release notifications |
| `#random` | Off-topic |

### Integrations

- GitHub app for release and PR notifications in #releases
- Custom Slackbot responses for common questions (install command, docs link)

---

## Moderation Guidelines

### Community Rules

1. **Be respectful.** No harassment, personal attacks, or discrimination.
2. **Stay on topic.** Use the right channel for your message.
3. **No spam.** No self-promotion unrelated to AskElira or swarm intelligence.
4. **Search before asking.** Check docs, past messages, and GitHub Issues first.
5. **No piracy or abuse.** Don't share API keys, circumvent rate limits, or use AskElira for harm.
6. **English preferred.** Most discussion is in English. Other languages welcome in #off-topic.

### Enforcement

| Offense | Action |
|---------|--------|
| Off-topic message | Redirect to correct channel |
| Minor rule violation | Warning via DM |
| Repeated violations | 24-hour mute |
| Harassment or abuse | Permanent ban |
| Spam | Delete + ban |

### Moderator Responsibilities

- Respond to #help questions within 24 hours (or tag someone who can)
- Move misplaced messages to the correct channel
- Escalate bugs from Discord/Slack to GitHub Issues
- Welcome new members who introduce themselves
- Keep pinned messages current

---

## Welcome Messages

### Discord #welcome

```
Welcome to the AskElira Community!

AskElira is an open-source tool that deploys thousands of AI agents
to debate your toughest decisions.

Getting started:
  npm install -g askelira
  askelira swarm -q "Your question here"

Links:
  GitHub: https://github.com/askelira/askelira
  Docs:   https://github.com/askelira/askelira/tree/main/docs
  npm:    https://www.npmjs.com/package/askelira

Rules:
  1. Be respectful
  2. Stay on topic
  3. No spam
  4. Search before asking
  5. Have fun building things

Need help? Ask in #help.
Want to contribute? Check out #development.
Built something cool? Share it in #showcase.
```

### GitHub Discussions Welcome

```
Welcome to AskElira Discussions!

This is the place for questions, ideas, and sharing what you've built.

Before posting:
- Check the docs: https://github.com/askelira/askelira/tree/main/docs
- Search existing discussions
- For bugs, please use GitHub Issues instead

Categories:
- Q&A: "How do I...?" questions
- Ideas: Feature proposals
- Show and Tell: Your projects and results
- General: Everything else

We read every post. Thanks for being here.
```

---

## Engagement Strategies

### Week 1 (Launch)

- Post launch announcement in all channels
- Personally welcome every new member for the first 50
- Share 3-5 interesting debate results in #showcase to seed content
- Run a "What would you ask 10K agents?" prompt in #general

### Month 1

- Weekly "Question of the Week" — run a community debate and share results
- Highlight one community contribution per week in #announcements
- Start a "Custom Agent Challenge" — build an agent, share it, get feedback
- Collect FAQ from #help and update docs/FAQ.md

### Ongoing

- Monthly community call (voice) for roadmap discussion
- "Contributor of the Month" recognition
- Maintain a community-built agent index in #custom-agents
- Cross-post interesting GitHub Discussions to Discord and vice versa
- Engage with every Show and Tell post — ask questions, give feedback
- Run seasonal events (Hacktoberfest templates, end-of-year retrospective)

### Metrics to Track

| Metric | Target (Month 1) |
|--------|-------------------|
| Discord members | 100 |
| GitHub stars | 500 |
| npm weekly downloads | 200 |
| GitHub Discussions posts | 25 |
| Community-built agents | 3 |
| Open issues resolved | 80% within 7 days |
