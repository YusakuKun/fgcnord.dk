import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Sparkle } from "./Sparkle";

const LINKS = [
  { to: "/", label: "Forside" },
  { to: "/turneringer", label: "Turneringer" },
  { to: "/lobby", label: "Lobby" },
  { to: "/rangliste", label: "Rangliste" },
  { to: "/stage-strike", label: "Stage Strike" },
  { to: "/galleri", label: "Galleri" },
  { to: "/om", label: "Om fællesskabet" },
];

export const DISCORD_URL = "https://discord.gg/cX9P646RAG";

export function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1 -.006.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Luk overlay ved route-skift
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape lukker + simpel focus-trap + fokus tilbage på knappen
  useEffect(() => {
    if (!open) return;
    const overlay = overlayRef.current;
    const focusables = () =>
      Array.from(
        overlay?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []
      );
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b-[3px] border-ink/60 bg-coal transition-shadow duration-200 ${
        scrolled ? "shadow-[0_4px_0_#141413]" : ""
      }`}
    >
      <div className="mx-auto flex h-[76px] max-w-[1200px] items-center justify-between px-5 md:px-6">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src="/fgc5_light_transparent.png" alt="FGC Nord logo" className="h-11 w-auto" />
          <span className="font-display text-xl uppercase tracking-[-0.01em] text-cream">FGC Nord</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Hovedmenu">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `relative text-[15px] font-semibold text-cream/85 transition-colors hover:text-brick ${
                  isActive ? "after:absolute after:-bottom-[6px] after:left-0 after:h-[3px] after:w-full after:bg-brick" : "link-underline"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <NavLink
            to="/bliv-medlem"
            className="rounded-full border-[3px] border-ink bg-brick px-5 py-2 text-[15px] font-semibold uppercase tracking-[0.02em] text-ink shadow-poster-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brick-soft hover:shadow-poster"
          >
            Bliv medlem
          </NavLink>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="FGC Nord på Discord"
            className="text-cream/85 transition-all duration-200 hover:scale-110 hover:text-brick"
          >
            <DiscordIcon size={24} />
          </a>
        </nav>

        {/* Mobil hamburger */}
        <button
          className="flex h-11 w-11 items-center justify-center rounded-xl border-[3px] border-ink bg-coal border-cream/40 shadow-none lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Luk menu" : "Åbn menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobil fuldskærms-overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={overlayRef}
            id="mobilmenu"
            role="dialog"
            aria-modal="true"
            aria-label="Mobilmenu"
            className="fixed inset-0 top-[76px] z-40 flex flex-col bg-coal lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <nav className="halftone-dark flex flex-1 flex-col justify-center gap-2 px-8" aria-label="Mobilmenu">
              {[...LINKS, { to: "/bliv-medlem", label: "Bliv medlem" }].map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 60, opacity: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                >
                  <NavLink
                    to={l.to}
                    end={l.to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-4 py-3 font-display text-3xl uppercase tracking-[-0.01em] ${
                        isActive ? "text-brick-soft" : "text-cream"
                      }`
                    }
                  >
                    <Sparkle size={20} />
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
              <motion.a
                href={DISCORD_URL}
                target="_blank"
                rel="noreferrer"
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 60, opacity: 0 }}
                transition={{ duration: 0.3, delay: 5 * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 inline-flex items-center gap-3 text-cream/80"
              >
                <DiscordIcon size={22} /> Join os på Discord
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
