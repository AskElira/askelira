import { NextResponse } from 'next/server';

export async function GET() {
  // Try V2 first, then original
  const apiKey = process.env.ANTHROPIC_API_KEY_V2 || process.env.ANTHROPIC_API_KEY || '';
  
  let messagesTest = 'ERROR';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }]
      })
    });
    const body = await r.text();
    messagesTest = `${r.status}: ${body.substring(0, 200)}`;
  } catch(e: any) {
    messagesTest = `NETWORK ERROR: ${e.message}`;
  }
  
  return NextResponse.json({
    messagesTest,
    keyV2Length: (process.env.ANTHROPIC_API_KEY_V2 || 'MISSING').length,
    keyV1Length: (process.env.ANTHROPIC_API_KEY || 'MISSING').length,
    activeKeyLen: apiKey.length,
  });
}
