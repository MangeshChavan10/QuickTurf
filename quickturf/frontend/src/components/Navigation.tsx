import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Circle as SoccerBall, Menu, X, Lock, LogOut, User } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../contexts/AuthContext";

export function Header({ simplified = false }: { simplified?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isHome = location.pathname === "/";
  const isExplore = location.pathname === "/explore";
  const isAbout = location.pathname === "/about";
  const isHelp = location.pathname === "/help";
  const isBookings = location.pathname === "/bookings";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 w-full z-50 border-b bg-background/95 backdrop-blur-md border-surface-container shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex justify-between items-center h-20">
        <Link to="/" className="flex items-center gap-3 group transition-all active:scale-95">
          <div className="relative w-12 h-8 bg-primary rounded-md border-2 border-white/40 flex items-center justify-center overflow-hidden shadow-lg group-hover:bg-accent transition-colors duration-500">
            {/* Pitch Markings */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 -translate-x-1/2"></div>
            <div className="w-4 h-4 border-2 border-white/40 rounded-full"></div>
            {/* Corner Flags / Detail */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-white/20 rounded-full"></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/20 rounded-full"></div>
          </div>
          <span className="text-2xl font-black text-primary tracking-tighter font-serif">QuickTurf</span>
        </Link>

        {!simplified && (
          <>
            <nav className="hidden lg:flex items-center gap-8">
              <Link 
                to="/" 
                className={`${isHome ? 'text-primary font-semibold border-b-2 border-primary pb-1' : 'text-secondary font-medium hover:text-primary'} transition-all font-sans relative group`}
              >
                Home
                {!isHome && <span className="absolute bottom-[-24px] left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>}
              </Link>
              <Link 
                to="/explore" 
                className={`${isExplore ? 'text-primary font-semibold border-b-2 border-primary pb-1' : 'text-secondary font-medium hover:text-primary'} transition-all font-sans relative group`}
              >
                Explore
                {!isExplore && <span className="absolute bottom-[-24px] left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>}
              </Link>
              <Link 
                to="/about" 
                className={`${isAbout ? 'text-primary font-semibold border-b-2 border-primary pb-1' : 'text-secondary font-medium hover:text-primary'} transition-all font-sans relative group`}
              >
                About
                {!isAbout && <span className="absolute bottom-[-24px] left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>}
              </Link>
              <Link 
                to="/help" 
                className={`${isHelp ? 'text-primary font-semibold border-b-2 border-primary pb-1' : 'text-secondary font-medium hover:text-primary'} transition-all font-sans relative group`}
              >
                Help
                {!isHelp && <span className="absolute bottom-[-24px] left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>}
              </Link>
              <Link 
                to="/bookings" 
                className={`${isBookings ? 'text-primary font-semibold border-b-2 border-primary pb-1' : 'text-secondary font-medium hover:text-primary'} transition-all font-sans relative group`}
              >
                My Bookings
                {!isBookings && <span className="absolute bottom-[-24px] left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>}
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full border border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[10px] font-black text-white">
                          {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-on-background group-hover:text-primary transition-colors">{user.name}</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="p-2.5 text-secondary hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all active:scale-90"
                      title="Log Out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                  <>
                    <Link to="/login" className="px-5 py-2 font-semibold text-secondary hover:bg-surface-container rounded-full transition-all font-sans active:scale-95">Log In</Link>
                    <Link to="/signup" className="bg-primary hover:opacity-90 text-on-primary px-8 py-2.5 rounded-full font-semibold shadow-sm transition-all active:scale-95 font-sans text-white">
                      Sign Up
                    </Link>
                  </>
                  </>
                )}
              </div>
              
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-primary hover:bg-surface-container rounded-full transition-all active:scale-90"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </>
        )}
        
        {simplified && (
          <div className="flex items-center gap-2 text-secondary">
            <Lock className="w-4 h-4" />
            <span className="font-semibold text-xs uppercase tracking-[0.2em]">Secure Checkout</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isMenuOpen && !simplified && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-surface-container overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6 font-sans">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif font-bold text-on-background">Home</Link>
              <Link to="/explore" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif font-bold text-on-background">Explore Turfs</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif font-bold text-on-background">Our Philosophy</Link>
              <Link to="/help" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif font-bold text-on-background">Help Center</Link>
              <Link to="/bookings" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif font-bold text-on-background">My Bookings</Link>
              <div className="h-px bg-surface-container w-full my-2"></div>
              <div className="flex flex-col gap-4">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 p-4 bg-surface-container rounded-3xl hover:bg-primary/5 transition-all"
                    >
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
                        <span className="text-sm font-black">
                          {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-on-background">{user.name}</p>
                        <p className="text-xs text-secondary">{user.email}</p>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5">View Profile →</p>
                      </div>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full py-4 rounded-full border border-red-100 bg-red-50 text-red-600 font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" /> Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-4 text-center rounded-full border border-surface-container font-bold text-on-background active:scale-95 transition-all">Log In</Link>
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="w-full py-4 text-center rounded-full bg-primary text-white font-bold active:scale-95 transition-all shadow-md">Sign Up Free</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-surface-container bg-surface py-12 mt-auto">
      <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-8 bg-primary rounded-md border-2 border-white/40 flex items-center justify-center overflow-hidden shadow-lg">
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 -translate-x-1/2"></div>
              <div className="w-4 h-4 border-2 border-white/40 rounded-full"></div>
            </div>
            <span className="text-2xl font-black text-primary tracking-tighter font-serif">QuickTurf</span>
          </Link>
          <p className="text-sm text-secondary text-center md:text-left">© 2026 QuickTurf Solapur. Effortless turf booking.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <Link className="text-sm text-secondary hover:text-primary underline" to="/about">About Us</Link>
          <Link className="text-sm text-secondary hover:text-primary underline" to="/help">FAQ & Support</Link>
          <Link className="text-sm text-secondary hover:text-primary underline" to="/explore">Explore Venues</Link>
          <a className="text-sm text-secondary hover:text-primary underline" href="#">Contact Us</a>
          <a className="text-sm text-rose-500 font-medium hover:text-rose-600 underline flex items-center gap-1" href="mailto:support@quickturf.in?subject=Bug Report">Report a Bug</a>
        </div>
      </div>
    </footer>
  );
}
