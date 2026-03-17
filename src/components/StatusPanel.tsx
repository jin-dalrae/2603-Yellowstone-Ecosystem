import { useState, useMemo } from 'react';
import { useAgentStore, type PopSnapshot } from '@/store/agentStore';
import type { SimEvent } from '@/lib/boids';
import type { AgentType } from '@/lib/boids';
import { ChevronLeft, ChevronRight, Skull, Baby, AlertTriangle, Utensils, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

const SPECIES_COLORS = {
  wolves: 'hsl(0 75% 55%)',
  elk: 'hsl(142 60% 45%)',
  bears: 'hsl(30 70% 40%)',
  beavers: 'hsl(180 50% 40%)',
  ravens: 'hsl(270 50% 55%)',
  bison: 'hsl(55 70% 45%)',
  moose: 'hsl(320 50% 50%)',
  coyotes: 'hsl(90 55% 45%)',
  ospreys: 'hsl(210 70% 55%)',
};

const chartConfig: ChartConfig = {
  wolves: { label: 'Wolves', color: SPECIES_COLORS.wolves },
  elk: { label: 'Elk', color: SPECIES_COLORS.elk },
  bears: { label: 'Bears', color: SPECIES_COLORS.bears },
  beavers: { label: 'Beavers', color: SPECIES_COLORS.beavers },
  ravens: { label: 'Ravens', color: SPECIES_COLORS.ravens },
  bison: { label: 'Bison', color: SPECIES_COLORS.bison },
  moose: { label: 'Moose', color: SPECIES_COLORS.moose },
  coyotes: { label: 'Coyotes', color: SPECIES_COLORS.coyotes },
  ospreys: { label: 'Osprey', color: SPECIES_COLORS.ospreys },
};

const EVENT_ICONS: Record<SimEvent['type'], React.ReactNode> = {
  kill: <Skull className="w-3 h-3 text-destructive shrink-0" />,
  birth: <Baby className="w-3 h-3 text-primary shrink-0" />,
  extinction: <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />,
  respawn: <AlertTriangle className="w-3 h-3 text-accent shrink-0" />,
  starvation: <Utensils className="w-3 h-3 text-muted-foreground shrink-0" />,
  dam_built: <Utensils className="w-3 h-3 text-primary shrink-0" />,
};

const EVENT_TYPE_LABELS: Record<SimEvent['type'], string> = {
  kill: 'Kills',
  birth: 'Births',
  starvation: 'Starvation',
  extinction: 'Extinctions',
  respawn: 'Respawns',
  dam_built: 'Dams Built',
};

const SPECIES_LABELS: Record<AgentType, string> = {
  wolf: 'Wolf', elk: 'Elk', bear: 'Bear', beaver: 'Beaver', raven: 'Raven',
  bison: 'Bison', moose: 'Moose', coyote: 'Coyote', osprey: 'Osprey',
};

interface TrendItem {
  label: string;
  current: number;
  previous: number;
  icon: React.ReactNode;
}

function computeTrends(events: SimEvent[]): TrendItem[] {
  const now = Date.now();
  const WINDOW = 60_000; // 1 minute

  const currentWindow = events.filter(e => now - e.timestamp < WINDOW);
  const prevWindow = events.filter(e => now - e.timestamp >= WINDOW && now - e.timestamp < WINDOW * 2);

  // Aggregate by event type × species
  const aggregate = (list: SimEvent[]) => {
    const map = new Map<string, number>();
    for (const e of list) {
      const key = `${e.type}:${e.species}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  };

  const curAgg = aggregate(currentWindow);
  const prevAgg = aggregate(prevWindow);

  // Collect all keys from both windows
  const allKeys = new Set([...curAgg.keys(), ...prevAgg.keys()]);
  const trends: TrendItem[] = [];

  for (const key of allKeys) {
    const [eventType, species] = key.split(':') as [SimEvent['type'], AgentType];
    const cur = curAgg.get(key) ?? 0;
    const prev = prevAgg.get(key) ?? 0;
    if (cur === 0 && prev === 0) continue;

    trends.push({
      label: `${SPECIES_LABELS[species]} ${EVENT_TYPE_LABELS[eventType]}`,
      current: cur,
      previous: prev,
      icon: EVENT_ICONS[eventType],
    });
  }

  // Sort by current count descending, then by change magnitude
  trends.sort((a, b) => {
    const aChange = Math.abs(a.current - a.previous);
    const bChange = Math.abs(b.current - b.previous);
    return (b.current + bChange) - (a.current + aChange);
  });

  return trends.slice(0, 8); // top 8 trends
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;

  const diff = current - previous;
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0;

  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-destructive">
        <TrendingUp className="w-3 h-3" />
        +{pct}%
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-primary">
        <TrendingDown className="w-3 h-3" />
        {pct}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <Minus className="w-3 h-3" />
      steady
    </span>
  );
}

function TrendInsights({ events }: { events: SimEvent[] }) {
  const trends = useMemo(() => computeTrends(events), [events]);

  if (trends.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-3">
        Gathering trend data…
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Last 1 min</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">vs prev 1 min</span>
      </div>
      {trends.map((t) => (
        <div
          key={t.label}
          className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-md bg-secondary/30"
        >
          {t.icon}
          <span className="text-foreground flex-1 truncate">{t.label}</span>
          <span className="text-muted-foreground tabular-nums text-[11px] font-medium">{t.current}</span>
          <TrendBadge current={t.current} previous={t.previous} />
        </div>
      ))}
    </div>
  );
}

function PopulationChart({ data }: { data: PopSnapshot[] }) {
  if (data.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
        Collecting data…
      </div>
    );
  }

  const speciesKeys = Object.keys(SPECIES_COLORS) as (keyof typeof SPECIES_COLORS)[];

  const gradients = speciesKeys.map(key => ({
    id: `${key}Grad`,
    color: SPECIES_COLORS[key],
  }));

  const series = speciesKeys.map(key => ({
    key,
    stroke: SPECIES_COLORS[key],
    fill: `url(#${key}Grad)`,
    w: ['wolves', 'elk', 'bison'].includes(key) ? 2 : 1.5,
  }));

  return (
    <>
    <ChartContainer config={chartConfig} className="h-36 w-full">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          {gradients.map(g => (
            <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={g.color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={g.color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <XAxis dataKey="tick" hide />
        <YAxis tick={{ fontSize: 10 }} width={30} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {series.map(s => (
          <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.stroke} fill={s.fill} strokeWidth={s.w} dot={false} />
        ))}
      </AreaChart>
    </ChartContainer>
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 px-1">
      {speciesKeys.map(key => (
        <div key={key} className="flex items-center gap-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: SPECIES_COLORS[key] }}
          />
          <span className="text-[10px] text-muted-foreground capitalize">{chartConfig[key].label}</span>
        </div>
      ))}
    </div>
  </>
  );
}

function EventFeed({ events }: { events: SimEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        No events yet…
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
      {events.slice(0, 30).map((e) => (
        <div
          key={e.id}
          className="flex items-center gap-2 text-xs py-1 px-2 rounded-md bg-secondary/30"
        >
          {EVENT_ICONS[e.type]}
          <span className="text-muted-foreground truncate">{e.message}</span>
        </div>
      ))}
    </div>
  );
}

export function StatusPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    wolfCount, elkCount, bearCount, beaverCount, ravenCount,
    bisonCount, mooseCount, coyoteCount, ospreyCount,
    populationHistory, events, narration, narrationLoading,
  } = useAgentStore();

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute top-4 right-4 z-50 bg-card/80 backdrop-blur-md border border-border rounded-lg p-2 hover:bg-card/95 transition-colors"
        aria-label="Open status panel"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
    );
  }

  const speciesList = [
    { emoji: '🐺', label: 'Wolves', count: wolfCount },
    { emoji: '🦌', label: 'Elk', count: elkCount },
    { emoji: '🐻', label: 'Bears', count: bearCount },
    { emoji: '🦫', label: 'Beavers', count: beaverCount },
    { emoji: '🐦‍⬛', label: 'Ravens', count: ravenCount },
    { emoji: '🦬', label: 'Bison', count: bisonCount },
    { emoji: '🫎', label: 'Moose', count: mooseCount },
    { emoji: '🐺', label: 'Coyotes', count: coyoteCount },
    { emoji: '🦅', label: 'Osprey', count: ospreyCount },
  ];

  return (
    <div className="absolute top-4 right-4 z-50 w-72 bg-card/85 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
          Ecosystem
        </h2>
        <button
          onClick={() => setCollapsed(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Population counts */}
        <div className="grid grid-cols-3 gap-1.5">
          {speciesList.map((s) => (
            <div key={s.label} className="bg-secondary/40 rounded-lg p-2 text-center">
              <div className="text-sm font-bold text-foreground">{s.count}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">
                {s.emoji} {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
            Population
          </label>
          <PopulationChart data={populationHistory} />
        </div>


        {/* Narration */}
        {(narration || narrationLoading) && (
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              🎙️ Narration
            </label>
            <div className="bg-secondary/40 rounded-lg p-3 text-xs text-foreground leading-relaxed italic">
              {narrationLoading ? (
                <span className="text-muted-foreground animate-pulse">Sir David is observing…</span>
              ) : (
                narration
              )}
            </div>
          </div>
        )}

        {/* Event feed */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
            Events
          </label>
          <EventFeed events={events} />
        </div>
      </div>
    </div>
  );
}
