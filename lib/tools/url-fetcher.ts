// lib/tools/url-fetcher.ts
// Fetches a URL and returns clean readable text, capped at ~3000 tokens (~12000 chars)

import { convert } from "html-to-text";

const MAX_CHARS = 12_000;

export async function fetchUrl(url: string): Promise<string> {
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
