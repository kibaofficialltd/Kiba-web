# Black Shores — Shorekeeper Bot Portal (`kiba-web`)

Official Vercel web portal for the **Shorekeeper WhatsApp Bot**, featuring:
- **Home (`/`)**: Overview, live bot stats, core capabilities showcase, and WhatsApp links.
- **Leaderboards (`/leaderboard`)**: Live Rich (`.rich`), Rank Tiers (`.rank`), and Hall of Shame (`.shame`) rankings.
- **Grand Jackpot (`/lottery`)**: Live 2-Hour Lottery countdown, slot progress (`X / 10`), participants, and recent winners.
- **Commands Explorer (`/commands`)**: Searchable directory of all 100 bot commands across 11 categories.
- **WhatsApp OTP Linking (`/login`)**: Link any registered WhatsApp account using a 6-digit OTP sent directly to the player's personal WhatsApp DM.

## Connecting Vercel to the Live Termux Bot (`BOT_API_URL`)
By default, `/api/*` falls back gracefully to `api/_snapshot.json` when the bot is offline.
To enable **live real-time stats** and **WhatsApp OTP DM login** on your Vercel deployment:

1. Expose the bot's local port `3000` with an SSH tunnel (no extra packages needed):
   ```bash
   ssh -R 80:localhost:3000 nokey@localhost.run
   ```
   *(Or use your preferred HTTPS tunnel / reverse proxy URL.)*
2. Copy the HTTPS tunnel URL (e.g. `https://xxxx.lhr.life`) into your **Vercel Project Settings -> Environment Variables**:
   - Name: `BOT_API_URL`
   - Value: `https://your-tunnel-url.example`
3. Trigger a redeploy on Vercel (or push a commit).
