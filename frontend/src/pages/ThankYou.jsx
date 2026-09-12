import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2, CalendarDays, Clock, Building2, Mail,
  ArrowLeft, Video, Inbox, Sparkles,
} from "lucide-react";

const steps = [
  { icon: Inbox, title: "Controlla la tua email", text: "Ti abbiamo appena inviato la conferma con data e orario della demo." },
  { icon: Video, title: "Ricevi il link della videochiamata", text: "Poco prima dell'appuntamento ti arriva il link per collegarti: 15 minuti, zero impegno." },
  { icon: Sparkles, title: "Guarda la demo live", text: "Vedrai l'assistente AI prenotare e incassare una caparra in diretta sul telefono." },
];

export default function ThankYou() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state) navigate("/", { replace: true });
  }, [state, navigate]);

  if (!state) return null;

  const dateLabel = new Date(`${state.date}T00:00:00`).toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-ink grid-bg noise relative flex items-center justify-center px-6 py-16" data-testid="thankyou-page">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-teal2/12 blur-[140px] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25, type: "spring", bounce: 0.45 }}
            className="mx-auto w-20 h-20 rounded-full bg-mint/15 border border-mint/30 flex items-center justify-center mb-7 glow-cyan"
          >
            <CheckCircle2 className="w-10 h-10 text-mint" strokeWidth={2.2} />
          </motion.div>
          <h1 className="font-heading font-extrabold tracking-tight text-4xl sm:text-5xl text-slate-50 leading-[1.08]">
            Demo <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal2 to-neon">prenotata.</span>
          </h1>
          <p className="mt-4 text-mist text-base sm:text-lg">
            Ci vediamo presto, {state.name.split(" ")[0]}. Ecco il riepilogo.
          </p>
        </div>

        <div className="rounded-3xl glass glow-cyan p-7 sm:p-9 mb-8" data-testid="thankyou-summary">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4.5 h-4.5 text-neon" />
              </div>
              <div>
                <p className="font-mono2 text-[9px] uppercase tracking-[0.22em] text-dim">Data</p>
                <p className="font-heading font-semibold text-slate-50 capitalize">{dateLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center shrink-0">
                <Clock className="w-4.5 h-4.5 text-neon" />
              </div>
              <div>
                <p className="font-mono2 text-[9px] uppercase tracking-[0.22em] text-dim">Orario</p>
                <p className="font-heading font-semibold text-slate-50">{state.time_slot} · 15 minuti</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center shrink-0">
                <Building2 className="w-4.5 h-4.5 text-neon" />
              </div>
              <div>
                <p className="font-mono2 text-[9px] uppercase tracking-[0.22em] text-dim">Studio</p>
                <p className="font-heading font-semibold text-slate-50">{state.clinic}</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center shrink-0">
                <Mail className="w-4.5 h-4.5 text-neon" />
              </div>
              <div className="min-w-0">
                <p className="font-mono2 text-[9px] uppercase tracking-[0.22em] text-dim">Conferma inviata a</p>
                <p className="font-heading font-semibold text-slate-50 truncate">{state.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-10">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
              className="flex items-start gap-4 rounded-2xl glass px-5 py-4"
            >
              <div className="w-9 h-9 rounded-lg bg-card2 border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
                <s.icon className="w-4 h-4 text-neon" />
              </div>
              <div>
                <p className="font-heading font-semibold text-slate-50 text-sm">{s.title}</p>
                <p className="text-sm text-mist mt-0.5 leading-relaxed">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/"
            data-testid="thankyou-home-button"
            className="inline-flex items-center gap-2.5 rounded-full border border-white/12 px-7 py-3.5 text-sm font-semibold text-mist hover:text-neon hover:border-neon/40 transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
