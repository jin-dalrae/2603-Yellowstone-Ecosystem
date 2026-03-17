import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fbm } from '@/lib/noise';
import { useSimulationStore, SEASON_INDEX } from '@/store/simulationStore';
import { useAgentStore } from '@/store/agentStore';
import { getRiparianTreeHealth } from '@/lib/riparianState';

const TREE_COUNT = 200;
const SAPLING_SLOTS = 150; // extra slots for dynamic regrowth
const SIZE = 200;
const MAX_HEIGHT = 28;

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

/** Low-poly tree: trunk (cylinder) + canopy (cone or sphere layers) */
function createTreeGeo(variant: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Trunk
  const trunk = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 5);
  trunk.translate(0, 0.75, 0);
  // Color trunk brown
  const trunkColors = new Float32Array(trunk.attributes.position.count * 3);
  for (let i = 0; i < trunk.attributes.position.count; i++) {
    trunkColors[i * 3] = 0.3;
    trunkColors[i * 3 + 1] = 0.2;
    trunkColors[i * 3 + 2] = 0.1;
  }
  trunk.setAttribute('color', new THREE.BufferAttribute(trunkColors, 3));
  parts.push(trunk);

  if (variant < 0.4) {
    // Conifer — stacked cones
    for (let layer = 0; layer < 3; layer++) {
      const r = 1.2 - layer * 0.3;
      const h = 1.5 - layer * 0.3;
      const y = 1.5 + layer * 0.9;
      const cone = new THREE.ConeGeometry(r, h, 6);
      cone.translate(0, y, 0);
      const coneColors = new Float32Array(cone.attributes.position.count * 3);
      for (let i = 0; i < cone.attributes.position.count; i++) {
        coneColors[i * 3] = 0.04;
        coneColors[i * 3 + 1] = 0.22 + layer * 0.03;
        coneColors[i * 3 + 2] = 0.03;
      }
      cone.setAttribute('color', new THREE.BufferAttribute(coneColors, 3));
      parts.push(cone);
    }
  } else if (variant < 0.7) {
    // Deciduous — rounded sphere canopy
    const canopy = new THREE.SphereGeometry(1.3, 6, 4);
    canopy.translate(0, 2.8, 0);
    canopy.scale(1, 0.8, 1);
    const canopyColors = new Float32Array(canopy.attributes.position.count * 3);
    for (let i = 0; i < canopy.attributes.position.count; i++) {
      canopyColors[i * 3] = 0.05;
      canopyColors[i * 3 + 1] = 0.28;
      canopyColors[i * 3 + 2] = 0.04;
    }
    canopy.setAttribute('color', new THREE.BufferAttribute(canopyColors, 3));
    parts.push(canopy);
  } else {
    // Aspen/birch — tall narrow canopy
    const canopy = new THREE.ConeGeometry(0.8, 2.5, 5);
    canopy.translate(0, 2.8, 0);
    const canopyColors = new Float32Array(canopy.attributes.position.count * 3);
    for (let i = 0; i < canopy.attributes.position.count; i++) {
      canopyColors[i * 3] = 0.06;
      canopyColors[i * 3 + 1] = 0.3;
      canopyColors[i * 3 + 2] = 0.04;
    }
    canopy.setAttribute('color', new THREE.BufferAttribute(canopyColors, 3));
    parts.push(canopy);
  }

  return mergeGeometries(parts)!;
}

// Pre-create 3 tree variants
const TREE_VARIANTS = [
  createTreeGeo(0.2),   // conifer
  createTreeGeo(0.55),  // deciduous
  createTreeGeo(0.85),  // aspen
];

interface TreeData {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotY: number;
  scaleY: number;
  variant: number;
  isRiparian: boolean;
  isSapling: boolean; // dynamic regrowth slot
  growthProgress: number; // 0-1 for saplings
}

export function Vegetation() {
  const meshRefs = [
    useRef<THREE.InstancedMesh>(null),
    useRef<THREE.InstancedMesh>(null),
    useRef<THREE.InstancedMesh>(null),
  ];
  const dummyRef = useRef(new THREE.Object3D());

  const { treeGroups } = useMemo(() => {
    const groups: [TreeData[], TreeData[], TreeData[]] = [[], [], []];
    const rng = mulberry(123);

    // Place base trees
    for (let i = 0; i < TREE_COUNT * 3; i++) {
      const x = (rng() - 0.5) * SIZE * 0.9;
      const z = (rng() - 0.5) * SIZE * 0.9;
      const h = getHeight(x, z);
      const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
      const lakeDist = Math.sqrt((x - 25) ** 2 + (z + 15) ** 2);

      if (h < 1.8 || h > 22) continue;
      if (riverDist < 4) continue;
      if (lakeDist < 15) continue;

      const isRiparian = riverDist < 20;
      const isLakeshore = lakeDist < 25;

      let density = h > 7 && h < 16 ? 0.7 : 0.35;
      if (isRiparian) density = Math.max(density, 0.7);
      if (isLakeshore) density = Math.max(density, 0.75);
      if (h < 5 && (isRiparian || isLakeshore)) density = Math.max(density, 0.8);

      if (rng() > density) continue;

      const totalPlaced = groups[0].length + groups[1].length + groups[2].length;
      if (totalPlaced >= TREE_COUNT) break;

      const scale = 0.5 + rng() * 1.0;
      const variantRng = rng();
      const variantIdx = variantRng < 0.4 ? 0 : variantRng < 0.7 ? 1 : 2;

      groups[variantIdx].push({
        x, y: h, z, scale,
        rotY: rng() * Math.PI * 2,
        scaleY: 1 + rng() * 0.4,
        variant: variantIdx,
        isRiparian: isRiparian || isLakeshore,
        isSapling: false,
        growthProgress: 1,
      });
    }

    // Generate sapling slots in riparian zones (hidden initially)
    const saplingRng = mulberry(999);
    let saplingsPlaced = 0;
    for (let i = 0; i < SAPLING_SLOTS * 5 && saplingsPlaced < SAPLING_SLOTS; i++) {
      const x = (saplingRng() - 0.5) * SIZE * 0.85;
      const z = (saplingRng() - 0.5) * SIZE * 0.85;
      const h = getHeight(x, z);
      const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
      const lakeDist = Math.sqrt((x - 25) ** 2 + (z + 15) ** 2);

      if (h < 1.8 || h > 22) continue;
      if (riverDist < 4 || lakeDist < 15) continue;

      const isRiparian = riverDist < 20;
      const isLakeshore = lakeDist < 25;
      if (!isRiparian && !isLakeshore) continue; // saplings only in riparian

      const scale = 0.3 + saplingRng() * 0.5; // smaller base
      const variantRng2 = saplingRng();
      const variantIdx = variantRng2 < 0.4 ? 0 : variantRng2 < 0.7 ? 1 : 2;

      groups[variantIdx].push({
        x, y: h, z, scale,
        rotY: saplingRng() * Math.PI * 2,
        scaleY: 1 + saplingRng() * 0.3,
        variant: variantIdx,
        isRiparian: true,
        isSapling: true,
        growthProgress: 0,
      });
      saplingsPlaced++;
    }

    return { treeGroups: groups };
  }, []);

  const totalTrees = treeGroups[0].length + treeGroups[1].length + treeGroups[2].length;

  useEffect(() => {
    useAgentStore.getState().setTreeCount(totalTrees);
  }, [totalTrees]);

  const initialized = useRef(false);
  const frameCount = useRef(0);

  useFrame((_, delta) => {
    const d = dummyRef.current;
    const si = SEASON_INDEX[useSimulationStore.getState().season];
    let visibleCount = 0;

    for (let vi = 0; vi < 3; vi++) {
      const mesh = meshRefs[vi].current;
      if (!mesh) continue;
      const trees = treeGroups[vi];

      for (let i = 0; i < trees.length; i++) {
        const t = trees[i];
        let scaleMult = 1;
        let alive = true;

        const health = t.isRiparian ? getRiparianTreeHealth(t.x, t.z) : -1;

        if (t.isSapling) {
          // Saplings only appear when health > 0.65
          // Real willows take 3-5 years; at ~2min/sim-year, target ~6-10min for full growth
          if (health < 0.65) {
            // Shrink back if health drops (die-off is faster than growth)
            t.growthProgress = Math.max(0, t.growthProgress - delta * 0.15);
          } else {
            // Grow towards full size based on health — very slow, ~0.012/s = ~80s to full
            const targetGrowth = Math.min(1, (health - 0.65) / 0.35);
            t.growthProgress = Math.min(targetGrowth, t.growthProgress + delta * 0.012);
          }

          if (t.growthProgress < 0.01) {
            alive = false;
          } else {
            scaleMult = t.growthProgress * t.growthProgress; // ease-in curve
          }
        } else if (t.isRiparian && health >= 0) {
          if (health < 0.4) {
            alive = false;
          } else {
            scaleMult = Math.max(0.15, (health - 0.4) / 0.6);
          }
        }

        if (alive) {
          visibleCount++;
          d.position.set(t.x, t.y, t.z);
          d.scale.set(
            t.scale * scaleMult,
            t.scale * t.scaleY * scaleMult,
            t.scale * scaleMult
          );
        } else {
          d.position.set(0, -100, 0);
          d.scale.set(0, 0, 0);
        }
        d.rotation.y = t.rotY;
        d.updateMatrix();
        mesh.setMatrixAt(i, d.matrix);

        if (mesh.instanceColor) {
          let rMod = 0, gMod = 0, bMod = 0;
          if (si === 0) { gMod = 0.08; }
          else if (si === 2) { rMod = 0.3; gMod = 0.05; bMod = -0.02; }
          else if (si === 3) { rMod = 0.15; gMod = -0.05; bMod = 0.08; }

          if (t.isRiparian && health > 0.5) {
            gMod += (health - 0.5) * 0.15;
          }
          // Saplings are slightly lighter green
          if (t.isSapling && t.growthProgress > 0) {
            gMod += 0.1;
            rMod += 0.02;
          }

          const c = new THREE.Color(0.05 + rMod, 0.25 + gMod, 0.03 + bMod);
          mesh.setColorAt(i, c);
        }
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    frameCount.current++;
    if (frameCount.current % 30 === 0) {
      useAgentStore.getState().setTreeCount(visibleCount);
    }

    initialized.current = true;
  });

  return (
    <>
      {treeGroups.map((group, vi) => (
        <instancedMesh
          key={vi}
          ref={meshRefs[vi]}
          args={[TREE_VARIANTS[vi], undefined, group.length]}
          castShadow
          receiveShadow
        >
          <meshLambertMaterial vertexColors />
        </instancedMesh>
      ))}
    </>
  );
}