# Deployment guide — KIBAOFFICIAL SMP

## 1. Database

Any PostgreSQL 14+ works (local 18.x verified, Supabase-compatible). Drizzle migrations
live in `drizzle/`:

```bash
pnpm db:migrate   # apply
pnpm db:generate  # only when schema changes
```

For Supabase use the **Transaction** pooler connection string and set `DATABASE_SSL=true`.

## 2. Environment

Copy `.env.example` → `.env` and fill in:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. |
| `APP_URL` | Public origin, no trailing slash. |
| `PLUGIN_SHARED_SECRET` | Shared with the Paper plugin; signs all bridge traffic. |
| `PLUGIN_TIMESTAMP_TOLERANCE` | Seconds (default 300). |
| `PLUGIN_IP_ALLOWLIST` | Optional source-IP allowlist for `/api/plugin/*`. |
| `CRON_SECRET` | Bearer token for `/api/cron/prune`. |
| SMTP_* | Email delivery (host, port, user, pass, from). |
| `SESSION_COOKIE_NAME`, `SESSION_DAYS` | Session cookie + lifetime. |
| `NEXT_PUBLIC_*` | Public server address, brand, socials, store flag. |

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 3. Build & run

```bash
pnpm build
pnpm start
```

Production notes:

- Run behind HTTPS reverse proxy with a real `APP_URL` (required for secure cookies and correct origins).
- Set `NODE_ENV=production`.
- Add the cron job (or hit the endpoint):

  ```
  curl -X POST https://your-domain.com/api/cron/prune -H "Authorization: Bearer $CRON_SECRET"
  ```

  Schedule hourly via cron/systemd timer.

## 4. KIBAOFFICIALCore plugin

See `plugin/README.md` (to be added alongside `plugin/pom.xml`, `plugin.yml`,
`config.yml` and the Java sources).

Summary:

1. Build with Maven: `mvn -DskipTests package` → `plugin/target/KIBAOFFICIALCore-1.0.0.jar`.
2. Drop into the server `plugins/` folder.
3. Set `website.base-url`, `plugin.shared-secret`, `server.host`, `server.port`, MOTD, etc. in `config.yml`.
4. Start the server; the plugin signs heartbeats and polls the delivery queue.

## 5. Backups & operations

- Database: nightly logical backup + `pg_dump` of `public`.
- Audit log: `/api/admin/audit` is append-only; never purge it.
- Failed deliveries: admin overview flags stranded deliveries; staff re-queue via plugin retry or manual DB fix.
- Staff actions (role changes, coin adjustments, ticket resolution) are written to `audit_logs`.

## 6. Security checklist for production

- [ ] HTTPS everywhere; secure cookies.
- [ ] `CRON_SECRET` set and rotated.
- [ ] `PLUGIN_SHARED_SECRET` rotated and shared with plugin builds.
- [ ] `APP_URL` matches the public host (CSRF origin check).
- [ ] Rate limits enabled (defaults in `src/lib/rate-limit.ts`).
- [ ] Staff accounts MFA/2FA not implemented yet — note for ops.
- [ ] Regular `pg_dump` snapshots.
