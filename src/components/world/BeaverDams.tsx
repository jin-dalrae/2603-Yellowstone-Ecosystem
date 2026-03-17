import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getDamSites } from '@/lib/boids';
import { getAverageRiparianHealth } from '@/lib/riparianState';

const MAX_DAMS = 10;
const dummy = new THREE.Object3D();

/** Pond shader — similar to river water but circular and calmer */
function createPondMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0.06, 0.20, 0.40) },
      uOpacity: { value: 0.65 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        // Radial distance from center
        vec2 centered = vUv * 2.0 - 1.0;
        float dist = length(centered);

        // Soft circular edge
        float edge = 1.0 - smoothstep(0.7, 1.0, dist);
        if (edge < 0.01) discard;

        // Gentle ripples
        vec2 rippleUv = centered * 3.0;
        float n = noise(rippleUv + vec2(uTime * 0.05, uTime * 0.03)) * 0.6
                + noise(rippleUv * 2.0 + vec2(0.0, uTime * 0.08)) * 0.4;
        float ripple = smoothstep(0.5, 0.65, n);

        vec3 col = uColor + ripple * 0.1;

        // Shore foam at edges
        float foam = smoothstep(0.6, 0.85, dist) * 0.25;
        col += foam;

        gl_FragColor = vec4(col, uOpacity * edge + foam * 0.3);
      }
    `,
  });
}

/**
 * Beaver dam markers near the lake/river — log piles with green recovery rings
 * and small ponds that form behind dams.
 */
export function BeaverDams() {
  const damMeshRef = useRef<THREE.InstancedMesh>(null);
  const ringMeshRef = useRef<THREE.InstancedMesh>(null);
  const log2Ref = useRef<THREE.InstancedMesh>(null);
  const pondMeshRef = useRef<THREE.InstancedMesh>(null);

  const pondMat = useMemo(createPondMaterial, []);

  useFrame((_, delta) => {
    const dams = getDamSites();
    if (!damMeshRef.current || !ringMeshRef.current || !log2Ref.current || !pondMeshRef.current) return;

    // Update pond shader time
    pondMat.uniforms.uTime.value += delta;

    // Color ponds based on riparian health
    const health = getAverageRiparianHealth();
    const degraded = new THREE.Color(0.15, 0.14, 0.09);
    const healthy = new THREE.Color(0.05, 0.18, 0.40);
    pondMat.uniforms.uColor.value.lerpColors(degraded, healthy, health);
    pondMat.uniforms.uOpacity.value = 0.5 + health * 0.25;

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
        ringColor.setHSL(0.33, 0.5 + d.health * 0.4, 0.2 + d.health * 0.3);
        ringMeshRef.current.setColorAt(i, ringColor);

        // Pond — forms behind the dam, grows with health
        // Offset pond slightly upstream (negative x direction) from the dam
        const pondSize = d.health * 6 + 1.5; // 1.5 to 7.5 radius
        const pondOffsetX = -Math.cos(d.x * 0.5) * 3;
        const pondOffsetZ = -Math.sin(d.x * 0.5) * 3;
        dummy.position.set(d.x + pondOffsetX, 1.7, d.z + pondOffsetZ);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(pondSize, pondSize, 1);
        dummy.updateMatrix();
        pondMeshRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        damMeshRef.current.setMatrixAt(i, dummy.matrix);
        ringMeshRef.current.setMatrixAt(i, dummy.matrix);
        log2Ref.current.setMatrixAt(i, dummy.matrix);
        pondMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    damMeshRef.current.instanceMatrix.needsUpdate = true;
    ringMeshRef.current.instanceMatrix.needsUpdate = true;
    log2Ref.current.instanceMatrix.needsUpdate = true;
    pondMeshRef.current.instanceMatrix.needsUpdate = true;
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
      {/* Beaver ponds — small water bodies behind dams */}
      <instancedMesh ref={pondMeshRef} args={[undefined, undefined, MAX_DAMS]} material={pondMat}>
        <circleGeometry args={[1, 24]} />
      </instancedMesh>
    </>
  );
}
