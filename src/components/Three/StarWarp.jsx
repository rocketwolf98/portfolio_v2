import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function StarWarp({ active }) {
  const linesRef = useRef();

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 1500;
    const positions = new Float32Array(count * 6); // 1500 lines, 2 vertices per line (x,y,z)
    
    for (let i = 0; i < count; i++) {
       // Random position around a cylinder / loose sphere
       const r = Math.random() * 80 + 5;
       const theta = Math.random() * Math.PI * 2;
       
       const x = r * Math.cos(theta);
       const y = r * Math.sin(theta);
       const z = -200 - Math.random() * 100;
       
       // Vertex 1
       positions[i * 6] = x;
       positions[i * 6 + 1] = y;
       positions[i * 6 + 2] = z;
       
       // Vertex 2 (starts same)
       positions[i * 6 + 3] = x;
       positions[i * 6 + 4] = y;
       positions[i * 6 + 5] = z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const material = useMemo(() => new THREE.LineBasicMaterial({
     color: 0xffffff,
     transparent: true,
     opacity: 0,
     blending: THREE.AdditiveBlending
  }), []);

  useFrame((state, delta) => {
    if (!linesRef.current) return;
    const positions = linesRef.current.geometry.attributes.position.array;
    
    if (active) {
       material.opacity = THREE.MathUtils.lerp(material.opacity, 0.8, 0.05);
       for (let i = 0; i < 1500; i++) {
           const idx0 = i * 6; // start point
           const idx1 = i * 6 + 3; // end point stretching
           
           // Move both vertices forward in Z
           positions[idx0 + 2] += 80 * delta; 
           positions[idx1 + 2] += 250 * delta; // stretches fast!

           // If head passes camera (Z roughly > 20), reset
           if (positions[idx0 + 2] > 20 || positions[idx1 + 2] > 20) {
               const r = Math.random() * 80 + 5;
               const theta = Math.random() * Math.PI * 2;
               const x = r * Math.cos(theta);
               const y = r * Math.sin(theta);
               const z = -200;
               
               positions[idx0] = x;
               positions[idx0 + 1] = y;
               positions[idx0 + 2] = z;
               positions[idx1] = x;
               positions[idx1 + 1] = y;
               positions[idx1 + 2] = z;
           }
       }
       linesRef.current.geometry.attributes.position.needsUpdate = true;
    } else {
       material.opacity = THREE.MathUtils.lerp(material.opacity, 0, 0.1);
       // when fading out, just push them back slowly
       if (material.opacity > 0) {
         for (let i = 0; i < 1500; i++) {
           const idx0 = i * 6; 
           const idx1 = i * 6 + 3; 
           positions[idx0 + 2] += 20 * delta; 
           positions[idx1 + 2] += 100 * delta; 
         }
         linesRef.current.geometry.attributes.position.needsUpdate = true;
       }
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={lineGeometry} material={material} />
  );
}
