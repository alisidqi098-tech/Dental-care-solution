const items = [
  "Compatibile con OrisLine",
  "Integrazione XDENT",
  "Pagamenti sicuri Stripe",
  "GDPR Compliant 100%",
  "Risposta automatica in 3 secondi",
  "Zero costi di installazione",
  "Agenda sincronizzata in tempo reale",
  "Caparra antiritiro automatica",
];

export const Marquee = () => (
  <div className="relative border-y border-white/5 bg-panel/60 py-6 overflow-hidden" data-testid="editorial-marquee">
    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-ink to-transparent z-10" />
    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-ink to-transparent z-10" />
    <div className="flex w-max animate-marquee">
      {[...items, ...items].map((item, i) => (
        <div key={i} className="flex items-center gap-8 pr-8">
          <span className="font-heading font-semibold uppercase tracking-[0.22em] text-sm text-dim whitespace-nowrap">
            {item}
          </span>
          <span className="w-1.5 h-1.5 rotate-45 bg-neon/60 shrink-0" />
        </div>
      ))}
    </div>
  </div>
);
