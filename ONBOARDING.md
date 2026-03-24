# 🚀 AskElira Onboarding Guide

**Get started with AskElira in 5 minutes** — from zero to your first automation!

---

## Quick Start

Run the interactive onboarding wizard:

```bash
askelira onboarding
```

This will guide you through:
1. **LLM Provider Setup** - Choose and configure Claude, OpenAI, or Ollama
2. **Web Search Setup** - Enable Brave Search API for smarter agents
3. **First Automation** - Build and execute your first automation
4. **Monitoring** - Learn how to track build progress
5. **Execution** - Run your automation with OpenClaw security

---

## What Gets Configured

### 1. LLM Provider (Required)

AskElira supports multiple LLM providers:

#### **Claude (Anthropic)** - Recommended
- **Best for**: Complex automations, production use
- **Get API key**: https://console.anthropic.com/
- **Models**:
  - `claude-sonnet-4-5-20250929` (default, best balance)
  - `claude-opus-4-5` (most capable)
  - `claude-haiku-4-5-20251001` (fastest, cheapest)
- **Pricing**: $3/M input tokens, $15/M output tokens

#### **OpenAI**
- **Best for**: Fast prototyping, familiar API
- **Get API key**: https://platform.openai.com/api-keys
- **Models**:
  - `gpt-4o` (default, fast and capable)
  - `gpt-4-turbo` (very capable)
  - `gpt-3.5-turbo` (fast, cheap)
- **Pricing**: $2.50/M input tokens, $10/M output tokens

#### **Ollama** - Local, Free
- **Best for**: Privacy, no API costs, experimentation
- **Setup**: Install from https://ollama.ai/
- **Models**:
  - `llama3` (default, good balance)
  - `llama3:70b` (more capable, slower)
  - `mistral`, `mixtral`, `codellama`
- **Pricing**: Free! Runs on your machine

### 2. Brave Search API (Optional but Recommended)

**Why enable web search?**

Without web search, agents are "offline and blind":
- ❌ Can't verify package safety in real-time
- ❌ Might recommend deprecated APIs
- ❌ Can't check for recent CVEs
- ❌ Limited to training data (cutoff: January 2025)

With web search enabled:
- ✅ Real-time package verification (downloads, stars, vulnerabilities)
- ✅ Detects deprecated services before you build
- ✅ Finds latest documentation and best practices
- ✅ More accurate OpenClaw security scores

**Setup:**
1. Visit: https://brave.com/search/api/
2. Sign up (free tier: 2,000 queries/month)
3. Copy your API key
4. Enter during onboarding

**Cost**: ~$0.005 per build (half a cent!)

---

## Configuration Storage

Onboarding saves your settings to:

```
~/.askelira/config.json
```

Example config:
```json
{
  "llm": {
    "provider": "anthropic",
    "apiKey": "sk-ant-...",
    "model": "claude-sonnet-4-5-20250929"
  },
  "braveSearchApiKey": "BSA...",
  "setupDate": "2026-03-21T..."
}
```

**Security note**: Keep this file private! It contains API keys.

You can also use environment variables instead:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
export BRAVE_SEARCH_API_KEY=BSA...
```

---

## Onboarding Flow

### Step 0: Setup LLM Provider

1. **Choose provider**: Claude, OpenAI, or Ollama
2. **Enter API key** (or configure Ollama endpoint)
3. **Select model** (or use recommended default)
4. **Test connection** ✓

### Step 1: Setup Web Search

1. **Choose to enable** (recommended)
2. **Get Brave Search API key** (optional)
3. **Test search** ✓

### Step 2: What is AskElira?

Learn about the multi-agent system:
- 🔍 **Alba** - Research agent
- 👨‍💻 **David** - Code builder
- ✅ **Vex** - Quality gates
- 🏗️ **Elira** - Architect
- 👀 **Steven** - Monitoring
- 🔒 **OpenClaw** - Security verification

### Step 3: Build First Automation

Choose from tutorial automations:
- 📧 Email reminder (SendGrid)
- 💰 Bitcoin price logger (CoinGecko API)
- 🐙 GitHub trending scraper
- ✏️ Custom automation

The onboarding will:
1. Start the build process
2. Show you the Goal ID
3. Explain how to monitor progress

### Step 4: Monitor the Build

Learn how to use:
- `askelira status` - See all builds
- `askelira watch <goalId>` - Live dashboard
- `askelira logs <goalId>` - Agent activity
- `askelira floors <goalId>` - Floor breakdown

### Step 5: Execute Automation

Learn about the execution flow:
1. Code extraction from database
2. Dependency detection
3. 🔒 **OpenClaw security verification**
4. User consent for package installation
5. Environment variable setup
6. Code execution

---

## After Onboarding

Once setup is complete, you can:

### Build Real Automations

```bash
askelira build
```

Ideas:
- 📧 "Send daily digest email with top Hacker News posts"
- 💰 "Monitor Bitcoin price and alert if it drops 5%"
- 🐙 "Scrape GitHub trending and post to Slack daily"
- 🔔 "Monitor website uptime and send SMS if down"

### Monitor Builds

```bash
# List all builds
askelira status

# Watch specific build
askelira watch <goalId>

# View agent logs
askelira logs <goalId> --tail

# See floor breakdown
askelira floors <goalId>
```

### Execute Automations

```bash
# Extract and run (with OpenClaw security)
askelira execute <goalId>

# Skip verification (NOT recommended)
askelira execute <goalId> --skip-verify

# Auto-run without prompts (use with caution)
askelira execute <goalId> --autorun
```

---

## Updating Configuration

### Change LLM Provider

Edit `~/.askelira/config.json` or set environment variables:

```bash
# Switch to OpenAI
export OPENAI_API_KEY=sk-...
unset ANTHROPIC_API_KEY

# Switch to Ollama
unset ANTHROPIC_API_KEY
unset OPENAI_API_KEY
export OLLAMA_BASE_URL=http://localhost:11434
```

### Add Web Search Later

```bash
# Get Brave Search API key from: https://brave.com/search/api/
export BRAVE_SEARCH_API_KEY=BSA...
```

Or edit config.json:
```json
{
  "braveSearchApiKey": "BSA..."
}
```

### Re-run Onboarding

```bash
askelira onboarding
```

This will update your existing config with new values.

---

## Troubleshooting

### "API key test failed"

**For Anthropic:**
- Make sure key starts with `sk-ant-`
- Check key is valid at https://console.anthropic.com/
- Verify you have credits/billing enabled

**For OpenAI:**
- Make sure key starts with `sk-`
- Check key is valid at https://platform.openai.com/api-keys
- Verify you have credits/billing enabled

**For Ollama:**
- Make sure Ollama is running: `ollama serve`
- Check endpoint is accessible: `curl http://localhost:11434`
- Pull model first: `ollama pull llama3`

### "Brave Search test failed"

- Verify API key is correct
- Check you haven't exceeded free tier (2,000 queries/month)
- Try again in a few minutes (rate limiting)

### "Command not found: askelira"

```bash
# Re-link global command
npm unlink -g
npm link

# Or run directly with npx
npx tsx cli/bin/askelira.ts onboarding
```

### "Build never completes"

- Check server is running: `askelira status`
- View logs: `askelira logs <goalId> --tail`
- Check agent activity: `askelira floors <goalId>`
- Contact support if stuck for >3 hours

---

## Example: Complete Onboarding Session

```bash
$ askelira onboarding

🚀 Welcome to AskElira Onboarding!

Step 0: Setup LLM Provider

Choose your LLM provider:
❯ Claude (Anthropic) - Recommended
  OpenAI (GPT-4o)
  Ollama (Local, Free)

Enter your Anthropic API key: sk-ant-***
Choose Claude model:
❯ claude-sonnet-4-5-20250929

🔍 Testing API key...
✓ API key is valid!

Step 1: Setup Web Search (Optional)

Enable web search? Yes

Enter your Brave Search API key: BSA***
🔍 Testing Brave Search API...
✓ Brave Search API is working!

✓ Configuration saved!

Step 2: What is AskElira?
[Interactive explanation...]

Step 3: Build Your First Automation

Choose a tutorial automation:
❯ 📧 Email reminder (sends test email with SendGrid)
  💰 Bitcoin price logger
  🐙 GitHub scraper
  ✏️  Custom

Start building? Yes

🚀 Building... (this may take 1-2 hours)
✓ Build started! Goal ID: abc123

[Continue through monitoring and execution steps...]

🎉 Onboarding Complete!
```

---

## Deprecated: `askelira tutorial`

The old `tutorial` command has been renamed to `onboarding`.

```bash
# Old (still works but deprecated)
askelira tutorial

# New (recommended)
askelira onboarding
```

Running `askelira tutorial` will show a deprecation warning and run onboarding.

---

## Next Steps

1. **Read the docs**: https://askelira.com/docs
2. **Join community**: Discord/Slack link
3. **Build something**: `askelira build`
4. **Get help**: `askelira --help`

---

## Support

- **Documentation**: https://askelira.com/docs
- **Issues**: https://github.com/askelira/askelira/issues
- **Email**: support@askelira.com

Happy automating! 🚀
