/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Pages Function bindings og secrets.
 * DB bindes i wrangler.toml / Pages-dashboard, resten sættes som secrets.
 */
interface Env {
  /** D1-databasebinding (fgcnord-db) */
  DB: D1Database;
  /** Hemmelighed til at signere session-cookies */
  SESSION_SECRET: string;
  /** Admin-nøgle til beskyttede endpoints (fx opret turnering) */
  ADMIN_API_KEY: string;
  /** Discord OAuth2 */
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;
  /** Discord-bot token — bruges til at tjekke server-medlemskab (valgfri) */
  DISCORD_BOT_TOKEN?: string;
  /** Vores Discord-servers guild-ID (valgfri, men krævet for medlems-tracking) */
  DISCORD_GUILD_ID?: string;
  DISCORD_MEMBER_ROLE_ID?: string;
  /** Rolle der pinges ved nye turneringer/bracket-start (valgfri — ellers bruges medlemsrollen) */
  DISCORD_PING_ROLE_ID?: string;
  /** start.gg API-token (Developer Settings på start.gg) — bruges til events + tilmeldte */
  STARTGG_API_TOKEN?: string;
  // Rang-roller slås op dynamisk pr. spil og rang (se lib/ranks.ts):
  // DISCORD_MELEE_RANK_ROLE_1..8, DISCORD_ULTIMATE_RANK_ROLE_1..8, DISCORD_ROA2_RANK_ROLE_1..8
}
