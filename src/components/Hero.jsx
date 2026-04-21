import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import WolfLogo from './WolfLogo';
import DustClouds from './DustClouds';
import HeroScene from './Three/HeroScene';

// default words list moved inside component via ref
const funnyQuotes = [
  { text: "Birds of the same feather make a good feather duster...", author: "R.M.Q." },
  { text: "Life is like a wheel. Sometimes its on the bottom, sometimes its on a vulcanizing shop.", author: "R.M.Q." },
  { text: "Goodness gracious, you're the shoplift!", author: "V.G." },
  { text: "Holabels!", author: "M.D." },

];

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

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isQuoteVisible, setIsQuoteVisible] = useState(false);

  useEffect(() => {
    let int;
    let quoteInt;
    if (isClockMode) {
      int = setInterval(() => setTime(new Date()), 1000);

      let visible = false;
      let tick = 0;
      quoteInt = setInterval(() => {
        tick++;
        if (tick % 10 === 0) {
          visible = !visible;
          setIsQuoteVisible(visible);
          if (visible) {
            setQuoteIndex(prev => {
              let next;
              do {
                next = Math.floor(Math.random() * funnyQuotes.length);
              } while (next === prev && funnyQuotes.length > 1);
              return next;
            });
          }
        }
      }, 1000);
    } else {
      setIsQuoteVisible(false);
    }
    return () => {
      clearInterval(int);
      if (quoteInt) clearInterval(quoteInt);
    };
  }, [isClockMode]);

  const handleLogoClick = (e) => {
    e.stopPropagation();
    if (isClockMode) return;
    setLogoClicks(prev => {
      if (prev + 1 >= 10) {
        setIsClockMode(true);
        setTime(new Date());
        return 0;
      }
      return prev + 1;
    });
  };

  const handleBackgroundClick = () => {
    if (isClockMode) {
      setIsClockMode(false);
      setLogoClicks(0);
    }
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
      if (window.scrollY > 10) {
        setEasterEggActive(false);
        setIsClockMode(false);
        setLogoClicks(0);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

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

  return (
    <div id="rocketwolf" ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black snap-start cursor-auto" onClick={handleBackgroundClick}>
      <motion.div style={{ y, opacity }} className="relative w-full h-full flex flex-col justify-center items-center text-center">
        {/* Original 2D Backgrounds (Hidden in Clock Mode) */}
        {!isClockMode && (
          <>
            <StarryBackground isClockMode={isClockMode} />
            <DustClouds />
          </>
        )}

        {/* 3D Scene */}
        <HeroScene isClockMode={isClockMode} time={time} />

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

        {/* Clock Mode Typography / Quote */}
        <AnimatePresence>
          {isClockMode && isQuoteVisible && (
            <motion.div
              key="clock-quote"
              className="absolute z-20 flex items-center justify-center pointer-events-none px-8 text-center max-w-5xl"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <h1 className="font-serif text-[24px] md:text-[4vw] leading-tight text-white/80 tracking-wide drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                "{funnyQuotes[quoteIndex].text}"
                <br />
                <span className="text-[16px] md:text-[2vw] text-accent italic mt-6 block opacity-80">
                  - {funnyQuotes[quoteIndex].author}
                </span>
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
