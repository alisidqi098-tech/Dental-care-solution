import { Ear, ShieldCheck, RefreshCw } from "lucide-react";
import { Reveal, ChapterTag } from "./Reveal";

const steps = [
  {
    num: "01",
    icon: Ear,
    title: "Ascolto Attivo",
    text: "Il paziente scrive su WhatsApp. L'AI risponde in modo empatico, comprende l'urgenza (mal di denti, igiene, controllo) e analizza l'agenda in tempo reale.",
    chip: "Risposta in 3 secondi",
  },
  {
    num: "02",
    icon: ShieldCheck,
    title: "Sicurezza Finanziaria",
    text: "L'AI propone il primo slot libero e invia un link sicuro (Stripe) per l'incasso immediato della caparra. Rischio No-Show azzerato.",
    chip: "Caparra via Stripe",
  },
  {
    num: "03",
    icon: RefreshCw,
    title: "Sincronizzazione",
    text: "Appuntamento, dati del paziente e stato del pagamento compaiono istantaneamente sul gestionale dello studio. Zero ri-digitazione.",
    chip: "Gestionale aggiornato",
  },
];

export const Solution = () => (
  <section id="soluzione" className="relative py-28 lg:py-36 bg-panel/40 border-y border-white/5 noise" data-testid="solution-section">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <Reveal>
        <ChapterTag number="02" label="La Soluzione" />
        <h2 className="font-heading font-bold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-slate-50 max-w-3xl leading-[1.1]">
          Un ecosistema autonomo che lavora{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal2 to-neon">mentre il tuo studio \u00E8 chiuso.</span>
        </h2>
      </Reveal>

      <div className="mt-20 relative">
        <div className="hidden lg:block absolute top-[52px] left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-neon/30 to-transparent" />
        <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.18}>
              <div data-testid={`solution-step-${i + 1}`} className="relative group">
                <div className="flex items-center gap-5 mb-7">
                  <div className="relative w-[104px] h-[104px] rounded-2xl glass flex items-center justify-center group-hover:glow-cyan group-hover:border-neon/30 transition-all duration-500">
                    <s.icon className="w-8 h-8 text-neon" strokeWidth={1.8} />
                    <span className="absolute -top-3 -right-3 font-mono2 text-[10px] font-medium text-ink bg-gradient-to-r from-teal2 to-neon rounded-full px-2.5 py-1">
                      {s.num}
                    </span>
                  </div>
                  <span className="font-heading font-extrabold text-6xl text-white/[0.05] select-none hidden xl:block">{s.num}</span>
                </div>
                <h3 className="font-heading font-semibold text-2xl text-slate-50 mb-4">{s.title}</h3>
                <p className="text-sm sm:text-base text-mist leading-relaxed mb-5">{s.text}</p>
                <span className="inline-block font-mono2 text-[10px] uppercase tracking-[0.2em] text-neon border border-neon/25 bg-neon/5 rounded-full px-3.5 py-1.5">
                  {s.chip}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);
