export const money = (n: number, cur: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency: cur.toUpperCase(), maximumFractionDigits: 0 }).format(n);

export const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const LOCK_TIPS = [
  "Prices move fast. Open the link now and confirm the fare.",
  "Flying to/from the US and 7+ days out? You can usually cancel free within 24h of booking.",
  "Many airlines sell a cheap fare hold (lock the price for a few days). Look for it at checkout.",
  "Add-ons (bags, seats) are not included. Check the total before you pay.",
];
