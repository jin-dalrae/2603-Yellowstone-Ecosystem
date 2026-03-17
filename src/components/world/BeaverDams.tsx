import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getDamSites } from '@/lib/boids';
import { getAverageRiparianHealth } from '@/lib/riparianState';

const MAX_DAMS = 10;
const REEDS_PER_DAM = 6;
const dummy = new THREE.Object3D();

// ── Elaborate dam geometry: interlocking logs, mud mound, sticks ──

function cyl(rT: number, rB: number, h: number, seg: number, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rT, rB, h, seg);
  if (rx || ry || rz) g.rotateX(rx).rotateY(ry).rotateZ(rz);
  g.translate(x, y, z);
  return g;
}

function box(w: number, h: number, d: number, x = 0, y = 0, z = 0): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

function sphere(r: number, x = 0, y = 0, z = 0, ws = 5, hs = 3): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(r, ws, hs);
  g.translate(x, y, z);
  return g;
}

function colorGeo(geo: THREE.BufferGeometry, r: number, g: number, b: number): THREE.BufferGeometry {
  const colors = new Float32Array(geo.attributes.position.count * 3);
  for (let i = 0; i < geo.attributes.position.count; i++) {
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/** Create a detailed beaver dam from merged primitives — visible from all angles */
function createDamGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // ── Main horizontal logs running along X (visible from front/back) ──
  parts.push(colorGeo(cyl(0.18, 0.22, 3.2, 6, 0, 0.2, 0, 0, 0, Math.PI / 2), 0.28, 0.18, 0.08));
  parts.push(colorGeo(cyl(0.15, 0.19, 2.8, 6, 0.15, 0.5, 0.12, 0, 0.15, Math.PI / 2), 0.32, 0.20, 0.09));
  parts.push(colorGeo(cyl(0.13, 0.17, 2.4, 6, -0.1, 0.75, -0.05, 0, -0.1, Math.PI / 2), 0.25, 0.16, 0.07));

  // ── Perpendicular logs running along Z (visible from sides) ──
  parts.push(colorGeo(cyl(0.16, 0.20, 2.6, 6, 0, 0.25, 0, Math.PI / 2, 0, 0), 0.30, 0.19, 0.09));
  parts.push(colorGeo(cyl(0.14, 0.17, 2.2, 6, 0.1, 0.55, 0.1, Math.PI / 2, 0.2, 0), 0.27, 0.17, 0.08));
  parts.push(colorGeo(cyl(0.12, 0.15, 1.8, 6, -0.1, 0.8, -0.08, Math.PI / 2, -0.15, 0), 0.29, 0.18, 0.07));

  // ── Cross-bracing logs (diagonal supports, different planes) ──
  parts.push(colorGeo(cyl(0.1, 0.12, 1.8, 5, 0.4, 0.4, 0.3, 0, 0.8, Math.PI * 0.4), 0.30, 0.19, 0.08));
  parts.push(colorGeo(cyl(0.09, 0.11, 1.6, 5, -0.3, 0.45, -0.2, 0, -0.6, Math.PI * 0.35), 0.26, 0.17, 0.07));
  parts.push(colorGeo(cyl(0.1, 0.11, 1.5, 5, 0.2, 0.35, -0.4, Math.PI * 0.3, 0, Math.PI * 0.4), 0.28, 0.18, 0.08));
  parts.push(colorGeo(cyl(0.09, 0.10, 1.4, 5, -0.2, 0.5, 0.35, Math.PI * 0.35, 0.5, 0), 0.27, 0.17, 0.07));

  // ── Large mud/debris mound (central mass visible from all angles) ──
  parts.push(colorGeo(sphere(0.8, 0, 0.3, 0, 8, 5), 0.22, 0.16, 0.10));
  parts.push(colorGeo(sphere(0.55, 0.35, 0.2, 0.3, 6, 4), 0.20, 0.15, 0.09));
  parts.push(colorGeo(sphere(0.5, -0.35, 0.15, -0.25, 6, 4), 0.24, 0.17, 0.11));
  parts.push(colorGeo(sphere(0.4, 0, 0.25, 0.4, 5, 4), 0.21, 0.16, 0.10));
  parts.push(colorGeo(sphere(0.35, 0.15, 0.2, -0.35, 5, 3), 0.23, 0.17, 0.11));

  // ── Small sticks poking out at various angles ──
  parts.push(colorGeo(cyl(0.04, 0.02, 0.9, 3, 0.5, 0.9, 0.15, 0.3, 0.5, 0.2), 0.35, 0.22, 0.10));
  parts.push(colorGeo(cyl(0.03, 0.02, 0.7, 3, -0.6, 0.85, -0.1, -0.4, -0.3, -0.15), 0.33, 0.21, 0.09));
  parts.push(colorGeo(cyl(0.035, 0.02, 0.8, 3, 0.2, 1.0, -0.2, 0.5, 0.2, -0.3), 0.30, 0.20, 0.08));
  parts.push(colorGeo(cyl(0.03, 0.015, 0.6, 3, -0.15, 0.95, 0.3, -0.6, -0.4, 0.25), 0.34, 0.22, 0.10));
  parts.push(colorGeo(cyl(0.04, 0.02, 0.7, 3, 0.3, 0.8, -0.4, 0.4, -0.6, 0.3), 0.31, 0.20, 0.09));

  // ── Rocks at base ──
  parts.push(colorGeo(sphere(0.22, 0.8, 0.05, 0.5, 4, 3), 0.4, 0.38, 0.35));
  parts.push(colorGeo(sphere(0.18, -0.7, 0.03, -0.4, 4, 3), 0.38, 0.36, 0.33));
  parts.push(colorGeo(sphere(0.2, 0.1, 0.04, -0.6, 4, 3), 0.42, 0.40, 0.37));
  parts.push(colorGeo(sphere(0.15, -0.1, 0.05, 0.7, 4, 3), 0.39, 0.37, 0.34));

  return mergeGeometries(parts)!;
}

/** Cattail/reed: tall thin stalk with a brown head */
function createReedGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // Stalk
  parts.push(colorGeo(cyl(0.03, 0.04, 2.0, 4, 0, 1.0, 0), 0.15, 0.30, 0.08));
  // Cattail head
  parts.push(colorGeo(cyl(0.08, 0.07, 0.4, 5, 0, 2.1, 0), 0.35, 0.18, 0.06));
  // Leaf blades
  parts.push(colorGeo(box(0.02, 1.4, 0.15, 0.06, 0.8, 0), 0.12, 0.28, 0.06));
  parts.push(colorGeo(box(0.02, 1.2, 0.12, -0.05, 0.7, 0.04), 0.14, 0.32, 0.07));
  return mergeGeometries(parts)!;
}

const damGeo = createDamGeometry();
const reedGeo = createReedGeometry();

/** Pond shader — circular water with ripples and shore foam */
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
        vec2 centered = vUv * 2.0 - 1.0;
        float dist = length(centered);
        float edge = 1.0 - smoothstep(0.7, 1.0, dist);
        if (edge < 0.01) discard;

        vec2 rippleUv = centered * 3.0;
        float n = noise(rippleUv + vec2(uTime * 0.05, uTime * 0.03)) * 0.6
                + noise(rippleUv * 2.0 + vec2(0.0, uTime * 0.08)) * 0.4;
        float ripple = smoothstep(0.5, 0.65, n);

        vec3 col = uColor + ripple * 0.1;

        // Concentric ripple rings from center
        float ring = sin(dist * 12.0 - uTime * 1.5) * 0.5 + 0.5;
        ring *= smoothstep(0.0, 0.3, dist) * (1.0 - smoothstep(0.6, 0.9, dist));
        col += ring * 0.04;

        float foam = smoothstep(0.6, 0.88, dist) * 0.3;
        col += foam;

        // Specular highlight
        float spec = smoothstep(0.92, 0.96, 1.0 - dist) * 0.15;
        col += spec;

        gl_FragColor = vec4(col, uOpacity * edge + foam * 0.3);
      }
    `,
  });
}

/** Muddy shoreline ring around each pond */
function createShoreMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({
    color: new THREE.Color(0.22, 0.18, 0.12),
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  });
}

export function BeaverDams() {
  const damMeshRef = useRef<THREE.InstancedMesh>(null);
  const ringMeshRef = useRef<THREE.InstancedMesh>(null);
  const pondMeshRef = useRef<THREE.InstancedMesh>(null);
  const shoreMeshRef = useRef<THREE.InstancedMesh>(null);
  const reedMeshRef = useRef<THREE.InstancedMesh>(null);

  const pondMat = useMemo(createPondMaterial, []);
  const shoreMat = useMemo(createShoreMaterial, []);

  useFrame((_, delta) => {
    const dams = getDamSites();
    const refs = [damMeshRef, ringMeshRef, pondMeshRef, shoreMeshRef, reedMeshRef];
    if (refs.some(r => !r.current)) return;

    pondMat.uniforms.uTime.value += delta;

    const health = getAverageRiparianHealth();
    const degraded = new THREE.Color(0.15, 0.14, 0.09);
    const healthy = new THREE.Color(0.05, 0.18, 0.40);
    pondMat.uniforms.uColor.value.lerpColors(degraded, healthy, health);
    pondMat.uniforms.uOpacity.value = 0.5 + health * 0.25;

    // Shore gets greener with health
    shoreMat.color.setRGB(0.22 - health * 0.06, 0.18 + health * 0.08, 0.12 - health * 0.02);

    const ringColor = new THREE.Color();

    for (let i = 0; i < MAX_DAMS; i++) {
      if (i < dams.length) {
        const d = dams[i];
        const damAngle = d.x * 0.5;

        // ── Dam structure — scale up so it's visible from afar ──
        const baseY = d.y ?? 2.0;
        dummy.position.set(d.x, baseY + 0.3, d.z);
        dummy.rotation.set(0, damAngle, 0);
        const damScale = (1.2 + d.health * 0.8) * 2.0;
        dummy.scale.setScalar(damScale);
        dummy.updateMatrix();
        damMeshRef.current!.setMatrixAt(i, dummy.matrix);

        // ── Recovery ring ──
        const ringScale = 6 + d.health * 26;
        dummy.position.set(d.x, baseY + 0.2, d.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(ringScale, ringScale, 1);
        dummy.updateMatrix();
        ringMeshRef.current!.setMatrixAt(i, dummy.matrix);
        ringColor.setHSL(0.33, 0.5 + d.health * 0.4, 0.2 + d.health * 0.3);
        ringMeshRef.current!.setColorAt(i, ringColor);

        // ── Pond behind dam ──
        const pondSize = d.health * 8 + 2.5;
        const pondOffX = -Math.cos(damAngle) * (4 + d.health * 3);
        const pondOffZ = -Math.sin(damAngle) * (4 + d.health * 3);
        dummy.position.set(d.x + pondOffX, baseY + 0.15, d.z + pondOffZ);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(pondSize, pondSize, 1);
        dummy.updateMatrix();
        pondMeshRef.current!.setMatrixAt(i, dummy.matrix);

        // ── Muddy shore ring around pond ──
        const shoreSize = pondSize * 1.4;
        dummy.position.set(d.x + pondOffX, baseY + 0.05, d.z + pondOffZ);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(shoreSize, shoreSize, 1);
        dummy.updateMatrix();
        shoreMeshRef.current!.setMatrixAt(i, dummy.matrix);

        // ── Reeds around pond perimeter ──
        for (let r = 0; r < REEDS_PER_DAM; r++) {
          const reedIdx = i * REEDS_PER_DAM + r;
          const angle = (r / REEDS_PER_DAM) * Math.PI * 2 + d.x * 0.3;
          const reedDist = pondSize * 0.75 + 0.5;
          const rx = d.x + pondOffX + Math.cos(angle) * reedDist;
          const rz = d.z + pondOffZ + Math.sin(angle) * reedDist;

          // Only show reeds when health is decent
          if (d.health > 0.3) {
            const reedScale = (0.5 + d.health * 0.7) * 1.8;
            const sway = Math.sin(pondMat.uniforms.uTime.value * 1.2 + r * 1.5 + d.x) * 0.08;
            dummy.position.set(rx, (d.y ?? 2.0) + 0.1, rz);
            dummy.rotation.set(sway, angle + Math.PI * 0.5, 0);
            dummy.scale.setScalar(reedScale);
          } else {
            dummy.position.set(0, -100, 0);
            dummy.scale.setScalar(0);
          }
          dummy.updateMatrix();
          reedMeshRef.current!.setMatrixAt(reedIdx, dummy.matrix);
        }
      } else {
        // Hide unused slots
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        damMeshRef.current!.setMatrixAt(i, dummy.matrix);
        ringMeshRef.current!.setMatrixAt(i, dummy.matrix);
        pondMeshRef.current!.setMatrixAt(i, dummy.matrix);
        shoreMeshRef.current!.setMatrixAt(i, dummy.matrix);

        for (let r = 0; r < REEDS_PER_DAM; r++) {
          reedMeshRef.current!.setMatrixAt(i * REEDS_PER_DAM + r, dummy.matrix);
        }
      }
    }

    damMeshRef.current!.instanceMatrix.needsUpdate = true;
    ringMeshRef.current!.instanceMatrix.needsUpdate = true;
    pondMeshRef.current!.instanceMatrix.needsUpdate = true;
    shoreMeshRef.current!.instanceMatrix.needsUpdate = true;
    reedMeshRef.current!.instanceMatrix.needsUpdate = true;
    if (ringMeshRef.current!.instanceColor) ringMeshRef.current!.instanceColor.needsUpdate = true;
  });

  return (
    <>
      {/* Elaborate dam structures */}
      <instancedMesh ref={damMeshRef} args={[damGeo, undefined, MAX_DAMS]} castShadow receiveShadow>
        <meshLambertMaterial vertexColors side={THREE.DoubleSide} />
      </instancedMesh>

      {/* Recovery rings */}
      <instancedMesh ref={ringMeshRef} args={[undefined, undefined, MAX_DAMS]}>
        <ringGeometry args={[0.85, 1, 32]} />
        <meshBasicMaterial vertexColors transparent opacity={0.35} side={THREE.DoubleSide} />
      </instancedMesh>

      {/* Muddy shore around ponds */}
      <instancedMesh ref={shoreMeshRef} args={[undefined, undefined, MAX_DAMS]} material={shoreMat}>
        <circleGeometry args={[1, 24]} />
      </instancedMesh>

      {/* Beaver ponds */}
      <instancedMesh ref={pondMeshRef} args={[undefined, undefined, MAX_DAMS]} material={pondMat}>
        <circleGeometry args={[1, 24]} />
      </instancedMesh>

      {/* Cattail reeds around pond edges */}
      <instancedMesh ref={reedMeshRef} args={[reedGeo, undefined, MAX_DAMS * REEDS_PER_DAM]} castShadow>
        <meshLambertMaterial vertexColors side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}
