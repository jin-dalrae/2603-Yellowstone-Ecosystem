import { useEffect, useState, useRef } from 'react';
import { useAgentStore } from '@/store/agentStore';
import type { SimEvent } from '@/lib/boids';
import type { AgentType } from '@/lib/boids';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

const SPECIES_LABELS: Record<AgentType, string> = {
  wolf: 'Wolves', elk: 'Elk', bear: 'Bears', beaver: 'Beavers', raven: 'Ravens',
  bison: 'Bison', moose: 'Moose', coyote: 'Coyotes', osprey: 'Ospreys',
};

interface InsightEntry {
  id: number;
  text: string;
  timestamp: number;
  trend: 'up' | 'down' | 'neutral';
}

let insightId = 0;

function generateInsight(events: SimEvent[]): InsightEntry | null {
  const now = Date.now();
  const WINDOW = 25_000;
  const recent = events.filter(e => now - e.timestamp < WINDOW);

  if (recent.length === 0) {
    return {
      id: insightId++,
      text: 'The ecosystem is calm — no significant events detected.',
      timestamp: now,
      trend: 'neutral',
    };
  }

  // Count by type
  const counts: Record<string, number> = {};
  const speciesCounts: Record<string, number> = {};
  for (const e of recent) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
    speciesCounts[e.species] = (speciesCounts[e.species] ?? 0) + 1;
  }

  const kills = counts['kill'] ?? 0;
  const births = counts['birth'] ?? 0;
  const starvations = counts['starvation'] ?? 0;
  const extinctions = counts['extinction'] ?? 0;

  // Find most active species
  const topSpecies = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1])[0];
  const topSpeciesLabel = topSpecies ? SPECIES_LABELS[topSpecies[0] as AgentType] ?? topSpecies[0] : '';

  const parts: string[] = [];
  let trend: 'up' | 'down' | 'neutral' = 'neutral';

  if (extinctions > 0) {
    const extinct = recent.filter(e => e.type === 'extinction').map(e => SPECIES_LABELS[e.species]).join(', ');
    parts.push(`⚠️ Extinction alert: ${extinct}`);
    trend = 'down';
  }

  if (kills > 0 && births > 0) {
    if (kills > births) {
      parts.push(`Predation outpacing births — ${kills} kills vs ${births} births`);
      trend = 'down';
    } else {
      parts.push(`Population growing — ${births} births vs ${kills} kills`);
      trend = 'up';
    }
  } else if (kills > 0) {
    parts.push(`${kills} predation event${kills > 1 ? 's' : ''} recorded`);
    trend = 'down';
  } else if (births > 0) {
    parts.push(`Baby boom — ${births} birth${births > 1 ? 's' : ''} detected`);
    trend = 'up';
  }

  if (starvations > 0) {
    parts.push(`${starvations} starvation${starvations > 1 ? 's' : ''} — resources under pressure`);
    trend = 'down';
  }

  if (topSpecies && parts.length < 2) {
    parts.push(`${topSpeciesLabel} most active with ${topSpecies[1]} events`);
  }

  return {
    id: insightId++,
    text: parts.join('. ') + '.',
    timestamp: now,
    trend,
  };
}

const TREND_ICONS = {
  up: <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />,
  down: <TrendingDown className="w-3.5 h-3.5 text-destructive shrink-0" />,
  neutral: <Activity className="w-3.5 h-3.5 text-muted-foreground shrink-0" />,
};

export function TrendInsightOverlay() {
  const [insights, setInsights] = useState<InsightEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const tick = () => {
      const events = useAgentStore.getState().events;
      const insight = generateInsight(events);
      if (insight) {
        setInsights(prev => [insight, ...prev].slice(0, 2));
      }
    };

    // First insight after 5s, then every 25s
    const timeout = setTimeout(() => {
      tick();
      intervalRef.current = setInterval(tick, 25_000);
    }, 5_000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (insights.length === 0) return null;

  return (
    <div className="absolute bottom-20 left-4 z-40 flex flex-col gap-2 max-w-sm">
      {insights.map((insight, i) => (
        <div
          key={insight.id}
          className="flex items-start gap-2.5 bg-card/80 backdrop-blur-xl border border-border rounded-lg px-3.5 py-2.5 shadow-lg animate-in slide-in-from-left-4 fade-in duration-500"
          style={{ opacity: i === 0 ? 1 : 0.7 }}
        >
          {TREND_ICONS[insight.trend]}
          <p className="text-xs text-foreground leading-relaxed">{insight.text}</p>
        </div>
      ))}
    </div>
  );
}
