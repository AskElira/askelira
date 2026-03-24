# AskElira 2.1 - OpenClaw Subagent Architecture

## Core Concept

**AskElira agents ARE OpenClaw subagents.**

Instead of maintaining separate agent code, we spawn OpenClaw subagents with specialized prompts.

## Agent Mapping

**OLD (Custom Agents):**
```
src/agents/alba.js (custom code)
src/agents/david.js (custom code)
src/agents/vex.js (custom code)
src/agents/elira.js (custom code)
```

**NEW (OpenClaw Subagents):**
```javascript
// agents/alba-agent.js
export async function runAlba(question) {
  const result = await sessions_spawn({
    runtime: "subagent",
    task: `You are Alba, AskElira's research agent.
    
Research this question using web search and browser automation:
"${question}"

Your job:
1. Search Brave API for top results
2. Visit top 3 URLs (browser control)
3. Extract key information
4. Summarize findings
5. Return structured research

Output JSON:
{
  "summary": "...",
  "sources": [...],
  "deepContent": [...],
  "confidence": 0-100
}`,
    mode: "run",
    thinking: "medium",
    timeoutSeconds: 60
  });
  
  return JSON.parse(result.output);
}
```

## Full Orchestration Flow

```javascript
// lib/openclaw-orchestrator.ts
import { sessions_spawn } from 'openclaw';

export async function runSwarmDebate(question: string) {
  // 1. Alba: Research
  const alba = await sessions_spawn({
    runtime: "subagent",
    task: albaPrompt(question),
    mode: "run"
  });
  
  const research = JSON.parse(alba.output);
  
  // 2. David: 10k Agent Debate
  const david = await sessions_spawn({
    runtime: "subagent",
    task: davidPrompt(question, research),
    model: "opus-4.6", // Heavy thinking
    thinking: "high",
    mode: "run"
  });
  
  const debate = JSON.parse(david.output);
  
  // 3. Vex: Audit
  const vex = await sessions_spawn({
    runtime: "subagent",
    task: vexPrompt(debate),
    mode: "run"
  });
  
  const audit = JSON.parse(vex.output);
  
  // 4. Elira: Synthesize
  const elira = await sessions_spawn({
    runtime: "subagent",
    task: eliraPrompt(research, debate, audit),
    mode: "run"
  });
  
  return JSON.parse(elira.output);
}
```

## Benefits

**1. No Custom Agent Code:**
- Remove src/agents/ entirely
- Pure OpenClaw orchestration
- Agents are just prompts

**2. Full Control:**
- Real-time progress via sessions_list
- Can steer mid-execution via sessions_send
- Session persistence
- Error recovery

**3. Multi-Model:**
- Alba: Sonnet (fast research)
- David: Opus (deep thinking)
- Vex: Sonnet (validation)
- Elira: Sonnet (synthesis)
- Builder: Opus (code gen)

**4. Browser Automation:**
```javascript
// Alba can use OpenClaw's browser control directly!
const research = await browser({
  action: "navigate",
  url: topResult.url,
  snapshot: true
});
```

## Agent Prompts

**Alba (Research Agent):**
```javascript
function albaPrompt(question) {
  return `You are Alba, AskElira's research agent.

Question: "${question}"

Tasks:
1. Search web (Brave API available)
2. Use browser control to visit top 3 results
3. Extract key information from each page
4. Identify:
   - Market demand
   - Technical feasibility
   - Existing solutions
   - Potential challenges

Output JSON:
{
  "summary": "2-3 sentence overview",
  "sources": [
    {
      "title": "...",
      "url": "...",
      "keyPoints": [...]
    }
  ],
  "deepContent": ["...", "...", "..."],
  "marketDemand": "high|medium|low",
  "technicalFeasibility": "easy|medium|hard",
  "confidence": 85
}`;
}
```

**David (Debate Agent):**
```javascript
function davidPrompt(question, research) {
  return `You are David, AskElira's debate orchestrator.

Question: "${question}"

Research Context:
${JSON.stringify(research, null, 2)}

Your Task:
Simulate a 10,000-agent debate on this question.

Debate Structure:
- 5,000 agents argue FOR
- 5,000 agents argue AGAINST
- They debate in rounds, refining arguments
- Consensus emerges from strongest arguments

Output JSON:
{
  "decision": "go|no-go|conditional",
  "confidence": 0-100,
  "argumentsFor": ["...", "...", "..."],
  "argumentsAgainst": ["...", "...", "..."],
  "conditions": ["..."],
  "reasoning": "Why this decision emerged"
}`;
}
```

**Vex (Audit Agent):**
```javascript
function vexPrompt(debate) {
  return `You are Vex, AskElira's quality auditor.

Debate Result:
${JSON.stringify(debate, null, 2)}

Your Task:
Audit this debate for quality and validity.

Check:
- Are arguments substantiated?
- Is the confidence justified?
- Are there logical fallacies?
- Missing considerations?
- Bias in reasoning?

Output JSON:
{
  "valid": true|false,
  "issues": ["...", "..."],
  "suggestions": ["...", "..."],
  "adjustedConfidence": 0-100,
  "auditScore": 0-100
}`;
}
```

**Elira (Synthesis Agent):**
```javascript
function eliraPrompt(research, debate, audit) {
  return `You are Elira, AskElira's synthesis agent.

Research: ${JSON.stringify(research, null, 2)}
Debate: ${JSON.stringify(debate, null, 2)}
Audit: ${JSON.stringify(audit, null, 2)}

Your Task:
Synthesize everything into a final decision + action plan.

Output JSON:
{
  "finalDecision": "go|no-go|conditional",
  "confidence": 0-100,
  "recommendation": "Clear recommendation",
  "actionPlan": [
    "Step 1: ...",
    "Step 2: ..."
  ],
  "risks": ["...", "..."],
  "buildable": true|false,
  "buildPlan": {
    "files": ["...", "..."],
    "dependencies": ["...", "..."],
    "steps": ["...", "..."]
  }
}`;
}
```

## Builder Agent (Code Generation)

```javascript
async function runBuilder(buildPlan) {
  const builder = await sessions_spawn({
    runtime: "subagent",
    task: `You are a code generation agent.

Build Plan:
${JSON.stringify(buildPlan, null, 2)}

Your Task:
Generate complete, working code for this project.

Create all necessary files:
- Main implementation
- Configuration
- Dependencies (package.json/requirements.txt)
- README with setup instructions
- Tests

Output as ZIP-ready file structure.`,
    model: "opus-4.6",
    thinking: "high",
    mode: "run",
    cwd: "./output"
  });
  
  return builder.output;
}
```

## Implementation Steps

1. ✅ Create lib/openclaw-orchestrator.ts
2. ✅ Define agent prompts (agents/prompts/)
3. ✅ Update API routes to use orchestrator
4. ✅ Remove src/agents/ (old code)
5. ✅ Test with real OpenClaw
6. ✅ Deploy

## Migration

**Remove:**
- src/agents/*.js (all custom agents)
- src/automation/claude-code-runner.js
- Puppeteer dependency (use OpenClaw browser)

**Keep:**
- UI components
- API routes (update internals)
- Database schema
- Next.js structure

**Add:**
- lib/openclaw-orchestrator.ts
- agents/prompts/*.js
- OpenClaw as peerDependency

## The Magic

**Instead of maintaining agent code, we maintain prompts.**

Agents are just specialized instructions to OpenClaw subagents.

**THIS is the future of AI orchestration.**
