import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Vote } from "lucide-react";
import { RansomText } from "@/components/RansomText";
import { Starburst } from "@/components/Starburst";
import { SlashDivider } from "@/components/SlashDivider";
import { SectionHeader } from "@/components/SectionHeader";
import { DISCORD_URL } from "@/components/Navbar";

/**
 * Bjergtop 3 — test-/placeholder-event-side bag TEST_EVENT_ENABLED
 * (src/lib/flags.ts). Alt indhold er placeholder og bruges til at
 * afprøve event-side-layoutet før rigtige events.
 */

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

const GAMES = ["MELEE", "ULTIMATE", "RIVALS OF AETHER 2", "MARIO KART WII"];

const DETAILS = [
  { icon: Calendar, title: "Dato", text: "TBA — annonceres på Discord og start.gg" },
  { icon: MapPin, title: "Sted", text: "Aalborg · lokale annonceres" },
  { icon: Users, title: "Format", text: "Invitational · 16 spillere" },
];

const VOTE_SLOTS = [1, 2, 3, 4];

export function TestEvent() {
  return (
    <>
      {/* 1. HERO — fuld rød flade (P5), ransom-overskrift */}
      <section className="relative overflow-hidden bg-signal text-cream">
        <Starburst
          text="SNART"
          color="#F4F8FB"
          textColor="#E60012"
          rotation={9}
          size={150}
          className="absolute -right-6 top-8 z-20 md:right-10"
        />
        <div className="mx-auto max-w-[1200px] px-6 pb-16 pt-24 text-center md:pt-28">
          <p className="text-[13px] font-bold uppercase tracking-[0.22em] text-cream/90">
            FGCNORD præsenterer et toppmøde
          </p>
          <h1 className="mt-8 font-display text-[64px] uppercase leading-[1.15] sm:text-[96px] md:text-[130px]">
            <RansomText text="BJERGTOP" delay={0.15} />
          </h1>
          <div
            className="text-shadow-stack mt-2 inline-block -rotate-[5deg] font-display text-[150px] leading-none text-gold md:text-[220px]"
            aria-label="3"
          >
            3
          </div>
          <p className="mx-auto mt-6 max-w-md text-[16px] leading-[1.7] text-cream/90 md:text-[17px]">
            16 spillere. Én bjergtop. Nordjyllands svar på en Summit —
            invitationer, folkeafstemning og en hel weekend med brackets.
          </p>
        </div>

        {/* gold tape med spillene */}
        <div className="overflow-x-clip pb-10" aria-hidden="true">
          <div className="-mx-[2%] w-[104%] -rotate-[1.4deg] overflow-hidden border-y-[3px] border-ink bg-gold py-3">
            <div className="flex w-max animate-marquee whitespace-nowrap">
              {[0, 1].map((dup) => (
                <span
                  key={dup}
                  className="flex items-center font-display text-[15px] uppercase tracking-[0.1em] text-ink md:text-[17px]"
                >
                  {[...GAMES, "16 SPILLERE", "INVITATIONAL", "FOLKEAFSTEMNING"].map((ord) => (
                    <span key={ord} className="flex items-center">
                      <span className="px-5">{ord}</span>
                      <span className="text-[13px]">///</span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SlashDivider fill="#0A1E3C" className="bg-signal" />

      {/* 2. DETALJER — vippe-kort på coal */}
      <section className="halftone-dark bg-coal py-16 text-cream md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow="Detaljer" title="Hvad ved vi?" light />
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {DETAILS.map((d, i) => (
              <motion.div
                key={d.title}
                initial={{ opacity: 0, y: 36, rotate: 0 }}
                whileInView={{ opacity: 1, y: 0, rotate: [-1.4, 1, -0.8][i] }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.12 }}
                className="card-poster p-7"
              >
                <d.icon size={30} aria-hidden="true" className="text-brick" />
                <h3 className="mt-4 font-heading text-xl font-bold">{d.title}</h3>
                <p className="mt-1.5 text-[15px] leading-[1.65] text-olive">{d.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SlashDivider fill="#F4F8FB" className="bg-coal" flip />

      {/* 3. FOLKEAFSTEMNING — 4 placeholder-pladser */}
      <section className="bg-cream py-16 text-ink md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow="Fællesskabet bestemmer" title="Folkeafstemning" />
          <p className="mt-6 max-w-2xl text-[16px] leading-[1.7] text-olive md:text-[17px]">
            12 spillere får en invitation direkte. De sidste 4 pladser vælges af
            fællesskabet — nominering og afstemning sker på Discord.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {VOTE_SLOTS.map((n, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, ease: EASE, delay: i * 0.1 }}
                className={`card-poster flex flex-col items-center justify-center gap-3 border-dashed p-8 ${
                  i % 2 === 0 ? "-rotate-[0.8deg]" : "rotate-[0.8deg]"
                }`}
              >
                <span className="font-display text-6xl text-ink/25" aria-hidden="true">
                  ?
                </span>
                <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-ink/50">
                  Spiller TBA
                </p>
                <p className="font-display text-lg text-gold">#{n}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2.5 rounded-full border-[3px] border-ink/30 bg-ink/10 px-8 py-3.5 text-[15px] font-semibold uppercase tracking-[0.02em] text-ink/50"
            >
              <Vote size={18} aria-hidden="true" /> Afstemning åbner snart
            </button>
          </div>
        </div>
      </section>

      <SlashDivider fill="#0A1E3C" className="bg-cream" />

      {/* 4. CTA */}
      <section className="halftone-dark bg-coal py-16 text-center text-cream md:py-20">
        <div className="mx-auto max-w-[720px] px-6">
          <SectionHeader eyebrow="Følg med" title="Meld dig ind i rummet" centered light />
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-[1.7] text-cream/85">
            Alle detaljer om Bjergtop 3 lander først på Discord — det er også her,
            folkeafstemningen kører.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-full border-[3px] border-cream bg-signal px-8 py-3.5 text-[15px] font-semibold uppercase tracking-[0.02em] text-cream shadow-poster-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-signal-dark"
            >
              Join Discord
            </a>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2.5 rounded-full border-[3px] border-cream bg-transparent px-8 py-3.5 text-[15px] font-semibold uppercase tracking-[0.02em] text-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-cream hover:text-coal"
            >
              Til forsiden
            </Link>
          </div>
          <p className="mt-10 text-[12px] uppercase tracking-[0.18em] text-cream/40">
            Testside — alt indhold er placeholder
          </p>
        </div>
      </section>
    </>
  );
}
