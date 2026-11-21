import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Gavel, MessageCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Server rules",
  description:
    "The rules that keep KIBAOFFICIAL SMP fair for Java, Bedrock and cracked players, plus the enforcement and appeal process.",
  alternates: { canonical: "/rules" },
};

const sections = [
  {
    id: "respect",
    title: "1. Respect every player",
    body: "Harassment, hate speech, threats, doxxing and targeted abuse are not tolerated — in chat, signs, builds or books. This applies across Java and Bedrock and to any linked Discord or social channel.",
    points: [
      "No slurs, sexual content or threats.",
      "No doxxing or sharing another player's private information.",
      "Keep arguments out of global chat; take them to support.",
    ],
  },
  {
    id: "fair-play",
    title: "2. Fair play only",
    body: "The network supports cracked clients through server-side identity verification. That trust depends on everyone playing by the same rules.",
    points: [
      "No hacked clients, x-ray, auto-clickers, macros or kill aura.",
      "No exploit abuse — report duplication or lag machines instead of using them.",
      "No alt-account farming for rewards, events or votes.",
      "Bedrock clients must not use unauthorised behaviour packs that grant an advantage.",
    ],
  },
  {
    id: "world",
    title: "3. Respect the world",
    body: "The survival world is shared. Build with your neighbours in mind and keep the spawn hub and public farms usable.",
    points: [
      "No griefing outside agreed PvP or war zones.",
      "No stealing from unclaimed bases — claim what you want to keep.",
      "Do not block public farms, nether hubs or spawn paths.",
      "Report land disputes to staff instead of escalating in-game.",
    ],
  },
  {
    id: "chat",
    title: "4. Chat & content",
    body: "Global chat is a shared room with players of different ages and regions.",
    points: [
      "English in global chat; use private messages or Discord for other languages.",
      "No spam, advertising, or links to other servers.",
      "No impersonating staff, other players or the KIBAOFFICIAL brand.",
      "Keep build content appropriate for a general audience.",
    ],
  },
  {
    id: "accounts",
    title: "5. Accounts & linking",
    body: "One portal account should represent one player. Linking is how rewards, purchases and event entries reach you.",
    points: [
      "Do not share your portal password or session.",
      "Do not link a UUID you do not control.",
      "Unlinking stops deliveries — purchases stay on record.",
      "Report a compromised account immediately through support.",
    ],
  },
  {
    id: "store",
    title: "6. Coins & the store",
    body: "Coins are earned through play, rewards and events. They have no cash value and cannot be bought or cashed out.",
    points: [
      "No real-money trading of coins, items or accounts.",
      "No chargeback-style fraud or ledger manipulation attempts.",
      "Purchases are delivered to the linked UUID and are non-refundable once delivered.",
      "Staff may reverse balances gained through exploits.",
    ],
  },
  {
    id: "staff",
    title: "7. Staff & enforcement",
    body: "Staff act to protect the community. Enforcement depends on severity, history and intent.",
    points: [
      "Warnings and mutes for minor or first-time issues.",
      "Temporary bans for cheating, griefing or repeated abuse.",
      "Permanent bans for extreme behaviour, doxxing or fraud.",
      "Staff decisions are logged in the audit trail.",
    ],
  },
];

export default function RulesPage() {
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-[92px]">
            <p className="mb-3 text-[0.58rem] font-bold uppercase tracking-[0.2em] text-muted">
              On this page
            </p>
            <nav className="space-y-1 border-l border-line/60 pl-3" aria-label="Rules sections">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block py-1 text-xs text-muted transition hover:text-parchment"
                >
                  {section.title}
                </a>
              ))}
              <a href="#appeals" className="block py-1 text-xs text-muted transition hover:text-parchment">
                8. Appeals
              </a>
            </nav>
          </div>
        </aside>

        <div>
          <header className="mb-9">
            <Badge tone="moss">
              <Gavel className="size-3" /> Rules of the realm
            </Badge>
            <h1 className="display-xl mt-4">Play fair. Stay welcome.</h1>
            <p className="lede mt-4 max-w-2xl">
              These rules apply to every world, every platform and every linked community space.
              They are written plainly on purpose — if something is unclear, ask before you act.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-moss" /> Effective from season one
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="size-3.5 text-moss" /> Questions go to support
              </span>
            </div>
          </header>

          <div className="space-y-4">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="panel scroll-mt-24 p-6">
                <h2 className="font-display text-xl text-parchment">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{section.body}</p>
                <ul className="mt-4 space-y-2">
                  {section.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-parchment-dim">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-moss" />
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section id="appeals" className="panel scroll-mt-24 p-6">
              <h2 className="font-display text-xl text-parchment">8. Appeals</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                If you believe a punishment was applied in error, open a support ticket with your
                in-game name, the date and what happened. Include screenshots or clips if you have
                them. Appeals are reviewed by a different staff member wherever possible.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/support" className="btn btn-primary btn-sm">
                  Open an appeal <ArrowRight className="size-3.5" />
                </Link>
                <Link href="/community" className="btn btn-ghost btn-sm">
                  Community hub
                </Link>
              </div>
            </section>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-gold/25 bg-gold/[0.05] p-4 text-xs leading-relaxed text-muted">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold" />
            <p>
              Rules can change between seasons. Material changes are announced in{" "}
              <Link href="/news" className="text-parchment underline underline-offset-2">
                news dispatches
              </Link>{" "}
              before they take effect. Continuing to play after a change means you accept it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
