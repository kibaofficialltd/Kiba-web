import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Crown, Sparkles, Eye, Shield, User } from "lucide-react";

export type RankBadgeProps = {
  rank?: string | null;
  role?: string | null;
  className?: string;
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
};

/**
 * Returns color, styling, and label for server ranks and staff roles:
 * - Aurora -> Blue colour
 * - VoidWalker -> Purple colour
 * - Sovereign -> Yellow colour
 * - Owner / Admin -> Red badge ( owner)
 */
export function getRankBadgeConfig(rankOrRole?: string | null) {
  if (!rankOrRole) return null;
  const raw = rankOrRole.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. Owner / Admin -> Red badge name "( owner)"
  if (raw === "owner" || raw === "admin") {
    return {
      type: "owner",
      label: "( owner)",
      icon: Crown,
      badgeClass:
        "border-red-500/40 bg-red-950/40 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.3)] ring-1 ring-red-500/30",
      dotClass: "bg-red-400 animate-pulse",
      glowColor: "rgba(239, 68, 68, 0.4)",
    };
  }

  // 2. Aurora -> Blue colour
  if (raw === "aurora" || raw.includes("aurora")) {
    return {
      type: "aurora",
      label: "Aurora",
      icon: Sparkles,
      badgeClass:
        "border-blue-500/40 bg-blue-950/40 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/30",
      dotClass: "bg-blue-400",
      glowColor: "rgba(59, 130, 246, 0.4)",
    };
  }

  // 3. VoidWalker -> Purple colour
  if (raw === "voidwalker" || raw.includes("void")) {
    return {
      type: "voidwalker",
      label: "VoidWalker",
      icon: Eye,
      badgeClass:
        "border-purple-500/40 bg-purple-950/40 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/30",
      dotClass: "bg-purple-400",
      glowColor: "rgba(168, 85, 247, 0.4)",
    };
  }

  // 4. Sovereign -> Yellow colour
  if (raw === "sovereign" || raw.includes("sovereign")) {
    return {
      type: "sovereign",
      label: "Sovereign",
      icon: Crown,
      badgeClass:
        "border-yellow-500/40 bg-yellow-950/40 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.3)] ring-1 ring-yellow-500/30",
      dotClass: "bg-yellow-400",
      glowColor: "rgba(234, 179, 8, 0.4)",
    };
  }

  // Staff roles
  if (raw === "moderator" || raw === "mod") {
    return {
      type: "moderator",
      label: "Moderator",
      icon: Shield,
      badgeClass: "border-cyan-500/40 bg-cyan-950/40 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.25)]",
      dotClass: "bg-cyan-400",
      glowColor: "rgba(6, 182, 212, 0.3)",
    };
  }

  if (raw === "helper") {
    return {
      type: "helper",
      label: "Helper",
      icon: Shield,
      badgeClass: "border-emerald-500/40 bg-emerald-950/40 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]",
      dotClass: "bg-emerald-400",
      glowColor: "rgba(16, 185, 129, 0.3)",
    };
  }

  return null;
}

export function RankBadge({
  rank,
  role,
  className,
  size = "sm",
  showIcon = true,
}: RankBadgeProps) {
  // If role is owner/admin, that takes highest precedence
  const effective = role === "owner" || role === "admin" ? role : (rank || role);
  const config = getRankBadgeConfig(effective);

  if (!config) return null;

  const Icon = config.icon;

  const sizeClasses = {
    xs: "px-2 py-0.5 text-[0.62rem] gap-1",
    sm: "px-2.5 py-0.5 text-[0.68rem] gap-1.5",
    md: "px-3 py-1 text-xs gap-1.5",
  }[size];

  const iconSizes = {
    xs: "size-2.5",
    sm: "size-3",
    md: "size-3.5",
  }[size];

  return (
    <span
      className={cx(
        "inline-flex items-center font-bold uppercase tracking-wider rounded-full border backdrop-blur-md transition-all duration-300",
        sizeClasses,
        config.badgeClass,
        className,
      )}
    >
      {showIcon && <Icon className={cx(iconSizes, "shrink-0")} />}
      <span>{config.label}</span>
    </span>
  );
}
