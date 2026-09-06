import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Crown,
  Dices,
  RotateCcw,
  Share2,
  Trophy,
  Undo2,
} from "lucide-react";
import { useRef, useState } from "react";

import { RevealOverlay } from "@/components/stage-strike/RevealOverlay";
import { StageCard, type CardState } from "@/components/stage-strike/StageCard";
import { AccordionItem } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GameType, Player, Stage } from "@/types";

type StrikeStage = Stage & { starter: boolean };
type StrikeGame = GameType | "mkwii";

const ULTIMATE_STAGES: StrikeStage[] = [
  // Starters (game 1)
  { id: "bf", name: "Battlefield", image: "/stage-thumbs/battlefield.png", starter: true },
  { id: "fd", name: "Final Destination", image: "/stage-thumbs/final-destination.png", starter: true },
  { id: "sbf", name: "Small Battlefield", image: "/stage-thumbs/small-battlefield.png", starter: true },
  { id: "ps2", name: "Pokémon Stadium 2", image: "/stage-thumbs/pokemon-stadium-2.png", starter: true },
  { id: "sv", name: "Smashville", image: "/stage-thumbs/smashville.png", starter: true },
  // Counterpicks
  { id: "tc", name: "Town & City", image: "/stage-thumbs/town-&-city.png", starter: false },
  { id: "hb", name: "Hollow Bastion", image: "/stage-thumbs/hollow-bastion.png", starter: false },
  { id: "kalos", name: "Kalos Pokémon League", image: "/stage-thumbs/kalos-pokemon-league.png", starter: false },
];

const MELEE_STAGES: StrikeStage[] = [
  // Starters (game 1)
  { id: "dl", name: "Dream Land 64", image: "/melee-thumbs/dream-land.png", starter: true },
  { id: "fod", name: "Fountain of Dreams", image: "/melee-thumbs/fountain-of-dreams.png", starter: true },
  { id: "bf", name: "Battlefield", image: "/melee-thumbs/battlefield.png", starter: true },
  { id: "fd", name: "Final Destination", image: "/melee-thumbs/final-destination.png", starter: true },
  { id: "ys", name: "Yoshi's Story", image: "/melee-thumbs/yoshis-story.png", starter: true },
  // Counterpick
  { id: "ps", name: "Pokémon Stadium", image: "/melee-thumbs/pokemon-stadium.png", starter: false },
];

// MKWii: alle 32 baner (16 nitro + 16 retro). Competitive praksis:
// løb 1 trækkes tilfældigt (MKWs roulette), taberen vælger derefter,
// ingen bane-gentagelser i serien, ingen track bans i vanilje-MK.
const MKWII_TRACKS: StrikeStage[] = [
  // Nitro
  { id: "lc", name: "Luigi Circuit", image: "", starter: true },
  { id: "mmm", name: "Moo Moo Meadows", image: "", starter: true },
  { id: "mg", name: "Mushroom Gorge", image: "", starter: true },
  { id: "tf", name: "Toad's Factory", image: "", starter: true },
  { id: "mc", name: "Mario Circuit", image: "", starter: true },
  { id: "cm", name: "Coconut Mall", image: "", starter: true },
  { id: "dks", name: "DK Summit", image: "", starter: true },
  { id: "wgm", name: "Wario's Gold Mine", image: "", starter: true },
  { id: "dc", name: "Daisy Circuit", image: "", starter: true },
  { id: "kc", name: "Koopa Cape", image: "", starter: true },
  { id: "mt", name: "Maple Treeway", image: "", starter: true },
  { id: "gv", name: "Grumble Volcano", image: "", starter: true },
  { id: "ddr", name: "Dry Dry Ruins", image: "", starter: true },
  { id: "mh", name: "Moonview Highway", image: "", starter: true },
  { id: "bc", name: "Bowser's Castle", image: "", starter: true },
  { id: "rr", name: "Rainbow Road", image: "", starter: true },
  // Retro
  { id: "rpb", name: "GCN Peach Beach", image: "", starter: true },
  { id: "ryf", name: "DS Yoshi Falls", image: "", starter: true },
  { id: "rgv2", name: "SNES Ghost Valley 2", image: "", starter: true },
  { id: "rmr", name: "N64 Mario Raceway", image: "", starter: true },
  { id: "rsl", name: "N64 Sherbet Land", image: "", starter: true },
  { id: "rsgb", name: "GBA Shy Guy Beach", image: "", starter: true },
  { id: "rds", name: "DS Delfino Square", image: "", starter: true },
  { id: "rws", name: "GCN Waluigi Stadium", image: "", starter: true },
  { id: "rdh", name: "DS Desert Hills", image: "", starter: true },
  { id: "rbc3", name: "GBA Bowser Castle 3", image: "", starter: true },
  { id: "rdkjp", name: "N64 DK's Jungle Parkway", image: "", starter: true },
  { id: "rmc", name: "GCN Mario Circuit", image: "", starter: true },
  { id: "rmc3", name: "SNES Mario Circuit 3", image: "", starter: true },
  { id: "rpg", name: "DS Peach Gardens", image: "", starter: true },
  { id: "rdkm", name: "GCN DK Mountain", image: "", starter: true },
  { id: "rbc", name: "N64 Bowser's Castle", image: "", starter: true },
];

const GAME_CONFIG: Record<
  StrikeGame,
  {
    label: string;
    bans: number;
    stages: StrikeStage[];
    racing?: boolean;
    banner: string;
    bannerAlt: string;
  }
> = {
  ultimate: {
    label: "Ultimate",
    bans: 3,
    stages: ULTIMATE_STAGES,
    banner: "/stage-thumbs/battlefield.png",
    bannerAlt: "Battlefield-staget fra Ultimate i dagslys",
  },
  melee: {
    label: "Melee",
    bans: 1,
    stages: MELEE_STAGES,
    banner: "/melee-thumbs/battlefield.png",
    bannerAlt: "Battlefield-staget fra Melee med den ringede planet på nattehimlen",
  },
  mkwii: {
    label: "Mario Kart Wii",
    bans: 0,
    stages: MKWII_TRACKS,
    racing: true,
    banner: "/stage-strike-banner-mkwii.jpg?v=2",
    bannerAlt: "Flydende platform-stages i solnedgang over nordiske bjerge",
  },
};

type Phase =
  | "choose-first" // vælg hvem der striker først
  | "strike" // game 1: 1-2-1 strike på starters
  | "ban" // counter-pick: vinderen banner
  | "pick" // counter-pick: taberen vælger (DSR aktiv)
  | "reveal" // reveal-overlay vises
  | "report" // rapporter vinder af game
  | "over"; // kampen er afgjort

interface Snapshot {
  phase: Phase;
  players: Player[];
  firstStriker: 0 | 1 | null;
  lastWinner: 0 | 1 | null;
  strikes: string[];
  bans: string[];
  pickedStage: string | null;
  currentGame: number;
  playedTracks: string[];
  log: string[];
}

const other = (i: 0 | 1): 0 | 1 => (i === 0 ? 1 : 0);

export function StageStrike() {
  const [game, setGame] = useState<StrikeGame>("ultimate");
  const [bestOf, setBestOf] = useState<3 | 5>(3);
  const [phase, setPhase] = useState<Phase>("choose-first");
  const [players, setPlayers] = useState<Player[]>([
    { name: "Spiller 1", score: 0, stageWins: [] },
    { name: "Spiller 2", score: 0, stageWins: [] },
  ]);
  const [firstStriker, setFirstStriker] = useState<0 | 1 | null>(null);
  const [lastWinner, setLastWinner] = useState<0 | 1 | null>(null);
  const [strikes, setStrikes] = useState<string[]>([]);
  const [bans, setBans] = useState<string[]>([]);
  const [pickedStage, setPickedStage] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState(1);
  const [playedTracks, setPlayedTracks] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([
    "Vælg format og hvem der striker først – eller lad terningen afgøre det.",
  ]);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  const config = GAME_CONFIG[game];
  const winsNeeded = bestOf === 3 ? 2 : 3;

  const snapshot = (): Snapshot => ({
    phase,
    players: players.map((p) => ({ ...p, stageWins: [...p.stageWins] })),
    firstStriker,
    lastWinner,
    strikes: [...strikes],
    bans: [...bans],
    pickedStage,
    currentGame,
    playedTracks: [...playedTracks],
    log: [...log],
  });

  const pushHistory = () => setHistory((h) => [...h.slice(-29), snapshot()]);

  const undo = () => {
    setHistory((h) => {
      const prev = h[h.length - 1];
      if (!prev) return h;
      setPhase(prev.phase);
      setPlayers(prev.players);
      setFirstStriker(prev.firstStriker);
      setLastWinner(prev.lastWinner);
      setStrikes(prev.strikes);
      setBans(prev.bans);
      setPickedStage(prev.pickedStage);
      setCurrentGame(prev.currentGame);
      setPlayedTracks(prev.playedTracks);
      setLog([...prev.log, "Sidste handling blev fortrudt."]);
      return h.slice(0, -1);
    });
  };

  const addLog = (msg: string) => setLog((l) => [...l, msg]);

  const resetSeries = () => {
    setPlayers([
      { name: players[0].name || "Spiller 1", score: 0, stageWins: [] },
      { name: players[1].name || "Spiller 2", score: 0, stageWins: [] },
    ]);
    setPhase("choose-first");
    setFirstStriker(null);
    setLastWinner(null);
    setStrikes([]);
    setBans([]);
    setPickedStage(null);
    setCurrentGame(1);
    setPlayedTracks([]);
    setHistory([]);
    setLog(["Serie nulstillet. Vælg hvem der striker først."]);
  };

  const switchGame = (g: StrikeGame) => {
    setGame(g);
    setPlayers([
      { name: "Spiller 1", score: 0, stageWins: [] },
      { name: "Spiller 2", score: 0, stageWins: [] },
    ]);
    setPhase("choose-first");
    setFirstStriker(null);
    setLastWinner(null);
    setStrikes([]);
    setBans([]);
    setPickedStage(null);
    setCurrentGame(1);
    setPlayedTracks([]);
    setHistory([]);
    setLog([
      GAME_CONFIG[g].racing
        ? `${GAME_CONFIG[g].label} valgt. Løb 1 trækkes tilfældigt – tryk på knappen når I er klar.`
        : `${GAME_CONFIG[g].label} valgt. Vælg hvem der striker først.`,
    ]);
  };

  const selectFirstStriker = (i: 0 | 1) => {
    pushHistory();
    setFirstStriker(i);
    setPhase("strike");
    addLog(`${players[i].name} striker først. Fjern 1 stage.`);
  };

  const coinFlip = () => selectFirstStriker(Math.random() < 0.5 ? 0 : 1);

  // MKWii: løb 1 trækkes tilfældigt blandt endnu u-spillede baner (MKWs roulette)
  const drawRandomTrack = () => {
    const candidates = config.stages.filter((s) => !playedTracks.includes(s.id));
    if (candidates.length === 0) return;
    pushHistory();
    const track = candidates[Math.floor(Math.random() * candidates.length)];
    setPickedStage(track.id);
    setPhase("reveal");
    addLog(`Løb 1 trækker tilfældigt: ${track.name}.`);
  };

  // Game 1 strike-sekvens (1-2-1): [første, anden, anden, første]
  const strikeActor = (): 0 | 1 => {
    const f = firstStriker ?? 0;
    return strikes.length === 0 || strikes.length === 3 ? f : other(f);
  };
  const strikesLeftForActor = () =>
    strikes.length === 0 ? 1 : strikes.length < 3 ? 3 - strikes.length : 1;

  const handleStrike = (stageId: string) => {
    const actor = strikeActor();
    const newStrikes = [...strikes, stageId];
    pushHistory();
    setStrikes(newStrikes);
    const name = config.stages.find((s) => s.id === stageId)?.name ?? stageId;
    if (newStrikes.length < 4) {
      const nextActor =
        newStrikes.length === 3 ? firstStriker ?? 0 : other(firstStriker ?? 0);
      const left =
        newStrikes.length === 1 ? 2 : 1;
      addLog(
        `${players[actor].name} fjernede ${name}. ${players[nextActor].name} fjerner ${left} stage${left > 1 ? "s" : ""}.`
      );
    } else {
      // Sidste starter tilbage = game 1 stage
      const remaining = config.stages.find(
        (s) => s.starter && !newStrikes.includes(s.id)
      );
      if (remaining) {
        setPickedStage(remaining.id);
        setPhase("reveal");
        addLog(`1-2-1 færdig – ${remaining.name} er tilbage.`);
      }
    }
  };

  const handleBan = (stageId: string) => {
    if (lastWinner === null) return;
    pushHistory();
    const newBans = [...bans, stageId];
    setBans(newBans);
    const name = config.stages.find((s) => s.id === stageId)?.name ?? stageId;
    if (newBans.length >= config.bans) {
      setPhase("pick");
      addLog(
        `${players[lastWinner].name} bannede ${name}. ${players[other(lastWinner)].name} vælger nu stage (DSR aktiv).`
      );
    } else {
      addLog(
        `${players[lastWinner].name} bannede ${name} (${newBans.length}/${config.bans}).`
      );
    }
  };

  const handlePick = (stageId: string) => {
    pushHistory();
    setPickedStage(stageId);
    setPhase("reveal");
    const name = config.stages.find((s) => s.id === stageId)?.name ?? stageId;
    addLog(`${players[lastWinner !== null ? other(lastWinner) : 0].name} valgte ${name}.`);
  };

  const confirmReveal = () => {
    pushHistory();
    setPhase("report");
    addLog("Kamp i gang! Rapporter vinderen, når gamet er slut.");
  };

  const reportWinner = (winner: 0 | 1) => {
    pushHistory();
    const stageId = pickedStage ?? "";
    const stageName = config.stages.find((s) => s.id === stageId)?.name ?? stageId;
    const next = players.map((p) => ({ ...p, stageWins: [...p.stageWins] }));
    next[winner].score += 1;
    if (stageId) next[winner].stageWins.push(stageId);
    setPlayers(next);
    setLastWinner(winner);
    setPickedStage(null);
    if (stageId) setPlayedTracks((pt) => [...pt, stageId]);

    if (next[winner].score >= winsNeeded) {
      setPhase("over");
      addLog(
        `${next[winner].name} vinder serien ${next[winner].score}-${next[other(winner)].score}!`
      );
      return;
    }

    setCurrentGame((g) => g + 1);
    setStrikes([]);
    setBans([]);

    if (config.racing) {
      // MKWii: ingen bans – taberen vælger næste bane direkte
      setPhase("pick");
      addLog(
        `${next[winner].name} vandt Løb ${currentGame} på ${stageName}. ${next[other(winner)].name} (taber) vælger næste bane – ingen gentagelser.`
      );
      return;
    }

    setPhase("ban");
    addLog(
      `${next[winner].name} vandt Game ${currentGame} på ${stageName}. Vinderen banner ${config.bans} stage${config.bans > 1 ? "s" : ""}.`
    );
  };

  const shareResult = () => {
    const winner = players.find((p) => p.score >= winsNeeded);
    if (!winner) return;
    const text = `${winner.name} vandt ${config.label}-serien ${players[0].score}-${players[1].score} (${players[0].name} vs. ${players[1].name}) – stage strike via FGCNORD.DK`;
    navigator.clipboard
      .writeText(text)
      .then(() => addLog("Resultat kopieret til udklipsholder."));
  };

  // ---- afledt UI-tilstand ----

  const strikerIndex: 0 | 1 | null =
    phase === "strike"
      ? strikeActor()
      : phase === "ban"
        ? lastWinner
        : phase === "pick" && lastWinner !== null
          ? other(lastWinner)
          : null;

  const cardState = (stage: StrikeStage): CardState => {
    if (phase === "strike") {
      if (!stage.starter) return "locked";
      if (strikes.includes(stage.id)) return "striked";
      return "available";
    }
    if (phase === "ban") {
      if (bans.includes(stage.id)) return "banned";
      return "available";
    }
    if (phase === "pick") {
      if (bans.includes(stage.id)) return "banned";
      if (config.racing) {
        // MKWii: ingen bane-gentagelser – allerede spillede baner er låst
        if (playedTracks.includes(stage.id)) return "dsr";
        return "available";
      }
      if (
        lastWinner !== null &&
        players[other(lastWinner)].stageWins.includes(stage.id)
      )
        return "dsr";
      return "available";
    }
    if (phase === "reveal" && pickedStage === stage.id) return "picked";
    if (phase === "report" && pickedStage === stage.id) return "picked";
    return "idle";
  };

  const handleCardSelect = (stage: StrikeStage) => {
    if (phase === "strike") handleStrike(stage.id);
    else if (phase === "ban") handleBan(stage.id);
    else if (phase === "pick") handlePick(stage.id);
  };

  const actionLabel =
    phase === "strike"
      ? "Strike"
      : phase === "ban"
        ? "Ban"
        : phase === "pick"
          ? "Vælg"
          : "Stage";

  const statusText = (): string => {
    switch (phase) {
      case "choose-first":
        return config.racing
          ? "Træk en tilfældig bane til løb 1"
          : "Vælg hvem der striker først";
      case "strike": {
        const a = strikeActor();
        const n = strikesLeftForActor();
        return `${players[a].name} striker – fjern ${n} stage${n > 1 ? "s" : ""} (1-2-1)`;
      }
      case "ban":
        return lastWinner !== null
          ? `${players[lastWinner].name} (vinder) banner ${config.bans - bans.length} stage${config.bans - bans.length > 1 ? "s" : ""}`
          : "";
      case "pick":
        if (config.racing) {
          return lastWinner !== null
            ? `${players[other(lastWinner)].name} (taber) vælger bane – ingen gentagelser`
            : "";
        }
        return lastWinner !== null
          ? `${players[other(lastWinner)].name} (taber) vælger stage – DSR aktiv`
          : "";
      case "reveal":
        return config.racing ? "Bane valgt – klar til løb!" : "Stage valgt – klar til kamp!";
      case "report":
        return config.racing ? "Hvem vandt løbet?" : "Hvem vandt gamet?";
      case "over":
        return `${players.find((p) => p.score >= winsNeeded)?.name ?? ""} vinder serien!`;
    }
  };

  // Tastatur-navigation i stage-grid (piletaster)
  const onGridKeyDown = (e: React.KeyboardEvent) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    const buttons = Array.from(
      gridRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []
    );
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (idx === -1) return;
    e.preventDefault();
    if (e.key === "ArrowRight") buttons[Math.min(idx + 1, buttons.length - 1)]?.focus();
    if (e.key === "ArrowLeft") buttons[Math.max(idx - 1, 0)]?.focus();
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const current = buttons[idx];
      const dir = e.key === "ArrowDown" ? 1 : -1;
      let best: HTMLButtonElement | null = null;
      let bestDist = Infinity;
      for (const b of buttons) {
        if (b === current) continue;
        const rowDiff = (b.offsetTop - current.offsetTop) * dir;
        if (rowDiff <= 2) continue;
        const dist = Math.abs(b.offsetLeft - current.offsetLeft) + rowDiff * 0.25;
        if (dist < bestDist) {
          bestDist = dist;
          best = b;
        }
      }
      best?.focus();
    }
  };

  const picked = config.stages.find((s) => s.id === pickedStage) ?? null;

  return (
    <div className="min-h-screen bg-coal pb-20 text-cream">
      {/* Banner — samme stage, forskellig tid på døgnet pr. spil */}
      <div className="relative h-[260px] w-full overflow-hidden bg-ink sm:h-[340px] md:h-[420px]">
        <AnimatePresence mode="sync">
          {/* Det rigtige Battlefield-stage: skarp i midten (object-contain),
              samme billede blurret som udfyldning bagved — så liner Ultimate
              og Melee altid perfekt op, fordi begge thumbs er 800×500. */}
          <motion.div
            key={game}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            className="absolute inset-0"
          >
            <img
              src={config.banner}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
            />
            <img
              src={config.banner}
              alt={config.bannerAlt}
              className="absolute inset-0 h-full w-full object-contain"
            />
          </motion.div>
        </AnimatePresence>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-coal via-coal/40 to-coal/10"
        />
        <div className="container-site relative flex h-full flex-col justify-end px-4 pb-8 sm:px-6 lg:px-8">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[13px] font-bold uppercase tracking-[0.18em] text-brick-soft"
          >
            Værktøj
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="mt-2 font-display text-4xl uppercase text-cream drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] sm:text-5xl md:text-6xl"
          >
            Stage Strike
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-3 max-w-xl text-[15px] leading-relaxed text-cream/90 drop-shadow md:text-base"
          >
            Stream-overlay til stage striking i Smash Ultimate og Melee.
            Værktøjet styrer 1-2-1, bans og DSR – I skal bare spille.
          </motion.p>
        </div>
      </div>

      <div className="container-site px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* ---------- Hovedområde ---------- */}
          <div>
            {/* Spil + format + handlinger */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div
                role="group"
                aria-label="Vælg spil"
                className="flex gap-1 rounded-xl border-2 border-brick/30 bg-ink/60 p-1.5"
              >
                {/* MKWii er arkiveret — genaktivér ved at tilføje "mkwii" til listen */}
                {(["ultimate", "melee"] as StrikeGame[]).map((g) => (
                  <Button
                    key={g}
                    variant={game === g ? "default" : "ghost"}
                    onClick={() => switchGame(g)}
                    className={cn(
                      "min-h-[44px] font-bold",
                      game === g
                        ? "bg-brick text-coal hover:bg-brick-soft"
                        : "text-cream/80 hover:text-cream"
                    )}
                  >
                    {GAME_CONFIG[g].label}
                  </Button>
                ))}
              </div>

              <div
                role="group"
                aria-label="Vælg format"
                className="flex gap-1 rounded-xl border-2 border-brick/30 bg-ink/60 p-1.5"
              >
                {([3, 5] as const).map((b) => (
                  <Button
                    key={b}
                    variant={bestOf === b ? "default" : "ghost"}
                    onClick={() => setBestOf(b)}
                    aria-pressed={bestOf === b}
                    className={cn(
                      "min-h-[44px] font-bold",
                      bestOf === b
                        ? "bg-brick text-coal hover:bg-brick-soft"
                        : "text-cream/80 hover:text-cream"
                    )}
                  >
                    Bo{b}
                  </Button>
                ))}
              </div>

              <div className="ml-auto flex gap-2">
                <Button
                  variant="outline"
                  onClick={undo}
                  disabled={history.length === 0}
                  className="min-h-[44px] border-cream/30 text-cream hover:bg-cream/10"
                >
                  <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Fortryd
                </Button>
                <Button
                  variant="outline"
                  onClick={resetSeries}
                  className="min-h-[44px] border-cream/30 text-cream hover:bg-cream/10"
                >
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Nulstil
                </Button>
              </div>
            </div>

            {/* Spiller-kort med serie-score */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              {players.map((player, i) => {
                const active = strikerIndex === i && phase !== "over" && phase !== "reveal";
                return (
                  <div
                    key={i}
                    className={cn(
                      "rounded-xl border-2 bg-ink/60 p-4 transition-all",
                      active
                        ? "border-brick shadow-[0_0_24px_rgba(0,174,239,0.35)]"
                        : "border-white/10"
                    )}
                  >
                    <Input
                      value={player.name}
                      onChange={(e) => {
                        const next = [...players];
                        next[i] = { ...next[i], name: e.target.value };
                        setPlayers(next);
                      }}
                      aria-label={`Navn på spiller ${i + 1}`}
                      className="mb-3 min-h-[44px] border-white/20 bg-coal font-heading text-lg font-bold text-cream"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-cream/60">
                        {active ? "Ved turen" : `Game-vundne`}
                      </span>
                      <span
                        className="flex gap-1.5"
                        aria-label={`${player.name} har vundet ${player.score} af ${winsNeeded} nødvendige games`}
                      >
                        {Array.from({ length: winsNeeded }).map((_, dot) => (
                          <span
                            key={dot}
                            aria-hidden="true"
                            className={cn(
                              "h-3.5 w-3.5 rounded-full border-2 transition-all",
                              dot < player.score
                                ? "border-brick bg-brick shadow-[0_0_8px_rgba(0,174,239,0.8)]"
                                : "border-cream/30 bg-transparent"
                            )}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Statuslinje */}
            <div
              aria-live="polite"
              role="status"
              className="mb-6 rounded-xl border-2 border-brick/50 bg-gradient-to-r from-coal via-[#0d2a52] to-coal p-4 shadow-[0_0_30px_rgba(0,174,239,0.2)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-heading text-lg font-bold text-cream sm:text-xl">
                    {statusText()}
                  </p>
                  <p className="text-sm text-brick-soft">
                    {config.racing ? "Løb" : "Game"} {currentGame} · Bo{bestOf} · {config.label}
                  </p>
                </div>
                {phase === "over" ? (
                  <Trophy className="h-9 w-9 shrink-0 text-brick" aria-hidden="true" />
                ) : (
                  <span className="hidden shrink-0 rounded-full border border-brick/40 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brick-soft sm:block">
                    Live
                  </span>
                )}
              </div>
            </div>

            {/* Kontekst-knapper */}
            <AnimatePresence mode="wait">
              {phase === "choose-first" && (
                <motion.div
                  key="choose-first"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "mb-6 grid gap-3",
                    config.racing ? "sm:grid-cols-1" : "sm:grid-cols-3"
                  )}
                >
                  {config.racing ? (
                    <Button
                      size="lg"
                      onClick={drawRandomTrack}
                      className="min-h-[44px] bg-brick font-bold text-coal hover:bg-brick-soft"
                    >
                      <Dices className="mr-2 h-5 w-5" aria-hidden="true" />
                      Træk tilfældig bane til løb 1
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={() => selectFirstStriker(0)}
                        className="min-h-[44px] bg-brick font-bold text-coal hover:bg-brick-soft"
                      >
                        {players[0].name} striker først
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => selectFirstStriker(1)}
                        className="min-h-[44px] bg-brick font-bold text-coal hover:bg-brick-soft"
                      >
                        {players[1].name} striker først
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={coinFlip}
                        className="min-h-[44px] border-cream/30 font-bold text-cream hover:bg-cream/10"
                      >
                        <Dices className="mr-2 h-5 w-5" aria-hidden="true" />
                        Plat eller krone
                      </Button>
                    </>
                  )}
                </motion.div>
              )}

              {phase === "report" && (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 grid gap-3 sm:grid-cols-2"
                >
                  {([0, 1] as const).map((i) => (
                    <Button
                      key={i}
                      size="lg"
                      onClick={() => reportWinner(i)}
                      className="min-h-[44px] bg-brick font-bold text-coal hover:bg-brick-soft"
                    >
                      <Crown className="mr-2 h-5 w-5" aria-hidden="true" />
                      {players[i].name} vandt
                    </Button>
                  ))}
                </motion.div>
              )}

              {phase === "over" && (
                <motion.div
                  key="over"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-6 rounded-xl border-2 border-brick bg-ink/70 p-6 text-center shadow-[0_0_40px_rgba(0,174,239,0.35)]"
                >
                  <h3 className="font-display text-2xl text-cream sm:text-3xl">
                    {players.find((p) => p.score >= winsNeeded)?.name} vinder serien!
                  </h3>
                  <p className="mt-1 text-cream/70">
                    Slutresultat: {players[0].name} {players[0].score} –{" "}
                    {players[1].score} {players[1].name}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={shareResult}
                      className="min-h-[44px] border-cream/30 text-cream hover:bg-cream/10"
                    >
                      <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
                      Kopier resultat
                    </Button>
                    <Button
                      onClick={resetSeries}
                      className="min-h-[44px] bg-brick font-bold text-coal hover:bg-brick-soft"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                      Ny serie
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stage-grid */}
            <div
              ref={gridRef}
              role="group"
              aria-label="Stages"
              onKeyDown={onGridKeyDown}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            >
              {config.stages.map((stage) => (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  state={cardState(stage)}
                  actionLabel={actionLabel}
                  dsrLabel={config.racing ? "Spillet" : "DSR"}
                  onSelect={() => handleCardSelect(stage)}
                />
              ))}
            </div>

            {/* Regel-accordion */}
            <div className="mt-10">
              <h2 className="mb-4 font-heading text-xl font-bold text-cream">
                Sådan fungerer det
              </h2>
              {config.racing ? (
                <>
                  <AccordionItem title="Løb 1: Tilfældig bane">
                    <p>
                      Løb 1 trækkes <strong>tilfældigt</strong> blandt alle 32
                      baner – præcis som Mario Kart Wiis egen roulette. Ingen
                      spillere har fordel af at vælge først.
                    </p>
                  </AccordionItem>
                  <div className="mt-3">
                    <AccordionItem title="Taberen vælger næste bane">
                      <p>
                        Efter hvert løb vælger <strong>taberen</strong> frit den
                        næste bane blandt dem, der ikke er kørt endnu. Der er
                        ingen bans i vanilje Mario Kart – det er taberens
                        kompensation at få valget.
                      </p>
                    </AccordionItem>
                  </div>
                  <div className="mt-3">
                    <AccordionItem title="Ingen bane-gentagelser">
                      <p>
                        En bane der er kørt, kan <strong>ikke</strong> vælges
                        igen i serien – uanset hvem der vandt på den. Spillede
                        baner er markeret med en oliven "Spillet"-lås.
                      </p>
                    </AccordionItem>
                  </div>
                  <div className="mt-3">
                    <AccordionItem title="Standardindstillinger">
                      <p>
                        150cc, normale items, ingen CPU'er, alle karakterer og
                        køretøjer tilladt. Ultra-shortcuts og glitches er ikke
                        tilladt. Først til <strong>{winsNeeded}</strong>{" "}
                        løbssejre (Bo{bestOf}) vinder serien.
                      </p>
                    </AccordionItem>
                  </div>
                </>
              ) : (
                <>
                  <AccordionItem title="Game 1: 1-2-1 strike">
                    <p>
                      Kun de 5 starter-stages er i spil i game 1. Spilleren der
                      striker først fjerner <strong>1</strong> stage, modstanderen
                      fjerner <strong>2</strong>, og den første fjerner den sidste{" "}
                      <strong>1</strong>. Den tilbageværende stage er game 1.
                    </p>
                  </AccordionItem>
                  <div className="mt-3">
                    <AccordionItem title="Counter-pick: vinderen banner">
                      <p>
                        Efter hvert game banner vinderen{" "}
                        <strong>{config.bans} stage{config.bans > 1 ? "s" : ""}</strong>{" "}
                        fra hele listen (inkl. counterpicks), og taberen vælger frit
                        blandt resten.
                      </p>
                    </AccordionItem>
                  </div>
                  <div className="mt-3">
                    <AccordionItem title="DSR – Dave's Stupid Rule">
                      <p>
                        Du må <strong>ikke</strong> counterpicke til en stage, du
                        selv allerede har vundet på i serien. Stages spærret af DSR
                        er markeret med en oliven lås i listen herover.
                      </p>
                    </AccordionItem>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ---------- Sidebar ---------- */}
          <aside className="space-y-6">
            <div className="rounded-xl border-2 border-brick/30 bg-ink/60 p-5">
              <h3 className="mb-4 font-heading text-lg font-bold text-cream">
                Trin-for-trin
              </h3>
              <ol className="space-y-3 text-sm text-cream/80">
                {config.racing ? (
                  <>
                    <StepItem active={phase === "choose-first"} done={currentGame > 1 || phase !== "choose-first"} step={1}>
                      Træk tilfældig bane (løb 1)
                    </StepItem>
                    <StepItem active={phase === "report"} done={phase === "over"} step={2}>
                      Spil løbet & rapporter vinder
                    </StepItem>
                    <StepItem active={phase === "pick"} step={3}>
                      Taber vælger næste bane
                    </StepItem>
                    <StepItem active={phase === "over"} step={4}>
                      Først til {winsNeeded} løbssejre
                    </StepItem>
                  </>
                ) : (
                  <>
                    <StepItem active={phase === "choose-first"} done={firstStriker !== null} step={1}>
                      Vælg hvem der striker først
                    </StepItem>
                    <StepItem active={phase === "strike"} done={currentGame > 1 || phase !== "strike" && firstStriker !== null && strikes.length >= 4} step={2}>
                      Game 1: strike 1-2-1
                    </StepItem>
                    <StepItem active={phase === "report" && currentGame === 1} done={currentGame > 1} step={3}>
                      Spil game 1 & rapporter vinder
                    </StepItem>
                    <StepItem active={phase === "ban"} step={4}>
                      Vinder banner {config.bans} stage{config.bans > 1 ? "s" : ""}
                    </StepItem>
                    <StepItem active={phase === "pick"} step={5}>
                      Taber vælger stage (DSR)
                    </StepItem>
                    <StepItem active={phase === "over"} step={6}>
                      Først til {winsNeeded} vinder serien
                    </StepItem>
                  </>
                )}
              </ol>
            </div>

            <div className="rounded-xl border-2 border-brick/30 bg-ink/60 p-5">
              <h3 className="mb-4 font-heading text-lg font-bold text-cream">
                {config.racing ? "Spillede baner" : "DSR-tracking"}
              </h3>
              {config.racing ? (
                <div className="text-sm">
                  {playedTracks.length === 0 ? (
                    <p className="text-cream/50">Ingen baner kørt endnu</p>
                  ) : (
                    <ol className="list-decimal space-y-1 pl-4 text-cream/70">
                      {playedTracks.map((id, idx) => (
                        <li key={idx}>
                          {config.stages.find((s) => s.id === id)?.name ?? id}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  {players.map((player, i) => (
                    <div key={i}>
                      <p className="font-semibold text-cream">{player.name}</p>
                      {player.stageWins.length === 0 ? (
                        <p className="text-cream/50">Ingen stage-sejre endnu</p>
                      ) : (
                        <ul className="mt-1 list-disc pl-4 text-cream/70">
                          {player.stageWins.map((id, idx) => (
                            <li key={idx}>
                              {config.stages.find((s) => s.id === id)?.name ?? id}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border-2 border-white/10 bg-ink/80 p-5">
              <h3 className="mb-2 font-heading text-lg font-bold text-cream">Log</h3>
              <div className="max-h-64 space-y-2 overflow-y-auto text-xs text-cream/60">
                {log.map((entry, i) => (
                  <p key={i}>• {entry}</p>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Reveal-overlay */}
      <AnimatePresence>
        {phase === "reveal" && picked && (
          <RevealOverlay
            stage={picked}
            gameNumber={currentGame}
            canReselect={currentGame > 1}
            onConfirm={confirmReveal}
            onReselect={() => {
              pushHistory();
              setPickedStage(null);
              setPhase("pick");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StepItem({
  active,
  done,
  step,
  children,
}: {
  active: boolean;
  done?: boolean;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-2",
        active && "font-bold text-brick-soft",
        done && "text-cream/40 line-through"
      )}
    >
      {done ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-brick" aria-hidden="true" />
      ) : (
        <span className="font-display">{step}.</span>
      )}
      {children}
    </li>
  );
}
