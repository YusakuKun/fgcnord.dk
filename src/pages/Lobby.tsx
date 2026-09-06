import { motion } from "framer-motion";
import { LogOut, Swords, Trophy, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { DiscordIcon, DISCORD_URL } from "@/components/Navbar";
import { PageHeader } from "@/components/PageHeader";
import { RankBadge } from "@/components/RankBadge";
import { Button } from "@/components/ui/button";
import {
  cancelLobbyMatch,
  challengePlayer,
  confirmLobbyMatch,
  getCurrentLobby,
  getMe,
  joinLobby,
  leaveLobby,
  reportLobbyMatch,
  type LobbyMatch,
  type LobbyState,
} from "@/lib/lobbyApi";
import { getRankMap } from "@/lib/ranksApi";

const gameLabels: Record<string, string> = {
  melee: "Melee",
  ultimate: "Ultimate",
  roa2: "Rivals of Aether 2",
};

interface Me {
  authenticated: boolean;
  player?: { id: string; gamertag: string };
}

export function Lobby() {
  const [lobby, setLobby] = useState<LobbyState | null | undefined>(undefined);
  const [me, setMe] = useState<Me>({ authenticated: false });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scores, setScores] = useState<Record<string, { s1: string; s2: string }>>({});
  const [ranks, setRanks] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    try {
      const [lobbyRes, meRes] = await Promise.all([getCurrentLobby(), getMe()]);
      setLobby(lobbyRes.lobby);
      setMe(meRes as Me);
      setError(null);
      getRankMap().then(setRanks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke hente lobbyen");
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  const run = async (fn: () => Promise<unknown>, okMsg?: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (okMsg) setNotice(okMsg);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noget gik galt");
    } finally {
      setBusy(false);
    }
  };

  const myId = me.player?.id;
  const amAttendee = !!lobby && !!myId && lobby.attendees.some((a) => a.id === myId);

  const myActiveMatches =
    lobby?.matches.filter(
      (m) =>
        (m.player1_id === myId || m.player2_id === myId) &&
        (m.status === "called" || m.status === "reported" || m.status === "queued"),
    ) ?? [];

  const queuedMatches = lobby?.matches.filter((m) => m.status === "queued") ?? [];
  const doneMatches =
    lobby?.matches
      .filter((m) => m.status === "done")
      .sort((a, b) => (b.finished_at ?? 0) - (a.finished_at ?? 0)) ?? [];

  const renderMatch = (m: LobbyMatch) => {
    const mine = m.player1_id === myId || m.player2_id === myId;
    const iReported = m.reported_by === myId;
    const awaitingMe = m.status === "reported" && mine && !iReported;
    const score = scores[m.id] ?? { s1: "2", s2: "0" };
    const iAmP1 = m.player1_id === myId;

    return (
      <li
        key={m.id}
        className={`rounded-xl border-2 border-ink p-4 shadow-poster-sm ${
          m.status === "called" ? "bg-brick-soft/30" : "bg-cream"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading font-bold text-ink">
            {m.status === "called" && (
              <span className="mr-2 rounded-md bg-brick px-2 py-0.5 text-xs uppercase text-coal">
                Setup {m.station}
              </span>
            )}
            {m.p1_tag} vs {m.p2_tag}
          </p>
          {m.status === "reported" && (
            <p className="text-sm font-bold text-ink/60">
              Meldt: {m.score1}-{m.score2}
            </p>
          )}
        </div>

        {mine && m.status === "called" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={score.s1}
              onChange={(e) =>
                setScores((s) => ({ ...s, [m.id]: { ...score, s1: e.target.value } }))
              }
              className="rounded-lg border-2 border-ink bg-cream px-3 py-1.5 font-bold"
              aria-label={iAmP1 ? "Din score" : `${m.p1_tag}s score`}
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="font-bold">—</span>
            <select
              value={score.s2}
              onChange={(e) =>
                setScores((s) => ({ ...s, [m.id]: { ...score, s2: e.target.value } }))
              }
              className="rounded-lg border-2 border-ink bg-cream px-3 py-1.5 font-bold"
              aria-label={iAmP1 ? "Modstanderens score" : `${m.p2_tag}s score`}
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={busy}
              onClick={() =>
                void run(
                  () =>
                    reportLobbyMatch(
                      m.id,
                      iAmP1 ? Number(score.s1) : Number(score.s2),
                      iAmP1 ? Number(score.s2) : Number(score.s1),
                    ),
                  "Resultat meldt — afventer modstanderens bekræftelse.",
                )
              }
              className="bg-brick text-coal hover:bg-brick-soft"
            >
              Meld resultat
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void run(() => cancelLobbyMatch(m.id), "Kamp aflyst.")}
              className="border-2 border-ink"
            >
              Aflys
            </Button>
          </div>
        )}

        {mine && m.status === "reported" && iReported && (
          <p className="mt-2 text-sm font-bold text-ink/60">
            Afventer modstanderens bekræftelse…
          </p>
        )}

        {awaitingMe && (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={busy}
              onClick={() => void run(() => confirmLobbyMatch(m.id))}
              className="bg-emerald-500 text-coal hover:bg-emerald-400"
            >
              Bekræft resultat
            </Button>
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="Lobby"
        title="Aftenens lobby"
        description="Meld dig til stede, udfordr modstandere til casuals — alle kampe tæller på ranglisten."
      />
      <section className="section-padding bg-cream">
        <div className="container-site max-w-3xl px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 rounded-xl border-2 border-brick bg-cream-dim p-4 font-bold text-brick shadow-poster">
              {error}
            </div>
          )}
          {notice && (
            <div className="mb-6 rounded-xl border-2 border-ink bg-emerald-100 p-4 font-bold text-ink shadow-poster">
              {notice}
            </div>
          )}

          {lobby === undefined ? (
            <p className="text-ink/60">Henter lobbyen…</p>
          ) : lobby === null ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-[3px] border-ink bg-cream-dim p-8 text-center text-ink shadow-poster"
            >
              <p className="font-heading text-xl font-bold">Ingen åben lobby lige nu</p>
              <p className="mt-2 text-ink/60">
                Lobbyen åbner på weekly-aftener. Hold øje på Discord — eller se ranglisten
                imens.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Button asChild className="bg-brick text-coal hover:bg-brick-soft">
                  <Link to="/rangliste">
                    <Trophy className="mr-2 h-4 w-4" aria-hidden="true" /> Se ranglisten
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-ink">
                  <a href={DISCORD_URL} target="_blank" rel="noreferrer">
                    <DiscordIcon size={16} /> <span className="ml-2">Join Discord</span>
                  </a>
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 text-ink"
            >
              {/* Lobby-header */}
              <div className="rounded-2xl border-[3px] border-ink bg-cream-dim p-6 shadow-poster">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-2xl font-bold">{lobby.title}</h2>
                    <p className="mt-1 flex items-center gap-3 text-sm text-ink/60">
                      <span className="font-bold text-brick">{gameLabels[lobby.game] || lobby.game}</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        {lobby.attendees.length} fremmødte
                      </span>
                      <span>{lobby.stations} stations</span>
                    </p>
                  </div>
                  {!me.authenticated ? (
                    <Button asChild className="bg-[#5865F2] text-white hover:bg-[#4752C4]">
                      <a href={`/api/auth/discord?returnTo=${encodeURIComponent("/lobby")}`}>
                        <DiscordIcon size={18} />
                        <span className="ml-2">Log ind med Discord</span>
                      </a>
                    </Button>
                  ) : !amAttendee ? (
                    <Button
                      disabled={busy}
                      onClick={() => void run(() => joinLobby(lobby.id), "Du er meldt til stede!")}
                      className="bg-brick text-coal hover:bg-brick-soft"
                    >
                      <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" /> Meld mig til stede
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="rounded-lg border-2 border-emerald-500 bg-emerald-100 px-3 py-1.5 text-sm font-bold">
                        ✅ Du er i lobbyen
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => leaveLobby(lobby.id),
                            "Du er meldt fra lobbyen.",
                          )
                        }
                        className="border-2 border-ink text-ink hover:bg-ink hover:text-cream"
                      >
                        <LogOut className="mr-1 h-4 w-4" aria-hidden="true" /> Meld mig fra
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mine kampe */}
              {myActiveMatches.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold">
                    <Swords className="h-5 w-5 text-brick" aria-hidden="true" /> Mine kampe
                  </h3>
                  <ul className="space-y-3">{myActiveMatches.map(renderMatch)}</ul>
                </div>
              )}

              {/* Fremmødte — udfordr */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold">
                  <Users className="h-5 w-5 text-brick" aria-hidden="true" /> Fremmødte
                </h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {lobby.attendees.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 rounded-xl border-2 border-ink bg-cream px-4 py-3 shadow-poster-sm"
                    >
                      <div>
                        <p className="flex items-center gap-2 font-bold">
                          <RankBadge rank={ranks[a.id]} />
                          {a.gamertag}
                          {a.id === myId && <span className="text-ink/50">(dig)</span>}
                        </p>
                        {a.rating !== null && (
                          <p className="text-xs font-bold text-ink/60">
                            {a.rating} rating · {a.wins}W/{a.losses}L
                          </p>
                        )}
                      </div>
                      {amAttendee && a.id !== myId && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void run(() => challengePlayer(lobby.id, a.id))}
                          className="border-2 border-ink hover:bg-brick hover:text-coal"
                        >
                          Udfordr
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Kø */}
              {queuedMatches.length > 0 && (
                <div>
                  <h3 className="mb-3 font-heading text-lg font-bold">I kø</h3>
                  <ul className="space-y-2">
                    {queuedMatches.map((m, i) => (
                      <li
                        key={m.id}
                        className="rounded-lg border-2 border-ink/30 bg-cream px-4 py-2 text-sm font-bold text-ink/70"
                      >
                        #{i + 1} · {m.p1_tag} vs {m.p2_tag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Aftenens resultater */}
              {doneMatches.length > 0 && (
                <div>
                  <h3 className="mb-3 font-heading text-lg font-bold">Aftenens resultater</h3>
                  <ul className="space-y-2">
                    {doneMatches.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-lg border-2 border-ink/30 bg-cream px-4 py-2 text-sm font-bold text-ink/70"
                      >
                        {m.p1_tag} {m.score1} — {m.score2} {m.p2_tag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}
