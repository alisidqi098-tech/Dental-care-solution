import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, PlayCircle, MessageCircle, BadgeCheck } from "lucide-react";
import { scrollToId } from "../lib/scroll";
import { WhatsAppMock } from "./WhatsAppMock";
import { DashboardMock } from "./DashboardMock";

const lines = [
  { text: "Azzera le disdette", accent: false },
  { text: "e libera la tua segreteria", accent: false },
  { text: "dal telefono.", accent: true },
];

export const Hero = () => {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useTransform(my, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(mx, [-0.5, 0.5], [-9, 9]);
  const badgeX = useTransform(mx, [-0.5, 0.5], [-18, 18]);
  const badgeY = useTransform(my, [-0.5, 0.5], [-12, 12]);

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section className="relative min-h-screen grid-bg noise overflow-hidden pt-[72px]" data-testid="hero-section">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-teal2/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -left-40 w-[420px] h-[420px] rounded-full bg-neon/8 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-14 lg:pt-20 pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-16 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="inline-flex items-center gap-2.5 rounded-full glass px-4 py-2 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-neon animate-pulse-ring" />
            <span className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-mist">
              Assistente AI · WhatsApp · 24/7
            </span>
          </motion.div>

          <h1 className="font-heading font-extrabold tracking-tight leading-[1.04] text-4xl sm:text-5xl lg:text-[4.2rem] text-slate-50" data-testid="hero-headline">
            {lines.map((l, i) => (
              <span key={i} className="block overflow-hidden pb-1">
                <motion.span
                  className={`block ${l.accent ? "text-transparent bg-clip-text bg-gradient-to-r from-teal2 to-neon text-glow" : ""}`}
                  initial={{ y: "115%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, delay: 0.45 + i * 0.16, ease: [0.22, 1, 0.36, 1] }}
                >
                  {l.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.05 }}
            className="mt-7 text-base sm:text-lg text-mist leading-relaxed max-w-xl"
            data-testid="hero-subheadline"
          >
            Il primo assistente virtuale basato su AI che risponde ai pazienti su WhatsApp 24/7,
            incassa gli acconti e riempie la tua agenda in automatico.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.25 }}
            className="mt-10 flex flex-wrap items-center gap-5"
          >
            <button
              data-testid="hero-cta-button"
              onClick={() => scrollToId("#booking")}
              className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-teal2 to-neon px-8 py-4 font-heading font-bold text-ink text-base transition-transform duration-300 hover:scale-[1.04] glow-cyan-strong"
            >
              Prenota una Demo di 15 Minuti
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" strokeWidth={2.5} />
            </button>
            <button
              data-testid="hero-secondary-cta"
              onClick={() => scrollToId("#soluzione")}
              className="flex items-center gap-2.5 text-sm font-semibold text-mist hover:text-neon transition-colors duration-300"
            >
              <PlayCircle className="w-5 h-5" />
              Guarda come funziona
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
            className="mt-12 flex flex-wrap gap-x-8 gap-y-3"
          >
            {["Nessuna installazione", "Caparre via Stripe", "GDPR compliant"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-mint" />
                <span className="text-xs font-medium text-dim uppercase tracking-wider">{t}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <div
          ref={ref}
          onMouseMove={onMove}
          onMouseLeave={() => { mx.set(0); my.set(0); }}
          className="relative flex justify-center lg:justify-end"
          style={{ perspective: 1200 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative flex items-end gap-4 flex-col sm:flex-row"
          >
            <div className="animate-float-slow">
              <WhatsAppMock />
            </div>
            <div className="hidden md:block -ml-10 z-10" style={{ transform: "translateZ(50px)" }}>
              <DashboardMock />
            </div>

            <motion.div
              style={{ x: badgeX, y: badgeY }}
              className="absolute -top-8 -left-4 sm:-left-10 glass rounded-2xl px-4 py-3 flex items-center gap-3 glow-cyan z-20"
            >
              <div className="w-8 h-8 rounded-full bg-mint/15 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-mint" />
              </div>
              <div className="leading-tight">
                <p className="font-heading font-bold text-sm text-slate-50">Risposta in 3 sec</p>
                <p className="font-mono2 text-[9px] text-dim uppercase tracking-widest">Anche di notte</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
