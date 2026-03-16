import { useState } from 'react';
import { useAgentStore, type PopSnapshot } from '@/store/agentStore';
import type { SimEvent } from '@/lib/boids';
import { ChevronLeft, ChevronRight, Skull, Baby, AlertTriangle, Utensils } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';

const chartConfig: ChartConfig = {
  wolves: { label: 'Wolves', color: 'hsl(0 70% 50%)' },
  elk: { label: 'Elk', color: 'hsl(142 50% 45%)' },
  bears: { label: 'Bears', color: 'hsl(30 60% 35%)' },
  beavers: { label: 'Beavers', color: 'hsl(25 50% 40%)' },
  ravens: { label: 'Ravens', color: 'hsl(260 30% 30%)' },
  bison: { label: 'Bison', color: 'hsl(20 55% 30%)' },
  moose: { label: 'Moose', color: 'hsl(35 45% 35%)' },
  coyotes: { label: 'Coyotes', color: 'hsl(45 50% 50%)' },
  ospreys: { label: 'Osprey', color: 'hsl(210 60% 50%)' },
};

const EVENT_ICONS: Record<SimEvent['type'], React.ReactNode> = {
  kill: <Skull className="w-3 h-3 text-destructive shrink-0" />,
  birth: <Baby className="w-3 h-3 text-primary shrink-0" />,
  extinction: <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />,
  respawn: <AlertTriangle className="w-3 h-3 text-accent shrink-0" />,
  starvation: <Utensils className="w-3 h-3 text-muted-foreground shrink-0" />,
  dam_built: <Utensils className="w-3 h-3 text-primary shrink-0" />,
};

function PopulationChart({ data }: { data: PopSnapshot[] }) {
  if (data.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
        Collecting data…
      </div>
    );
  }

  const gradients = [
    { id: 'wolfGrad', color: 'hsl(0 70% 50%)' },
    { id: 'elkGrad', color: 'hsl(142 50% 45%)' },
    { id: 'bearGrad', color: 'hsl(30 60% 35%)' },
    { id: 'beaverGrad', color: 'hsl(25 50% 40%)' },
    { id: 'ravenGrad', color: 'hsl(260 30% 30%)' },
    { id: 'bisonGrad', color: 'hsl(20 55% 30%)' },
    { id: 'mooseGrad', color: 'hsl(35 45% 35%)' },
    { id: 'coyoteGrad', color: 'hsl(45 50% 50%)' },
    { id: 'ospreyGrad', color: 'hsl(210 60% 50%)' },
  ];

  const series = [
    { key: 'wolves', stroke: 'hsl(0 70% 50%)', fill: 'url(#wolfGrad)', w: 2 },
    { key: 'elk', stroke: 'hsl(142 50% 45%)', fill: 'url(#elkGrad)', w: 2 },
    { key: 'bears', stroke: 'hsl(30 60% 35%)', fill: 'url(#bearGrad)', w: 1.5 },
    { key: 'beavers', stroke: 'hsl(25 50% 40%)', fill: 'url(#beaverGrad)', w: 1.5 },
    { key: 'ravens', stroke: 'hsl(260 30% 30%)', fill: 'url(#ravenGrad)', w: 1.5 },
    { key: 'bison', stroke: 'hsl(20 55% 30%)', fill: 'url(#bisonGrad)', w: 1.5 },
    { key: 'moose', stroke: 'hsl(35 45% 35%)', fill: 'url(#mooseGrad)', w: 1 },
    { key: 'coyotes', stroke: 'hsl(45 50% 50%)', fill: 'url(#coyoteGrad)', w: 1 },
    { key: 'ospreys', stroke: 'hsl(210 60% 50%)', fill: 'url(#ospreyGrad)', w: 1 },
  ];

  return (
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
    populationHistory, events,
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
