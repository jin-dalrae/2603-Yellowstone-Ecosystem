import { useEffect, useState } from 'react';
import { getAverageRiparianHealth, getRiparianZones } from '@/lib/riparianState';
import { getDamSites } from '@/lib/boids';
import { useAgentStore } from '@/store/agentStore';
import { Droplets, TreePine, TrendingUp, TrendingDown } from 'lucide-react';

export function RiparianHealthIndicator() {
  const [health, setHealth] = useState(0);
  const [damCount, setDamCount] = useState(0);
  const [avgPressure, setAvgPressure] = useState(0);
  const beaverCount = useAgentStore(s => s.beaverCount);
  const wolfCount = useAgentStore(s => s.wolfCount);
  const elkCount = useAgentStore(s => s.elkCount);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(getAverageRiparianHealth());
      setDamCount(getDamSites().length);
      const zones = getRiparianZones();
      const pressure = zones.reduce((s, z) => s + z.grazingPressure, 0) / zones.length;
      setAvgPressure(pressure);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pct = Math.round(health * 100);
  const pressurePct = Math.round(avgPressure * 100);

  const barColor =
    pct > 60 ? 'bg-primary' :
    pct > 30 ? 'bg-accent' :
    'bg-destructive';

  return (
    <div className="absolute bottom-4 right-4 z-40 bg-card/80 backdrop-blur-xl border border-border rounded-lg px-3.5 py-2.5 shadow-lg w-56">
      <div className="flex items-center gap-2 mb-2">
        <TreePine className="w-4 h-4 text-primary" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
          Trophic Cascade
        </span>
      </div>

      {/* Riparian health bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
          <span>Riverbank Trees</span>
          <span className="font-medium text-foreground">{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Grazing pressure bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[9px] text-muted-foreground mb-0.5">
          <span>Elk Grazing Pressure</span>
          <span className="font-medium text-foreground">{pressurePct}%</span>
        </div>
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 bg-destructive"
            style={{ width: `${pressurePct}%` }}
          />
        </div>
      </div>

      {/* Cascade chain */}
      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground mt-2 flex-wrap">
        <span>🐺 {wolfCount}</span>
        <span>→</span>
        <span>🦌 {elkCount}</span>
        <span>→</span>
        <span>🌲 {pct}%</span>
        <span>→</span>
        <span>🦫 {beaverCount}</span>
        <span>→</span>
        <span><Droplets className="w-3 h-3 inline" /> {damCount}</span>
      </div>

      {/* Status message */}
      <div className="mt-2 text-[10px] leading-relaxed">
        {wolfCount > 5 && pct > 50 ? (
          <p className="text-primary flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Wolves controlling elk — trees recovering along river
          </p>
        ) : wolfCount <= 2 && pct < 40 ? (
          <p className="text-destructive flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Too few wolves — elk overgrazing riverbanks
          </p>
        ) : pct > 70 && damCount > 0 ? (
          <p className="text-primary flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Beaver dams accelerating riparian recovery!
          </p>
        ) : (
          <p className="text-muted-foreground">
            Monitoring trophic cascade dynamics…
          </p>
        )}
      </div>
    </div>
  );
}
