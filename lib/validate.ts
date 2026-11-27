export type WatchInput = {
  origin: string; destination: string; depart_from: string; depart_to: string;
  trip_type: "one_way" | "return"; nights_min: number | null; nights_max: number | null;
  direct_only: boolean; max_price: number; currency: string; email: string | null;
};

const IATA = /^[A-Z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCIES = ["eur", "usd", "gbp", "chf", "cad", "aud", "pln", "sek", "nok", "dkk", "inr", "brl", "mxn", "try", "jpy"];

export function parseWatch(b: Record<string, unknown>): { ok: true; value: WatchInput } | { ok: false; error: string } {
  const s = (k: string) => String(b[k] ?? "").trim();
  const origin = s("origin").toUpperCase();
  const destination = s("destination").toUpperCase();
  if (!IATA.test(origin) || !IATA.test(destination)) return { ok: false, error: "Pick airports or cities from the list (3-letter codes)." };
  if (origin === destination) return { ok: false, error: "Origin and destination must differ." };

  const depart_from = s("depart_from"), depart_to = s("depart_to");
  if (!DATE.test(depart_from) || !DATE.test(depart_to)) return { ok: false, error: "Choose a date range." };
  const today = new Date().toISOString().slice(0, 10);
  if (depart_to < today) return { ok: false, error: "Dates are in the past." };
  if (depart_to < depart_from) return { ok: false, error: "End date is before start date." };
  const spanDays = (Date.parse(depart_to) - Date.parse(depart_from)) / 86_400_000;
  if (spanDays > 120) return { ok: false, error: "Keep the date window under 4 months." };

  const trip_type = s("trip_type") === "one_way" ? "one_way" : "return";
  const num = (k: string) => (b[k] === "" || b[k] == null ? null : Math.round(Number(b[k])));
  const nights_min = trip_type === "return" ? num("nights_min") : null;
  const nights_max = trip_type === "return" ? num("nights_max") : null;
  for (const n of [nights_min, nights_max]) if (n != null && (!Number.isFinite(n) || n < 1 || n > 60)) return { ok: false, error: "Trip length must be 1 to 60 nights." };
  if (nights_min && nights_max && nights_min > nights_max) return { ok: false, error: "Min nights is above max nights." };

  const max_price = Number(b.max_price);
  if (!Number.isFinite(max_price) || max_price <= 0 || max_price > 100_000) return { ok: false, error: "Enter a max price." };

  const currency = s("currency").toLowerCase() || "eur";
  if (!CURRENCIES.includes(currency)) return { ok: false, error: "Unsupported currency." };

  const emailRaw = s("email");
  const email = emailRaw ? emailRaw.toLowerCase() : null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "That email looks wrong." };

  return { ok: true, value: { origin, destination, depart_from, depart_to, trip_type, nights_min, nights_max,
    direct_only: b.direct_only === true || b.direct_only === "true" || b.direct_only === "on", max_price, currency, email } };
}

export { CURRENCIES };
