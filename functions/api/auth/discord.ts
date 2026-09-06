import { ApiContext, corsHeaders, error, getOrigin, handleError } from "../../lib/api";

/** Cookie der bærer OAuth state-nonce gennem login-flowet (CSRF-værn) */
export const OAUTH_STATE_COOKIE = "fgc_oauth_state";
const STATE_TTL_SECONDS = 600; // 10 minutter til at gennemføre login

function getRedirectUri(ctx: ApiContext): string {
  return (
    ctx.env.DISCORD_REDIRECT_URI ||
    `${new URL(ctx.request.url).origin}/api/auth/discord/callback`
  );
}

export async function onRequestGet(
  context: EventContext<Env, never, { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const clientId = ctx.env.DISCORD_CLIENT_ID;
    const clientSecret = ctx.env.DISCORD_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return error("Discord-login er ikke konfigureret.", 503, corsHeaders(origin));
    }

    const reqUrl = new URL(ctx.request.url);
    const returnToParam = reqUrl.searchParams.get("returnTo") || "/";
    const returnTo =
      returnToParam.startsWith("/") && !returnToParam.startsWith("//")
        ? returnToParam
        : "/";

    // State bærer både CSRF-nonce og returlink gennem OAuth-flowet.
    // Noncen gemmes også i en httpOnly-cookie og verificeres i callback.
    const nonce = crypto.randomUUID();
    const state = btoa(
      JSON.stringify({ n: nonce, r: returnTo }),
    )
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");

    const redirectUri = getRedirectUri(ctx);

    const url = new URL("https://discord.com/oauth2/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "identify");
    url.searchParams.set("state", state);

    return new Response(null, {
      status: 302,
      headers: {
        Location: url.toString(),
        "Set-Cookie": `${OAUTH_STATE_COOKIE}=${nonce}; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=${STATE_TTL_SECONDS}`,
      },
    });
  } catch (err) {
    return handleError(err, origin);
  }
}

export async function onRequestOptions(
  context: EventContext<Env, never, { ctx: ApiContext }>,
): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(getOrigin(context.data.ctx.request)),
  });
}
