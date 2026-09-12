import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, CalendarClock } from "lucide-react";
import { scrollToId } from "../lib/scroll";

const links = [
  { label: "Il Problema", href: "#problema", testid: "nav-link-problema" },
  { label: "Come Funziona", href: "#soluzione", testid: "nav-link-soluzione" },
  { label: "Confronto", href: "#confronto", testid: "nav-link-roi" },
  { label: "Garanzie", href: "#garanzia", testid: "nav-link-garanzia" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      data-testid="navbar"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow] duration-500 ${
        scrolled ? "glass border-b border-white/5" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[72px] flex items-center justify-between">
        <button
          data-testid="nav-logo"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-3 group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-teal2 to-neon flex items-center justify-center glow-cyan">
            <Sparkles className="w-4.5 h-4.5 text-ink" strokeWidth={2.4} />
          </div>
          <div className="text-left leading-none">
            <span className="font-heading font-bold text-[15px] tracking-tight text-slate-50 block">
              Digital Care <span className="text-neon">AI</span>
            </span>
            <span className="font-mono2 text-[9px] uppercase tracking-[0.28em] text-dim">Solution</span>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-9">
          {links.map((l) => (
            <button
              key={l.href}
              data-testid={l.testid}
              onClick={() => scrollToId(l.href)}
              className="text-sm font-medium text-mist hover:text-neon transition-colors duration-300"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <button
          data-testid="nav-cta-button"
          onClick={() => scrollToId("#booking")}
          className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-teal2 to-neon px-5 py-2.5 text-sm font-semibold text-ink transition-transform duration-300 hover:scale-[1.04] glow-cyan"
        >
          <CalendarClock className="w-4 h-4" strokeWidth={2.4} />
          <span className="hidden sm:inline">Prenota Demo 15 Min</span>
          <span className="sm:hidden">Demo</span>
        </button>
      </div>
    </motion.header>
  );
};
