import { useAgentStore } from '@/store/agentStore';
import { useSimulationStore } from '@/store/simulationStore';
import { X, Crosshair } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function AnimalDetailPanel() {
  const selectedId = useAgentStore((s) => s.selectedAgentId);
  const agents = useAgentStore((s) => s.agents);
  const selectAgent = useAgentStore((s) => s.selectAgent);
  const setCameraMode = useSimulationStore((s) => s.setCameraMode);
  const cameraMode = useSimulationStore((s) => s.cameraMode);

  if (selectedId === null) return null;

  const agent = agents.find((a) => a.id === selectedId);
  if (!agent || !agent.alive) return null;

  const speed = Math.sqrt(agent.vx * agent.vx + agent.vz * agent.vz);
  const isWolf = agent.type === 'wolf';
  const maxAges: Record<string, number> = { wolf: 120, elk: 150, bear: 180, beaver: 100, raven: 80 };
  const maxAge = maxAges[agent.type] ?? 120;
  const emojis: Record<string, string> = { wolf: '🐺', elk: '🦌', bear: '🐻', beaver: '🦫', raven: '🐦‍⬛' };
  const emoji = emojis[agent.type] ?? '🐾';

  const deselect = () => {
    selectAgent(null);
    if (cameraMode === 'follow') setCameraMode('orbit');
  };

  const toggleFollow = () => {
    setCameraMode(cameraMode === 'follow' ? 'orbit' : 'follow');
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-72 bg-card/90 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-base">{isWolf ? '🐺' : '🦌'}</span>
          <span className="text-sm font-semibold text-foreground capitalize">
            {agent.type} #{agent.id}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFollow}
            className={`p-1.5 rounded-md transition-colors ${
              cameraMode === 'follow'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
            title={cameraMode === 'follow' ? 'Stop following' : 'Follow'}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={deselect}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3">
        {/* Energy */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-muted-foreground uppercase tracking-wider">Energy</span>
            <span className="text-foreground font-medium tabular-nums">{agent.energy.toFixed(1)}</span>
          </div>
          <Progress
            value={agent.energy}
            className="h-1.5"
          />
        </div>

        {/* Age */}
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-muted-foreground uppercase tracking-wider">Age</span>
            <span className="text-foreground font-medium tabular-nums">{agent.age.toFixed(0)}s / {maxAge}s</span>
          </div>
          <Progress
            value={(agent.age / maxAge) * 100}
            className="h-1.5"
          />
        </div>

        {/* Speed & Position */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">Speed</span>
            <span className="text-sm font-medium text-foreground tabular-nums">{speed.toFixed(1)}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">Position</span>
            <span className="text-sm font-medium text-foreground tabular-nums">
              {agent.x.toFixed(0)}, {agent.z.toFixed(0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
