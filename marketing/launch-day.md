# Launch Day Timeline

## T-24h (Monday 9:00 AM PT)

### Final Validation

- [ ] Run full test suite: `npm test`
- [ ] Run lint: `npm run lint`
- [ ] Test fresh install: `npm pack && npm install -g askelira-2.0.0.tgz`
- [ ] Verify `askelira --version` outputs `2.0.0`
- [ ] Run a live debate: `askelira swarm -q "Test question" -a 1000`
- [ ] Verify web UI starts: `askelira start` and open `http://localhost:3000`
- [ ] Test Electron app: `npm run electron:dev`
- [ ] Docker build and run: `docker compose up`
- [ ] Verify postinstall script runs cleanly on a clean machine

### Content Preparation

- [ ] Screenshots captured (CLI result, web UI, desktop app, swarm viz)
- [ ] Demo GIF recorded (terminal running a debate end-to-end)
- [ ] Show HN post finalized (see `show-hn.md`)
- [ ] Twitter thread finalized (see `twitter-thread.md`)
- [ ] Reddit posts finalized (see `reddit-posts.md`)
- [ ] LinkedIn post drafted
- [ ] RELEASE_NOTES.md generated: `node scripts/prepare-release.js 2.0.0`

### Infrastructure

- [ ] npm account logged in: `npm whoami`
- [ ] GitHub release draft created (tag `v2.0.0`, body from RELEASE_NOTES.md)
- [ ] Electron binaries built and ready to attach (macOS DMG, Windows exe, Linux AppImage)
- [ ] Discord server open with welcome message in #welcome
- [ ] GitHub Discussions enabled with welcome post pinned

---

## T-12h (Monday 9:00 PM PT)

### Queue Everything

- [ ] Schedule Twitter thread (use TweetDeck or Typefully for 9:00 AM ET Tuesday)
- [ ] Draft Reddit posts in browser tabs (do not submit yet)
- [ ] Draft LinkedIn post (do not publish yet)
- [ ] Prepare HN submission in a browser tab (do not submit yet)
- [ ] Set phone alarms for each launch milestone
- [ ] Notify any early testers or friends to be online for support

### Pre-Flight Check

- [ ] `npm publish --dry-run` succeeds
- [ ] GitHub release is in draft state with all binaries attached
- [ ] All social post links point to correct GitHub URL
- [ ] Discord invite link works
- [ ] README renders correctly on GitHub (check formatting, links, code blocks)

---

## T-2h (Tuesday 7:00 AM ET / 4:00 AM PT)

### Wake Up and Verify

- [ ] Check GitHub is up: https://www.githubstatus.com
- [ ] Check npm is up: https://status.npmjs.org
- [ ] Check Hacker News is accessible
- [ ] Open all browser tabs for posting
- [ ] Coffee

---

## T-0 (Tuesday 9:00 AM ET / 6:00 AM PT)

### Publish — Execute in This Order

**9:00 AM ET — npm publish**

```bash
npm publish --access public
```

- [ ] Verify: `npm info askelira version` returns `2.0.0`
- [ ] Verify: `npm install -g askelira` works from a clean environment

**9:05 AM ET — GitHub release**

- [ ] Publish the draft release (tag `v2.0.0`)
- [ ] Confirm Electron binaries are attached
- [ ] Confirm publish.yml workflow triggers

**9:10 AM ET — Show HN**

- [ ] Submit Show HN post
- [ ] Save the HN URL
- [ ] Upvote from your account (one vote only — do not ask others to upvote)

**9:15 AM ET — Monitor**

- [ ] Watch HN for first comments — respond quickly and thoughtfully
- [ ] Check npm page renders correctly: https://www.npmjs.com/package/askelira
- [ ] Check GitHub release page looks good

---

## T+1h (10:00 AM ET)

### First Hour Check

- [ ] Respond to all HN comments (aim for <15 min response time)
- [ ] Check npm download count: `curl -s https://api.npmjs.org/downloads/point/last-day/askelira`
- [ ] Check for any install errors reported
- [ ] Monitor GitHub Issues for bug reports

---

## T+2h (11:00 AM ET)

### Reddit

- [ ] Post to r/programming (see `reddit-posts.md`)
- [ ] Post to r/node (see `reddit-posts.md`)
- [ ] Save both URLs
- [ ] Do not cross-post — each post should feel native to its subreddit

---

## T+3h (12:00 PM ET)

### Midday Check

- [ ] Respond to all Reddit comments
- [ ] Continue responding to HN comments
- [ ] Check GitHub stars count
- [ ] Post any interesting early debate results to Discord #showcase
- [ ] Check if publish.yml workflow completed (Electron builds)

---

## T+4h (1:00 PM ET)

### Twitter

- [ ] Publish Twitter thread (or confirm scheduled post went live)
- [ ] Pin the first tweet of the thread to your profile
- [ ] Like and respond to any early engagement

### LinkedIn

- [ ] Publish LinkedIn post
- [ ] Share in relevant LinkedIn groups (AI, Developer Tools, Node.js)

---

## T+6h (3:00 PM ET)

### Afternoon Check

- [ ] Respond to all new comments across all platforms
- [ ] Retweet/share anyone who mentions AskElira
- [ ] Check for any critical bug reports — hot-fix if needed
- [ ] Post a follow-up comment on HN with additional context if thread is active
- [ ] Welcome new Discord members

---

## T+8h (5:00 PM ET)

### Evening Monitoring

- [ ] Final comment sweep across HN, Reddit, Twitter
- [ ] Log current stats:
  - GitHub stars: ___
  - npm downloads: ___
  - HN points: ___
  - Reddit upvotes (r/programming): ___
  - Reddit upvotes (r/node): ___
  - Twitter impressions: ___
  - Discord members: ___
- [ ] Identify top feedback themes for tomorrow's follow-up content
- [ ] Thank the 3 most helpful commenters by name on Twitter

---

## T+12h (9:00 PM ET)

### End of Day

- [ ] Queue a follow-up tweet for tomorrow morning: "Day 1 by the numbers..."
- [ ] Draft responses to any unanswered technical questions (post tomorrow AM)
- [ ] Note any feature requests or bugs to triage tomorrow
- [ ] Set alarm for tomorrow morning check

---

## T+24h (Wednesday 9:00 AM ET)

### Day 2 Analytics Review

- [ ] Pull full Day 1 stats:

| Metric | Count |
|--------|-------|
| GitHub stars | |
| npm downloads | |
| HN points | |
| HN comments | |
| Reddit r/programming upvotes | |
| Reddit r/node upvotes | |
| Twitter thread impressions | |
| Twitter thread engagements | |
| LinkedIn impressions | |
| Discord members | |
| GitHub Issues opened | |
| GitHub forks | |

- [ ] Identify what worked (highest engagement content/platform)
- [ ] Identify what underperformed
- [ ] Triage all GitHub Issues (label, assign, respond)
- [ ] Post "Day 1 stats" tweet
- [ ] Post Day 1 recap in Discord #announcements
- [ ] Plan Day 2 content based on community questions and feedback
- [ ] Begin Week 1 social calendar (see `social-calendar.md`)

---

## Emergency Procedures

### Critical Bug After Publish

1. Assess severity — can users work around it?
2. If blocking: fix, bump patch (`node scripts/version-bump.js patch`), republish
3. Post update on HN/Reddit: "Quick fix shipped for [issue]"
4. Do not panic — fast fixes build trust

### npm Publish Fails

1. Check `npm whoami` and `npm ping`
2. Check https://status.npmjs.org
3. Retry in 15 minutes
4. If persistent: publish from a different network or use `npm publish --registry https://registry.npmjs.org`

### HN Post Gets No Traction

1. Do not repost — HN penalizes reposts
2. Focus energy on Reddit and Twitter instead
3. Try again in 2-3 weeks with a different angle (e.g., technical deep-dive instead of launch announcement)

### Negative Feedback

1. Thank the commenter for the feedback
2. If valid: "Great point, opening an issue for this"
3. If misunderstanding: clarify politely with specifics
4. Never argue or get defensive
