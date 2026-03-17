import { create } from 'zustand';
import type { AgentType } from '@/lib/boids';

export interface EcoConfig {
  // Wolf
  wolfEnergyDrain: number;
  wolfChaseDist: number;
  wolfReproChance: number;
  wolfMaxPop: number;

  // Elk
  elkEnergyDrain: number;
  elkGrazeRate: number;
  elkFleeDist: number;
  elkReproChance: number;
  elkMaxPop: number;

  // Bear
  bearEnergyDrain: number;
  bearChaseDist: number;
  bearReproChance: number;
  bearMaxPop: number;

  // Beaver
  beaverEnergyDrain: number;
  beaverReproChance: number;
  beaverMaxPop: number;

  // Raven
  ravenMaxPop: number;
  ravenReproChance: number;

  // Bison
  bisonEnergyDrain: number;
  bisonGrazeRate: number;
  bisonFleeDist: number;
  bisonReproChance: number;
  bisonMaxPop: number;

  // Moose
  mooseEnergyDrain: number;
  mooseGrazeRate: number;
  mooseFleeDist: number;
  mooseReproChance: number;
  mooseMaxPop: number;

  // Coyote
  coyoteEnergyDrain: number;
  coyoteReproChance: number;
  coyoteMaxPop: number;

  // Osprey
  ospreyEnergyDrain: number;
  ospreyFishRate: number;
  ospreyReproChance: number;
  ospreyMaxPop: number;

  // Genetic fitness per species (0.5 - 1.5 multiplier)
  geneticFitness: Record<AgentType, number>;

  // Shared
  energyPerKill: number;
  reproduceEnergy: number;
  killDist: number;

  set: (partial: Partial<EcoConfig>) => void;
  setFitness: (species: AgentType, value: number) => void;
  reset: () => void;
}

const DEFAULT_FITNESS: Record<AgentType, number> = {
  wolf: 1.0, elk: 1.0, bear: 1.0, beaver: 1.0, raven: 1.0,
  bison: 1.0, moose: 1.0, coyote: 1.0, osprey: 1.0,
};

const DEFAULTS = {
  wolfEnergyDrain: 1.8,
  wolfChaseDist: 35,
  wolfReproChance: 0.003,
  wolfMaxPop: 30,

  elkEnergyDrain: 0.8,
  elkGrazeRate: 3.0,
  elkFleeDist: 30,
  elkReproChance: 0.005,
  elkMaxPop: 60,

  bearEnergyDrain: 1.8,
  bearChaseDist: 25,
  bearReproChance: 0.001,
  bearMaxPop: 10,

  beaverEnergyDrain: 0.6,
  beaverReproChance: 0.003,
  beaverMaxPop: 15,

  ravenMaxPop: 20,
  ravenReproChance: 0.004,

  bisonEnergyDrain: 0.7,
  bisonGrazeRate: 3.5,
  bisonFleeDist: 20,
  bisonReproChance: 0.004,
  bisonMaxPop: 40,

  mooseEnergyDrain: 0.9,
  mooseGrazeRate: 2.5,
  mooseFleeDist: 25,
  mooseReproChance: 0.003,
  mooseMaxPop: 15,

  coyoteEnergyDrain: 1.5,
  coyoteReproChance: 0.003,
  coyoteMaxPop: 20,

  ospreyEnergyDrain: 0.8,
  ospreyFishRate: 2.0,
  ospreyReproChance: 0.002,
  ospreyMaxPop: 10,

  geneticFitness: { ...DEFAULT_FITNESS },

  energyPerKill: 70,
  reproduceEnergy: 80,
  killDist: 2.5,
};

export const useEcoConfigStore = create<EcoConfig>((set, get) => ({
  ...DEFAULTS,
  set: (partial) => set(partial),
  setFitness: (species, value) => {
    const current = get().geneticFitness;
    set({ geneticFitness: { ...current, [species]: value } });
  },
  reset: () => set({ ...DEFAULTS, geneticFitness: { ...DEFAULT_FITNESS } }),
}));
