"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";

export function FormAlert({ message, tone = "error" }: { message?: string | null; tone?: "error" | "success" }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={
        tone === "error"
          ? "flex items-start gap-2 rounded-lg border border-ember/30 bg-ember/10 px-3 py-2.5 text-sm text-[#f0a49d]"
          : "flex items-start gap-2 rounded-lg border border-moss/30 bg-moss/10 px-3 py-2.5 text-sm text-moss-bright"
      }
    >
      {tone === "error" ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending} className={className} {...props}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={className ?? "size-4 animate-spin"} />;
}
