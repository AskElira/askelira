/**
 * GET /api/terminal/available
 *
 * Checks if node-pty is available for full terminal support.
 * Returns { available, mode: 'full' | 'readonly' }.
 * Phase 3 (CLI Phase 3).
 */

export async function GET() {
  // node-pty is not available on Vercel serverless functions
  // Terminal requires a dedicated server with native module support
  const isVercel = process.env.VERCEL === '1';
  const available = !isVercel; // Only available in local/dedicated server environments

  return Response.json({
    available,
    mode: available ? 'full' : 'readonly',
    message: available
      ? 'Terminal available with full PTY support'
      : 'Terminal not available on serverless - requires dedicated server for node-pty',
  });
}
