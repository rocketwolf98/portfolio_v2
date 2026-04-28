import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Navigation from './components/Navigation'
import Hero from './components/Hero'
import About from './components/About'
import Achievements from './components/Achievements'
import Projects from './components/Projects'
import Graphics from './components/Graphics'
import Footer from './components/Footer'
import CustomCursor from './components/CustomCursor'

function App() {
  const { scrollYProgress } = useScroll()
  
  // Fade in black overlay when nearing the bottom of the page
  const overlayOpacity = useTransform(scrollYProgress, [0.9, 1], [0, 0.7])

  useEffect(() => {
    let keyBuffer = '';
    const handleKeyDown = (e) => {
      keyBuffer += e.key;
      // Keep only the last 2 characters
      if (keyBuffer.length > 2) {
        keyBuffer = keyBuffer.slice(-2);
      }
      
      if (keyBuffer === '67') {
        // Trigger slow, deliberate sway based on the meme reference
        document.body.animate([
          { transform: 'translate(0px, 0px) rotate(0deg)' },
          { transform: 'translate(-12px, 0px) rotate(-1deg)' },
          { transform: 'translate(12px, 0px) rotate(1deg)' },
          { transform: 'translate(-12px, 0px) rotate(-1deg)' },
          { transform: 'translate(12px, 0px) rotate(1deg)' },
          { transform: 'translate(0px, 0px) rotate(0deg)' }
        ], {
          duration: 1800, // Slower, rhythmic duration
          easing: 'ease-in-out'
        });
        window.dispatchEvent(new CustomEvent('trigger67'));
        keyBuffer = ''; // Reset after triggering
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-transparent cursor-none">
      <CustomCursor />
      <motion.main 
        className="relative w-full bg-black z-10 select-none shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-none"
      >
        <Navigation />
        <Hero />
        <About />
        <Achievements />
        <Projects />
        <Graphics />

        {/* Global Darkening Overlay - activated on scroll end */}
        <motion.div 
          className="absolute inset-0 bg-black pointer-events-none z-[100]"
          style={{ opacity: overlayOpacity }}
        />
      </motion.main>

      {/* Spacer for footer reveal to provide a scroll snap point */}
      <div id="footer" className="h-[35vh] w-full snap-end pointer-events-none" />

      <Footer />
    </div>
  )
}

export default App
