import { cn } from "@/lib/utils";

/**
 * Minimalistiske stage-silhuetter: platform-layout som tynde linjer
 * på mørk baggrund. Ens stil på tværs af spil, lettere at skimte end fotos.
 *
 * Layouts er tegnet i et 160×90-koordinatsystem:
 *  - hovedplatform = tyk linje med let fyld
 *  - svæveplatforme = tynde linjer
 *  - stiplet ramme = blast zone
 */

interface PlatformLayout {
  main: { x1: number; x2: number; y: number };
  floats: { x1: number; x2: number; y: number }[];
  /** Ekstra detalje, fx Yoshis Randall-sky */
  dot?: { cx: number; cy: number };
}

const LAYOUTS: Record<string, PlatformLayout> = {
  // Battlefield (Melee + Ultimate): trekant af tre platforme
  bf: {
    main: { x1: 46, x2: 114, y: 62 },
    floats: [
      { x1: 30, x2: 54, y: 42 },
      { x1: 106, x2: 130, y: 42 },
      { x1: 68, x2: 92, y: 24 },
    ],
  },
  // Final Destination: helt flad
  fd: {
    main: { x1: 32, x2: 128, y: 58 },
    floats: [],
  },
  // Dream Land 64: som BF, men længere topplatform
  dl: {
    main: { x1: 46, x2: 114, y: 62 },
    floats: [
      { x1: 28, x2: 54, y: 42 },
      { x1: 106, x2: 132, y: 42 },
      { x1: 62, x2: 98, y: 22 },
    ],
  },
  // Fountain of Dreams: to sideplatforme + lille top
  fod: {
    main: { x1: 46, x2: 114, y: 64 },
    floats: [
      { x1: 34, x2: 58, y: 46 },
      { x1: 102, x2: 126, y: 46 },
      { x1: 72, x2: 88, y: 28 },
    ],
  },
  // Yoshi's Story: trekant + Randalls sky
  ys: {
    main: { x1: 48, x2: 112, y: 62 },
    floats: [
      { x1: 32, x2: 55, y: 42 },
      { x1: 105, x2: 128, y: 42 },
      { x1: 68, x2: 92, y: 26 },
    ],
    dot: { cx: 140, cy: 54 },
  },
  // Pokémon Stadium 1+2: to hævede sideplatforme
  ps: {
    main: { x1: 40, x2: 120, y: 60 },
    floats: [
      { x1: 54, x2: 74, y: 40 },
      { x1: 86, x2: 106, y: 40 },
    ],
  },
  ps2: {
    main: { x1: 40, x2: 120, y: 60 },
    floats: [
      { x1: 54, x2: 74, y: 40 },
      { x1: 86, x2: 106, y: 40 },
    ],
  },
  // Small Battlefield: lille hovedplatform, to platforme
  sbf: {
    main: { x1: 56, x2: 104, y: 60 },
    floats: [
      { x1: 42, x2: 66, y: 38 },
      { x1: 94, x2: 118, y: 38 },
    ],
  },
  // Smashville: én svævende platform over midten
  sv: {
    main: { x1: 42, x2: 118, y: 62 },
    floats: [{ x1: 70, x2: 90, y: 42 }],
  },
  // Town & City: som BF, men platformene hænger lavere
  tc: {
    main: { x1: 46, x2: 114, y: 62 },
    floats: [
      { x1: 36, x2: 58, y: 46 },
      { x1: 102, x2: 124, y: 46 },
      { x1: 68, x2: 92, y: 30 },
    ],
  },
  // Hollow Bastion: næsten flad med én lille platform
  hb: {
    main: { x1: 36, x2: 124, y: 58 },
    floats: [{ x1: 96, x2: 116, y: 40 }],
  },
  // Kalos Pokémon League: to høje sideplatforme
  kalos: {
    main: { x1: 46, x2: 114, y: 60 },
    floats: [
      { x1: 32, x2: 55, y: 36 },
      { x1: 105, x2: 128, y: 36 },
    ],
  },
};

export function hasSilhouette(stageId: string): boolean {
  return stageId in LAYOUTS;
}

export function StageSilhouette({
  stageId,
  className,
}: {
  stageId: string;
  className?: string;
}) {
  const layout = LAYOUTS[stageId];
  if (!layout) return null;
  return (
    <svg
      viewBox="0 0 160 90"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className={cn("absolute inset-0 h-full w-full", className)}
    >
      {/* Blast zone */}
      <rect
        x="7"
        y="6"
        width="146"
        height="78"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      {/* Svæveplatforme */}
      {layout.floats.map((p, i) => (
        <line
          key={i}
          x1={p.x1}
          y1={p.y}
          x2={p.x2}
          y2={p.y}
          stroke="currentColor"
          strokeOpacity="0.85"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ))}
      {/* Hovedplatform */}
      <line
        x1={layout.main.x1}
        y1={layout.main.y}
        x2={layout.main.x2}
        y2={layout.main.y}
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1={layout.main.x1 + 6}
        y1={layout.main.y + 5}
        x2={layout.main.x2 - 6}
        y2={layout.main.y + 5}
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Ekstra detalje (fx Randall-skyen på Yoshi's) */}
      {layout.dot && (
        <circle
          cx={layout.dot.cx}
          cy={layout.dot.cy}
          r="2.5"
          fill="currentColor"
          fillOpacity="0.6"
        />
      )}
    </svg>
  );
}
