import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import AchievementCard from './AchievementCard';
import './Achievements.css';

const achievements = [
  {
    id: 1,
    title: "AWS Cloud Clubs",
    role: "CAPTAIN",
    date: "2024-2025",
    icon: "Award", // Example PNG path
    iconSize: "w-16 h-16"
  },
  {
    id: 2,
    title: "Google Developer Groups on Campus",
    role: "GRAPHIC DESIGNER",
    date: "2023-2024",
    icon: "Award", // Use Lucide icon name as fallback
    iconSize: "w-20 h-20"
  },
  {
    id: 3,
    title: "Student Council of Information Technology and Computing",
    role: "PUBLIC INFORMATION OFFICER",
    date: "2023-2024",
    icon: "Award", // Example SVG path
    iconSize: "w-24 h-24"
  },
  {
    id: 4,
    title: "Hackathon Winner",
    role: "DEVELOPER",
    date: "2024",
    icon: "Award",
    iconSize: "w-20 h-20"
  }
];

export default function Achievements() {
  const [activeIndex, setActiveIndex] = useState(achievements.length);
  const [isHovered, setIsHovered] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const extendedAchievements = [...achievements, ...achievements, ...achievements];

  const nextSlide = () => {
    if (isMoving) return;
    setIsMoving(true);
    setActiveIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    if (isMoving) return;
    setIsMoving(true);
    setActiveIndex((prev) => prev - 1);
  };

  const handleAnimationComplete = () => {
    setIsMoving(false);
    // Reset to middle group for infinite loop effect
    if (activeIndex >= achievements.length * 2) {
      setActiveIndex(activeIndex - achievements.length);
    } else if (activeIndex < achievements.length) {
      setActiveIndex(activeIndex + achievements.length);
    }
  };

  return (
    <section
      id="achievements"
      className="bg-[#161616] relative w-full h-screen overflow-hidden flex flex-col items-center justify-center snap-start group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Red Glows (Optimized with CSS) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="achievement-glow glow-1" />
        <div className="achievement-glow glow-2" />
        <div className="achievement-glow glow-3" />
      </div>

      {/* Header Text */}
      <motion.p
        className="absolute top-[10%] font-serif italic text-[clamp(2.5rem,5vw,4.5rem)] text-white text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        tried. tested. trusted.
      </motion.p>

      {/* Carousel Container */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {/* Navigation Arrows */}
        <motion.div
          onClick={prevSlide}
          whileHover={{ x: -5 }}
          className="absolute left-4 md:left-12 z-20 w-14 h-14 rounded-full border border-white/60 flex items-center justify-center text-white transition-all duration-300 hover:bg-accent hover:border-accent opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </motion.div>

        <motion.div
          onClick={nextSlide}
          whileHover={{ x: 5 }}
          className="absolute right-4 md:right-12 z-20 w-14 h-14 rounded-full border border-white/60 flex items-center justify-center text-white transition-all duration-300 hover:bg-accent hover:border-accent opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto"
        >
          <ArrowRight className="w-5 h-5" strokeWidth={1.5} />
        </motion.div>

        {/* Carousel Content */}
        <div className="relative flex items-center w-full h-[500px] overflow-hidden">
          <motion.div
            className="flex gap-12 md:gap-32 items-center"
            animate={{
              x: `calc(50vw - (500px / 2) - (${activeIndex} * (500px + 8rem)))`
            }}
            onAnimationComplete={handleAnimationComplete}
            transition={isMoving ? { duration: 0.8, ease: [0.32, 0.72, 0, 1] } : { duration: 0 }}
            style={{ width: 'max-content' }}
          >
            {extendedAchievements.map((achievement, index) => (
              <AchievementCard
                key={`${achievement.id}-${index}`}
                achievement={achievement}
                isActive={index === activeIndex}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Pagination Indicators */}
      <div className="absolute bottom-[15%] flex gap-3 z-10">
        {achievements.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isMoving) setActiveIndex(index + achievements.length);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === (activeIndex % achievements.length) ? 'bg-accent w-8' : 'bg-white/20'}`}
          />
        ))}
      </div>
    </section>
  );
}
