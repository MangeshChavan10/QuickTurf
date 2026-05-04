import { Header, Footer } from "../components/Navigation";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Circle as SoccerBall, Heart, Users, Target, ShieldCheck, Github, Mail, ArrowRight } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Heart,
      title: "We Love the Game",
      description: "QuickTurf was built by people who actually play. We know the frustration of a cancelled booking or a flooded pitch — we've lived it."
    },
    {
      icon: Users,
      title: "Community First",
      description: "We're not just a booking app. We're building a local sports network in Solapur where players and turf owners both win."
    },
    {
      icon: Target,
      title: "No Nonsense Booking",
      description: "We respect your time. Our platform gets you from 'I want to play' to 'booking confirmed' in under a minute."
    }
  ];

  const team = [
    {
      name: "Mangesh Chavan",
      role: "Fullstack",
      github: "#",
      email: "mangesh@quickturf.in",
      initials: "MC"
    },
    {
      name: "Parshwa Desai",
      role: "Designer/Tester",
      github: "#",
      email: "parshva@quickturf.in",
      initials: "PD"
    },
    {
      name: "Sameehan Deo",
      role: "Frontend",
      github: "#",
      email: "sameehan@quickturf.in",
      initials: "SD"
    },
    {
      name: "Shreyas Chougule",
      role: "Backend",
      github: "#",
      email: "shreyas@quickturf.in",
      initials: "SC"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-32 pb-36 md:pb-20 w-full page-transition">
        {/* Philosphy Hero */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-6 mb-16">
          <div className="max-w-3xl">
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block"
            >
              Our Vision
            </motion.span>
            <h1 className="text-5xl md:text-7xl font-serif text-on-background mb-8 leading-tight">We built this <span className="text-primary italic">for players like us.</span></h1>
            <p className="text-xl md:text-2xl text-secondary font-medium leading-relaxed opacity-90">
              Finding a good turf in Solapur used to mean calling five numbers, hearing "it's taken", and settling for a muddy patch. QuickTurf fixes that — for good.
            </p>
          </div>
        </section>

        {/* Values Grid */}
        <section className="bg-white py-24 border-y border-surface-container">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
              {values.map((v, i) => (
                <div key={i} className="space-y-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
                    <v.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-on-background">{v.title}</h3>
                  <p className="text-secondary leading-relaxed font-medium opacity-80">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-24 bg-background">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <span className="text-primary font-bold uppercase tracking-[0.3em] text-xs mb-4 block">The Team</span>
              <h2 className="text-4xl md:text-5xl font-serif text-on-background">The people who <span className="text-primary italic">built this.</span></h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -8, borderColor: 'var(--color-primary)' }}
                  className="bg-white rounded-[32px] p-8 shadow-sm border border-surface-container transition-all group flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                    {member.initials}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-on-background mb-1">{member.name}</h3>
                  <p className="text-secondary font-bold text-[10px] uppercase tracking-widest mb-6 opacity-60">{member.role}</p>

                  <div className="flex gap-3 pt-6 border-t border-surface-container w-full justify-center">
                    <a href={member.github} className="p-2 text-secondary hover:text-primary transition-colors"><Github className="w-5 h-5" /></a>
                    <a href={`mailto:${member.email}`} className="p-2 text-secondary hover:text-primary transition-colors"><Mail className="w-5 h-5" /></a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Local Partnership */}
        <section className="max-w-[1280px] mx-auto px-4 md:px-6 py-12">
          <div className="bg-[#0a1a0e] rounded-[48px] p-8 md:p-20 flex flex-col md:flex-row items-center gap-12 text-white overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -translate-x-1/2"></div>
            <div className="flex-1 z-10">
              <h2 className="text-4xl md:text-5xl font-serif mb-6">Own a turf? Let's grow together.</h2>
              <p className="text-lg text-white/70 max-w-md leading-relaxed mb-10">
                List your venue on QuickTurf and get a steady stream of bookings from Solapur's most active sports community. Zero setup fees. Real-time dashboards. You're in control.
              </p>
              <div className="flex gap-4 mb-10">
                <ShieldCheck className="text-primary w-12 h-12 shrink-0" />
                <div>
                  <h4 className="font-bold text-lg">Verified Venue Partners</h4>
                  <p className="text-sm text-white/50">Every turf listed on QuickTurf is personally reviewed and approved by our team.</p>
                </div>
              </div>
              <Link
                to="/admin/register"
                className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-full font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/30 group/cta"
              >
                List My Turf — It's Free
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center group-hover/cta:translate-x-1 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
            <div className="flex-1 w-full md:w-auto h-80 relative rounded-[32px] overflow-hidden group">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXBQZGdGFXUNbwWYxKEFE5wLZ5-AlDmclDx4P_VdBM27EyIF9JrKC5W4VrY2tqp8EL5bvjRD_JmWVeoqJtu79EcPrKDgvUIeJHe-Mc2mP6d0NIrSqKBSmmZNiGkb8HvTYLdqVmG7fon2q3CWrCBKfFxyUNEOIEdogP_rh-LVbRpgWD84te5rzj8rV4VSHOickLABEz3BoXtQlIM7zJ4bI8B0fkd8vfxZAkibzMXkoor9T9EYf0cguwHLmdm7OsPbdVEBbb2WjLBzw" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Venue" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
