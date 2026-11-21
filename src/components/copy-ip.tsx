"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cx } from "@/lib/cx";

export function CopyIp({
  value,
  label,
  variant = "primary",
  size = "md",
  className,
  showValue = false,
}: {
  value: string;
  label?: string;
  variant?: "primary" | "gold" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  showValue?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const el = document.createElement("textarea");
        el.value = value;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cx(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "gold" && "btn-gold",
        variant === "ghost" && "btn-ghost",
        size === "sm" && "btn-sm",
        size === "lg" && "btn-lg",
        copied && "copied-flash",
        className,
      )}
      aria-live="polite"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      <span>{copied ? "Copied to clipboard" : label ?? "Copy server IP"}</span>
      {showValue ? (
        <span className="ml-1 hidden rounded bg-black/25 px-1.5 py-0.5 font-mono text-[0.72rem] tracking-tight sm:inline">
          {value}
        </span>
      ) : null}
    </button>
  );
}
