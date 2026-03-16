import { create } from 'zustand';
import { Agent, SimEvent, createAgent, tickAgents } from '@/lib/boids';

export interface PopSnapshot {
  tick: number;
  wolves: number;
  elk: number;
}

interface AgentState {
  agents: Agent[];
  wolfCount: number;
  elkCount: number;
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
  return agents;
}

const MAX_EVENTS = 50;
const MAX_HISTORY = 120;

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: initAgents(),
  wolfCount: 8,
  elkCount: 30,
  events: [],
  populationHistory: [],
  tickCounter: 0,
  tickAgents: (delta: number) => {
    const { agents, events, populationHistory, tickCounter } = get();
    const result = tickAgents(agents, delta);
    const wolfCount = result.agents.filter(a => a.type === 'wolf' && a.alive).length;
    const elkCount = result.agents.filter(a => a.type === 'elk' && a.alive).length;

    const newTick = tickCounter + 1;
    const newEvents = [...result.events, ...events].slice(0, MAX_EVENTS);

    // Sample population every ~10 ticks
    let newHistory = populationHistory;
    if (newTick % 10 === 0) {
      newHistory = [...populationHistory, { tick: newTick, wolves: wolfCount, elk: elkCount }].slice(-MAX_HISTORY);
    }

    set({
      agents: result.agents,
      wolfCount,
      elkCount,
      events: newEvents,
      populationHistory: newHistory,
      tickCounter: newTick,
    });
  },
}));
