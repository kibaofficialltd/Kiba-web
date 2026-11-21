"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2, Send } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";
import { ticketCategories } from "@/lib/ticket-categories";

export function TicketForm({ signedIn, verified }: { signedIn: boolean; verified: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    try {
      const data = await api<{ ticket: { reference: string } }>("/api/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: String(form.get("subject") ?? ""),
          category: String(form.get("category") ?? "general"),
          message: String(form.get("message") ?? ""),
        }),
      });
      router.push(`/support/${data.ticket.reference}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else setError("Could not open the ticket.");
      setPending(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="rounded-xl border border-line bg-ink/40 p-5">
        <p className="font-display text-base">Sign in to open a ticket</p>
        <p className="mt-1 text-xs text-muted">
          Tickets are tied to your portal account so staff can see your linked profile, orders and
          reward history.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/login?next=/support" className="btn btn-primary btn-sm">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-ghost btn-sm">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  if (!verified) {
    return (
      <FormAlert message="Verify your email address before opening a ticket. You can resend the verification link from Account settings." />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject" htmlFor="subject" error={fieldErrors.subject}>
          <Input id="subject" name="subject" placeholder="Lost a purchase after unlinking" required />
        </Field>
        <Field label="Category" htmlFor="category" error={fieldErrors.category}>
          <Select id="category" name="category" defaultValue="general">
            {ticketCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="What happened?"
        htmlFor="message"
        error={fieldErrors.message}
        hint="Include your in-game name, dates and any order or ticket references."
      >
        <Textarea id="message" name="message" rows={6} placeholder="Describe the issue…" required />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.66rem] text-muted">Typical first response: under 48 hours.</p>
        <SubmitButton pending={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {pending ? "Opening" : "Open ticket"}
        </SubmitButton>
      </div>
    </form>
  );
}
