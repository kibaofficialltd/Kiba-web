"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, RefreshCw, Signal, Users, WifiOff } from "lucide-react";
import type { ServerSnapshot } from "@/lib/server-shared";
import { AnimatedNumber } from "@/components/animated-number";
import { formatUptime } from "@/lib/server-shared";
import { cx } from "@/lib/cx";

const POLL_MS = 15_000;

function useStatus(initial: ServerSnapshot) {
  const [snapshot, setSnapshot] = useState(initial);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/server/status", { cache: "no-store" });
      if (!res.ok) throw new Error("status request failed");
      const payload = (await res.json()) as { ok: boolean; data: ServerSnapshot };
      if (!payload.ok) throw new Error("bad payload");
      setSnapshot(payload.data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  return { snapshot, error, refreshing, refresh };
}

export function LiveServerStatus({ initial }: { initial: ServerSnapshot }) {
  const { snapshot, error, refreshing, refresh } = useStatus(initial);
  const pct = snapshot.maxPlayers > 0 ? Math.min(100, (snapshot.playersOnline / snapshot.maxPlayers) * 100) : 0;
  const updated = new Date(snapshot.lastUpdated).toISOString().slice(11, 19);

  return (
    <section className="panel grain overflow-hidden" aria-labelledby="live-status-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="live-dot" data-offline={!snapshot.online} />
          <h2 id="live-status-title" className="text-[0.66rem] font-bold uppercase tracking-[0.22em] text-parchment">
            Live network
          </h2>
          <span className={cx("badge", snapshot.online ? "badge-moss" : "badge-ember")}>
            {snapshot.online ? "Online" : snapshot.stale ? "No heartbeat" : "Offline"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[0.66rem] text-muted">
          <span className="hidden sm:inline">Sync {updated} UTC</span>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 transition hover:border-line-bright hover:text-parchment"
            aria-label="Refresh server status"
          >
            <RefreshCw className={cx("size-3", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.15fr_1fr]">
        <div className="border-b border-line/70 p-5 md:border-b-0 md:border-r">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted">
            Players online
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <AnimatedNumber
              value={snapshot.playersOnline}
              className="font-display text-5xl tabular-nums text-parchment"
            />
            <span className="font-mono text-sm text-muted">/ {snapshot.maxPlayers || "—"}</span>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-soft">
            <div
              className="h-full rounded-full bg-gradient-to-r from-moss-deep via-moss to-moss-bright transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-sm bg-sky" /> Java{" "}
              <strong className="font-semibold text-parchment">{snapshot.javaPlayers}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-sm bg-moss-bright" /> Bedrock{" "}
              <strong className="font-semibold text-parchment">{snapshot.bedrockPlayers}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="size-3" /> TPS {snapshot.tps ?? "—"}
            </span>
          </div>

          <p className="mt-4 line-clamp-2 text-sm italic text-parchment-dim">
            {snapshot.motd || (snapshot.online ? "No MOTD broadcast." : "Server unreachable right now.")}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-px bg-line/40">
          <Metric label="Version" value={snapshot.version} icon={<Signal className="size-3.5" />} />
          <Metric label="Uptime" value={formatUptime(snapshot.uptimeSeconds)} icon={<Activity className="size-3.5" />} />
          <Metric
            label="Address"
            value={`${snapshot.host}:${snapshot.port}`}
            icon={<Users className="size-3.5" />}
            mono
          />
          <Metric
            label="Bedrock"
            value={`${snapshot.host}:${snapshot.bedrockPort}`}
            icon={<Users className="size-3.5" />}
            mono
          />
        </dl>
      </div>

      {!snapshot.online ? (
        <div className="flex items-start gap-2.5 border-t border-line/70 bg-ember/[0.04] px-5 py-3 text-xs text-parchment-dim">
          <WifiOff className="mt-0.5 size-3.5 shrink-0 text-ember" />
          <p>
            The website is showing the last known state. Player counts are only displayed when
            KIBAOFFICIALCore has sent a heartbeat in the last 90 seconds.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="border-t border-line/70 px-5 py-2 text-xs text-ember">
          Live connection interrupted — retrying automatically.
        </div>
      ) : null}
    </section>
  );
}

function Metric({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="bg-surface/40 px-5 py-4">
      <dt className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">
        {icon} {label}
      </dt>
      <dd className={cx("mt-1.5 truncate text-sm text-parchment", mono && "font-mono text-[0.78rem]")}>
        {value}
      </dd>
    </div>
  );
}

export function LivePlayerCount({ initial }: { initial: ServerSnapshot }) {
  const { snapshot } = useStatus(initial);

  if (!snapshot.online) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <span className="live-dot" data-offline="true" />
        {snapshot.stale ? "Server heartbeat lost" : "Server offline"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-parchment-dim">
      <span className="live-dot" />
      <AnimatedNumber value={snapshot.playersOnline} className="text-moss-bright" /> players online
    </span>
  );
}
