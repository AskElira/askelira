# 🤖 Proper Agent Flow - Research Before Building

## The Problem

User said: "Use AgentMail"

**What I did** ❌:
1. Assumed AgentMail exists
2. Built configuration for it
3. No verification
4. No research

**What SHOULD happen** ✅:
1. Brave Search "AgentMail"
2. Verify it's real
3. Check if it's safe
4. Get API docs
5. Build plan
6. OpenClaw verify packages
7. User consent
8. Execute

---

## The Correct Flow

### Phase 0: Research (Alba)

```typescript
// Alba should do this BEFORE recommending anything:

1. Web Search
   query: "AgentMail email API service 2026"
   → Find official website
   → Check if active/deprecated
   → Get pricing info
   
2. Package Search
   query: "agentmail npm package"
   → Verify package exists
   → Check download stats
   → Check maintenance
   
3. Documentation Search
   query: "AgentMail API documentation"
   → Find official docs
   → Check API endpoints
   → Get example code
   
4. Knowledge Report
   - What is AgentMail?
   - Is it legitimate?
   - Current status?
   - How to use it?
   - Alternatives?
```

### Phase 1: Verification (OpenClaw)

```typescript
// OpenClaw should do this BEFORE installation:

1. Real-Time Package Info
   package: "agentmail"
   
   Brave Search:
   - "agentmail npm downloads 2026"
   - "agentmail vulnerabilities CVE"
   - "agentmail github stars maintenance"
   
2. Safety Assessment
   Downloads: ? weekly
   Stars: ?
   Last Updated: ?
   CVEs: ?
   
3. Safety Score
   Score: ?/100
   Recommendation: SAFE/CAUTION/REJECT
   
4. Alternatives
   If REJECT:
   - SendGrid (92/100)
   - Mailgun (88/100)
   - AWS SES (95/100)
```

### Phase 2: Planning (Elira)

```typescript
// Elira creates the build plan:

Based on research:
- AgentMail status: [ACTIVE/DEPRECATED]
- Safety score: [?/100]
- API documented: [YES/NO]

Plan:
Floor 1: Setup AgentMail credentials
Floor 2: Test email send
Floor 3: Error handling
```

### Phase 3: Building (David)

```typescript
// David builds based on verified research:

Dependencies: agentmail (verified safe)
Code:
  import agentmail  // OpenClaw approved
  send_email()      // Using documented API
```

---

## Enable Brave Search

To make this work, agents need Brave Search API:

```bash
# 1. Get API key
open https://brave.com/search/api/

# 2. Add to config
askelira onboarding
# Enter Brave Search API key when prompted

# 3. Test it works
askelira build "Use AgentMail for email"

# Now Alba will:
# → Brave Search "AgentMail"
# → Verify it exists
# → Check safety
# → Build plan
```

---

## The Right Way Forward

### Option 1: Configure Brave Search

```bash
askelira onboarding

Step 2: Setup Web Search
? Enable web search? Yes
Brave Search API key: BSA***

✓ Web search enabled!
  Agents can now research in real-time
```

### Option 2: Manual Research

If you know AgentMail is what you want:

```bash
# Tell me:
1. AgentMail website: https://...
2. AgentMail docs: https://...
3. npm package: agentmail / @agentmail/sdk / etc.

# Then I can verify and build properly
```

---

## Lesson Learned

**I should practice what I preach!**

Built features:
- ✅ Brave Search integration
- ✅ OpenClaw verification
- ✅ Web research capabilities

Should use them:
- ❌ Assumed AgentMail exists
- ❌ Didn't search first
- ❌ Didn't verify safety

**Fix**: Always research → verify → build
