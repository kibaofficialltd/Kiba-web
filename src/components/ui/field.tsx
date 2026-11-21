import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("input", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx("select", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("textarea", className)} {...props} />;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  name,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  name?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span>
        <span className="block text-sm font-semibold text-parchment">{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-muted">{description}</span> : null}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full border border-line bg-ink-soft transition peer-checked:border-moss/60 peer-checked:bg-moss-deep" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-parchment/70 transition peer-checked:translate-x-5 peer-checked:bg-moss-bright" />
      </span>
    </label>
  );
}
