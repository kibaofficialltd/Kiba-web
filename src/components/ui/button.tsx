import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

type Variant = "primary" | "gold" | "ghost" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  gold: "btn-gold",
  ghost: "btn-ghost",
  quiet: "btn-quiet",
  danger: "btn-danger",
};

const sizes: Record<Size, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

type CommonProps = {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx("btn", variants[variant], sizes[size], block && "btn-block", className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  external,
  prefetch,
}: CommonProps & { href: string; external?: boolean; prefetch?: boolean }) {
  const classes = cx("btn", variants[variant], sizes[size], block && "btn-block", className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={prefetch} className={classes}>
      {children}
    </Link>
  );
}
