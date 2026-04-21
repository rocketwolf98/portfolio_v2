import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function AsteroidManager({ gameStatus, onHit, onMiss }) {
  const [asteroids, setAsteroids] = useState([]);
  const asteroidsRef = useRef([]);
  const lastSpawnRef = useRef(0);
  const playStateRef = useRef({ gameStatus });

  useEffect(() => {
    playStateRef.current = { gameStatus };
    if (gameStatus === 'idle' || gameStatus === 'gameover') {
      setAsteroids([]);
      asteroidsRef.current = [];
      lastSpawnRef.current = 0;
    }
  }, [gameStatus]);

  useFrame((state, delta) => {
    if (playStateRef.current.gameStatus === 'playing') {
      // Spawner logic
      if (state.clock.elapsedTime - lastSpawnRef.current > 1.5) {
        lastSpawnRef.current = state.clock.elapsedTime;
        
        // Spawn roughly inside a cone visible to the camera
        const startX = (Math.random() - 0.5) * 60;
        const startY = (Math.random() - 0.5) * 60 + 5;
        const startZ = -150;

        const targetX = (Math.random() - 0.5) * 4; // Tight cluster around X=0
        const targetY = 5 + (Math.random() - 0.5) * 4; // Tight cluster around Y=5
        const targetZ = 15; // Camera Z

        const startPos = new THREE.Vector3(startX, startY, startZ);
        const targetPos = new THREE.Vector3(targetX, targetY, targetZ);
        const velocity = targetPos.clone().sub(startPos).normalize().multiplyScalar(Math.random() * 30 + 40);
        
        const newAsteroid = {
          id: Date.now() + Math.random(),
          position: startPos,
          velocity: velocity,
          rotationSpeed: new THREE.Vector3(
            Math.random() * 2,
            Math.random() * 2,
            Math.random() * 2
          ),
          scale: Math.random() * 1.5 + 0.5,
          active: true
        };
        
        asteroidsRef.current = [...asteroidsRef.current, newAsteroid];
        setAsteroids(asteroidsRef.current);
      }

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
      currentAsteroids[index].active = false;
      currentAsteroids[index].exploding = true;
      asteroidsRef.current = currentAsteroids;
      setAsteroids(currentAsteroids);
      onHit?.();
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
  
  // Create randomized fragment data once
  const fragments = useRef(Array.from({ length: 8 }).map(() => ({
    velocity: new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15),
    rotationSpeed: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
    scale: Math.random() * 0.4 + 0.2
  })));

  useFrame((state, delta) => {
    if (!data.exploding && meshRef.current) {
      meshRef.current.position.copy(data.position);
      meshRef.current.rotation.x += data.rotationSpeed.x * delta;
      meshRef.current.rotation.y += data.rotationSpeed.y * delta;
      meshRef.current.rotation.z += data.rotationSpeed.z * delta;
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

  return (
    <>
      {!data.exploding && (
        <mesh ref={meshRef} scale={data.scale} onClick={onClick} onPointerDown={onClick}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#ffffff" wireframe={true} />
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
