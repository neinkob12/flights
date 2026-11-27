import { NextResponse } from "next/server";
import { runCheck } from "@/lib/check";
import { ensureTelegramWebhook } from "@/lib/telegram";
import { appUrl, env } from "@/lib/env";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${env("CRON_SECRET")}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const telegram = await ensureTelegramWebhook(appUrl()).catch((e) => `error: ${(e as Error).message}`);
  if (!process.env.TRAVELPAYOUTS_TOKEN) return NextResponse.json({ telegram, prices: "skipped (no TRAVELPAYOUTS_TOKEN)" });
  return NextResponse.json({ telegram, ...(await runCheck()) });
}
