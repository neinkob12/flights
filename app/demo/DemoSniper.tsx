"use client";
import { useState } from "react";

type Held = { status: "held"; bookingReference: string; price: string; currency: string; airline: string; flight: string;
  departingAt: string; payBy: string | null; priceGuaranteedUntil: string | null; offersScanned: number };
type NoMatch = { status: "no_match"; cheapest: { price: string; currency: string; holdable: boolean } | null; offersScanned: number };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const fmt = (a: string, c: string) => new Intl.NumberFormat("en", { style: "currency", currency: c }).format(Number(a));

export function DemoSniper() {
  const [origin, setOrigin] = useState("LHR");
  const [destination, setDestination] = useState("JFK");
  const [date, setDate] = useState(inDays(30));
  const [maxPrice, setMaxPrice] = useState("900");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState<Held | null>(null);

  const say = (l: string) => setLog((x) => [...x, l]);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setHeld(null); setLog([]);
    say(`🎯 Target: ${origin} → ${destination} on ${date}, max ${maxPrice}`);
    await sleep(400);
    say("📡 Scanning airline offers…");
    try {
      const r = await fetch("/api/demo/hold", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: origin.toUpperCase(), destination: destination.toUpperCase(), date, maxPrice }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      say(`✈️  ${j.offersScanned} offers found`);
      await sleep(350);
      if (j.status === "no_match") {
        const n = j as NoMatch;
        say(n.cheapest ? `❌ Cheapest is ${fmt(n.cheapest.price, n.cheapest.currency)}${n.cheapest.holdable ? "" : " (not holdable)"}. Above target, waiting…` : "❌ No offers on that day.");
      } else {
        const h = j as Held;
        say(`💸 ${fmt(h.price, h.currency)} on ${h.airline} is under target!`);
        await sleep(350);
        say("🔒 Placing hold…");
        await sleep(500);
        setHeld(h);
      }
    } catch (err) {
      say(`⚠️ ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <form className="card grid" onSubmit={run}>
        <div><label>From (code)</label><input value={origin} maxLength={3} onChange={(e) => setOrigin(e.target.value.toUpperCase())} /></div>
        <div><label>To (code)</label><input value={destination} maxLength={3} onChange={(e) => setDestination(e.target.value.toUpperCase())} /></div>
        <div><label>Date</label><input type="date" value={date} min={inDays(2)} onChange={(e) => setDate(e.target.value)} /></div>
        <div><label>Max price</label><input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} /></div>
        <div className="full"><button className="btn" disabled={busy}>{busy ? "Sniping…" : "🎯 Snipe & auto-hold"}</button></div>
      </form>
      {log.length > 0 && <div className="card log">{log.join("\n")}</div>}
      {held && (
        <div className="card held stack">
          <div className="stamp">HELD</div>
          <div className="note">Booking reference</div>
          <div className="pnr">{held.bookingReference}</div>
          <div className="big">{fmt(held.price, held.currency)}</div>
          <p>{held.airline} · {held.flight} · {new Date(held.departingAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })}</p>
          {held.payBy && <p className="note">Seat reserved, no payment yet. Pay by {new Date(held.payBy).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" })} or it releases automatically.</p>}
          <p className="note">Test mode. No real ticket was issued.</p>
        </div>
      )}
    </div>
  );
}
