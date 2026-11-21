"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, Loader2, MailCheck, Send } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setDone(false);
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: String(form.get("currentPassword") ?? ""),
          newPassword: String(form.get("newPassword") ?? ""),
          confirmPassword: String(form.get("confirmPassword") ?? ""),
        }),
      });
      setDone(true);
      event.currentTarget.reset();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else setError("Could not change the password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert message={error} />
      {done ? (
        <FormAlert
          tone="success"
          message="Password updated. All other sessions have been signed out."
        />
      ) : null}

      <Field label="Current password" htmlFor="currentPassword" error={fieldErrors.currentPassword}>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="newPassword" error={fieldErrors.newPassword} hint="At least 10 characters with a letter and a number.">
          <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required />
        </Field>
        <Field label="Confirm new password" htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        </Field>
      </div>
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
        Update password
      </button>
    </form>
  );
}

export function ResendVerification({ verified }: { verified: boolean }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api<{ sent?: boolean; alreadyVerified?: boolean; devVerifyUrl?: string }>(
        "/api/auth/resend-verification",
        { method: "POST", body: JSON.stringify({}) },
      );
      if (result.alreadyVerified) setMessage("Your email is already verified.");
      else {
        setMessage("Verification email sent. Check your inbox and spam folder.");
        setDevUrl(result.devVerifyUrl ?? null);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not send the verification email.");
    } finally {
      setPending(false);
    }
  }

  if (verified) {
    return (
      <p className="flex items-center gap-2 text-sm text-moss-bright">
        <CheckCircle2 className="size-4" /> Email verified
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <FormAlert message={error} />
      {message ? <FormAlert tone="success" message={message} /> : null}
      {devUrl ? (
        <a href={devUrl} className="block break-all rounded-md border border-line bg-ink/60 p-2 font-mono text-[0.68rem] text-moss-bright">
          {devUrl}
        </a>
      ) : null}
      <button type="button" onClick={send} disabled={pending} className="btn btn-ghost btn-sm">
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
        Resend verification email
      </button>
    </div>
  );
}

export function SignOutEverywhere() {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        setPending(true);
        try {
          await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
          window.location.href = "/";
        } finally {
          setPending(false);
        }
      }}
      disabled={pending}
      className="btn btn-danger btn-sm"
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <MailCheck className="size-3.5" />}
      Sign out of this device
    </button>
  );
}
