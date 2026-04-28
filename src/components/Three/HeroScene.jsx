import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { motion } from 'framer-motion';
import { Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import PlanetarySystem from './PlanetarySystem';
import * as THREE from 'three';
import { useEffect, useRef } from 'react';

import AsteroidManager from './AsteroidManager';
import StarWarp from './StarWarp';
import { getAnalyser } from '../../utils/audio';

function VisualizerStars({ isMidiMode, isMobile, isWarping }) {
  const groupRef = useRef();
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  // Tracks current rotation speed — lerped up on warp, bled back down after
  const driftSpeedRef = useRef(0.018);

  useEffect(() => {
    if (isMidiMode) {
      getAnalyser().then(analyser => {
        if (analyser) {
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        }
      });
    }
  }, [isMidiMode]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Ramp up fast on warp, bleed back slowly — asymmetric lerp for acceleration feel
    const targetSpeed = isWarping ? 3.5 : 0.018;
    const lerpFactor = isWarping ? 0.04 : 0.008;
    driftSpeedRef.current += (targetSpeed - driftSpeedRef.current) * lerpFactor;

    // Apply ramped drift + gentle pitch undulation
    groupRef.current.rotation.y += delta * driftSpeedRef.current;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.07) * 0.04;

    if (isMidiMode && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      // Average the lower frequencies for bass pulse
      let sum = 0;
      for (let i = 0; i < 10; i++) sum += dataArrayRef.current[i];
      const avg = sum / 10;

      // Scale from 1 to 1.3 based on bass
      const scale = 1 + (avg / 255) * 0.3;
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.2);
    } else {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      <Stars radius={100} depth={50} count={isMobile ? 1500 : 5000} factor={4} saturation={1} fade speed={2} />
    </group>
  );
}

export default function HeroScene({ isClockMode, isMidiMode, isMidiWarping, midiData, isFooter = false, time, gameStatus, score, lives, bossData, setBossData, galaxyColor = "#ff3333", onHit, onMiss, onRetry }) {
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
        dpr={isMobile ? [1, 1] : [1, 1.2]} // Capped at 1.2 to ensure 60fps on 4K/Retina displays
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
            <VisualizerStars isMidiMode={isMidiMode} isMobile={isMobile} isWarping={bossData?.status === 'defeated' || isMidiWarping} />
            <StarWarp active={bossData?.status === 'defeated' || isMidiWarping} />
            {!isMidiMode && <LaserManager gameStatus={gameStatus} />}
            <AsteroidManager 
              gameStatus={gameStatus} 
              score={score} 
              bossData={bossData} 
              setBossData={setBossData} 
              onHit={isMidiMode ? (points, pos) => { playSound('laser', pos); setTimeout(() => playSound('boom', pos), 50); } : onHit} 
              onMiss={isMidiMode ? null : onMiss}
              isAmbient={isMidiMode} 
              isWarping={bossData?.status === 'defeated' || isMidiWarping}
            />
          </>
        )}
        
        {/* Always render Planetary System (it handles its own transition) */}
        <PlanetarySystem isClockMode={isClockMode} isMidiMode={isMidiMode} midiData={midiData} time={time} isFooter={isFooter} color={galaxyColor} isWarping={bossData?.status === 'defeated' || isMidiWarping} />
        
        <EffectComposer multisampling={0} disableNormalPass>
          <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={200} />
        </EffectComposer>
      </Canvas>
    </motion.div>
  );
}

function LaserManager({ gameStatus }) {
  const { camera, mouse } = useThree();
  const bullets = useRef(Array.from({ length: 15 }).map(() => ({
    mesh: null,
    active: false,
    velocity: new THREE.Vector3()
  })));

  useEffect(() => {
    const handleFire = () => {
      if (gameStatus !== 'playing') return;
      const bullet = bullets.current.find(b => !b.active);
      if (bullet && bullet.mesh) {
        bullet.active = true;
        bullet.mesh.visible = true;
        
        // Shoot from camera towards unprojected mouse click
        const dir = new THREE.Vector3(mouse.x, mouse.y, -1).unproject(camera).sub(camera.position).normalize();
        bullet.mesh.position.copy(camera.position).add(dir.clone().multiplyScalar(2));
        bullet.velocity.copy(dir).multiplyScalar(200); // 200 units/sec laser
        
        bullet.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      }
    };
    
    // Bind to pointerdown to capture all clicks
    window.addEventListener('pointerdown', handleFire);
    return () => window.removeEventListener('pointerdown', handleFire);
  }, [camera, mouse, gameStatus]);

  useFrame((state, delta) => {
    bullets.current.forEach(b => {
      if (b.active && b.mesh) {
        b.mesh.position.addScaledVector(b.velocity, delta);
        if (b.mesh.position.z < -200 || b.mesh.position.z > 20) {
          b.active = false;
          b.mesh.visible = false;
        }
      }
    });
  });

  return (
    <group>
      {bullets.current.map((b, i) => (
        <mesh key={i} ref={(m) => (b.mesh = m)} visible={false}>
          <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
