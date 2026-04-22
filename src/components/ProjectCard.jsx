import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const itemVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export default function ProjectCard({ project }) {
  return (
    <motion.div 
      variants={itemVariants}
      whileHover={{ y: -15, transition: { duration: 0.4, ease: "easeOut" } }}
      style={{ willChange: "transform" }}
      className="bg-[#0e0e0e] border border-white/60 w-full md:w-[380px] h-[450px] md:h-full shrink-0 overflow-hidden relative group cursor-pointer flex flex-col"
    >
      <div className="relative h-[200px] md:h-[45%] w-full border-b border-white/60 shrink-0 overflow-hidden">
        {/* Image Background */}
        <div className="absolute inset-0 bg-[#222] group-hover:scale-105 transition-transform duration-700 ease-out">
          {project.image ? (
            <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(19,19,19,0.8)] opacity-60 to-[rgba(19,19,19,0)] pointer-events-none" />
        
        {/* Year Badge */}
        <div className="absolute top-[14px] left-[16px] bg-[#ff5545] px-[8px] py-[1.5px]">
          <p className="font-sans font-bold text-[#5c0002] text-[12px] tracking-[1.8px] uppercase">
            {project.year || "2022"}
          </p>
        </div>
      </div>

      <div className="flex flex-col flex-grow p-[24px] pb-[32px] relative z-0">
        <div className="flex flex-col gap-[12px] md:gap-[16px] mb-auto">
          <div>
            <p className="font-sans font-bold text-[#ff5545] text-[12px] md:text-[14px] tracking-[3px] uppercase">
              {project.type || "Concept Study"}
            </p>
          </div>
          <div>
            <h3 className="font-serif text-[#e5e2e1] text-[32px] md:text-[44px] lg:text-[52px] tracking-[-1.5px] leading-none">
              {project.title || "Cyber Relic"}
            </h3>
          </div>
        </div>
        
        <p className="font-sans font-normal text-[rgba(231,189,183,0.8)] text-[15px] md:text-[17px] leading-[1.4] mt-6 line-clamp-3">
          {project.description || "An architectural exploration of neo-brutalist data centers and the erosion of digital memory."}
        </p>

        <div className="border-t border-[#ff5545]/40 mt-6 pt-[10px] flex items-center gap-[16px] opacity-40 shrink-0">
          {project.tech && project.tech.length > 0 ? (
            project.tech.map((TechIcon, idx) => (
              <div key={idx} className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/40 flex items-center justify-center overflow-hidden bg-white/5">
                {typeof TechIcon === 'string' ? (
                  TechIcon.includes(':') ? (
                    <Icon icon={TechIcon} width={16} height={16} className="text-white" />
                  ) : (
                    <img src={TechIcon} alt="tech icon" className="w-4 h-4 md:w-4 md:h-4 object-contain" />
                  )
                ) : (
                  <TechIcon size={16} />
                )}
              </div>
            ))
          ) : (
            <>
              {/* Fallback Icons if empty */}
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/40 flex items-center justify-center">
                <div className="w-3 h-3 md:w-4 md:h-4 bg-white/40 rounded-sm" />
              </div>
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/40 flex items-center justify-center">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-white/40" />
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
