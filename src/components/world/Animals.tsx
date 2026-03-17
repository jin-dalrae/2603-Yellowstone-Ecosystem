import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useAgentStore } from '@/store/agentStore';
import { useSimulationStore } from '@/store/simulationStore';
import { fbm } from '@/lib/noise';
import type { AgentType } from '@/lib/boids';
import { ANIMAL_GEO_CREATORS } from './animalGeometries';

const MAX_COUNTS: Record<AgentType, number> = {
  wolf: 30, elk: 70, bear: 15, beaver: 20, raven: 25,
  bison: 50, moose: 20, coyote: 25, osprey: 15,
};

function getTerrainHeight(x: number, z: number): number {
  const SIZE = 200;
  const MAX_HEIGHT = 28;
  let h = 0;
  h += fbm(x * 0.008, z * 0.008, 6) * MAX_HEIGHT;
  h += fbm(x * 0.02, z * 0.02, 4) * 5;
  const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
  const riverFactor = Math.max(0, 1 - riverDist / 15);
  h *= 1 - riverFactor * 0.6;
  const edgeDist = Math.max(Math.abs(x), Math.abs(z)) / (SIZE / 2);
  const rimStart = 0.5;
  const rimT = Math.max(0, (edgeDist - rimStart) / (1.0 - rimStart));
  h = Math.max(0.5, h) + rimT * rimT * 45;
  return h;
}

const dummy = new THREE.Object3D();

const COLORS: Record<AgentType, THREE.Color> = {
  wolf: new THREE.Color(0.35, 0.32, 0.28),
  elk: new THREE.Color(0.55, 0.42, 0.25),
  bear: new THREE.Color(0.3, 0.2, 0.12),
  beaver: new THREE.Color(0.4, 0.28, 0.15),
  raven: new THREE.Color(0.1, 0.1, 0.12),
  bison: new THREE.Color(0.25, 0.18, 0.1),
  moose: new THREE.Color(0.35, 0.25, 0.15),
  coyote: new THREE.Color(0.5, 0.45, 0.35),
  osprey: new THREE.Color(0.2, 0.2, 0.25),
};
const SELECTED_COLORS: Record<AgentType, THREE.Color> = {
  wolf: new THREE.Color(0.9, 0.5, 0.2),
  elk: new THREE.Color(0.9, 0.7, 0.2),
  bear: new THREE.Color(0.9, 0.6, 0.1),
  beaver: new THREE.Color(0.8, 0.6, 0.2),
  raven: new THREE.Color(0.7, 0.5, 0.9),
  bison: new THREE.Color(0.9, 0.55, 0.15),
  moose: new THREE.Color(0.85, 0.65, 0.2),
  coyote: new THREE.Color(0.9, 0.7, 0.3),
  osprey: new THREE.Color(0.5, 0.7, 0.95),
};

const FLYING_TYPES = new Set<AgentType>(['raven', 'osprey']);
const FLY_HEIGHT = 8;

interface SpeciesMeshProps {
  type: AgentType;
  geo: THREE.BufferGeometry;
}

function SpeciesMesh({ type, geo }: SpeciesMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const idsRef = useRef<number[]>([]);
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: COLORS[type] }), [type]);
  const maxCount = MAX_COUNTS[type];
  const isFlying = FLYING_TYPES.has(type);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && idsRef.current[e.instanceId]) {
      useAgentStore.getState().selectAgent(idsRef.current[e.instanceId]);
      useSimulationStore.getState().setCameraMode('follow');
    }
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    dummy.position.set(0, -100, 0);
    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    for (let i = 0; i < maxCount; i++) {
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [maxCount]);

  useFrame(() => {
    if (!meshRef.current) return;
    const agents = useAgentStore.getState().agents;
    const selectedId = useAgentStore.getState().selectedAgentId;
    const alive = agents.filter(a => a.type === type && a.alive);
    idsRef.current = alive.map(a => a.id);

    const color = new THREE.Color();
    for (let i = 0; i < maxCount; i++) {
      if (i < alive.length) {
        const a = alive[i];
        const y = getTerrainHeight(a.x, a.z) + (isFlying ? FLY_HEIGHT + Math.sin(a.age * 2 + a.id) * 1.5 : 0);
        dummy.position.set(a.x, y, a.z);
        const angle = Math.atan2(a.vx, a.vz);
        dummy.rotation.set(0, angle, 0);
        const isSelected = a.id === selectedId;
        dummy.scale.setScalar(isSelected ? 1.4 : 1);
        color.copy(isSelected ? SELECTED_COLORS[type] : COLORS[type]);
        meshRef.current.setColorAt(i, color);
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, mat, maxCount]}
      castShadow
      onClick={handleClick}
    />
  );
}

export function Animals() {
  const wolfGeo = useMemo(() => ANIMAL_GEO_CREATORS.wolf(), []);
  const elkGeo = useMemo(() => ANIMAL_GEO_CREATORS.elk(), []);
  const bearGeo = useMemo(() => ANIMAL_GEO_CREATORS.bear(), []);
  const beaverGeo = useMemo(() => ANIMAL_GEO_CREATORS.beaver(), []);
  const ravenGeo = useMemo(() => ANIMAL_GEO_CREATORS.raven(), []);
  const bisonGeo = useMemo(() => ANIMAL_GEO_CREATORS.bison(), []);
  const mooseGeo = useMemo(() => ANIMAL_GEO_CREATORS.moose(), []);
  const coyoteGeo = useMemo(() => ANIMAL_GEO_CREATORS.coyote(), []);
  const ospreyGeo = useMemo(() => ANIMAL_GEO_CREATORS.osprey(), []);

  // Tick agent simulation
  useFrame((_, delta) => {
    const simState = useSimulationStore.getState();
    if (!simState.isPlaying) return;
    const scaledDelta = delta * simState.timeSpeed;
    useAgentStore.getState().tickAgents(scaledDelta, simState.season);

    const selectedId = useAgentStore.getState().selectedAgentId;
    if (selectedId !== null) {
      const sel = useAgentStore.getState().agents.find(a => a.id === selectedId);
      if (!sel || !sel.alive) {
        useAgentStore.getState().selectAgent(null);
        if (simState.cameraMode === 'follow') {
          useSimulationStore.getState().setCameraMode('orbit');
        }
      }
    }
  });

  return (
    <>
      <SpeciesMesh type="wolf" geo={wolfGeo} />
      <SpeciesMesh type="elk" geo={elkGeo} />
      <SpeciesMesh type="bear" geo={bearGeo} />
      <SpeciesMesh type="beaver" geo={beaverGeo} />
      <SpeciesMesh type="raven" geo={ravenGeo} />
      <SpeciesMesh type="bison" geo={bisonGeo} />
      <SpeciesMesh type="moose" geo={mooseGeo} />
      <SpeciesMesh type="coyote" geo={coyoteGeo} />
      <SpeciesMesh type="osprey" geo={ospreyGeo} />
    </>
  );
}
