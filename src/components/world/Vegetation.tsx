import { useMemo, useRef, useEffect } from 'react';
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

function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Vegetation() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { treeData, baseColors } = useMemo(() => {
    const treeData: { x: number; y: number; z: number; scale: number; rotY: number; scaleY: number }[] = [];
    const baseColors: THREE.Color[] = [];
    const rng = mulberry(123);

    for (let i = 0; i < TREE_COUNT * 3; i++) {
      const x = (rng() - 0.5) * SIZE * 0.9;
      const z = (rng() - 0.5) * SIZE * 0.9;
      const h = getHeight(x, z);
      const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
      if (h < 5 || h > 22 || riverDist < 5) continue;
      const density = h > 7 && h < 16 ? 0.7 : 0.3;
      if (rng() > density) continue;
      if (treeData.length >= TREE_COUNT) break;

      const scale = 0.6 + rng() * 1.2;
      treeData.push({ x, y: h, z, scale, rotY: rng() * Math.PI * 2, scaleY: 1 + rng() * 0.5 });
      const g = 0.15 + rng() * 0.15;
      baseColors.push(new THREE.Color(0.03, g, 0.02));
    }
    return { treeData, baseColors };
  }, []);

  const coneGeo = useMemo(() => new THREE.ConeGeometry(1.2, 4, 6), []);

  // Set instance matrices + initial colors after mount
  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const colorAttr = new Float32Array(treeData.length * 3);

    treeData.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.scale, p.scale * p.scaleY, p.scale);
      dummy.rotation.y = p.rotY;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);

      colorAttr[i * 3] = baseColors[i].r;
      colorAttr[i * 3 + 1] = baseColors[i].g;
      colorAttr[i * 3 + 2] = baseColors[i].b;
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colorAttr, 3);
  }, [treeData, baseColors]);

  // Update colors per season
  useFrame(() => {
    if (!meshRef.current?.instanceColor) return;
    const si = SEASON_INDEX[useSimulationStore.getState().season];
    const colors = meshRef.current.instanceColor;

    for (let i = 0; i < treeData.length; i++) {
      const br = baseColors[i].r;
      const bg = baseColors[i].g;
      const bb = baseColors[i].b;

      let r = br, g = bg, b = bb;

      if (si < 1) {
        g = bg + 0.1;
      } else if (si < 2) {
        // summer default
      } else if (si < 3) {
        const t = si - 2;
        r = br + t * 0.4;
        g = bg + t * 0.1;
        b = bb - t * 0.01;
      } else {
        r = br + 0.2;
        g = bg + 0.05;
        b = bb + 0.1;
      }

      colors.setXYZ(i, r, g, b);
    }
    colors.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[coneGeo, undefined, treeData.length]}
      castShadow
      receiveShadow
    >
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  );
}
