import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CheckCheck, CreditCard, ShieldCheck } from "lucide-react";

const script = [
  { from: "patient", text: "Buonasera, ho un mal di denti fortissimo. Avete posto domani?" },
  { from: "ai", text: "Buonasera Luca, mi dispiace per il dolore. Ho verificato l'agenda del Dr. Bellini: domani ho uno slot urgente alle 09:30. Lo blocco per lei?" },
  { from: "patient", text: "Perfetto, confermo le 09:30." },
  { from: "ai", text: "Per confermare la visita urgente le invio il link sicuro per la caparra di 30\u20AC. Ci vogliono 20 secondi.", payment: true },
  { from: "patient", text: "Fatto, pagato!" },
  { from: "ai", text: "Caparra incassata. Appuntamento confermato domani alle 09:30. Ho gi\u00E0 sincronizzato tutto sul gestionale dello studio. A domani, Luca!", done: true },
];

const TypingDots = () => (
  <div className="flex gap-1 px-3 py-2">
    {[0, 1, 2].map((i) => (
      <span key={i} className="typing-dot w-1.5 h-1.5 rounded-full bg-mist" />
    ))}
  </div>
);

export const WhatsAppMock = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const t = setTimeout(
      () => setCount((c) => (c >= script.length ? 0 : c + 1)),
      count >= script.length ? 7000 : 1900
    );
    return () => clearTimeout(t);
  }, [count]);

  return (
    <div
      data-testid="hero-mockup-whatsapp"
      className="relative w-[300px] sm:w-[320px] rounded-[2.2rem] border border-white/10 bg-[#0a0f1a] p-2.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]"
    >
      <div className="rounded-[1.8rem] overflow-hidden bg-[#0b141a]">
        <div className="flex items-center gap-3 bg-[#111b21] px-4 py-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal2 to-neon flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-ink" strokeWidth={2.4} />
          </div>
          <div className="flex-1 leading-tight">
            <p className="text-[13px] font-semibold text-slate-100">Studio Dentistico Bellini</p>
            <p className="text-[10px] text-neon font-mono2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-mint inline-block animate-pulse" />
              Assistente AI · online
            </p>
          </div>
        </div>

        <div className="h-[380px] px-3 py-4 flex flex-col gap-2.5 overflow-hidden">
          <AnimatePresence>
            {script.slice(0, count).map((m, i) => (
              <motion.div
                key={`${i}-${count >= script.length ? "loop" : "run"}`}
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-snug ${
                  m.from === "patient"
                    ? "self-end bg-[#005c4b] text-emerald-50 rounded-br-sm"
                    : "self-start bg-[#1f2c34] text-slate-200 rounded-bl-sm"
                }`}
              >
                <p>{m.text}</p>
                {m.payment && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-black/30 border border-neon/20 px-2.5 py-2">
                    <CreditCard className="w-3.5 h-3.5 text-neon" />
                    <span className="font-mono2 text-[10px] text-neon">stripe.com/pay · 30,00 \u20AC</span>
                  </div>
                )}
                <div className="flex justify-end items-center gap-1 mt-1 opacity-60">
                  <span className="text-[9px] font-mono2">
                    {m.from === "ai" ? "AI · ora" : "ora"}
                  </span>
                  {m.from === "patient" ? (
                    <CheckCheck className="w-3 h-3 text-sky-300" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {count > 0 && count < script.length && script[count].from === "ai" && (
            <div className="self-start bg-[#1f2c34] rounded-2xl rounded-bl-sm">
              <TypingDots />
            </div>
          )}
          {count >= script.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="self-center mt-1 flex items-center gap-2 rounded-full bg-mint/10 border border-mint/30 px-3.5 py-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-mint" />
              <span className="text-[10px] font-mono2 text-mint uppercase tracking-wider">
                Appuntamento confermato · No-show azzerato
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
