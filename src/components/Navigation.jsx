import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const navItems = ["rocketwolf", "whoami", "projects", "graphics", "let's rock"];

export default function Navigation() {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGameMode, setIsGameMode] = useState(false);

  const handleScroll = (id) => {
    const elementId = id === "let's rock" ? "footer" : id;
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleGesture();
    };

    const handleGesture = () => {
      const deltaX = touchEndX - touchStartX;
      const deltaY = Math.abs(touchEndY - touchStartY);
      
      // Must be a clear horizontal swipe (not mostly scrolling vertically)
      if (deltaY < 50) {
        if (deltaX > 50) { // Swiped right
          setIsMobileMenuOpen(true);
        } else if (deltaX < -50) { // Swiped left
          setIsMobileMenuOpen(false);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const handleGameMode = (e) => setIsGameMode(e.detail);
    window.addEventListener('gameModeChange', handleGameMode);
    return () => window.removeEventListener('gameModeChange', handleGameMode);
  }, []);

  if (isGameMode) return null;

  return (
    <>
      <motion.nav 
        className="hidden md:flex fixed top-0 right-0 left-0 z-[999] h-[100px] pt-8 justify-center items-start pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : -20 }}
        transition={{ duration: 0.3 }}
      >
        <ul className="flex items-center gap-12 font-sans tracking-wide text-base text-white/50">
          {navItems.map((item, index) => (
            <motion.li 
              key={index} 
              className="relative cursor-pointer transition-colors duration-300 hover:text-accent selection:bg-transparent"
              whileHover={{ scale: 1.05 }}
              onClick={() => handleScroll(item)}
            >
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-[#1a1a1a]/80 backdrop-blur-xl flex flex-col justify-center px-10 md:hidden pointer-events-auto"
          >
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-8 left-8 text-white/50 hover:text-white transition-colors p-2"
            >
              <X size={32} strokeWidth={1} />
            </button>
            <ul className="flex flex-col items-start gap-4 font-sans text-[12vw] font-light tracking-tight text-white/90">
              {navItems.map((item, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="cursor-pointer hover:text-accent transition-colors"
                  onClick={() => handleScroll(item)}
                >
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
