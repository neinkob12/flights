import { db, type Watch } from "@/lib/db";
import { money } from "@/lib/format";
import { telegramStartLink } from "@/lib/telegram";
import { ManageButtons } from "./ManageButtons";

export const dynamic = "force-dynamic";

export default async function ManagePage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ t?: string; confirmed?: string }>;
}) {
  const { id } = await params;
  const { t, confirmed } = await searchParams;
  const { data } = t ? await db().from("watches").select("*").eq("id", id).eq("manage_token", t).maybeSingle() : { data: null };
  const w = data as Watch | null;
  if (!w) return <div className="card"><h2>Watch not found</h2><p className="note">Check that you used the full manage link.</p></div>;

  return (
    <div className="card stack">
      {confirmed && <span className="pill">Email alerts confirmed ✓</span>}
      <span className={w.active ? "pill" : "pill off"}>{w.active ? "Watching" : "Paused"}</span>
      <h2 style={{ margin: 0 }}>{w.origin} → {w.destination}</h2>
      <p>
        {w.trip_type === "return" ? "Return" : "One way"}, leaving {w.depart_from} to {w.depart_to}
        {w.trip_type === "return" && w.nights_min ? `, ${w.nights_min} to ${w.nights_max ?? "any"} nights` : ""}
        {w.direct_only ? ", direct only" : ""}.
      </p>
      <div><div className="note">Target</div><div className="big">{money(Number(w.max_price), w.currency)}</div></div>
      {w.last_price != null && (
        <p>Last seen price: <b>{money(Number(w.last_price), w.currency)}</b>
          {w.last_checked_at && <span className="note"> ({new Date(w.last_checked_at).toUTCString()})</span>}</p>
      )}
      <p className="note">
        Alerts: {w.telegram_chat_id ? "Telegram ✓" : "Telegram not connected"}
        {w.email ? ` · Email ${w.email_confirmed ? "✓" : "(not confirmed yet)"}` : ""}
      </p>
      {!w.telegram_chat_id && process.env.TELEGRAM_BOT_USERNAME && (
        <a className="btn tg" href={telegramStartLink(w.id, w.manage_token)} target="_blank" rel="noopener">📲 Connect Telegram</a>
      )}
      <ManageButtons id={w.id} token={w.manage_token} active={w.active} />
    </div>
  );
}
