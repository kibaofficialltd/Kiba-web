"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next");
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
      const result = await api<{ redirect: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: String(form.get("identifier") ?? ""),
          password: String(form.get("password") ?? ""),
        }),
      });
      router.push(next && next.startsWith("/") ? next : result.redirect);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setError("Unable to sign in right now. Please try again.");
      }
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {search.get("reset") === "1" ? (
        <FormAlert tone="success" message="Password updated. Sign in with your new password." />
      ) : null}
      {search.get("verified") === "1" ? (
        <FormAlert tone="success" message="Email verified. Welcome to the network." />
      ) : null}
      <FormAlert message={error} />

      <Field label="Email or username" htmlFor="identifier" error={fieldErrors.identifier}>
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          placeholder="you@example.com"
          required
          aria-invalid={Boolean(fieldErrors.identifier)}
        />
      </Field>

      <Field label="Password" htmlFor="password" error={fieldErrors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••"
          required
          aria-invalid={Boolean(fieldErrors.password)}
        />
      </Field>

      <div className="flex items-center justify-between text-xs">
        <Link href="/forgot-password" className="text-muted transition hover:text-parchment">
          Forgot password?
        </Link>
        <Link href="/register" className="text-moss transition hover:text-moss-bright">
          Create account
        </Link>
      </div>

      <SubmitButton pending={pending} className="btn-block">
        {pending ? "Signing in" : "Enter the network"}
      </SubmitButton>
    </form>
  );
}
