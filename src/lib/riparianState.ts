// Trophic cascade state — tracks grazing pressure and riparian health
// along the river corridor. Shared between boids engine and 3D renderers.

import { getDamSites } from '@/lib/boids';

/** 
 * River zones: we divide the river into segments and track grazing 
 * pressure + tree health per segment.
 */
const NUM_ZONES = 20;
const ZONE_LENGTH = 190 / NUM_ZONES; // river spans x = -95 to 95
const RIVER_CORRIDOR_WIDTH = 20; // how far from river counts as "riparian"

export interface RiparianZone {
  x: number; // center x of zone
  z: number; // center z of zone (on river path)
  grazingPressure: number; // 0-1: how much elk are grazing here
  treeHealth: number; // 0-1: how healthy trees are (1 = full, 0 = overgrazed)
  damBoost: number; // 0-1: bonus from nearby beaver dams
}

const zones: RiparianZone[] = [];

// Initialize zones along the river
for (let i = 0; i < NUM_ZONES; i++) {
  const x = -95 + (i + 0.5) * ZONE_LENGTH;
  const z = Math.sin(x * 0.03) * 20;
  zones.push({
    x,
    z,
    grazingPressure: 0,
    treeHealth: 0.6, // start moderate
    damBoost: 0,
  });
}

export function getRiparianZones(): RiparianZone[] {
  return zones;
}

/** Get river z at a given x */
function riverZ(x: number): number {
  return Math.sin(x * 0.03) * 20;
}

/** Find the zone index closest to a position */
function findZone(x: number): number {
  const idx = Math.floor((x + 95) / ZONE_LENGTH);
  return Math.max(0, Math.min(NUM_ZONES - 1, idx));
}

/** Check if a position is in the riparian corridor */
export function isInRiparianZone(x: number, z: number): boolean {
  const rz = riverZ(x);
  return Math.abs(z - rz) < RIVER_CORRIDOR_WIDTH;
}

/**
 * Called each tick from boids engine.
 * - Counts elk near river (grazing pressure)
 * - Updates tree health based on pressure vs recovery
 * - Applies beaver dam bonuses
 */
export function updateRiparianState(
  elkPositions: { x: number; z: number }[],
  delta: number
) {
  const dams = getDamSites();

  // Reset grazing pressure
  for (const zone of zones) {
    zone.grazingPressure = 0;
    zone.damBoost = 0;
  }

  // Count elk in each zone
  for (const elk of elkPositions) {
    const rz = riverZ(elk.x);
    const dist = Math.abs(elk.z - rz);
    if (dist < RIVER_CORRIDOR_WIDTH) {
      const idx = findZone(elk.x);
      const proximity = 1 - dist / RIVER_CORRIDOR_WIDTH;
      zones[idx].grazingPressure += proximity * 0.15;
    }
  }

  // Apply dam bonuses
  for (const dam of dams) {
    const idx = findZone(dam.x);
    // Dams boost nearby zones (±2 zones)
    for (let di = -2; di <= 2; di++) {
      const zi = idx + di;
      if (zi >= 0 && zi < NUM_ZONES) {
        const falloff = 1 - Math.abs(di) * 0.3;
        zones[zi].damBoost = Math.min(1, zones[zi].damBoost + dam.health * falloff * 0.5);
      }
    }
  }

  // Update tree health
  for (const zone of zones) {
    zone.grazingPressure = Math.min(1, zone.grazingPressure);

    // Grazing damages trees, recovery heals them
    const damage = zone.grazingPressure * 0.03 * delta;
    const recovery = (1 - zone.grazingPressure) * 0.01 * delta;
    const damRecovery = zone.damBoost * 0.015 * delta; // dams accelerate recovery

    zone.treeHealth = Math.max(0, Math.min(1, zone.treeHealth - damage + recovery + damRecovery));
  }
}

/**
 * Get the riparian tree health at a given world position.
 * Returns 0-1 (0 = dead/overgrazed, 1 = fully healthy).
 * Returns -1 if not in riparian zone.
 */
export function getRiparianTreeHealth(x: number, z: number): number {
  const rz = riverZ(x);
  const dist = Math.abs(z - rz);
  if (dist > RIVER_CORRIDOR_WIDTH) return -1;

  const idx = findZone(x);
  return zones[idx].treeHealth;
}

/**
 * Get average riparian health across all zones.
 */
export function getAverageRiparianHealth(): number {
  let sum = 0;
  for (const z of zones) sum += z.treeHealth;
  return sum / zones.length;
}
