// Boids flocking algorithm + predator-prey rules engine

export interface Agent {
  id: number;
  type: 'wolf' | 'elk';
  x: number;
  z: number;
  vx: number;
  vz: number;
  energy: number;
  age: number;
  alive: boolean;
}

export interface SimEvent {
  id: number;
  type: 'kill' | 'birth' | 'extinction' | 'respawn' | 'starvation';
  species: 'wolf' | 'elk';
  timestamp: number;
  message: string;
}

let eventIdCounter = 0;
function makeEvent(type: SimEvent['type'], species: SimEvent['species'], message: string): SimEvent {
  return { id: eventIdCounter++, type, species, timestamp: Date.now(), message };
}

export interface TickResult {
  agents: Agent[];
  events: SimEvent[];
}

const WORLD_HALF = 90; // stay within terrain bounds
const MAX_SPEED_ELK = 12;
const MAX_SPEED_WOLF = 14;

// Boids parameters
const SEPARATION_DIST = 4;
const ALIGNMENT_DIST = 15;
const COHESION_DIST = 20;
const SEPARATION_WEIGHT = 2.5;
const ALIGNMENT_WEIGHT = 1.0;
const COHESION_WEIGHT = 0.8;

// Predator-prey
const WOLF_CHASE_DIST = 35;
const ELK_FLEE_DIST = 30;
const HUNT_WEIGHT = 3.0;
const FLEE_WEIGHT = 4.0;
const KILL_DIST = 2.5;
const ENERGY_PER_KILL = 60;
const WOLF_ENERGY_DRAIN = 2.5;  // per second
const ELK_ENERGY_DRAIN = 0.8;
const ELK_GRAZE_RATE = 3.0;    // energy per second when slow
const REPRODUCE_ENERGY = 80;
const REPRODUCE_COOLDOWN_FRAMES = 300; // ticks between births

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

function wolfChase(wolf: Agent, elks: Agent[]): [number, number] {
  let closest: Agent | null = null;
  let minDist = WOLF_CHASE_DIST;
  for (const elk of elks) {
    if (!elk.alive) continue;
    const dx = elk.x - wolf.x;
    const dz = elk.z - wolf.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < minDist) {
      minDist = dist;
      closest = elk;
    }
  }
  if (!closest) return [0, 0];
  const dx = closest.x - wolf.x;
  const dz = closest.z - wolf.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  return [(dx / dist) * HUNT_WEIGHT, (dz / dist) * HUNT_WEIGHT];
}

function elkFlee(elk: Agent, wolves: Agent[]): [number, number] {
  let fx = 0, fz = 0;
  for (const w of wolves) {
    if (!w.alive) continue;
    const dx = elk.x - w.x;
    const dz = elk.z - w.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < ELK_FLEE_DIST && dist > 0) {
      fx += (dx / dist) * FLEE_WEIGHT / (dist * 0.1);
      fz += (dz / dist) * FLEE_WEIGHT / (dist * 0.1);
    }
  }
  return [fx, fz];
}

export function createAgent(type: 'wolf' | 'elk', x?: number, z?: number): Agent {
  const spread = type === 'wolf' ? 30 : 50;
  const offsetX = type === 'wolf' ? -30 : 20;
  const offsetZ = type === 'wolf' ? -20 : 10;
  return {
    id: nextId++,
    type,
    x: x ?? offsetX + (Math.random() - 0.5) * spread,
    z: z ?? offsetZ + (Math.random() - 0.5) * spread,
    vx: (Math.random() - 0.5) * 4,
    vz: (Math.random() - 0.5) * 4,
    energy: 50 + Math.random() * 30,
    age: 0,
    alive: true,
  };
}

export function tickAgents(agents: Agent[], delta: number): TickResult {
  const wolves = agents.filter(a => a.type === 'wolf' && a.alive);
  const elks = agents.filter(a => a.type === 'elk' && a.alive);
  const newBorns: Agent[] = [];
  const events: SimEvent[] = [];

  for (const agent of agents) {
    if (!agent.alive) continue;

    const sameType = agent.type === 'wolf' ? wolves : elks;
    const neighbors = sameType.filter(a => a.id !== agent.id);

    // Boids forces
    const [sx, sz] = separation(agent, neighbors);
    const [ax, az] = alignment(agent, neighbors);
    const [cx, cz] = cohesion(agent, neighbors);
    const [bx, bz] = boundaryForce(agent.x, agent.z);

    let fx = sx + ax + cx + bx;
    let fz = sz + az + cz + bz;

    // Predator-prey forces
    if (agent.type === 'wolf') {
      const [hx, hz] = wolfChase(agent, elks);
      fx += hx;
      fz += hz;
      agent.energy -= WOLF_ENERGY_DRAIN * delta;
    } else {
      const [flx, flz] = elkFlee(agent, wolves);
      fx += flx;
      fz += flz;
      // Grazing: recover energy when moving slow
      const speed = Math.sqrt(agent.vx * agent.vx + agent.vz * agent.vz);
      if (speed < 3) {
        agent.energy += ELK_GRAZE_RATE * delta;
      }
      agent.energy -= ELK_ENERGY_DRAIN * delta;
    }

    // Add slight wander
    fx += (Math.random() - 0.5) * 1.5;
    fz += (Math.random() - 0.5) * 1.5;

    // Apply forces
    agent.vx += fx * delta;
    agent.vz += fz * delta;

    // Clamp speed
    const maxSpd = agent.type === 'wolf' ? MAX_SPEED_WOLF : MAX_SPEED_ELK;
    const spd = Math.sqrt(agent.vx * agent.vx + agent.vz * agent.vz);
    if (spd > maxSpd) {
      agent.vx = (agent.vx / spd) * maxSpd;
      agent.vz = (agent.vz / spd) * maxSpd;
    }

    // Move
    agent.x = clampToWorld(agent.x + agent.vx * delta);
    agent.z = clampToWorld(agent.z + agent.vz * delta);
    agent.age += delta;

    // Energy clamp
    agent.energy = Math.min(100, agent.energy);

    // Death by starvation
    if (agent.energy <= 0) {
      agent.alive = false;
      events.push(makeEvent('starvation', agent.type, `A ${agent.type} starved`));
    }

    // Old age death
    if (agent.type === 'wolf' && agent.age > 120) { agent.alive = false; }
    if (agent.type === 'elk' && agent.age > 150) { agent.alive = false; }
  }

  // Wolf kills: check proximity
  for (const wolf of wolves) {
    if (!wolf.alive) continue;
    for (const elk of elks) {
      if (!elk.alive) continue;
      const dx = wolf.x - elk.x;
      const dz = wolf.z - elk.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < KILL_DIST) {
        elk.alive = false;
        wolf.energy = Math.min(100, wolf.energy + ENERGY_PER_KILL);
        events.push(makeEvent('kill', 'wolf', 'Wolf hunted an elk'));
        break;
      }
    }
  }

  // Reproduction
  const aliveWolves = agents.filter(a => a.type === 'wolf' && a.alive);
  const aliveElks = agents.filter(a => a.type === 'elk' && a.alive);

  if (aliveWolves.length >= 2 && aliveWolves.length < 25) {
    for (const w of aliveWolves) {
      if (w.energy > REPRODUCE_ENERGY && Math.random() < 0.002) {
        w.energy -= 30;
        newBorns.push(createAgent('wolf', w.x + (Math.random() - 0.5) * 5, w.z + (Math.random() - 0.5) * 5));
        break;
      }
    }
  }

  if (aliveElks.length >= 2 && aliveElks.length < 60) {
    for (const e of aliveElks) {
      if (e.energy > REPRODUCE_ENERGY && Math.random() < 0.005) {
        e.energy -= 25;
        newBorns.push(createAgent('elk', e.x + (Math.random() - 0.5) * 5, e.z + (Math.random() - 0.5) * 5));
        break;
      }
    }
  }

  // Population floor: respawn if extinct
  if (aliveWolves.length === 0) {
    for (let i = 0; i < 5; i++) newBorns.push(createAgent('wolf'));
  }
  if (aliveElks.length === 0) {
    for (let i = 0; i < 15; i++) newBorns.push(createAgent('elk'));
  }

  // Remove long-dead agents, keep alive + newborns
  const result = agents.filter(a => a.alive).concat(newBorns);
  return result;
}
