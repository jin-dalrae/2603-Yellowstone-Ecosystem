import { create } from 'zustand';
import { Agent, SimEvent, createAgent, tickAgents } from '@/lib/boids';
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
  events: SimEvent[];
  populationHistory: PopSnapshot[];
  tickCounter: number;
  selectedAgentId: number | null;
  selectAgent: (id: number | null) => void;
  tickAgents: (delta: number) => void;
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
  events: [],
  populationHistory: [],
  tickCounter: 0,
  selectedAgentId: null,
  selectAgent: (id) => set({ selectedAgentId: id }),
  tickAgents: (delta: number) => {
    const { agents, events, populationHistory, tickCounter } = get();
    const result = tickAgents(agents, delta);
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
