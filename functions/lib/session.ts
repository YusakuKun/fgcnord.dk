import type { D1Database } from "@cloudflare/workers-types";
import { ulid } from "./ulid";

const COOKIE_NAME = "fgc_session";
const SESSION_HOURS = 12;

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function unsign(
  value: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const key = await importKey(secret);
  const sigBytes = new Uint8Array(
    signature.match(/.{2}/g)?.map((b) => parseInt(b, 16)) || [],
  );
  if (sigBytes.length !== 32) return false;
  return crypto.subtle.verify("HMAC", key, sigBytes, encode(value));
}

function parseCookies(header: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) return result;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key) result[key] = decodeURIComponent(rest.join("="));
  }
  return result;
}

function serializeCookie(
  name: string,
  value: string,
  options: { maxAge?: number; expires?: Date; remove?: boolean },
): string {
  let cookie = `${name}=${encodeURIComponent(value)}`;
  if (options.remove) {
    cookie = `${name}=; Max-Age=0`;
  } else if (options.maxAge !== undefined) {
    cookie += `; Max-Age=${options.maxAge}`;
  } else if (options.expires) {
    cookie += `; Expires=${options.expires.toUTCString()}`;
  }
  cookie += "; Path=/; HttpOnly; Secure; SameSite=Lax";
  return cookie;
}

export interface SessionRow {
  token: string;
  player_id: string;
  tournament_id: string | null;
  expires_at: number;
}

export interface PlayerRow {
  id: string;
  discord_id: string | null;
  gamertag: string;
  created_at: number;
  is_admin: number;
}

export async function createSession(
  db: D1Database,
  secret: string,
  playerId: string,
  tournamentId?: string | null,
): Promise<{ token: string; cookie: string }> {
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET er ikke konfigureret korrekt.");
  }
  const token = ulid();
  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  await db
    .prepare(
      "INSERT INTO sessions (token, player_id, tournament_id, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(token, playerId, tournamentId ?? null, expiresAt)
    .run();
  const signature = await sign(token, secret);
  const cookie = serializeCookie(COOKIE_NAME, `${token}.${signature}`, {
    maxAge: SESSION_HOURS * 60 * 60,
  });
  return { token, cookie };
}

export async function readSession(
  request: Request,
  db: D1Database,
  secret: string,
): Promise<{ session: SessionRow | null; player: PlayerRow | null }> {
  if (!secret || secret.length < 16) {
    return { session: null, player: null };
  }
  const cookies = parseCookies(request.headers.get("Cookie"));
  const raw = cookies[COOKIE_NAME];
  if (!raw) return { session: null, player: null };

  const lastDot = raw.lastIndexOf(".");
  if (lastDot === -1) return { session: null, player: null };
  const token = raw.slice(0, lastDot);
  const signature = raw.slice(lastDot + 1);

  const valid = await unsign(token, signature, secret);
  if (!valid) return { session: null, player: null };

  // is_admin-kolonnen (migration 0005) kan mangle indtil den køres i D1 —
  // så falder vi tilbage til et SELECT uden den, og login virker stadig.
  type JoinedRow = SessionRow & {
    p_id: string;
    discord_id: string | null;
    gamertag: string;
    created_at: number;
    is_admin?: number;
  };
  let row: JoinedRow | null;
  try {
    row = await db
      .prepare(
        `SELECT s.token, s.player_id, s.tournament_id, s.expires_at,
                p.id as p_id, p.discord_id, p.gamertag, p.created_at, p.is_admin
         FROM sessions s
         JOIN players p ON p.id = s.player_id
         WHERE s.token = ?`,
      )
      .bind(token)
      .first<JoinedRow>();
  } catch {
    row = await db
      .prepare(
        `SELECT s.token, s.player_id, s.tournament_id, s.expires_at,
                p.id as p_id, p.discord_id, p.gamertag, p.created_at
         FROM sessions s
         JOIN players p ON p.id = s.player_id
         WHERE s.token = ?`,
      )
      .bind(token)
      .first<JoinedRow>();
  }

  if (!row || row.expires_at < Date.now()) {
    return { session: null, player: null };
  }

  const session: SessionRow = {
    token: row.token,
    player_id: row.player_id,
    tournament_id: row.tournament_id,
    expires_at: row.expires_at,
  };
  const player: PlayerRow = {
    id: row.p_id,
    discord_id: row.discord_id,
    gamertag: row.gamertag,
    created_at: row.created_at,
    is_admin: row.is_admin ?? 0,
  };
  return { session, player };
}

export async function destroySession(
  db: D1Database,
  token: string,
): Promise<string> {
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  return serializeCookie(COOKIE_NAME, "", { remove: true });
}

export function setCookieHeader(cookie: string): Record<string, string> {
  return { "Set-Cookie": cookie };
}
