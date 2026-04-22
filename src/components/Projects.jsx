import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import ProjectCard from './ProjectCard';
import trailmap from '../assets/images/trailmap.png';
import gotyme from '../assets/images/gotyme.png';
import iwant from '../assets/images/iwant.png';
import refuchsia from '../assets/images/refuchsia.png';
import bluebox from '../assets/images/bluebox.png';
import handbook from '../assets/images/hb_chatbot.png';
import raver from '../assets/images/raver.png';
import intreeligent from '../assets/images/intreel.png';
import devcon from '../assets/images/DEVCONPLUS.png';

const placeholderProjects = [
  {
    id: 1,
    year: "2026",
    title: "DEVCON PLUS",
    type: "Web Application",
    description: "Powered with Claude Code, DEVCON Plus is an all-in-one platform for the DEVCON community for events.",
    image: devcon,
    tech: ["simple-icons:react", "simple-icons:nodedotjs", "simple-icons:supabase", "simple-icons:claude"]
  },
  {
    id: 2,
    year: "2025",
    title: "RAVER",
    type: "Machine Learning",
    description: "RAVER is a simple machine learning model that can predict human expressions using sight and sound.",
    image: raver,
    tech: ["simple-icons:python", "simple-icons:pytorch", "simple-icons:opencv"]
  },
  {
    id: 3,
    year: "2025",
    title: "Intreelligent",
    type: "Machine Learning",
    description: "Intreeligent is an experimental Machine Learning model that predicts tree kinds using latent features.",
    image: intreeligent,
    tech: ["simple-icons:python", "simple-icons:pytorch", "simple-icons:roboflow", "simple-icons:claude"]
  },
  {
    id: 4,
    year: "2025",
    title: "Handbook Chatbot",
    type: "AI",
    description: "A chatbot powered with Gemini and RAG utilizing the student handbook intended for question and answers.",
    image: handbook,
    tech: ["simple-icons:googlegemini", "simple-icons:googlecloud", "simple-icons:python"]
  },
  {
    id: 5,
    year: "2023",
    title: "TrailMap",
    type: "UI Designer",
    description: "A web application initiated by GDG on Campus - USTP for navigating the university.",
    image: trailmap,
    tech: ["simple-icons:figma"]
  },
  {
    id: 6,
    year: "2024",
    title: "GoTyme Facelift",
    type: "UI Concept",
    description: "Facelift concept of the GoTyme Banking App.",
    image: gotyme,
    tech: ["simple-icons:figma"]
  },
  {
    id: 7,
    year: "2024",
    title: "iWant Concept",
    type: "UI Concept",
    description: "Facelift concept of the iWant Streaming App.",
    image: iwant,
    tech: ["simple-icons:figma"]
  },
  {
    id: 8,
    year: "2023",
    title: "ReFuchsia",
    type: "UI Concept",
    description: "A concept design language inspired by Material You and early Google Fuchsia OS.",
    image: refuchsia,
    tech: ["simple-icons:figma"]
  },
  {
    id: 9,
    year: "2022",
    title: "BlueBox",
    type: "Capstone Project",
    description: "First foray into Figma, a learning management mobile app.",
    image: bluebox,
    tech: ["simple-icons:figma"]
  },
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

export default function Projects() {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
      id="projects"
      className="bg-[#161616] relative w-full h-screen text-white flex flex-col pt-[calc(var(--safe-top)+4rem)] pb-[calc(var(--safe-bottom)+2rem)] overflow-hidden snap-start"
    >
      <div className="flex justify-between items-center px-6 md:px-[120px] mb-8 md:mb-12 shrink-0">
        <motion.p
          className="font-serif italic text-[clamp(3.5rem,14vw,7rem)] leading-[1.1]"
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          projects
        </motion.p>

        {/* Navigation Arrows */}
        <div className="hidden md:flex gap-4 items-center">
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
        className="flex flex-col md:flex-row flex-1 gap-[32px] overflow-y-auto md:overflow-y-hidden overflow-x-hidden md:overflow-x-auto py-4 px-6 md:px-[120px] [&::-webkit-scrollbar]:hidden shrink-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {placeholderProjects.map((proj) => (
          <ProjectCard key={proj.id} project={proj} />
        ))}
      </motion.div>
    </div>
  );
}
