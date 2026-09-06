import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Heart,
  Mail,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

import { CTASection } from "@/components/CTASection";
import { DISCORD_URL, DiscordIcon } from "@/components/Navbar";
import { PageHeader } from "@/components/PageHeader";
import { SafeImage } from "@/components/SafeImage";
import { SectionHeader } from "@/components/SectionHeader";
import { Sparkle } from "@/components/Sparkle";
import { Button } from "@/components/ui/button";

const milestones = [
  {
    year: "2022",
    title: "Det hele starter",
    description:
      "En lille gruppe Smash-spillere i Aalborg begynder at mødes ugentligt til casuals og friendlies.",
  },
  {
    year: "2023",
    title: "Første lokale event",
    description:
      "FGC Nord afholder den første større turnering med både Melee og Ultimate på programmet.",
  },
  {
    year: "2024",
    title: "FGC Nord bliver til",
    description:
      "Fællesskabet får et navn, en Discord-server og faste ugentlige meetups.",
  },
  {
    year: "2025",
    title: "RoA2 joiner familien",
    description:
      "Rivals of Aether 2 bliver en fast del af vores events og community.",
  },
];

const values = [
  {
    title: "Inklusion",
    description:
      "Alle er velkomne uanset niveau. Vi hjælper nye spillere i gang og fejrer personlig fremgang.",
    icon: Heart,
  },
  {
    title: "Fair play",
    description:
      "Vi tror på respektfuld konkurrence. Håndtryk før og efter kampen er obligatorisk.",
    icon: Shield,
  },
  {
    title: "Fællesskab",
    description:
      "Det sociale er lige så vigtigt som spillet. Venskaber opstår naturligt ved setups og på Discord.",
    icon: Users,
  },
];

const board: { role: string; name?: string; avatar: string }[] = [
  {
    role: "Primus motor",
    name: "Emil Yusaku Tauchi",
    avatar: "/board-avatars/avatar-1.png",
  },
  {
    role: "Eventansvarlig",
    name: "Aksel Bang Knudsen",
    avatar: "/board-avatars/avatar-2.png",
  },
  {
    role: "TO & bracket-hjælp",
    avatar: "/board-avatars/avatar-3.png",
  },
  {
    role: "SoMe & grafik",
    avatar: "/board-avatars/avatar-4.png",
  },
  {
    role: "Kommunikation",
    avatar: "/board-avatars/avatar-5.png",
  },
];

export function Om() {
  return (
    <>
      <PageHeader
        eyebrow="Om fællesskabet"
        title="FGC Nord"
        description="Nordjyllands platform fighter-community. Drevet af frivillige, drevet af passion for fighting games."
      />

      {/* Mission */}
      <section className="section-padding bg-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-3xl text-ink sm:text-4xl">
                Vores mission
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink/70">
                FGC Nord eksisterer for at skabe et inkluderende miljø for
                platform fighter-spillere i Nordjylland. Vi vil gøre det nemt at
                finde ligesindede, træne, konkurrere og have det sjovt — uanset
                om du spiller Melee, Ultimate eller Rivals of Aether 2.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-ink/70">
                Gennem ugentlige meetups, månedlige turneringer og sociale
                arrangementer bygger vi et community, hvor alle kan udvikle sig
                som spillere og mennesker.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <SafeImage
                src="/omos-biltur.jpg"
                alt="Tre FGC Nord-medlemmer på vej til event i bilen"
                className="rounded-2xl border-2 border-ink object-cover shadow-poster-lg"
              />
              <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl border-2 border-ink bg-brick shadow-poster" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="section-padding bg-coal text-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Historie"
            title="Vores rejse"
            description="Fra en håndfuld venner i en kælder til et organiseret community med events hele året rundt."
            centered
            light
            className="mx-auto"
          />

          <div className="relative mt-12">
            <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-cream/20 sm:left-1/2 sm:-ml-0.5" />
            <div className="space-y-12">
              {milestones.map((milestone, i) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={cn(
                    "relative flex items-start",
                    i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "hidden sm:block sm:w-1/2",
                      i % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:pl-12"
                    )}
                  >
                    <h3 className="font-display text-2xl">{milestone.year}</h3>
                    <p className="font-heading font-bold">{milestone.title}</p>
                    <p className="mt-1 text-cream/70">
                      {milestone.description}
                    </p>
                  </div>

                  <div className="absolute left-4 top-0 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-cream bg-brick sm:left-1/2">
                    <Sparkle size={14} color="#F4F8FB" />
                  </div>

                  <div className="pl-12 sm:hidden">
                    <h3 className="font-display text-2xl">{milestone.year}</h3>
                    <p className="font-heading font-bold">{milestone.title}</p>
                    <p className="mt-1 text-cream/70">
                      {milestone.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Værdier"
            title="Det vi står for"
            centered
            className="mx-auto"
          />

          <div className="grid gap-6 sm:grid-cols-3">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="card-poster p-6 transition-shadow hover:shadow-poster-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink bg-cream-dim shadow-poster-sm">
                  <value.icon className="h-5 w-5 text-brick" />
                </div>
                <h3 className="font-heading text-xl font-bold text-ink">{value.title}</h3>
                <p className="mt-2 text-ink/70">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Board */}
      <section className="section-padding bg-coal text-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Crew"
            title="Menneskerne bag FGC Nord"
            description="Alt drives af frivillige fra community'et — og der er altid plads til flere hænder. Måske er der en rolle til dig?"
            centered
            light
            className="mx-auto"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {board.map((member, i) => (
              <motion.div
                key={member.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-xl border-2 border-cream/10 bg-ink p-6 text-center shadow-poster transition-colors hover:border-brick/50"
              >
                <SafeImage
                  src={member.avatar}
                  alt={member.name ?? `Ledig plads som ${member.role}`}
                  className="mx-auto h-28 w-28 rounded-full border-4 border-cream/20 object-cover"
                />
                <h3 className="mt-4 font-heading text-lg font-bold">
                  {member.name ?? "Dig?"}
                </h3>
                <p className="text-brick-soft">{member.role}</p>
                {!member.name && (
                  <p className="mt-1 text-sm text-cream/60">
                    Frivillig crew-rolle — åben for alle
                  </p>
                )}
              </motion.div>
            ))}

            {/* Vil du stille op? */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: board.length * 0.1, duration: 0.5 }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-brick/60 bg-ink/60 p-6 text-center shadow-poster"
            >
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-dashed border-brick/50 bg-coal">
                <UserPlus className="h-10 w-10 text-brick-soft" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold">
                Vil du stille op?
              </h3>
              <p className="mt-1 text-sm text-cream/70">
                Drømmer du om at forme Nordjyllands stærkeste
                fighting game-community? Skriv til os — vi vil rigtig gerne
                høre fra dig.
              </p>
              <Button
                asChild
                className="mt-4 bg-brick text-coal hover:bg-brick-soft"
              >
                <a href={DISCORD_URL} target="_blank" rel="noreferrer">
                  <DiscordIcon size={16} />
                  <span className="ml-2">Skriv til os</span>
                </a>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sådan virker vi + medlemskab via Discord */}
      <section className="section-padding bg-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <SectionHeader
                eyebrow="Sådan virker vi"
                title="Åbent og uden hokus-pokus"
                description="FGC Nord er et fællesskab, ikke en forening — ingen kontingent, ingen generalforsamling. Bare mennesker, der elsker platform fighters."
              />
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="mt-1 h-5 w-5 shrink-0 text-brick" aria-hidden="true" />
                  <p className="text-ink/70">
                    Vi har fælles regler for god opførsel på events og på
                    Discord. De er skrevet i fællesskab, ligger åbent på
                    serveren, og gælder for alle — nye som gamle.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="mt-1 h-5 w-5 shrink-0 text-brick" aria-hidden="true" />
                  <p className="text-ink/70">
                    Beslutninger om events, turneringer og alt muligt andet
                    tages i det åbne på Discord. Alle medlemmer kan følge med,
                    komme med idéer og være med til at stemme.
                  </p>
                </div>
              </div>
              <Button
                asChild
                className="mt-8 bg-brick text-coal hover:bg-brick-soft"
              >
                <Link to="/bliv-medlem">
                  Bliv medlem
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Medlemskab via Discord */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border-2 border-ink bg-coal p-8 text-cream shadow-poster-lg"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-cream/20 bg-[#5865F2]">
                  <DiscordIcon size={24} />
                </div>
                <h3 className="font-display text-2xl">Medlemskab = Discord</h3>
              </div>
              <p className="mt-4 text-cream/80">
                Hos os er medlemskab bare en rolle på Discord'en, der viser, at
                du kæmper med til weeklies i Nordjylland. Det er gratis, og vi
                spotter rollen automatisk, når du logger ind med Discord her på
                siden — så kan du tilmelde dig turneringer og følge dine
                resultater.
              </p>
              <ul className="mt-5 space-y-3">
                <li className="flex items-start gap-3">
                  <Heart className="mt-0.5 h-5 w-5 shrink-0 text-brick-soft" aria-hidden="true" />
                  <span className="text-sm text-cream/80">
                    Ingen kontingent — fællesskabet er gratis for alle.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-brick-soft" aria-hidden="true" />
                  <span className="text-sm text-cream/80">
                    Din Discord-konto er din medlemsprofil. Du bestemmer selv,
                    hvad du deler.
                  </span>
                </li>
              </ul>
              <Button
                asChild
                variant="outline"
                className="mt-6 border-2 border-cream/40 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
              >
                <Link to="/bliv-medlem">
                  Se hvordan du joiner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Kontakt */}
      <section className="section-padding bg-cream-dim">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Kontakt"
            title="Vil du vide mere?"
            description="Har du spørgsmål til events, medlemskab eller vil du være en del af crew'et? Tag fat i os — vi svarer hurtigt."
            centered
            className="mx-auto"
          />
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            <motion.a
              href={DISCORD_URL}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="card-poster-interactive flex items-center gap-4 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-coal shadow-poster-sm">
                <DiscordIcon size={22} />
              </div>
              <div>
                <p className="font-heading font-bold text-ink">Discord</p>
                <p className="text-sm text-ink/70">
                  Hurtigste vej til os — skriv i #generelt
                </p>
              </div>
            </motion.a>
            <motion.a
              href="mailto:kontakt@fgcnord.dk"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="card-poster-interactive flex items-center gap-4 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-cream shadow-poster-sm">
                <Mail className="h-5 w-5 text-brick" aria-hidden="true" />
              </div>
              <div>
                <p className="font-heading font-bold text-ink">Email</p>
                <p className="text-sm text-ink/70">kontakt@fgcnord.dk</p>
              </div>
            </motion.a>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
