"use client";

import { useMemo, useState } from "react";
import {
  extractGuideImages,
  GuideGalleryOverview,
  GuideImageFigure,
  GuideLightboxModal,
} from "./guide-image-viewer";

export function GuideContentView({ content }: { content: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const images = useMemo(() => extractGuideImages(content), [content]);

  // Image lookup map by src
  const imageIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    images.forEach((img) => {
      map.set(img.src, img.index);
    });
    return map;
  }, [images]);

  const parsedElements = useMemo(() => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let orderedItems: string[] = [];
    let quoteLines: string[] = [];

    function flushAll() {
      if (listItems.length > 0) {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            className="my-3 space-y-2 pl-5 list-disc text-parchment-dim text-sm sm:text-base leading-relaxed"
          >
            {listItems.map((item, idx) => (
              <li key={idx}>{parseInlineText(item)}</li>
            ))}
          </ul>,
        );
        listItems = [];
      }
      if (orderedItems.length > 0) {
        elements.push(
          <ol
            key={`ol-${elements.length}`}
            className="my-3 space-y-2 pl-5 list-decimal text-parchment-dim text-sm sm:text-base leading-relaxed"
          >
            {orderedItems.map((item, idx) => (
              <li key={idx}>{parseInlineText(item)}</li>
            ))}
          </ol>,
        );
        orderedItems = [];
      }
      if (quoteLines.length > 0) {
        elements.push(
          <blockquote
            key={`quote-${elements.length}`}
            className="my-4 rounded-xl border-l-4 border-gold bg-gold/10 p-4 text-parchment-dim text-sm sm:text-base italic leading-relaxed"
          >
            {quoteLines.map((qLine, qIdx) => (
              <p key={qIdx} className={qIdx > 0 ? "mt-2" : ""}>
                {parseInlineText(qLine)}
              </p>
            ))}
          </blockquote>,
        );
        quoteLines = [];
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();

      if (!line) {
        flushAll();
        continue;
      }

      // Horizontal rule
      if (line === "---" || line === "***" || line === "___") {
        flushAll();
        elements.push(<hr key={`hr-${i}`} className="my-6 border-line/60" />);
        continue;
      }

      // Markdown Image: ![alt](url)
      const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        flushAll();
        const alt = imgMatch[1];
        const src = imgMatch[2];
        const currentImgIndex = imageIndexMap.get(src) ?? 0;

        elements.push(
          <GuideImageFigure
            key={`img-${i}`}
            src={src}
            alt={alt}
            index={currentImgIndex}
            total={images.length}
            onOpenLightbox={(idx) => setLightboxIndex(idx)}
          />,
        );
        continue;
      }

      // Blockquote: > text
      if (line.startsWith("> ")) {
        if (listItems.length > 0 || orderedItems.length > 0) flushAll();
        quoteLines.push(line.slice(2));
        continue;
      }

      // Unordered list item: - text or * text
      if (line.startsWith("- ") || line.startsWith("* ")) {
        if (orderedItems.length > 0 || quoteLines.length > 0) flushAll();
        listItems.push(line.slice(2));
        continue;
      }

      // Ordered list item: 1. text
      const numMatch = line.match(/^[0-9]+\.\s+(.*)$/);
      if (numMatch) {
        if (listItems.length > 0 || quoteLines.length > 0) flushAll();
        orderedItems.push(numMatch[1]);
        continue;
      }

      flushAll();

      // Headings
      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={i} className="font-display text-lg sm:text-xl font-bold text-parchment mt-6 mb-2">
            {parseInlineText(line.slice(4))}
          </h3>,
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={i}
            className="font-display text-xl sm:text-2xl font-bold text-gold-bright mt-8 mb-3 border-b border-line/60 pb-2 flex items-center gap-2"
          >
            {parseInlineText(line.slice(3))}
          </h2>,
        );
      } else if (line.startsWith("# ")) {
        elements.push(
          <h2
            key={i}
            className="font-display text-2xl sm:text-3xl font-extrabold text-parchment mt-6 mb-3"
          >
            {parseInlineText(line.slice(2))}
          </h2>,
        );
      } else {
        // Paragraph
        elements.push(
          <p key={i} className="text-sm sm:text-base text-parchment-dim leading-relaxed my-2.5">
            {parseInlineText(line)}
          </p>,
        );
      }
    }

    flushAll();
    return elements;
  }, [content, imageIndexMap, images.length]);

  return (
    <div className="space-y-6">
      {/* Visual Guide Gallery Strip (if guide has 2+ images) */}
      <GuideGalleryOverview
        images={images}
        onOpenLightbox={(idx) => setLightboxIndex(idx)}
      />

      {/* Main article content with interactive images */}
      <div className="prose-kiba space-y-1">{parsedElements}</div>

      {/* Lightbox Modal */}
      <GuideLightboxModal
        images={images}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onSelectIndex={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
}

function parseInlineText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-gold/15 px-1.5 py-0.5 font-mono text-[0.85em] text-gold-bright border border-gold/30"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-bold text-parchment">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            className="text-gold hover:text-gold-bright underline underline-offset-2 transition font-medium"
            target={linkMatch[2].startsWith("http") ? "_blank" : undefined}
            rel={linkMatch[2].startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {linkMatch[1]}
          </a>,
        );
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
