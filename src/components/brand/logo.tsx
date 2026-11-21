import { cx } from "@/lib/cx";

const wordmark = {
  full: "KIBA",
  accent: "OFFICIAL",
  sub: "SURVIVAL NETWORK",
};

export function Crest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={cx("shrink-0", className)}
      fill="none"
    >
      <defs>
        <linearGradient id="crest-stroke" x1="6" y1="4" x2="34" y2="37">
          <stop stopColor="#e8ce8a" />
          <stop offset="1" stopColor="#6fae7b" />
        </linearGradient>
        <linearGradient id="crest-fill" x1="20" y1="6" x2="20" y2="35">
          <stop stopColor="#1a2a20" />
          <stop offset="1" stopColor="#0a120e" />
        </linearGradient>
      </defs>
      <path
        d="M20 1.8 36.8 10.6v18.8L20 38.2 3.2 29.4V10.6Z"
        fill="url(#crest-fill)"
        stroke="url(#crest-stroke)"
        strokeWidth="1.1"
      />
      <path
        d="M20 6.6 32.4 13.3v13.4L20 33.4 7.6 26.7V13.3Z"
        stroke="rgba(233,228,216,0.16)"
        strokeWidth="0.8"
      />
      <path d="M15.2 12.6h3.4v5.8l5.6-5.8h4.4l-6.6 6.6 7 7.2h-4.5l-5.9-6v6h-3.4Z" fill="#e9e4d8" />
      <path d="M20 1.8 36.8 10.6 20 19.4 3.2 10.6Z" fill="rgba(201,169,97,0.08)" />
    </svg>
  );
}

export function Logo({
  src,
  className,
  imgClassName,
  showSub = true,
}: {
  src?: string | null;
  className?: string;
  imgClassName?: string;
  showSub?: boolean;
}) {
  if (src) {
    return (
      <span className={cx("inline-flex items-center", className)}>
        {/* User-supplied logo: plain img keeps the slot dependency-free. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="KIBAOFFICIAL SMP"
          className={cx(
            "h-10 sm:h-11 w-auto max-h-full max-w-full object-contain filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.22)] transition-all duration-200",
            imgClassName
          )}
        />
      </span>
    );
  }

  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <Crest className="size-9" />
      <span className="flex flex-col justify-center leading-none">
        <span className="font-display text-[1.02rem] font-semibold tracking-[0.13em] text-parchment">
          {wordmark.full}
          <span className="text-moss-bright">{wordmark.accent}</span>
        </span>
        {showSub ? (
          <span className="mt-1.5 text-[0.47rem] font-bold tracking-[0.36em] text-muted">
            {wordmark.sub}
          </span>
        ) : null}
      </span>
    </span>
  );
}
