import { motion } from "framer-motion";
import { TrendingUp, CalendarCheck2, Euro, Armchair } from "lucide-react";

const metrics = [
  { icon: Armchair, label: "Poltrone Occupate", value: "96%", delta: "+18%" },
  { icon: CalendarCheck2, label: "Appuntamenti Salvati", value: "48", delta: "/mese" },
  { icon: Euro, label: "Fatturato Protetto", value: "\u20AC14.200", delta: "+32%" },
];

const bars = [34, 52, 44, 68, 58, 82, 74, 96];

const agenda = [
  { time: "09:30", name: "Luca M. · Urgenza dolore", tag: "Caparra incassata", hot: true },
  { time: "10:15", name: "Sara P. · Igiene orale", tag: "Caparra incassata", hot: true },
  { time: "11:00", name: "Giulia R. · Controllo ortodonzia", tag: "Confermato AI", hot: false },
];

export const DashboardMock = () => (
  <div
    data-testid="hero-mockup-dashboard"
    className="relative w-[340px] sm:w-[420px] rounded-3xl glass p-5 sm:p-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]"
  >
    <div className="flex items-center justify-between mb-5">
      <div>
        <p className="font-mono2 text-[9px] uppercase tracking-[0.3em] text-dim">Dashboard Live</p>
        <p className="font-heading font-bold text-slate-50 text-sm mt-0.5">Studio Bellini · Oggi</p>
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-mint/10 border border-mint/25 px-2.5 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
        <span className="font-mono2 text-[9px] text-mint uppercase tracking-wider">AI attiva</span>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2.5 mb-5">
      {metrics.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 + i * 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-xl bg-card2/70 border border-white/5 p-3"
        >
          <m.icon className="w-3.5 h-3.5 text-neon mb-2" />
          <p className="font-heading font-extrabold text-slate-50 text-base sm:text-lg leading-none">{m.value}</p>
          <p className="text-[9px] text-dim mt-1 leading-tight">{m.label}</p>
          <p className="font-mono2 text-[9px] text-mint mt-0.5">{m.delta}</p>
        </motion.div>
      ))}
    </div>

    <div className="rounded-xl bg-card2/50 border border-white/5 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono2 uppercase tracking-widest text-dim">Riempimento agenda · 8 settimane</span>
        <TrendingUp className="w-3.5 h-3.5 text-neon" />
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 1.2 + i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={`flex-1 rounded-sm ${i === bars.length - 1 ? "bg-gradient-to-t from-teal2 to-neon glow-cyan" : "bg-teal2/25"}`}
          />
        ))}
      </div>
    </div>

    <div className="space-y-2">
      {agenda.map((a, i) => (
        <motion.div
          key={a.time}
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.6 + i * 0.18, duration: 0.6 }}
          className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2"
        >
          <span className="font-mono2 text-[11px] text-neon w-9">{a.time}</span>
          <span className="text-[11px] text-slate-300 flex-1 truncate">{a.name}</span>
          <span className={`font-mono2 text-[8.5px] uppercase tracking-wider rounded-full px-2 py-0.5 ${a.hot ? "bg-mint/10 text-mint border border-mint/25" : "bg-neon/10 text-neon border border-neon/25"}`}>
            {a.tag}
          </span>
        </motion.div>
      ))}
    </div>
  </div>
);
