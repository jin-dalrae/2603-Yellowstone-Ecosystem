import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSimulationStore } from '@/store/simulationStore';
import * as THREE from 'three';

export function CameraController() {
  const cameraMode = useSimulationStore((s) => s.cameraMode);
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (cameraMode === 'god') {
      camera.position.set(0, 120, 0.1);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    } else {
      camera.position.set(60, 45, 60);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 5, 0);
        controlsRef.current.update();
      }
    }
  }, [cameraMode, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      maxPolarAngle={cameraMode === 'god' ? 0.1 : Math.PI / 2.15}
      minDistance={cameraMode === 'god' ? 40 : 15}
      maxDistance={cameraMode === 'god' ? 200 : 160}
      enableRotate={cameraMode !== 'god'}
      enableDamping
      dampingFactor={0.08}
      target={[0, 5, 0]}
    />
  );
}
