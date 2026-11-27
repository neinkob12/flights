import { env } from "./env";

export async function sendTelegram(chatId: number | string, html: string, button?: { text: string; url: string }) {
  const res = await fetch(`https://api.telegram.org/bot${env("TELEGRAM_BOT_TOKEN")}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: html,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(button ? { reply_markup: { inline_keyboard: [[button]] } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
}

export const telegramStartLink = (watchId: string, manageToken: string) =>
  `https://t.me/${env("TELEGRAM_BOT_USERNAME")}?start=${watchId.replace(/-/g, "")}_${manageToken.slice(0, 16)}`;

/** Make sure Telegram sends updates to our webhook. Safe to call repeatedly. */
export async function ensureTelegramWebhook(appUrl: string): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN, secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret) return "skipped (no bot token)";
  const want = `${appUrl}/api/telegram/webhook`;
  const info = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`).then((r) => r.json());
  if (info?.result?.url === want) return "ok";
  const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: want, secret_token: secret, allowed_updates: ["message"] }),
  }).then((r) => r.json());
  await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commands: [
      { command: "list", description: "Show my fare watches" },
      { command: "stop", description: "Pause all my watches" },
    ] }),
  });
  return r?.ok ? "registered" : `failed: ${r?.description}`;
}
