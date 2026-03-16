import { create } from 'zustand';

export interface EcoConfig {
  // Energy
  wolfEnergyDrain: number;
  elkEnergyDrain: number;
  elkGrazeRate: number;
  energyPerKill: number;

  // Reproduction
  reproduceEnergy: number;
  wolfReproChance: number;
  elkReproChance: number;
  wolfMaxPop: number;
  elkMaxPop: number;

  // Behavior
  wolfChaseDist: number;
  elkFleeDist: number;
  killDist: number;

  // Setters
  set: (partial: Partial<EcoConfig>) => void;
  reset: () => void;
}

const DEFAULTS = {
  wolfEnergyDrain: 2.5,
  elkEnergyDrain: 0.8,
  elkGrazeRate: 3.0,
  energyPerKill: 60,
  reproduceEnergy: 80,
  wolfReproChance: 0.002,
  elkReproChance: 0.005,
  wolfMaxPop: 25,
  elkMaxPop: 60,
  wolfChaseDist: 35,
  elkFleeDist: 30,
  killDist: 2.5,
};

export const useEcoConfigStore = create<EcoConfig>((set) => ({
  ...DEFAULTS,
  set: (partial) => set(partial),
  reset: () => set(DEFAULTS),
}));
