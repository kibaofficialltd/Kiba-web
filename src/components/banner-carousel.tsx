"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cx } from "@/lib/cx";

export type BannerItem = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  buttonText?: string | null;
  sortOrder?: number;
};

export function BannerCarousel({ banners }: { banners: BannerItem[] }) {
  // If no banners configured, supply a polished fallback banner
  const items: BannerItem[] =
    banners.length > 0
      ? banners
      : [
          {
            id: "default-welcome",
            title: "Welcome to KIBAOFFICIAL SMP",
            subtitle: "Cross-platform survival network for Java, Bedrock and cracked players. Join today!",
            imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80",
            linkUrl: "/store",
            buttonText: "Visit Store",
          },
        ];

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = items.length;

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + total) % total);
  };

  // Autoscroll every 5 seconds (5000ms)
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused]);

  const activeItem = items[current];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-line/80 bg-ink-raised shadow-2xl transition"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Promotional banners"
    >
      {/* 
        Rectangle Ratio: 3:1 on desktop (1920x640px or 1200x400px),
        proportional on mobile with comfortable min-height.
      */}
      <div className="relative aspect-[16/8] sm:aspect-[21/9] lg:aspect-[3/1] min-h-[240px] sm:min-h-[300px] lg:min-h-[360px] w-full overflow-hidden">
        {items.map((item, index) => {
          const isActive = index === current;
          return (
            <div
              key={item.id}
              className={cx(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                isActive ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none",
              )}
            >
              {/* Background image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-full w-full object-cover object-center filter brightness-[0.82] contrast-[1.08] transition-transform duration-1000 ease-out hover:scale-[1.02]"
                loading={index === 0 ? "eager" : "lazy"}
              />

              {/* Dark vignette gradients for high readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent" />

              {/* Banner Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 lg:p-12">
                <div className="max-w-2xl space-y-2 sm:space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold-bright backdrop-blur-md">
                    <Sparkles className="size-3 text-gold" /> Featured Spotlight
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-parchment drop-shadow-md">
                    {item.title}
                  </h2>

                  {item.subtitle ? (
                    <p className="line-clamp-2 text-xs sm:text-sm text-parchment-dim drop-shadow">
                      {item.subtitle}
                    </p>
                  ) : null}

                  {item.linkUrl ? (
                    <div className="pt-2">
                      <Link
                        href={item.linkUrl}
                        className="btn btn-gold btn-sm sm:btn-md inline-flex items-center gap-2 shadow-lg"
                      >
                        {item.buttonText || "Learn more"}
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation arrows (shown if multiple banners exist) */}
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous banner"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-10 items-center justify-center rounded-full border border-line/80 bg-ink/70 text-parchment backdrop-blur-md transition hover:bg-gold hover:text-ink hover:border-gold/60 focus:outline-none"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next banner"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex size-9 sm:size-10 items-center justify-center rounded-full border border-line/80 bg-ink/70 text-parchment backdrop-blur-md transition hover:bg-gold hover:text-ink hover:border-gold/60 focus:outline-none"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Pagination dots */}
            <div className="absolute bottom-3 right-4 sm:bottom-6 sm:right-8 z-20 flex items-center gap-1.5 sm:gap-2 rounded-full border border-line/60 bg-ink/60 px-3 py-1.5 backdrop-blur-md">
              {items.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrent(dotIdx)}
                  aria-label={`Go to banner ${dotIdx + 1}`}
                  className={cx(
                    "h-1.5 rounded-full transition-all duration-300",
                    dotIdx === current
                      ? "w-6 bg-gold shadow-[0_0_8px_rgba(201,169,97,0.8)]"
                      : "w-2 bg-parchment/30 hover:bg-parchment/60",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
