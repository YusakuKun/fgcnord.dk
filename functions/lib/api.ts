import type { PlayerRow, SessionRow } from "./session";

export interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
  ADMIN_API_KEY: string;
  DISCORD_WEBHOOK_URL?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  DISCORD_REDIRECT_URI?: string;
  DISCORD_BOT_TOKEN?: string;
  DISCORD_GUILD_ID?: string;
  DISCORD_MEMBER_ROLE_ID?: string;
  /** Rolle der pinges ved nye turneringer/bracket-start (falder tilbage på medlemsrollen) */
  DISCORD_PING_ROLE_ID?: string;
  /** start.gg API-token (Developer Settings på start.gg) */
  STARTGG_API_TOKEN?: string;
}

export interface ApiContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
  data: {
    session?: SessionRow | null;
    player?: PlayerRow | null;
  };
}

export function corsHeaders(origin?: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function json(
  body: unknown,
  init: ResponseInit & { headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

export function error(
  message: string,
  status = 400,
  headers?: Record<string, string>,
): Response {
  return json({ error: message }, { status, headers });
}

export async function requireSession(
  ctx: ApiContext,
): Promise<SessionRow & { player: PlayerRow }> {
  const { session, player } = ctx.data;
  if (!session || !player) {
    throw new ResponseError("Du skal være logget ind.", 401);
  }
  if (session.expires_at < Date.now()) {
    throw new ResponseError("Sessionen er udløbet. Log ind igen.", 401);
  }
  return { ...session, player };
}

export function requireAdmin(ctx: ApiContext): void {
  const auth = ctx.request.headers.get("Authorization");
  const expected = ctx.env.ADMIN_API_KEY;
  if (!expected || auth !== `Bearer ${expected}`) {
    throw new ResponseError("Ugyldig admin-nøgle.", 403);
  }
}

export function getOrigin(request: Request): string {
  return request.headers.get("Origin") || "";
}

export class ResponseError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function handleError(
  err: unknown,
  origin: string,
): Promise<Response> {
  if (err instanceof ResponseError) {
    return error(err.message, err.status, corsHeaders(origin));
  }
  console.error("API error:", err);
  return error("Der opstod en uventet fejl.", 500, corsHeaders(origin));
}
