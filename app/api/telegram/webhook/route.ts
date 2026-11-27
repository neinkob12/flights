import { NextResponse } from "next/server";
import { db, type Watch, T } from "@/lib/db";
import { sendTelegram } from "@/lib/telegram";
import { appUrl, env } from "@/lib/env";
import { money } from "@/lib/format";

type Update = { message?: { chat: { id: number }; text?: string } };

const toUuid = (h: string) => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;

export async function POST(req: Request) {
  if (req.headers.get("x-telegram-bot-api-secret-token") !== env("TELEGRAM_WEBHOOK_SECRET")) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const u = (await req.json()) as Update;
  const msg = u.message;
  if (!msg?.text) return NextResponse.json({ ok: true });
  const chatId = msg.chat.id;
  const [cmd, arg] = msg.text.trim().split(/\s+/, 2);

  try {
    if (cmd === "/start" && arg && /^[0-9a-f]{32}_[0-9a-f]{16}$/.test(arg)) {
      const [hex, tok] = arg.split("_");
      const { data } = await db().from(T.watches).select("*").eq("id", toUuid(hex)).maybeSingle();
      const w = data as Watch | null;
      if (!w || !w.manage_token.startsWith(tok)) {
        await sendTelegram(chatId, "Hmm, that link didn't work. Create a new watch on the website.");
      } else {
        await db().from(T.watches).update({ telegram_chat_id: chatId, active: true }).eq("id", w.id);
        await sendTelegram(chatId,
          `✅ <b>Watching ${w.origin} → ${w.destination}</b>\n` +
          `${w.depart_from} to ${w.depart_to}, target ${money(Number(w.max_price), w.currency)}.\n\n` +
          `I check prices every hour and ping you the moment it hits. /list shows your watches, /stop pauses all.`);
      }
    } else if (cmd === "/list") {
      const { data } = await db().from(T.watches).select("*").eq("telegram_chat_id", chatId).eq("active", true);
      const ws = (data ?? []) as Watch[];
      await sendTelegram(chatId, ws.length
        ? ws.map((w) => `• <b>${w.origin} → ${w.destination}</b> under ${money(Number(w.max_price), w.currency)}` +
            (w.last_price ? ` (now ${money(Number(w.last_price), w.currency)})` : "") +
            ` · <a href="${appUrl()}/w/${w.id}?t=${w.manage_token}">manage</a>`).join("\n")
        : "No active watches. Make one at " + appUrl());
    } else if (cmd === "/stop") {
      await db().from(T.watches).update({ active: false }).eq("telegram_chat_id", chatId);
      await sendTelegram(chatId, "⏸ All your watches are paused. Resume any of them from its manage link.");
    } else {
      await sendTelegram(chatId, `👋 I'm Fare Sniper. Set a route and a max price at ${appUrl()} and tap "Connect Telegram".`);
    }
  } catch (e) {
    console.error("telegram webhook", e);
  }
  return NextResponse.json({ ok: true });
}
