import { motion } from "framer-motion";
import { MoonStar, PhoneCall, CalendarX2 } from "lucide-react";
import { Reveal, ChapterTag } from "./Reveal";

const pains = [
  {
    icon: MoonStar,
    stat: "40%",
    statLabel: "prenota fuori orario",
    title: "Lo studio \u00E8 chiuso, i pazienti no",
    text: "Il 40% dei pazienti cerca di prenotare quando lo studio \u00E8 chiuso: sera e weekend. Se nessuno risponde, chiamano la concorrenza.",
  },
  {
    icon: PhoneCall,
    stat: "H24",
    statLabel: "telefono che suona",
    title: "La segreteria vive in interruzione",
    text: "La segreteria \u00E8 costantemente interrotta dal telefono mentre accoglie i pazienti fisici. Doppio lavoro, doppio stress, met\u00E0 resa.",
  },
  {
    icon: CalendarX2,
    stat: "\u20AC350",
    statLabel: "bruciati per ora vuota",
    title: "Disdette che bruciano fatturato",
    text: "Le disdette dell'ultimo minuto lasciano la poltrona vuota e bruciano ore di lavoro gi\u00E0 organizzato. Senza caparra, il rischio \u00E8 tutto tuo.",
  },
];

export const Problem = () => (
  <section id="problema" className="relative py-28 lg:py-36 noise" data-testid="problem-section">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <Reveal>
        <ChapterTag number="01" label="Il Problema" />
        <h2 className="font-heading font-bold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-slate-50 max-w-3xl leading-[1.1]">
          Quanto ti costano le chiamate perse e le{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal2 to-neon">poltrone vuote?</span>
        </h2>
        <p className="mt-6 text-base sm:text-lg text-mist max-w-2xl leading-relaxed">
          Ogni giorno il tuo studio perde pazienti e margine non per colpa della clinica, ma per colpa del telefono.
        </p>
      </Reveal>

      <div className="mt-16 grid md:grid-cols-3 gap-6">
        {pains.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.14}>
            <motion.div
              data-testid={`problem-card-${i + 1}`}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="group relative h-full rounded-2xl glass p-8 overflow-hidden hover:border-neon/25 transition-colors duration-500"
            >
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-teal2/10 blur-3xl group-hover:bg-neon/15 transition-colors duration-700" />
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 rounded-xl bg-card2 border border-white/8 flex items-center justify-center group-hover:glow-cyan transition-shadow duration-500">
                  <p.icon className="w-5 h-5 text-neon" strokeWidth={2.2} />
                </div>
                <div className="text-right">
                  <p className="font-heading font-extrabold text-3xl text-slate-50">{p.stat}</p>
                  <p className="font-mono2 text-[9px] uppercase tracking-[0.2em] text-dim mt-1">{p.statLabel}</p>
                </div>
              </div>
              <h3 className="font-heading font-semibold text-xl text-slate-50 mb-3">{p.title}</h3>
              <p className="text-sm text-mist leading-relaxed">{p.text}</p>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
