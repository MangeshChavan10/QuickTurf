import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Circle as SoccerBall, Trophy, Play, RotateCcw } from "lucide-react";

export default function TargetPractice() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });

  const moveTarget = useCallback(() => {
    // Keep target within 10% to 90% bounds so it doesn't clip off screen
    const x = Math.floor(Math.random() * 80) + 10;
    const y = Math.floor(Math.random() * 80) + 10;
    setTargetPos({ x, y });
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      if (score > highScore) setHighScore(score);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score, highScore]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(15);
    setIsPlaying(true);
    moveTarget();
  };

  const handleHit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPlaying) return;
    setScore((s) => s + 1);
    moveTarget();
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black/40 flex flex-col items-center justify-center font-sans border-t lg:border-t-0 border-surface-container">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      {/* Header UI */}
      <div className="absolute top-8 w-full px-8 flex justify-between items-center z-10 pointer-events-none">
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-white font-bold text-sm">Best: {highScore}</span>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <span className="text-white font-bold text-sm">{timeLeft}s</span>
        </div>
      </div>

      {/* Game Area */}
      <AnimatePresence>
        {!isPlaying ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center z-20 flex flex-col items-center max-w-sm px-6"
          >
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
              <SoccerBall className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-serif text-white mb-2">Target Practice</h2>
            <p className="text-secondary/60 text-sm mb-8">
              {timeLeft === 0 
                ? `Time's up! You scored ${score} points.` 
                : "Select a turf from the list, or test your reflexes while you wait."}
            </p>
            <button
              onClick={startGame}
              className="flex items-center gap-2 bg-primary hover:bg-white hover:text-black text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-[0_0_30px_rgba(0,163,108,0.3)] hover:shadow-xl active:scale-95"
            >
              {timeLeft === 0 ? <><RotateCcw className="w-4 h-4" /> Play Again</> : <><Play className="w-4 h-4" /> Start Mini-Game</>}
            </button>
          </motion.div>
        ) : (
          <div className="absolute inset-0 z-20 cursor-crosshair">
             {/* The Target */}
             <motion.div
               animate={{ 
                 top: `${targetPos.y}%`, 
                 left: `${targetPos.x}%`,
               }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
               className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
               onMouseDown={handleHit}
             >
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/40 rounded-full animate-ping"></div>
                  <div className="w-16 h-16 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)] flex items-center justify-center hover:bg-primary transition-colors text-black hover:text-white border-4 border-surface-container/20">
                    <SoccerBall className="w-8 h-8" />
                  </div>
                </div>
             </motion.div>

             {/* Score Display (Subtle Background) */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-black text-white/5 pointer-events-none">
               {score}
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
