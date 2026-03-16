import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fbm } from '@/lib/noise';
import { useSimulationStore, SEASON_INDEX } from '@/store/simulationStore';

const TREE_COUNT = 1200;
const SIZE = 200;
const MAX_HEIGHT = 28;

function getHeight(x: number, z: number) {
  let h = fbm(x * 0.008, z * 0.008, 6) * MAX_HEIGHT;
  h += fbm(x * 0.02, z * 0.02, 4) * 5;
  const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
  const riverFactor = Math.max(0, 1 - riverDist / 15);
  h *= 1 - riverFactor * 0.6;
  const edgeDist = Math.max(Math.abs(x), Math.abs(z)) / (SIZE / 2);
  const edgeFalloff = 1 - Math.pow(Math.max(0, edgeDist - 0.6) / 0.4, 2);
  h *= edgeFalloff;
  return Math.max(0.5, h);
}

export function Vegetation() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorArrayRef = useRef<Float32Array | null>(null);

  const { positions, baseColors } = useMemo(() => {
    const positions: { x: number; y: number; z: number; scale: number }[] = [];
    const baseColors: THREE.Color[] = [];
    const rng = mulberry(123);

    for (let i = 0; i < TREE_COUNT * 3; i++) {
      const x = (rng() - 0.5) * SIZE * 0.9;
      const z = (rng() - 0.5) * SIZE * 0.9;
      const h = getHeight(x, z);

      // Trees grow in forest zone (h: 6-18), not in river
      const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
      if (h < 5 || h > 22 || riverDist < 5) continue;

      // Density varies by height
      const density = h > 7 && h < 16 ? 0.7 : 0.3;
      if (rng() > density) continue;

      if (positions.length >= TREE_COUNT) break;

      const scale = 0.6 + rng() * 1.2;
      positions.push({ x, y: h, z, scale });

      // Base tree color (will be modulated by season)
      const g = 0.15 + rng() * 0.15;
      baseColors.push(new THREE.Color(0.03, g, 0.02));
    }
    return { positions, baseColors };
  }, []);

  // Set up instance matrices and colors
  useMemo(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const colors = new Float32Array(positions.length * 3);

    positions.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.scale, p.scale * (1 + Math.random() * 0.5), p.scale);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      colors[i * 3] = baseColors[i].r;
      colors[i * 3 + 1] = baseColors[i].g;
      colors[i * 3 + 2] = baseColors[i].b;
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    colorArrayRef.current = colors;
  }, [positions, baseColors]);

  // Update colors per season
  useFrame(() => {
    if (!meshRef.current || !colorArrayRef.current) return;
    const si = SEASON_INDEX[useSimulationStore.getState().season];
    const colors = meshRef.current.instanceColor;
    if (!colors) return;

    for (let i = 0; i < positions.length; i++) {
      const br = baseColors[i].r;
      const bg = baseColors[i].g;
      const bb = baseColors[i].b;

      let r = br, g = bg, b = bb;

      if (si < 1) {
        // spring: vibrant green
        g = bg + 0.1;
      } else if (si < 2) {
        // summer: deep green
        r = br; g = bg; b = bb;
      } else if (si < 3) {
        // autumn: gold/orange
        const t = si - 2;
        r = br + t * 0.4;
        g = bg + t * 0.1;
        b = bb - t * 0.01;
      } else {
        // winter: muted/bare
        r = br + 0.2;
        g = bg + 0.05;
        b = bb + 0.1;
      }

      colors.setXYZ(i, r, g, b);
    }
    colors.needsUpdate = true;
  });

  const coneGeo = useMemo(() => new THREE.ConeGeometry(1.2, 4, 6), []);

  return (
    <instancedMesh
      ref={meshRef}
      args={[coneGeo, undefined, positions.length]}
      castShadow
      receiveShadow
    >
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  );
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
