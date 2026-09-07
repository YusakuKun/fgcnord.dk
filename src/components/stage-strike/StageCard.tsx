import { motion } from "framer-motion";
import { Ban, Lock } from "lucide-react";

import { SafeImage } from "@/components/SafeImage";
import { StageSilhouette, hasSilhouette } from "@/components/stage-strike/StageSilhouette";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types";

export type CardState =
  | "available" // kan klikkes nu
  | "idle" // kan ikke klikkes i dette trin
  | "striked" // fjernet i game 1 (rød X)
  | "banned" // banned af vinderen (blåt forbud)
  | "dsr" // spærret af DSR
  | "locked" // counterpick-stage under game 1 strike
  | "picked"; // valgt stage

interface StageCardProps {
  stage: Stage & { starter: boolean };
  state: CardState;
  onSelect: () => void;
  actionLabel: string; // fx "Strike Battlefield" til aria-label
  dsrLabel?: string; // fx "Spillet" for racing-spil (ingen bane-gentagelser)
}

export function StageCard({ stage, state, onSelect, actionLabel, dsrLabel = "DSR" }: StageCardProps) {
  const interactive = state === "available";
  const dimmed =
    state === "striked" || state === "banned" || state === "idle" || state === "locked";

  return (
    <motion.button
      type="button"
      layout
      onClick={() => {
        if (interactive) onSelect();
      }}
      disabled={state === "striked" || state === "banned" || state === "idle" || state === "locked"}
      aria-disabled={state === "dsr" ? true : undefined}
      aria-label={
        state === "dsr"
          ? dsrLabel === "DSR"
            ? `${stage.name} – spærret af DSR (du har selv vundet på denne stage)`
            : `${stage.name} – allerede spillet i serien (ingen gentagelser)`
          : state === "locked"
            ? `${stage.name} – counterpick-stage, ikke med i game 1`
            : interactive
              ? `${actionLabel}: ${stage.name}`
              : stage.name
      }
      whileHover={interactive ? { scale: 1.04, y: -3 } : undefined}
      whileTap={interactive ? { scale: 0.96 } : undefined}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={cn(
        "group relative aspect-video min-h-[64px] w-full overflow-hidden rounded-xl border-2 text-left shadow-lg outline-none transition-colors",
        "border-white/10 bg-coal",
        interactive &&
          "cursor-pointer border-brick/40 hover:border-brick focus-visible:border-brick focus-visible:ring-4 focus-visible:ring-brick/60",
        state === "picked" &&
          "border-brick ring-4 ring-brick/80 ring-offset-2 ring-offset-coal shadow-[0_0_32px_rgba(0,174,239,0.55)]",
        dimmed && "cursor-not-allowed",
        state === "dsr" && "cursor-not-allowed border-olive/60"
      )}
    >
      {/* Silhuet (foretrukket), ellers thumbnail, ellers nordlys-gradient */}
      {hasSilhouette(stage.id) ? (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-ink/50 transition-all duration-300",
            dimmed && "opacity-40"
          )}
        >
          <StageSilhouette
            stageId={stage.id}
            className={cn(
              "p-3 text-brick-soft transition-all duration-300",
              interactive && "group-hover:text-brick",
              state === "picked" && "text-brick",
              state === "dsr" && "text-cream/40",
              (state === "striked" || state === "banned") && "text-cream/30"
            )}
          />
        </div>
      ) : stage.image ? (
        <SafeImage
          src={stage.image}
          alt={`${stage.name} stage thumbnail`}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-all duration-300",
            dimmed && "opacity-30 grayscale",
            state === "dsr" && "opacity-40 saturate-50"
          )}
        />
      ) : (
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-coal via-[#123a6b] to-brick/40 transition-all duration-300",
            dimmed && "opacity-30 grayscale"
          )}
        />
      )}

      {/* Mørk læseligheds-gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent"
      />

      {/* Rød X – striked */}
      {state === "striked" && (
        <motion.svg
          viewBox="0 0 100 60"
          className="absolute inset-0 h-full w-full text-red-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          aria-hidden="true"
        >
          <motion.line
            x1="18" y1="8" x2="82" y2="52"
            stroke="currentColor" strokeWidth="7" strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
          <motion.line
            x1="82" y1="8" x2="18" y2="52"
            stroke="currentColor" strokeWidth="7" strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.25, delay: 0.18, ease: "easeOut" }}
          />
        </motion.svg>
      )}

      {/* Blåt forbuds-ikon – banned */}
      {state === "banned" && (
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <Ban className="h-10 w-10 text-brick-soft drop-shadow-[0_0_10px_rgba(79,195,247,0.8)]" strokeWidth={2.5} />
        </motion.div>
      )}

      {/* DSR-lås / spillet-bane */}
      {state === "dsr" && (
        <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-olive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cream">
          <Lock className="h-3 w-3" aria-hidden="true" />
          {dsrLabel}
        </div>
      )}

      {/* Starter/Counterpick markør */}
      {state !== "banned" && state !== "striked" && (
        <span
          className={cn(
            "absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            stage.starter
              ? "bg-brick/90 text-ink"
              : "bg-ink/70 text-brick-soft"
          )}
        >
          {stage.starter ? "Starter" : "Counter"}
        </span>
      )}

      {/* Navn */}
      <span className="absolute inset-x-0 bottom-0 p-2 font-heading text-xs font-bold leading-tight text-cream drop-shadow sm:text-sm">
        {stage.name}
      </span>

      {/* Valgt-badge */}
      {state === "picked" && (
        <motion.span
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute right-1.5 top-1.5 rounded-full bg-brick px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coal"
        >
          Valgt
        </motion.span>
      )}
    </motion.button>
  );
}
