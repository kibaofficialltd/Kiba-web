import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

const tones = {
  default: "",
  moss: "badge-moss",
  gold: "badge-gold",
  ember: "badge-ember",
  sky: "badge-sky",
} as const;

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return <span className={cx("badge", tones[tone], className)}>{children}</span>;
}

export function Dot({ tone = "moss" }: { tone?: "moss" | "gold" | "muted" }) {
  const color = tone === "moss" ? "bg-moss-bright" : tone === "gold" ? "bg-gold" : "bg-muted";
  return <span className={cx("inline-block size-1.5 rounded-full", color)} />;
}
