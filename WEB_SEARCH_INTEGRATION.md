# 🌐 Web Search Integration for AskElira

**Problem:** AskElira agents are offline and blind to real-world changes.

**Solution:** Integrate Brave Search API (or Perplexity) for real-time context.

---

## 🔴 **Before (Offline & Blind)**

### **Alba (Research)**
- ❌ Uses training data (cutoff: January 2025)
- ❌ Can't verify if APIs are deprecated
- ❌ Can't find latest library versions
- ❌ Might recommend outdated approaches

### **OpenClaw (Security)**
- ❌ No real-time download stats
- ❌ No recent CVE lookups
- ❌ No GitHub activity checks
- ❌ Might approve abandoned/vulnerable packages

### **Phase 0 (Validation)**
- ❌ Can't check if services still exist
- ❌ Can't verify ToS changes
- ❌ Can't validate API availability

---

## ✅ **After (Real-Time Aware)**

### **Alba (Research)**
- ✅ Searches for current API documentation
- ✅ Finds latest library versions
- ✅ Checks for deprecation notices
- ✅ Discovers recent tutorials and best practices

### **OpenClaw (Security)**
- ✅ Real-time npm/PyPI download stats
- ✅ Recent CVE vulnerability checks
- ✅ GitHub stars and maintenance status
- ✅ Accurate safety scores (0-100)

### **Phase 0 (Validation)**
- ✅ Verifies services are still active
- ✅ Checks for API shutdowns
- ✅ Finds alternative solutions if deprecated
- ✅ Validates legal/ToS compliance

---

## 🔧 **Setup Instructions**

### **Option 1: Brave Search API (Recommended)**

1. **Get API Key:**
   ```
   https://brave.com/search/api/
   ```
   - Sign up for Brave Search API
   - Free tier: 2,000 queries/month
   - Paid: $5/month for 20K queries

2. **Add to Environment:**
   ```bash
   echo "BRAVE_SEARCH_API_KEY=your_key_here" >> .env
   ```

3. **Restart AskElira:**
   ```bash
   askelira stop
   askelira start
   ```

### **Option 2: Perplexity API (Alternative)**

1. **Get API Key:**
   ```
   https://www.perplexity.ai/settings/api
   ```
   - Sign up for Perplexity API
   - $20 credit to start
   - ~$0.001 per search

2. **Add to Environment:**
   ```bash
   echo "PERPLEXITY_API_KEY=pplx-your_key_here" >> .env
   ```

---

## 📊 **What Gets Searched**

### **Alba Research Queries:**
```
"<package_name> API documentation tutorial 2026"
"<package_name> best practices examples"
"<package_name> vs alternatives comparison"
"<library> latest version compatibility"
```

**Example:**
```
Query: "SendGrid API documentation tutorial 2026"
Results:
  - SendGrid official docs (v3 API)
  - Python SDK examples
  - Rate limits and pricing
  - Known issues (March 2026)
```

### **OpenClaw Verification Queries:**
```
"<package_name> npm downloads statistics 2026"
"<package_name> security vulnerabilities CVE"
"<package_name> github stars maintenance"
```

**Example:**
```
Package: sendgrid

Query 1: "sendgrid npm downloads statistics 2026"
Result: "500K weekly downloads"

Query 2: "sendgrid security vulnerabilities CVE"
Result: "No critical CVEs in v6.5.5"

Query 3: "sendgrid github stars maintenance"
Result: "Last commit: 2 weeks ago, 1.2K stars"

→ OpenClaw Safety Score: 92/100 (SAFE)
```

### **Phase 0 Validation Queries:**
```
"<service_name> deprecated shutdown 2026"
"<api_name> still active available"
"<platform> ToS changes legal issues"
```

**Example:**
```
Query: "Twitter API deprecated shutdown 2026"
Result: "Twitter API v1.1 deprecated, use v2"

→ Elira: "Use Twitter API v2, not v1.1"
```

---

## 🎯 **Real-World Examples**

### **Example 1: Alba Researches Email Automation**

**Without Web Search (Offline):**
```
Alba: "Use SendGrid SDK. Install with: pip install sendgrid"
→ Might be outdated version
→ Might miss deprecation warnings
```

**With Web Search (Online):**
```
Alba searches:
  1. "SendGrid Python SDK 2026 documentation"
  2. "SendGrid alternatives comparison 2026"
  3. "SendGrid API v3 best practices"

Alba: "Use SendGrid SDK v6.5.5 (latest as of March 2026).
       Note: v2 API is deprecated, ensure you use v3.
       Alternative: AWS SES if cost is a concern.
       Install: pip install sendgrid==6.5.5"

→ Accurate, current, with context!
```

---

### **Example 2: OpenClaw Verifies Package**

**Without Web Search (Offline):**
```
OpenClaw: "sendgrid appears legitimate"
→ Safety Score: 75/100 (guessing)
→ Can't verify real downloads
```

**With Web Search (Online):**
```
OpenClaw searches:
  1. "sendgrid npm downloads 2026"
     → "500K weekly downloads"

  2. "sendgrid vulnerabilities CVE 2026"
     → "No critical vulnerabilities"

  3. "sendgrid github maintenance"
     → "Last commit: 2 weeks ago"

OpenClaw: "sendgrid is SAFE"
→ Safety Score: 92/100 (verified)
→ Data: 500K weekly downloads, no CVEs, actively maintained
```

---

### **Example 3: Phase 0 Catches Deprecated Service**

**Without Web Search (Offline):**
```
User: "Build automation with Parse.com"
Elira: "Sounds good! Here's the plan..."
→ Builds automation for shutdown service
→ FAILS when user tries to use it
```

**With Web Search (Online):**
```
User: "Build automation with Parse.com"

Elira searches:
  "Parse.com deprecated shutdown 2026"
  → "Parse.com shut down in 2017"

Elira: "❌ Parse.com was discontinued in 2017.
        ✅ Alternatives: Firebase, AWS Amplify, Supabase

        Would you like to use Firebase instead?"

→ Saves hours of wasted work!
```

---

## 📈 **Cost Analysis**

### **Brave Search API**
- **Free Tier:** 2,000 queries/month
- **Paid:** $5/month for 20K queries

**Estimated Usage:**
- Phase 0: 1-2 queries per build
- Alba: 3-5 queries per floor
- OpenClaw: 3 queries per package
- **Total per build:** ~10-20 queries
- **Cost:** **~$0.005 per build** (half a cent!)

### **Perplexity API**
- **Pricing:** ~$0.001 per search
- **Estimated Usage:** 10-20 queries per build
- **Cost:** **~$0.01-0.02 per build** (1-2 cents!)

**Worth it?** Absolutely! 🎯
- Prevents building on deprecated APIs
- Ensures accurate package verification
- Saves hours of debugging outdated code

---

## 🔍 **How It Works**

### **1. OpenClaw Package Verification**

```typescript
// Before calling Claude, search the web
const webInfo = await searchPackageInfo('sendgrid');

// Results:
{
  npmWeeklyDownloads: "500K weekly downloads",
  githubStars: "1,200 stars",
  lastUpdated: "February 2026",
  knownVulnerabilities: []
}

// Pass to Claude with real data
const prompt = `
Verify package: sendgrid

REAL-TIME WEB DATA (March 2026):
- Downloads: 500K weekly downloads
- GitHub Stars: 1,200 stars
- Last Updated: February 2026
- No recent vulnerabilities found

Is this package safe?
`;

// Claude uses current data for accurate assessment
→ Safety Score: 92/100 (SAFE)
```

### **2. Alba Research**

```typescript
// Alba searches for current documentation
const docs = await searchAPIDocumentation('SendGrid');

// Results:
[
  {
    title: "SendGrid v3 API Documentation",
    url: "https://sendgrid.com/docs/api-reference/",
    snippet: "Official v3 API docs, updated March 2026"
  },
  {
    title: "SendGrid Python SDK Examples",
    url: "https://github.com/sendgrid/sendgrid-python",
    snippet: "Latest version: 6.5.5, Python 3.8+ required"
  }
]

// Alba recommends current approach
→ "Use SendGrid v3 API with SDK v6.5.5"
```

### **3. Phase 0 Validation**

```typescript
// Check if service is still active
const status = await checkServiceStatus('Parse.com');

// Results:
{
  active: false,
  deprecated: true,
  alternativesFound: ["Firebase", "AWS Amplify"]
}

// Elira rejects and suggests alternatives
→ "Parse.com is deprecated. Use Firebase instead."
```

---

## ✅ **Testing**

### **Test OpenClaw with Web Search:**
```bash
# Set API key
export BRAVE_SEARCH_API_KEY=your_key_here

# Execute automation with dependencies
askelira execute <goalId>

# Watch for:
[OpenClaw] Fetching real-time data for sendgrid...
[OpenClaw] Checking sendgrid...

  ✓ sendgrid
     Safety Score: 92/100
     Downloads: 500K weekly  ← Real-time data!
     No recent CVEs  ← Verified!
```

### **Test Without Web Search:**
```bash
# Unset API key
unset BRAVE_SEARCH_API_KEY

# Execute automation
askelira execute <goalId>

# Watch for:
[WebSearch] No search API configured - agents running offline
[OpenClaw] Checking sendgrid...

  ✓ sendgrid
     Safety Score: 75/100  ← Lower (no verification)
     [Note: Web search unavailable]
```

---

## 🎯 **Next Steps**

1. **Get API Key:**
   - Brave Search: https://brave.com/search/api/ (recommended)
   - Perplexity: https://www.perplexity.ai/settings/api

2. **Add to .env:**
   ```bash
   echo "BRAVE_SEARCH_API_KEY=your_key_here" >> .env
   ```

3. **Test:**
   ```bash
   askelira execute <goalId>
   ```

4. **Watch for real-time data in output!**

---

## 📋 **Summary**

### **Before (Offline):**
- ❌ Outdated recommendations
- ❌ Can't verify package safety
- ❌ Might build on deprecated APIs
- ❌ Blind to real-world changes

### **After (Online):**
- ✅ Current, accurate recommendations
- ✅ Real-time package verification
- ✅ Catches deprecated services early
- ✅ Aware of latest best practices

**Cost:** ~$0.005-0.02 per build (half a cent to 2 cents!)

**Value:** Priceless - saves hours of debugging! 🚀

---

## 🔒 **Security Note**

Web search makes OpenClaw **MORE secure**, not less:
- Real-time CVE checking
- Actual download stats (not guesses)
- Recent vulnerability reports
- Active maintenance verification

**Recommendation:** ALWAYS enable web search for production use!
