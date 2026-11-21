"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { FormAlert, SubmitButton } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";

export function ResetForm({ token }: { token: string }) {
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
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          password: String(form.get("password") ?? ""),
          confirmPassword: String(form.get("confirmPassword") ?? ""),
        }),
      });
      router.push("/login?reset=1");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else setError("Unable to reset the password.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormAlert message={error} />
      <Field label="New password" htmlFor="password" error={fieldErrors.password} hint="At least 10 characters with a letter and a number.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" error={fieldErrors.confirmPassword}>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton pending={pending} className="btn-block">
        {pending ? "Saving" : "Set new password"}
      </SubmitButton>
    </form>
  );
}
