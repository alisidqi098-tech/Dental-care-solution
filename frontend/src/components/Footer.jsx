import { Sparkles } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-white/5 bg-panel/60 py-12" data-testid="footer">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal2 to-neon flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-ink" strokeWidth={2.4} />
        </div>
        <div className="leading-none">
          <span className="font-heading font-bold text-sm text-slate-50 block">
            Digital Care <span className="text-neon">AI</span>
          </span>
          <span className="font-mono2 text-[9px] uppercase tracking-[0.28em] text-dim">Solution</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-dim text-center">
          © {new Date().getFullYear()} Digital Care AI · Pagamenti sicuri via Stripe · GDPR Compliant
        </p>
        <a href="/admin" data-testid="footer-admin-link" className="font-mono2 text-[10px] uppercase tracking-[0.2em] text-dim/60 hover:text-neon transition-colors">
          Area Riservata
        </a>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
        <span className="font-mono2 text-[10px] uppercase tracking-widest text-mist">Assistente attivo 24/7</span>
      </div>
    </div>
  </footer>
);
