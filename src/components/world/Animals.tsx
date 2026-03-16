import { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useAgentStore } from '@/store/agentStore';
import { useSimulationStore } from '@/store/simulationStore';
import { fbm } from '@/lib/noise';

const MAX_WOLVES = 30;
const MAX_ELK = 70;

// Get terrain height at world position (must match Terrain.tsx logic)
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
  const edgeFalloff = 1 - Math.pow(Math.max(0, edgeDist - 0.6) / 0.4, 2);
  h *= edgeFalloff;
  h = Math.max(0.5, h);
  return h;
}

// Simple wolf body geometry (low-poly wedge)
function createWolfGeometry(): THREE.BufferGeometry {
  const geo = new THREE.ConeGeometry(0.5, 1.8, 4);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0.6, 0);
  return geo;
}

// Simple elk body geometry (taller cone)
function createElkGeometry(): THREE.BufferGeometry {
  const geo = new THREE.ConeGeometry(0.4, 2.2, 5);
  geo.rotateX(Math.PI / 2);
  geo.translate(0, 0.8, 0);
  return geo;
}

const dummy = new THREE.Object3D();
const wolfColor = new THREE.Color(0.35, 0.32, 0.28);
const elkColor = new THREE.Color(0.55, 0.42, 0.25);
const selectedWolfColor = new THREE.Color(0.9, 0.5, 0.2);
const selectedElkColor = new THREE.Color(0.9, 0.7, 0.2);

export function Animals() {
  const wolfMeshRef = useRef<THREE.InstancedMesh>(null);
  const elkMeshRef = useRef<THREE.InstancedMesh>(null);

  const wolfGeo = useMemo(createWolfGeometry, []);
  const elkGeo = useMemo(createElkGeometry, []);

  const wolfMat = useMemo(() => new THREE.MeshLambertMaterial({ color: wolfColor }), []);
  const elkMat = useMemo(() => new THREE.MeshLambertMaterial({ color: elkColor }), []);

  // Store ordered agent ids for click mapping
  const wolfIdsRef = useRef<number[]>([]);
  const elkIdsRef = useRef<number[]>([]);

  const handleWolfClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && wolfIdsRef.current[e.instanceId]) {
      const id = wolfIdsRef.current[e.instanceId];
      useAgentStore.getState().selectAgent(id);
      useSimulationStore.getState().setCameraMode('follow');
    }
  }, []);

  const handleElkClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId !== undefined && elkIdsRef.current[e.instanceId]) {
      const id = elkIdsRef.current[e.instanceId];
      useAgentStore.getState().selectAgent(id);
      useSimulationStore.getState().setCameraMode('follow');
    }
  }, []);

  // Tick agent simulation each frame
  useFrame((_, delta) => {
    const simState = useSimulationStore.getState();
    if (!simState.isPlaying) return;

    const scaledDelta = delta * simState.timeSpeed;
    useAgentStore.getState().tickAgents(scaledDelta);

    const agents = useAgentStore.getState().agents;
    const selectedId = useAgentStore.getState().selectedAgentId;
    const wolves = agents.filter(a => a.type === 'wolf' && a.alive);
    const elks = agents.filter(a => a.type === 'elk' && a.alive);

    // Store ids for click mapping
    wolfIdsRef.current = wolves.map(w => w.id);
    elkIdsRef.current = elks.map(e => e.id);

    const color = new THREE.Color();

    // Update wolf instances
    if (wolfMeshRef.current) {
      for (let i = 0; i < MAX_WOLVES; i++) {
        if (i < wolves.length) {
          const w = wolves[i];
          const y = getTerrainHeight(w.x, w.z);
          dummy.position.set(w.x, y, w.z);
          const angle = Math.atan2(w.vx, w.vz);
          dummy.rotation.set(0, angle, 0);
          const isSelected = w.id === selectedId;
          dummy.scale.setScalar(isSelected ? 1.4 : 1);
          color.copy(isSelected ? selectedWolfColor : wolfColor);
          wolfMeshRef.current.setColorAt(i, color);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.setScalar(0);
        }
        dummy.updateMatrix();
        wolfMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      wolfMeshRef.current.instanceMatrix.needsUpdate = true;
      if (wolfMeshRef.current.instanceColor) wolfMeshRef.current.instanceColor.needsUpdate = true;
    }

    // Update elk instances
    if (elkMeshRef.current) {
      for (let i = 0; i < MAX_ELK; i++) {
        if (i < elks.length) {
          const e = elks[i];
          const y = getTerrainHeight(e.x, e.z);
          dummy.position.set(e.x, y, e.z);
          const angle = Math.atan2(e.vx, e.vz);
          dummy.rotation.set(0, angle, 0);
          const isSelected = e.id === selectedId;
          dummy.scale.setScalar(isSelected ? 1.4 : 1);
          color.copy(isSelected ? selectedElkColor : elkColor);
          elkMeshRef.current.setColorAt(i, color);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.setScalar(0);
        }
        dummy.updateMatrix();
        elkMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      elkMeshRef.current.instanceMatrix.needsUpdate = true;
      if (elkMeshRef.current.instanceColor) elkMeshRef.current.instanceColor.needsUpdate = true;
    }

    // Deselect if agent died
    if (selectedId !== null) {
      const sel = agents.find(a => a.id === selectedId);
      if (!sel || !sel.alive) {
        useAgentStore.getState().selectAgent(null);
        if (simState.cameraMode === 'follow') {
          useSimulationStore.getState().setCameraMode('orbit');
        }
      }
    }
  });

  // Initialize hidden instances
  useEffect(() => {
    if (wolfMeshRef.current) {
      dummy.position.set(0, -100, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      for (let i = 0; i < MAX_WOLVES; i++) {
        wolfMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      wolfMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (elkMeshRef.current) {
      dummy.position.set(0, -100, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      for (let i = 0; i < MAX_ELK; i++) {
        elkMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      elkMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  return (
    <>
      <instancedMesh
        ref={wolfMeshRef}
        args={[wolfGeo, wolfMat, MAX_WOLVES]}
        castShadow
        onClick={handleWolfClick}
      />
      <instancedMesh
        ref={elkMeshRef}
        args={[elkGeo, elkMat, MAX_ELK]}
        castShadow
        onClick={handleElkClick}
      />
    </>
  );
}
