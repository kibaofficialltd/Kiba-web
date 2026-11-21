import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTicketThread } from "@/lib/support";
import { ticketCategories } from "@/lib/ticket-categories";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { cx } from "@/lib/cx";
import { TicketConsole } from "./ticket-console";

export const dynamic = "force-dynamic";

export default async function AdminTicketPage({ params }: { params: Promise<{ reference: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { reference } = await params;
  const thread = await getTicketThread(reference, { userId: user.id, staff: true });
  if (!thread) notFound();

  const categoryLabel =
    ticketCategories.find((category) => category.value === thread.category)?.label ?? thread.category;

  return (
    <div className="space-y-5">
      <Link
        href="/admin/tickets"
        className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-parchment"
      >
        <ArrowLeft className="size-3.5" /> All tickets
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="default">{categoryLabel}</Badge>
          <Badge
            tone={
              thread.status === "open"
                ? "moss"
                : thread.status === "pending"
                  ? "gold"
                  : thread.status === "resolved"
                    ? "sky"
                    : "default"
            }
          >
            {thread.status}
          </Badge>
          {thread.priority === "high" || thread.priority === "urgent" ? (
            <Badge tone="ember">{thread.priority} priority</Badge>
          ) : null}
        </div>
        <h1 className="display-md mt-3 text-balance">{thread.subject}</h1>
        <p className="mt-1 font-mono text-xs text-muted">
          {thread.reference} · opened {formatDateTime(thread.createdAt)} · updated{" "}
          {formatDateTime(thread.updatedAt)}
        </p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-3">
          {thread.messages.map((message) => (
            <article
              key={message.id}
              className={cx(
                "rounded-xl border p-4",
                message.isStaff ? "border-moss/30 bg-moss/[0.05]" : "border-line bg-ink-soft/60",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-parchment">
                  {message.isStaff ? <ShieldCheck className="size-3.5 text-moss" /> : null}
                  {message.isStaff ? "KIBA staff" : (message.author ?? "Player")}
                </p>
                <p className="text-[0.62rem] text-muted">{formatDateTime(message.createdAt)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-parchment-dim">
                {message.body}
              </p>
            </article>
          ))}
        </section>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <div className="panel p-5">
            <h2 className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
              Staff console
            </h2>
            <div className="mt-3">
              <TicketConsole reference={thread.reference} status={thread.status} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
