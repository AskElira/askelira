import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: 'ANTHROPIC_API_KEY not set',
      envKeys: Object.keys(process.env).filter(k => k.includes('ANTHROPIC'))
    });
  }

  // Test API call
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say test' }],
      }),
    });

    const data = await res.json();

    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      apiKeyPrefix: apiKey.substring(0, 15),
      response: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
