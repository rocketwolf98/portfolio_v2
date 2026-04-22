import { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence, useAnimationControls } from 'framer-motion';

const CustomCursor = () => {
  const [isClicking, setIsClicking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isEasterEggPlaying, setIsEasterEggPlaying] = useState(false);

  const controls = useAnimationControls();
  const innerControls = useAnimationControls();
  const outerControls = useAnimationControls();
  const timerRef = useRef(null);
  const idleTimerRef = useRef(null);

  // We use useMotionValue for performance and direct value injection
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Spring handles the smooth trailing effect
  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    // Simulate loading for the loading icon transition
    const handleLoad = () => {
      setTimeout(() => setIsLoading(false), 1200);
    };

    if (document.readyState === 'complete') {
      setTimeout(() => setIsLoading(false), 1200); 
    } else {
      window.addEventListener('load', handleLoad);
      const fallback = setTimeout(() => setIsLoading(false), 2500);
      return () => {
        window.removeEventListener('load', handleLoad);
        clearTimeout(fallback);
      };
    }
  }, []);

  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
    };

    const updateMousePosition = (e) => {
      if (!isVisible) setIsVisible(true);
      resetIdleTimer();
      cursorX.set(e.clientX - 28); // Center offset for 56x56px cursor wrapper
      cursorY.set(e.clientY - 28);
    };

    const handleMouseDown = () => {
      resetIdleTimer();
      // Don't interrupt if the easter egg is currently playing
      if (isEasterEggPlaying) return;
      
      setIsClicking(true);
      
      // Start the 6.5s timer for the easter egg
      timerRef.current = setTimeout(async () => {
        setIsEasterEggPlaying(true);
        setIsClicking(false); // Stop the shrinking effect

        // Step 1: Shake
        controls.start({
          x: [0, -8, 8, -8, 8, -8, 8, -8, 8, 0],
          y: [0, 6, -6, 6, -6, -6, 6, -6, 6, 0],
          rotate: [0, -15, 15, -15, 15, -15, 15, 0],
          transition: { duration: 0.6, ease: 'linear' }
        });

        // Step 2: About to explode - turn Red
        await new Promise(resolve => setTimeout(resolve, 400));
        innerControls.start({ backgroundColor: "#ff0000", transition: { duration: 0.2 } });
        outerControls.start({ borderColor: "#ff0000", transition: { duration: 0.2 } });
        
        await new Promise(resolve => setTimeout(resolve, 200));

        // Step 3: Pop out / Explode
        await controls.start({
          scale: [1, 2.5, 0],
          opacity: [1, 0.8, 0],
          transition: { duration: 0.3, times: [0, 0.5, 1] }
        });

        // Step 4: 1 second delay before returning
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 5: Reset colors and return smoothly with ease
        innerControls.set({ backgroundColor: "#d1d1d1" });
        outerControls.set({ borderColor: "#888888" });
        // Start small and invisible for the ease in
        controls.set({ x: 0, y: 0, rotate: 0, scale: 0.3, opacity: 0 });

        await controls.start({
          scale: 1,
          opacity: 1,
          transition: { type: 'spring', damping: 20, stiffness: 300, duration: 0.5 }
        });

        setIsEasterEggPlaying(false);
      }, 6500); 
    };

    const handleMouseUp = () => {
      resetIdleTimer();
      setIsClicking(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    
    // hide cursor when leaving window
    const handleMouseLeave = () => {
      setIsVisible(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
    const handleMouseEnter = () => {
      setIsVisible(true);
      resetIdleTimer();
    };

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [cursorX, cursorY, isVisible, isEasterEggPlaying, controls, innerControls, outerControls]);

  return (
    <motion.div
      className="hidden md:flex fixed top-0 left-0 pointer-events-none z-[9999] items-center justify-center mix-blend-difference"
      style={{
        width: 56,
        height: 56,
        x: cursorXSpring,
        y: cursorYSpring,
      }}
      animate={{
        scale: (isClicking && !isEasterEggPlaying) ? 0.75 : 1, // Normal click shrink
        opacity: isVisible ? 1 : 0
      }}
      transition={{
        scale: { type: 'spring', stiffness: 400, damping: 25 },
        opacity: { duration: 0.5, ease: "easeInOut" }
      }}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="relative flex items-center justify-center w-full h-full"
          >
            <motion.div 
              className="absolute inset-0 rounded-full border-[1.5px] border-transparent border-b-[#d1d1d1]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
            />
            <div className="w-2.5 h-2.5 rounded-full bg-[#d1d1d1]" />
          </motion.div>
        ) : (
          <motion.div
            key="normal"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative flex items-center justify-center w-full h-full"
          >
            {/* The inner motion.div handles the easter egg animations */}
            <motion.div
              animate={controls}
              className="relative flex items-center justify-center w-full h-full"
            >
              {/* Outer thin ring */}
              <motion.div 
                animate={outerControls}
                initial={{ borderColor: "#888888" }}
                className="absolute inset-0 rounded-full border-[1.5px] opacity-80" 
              />
              {/* Inner solid circle (larger proportion to match screenshot) */}
              <motion.div 
                animate={innerControls}
                initial={{ backgroundColor: "#d1d1d1" }}
                className="w-8 h-8 rounded-full" 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CustomCursor;
