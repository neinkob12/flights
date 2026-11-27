import { NextResponse } from "next/server";
import { db, type Watch } from "@/lib/db";
import { parseWatch } from "@/lib/validate";
import { cheapestFare } from "@/lib/prices";
import { telegramStartLink } from "@/lib/telegram";
import { sendEmail, emailEnabled } from "@/lib/email";
import { appUrl } from "@/lib/env";
import { money } from "@/lib/format";

const MAX_PER_EMAIL = 5;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = parseWatch(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;

  if (input.email) {
    const { count } = await db().from("watches").select("id", { count: "exact", head: true })
      .eq("email", input.email).eq("active", true);
    if ((count ?? 0) >= MAX_PER_EMAIL) {
      return NextResponse.json({ error: `Max ${MAX_PER_EMAIL} active watches per email. Stop one first.` }, { status: 429 });
    }
  }

  // Peek at today's price so the user immediately sees where they stand.
  let current: { price: number; bookingUrl: string; departAt: string; returnAt: string | null } | null = null;
  try {
    const f = await cheapestFare(input);
    if (f) current = { price: f.price, bookingUrl: f.bookingUrl, departAt: f.departAt, returnAt: f.returnAt };
  } catch (e) {
    console.error("initial price check failed", e);
  }

  const { data, error } = await db().from("watches")
    .insert({ ...input, last_price: current?.price ?? null, last_checked_at: current ? new Date().toISOString() : null })
    .select("*").single();
  if (error || !data) return NextResponse.json({ error: "Could not save the watch." }, { status: 500 });
  const w = data as Watch;
  const manageUrl = `${appUrl()}/w/${w.id}?t=${w.manage_token}`;

  if (w.email && emailEnabled()) {
    const confirm = `${appUrl()}/api/confirm?id=${w.id}&t=${w.manage_token}`;
    await sendEmail(w.email, `Confirm your fare watch ${w.origin} → ${w.destination}`, `
      <div style="font-family:system-ui,sans-serif;max-width:520px">
        <h2>One click and you're watching ${w.origin} → ${w.destination}</h2>
        <p>We'll email you when it drops to ${money(Number(w.max_price), w.currency)} or less.</p>
        <p><a href="${confirm}" style="background:#ff4d2e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Confirm alerts</a></p>
        <p style="color:#888;font-size:13px">Didn't ask for this? Ignore this email and nothing happens.</p>
      </div>`).catch((e) => console.error("confirm email failed", e));
  }

  return NextResponse.json({
    id: w.id,
    manageUrl,
    telegramUrl: process.env.TELEGRAM_BOT_USERNAME ? telegramStartLink(w.id, w.manage_token) : null,
    emailPending: Boolean(w.email && emailEnabled()),
    current,
    underTarget: current ? current.price <= Number(w.max_price) : false,
  });
}
