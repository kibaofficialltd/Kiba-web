import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: `${site.name} ${site.suffix} — Your Adventure. Your Legacy.`,
    template: `%s · ${site.name} ${site.suffix}`,
  },
  description: site.description,
  applicationName: `${site.name} ${site.suffix}`,
  keywords: [
    "Minecraft server",
    "KIBAOFFICIAL",
    "SMP",
    "cracked Minecraft",
    "Bedrock",
    "Java",
    "survival server",
    "Minecraft India",
  ],
  openGraph: {
    type: "website",
    siteName: `${site.name} ${site.suffix}`,
    title: `${site.name} ${site.suffix}`,
    description: site.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} ${site.suffix}`,
    description: site.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#060a08",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
