import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function PlanetarySystem({ isClockMode, isFooter }) {
  const groupRef = useRef();
  const { mouse, viewport } = useThree();

  // Settings
  const glowRed = '#ff3333';

  // We have 3 rings (or orbits) for Hero, 2 huge rings for Footer
  const orbits = useMemo(() => {
    if (isFooter) {
      return [
        { distance: 35, speed: 0.1, planetRadius: 0.35 },
        { distance: 55, speed: 0.08, planetRadius: 0.3 }
      ];
    }
    return [
      { distance: 8, speed: 0.15, planetRadius: 0.25 },
      { distance: 16, speed: 0.1, planetRadius: 0.35 },
      { distance: 24, speed: 0.08, planetRadius: 0.3 }
    ];
  }, [isFooter]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      if (!isClockMode) {
        // Normal mode: flat perspective, scale to original sizes
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.05);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05);
        
        groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);
      } else {
        // Clock mode: transition to orbital system, tilt significantly, rotate automatically
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -Math.PI / 4, 0.02);
        groupRef.current.rotation.y += delta * 0.1; 
        
        // Scale appropriately for 3D viewing
        const targetScale = viewport.width > 20 ? 1 : (viewport.width < 10 ? 0.4 : 0.8); 
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.02);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {orbits.map((orbit, i) => (
        <OrbitSystem 
          key={i} 
          index={i}
          distance={orbit.distance} 
          speed={orbit.speed} 
          planetRadius={orbit.planetRadius} 
          isClockMode={isClockMode} 
          color={glowRed}
        />
      ))}
    </group>
  );
}

function OrbitSystem({ index, distance, speed, planetRadius, isClockMode, color }) {
  const planetRef = useRef();
  const ringRef = useRef();
  const groupRef = useRef();
  const materialRef = useRef();
  const { mouse } = useThree();

  const orbitCurve = useMemo(() => {
    const curve = new THREE.EllipseCurve(
      0, 0,
      distance, distance,
      0, 2 * Math.PI,
      false, 0
    );
    const points = curve.getPoints(64);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [distance]);

  useFrame((state, delta) => {
    // Reveal planet in clock mode
    if (planetRef.current) {
      if (isClockMode) {
        planetRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.03);
      } else {
        planetRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), 0.1);
      }

      // Revolve planet slowly
      let angle = state.clock.elapsedTime * speed;
      planetRef.current.position.x = Math.cos(angle) * distance;
      planetRef.current.position.y = Math.sin(angle) * distance;
    }
    
    // Animate Ring Group Base
    if (groupRef.current) {
      if (!isClockMode) {
        // Parallax Effect (dynamically reacts to cursor)
        // Further rings move more to increase depth effect
        const parallaxStrength = (index + 1) * 0.5;
        const targetX = (mouse.x * parallaxStrength);
        const targetY = (mouse.y * parallaxStrength);
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);
        
        // Pulsing scale effect
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 - index) * 0.02;
        groupRef.current.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), 0.1);
      } else {
        // Reset local position/scale during Clock Mode
        groupRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 0.05);
        groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05);
      }
    }

    // Material rippling (opacity change based on time + offset)
    if (materialRef.current) {
      if (!isClockMode) {
        // Sine wave offset by index for a rippling effect
        const opacityPulse = 0.15 + (Math.sin(state.clock.elapsedTime * 1.5 - index * 1.5) * 0.1);
        materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, opacityPulse, 0.1);
      } else {
        materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, 0.4, 0.05);
      }
    }
  });

  return (
    <group ref={groupRef} scale={0}>
      {/* 3D Orbit Ring */}
      <line ref={ringRef} geometry={orbitCurve}>
        <lineBasicMaterial 
          ref={materialRef}
          color={isClockMode ? color : "#ffffff"} 
          transparent 
          opacity={0.2} 
          toneMapped={false} 
        />
      </line>

      {/* Planet */}
      <group ref={planetRef} scale={0.001}>
        <mesh>
          <sphereGeometry args={[planetRadius, 32, 32]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color}
            emissiveIntensity={2} 
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
