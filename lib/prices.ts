// Price source: Travelpayouts / Aviasales Data API (free, worldwide).
// Prices come from recent real searches (cached, usually < 48h old), so they
// are a strong signal but must be confirmed on the booking page.
import { env } from "./env";
import type { Watch } from "./db";

export type Fare = {
  price: number;
  currency: string;
  origin: string;
  destination: string;
  departAt: string;
  returnAt: string | null;
  airline: string;
  transfers: number;
  bookingUrl: string;
};

type TpItem = {
  origin: string;
  destination: string;
  price: number;
  airline: string;
  departure_at: string;
  return_at?: string;
  transfers: number;
  return_transfers?: number;
  link: string;
};

function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  const d = new Date(from.slice(0, 7) + "-01T00:00:00Z");
  const end = new Date(to.slice(0, 7) + "-01T00:00:00Z");
  while (d <= end && out.length < 12) {
    out.push(d.toISOString().slice(0, 7));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

const nightsBetween = (a: string, b: string) =>
  Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / 86_400_000);

export function bookingLink(path: string): string {
  const marker = process.env.TRAVELPAYOUTS_MARKER;
  const url = new URL(path, "https://www.aviasales.com");
  if (marker) url.searchParams.set("marker", marker);
  return url.toString();
}

/** Cheapest fare matching the watch, or null if nothing found. */
export async function cheapestFare(w: Pick<Watch,
  "origin" | "destination" | "depart_from" | "depart_to" | "trip_type" |
  "nights_min" | "nights_max" | "direct_only" | "currency">): Promise<Fare | null> {
  const token = env("TRAVELPAYOUTS_TOKEN");
  const oneWay = w.trip_type === "one_way";
  const fares: Fare[] = [];

  for (const month of monthsBetween(w.depart_from, w.depart_to)) {
    const q = new URLSearchParams({
      origin: w.origin,
      destination: w.destination,
      departure_at: month,
      currency: w.currency,
      sorting: "price",
      direct: String(w.direct_only),
      one_way: String(oneWay),
      limit: "1000",
      page: "1",
      token,
    });
    const res = await fetch(`https://api.travelpayouts.com/aviasales/v3/prices_for_dates?${q}`, {
      headers: { "Accept-Encoding": "gzip" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Travelpayouts ${res.status}: ${await res.text()}`);
    const body = (await res.json()) as { success: boolean; data: TpItem[]; error?: string };
    if (!body.success) throw new Error(`Travelpayouts error: ${body.error}`);

    for (const it of body.data) {
      const day = it.departure_at.slice(0, 10);
      if (day < w.depart_from || day > w.depart_to) continue;
      if (!oneWay) {
        if (!it.return_at) continue;
        const n = nightsBetween(it.departure_at, it.return_at);
        if (w.nights_min && n < w.nights_min) continue;
        if (w.nights_max && n > w.nights_max) continue;
      }
      fares.push({
        price: it.price,
        currency: w.currency,
        origin: it.origin,
        destination: it.destination,
        departAt: it.departure_at,
        returnAt: it.return_at ?? null,
        airline: it.airline,
        transfers: it.transfers + (it.return_transfers ?? 0),
        bookingUrl: bookingLink(it.link),
      });
    }
  }
  fares.sort((a, b) => a.price - b.price);
  return fares[0] ?? null;
}
