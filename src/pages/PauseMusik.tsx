import { motion } from "framer-motion";
import { Coffee, Music4, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";

/**
 * 🥚 Hemmelig easter egg-side: pausemusik til TO'erne.
 * Ikke linket i menuen — findes via robots.txt-hintet eller /admin.
 */
export function PauseMusik() {
  return (
    <>
      <PageHeader
        eyebrow="Hemmelig side"
        title="Pausemusik"
        description="Du fandt den! FGC Nords officielle pause-playlist — sæt den på anlægget mellem brackets."
      />

      <section className="section-padding bg-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-auto max-w-3xl"
          >
            <div className="rounded-3xl border-[3px] border-ink bg-coal p-6 shadow-poster sm:p-8">
              <div className="mb-6 flex items-center gap-3 text-cream">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-ink bg-brick text-ink shadow-poster-sm">
                  <Music4 className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-xl uppercase tracking-wide">
                    FGC Nord · Pausen
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-cream/70">
                    <Sparkles className="h-3.5 w-3.5 text-brick-soft" aria-hidden="true" />
                    Kun for dem der ved, hvor man leder
                  </p>
                </div>
              </div>

              <iframe
                title="FGC Nord pause-playlist på Spotify"
                data-testid="embed-iframe"
                style={{ borderRadius: "12px" }}
                src="https://open.spotify.com/embed/playlist/05M6IW1T5zIKGPIMGFF52v?utm_source=generator"
                width="100%"
                height="352"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />

              <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-cream/60">
                <Coffee className="h-4 w-4 text-brick-soft" aria-hidden="true" />
                Tip fra LazyTO: Volumen på 70 % — resten klarer pops'ene.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
