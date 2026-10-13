import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

// Deterministisk stil pr. bogstav — ser tilfældig ud, men rerender stabilt
const ROTS = [-7, 5, -4, 8, -6, 4, -8, 6, -5, 7, -3, 5, -6, 4, -7, 3];
const JITTERS = [0, -10, 6, -6, 9, -8, 5, 0, -7, 8, -5, 6, -9, 3, -4, 7];

interface RansomTextProps {
  /** Ord adskilt med mellemrum */
  text: string;
  /** Stagger-forsinkelse i sekunder */
  delay?: number;
  className?: string;
}

/**
 * P5 "ransom note"-overskrift efter Atlus' officielle style guide
 * (se DESIGN.md): hvert bogstav i sin egen boks, blandede serif/sans
 * fonte, vinkel på hvert bogstav, 1-2 inverterede bogstaver pr. ord,
 * ét accent-bogstav, mixed case. Kun til store overskrifter —
 * aldrig brødtekst (læsbarhed er gulvet).
 */
export function RansomText({ text, delay = 0, className = "" }: RansomTextProps) {
  const reduced = useReducedMotion();
  let gi = 0; // globalt bogstav-index på tværs af ord
  const words = text.split(" ");

  return (
    <span className={`inline-block ${className}`} aria-label={text} role="text">
      {words.map((word, wi) => {
        const invertIdx = word.length > 3 ? 2 : word.length > 1 ? 1 : -1;
        const accentIdx = word.length > 4 ? 5 : -1;
        const lowerIdx = word.length > 4 ? 4 : -1;
        return (
          <span key={wi} className="inline-block whitespace-nowrap">
            {word.split("").map((ch, li) => {
              const g = gi++;
              const fontCls =
                g % 3 === 1 ? "font-serif" : g % 3 === 2 ? "font-impact" : "font-display";
              const boxCls =
                li === accentIdx
                  ? "bg-signal text-cream"
                  : li === invertIdx
                    ? "bg-ink text-cream"
                    : "bg-cream text-ink";
              const letter = li === lowerIdx ? ch.toLowerCase() : ch;
              const inner = (
                <span
                  aria-hidden="true"
                  className={`inline-block border-[3px] border-ink px-[0.1em] leading-[1.15] shadow-poster ${fontCls} ${boxCls}`}
                  style={{
                    transform: `rotate(${ROTS[g % ROTS.length]}deg) translateY(${JITTERS[g % JITTERS.length]}px)`,
                  }}
                >
                  {letter}
                </span>
              );
              return reduced ? (
                <span key={li} className="inline-block">
                  {inner}
                </span>
              ) : (
                <motion.span
                  key={li}
                  className="inline-block"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, ease: EASE, delay: delay + g * 0.05 }}
                >
                  {inner}
                </motion.span>
              );
            })}
            {wi < words.length - 1 && <span className="inline-block w-[0.45em]" />}
          </span>
        );
      })}
    </span>
  );
}
