import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSimulationStore } from '@/store/simulationStore';
import { useAgentStore } from '@/store/agentStore';
import { fbm } from '@/lib/noise';
import * as THREE from 'three';

function getTerrainHeight(x: number, z: number): number {
  const SIZE = 200;
  const MAX_HEIGHT = 28;
  let h = 0;
  h += fbm(x * 0.008, z * 0.008, 6) * MAX_HEIGHT;
  h += fbm(x * 0.02, z * 0.02, 4) * 5;
  const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
  const riverFactor = Math.max(0, 1 - riverDist / 15);
  h *= 1 - riverFactor * 0.6;
  // Concave bowl rim
  const edgeDist = Math.max(Math.abs(x), Math.abs(z)) / (SIZE / 2);
  const rimStart = 0.5;
  const rimT = Math.max(0, (edgeDist - rimStart) / (1.0 - rimStart));
  const rimHeight = rimT * rimT * 45;
  h = Math.max(0.5, h) + rimHeight;
  return h;
}

const followOffset = new THREE.Vector3(8, 6, 8);
const lerpTarget = new THREE.Vector3();
const lerpCam = new THREE.Vector3();

export function CameraController() {
  const cameraMode = useSimulationStore((s) => s.cameraMode);
  const fov = useSimulationStore((s) => s.fov);
  const savedView = useSimulationStore((s) => s.savedCameraView);
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if ((camera as THREE.PerspectiveCamera).fov !== undefined) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    }
  }, [fov, camera]);

  // Expose camera for save-view feature
  useEffect(() => {
    (window as any).__THREE_CAMERA__ = camera;
    if (controlsRef.current) (window as any).__THREE_CONTROLS__ = controlsRef.current;
  });

  // Apply saved or default view on mode change
  useEffect(() => {
    if (cameraMode === 'god') {
      camera.position.set(0, 120, 0.1);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    } else if (cameraMode === 'orbit') {
      if (savedView && !initializedRef.current) {
        // Use saved default on first load
        camera.position.set(savedView.px, savedView.py, savedView.pz);
        if (controlsRef.current) {
          controlsRef.current.target.set(savedView.tx, savedView.ty, savedView.tz);
          controlsRef.current.update();
        }
        initializedRef.current = true;
      } else if (!savedView && !initializedRef.current) {
        camera.position.set(60, 45, 60);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 5, 0);
          controlsRef.current.update();
        }
        initializedRef.current = true;
      } else {
        // Switching back to orbit from god/follow — restore saved or default
        const v = savedView || { px: 60, py: 45, pz: 60, tx: 0, ty: 5, tz: 0 };
        camera.position.set(v.px, v.py, v.pz);
        if (controlsRef.current) {
          controlsRef.current.target.set(v.tx, v.ty, v.tz);
          controlsRef.current.update();
        }
      }
    }
    // follow mode is handled per-frame
  }, [cameraMode, camera, savedView]);

  useFrame(() => {
    if (cameraMode !== 'follow') return;
    const selectedId = useAgentStore.getState().selectedAgentId;
    if (selectedId === null) return;
    const agent = useAgentStore.getState().agents.find(a => a.id === selectedId && a.alive);
    if (!agent) return;

    const y = getTerrainHeight(agent.x, agent.z);
    lerpTarget.set(agent.x, y + 1, agent.z);
    lerpCam.set(agent.x + followOffset.x, y + followOffset.y, agent.z + followOffset.z);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(lerpTarget, 0.08);
      camera.position.lerp(lerpCam, 0.08);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      maxPolarAngle={cameraMode === 'god' ? 0.1 : Math.PI / 2.15}
      minDistance={cameraMode === 'god' ? 40 : cameraMode === 'follow' ? 5 : 15}
      maxDistance={cameraMode === 'god' ? 200 : 160}
      enableRotate={cameraMode !== 'god'}
      enableDamping
      dampingFactor={0.08}
      target={[0, 5, 0]}
    />
  );
}
