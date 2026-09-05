import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Sparkle } from "@/components/Sparkle";
import { WaveDivider } from "@/components/WaveDivider";
import { SectionHeader } from "@/components/SectionHeader";
import { EventCard } from "@/components/EventCard";
import { CTASection } from "@/components/CTASection";
import { GamesPinSection } from "@/components/home/GamesPinSection";
import { HeroDecor } from "@/components/home/HeroDecor";
import { upcomingEvents } from "@/data/events";

const VALUES = [
  { title: "Fællesskab først", text: "Alle er velkomne, uanset alder og niveau." },
  { title: "Grassroots", text: "Drevet af frivillige, for spillerne." },
  { title: "Lokal forankring", text: "Nordjylland er vores hjemmebane." },
];

const TEASER_BANNERS = [
  {
    src: "/stage-strike-banner.jpg?v=2",
    label: "Melee",
    time: "Nat",
    alt: "Flydende platform-stage under nordlys om natten",
  },
  {
    src: "/stage-strike-banner-ultimate.jpg?v=2",
    label: "Ultimate",
    time: "Dag",
    alt: "Samme flydende stage i klart dagslys",
  },
];

const GALLERY = [
  {
    src: "/gallery-himmerlan-roa2.jpg",
    alt: "Top 8-grafik for Rivals of Aether II Singles ved HimmerLAN IGEN",
    caption: "HimmerLAN IGEN · Rivals of Aether II · Top 8",
  },
  {
    src: "/gallery-goml-spiller.jpg",
    alt: "Koncentreret spiller med headset og event-badge under turnering",
    caption: "Fokus på kampen · GOML",
  },
  {
    src: "/gallery-himmerlan-ultimate.jpg",
    alt: "Top 8-grafik for Ultimate Singles ved HimmerLAN IGEN",
    caption: "HimmerLAN IGEN · Ultimate · Top 8",
  },
  {
    src: "/gallery-vindere-aau.jpg",
    alt: "Fire glade vindere med karakterhuer foran Studentersamfundet på Aalborg Universitet",
    caption: "Vinderne · Aalborg Universitet",
  },
  {
    src: "/gallery-himmerlan-melee.jpg",
    alt: "Top 8-grafik for Melee Singles ved HimmerLAN IGEN",
    caption: "HimmerLAN IGEN · Melee · Top 8",
  },
  {
    src: "/gallery-fest.jpg",
    alt: "To smilende medlemmer til fællesspisning efter event",
    caption: "Efterfest med crewet",
  },
  {
    src: "/HimmerlanIgen%20(9).jpg",
    alt: "Crewet samlet på trappen i venue under HimmerLAN",
    caption: "Crewet · HimmerLAN",
  },
  {
    src: "/HimmerlanIgen%20(4).jpg",
    alt: "To medlemmer griner sammen på gaden om natten til afterparty",
    caption: "Afterparty i byen",
  },
  {
    src: "/HimmerlanIgen%20(1).jpg",
    alt: "Spillere foran setups med skærme og controllere",
    caption: "Casuals ved setuppene",
  },
];

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

/** Synlig fokus-ring der matcher baggrunden */
const FOCUS_DARK =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick-soft focus-visible:ring-offset-2 focus-visible:ring-offset-coal";
const FOCUS_LIGHT =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick focus-visible:ring-offset-2 focus-visible:ring-offset-cream";

export function Home() {
  const reduced = useReducedMotion();
  const from = <T extends object>(v: T): T | false => (reduced ? false : v);

  return (
    <>
      {/* 1. HERO — nordlys på navy */}
      <section className="halftone-dark relative overflow-hidden bg-coal text-cream">
        <HeroDecor />
        <div className="mx-auto grid min-h-[92vh] max-w-[1200px] items-center gap-12 px-6 pb-24 pt-28 lg:grid-cols-2 lg:py-16">
          <div className="relative z-10">
            <motion.p
              initial={from({ opacity: 0 })}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-[13px] font-bold uppercase tracking-[0.18em] text-brick-soft"
            >
              Fighting Game Community Nordjylland
            </motion.p>
            <h1 className="mt-5 font-display text-[42px] uppercase leading-[1.02] tracking-[-0.02em] text-cream sm:text-[56px] md:text-[80px] lg:text-[88px]">
              {"VI SES I BRACKET".split(" ").map((ord, i) => (
                <span key={i} className="inline-block overflow-hidden align-bottom">
                  <motion.span
                    className="inline-block"
                    initial={from({ y: "110%" })}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.7, ease: EASE, delay: reduced ? 0 : 0.15 + i * 0.08 }}
                  >
                    {ord}&nbsp;
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.p
              initial={from({ opacity: 0, y: 20 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: reduced ? 0 : 0.55 }}
              className="mt-6 max-w-lg text-[16px] leading-[1.7] text-cream/85 md:text-[17px]"
            >
              FGC Nord er fællesskabet for alle kampspils-entusiaster i Aalborg og omegn — fra
              Super Smash Bros. Melee og Ultimate til Rivals of Aether 2. Kom og spil, uanset alder
              og niveau.
            </motion.p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              {[
                <Link
                  key="medlem"
                  to="/bliv-medlem"
                  className={`group inline-flex items-center justify-center gap-2.5 rounded-full border-[3px] border-cream bg-brick px-8 py-3.5 text-[15px] font-semibold uppercase tracking-[0.02em] text-ink shadow-poster-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-brick-soft ${FOCUS_DARK}`}
                >
                  Bliv medlem
                  <Sparkle size={16} color="#0B1526" className="transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
                </Link>,
                <Link
                  key="turneringer"
                  to="/turneringer"
                  className={`inline-flex items-center justify-center gap-2.5 rounded-full border-[3px] border-cream bg-transparent px-8 py-3.5 text-[15px] font-semibold uppercase tracking-[0.02em] text-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-cream hover:text-coal ${FOCUS_DARK}`}
                >
                  Se turneringer <ArrowRight size={18} aria-hidden="true" />
                </Link>,
              ].map((btn, i) => (
                <motion.div
                  key={i}
                  initial={from({ opacity: 0, y: 30 })}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE, delay: reduced ? 0 : 0.7 + i * 0.12 }}
                  whileHover={reduced ? undefined : { scale: 1.03 }}
                  whileTap={reduced ? undefined : { scale: 0.98 }}
                >
                  {btn}
                </motion.div>
              ))}
            </div>
            <motion.ul
              initial={from({ opacity: 0 })}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: reduced ? 0 : 1 }}
              className="mt-8 flex flex-wrap gap-2.5"
              aria-label="Spil vi spiller"
            >
              {["Melee", "Ultimate", "RoA2", "MK Wii"].map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border-2 border-cream/50 px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-cream/90"
                >
                  {chip}
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="relative z-10 flex items-center justify-center">
            <motion.div
              initial={from({ opacity: 0, scale: 0.94 })}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: EASE, delay: reduced ? 0 : 0.3 }}
              className="relative"
            >
              {/* Nordlys-glow bag logo og illustration */}
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brick/25 blur-[90px]"
                aria-hidden="true"
              />
              <img
                src="/hero-illustration.png"
                alt="Rivals of Aether 2 key art med spillets karakterer samlet omkring logoet"
                className="relative w-full max-w-[560px] rotate-[1.2deg] rounded-2xl border-[3px] border-cream shadow-poster-cream"
              />
              <img
                src="/fgc5_light_transparent.png"
                alt="FGC Nord logo"
                className="absolute -top-16 left-1/2 w-[150px] -translate-x-1/2 drop-shadow-[0_10px_28px_rgba(0,174,239,0.5)] motion-safe:animate-float md:-top-24 md:w-[220px]"
              />
            </motion.div>
          </div>
        </div>

        {/* Scroll-hint */}
        <motion.a
          href="#events"
          initial={from({ opacity: 0 })}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: reduced ? 0 : 1.2 }}
          className={`absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cream/70 transition-colors hover:text-cream md:flex ${FOCUS_DARK}`}
          aria-label="Scroll ned til kommende events"
        >
          Se hvad vi har
          <ChevronDown size={20} aria-hidden="true" className="motion-safe:animate-bounce" />
        </motion.a>
      </section>

      {/* 1b. MARQUEE-TICKER (Cool Shirtz-energi) */}
      <div
        className="overflow-hidden border-y-[3px] border-ink bg-brick py-3"
        aria-hidden="true"
      >
        <div className="flex w-max animate-marquee whitespace-nowrap">
          {[0, 1].map((dup) => (
            <span
              key={dup}
              className="flex items-center font-display text-[16px] uppercase tracking-[0.08em] text-ink md:text-[18px]"
            >
              {["Melee", "Ultimate", "Rivals of Aether 2", "Mario Kart Wii", "Weeklies i Aalborg", "Grassroots", "Nordjylland", "Alle niveauer"].map(
                (ord) => (
                  <span key={ord} className="flex items-center">
                    <span className="px-5">{ord}</span>
                    <span className="text-[13px]">✦</span>
                  </span>
                )
              )}
            </span>
          ))}
        </div>
      </div>

      {/* 3. KOMMENDE EVENTS */}
      <section id="events" className="scroll-mt-24 bg-coal pb-24 pt-24 text-cream">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow="Kalender" title="Kommende events" light />
          {upcomingEvents.length === 0 && (
            <div className="mt-12 rounded-2xl border-[3px] border-cream/40 bg-ink/30 p-8 text-center">
              <p className="text-[16px] leading-[1.7] text-cream/90 md:text-[17px]">
                Vi annoncerer weeklies og turneringer løbende — følg med på{" "}
                <a
                  href="https://discord.gg/cX9P646RAG"
                  className="font-bold text-brick-soft underline underline-offset-4"
                >
                  Discord
                </a>{" "}
                eller{" "}
                <a
                  href="https://start.gg/fgcnord"
                  className="font-bold text-brick-soft underline underline-offset-4"
                >
                  start.gg
                </a>
                , hvor tilmeldingen også sker.
              </p>
            </div>
          )}
          <div className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible">
            {upcomingEvents.map((event, i) => (
              <motion.div
                key={event.id}
                className="snap-center"
                initial={from({ opacity: 0, y: 40, rotate: -1.5 })}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: EASE, delay: reduced ? 0 : i * 0.12 }}
              >
                <EventCard event={event} variant="olive" />
              </motion.div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              to="/turneringer"
              className={`link-underline inline-flex items-center gap-2 rounded-sm text-[15px] font-semibold uppercase tracking-[0.02em] text-cream ${FOCUS_DARK}`}
            >
              Se alle turneringer <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. WAVE DIVIDER coal → cream */}
      <WaveDivider fill="#F4F8FB" className="bg-coal" />

      {/* 5. HVAD ER FGC NORD */}
      <section className="bg-cream py-16 text-ink md:py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 lg:grid-cols-2">
          <motion.div
            initial={from({ clipPath: "inset(0 100% 0 0)" })}
            whileInView={{ clipPath: "inset(0 0% 0 0)" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <img
              src="/HimmerlanIgen%20(5).JPG"
              alt="Venue under HimmerLAN med setups, borde og stort projektorlærred"
              className="w-full rounded-2xl border-[3px] border-ink shadow-poster-lg"
            />
          </motion.div>
          <div>
            <SectionHeader eyebrow="Om os" title="Hvad er FGC Nord?" />
            <motion.p
              initial={from({ opacity: 0, y: 24 })}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: EASE, delay: reduced ? 0 : 0.1 }}
              className="mt-6 text-[16px] leading-[1.7] text-olive md:text-[17px]"
            >
              Vi er et grassroots-fællesskab startet af spillere i Nordjylland. Vi afholder ugentlige
              turneringer, træningsaftener og større events — i lokaler i Aalborg. Hos os er der
              plads til både den nysgerrige nybegynder og den garvede turneringsspiller.
            </motion.p>
            <ul className="mt-8 space-y-5">
              {VALUES.map((v, i) => (
                <motion.li
                  key={v.title}
                  initial={from({ opacity: 0, y: 24 })}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.6, ease: EASE, delay: reduced ? 0 : i * 0.15 }}
                  className="flex items-start gap-4"
                >
                  <motion.span
                    initial={from({ rotate: -90, scale: 0 })}
                    whileInView={{ rotate: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: reduced ? 0 : i * 0.15 }}
                    className="mt-1"
                  >
                    <Sparkle size={22} color="#00AEEF" />
                  </motion.span>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-ink">{v.title}</h3>
                    <p className="text-[15px] text-olive">{v.text}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <motion.div
              initial={from({ opacity: 0, y: 24 })}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE, delay: reduced ? 0 : 0.3 }}
              className="mt-9"
            >
              <Link
                to="/om"
                className={`inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-transparent px-7 py-3 text-[15px] font-semibold uppercase tracking-[0.02em] text-ink transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink hover:text-cream ${FOCUS_LIGHT}`}
              >
                Læs om fællesskabet <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. WAVE DIVIDER cream → coal */}
      <WaveDivider fill="#0A1E3C" className="bg-cream" />

      {/* 7. SPILLENE — pin-sektion (GSAP ScrollTrigger, isoleret komponent) */}
      <GamesPinSection />

      {/* 8. GALLERI — stemninger & resultater */}
      <WaveDivider fill="#F4F8FB" className="bg-coal" />
      <section className="bg-cream py-16 text-ink md:py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <SectionHeader eyebrow="Galleri" title="Stemninger & resultater" />
          <motion.p
            initial={from({ opacity: 0, y: 24 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE, delay: reduced ? 0 : 0.1 }}
            className="mt-6 max-w-2xl text-[16px] leading-[1.7] text-olive md:text-[17px]"
          >
            Top 8-grafikker og stemningsbilleder fra HimmerLAN og vores andre events — sådan ser
            det ud, når Nordjylland slås.
          </motion.p>
          <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
            {GALLERY.map((item, i) => (
              <motion.figure
                key={item.src}
                initial={from({ opacity: 0, y: 40, rotate: i % 2 === 0 ? -1.5 : 1.5 })}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: EASE, delay: reduced ? 0 : (i % 3) * 0.1 }}
                className="break-inside-avoid"
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  className="w-full rounded-2xl border-[3px] border-ink shadow-poster-lg"
                />
                <figcaption className="mt-2.5 px-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-olive">
                  {item.caption}
                </figcaption>
              </motion.figure>
            ))}
          </div>
          <motion.div
            initial={from({ opacity: 0, y: 24 })}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: EASE, delay: reduced ? 0 : 0.15 }}
            className="mt-10"
          >
            <Link
              to="/galleri"
              className="group inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-cream px-6 py-3 font-heading text-sm font-bold uppercase tracking-widest text-ink shadow-poster transition-all hover:-translate-y-0.5 hover:bg-brick hover:text-coal"
            >
              Se hele galleriet
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>
      <WaveDivider fill="#0A1E3C" className="bg-cream" />

      {/* 9. STAGE STRIKE TEASER (coal — matcher CTA-sektionens bølge) */}
      <section className="halftone-dark bg-coal py-16 text-center text-cream md:py-24">
        <div className="mx-auto max-w-[820px] px-6">
          <SectionHeader eyebrow="Værktøj" title="Strike som en pro" centered light />
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-[1.7] text-cream/85 md:text-[17px]">
            Brug vores interaktive stage strike-værktøj til Ultimate og Melee — med reglerne
            bygget ind. Samme stage, to tider på døgnet. Perfekt til weeklies og træning.
          </p>
          <div className="mt-10 flex justify-center gap-4 overflow-x-auto px-2 pb-2 md:gap-6">
            {TEASER_BANNERS.map((b, i) => (
              <motion.figure
                key={b.src}
                initial={from({ opacity: 0, y: 30, rotate: i % 2 === 0 ? -2 : 2 })}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.6, ease: EASE, delay: reduced ? 0 : i * 0.12 }}
                className="group w-[220px] shrink-0 md:w-[260px]"
              >
                <div className="overflow-hidden rounded-xl border-[3px] border-cream shadow-poster-cream">
                  <img
                    src={b.src}
                    alt={b.alt}
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                </div>
                <figcaption className="mt-2.5 flex items-baseline justify-between px-1 text-[12px] font-bold uppercase tracking-[0.12em]">
                  <span className="text-cream">{b.label}</span>
                  <span className="text-brick-soft">{b.time}</span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
          <motion.div
            initial={from({ scale: 0.9, opacity: 0 })}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="mt-10"
          >
            <Link
              to="/stage-strike"
              className={`inline-flex items-center gap-2 rounded-full border-[3px] border-cream bg-brick px-8 py-3.5 text-[15px] font-semibold uppercase tracking-[0.02em] text-ink shadow-poster-cream transition-all duration-200 hover:-translate-y-0.5 hover:bg-brick-soft ${FOCUS_DARK}`}
            >
              Prøv værktøjet <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 9. CTA */}
      <CTASection />
    </>
  );
}
