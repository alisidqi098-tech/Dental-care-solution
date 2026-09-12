import { Lock, CreditCard, Puzzle, Wrench, Quote } from "lucide-react";
import { Reveal, ChapterTag } from "./Reveal";

const trust = [
  { icon: Lock, title: "Privacy conforme", text: "Conforme alle normative privacy e al GDPR. Dati dei pazienti protetti su infrastruttura europea." },
  { icon: CreditCard, title: "Pagamenti garantiti", text: "Pagamenti sicuri garantiti dall'infrastruttura Stripe, lo standard bancario mondiale." },
  { icon: Puzzle, title: "Integrazione invisibile", text: "Si integra senza stravolgere i tuoi attuali computer e il tuo gestionale. Niente da reinstallare." },
  { icon: Wrench, title: "Attivo in 48 ore", text: "Configurazione assistita dal nostro team. Lo studio non si ferma mai, nemmeno un minuto." },
];

const quotes = [
  {
    text: "In 60 giorni abbiamo azzerato le poltrone vuote del sabato. L'AI gestisce le urgenze del weekend e incassa le caparre senza che muoviamo un dito.",
    author: "Dr. Marco Bellini",
    role: "Direttore Sanitario · Centro Odontoiatrico Bellini, Milano",
    metric: "+\u20AC18.400 recuperati",
  },
  {
    text: "La mia segreteria era stremata dalle telefonate per spostare appuntamenti. Ora i pazienti fanno tutto da soli su WhatsApp in 30 secondi.",
    author: "Dr.ssa Elena Rossi",
    role: "Titolare · Studio Dentistico Rossi & Partners, Bologna",
    metric: "-92% telefonate di routine",
  },
];

export const Trust = () => (
  <section id="garanzia" className="relative py-28 lg:py-36 bg-panel/40 border-y border-white/5 noise" data-testid="trust-section">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <Reveal>
        <ChapterTag number="04" label="Affidabilit\u00E0" />
        <h2 className="font-heading font-bold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-slate-50 max-w-3xl leading-[1.1]">
          Sicuro per i pazienti.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal2 to-neon">Invisibile per lo studio.</span>
        </h2>
      </Reveal>

      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {trust.map((t, i) => (
          <Reveal key={t.title} delay={i * 0.1}>
            <div data-testid={`trust-card-${i + 1}`} className="h-full rounded-2xl glass p-6 hover:border-neon/25 transition-colors duration-500">
              <div className="w-10 h-10 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center mb-5">
                <t.icon className="w-4.5 h-4.5 text-neon" strokeWidth={2.2} />
              </div>
              <h3 className="font-heading font-semibold text-lg text-slate-50 mb-2">{t.title}</h3>
              <p className="text-sm text-mist leading-relaxed">{t.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-16 grid md:grid-cols-2 gap-6">
        {quotes.map((q, i) => (
          <Reveal key={q.author} delay={i * 0.15}>
            <figure data-testid={`testimonial-${i + 1}`} className="relative h-full rounded-2xl glass p-8 overflow-hidden">
              <Quote className="absolute top-6 right-6 w-10 h-10 text-neon/10" />
              <blockquote className="text-base sm:text-lg text-slate-200 leading-relaxed mb-7">"{q.text}"</blockquote>
              <figcaption className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-heading font-semibold text-slate-50">{q.author}</p>
                  <p className="text-xs text-dim mt-1">{q.role}</p>
                </div>
                <span className="font-mono2 text-[10px] uppercase tracking-[0.18em] text-mint border border-mint/25 bg-mint/5 rounded-full px-3 py-1.5">
                  {q.metric}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
