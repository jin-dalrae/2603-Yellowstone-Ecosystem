import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getDamSites } from '@/lib/boids';

const MAX_DAMS = 10;
const dummy = new THREE.Object3D();

/**
 * Small visual markers at beaver dam sites — logs/debris pile on the river.
 * Also renders a green "riparian recovery" ring that grows with dam health.
 */
export function BeaverDams() {
  const damMeshRef = useRef<THREE.InstancedMesh>(null);
  const ringMeshRef = useRef<THREE.InstancedMesh>(null);

  useFrame(() => {
    const dams = getDamSites();
    if (!damMeshRef.current || !ringMeshRef.current) return;

    const damColor = new THREE.Color();
    const ringColor = new THREE.Color();

    for (let i = 0; i < MAX_DAMS; i++) {
      if (i < dams.length) {
        const d = dams[i];
        // Dam structure — small brown block
        dummy.position.set(d.x, 2.2, d.z);
        dummy.rotation.set(0, d.x * 0.5, 0);
        dummy.scale.set(1, 0.5, 1);
        dummy.updateMatrix();
        damMeshRef.current.setMatrixAt(i, dummy.matrix);
        damColor.setHSL(0.07, 0.5, 0.25);
        damMeshRef.current.setColorAt(i, damColor);

        // Green recovery ring
        const ringScale = 3 + d.health * 20; // grows with health
        dummy.position.set(d.x, 0.3, d.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(ringScale, ringScale, 1);
        dummy.updateMatrix();
        ringMeshRef.current.setMatrixAt(i, dummy.matrix);
        ringColor.setHSL(0.33, 0.6 + d.health * 0.3, 0.25 + d.health * 0.2);
        ringMeshRef.current.setColorAt(i, ringColor);
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        damMeshRef.current.setMatrixAt(i, dummy.matrix);
        ringMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    damMeshRef.current.instanceMatrix.needsUpdate = true;
    ringMeshRef.current.instanceMatrix.needsUpdate = true;
    if (damMeshRef.current.instanceColor) damMeshRef.current.instanceColor.needsUpdate = true;
    if (ringMeshRef.current.instanceColor) ringMeshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      {/* Dam structures */}
      <instancedMesh ref={damMeshRef} args={[undefined, undefined, MAX_DAMS]}>
        <boxGeometry args={[2, 0.8, 3]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      {/* Recovery rings */}
      <instancedMesh ref={ringMeshRef} args={[undefined, undefined, MAX_DAMS]}>
        <ringGeometry args={[0.8, 1, 24]} />
        <meshBasicMaterial vertexColors transparent opacity={0.25} side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}
