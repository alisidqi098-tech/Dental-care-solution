import { Check, X } from "lucide-react";
import { Reveal, ChapterTag } from "./Reveal";

const rows = [
  { feature: "Gestione della segreteria", old: "Segreteria sotto stress, sempre al telefono", ai: "Risposte in 3 secondi, 24 ore su 24, 7 giorni su 7" },
  { feature: "Precisione dei dati", old: "Rischio di errori manuali e trascrizioni", ai: "Zero errori di trascrizione, tutto automatico" },
  { feature: "Prenotazioni notturne e weekend", old: "Zero prenotazioni fuori orario", ai: "Acquisizione pazienti h24, anche a studio chiuso" },
  { feature: "Incasso e disdette", old: "Incasso solo a fine visita, no-show frequenti", ai: "Caparra anticipata obbligatoria via Stripe" },
];

export const Comparison = () => (
  <section id="confronto" className="relative py-28 lg:py-36 noise" data-testid="comparison-section">
    <div className="max-w-6xl mx-auto px-6 lg:px-10">
      <Reveal>
        <ChapterTag number="03" label="Il Confronto" />
        <h2 className="font-heading font-bold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-slate-50 max-w-3xl leading-[1.1]">
          Metodo tradizionale vs{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal2 to-neon">Digital Care Solution AI</span>
        </h2>
      </Reveal>

      <Reveal delay={0.15}>
        <div data-testid="comparison-table" className="mt-14 rounded-3xl glass overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_1fr] max-md:grid-cols-[0.9fr_1fr_1fr] bg-white/[0.03] border-b border-white/8">
            <div className="p-5 sm:p-6 font-mono2 text-[10px] uppercase tracking-[0.25em] text-dim self-center">Aspetto</div>
            <div className="p-5 sm:p-6 font-heading font-semibold text-sm sm:text-base text-mist border-l border-white/8 self-center">Metodo Tradizionale</div>
            <div className="p-5 sm:p-6 font-heading font-bold text-sm sm:text-base text-neon border-l border-neon/20 bg-neon/[0.04] self-center">Digital Care AI</div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.feature}
              className={`grid grid-cols-[1fr_1fr_1fr] max-md:grid-cols-[0.9fr_1fr_1fr] ${i !== rows.length - 1 ? "border-b border-white/5" : ""} hover:bg-white/[0.02] transition-colors duration-300`}
            >
              <div className="p-5 sm:p-6 text-xs sm:text-sm font-semibold text-slate-200 self-center">{r.feature}</div>
              <div className="p-5 sm:p-6 border-l border-white/8 self-center">
                <div className="flex items-start gap-2.5">
                  <X className="w-4 h-4 text-red-400/80 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-dim leading-relaxed">{r.old}</span>
                </div>
              </div>
              <div className="p-5 sm:p-6 border-l border-neon/20 bg-neon/[0.04] self-center">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-mint shrink-0 mt-0.5" strokeWidth={3} />
                  <span className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">{r.ai}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.25}>
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          {[
            { v: "-98%", l: "tasso di no-show con caparra" },
            { v: "+40%", l: "prenotazioni recuperate fuori orario" },
            { v: "3 sec", l: "tempo medio di risposta AI" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-white/8 bg-card2/40 px-6 py-5 flex items-baseline gap-3">
              <span className="font-heading font-extrabold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-teal2 to-neon">{s.v}</span>
              <span className="text-xs text-dim leading-snug">{s.l}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);
