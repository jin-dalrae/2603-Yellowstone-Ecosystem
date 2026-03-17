// Low-poly stylized animal geometry factories
// Each animal is built from merged primitive geometries for recognizable silhouettes

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { AgentType } from '@/lib/boids';

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

function cone(r: number, h: number, seg: number, x = 0, y = 0, z = 0): THREE.BufferGeometry {
  const g = new THREE.ConeGeometry(r, h, seg);
  g.translate(x, y, z);
  return g;
}

function cylinder(rTop: number, rBot: number, h: number, seg: number, x = 0, y = 0, z = 0): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg);
  g.translate(x, y, z);
  return g;
}

// ── Wolf ──────────────────────────────────────────────
export function createWolfGeo(): THREE.BufferGeometry {
  const parts = [
    // Body
    box(0.6, 0.55, 1.4, 0, 0.7, 0),
    // Head
    box(0.45, 0.4, 0.5, 0, 0.95, 0.75),
    // Snout
    box(0.2, 0.2, 0.4, 0, 0.85, 1.1),
    // Ears
    cone(0.08, 0.2, 3, -0.15, 1.2, 0.7),
    cone(0.08, 0.2, 3, 0.15, 1.2, 0.7),
    // Legs
    box(0.15, 0.5, 0.15, -0.2, 0.25, 0.4),
    box(0.15, 0.5, 0.15, 0.2, 0.25, 0.4),
    box(0.15, 0.5, 0.15, -0.2, 0.25, -0.4),
    box(0.15, 0.5, 0.15, 0.2, 0.25, -0.4),
    // Tail
    cylinder(0.06, 0.04, 0.6, 3, 0, 0.8, -0.95),
  ];
  return mergeGeometries(parts)!;
}

// ── Elk ──────────────────────────────────────────────
export function createElkGeo(): THREE.BufferGeometry {
  const parts = [
    // Body - elongated
    box(0.5, 0.6, 1.6, 0, 1.0, 0),
    // Neck (angled up)
    box(0.3, 0.7, 0.3, 0, 1.5, 0.7),
    // Head
    box(0.3, 0.3, 0.5, 0, 1.8, 0.9),
    // Antlers (simplified branches)
    cylinder(0.03, 0.03, 0.5, 3, -0.15, 2.15, 0.85),
    cylinder(0.03, 0.03, 0.5, 3, 0.15, 2.15, 0.85),
    cylinder(0.03, 0.03, 0.3, 3, -0.25, 2.3, 0.9),
    cylinder(0.03, 0.03, 0.3, 3, 0.25, 2.3, 0.9),
    // Legs - tall
    box(0.12, 0.8, 0.12, -0.18, 0.4, 0.45),
    box(0.12, 0.8, 0.12, 0.18, 0.4, 0.45),
    box(0.12, 0.8, 0.12, -0.18, 0.4, -0.45),
    box(0.12, 0.8, 0.12, 0.18, 0.4, -0.45),
  ];
  return mergeGeometries(parts)!;
}

// ── Bear ──────────────────────────────────────────────
export function createBearGeo(): THREE.BufferGeometry {
  const parts = [
    // Body - large rounded
    sphere(0.6, 0, 0.8, 0, 5, 4),
    box(0.9, 0.7, 1.2, 0, 0.8, 0),
    // Head
    sphere(0.35, 0, 1.1, 0.6, 4, 3),
    // Snout
    box(0.2, 0.15, 0.25, 0, 1.0, 0.9),
    // Ears
    sphere(0.1, -0.2, 1.35, 0.45, 3, 2),
    sphere(0.1, 0.2, 1.35, 0.45, 3, 2),
    // Legs - thick
    box(0.22, 0.55, 0.22, -0.28, 0.28, 0.35),
    box(0.22, 0.55, 0.22, 0.28, 0.28, 0.35),
    box(0.22, 0.55, 0.22, -0.28, 0.28, -0.35),
    box(0.22, 0.55, 0.22, 0.28, 0.28, -0.35),
  ];
  return mergeGeometries(parts)!;
}

// ── Beaver ──────────────────────────────────────────────
export function createBeaverGeo(): THREE.BufferGeometry {
  const parts = [
    // Body - low and wide
    box(0.5, 0.3, 0.8, 0, 0.35, 0),
    // Head
    box(0.35, 0.25, 0.3, 0, 0.45, 0.45),
    // Flat tail
    box(0.25, 0.06, 0.5, 0, 0.25, -0.65),
    // Legs (short)
    box(0.1, 0.2, 0.1, -0.18, 0.1, 0.2),
    box(0.1, 0.2, 0.1, 0.18, 0.1, 0.2),
    box(0.1, 0.2, 0.1, -0.18, 0.1, -0.15),
    box(0.1, 0.2, 0.1, 0.18, 0.1, -0.15),
  ];
  return mergeGeometries(parts)!;
}

// ── Raven ──────────────────────────────────────────────
export function createRavenGeo(): THREE.BufferGeometry {
  const parts = [
    // Body
    sphere(0.2, 0, 0, 0, 4, 3),
    // Head
    sphere(0.12, 0, 0.15, 0.25, 3, 2),
    // Beak
    cone(0.04, 0.2, 3, 0, 0.12, 0.4),
    // Wings spread
    box(0.7, 0.04, 0.35, -0.45, 0.02, -0.05),
    box(0.7, 0.04, 0.35, 0.45, 0.02, -0.05),
    // Tail feathers
    box(0.15, 0.03, 0.25, 0, -0.02, -0.3),
  ];
  const g = mergeGeometries(parts)!;
  g.rotateX(-0.1);
  return g;
}

// ── Bison ──────────────────────────────────────────────
export function createBisonGeo(): THREE.BufferGeometry {
  const parts = [
    // Body - massive
    box(0.9, 0.8, 1.6, 0, 1.0, 0),
    // Hump
    sphere(0.45, 0, 1.5, 0.3, 4, 3),
    // Head (lower, broad)
    box(0.55, 0.5, 0.45, 0, 0.9, 0.9),
    // Horns
    cylinder(0.04, 0.03, 0.3, 3, -0.3, 1.2, 0.85),
    cylinder(0.04, 0.03, 0.3, 3, 0.3, 1.2, 0.85),
    // Legs - stocky
    box(0.18, 0.7, 0.18, -0.3, 0.35, 0.5),
    box(0.18, 0.7, 0.18, 0.3, 0.35, 0.5),
    box(0.18, 0.7, 0.18, -0.3, 0.35, -0.5),
    box(0.18, 0.7, 0.18, 0.3, 0.35, -0.5),
    // Beard
    box(0.2, 0.25, 0.15, 0, 0.6, 0.95),
  ];
  return mergeGeometries(parts)!;
}

// ── Moose ──────────────────────────────────────────────
export function createMooseGeo(): THREE.BufferGeometry {
  const parts = [
    // Body
    box(0.55, 0.65, 1.5, 0, 1.2, 0),
    // Neck - tall
    box(0.3, 0.8, 0.3, 0, 1.8, 0.6),
    // Head
    box(0.35, 0.35, 0.55, 0, 2.1, 0.85),
    // Snout / dewlap
    box(0.15, 0.2, 0.15, 0, 1.85, 1.05),
    // Palmate antlers (flat plates)
    box(0.4, 0.04, 0.35, -0.3, 2.35, 0.75),
    box(0.4, 0.04, 0.35, 0.3, 2.35, 0.75),
    // Long legs
    box(0.12, 0.95, 0.12, -0.2, 0.5, 0.4),
    box(0.12, 0.95, 0.12, 0.2, 0.5, 0.4),
    box(0.12, 0.95, 0.12, -0.2, 0.5, -0.4),
    box(0.12, 0.95, 0.12, 0.2, 0.5, -0.4),
  ];
  return mergeGeometries(parts)!;
}

// ── Coyote ──────────────────────────────────────────────
export function createCoyoteGeo(): THREE.BufferGeometry {
  const parts = [
    // Body - slim
    box(0.4, 0.4, 1.0, 0, 0.55, 0),
    // Head - narrow
    box(0.3, 0.28, 0.4, 0, 0.72, 0.55),
    // Pointed snout
    cone(0.08, 0.3, 3, 0, 0.68, 0.85),
    // Ears (tall)
    cone(0.06, 0.22, 3, -0.1, 0.95, 0.5),
    cone(0.06, 0.22, 3, 0.1, 0.95, 0.5),
    // Legs - thin
    box(0.1, 0.4, 0.1, -0.14, 0.2, 0.3),
    box(0.1, 0.4, 0.1, 0.14, 0.2, 0.3),
    box(0.1, 0.4, 0.1, -0.14, 0.2, -0.3),
    box(0.1, 0.4, 0.1, 0.14, 0.2, -0.3),
    // Bushy tail
    cone(0.1, 0.5, 4, 0, 0.65, -0.7),
  ];
  return mergeGeometries(parts)!;
}

// ── Osprey ──────────────────────────────────────────────
export function createOspreyGeo(): THREE.BufferGeometry {
  const parts = [
    // Body - streamlined
    sphere(0.18, 0, 0, 0, 4, 3),
    // Head
    sphere(0.12, 0, 0.12, 0.22, 3, 2),
    // Hooked beak
    cone(0.035, 0.18, 3, 0, 0.08, 0.38),
    // Long wings (wider span than raven)
    box(0.9, 0.035, 0.3, -0.55, 0.02, -0.03),
    box(0.9, 0.035, 0.3, 0.55, 0.02, -0.03),
    // Wing tips (angled)
    box(0.3, 0.03, 0.15, -0.85, 0.0, -0.08),
    box(0.3, 0.03, 0.15, 0.85, 0.0, -0.08),
    // Tail
    box(0.2, 0.03, 0.3, 0, -0.02, -0.35),
  ];
  const g = mergeGeometries(parts)!;
  g.rotateX(-0.05);
  return g;
}

// Export a map for convenience
export const ANIMAL_GEO_CREATORS: Record<AgentType, () => THREE.BufferGeometry> = {
  wolf: createWolfGeo,
  elk: createElkGeo,
  bear: createBearGeo,
  beaver: createBeaverGeo,
  raven: createRavenGeo,
  bison: createBisonGeo,
  moose: createMooseGeo,
  coyote: createCoyoteGeo,
  osprey: createOspreyGeo,
};
