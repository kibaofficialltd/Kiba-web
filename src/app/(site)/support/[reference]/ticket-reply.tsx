"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";

export function TicketReply({
  reference,
  closed,
}: {
  reference: string;
  closed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    try {
      await api(`/api/support/tickets/${reference}`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not send the reply.");
    } finally {
      setPending(false);
    }
  }

  if (closed) {
    return (
      <p className="rounded-lg border border-line bg-ink/40 p-3 text-xs text-muted">
        This ticket is {closed ? "closed" : "open"}. Open a new ticket if you need more help.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FormAlert message={error} />
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        placeholder="Add a reply…"
        aria-label="Reply"
      />
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending || !body.trim()}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          Send reply
        </button>
      </div>
    </form>
  );
}
