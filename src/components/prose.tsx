import type { ReactNode } from "react";

/**
 * Minimal, dependency-free Markdown renderer for editorial content.
 * It deliberately supports a small subset (headings, lists, quotes, bold,
 * inline code, links) and never injects raw HTML.
 */
export function Prose({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);

  return (
    <div className="prose-kiba">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("### ")) {
          return <h3 key={index}>{inline(trimmed.slice(4))}</h3>;
        }
        if (trimmed.startsWith("## ")) {
          return <h2 key={index}>{inline(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith("# ")) {
          return <h2 key={index}>{inline(trimmed.slice(2))}</h2>;
        }
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote key={index}>
              {inline(trimmed.replace(/^>\s?/gm, ""))}
            </blockquote>
          );
        }
        if (/^[-*] /m.test(trimmed)) {
          const items = trimmed
            .split("\n")
            .filter((line) => /^[-*] /.test(line.trim()))
            .map((line) => line.trim().replace(/^[-*] /, ""));
          return (
            <ul key={index}>
              {items.map((item, itemIndex) => (
                <li key={itemIndex}>{inline(item)}</li>
              ))}
            </ul>
          );
        }
        if (/^\d+\. /m.test(trimmed)) {
          const items = trimmed
            .split("\n")
            .filter((line) => /^\d+\. /.test(line.trim()))
            .map((line) => line.trim().replace(/^\d+\. /, ""));
          return (
            <ol key={index} className="list-decimal">
              {items.map((item, itemIndex) => (
                <li key={itemIndex}>{inline(item)}</li>
              ))}
            </ol>
          );
        }

        return <p key={index}>{inline(trimmed.replace(/\n/g, " "))}</p>;
      })}
    </div>
  );
}

function inline(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);

  return tokens.map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return <code key={index}>{token.slice(1, -1)}</code>;
    }
    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2]!;
      const safe = href.startsWith("/") || href.startsWith("https://") || href.startsWith("http://");
      if (!safe) return <span key={index}>{link[1]}</span>;
      return (
        <a key={index} href={href} rel="noopener noreferrer">
          {link[1]}
        </a>
      );
    }
    return <span key={index}>{token}</span>;
  });
}
