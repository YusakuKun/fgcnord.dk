interface StarburstProps {
  /** Tekst i badget — holdes kort (LIVE, NYT, #1, TOP 8) */
  text: string;
  /** Badgefarve — signal (live/urgent) eller gold (sejr/rang), se DESIGN.md */
  color?: string;
  textColor?: string;
  /** Rotation i grader — stickers må gå til ±10 */
  rotation?: number;
  spikes?: number;
  /** Bredde i px (højde følger) */
  size?: number;
  className?: string;
}

function spikePoints(spikes: number, rOut: number, rIn: number, dx = 0, dy = 0): string {
  const cx = 100;
  const cy = 100;
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (Math.PI / spikes) * i - Math.PI / 2;
    const r = i % 2 === 0 ? rOut : rIn;
    pts.push(`${cx + dx + r * Math.cos(ang)},${cy + dy + r * Math.sin(ang)}`);
  }
  return pts.join(" ");
}

/**
 * P5-inspireret stjerne-badge (starburst) med hård ink-skygge.
 * Bryder bevidst grid'et — brug den overlappende på kort-hjørner,
 * aldrig til brødtekst. Se DESIGN.md for rationering af rød/guld.
 */
export function Starburst({
  text,
  color = "#E60012",
  textColor = "#F4F8FB",
  rotation = -8,
  spikes = 14,
  size = 140,
  className = "",
}: StarburstProps) {
  const fontSize = text.length > 3 ? 34 : 48;

  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ transform: `rotate(${rotation}deg)`, width: size, height: size }}
      role="img"
      aria-label={text}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
        {/* hård offset-skygge */}
        <polygon points={spikePoints(spikes, 92, 71, 7, 7)} fill="#0B1526" />
        {/* badge */}
        <polygon
          points={spikePoints(spikes, 92, 71)}
          fill={color}
          stroke="#0B1526"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <text
          x="100"
          y="102"
          textAnchor="middle"
          dominantBaseline="central"
          fill={textColor}
          fontSize={fontSize}
          fontFamily="'Archivo Black', sans-serif"
          letterSpacing="1"
        >
          {text.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
