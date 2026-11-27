# Good morning! Fare Sniper is live 🎯

**Live app:** https://fare-snipe.vercel.app
**Setup status:** https://fare-snipe.vercel.app/setup (shows what's connected)

## Already done
- Website deployed on Vercel (project `fare-sniper`)
- Database: tables `fs_watches` + `fs_alerts` inside your **postakt** Supabase project
  (your free plan allows only 2 active projects, so I could not create a new one).
  Locked down: only the app can read/write them.
- Hourly price check scheduled in Supabase (`pg_cron`, job `fare-sniper-check`)
- Tested in production: creating a watch, manage page, airport search, cron security

## You add 3 keys (about 15 min), then it fully works
Add each one in **Vercel → fare-sniper → Settings → Environment Variables**
(Production + Preview), then click **Redeploy** on the latest deployment.

### 1. Flight prices: Travelpayouts (most important)
1. Sign up free at travelpayouts.com
2. Profile → API token → copy it
3. Vercel variable: `TRAVELPAYOUTS_TOKEN`
4. Optional: also add `TRAVELPAYOUTS_MARKER` (your partner ID). Then you earn a commission when people book through your links.

### 2. Telegram bot
1. In Telegram, open **@BotFather** → `/newbot` → pick a name and a username ending in `bot`
2. Vercel variables: `TELEGRAM_BOT_TOKEN` (the long token) and `TELEGRAM_BOT_USERNAME` (without @)
3. Nothing else to do: the app connects the bot to itself within the hour.

### 3. Auto-hold demo (for the TikTok): Duffel
1. Sign up at duffel.com (free) → Developers → Access tokens → create a **test** token
2. Vercel variable: `DUFFEL_TEST_TOKEN` (starts with `duffel_test_`)
3. Try https://fare-snipe.vercel.app/demo with LHR → JFK

### Optional: email alerts (Resend)
`RESEND_API_KEY` and `EMAIL_FROM`. This needs your own domain verified at resend.com, so skip it for now. Telegram is enough.

## TikTok angle
"Everyone says book on Travel Tuesday. I built a free bot that watches YOUR flight and pings you the second it drops under your price. And here's it auto-reserving a seat (demo)."
Film the /demo page: the HELD stamp is made for it.
