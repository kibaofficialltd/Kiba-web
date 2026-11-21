"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, CheckCheck, CheckCircle2, ExternalLink, Gift, Receipt, Shield, Sparkles } from "lucide-react";
import { api } from "@/lib/http-client";
import { relativeTime } from "@/lib/format";
import { cx } from "@/lib/cx";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

const icons: Record<string, typeof Bell> = {
  reward: Gift,
  purchase: Receipt,
  system: Sparkles,
  security: Shield,
  event: Bell,
};

export function NotificationList({ initial }: { initial: Notification[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [pending, setPending] = useState(false);

  const unread = items.filter((item) => !item.readAt).length;

  async function markAll() {
    setPending(true);
    try {
      await api("/api/notifications", {
        method: "POST",
        body: JSON.stringify({ action: "read_all" }),
      });
      setItems((prev) => prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function markOne(notification: Notification) {
    if (notification.readAt) return;
    setItems((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item)),
    );
    await api("/api/notifications", {
      method: "POST",
      body: JSON.stringify({ action: "read", id: notification.id }),
    }).catch(() => undefined);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="panel p-10 text-center">
        <Bell className="mx-auto size-7 text-muted/40" />
        <p className="mt-2 font-display text-lg">Nothing yet.</p>
        <p className="text-sm text-muted">Link your account and claim a reward to see updates here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">
          {unread > 0 ? `${unread} unread` : "All caught up"}
        </p>
        {unread > 0 ? (
          <button type="button" onClick={markAll} disabled={pending} className="btn btn-ghost btn-sm">
            <CheckCheck className="size-3.5" /> Mark all read
          </button>
        ) : null}
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = icons[item.type] ?? Bell;
          return (
            <li
              key={item.id}
              className={cx(
                "panel p-4 transition",
                !item.readAt && "border-moss/25 bg-moss/[0.03]",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cx(
                    "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
                    item.readAt ? "bg-ink/60 text-muted" : "bg-moss/10 text-moss-bright",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-parchment">{item.title}</p>
                    {!item.readAt ? (
                      <span className="rounded-full bg-moss/20 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-moss-bright">
                        new
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.body}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.62rem] text-muted/70">
                    <span>{relativeTime(item.createdAt)}</span>
                    {item.link ? (
                      <Link
                        href={item.link}
                        onClick={() => void markOne(item)}
                        className="inline-flex items-center gap-1 text-moss transition hover:text-moss-bright"
                      >
                        Open <ExternalLink className="size-2.5" />
                      </Link>
                    ) : null}
                    {!item.readAt ? (
                      <button
                        type="button"
                        onClick={() => void markOne(item)}
                        className="inline-flex items-center gap-1 transition hover:text-parchment"
                      >
                        <CheckCircle2 className="size-2.5" /> Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
