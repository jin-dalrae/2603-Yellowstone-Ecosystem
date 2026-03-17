import { useEffect, useState, useRef } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { useSimulationStore } from '@/store/simulationStore';
import { supabase } from '@/integrations/supabase/client';
import { Mic } from 'lucide-react';

interface NarrationEntry {
  id: number;
  text: string;
  timestamp: number;
}

let narrationId = 0;

export function TrendInsightOverlay() {
  const [entries, setEntries] = useState<NarrationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const fetchNarration = async () => {
      const { isPlaying } = useSimulationStore.getState();
      if (!isPlaying) return;

      const { events, wolfCount, elkCount, bearCount, beaverCount, ravenCount, bisonCount, mooseCount, coyoteCount, ospreyCount } = useAgentStore.getState();
      const { season, year } = useSimulationStore.getState();

      if (events.length === 0) return;

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('narrate', {
          body: {
            events: events.slice(0, 6),
            season,
            year,
            populations: {
              wolves: wolfCount, elk: elkCount, bears: bearCount,
              beavers: beaverCount, ravens: ravenCount, bison: bisonCount,
              moose: mooseCount, coyotes: coyoteCount, ospreys: ospreyCount,
            },
          },
        });

        if (error) {
          console.warn('Narration error:', error);
        } else if (data?.narration) {
          setEntries(prev => [
            { id: narrationId++, text: data.narration, timestamp: Date.now() },
            ...prev,
          ].slice(0, 2));
        }
      } catch (err) {
        console.warn('Narration fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    // First narration after 8s, then every 25s
    const timeout = setTimeout(() => {
      fetchNarration();
      intervalRef.current = setInterval(fetchNarration, 25_000);
    }, 8_000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (entries.length === 0 && !loading) return null;

  return (
    <div className="absolute bottom-4 left-4 z-40 flex flex-col gap-1.5 max-w-xs pointer-events-none">
      {loading && entries.length === 0 && (
        <div className="flex items-center gap-2 bg-card/70 backdrop-blur-md border border-border rounded-md px-3 py-1.5 shadow-md">
          <Mic className="w-3 h-3 text-primary shrink-0 animate-pulse" />
          <p className="text-[11px] text-muted-foreground italic truncate">Observing…</p>
        </div>
      )}
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="flex items-center gap-2 bg-card/70 backdrop-blur-md border border-border rounded-md px-3 py-1.5 shadow-md animate-in slide-in-from-left-2 fade-in duration-300"
          style={{ opacity: i === 0 ? 1 : 0.5 }}
        >
          <Mic className="w-3 h-3 text-primary shrink-0" />
          <p className="text-[11px] text-foreground italic line-clamp-2">{entry.text}</p>
        </div>
      ))}
    </div>
  );
}
