import { useEffect, useState } from 'react';
import { getDamSites } from '@/lib/boids';
import { useAgentStore } from '@/store/agentStore';
import { Droplets } from 'lucide-react';

export function RiparianHealthIndicator() {
  const [health, setHealth] = useState(0);
  const [damCount, setDamCount] = useState(0);
  const beaverCount = useAgentStore(s => s.beaverCount);

  useEffect(() => {
    const interval = setInterval(() => {
      const dams = getDamSites();
      setDamCount(dams.length);
      if (dams.length === 0) {
        setHealth(0);
        return;
      }
      const avg = dams.reduce((sum, d) => sum + d.health, 0) / dams.length;
      setHealth(avg);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (beaverCount === 0 && damCount === 0) return null;

  const pct = Math.round(health * 100);
  const barColor =
    pct > 60 ? 'bg-primary' :
    pct > 30 ? 'bg-accent' :
    'bg-muted-foreground';

  return (
    <div className="absolute bottom-4 right-4 z-40 bg-card/80 backdrop-blur-xl border border-border rounded-lg px-3.5 py-2.5 shadow-lg w-52">
      <div className="flex items-center gap-2 mb-2">
        <Droplets className="w-4 h-4 text-primary" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Riparian Health
        </span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>🦫 {beaverCount} beavers · {damCount} dam{damCount !== 1 ? 's' : ''}</span>
        <span className="font-medium text-foreground">{pct}%</span>
      </div>
      {pct > 50 && (
        <p className="text-[10px] text-primary mt-1.5 leading-relaxed">
          🌿 Riverbank vegetation recovering — grass growing taller near dams
        </p>
      )}
      {pct > 0 && pct <= 50 && (
        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
          Riparian zones slowly stabilizing…
        </p>
      )}
    </div>
  );
}
