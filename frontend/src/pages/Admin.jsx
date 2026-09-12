import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, LogOut, ShieldCheck, RefreshCw,
  CalendarDays, Building2, Phone, Mail, Armchair,
  Clock, CheckCircle2, XCircle,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
axios.defaults.withCredentials = true;

const STATUS = {
  da_fare: { label: "Da fare", icon: Clock, cls: "text-neon border-neon/30 bg-neon/5" },
  fatta: { label: "Fatta", icon: CheckCircle2, cls: "text-mint border-mint/30 bg-mint/5" },
  annullata: { label: "Annullata", icon: XCircle, cls: "text-red-400 border-red-400/30 bg-red-400/5" },
};

const FILTERS = [
  { id: "tutte", label: "Tutte" },
  { id: "da_fare", label: "Da fare" },
  { id: "fatta", label: "Fatte" },
  { id: "annullata", label: "Annullate" },
];

function formatApiErrorDetail(detail) {
  if (detail == null) return "Qualcosa è andato storto. Riprova.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

const inputCls =
  "w-full rounded-xl bg-card2/60 border border-white/10 px-4 py-3 text-sm text-slate-100 placeholder:text-dim outline-none focus:border-neon/50 focus:ring-2 focus:ring-neon/15 transition-all duration-300";

export default function Admin() {
  const [user, setUser] = useState(null); // null = checking, false = logged out
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [filter, setFilter] = useState("tutte");

  const authedGet = useCallback(async (path) => {
    try {
      return await axios.get(`${API}${path}`);
    } catch (e) {
      if (e.response?.status === 401) {
        await axios.post(`${API}/auth/refresh`);
        return await axios.get(`${API}${path}`);
      }
      throw e;
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data } = await authedGet("/demo-bookings");
      setBookings(data);
    } finally {
      setLoadingList(false);
    }
  }, [authedGet]);

  const updateStatus = async (id, status) => {
    try {
      try {
        await axios.patch(`${API}/demo-bookings/${id}/status`, { status });
      } catch (e) {
        if (e.response?.status === 401) {
          await axios.post(`${API}/auth/refresh`);
          await axios.patch(`${API}/demo-bookings/${id}/status`, { status });
        } else {
          throw e;
        }
      }
      setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));
      toast.success(`Demo segnata come "${STATUS[status].label}"`);
    } catch {
      toast.error("Aggiornamento dello stato non riuscito");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await authedGet("/auth/me");
        setUser(data);
        await loadBookings();
      } catch {
        setUser(false);
      }
    })();
  }, [authedGet, loadBookings]);

  const login = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/auth/login`, { email, password });
      setUser(data);
      await loadBookings();
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`);
    setUser(false);
    setBookings([]);
  };

  if (user === null) {
    return (
      <div className="min-h-screen bg-ink grid-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon animate-spin" />
      </div>
    );
  }

  if (user === false) {
    return (
      <div className="min-h-screen bg-ink grid-bg noise relative flex items-center justify-center px-6" data-testid="admin-login-page">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-teal2/12 blur-[120px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md rounded-3xl glass glow-cyan p-8 sm:p-10"
        >
          <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/25 flex items-center justify-center mb-6">
            <ShieldCheck className="w-6 h-6 text-neon" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-slate-50 mb-2">Area Riservata</h1>
          <p className="text-sm text-mist mb-8">Archivio delle demo prenotate. Accesso riservato al team DigitalCareAI.</p>
          <form onSubmit={login} className="space-y-4" data-testid="admin-login-form">
            <input
              data-testid="admin-login-email-input"
              type="email"
              required
              className={inputCls}
              placeholder="Email amministratore"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              data-testid="admin-login-password-input"
              type="password"
              required
              className={inputCls}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p data-testid="admin-login-error" className="text-sm text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={busy}
              data-testid="admin-login-submit-button"
              className="w-full flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-teal2 to-neon py-3.5 font-heading font-bold text-ink transition-transform duration-300 hover:scale-[1.02] glow-cyan-strong disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <ShieldCheck className="w-4.5 h-4.5" />}
              Accedi all'Archivio
            </button>
          </form>
          <Link to="/" data-testid="admin-back-home-link" className="mt-6 flex items-center justify-center gap-2 text-xs text-dim hover:text-neon transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Torna alla landing
          </Link>
        </motion.div>
      </div>
    );
  }

  const statusOf = (b) => b.status || "da_fare";
  const filtered = bookings.filter((b) => filter === "tutte" || statusOf(b) === filter);
  const todoCount = bookings.filter((b) => statusOf(b) === "da_fare").length;

  return (
    <div className="min-h-screen bg-ink grid-bg noise relative" data-testid="admin-dashboard">
      <header className="border-b border-white/5 glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal2 to-neon flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-ink" strokeWidth={2.4} />
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-slate-50 leading-none">Archivio Prenotazioni</p>
              <p className="font-mono2 text-[9px] uppercase tracking-[0.25em] text-dim mt-1">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              data-testid="admin-refresh-button"
              onClick={loadBookings}
              className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-mist hover:text-neon hover:border-neon/40 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`} />
              Aggiorna
            </button>
            <button
              data-testid="admin-logout-button"
              onClick={logout}
              className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-mist hover:text-red-400 hover:border-red-400/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Esci
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-white/8 bg-card2/40 px-6 py-5">
            <p className="font-heading font-extrabold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-teal2 to-neon" data-testid="admin-stat-total">
              {bookings.length}
            </p>
            <p className="text-xs text-dim mt-1">Demo prenotate totali</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-card2/40 px-6 py-5">
            <p className="font-heading font-extrabold text-3xl text-slate-50" data-testid="admin-stat-upcoming">
              {bookings.filter((b) => new Date(b.date) >= new Date(new Date().toDateString())).length}
            </p>
            <p className="text-xs text-dim mt-1">In programma da oggi in poi</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-card2/40 px-6 py-5">
            <p className="font-heading font-extrabold text-3xl text-slate-50" data-testid="admin-stat-todo">
              {todoCount}
            </p>
            <p className="text-xs text-dim mt-1">Ancora da fare</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6" data-testid="admin-status-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              data-testid={`admin-filter-${f.id}`}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors duration-300 ${
                filter === f.id
                  ? "border-transparent bg-gradient-to-r from-teal2 to-neon text-ink"
                  : "border-white/10 text-mist hover:text-neon hover:border-neon/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl glass overflow-hidden" data-testid="admin-bookings-table">
          <div className="hidden md:grid grid-cols-[100px_60px_1.1fr_1.3fr_110px_150px] gap-4 px-6 py-4 border-b border-white/8 bg-white/[0.03]">
            {["Data demo", "Ora", "Studio", "Contatto", "Poltrone", "Stato"].map((h) => (
              <span key={h} className="font-mono2 text-[10px] uppercase tracking-[0.22em] text-dim">{h}</span>
            ))}
          </div>
          {filtered.length === 0 && !loadingList && (
            <p className="px-6 py-14 text-center text-sm text-dim" data-testid="admin-empty-state">
              {bookings.length === 0
                ? "Nessuna demo prenotata finora. Le nuove richieste appariranno qui in tempo reale."
                : "Nessuna demo con questo stato."}
            </p>
          )}
          {filtered.map((b) => {
            const s = statusOf(b);
            return (
              <div
                key={b.id}
                data-testid="admin-booking-row"
                className={`grid md:grid-cols-[100px_60px_1.1fr_1.3fr_110px_150px] gap-2 md:gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors ${s === "annullata" ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-2 text-sm text-slate-100 font-medium">
                  <CalendarDays className="w-3.5 h-3.5 text-neon md:hidden" />
                  {new Date(`${b.date}T00:00:00`).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
                <div className="font-mono2 text-sm text-neon">{b.time_slot}</div>
                <div className="flex items-center gap-2 text-sm text-slate-200 min-w-0">
                  <Building2 className="w-3.5 h-3.5 text-dim shrink-0" />
                  <span className="truncate">{b.clinic}</span>
                </div>
                <div className="text-xs text-mist space-y-1 min-w-0">
                  <p className="text-slate-200 font-medium text-sm truncate">{b.name}</p>
                  <p className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 text-dim shrink-0" />{b.email}</p>
                  <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-dim shrink-0" />{b.phone}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-mist">
                  <Armchair className="w-3.5 h-3.5 text-dim shrink-0" />
                  {b.chairs || "—"}
                </div>
                <div className="flex flex-col gap-1.5" data-testid="admin-status-cell">
                  <span className={`w-fit inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono2 text-[9px] uppercase tracking-wider ${STATUS[s].cls}`}>
                    {STATUS[s].label}
                  </span>
                  <div className="flex gap-1">
                    {Object.entries(STATUS).map(([id, cfg]) => (
                      <button
                        key={id}
                        data-testid={`status-btn-${id}`}
                        title={`Segna come: ${cfg.label}`}
                        onClick={() => updateStatus(b.id, id)}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors duration-200 ${
                          s === id ? cfg.cls : "border-white/10 text-dim hover:text-slate-200 hover:border-white/25"
                        }`}
                      >
                        <cfg.icon className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
