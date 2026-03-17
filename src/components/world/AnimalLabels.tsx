import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAgentStore } from '@/store/agentStore';
import type { AgentType } from '@/lib/boids';
import { fbm } from '@/lib/noise';

const LABEL_Y_OFFSET = 2.5;
const FLY_HEIGHT = 8;
const FLYING_TYPES = new Set<AgentType>(['raven', 'osprey']);

const EMOJIS: Record<AgentType, string> = {
  wolf: '🐺', elk: '🦌', bear: '🐻', beaver: '🦫', raven: '🐦‍⬛',
  bison: '🦬', moose: '🫎', coyote: '🐺', osprey: '🦅',
};

function getTerrainHeight(x: number, z: number): number {
  const SIZE = 200;
  const MAX_HEIGHT = 28;
  let h = 0;
  h += fbm(x * 0.008, z * 0.008, 6) * MAX_HEIGHT;
  h += fbm(x * 0.02, z * 0.02, 4) * 5;
  const riverDist = Math.abs(z - Math.sin(x * 0.03) * 20);
  const riverFactor = Math.max(0, 1 - riverDist / 15);
  h *= 1 - riverFactor * 0.6;
  const radial = Math.sqrt(x * x + z * z) / (SIZE * 0.5);
  const bowl = Math.pow(Math.min(radial, 1), 2.2) * 10;
  h = Math.max(0.5, h) + bowl;
  return h;
}

function createLabelTexture(type: AgentType): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 64);

  // Background pill
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  const r = 12;
  ctx.beginPath();
  ctx.roundRect(8, 6, 240, 52, r);
  ctx.fill();

  // Text
  const emoji = EMOJIS[type] ?? '🐾';
  const label = `${emoji} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, 128, 34);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

const MAX_SPRITES = 270; // total across all species

export function AnimalLabels() {
  const groupRef = useRef<THREE.Group>(null);
  const spritesRef = useRef<THREE.Sprite[]>([]);
  const materialsRef = useRef<Map<AgentType, THREE.SpriteMaterial>>(new Map());

  const textures = useMemo(() => {
    const map = new Map<AgentType, THREE.CanvasTexture>();
    const types: AgentType[] = ['wolf', 'elk', 'bear', 'beaver', 'raven', 'bison', 'moose', 'coyote', 'osprey'];
    for (const t of types) {
      map.set(t, createLabelTexture(t));
    }
    return map;
  }, []);

  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;
    const sprites: THREE.Sprite[] = [];
    const mats = new Map<AgentType, THREE.SpriteMaterial>();

    for (const [type, tex] of textures) {
      mats.set(type, new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    }
    materialsRef.current = mats;

    // Pre-create sprite pool
    const defaultMat = mats.get('wolf')!;
    for (let i = 0; i < MAX_SPRITES; i++) {
      const sprite = new THREE.Sprite(defaultMat);
      sprite.scale.set(3, 0.75, 1);
      sprite.visible = false;
      sprite.renderOrder = 999;
      group.add(sprite);
      sprites.push(sprite);
    }
    spritesRef.current = sprites;

    return () => {
      for (const s of sprites) group.remove(s);
      for (const m of mats.values()) m.dispose();
      for (const t of textures.values()) t.dispose();
    };
  }, [textures]);

  useFrame(() => {
    const agents = useAgentStore.getState().agents;
    const alive = agents.filter(a => a.alive);
    const sprites = spritesRef.current;
    const mats = materialsRef.current;

    for (let i = 0; i < MAX_SPRITES; i++) {
      if (i < alive.length) {
        const a = alive[i];
        const isFlying = FLYING_TYPES.has(a.type);
        const y = getTerrainHeight(a.x, a.z) + LABEL_Y_OFFSET + (isFlying ? FLY_HEIGHT + Math.sin(a.age * 2 + a.id) * 1.5 : 0);
        sprites[i].position.set(a.x, y, a.z);
        sprites[i].material = mats.get(a.type)!;
        sprites[i].visible = true;
      } else {
        sprites[i].visible = false;
      }
    }
  });

  return <group ref={groupRef} />;
}
