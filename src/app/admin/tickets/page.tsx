import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { getAdminTickets } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { cx } from "@/lib/cx";

export const dynamic = "force-dynamic";

const filters = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const tone: Record<string, "moss" | "gold" | "sky" | "default" | "ember"> = {
  open: "moss",
  pending: "gold",
  resolved: "sky",
  closed: "default",
  high: "ember",
  urgent: "ember",
};

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const tickets = await getAdminTickets(status);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Support</p>
          <h1 className="display-md">Tickets.</h1>
          <p className="mt-1 text-sm text-muted">
            Newest activity first. Replies and status changes notify the player and are written to the
            audit log.
          </p>
        </div>
        <Badge tone="moss">
          <LifeBuoy className="size-3" /> {tickets.length} visible
        </Badge>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {filters.map((filter) => (
          <Link
            key={filter.value || "all"}
            href={filter.value ? `/admin/tickets?status=${filter.value}` : "/admin/tickets"}
            className={cx(
              "rounded-full border px-3 py-1 text-xs transition",
              (status ?? "") === filter.value
                ? "border-gold/30 bg-gold/[0.08] text-parchment"
                : "border-line text-muted hover:text-parchment",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <section className="panel overflow-hidden">
        {tickets.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted">No tickets in this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Player</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Updated</th>
                  <th className="text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <p className="font-semibold text-parchment">{ticket.subject}</p>
                      <p className="font-mono text-[0.6rem] text-muted">
                        {ticket.reference} · {ticket.category}
                      </p>
                    </td>
                    <td className="text-xs text-parchment-dim">{ticket.username}</td>
                    <td>
                      <Badge tone={tone[ticket.status] ?? "default"}>{ticket.status}</Badge>
                    </td>
                    <td>
                      <Badge tone={tone[ticket.priority] ?? "default"}>{ticket.priority}</Badge>
                    </td>
                    <td className="whitespace-nowrap text-xs text-muted">
                      {formatDateTime(ticket.updatedAt)}
                    </td>
                    <td className="text-right">
                      <Link href={`/admin/tickets/${ticket.reference}`} className="btn btn-quiet btn-sm">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
