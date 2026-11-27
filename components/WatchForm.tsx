"use client";
import { useState } from "react";
import { PlaceInput } from "./PlaceInput";

const CURRENCIES = ["eur", "usd", "gbp", "chf", "cad", "aud", "pln", "sek", "nok", "dkk", "inr", "brl", "mxn", "try", "jpy"];

type Result = {
  id: string; manageUrl: string; telegramUrl: string | null; emailPending: boolean; underTarget: boolean;
  current: { price: number; bookingUrl: string; departAt: string; returnAt: string | null } | null;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);
const fmt = (n: number, c: string) => new Intl.NumberFormat("en", { style: "currency", currency: c.toUpperCase(), maximumFractionDigits: 0 }).format(n);

export function WatchForm() {
  const today = new Date();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [tripType, setTripType] = useState<"return" | "one_way">("return");
  const [from, setFrom] = useState(iso(new Date(today.getTime() + 14 * 864e5)));
  const [to, setTo] = useState(iso(new Date(today.getTime() + 74 * 864e5)));
  const [nightsMin, setNightsMin] = useState("3");
  const [nightsMax, setNightsMax] = useState("10");
  const [direct, setDirect] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [currency, setCurrency] = useState("eur");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!origin || !destination) return setError("Pick both airports from the suggestions.");
    setBusy(true);
    try {
      const r = await fetch("/api/watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, trip_type: tripType, depart_from: from, depart_to: to,
          nights_min: nightsMin, nights_max: nightsMax, direct_only: direct, max_price: maxPrice, currency, email }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Something went wrong.");
      setResult(j);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="card stack">
        <span className="pill">Watch created</span>
        <h2 style={{ margin: 0 }}>{origin} → {destination} under {fmt(Number(maxPrice), currency)}</h2>
        {result.current ? (
          <p>Cheapest right now: <b>{fmt(result.current.price, currency)}</b>.{" "}
            {result.underTarget ? "That's already under your target! 🎯" : "We'll ping you when it drops."}</p>
        ) : (
          <p className="note">No recent price for this route yet. We'll keep checking.</p>
        )}
        {result.underTarget && result.current && (
          <a className="btn" href={result.current.bookingUrl} target="_blank" rel="noopener">Book it now for {fmt(result.current.price, currency)}</a>
        )}
        {result.telegramUrl && (
          <a className="btn tg" href={result.telegramUrl} target="_blank" rel="noopener">📲 Connect Telegram for instant alerts</a>
        )}
        {result.emailPending && <p className="note">📧 Check your inbox and click <b>Confirm</b> to get email alerts.</p>}
        <p className="note">Bookmark your <a href={result.manageUrl}>manage link</a> to pause or stop this watch anytime.</p>
        <button className="btn ghost" onClick={() => setResult(null)}>Watch another flight</button>
      </div>
    );
  }

  return (
    <form className="card grid" onSubmit={submit}>
      <PlaceInput label="From" value="" onChange={setOrigin} placeholder="Berlin, JFK, London…" />
      <PlaceInput label="To" value="" onChange={setDestination} placeholder="Lisbon, Bangkok…" />
      <div className="full">
        <div className="seg" role="group" aria-label="Trip type">
          <button type="button" aria-pressed={tripType === "return"} onClick={() => setTripType("return")}>Return</button>
          <button type="button" aria-pressed={tripType === "one_way"} onClick={() => setTripType("one_way")}>One way</button>
        </div>
      </div>
      <div><label>Leave between</label><input type="date" value={from} min={iso(today)} onChange={(e) => setFrom(e.target.value)} /></div>
      <div><label>and</label><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
      {tripType === "return" && (<>
        <div><label>Min nights</label><input type="number" min={1} max={60} value={nightsMin} onChange={(e) => setNightsMin(e.target.value)} /></div>
        <div><label>Max nights</label><input type="number" min={1} max={60} value={nightsMax} onChange={(e) => setNightsMax(e.target.value)} /></div>
      </>)}
      <div><label>Max price (total)</label><input type="number" min={1} inputMode="numeric" required placeholder="150" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} /></div>
      <div><label>Currency</label>
        <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>
      </div>
      <div className="full check"><input id="direct" type="checkbox" checked={direct} onChange={(e) => setDirect(e.target.checked)} /><label htmlFor="direct" style={{ margin: 0, color: "inherit", fontSize: 15 }}>Direct flights only</label></div>
      <div className="full"><label>Email (optional, Telegram works without it)</label><input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="full">
        <button className="btn" disabled={busy}>{busy ? "Checking prices…" : "🎯 Start watching"}</button>
        {error && <p className="err">{error}</p>}
      </div>
    </form>
  );
}
