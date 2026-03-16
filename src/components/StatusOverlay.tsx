import { useSimulationStore } from '@/store/simulationStore';
import { Snowflake, Sun, Leaf, Flower2 } from 'lucide-react';

const SEASON_ICONS = {
  spring: <Flower2 className="w-4 h-4 text-accent" />,
  summer: <Sun className="w-4 h-4 text-primary" />,
  autumn: <Leaf className="w-4 h-4 text-destructive" />,
  winter: <Snowflake className="w-4 h-4 text-muted-foreground" />,
};

export function StatusOverlay() {
  const { day, year, season, isPlaying, timeSpeed } = useSimulationStore();

  const monthDay = getMonthDay(Math.floor(day));

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-card/80 backdrop-blur-xl border border-border rounded-xl px-5 py-2.5 shadow-xl">
      <div className="flex items-center gap-2">
        {SEASON_ICONS[season]}
        <span className="text-sm font-medium text-foreground capitalize">{season}</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="text-sm text-muted-foreground">
        <span className="text-foreground font-medium">{monthDay}</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="text-sm text-muted-foreground">
        Year <span className="text-foreground font-medium">{year}</span>
      </div>

      <div className="h-4 w-px bg-border" />

      <div className="text-xs text-muted-foreground">
        {isPlaying ? `▶ ${timeSpeed.toFixed(1)}x` : '⏸ Paused'}
      </div>
    </div>
  );
}

function getMonthDay(dayOfYear: number): string {
  const months = [
    { name: 'Jan', days: 31 }, { name: 'Feb', days: 28 },
    { name: 'Mar', days: 31 }, { name: 'Apr', days: 30 },
    { name: 'May', days: 31 }, { name: 'Jun', days: 30 },
    { name: 'Jul', days: 31 }, { name: 'Aug', days: 31 },
    { name: 'Sep', days: 30 }, { name: 'Oct', days: 31 },
    { name: 'Nov', days: 30 }, { name: 'Dec', days: 31 },
  ];
  let d = dayOfYear;
  for (const m of months) {
    if (d < m.days) return `${m.name} ${Math.floor(d) + 1}`;
    d -= m.days;
  }
  return 'Dec 31';
}
