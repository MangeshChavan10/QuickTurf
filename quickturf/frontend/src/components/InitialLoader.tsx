import { useState, useEffect } from "react";
import { motion } from "motion/react";

export function InitialLoader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress with an editorial pacing
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete(), 200); // reduced delay for snappier entry
          return 100;
        }
        // Faster bursts
        return prev + Math.floor(Math.random() * 30) + 10;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ y: 0 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[100] bg-on-background flex flex-col items-center justify-center p-8 origin-top"
    >
      <div className="flex flex-col items-center justify-center relative w-full max-w-sm">
        <div className="overflow-hidden mb-12">
          <motion.h1 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.33, 1, 0.68, 1] }}
            className="text-5xl md:text-7xl font-serif text-white tracking-tight"
          >
            QuickTurf<span className="text-primary">.</span>
          </motion.h1>
        </div>

        <div className="w-full h-[1px] bg-white/10 overflow-hidden relative">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.2, ease: "linear" }}
          />
        </div>
        
        <div className="w-full flex justify-between mt-4">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-[9px] font-black tracking-[0.3em] uppercase text-white/50"
          >
            Premium Sports Venues
          </motion.span>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-[9px] font-mono font-black tracking-[0.1em] text-primary"
          >
            {Math.min(progress, 100).toString().padStart(3, '0')}%
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
