import { Canvas } from '@react-three/fiber';
import { Terrain } from './Terrain';
import { Water } from './Water';
import { Vegetation } from './Vegetation';
import { GrassPatches } from './GrassPatches';
import { Animals } from './Animals';
import { AnimalLabels } from './AnimalLabels';
import { Atmosphere } from './Atmosphere';
import { CameraController } from './CameraController';
import { useSimulationStore } from '@/store/simulationStore';
import { useFrame as useR3FFrame } from '@react-three/fiber';

function SimulationTick() {
  const tick = useSimulationStore((s) => s.tick);
  useR3FFrame((_, delta) => {
    tick(delta);
  });
  return null;
}

export function Scene() {
  return (
    <Canvas
      camera={{ position: [60, 45, 60], fov: 55, near: 0.5, far: 500 }}
      shadows
      gl={{ antialias: true, toneMapping: 3 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <SimulationTick />
      <CameraController />
      <Atmosphere />
      <Terrain />
      <Water />
      <Vegetation />
      <GrassPatches />
      <Animals />
      <AnimalLabels />
    </Canvas>
  );
}
