import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSimulationStore, SEASON_INDEX } from '@/store/simulationStore';
import { fbm } from '@/lib/noise';

const SIZE = 200;
const MAX_HEIGHT = 28;

function getHeight(x: number, z: number) {
  let h = fbm(x * 0.008, z * 0.008, 6) * MAX_HEIGHT;
  h += fbm(x * 0.02, z * 0.02, 4) * 5;
  const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
  const riverFactor = Math.max(0, 1 - riverDist / 15);
  h *= 1 - riverFactor * 0.6;
  const edgeDist = Math.max(Math.abs(x), Math.abs(z)) / (SIZE / 2);
  const edgeFalloff = 1 - Math.pow(Math.max(0, edgeDist - 0.6) / 0.4, 2);
  h *= edgeFalloff;
  return Math.max(0.5, h);
}

/**
 * Wide, flat ribbon river with UV-scroll flow animation
 */
function createRiverGeometry(): THREE.BufferGeometry {
  const SEGMENTS = 120;
  const HALF_WIDTH = 5; // much wider than previous tube
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const x = -95 + t * 190;
    const centerZ = Math.sin(x * 0.03) * 20;
    const h = 1.6; // water surface height

    // Perpendicular direction for width
    const dx = 1;
    const dz = Math.cos(x * 0.03) * 20 * 0.03;
    const len = Math.sqrt(dx * dx + dz * dz);
    const nx = -dz / len;
    const nz = dx / len;

    // Left vertex
    positions.push(x + nx * HALF_WIDTH, h, centerZ + nz * HALF_WIDTH);
    uvs.push(0, t * 8); // repeat UV for tiling

    // Right vertex
    positions.push(x - nx * HALF_WIDTH, h, centerZ - nz * HALF_WIDTH);
    uvs.push(1, t * 8);

    if (i < SEGMENTS) {
      const base = i * 2;
      indices.push(base, base + 1, base + 2);
      indices.push(base + 1, base + 3, base + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
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

      // Simple noise
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
        // Scrolling UV for flow
        vec2 flowUv = vUv;
        flowUv.y += uTime * 0.15;

        // Layered noise for water texture
        float n1 = noise(flowUv * 6.0);
        float n2 = noise(flowUv * 12.0 + vec2(uTime * 0.08, 0.0));
        float n = n1 * 0.6 + n2 * 0.4;

        // Ripple highlights
        float ripple = smoothstep(0.55, 0.7, n);

        vec3 col = uColor + ripple * 0.15;

        // Foam at edges
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

    // Animate river flow
    riverMat.uniforms.uTime.value += delta;

    // Seasonal colors
    const winterBlue = new THREE.Color(0.5, 0.6, 0.7);
    const summerBlue = new THREE.Color(0.08, 0.22, 0.42);
    const t = Math.max(0, (si - 2));

    const c = new THREE.Color().lerpColors(summerBlue, winterBlue, t);
    riverMat.uniforms.uColor.value.copy(c);
    riverMat.uniforms.uOpacity.value = 0.72 - t * 0.1;

    if (lakeMaterialRef.current) {
      lakeMaterialRef.current.color.lerpColors(summerBlue, winterBlue, t);
      lakeMaterialRef.current.opacity = 0.75 - t * 0.1;
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
        const x = -90 + t * 180;
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
