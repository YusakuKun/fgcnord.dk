import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { motion } from "framer-motion";
import { KonamiEgg } from "./KonamiEgg";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/** Delt layout: sticky navbar, Lenis smooth scroll, footer. Content slot = <Outlet/> */
export function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const lenis = new Lenis({ lerp: 0.09 });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-coal">
      <a
        href="#indhold"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:border-[3px] focus:border-ink focus:bg-brick focus:px-5 focus:py-2.5 focus:font-semibold focus:text-ink"
      >
        Spring til indhold
      </a>
      <Navbar />
      <motion.main
        key={pathname}
        id="indhold"
        tabIndex={-1}
        className="flex-1 outline-none"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Outlet />
      </motion.main>
      <Footer />
      {/* 🥚 Inaktiv easter egg — se KonamiEgg.tsx (KONAMI_ENABLED = false) */}
      <KonamiEgg />
    </div>
  );
}
