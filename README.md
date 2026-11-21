# KIBAOFFICIAL SMP — Website, Portal & Coin Store

Production-ready web presence for the KIBAOFFICIAL Minecraft network: a public
site (news, events, store, leaderboards, community, rules, support) plus a
player portal (rewards, spin, purchases, statistics, settings) and a staff
admin console.

- **Stack**: Next.js 16 (App Router, webpack), React 19, TypeScript, Tailwind CSS v4,
  Drizzle ORM + PostgreSQL, Zod, lucide-react, Nodemailer.
- **Auth**: scrypt password hashing, SHA-256 hashed session tokens in DB,
  `kiba_session` httpOnly cookie, 30-day expiry, email verification + password reset.
- **Economy**: coins are the only store currency. Ledger-backed balances with
  guarded atomic debits; orders deduct coins inside a single transaction and queue
  in-game delivery commands for KIBAOFFICIALCore.
- **Plugin bridge**: HMAC-SHA256 signed, timestamped, replay-protected
  (nonce) requests from the Paper `KIBAOFFICIALCore` plugin.
- **Email**: SMTP via Nodemailer; without SMTP the app writes verification and
  reset links to the `emergency_outbox` table (development only).

## Quick start

```bash
# 1. Start PostgreSQL (18.x) locally, e.g. initdb + pg_ctl on :5432
# 2. pnpm install --config.dangerouslyAllowAllBuilds=true
# 3. cp .env.example .env   (set DATABASE_URL, APP_URL, PLUGIN_SHARED_SECRET, CRON_SECRET)
# 4. pnpm db:push            # or: pnpm db:migrate
# 5. pnpm db:seed            # optional demo content (SEED_DEMO=1 for demo accounts)
# 6. pnpm dev                # http://localhost:3000
```

Other scripts:

| Script | Purpose |
| --- | --- |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:generate` / `db:migrate` / `db:push` | Drizzle migrations |
| `pnpm db:seed` | Seed editorial content + demo accounts |
| `pnpm plugin:sim` | Signed smoke test of the plugin bridge against the running dev server |

> Next.js 16 on this host runs with `--webpack` because Turbopack is unsupported
> on the current ARM64 host. Keep `next.config.ts` as-is unless you switch toolchain.

## Environment

See `.env.example`. Key variables:

- `DATABASE_URL` — Postgres / Supabase connection string.
- `APP_URL` — public origin (no trailing slash). Used for verification links and CSRF origin checks.
- `PLUGIN_SHARED_SECRET` — 64+ char random secret shared with the plugin; signs every bridge request.
- `PLUGIN_TIMESTAMP_TOLERANCE` — seconds a signed plugin request may be in the past (default 300).
- `PLUGIN_IP_ALLOWLIST` — optional comma list restricting `/api/plugin/*`.
- `CRON_SECRET` — bearer token for `POST /api/cron/prune` (housekeeping).
- SMTP / `SESSION_*` / store / reward / spin / server / brand variables — see `.env.example`.

## Project layout

```
src/
  app/
    (site)/          Public pages: home, store, leaderboards, community, news,
                     events, rules, support, player/[username]
    (auth)/          Auth pages: login, register, forgot/reset/change password, verify-email
    admin/           Staff console: overview, users, products, announcements, events, tickets, audit, settings
    dashboard/       Player portal: overview, rewards, spin, purchases, statistics, settings, notifications, link
    api/             REST endpoints (auth, store, rewards, spin, leaderboards, player, events,
                     support, notifications, admin, plugin, server, cron, avatar)
  components/        Design system + feature components
  db/                Drizzle schema + migrations
  lib/               Core modules (auth, api, coins, rewards, spin, store, queries, plugin-auth, ...)
scripts/             seed.ts, plugin-simulator.ts
plugin/             Paper plugin source (KIBAOFFICIALCore)
docs/               This documentation
```

Design tokens live in `src/app/globals.css` (ink/parchment/gold/moss/ember, display
serif + sans, panel/eyebrow/btn/badge classes). The aesthetic is intentionally dark,
handcrafted, esports-like — no neon gradients, no generic AI gradients.

## Documentation

- `docs/API.md` — full REST API reference.
- `docs/DEPLOYMENT.md` — deployment, migrations, backups, production notes.

## Security notes

- No plaintext passwords; scrypt hashing; SHA-256 session token hashes; httpOnly cookies.
- CSRF origin checks on all cookie-authenticated mutations; rate limits on auth and
  mutating endpoints; zod validation on every body; audit log for staff actions.
- Plugin traffic: HMAC signature + timestamp window + single-use nonce replay protection.
- Never expose secrets client-side; plugin secret server-only.
