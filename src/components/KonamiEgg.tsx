import { useState } from "react";

import { useKonamiCode } from "@/hooks/use-konami";

/**
 * 🥚 Konami easter egg — INAKTIVT.
 *
 * Flip KONAMI_ENABLED til true når det visuelle design af "belønningen"
 * er færdigt. Indtil da lytter der ingenting, og denne komponent
 * renderer null.
 *
 * Når det aktiveres: tast ↑ ↑ ↓ ↓ ← → ← → B A på en vilkårlig side,
 * og overlayet herunder vises. Udskift indholdet i overlayet med det
 * endelige design (fx confetti, hemmelig side, disco-mode, ...).
 */
export const KONAMI_ENABLED = false;

export function KonamiEgg() {
  const [unlocked, setUnlocked] = useState(false);
  useKonamiCode(() => setUnlocked(true), KONAMI_ENABLED);

  if (!KONAMI_ENABLED || !unlocked) return null;

  // PLACEHOLDER — endeligt design afventer webdesign-revisionerne
  return (
    <div
      role="dialog"
      aria-label="Easter egg"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80"
      onClick={() => setUnlocked(false)}
    >
      <p className="font-display text-2xl uppercase text-cream">
        Konami-kode accepteret — design under construction 🚧
      </p>
    </div>
  );
}
