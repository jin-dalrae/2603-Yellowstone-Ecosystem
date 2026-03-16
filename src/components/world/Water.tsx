import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore, SEASON_INDEX } from '@/store/simulationStore';

export function Water() {
  const lakeRef = useRef<THREE.Mesh>(null);
  const riverRef = useRef<THREE.Mesh>(null);
  const lakeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const riverMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Lake geometry
  const lakeGeo = useMemo(() => {
    const geo = new THREE.CircleGeometry(12, 32);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  // River - a curved ribbon following the valley
  const riverGeo = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let x = -95; x <= 95; x += 2) {
      const z = Math.sin(x * 0.03) * 20;
      points.push(new THREE.Vector3(x, 0, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 80, 2.5, 4, false);
    return tubeGeo;
  }, []);

  useFrame((_, delta) => {
    const season = useSimulationStore.getState().season;
    const si = SEASON_INDEX[season];

    // Seasonal water color
    const winterBlue = new THREE.Color(0.5, 0.6, 0.7);
    const summerBlue = new THREE.Color(0.1, 0.25, 0.45);
    const t = Math.max(0, (si - 2)) ; // winter factor

    if (lakeMaterialRef.current) {
      lakeMaterialRef.current.color.lerpColors(summerBlue, winterBlue, t);
      lakeMaterialRef.current.opacity = 0.75 - t * 0.1;
    }
    if (riverMaterialRef.current) {
      riverMaterialRef.current.color.lerpColors(summerBlue, winterBlue, t);
      riverMaterialRef.current.opacity = 0.7 - t * 0.1;
    }
  });

  return (
    <>
      {/* Lake */}
      <mesh ref={lakeRef} geometry={lakeGeo} position={[25, 2.2, -15]} receiveShadow>
        <meshStandardMaterial
          ref={lakeMaterialRef}
          color={[0.1, 0.25, 0.45]}
          transparent
          opacity={0.75}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>

      {/* River */}
      <mesh ref={riverRef} geometry={riverGeo} position={[0, 1.8, 0]}>
        <meshStandardMaterial
          ref={riverMaterialRef}
          color={[0.1, 0.25, 0.45]}
          transparent
          opacity={0.7}
          metalness={0.2}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}
