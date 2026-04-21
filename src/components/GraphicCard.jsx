import { useState } from 'react';
import { motion } from 'framer-motion';

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

export default function GraphicCard({ graphic, isHovered, onHover, onUnhover, onClick }) {
  const [aspectRatio, setAspectRatio] = useState(1);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <motion.div
      layout
      variants={itemVariants}
      onMouseEnter={onHover}
      onMouseLeave={() => {
        if (!isMobile) onUnhover();
      }}
      onClick={onClick}
      transition={{ 
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.5 }
      }}
      className="bg-[#0e0e0e] md:h-full shrink-0 overflow-hidden relative cursor-pointer group"
      style={{
        width: isMobile ? '100%' : (isHovered ? 'auto' : '200px'),
        height: isMobile ? (isHovered ? 'auto' : '120px') : '100%',
        aspectRatio: isHovered ? `${aspectRatio}` : 'auto',
      }}
    >
      <img
        src={graphic.image}
        alt={`Graphic ${graphic.id}`}
        onLoad={handleImageLoad}
        className={`w-full h-full object-cover transition-all duration-700 ease-out ${isHovered ? 'scale-100' : 'scale-110 grayscale opacity-40 group-hover:opacity-60'}`}
      />
      
    </motion.div>
  );
}
