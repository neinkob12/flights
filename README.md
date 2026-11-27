# Fare Sniper 🎯

Free flight price watcher. Set a route, flexible dates and a max price. When the fare drops below it, you get a one-tap booking link on **Telegram** or **email**. No account needed.

Plus an **auto-hold demo** (`/demo`): when the price hits, a bot reserves the seat through a real airline booking API (Duffel, test mode) so you get time to decide.

## How it works

| Piece | What it does |
|---|---|
| `app/page.tsx` | Form: route (with autocomplete), date window, nights, max price, currency, optional email |
| `lib/prices.ts` | Finds the cheapest matching fare via the free Travelpayouts / Aviasales Data API (worldwide) and builds the booking link |
| `lib/check.ts` | Checks active watches, alerts when price ≤ target (re-alerts on another 3% drop or once a day) |
| `app/api/cron/check` | Endpoint hit every hour by Supabase `pg_cron` (Vercel free plan only allows daily crons) |
| `app/api/telegram/webhook` | Bot: `/start` links a watch, `/list`, `/stop` |
| `lib/duffel.ts` + `/demo` | Searches Duffel test offers and places a **hold order** (seat reserved, pay later) |

Prices come from recent real searches (cached, usually under 48h old), so alerts link to the booking page where the live price is confirmed.

## Setup (about 20 minutes)

1. **Supabase**: create a project, run `supabase/migrations/001_init.sql` in the SQL editor.
2. **Travelpayouts**: sign up free, copy your API token (and marker if you want affiliate earnings on bookings).
3. **Telegram**: talk to `@BotFather`, `/newbot`, copy the token and username.
4. **Duffel** (demo only): sign up, copy the **test** token (`duffel_test_...`).
5. **Resend** (optional email): API key + a verified sending domain.
6. **Vercel**: import this repo, add all vars from `.env.example`, deploy.
7. Point Telegram at your app:
   ```bash
   curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=$APP_URL/api/telegram/webhook&secret_token=$TELEGRAM_WEBHOOK_SECRET"
   ```
8. Turn on hourly checks: run the commented `cron.schedule(...)` block at the bottom of the migration (fill in your URL and `CRON_SECRET`).

Local dev: `cp .env.example .env.local`, fill it in, `npm install`, `npm run dev`.

## Honest limits

- Alerts are only as fresh as the price data. Always confirm the price on the booking page.
- Bags and seats are not included in the price.
- The auto-hold is a **sandbox demo**. Holding real seats for other people needs a licensed booking setup, payment handling and passenger data, and only some airlines support free holds.
- Ways to lock a real fare: US routes booked 7+ days out usually allow free cancellation within 24h; many airlines sell paid fare holds at checkout.
