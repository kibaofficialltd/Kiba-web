import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getTicketThread } from "@/lib/support";
import { ticketCategories } from "@/lib/ticket-categories";
import { formatDateTime } from "@/lib/format";
import { cx } from "@/lib/cx";
import { TicketReply } from "./ticket-reply";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Support ticket" };

export default async function TicketPage({ params }: { params: Promise<{ reference: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/support");

  const { reference } = await params;
  const thread = await getTicketThread(reference, { userId: user.id, staff: isStaff(user.role) });
  if (!thread) notFound();

  const categoryLabel =
    ticketCategories.find((category) => category.value === thread.category)?.label ?? thread.category;

  return (
    <div className="container-x max-w-4xl py-10 sm:py-14">
      <Link
        href="/support"
        className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-parchment"
      >
        <ArrowLeft className="size-3.5" /> Support centre
      </Link>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
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
            {thread.priority === "high" ? <Badge tone="ember">high priority</Badge> : null}
          </div>
          <h1 className="display-md mt-3 text-balance">{thread.subject}</h1>
          <p className="mt-1 font-mono text-xs text-muted">
            {thread.reference} · opened {formatDateTime(thread.createdAt)}
          </p>
        </div>
      </header>

      <section className="mt-6 space-y-3">
        {thread.messages.map((message) => {
          const mine = !message.isStaff;
          return (
            <article
              key={message.id}
              className={cx(
                "rounded-xl border p-4",
                message.isStaff
                  ? "border-moss/30 bg-moss/[0.05]"
                  : "border-line bg-ink-soft/60",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-parchment">
                  {message.isStaff ? <ShieldCheck className="size-3.5 text-moss" /> : null}
                  {message.isStaff ? "KIBA staff" : mine ? "You" : (message.author ?? "Player")}
                </p>
                <p className="text-[0.62rem] text-muted">{formatDateTime(message.createdAt)}</p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-parchment-dim">
                {message.body}
              </p>
            </article>
          );
        })}
      </section>

      <section className="panel mt-6 p-5">
        <h2 className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
          Reply
        </h2>
        <div className="mt-3">
          <TicketReply
            reference={thread.reference}
            closed={thread.status === "closed" || thread.status === "resolved"}
          />
        </div>
      </section>

      <p className="mt-4 text-center text-[0.66rem] text-muted">
        Staff replies are marked with a shield. Never share passwords or session tokens in a ticket.
      </p>
    </div>
  );
}
