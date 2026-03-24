# AskElira Workspace Guide

## The 3-File System

AskElira reads 3 files from ~/askelira/ to understand your context:

### SOUL.md — Who your AI is
Defines personality, communication style, and core values.
Edit this to make the AI match your preferences.

### AGENTS.md — What it's working on
Contains the current task and accumulates results over time.
The AI reads this before every run and writes results here after.

### TOOLS.md — What it can use
Lists API keys, available tools, and capabilities.
Keep API keys here (this file stays local, never committed).

## Workflow

1. Edit AGENTS.md: write your goal under "## Current Task"
2. Run: askelira web (or askelira run "your question")
3. Watch Alba → David → Vex → Elira work through it
4. Results appear in AGENTS.md under "## Recent Results"
5. Iterate: update the task, run again

## Tips

- Be specific in your task description
- David simulates 10,000 agents debating — more context = better debate
- Vex catches logical errors and bias in David's debate
- Elira produces an actionable plan, not just a yes/no
