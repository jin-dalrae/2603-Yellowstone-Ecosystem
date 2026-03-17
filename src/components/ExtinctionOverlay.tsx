import { useAgentStore } from '@/store/agentStore';
import { useSimulationStore } from '@/store/simulationStore';

const EXTINCTION_INFO: Record<string, { emoji: string; title: string; message: string }> = {
  wolf: {
    emoji: '🐺',
    title: 'Wolves Have Gone Extinct',
    message:
      'Without apex predators, elk populations will explode unchecked. Overgrazing will strip riverbanks bare, beavers will lose habitat, and the entire riparian ecosystem will collapse — just as it did in Yellowstone from 1926 to 1995.',
  },
  elk: {
    emoji: '🦌',
    title: 'Elk Have Gone Extinct',
    message:
      'Without herbivores, wolves lose their primary prey and will starve. The grazing-recovery cycle breaks down — vegetation grows unchecked but the food web collapses from the middle out.',
  },
};

export function ExtinctionOverlay() {
  const extinctSpecies = useAgentStore((s) => s.extinctSpecies);
  const clearExtinction = useAgentStore((s) => s.clearExtinction);
  const resetScenario = useAgentStore((s) => s.resetScenario);
  const togglePlay = useSimulationStore((s) => s.togglePlay);
  const setDayAndYear = useSimulationStore((s) => s.setDayAndYear);

  if (!extinctSpecies) return null;

  const info = EXTINCTION_INFO[extinctSpecies] ?? {
    emoji: '💀',
    title: 'Species Extinct',
    message: 'A critical species has gone extinct.',
  };

  const handleRestart = () => {
    clearExtinction();
    resetScenario({
      wolf: 8,
      elk: 30,
      bear: 4,
      beaver: 4,
      raven: 8,
      bison: 15,
      moose: 5,
      coyote: 8,
      osprey: 4,
    });
    setDayAndYear(150, 1);
    // Resume
    const sim = useSimulationStore.getState();
    if (!sim.isPlaying) togglePlay();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-w-lg mx-4 rounded-2xl border border-destructive/30 bg-card/95 p-8 text-center shadow-2xl">
        <div className="text-6xl mb-4">{info.emoji}</div>
        <h2 className="text-2xl font-bold text-destructive mb-3">{info.title}</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">{info.message}</p>
        <button
          onClick={handleRestart}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          Restart Ecosystem
        </button>
      </div>
    </div>
  );
}
