import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import aboutVector from '../assets/about_vector.svg';

export default function About() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div 
      id="whoami"
      className="bg-[#161616] relative w-full h-screen overflow-hidden text-white flex flex-col justify-between pt-[calc(var(--safe-top)+5rem)] pb-[calc(var(--safe-bottom)+5rem)] px-6 md:px-[120px] group snap-start"
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

      {/* Background Graphic */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.2 }}
        transition={{ duration: 2, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <img alt="" className="absolute inset-0 w-full h-full object-cover" src={aboutVector} />
      </motion.div>

      {/* Header Text */}
      <motion.p 
        className="relative z-10 font-serif italic text-[clamp(3.5rem,15vw,7rem)] leading-[1.1] w-full md:w-[517px]"
        initial={{ x: -100, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        viewport={{ once: true, amount: 0.5 }}
      >
        whoami?
      </motion.p>

      {/* Caption & Arrow */}
      <motion.div 
        className="relative z-10 self-end flex flex-col items-end gap-[24px] w-full md:w-[900px]"
        initial={{ x: 100, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
        viewport={{ once: true, amount: 0.5 }}
      >
        <p className="font-sans font-normal text-[clamp(1.1rem,4.5vw,2.2rem)] text-right w-full min-w-full relative shrink-0">
          <span className="leading-[1.4]">Good design solves problems. Great design makes them invisible. </span>
          <span className="font-serif italic text-accent">rocketwolf</span>
          <span className="leading-[1.4]"> does the latter.</span>
        </p>
        <div className="content-stretch flex items-center relative shrink-0 pointer-events-auto">
          <motion.div
            className="w-14 h-14 rounded-full border border-white/60 flex items-center justify-center cursor-pointer text-white hover:bg-accent hover:border-accent transition-colors duration-300"
            whileHover={{ y: 5 }}
          >
            <ArrowDown className="w-5 h-5" strokeWidth={1.5} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
