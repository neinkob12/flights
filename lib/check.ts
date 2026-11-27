import { db, type Watch, T } from "./db";
import { cheapestFare, type Fare } from "./prices";
import { sendTelegram } from "./telegram";
import { sendEmail, emailEnabled } from "./email";
import { appUrl } from "./env";
import { money, day, escapeHtml, LOCK_TIPS } from "./format";

const REALERT_DROP = 0.97;          // re-alert if price drops another 3%
const REALERT_AFTER_MS = 24 * 3600e3; // or once a day while it stays under target

export function shouldAlert(w: Watch, fare: Fare): boolean {
  if (fare.price > Number(w.max_price)) return false;
  if (w.last_alert_price == null || !w.last_alert_at) return true;
  if (fare.price <= Number(w.last_alert_price) * REALERT_DROP) return true;
  return Date.now() - Date.parse(w.last_alert_at) > REALERT_AFTER_MS;
}

function route(w: Watch) {
  return `${w.origin} → ${w.destination}`;
}

export async function alertWatch(w: Watch, fare: Fare): Promise<string[]> {
  const channels: string[] = [];
  const manage = `${appUrl()}/w/${w.id}?t=${w.manage_token}`;
  const when = fare.returnAt ? `${day(fare.departAt)} – ${day(fare.returnAt)}` : day(fare.departAt);
  const stops = fare.transfers === 0 ? "direct" : `${fare.transfers} stop${fare.transfers > 1 ? "s" : ""}`;
  const price = money(fare.price, w.currency);

  if (w.telegram_chat_id) {
    const text =
      `🎯 <b>Fare hit: ${escapeHtml(route(w))} for ${price}</b>\n` +
      `${when} · ${escapeHtml(fare.airline)} · ${stops}\n` +
      `Your target: ${money(Number(w.max_price), w.currency)}\n\n` +
      LOCK_TIPS.map((t) => `• ${t}`).join("\n") +
      `\n\n<a href="${manage}">Manage this watch</a>`;
    try {
      await sendTelegram(w.telegram_chat_id, text, { text: `Book now for ${price}`, url: fare.bookingUrl });
      channels.push("telegram");
    } catch (e) {
      console.error("telegram failed", w.id, e);
    }
  }

  if (w.email && w.email_confirmed && emailEnabled()) {
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:520px">
        <h2>🎯 ${escapeHtml(route(w))} for ${price}</h2>
        <p>${when} · ${escapeHtml(fare.airline)} · ${stops}<br>Your target: ${money(Number(w.max_price), w.currency)}</p>
        <p><a href="${fare.bookingUrl}" style="background:#ff4d2e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Book now for ${price}</a></p>
        <ul>${LOCK_TIPS.map((t) => `<li>${t}</li>`).join("")}</ul>
        <p style="color:#888;font-size:13px"><a href="${manage}">Manage or stop this watch</a></p>
      </div>`;
    try {
      await sendEmail(w.email, `🎯 ${route(w)} for ${price}`, html);
      channels.push("email");
    } catch (e) {
      console.error("email failed", w.id, e);
    }
  }
  return channels;
}

/** Check a batch of active watches, oldest-checked first. */
export async function runCheck(limit = 40, budgetMs = 50_000) {
  const started = Date.now();
  const { data, error } = await db()
    .from(T.watches)
    .select("*")
    .eq("active", true)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);
  if (error) throw error;

  const today = new Date().toISOString().slice(0, 10);
  const result = { checked: 0, alerted: 0, expired: 0, errors: 0 };

  for (const w of (data ?? []) as Watch[]) {
    if (Date.now() - started > budgetMs) break;
    if (w.depart_to < today) {
      await db().from(T.watches).update({ active: false }).eq("id", w.id);
      result.expired++;
      continue;
    }
    try {
      const from = w.depart_from < today ? today : w.depart_from;
      const fare = await cheapestFare({ ...w, depart_from: from });
      const patch: Partial<Watch> = { last_checked_at: new Date().toISOString(), last_price: fare?.price ?? null };
      if (fare && shouldAlert(w, fare)) {
        const channels = await alertWatch(w, fare);
        if (channels.length) {
          patch.last_alert_price = fare.price;
          patch.last_alert_at = new Date().toISOString();
          await db().from(T.alerts).insert({
            watch_id: w.id, price: fare.price, depart_at: fare.departAt, return_at: fare.returnAt,
            airline: fare.airline, link: fare.bookingUrl, channels,
          });
          result.alerted++;
        }
      }
      await db().from(T.watches).update(patch).eq("id", w.id);
      result.checked++;
    } catch (e) {
      console.error("check failed", w.id, e);
      result.errors++;
    }
  }
  return result;
}
