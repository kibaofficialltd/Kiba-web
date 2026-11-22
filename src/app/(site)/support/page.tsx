import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, MessageCircle, ShieldQuestion, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { getTicketsForUser } from "@/lib/support";
import { formatDateTime } from "@/lib/format";
import { TicketForm } from "./ticket-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with KIBAOFFICIAL SMP — account access, Minecraft linking, store purchases, rewards, reports and appeals.",
  alternates: { canonical: "/support" },
};

const faqs = [
  {
    question: "How do I link my Minecraft account?",
    answer:
      "Sign in, open Dashboard → Minecraft linking, generate a one-time code and run /link CODE in-game. The core plugin resolves your UUID and confirms it to the website. Codes expire after 15 minutes.",
  },
  {
    question: "I bought an item but did not receive it.",
    answer:
      "Check Dashboard → My purchases. If the item is queued or processing, KIBAOFFICIALCore has not applied it yet — join the server or wait for the next delivery poll. If it has failed, open a ticket with the order reference and it will be re-queued.",
  },
  {
    question: "Can I buy coins with real money?",
    answer:
      "No. Coins exist only through play, daily rewards, the daily spin and events. There is no payment gateway anywhere on this site.",
  },
  {
    question: "I play on Bedrock. Can I link?",
    answer:
      "Yes. Join with the Bedrock address, then run /link CODE in chat. Floodgate forwards your XUID and the plugin records the Bedrock edition automatically.",
  },
  {
    question: "I changed my Minecraft username.",
    answer:
      "That is fine — linking is by UUID, not name. Your profile name updates the next time the plugin syncs.",
  },
  {
    question: "How do I appeal a ban?",
    answer:
      "Open a ticket with the appeal category. Include your in-game name, the date and any evidence. Appeals are reviewed by a different staff member where possible.",
  },
];

export default async function SupportPage() {
  const user = await getCurrentUser();
  const tickets = user ? await getTicketsForUser(user.id) : [];

  return (
    <div className="container-x py-10 sm:py-14">
      <header className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <Badge tone="moss">
            <MessageCircle className="size-3" /> Support centre
          </Badge>
          <h1 className="display-xl mt-4">Something not working?</h1>
          <p className="lede mt-3">
            Real people read these tickets. Start with the quick answers below — if that does not
            solve it, open a ticket and include as much detail as you can.
          </p>
        </div>
        <div className="flex gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Timer className="size-3.5" /> Under 48h response
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldQuestion className="size-3.5" /> Staff-reviewed
          </span>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="panel p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <BookOpen className="size-4 text-moss" /> Quick answers
            </h2>
            <div className="mt-4 divide-y divide-line/60">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-parchment marker:content-none">
                    {faq.question}
                    <span className="text-muted transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="panel p-5 sm:p-6">
            <h2 className="font-display text-xl">Open a ticket</h2>
            <p className="mt-1 text-xs text-muted">
              One issue per ticket, please. Abuse of the support system can lead to restrictions.
            </p>
            <div className="mt-5">
              <TicketForm signedIn={Boolean(user)} verified={true} />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
              <h2 className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
                Your tickets
              </h2>
              {user ? <span className="text-[0.62rem] text-muted">{tickets.length}</span> : null}
            </div>

            {!user ? (
              <div className="p-5 text-sm text-muted">
                <p>Sign in to see your ticket history.</p>
                <Link href="/login?next=/support" className="btn btn-ghost btn-sm mt-3">
                  Sign in <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : tickets.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">No tickets yet.</p>
            ) : (
              <ul className="divide-y divide-line/50">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      href={`/support/${ticket.reference}`}
                      className="block px-4 py-3 transition hover:bg-white/[0.025]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-parchment">
                          {ticket.subject}
                        </span>
                        <span
                          className={
                            ticket.status === "open"
                              ? "shrink-0 text-[0.6rem] uppercase tracking-[0.1em] text-moss-bright"
                              : ticket.status === "pending"
                                ? "shrink-0 text-[0.6rem] uppercase tracking-[0.1em] text-gold"
                                : "shrink-0 text-[0.6rem] uppercase tracking-[0.1em] text-muted"
                          }
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center justify-between font-mono text-[0.62rem] text-muted">
                        <span>{ticket.reference}</span>
                        <span>{formatDateTime(ticket.updatedAt)}</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel p-5 text-xs leading-relaxed text-muted">
            <p className="flex items-center gap-1.5 font-semibold text-parchment-dim">
              <ShieldQuestion className="size-3.5 text-moss" /> Before you open a ticket
            </p>
            <ul className="mt-2 space-y-1.5">
              <li>Check whether the server heartbeat is healthy on the home page.</li>
              <li>For purchase issues, include the order reference from My purchases.</li>
              <li>For link issues, include the exact error you saw in-game.</li>
              <li>Never send your portal password to anyone, including staff.</li>
            </ul>
          </section>

          <div className="panel flex items-center justify-between gap-3 p-4">
            <p className="text-xs text-muted">Prefer live chat?</p>
            <Link href="/community" className="btn btn-ghost btn-sm">
              Discord
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
