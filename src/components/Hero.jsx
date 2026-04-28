import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import WolfLogo from './WolfLogo';
import DustClouds from './DustClouds';
import HeroScene from './Three/HeroScene';

import { Target } from 'lucide-react';
import { playSound, startAmbient, stopAmbient } from '../utils/audio';
import { useKonamiCode } from '../hooks/useKonamiCode';
import MidiPlayerUI from './MidiPlayerUI';
import { midiPlayer } from '../utils/midiPlayerEngine';

// Depth layer config: index = depth (0=near, 1=mid, 2=far)
const DEPTH_LAYERS = [
  { speedMultiplier: 1.0, maxTranslate: 22, opacityBoost: 0.15, sizeBoost: 0.8 }, // near
  { speedMultiplier: 0.5, maxTranslate: 12, opacityBoost: 0.0,  sizeBoost: 0.0 }, // mid
  { speedMultiplier: 0.2, maxTranslate: 5,  opacityBoost: -0.1, sizeBoost: -0.3 }, // far
];

export const StarryBackground = ({ isClockMode = false }) => {
  const [stars, setStars] = useState([]);

  // Refs for parallax layer DOM wrappers — one per depth (stable across renders)
  const layerRef0 = useRef(null);
  const layerRef1 = useRef(null);
  const layerRef2 = useRef(null);
  // Group into a stable ref so the effect closure always sees current DOM nodes
  const layerRefsGroup = useRef([layerRef0, layerRef1, layerRef2]);

  // Raw target offset (updated by event listeners, no re-render)
  const targetOffset = useRef({ x: 0, y: 0 });
  // Smoothed current offset (lerped in rAF loop)
  const currentOffset = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef(null);

  useEffect(() => {
    const generated = Array.from({ length: 250 }).map((_, i) => {
      const isGalaxy = i >= 60;
      const colors = ['bg-white', 'bg-blue-300', 'bg-purple-300', 'bg-accent'];
      // Assign depth deterministically so galaxy stars skew toward mid/far
      const depth = i % 3; // 0=near, 1=mid, 2=far
      const layer = DEPTH_LAYERS[depth];
      return {
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * (isGalaxy ? 3 : 2) + 1 + layer.sizeBoost,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
        color: isGalaxy ? colors[Math.floor(Math.random() * colors.length)] : 'bg-white',
        depth,
      };
    });
    setStars(generated);
  }, []);

  // Parallax animation loop + input listeners — only when isClockMode is on
  useEffect(() => {
    const layerRefs = layerRefsGroup.current;
    if (!isClockMode) {
      // Reset layers to origin when clock mode turns off
      layerRefs.forEach(ref => {
        if (ref.current) ref.current.style.transform = 'translate(0px, 0px)';
      });
      targetOffset.current = { x: 0, y: 0 };
      currentOffset.current = { x: 0, y: 0 };
      return;
    }

    const LERP_FACTOR = 0.06; // smoothing (lower = smoother/slower)

    const tick = () => {
      const cur = currentOffset.current;
      const tgt = targetOffset.current;

      // Lerp toward target
      cur.x += (tgt.x - cur.x) * LERP_FACTOR;
      cur.y += (tgt.y - cur.y) * LERP_FACTOR;

      // Apply per-layer transform
      layerRefs.forEach((ref, depth) => {
        if (!ref.current) return;
        const { speedMultiplier, maxTranslate } = DEPTH_LAYERS[depth];
        const tx = Math.max(-maxTranslate, Math.min(maxTranslate, cur.x * speedMultiplier));
        const ty = Math.max(-maxTranslate, Math.min(maxTranslate, cur.y * speedMultiplier));
        ref.current.style.transform = `translate(${tx}px, ${ty}px)`;
      });

      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);

    // ── Desktop: mousemove ──────────────────────────────────────────────────
    const handleMouseMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      // Normalize to [-1, 1] range, then scale to a base travel distance
      targetOffset.current = {
        x: ((e.clientX - cx) / cx) * -22,
        y: ((e.clientY - cy) / cy) * -22,
      };
    };

    // ── Mobile: deviceorientation ───────────────────────────────────────────
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const handleOrientation = (e) => {
      // gamma = left/right tilt (-90..90), beta = front/back (-180..180)
      const gammaRaw = e.gamma ?? 0;
      const betaRaw  = (e.beta ?? 0) - 45; // subtract 45° typical hold angle
      const gamma = clamp(gammaRaw, -30, 30);
      const beta  = clamp(betaRaw,  -30, 30);
      targetOffset.current = {
        x: (gamma / 30) * -22,
        y: (beta  / 30) * -22,
      };
    };

    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    } else {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleOrientation);
      // Snap layers back to origin on cleanup
      layerRefs.forEach(ref => {
        if (ref.current) ref.current.style.transform = 'translate(0px, 0px)';
      });
      targetOffset.current = { x: 0, y: 0 };
      currentOffset.current = { x: 0, y: 0 };
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClockMode]);

  // Group stars by depth for rendering
  const starsByDepth = [[], [], []];
  stars.forEach((star, i) => {
    starsByDepth[star.depth ?? 1].push({ star, i });
  });

  const jsxLayerRefs = [layerRef0, layerRef1, layerRef2];

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Render each depth layer in its own wrapper div for cheap transform */}
      {starsByDepth.map((group, depth) => (
        <div
          key={depth}
          ref={jsxLayerRefs[depth]}
          style={{ position: 'absolute', inset: '-5%', willChange: 'transform' }}
        >
          {group.map(({ star, i }) => {
            const isVisible = i < 60 || isClockMode;
            return (
              <div
                key={i}
                className={`absolute rounded-full ${star.color}`}
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: Math.max(0.5, star.size),
                  height: Math.max(0.5, star.size),
                  opacity: 0,
                  animation: isVisible ? `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite` : 'none',
                  willChange: 'opacity'
                }}
              />
            );
          })}
        </div>
      ))}

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

export default function Hero() {
  const wordsListRef = useRef(["python", "data", "ai", "figma", "design", "web"]);
  const [currentWord, setCurrentWord] = useState(wordsListRef.current[2]); // Starting with ai

  const [easterEggActive, setEasterEggActive] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const [logoClicks, setLogoClicks] = useState(0);
  const [isClockMode, setIsClockMode] = useState(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    return path === '/space-game' || path === '/spacegame' || path === '/midi-player';
  });
  const [isMidiMode, setIsMidiMode] = useState(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    return path === '/midi-player';
  });
  const [isMidiWarping, setIsMidiWarping] = useState(false);
  const [time, setTime] = useState(new Date());
  
  // MIDI Player data for Three.js
  const [midiData, setMidiData] = useState({ time: 0, duration: 0, playlistIndex: -1, playlistLength: 0 });

  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef(null);

  // Game State
  const [gameStatus, setGameStatus] = useState(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    return (path === '/space-game' || path === '/spacegame') ? 'playing' : 'idle';
  }); // 'idle' | 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isTakingDamage, setIsTakingDamage] = useState(false);
  const [bossData, setBossData] = useState({ status: 'inactive', hp: 0, maxHp: 0, name: '' });

  // Galaxy Colors
  const galaxyColors = ['#ff3333', '#33ff33', '#3355ff', '#ff33aa', '#ffff33'];
  const [galaxyLevel, setGalaxyLevel] = useState(0);

  // Konami Code to unlock MIDI Player Mode
  useKonamiCode(() => {
    if (isClockMode && !isMidiMode) {
      setIsMidiMode(true);
      setGameStatus('idle'); // Pause/hide game when entering MIDI mode
      playSound('start'); // Positive feedback
    }
  });

  // URL Path Detection for Easy Access
  useEffect(() => {
    const handlePath = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/space-game' || path === '/spacegame') {
        setIsClockMode(true);
        setGameStatus('playing');
        setScore(0);
        setLives(3);
      } else if (path === '/midi-player') {
        setIsClockMode(true);
        setIsMidiMode(true);
        setGameStatus('idle');
      } else if (path === '/' || path === '') {
        setIsClockMode(false);
        setIsMidiMode(false);
        setGameStatus('idle');
      }
    };

    handlePath();
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  // Sync URL with State
  useEffect(() => {
    if (isClockMode) {
      const newPath = isMidiMode ? '/midi-player' : '/space-game';
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, '', newPath);
      }
    } else {
      if (window.location.pathname !== '/' && window.location.pathname !== '') {
        window.history.pushState(null, '', '/');
      }
    }
  }, [isClockMode, isMidiMode]);

  useEffect(() => {
    if (isClockMode || isMidiMode) {
      midiPlayer.init(); // Start loading immediately for both modes
    }

    if (isMidiMode) {
      const handleTimeUpdate = (time, duration) => setMidiData(prev => ({ ...prev, time, duration }));
      const handlePlaylistChange = (playlist, index) => setMidiData(prev => ({ ...prev, playlistLength: playlist.length, playlistIndex: index }));
      const handleTrackWarping = () => {
        setIsMidiWarping(true);
        playSound('warp');
        setTimeout(() => {
          setIsMidiWarping(false);
          setGalaxyLevel(prev => (prev + 1) % galaxyColors.length);
        }, 4000);
      };
      
      midiPlayer.on('timeUpdate', handleTimeUpdate);
      midiPlayer.on('playlistChange', handlePlaylistChange);
      midiPlayer.on('trackWarping', handleTrackWarping);
      
      stopAmbient();
      
      return () => {
        midiPlayer.off('timeUpdate', handleTimeUpdate);
        midiPlayer.off('playlistChange', handlePlaylistChange);
        midiPlayer.off('trackWarping', handleTrackWarping);
        midiPlayer.stop();
        setIsMidiWarping(false);
      };
    } else {
      setMidiData({ time: 0, duration: 0, playlistIndex: -1, playlistLength: 0 });
      if (isClockMode) {
        // Stay silent even after MIDI mode exit
      }
    }
  }, [isMidiMode, isClockMode]);

  useEffect(() => {
    let int;
    if (isClockMode) {
      int = setInterval(() => setTime(new Date()), 1000);
      if (!isMidiMode) startAmbient();
    } else {
      stopAmbient();
      setGameStatus('idle');
      setScore(0);
      setLives(3);
      setBossData({ status: 'inactive', hp: 0, maxHp: 0, name: '' });
      setGalaxyLevel(0);
    }

    // Dispatch event to hide Navigation global
    window.dispatchEvent(new CustomEvent('gameModeChange', { detail: isClockMode }));

    return () => {
      clearInterval(int);
      stopAmbient();
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
        setIsMidiMode(false);
        setGameStatus('idle');
        setLogoClicks(0);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isClockMode) {
        setEasterEggActive(false);
        setIsClockMode(false);
        setIsMidiMode(false);
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

  // Disable scrolling on desktop when easter egg is active
  useEffect(() => {
    const preventDefault = (e) => {
      const keys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (keys.includes(e.key) || keys.includes(e.code)) {
        e.preventDefault();
      }
    };

    if (isClockMode && window.innerWidth >= 768) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', preventDefault, { passive: false });
    } else {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', preventDefault);
    }
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', preventDefault);
    };
  }, [isClockMode]);

  useEffect(() => {
    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 15000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetIdleTimer));

    resetIdleTimer();

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const handleShoot = () => {
    if (isMidiMode) return; // Disable shooting in MIDI mode
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

  const addScore = (points) => {
    setScore(prev => {
      const newScore = prev + points;
      // Extra life every 10,000 points
      if (Math.floor(newScore / 10000) > Math.floor(prev / 10000)) {
        setLives(l => l + 1);
        playSound('start'); // Positive feedback for extra life
      }
      return newScore;
    });
  };

  // Warp Transition Hook
  useEffect(() => {
    if (bossData.status === 'warning') {
      playSound('alarm');
    }
    if (bossData.status === 'defeated') {
      playSound('warp');
      const warpTimeout = setTimeout(() => {
        setGalaxyLevel(prev => (prev + 1) % galaxyColors.length);
        setBossData(prev => ({ ...prev, status: 'inactive', hp: 0, maxHp: 0 }));
      }, 4000);
      return () => clearTimeout(warpTimeout);
    }
  }, [bossData.status, galaxyColors.length]);

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
          isMidiMode={isMidiMode}
          isMidiWarping={isMidiWarping}
          midiData={midiData}
          time={time}
          gameStatus={gameStatus}
          score={score}
          lives={lives}
          bossData={bossData}
          setBossData={setBossData}
          galaxyColor={galaxyColors[galaxyLevel]}
          onHit={(points = 100, pos) => { 
            addScore(points); 
            playSound('laser', pos); 
            setTimeout(() => playSound('boom', pos), 50); 
          }}
          onMiss={handleMiss}
          onRetry={() => { setGameStatus('playing'); setScore(0); setLives(3); setBossData({ status: 'inactive', hp: 0, maxHp: 0, name: '' }); setGalaxyLevel(0); playSound('start'); }}
        />

        {/* Wolf Emblem Fading In */}
        <AnimatePresence mode="wait">
          {!isClockMode && (
            <motion.div
              key="wolf-emblem"
              className="absolute z-10 text-accent/15 w-[min(400px,90vw)] h-[min(400px,90vw)] md:w-[500px] md:h-[500px] flex items-center justify-center pointer-events-auto cursor-pointer tooltip-trigger left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
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
                <WolfLogo className="w-[72%] h-[72%]" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Typography */}
        <AnimatePresence>
          {!isClockMode && (
            <motion.div
              key="typography"
              className="relative z-20 flex flex-col items-center mt-[-20px] md:mt-[-30px] pointer-events-none px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 1.5, delay: 2 } }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.8 } }}
            >
              <h1 className="font-serif text-[clamp(3.5rem,12vw,9rem)] leading-[1.1] text-white mb-2 select-none tracking-tight">
                i am <span className="text-accent italic font-serif">rocketwolf</span>
              </h1>

              <motion.div layout className="flex items-center justify-center gap-2 md:gap-3 text-[clamp(1.2rem,4vw,2.4rem)] font-sans font-light text-white select-none h-[1.2em]">
                <motion.span layout>i speak</motion.span>
                <motion.div layout className="relative flex items-center justify-center">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={currentWord}
                      layout
                      className="font-serif italic text-[clamp(1.4rem,5vw,2.8rem)] leading-none whitespace-nowrap"
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
              className="absolute bottom-[calc(var(--safe-bottom)+2rem)] md:bottom-12 z-30 flex flex-col items-center gap-7 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 1.5, delay: 3.5 } }}
              exit={{ opacity: 0, y: 20, transition: { duration: 0.8 } }}
            >
              <motion.span
                className="font-sans text-[12px] tracking-[0.3em] font-medium text-white/50 select-none text-center transition-all duration-300 pointer-events-auto"
                layout
              >
                {isIdle ? "THERE MUST BE A GAME HERE SOMEWHERE..." : (easterEggActive ? "WHAT ARE YOU WAITING FOR?" : "GET TO KNOW HIM")}
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
          {isMidiMode && (
            <MidiPlayerUI isIdle={isIdle} />
          )}

          {isClockMode && !isMidiMode && gameStatus === 'playing' && (
            <motion.div
              className="absolute top-[calc(var(--safe-top)+1.5rem)] left-6 right-6 md:left-10 md:right-10 flex flex-col md:flex-row justify-between items-start md:items-center pointer-events-none z-30"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="font-serif text-[24px] md:text-[32px] text-white tracking-wide">
                score <span className="text-accent italic">{score}</span>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <motion.div
                    key={i}
                    className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-opacity duration-300 ${i <= lives ? 'bg-accent shadow-[0_0_10px_#ff3333] opacity-100' : 'bg-white/20 opacity-0 hidden'}`}
                    animate={i <= lives ? { scale: [1, 1.2, 1], transition: { repeat: Infinity, duration: 2, delay: i * 0.3 } } : { scale: 1 }}
                    style={{ display: i <= Math.max(3, lives) ? 'block' : 'none' }}
                  />
                ))}
                {lives > 10 && (
                  <div className="text-accent font-sans text-sm ml-2">+{lives - 10}</div>
                )}
              </div>
            </motion.div>
          )}

          {/* Boss Warning Screen */}
          {isClockMode && !isMidiMode && gameStatus === 'playing' && bossData.status === 'warning' && (
            <motion.div
              className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <h1 className="font-sans text-[30px] md:text-[50px] font-bold text-[#ff3333] tracking-[0.5em] uppercase">
                WARNING
              </h1>
              <p className="font-sans text-[12px] md:text-[16px] text-white/80 tracking-[0.3em] uppercase mt-4">
                Leviathan Class Incoming
              </p>
            </motion.div>
          )}

          {/* Mission Success Screen (Star Warp) */}
          {isClockMode && gameStatus === 'playing' && bossData.status === 'defeated' && (
            <motion.div
              className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="font-serif text-[40px] md:text-[70px] text-white tracking-wide">
                mission <span className="text-accent italic">success</span>
              </h1>
              <p className="font-sans text-[14px] md:text-[18px] text-white/70 tracking-[0.4em] uppercase mt-4 animate-pulse">
                entering new galaxy
              </p>
            </motion.div>
          )}

          {/* Boss Health Bar HUD */}
          {isClockMode && !isMidiMode && gameStatus === 'playing' && bossData.status === 'active' && (
            <motion.div
              className="absolute bottom-[calc(var(--safe-bottom)+2rem)] md:bottom-10 left-6 right-6 md:left-10 md:right-10 flex flex-col items-center pointer-events-none z-30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="w-full max-w-2xl bg-white/10 h-4 md:h-6 border border-white/30 overflow-hidden relative">
                <motion.div
                  className="absolute top-0 left-0 bottom-0 bg-accent shadow-[0_0_20px_#ff3333]"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(bossData.hp / bossData.maxHp) * 100}%` }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                />
              </div>
              <p className="font-sans text-[12px] md:text-[14px] text-white/50 tracking-[0.4em] uppercase mt-2">
                {bossData.name || "Asteroid Leviathan"}
              </p>
            </motion.div>
          )}

          {/* Game Over Screen */}
          {isClockMode && !isMidiMode && gameStatus === 'gameover' && (
            <motion.div
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setGameStatus('idle');
                setLogoClicks(0);
              }}
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
