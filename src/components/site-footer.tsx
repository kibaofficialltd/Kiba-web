import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CopyIp } from "@/components/copy-ip";
import {
  DiscordIcon,
  InstagramIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "@/components/brand/social-icons";
import { site, serverAddress } from "@/lib/site";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/store", label: "Coin store" },
      { href: "/leaderboards", label: "Leaderboards" },
      { href: "/events", label: "Events & giveaways" },
      { href: "/news", label: "News" },
      { href: "/rules", label: "Server rules" },
    ],
  },
  {
    title: "Player",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create account" },
      { href: "/dashboard", label: "Player dashboard" },
      { href: "/dashboard/link", label: "Link Minecraft" },
      { href: "/dashboard/rewards", label: "Daily rewards" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/support", label: "Support centre" },
      { href: "/support/new", label: "Open a ticket" },
      { href: "/community", label: "Community hub" },
      { href: "/support#faq", label: "FAQ" },
    ],
  },
];

export function SiteFooter({ logoSrc }: { logoSrc: string | null }) {
  const socials = [
    { href: site.socials.discord, label: "Discord", Icon: DiscordIcon },
    { href: site.socials.youtube, label: "YouTube", Icon: YoutubeIcon },
    { href: site.socials.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: site.socials.whatsapp, label: "WhatsApp", Icon: WhatsappIcon },
  ];

  return (
    <footer className="relative mt-24 border-t border-line/70">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-radial-[at_50%_0%] from-moss/10 to-transparent" />

      <div className="container-x relative py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo src={logoSrc} imgClassName="h-11 sm:h-12 w-auto" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              A cross-platform survival network built for Java, Bedrock and cracked players.
              One world, one economy, one legacy.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <CopyIp
                value={serverAddress}
                variant="ghost"
                size="sm"
                label={`${serverAddress}`}
              />
              <div className="badge badge-moss">
                <span className="live-dot !size-1.5" data-offline="false" /> Live
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group grid size-10 place-items-center rounded-lg border border-line bg-surface/50 text-muted transition hover:-translate-y-0.5 hover:border-moss/40 hover:text-parchment"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="mb-4 font-sans text-[0.66rem] font-bold uppercase tracking-[0.2em] text-parchment">
                  {column.title}
                </h3>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center gap-1 text-sm text-muted transition hover:text-parchment"
                      >
                        {link.label}
                        <ArrowUpRight className="size-3 opacity-0 transition group-hover:opacity-60" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line/60 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} KIBAOFFICIAL SMP. All rights reserved.
          </p>
          <p className="max-w-xl text-[0.68rem] leading-relaxed opacity-70">
            Not affiliated with Mojang Studios or Microsoft. “Minecraft” is a trademark of
            Mojang Studios. Cracked accounts are supported through server-side identity
            verification.
          </p>
        </div>
      </div>
    </footer>
  );
}
