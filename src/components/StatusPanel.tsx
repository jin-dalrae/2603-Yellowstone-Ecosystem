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
};

const EVENT_ICONS: Record<SimEvent['type'], React.ReactNode> = {
  kill: <Skull className="w-3 h-3 text-destructive shrink-0" />,
  birth: <Baby className="w-3 h-3 text-primary shrink-0" />,
  extinction: <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />,
  respawn: <AlertTriangle className="w-3 h-3 text-accent shrink-0" />,
  starvation: <Utensils className="w-3 h-3 text-muted-foreground shrink-0" />,
};

function PopulationChart({ data }: { data: PopSnapshot[] }) {
  if (data.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
        Collecting data…
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-36 w-full">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="wolfGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(0 70% 50%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(0 70% 50%)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="elkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(142 50% 45%)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(142 50% 45%)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis dataKey="tick" hide />
        <YAxis tick={{ fontSize: 10 }} width={30} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="wolves"
          stroke="hsl(0 70% 50%)"
          fill="url(#wolfGrad)"
          strokeWidth={2}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="elk"
          stroke="hsl(142 50% 45%)"
          fill="url(#elkGrad)"
          strokeWidth={2}
          dot={false}
        />
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
  const { wolfCount, elkCount, populationHistory, events } = useAgentStore();

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

  return (
    <div className="absolute top-4 right-4 z-50 w-72 bg-card/85 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
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

      <div className="p-4 space-y-4">
        {/* Population counts */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-foreground">{wolfCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              🐺 Wolves
            </div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-foreground">{elkCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              🦌 Elk
            </div>
          </div>
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
