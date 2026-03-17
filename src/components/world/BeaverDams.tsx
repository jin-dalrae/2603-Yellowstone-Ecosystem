import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getDamSites } from '@/lib/boids';

const MAX_DAMS = 10;
const dummy = new THREE.Object3D();

/**
 * Beaver dam markers near the lake/river — log piles with green recovery rings.
 * Ring grows and brightens as riparian health improves.
 */
export function BeaverDams() {
  const damMeshRef = useRef<THREE.InstancedMesh>(null);
  const ringMeshRef = useRef<THREE.InstancedMesh>(null);
  const log2Ref = useRef<THREE.InstancedMesh>(null);

  useFrame(() => {
    const dams = getDamSites();
    if (!damMeshRef.current || !ringMeshRef.current || !log2Ref.current) return;

    const damColor = new THREE.Color();
    const ringColor = new THREE.Color();

    for (let i = 0; i < MAX_DAMS; i++) {
      if (i < dams.length) {
        const d = dams[i];

        // Main log
        dummy.position.set(d.x, 2.1, d.z);
        dummy.rotation.set(0, d.x * 0.5, Math.PI * 0.05);
        dummy.scale.set(0.3, 0.3, 1.8);
        dummy.updateMatrix();
        damMeshRef.current.setMatrixAt(i, dummy.matrix);
        damColor.setHSL(0.07, 0.55, 0.2);
        damMeshRef.current.setColorAt(i, damColor);

        // Cross log
        dummy.position.set(d.x + 0.3, 2.2, d.z + 0.2);
        dummy.rotation.set(0, d.x * 0.5 + 1.2, Math.PI * 0.03);
        dummy.scale.set(0.25, 0.25, 1.4);
        dummy.updateMatrix();
        log2Ref.current.setMatrixAt(i, dummy.matrix);
        log2Ref.current.setColorAt(i, damColor);

        // Green recovery ring — grows with health, pulses gently
        const ringScale = 4 + d.health * 22;
        dummy.position.set(d.x, 0.4, d.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(ringScale, ringScale, 1);
        dummy.updateMatrix();
        ringMeshRef.current.setMatrixAt(i, dummy.matrix);
        // Brighter green as health increases
        ringColor.setHSL(0.33, 0.5 + d.health * 0.4, 0.2 + d.health * 0.3);
        ringMeshRef.current.setColorAt(i, ringColor);
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        damMeshRef.current.setMatrixAt(i, dummy.matrix);
        ringMeshRef.current.setMatrixAt(i, dummy.matrix);
        log2Ref.current.setMatrixAt(i, dummy.matrix);
      }
    }
    damMeshRef.current.instanceMatrix.needsUpdate = true;
    ringMeshRef.current.instanceMatrix.needsUpdate = true;
    log2Ref.current.instanceMatrix.needsUpdate = true;
    if (damMeshRef.current.instanceColor) damMeshRef.current.instanceColor.needsUpdate = true;
    if (ringMeshRef.current.instanceColor) ringMeshRef.current.instanceColor.needsUpdate = true;
    if (log2Ref.current.instanceColor) log2Ref.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      {/* Main logs */}
      <instancedMesh ref={damMeshRef} args={[undefined, undefined, MAX_DAMS]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      {/* Cross logs */}
      <instancedMesh ref={log2Ref} args={[undefined, undefined, MAX_DAMS]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1, 6]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      {/* Recovery rings */}
      <instancedMesh ref={ringMeshRef} args={[undefined, undefined, MAX_DAMS]}>
        <ringGeometry args={[0.85, 1, 32]} />
        <meshBasicMaterial vertexColors transparent opacity={0.35} side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}
