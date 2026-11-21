"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";
import { cx } from "@/lib/cx";

const statuses = ["open", "pending", "resolved", "closed"] as const;

export function TicketConsole({
  reference,
  status,
}: {
  reference: string;
  status: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [statusPending, setStatusPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    setDone(false);
    try {
      await api(`/api/support/tickets/${reference}`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setBody("");
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not send the reply.");
    } finally {
      setPending(false);
    }
  }

  async function setTicketStatus(next: string) {
    setStatusPending(next);
    setError(null);
    try {
      await api(`/api/admin/tickets/${reference}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not update the status.");
    } finally {
      setStatusPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <FormAlert message={error} />
      {done ? <FormAlert tone="success" message="Reply sent to the player." /> : null}

      <div>
        <p className="mb-2 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {statuses.map((value) => (
            <button
              key={value}
              type="button"
              disabled={statusPending !== null || value === status}
              onClick={() => void setTicketStatus(value)}
              className={cx(
                "rounded-full border px-3 py-1 text-xs transition disabled:opacity-60",
                value === status
                  ? "border-moss/40 bg-moss/10 text-moss-bright"
                  : "border-line text-muted hover:text-parchment",
              )}
            >
              {statusPending === value ? <Loader2 className="mr-1 inline size-3 animate-spin" /> : null}
              {value}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={sendReply} className="space-y-2">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          placeholder="Staff reply — the player sees this as a shield-marked message."
          aria-label="Staff reply"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[0.62rem] text-muted">
            <CheckCircle2 className="size-3 text-moss" /> Reply marks the ticket pending.
          </p>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending || !body.trim()}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Send reply
          </button>
        </div>
      </form>
    </div>
  );
}
