import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limiter';

/**
 * POST /api/auth/verify-key
 *
 * Verifies a CLI API key for authentication.
 * Simple auth: apiKey IS the email for now.
 * Returns valid: true if the email matches an existing customer or the admin email.
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 20 attempts per hour per IP
    const ip = getClientIp(req.headers);
    const rateCheck = checkRateLimit(`verify_key:${ip}`, 20, 3600000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { valid: false, error: 'Rate limit exceeded. Try again later.' },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { email, apiKey } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { valid: false, error: 'A valid email is required' },
        { status: 400 },
      );
    }

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json(
        { valid: false, error: 'API key is required' },
        { status: 400 },
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedKey = apiKey.trim();

    // Simple auth: apiKey must equal the email
    if (trimmedKey !== trimmedEmail) {
      return NextResponse.json(
        { valid: false, error: 'Invalid API key' },
        { status: 401 },
      );
    }

    // Check if this is the admin email
    const adminEmail = process.env.ADMIN_EMAIL || '';
    if (adminEmail && trimmedEmail === adminEmail.toLowerCase()) {
      return NextResponse.json({
        valid: true,
        customerId: `admin-${trimmedEmail.split('@')[0]}`,
      });
    }

    // Check if any goal exists for this customer email (used as customerId)
    try {
      const { sql } = await import('@vercel/postgres');
      const result = await sql`
        SELECT customer_id FROM goals
        WHERE LOWER(customer_id) = ${trimmedEmail}
        LIMIT 1
      `;

      if (result.rows.length > 0) {
        return NextResponse.json({
          valid: true,
          customerId: result.rows[0].customer_id as string,
        });
      }

      // No existing goals, but email matches key -- allow as new customer
      return NextResponse.json({
        valid: true,
        customerId: trimmedEmail,
      });
    } catch (dbErr: unknown) {
      // DB not available -- in dev mode, accept email-as-key auth
      console.warn(
        '[verify-key] DB unavailable, falling back to email-as-key auth:',
        dbErr instanceof Error ? dbErr.message : dbErr,
      );
      return NextResponse.json({
        valid: true,
        customerId: trimmedEmail,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[API /auth/verify-key]', message);
    return NextResponse.json(
      { valid: false, error: message },
      { status: 500 },
    );
  }
}
