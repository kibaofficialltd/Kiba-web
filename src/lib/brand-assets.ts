import fs from "node:fs";
import path from "node:path";

/**
 * Brand asset slots. Drop files into /public/brand and they appear site-wide:
 *   logo.svg | logo.png | logo.webp   -> navigation + footer logo
 *   hero.jpg | hero.png | hero.webp   -> homepage hero background
 *   fonts/fonts.css                   -> replaces the default type stack
 */
export function getBrandAssets() {
  const pub = path.join(process.cwd(), "public");
  const exists = (rel: string) => fs.existsSync(path.join(pub, rel));

  const logoCandidates = [
    process.env.NEXT_PUBLIC_LOGO,
    "brand/logo.svg",
    "brand/logo.png",
    "brand/logo.webp",
    "brand/logo.jpg",
  ].filter((v): v is string => Boolean(v));

  const logo = logoCandidates.find((rel) => exists(rel.replace(/^\//, ""))) ?? null;

  const heroCandidates = ["brand/hero.webp", "brand/hero.jpg", "brand/hero.png"];
  const hero = heroCandidates.find((rel) => exists(rel)) ?? null;

  return {
    logoSrc: logo ? `/${logo.replace(/^\//, "")}` : null,
    heroSrc: hero ? `/${hero}` : null,
    hasCustomFonts: exists("brand/fonts/fonts.css"),
  };
}
