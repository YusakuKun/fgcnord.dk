interface SlashDividerProps {
  /** Farven på sektionen UNDER divideren */
  fill?: string;
  /** Baggrundsfarve via className (sektionen OVER divideren) */
  className?: string;
  /** Vend hældningen (nedad-højre vs. nedad-venstre) */
  flip?: boolean;
}

/**
 * Diagonal skrå-snit mellem sektioner med en tynd brick-stribe over kanten.
 * Poster Brutalism-erstatning for WaveDivider på sider med skarpe kanter.
 */
export function SlashDivider({ fill = "#F4F8FB", className = "", flip = false }: SlashDividerProps) {
  return (
    <div className={className} style={{ lineHeight: 0 }} aria-hidden="true">
      <svg viewBox="0 0 1440 96" preserveAspectRatio="none" className="block h-[52px] w-full md:h-[84px]">
        {/* brick-stribe der rider på kanten */}
        <polygon
          points={flip ? "0,74 1440,26 1440,32 0,80" : "0,26 1440,74 1440,80 0,32"}
          fill="#00AEEF"
        />
        {/* fyld = næste sektions farve */}
        <polygon
          points={flip ? "0,86 1440,38 1440,96 0,96" : "0,38 1440,86 1440,96 0,96"}
          fill={fill}
        />
      </svg>
    </div>
  );
}
