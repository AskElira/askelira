"use strict";
/**
 * OpenClaw Package Verifier
 * Uses Claude to verify 3rd party packages are safe before installation
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPackage = verifyPackage;
exports.verifyPackages = verifyPackages;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const web_search_1 = require("./web-search");
const OPENCLAW_SYSTEM_PROMPT = `You are OpenClaw, the security verification agent for AskElira.

Your role: Verify if 3rd party packages are safe to install.

CRITICAL RULES:
1. Check if package is legitimate (not typosquatting)
2. Check for known vulnerabilities
3. Check package popularity and maintenance status
4. Flag packages with suspicious behavior
5. Recommend alternatives if package is risky

Output valid JSON matching this schema:
{
  "packageName": "package-name",
  "safe": true,
  "safetyScore": 85,
  "risks": ["risk 1", "risk 2"],
  "alternatives": ["alternative 1"],
  "recommendation": "safe|caution|reject",
  "reasoning": "Brief explanation of safety assessment",
  "whatItDoes": "What this package does and why it's needed"
}

Recommendations:
- "safe" = Install without concerns (score 80-100)
- "caution" = Install but warn user (score 50-79)
- "reject" = Do NOT install, too risky (score 0-49)`;
async function verifyPackage(packageName, purpose, apiKey) {
    const anthropic = new sdk_1.default({ apiKey });
    // Get real-time package info from web search
    console.log(`[OpenClaw] Fetching real-time data for ${packageName}...`);
    const webInfo = await (0, web_search_1.searchPackageInfo)(packageName);
    let additionalContext = '';
    if (Object.keys(webInfo).length > 0) {
        additionalContext = `\n\nREAL-TIME WEB DATA (March 2026):
${webInfo.npmWeeklyDownloads ? `- Downloads: ${webInfo.npmWeeklyDownloads}` : ''}
${webInfo.githubStars ? `- GitHub Stars: ${webInfo.githubStars}` : ''}
${webInfo.lastUpdated ? `- Last Updated: ${webInfo.lastUpdated}` : ''}
${webInfo.knownVulnerabilities && webInfo.knownVulnerabilities.length > 0 ? `- Known Vulnerabilities: ${webInfo.knownVulnerabilities.join(', ')}` : '- No recent vulnerabilities found'}

Use this real-time data to make an accurate assessment.`;
    }
    else {
        additionalContext = '\n\n[Note: Web search unavailable - using Claude knowledge only. Recommend lower confidence score.]';
    }
    const prompt = `Verify this package for safety:

Package: ${packageName}
Purpose: ${purpose}${additionalContext}

Check:
1. Is this a legitimate package on npm/PyPI?
2. Any known vulnerabilities (check CVE databases)?
3. Is it well-maintained and popular?
4. Any suspicious behavior or red flags?
5. Are there safer alternatives?

Return ONLY valid JSON with your assessment.`;
    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 2048,
            system: OPENCLAW_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in OpenClaw response');
        }
        const result = JSON.parse(jsonMatch[0]);
        result.version = result.version || 'latest';
        return result;
    }
    catch (error) {
        console.error('[OpenClaw] Verification failed:', error);
        // Default to cautious response on error
        return {
            packageName,
            safe: false,
            safetyScore: 0,
            risks: ['Failed to verify - assume unsafe'],
            alternatives: [],
            recommendation: 'reject',
            reasoning: 'Could not verify package safety',
            whatItDoes: purpose,
        };
    }
}
async function verifyPackages(packages, apiKey) {
    console.log(`\n[OpenClaw] Verifying ${packages.length} package(s) for safety...`);
    const verifications = [];
    for (const pkg of packages) {
        console.log(`[OpenClaw] Checking ${pkg.name}...`);
        const result = await verifyPackage(pkg.name, pkg.purpose, apiKey);
        verifications.push(result);
    }
    const allSafe = verifications.every(v => v.recommendation === 'safe');
    const rejectedCount = verifications.filter(v => v.recommendation === 'reject').length;
    const cautionCount = verifications.filter(v => v.recommendation === 'caution').length;
    const safeCount = verifications.filter(v => v.recommendation === 'safe').length;
    let summary = '';
    if (allSafe) {
        summary = `All ${packages.length} packages verified as safe.`;
    }
    else {
        summary = `Safety check: ${safeCount} safe, ${cautionCount} caution, ${rejectedCount} rejected.`;
    }
    return {
        allSafe,
        packages: verifications,
        summary,
    };
}
//# sourceMappingURL=openclaw-package-verifier.js.map