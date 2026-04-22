import { motion } from 'framer-motion';
import HeroScene from './Three/HeroScene';
import DustClouds from './DustClouds';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 w-full h-[35vh] bg-black z-0 flex items-center justify-center overflow-hidden">
      <DustClouds />
      <HeroScene isClockMode={false} isFooter={true} />

      {/* Footer Content */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full h-full text-center px-4 py-8">

        {/* Let's Rock Together Text */}
        <h2 className="font-serif text-[clamp(3rem,10vw,7rem)] leading-none text-white select-none mb-6 tracking-tight text-center">
          let's <motion.span whileHover={{ scale: 1.05 }} className="inline-block transition-colors duration-300 hover:text-accent hover:italic cursor-pointer relative z-30 pointer-events-auto selection:bg-transparent">rock</motion.span> together
        </h2>

        {/* Footer Subtext */}
        <p className="mb-8 text-[10px] md:text-[12px] tracking-[0.25em] font-sans text-white/50 uppercase">
          Powered by tea, AI, and yapping skills
        </p>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[11px] md:text-[13px] tracking-[0.2em] font-sans font-medium text-white/80 pointer-events-auto relative z-30">
          <motion.a href="mailto:hernel.juanico@gmail.com" className="relative cursor-pointer transition-colors duration-300 hover:text-accent selection:bg-transparent" whileHover={{ scale: 1.05 }}>MAIL</motion.a>
          <div className="w-1.5 h-1.5 rounded-full bg-white/30 hidden sm:block" />
          <motion.a target="_blank" rel="noopener noreferrer" href="https://github.com/rocketwolf98" className="relative cursor-pointer transition-colors duration-300 hover:text-accent selection:bg-transparent" whileHover={{ scale: 1.05 }}>GITHUB</motion.a>
          <div className="w-1.5 h-1.5 rounded-full bg-white/30 hidden sm:block" />
          <motion.a target="_blank" rel="noopener noreferrer" href="https://rocketwolf98.github.io/porfolio-deeplearning/intro.html" className="relative cursor-pointer transition-colors duration-300 hover:text-accent selection:bg-transparent" whileHover={{ scale: 1.05 }}>NOTEBOOK</motion.a>
          <div className="w-1.5 h-1.5 rounded-full bg-white/30 hidden sm:block" />
          <motion.a target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/in/hernel-ni%C3%B1o-juanico-437582252/" className="relative cursor-pointer transition-colors duration-300 hover:text-accent selection:bg-transparent" whileHover={{ scale: 1.05 }}>LINKEDIN</motion.a>
          <div className="w-1.5 h-1.5 rounded-full bg-white/30 hidden sm:block" />
          <motion.a target="_blank" rel="noopener noreferrer" href="https://salsatechlabs.com/" className="relative cursor-pointer transition-colors duration-300 hover:text-accent selection:bg-transparent" whileHover={{ scale: 1.05 }}>SALSATECH</motion.a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
