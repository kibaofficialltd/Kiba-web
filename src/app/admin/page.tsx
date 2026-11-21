import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Coins,
  LifeBuoy,
  Package,
  ServerCog,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getAdminOverview } from "@/lib/admin";
import { getServerSnapshot } from "@/lib/server-status";
import { formatNumber, relativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [overview, server] = await Promise.all([getAdminOverview(), getServerSnapshot()]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Operations</p>
          <h1 className="display-md">Network at a glance.</h1>
          <p className="mt-1 text-sm text-muted">
            Real counts from the database and the last plugin heartbeat. Nothing on this page is
            simulated.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="live-dot" data-offline={!server.online} />
          <span className="text-xs text-muted">
            {server.online ? `${server.playersOnline} online` : server.stale ? "heartbeat stale" : "no heartbeat"}
          </span>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={<Users className="size-4" />} label="Portal accounts" value={formatNumber(overview.users)} note={`${formatNumber(overview.linked)} linked`} />
        <Stat icon={<Package className="size-4" />} label="Orders" value={formatNumber(overview.orders)} note={`${formatNumber(overview.ordersToday)} in 24h`} />
        <Stat icon={<Coins className="size-4" />} label="Coins spent" value={formatNumber(overview.coinsSpent)} note={`${formatNumber(overview.coinsEarned)} earned`} />
        <Stat icon={<LifeBuoy className="size-4" />} label="Open tickets" value={formatNumber(overview.openTickets)} note="open + pending" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
            <span className="flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
              <ShieldCheck className="size-3.5 text-gold" /> Recent staff actions
            </span>
            <Link href="/admin/audit" className="text-[0.64rem] text-muted hover:text-parchment">
              Full log
            </Link>
          </div>
          {overview.recentAudit.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">No audit entries yet.</p>
          ) : (
            <ul className="divide-y divide-line/50">
              {overview.recentAudit.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-mono text-[0.62rem] text-muted/70">
                    {entry.createdAt ? relativeTime(entry.createdAt) : "—"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-parchment-dim">
                    {entry.action}
                    {entry.targetType ? <span className="text-muted"> · {entry.targetType}</span> : null}
                  </span>
                  <span className="text-[0.62rem] text-muted">{entry.actor ?? "system"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <div className="panel p-5">
            <h2 className="flex items-center gap-2 font-display text-lg">
              <ServerCog className="size-4 text-moss" /> Plugin bridge
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Tracked stats profiles" value={formatNumber(overview.tracked)} />
              <Row label="Queued deliveries" value={formatNumber(overview.pendingDeliveries)} />
              <Row
                label="Failed deliveries"
                value={formatNumber(overview.failedDeliveries)}
                tone={overview.failedDeliveries > 0 ? "ember" : undefined}
              />
              <Row label="Last heartbeat" value={server.lastHeartbeatAt ? relativeTime(server.lastHeartbeatAt) : "never"} />
            </dl>
            {overview.failedDeliveries > 0 ? (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-ember/25 bg-ember/[0.06] p-2.5 text-xs text-[#f0a49d]">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                Failed deliveries need attention — rewards and purchases are stranded until they are
                re-queued.
              </p>
            ) : null}
          </div>

          <div className="panel p-5">
            <h2 className="font-display text-lg">Jump in</h2>
            <div className="mt-3 grid gap-2">
              <Quick href="/admin/tickets" label="Answer support tickets" />
              <Quick href="/admin/users" label="Review players" />
              <Quick href="/admin/products" label="Edit the store" />
              <Quick href="/admin/announcements" label="Publish a dispatch" />
            </div>
          </div>
        </section>
      </div>

      <section className="panel grid gap-4 p-5 sm:grid-cols-3">
        <Info label="Server" value={server.online ? "Online" : "Offline"} tone={server.online ? "moss" : "ember"} />
        <Info label="Version" value={server.version} />
        <Info label="TPS" value={server.tps ?? "—"} />
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <p className="text-[0.56rem] font-bold uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="mt-2 font-display text-2xl text-parchment">{value}</p>
      <p className="text-[0.62rem] text-muted">{note}</p>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "ember" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={tone === "ember" ? "font-mono text-[#f0a49d]" : "font-mono text-parchment-dim"}>
        {value}
      </dd>
    </div>
  );
}

function Quick({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-line bg-ink/30 px-3 py-2 text-sm text-parchment-dim transition hover:border-gold/30 hover:text-parchment"
    >
      {label}
      <ArrowRight className="size-3.5 text-muted" />
    </Link>
  );
}

function Info({ label, value, tone }: { label: string; value: string; tone?: "moss" | "ember" }) {
  return (
    <div>
      <p className="text-[0.56rem] font-bold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1">
        {tone ? (
          <Badge tone={tone}>{value}</Badge>
        ) : (
          <span className="font-display text-base text-parchment">{value}</span>
        )}
      </p>
    </div>
  );
}
