import {
  ApiContext,
  corsHeaders,
  error,
  getOrigin,
  handleError,
  json,
  requireSession,
  ResponseError,
} from "../../../lib/api";
import {
  DISCORD_COLORS,
  gameLabel,
  notifyDiscord,
  tournamentUrl,
} from "../../../lib/discord";

/** Check-in åbner 15 min før runde 1 og lukker 60 min efter start */
const CHECKIN_OPENS_BEFORE_MS = 15 * 60 * 1000;
const CHECKIN_CLOSES_AFTER_MS = 60 * 60 * 1000;

function formatTid(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Copenhagen",
  });
}

export async function onRequestPost(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const session = await requireSession(ctx);
    const code = (context.params.code as string);

    const tournament = await ctx.env.DB.prepare(
      "SELECT id, name, game, status, start_at FROM tournaments WHERE join_code = ?",
    )
      .bind(code)
      .first<{ id: string; name: string; game: string; status: string; start_at: number | null }>();

    if (!tournament) {
      return error("Turneringen findes ikke.", 404, corsHeaders(origin));
    }

    if (tournament.status !== "checkin" && tournament.status !== "signup") {
      throw new ResponseError("Check-in er ikke åben.", 400);
    }

    // Tidsvindue: check-in åbner 15 min før runde 1
    const now = Date.now();
    if (tournament.start_at) {
      const opens = tournament.start_at - CHECKIN_OPENS_BEFORE_MS;
      const closes = tournament.start_at + CHECKIN_CLOSES_AFTER_MS;
      if (now < opens) {
        throw new ResponseError(
          `Check-in åbner kl. ${formatTid(opens)} — 15 minutter før runde 1.`,
          400,
        );
      }
      if (now > closes) {
        throw new ResponseError("Check-in er lukket. Bracket er ved at blive sat.", 400);
      }
    }

    const entry = await ctx.env.DB.prepare(
      "SELECT 1 FROM entries WHERE tournament_id = ? AND player_id = ?",
    )
      .bind(tournament.id, session.player_id)
      .first();

    if (!entry) {
      throw new ResponseError("Du er ikke tilmeldt turneringen.", 400);
    }

    await ctx.env.DB.prepare(
      "UPDATE entries SET checked_in = 1 WHERE tournament_id = ? AND player_id = ?",
    )
      .bind(tournament.id, session.player_id)
      .run();

    const counts = await ctx.env.DB.prepare(
      `SELECT COUNT(*) AS total, SUM(checked_in) AS checked_in
       FROM entries WHERE tournament_id = ?`,
    )
      .bind(tournament.id)
      .first<{ total: number; checked_in: number | null }>();

    // Fortæl Discord — spilleren er klar til at kæmpe
    context.waitUntil(
      notifyDiscord(ctx.env, {
        title: `✅ ${session.player.gamertag} er checked ind`,
        description: `${gameLabel(tournament.game)} — ${tournament.name}`,
        color: DISCORD_COLORS.emerald,
        url: tournamentUrl(ctx.request, code),
        fields: [
          {
            name: "Check-in status",
            value: `${counts?.checked_in ?? 0}/${counts?.total ?? 0} spillere klar`,
            inline: true,
          },
        ],
      }),
    );

    return json({ success: true }, { headers: corsHeaders(origin) });
  } catch (err) {
    return handleError(err, origin);
  }
}

export async function onRequestOptions(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(getOrigin(context.data.ctx.request)),
  });
}
