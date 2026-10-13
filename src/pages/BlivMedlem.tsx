import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  Heart,
  Loader2,
  LogIn,
  Shield,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { CTASection } from "@/components/CTASection";
import { DiscordWidget } from "@/components/DiscordWidget";
import { DISCORD_URL, DiscordIcon } from "@/components/Navbar";
import { PageHeader } from "@/components/PageHeader";
import { SectionHeader } from "@/components/SectionHeader";
import {
  Accordion,
  AccordionItem,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MeResponse {
  authenticated: boolean;
  player?: {
    gamertag: string;
    username?: string | null;
    avatarUrl?: string | null;
  };
  isMember: boolean;
  memberSince?: number | null;
}

const DiscordStepIcon = ({ className }: { className?: string }) => (
  <span className={className} aria-hidden="true">
    <DiscordIcon size={20} />
  </span>
);

const steps = [
  {
    icon: DiscordStepIcon,
    title: "Join Discord-serveren",
    text: "Hele fællesskabet lever på Discord — her finder du events, casuals, tech-talk og alt det sociale.",
  },
  {
    icon: LogIn,
    title: "Log ind med Discord",
    text: "Ét klik her på siden kobler din Discord-konto på FGC Nord. Ingen ny konto, ingen formular, ingen penge.",
  },
  {
    icon: BadgeCheck,
    title: "Du er medlem",
    text: "Medlemskab er bare en rolle på Discord'en, der viser, at du kæmper med til weeklies i Nordjylland. Vi spotter rollen automatisk — mere er der ikke i det.",
  },
];

const perks = [
  "Gratis medlemskab — for evigt",
  "Ugentlige meetups og casuals i Aalborg",
  "Tilmelding til turneringer direkte på siden",
  "Dine resultater og rankings samlet på din profil",
  "Medindflydelse på events via Discord-afstemninger",
  "Et venskabeligt community for alle niveauer",
];

const faqs = [
  {
    q: "Koster det noget at være medlem?",
    a: "Nej — FGC Nord er et fællesskab, ikke en forening. Der er intet kontingent. Vores events er gratis eller har en lav dørpris, der går direkte til lokale og udstyr.",
  },
  {
    q: "Hvorfor skal jeg bruge Discord?",
    a: "Discord er hjertet af fællesskabet: events, turneringstilmelding, afstemninger og det sociale foregår der. Når du er på serveren og kæmper med til weeklies, får du medlemsrollen — og dén rolle er hele medlemskabet. Ikke mere hokus end det.",
  },
  {
    q: "Hvad deler I med Discord — og hvad deler Discord med jer?",
    a: "Vi beder kun om adgang til dit Discord-brugernavn og avatar (scope: identify). Vi kan ikke læse dine beskeder, og vi kan ikke skrive som dig. Vi tjekker kun, om du har medlemsrollen på vores server.",
  },
  {
    q: "Kan man prøve at være med, før man joiner?",
    a: "Ja! Kom bare forbi en weekly — de første besøg er altid gratis og uforpligtende. Prøv spillet, mærk stemningen, og join Discord bagefter, hvis det er noget for dig.",
  },
  {
    q: "Er der plads til børn og unge?",
    a: "Absolut. Mange af vores spillere er unge, og events er altid bemandet med voksne frivillige. Forældre er velkomne til at kigge med — og Discord har selv en aldersgrænse på 13 år.",
  },
  {
    q: "Skal man være god til spillet?",
    a: "Slet ikke! Vi har spillere på alle niveauer, fra helt nye til erfarne turneringsspillere. Vores motto er, at alle kan blive bedre sammen.",
  },
];

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  state: "Login-sessionen udløb eller var ugyldig. Prøv at logge ind igen.",
  code: "Discord sendte dig tilbage uden en login-kode. Prøv igen.",
  discord: "Discord kunne ikke gennemføre login lige nu. Prøv igen om lidt.",
  config: "Discord-login er ikke sat op endnu. Sig til til crewet på Discord.",
};

function DiscordAuthCard() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const authError = searchParams.get("auth_error");
  const authErrorText = authError
    ? (AUTH_ERROR_MESSAGES[authError] ??
      "Noget gik galt under login. Prøv igen — og sig til på Discord, hvis det bliver ved.")
    : null;

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MeResponse | null) => setMe(data))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  const loginUrl = `/api/auth/discord?returnTo=${encodeURIComponent("/bliv-medlem")}`;

  return (
    <div className="rounded-2xl border-2 border-ink bg-coal p-8 text-cream shadow-poster-lg">
      {authErrorText && (
        <Alert variant="olive" role="alert" className="mb-6 border-brick/60 bg-ink/80 text-cream">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Login fejlede</AlertTitle>
          <AlertDescription className="flex items-start justify-between gap-3 text-cream/80">
            <span>{authErrorText}</span>
            <button
              type="button"
              aria-label="Luk fejlbesked"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete("auth_error");
                setSearchParams(next, { replace: true });
              }}
              className="shrink-0 rounded-md p-1 hover:bg-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </AlertDescription>
        </Alert>
      )}
      {loading ? (
        <div className="flex items-center gap-2 text-cream/70">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Tjekker din status...
        </div>
      ) : me?.authenticated && me.player ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center gap-4">
            {me.player.avatarUrl ? (
              <img
                src={me.player.avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full border-2 border-brick"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-brick bg-ink">
                <DiscordIcon size={28} />
              </div>
            )}
            <div>
              <p className="font-heading text-xl font-bold">
                {me.player.username || me.player.gamertag}
              </p>
              {me.isMember ? (
                <Badge className="mt-1 bg-emerald-500 text-coal hover:bg-emerald-400">
                  <BadgeCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Medlem af FGC Nord
                </Badge>
              ) : (
                <Badge className="mt-1 bg-brick text-coal hover:bg-brick-soft">
                  Logget ind — mangler medlemsrollen
                </Badge>
              )}
            </div>
          </div>
          {me.isMember ? (
            <p className="mt-4 text-sm text-cream/75">
              Du er medlem! Dit medlemskab er koblet på din Discord-konto, og du
              kan tilmelde dig turneringer direkte her på siden.
            </p>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-cream/75">
                Du er logget ind, men du har ikke medlemsrollen på
                Discord-serveren endnu. Join serveren og få rollen — så går
                det automatisk.
              </p>
              <Button
                asChild
                className="mt-4 bg-[#5865F2] text-white hover:bg-[#4752C4]"
              >
                <a href={DISCORD_URL} target="_blank" rel="noreferrer">
                  <DiscordIcon size={16} />
                  <span className="ml-2">Join Discord-serveren</span>
                </a>
              </Button>
            </div>
          )}
          <Button
            asChild
            variant="outline"
            className="mt-4 border-2 border-cream/40 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
          >
            <Link to="/turneringer">
              Se kommende turneringer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      ) : (
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#5865F2]">
              <DiscordIcon size={24} />
            </div>
            <div>
              <p className="font-heading font-bold">Log ind med Discord</p>
              <p className="text-sm text-cream/70">
                Din Discord-konto er dit medlemskab. Gratis, hurtigt og uden
                formularer.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="mt-5 w-full bg-[#5865F2] text-white hover:bg-[#4752C4]"
          >
            <a href={loginUrl}>
              <span className="mr-2 inline-flex">
                <DiscordIcon size={16} />
              </span>
              Log ind med Discord
            </a>
          </Button>
          <p className="mt-3 text-center text-xs text-cream/50">
            Vi beder kun om dit brugernavn og avatar — intet andet.
          </p>
        </div>
      )}
    </div>
  );
}

export function BlivMedlem() {
  return (
    <>
      <PageHeader
        eyebrow="Medlemskab"
        title="Bliv en del af fællesskabet"
        description="FGC Nord er et fællesskab for platform fighter-spillere i Nordjylland — og medlemskab er lige så nemt som det er gratis: Join Discord, log ind, og du er med."
      />

      {/* Steps */}
      <section className="section-padding bg-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Sådan gør du"
            title="Tre skridt — så er du med"
            description="Ingen kontingent, ingen formular, ingen generalforsamling. Bare dig og Discord."
            centered
            className="mx-auto"
          />
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="card-poster relative p-6"
              >
                <span className="absolute -top-3 left-6 rounded-full border-2 border-ink bg-brick px-3 py-0.5 font-display text-sm font-bold text-coal shadow-poster-sm">
                  {i + 1}
                </span>
                <div className="mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-lg border-2 border-ink bg-cream-dim shadow-poster-sm">
                  <step.icon className="h-5 w-5 text-brick" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-xl font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-ink/70">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Login + perks */}
      <section className="section-padding bg-coal text-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <SectionHeader
                eyebrow="Medlemskab"
                title="Gratis. For altid."
                description="Medlemskab af FGC Nord koster ikke en krone. Alt hvad du skal bruge er en Discord-konto — og lysten til at spille."
                light
              />
              <ul className="mt-6 space-y-3">
                {perks.map((perk, i) => (
                  <motion.li
                    key={perk}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    className="flex items-start gap-3"
                  >
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-brick-soft" aria-hidden="true" />
                    <span>{perk}</span>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-8 rounded-xl border-2 border-cream/20 bg-coal p-5">
                <div className="flex items-start gap-3">
                  <Heart className="mt-0.5 h-5 w-5 shrink-0 text-brick-soft" aria-hidden="true" />
                  <p className="text-sm text-cream/75">
                    Vil du støtte fællesskabet? Kom til events, tag en ven med,
                    eller meld dig som frivillig i crew'et. Det er den bedste
                    støtte, vi kan få.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-24">
              <DiscordAuthCard />
              <div className="mt-6">
                <DiscordWidget />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: Users, label: "50+ spillere" },
                  { icon: Trophy, label: "Ugentlige events" },
                  { icon: Shield, label: "Trygt fællesskab" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border-2 border-cream/20 bg-coal/60 p-4"
                  >
                    <s.icon className="mx-auto h-5 w-5 text-brick-soft" aria-hidden="true" />
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-cream/80">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="FAQ"
            title="Ofte stillede spørgsmål"
            description="Svar til både spillere og forældre. Mangler du noget, så spørg os på Discord."
            centered
            className="mx-auto"
          />
          <div className="mx-auto max-w-3xl">
            <Accordion>
              {faqs.map((item) => (
                <AccordionItem key={item.q} title={item.q}>
                  {item.a}
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <p className="mx-auto mt-8 flex max-w-3xl items-center justify-center gap-2 text-sm text-ink/60">
            <Sparkles className="h-4 w-4 text-brick" aria-hidden="true" />
            Medlemskab spores automatisk via medlemsrollen på vores
            Discord-server — intet papirarbejde, ingen manuelle lister.
          </p>
        </div>
      </section>

      <CTASection />
    </>
  );
}
