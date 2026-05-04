import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Circle as SoccerBall, Menu, X, Lock, LogOut, User, Bug, Moon, Sun, Home, Compass, CalendarDays, UserCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 w-full z-50 border-b bg-background/95 backdrop-blur-md border-surface-container ">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex justify-between items-center h-20">
        <Link to="/" className="flex items-center gap-3 group transition-all active:scale-95">
          <div className="relative w-12 h-8 bg-primary rounded-md border-2 border-white/40 flex items-center justify-center overflow-hidden  group-hover:bg-accent transition-colors duration-500">
            {/* Pitch Markings */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 -translate-x-1/2"></div>
            <div className="w-4 h-4 border-2 border-white/40 rounded-full"></div>
            {/* Corner Flags / Detail */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-white/20 rounded-full"></div>
            <div className="absolute bottom-1 right-1 w-1 h-1 bg-white/20 rounded-full"></div>
          </div>
          <span className="text-2xl font-bold text-primary tracking-tighter font-serif">QuickTurf</span>
        </Link>

        {!simplified && (
          <>
            <nav className="hidden lg:flex items-center gap-8">
              <Link 
                to="/" 
                className={`${isHome ? 'text-primary font-bold' : 'text-secondary font-bold hover:text-primary'} transition-all font-sans relative group py-1 text-xs uppercase tracking-widest`}
              >
                Home
                <span className={`absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-300 ${isHome ? 'w-full bg-primary' : 'w-0 group-hover:w-full bg-primary/50'}`}></span>
              </Link>
              <Link 
                to="/explore" 
                className={`${isExplore ? 'text-primary font-bold' : 'text-secondary font-bold hover:text-primary'} transition-all font-sans relative group py-1 text-xs uppercase tracking-widest`}
              >
                Venue
                <span className={`absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-300 ${isExplore ? 'w-full bg-primary' : 'w-0 group-hover:w-full bg-primary/50'}`}></span>
              </Link>
              <Link 
                to="/about" 
                className={`${isAbout ? 'text-primary font-bold' : 'text-secondary font-bold hover:text-primary'} transition-all font-sans relative group py-1 text-xs uppercase tracking-widest`}
              >
                About
                <span className={`absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-300 ${isAbout ? 'w-full bg-primary' : 'w-0 group-hover:w-full bg-primary/50'}`}></span>
              </Link>
              <Link 
                to="/help" 
                className={`${isHelp ? 'text-primary font-bold' : 'text-secondary font-bold hover:text-primary'} transition-all font-sans relative group py-1 text-xs uppercase tracking-widest`}
              >
                Help
                <span className={`absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-300 ${isHelp ? 'w-full bg-primary' : 'w-0 group-hover:w-full bg-primary/50'}`}></span>
              </Link>
              <Link 
                to="/bookings" 
                className={`${isBookings ? 'text-primary font-bold' : 'text-secondary font-bold hover:text-primary'} transition-all font-sans relative group py-1 text-xs uppercase tracking-widest`}
              >
                My Bookings
                <span className={`absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-300 ${isBookings ? 'w-full bg-primary' : 'w-0 group-hover:w-full bg-primary/50'}`}></span>
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full border border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                          {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-black group-hover:text-primary transition-colors">{user.name}</span>
                    </button>

                    <AnimatePresence>
                      {isProfileDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-3 w-56 bg-white border border-surface-container rounded-2xl  overflow-hidden flex flex-col py-2 z-50"
                        >
                          <div className="px-4 py-3 border-b border-surface-container mb-1">
                            <p className="text-sm font-bold text-black truncate">{user.name}</p>
                            <p className="text-xs text-secondary truncate">{user.email}</p>
                          </div>
                          
                          <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container/50 transition-colors text-sm font-bold text-black">
                            <User className="w-4 h-4 text-secondary" /> My Profile
                          </Link>
                          
                          <button onClick={toggleDarkMode} className="flex items-center justify-between px-4 py-3 hover:bg-surface-container/50 transition-colors text-sm font-bold text-black">
                            <div className="flex items-center gap-3">
                              {isDarkMode ? <Sun className="w-4 h-4 text-secondary" /> : <Moon className="w-4 h-4 text-secondary" />}
                              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                            </div>
                          </button>

                          <div className="h-px bg-surface-container my-1"></div>

                          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 hover:bg-rose-50 transition-colors text-sm font-bold text-rose-600">
                            <LogOut className="w-4 h-4" /> Log Out
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                  <>
                    <Link to="/login" className="px-5 py-2 font-bold text-secondary hover:bg-surface-container rounded-full transition-all font-sans active:scale-95">Log In</Link>
                    <Link to="/signup" className="bg-primary hover:opacity-90 text-on-primary px-8 py-2.5 rounded-full font-bold  transition-all active:scale-95 font-sans text-white">
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
          <div />
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
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif font-bold text-black uppercase tracking-wider">Home</Link>
              <Link to="/explore" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif font-bold text-black uppercase tracking-wider">Venue</Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif font-bold text-black uppercase tracking-wider">About</Link>
              <Link to="/help" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif font-bold text-black uppercase tracking-wider">Help</Link>
              <Link to="/bookings" onClick={() => setIsMenuOpen(false)} className="text-xl font-serif font-bold text-black uppercase tracking-wider">My Bookings</Link>
              <div className="h-px bg-surface-container w-full my-2"></div>
              <div className="flex flex-col gap-4">
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 p-4 bg-surface-container rounded-[32px] hover:bg-primary/5 transition-all"
                    >
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
                        <span className="text-sm font-bold">
                          {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-black">{user.name}</p>
                        <p className="text-xs text-secondary">{user.email}</p>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5">View Profile →</p>
                      </div>
                    </Link>
                    <button 
                      onClick={toggleDarkMode}
                      className="w-full py-4 rounded-full border border-surface-container bg-white text-black font-bold active:scale-95 transition-all flex items-center justify-center gap-2 mb-2"
                    >
                      {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                      {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full py-4 rounded-full border border-red-100 bg-red-50 text-red-600 font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" /> Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-4 text-center rounded-full border border-surface-container font-bold text-black active:scale-95 transition-all">Log In</Link>
                    <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="w-full py-4 text-center rounded-full bg-primary text-white font-bold active:scale-95 transition-all ">Sign Up Free</Link>
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
    <footer className="w-full border-t border-surface-container bg-white py-12 mt-auto mb-16 md:mb-0">
      <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-8 bg-primary rounded-md border-2 border-white/40 flex items-center justify-center overflow-hidden ">
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40 -translate-x-1/2"></div>
              <div className="w-4 h-4 border-2 border-white/40 rounded-full"></div>
            </div>
            <span className="text-2xl font-bold text-primary tracking-tighter font-serif">QuickTurf</span>
          </Link>
          <p className="text-sm text-secondary text-center md:text-left">© 2026 QuickTurf Solapur. Effortless turf booking.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <Link className="text-sm font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest text-[10px]" to="/about">About Us</Link>
          <Link className="text-sm font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest text-[10px]" to="/help">FAQ & Support</Link>
          <Link className="text-sm font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest text-[10px]" to="/explore">Venues</Link>
          <Link className="text-sm font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest text-[10px]" to="/help">Contact Us</Link>
          <a 
            className="text-sm text-rose-500 font-bold hover:text-rose-600 transition-colors flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 rounded-full" 
            href="https://mail.google.com/mail/?view=cm&fs=1&to=support@quickturf.in&su=Bug%20Report%20-%20QuickTurf" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Bug className="w-4 h-4" />
            Report a Bug
          </a>
        </div>
      </div>
    </footer>
  );
}

export function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  const tabs = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/explore", icon: Compass, label: "Explore" },
    { to: "/bookings", icon: CalendarDays, label: "Bookings" },
    { to: user ? "/profile" : "/login", icon: UserCircle, label: user ? "Profile" : "Login" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white/95 backdrop-blur-md border-t border-surface-container">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all ${
                isActive ? "text-primary" : "text-secondary"
              }`}
            >
              <Icon className={`w-6 h-6 transition-all ${isActive ? "scale-110" : ""}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-primary" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
