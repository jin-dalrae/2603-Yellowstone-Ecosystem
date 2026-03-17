import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fbm } from '@/lib/noise';
import { useSimulationStore, SEASON_INDEX } from '@/store/simulationStore';

const SIZE = 200;
const SEGMENTS = 200;
const MAX_HEIGHT = 28;

const vertexShader = `
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vHeight;

  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    vHeight = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uSeason;
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vHeight;

  vec3 seasonMix(vec3 spring, vec3 summer, vec3 autumn, vec3 winter, float s) {
    if (s < 1.0) return mix(spring, summer, s);
    if (s < 2.0) return mix(summer, autumn, s - 1.0);
    return mix(autumn, winter, s - 2.0);
  }

  void main() {
    float slope = 1.0 - dot(vNormal, vec3(0.0, 1.0, 0.0));
    float h = vHeight;

    // Biome base colors per season [spring, summer, autumn, winter]
    vec3 waterEdge, grassland, forest, alpine, rock;

    // Spring
    vec3 sp_water = vec3(0.18, 0.52, 0.18);
    vec3 sp_grass = vec3(0.35, 0.55, 0.12);
    vec3 sp_forest = vec3(0.08, 0.35, 0.06);
    vec3 sp_alpine = vec3(0.45, 0.50, 0.35);
    vec3 sp_rock = vec3(0.42, 0.40, 0.38);

    // Summer
    vec3 su_water = vec3(0.15, 0.45, 0.12);
    vec3 su_grass = vec3(0.45, 0.52, 0.10);
    vec3 su_forest = vec3(0.05, 0.28, 0.03);
    vec3 su_alpine = vec3(0.50, 0.48, 0.32);
    vec3 su_rock = vec3(0.44, 0.42, 0.38);

    // Autumn
    vec3 au_water = vec3(0.35, 0.38, 0.10);
    vec3 au_grass = vec3(0.55, 0.40, 0.08);
    vec3 au_forest = vec3(0.40, 0.22, 0.05);
    vec3 au_alpine = vec3(0.52, 0.45, 0.28);
    vec3 au_rock = vec3(0.45, 0.40, 0.35);

    // Winter
    vec3 wi_water = vec3(0.7, 0.75, 0.8);
    vec3 wi_grass = vec3(0.75, 0.78, 0.82);
    vec3 wi_forest = vec3(0.12, 0.22, 0.15);
    vec3 wi_alpine = vec3(0.85, 0.87, 0.9);
    vec3 wi_rock = vec3(0.5, 0.5, 0.48);

    waterEdge = seasonMix(sp_water, su_water, au_water, wi_water, uSeason);
    grassland = seasonMix(sp_grass, su_grass, au_grass, wi_grass, uSeason);
    forest = seasonMix(sp_forest, su_forest, au_forest, wi_forest, uSeason);
    alpine = seasonMix(sp_alpine, su_alpine, au_alpine, wi_alpine, uSeason);
    rock = seasonMix(sp_rock, su_rock, au_rock, wi_rock, uSeason);

    // Height-based biome
    vec3 color = waterEdge;
    if (h < 3.0) color = waterEdge;
    else if (h < 7.0) color = mix(waterEdge, grassland, (h - 3.0) / 4.0);
    else if (h < 13.0) color = mix(grassland, forest, (h - 7.0) / 6.0);
    else if (h < 20.0) color = mix(forest, alpine, (h - 13.0) / 7.0);
    else color = mix(alpine, rock, clamp((h - 20.0) / 8.0, 0.0, 1.0));

    // Slope-based rock
    if (slope > 0.5) color = mix(color, rock, clamp((slope - 0.5) / 0.3, 0.0, 1.0));

    // Winter snow overlay
    float winterFactor = max(0.0, (uSeason - 2.0));
    float snowLine = mix(25.0, 2.0, winterFactor);
    float snowAmount = clamp((h - snowLine) / 5.0, 0.0, 1.0) * winterFactor;
    snowAmount += winterFactor * 0.15 * (1.0 - slope);
    vec3 snow = vec3(0.92, 0.94, 0.97);
    color = mix(color, snow, clamp(snowAmount, 0.0, 1.0));

    // Geothermal zones (specific areas - warm tint)
    float geoX = vWorldPos.x * 0.03;
    float geoZ = vWorldPos.z * 0.03;
    float geoDist = length(vec2(geoX - 1.0, geoZ + 0.5));
    float geoDist2 = length(vec2(geoX + 1.2, geoZ - 0.8));
    float geoFactor = smoothstep(0.8, 0.0, min(geoDist, geoDist2));
    if (h < 8.0) {
      vec3 geoColor = vec3(0.6, 0.55, 0.35);
      color = mix(color, geoColor, geoFactor * 0.5);
    }

    // Lighting
    vec3 lightDir = normalize(vec3(0.4, 0.8, 0.3));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.35;

    // Seasonal ambient tint
    vec3 ambientColor = seasonMix(
      vec3(0.3, 0.35, 0.25),
      vec3(0.35, 0.33, 0.25),
      vec3(0.35, 0.28, 0.2),
      vec3(0.3, 0.32, 0.38),
      uSeason
    );

    color *= ambientColor + diff * 0.65;

    // Distance fog
    float fogDist = length(vWorldPos.xz) / 120.0;
    vec3 fogColor = seasonMix(
      vec3(0.55, 0.65, 0.72),
      vec3(0.6, 0.68, 0.75),
      vec3(0.6, 0.55, 0.5),
      vec3(0.72, 0.75, 0.82),
      uSeason
    );
    color = mix(color, fogColor, clamp(fogDist * fogDist, 0.0, 0.7));

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function Terrain() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const season = useSimulationStore((s) => s.season);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Multi-scale terrain
      let h = 0;
      h += fbm(x * 0.008, z * 0.008, 6) * MAX_HEIGHT;
      h += fbm(x * 0.02, z * 0.02, 4) * 5;

      // Valley carving (river corridor)
      const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
      const riverFactor = Math.max(0, 1 - riverDist / 15);
      h *= 1 - riverFactor * 0.6;

      // Gentle concave bowl to lift the horizon without creating an awkward rim
      const radial = Math.sqrt(x * x + z * z) / (SIZE * 0.5);
      const bowl = Math.pow(Math.min(radial, 1), 2.2) * 10;
      h = Math.max(0.5, h) + bowl;

      pos.setY(i, h);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  const uniforms = useMemo(
    () => ({
      uSeason: { value: SEASON_INDEX[season] },
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      const target = SEASON_INDEX[useSimulationStore.getState().season];
      const current = materialRef.current.uniforms.uSeason.value;
      materialRef.current.uniforms.uSeason.value += (target - current) * Math.min(1, delta * 2);
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh geometry={geometry} receiveShadow>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
