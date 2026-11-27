export function setupStatus() {
  const has = (k: string) => Boolean(process.env[k]);
  return [
    { name: "Database (Supabase)", ok: has("SUPABASE_URL") && has("SUPABASE_KEY") && has("FS_DB_SECRET"), what: "Stores watches" },
    { name: "Flight prices (Travelpayouts)", ok: has("TRAVELPAYOUTS_TOKEN"), what: "Needed for price checks and booking links" },
    { name: "Telegram bot", ok: has("TELEGRAM_BOT_TOKEN") && has("TELEGRAM_BOT_USERNAME"), what: "Instant alerts" },
    { name: "Email (Resend)", ok: has("RESEND_API_KEY") && has("EMAIL_FROM"), what: "Optional email alerts" },
    { name: "Auto-hold demo (Duffel test)", ok: (process.env.DUFFEL_TEST_TOKEN ?? "").startsWith("duffel_test_"), what: "The /demo page" },
    { name: "Hourly checks", ok: has("CRON_SECRET"), what: "Triggered by Supabase pg_cron" },
  ];
}
