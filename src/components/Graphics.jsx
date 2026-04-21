import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useMotionTemplate } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import GraphicCard from './GraphicCard';

import img1 from '../assets/images/graphics/60df1091_original.png';
import img2 from '../assets/images/graphics/61f5a240_original.png';
import img3 from '../assets/images/graphics/8115eb0e_original.jpg';
import img4 from '../assets/images/graphics/f339973a_original.png';
import img5 from '../assets/images/graphics/graphics1.png';
import img6 from '../assets/images/graphics/graphics2.png';
import img7 from '../assets/images/graphics/poster1.png';
import img8 from '../assets/images/graphics/poster2.png';
import img9 from '../assets/images/graphics/unreleasedgdsc.png';

const placeholderGraphics = [
  { id: 1, image: img1 },
  { id: 2, image: img2 },
  { id: 3, image: img3 },
  { id: 4, image: img4 },
  { id: 5, image: img5 },
  { id: 6, image: img6 },
  { id: 7, image: img7 },
  { id: 8, image: img8 },
  { id: 9, image: img9 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.4
    }
  }
};

export default function Graphics() {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredCardId, setHoveredCardId] = useState(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const scrollByAmount = (amount) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div
      id="graphics"
      className="bg-[#161616] relative w-full h-screen text-white flex flex-col pt-16 md:pt-24 pb-8 overflow-hidden snap-start group"
      onMouseMove={handleMouseMove}
    >
      {/* Base Dotted Pattern (10% Opacity) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle, #ff5545 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Flashlight Dotted Pattern Overlay */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-500"
        style={{
          backgroundImage: 'radial-gradient(circle, #ff5545 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
          WebkitMaskImage: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`,
          maskImage: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`,
        }}
      />

      <div className="flex justify-between items-center px-10 md:px-[120px] mb-8 md:mb-12 shrink-0 relative z-10 pointer-events-none">
        <motion.p
          className="font-serif italic text-[72px] sm:text-[80px] md:text-[96px] leading-[normal]"
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          graphics
        </motion.p>

        {/* Navigation Arrows */}
        <div className="hidden md:flex gap-4 items-center pointer-events-auto">
          <AnimatePresence>
            {canScrollLeft && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ x: -5 }}
                className="w-14 h-14 rounded-full border border-white/60 flex items-center justify-center cursor-pointer hover:bg-accent hover:border-accent transition-colors duration-300"
                onClick={() => scrollByAmount(-400)}
              >
                <ArrowLeft className="w-5 h-5 text-white" strokeWidth={1.5} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {canScrollRight && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ x: 5 }}
                className="w-14 h-14 rounded-full border border-white/60 flex items-center justify-center cursor-pointer hover:bg-accent hover:border-accent transition-colors duration-300"
                onClick={() => scrollByAmount(400)}
              >
                <ArrowRight className="w-5 h-5 text-white" strokeWidth={1.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Horizontal scrolling container */}
      <motion.div
        ref={scrollRef}
        onScroll={handleScroll}
        layout
        className="flex flex-col md:flex-row flex-1 gap-[32px] overflow-y-auto md:overflow-y-hidden overflow-x-hidden md:overflow-x-auto py-8 px-6 md:px-[120px] [&::-webkit-scrollbar]:hidden shrink-0 relative z-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {placeholderGraphics.map((graphic) => (
          <GraphicCard
            key={graphic.id}
            graphic={graphic}
            isHovered={hoveredCardId === graphic.id}
            onHover={() => setHoveredCardId(graphic.id)}
            onUnhover={() => setHoveredCardId(null)}
            onClick={() => setHoveredCardId(hoveredCardId === graphic.id ? null : graphic.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}
