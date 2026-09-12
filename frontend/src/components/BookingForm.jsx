import { useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, CheckCircle2, Loader2, Video } from "lucide-react";
import { toast } from "sonner";
import { Reveal, ChapterTag } from "./Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SLOTS = ["09:00", "09:30", "11:00", "12:30", "15:00", "15:30", "17:00", "18:30"];
const CHAIRS = ["1-2 poltrone", "3-4 poltrone", "5-8 poltrone", "Oltre 8 poltrone"];

const fmtDay = (d) => d.toLocaleDateString("it-IT", { weekday: "short" });
const fmtNum = (d) => d.toLocaleDateString("it-IT", { day: "numeric" });
const fmtMonth = (d) => d.toLocaleDateString("it-IT", { month: "short" });
const fmtFull = (d) => d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

export const BookingForm = () => {
  const days = useMemo(() => {
    const out = [];
    const d = new Date();
    while (out.length < 12) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0) out.push(new Date(d));
    }
    return out;
  }, []);

  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ name: "", clinic: "", email: "", phone: "", chairs: CHAIRS[0], notes: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!date || !slot) return toast.error("Seleziona una data e un orario per la demo.");
    if (!form.name || !form.clinic || !form.email || !form.phone)
      return toast.error("Compila nome, studio, email e telefono.");
    setBusy(true);
    try {
      const payload = {
        ...form,
        date: date.toISOString().slice(0, 10),
        time_slot: slot,
      };
      const { data } = await axios.post(`${API}/demo-booking`, payload);
      setDone({ ...payload, id: data.id });
    } catch (err) {
      toast.error("Qualcosa \u00E8 andato storto. Riprova tra un attimo.");
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-xl bg-card2/60 border border-white/10 px-4 py-3 text-sm text-slate-100 placeholder:text-dim outline-none focus:border-neon/50 focus:ring-2 focus:ring-neon/15 transition-all duration-300";

  return (
    <section id="booking" className="relative py-28 lg:py-36 noise overflow-hidden" data-testid="booking-section">
      <div className="absolute -bottom-52 left-1/2 -translate-x-1/2 w-[1000px] h-[560px] rounded-full bg-teal2/12 blur-[150px] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-[1fr_1.15fr] gap-16 items-start">
        <Reveal>
          <ChapterTag number="05" label="La Tua Mossa" />
          <h2 className="font-heading font-bold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-slate-50 leading-[1.1]">
            Non credere alle nostre parole.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal2 to-neon">Guarda il sistema in azione.</span>
          </h2>
          <p className="mt-6 text-base sm:text-lg text-mist leading-relaxed max-w-lg">
            Scegli un orario nel calendario qui accanto. In una rapida videochiamata di 15 minuti ti mostreremo
            una simulazione in diretta sul tuo telefono. Nessun impegno, solo automazione pura.
          </p>
          <div className="mt-10 space-y-4">
            {[
              { icon: Video, t: "Demo live sul tuo WhatsApp, non slide" },
              { icon: Clock, t: "15 minuti, zero giri di parole" },
              { icon: CheckCircle2, t: "Nessun impegno e nessun pagamento richiesto" },
            ].map((r) => (
              <div key={r.t} className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center shrink-0">
                  <r.icon className="w-4 h-4 text-neon" />
                </div>
                <span className="text-sm text-slate-300">{r.t}</span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="rounded-3xl glass glow-cyan p-6 sm:p-9" data-testid="booking-calendar">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="text-center py-12"
                  data-testid="booking-success-message"
                >
                  <div className="mx-auto w-16 h-16 rounded-full bg-mint/15 border border-mint/30 flex items-center justify-center mb-6 glow-cyan">
                    <CheckCircle2 className="w-8 h-8 text-mint" />
                  </div>
                  <h3 className="font-heading font-bold text-2xl text-slate-50 mb-3">Demo prenotata.</h3>
                  <p className="text-mist text-sm max-w-sm mx-auto leading-relaxed">
                    Ti aspettiamo {fmtFull(new Date(done.date))} alle {done.time_slot}. Riceverai il link della
                    videochiamata via email e WhatsApp.
                  </p>
                  <div className="mt-7 inline-flex items-center gap-3 rounded-full bg-neon/5 border border-neon/25 px-5 py-2.5">
                    <CalendarDays className="w-4 h-4 text-neon" />
                    <span className="font-mono2 text-xs text-neon">
                      {new Date(done.date).toLocaleDateString("it-IT")} · {done.time_slot} · {done.clinic}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} exit={{ opacity: 0, scale: 0.97 }} className="space-y-7">
                  <div>
                    <p className="font-mono2 text-[10px] uppercase tracking-[0.25em] text-dim mb-4 flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-neon" /> 1 · Scegli il giorno
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {days.map((d) => {
                        const active = date && d.toDateString() === date.toDateString();
                        return (
                          <button
                            type="button"
                            key={d.toISOString()}
                            data-testid="booking-day-btn"
                            onClick={() => setDate(d)}
                            className={`rounded-xl border py-2.5 px-1 text-center transition-all duration-300 ${
                              active
                                ? "bg-gradient-to-b from-teal2 to-neon border-transparent text-ink glow-cyan"
                                : "border-white/10 bg-card2/50 text-mist hover:border-neon/40 hover:text-slate-100"
                            }`}
                          >
                            <span className={`block text-[9px] uppercase tracking-wider ${active ? "text-ink/70" : "text-dim"}`}>{fmtDay(d)}</span>
                            <span className="block font-heading font-bold text-lg leading-tight">{fmtNum(d)}</span>
                            <span className={`block text-[9px] uppercase ${active ? "text-ink/70" : "text-dim"}`}>{fmtMonth(d)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="font-mono2 text-[10px] uppercase tracking-[0.25em] text-dim mb-4 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-neon" /> 2 · Scegli l'orario
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {SLOTS.map((s) => (
                        <button
                          type="button"
                          key={s}
                          data-testid="booking-time-slot-btn"
                          onClick={() => setSlot(s)}
                          className={`rounded-lg border py-2.5 font-mono2 text-sm transition-all duration-300 ${
                            slot === s
                              ? "bg-gradient-to-b from-teal2 to-neon border-transparent text-ink font-semibold glow-cyan"
                              : "border-white/10 bg-card2/50 text-mist hover:border-neon/40 hover:text-slate-100"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-mono2 text-[10px] uppercase tracking-[0.25em] text-dim mb-4">3 · I tuoi dati</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input data-testid="booking-input-name" className={inputCls} placeholder="Nome e Cognome *" value={form.name} onChange={set("name")} />
                      <input data-testid="booking-input-clinic" className={inputCls} placeholder="Nome dello Studio *" value={form.clinic} onChange={set("clinic")} />
                      <input data-testid="booking-input-email" type="email" className={inputCls} placeholder="Email professionale *" value={form.email} onChange={set("email")} />
                      <input data-testid="booking-input-phone" className={inputCls} placeholder="Telefono WhatsApp *" value={form.phone} onChange={set("phone")} />
                      <select data-testid="booking-select-chairs" className={`${inputCls} sm:col-span-2 appearance-none cursor-pointer`} value={form.chairs} onChange={set("chairs")}>
                        {CHAIRS.map((c) => (
                          <option key={c} value={c} className="bg-panel">{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    data-testid="booking-submit-button"
                    className="w-full flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-teal2 to-neon py-4 font-heading font-bold text-ink text-base transition-transform duration-300 hover:scale-[1.02] glow-cyan-strong disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                    {busy ? "Prenotazione in corso..." : `Blocca la mia Demo${date && slot ? ` · ${fmtNum(date)} ${fmtMonth(date)} ${slot}` : ""}`}
                  </button>
                  <p className="text-center text-[11px] text-dim">Nessun impegno. Nessun dato ceduto a terzi. Solo 15 minuti di automazione pura.</p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
