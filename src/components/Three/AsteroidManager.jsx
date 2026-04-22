import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playSound } from '../../utils/audio';

export default function AsteroidManager({ gameStatus, score, bossData, setBossData, onHit, onMiss }) {
  const [asteroids, setAsteroids] = useState([]);
  const asteroidsRef = useRef([]);
  const lastSpawnRef = useRef(0);
  const playStateRef = useRef({ gameStatus, score, bossData });
  const bossesSpawned = useRef(0);
  const warningTimer = useRef(0);

  useEffect(() => {
    playStateRef.current = { gameStatus, score, bossData };
    if (gameStatus === 'idle' || gameStatus === 'gameover') {
      setAsteroids([]);
      asteroidsRef.current = [];
      lastSpawnRef.current = 0;
      bossesSpawned.current = 0;
      warningTimer.current = 0;
      setBossData?.({ status: 'inactive', hp: 0, maxHp: 0, name: '' });
    }
  }, [gameStatus, score, bossData, setBossData]);

  useFrame((state, delta) => {
    if (playStateRef.current.gameStatus === 'playing') {
      const currentScore = playStateRef.current.score;
      const hasBoss = asteroidsRef.current.some(a => a.isBoss && a.active);

      // Spawner logic
      if (!hasBoss) {
        if (playStateRef.current.bossData?.status !== 'warning' && playStateRef.current.bossData?.status !== 'defeated' && currentScore >= (bossesSpawned.current + 1) * 3000) {
          // ENTER WARNING PHASE
          bossesSpawned.current += 1;
          setBossData?.({ status: 'warning', hp: 0, maxHp: 0, name: '' });
          playSound('boom'); // Double boom for alarm
          setTimeout(() => playSound('boom'), 500); 
          warningTimer.current = 3.0; // 3 second delay
          
          // Clear standard asteroids
          asteroidsRef.current.forEach(a => a.active = false);
          setAsteroids([...asteroidsRef.current]);

        } else if (playStateRef.current.bossData?.status === 'warning') {
          // COUNTDOWN WARNING
          warningTimer.current -= delta;
          if (warningTimer.current <= 0) {
            // SPAWN BOSS
            const level = bossesSpawned.current;
            const maxHp = 10 + (level * 5); // scales HP
            const archangels = ["Michael", "Gabriel", "Raphael", "Uriel", "Selaphiel", "Jegudiel", "Barachiel", "Jeremiel"];
            const bossName = "Archangel " + archangels[Math.max(0, level - 1) % archangels.length];
            setBossData?.({ status: 'active', hp: maxHp, maxHp, name: bossName });
            
            const startX = (Math.random() - 0.5) * 60;
            const startY = (Math.random() - 0.5) * 60 + 5;
            const startZ = -180;
            const startPos = new THREE.Vector3(startX, startY, startZ);
            
            const targetX = (Math.random() - 0.5) * 4;
            const targetY = 5 + (Math.random() - 0.5) * 4;
            const targetZ = 15;
            const targetPos = new THREE.Vector3(targetX, targetY, targetZ);
            
            // Speed starts very slow but ramps up 10% per level
            const velocityMultiplier = 1 + (level * 0.1); 
            const velocity = targetPos.clone().sub(startPos).normalize().multiplyScalar(15 * velocityMultiplier);

            const bossAst = {
              id: 'boss-' + Date.now(),
              isBoss: true,
              position: startPos,
              velocity: velocity,
              rotationSpeed: new THREE.Vector3(0.5, 0.5, 0.5),
              scale: 4 + (level * 0.5), // massive
              active: true,
              hp: maxHp,
              maxHp: maxHp,
              isArmored: false,
              bossName: bossName
            };
            asteroidsRef.current = [...asteroidsRef.current, bossAst];
            setAsteroids(asteroidsRef.current);
          }
        } else if (playStateRef.current.bossData?.status !== 'defeated' && state.clock.elapsedTime - lastSpawnRef.current > 1.5) {
          // Spawn Normal Asteroids
        lastSpawnRef.current = state.clock.elapsedTime;
        const level = bossesSpawned.current;
        
        // Spawn roughly inside a cone visible to the camera
        const startX = (Math.random() - 0.5) * 60;
        const startY = (Math.random() - 0.5) * 60 + 5;
        const startZ = -150;

        const targetX = (Math.random() - 0.5) * 4;
        const targetY = 5 + (Math.random() - 0.5) * 4;
        const targetZ = 15;

        const startPos = new THREE.Vector3(startX, startY, startZ);
        const targetPos = new THREE.Vector3(targetX, targetY, targetZ);
        
        const velocityMultiplier = 1 + (level * 0.2); // Speed ramps up 20% per level
        const velocity = targetPos.clone().sub(startPos).normalize().multiplyScalar((Math.random() * 30 + 40) * velocityMultiplier);
        
        const armoredChance = level > 0 ? Math.min(0.5, level * 0.15) : 0;
        const isArmored = Math.random() < armoredChance;

        const newAsteroid = {
          id: Date.now() + Math.random(),
          isBoss: false,
          position: startPos,
          velocity: velocity,
          rotationSpeed: new THREE.Vector3(
            Math.random() * 2,
            Math.random() * 2,
            Math.random() * 2
          ),
          scale: Math.random() * 1.5 + 0.5,
          active: true,
          isArmored,
          hp: isArmored ? 2 : 1
        };
        
        asteroidsRef.current = [...asteroidsRef.current, newAsteroid];
        setAsteroids(asteroidsRef.current);
      }
      } // End of !hasBoss Spawner logic

      // Movement and Miss detection
      let needsUpdate = false;
      const currentAsteroids = [...asteroidsRef.current];

      for (let i = 0; i < currentAsteroids.length; i++) {
        const ast = currentAsteroids[i];
        if (!ast.active) continue;

        ast.position.addScaledVector(ast.velocity, delta);

        // Camera is at Z = 15. If asteroid passes Z = 15, it's a miss
        if (ast.position.z > 15) {
          ast.active = false;
          needsUpdate = true;
          onMiss?.();
        }
      }

      const filtered = currentAsteroids.filter(a => a.active || a.exploding);
      if (filtered.length !== currentAsteroids.length) {
        asteroidsRef.current = filtered;
        setAsteroids(filtered);
      }
    }
  });

  const handleHit = (id, e) => {
    e.stopPropagation();
    if (playStateRef.current.gameStatus !== 'playing') return;

    const currentAsteroids = [...asteroidsRef.current];
    const index = currentAsteroids.findIndex(a => a.id === id);
    if (index > -1 && currentAsteroids[index].active) {
      currentAsteroids[index].hp -= 1;
      currentAsteroids[index].hitCount = (currentAsteroids[index].hitCount || 0) + 1;

      if (currentAsteroids[index].isBoss) {
        setBossData?.({ status: 'active', name: currentAsteroids[index].bossName, hp: currentAsteroids[index].hp, maxHp: currentAsteroids[index].maxHp });
      }

      if (currentAsteroids[index].hp <= 0) {
        currentAsteroids[index].active = false;
        currentAsteroids[index].exploding = true;
        if (currentAsteroids[index].isBoss) {
          const defeatedState = { status: 'defeated', hp: 0, maxHp: 0, name: '' };
          setBossData?.(defeatedState);
          playStateRef.current.bossData = defeatedState; // Synchronous update to prevent spawning gap
          onHit?.(1000);
        } else {
          onHit?.(100);
        }
      } else {
        playSound('laser');
      }

      asteroidsRef.current = currentAsteroids;
      setAsteroids([...currentAsteroids]);
    }
  };

  return (
    <group>
      {asteroids.map(ast => (
        <Asteroid 
          key={ast.id} 
          data={ast} 
          onClick={(e) => handleHit(ast.id, e)} 
        />
      ))}
    </group>
  );
}

function Asteroid({ data, onClick }) {
  const meshRef = useRef();
  const fragmentsRef = useRef();
  const materialRef = useRef();
  const hitTimer = useRef(0);
  const lastHitCount = useRef(0);
  
  // Create randomized fragment data once
  const fragments = useRef(Array.from({ length: data.isBoss ? 20 : 8 }).map(() => ({
    velocity: new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15),
    rotationSpeed: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
    scale: Math.random() * (data.isBoss ? 1.0 : 0.4) + 0.2
  })));

  useFrame((state, delta) => {
    if (!data.exploding && meshRef.current) {
      meshRef.current.position.copy(data.position);
      meshRef.current.rotation.x += data.rotationSpeed.x * delta;
      meshRef.current.rotation.y += data.rotationSpeed.y * delta;
      meshRef.current.rotation.z += data.rotationSpeed.z * delta;

      // Hit flash feedback
      if (data.hitCount > lastHitCount.current) {
        hitTimer.current = 0.1;
        lastHitCount.current = data.hitCount;
        if (materialRef.current) materialRef.current.color.setHex(0xffffff);
      }
      
      if (hitTimer.current > 0) {
        hitTimer.current -= delta;
        if (hitTimer.current <= 0 && materialRef.current) {
          // Reset color
          materialRef.current.color.setHex(data.isBoss ? 0xff3333 : data.isArmored ? 0xffaa00 : 0xffffff);
        }
      }

    } else if (data.exploding && fragmentsRef.current) {
      fragmentsRef.current.position.copy(data.position);
      fragmentsRef.current.children.forEach((child, i) => {
        const fragData = fragments.current[i];
        child.position.addScaledVector(fragData.velocity, delta);
        child.rotation.x += fragData.rotationSpeed.x * delta;
        child.rotation.y += fragData.rotationSpeed.y * delta;
        child.material.opacity = Math.max(0, child.material.opacity - delta * 1.5);
      });
    }
  });

  const baseColor = data.isBoss ? "#ff3333" : data.isArmored ? "#ffaa00" : "#ffffff";

  return (
    <>
      {!data.exploding && (
        <mesh ref={meshRef} scale={data.scale} onClick={onClick} onPointerDown={onClick}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshBasicMaterial ref={materialRef} color={baseColor} wireframe={true} />
        </mesh>
      )}
      
      {data.exploding && (
        <group ref={fragmentsRef}>
          {fragments.current.map((frag, i) => (
            <mesh key={i} scale={frag.scale}>
              <dodecahedronGeometry args={[0.5, 0]} />
              <meshBasicMaterial color="#ff3333" wireframe={true} transparent opacity={1} />
            </mesh>
          ))}
        </group>
      )}
    </>
  );
}
