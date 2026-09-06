import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Copy,
  Crown,
  Download,
  Gamepad2,
  KeyRound,
  Megaphone,
  Play,
  Plus,
  QrCode,
  RefreshCw,
  ShieldAlert,
  Swords,
  Trash2,
  Users,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/PageHeader";
import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  adminCreateTournament,
  adminImportEntrants,
  adminListTournaments,
  adminOpenLobby,
  adminCloseLobby,
  adminStartTournament,
  adminDeleteTournament,
  adminImportStartggResults,
  adminAnnounceEvent,
  adminSyncRankRoles,
  adminExportSeeding,
  type AdminTournament,
  type ImportResultsSummary,
} from "@/lib/tournamentApi";
import { getStartggEvents, type StartggEvent } from "@/lib/startggApi";
import { adminKickFromLobby, getCurrentLobby, type LobbyState } from "@/lib/lobbyApi";

const KEY_STORAGE = "fgc_admin_key";

const gameLabels: Record<string, string> = {
  melee: "Melee",
  ultimate: "Ultimate",
  roa2: "Rivals of Aether 2",
};

const statusLabels: Record<string, string> = {
  signup: "Åben for tilmelding",
  checkin: "Check-in i gang",
  live: "Igangværende",
  done: "Afsluttet",
};

const statusColors: Record<string, string> = {
  signup: "bg-brick text-coal",
  checkin: "bg-amber-400 text-coal",
  live: "bg-emerald-500 text-coal",
  done: "bg-ink/20 text-ink",
};

function formatDateTime(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("da-DK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Admin() {
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY_STORAGE) || "");
  const [keyInput, setKeyInput] = useState("");
  const [discordAdmin, setDiscordAdmin] = useState(false);
  const [meChecked, setMeChecked] = useState(false);
  const [tournaments, setTournaments] = useState<AdminTournament[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Opret-formular
  const [name, setName] = useState("");
  const [game, setGame] = useState("ultimate");
  const [format, setFormat] = useState("double_elim");
  const [startAt, setStartAt] = useState("");
  const [startggSlug, setStartggSlug] = useState("");

  // Lobby
  const [lobby, setLobby] = useState<LobbyState | null>(null);
  const [lobbyTitle, setLobbyTitle] = useState("");
  const [lobbyGame, setLobbyGame] = useState("ultimate");
  const [lobbyStations, setLobbyStations] = useState("2");

  // start.gg: resultat-import + annoncering
  const [importSlug, setImportSlug] = useState("");
  const [importGame, setImportGame] = useState("auto");
  const [sgEvents, setSgEvents] = useState<StartggEvent[] | null>(null);

  const unlocked = key.length > 0 || discordAdmin;

  // Er brugeren logget ind med Discord og har @Admin-rollen?
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { isAdmin?: boolean } | null) => {
        if (data?.isAdmin) setDiscordAdmin(true);
      })
      .catch(() => {})
      .finally(() => setMeChecked(true));
  }, []);

  const load = useCallback(async () => {
    if (!key && !discordAdmin) return;
    setError(null);
    try {
      const data = await adminListTournaments(key);
      setTournaments(data.tournaments);
      const lobbyRes = await getCurrentLobby();
      setLobby(lobbyRes.lobby);
    } catch (err) {
      setTournaments(null);
      setError(err instanceof Error ? err.message : "Kunne ikke hente turneringer");
    }
  }, [key, discordAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!key && !discordAdmin) return;
    getStartggEvents()
      .then((r) => setSgEvents(r.events))
      .catch(() => setSgEvents(null));
  }, [key, discordAdmin]);

  const unlock = () => {
    if (keyInput.trim().length < 8) {
      setError("Nøglen ser for kort ud.");
      return;
    }
    sessionStorage.setItem(KEY_STORAGE, keyInput.trim());
    setKey(keyInput.trim());
    setKeyInput("");
    setError(null);
  };

  const forgetKey = () => {
    sessionStorage.removeItem(KEY_STORAGE);
    setKey("");
    setTournaments(null);
  };

  const handleCreate = async () => {
    if (name.trim().length < 2) {
      setError("Giv turneringen et navn.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body: Parameters<typeof adminCreateTournament>[1] = {
        name: name.trim(),
        game,
        format,
      };
      if (startAt) body.start_at = new Date(startAt).getTime();
      if (startggSlug.trim()) body.startgg_slug = startggSlug.trim();
      const res = await adminCreateTournament(key, body);
      setNotice(
        `Turnering oprettet! Join-kode: ${res.tournament.join_code} — den er nu postet på Discord.`,
      );
      setName("");
      setStartAt("");
      setStartggSlug("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke oprette turnering");
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async (t: AdminTournament) => {
    if (!confirm(`Start bracket for "${t.name}"?\n${t.checked_in}/${t.entrants} spillere er checket ind.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await adminStartTournament(key, t.join_code);
      setNotice(`Bracket live for "${t.name}" — ${res.matches} kampe genereret!`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke starte bracket");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (t: AdminTournament) => {
    if (
      !confirm(
        `Slet "${t.name}" (${t.join_code})?\n\nDette fjerner turneringen, alle tilmeldinger og alle kampe permanent. Kan ikke fortrydes.`,
      )
    ) {
      return;
    }
    if (!confirm(`Er du HELT sikker? "${t.name}" slettes for altid.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminDeleteTournament(key, t.join_code);
      setNotice(`Turneringen "${t.name}" er slettet.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke slette turneringen");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = (code: string) => {
    void navigator.clipboard.writeText(`${window.location.origin}/t/${code}`);
    setNotice(`Join-link kopieret: /t/${code}`);
  };

  const handleImportEntrants = async (t: AdminTournament) => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminImportEntrants(key, t.join_code);
      setNotice(
        `Hentede ${res.total} tilmeldte fra start.gg-eventet "${res.event}": ${res.imported} nye tilføjet, ${res.alreadyRegistered} var allerede tilmeldt.`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke hente tilmeldte fra start.gg");
    } finally {
      setBusy(false);
    }
  };

  const handleExportSeeding = async (t: AdminTournament) => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminExportSeeding(key, t.join_code);
      setNotice(
        `Seeding sendt til "${res.event}" (${res.phase}): ${res.seeded} spillere seedet efter rating.` +
          (res.unmatchedSite.length > 0
            ? ` Ikke fundet på start.gg: ${res.unmatchedSite.join(", ")}.`
            : ""),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke sende seeding til start.gg");
    } finally {
      setBusy(false);
    }
  };

  const handleOpenLobby = async () => {
    if (lobbyTitle.trim().length < 2) {
      setError("Giv lobbyen en titel.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminOpenLobby(key, {
        title: lobbyTitle.trim(),
        game: lobbyGame,
        stations: Number(lobbyStations) || 2,
      });
      setNotice(`Lobby "${lobbyTitle.trim()}" er åben — postet på Discord.`);
      setLobbyTitle("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke åbne lobby");
    } finally {
      setBusy(false);
    }
  };

  const handleCloseLobby = async () => {
    if (!lobby) return;
    if (!confirm(`Luk lobbyen "${lobby.title}"? Uafsluttede kampe aflyses, og ranglisten postes på Discord.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminCloseLobby(key, lobby.id);
      setNotice("Lobby lukket — aftenens rangliste er postet på Discord.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke lukke lobby");
    } finally {
      setBusy(false);
    }
  };

  const handleKick = async (playerId: string, gamertag: string) => {
    if (!lobby) return;
    if (!confirm(`Fjern ${gamertag} fra lobbyen "${lobby.title}"?`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminKickFromLobby(key, lobby.id, playerId);
      setNotice(`${gamertag} er fjernet fra lobbyen.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke fjerne spilleren");
    } finally {
      setBusy(false);
    }
  };

  const handleSyncRanks = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await adminSyncRankRoles(key);
      const parts = [
        res.assigned.length > 0
          ? `Tildelt: ${res.assigned.map((a) => `${a.game} #${a.rank} ${a.gamertag}`).join(", ")}.`
          : "Ingen nye roller tildelt.",
        res.removed.length > 0
          ? `Fjernet: ${res.removed.map((r) => `${r.game} #${r.rank} ${r.gamertag}`).join(", ")}.`
          : "",
      ];
      if (res.skipped.length > 0) parts.push(`Sprunget over: ${res.skipped.join(" · ")}`);
      setNotice(`Rang-roller synkroniseret. ${parts.filter(Boolean).join(" ")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke synkronisere rang-roller");
    } finally {
      setBusy(false);
    }
  };

  const handleImportResults = async () => {
    if (importSlug.trim().length < 5) {
      setError("Indsæt en start.gg event-slug (eller fuld URL).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res: ImportResultsSummary = await adminImportStartggResults(
        key,
        importSlug.trim(),
        importGame === "auto" ? undefined : importGame,
      );
      const parts = [
        `${res.imported} nye sæt talt med på ${gameLabels[res.game] || res.game}-ranglisten fra "${res.event}".`,
        res.skipped > 0 ? `${res.skipped} sprunget over (allerede importeret/DQ/bye).` : "",
      ];
      if (res.unmatched.length > 0) {
        parts.push(
          `Kunne ikke matche: ${res.unmatched.slice(0, 8).join(", ")} — opret dem i lobbyen og importér igen.`,
        );
      }
      setNotice(parts.filter(Boolean).join(" "));
      setImportSlug("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Importen fejlede");
    } finally {
      setBusy(false);
    }
  };

  const handleAnnounce = async (slug: string, eventName: string) => {
    if (!confirm(`Annoncér "${eventName}" på Discord med ping til medlemsrollen?`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminAnnounceEvent(key, slug);
      setNotice(`"${eventName}" er annonceret på Discord.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Annonceringen fejlede");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- Lås-skærm ---------- */
  if (!meChecked) {
    return null; // tjekker om Discord-sessionen allerede er admin
  }
  if (!unlocked) {
    return (
      <>
        <PageHeader
          eyebrow="Admin"
          title="LazyTO-kontrolpanel"
          description="Opret ugens turneringer og start brackets — direkte fra browseren."
        />
        <section className="section-padding bg-cream">
          <div className="container-site px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-md rounded-2xl border-[3px] border-ink bg-cream-dim p-8 text-ink shadow-poster"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-ink bg-coal shadow-poster-sm">
                <KeyRound className="h-6 w-6 text-brick-soft" aria-hidden="true" />
              </div>
              <h2 className="text-center font-heading text-xl font-bold">
                Indtast admin-nøgle
              </h2>
              <p className="mt-2 text-center text-sm text-ink/60">
                Nøglen gemmes kun i denne browser-session og sendes aldrig
                andre steder end til fgcnord.dk.
              </p>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && unlock()}
                placeholder="ADMIN_API_KEY"
                className="mt-5 w-full rounded-lg border-2 border-ink bg-cream px-4 py-3 font-mono shadow-poster-sm outline-none focus:ring-2 focus:ring-brick"
                autoComplete="off"
              />
              {error && <p className="mt-3 text-sm font-bold text-brick">{error}</p>}
              <Button
                onClick={unlock}
                className="mt-4 w-full bg-brick text-coal hover:bg-brick-soft"
              >
                Lås op
              </Button>
              <p className="mt-4 flex items-start gap-2 text-xs text-ink/50">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Del aldrig nøglen i chat eller på Discord. Tabet nulstiller
                sessionen automatisk.
              </p>
              <p className="mt-3 border-t-2 border-ink/10 pt-3 text-center text-xs text-ink/60">
                Har du @Admin-rollen på Discord?{" "}
                <Link to="/bliv-medlem" className="font-bold text-brick underline">
                  Log ind med Discord
                </Link>{" "}
                — så åbner panelet automatisk uden nøgle.
              </p>
            </motion.div>
          </div>
        </section>
      </>
    );
  }

  /* ---------- Kontrolpanel ---------- */
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="LazyTO-kontrolpanel"
        description="Turneringer oprettet her lander automatisk på Discord med join-link og QR."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={forgetKey}
          className="mt-4 border-2 border-ink bg-transparent text-ink hover:bg-ink hover:text-cream"
        >
          <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" /> Glem nøgle
        </Button>
      </PageHeader>

      <section className="section-padding bg-cream">
        <div className="container-site px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 rounded-xl border-2 border-brick bg-cream-dim p-4 font-bold text-brick shadow-poster">
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-6 flex items-start gap-2 rounded-xl border-2 border-ink bg-emerald-100 p-4 font-bold text-ink shadow-poster">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
              {notice}
            </div>
          )}

          {/* Lobby-styring */}
          <div className="mb-8 rounded-2xl border-[3px] border-ink bg-cream-dim p-6 text-ink shadow-poster">
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
              <Gamepad2 className="h-5 w-5 text-brick" aria-hidden="true" />
              Aftenens lobby
            </h2>
            {lobby ? (
              <>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold">
                  <span className="mr-2 rounded-md bg-emerald-500 px-2 py-0.5 text-xs uppercase text-coal">Åben</span>
                  {lobby.title} · {gameLabels[lobby.game] || lobby.game} · {lobby.attendees.length} fremmødte ·{" "}
                  {lobby.matches.filter((m) => m.status === "done").length} kampe spillet
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="border-2 border-ink">
                    <Link to="/lobby">Åbn lobby-side</Link>
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => void handleCloseLobby()}
                    className="bg-brick text-coal hover:bg-brick-soft"
                  >
                    Luk lobby + post rangliste
                  </Button>
                </div>
              </div>
              {lobby.attendees.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-bold text-ink/70">
                    Fremmødte — brug listen som tilmeldingsgrundlag til start.gg:
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {lobby.attendees.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-1 rounded-lg border-2 border-ink bg-cream py-1 pl-3 pr-1 text-sm font-bold shadow-poster-sm"
                      >
                        {a.gamertag}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleKick(a.id, a.gamertag)}
                          title={`Fjern ${a.gamertag} fra lobbyen`}
                          className="rounded-md p-1 text-brick hover:bg-brick hover:text-coal disabled:opacity-40"
                        >
                          <UserX className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </>
            ) : (
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-48 flex-1">
                  <label className="block text-sm font-bold">Titel</label>
                  <input
                    type="text"
                    value={lobbyTitle}
                    onChange={(e) => setLobbyTitle(e.target.value)}
                    placeholder="Weekly #77 — casuals"
                    className="mt-1 w-full rounded-lg border-2 border-ink bg-cream px-4 py-2.5 shadow-poster-sm outline-none focus:ring-2 focus:ring-brick"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Spil</label>
                  <select
                    value={lobbyGame}
                    onChange={(e) => setLobbyGame(e.target.value)}
                    className="mt-1 rounded-lg border-2 border-ink bg-cream px-4 py-2.5 font-bold shadow-poster-sm outline-none focus:ring-2 focus:ring-brick"
                  >
                    <option value="ultimate">Ultimate</option>
                    <option value="melee">Melee</option>
                    <option value="roa2">Rivals of Aether 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold">Stations</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={lobbyStations}
                    onChange={(e) => setLobbyStations(e.target.value)}
                    className="mt-1 w-20 rounded-lg border-2 border-ink bg-cream px-4 py-2.5 shadow-poster-sm outline-none focus:ring-2 focus:ring-brick"
                  />
                </div>
                <Button
                  disabled={busy}
                  onClick={() => void handleOpenLobby()}
                  className="bg-brick text-coal hover:bg-brick-soft"
                >
                  Åbn lobby + post på Discord
                </Button>
              </div>
            )}
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-5">
            {/* Opret turnering */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-[3px] border-ink bg-cream-dim p-6 text-ink shadow-poster lg:col-span-2"
            >
              <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
                <Plus className="h-5 w-5 text-brick" aria-hidden="true" />
                Opret turnering
              </h2>

              <label className="mt-5 block text-sm font-bold">Navn</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Weekly #77 — Ultimate Singles"
                className="mt-1 w-full rounded-lg border-2 border-ink bg-cream px-4 py-2.5 shadow-poster-sm outline-none focus:ring-2 focus:ring-brick"
              />

              <label className="mt-4 block text-sm font-bold">Spil</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {Object.entries(gameLabels).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGame(value)}
                    className={`rounded-lg border-2 border-ink px-3 py-2 text-sm font-bold shadow-poster-sm transition-colors ${
                      game === value ? "bg-brick text-coal" : "bg-cream hover:bg-cream-dim"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <label className="mt-4 block text-sm font-bold">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="mt-1 w-full rounded-lg border-2 border-ink bg-cream px-4 py-2.5 font-bold shadow-poster-sm outline-none focus:ring-2 focus:ring-brick"
              >
                <option value="double_elim">Double Elimination</option>
                <option value="single_elim">Single Elimination</option>
                <option value="round_robin">Round Robin</option>
              </select>

              <label className="mt-4 block text-sm font-bold">
                Runde 1 starter (valgfri — styrer check-in vinduet)
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1 w-full rounded-lg border-2 border-ink bg-cream px-4 py-2.5 shadow-poster-sm outline-none focus:ring-2 focus:ring-brick"
              />
              {startAt && (
                <p className="mt-1 text-xs text-ink/60">
                  Check-in åbner automatisk kl.{" "}
                  {new Date(new Date(startAt).getTime() - 15 * 60 * 1000).toLocaleTimeString(
                    "da-DK",
                    { hour: "2-digit", minute: "2-digit" },
                  )}{" "}
                  — 15 min før.
                </p>
              )}

              <label className="mt-4 block text-sm font-bold">
                start.gg-slug (valgfri)
              </label>
              <input
                type="text"
                value={startggSlug}
                onChange={(e) => setStartggSlug(e.target.value)}
                placeholder="tournament/weekly-77/event/ultimate-singles"
                className="mt-1 w-full rounded-lg border-2 border-ink bg-cream px-4 py-2.5 font-mono text-sm shadow-poster-sm outline-none focus:ring-2 focus:ring-brick"
              />

              <Button
                onClick={() => void handleCreate()}
                disabled={busy}
                className="mt-6 w-full bg-brick text-coal hover:bg-brick-soft"
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Opret + post på Discord
              </Button>
            </motion.div>

            {/* Turneringsoversigt */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="mb-4 flex items-center justify-between">
                <SectionHeader eyebrow="Oversigt" title="Turneringer" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void load()}
                  disabled={busy}
                  className="border-2 border-ink"
                >
                  <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" /> Genindlæs
                </Button>
              </div>

              {tournaments === null ? (
                <p className="text-ink/60">Henter turneringer...</p>
              ) : tournaments.length === 0 ? (
                <p className="text-ink/60">
                  Ingen turneringer endnu — opret den første til venstre.
                </p>
              ) : (
                <ul className="space-y-3">
                  {tournaments.map((t) => (
                    <li
                      key={t.id}
                      className="rounded-xl border-2 border-ink bg-cream p-4 shadow-poster-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-heading font-bold text-ink">{t.name}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">
                            <span>{gameLabels[t.game] || t.game}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                              {formatDateTime(t.start_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" aria-hidden="true" />
                              {t.checked_in}/{t.entrants} checked ind
                            </span>
                            <span className="font-mono font-bold text-ink">
                              {t.join_code}
                            </span>
                          </p>
                        </div>
                        <Badge className={statusColors[t.status] || "bg-ink/20 text-ink"}>
                          {statusLabels[t.status] || t.status}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm" className="border-2 border-ink">
                          <Link to={`/t/${t.join_code}`}>
                            <QrCode className="mr-1 h-4 w-4" aria-hidden="true" /> QR-side
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(t.join_code)}
                          className="border-2 border-ink"
                        >
                          <Copy className="mr-1 h-4 w-4" aria-hidden="true" /> Kopiér join-link
                        </Button>
                        <Button asChild variant="outline" size="sm" className="border-2 border-ink">
                          <Link to={`/t/${t.join_code}/bracket`}>
                            <Swords className="mr-1 h-4 w-4" aria-hidden="true" /> Bracket
                          </Link>
                        </Button>
                        {t.startgg_slug && (t.status === "signup" || t.status === "checkin") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleImportEntrants(t)}
                            disabled={busy}
                            className="border-2 border-ink"
                            title={`Hent tilmeldte fra ${t.startgg_slug}`}
                          >
                            <Download className="mr-1 h-4 w-4" aria-hidden="true" /> Hent tilmeldte
                          </Button>
                        )}
                        {t.startgg_slug && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleExportSeeding(t)}
                            disabled={busy}
                            className="border-2 border-ink"
                            title={`Send seeding efter rating til ${t.startgg_slug}`}
                          >
                            <Crown className="mr-1 h-4 w-4" aria-hidden="true" /> Send seeding
                          </Button>
                        )}
                        {(t.status === "signup" || t.status === "checkin") && (
                          <Button
                            size="sm"
                            onClick={() => void handleStart(t)}
                            disabled={busy}
                            className="bg-emerald-500 text-coal hover:bg-emerald-400"
                          >
                            <Play className="mr-1 h-4 w-4" aria-hidden="true" /> Start bracket
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void handleDelete(t)}
                          disabled={busy}
                          className="border-2 border-brick text-brick hover:bg-brick hover:text-coal"
                          title="Slet turneringen permanent"
                        >
                          <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" /> Slet
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>

          {/* start.gg: resultat-import + event-annoncering */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 rounded-2xl border-[3px] border-ink bg-cream-dim p-6 text-ink shadow-poster"
          >
            <h2 className="flex items-center gap-2 font-heading text-xl font-bold">
              <Download className="h-5 w-5 text-brick" aria-hidden="true" />
              start.gg — resultater & annoncering
            </h2>
            <div className="mt-4 grid items-start gap-6 md:grid-cols-2">
              {/* Resultat-import */}
              <div className="rounded-xl border-2 border-ink bg-cream p-5 shadow-poster-sm">
                <h3 className="font-heading font-bold">Importér resultater til ranglisten</h3>
                <p className="mt-1 text-sm text-ink/60">
                  Tæller alle færdige sæt fra et start.gg-event med på Elo-ranglisten.
                  Sæt importeres kun én gang — poster opsummering på Discord.
                </p>
                <label className="mt-4 block text-sm font-bold">Event-slug eller URL</label>
                <input
                  type="text"
                  value={importSlug}
                  onChange={(e) => setImportSlug(e.target.value)}
                  placeholder="tournament/weekly-77/event/ultimate-singles"
                  className="mt-1 w-full rounded-lg border-2 border-ink bg-cream px-4 py-2.5 font-mono text-sm shadow-poster-sm outline-none focus:ring-2 focus:ring-brick"
                />
                <label className="mt-3 block text-sm font-bold">Spil (normalt auto)</label>
                <select
                  value={importGame}
                  onChange={(e) => setImportGame(e.target.value)}
                  className="mt-1 w-full rounded-lg border-2 border-ink bg-cream px-4 py-2.5 font-bold shadow-poster-sm outline-none focus:ring-2 focus:ring-brick"
                >
                  <option value="auto">Auto (fra eventet)</option>
                  <option value="ultimate">Ultimate</option>
                  <option value="melee">Melee</option>
                  <option value="roa2">Rivals of Aether 2</option>
                </select>
                <Button
                  onClick={() => void handleImportResults()}
                  disabled={busy}
                  className="mt-4 w-full bg-brick text-coal hover:bg-brick-soft"
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  Importér resultater
                </Button>
              </div>

              {/* Rang-roller */}
              <div className="rounded-xl border-2 border-ink bg-cream p-5 shadow-poster-sm">
                <h3 className="font-heading font-bold">Rang-roller på Discord (top 8 pr. spil)</h3>
                <p className="mt-1 text-sm text-ink/60">
                  Giver rollerne #1–#8 i Melee, Ultimate og Rivals 2 til hver ranglistes
                  top 8 og fjerner dem igen fra dem der ryger ud. En spiller kan have
                  roller i flere spil. Kører automatisk hvert kvartal — brug
                  knappen her til at gen-synke med det samme.
                </p>
                <Button
                  onClick={() => void handleSyncRanks()}
                  disabled={busy}
                  className="mt-4 w-full bg-ink text-cream hover:bg-brick hover:text-coal"
                >
                  <Crown className="mr-2 h-4 w-4" aria-hidden="true" />
                  Gen-sync rang-roller nu
                </Button>
              </div>

              {/* Event-annoncering */}
              <div className="rounded-xl border-2 border-ink bg-cream p-5 shadow-poster-sm">
                <h3 className="font-heading font-bold">Annoncér event på Discord</h3>
                <p className="mt-1 text-sm text-ink/60">
                  Kommende events fra jeres start.gg-konto. Annoncering pinger medlemsrollen.
                </p>
                {sgEvents === null ? (
                  <p className="mt-4 text-sm text-ink/60">Henter events fra start.gg…</p>
                ) : sgEvents.length === 0 ? (
                  <p className="mt-4 text-sm text-ink/60">
                    Ingen kommende events fundet på start.gg.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {sgEvents.slice(0, 5).map((e) => (
                      <li
                        key={e.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border-2 border-ink/20 bg-cream-dim px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{e.name}</p>
                          <p className="text-xs text-ink/60">
                            {formatDateTime(e.startAt)} · {e.numAttendees} tilmeldte
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void handleAnnounce(e.url, e.name)}
                          className="shrink-0 border-2 border-ink"
                        >
                          <Megaphone className="mr-1 h-4 w-4" aria-hidden="true" /> Annoncér
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
