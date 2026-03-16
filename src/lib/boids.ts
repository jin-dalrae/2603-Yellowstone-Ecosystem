// Boids flocking algorithm + predator-prey rules engine

import { useEcoConfigStore } from '@/store/ecoConfigStore';

export type AgentType = 'wolf' | 'elk' | 'bear' | 'beaver' | 'raven';

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
  // Raven-specific: id of carcass/kill site they're circling
  targetX?: number;
  targetZ?: number;
}

export interface SimEvent {
  id: number;
  type: 'kill' | 'birth' | 'extinction' | 'respawn' | 'starvation' | 'dam_built';
  species: AgentType;
  timestamp: number;
  message: string;
  // For scavenger attraction
  x?: number;
  z?: number;
}

// Track recent kill sites for ravens
export interface KillSite {
  x: number;
  z: number;
  age: number;
}

let killSites: KillSite[] = [];
export function getKillSites() { return killSites; }

let eventIdCounter = 0;
function makeEvent(type: SimEvent['type'], species: SimEvent['species'], message: string, x?: number, z?: number): SimEvent {
  return { id: eventIdCounter++, type, species, timestamp: Date.now(), message, x, z };
}

export interface TickResult {
  agents: Agent[];
  events: SimEvent[];
}

const WORLD_HALF = 90;
const MAX_SPEED_ELK = 12;
const MAX_SPEED_WOLF = 14;
const MAX_SPEED_BEAR = 10;
const MAX_SPEED_BEAVER = 6;
const MAX_SPEED_RAVEN = 18;

// Boids parameters
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

// River line: z = sin(x * 0.03) * 20
function riverZ(x: number): number {
  return Math.sin(x * 0.03) * 20;
}

function riverAttraction(agent: Agent): [number, number] {
  const targetZ = riverZ(agent.x);
  const dz = targetZ - agent.z;
  const dist = Math.abs(dz);
  if (dist < 5) return [0, 0]; // already near river
  return [0, (dz / dist) * 1.5];
}

// Ravens circle toward kill sites
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
  // Circle around kill site
  const dx = bestX - raven.x;
  const dz = bestZ - raven.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 3) {
    // orbit
    return [-dz * 0.3, dx * 0.3];
  }
  return [(dx / dist) * 2.0, (dz / dist) * 2.0];
}

export function createAgent(type: AgentType, x?: number, z?: number): Agent {
  const configs: Record<AgentType, { spread: number; offX: number; offZ: number }> = {
    wolf: { spread: 30, offX: -30, offZ: -20 },
    elk: { spread: 50, offX: 20, offZ: 10 },
    bear: { spread: 40, offX: 0, offZ: -40 },
    beaver: { spread: 20, offX: 0, offZ: 0 }, // will snap to river
    raven: { spread: 60, offX: 0, offZ: 0 },
  };
  const c = configs[type];
  const px = x ?? c.offX + (Math.random() - 0.5) * c.spread;
  let pz = z ?? c.offZ + (Math.random() - 0.5) * c.spread;
  
  // Beavers spawn near river
  if (type === 'beaver' && z === undefined) {
    const rx = px;
    pz = riverZ(rx) + (Math.random() - 0.5) * 10;
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

export function tickAgents(agents: Agent[], delta: number): TickResult {
  const cfg = useEcoConfigStore.getState();
  const wolves = agents.filter(a => a.type === 'wolf' && a.alive);
  const elks = agents.filter(a => a.type === 'elk' && a.alive);
  const bears = agents.filter(a => a.type === 'bear' && a.alive);
  const beavers = agents.filter(a => a.type === 'beaver' && a.alive);
  const ravens = agents.filter(a => a.type === 'raven' && a.alive);
  const predators = [...wolves, ...bears]; // both are threats to elk
  const newBorns: Agent[] = [];
  const events: SimEvent[] = [];

  // Age kill sites
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

    let maxSpd = MAX_SPEED_ELK;

    switch (agent.type) {
      case 'wolf': {
        const [hx, hz] = chaseTarget(agent, elks, cfg.wolfChaseDist);
        fx += hx;
        fz += hz;
        agent.energy -= cfg.wolfEnergyDrain * delta;
        maxSpd = MAX_SPEED_WOLF;
        break;
      }
      case 'elk': {
        const [flx, flz] = fleeFrom(agent, predators, cfg.elkFleeDist);
        fx += flx;
        fz += flz;
        const speed = Math.sqrt(agent.vx * agent.vx + agent.vz * agent.vz);
        if (speed < 3) {
          agent.energy += cfg.elkGrazeRate * delta;
        }
        agent.energy -= cfg.elkEnergyDrain * delta;
        maxSpd = MAX_SPEED_ELK;
        break;
      }
      case 'bear': {
        // Bears chase elk but slower, also wander
        const [hx, hz] = chaseTarget(agent, elks, cfg.bearChaseDist);
        fx += hx * 0.7;
        fz += hz * 0.7;
        // Wander force
        fx += (Math.random() - 0.5) * 2;
        fz += (Math.random() - 0.5) * 2;
        agent.energy -= cfg.bearEnergyDrain * delta;
        // Bears graze slightly when slow (omnivore)
        const speed = Math.sqrt(agent.vx * agent.vx + agent.vz * agent.vz);
        if (speed < 2) {
          agent.energy += 1.0 * delta;
        }
        maxSpd = MAX_SPEED_BEAR;
        break;
      }
      case 'beaver': {
        // Stay near river, slow movement
        const [rx, rz] = riverAttraction(agent);
        fx += rx;
        fz += rz;
        // Beavers graze/forage
        agent.energy += 1.5 * delta;
        agent.energy -= cfg.beaverEnergyDrain * delta;
        maxSpd = MAX_SPEED_BEAVER;
        break;
      }
      case 'raven': {
        // Flock toward kill sites, otherwise wander
        const [rkx, rkz] = ravenSeekKillSite(agent);
        fx += rkx;
        fz += rkz;
        // Ravens have low energy drain, scavenge at kill sites
        agent.energy -= 0.5 * delta;
        // Gain energy near kill sites
        for (const ks of killSites) {
          const dx = ks.x - agent.x;
          const dz = ks.z - agent.z;
          if (Math.sqrt(dx * dx + dz * dz) < 5) {
            agent.energy += 2.0 * delta;
            break;
          }
        }
        maxSpd = MAX_SPEED_RAVEN;
        break;
      }
    }

    fx += (Math.random() - 0.5) * 1.5;
    fz += (Math.random() - 0.5) * 1.5;

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

    // Max ages
    const maxAges: Record<AgentType, number> = { wolf: 120, elk: 150, bear: 180, beaver: 100, raven: 80 };
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
      if (dist < cfg.killDist) {
        elk.alive = false;
        wolf.energy = Math.min(100, wolf.energy + cfg.energyPerKill);
        killSites.push({ x: elk.x, z: elk.z, age: 0 });
        events.push(makeEvent('kill', 'wolf', 'Wolf hunted an elk', elk.x, elk.z));
        break;
      }
    }
  }

  // Bear kills elk (less efficient)
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

  // Beaver dam events (rare)
  for (const beaver of beavers) {
    if (!beaver.alive) continue;
    const nearRiver = Math.abs(beaver.z - riverZ(beaver.x)) < 8;
    if (nearRiver && Math.random() < 0.0003) {
      events.push(makeEvent('dam_built', 'beaver', 'Beaver built a dam on the river', beaver.x, beaver.z));
    }
  }

  // Reproduction helper
  function tryReproduce(type: AgentType, alive: Agent[], maxPop: number, reproChance: number, energyCost: number) {
    if (alive.length >= 2 && alive.length < maxPop) {
      for (const a of alive) {
        if (a.energy > cfg.reproduceEnergy && Math.random() < reproChance) {
          a.energy -= energyCost;
          newBorns.push(createAgent(type, a.x + (Math.random() - 0.5) * 5, a.z + (Math.random() - 0.5) * 5));
          const labels: Record<AgentType, string> = {
            wolf: 'Wolf pup born', elk: 'Elk calf born', bear: 'Bear cub born',
            beaver: 'Beaver kit born', raven: 'Raven chick hatched',
          };
          events.push(makeEvent('birth', type, labels[type]));
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

  tryReproduce('wolf', aliveWolves, cfg.wolfMaxPop, cfg.wolfReproChance, 30);
  tryReproduce('elk', aliveElks, cfg.elkMaxPop, cfg.elkReproChance, 25);
  tryReproduce('bear', aliveBears, cfg.bearMaxPop, cfg.bearReproChance, 35);
  tryReproduce('beaver', aliveBeavers, cfg.beaverMaxPop, cfg.beaverReproChance, 20);
  tryReproduce('raven', aliveRavens, cfg.ravenMaxPop, cfg.ravenReproChance, 15);

  // Respawn if extinct
  function respawnIfExtinct(type: AgentType, alive: Agent[], count: number) {
    if (alive.length === 0) {
      for (let i = 0; i < count; i++) newBorns.push(createAgent(type));
      events.push(makeEvent('extinction', type, `${type.charAt(0).toUpperCase() + type.slice(1)}s went extinct — respawned`));
    }
  }
  respawnIfExtinct('wolf', aliveWolves, 5);
  respawnIfExtinct('elk', aliveElks, 15);
  respawnIfExtinct('bear', aliveBears, 3);
  respawnIfExtinct('beaver', aliveBeavers, 4);
  respawnIfExtinct('raven', aliveRavens, 6);

  const result = agents.filter(a => a.alive).concat(newBorns);
  return { agents: result, events };
}
