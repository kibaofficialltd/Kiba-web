# KIBAOFFICIAL REST API

All JSON responses use `{ ok: true, data }` on success and
`{ ok: false, error: { code, message, details } }` on failure. Mutation endpoints
require a same-origin `Origin`/`Referer` header (CSRF defence) and authenticated
session cookies where noted.

Base URL: `https://your-domain.com` (dev: `http://localhost:3000`).

---

## Auth — `/api/auth/*`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | public | Register (`username`, `email`, `password`, `confirmPassword`, `acceptRules`). Auto-creates session. Returns `devVerifyUrl` in dev when SMTP is unconfigured. |
| POST | `/api/auth/login` | public | Login with `identifier` (email or username) + `password`. Redirects staff to `/admin`, players to `/dashboard`. |
| POST | `/api/auth/logout` | session | Destroy session. |
| POST | `/api/auth/verify-email` | session | Consume email verification token. |
| POST | `/api/auth/resend-verification` | session | Resend verification (rate limited). |
| POST | `/api/auth/forgot-password` | public | Send reset token. |
| POST | `/api/auth/reset-password` | public | Reset with `token` + new password. |
| POST | `/api/auth/change-password` | session | Change password (scrypt), invalidates other sessions. |

Password policy: min 10 chars, letter + number, max 128.

## Server — `/api/server/*`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/server/status` | Live snapshot: online flag, MOTD, version, players online/max, editions, uptime, TPS, last heartbeat. Online only when heartbeat is fresh (< 90s). |
| GET | `/api/server/players` | Online players from the last signed heartbeat. |
| GET | `/api/server/statistics` | Server aggregates (kills, playtime, …). |

## Player — `/api/player/*`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/player/:username` | Public profile by in-game name. |

## Rewards & spin — `/api/rewards*`, `/api/spin*`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/rewards/state` | Daily reward state: streak, day number, next claim time, claimed-today flag. |
| POST | `/api/rewards/claim` | Claim today’s reward (one per UTC day, guarded). |
| GET | `/api/rewards/history` | Reward claim history. |
| POST | `/api/spin/claim` | Daily weighted spin (CSPRNG, one per UTC day). |

## Store — `/api/store/*`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/store/checkout` | Body: `{ items: [{ productId, quantity }] }`. Server-side re-validates balance, link state, stock, per-player limits, then deducts coins and queues delivery. |
| GET | `/api/store/orders` | Order history incl. items + delivery status. |

Delivery kinds queued by checkout: `store_purchase`.

## Events — `/api/events/*`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/events/:slug/register` | Register (body `{}`) — idempotent; DELETE cancels. |
| POST | `/api/events/:slug/register` with body `{}` | Body must be `{}`; validates open registration, active status, rate limit. |

## Support — `/api/support/*`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/support/tickets` | List current user’s tickets. |
| POST | `/api/support/tickets` | Create ticket (`subject`, `category`, `message`). |
| GET | `/api/support/tickets/:reference` | Read ticket thread (owner or staff). |
| POST | `/api/support/tickets/:reference` | Reply (owner or staff). |

Ticket categories: `general`, `account`, `link`, `purchase`, `reward`, `report`, `appeal`, `bug`.

## Notifications — `/api/notifications`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/notifications` | List user notifications (limit 100). |
| POST | `/api/notifications` | `{ action: "read" \| "read_all", id? }`. |

## Admin — `/api/admin/*` (staff)

All admin endpoints require staff role (`helper` +). `/api/admin/users/:id` additionally
supports role/status/coin adjustments (owner-only role escalation) and writes audit logs.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/overview` | Aggregate network stats (users, orders, tickets, deliveries, coins). |
| GET | `/api/admin/users` | List users. |
| PATCH | `/api/admin/users/:id` | `{ role?, status?, coinDelta?, note? }`. |
| GET | `/api/admin/products` | List store products. |
| POST | `/api/admin/products` | Create product. |
| PATCH | `/api/admin/products` | Update product (id in body). |
| DELETE | `/api/admin/products?id=<uuid>` | Soft-deactivate product. |
| POST | `/api/admin/announcements` | Create dispatch. |
| PATCH | `/api/admin/announcements` | Update dispatch (id in body). |
| POST | `/api/admin/events` | Create event. |
| PATCH | `/api/admin/events` | Update event (id in body). |
| PATCH | `/api/admin/tickets/:reference` | Set ticket status. |
| POST | `/api/admin/settings` | Update runtime settings keys. |
| GET | `/api/admin/audit` | Audit log entries. |

## Plugin bridge — `/api/plugin/*` (HMAC signed)

Every request must include:

```
x-kiba-timestamp: <unix seconds>
x-kiba-nonce:     <unique id>
x-kiba-signature: <hex HMAC-SHA256(secret, `${timestamp}.${nonce}.${rawBody}`)>
```

- Timestamp must be within `PLUGIN_TIMESTAMP_TOLERANCE` (default 300s) of server time.
- Nonces are single-use (replay protection); replays are rejected with `REPLAY_DETECTED`.
- Optional source IP allowlist via `PLUGIN_IP_ALLOWLIST`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/plugin/heartbeat` | Body: `online`, `motd`, `version`, `playersOnline`, `maxPlayers`, `javaPlayers`, `bedrockPlayers`, `uptimeSeconds`, `tps`, `host`, `port`, `players[]`. |
| POST | `/api/plugin/deliveries/claim` | Atomically lease queued deliveries (`FOR UPDATE SKIP LOCKED`, stale reclaim after 2 min). Returns `deliveries[]`. |
| POST | `/api/plugin/deliveries/result` | Body: `{ deliveryId, success, error? }` — marks delivered / failed / requeue. |
| POST | `/api/plugin/link/verify` | Body: `{ code, username, uuid, edition, xuid? }` — redeems one-time link code. |
| POST | `/api/plugin/players/sync` | Body: `{ players: [{ uuid, username, rank, playtimeSeconds, kills, deaths, … }] }`. |
| POST | `/api/plugin/accounts` | Body: `{ uuids?: string[], usernames?: string[] }` — returns website-authoritative balances. |

Delivery flow: website queues → plugin claims → plugin executes commands → plugin reports result → website marks delivered / requeues.

## Cron — `/api/cron/prune`

`POST` with `Authorization: Bearer $CRON_SECRET` → prunes expired sessions, email tokens, link codes, plugin nonces and rate-limit windows.

## Misc

- `GET /api/avatar/:name` — deterministic pixel-art avatar for a Minecraft username.
