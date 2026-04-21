import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import WolfLogo from './WolfLogo';
import DustClouds from './DustClouds';
import HeroScene from './Three/HeroScene';

import { Target } from 'lucide-react';
import { playSound } from '../utils/audio';

export const StarryBackground = ({ isClockMode = false }) => {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: 250 }).map((_, i) => {
      const isGalaxy = i >= 60;
      const colors = ['bg-white', 'bg-blue-300', 'bg-purple-300', 'bg-accent'];
      return {
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * (isGalaxy ? 3 : 2) + 1,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
        color: isGalaxy ? colors[Math.floor(Math.random() * colors.length)] : 'bg-white',
      };
    });
    setStars(generated);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => {
        const isVisible = i < 60 || isClockMode;
        return (
          <motion.div
            key={i}
            className={`absolute rounded-full ${star.color}`}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? [0, 0.6, 0] : 0 }}
            transition={isVisible ? {
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            } : { duration: 1 }}
          />
        );
      })}

      {/* Extra Galaxy Dust for Clock Mode */}
      <AnimatePresence>
        {isClockMode && (
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-purple-900/5 to-transparent z-0 pointer-events-none mix-blend-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          />
        )}
      </AnimatePresence>

      {/* Dust Cloud Setting In */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/20 via-black/90 to-black z-0 pointer-events-none"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 4, ease: "easeOut", delay: 0.5 }}
      />
    </div>
  );
};

export const ConcentricCircles = ({ isClockMode = false, time = null }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX - window.innerWidth / 2) * 0.05;
      const y = (e.clientY - window.innerHeight / 2) * 0.05;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      {[1, 2, 3].map((circle, i) => {
        const springX = useSpring(mouseX, { damping: 30 + i * 10, stiffness: 100 - i * 15 });
        const springY = useSpring(mouseY, { damping: 30 + i * 10, stiffness: 100 - i * 15 });

        const x = useTransform(springX, (val) => val * (i + 1));
        const y = useTransform(springY, (val) => val * (i + 1));

        const totalSeconds = time ? time.getHours() * 3600 + time.getMinutes() * 60 + time.getSeconds() : 0;
        let rotation = 0;
        if (isClockMode && time) {
          if (i === 0) rotation = totalSeconds * 6;
          else if (i === 1) rotation = totalSeconds * 0.1;
          else if (i === 2) rotation = totalSeconds * (360 / 43200);
        }

        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${(i + 1) * 30}vw`,
              height: `${(i + 1) * 30}vw`,
              minWidth: `${(i + 1) * 350}px`,
              minHeight: `${(i + 1) * 350}px`,
              x,
              y
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 3, delay: i * 0.4, ease: 'easeOut' }}
          >
            <motion.div
              className={`w-full h-full border ${isClockMode ? 'border-accent/40' : 'border-white/20'} rounded-full relative`}
              animate={isClockMode ? {
                scale: 1,
                opacity: 1,
                rotate: rotation
              } : {
                scale: [1, 1.03, 1],
                opacity: [0.3, 1, 0.3],
                rotate: 0
              }}
              transition={isClockMode ? {
                duration: 1,
                ease: "linear"
              } : {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 1.5
              }}
            >
              {isClockMode && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-accent text-accent rounded-full shadow-[0_0_15px_currentColor]" />
              )}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default function Hero() {
  const wordsListRef = useRef(["python", "data", "ai", "figma", "design", "web"]);
  const [currentWord, setCurrentWord] = useState(wordsListRef.current[2]); // Starting with ai

  const [easterEggActive, setEasterEggActive] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const [logoClicks, setLogoClicks] = useState(0);
  const [isClockMode, setIsClockMode] = useState(false);
  const [time, setTime] = useState(new Date());

  // Game State
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isTakingDamage, setIsTakingDamage] = useState(false);

  useEffect(() => {
    let int;
    if (isClockMode) {
      int = setInterval(() => setTime(new Date()), 1000);
    }
    
    // Dispatch event to hide Navigation global
    window.dispatchEvent(new CustomEvent('gameModeChange', { detail: isClockMode }));

    return () => {
      clearInterval(int);
    };
  }, [isClockMode]);

  useEffect(() => {
    if (lives <= 0 && gameStatus === 'playing') {
       setGameStatus('gameover');
       playSound('boom');
    }
  }, [lives, gameStatus]);

  const handleLogoClick = (e) => {
    e.stopPropagation();
    if (isClockMode) return;
    setLogoClicks(prev => {
      if (prev + 1 >= 10) {
        setIsClockMode(true);
        setGameStatus('idle');
        setTime(new Date());
        return 0;
      }
      return prev + 1;
    });
  };

  const handleBackgroundClick = () => {
    // Click no longer exits. Only Scroll or ESC.
  };

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord(prevWord => {
        const list = wordsListRef.current;
        let index = list.indexOf(prevWord);
        return list[(index + 1) % list.length];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handle67 = () => {
      if (!wordsListRef.current.includes("memes")) {
        wordsListRef.current.push("memes");
      }
      setCurrentWord("memes");
    };
    window.addEventListener('trigger67', handle67);
    return () => window.removeEventListener('trigger67', handle67);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.5) {
        setEasterEggActive(false);
        setIsClockMode(false);
        setGameStatus('idle');
        setLogoClicks(0);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      }
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isClockMode) {
        setEasterEggActive(false);
        setIsClockMode(false);
        setGameStatus('idle');
        setLogoClicks(0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, [isClockMode]);

  const handleShoot = () => {
    if (gameStatus === 'idle' && isClockMode) {
      setGameStatus('playing');
      setScore(0);
      setLives(3);
      playSound('start');
    } else if (gameStatus === 'playing') {
      // Background click means a missed shot, played sound but no points
      playSound('laser');
    }
  };

  const handleMouseEnter = () => {
    if (!easterEggActive) {
      hoverTimeoutRef.current = setTimeout(() => {
        setEasterEggActive(true);
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 500);
      }, 10000);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleMiss = () => {
    setLives(l => l - 1);
    playSound('boom');
    setIsTakingDamage(true);
    setTimeout(() => setIsTakingDamage(false), 400);
  };

  return (
    <div id="rocketwolf" ref={containerRef} className={`relative w-full h-screen overflow-hidden bg-black snap-start ${isClockMode ? 'cursor-crosshair' : 'cursor-auto'}`} onClick={handleShoot}>
      <motion.div 
        style={{ y, opacity }} 
        className="relative w-full h-full flex flex-col justify-center items-center text-center origin-center"
        animate={isTakingDamage ? { x: [-15, 15, -10, 10, -5, 5, 0], y: [-10, 10, -10, 10, -5, 5, 0] } : {}}
        transition={isTakingDamage ? { duration: 0.4, ease: "easeInOut" } : {}}
      >
        {/* Damage Flash */}
        <AnimatePresence>
           {isTakingDamage && (
             <motion.div 
               className="absolute inset-0 bg-[#ff3333] z-[200] mix-blend-screen pointer-events-none"
               initial={{ opacity: 0.5 }}
               animate={{ opacity: 0 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.4 }}
             />
           )}
        </AnimatePresence>

        {/* Original 2D Backgrounds (Hidden in Clock Mode) */}
        {!isClockMode && (
          <>
            <StarryBackground isClockMode={isClockMode} />
            <DustClouds />
          </>
        )}

        {/* 3D Scene */}
        <HeroScene 
           isClockMode={isClockMode} 
           time={time} 
           gameStatus={gameStatus}
           score={score}
           lives={lives}
           onHit={() => { setScore(s => s + 100); playSound('laser'); setTimeout(() => playSound('boom'), 50); }}
           onMiss={handleMiss}
           onRetry={() => { setGameStatus('playing'); setScore(0); setLives(3); playSound('start'); }}
        />

        {/* Wolf Emblem Fading In */}
        <AnimatePresence mode="wait">
          {!isClockMode && (
            <motion.div
              key="wolf-emblem"
              className="absolute z-10 text-accent/15 w-[500px] h-[500px] flex items-center justify-center pointer-events-auto cursor-pointer tooltip-trigger"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 3, delay: 1 } }}
              exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.8 } }}
              onClick={handleLogoClick}
            >
              <motion.div
                className="w-full h-full flex items-center justify-center"
                animate={{
                  scale: [1, 1.03, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <WolfLogo className="w-[80%] h-[80%]" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Typography */}
        <AnimatePresence>
          {!isClockMode && (
            <motion.div
              key="typography"
              className="relative z-20 flex flex-col items-center mt-[-30px] pointer-events-none"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 1.5, delay: 2 } }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.8 } }}
            >
              <h1 className="font-serif text-[72px] sm:text-[80px] md:text-[100px] leading-none text-white mb-2 select-none tracking-tight">
                i am <span className="text-accent italic font-serif">rocketwolf</span>
              </h1>

              <motion.div layout className="flex items-center justify-center gap-2 md:gap-3 text-[24px] md:text-[38px] font-sans font-light text-white select-none h-[40px] md:h-[50px]">
                <motion.span layout>i speak</motion.span>
                <motion.div layout className="relative flex items-center justify-center">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={currentWord}
                      layout
                      className="font-serif italic text-[28px] md:text-[45px] leading-none whitespace-nowrap"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15, position: 'absolute' }}
                      transition={{ duration: 0.6 }}
                    >
                      {currentWord}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll Indicator */}
        <AnimatePresence>
          {!isClockMode && (
            <motion.div
              key="scroll-indicator"
              className="absolute bottom-12 z-30 flex flex-col items-center gap-7 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 1.5, delay: 3.5 } }}
              exit={{ opacity: 0, y: 20, transition: { duration: 0.8 } }}
            >
              <motion.span
                className="font-sans text-[12px] tracking-[0.3em] font-medium text-white/50 select-none text-center transition-all duration-300 pointer-events-auto"
                layout
              >
                {easterEggActive ? "WHAT ARE YOU WAITING FOR?" : "GET TO KNOW HIM"}
              </motion.span>
              <motion.div
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center cursor-pointer text-black hover:bg-accent hover:text-white transition-colors duration-300 pointer-events-auto"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                whileHover={!isBouncing ? { y: 5 } : {}}
                animate={isBouncing ? { y: [0, -20, 0, -10, 0, -5, 0] } : {}}
                transition={isBouncing ? { duration: 0.5, ease: "easeInOut" } : {}}
                onClick={(e) => {
                  e.stopPropagation();
                  setEasterEggActive(false);
                  window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
                }}
              >
                <ArrowDown className="w-5 h-5" strokeWidth={1.5} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HTML Game Over and HUD */}
        <AnimatePresence>
          {isClockMode && gameStatus === 'playing' && (
            <motion.div 
              className="absolute top-10 left-10 right-10 flex flex-col md:flex-row justify-between items-start md:items-center pointer-events-none z-30"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="font-serif text-[24px] md:text-[32px] text-white tracking-wide">
                score <span className="text-accent italic">{score}</span>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                {[1, 2, 3].map(i => (
                  <motion.div 
                    key={i} 
                    className={`w-3 h-3 md:w-4 md:h-4 rounded-full ${i <= lives ? 'bg-accent shadow-[0_0_10px_#ff3333]' : 'bg-white/20'}`}
                    animate={i <= lives ? { scale: [1, 1.2, 1], transition: { repeat: Infinity, duration: 2, delay: i * 0.3 } } : { scale: 1 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {isClockMode && gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-serif text-[60px] md:text-[80px] leading-none text-white tracking-tight mb-4">
                game <span className="text-accent italic">over</span>
              </h1>
              <p className="font-sans text-[18px] md:text-[20px] font-light text-white/70 mb-10 tracking-[0.2em] uppercase">
                final score: {score}
              </p>
              
              <button
                className="group relative px-8 py-3 bg-transparent border border-accent text-accent font-sans text-sm tracking-[0.3em] font-medium cursor-[inherit] overflow-hidden transition-colors duration-300 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setGameStatus('playing');
                  setLives(3);
                  setScore(0);
                  playSound('start');
                }}
              >
                <div className="absolute inset-0 bg-accent translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
                <span className="relative z-10">RETRY MISSION</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
