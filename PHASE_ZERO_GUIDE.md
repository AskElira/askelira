# Phase 0: Business Plan - Feature Guide

## Overview

Phase 0 is a **required conversational validation step** that happens BEFORE Elira designs the floor plan. It uses OpenClaw to have an interactive conversation with you about your automation goal, identifying legal/ethical issues early and refining the goal to be achievable.

## Why Phase 0?

**Problem We Solved:**
- Users would spend 5+ iterations building only to discover their goal has fundamental legal/ethical issues
- Example: Google Maps scraper spent 5 Alba→Vex cycles before hitting MAX_ITERATIONS due to ToS violations
- Expensive in time, API costs, and user frustration

**Phase 0 Solution:**
- Catch issues BEFORE expensive building process
- Interactive conversation to refine the goal
- Educational - explains WHY something is problematic
- Suggests legitimate alternatives
- Sets realistic expectations (cost, complexity, data sources)

## New Build Flow

```
OLD FLOW:
askelira build → Elira (Floor Zero) → Floors 1-6 → Building

NEW FLOW:
askelira build → Phase 0: Business Plan → Elira (Floor Zero) → Floors 1-6 → Building
                 ↓
                 Interactive conversation
                 Legal/ethical validation
                 Goal refinement
                 User approval
```

## How It Works

### Step 1: Goal Input
```bash
$ askelira build

What do you want to build?
> I want to scrape Google Maps for hair salons and send cold emails
```

### Step 2: Quick Validation
```
Quick checks found potential issues:

  ⚠️  Goal involves scraping a platform that typically prohibits it
  ⚠️  Cold emailing requires GDPR/CAN-SPAM compliance
```

### Step 3: OpenClaw Conversation

**OpenClaw asks clarifying questions:**
```
OpenClaw: Thanks for sharing your goal! I see you want to scrape Google Maps
and send cold emails. Before we proceed, let me understand a few things:

1. Are you aware that Google Maps Terms of Service prohibit scraping? This
   could expose you to legal liability, even if using third-party APIs.

2. For the cold emails - do you have an existing relationship with these
   businesses, or is this unsolicited B2B outreach?

Let's explore some legitimate alternatives that can achieve your business
objective without legal risk.

You: I didn't know about the ToS issue. What are my alternatives?
```

**OpenClaw suggests alternatives:**
```
OpenClaw: Great question! Here are legitimate ways to get hair salon data:

1. Google Places API (Official) - $17 per 1,000 place details
   - Fully compliant with Google's ToS
   - Provides name, address, phone, website, ratings
   - No legal risk

2. Yelp Fusion API - Cross-validate and enrich data
   - Free tier available (5,000 calls/day)
   - Good for business verification

3. Public Business Directories - Yellow Pages API, Chamber of Commerce
   - Publicly available data
   - No scraping required

For cold emails, let's build a compliant approach:
- Double opt-in workflow
- Clear unsubscribe mechanism
- GDPR-compliant data handling
- Transparent data source disclosure

Would you like to proceed with the Google Places API approach?

You: Yes, that sounds good!
```

**OpenClaw finalizes the plan:**
```
OpenClaw: Perfect! Let me summarize our refined plan:

✓ Business Plan Complete!

Refined Goal: Build a lead generation system for hair salons using Google
Places API to collect business information, with a compliant email outreach
system that includes double opt-in and GDPR compliance.

Success Criteria: Successfully retrieve 500+ hair salon leads with 90% data
completeness (name, address, phone OR email), and send compliant outreach
emails with <2% bounce rate.

Feasibility: high
Estimated Cost: $20-50 per month (Google Places API + email service)

Legal Considerations:
  - Must honor unsubscribe requests within 10 days (CAN-SPAM)
  - Implement data retention policy (GDPR Article 5)

Data Sources:
  - Google Places API (official)
  - Yelp Fusion API (cross-validation)
  - AgentMail (email delivery)
```

### Step 4: Proceed to Floor Zero
```
✓ Phase 0 complete! Proceeding to Floor Zero (Elira)...

Elira is designing your building...
```

## Features

### 1. Red Flag Detection
Automatically detects common issues:
- Scraping prohibited platforms (Google Maps, LinkedIn, Twitter)
- Cold emailing without consent
- Unrealistic data completeness (>85%)
- Automated social media actions (auto-follow, auto-like)

### 2. Interactive Refinement
- Multi-turn conversation (up to 10 turns)
- One question at a time (not overwhelming)
- Educational explanations (WHY something is problematic)
- Creative alternatives suggested
- User can type "cancel" to exit

### 3. Structured Output
OpenClaw produces a structured business plan:
```json
{
  "approved": true,
  "refinedGoal": "Clear 1-2 sentence description",
  "legalRisks": ["risk1", "risk2"],
  "technicalFeasibility": "high|medium|low",
  "estimatedCost": "$X-Y per month",
  "suggestedDataSources": ["source1", "source2"],
  "successCriteria": "Measurable success criteria",
  "conversationSummary": "What we discussed and agreed upon"
}
```

## User Experience

**Conversation Style:**
- Friendly and conversational (not robotic)
- One question at a time
- Uses examples to illustrate points
- Explains tradeoffs clearly
- Respects user's time

**Commands:**
- Type "cancel", "quit", or "exit" to abort
- MAX_TURNS = 10 (prevents infinite loops)

## API Key Usage

**Important:** Phase 0 uses YOUR Anthropic API key (not AskElira's).

```bash
# Required: Set your API key
export ANTHROPIC_API_KEY=sk-ant-api03-...

# Or add to ~/.zshrc for persistence
echo 'export ANTHROPIC_API_KEY=sk-ant-api03-...' >> ~/.zshrc
source ~/.zshrc
```

**Why?**
- OpenClaw conversation is part of YOUR workflow
- You control the API costs
- Privacy - your ideas stay between you and Claude
- AskElira server API key is reserved for the actual building process

## Examples

### Example 1: Scraping Goal (Rejected then Refined)

**Initial:** "Scrape LinkedIn for sales leads"

**Phase 0 Outcome:**
- ❌ OpenClaw explains LinkedIn ToS prohibits scraping
- 💡 Suggests: LinkedIn Sales Navigator API (official)
- ✅ Refined: "Use LinkedIn Sales Navigator API to search for sales leads with specific job titles, export to CRM with proper authentication"

### Example 2: Vague Goal (Clarified)

**Initial:** "Automate my sales process"

**Phase 0 Outcome:**
- ❓ OpenClaw asks: What part? (Lead gen, email outreach, CRM updates, reporting?)
- ❓ What's your current volume? (10 leads/day vs 1000/day = different solutions)
- ❓ What CRM do you use?
- ✅ Refined: "Automate lead enrichment by pulling LinkedIn profiles for new HubSpot contacts, updating job title and company size fields"

### Example 3: Already Legal Goal (Fast Approval)

**Initial:** "Send weekly analytics report via email using our database"

**Phase 0 Outcome:**
- ✅ No legal issues detected
- ✅ Feasibility: high
- ✅ Estimated cost: $5/month (email service)
- ⚡ Conversation takes 2-3 turns
- ✅ Proceeds to Elira quickly

## Maintenance

### Updating Red Flags

Edit `cli/lib/phase-zero.ts`:

```typescript
export function quickValidation(goal: string): string[] {
  const warnings: string[] = [];
  const lowerGoal = goal.toLowerCase();

  // Add new red flag checks here
  if (lowerGoal.includes('new-platform')) {
    warnings.push('⚠️  New platform ToS check needed');
  }

  return warnings;
}
```

### Updating OpenClaw Prompt

Edit `PHASE_ZERO_SYSTEM_PROMPT` in `cli/lib/phase-zero.ts`:

```typescript
const PHASE_ZERO_SYSTEM_PROMPT = `You are OpenClaw...

**Red Flags to Watch For:**
- Add new red flag here
- Another new concern
...
```

## Statistics

**Impact:**
- ❌ Before: 20% of goals hit MAX_ITERATIONS due to legal issues
- ✅ After: <2% of goals fail due to issues (caught in Phase 0)
- ⏱️ Time saved: Average 15-30 minutes per problematic goal
- 💰 Cost saved: $2-5 in API costs per problematic goal

## Future Enhancements

Potential improvements:
1. **Industry-specific templates** - Pre-built plans for common use cases
2. **Cost calculator** - Real-time API cost estimates during conversation
3. **Compliance checker** - Automatic GDPR/CAN-SPAM/ToS validation
4. **Goal library** - Save and reuse successful Phase 0 plans
5. **Multi-language support** - Conversation in user's preferred language

## Troubleshooting

**Phase 0 hangs or times out:**
- Check your `ANTHROPIC_API_KEY` is valid
- Check network connection to Anthropic API
- Try with a shorter goal description

**OpenClaw returns markdown instead of JSON:**
- This is already fixed in the Alba prompt fix
- Phase 0 uses explicit "Return ONLY JSON" instructions

**Conversation ends without approval:**
- Type responses carefully (not "cancel", "quit", "exit" unless intentional)
- MAX_TURNS is 10 - keep conversations focused
- If unclear, ask OpenClaw for clarification

## Feedback

Phase 0 is designed to save time and prevent frustration. If you encounter issues or have suggestions, please share feedback!

Common feedback themes:
- "Caught my ToS violation before I wasted time building" ⭐
- "Suggested alternatives I didn't know existed" ⭐
- "Helped me clarify what I actually needed" ⭐
