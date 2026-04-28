import { memo } from 'react';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

const AchievementCard = memo(({ achievement, isActive }) => {
  const isImageUrl = achievement.icon && (achievement.icon.includes('.') || achievement.icon.startsWith('/'));

  return (
    <motion.div
      className={`flex flex-col items-center text-center gap-8 w-[500px] shrink-0 transition-all duration-700 ${isActive ? 'opacity-100 scale-100' : 'opacity-30 scale-90 grayscale'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isActive ? 1 : 0.3, y: 0, scale: isActive ? 1 : 0.9 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Icon Wrapper */}
      <div className={`relative shrink-0 flex items-center justify-center ${achievement.iconSize || 'w-24 h-24 md:w-32 md:h-32'}`}>
        {isImageUrl ? (
          <img 
            src={achievement.icon} 
            alt={achievement.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <Award 
            className="w-full h-full text-white" 
            strokeWidth={1}
          />
        )}
      </div>

      {/* Text Details */}
      <div className="flex flex-col gap-2 items-center leading-normal">
        <div className="flex flex-col items-center gap-1">
          <p className="font-sans font-bold text-[clamp(0.9rem,2vw,1.4rem)] tracking-[0.15em] text-white/80 uppercase">
            {achievement.role}
          </p>
          <h3 className="font-serif text-[clamp(1.8rem,4vw,3rem)] text-white line-clamp-2 overflow-hidden h-[2.4em] leading-[1.2]">
            {achievement.title}
          </h3>
        </div>
        <p className="font-sans font-normal text-[clamp(0.9rem,1.8vw,1.3rem)] text-white/50 tracking-[0.05em]">
          {achievement.date}
        </p>
      </div>
    </motion.div>
  );
});

export default AchievementCard;
