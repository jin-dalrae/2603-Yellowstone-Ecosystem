import { create } from 'zustand';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type CameraMode = 'orbit' | 'god' | 'follow';
export type RefugePolicy = 'open' | 'limited' | 'closed';

export const SEASON_INDEX: Record<Season, number> = {
  spring: 0,
  summer: 1,
  autumn: 2,
  winter: 3,
};

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  apply: () => void;
}

interface SimulationState {
  season: Season;
  setSeason: (s: Season) => void;
  timeSpeed: number;
  setTimeSpeed: (s: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  day: number;
  year: number;
  cameraMode: CameraMode;
  setCameraMode: (m: CameraMode) => void;
  winterSeverity: number;
  setWinterSeverity: (v: number) => void;
  refugePolicy: RefugePolicy;
  setRefugePolicy: (p: RefugePolicy) => void;
  wildfireActive: boolean;
  wildfireX: number;
  wildfireZ: number;
  triggerWildfire: (x: number, z: number) => void;
  stopWildfire: () => void;
  setDayAndYear: (day: number, year: number) => void;
  tick: (delta: number) => void;
}

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];

export const useSimulationStore = create<SimulationState>((set, get) => ({
  season: 'summer',
  setSeason: (season) => set({ season }),
  timeSpeed: 1,
  setTimeSpeed: (timeSpeed) => set({ timeSpeed }),
  isPlaying: true,
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  day: 150,
  year: 1,
  cameraMode: 'orbit',
  setCameraMode: (cameraMode) => set({ cameraMode }),
  winterSeverity: 5,
  setWinterSeverity: (winterSeverity) => set({ winterSeverity }),
  refugePolicy: 'open',
  setRefugePolicy: (refugePolicy) => set({ refugePolicy }),
  wildfireActive: false,
  wildfireX: 0,
  wildfireZ: 0,
  triggerWildfire: (x, z) => set({ wildfireActive: true, wildfireX: x, wildfireZ: z }),
  stopWildfire: () => set({ wildfireActive: false }),
  setDayAndYear: (day, year) => {
    const seasonIndex = Math.floor(day / 91.25);
    const newSeason = SEASONS[Math.min(seasonIndex, 3)];
    set({ day, year, season: newSeason });
  },
  tick: (delta) => {
    const { isPlaying, timeSpeed, day, year } = get();
    if (!isPlaying) return;
    let newDay = day + delta * timeSpeed * 8;
    let newYear = year;
    if (newDay >= 365) {
      newDay = newDay % 365;
      newYear = year + 1;
    }
    const seasonIndex = Math.floor(newDay / 91.25);
    const newSeason = SEASONS[Math.min(seasonIndex, 3)];
    set({ day: newDay, year: newYear, season: newSeason });
  },
}));
