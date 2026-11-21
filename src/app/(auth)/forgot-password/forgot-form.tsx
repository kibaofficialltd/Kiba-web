"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";

export function ForgotForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const result = await api<{ sent: boolean; devResetUrl?: string }>(
        "/api/auth/forgot-password",
        { method: "POST", body: JSON.stringify({ email: String(form.get("email") ?? "") }) },
      );
      setSent(true);
      setDevUrl(result.devResetUrl ?? null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to send the reset link.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <FormAlert
          tone="success"
          message="If an account exists for that email, a reset link is on its way."
        />
        {devUrl ? (
          <div className="panel p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">
              Development link
            </p>
            <Link href={devUrl} className="mt-2 block break-all font-mono text-xs text-moss-bright">
              {devUrl}
            </Link>
          </div>
        ) : null}
        <Link href="/login" className="btn btn-ghost btn-block">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert message={error} />
      <Field label="Account email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </Field>
      <SubmitButton pending={pending} className="btn-block">
        {pending ? "Sending" : "Send reset link"}
      </SubmitButton>
      <p className="text-center text-xs text-muted">
        <Link href="/login" className="hover:text-parchment">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
