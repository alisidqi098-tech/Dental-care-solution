import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { Comparison } from "@/components/Comparison";
import { Trust } from "@/components/Trust";
import { BookingForm } from "@/components/BookingForm";
import { Footer } from "@/components/Footer";
import Admin from "@/pages/Admin";
import ThankYou from "@/pages/ThankYou";

const Home = () => {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.25, smoothWheel: true });
    window.__lenis = lenis;
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);

  return (
    <div className="bg-ink text-slate-50 min-h-screen" data-testid="landing-page">
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Problem />
        <Solution />
        <Comparison />
        <Trust />
        <BookingForm />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/grazie" element={<ThankYou />} />
        </Routes>
      </BrowserRouter>
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: "#111827", border: "1px solid rgba(0,242,254,0.25)", color: "#f8fafc" } }} />
    </div>
  );
}

export default App;
