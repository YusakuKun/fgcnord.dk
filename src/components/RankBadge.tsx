import { Crown, Medal } from "lucide-react";

import { cn } from "@/lib/utils";

const rankStyles: Record<number, string> = {
  1: "border-[#d4a017] bg-[#f7d774] text-[#5c4308]",
  2: "border-[#9aa5b1] bg-[#d7dde4] text-[#3e4c59]",
  3: "border-[#b0793c] bg-[#e0b285] text-[#5f3b12]",
};

/**
 * Rang-badge for top 8-spillere. #1–3 får medalje-farver, #4–8 brick.
 * Returnerer null for spillere uden for top 8.
 */
export function RankBadge({
  rank,
  className,
}: {
  rank: number | undefined | null;
  className?: string;
}) {
  if (!rank || rank < 1 || rank > 8) return null;
  const podium = rank <= 3;
  return (
    <span
      title={`#${rank} på ranglisten`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border-2 px-1.5 py-0.5 text-[11px] font-extrabold leading-none",
        podium
          ? rankStyles[rank]
          : "border-brick bg-brick/15 text-brick",
        className,
      )}
    >
      {podium ? (
        <Crown className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Medal className="h-3 w-3" aria-hidden="true" />
      )}
      #{rank}
    </span>
  );
}
