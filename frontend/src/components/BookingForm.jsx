import { useMemo, useRef, useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, CheckCircle2, Loader2, Video, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { toast } from "sonner";
import { Reveal, ChapterTag } from "./Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DEFAULT_SLOTS = ["09:00", "09:30", "11:00", "12:30", "15:00", "15:30", "17:00", "18:30", "19:30"];
const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5, 6];
const CHAIRS = ["1-2 poltrone", "3-4 poltrone", "5-8 poltrone", "Oltre 8 poltrone"];

const fmtDay = (d) => d.toLocaleDateString("it-IT", { weekday: "short" });
const fmtNum = (d) => d.toLocaleDateString("it-IT", { day: "numeric" });
const fmtMonth = (d) => d.toLocaleDateString("it-IT", { month: "short" });
const fmtISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const BookingForm = () => {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState({ weekdays: DEFAULT_WEEKDAYS, slots: DEFAULT_SLOTS });
  const [demoCount, setDemoCount] = useState(0);

  useEffect(() => {
    axios.get(`${API}/schedule`).then(({ data }) => setSchedule(data)).catch(() => {});
    axios.get(`${API}/demo-bookings/count`).then(({ data }) => setDemoCount(data.count || 0)).catch(() => {});
  }, []);

  const days = useMemo(() => {
    const out = [];
    const d = new Date();
    while (out.length < 30) {
      d.setDate(d.getDate() + 1);
      if (schedule.weekdays.includes(d.getDay())) out.push(new Date(d));
    }
    return out;
  }, [schedule]);

  const stripRef = useRef(null);
  const scrollStrip = (dir) =>
    stripRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ name: "", clinic: "", email: "", phone: "", chairs: CHAIRS[0], notes: "" });
  const [busy, setBusy] = useState(false);
  const [busySlots, setBusySlots] = useState([]);

  useEffect(() => {
    if (!date) return;
    setSlot(null);
    axios
      .get(`${API}/demo-bookings/busy`, { params: { date: fmtISO(date) } })
      .then(({ data }) => setBusySlots(data.busy || []))
      .catch(() => setBusySlots([]));
  }, [date]);

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
        date: fmtISO(date),
        time_slot: slot,
      };
      await axios.post(`${API}/demo-booking`, payload);
      navigate("/grazie", { state: payload });
    } catch (err) {
      toast.error("Qualcosa è andato storto. Riprova tra un attimo.");
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-xl bg-card2/60 border border-white/10 px-4 py-3 text-sm text-slate-100 placeholder:text-dim outline-none focus:border-neon/50 focus:ring-2 focus:ring-neon/15 transition-all duration-300";

  return (
    <section id="booking" className="relative py-28 lg:py-36 noise overflow-hidden" data-testid="booking-section">
      <div className="absolute -bottom-52 left-1/2 -translate-x-1/2 w-[1000px] h-[560px] rounded-full bg-teal2/12 blur-[150px] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-[0.85fr_1.3fr] gap-16 items-start">
        <Reveal className="min-w-0">
          <ChapterTag number="05" label="La Tua Mossa" />
          <h2 className="font-heading font-bold tracking-tight text-3xl sm:text-4xl lg:text-5xl text-slate-50 leading-[1.1]">
            Non ti convince ancora?{" "}
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
          {demoCount > 0 && (
            <div
              data-testid="booking-social-proof"
              className="mt-9 inline-flex items-center gap-3 rounded-full border border-mint/25 bg-mint/5 px-5 py-2.5"
            >
              <Users className="w-4 h-4 text-mint" />
              <span className="text-sm text-slate-200">
                <strong className="font-heading text-mint">{demoCount}</strong>{" "}
                {demoCount === 1 ? "studio ha già prenotato" : "studi hanno già prenotato"} la demo
              </span>
            </div>
          )}
        </Reveal>

        <Reveal delay={0.15} className="min-w-0">
          <div className="rounded-3xl glass glow-cyan p-6 sm:p-9 overflow-hidden" data-testid="booking-calendar">
            <motion.form
              onSubmit={submit}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-7"
            >
              <div>
                <p className="font-mono2 text-[10px] uppercase tracking-[0.25em] text-dim mb-4 flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-neon" /> 1 · Scegli il giorno
                </p>
                <div className="relative group/strip">
                  <button
                    type="button"
                    data-testid="booking-days-prev"
                    onClick={() => scrollStrip(-1)}
                    aria-label="Giorni precedenti"
                    className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full glass border border-white/15 flex items-center justify-center text-mist hover:text-neon hover:border-neon/40 transition-colors duration-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div
                    ref={stripRef}
                    className="flex gap-2 overflow-x-auto px-7 pb-1 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {days.map((d) => {
                      const active = date && d.toDateString() === date.toDateString();
                      return (
                        <button
                          type="button"
                          key={d.toISOString()}
                          data-testid="booking-day-btn"
                          onClick={() => setDate(d)}
                          className={`shrink-0 w-[76px] rounded-xl border py-2.5 px-1 text-center transition-all duration-300 ${
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
                  <button
                    type="button"
                    data-testid="booking-days-next"
                    onClick={() => scrollStrip(1)}
                    aria-label="Giorni successivi"
                    className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full glass border border-white/15 flex items-center justify-center text-mist hover:text-neon hover:border-neon/40 transition-colors duration-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="font-mono2 text-[10px] uppercase tracking-[0.25em] text-dim mb-4 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-neon" /> 2 · Scegli l'orario
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {schedule.slots.map((s) => {
                    const taken = busySlots.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        data-testid="booking-time-slot-btn"
                        disabled={taken}
                        title={taken ? "Orario già prenotato" : undefined}
                        onClick={() => setSlot(s)}
                        className={`rounded-lg border py-2.5 font-mono2 text-sm transition-all duration-300 ${
                          taken
                            ? "border-white/5 bg-card2/30 text-dim/50 line-through cursor-not-allowed"
                            : slot === s
                              ? "bg-gradient-to-b from-teal2 to-neon border-transparent text-ink font-semibold glow-cyan"
                              : "border-white/10 bg-card2/50 text-mist hover:border-neon/40 hover:text-slate-100"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
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
          </div>
        </Reveal>
      </div>
    </section>
  );
};
