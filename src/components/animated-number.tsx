"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  duration = 900,
  className,
  suffix,
}: {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const from = previous.current;
    const to = value;
    previous.current = value;
    if (from === to) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {new Intl.NumberFormat("en-IN").format(display)}
      {suffix ? <span className="ml-1 text-sm font-normal text-muted">{suffix}</span> : null}
    </span>
  );
}
