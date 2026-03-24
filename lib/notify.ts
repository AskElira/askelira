/**
 * Telegram Notification Module
 *
 * Sends notifications to a Telegram chat via the Bot API.
 * Graceful no-op if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set.
 */

const TELEGRAM_API = 'https://api.telegram.org';

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
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      if (body.includes("can't parse entities")) {
        // Retry without parse_mode
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            disable_web_page_preview: true,
          }),
        });
        if (!res.ok) {
          const body2 = await res.text().catch(() => '');
          console.error(`[Notify] Telegram API error (${res.status}): ${body2.slice(0, 200)}`);
        }
      } else {
        console.error(`[Notify] Telegram API error (${res.status}): ${body.slice(0, 200)}`);
      }
    }
  } catch (err) {
    console.error('[Notify] Failed to send Telegram message:', err instanceof Error ? err.message : String(err));
  }
}
