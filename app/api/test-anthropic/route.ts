import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: 'ANTHROPIC_API_KEY not set',
    });
  }

  // Test API call
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json();

    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      response: data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
