import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
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

export function Animals() {
  const wolfMeshRef = useRef<THREE.InstancedMesh>(null);
  const elkMeshRef = useRef<THREE.InstancedMesh>(null);

  const wolfGeo = useMemo(createWolfGeometry, []);
  const elkGeo = useMemo(createElkGeometry, []);

  const wolfMat = useMemo(() => new THREE.MeshLambertMaterial({ color: wolfColor }), []);
  const elkMat = useMemo(() => new THREE.MeshLambertMaterial({ color: elkColor }), []);

  // Tick agent simulation each frame
  useFrame((_, delta) => {
    const simState = useSimulationStore.getState();
    if (!simState.isPlaying) return;

    const scaledDelta = delta * simState.timeSpeed;
    useAgentStore.getState().tickAgents(scaledDelta);

    const agents = useAgentStore.getState().agents;
    const wolves = agents.filter(a => a.type === 'wolf' && a.alive);
    const elks = agents.filter(a => a.type === 'elk' && a.alive);

    // Update wolf instances
    if (wolfMeshRef.current) {
      for (let i = 0; i < MAX_WOLVES; i++) {
        if (i < wolves.length) {
          const w = wolves[i];
          const y = getTerrainHeight(w.x, w.z);
          dummy.position.set(w.x, y, w.z);
          // Face movement direction
          const angle = Math.atan2(w.vx, w.vz);
          dummy.rotation.set(0, angle, 0);
          dummy.scale.setScalar(1);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.setScalar(0);
        }
        dummy.updateMatrix();
        wolfMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      wolfMeshRef.current.instanceMatrix.needsUpdate = true;
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
          dummy.scale.setScalar(1);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.setScalar(0);
        }
        dummy.updateMatrix();
        elkMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      elkMeshRef.current.instanceMatrix.needsUpdate = true;
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
      />
      <instancedMesh
        ref={elkMeshRef}
        args={[elkGeo, elkMat, MAX_ELK]}
        castShadow
      />
    </>
  );
}
