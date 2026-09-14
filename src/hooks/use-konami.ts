import { useEffect, useRef } from "react";

/**
 * 🥚 Konami-kode: ↑ ↑ ↓ ↓ ← → ← → B A
 *
 * STATUS: KODET MEN IKKE AKTIV.
 * Designet af selve easter egget (hvad der sker når koden tastes) er ikke
 * færdigt endnu — derfor tænder Layout-komponenten først lytteren, når
 * KONAMI_ENABLED flippes til true. Indtil da er denne hook ubrugt, og
 * der lytteres ikke på tastatur-input nogen steder.
 */

export const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

/**
 * Lytter efter Konami-sekvensen og kalder `onUnlock` ved match.
 * Tastes et forkert tegn nulstilles sekvensen (med det klassiske
 * overlap-trick: et forkert input kan selv være starten på en ny sekvens).
 */
export function useKonamiCode(onUnlock: () => void, enabled: boolean) {
  const progressRef = useRef(0);
  const callbackRef = useRef(onUnlock);
  callbackRef.current = onUnlock;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignorér tastning i input-felter, så folk kan skrive "ba" i fred
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const expected = KONAMI_SEQUENCE[progressRef.current];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (key === expected) {
        progressRef.current += 1;
        if (progressRef.current === KONAMI_SEQUENCE.length) {
          progressRef.current = 0;
          callbackRef.current();
        }
        return;
      }

      // Mismatch: genstart, men tjek om tasten kan starte en ny sekvens
      progressRef.current = key === KONAMI_SEQUENCE[0] ? 1 : 0;
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
