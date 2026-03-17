// Boids flocking algorithm + predator-prey rules engine

import { useEcoConfigStore } from '@/store/ecoConfigStore';
import type { Season } from '@/store/simulationStore';
import { updateRiparianState, getRiparianTreeHealth, getAverageRiparianHealth } from '@/lib/riparianState';
import { noise2D } from '@/lib/noise';

/** Smooth Perlin-based wander force — unique per agent, varies smoothly over time */
function wanderForce(agent: Agent, strength: number = 1.5): [number, number] {
  const id = agent.id * 0.137; // unique offset per agent
  const t = agent.age * 0.3;   // slow time evolution
  const wx = noise2D(id, t) * strength;
  const wz = noise2D(id + 100, t + 50) * strength;
  return [wx, wz];
}
export type AgentType = 'wolf' | 'elk' | 'bear' | 'beaver' | 'raven' | 'bison' | 'moose' | 'coyote' | 'osprey';

export interface Agent {
  id: number;
  type: AgentType;
  x: number;
  z: number;
  vx: number;
  vz: number;
  energy: number;
  age: number;
  alive: boolean;
  targetX?: number;
  targetZ?: number;
  killCooldown: number; // time until wolf can kill again
}

export interface SimEvent {
  id: number;
  type: 'kill' | 'birth' | 'extinction' | 'respawn' | 'starvation' | 'dam_built';
  species: AgentType;
  timestamp: number;
  message: string;
  x?: number;
  z?: number;
}

export interface KillSite {
  x: number;
  z: number;
  age: number;
}

export interface DamSite {
  x: number;
  y: number;
  z: number;
  age: number;
  health: number;
}

let killSites: KillSite[] = [];
export function getKillSites() { return killSites; }

let damSites: DamSite[] = [];
export function getDamSites() { return damSites; }

// Respawn suppression — prevents auto-respawn for a duration after scenario reset
let respawnSuppressUntil: Record<string, number> = {};
export function suppressRespawn(type: AgentType, durationSeconds: number) {
  respawnSuppressUntil[type] = Date.now() + durationSeconds * 1000;
}
function isRespawnSuppressed(type: AgentType): boolean {
  return (respawnSuppressUntil[type] ?? 0) > Date.now();
}

let eventIdCounter = 0;
function makeEvent(type: SimEvent['type'], species: SimEvent['species'], message: string, x?: number, z?: number): SimEvent {
  return { id: eventIdCounter++, type, species, timestamp: Date.now(), message, x, z };
}

export interface TickResult {
  agents: Agent[];
  events: SimEvent[];
}

const WORLD_HALF = 90;
const MAX_SPEED: Record<AgentType, number> = {
  wolf: 14,
  elk: 12,
  bear: 10,
  beaver: 6,
  raven: 18,
  bison: 8,
  moose: 9,
  coyote: 13,
  osprey: 20,
};

const SEPARATION_DIST = 4;
const ALIGNMENT_DIST = 15;
const COHESION_DIST = 20;
const SEPARATION_WEIGHT = 2.5;
const ALIGNMENT_WEIGHT = 1.0;
const COHESION_WEIGHT = 0.8;
const HUNT_WEIGHT = 3.0;
const FLEE_WEIGHT = 4.0;

let nextId = 1000;

function clampToWorld(v: number): number {
  return Math.max(-WORLD_HALF, Math.min(WORLD_HALF, v));
}

function boundaryForce(x: number, z: number): [number, number] {
  let fx = 0, fz = 0;
  const margin = 15;
  const edge = WORLD_HALF;
  if (x > edge - margin) fx -= (x - (edge - margin)) / margin * 5;
  if (x < -edge + margin) fx -= (x - (-edge + margin)) / margin * 5;
  if (z > edge - margin) fz -= (z - (edge - margin)) / margin * 5;
  if (z < -edge + margin) fz -= (z - (-edge + margin)) / margin * 5;
  return [fx, fz];
}

function separation(agent: Agent, neighbors: Agent[]): [number, number] {
  let fx = 0, fz = 0;
  for (const n of neighbors) {
    const dx = agent.x - n.x;
    const dz = agent.z - n.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0 && dist < SEPARATION_DIST) {
      fx += (dx / dist) / dist;
      fz += (dz / dist) / dist;
    }
  }
  return [fx * SEPARATION_WEIGHT, fz * SEPARATION_WEIGHT];
}

function alignment(agent: Agent, neighbors: Agent[]): [number, number] {
  let avgVx = 0, avgVz = 0, count = 0;
  for (const n of neighbors) {
    const dx = agent.x - n.x;
    const dz = agent.z - n.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < ALIGNMENT_DIST) {
      avgVx += n.vx;
      avgVz += n.vz;
      count++;
    }
  }
  if (count === 0) return [0, 0];
  avgVx /= count;
  avgVz /= count;
  return [(avgVx - agent.vx) * ALIGNMENT_WEIGHT, (avgVz - agent.vz) * ALIGNMENT_WEIGHT];
}

function cohesion(agent: Agent, neighbors: Agent[]): [number, number] {
  let cx = 0, cz = 0, count = 0;
  for (const n of neighbors) {
    const dx = agent.x - n.x;
    const dz = agent.z - n.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < COHESION_DIST) {
      cx += n.x;
      cz += n.z;
      count++;
    }
  }
  if (count === 0) return [0, 0];
  cx /= count;
  cz /= count;
  return [(cx - agent.x) * COHESION_WEIGHT, (cz - agent.z) * COHESION_WEIGHT];
}

function chaseTarget(hunter: Agent, prey: Agent[], chaseDist: number): [number, number] {
  let closest: Agent | null = null;
  let minDist = chaseDist;
  for (const p of prey) {
    if (!p.alive) continue;
    const dx = p.x - hunter.x;
    const dz = p.z - hunter.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < minDist) {
      minDist = dist;
      closest = p;
    }
  }
  if (!closest) return [0, 0];
  const dx = closest.x - hunter.x;
  const dz = closest.z - hunter.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  return [(dx / dist) * HUNT_WEIGHT, (dz / dist) * HUNT_WEIGHT];
}

/** Pack flanking: wolves approach prey from offset angles to surround it */
function packFlankChase(hunter: Agent, packMembers: Agent[], prey: Agent[], chaseDist: number): [number, number] {
  // Find closest prey
  let closest: Agent | null = null;
  let minDist = chaseDist;
  for (const p of prey) {
    if (!p.alive) continue;
    const dx = p.x - hunter.x;
    const dz = p.z - hunter.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < minDist) {
      minDist = dist;
      closest = p;
    }
  }
  if (!closest) return [0, 0];

  // Determine this wolf's rank in the pack to assign a flanking angle
  let rank = 0;
  for (const m of packMembers) {
    if (m.id < hunter.id) rank++;
  }
  const packSize = packMembers.length;

  const dx = closest.x - hunter.x;
  const dz = closest.z - hunter.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const dirX = dx / dist;
  const dirZ = dz / dist;

  if (dist < 25 && packSize >= 2) {
    // Flanking: offset approach angle based on rank
    // Lead wolf (rank 0) drives straight, others fan out
    const flankAngle = (rank / packSize) * Math.PI * 1.2 - Math.PI * 0.6;
    const cos = Math.cos(flankAngle);
    const sin = Math.sin(flankAngle);
    const flankX = dirX * cos - dirZ * sin;
    const flankZ = dirX * sin + dirZ * cos;

    // Close in tighter when very near prey
    const tighten = dist < 12 ? 1.5 : 1.0;
    return [flankX * HUNT_WEIGHT * tighten, flankZ * HUNT_WEIGHT * tighten];
  }

  // Far away: straight chase
  return [dirX * HUNT_WEIGHT, dirZ * HUNT_WEIGHT];
}

/** Defensive herding: tighten formation around herd center when predators are near */
function defensiveHerd(agent: Agent, herdMates: Agent[], predators: Agent[], threatDist: number): [number, number] {
  // Check if any predator is nearby
  let threatened = false;
  for (const p of predators) {
    if (!p.alive) continue;
    const dx = p.x - agent.x;
    const dz = p.z - agent.z;
    if (Math.sqrt(dx * dx + dz * dz) < threatDist) {
      threatened = true;
      break;
    }
  }
  if (!threatened) return [0, 0];

  // Find herd center
  let cx = 0, cz = 0, count = 0;
  for (const m of herdMates) {
    cx += m.x; cz += m.z; count++;
  }
  if (count === 0) return [0, 0];
  cx /= count; cz /= count;

  // Pull strongly toward herd center
  const dx = cx - agent.x;
  const dz = cz - agent.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 2) return [0, 0];
  const pull = 3.0;
  return [(dx / dist) * pull, (dz / dist) * pull];
}

function fleeFrom(prey: Agent, predators: Agent[], fleeDist: number): [number, number] {
  let fx = 0, fz = 0;
  for (const w of predators) {
    if (!w.alive) continue;
    const dx = prey.x - w.x;
    const dz = prey.z - w.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < fleeDist && dist > 0) {
      fx += (dx / dist) * FLEE_WEIGHT / (dist * 0.1);
      fz += (dz / dist) * FLEE_WEIGHT / (dist * 0.1);
    }
  }
  return [fx, fz];
}

function riverZ(x: number): number {
  return Math.sin(x * 0.03) * 20;
}

function riverAttraction(agent: Agent): [number, number] {
  const targetZ = riverZ(agent.x);
  const dz = targetZ - agent.z;
  const dist = Math.abs(dz);
  if (dist < 5) return [0, 0];
  return [0, (dz / dist) * 1.5];
}

function ravenSeekKillSite(raven: Agent): [number, number] {
  let bestDist = 80;
  let bestX = 0, bestZ = 0;
  let found = false;
  for (const ks of killSites) {
    const dx = ks.x - raven.x;
    const dz = ks.z - raven.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < bestDist) {
      bestDist = dist;
      bestX = ks.x;
      bestZ = ks.z;
      found = true;
    }
  }
  if (!found) return [0, 0];
  const dx = bestX - raven.x;
  const dz = bestZ - raven.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 3) {
    return [-dz * 0.3, dx * 0.3];
  }
  return [(dx / dist) * 2.0, (dz / dist) * 2.0];
}

// Coyote shadows wolf packs at safe distance, scavenges kill sites
function coyoteBehavior(coyote: Agent, wolves: Agent[]): [number, number] {
  // Follow nearest wolf pack at safe distance
  let closestWolf: Agent | null = null;
  let minDist = 50;
  for (const w of wolves) {
    if (!w.alive) continue;
    const dx = w.x - coyote.x;
    const dz = w.z - coyote.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < minDist) {
      minDist = dist;
      closestWolf = w;
    }
  }
  
  // Also attracted to kill sites
  const [kx, kz] = ravenSeekKillSite(coyote);
  
  if (closestWolf) {
    const dx = closestWolf.x - coyote.x;
    const dz = closestWolf.z - coyote.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 12) {
      // Too close to wolves — flee
      return [-(dx / dist) * 2.0 + kx, -(dz / dist) * 2.0 + kz];
    }
    // Shadow at medium distance
    return [(dx / dist) * 1.0 + kx, (dz / dist) * 1.0 + kz];
  }
  return [kx, kz];
}

// Osprey: aerial patrol over rivers, dive for fish
function ospreyBehavior(osprey: Agent): [number, number] {
  const [rx, rz] = riverAttraction(osprey);
  // Patrol along river
  const patrolX = Math.cos(osprey.age * 0.5 + osprey.id) * 1.5;
  return [rx * 0.5 + patrolX, rz];
}

export function createAgent(type: AgentType, x?: number, z?: number): Agent {
  const configs: Record<AgentType, { spread: number; offX: number; offZ: number }> = {
    wolf: { spread: 30, offX: -30, offZ: -20 },
    elk: { spread: 50, offX: 20, offZ: 10 },
    bear: { spread: 40, offX: 0, offZ: -40 },
    beaver: { spread: 20, offX: 0, offZ: 0 },
    raven: { spread: 60, offX: 0, offZ: 0 },
    bison: { spread: 40, offX: 30, offZ: -30 },
    moose: { spread: 30, offX: -20, offZ: 20 },
    coyote: { spread: 50, offX: -10, offZ: -10 },
    osprey: { spread: 40, offX: 10, offZ: 0 },
  };
  const c = configs[type];
  const px = x ?? c.offX + (Math.random() - 0.5) * c.spread;
  let pz = z ?? c.offZ + (Math.random() - 0.5) * c.spread;
  
  if (type === 'beaver' && z === undefined) {
    pz = riverZ(px) + (Math.random() - 0.5) * 10;
  }
  if (type === 'moose' && z === undefined) {
    // Moose near riparian areas
    pz = riverZ(px) + (Math.random() - 0.5) * 20;
  }
  if (type === 'osprey' && z === undefined) {
    pz = riverZ(px) + (Math.random() - 0.5) * 15;
  }

  return {
    id: nextId++,
    type,
    x: px,
    z: pz,
    vx: (Math.random() - 0.5) * 4,
    vz: (Math.random() - 0.5) * 4,
    energy: 50 + Math.random() * 30,
    age: 0,
    alive: true,
  };
}

export function tickAgents(agents: Agent[], delta: number, season: Season = 'summer'): TickResult {
  const cfg = useEcoConfigStore.getState();
  const isWinter = season === 'winter';
  const isSpring = season === 'spring';
  const isAutumn = season === 'autumn';
  const isSummer = season === 'summer';
  const wolves = agents.filter(a => a.type === 'wolf' && a.alive);
  const elks = agents.filter(a => a.type === 'elk' && a.alive);
  const bears = agents.filter(a => a.type === 'bear' && a.alive);
  const beavers = agents.filter(a => a.type === 'beaver' && a.alive);
  const ravens = agents.filter(a => a.type === 'raven' && a.alive);
  const bisons = agents.filter(a => a.type === 'bison' && a.alive);
  const moose = agents.filter(a => a.type === 'moose' && a.alive);
  const coyotes = agents.filter(a => a.type === 'coyote' && a.alive);
  const ospreys = agents.filter(a => a.type === 'osprey' && a.alive);
  const predators = [...wolves, ...bears]; // threats to elk/moose
  const newBorns: Agent[] = [];
  const events: SimEvent[] = [];

  killSites = killSites.filter(ks => { ks.age += delta; return ks.age < 30; });

  for (const agent of agents) {
    if (!agent.alive) continue;

    const sameType = agents.filter(a => a.type === agent.type && a.alive && a.id !== agent.id);
    const [sx, sz] = separation(agent, sameType);
    const [ax, az] = alignment(agent, sameType);
    const [cx, cz] = cohesion(agent, sameType);
    const [bx, bz] = boundaryForce(agent.x, agent.z);

    let fx = sx + ax + cx + bx;
    let fz = sz + az + cz + bz;

    const maxSpd = MAX_SPEED[agent.type];

    switch (agent.type) {
      case 'wolf': {
        // Pack flanking hunt — wolves coordinate approach angles
        const [hx, hz] = packFlankChase(agent, wolves, elks, cfg.wolfChaseDist);
        const aggressionMult = isWinter ? 1.5 : 1.0;
        fx += hx * aggressionMult;
        fz += hz * aggressionMult;
        const drainMult = isSummer ? 0.8 : isWinter ? 1.2 : 1.0;
        agent.energy -= cfg.wolfEnergyDrain * drainMult * delta;
        break;
      }
      case 'elk': {
        const [flx, flz] = fleeFrom(agent, predators, cfg.elkFleeDist);
        fx += flx;
        fz += flz;
        const speed = Math.sqrt(agent.vx * agent.vx + agent.vz * agent.vz);
        // Winter: grazing is harder, energy drain increases
        const grazeReduction = isWinter ? 0.4 : 1.0;
        if (speed < 3) agent.energy += cfg.elkGrazeRate * grazeReduction * delta;
        const elkDrainMult = isWinter ? 1.5 : 1.0;
        agent.energy -= cfg.elkEnergyDrain * elkDrainMult * delta;
        // Autumn: rut behavior — erratic Perlin-driven movement
        if (isAutumn) {
          const [rw1, rw2] = wanderForce(agent, 3.0);
          fx += rw1;
          fz += rw2;
        }
        break;
      }
      case 'bear': {
        const [hx, hz] = chaseTarget(agent, elks, cfg.bearChaseDist);
        fx += hx * 0.7;
        fz += hz * 0.7;
        const [bwx, bwz] = wanderForce(agent, 2.0);
        fx += bwx;
        fz += bwz;
        agent.energy -= cfg.bearEnergyDrain * delta;
        const speed = Math.sqrt(agent.vx * agent.vx + agent.vz * agent.vz);
        if (speed < 2) agent.energy += 1.0 * delta;
        break;
      }
      case 'beaver': {
        const [rx, rz] = riverAttraction(agent);
        fx += rx;
        fz += rz;
        // Beavers thrive when riparian trees are healthy (food source: bark, branches)
        const beaverTreeHealth = getRiparianTreeHealth(agent.x, agent.z);
        const treeBenefit = beaverTreeHealth >= 0 ? beaverTreeHealth : 0.4; // default if not in riparian zone
        agent.energy += (0.5 + treeBenefit * 1.5) * delta; // 0.5-2.0 energy/s based on tree health
        agent.energy -= cfg.beaverEnergyDrain * delta;
        break;
      }
      case 'raven': {
        const [rkx, rkz] = ravenSeekKillSite(agent);
        fx += rkx;
        fz += rkz;
        agent.energy -= 0.5 * delta;
        for (const ks of killSites) {
          const dx = ks.x - agent.x;
          const dz = ks.z - agent.z;
          if (Math.sqrt(dx * dx + dz * dz) < 5) {
            agent.energy += 2.0 * delta;
            break;
          }
        }
        break;
      }
      case 'bison': {
        // Defensive herding: tighten formation when wolves nearby
        const [flx, flz] = fleeFrom(agent, wolves, cfg.bisonFleeDist);
        fx += flx * 0.6;
        fz += flz * 0.6;
        const [dhx, dhz] = defensiveHerd(agent, bisons, wolves, 35);
        fx += dhx;
        fz += dhz;
        if (isWinter) {
          const geoX = -agent.x * 0.03;
          const geoZ = -agent.z * 0.03;
          fx += geoX;
          fz += geoZ;
        } else {
          const [bwx, bwz] = wanderForce(agent, 1.5);
          fx += bwx;
          fz += bwz;
        }
        const speed = Math.sqrt(agent.vx * agent.vx + agent.vz * agent.vz);
        const bisonGrazeMult = isWinter ? 0.5 : 1.0;
        if (speed < 2) agent.energy += cfg.bisonGrazeRate * bisonGrazeMult * delta;
        agent.energy -= cfg.bisonEnergyDrain * (isWinter ? 1.3 : 1.0) * delta;
        break;
      }
      case 'moose': {
        // Solitary browsing near riparian areas, flee from predators
        const [flx, flz] = fleeFrom(agent, predators, cfg.mooseFleeDist);
        fx += flx;
        fz += flz;
        // Summer: relies on beaver pond sodium sources — stronger river attraction
        const [rx, rz] = riverAttraction(agent);
        const riverMult = isSummer ? 0.8 : isSpring ? 0.6 : 0.3;
        fx += rx * riverMult;
        fz += rz * riverMult;
        const [mwx, mwz] = wanderForce(agent, 1.5);
        fx += mwx;
        fz += mwz;
        const speed = Math.sqrt(agent.vx * agent.vx + agent.vz * agent.vz);
        // Winter: bark browsing — reduced graze rate
        // Moose benefit from healthy riparian vegetation (browse on willow/aspen)
        const mooseTreeHealth = getRiparianTreeHealth(agent.x, agent.z);
        const mooseVegBonus = mooseTreeHealth >= 0 ? mooseTreeHealth : 0.3;
        const mooseGrazeMult = (isWinter ? 0.5 : 1.0) * (0.5 + mooseVegBonus * 0.8);
        if (speed < 2) agent.energy += cfg.mooseGrazeRate * mooseGrazeMult * delta;
        agent.energy -= cfg.mooseEnergyDrain * (isWinter ? 1.3 : 1.0) * delta;
        break;
      }
      case 'coyote': {
        // Shadow wolves, scavenge kill sites, hunt small prey
        const [cx2, cz2] = coyoteBehavior(agent, wolves);
        fx += cx2;
        fz += cz2;
        agent.energy -= cfg.coyoteEnergyDrain * delta;
        // Gain energy near kill sites (scavenging)
        for (const ks of killSites) {
          const dx = ks.x - agent.x;
          const dz = ks.z - agent.z;
          if (Math.sqrt(dx * dx + dz * dz) < 5) {
            agent.energy += 3.0 * delta;
            break;
          }
        }
        // Small passive foraging
        const speed = Math.sqrt(agent.vx * agent.vx + agent.vz * agent.vz);
        if (speed < 3) agent.energy += 0.5 * delta;
        break;
      }
      case 'osprey': {
        // Active only spring/summer during spawning runs — per PRD
        if (isWinter || isAutumn) {
          // Dormant: minimal movement, low energy drain (roosting)
          agent.energy -= cfg.ospreyEnergyDrain * 0.3 * delta;
          // Slow drift
          const [owx, owz] = wanderForce(agent, 0.5);
          fx += owx;
          fz += owz;
        } else {
          // Spring/summer: active aerial fishing
          const [ox, oz] = ospreyBehavior(agent);
          fx += ox;
          fz += oz;
          agent.energy -= cfg.ospreyEnergyDrain * delta;
          const riverDist = Math.abs(agent.z - riverZ(agent.x));
          if (riverDist < 8) {
            // Healthier riparian zones = more fish
            const riverHealth = getAverageRiparianHealth();
            const fishMult = (isSpring ? 1.5 : 1.0) * (0.5 + riverHealth * 0.8);
            agent.energy += cfg.ospreyFishRate * fishMult * delta;
          }
        }
        break;
      }
    }

    // Smooth Perlin wander replaces jittery random noise
    const [wx, wz] = wanderForce(agent, 1.2);
    fx += wx;
    fz += wz;

    agent.vx += fx * delta;
    agent.vz += fz * delta;

    const spd = Math.sqrt(agent.vx * agent.vx + agent.vz * agent.vz);
    if (spd > maxSpd) {
      agent.vx = (agent.vx / spd) * maxSpd;
      agent.vz = (agent.vz / spd) * maxSpd;
    }

    agent.x = clampToWorld(agent.x + agent.vx * delta);
    agent.z = clampToWorld(agent.z + agent.vz * delta);
    agent.age += delta;
    
    agent.energy = Math.min(100, agent.energy);

    if (agent.energy <= 0) {
      agent.alive = false;
      events.push(makeEvent('starvation', agent.type, `A ${agent.type} starved`));
    }

    const maxAges: Record<AgentType, number> = {
      wolf: 120, elk: 150, bear: 180, beaver: 100, raven: 80,
      bison: 200, moose: 160, coyote: 100, osprey: 90,
    };
    if (agent.age > maxAges[agent.type]) { agent.alive = false; }
  }

  // Wolf kills elk
  for (const wolf of wolves) {
    if (!wolf.alive) continue;
    for (const elk of elks) {
      if (!elk.alive) continue;
      const dx = wolf.x - elk.x;
      const dz = wolf.z - elk.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < cfg.killDist * (isWinter ? 1.4 : 1.0)) {
        elk.alive = false;
        wolf.energy = Math.min(100, wolf.energy + cfg.energyPerKill);
        killSites.push({ x: elk.x, z: elk.z, age: 0 });
        events.push(makeEvent('kill', 'wolf', 'Wolf hunted an elk', elk.x, elk.z));
        break;
      }
    }
  }

  // Wolf predation on bison (weak — requires pack, less likely)
  for (const wolf of wolves) {
    if (!wolf.alive) continue;
    for (const b of bisons) {
      if (!b.alive) continue;
      const dx = wolf.x - b.x;
      const dz = wolf.z - b.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      // Harder to kill bison — need to be very close and some luck
      if (dist < cfg.killDist * 0.8 && Math.random() < 0.3) {
        b.alive = false;
        wolf.energy = Math.min(100, wolf.energy + cfg.energyPerKill * 1.2);
        killSites.push({ x: b.x, z: b.z, age: 0 });
        events.push(makeEvent('kill', 'wolf', 'Wolf pack took down a bison', b.x, b.z));
        break;
      }
    }
  }

  // Wolf rare predation on moose
  for (const wolf of wolves) {
    if (!wolf.alive) continue;
    for (const m of moose) {
      if (!m.alive) continue;
      const dx = wolf.x - m.x;
      const dz = wolf.z - m.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < cfg.killDist && Math.random() < 0.4) {
        m.alive = false;
        wolf.energy = Math.min(100, wolf.energy + cfg.energyPerKill);
        killSites.push({ x: m.x, z: m.z, age: 0 });
        events.push(makeEvent('kill', 'wolf', 'Wolf hunted a moose', m.x, m.z));
        break;
      }
    }
  }

  // Bear kills elk
  for (const bear of bears) {
    if (!bear.alive) continue;
    for (const elk of elks) {
      if (!elk.alive) continue;
      const dx = bear.x - elk.x;
      const dz = bear.z - elk.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < cfg.killDist * 1.2) {
        elk.alive = false;
        bear.energy = Math.min(100, bear.energy + cfg.energyPerKill * 0.8);
        killSites.push({ x: elk.x, z: elk.z, age: 0 });
        events.push(makeEvent('kill', 'bear', 'Bear caught an elk', elk.x, elk.z));
        break;
      }
    }
  }

  // Coyote small prey hunting (abstract — gains energy occasionally)
  for (const coyote of coyotes) {
    if (!coyote.alive) continue;
    if (Math.random() < 0.002) {
      coyote.energy = Math.min(100, coyote.energy + 15);
      events.push(makeEvent('kill', 'coyote', 'Coyote caught small prey', coyote.x, coyote.z));
    }
  }

  // Age and grow existing dam sites
  damSites = damSites.filter(d => {
    d.age += delta;
    d.health = Math.min(1, d.health + delta * 0.008); // slowly recovers over ~120s
    return d.age < 300; // dams last 5 minutes
  });

  // Beaver dam events — beavers build dams near the lake (25, -15)
  const LAKE_X = 25;
  const LAKE_Z = -15;
  const LAKE_RADIUS = 14;
  for (const beaver of beavers) {
    if (!beaver.alive) continue;
    const lakeDist = Math.hypot(beaver.x - LAKE_X, beaver.z - LAKE_Z);
    const nearLake = lakeDist < LAKE_RADIUS + 12 && lakeDist > LAKE_RADIUS - 2;
    const nearRiver = Math.abs(beaver.z - riverZ(beaver.x)) < 8;
    if ((nearLake || nearRiver) && Math.random() < 0.0008) {
      // Don't stack dams too close
      const tooClose = damSites.some(d => Math.hypot(d.x - beaver.x, d.z - beaver.z) < 15);
      if (!tooClose) {
        // Estimate terrain height at dam site
        const damY = 1.5 + Math.max(0, noise2D(beaver.x * 0.008, beaver.z * 0.008)) * 4;
        damSites.push({ x: beaver.x, y: damY, z: beaver.z, age: 0, health: 0.1 });
        events.push(makeEvent('dam_built', 'beaver', 'Beaver built a dam — riparian recovery begins', beaver.x, beaver.z));
      }
    }
  }

  // Osprey fishing events (visual flavor)
  for (const osprey of ospreys) {
    if (!osprey.alive) continue;
    const riverDist = Math.abs(osprey.z - riverZ(osprey.x));
    if (riverDist < 8 && Math.random() < 0.001) {
      events.push(makeEvent('kill', 'osprey', 'Osprey dove and caught a fish', osprey.x, osprey.z));
    }
  }

  // Reproduction
  const birthLabels: Record<AgentType, string> = {
    wolf: 'Wolf pup born', elk: 'Elk calf born', bear: 'Bear cub born',
    beaver: 'Beaver kit born', raven: 'Raven chick hatched',
    bison: 'Bison calf born', moose: 'Moose calf born',
    coyote: 'Coyote pup born', osprey: 'Osprey chick hatched',
  };

  function tryReproduce(type: AgentType, alive: Agent[], maxPop: number, reproChance: number, energyCost: number) {
    if (alive.length >= 2 && alive.length < maxPop) {
      for (const a of alive) {
        if (a.energy > cfg.reproduceEnergy && Math.random() < reproChance) {
          a.energy -= energyCost;
          newBorns.push(createAgent(type, a.x + (Math.random() - 0.5) * 5, a.z + (Math.random() - 0.5) * 5));
          events.push(makeEvent('birth', type, birthLabels[type]));
          break;
        }
      }
    }
  }

  const aliveWolves = agents.filter(a => a.type === 'wolf' && a.alive);
  const aliveElks = agents.filter(a => a.type === 'elk' && a.alive);
  const aliveBears = agents.filter(a => a.type === 'bear' && a.alive);
  const aliveBeavers = agents.filter(a => a.type === 'beaver' && a.alive);
  const aliveRavens = agents.filter(a => a.type === 'raven' && a.alive);
  const aliveBisons = agents.filter(a => a.type === 'bison' && a.alive);
  const aliveMoose = agents.filter(a => a.type === 'moose' && a.alive);
  const aliveCoyotes = agents.filter(a => a.type === 'coyote' && a.alive);
  const aliveOspreys = agents.filter(a => a.type === 'osprey' && a.alive);

  tryReproduce('wolf', aliveWolves, cfg.wolfMaxPop, cfg.wolfReproChance, 30);
  tryReproduce('elk', aliveElks, cfg.elkMaxPop, cfg.elkReproChance, 25);
  tryReproduce('bear', aliveBears, cfg.bearMaxPop, cfg.bearReproChance, 35);
  tryReproduce('beaver', aliveBeavers, cfg.beaverMaxPop, cfg.beaverReproChance, 20);
  tryReproduce('raven', aliveRavens, cfg.ravenMaxPop, cfg.ravenReproChance, 15);
  tryReproduce('bison', aliveBisons, cfg.bisonMaxPop, cfg.bisonReproChance, 25);
  tryReproduce('moose', aliveMoose, cfg.mooseMaxPop, cfg.mooseReproChance, 25);
  tryReproduce('coyote', aliveCoyotes, cfg.coyoteMaxPop, cfg.coyoteReproChance, 20);
  tryReproduce('osprey', aliveOspreys, cfg.ospreyMaxPop, cfg.ospreyReproChance, 15);

  // Respawn if extinct (wolves and elk don't auto-respawn — triggers game-over)
  function respawnIfExtinct(type: AgentType, alive: Agent[], count: number) {
    if (alive.length === 0 && !isRespawnSuppressed(type)) {
      for (let i = 0; i < count; i++) newBorns.push(createAgent(type));
      events.push(makeEvent('extinction', type, `${type.charAt(0).toUpperCase() + type.slice(1)}s went extinct — respawned`));
    }
  }
  // Check wolf/elk extinction (<=1 = functionally extinct)
  if (aliveWolves.length <= 1) {
    events.push(makeEvent('extinction', 'wolf', 'Wolves are functionally extinct'));
  }
  if (aliveElks.length <= 1) {
    events.push(makeEvent('extinction', 'elk', 'Elk are functionally extinct'));
  }
  // Only auto-respawn non-critical species
  respawnIfExtinct('bear', aliveBears, 3);
  respawnIfExtinct('beaver', aliveBeavers, 4);
  respawnIfExtinct('raven', aliveRavens, 6);
  respawnIfExtinct('bison', aliveBisons, 8);
  respawnIfExtinct('moose', aliveMoose, 4);
  respawnIfExtinct('coyote', aliveCoyotes, 5);
  respawnIfExtinct('osprey', aliveOspreys, 3);

  // Update riparian state — all herbivore grazing pressure vs tree recovery
  const herbivorePositions = agents
    .filter(a => (a.type === 'elk' || a.type === 'bison' || a.type === 'moose') && a.alive)
    .map(a => ({ x: a.x, z: a.z, type: a.type }));
  updateRiparianState(herbivorePositions, delta);

  const result = agents.filter(a => a.alive).concat(newBorns);
  return { agents: result, events };
}
