import { create } from 'zustand';
import { Agent, SimEvent, createAgent, tickAgents } from '@/lib/boids';
import type { AgentType } from '@/lib/boids';
import type { Season } from '@/store/simulationStore';

export interface PopSnapshot {
  tick: number;
  wolves: number;
  elk: number;
  bears: number;
  beavers: number;
  ravens: number;
  bison: number;
  moose: number;
  coyotes: number;
  ospreys: number;
  trees: number;
}

interface AgentState {
  agents: Agent[];
  wolfCount: number;
  elkCount: number;
  bearCount: number;
  beaverCount: number;
  ravenCount: number;
  bisonCount: number;
  mooseCount: number;
  coyoteCount: number;
  ospreyCount: number;
  treeCount: number;
  setTreeCount: (n: number) => void;
  events: SimEvent[];
  populationHistory: PopSnapshot[];
  tickCounter: number;
  selectedAgentId: number | null;
  narration: string;
  narrationLoading: boolean;
  extinctSpecies: AgentType | null;
  selectAgent: (id: number | null) => void;
  spawnAgents: (type: AgentType, count: number) => void;
  cullAgents: (type: AgentType, count: number) => void;
  setPopulationTarget: (type: AgentType, target: number) => void;
  resetScenario: (populations: Partial<Record<AgentType, number>>) => void;
  setNarration: (text: string) => void;
  setNarrationLoading: (loading: boolean) => void;
  clearExtinction: () => void;
  tickAgents: (delta: number, season?: Season) => void;
}

function initAgents(): Agent[] {
  const agents: Agent[] = [];
  for (let i = 0; i < 8; i++) agents.push(createAgent('wolf'));
  for (let i = 0; i < 30; i++) agents.push(createAgent('elk'));
  for (let i = 0; i < 4; i++) agents.push(createAgent('bear'));
  for (let i = 0; i < 6; i++) agents.push(createAgent('beaver'));
  for (let i = 0; i < 8; i++) agents.push(createAgent('raven'));
  for (let i = 0; i < 15; i++) agents.push(createAgent('bison'));
  for (let i = 0; i < 5; i++) agents.push(createAgent('moose'));
  for (let i = 0; i < 8; i++) agents.push(createAgent('coyote'));
  for (let i = 0; i < 4; i++) agents.push(createAgent('osprey'));
  return agents;
}

const MAX_EVENTS = 50;
const MAX_HISTORY = 120;

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: initAgents(),
  wolfCount: 8,
  elkCount: 30,
  bearCount: 4,
  beaverCount: 6,
  ravenCount: 8,
  bisonCount: 15,
  mooseCount: 5,
  coyoteCount: 8,
  ospreyCount: 4,
  treeCount: 0,
  setTreeCount: (treeCount) => set({ treeCount }),
  events: [],
  populationHistory: [],
  tickCounter: 0,
  selectedAgentId: null,
  narration: '',
  narrationLoading: false,
  extinctSpecies: null,
  selectAgent: (id) => set({ selectedAgentId: id }),
  spawnAgents: (type, count) => {
    const { agents } = get();
    const newAgents: Agent[] = [];
    for (let i = 0; i < count; i++) newAgents.push(createAgent(type));
    set({ agents: [...agents, ...newAgents] });
  },
  cullAgents: (type, count) => {
    const { agents } = get();
    let culled = 0;
    const updated = agents.map(a => {
      if (a.type === type && a.alive && culled < count) {
        culled++;
        return { ...a, alive: false };
      }
      return a;
    });
    set({ agents: updated });
  },
  setPopulationTarget: (type, target) => {
    const { agents } = get();
    const alive = agents.filter(a => a.type === type && a.alive);
    const diff = target - alive.length;
    if (diff > 0) {
      get().spawnAgents(type, diff);
    } else if (diff < 0) {
      get().cullAgents(type, -diff);
    }
  },
  resetScenario: (populations) => {
    const newAgents: Agent[] = [];
    for (const [type, count] of Object.entries(populations)) {
      for (let i = 0; i < (count as number); i++) {
        newAgents.push(createAgent(type as AgentType));
      }
    }
    set({
      agents: newAgents,
      events: [],
      populationHistory: [],
      tickCounter: 0,
      selectedAgentId: null,
      narration: '',
      extinctSpecies: null,
    });
  },
  clearExtinction: () => set({ extinctSpecies: null }),
  setNarration: (narration) => set({ narration }),
  setNarrationLoading: (narrationLoading) => set({ narrationLoading }),
  tickAgents: (delta: number, season?: Season) => {
    const { agents, events, populationHistory, tickCounter } = get();
    const result = tickAgents(agents, delta, season);
    const wolfCount = result.agents.filter(a => a.type === 'wolf' && a.alive).length;
    const elkCount = result.agents.filter(a => a.type === 'elk' && a.alive).length;
    const bearCount = result.agents.filter(a => a.type === 'bear' && a.alive).length;
    const beaverCount = result.agents.filter(a => a.type === 'beaver' && a.alive).length;
    const ravenCount = result.agents.filter(a => a.type === 'raven' && a.alive).length;
    const bisonCount = result.agents.filter(a => a.type === 'bison' && a.alive).length;
    const mooseCount = result.agents.filter(a => a.type === 'moose' && a.alive).length;
    const coyoteCount = result.agents.filter(a => a.type === 'coyote' && a.alive).length;
    const ospreyCount = result.agents.filter(a => a.type === 'osprey' && a.alive).length;

    const newTick = tickCounter + 1;
    const newEvents = [...result.events, ...events].slice(0, MAX_EVENTS);

    let newHistory = populationHistory;
    if (newTick % 10 === 0) {
      newHistory = [...populationHistory, {
        tick: newTick, wolves: wolfCount, elk: elkCount,
        bears: bearCount, beavers: beaverCount, ravens: ravenCount,
        bison: bisonCount, moose: mooseCount, coyotes: coyoteCount, ospreys: ospreyCount,
        trees: get().treeCount,
      }].slice(-MAX_HISTORY);
    }

    set({
      agents: result.agents,
      wolfCount, elkCount, bearCount, beaverCount, ravenCount,
      bisonCount, mooseCount, coyoteCount, ospreyCount,
      events: newEvents,
      populationHistory: newHistory,
      tickCounter: newTick,
    });
  },
}));
