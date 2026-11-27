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
