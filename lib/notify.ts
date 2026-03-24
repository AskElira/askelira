/**
 * Telegram Notification Module
 *
 * Sends notifications to a Telegram chat via the Bot API.
 * Graceful no-op if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set.
 */

const TELEGRAM_API = 'https://api.telegram.org';

// [AUTO-ADDED] BUG-1-02: 10-second timeout prevents hung Telegram fetches
// from blocking the heartbeat cycle or building loop.
const NOTIFY_TIMEOUT_MS = 10_000;

/**
 * Send a notification message to the configured Telegram chat.
 * Returns silently if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.
 * Never throws — all errors are caught and logged.
 */
export async function notify(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  try {
    const url = `${TELEGRAM_API}/bot${token}/sendMessage`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NOTIFY_TIMEOUT_MS);

    try {
      // Try Markdown first, fall back to plain text on parse error
      let res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        if (body.includes("can't parse entities")) {
          // Retry without parse_mode (reuse same controller/timeout)
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              disable_web_page_preview: true,
            }),
            signal: controller.signal,
          });
          if (!res.ok) {
            const body2 = await res.text().catch(() => '');
            console.error(`[Notify] Telegram API error (${res.status}): ${body2.slice(0, 200)}`);
          }
        } else {
          console.error(`[Notify] Telegram API error (${res.status}): ${body.slice(0, 200)}`);
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    // [AUTO-ADDED] BUG-1-02: Log AbortError distinctly so we know it was a timeout
    if (err instanceof Error && err.name === 'AbortError') {
      console.error(`[Notify] Telegram request timed out after ${NOTIFY_TIMEOUT_MS}ms`);
    } else {
      console.error('[Notify] Failed to send Telegram message:', err instanceof Error ? err.message : String(err));
    }
  }
}
