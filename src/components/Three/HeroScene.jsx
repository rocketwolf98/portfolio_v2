import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import PlanetarySystem from './PlanetarySystem';
import * as THREE from 'three';

import AsteroidManager from './AsteroidManager';
import StarWarp from './StarWarp';

export default function HeroScene({ isClockMode, isFooter = false, time, gameStatus, score, lives, bossData, setBossData, galaxyColor = "#ff3333", onHit, onMiss, onRetry }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <motion.div 
      className={`absolute inset-0 z-0 ${isClockMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 3, ease: "easeOut", delay: isFooter ? 0.5 : 0 }}
    >
      <Canvas
        camera={{ position: [0, isFooter ? 0 : 0, 15], fov: 60 }}
        gl={{ antialias: false, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: "high-performance" }}
        dpr={isMobile ? [1, 1] : [1, 1.5]} // Capped at 1.5 to prevent massive lag on 4K/Retina displays
        performance={{ min: 0.5 }} // Dynamically drop resolution to 50% if FPS drops
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Normal Mode ambient dust/stars */}
        {!isClockMode && (
          <>
            <Stars 
              radius={50} 
              depth={50} 
              count={isMobile ? (isFooter ? 150 : 600) : (isFooter ? 500 : 2000)} 
              factor={isFooter ? 2 : 4} 
              saturation={0} 
              fade 
              speed={1} 
            />
            {!isFooter && <Sparkles count={isMobile ? 30 : 100} scale={20} size={2} speed={0.4} opacity={0.2} color={galaxyColor} />}
          </>
        )}

        {/* Easter Egg Stars & Vectors */}
        {isClockMode && (
          <>
            <Stars radius={100} depth={50} count={isMobile ? 1500 : 5000} factor={4} saturation={1} fade speed={2} />
            <StarWarp active={bossData?.status === 'defeated'} />
            <AsteroidManager gameStatus={gameStatus} score={score} bossData={bossData} setBossData={setBossData} onHit={onHit} onMiss={onMiss} />
          </>
        )}
        
        {/* Always render Planetary System (it handles its own transition) */}
        <PlanetarySystem isClockMode={isClockMode} time={time} isFooter={isFooter} color={galaxyColor} isWarping={bossData?.status === 'defeated'} />
        
        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={200} />
        </EffectComposer>
      </Canvas>
    </motion.div>
  );
}
