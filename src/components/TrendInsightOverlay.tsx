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
    <div className="absolute bottom-20 left-4 z-40 flex flex-col gap-2 max-w-md pointer-events-none">
      {loading && entries.length === 0 && (
        <div className="flex items-start gap-2.5 bg-card/80 backdrop-blur-xl border border-border rounded-lg px-3.5 py-2.5 shadow-lg">
          <Mic className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 animate-pulse" />
          <p className="text-xs text-muted-foreground italic">Observing the ecosystem…</p>
        </div>
      )}
      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="flex items-start gap-2.5 bg-card/80 backdrop-blur-xl border border-border rounded-lg px-3.5 py-2.5 shadow-lg animate-in slide-in-from-left-4 fade-in duration-500"
          style={{ opacity: i === 0 ? 1 : 0.55 }}
        >
          <Mic className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed italic">{entry.text}</p>
        </div>
      ))}
    </div>
  );
}
