import { useEffect, useState, useRef } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { useSimulationStore } from '@/store/simulationStore';
import { supabase } from '@/integrations/supabase/client';
import { getAverageRiparianHealth, getRiparianZones } from '@/lib/riparianState';
import { getDamSites } from '@/lib/boids';

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
  const busyRef = useRef(false);

  useEffect(() => {
    const fetchNarration = async () => {
      if (busyRef.current) return;
      const { isPlaying } = useSimulationStore.getState();
      if (!isPlaying) return;

      const { events, wolfCount, elkCount, bearCount, beaverCount, ravenCount, bisonCount, mooseCount, coyoteCount, ospreyCount, treeCount } = useAgentStore.getState();
      const { season, year } = useSimulationStore.getState();

      if (events.length === 0) return;

      // Deduplicate events by type — pick most interesting, not 5x "coyote caught small prey"
      const seen = new Set<string>();
      const diverseEvents = events.filter(e => {
        const key = `${e.type}:${e.species}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 6).map(e => ({ type: e.type, species: e.species, message: e.message }));

      // Cascade state
      const riparianHealth = Math.round(getAverageRiparianHealth() * 100);
      const damCount = getDamSites().length;

      busyRef.current = true;
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('narrate', {
          body: {
            events: diverseEvents,
            season,
            year,
            populations: {
              wolves: wolfCount, elk: elkCount, bears: bearCount,
              beavers: beaverCount, ravens: ravenCount, bison: bisonCount,
              moose: mooseCount, coyotes: coyoteCount, ospreys: ospreyCount,
              trees: treeCount,
            },
            cascade: {
              riparianHealthPercent: riparianHealth,
              beaverDams: damCount,
              riverStatus: riparianHealth > 70 ? 'healthy' : riparianHealth > 40 ? 'recovering' : 'degraded',
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
        busyRef.current = false;
        setLoading(false);
      }
    };

    // First narration after 12s, then every 45s to avoid rate limits
    const timeout = setTimeout(() => {
      fetchNarration();
      intervalRef.current = setInterval(fetchNarration, 45_000);
    }, 12_000);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (entries.length === 0 && !loading) return null;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 max-w-2xl w-full pointer-events-none px-4">
      {loading && entries.length === 0 && (
        <p className="text-sm text-white/60 italic animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          Observing…
        </p>
      )}
      {entries.map((entry, i) => (
        <p
          key={entry.id}
          className="text-center text-lg font-medium text-white italic leading-snug animate-in fade-in slide-in-from-bottom-2 duration-500 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
          style={{ opacity: i === 0 ? 1 : 0.4 }}
        >
          {entry.text}
        </p>
      ))}
    </div>
  );
}
