import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore, SEASON_INDEX } from '@/store/simulationStore';
import { fbm } from '@/lib/noise';
import { getAverageRiparianHealth } from '@/lib/riparianState';

const SIZE = 200;
const MAX_HEIGHT = 28;

function getHeight(x: number, z: number) {
  let h = fbm(x * 0.008, z * 0.008, 6) * MAX_HEIGHT;
  h += fbm(x * 0.02, z * 0.02, 4) * 5;
  const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
  const riverFactor = Math.max(0, 1 - riverDist / 15);
  h *= 1 - riverFactor * 0.6;
  const radial = Math.sqrt(x * x + z * z) / (SIZE * 0.5);
  const bowl = Math.pow(Math.min(radial, 1), 2.2) * 10;
  return Math.max(0.5, h) + bowl;
}

/**
 * Wide, flat ribbon river with UV-scroll flow animation
 */
function createRiverGeometry(): THREE.BufferGeometry {
  const SEGMENTS = 120;
  const positions: number[] = [];
  const uvs: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const x = -110 + t * 220;
    const centerZ = Math.sin(x * 0.03) * 20;
    const radial = Math.sqrt(x * x + centerZ * centerZ) / (SIZE * 0.5);
    const bowl = Math.pow(Math.min(radial, 1), 2.2) * 10;
    const h = 1.6 + bowl;

    const dx = 1;
    const dz = Math.cos(x * 0.03) * 20 * 0.03;
    const len = Math.sqrt(dx * dx + dz * dz);
    const nx = -dz / len;
    const nz = dx / len;

    // Store positions at MAX width (1.0 scale = full width)
    const MAX_HALF_WIDTH = 9;

    // Left vertex
    positions.push(x + nx * MAX_HALF_WIDTH, h, centerZ + nz * MAX_HALF_WIDTH);
    normals.push(nx, 0, nz); // perpendicular direction
    uvs.push(0, t * 8);

    // Center reference (stored as attribute for shader lerp)
    // We store centerX, centerZ as custom attributes

    // Right vertex
    positions.push(x - nx * MAX_HALF_WIDTH, h, centerZ - nz * MAX_HALF_WIDTH);
    normals.push(-nx, 0, -nz);
    uvs.push(1, t * 8);

    if (i < SEGMENTS) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  // Store center positions for each vertex pair so the shader can lerp width
  const centers = new Float32Array(positions.length);
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const x = -110 + t * 220;
    const centerZ = Math.sin(x * 0.03) * 20;
    const radial = Math.sqrt(x * x + centerZ * centerZ) / (SIZE * 0.5);
    const bowl = Math.pow(Math.min(radial, 1), 2.2) * 10;
    const h = 1.6 + bowl;
    centers[i * 6] = x;
    centers[i * 6 + 1] = h;
    centers[i * 6 + 2] = centerZ;
    centers[i * 6 + 3] = x;
    centers[i * 6 + 4] = h;
    centers[i * 6 + 5] = centerZ;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setAttribute('aCenter', new THREE.Float32BufferAttribute(centers, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// Create a water flow shader material
function createWaterMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0.08, 0.22, 0.42) },
      uOpacity: { value: 0.72 },
      uWidthScale: { value: 0.55 }, // 0-1, maps to min/max river width
    },
    vertexShader: `
      attribute vec3 aCenter;
      varying vec2 vUv;
      uniform float uWidthScale;
      void main() {
        // Lerp between center and full-width position based on scale
        vec3 pos = mix(aCenter, position, uWidthScale);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uWidthScale;
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
        vec2 flowUv = vUv;
        flowUv.y += uTime * 0.15;

        float n1 = noise(flowUv * 6.0);
        float n2 = noise(flowUv * 12.0 + vec2(uTime * 0.08, 0.0));
        float n = n1 * 0.6 + n2 * 0.4;

        float ripple = smoothstep(0.55, 0.7, n);

        vec3 col = uColor + ripple * 0.15;

        float edge = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
        float foam = (1.0 - edge) * 0.3;
        col += foam;

        gl_FragColor = vec4(col, uOpacity * edge + foam * 0.5);
      }
    `,
  });
}

export function Water() {
  const lakeRef = useRef<THREE.Mesh>(null);
  const riverMatRef = useRef<THREE.ShaderMaterial>(null);
  const lakeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const riverGeo = useMemo(createRiverGeometry, []);
  const riverMat = useMemo(createWaterMaterial, []);

  const lakeGeo = useMemo(() => {
    const geo = new THREE.CircleGeometry(14, 32);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useFrame((_, delta) => {
    const season = useSimulationStore.getState().season;
    const si = SEASON_INDEX[season];
    const riparianHealth = getAverageRiparianHealth(); // 0-1

    // Animate river flow
    riverMat.uniforms.uTime.value += delta;

    // Seasonal + health-responsive colors
    // Healthy river: clear deep blue. Degraded: murky brown-green
    const winterBlue = new THREE.Color(0.5, 0.6, 0.7);
    const healthyBlue = new THREE.Color(0.06, 0.20, 0.45);
    const degradedBrown = new THREE.Color(0.18, 0.16, 0.10);
    const t = Math.max(0, (si - 2));

    const baseColor = new THREE.Color().lerpColors(degradedBrown, healthyBlue, riparianHealth);
    const c = new THREE.Color().lerpColors(baseColor, winterBlue, t);
    riverMat.uniforms.uColor.value.copy(c);
    // River width: min 0.35 (narrow/degraded) to 1.0 (full/healthy)
    const targetWidth = 0.35 + riparianHealth * 0.65;
    const curWidth = riverMat.uniforms.uWidthScale.value;
    riverMat.uniforms.uWidthScale.value += (targetWidth - curWidth) * Math.min(1, delta * 0.5);
    // Healthier water is clearer (higher opacity), degraded is murkier
    riverMat.uniforms.uOpacity.value = (0.55 + riparianHealth * 0.25) - t * 0.1;

    if (lakeMaterialRef.current) {
      lakeMaterialRef.current.color.lerpColors(baseColor, winterBlue, t);
      lakeMaterialRef.current.opacity = (0.6 + riparianHealth * 0.2) - t * 0.1;
    }
  });

  return (
    <>
      {/* Lake */}
      <mesh ref={lakeRef} geometry={lakeGeo} position={[25, 2.0, -15]} receiveShadow>
        <meshStandardMaterial
          ref={lakeMaterialRef}
          color={[0.08, 0.22, 0.42]}
          transparent
          opacity={0.75}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>

      {/* River — wide flat ribbon with flow shader */}
      <mesh geometry={riverGeo} material={riverMat} />

      {/* Riverbanks — subtle shoreline strips */}
      <RiverBanks />

      {/* Lake bank ring */}
      <LakeBank position={[25, 0, -15]} radius={14} />
    </>
  );
}

/** Thin strips of sandy/muddy terrain along the river edges */
function RiverBanks() {
  const geo = useMemo(() => {
    const SEGMENTS = 80;
    const BANK_WIDTH = 2.5;
    const RIVER_WIDTH = 5;
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    // Two bank strips (left and right)
    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? 1 : -1;
      const offset = positions.length / 3;

      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const x = -110 + t * 220;
        const centerZ = Math.sin(x * 0.03) * 20;
        const dx = 1;
        const dz = Math.cos(x * 0.03) * 20 * 0.03;
        const len = Math.sqrt(dx * dx + dz * dz);
        const nx = -dz / len;
        const nz = dx / len;

        // Inner edge (river side)
        const ix = x + nx * RIVER_WIDTH * sign;
        const iz = centerZ + nz * RIVER_WIDTH * sign;
        positions.push(ix, 1.55, iz);
        colors.push(0.35, 0.28, 0.18);

        // Outer edge
        const ox = x + nx * (RIVER_WIDTH + BANK_WIDTH) * sign;
        const oz = centerZ + nz * (RIVER_WIDTH + BANK_WIDTH) * sign;
        const h = getHeight(ox, oz);
        positions.push(ox, Math.max(1.5, h * 0.3 + 1.2), oz);
        colors.push(0.3, 0.32, 0.15);

        if (i < SEGMENTS) {
          const base = offset + i * 2;
          indices.push(base, base + 1, base + 2);
          indices.push(base + 1, base + 3, base + 2);
        }
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geo}>
      <meshLambertMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}

/** Sandy/muddy ring around the lake */
function LakeBank({ position, radius }: { position: [number, number, number]; radius: number }) {
  const geo = useMemo(() => {
    const SEGS = 48;
    const BANK_WIDTH = 3;
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= SEGS; i++) {
      const angle = (i / SEGS) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Inner edge (lake shore)
      const ix = position[0] + cos * radius;
      const iz = position[2] + sin * radius;
      positions.push(ix, 1.95, iz);
      colors.push(0.35, 0.28, 0.18);

      // Outer edge
      const ox = position[0] + cos * (radius + BANK_WIDTH);
      const oz = position[2] + sin * (radius + BANK_WIDTH);
      const h = getHeight(ox, oz);
      positions.push(ox, Math.max(1.8, h * 0.3 + 1.4), oz);
      colors.push(0.3, 0.32, 0.15);

      if (i < SEGS) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [position, radius]);

  return (
    <mesh geometry={geo}>
      <meshLambertMaterial vertexColors side={THREE.DoubleSide} />
    </mesh>
  );
}
