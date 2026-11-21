"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";

type Result = { redirect: string; emailSent: boolean; devVerifyUrl?: string };

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    try {
      const data = await api<Result>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: String(form.get("username") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          confirmPassword: String(form.get("confirmPassword") ?? ""),
          acceptRules: form.get("acceptRules") === "on",
        }),
      });
      setResult(data);
      router.refresh();
      if (!data.devVerifyUrl) {
        router.push("/dashboard");
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setError("Unable to create your account right now.");
      }
      setPending(false);
    }
  }

  if (result?.devVerifyUrl) {
    return (
      <div className="space-y-5">
        <div className="panel p-5">
          <h2 className="font-display text-xl">Account created</h2>
          <p className="mt-2 text-sm text-muted">
            Email delivery is not configured on this environment. Use this development link to
            verify your account — it is never shown in production.
          </p>
          <Link
            href={result.devVerifyUrl}
            className="mt-3 block break-all rounded-md border border-line bg-ink/60 p-3 font-mono text-xs text-moss-bright hover:border-moss/40"
          >
            {result.devVerifyUrl}
          </Link>
        </div>
        <Link href="/dashboard" className="btn btn-primary btn-block">
          Continue to dashboard
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Username" htmlFor="username" error={fieldErrors.username} hint="3–20 characters.">
          <Input
            id="username"
            name="username"
            autoComplete="username"
            placeholder="EmberFox"
            required
            aria-invalid={Boolean(fieldErrors.username)}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-invalid={Boolean(fieldErrors.email)}
          />
        </Field>
      </div>

      <Field label="Password" htmlFor="password" error={fieldErrors.password} hint="At least 10 characters with a letter and a number.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••"
          required
          aria-invalid={Boolean(fieldErrors.password)}
        />
      </Field>

      <Field label="Confirm password" htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••"
          required
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
        />
      </Field>

      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-muted">
        <input
          type="checkbox"
          name="acceptRules"
          required
          className="mt-0.5 size-3.5 rounded border-line bg-ink accent-[#6fae7b]"
        />
        <span>
          I accept the{" "}
          <Link href="/rules" className="text-parchment underline underline-offset-2">
            server rules
          </Link>{" "}
          and understand that cracked accounts are supported through server-side verification.
        </span>
      </label>
      {fieldErrors.acceptRules ? <p className="field-error">{fieldErrors.acceptRules}</p> : null}

      <SubmitButton pending={pending} className="btn-block">
        {pending ? "Creating account" : "Create account"}
      </SubmitButton>

      <p className="text-center text-xs text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-moss hover:text-moss-bright">
          Sign in
        </Link>
      </p>
    </form>
  );
}
