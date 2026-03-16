import { create } from 'zustand';

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

  // Shared
  energyPerKill: number;
  reproduceEnergy: number;
  killDist: number;

  set: (partial: Partial<EcoConfig>) => void;
  reset: () => void;
}

const DEFAULTS = {
  wolfEnergyDrain: 2.5,
  wolfChaseDist: 35,
  wolfReproChance: 0.002,
  wolfMaxPop: 25,

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

  energyPerKill: 60,
  reproduceEnergy: 80,
  killDist: 2.5,
};

export const useEcoConfigStore = create<EcoConfig>((set) => ({
  ...DEFAULTS,
  set: (partial) => set(partial),
  reset: () => set(DEFAULTS),
}));
