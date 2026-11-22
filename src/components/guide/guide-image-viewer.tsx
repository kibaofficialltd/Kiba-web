"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Images,
  Maximize2,
  X,
  ZoomIn,
} from "lucide-react";

export type GuideImage = {
  src: string;
  alt: string;
  index: number;
};

/**
 * Extracts all markdown images `![alt](url)` from the content string in order.
 */
export function extractGuideImages(content: string): GuideImage[] {
  const images: GuideImage[] = [];
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(content)) !== null) {
    images.push({
      alt: match[1] || `Screenshot ${idx + 1}`,
      src: match[2],
      index: idx,
    });
    idx++;
  }

  return images;
}

/**
 * Interactive Guide Image Figure with click-to-zoom Lightbox trigger.
 */
export function GuideImageFigure({
  src,
  alt,
  index,
  total,
  onOpenLightbox,
}: {
  src: string;
  alt: string;
  index: number;
  total: number;
  onOpenLightbox: (index: number) => void;
}) {
  return (
    <figure className="group relative my-6 overflow-hidden rounded-2xl border border-line/80 bg-ink-raised/60 shadow-2xl transition hover:border-gold/50">
      <div
        onClick={() => onOpenLightbox(index)}
        className="relative cursor-zoom-in overflow-hidden bg-ink"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpenLightbox(index);
        }}
        aria-label={`Enlarge image: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || "Guide illustration"}
          className="w-full h-auto object-contain max-h-[540px] transition-transform duration-300 group-hover:scale-[1.01]"
          loading="lazy"
        />

        {/* Hover zoom badge */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-medium text-parchment backdrop-blur-md opacity-80 group-hover:opacity-100 transition border border-line/60">
          <ZoomIn className="size-3 text-gold" />
          <span className="hidden sm:inline">Click to enlarge</span>
          {total > 1 ? (
            <span className="text-[0.65rem] text-muted font-mono ml-1">
              {index + 1}/{total}
            </span>
          ) : null}
        </div>
      </div>

      {alt ? (
        <figcaption className="flex items-center justify-between gap-2 p-3 text-xs font-semibold text-gold-bright bg-ink/90 border-t border-line/60">
          <span className="truncate">{alt}</span>
          <button
            type="button"
            onClick={() => onOpenLightbox(index)}
            className="shrink-0 text-[0.68rem] text-muted hover:text-gold flex items-center gap-1 transition"
          >
            <Maximize2 className="size-3" /> Full size
          </button>
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * Interactive Lightbox Modal for viewing any guide image in full resolution.
 */
export function GuideLightboxModal({
  images,
  currentIndex,
  onClose,
  onSelectIndex,
}: {
  images: GuideImage[];
  currentIndex: number | null;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}) {
  useEffect(() => {
    if (currentIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") {
        onSelectIndex((currentIndex! - 1 + images.length) % images.length);
      } else if (e.key === "ArrowRight") {
        onSelectIndex((currentIndex! + 1) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [currentIndex, images.length, onClose, onSelectIndex]);

  if (currentIndex === null || !images[currentIndex]) return null;

  const current = images[currentIndex];
  const hasPrev = images.length > 1;
  const hasNext = images.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="flex w-full max-w-6xl items-center justify-between text-parchment"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-gold-bright border border-gold/40">
            {currentIndex + 1} of {images.length}
          </span>
          <p className="max-w-md sm:max-w-xl truncate text-xs sm:text-sm font-medium text-parchment-dim">
            {current.alt}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={current.src}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full p-2 text-muted hover:text-parchment hover:bg-white/10 transition"
            title="Open raw image in new tab"
          >
            <ExternalLink className="size-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:text-parchment hover:bg-white/10 transition"
            aria-label="Close image viewer"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Main Image Display Area with Prev/Next Controls */}
      <div
        className="relative flex w-full max-w-6xl flex-1 items-center justify-center py-4"
        onClick={(e) => e.stopPropagation()}
      >
        {hasPrev && (
          <button
            type="button"
            onClick={() => onSelectIndex((currentIndex - 1 + images.length) % images.length)}
            className="absolute left-2 sm:left-4 z-10 rounded-full bg-black/60 p-3 text-parchment hover:bg-gold hover:text-ink transition border border-line backdrop-blur shadow-lg"
            aria-label="Previous image"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.src}
          alt={current.alt}
          className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-line/40"
        />

        {hasNext && (
          <button
            type="button"
            onClick={() => onSelectIndex((currentIndex + 1) % images.length)}
            className="absolute right-2 sm:right-4 z-10 rounded-full bg-black/60 p-3 text-parchment hover:bg-gold hover:text-ink transition border border-line backdrop-blur shadow-lg"
            aria-label="Next image"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple images) */}
      {images.length > 1 ? (
        <div
          className="flex w-full max-w-4xl items-center justify-center gap-2 overflow-x-auto py-2"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectIndex(i)}
              className={`relative size-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === currentIndex
                  ? "border-gold shadow-[0_0_12px_rgba(201,169,97,0.5)] scale-105"
                  : "border-line opacity-50 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Gallery strip component displayed at the top or bottom of a guide
 * showing all images/screenshots in this guide with 1-click enlargement.
 */
export function GuideGalleryOverview({
  images,
  onOpenLightbox,
}: {
  images: GuideImage[];
  onOpenLightbox: (index: number) => void;
}) {
  if (images.length <= 1) return null;

  return (
    <div className="panel my-8 p-5 bg-ink-raised/50 border-gold/30 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-sm text-parchment flex items-center gap-2">
          <Images className="size-4 text-gold" /> Guide Screenshots & Visual Steps ({images.length})
        </h4>
        <span className="text-[0.65rem] text-muted">Click any image to enlarge</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onOpenLightbox(idx)}
            className="group relative aspect-video overflow-hidden rounded-xl border border-line bg-ink hover:border-gold/60 transition shadow-md"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              className="size-full object-cover group-hover:scale-105 transition duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5 opacity-90 group-hover:opacity-100">
              <span className="text-[0.62rem] font-bold text-parchment truncate">
                {idx + 1}. {img.alt.replace(/^Step\s+\d+:\s*/i, "")}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
