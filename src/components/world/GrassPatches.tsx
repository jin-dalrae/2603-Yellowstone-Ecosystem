import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fbm } from '@/lib/noise';
import { useSimulationStore, SEASON_INDEX } from '@/store/simulationStore';
import { getDamSites } from '@/lib/boids';

const GRASS_COUNT = 3000;
const SIZE = 200;
const MAX_HEIGHT = 28;
const DAM_EFFECT_RADIUS = 25;

function getHeight(x: number, z: number) {
  let h = fbm(x * 0.008, z * 0.008, 6) * MAX_HEIGHT;
  h += fbm(x * 0.02, z * 0.02, 4) * 5;
  const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
  const riverFactor = Math.max(0, 1 - riverDist / 15);
  h *= 1 - riverFactor * 0.6;
  const radial = Math.sqrt(x * x + z * z) / (SIZE * 0.5);
  const bowl = Math.pow(Math.min(radial, 1), 2.2) * 10;
  return Math.max(0.5, h) + bowl;
}

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function GrassPatches() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyRef = useRef(new THREE.Object3D());

  const { grassData, baseColors } = useMemo(() => {
    const grassData: { x: number; y: number; z: number; scale: number; rotY: number }[] = [];
    const baseColors: THREE.Color[] = [];
    const rng = mulberry(456);

    for (let i = 0; i < GRASS_COUNT * 2; i++) {
      const x = (rng() - 0.5) * SIZE * 0.9;
      const z = (rng() - 0.5) * SIZE * 0.9;
      const h = getHeight(x, z);
      if (h < 2 || h > 14) continue;
      const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
      if (riverDist < 4) continue;
      if (rng() > 0.5) continue;
      if (grassData.length >= GRASS_COUNT) break;

      const scale = 0.3 + rng() * 0.5;
      grassData.push({ x, y: h, z, scale, rotY: rng() * Math.PI * 2 });
      const g = 0.3 + rng() * 0.25;
      baseColors.push(new THREE.Color(0.15, g, 0.05));
    }
    return { grassData, baseColors };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(0.4, 1.2, 3);
    g.translate(0, 0.6, 0);
    return g;
  }, []);

  const initialized = useRef(false);

  useFrame(() => {
    if (!meshRef.current) return;
    const d = dummyRef.current;
    const damSites = getDamSites();
    const si = SEASON_INDEX[useSimulationStore.getState().season];

    if (!initialized.current) {
      grassData.forEach((p, i) => {
        d.position.set(p.x, p.y, p.z);
        d.scale.set(p.scale, p.scale, p.scale);
        d.rotation.y = p.rotY;
        d.updateMatrix();
        meshRef.current!.setMatrixAt(i, d.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      const colorAttr = new Float32Array(grassData.length * 3);
      grassData.forEach((_, i) => {
        colorAttr[i * 3] = baseColors[i].r;
        colorAttr[i * 3 + 1] = baseColors[i].g;
        colorAttr[i * 3 + 2] = baseColors[i].b;
      });
      meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colorAttr, 3);
      initialized.current = true;
    }

    const colors = meshRef.current.instanceColor;
    if (!colors) return;

    const hasDams = damSites.length > 0;

    for (let i = 0; i < grassData.length; i++) {
      const bg = baseColors[i].g;
      let r = baseColors[i].r, g = bg, b = baseColors[i].b;
      let scaleBoost = 1;

      // Dam proximity boost — riparian recovery
      if (hasDams) {
        let bestEffect = 0;
        const gx = grassData[i].x;
        const gz = grassData[i].z;
        for (const dam of damSites) {
          const dist = Math.hypot(gx - dam.x, gz - dam.z);
          if (dist < DAM_EFFECT_RADIUS) {
            const proximity = 1 - dist / DAM_EFFECT_RADIUS;
            const effect = proximity * dam.health;
            bestEffect = Math.max(bestEffect, effect);
          }
        }
        if (bestEffect > 0) {
          // Greener, lusher grass near dams
          g += bestEffect * 0.25;
          r -= bestEffect * 0.05;
          b -= bestEffect * 0.02;
          scaleBoost = 1 + bestEffect * 0.6; // taller grass
        }
      }

      // Seasonal color
      if (si === 0) { g += 0.15; }
      else if (si === 1) { g += 0.1; }
      else if (si === 2) { r += 0.2; g -= 0.05; }
      else { r += 0.15; g -= 0.1; b += 0.05; }

      colors.setXYZ(i, r, g, b);

      // Update scale if dam effect changed it
      if (scaleBoost > 1.01) {
        const p = grassData[i];
        d.position.set(p.x, p.y, p.z);
        d.scale.set(p.scale * scaleBoost, p.scale * scaleBoost, p.scale * scaleBoost);
        d.rotation.y = p.rotY;
        d.updateMatrix();
        meshRef.current!.setMatrixAt(i, d.matrix);
      }
    }
    colors.needsUpdate = true;
    if (hasDams) meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, undefined, grassData.length]}
      receiveShadow
    >
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  );
}
