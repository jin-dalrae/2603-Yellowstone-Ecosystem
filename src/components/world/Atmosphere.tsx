import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore, SEASON_INDEX } from '@/store/simulationStore';

const PARTICLE_COUNT = 2000;

export function Atmosphere() {
  const particlesRef = useRef<THREE.Points>(null);

  const season = useSimulationStore((s) => s.season);

  // Particle positions
  const particlePositions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 200;
      arr[i * 3 + 1] = Math.random() * 50 + 5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    return arr;
  }, []);

  // Animate particles (snow/rain)
  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    const si = SEASON_INDEX[useSimulationStore.getState().season];
    const geo = particlesRef.current.geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;

    const isWinter = si > 2;
    const isSpring = si < 1;

    // Show particles only in winter (snow) or spring (rain)
    const visible = isWinter || isSpring;
    particlesRef.current.visible = visible;
    if (!visible) return;

    const speed = isWinter ? 8 : 18;
    const drift = isWinter ? 2 : 0.5;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      let y = pos.getY(i) - speed * delta;
      let x = pos.getX(i) + (Math.random() - 0.5) * drift * delta;
      if (y < 0) {
        y = 40 + Math.random() * 15;
        x = (Math.random() - 0.5) * 200;
        pos.setZ(i, (Math.random() - 0.5) * 200);
      }
      pos.setY(i, y);
      pos.setX(i, x);
    }
    pos.needsUpdate = true;

    // Color: white for snow, blue-gray for rain
    const mat = particlesRef.current.material as THREE.PointsMaterial;
    if (isWinter) {
      mat.color.set(0xeeeeff);
      mat.size = 0.4;
    } else {
      mat.color.set(0x8899bb);
      mat.size = 0.15;
    }
  });

  // Sky parameters by season
  const skyProps = useMemo(() => {
    const si = SEASON_INDEX[season];
    return {
      turbidity: si > 2 ? 12 : si > 1 ? 6 : 3,
      rayleigh: si > 2 ? 0.5 : si > 1 ? 1.5 : 2,
      mieCoefficient: si > 2 ? 0.01 : 0.005,
      mieDirectionalG: 0.8,
      sunPosition: [50, si > 2 ? 15 : 40, -30] as [number, number, number],
    };
  }, [season]);

  return (
    <>
      <Sky
        distance={450000}
        turbidity={skyProps.turbidity}
        rayleigh={skyProps.rayleigh}
        mieCoefficient={skyProps.mieCoefficient}
        mieDirectionalG={skyProps.mieDirectionalG}
        sunPosition={skyProps.sunPosition}
      />

      <ambientLight intensity={season === 'winter' ? 0.5 : 0.4} />
      <directionalLight
        position={[50, 40, -30]}
        intensity={season === 'winter' ? 0.6 : 1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      {/* Weather particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particlePositions}
            count={PARTICLE_COUNT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.3}
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>

      {/* Fog */}
      <fog
        attach="fog"
        args={[
          season === 'winter' ? '#b8c0cc' : season === 'autumn' ? '#c4a882' : '#a8b8c8',
          120,
          350,
        ]}
      />
    </>
  );
}
