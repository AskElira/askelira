// lib/tools/tool-definitions.ts
// Claude tool definitions for Alba's real web access

export const albaTools = [
  {
    name: "brave_search",
    description: "Search the web using Brave Search. Use this to find current libraries, packages, documentation, and real URLs before making any claim.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query. Be specific. Include year (e.g. '2026') for recency.",
        },
        count: {
          type: "number",
          description: "Number of results to return (1-10, default 5)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "fetch_url",
    description: "Fetch and read the text content of a URL. Use this to verify information from search results before citing them.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The full URL to fetch (must start with https://)",
        },
      },
      required: ["url"],
    },
  },
] as const;
