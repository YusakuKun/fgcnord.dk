import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  CalendarX2,
  LayoutGrid,
  List,
  MapPin,
  RotateCcw,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AddToCalendarButton } from "@/components/EventCard";
import { PageHeader } from "@/components/PageHeader";
import { CTASection } from "@/components/CTASection";
import { WaveDivider } from "@/components/WaveDivider";
import { Countdown } from "@/components/turneringer/Countdown";
import { SelfServeSteps } from "@/components/turneringer/SelfServeSteps";
import { StartggEvents } from "@/components/turneringer/StartggEvents";
import { TurneringCard } from "@/components/turneringer/TurneringCard";
import {
  gameChipClasses,
  gameDotColors,
  gameLabels,
  isPastEvent,
} from "@/components/turneringer/gameStyles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { allEvents } from "@/data/events";
import { fetchCalendarEvents } from "@/lib/calendar";
import { cn } from "@/lib/utils";
import type { FgcEvent } from "@/types";

const gameFilters = [
  { value: "all", label: "Alle spil" },
  { value: "melee", label: "Melee" },
  { value: "ultimate", label: "Ultimate" },
  { value: "roa2", label: "Rivals 2" },
] as const;

const dateFilters = [
  { value: "upcoming", label: "Kommende" },
  { value: "all", label: "Alle datoer" },
] as const;

const formatFilters = [
  { value: "all", label: "Alle formater" },
  { value: "offline", label: "Offline" },
  { value: "online", label: "Online" },
] as const;

type LoadState = "loading" | "ready" | "error";

export function Turneringer() {
  const [events, setEvents] = useState<FgcEvent[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"google" | "fallback">("fallback");

  const [gameFilter, setGameFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("upcoming");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    const isCancelled = () => signal?.cancelled ?? false;
    setLoadState("loading");
    setError(null);
    try {
      const result = await fetchCalendarEvents();
      if (isCancelled()) return;
      setEvents(result.events);
      setSource(result.source);
      setError(result.error ?? null);
      setLoadState("ready");
    } catch (err) {
      if (isCancelled()) return;
      setEvents(allEvents);
      setSource("fallback");
      setError(err instanceof Error ? err.message : "Fejl ved indlæsning");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    void load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        if (gameFilter !== "all" && event.game !== gameFilter) return false;
        if (formatFilter !== "all" && event.format !== formatFilter) return false;
        if (dateFilter === "upcoming" && isPastEvent(event)) return false;
        return true;
      })
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
  }, [events, gameFilter, dateFilter, formatFilter]);

  const nextEvent = useMemo(
    () =>
      events
        .filter((e) => !isPastEvent(e))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null,
    [events],
  );

  const stats = useMemo(() => {
    const upcoming = events.filter((e) => !isPastEvent(e)).length;
    const offline = events.filter((e) => e.format !== "online").length;
    const online = events.filter((e) => e.format === "online").length;
    return { upcoming, offline, online };
  }, [events]);

  const resetFilters = () => {
    setGameFilter("all");
    setDateFilter("all");
    setFormatFilter("all");
  };

  const filtersActive =
    gameFilter !== "all" || dateFilter !== "upcoming" || formatFilter !== "all";
  const loading = loadState === "loading";

  return (
    <>
      <PageHeader
        eyebrow="Turneringer"
        title="Eventkalender"
        description="Weeklys, monthlys og majors i Nordjylland. Alle events er selvbetjente — tilmeld dig, check ind og indberet selv dine kampe på start.gg."
      >
        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            icon={<CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />}
            value={stats.upcoming}
            label="Kommende"
            iconClass="text-brick"
          />
          <StatCard
            icon={<MapPin className="h-5 w-5 sm:h-6 sm:w-6" />}
            value={stats.offline}
            label="Offline"
            iconClass="text-olive"
          />
          <StatCard
            icon={<Users className="h-5 w-5 sm:h-6 sm:w-6" />}
            value={stats.online}
            label="Online"
            iconClass="text-brick-soft"
          />
        </div>
      </PageHeader>

      <section className="section-padding bg-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          {/* Countdown til næste event */}
          {!loading && nextEvent && (
            <div className="mb-8">
              <Countdown event={nextEvent} />
            </div>
          )}

          {/* Live events fra start.gg (vises kun når integrationen er sat op) */}
          <StartggEvents />

          {/* Filtre */}
          <div
            className="mb-6 rounded-xl border-2 border-ink bg-cream-dim p-4 shadow-poster sm:mb-8 sm:p-5"
            role="group"
            aria-label="Filtrer events"
          >
            <div className="flex flex-col gap-5">
              <FilterRow label="Spil">
                {gameFilters.map((option) => (
                  <FilterChip
                    key={option.value}
                    active={gameFilter === option.value}
                    onClick={() => setGameFilter(option.value)}
                    dot={gameDotColors[option.value]}
                  >
                    {option.label}
                  </FilterChip>
                ))}
              </FilterRow>
              <div className="flex flex-wrap gap-x-8 gap-y-5">
                <FilterRow label="Dato">
                  {dateFilters.map((option) => (
                    <FilterChip
                      key={option.value}
                      active={dateFilter === option.value}
                      onClick={() => setDateFilter(option.value)}
                    >
                      {option.label}
                    </FilterChip>
                  ))}
                </FilterRow>
                <FilterRow label="Format">
                  {formatFilters.map((option) => (
                    <FilterChip
                      key={option.value}
                      active={formatFilter === option.value}
                      onClick={() => setFormatFilter(option.value)}
                    >
                      {option.label}
                    </FilterChip>
                  ))}
                </FilterRow>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-ink transition-all hover:-translate-y-0.5 hover:bg-ink hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Nulstil filtre
                </button>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/60" aria-live="polite">
              {loading
                ? "Henter events..."
                : `${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""} fundet`}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={source === "google" ? "secondary" : "outline"}>
                {source === "google" ? "Google Calendar" : "Lokal kalender"}
              </Badge>
              <div
                className="flex rounded-md border-2 border-ink bg-cream p-0.5 shadow-poster-sm"
                role="group"
                aria-label="Vælg visning"
              >
                <Button
                  type="button"
                  variant={view === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView("grid")}
                  aria-label="Grid-visning"
                  aria-pressed={view === "grid"}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant={view === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView("list")}
                  aria-label="Listevisning"
                  aria-pressed={view === "list"}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          {/* Fejltilstand */}
          {loadState === "error" && (
            <Alert className="mb-6" variant="olive" role="alert">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Kunne ikke hente kalenderen</AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                <span>
                  Noget gik galt ved indlæsning af events
                  {error ? `: ${error}` : "."} Vi viser senest kendte
                  event-data i stedet.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit border-ink"
                  onClick={() => void load()}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Prøv igen
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Kalender-fallback info */}
          {loadState === "ready" && error && source === "fallback" && (
            <Alert className="mb-6" variant="olive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Kalender ikke tilsluttet</AlertTitle>
              <AlertDescription>
                Vi kunne ikke hente live-events fra Google Calendar, så vi viser
                planlagte events i stedet. Tilmelding sker altid via{" "}
                <a
                  href="https://start.gg/fgcnord"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline decoration-2 underline-offset-2"
                >
                  start.gg/fgcnord
                </a>
                .
              </AlertDescription>
            </Alert>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              aria-busy="true"
              aria-label="Indlæser events"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border-[3px] border-ink bg-cream p-5 shadow-poster"
                >
                  <div className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-xl" />
                    <div className="flex-1 space-y-2 pt-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  </div>
                  <Skeleton className="mt-4 h-3 w-32" />
                  <Skeleton className="mt-3 h-16 w-full" />
                  <Skeleton className="mt-4 h-10 w-full rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* Event grid/list */}
          <AnimatePresence mode="wait">
            {!loading && (
              <motion.div
                key={view}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {filteredEvents.length > 0 ? (
                  view === "grid" ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredEvents.map((event, i) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i, 8) * 0.05 }}
                          className="min-w-0"
                        >
                          <TurneringCard event={event} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {filteredEvents.map((event, i) => (
                        <EventListItem key={event.id} event={event} index={i} />
                      ))}
                    </ul>
                  )
                ) : (
                  <div className="rounded-xl border-2 border-ink bg-cream-dim p-8 text-center shadow-poster sm:p-12">
                    <CalendarX2
                      className="mx-auto mb-4 h-12 w-12 text-ink/30"
                      aria-hidden="true"
                    />
                    <h2 className="font-heading text-xl font-bold text-ink">
                      Ingen events fundet
                    </h2>
                    {events.length === 0 ? (
                      <p className="mx-auto mt-2 max-w-md text-ink/60">
                        Der er ingen planlagte events lige nu. Vi annoncerer weeklies og
                        turneringer løbende på{" "}
                        <a
                          href="https://discord.gg/cX9P646RAG"
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-brick underline underline-offset-2"
                        >
                          Discord
                        </a>{" "}
                        og{" "}
                        <a
                          href="https://start.gg/fgcnord"
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-brick underline underline-offset-2"
                        >
                          start.gg
                        </a>
                        .
                      </p>
                    ) : (
                      <>
                        <p className="mt-2 text-ink/60">
                          Prøv at nulstille filtrene for at se flere events.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4 border-ink"
                          onClick={resetFilters}
                        >
                          <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" />
                          Nulstil filtre
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <WaveDivider fill="#0B1526" className="bg-cream" />

      {/* Selvbetjent format — 4 trin */}
      <SelfServeSteps />

      <CTASection />
    </>
  );
}

function StatCard({
  icon,
  value,
  label,
  iconClass,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border-2 border-ink bg-cream p-3 text-center shadow-poster sm:p-4">
      <span className={cn("mx-auto mb-1 block w-fit", iconClass)}>{icon}</span>
      <p className="font-display text-xl sm:text-2xl">{value}</p>
      <p className="text-[10px] text-ink/60 sm:text-xs">{label}</p>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-widest text-ink/60">
        {label}:
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  dot,
  children,
}: {
  active: boolean;
  onClick: () => void;
  dot?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brick focus-visible:ring-offset-2",
        active
          ? "bg-ink text-cream shadow-poster-sm"
          : "bg-cream text-ink hover:-translate-y-0.5 hover:shadow-poster-sm",
      )}
    >
      {dot && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: dot }}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

function EventListItem({ event, index }: { event: FgcEvent; index: number }) {
  const start = new Date(event.date);
  const isOnline = event.format === "online";
  const past = isPastEvent(event);
  const game = event.game ?? "all";

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      className={cn(
        "flex flex-col gap-4 rounded-xl border-2 border-ink bg-cream p-4 shadow-poster-sm transition-all hover:-translate-y-0.5 hover:shadow-poster sm:flex-row sm:items-center",
        past && "opacity-60",
      )}
    >
      <div
        className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-ink text-center text-ink shadow-poster-sm"
        style={{ background: gameDotColors[game] }}
        aria-hidden="true"
      >
        <span className="font-display text-lg leading-none">
          {start.getDate()}
        </span>
        <span className="text-[10px] font-bold uppercase">
          {start.toLocaleDateString("da-DK", { month: "short" })}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("border-2", gameChipClasses[game])}
          >
            {gameLabels[game]}
          </Badge>
          <Badge variant="outline">{isOnline ? "Online" : "Offline"}</Badge>
          {past && <Badge variant="outline">Afholdt</Badge>}
        </div>
        <h3 className="truncate font-heading text-base font-bold sm:text-lg">
          {event.title}
        </h3>
        <p className="mt-0.5 text-sm text-ink/60">
          {start.toLocaleDateString("da-DK", {
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {event.location && ` · ${event.location}`}
          {event.attendees !== undefined &&
            event.maxAttendees !== undefined &&
            ` · ${event.attendees}/${event.maxAttendees} tilmeldte`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch lg:flex-row">
        <AddToCalendarButton event={event} />
        <Button
          asChild
          variant="default"
          size="sm"
          className="bg-ink text-cream hover:bg-brick hover:text-ink"
        >
          <a
            href={event.startggUrl || event.url || "https://start.gg/fgcnord"}
            target="_blank"
            rel="noreferrer"
          >
            {past ? (
              <>
                <ArrowUpRight className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Se resultater
              </>
            ) : (
              <>
                <CalendarPlus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Tilmeld
              </>
            )}
          </a>
        </Button>
      </div>
    </motion.li>
  );
}
