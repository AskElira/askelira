// lib/tools/url-fetcher.ts
// Fetches a URL and returns clean readable text, capped at ~3000 tokens (~12000 chars)

import { convert } from "html-to-text";

const MAX_CHARS = 12_000;

// [BUG-5-03] SSRF protection: block requests to internal/private network addresses.
// Without this, an attacker can use Alba's research flow to fetch cloud metadata
// (e.g., http://169.254.169.254/latest/meta-data/) or internal services.
const BLOCKED_HOSTS = [
  'localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]',
  'metadata.google.internal', '169.254.169.254',
  'metadata.google.com',
];

const PRIVATE_IP_PATTERNS = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,       // 10.x.x.x
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16-31.x.x
  /^192\.168\.\d{1,3}\.\d{1,3}$/,           // 192.168.x.x
  /^169\.254\.\d{1,3}\.\d{1,3}$/,           // link-local
  /^fc[0-9a-f]{2}:/i,                        // IPv6 unique local
  /^fe80:/i,                                  // IPv6 link-local
];

function isBlockedUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const hostname = parsed.hostname.toLowerCase();

    // Block known internal hostnames
    if (BLOCKED_HOSTS.includes(hostname)) return true;

    // Block private IP ranges
    if (PRIVATE_IP_PATTERNS.some(p => p.test(hostname))) return true;

    // Block non-HTTP(S) schemes (file://, ftp://, etc.)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;

    return false;
  } catch {
    return true; // Invalid URL = blocked
  }
}

export async function fetchUrl(url: string): Promise<string> {
  // [BUG-5-03] Validate URL before fetching
  if (isBlockedUrl(url)) {
    throw new Error(`fetchUrl blocked: URL targets a restricted address: ${url}`);
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AlbaResearchBot/1.0)",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`fetchUrl error: ${res.status} for ${url}`);

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const text = await res.text();
    return text.slice(0, MAX_CHARS);
  }

  const html = await res.text();
  const text = convert(html, {
    wordwrap: false,
    selectors: [
      { selector: "script", format: "skip" },
      { selector: "style", format: "skip" },
      { selector: "nav", format: "skip" },
      { selector: "footer", format: "skip" },
      { selector: "a", options: { ignoreHref: true } },
    ],
  });

  return text.slice(0, MAX_CHARS);
}
