import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { DiscordIcon, DISCORD_URL } from "./Navbar";

/**
 * Live Discord-widget: online-tal fra serverens widget API + join-knap.
 * Kræver at "Server Widget" er slået til i Discord (Server Settings → Widget).
 * Fejler stille og viser kun join-knappen, hvis widgetten ikke er slået til.
 */
const GUILD_ID = "1544161616902230046"; // FGC Nord Discord-server

interface WidgetData {
  presence_count: number;
  name: string;
}

export function DiscordWidget() {
  const [online, setOnline] = useState<number | null>(null);

  useEffect(() => {
    fetch(`https://discord.com/api/guilds/${GUILD_ID}/widget.json`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("widget off"))))
      .then((data: WidgetData) => setOnline(data.presence_count))
      .catch(() => setOnline(null));
  }, []);

  return (
    <div className="rounded-xl border-2 border-cream/20 bg-coal/60 p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-cream/40 text-cream/85">
            <DiscordIcon />
          </span>
          <div>
            <p className="font-heading font-bold text-cream">FGC Nord på Discord</p>
            {online !== null && (
              <p className="flex items-center gap-1.5 text-sm text-cream/70">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                {online} online lige nu
              </p>
            )}
          </div>
        </div>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-ink bg-brick px-4 py-2 font-heading text-sm font-bold uppercase tracking-wide text-white shadow-poster transition-transform hover:-translate-y-0.5"
        >
          <Users className="h-4 w-4" aria-hidden="true" />
          Join
        </a>
      </div>
    </div>
  );
}
