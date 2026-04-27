import { apiFetch } from "../lib/api";
import { Search, Layers, ShieldCheck, CheckCircle, Circle as SoccerBall, ArrowDown } from "lucide-react";
import { Header, Footer } from "../components/Navigation";
import { TurfCard } from "../components/TurfCard";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Turf } from "../mockData";
import { Link } from "react-router-dom";

export default function Home() {
  const [turfs, setTurfs] = useState<Turf[]>([]);

  useEffect(() => {
    // Only seed if database is empty or explicitly requested
    const checkAndSeed = async () => {
      const res = await apiFetch("/api/turfs");
      const data = await res.json();
      if (data.length === 0) {
        await apiFetch("/api/seed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force: false })
        });
        const freshRes = await apiFetch("/api/turfs");
        const freshData = await freshRes.json();
        setTurfs(freshData.slice(0, 4));
      } else {
        setTurfs(data.slice(0, 4));
      }
    };

    checkAndSeed();
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="pt-20">
        {/* Editorial Hero Section */}
        <section className="relative min-h-[550px] md:min-h-[650px] lg:h-[750px] flex items-center pt-8 md:pt-12 pb-16 md:pb-20 px-6 overflow-hidden bg-background">
          <div className="absolute top-0 right-0 w-[50%] h-full bg-primary/5 rounded-l-[100px] -z-10 hidden lg:block"></div>

          <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
            <div className="lg:col-span-7 z-10 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest mb-6 md:mb-8 mx-auto lg:mx-0"
              >
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                Solapur's #1 Turf Booking App
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-4xl md:text-7xl lg:text-8xl font-serif text-on-background leading-[1.1] md:leading-[1] tracking-tighter mb-6 md:mb-8">
                  Your next match
                  <span className="italic text-primary"> starts here.</span>
                </h1>
                <p className="text-sm md:text-xl text-secondary max-w-xl font-medium leading-relaxed opacity-80 mb-8 md:mb-12 mx-auto lg:mx-0">
                  Stop wasting your warm-up time on phone calls. Book a football pitch or box cricket arena in Solapur in under 60 seconds — right now.
                </p>
              </motion.div>

              {/* Clean CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center gap-4 mt-4 lg:mt-0"
              >
                <button
                  onClick={() => document.getElementById('turfs-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto bg-primary text-white py-4 px-10 rounded-2xl hover:brightness-110 transition-all font-bold text-sm tracking-widest uppercase shadow-xl shadow-primary/20"
                >
                  See Available Slots
                </button>
                <button
                  onClick={() => document.getElementById('how-to-use')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto bg-white text-on-background py-4 px-10 rounded-2xl border border-surface-container hover:bg-surface-container/10 transition-all font-bold text-sm tracking-widest uppercase"
                >
                  Learn More
                </button>
              </motion.div>
            </div>

            <div className="lg:col-span-5 relative order-first lg:order-last">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative max-w-[320px] md:max-w-none mx-auto"
              >
                <div className="aspect-[4/5] w-full bg-surface-container rounded-[40px] md:rounded-[60px] lg:rounded-[120px] overflow-hidden border-4 md:border-8 border-white shadow-xl md:shadow-2xl">
                  <img
                    className="w-full h-full object-cover"
                    src="/images/turf-night.jpg"
                    alt="Match Point Turf Night View"
                    fetchPriority="high"
                    decoding="async"
                  />
                </div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-4 md:-bottom-6 -right-4 md:-right-6 bg-white p-3 md:p-5 rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl border border-surface-container flex items-center gap-3 md:gap-4"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center text-white">
                    <SoccerBall className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-bold text-on-background">Live Status</p>
                    <p className="text-[8px] md:text-[10px] text-green-600 font-bold uppercase tracking-tight">1 Court Available</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Centralized Scroll Trigger */}
          <motion.button
            onClick={() => document.getElementById('how-to-use')?.scrollIntoView({ behavior: 'smooth' })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 group cursor-pointer"
          >
            <span className="text-[10px] font-black text-secondary/40 uppercase tracking-[0.3em]">Discover venues below</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="w-6 h-6 text-primary" />
            </motion.div>
          </motion.button>
        </section>

        {/* How to Use Section: The Playbook */}
        <section id="how-to-use" className="bg-surface-container/30 py-24 scroll-mt-20">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-serif text-on-background mb-4">How it works</h2>
              <p className="text-secondary font-medium opacity-80">Getting on the turf should feel easy. Here's all it takes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 text-center">
              {
                [
                  {
                    step: "01",
                    title: "Find Your Venue",
                    desc: "Browse verified turfs near you in Solapur. Filter by sport, location, and the time that works for your squad.",
                    icon: Search
                  },
                  {
                    step: "02",
                    title: "Grab Your Slot",
                    desc: "Check live availability and pick your hour. No waiting, no calls — just tap and lock in your time.",
                    icon: Layers
                  },
                  {
                    step: "03",
                    title: "Show Up & Play",
                    desc: "Pay securely, get your confirmation instantly, and receive a reminder 1 hour before kick-off. That's it!",
                    icon: CheckCircle
                  }
                ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative group"
                >
                  <div className="bg-white p-8 md:p-10 rounded-[32px] md:rounded-[48px] border border-surface-container shadow-sm group-hover:shadow-xl transition-all h-full">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-primary/10 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 group-hover:bg-primary transition-colors group-hover:rotate-6">
                      <item.icon className="w-6 h-6 md:w-8 md:h-8 text-primary group-hover:text-white transition-colors" />
                    </div>
                    <span className="block text-accent font-black text-[10px] md:text-xs tracking-widest mb-3 md:mb-4">STEP {item.step}</span>
                    <h3 className="text-xl md:text-2xl font-serif text-on-background mb-3 md:mb-4">{item.title}</h3>
                    <p className="text-secondary text-xs md:text-sm leading-relaxed font-medium opacity-70">{item.desc}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden lg:block absolute top-1/2 -right-6 -translate-y-1/2 z-10">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary/20 rotate-0">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <div className="max-w-[1280px] mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-surface-container rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-sm">
            {[
              { icon: Layers, text: "Live Slot Availability" },
              { icon: ShieldCheck, text: "100% Secure Payments" },
              { icon: CheckCircle, text: "Verified Turf Partners" }
            ].map((item, i) => (
              <div key={i} className={`flex flex-col items-center justify-center gap-4 p-10 bg-white hover:bg-surface-container/10 transition-colors group ${i !== 2 ? 'border-b md:border-b-0 md:border-r border-surface-container' : ''}`}>
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <item.icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-serif text-lg md:text-xl text-on-background text-center">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <section id="turfs-section" className="max-w-[1280px] mx-auto px-6 py-20 md:py-32 scroll-mt-20">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-8 border-b border-surface-container/50 pb-10">
            <div className="max-w-2xl relative">
              <div className="absolute -left-6 top-0 w-1 h-full bg-primary rounded-r-full hidden md:block"></div>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif text-on-background mb-4 leading-tight tracking-tight">
                Places worth
                <br />playing at
              </h2>
              <p className="text-secondary text-lg md:text-xl font-light opacity-80 italic">
                Picked by real players, rated honestly
              </p>
            </div>
            <button className="flex items-center gap-4 px-8 py-4 rounded-full border border-surface-container hover:border-primary hover:bg-primary/5 transition-all group font-bold tracking-widest uppercase text-xs md:text-sm text-on-background">
              Explore All
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="text-lg leading-none group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {turfs.map(turf => (
              <div key={turf._id || turf.id}>
                <TurfCard turf={turf} />
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-[1280px] mx-auto px-6 py-20 md:py-32 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[40px] md:rounded-[60px] overflow-hidden border border-surface-container shadow-2xl relative group bg-white">
            <div className="p-10 md:p-20 flex flex-col justify-center z-10 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10 transition-transform duration-700 group-hover:scale-150"></div>

              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="inline-block px-5 py-2 bg-primary/10 text-primary font-black uppercase tracking-[0.2em] text-[10px] md:text-xs rounded-full w-fit mb-8"
              >
                Partner with us
              </motion.span>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6 text-on-background leading-[1.1] tracking-tight">
                Host your turf and join our community.
              </h2>

              <p className="text-lg md:text-xl text-secondary mb-12 font-light leading-relaxed max-w-md border-l-4 border-primary/20 pl-6">
                Own a turf in Solapur? List it for free and start getting bookings from local players today. We handle payments, scheduling, and everything in between — you just open the gates.
              </p>

              <Link to="/admin/register" className="flex items-center gap-4 bg-on-background text-white px-8 py-5 rounded-full font-bold w-fit hover:bg-primary transition-colors duration-300 shadow-xl shadow-on-background/10 group/btn">
                List My Turf — It's Free
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover/btn:translate-x-2 transition-transform">
                  <span className="text-white leading-none">→</span>
                </div>
              </Link>
            </div>

            <div className="relative h-[400px] lg:h-auto overflow-hidden pointer-events-none">
              <iframe
                className="absolute top-1/2 left-1/2 w-[300%] h-[300%] lg:w-[150%] lg:h-[150%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-1000 group-hover:scale-105"
                src="https://www.youtube.com/embed/aTTOQtSOX3I?autoplay=1&mute=1&loop=1&playlist=aTTOQtSOX3I&controls=0&showinfo=0&rel=0&playsinline=1&modestbranding=1"
                title="Turf host video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
