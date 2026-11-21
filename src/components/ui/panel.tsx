import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Panel({
  children,
  className,
  interactive,
  flat,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  flat?: boolean;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <Tag
      className={cx(flat ? "panel-flat" : "panel", interactive && "panel-interactive", className)}
    >
      {children}
    </Tag>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <div
      className={cx(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        centered && "md:flex-col md:items-center",
      )}
    >
      <div className={cx("max-w-2xl", centered && "text-center")}>
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h2 className="display-lg text-balance">{title}</h2>
        {description ? (
          <p className={cx("lede mt-4 text-pretty", centered && "mx-auto")}>{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line px-6 py-14 text-center">
      {icon ? <div className="text-muted opacity-60">{icon}</div> : null}
      <h3 className="font-sans text-base font-semibold text-parchment">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: "moss" | "gold" | "plain";
}) {
  return (
    <div className="panel px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
          <p
            className={cx(
              "mt-1.5 font-display text-2xl tabular-nums",
              accent === "gold" ? "text-gold-bright" : accent === "moss" ? "text-moss-bright" : "text-parchment",
            )}
          >
            {value}
          </p>
          {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
        </div>
        {icon ? <div className="text-muted/70">{icon}</div> : null}
      </div>
    </div>
  );
}
