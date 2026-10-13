import { Link } from "react-router-dom";
import { Sparkle } from "./Sparkle";
import { WaveDivider } from "./WaveDivider";
import { DiscordIcon, DISCORD_URL } from "./Navbar";

const NAV = [
  { to: "/", label: "Forside" },
  { to: "/turneringer", label: "Turneringer" },
  { to: "/stage-strike", label: "Stage Strike" },
  { to: "/docs", label: "Guides" },
  { to: "/om", label: "Om fællesskabet" },
  { to: "/bliv-medlem", label: "Bliv medlem" },
];

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46H15.2c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.7 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85C2.42 3.92 3.94 2.38 7.15 2.27 8.42 2.21 8.8 2.2 12 2.2Zm0 3.68a6.12 6.12 0 1 0 0 12.24 6.12 6.12 0 0 0 0-12.24Zm0 10.1a3.98 3.98 0 1 1 0-7.96 3.98 3.98 0 0 1 0 7.96Zm6.36-11.85a1.43 1.43 0 1 0 0 2.86 1.43 1.43 0 0 0 0-2.86Z" />
    </svg>
  );
}

function StartggIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 4h7v3H7v10h10v-4h3v7H4V4Zm9 0h7v7h-3V7.7l-5.15 5.15-2.12-2.12L14.88 5.5 13 4Z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-coal text-cream">
      <WaveDivider fill="#51512A" flip className="absolute inset-x-0 top-0 -translate-y-[99%]" animate={false} />
      <div className="mx-auto max-w-[1200px] px-6 pb-10 pt-20 md:px-6">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <img src="/fgc5_light_transparent.png" alt="FGC Nord logo" className="h-14 w-auto" />
              <span className="font-display text-xl uppercase text-cream">FGC Nord</span>
            </div>
            <p className="mt-4 text-[15px] text-cream/70">Platform fighters i Nordjylland</p>
            <Sparkle size={28} className="mt-6 animate-spin-slow" />
          </div>

          <nav aria-label="Footer navigation">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.18em] text-brick-soft">Navigation</h3>
            <ul className="mt-4 space-y-2.5">
              {NAV.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-[15px] text-cream/85 transition-colors hover:text-brick-soft">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-[0.18em] text-brick-soft">Kontakt</h3>
            <ul className="mt-4 space-y-2.5 text-[15px] text-cream/85">
              <li>
                <a href="mailto:kontakt@fgcnord.dk" className="transition-colors hover:text-brick-soft">
                  kontakt@fgcnord.dk
                </a>
              </li>
              <li>Aalborg, Nordjylland</li>
            </ul>
          </div>

          <div>
            <h3 className="text-[13px] font-bold uppercase tracking-[0.18em] text-brick-soft">Følg med</h3>
            <div className="mt-4 flex gap-3">
              {[
                { href: DISCORD_URL, label: "Discord", icon: <DiscordIcon /> },
                { href: "https://facebook.com/fgcnord", label: "Facebook", icon: <FacebookIcon /> },
                { href: "https://instagram.com/fgcnord", label: "Instagram", icon: <InstagramIcon /> },
                { href: "https://start.gg/fgcnord", label: "start.gg", icon: <StartggIcon /> },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-cream/40 text-cream/85 transition-all duration-200 hover:-translate-y-0.5 hover:border-brick-soft hover:text-brick-soft"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t-2 border-cream/15 pt-6 text-[14px] text-cream/60 md:flex-row">
          <p>© 2026 FGC Nord · Fællesskab drevet af frivillige</p>
          <div className="flex gap-6">
            <Link to="/om" className="transition-colors hover:text-brick-soft">
              Privatliv
            </Link>
            <Link
              to="/admin"
              className="text-cream/40 transition-colors hover:text-brick-soft"
              aria-label="Web admin — kontrolpanel for crew"
            >
              Web admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
