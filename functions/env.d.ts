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
  /** Discord-rolle-IDs for rangliste top 8 (valgfri) */
  DISCORD_RANK_ROLE_1?: string;
  DISCORD_RANK_ROLE_2?: string;
  DISCORD_RANK_ROLE_3?: string;
  DISCORD_RANK_ROLE_4?: string;
  DISCORD_RANK_ROLE_5?: string;
  DISCORD_RANK_ROLE_6?: string;
  DISCORD_RANK_ROLE_7?: string;
  DISCORD_RANK_ROLE_8?: string;
}
