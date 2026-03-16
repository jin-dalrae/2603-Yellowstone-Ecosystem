import { create } from 'zustand';
import { Agent, SimEvent, createAgent, tickAgents } from '@/lib/boids';

export interface PopSnapshot {
  tick: number;
  wolves: number;
  elk: number;
  bears: number;
  beavers: number;
  ravens: number;
}

interface AgentState {
  agents: Agent[];
  wolfCount: number;
  elkCount: number;
  bearCount: number;
  beaverCount: number;
  ravenCount: number;
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

    const newTick = tickCounter + 1;
    const newEvents = [...result.events, ...events].slice(0, MAX_EVENTS);

    let newHistory = populationHistory;
    if (newTick % 10 === 0) {
      newHistory = [...populationHistory, {
        tick: newTick, wolves: wolfCount, elk: elkCount,
        bears: bearCount, beavers: beaverCount, ravens: ravenCount,
      }].slice(-MAX_HISTORY);
    }

    set({
      agents: result.agents,
      wolfCount, elkCount, bearCount, beaverCount, ravenCount,
      events: newEvents,
      populationHistory: newHistory,
      tickCounter: newTick,
    });
  },
}));
