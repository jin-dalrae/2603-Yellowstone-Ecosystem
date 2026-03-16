import { create } from 'zustand';
import { Agent, createAgent, tickAgents } from '@/lib/boids';

interface AgentState {
  agents: Agent[];
  wolfCount: number;
  elkCount: number;
  tickAgents: (delta: number) => void;
}

function initAgents(): Agent[] {
  const agents: Agent[] = [];
  for (let i = 0; i < 8; i++) agents.push(createAgent('wolf'));
  for (let i = 0; i < 30; i++) agents.push(createAgent('elk'));
  return agents;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: initAgents(),
  wolfCount: 8,
  elkCount: 30,
  tickAgents: (delta: number) => {
    const { agents } = get();
    const updated = tickAgents(agents, delta);
    const wolfCount = updated.filter(a => a.type === 'wolf' && a.alive).length;
    const elkCount = updated.filter(a => a.type === 'elk' && a.alive).length;
    set({ agents: updated, wolfCount, elkCount });
  },
}));
