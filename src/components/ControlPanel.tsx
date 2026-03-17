import { useState, useCallback, useRef } from 'react';
import { useSimulationStore, type Season, type CameraMode, type RefugePolicy } from '@/store/simulationStore';
import { useEcoConfigStore } from '@/store/ecoConfigStore';
import { useAgentStore } from '@/store/agentStore';
import {
  Snowflake, Sun, Leaf, Flower2, Eye, Orbit, Play, Pause,
  ChevronLeft, ChevronRight, RotateCcw, Flame, Shield,
  Zap, BookOpen, Mic
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import type { AgentType } from '@/lib/boids';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const SEASONS: { key: Season; label: string; icon: React.ReactNode }[] = [
  { key: 'spring', label: 'Spring', icon: <Flower2 className="w-4 h-4" /> },
  { key: 'summer', label: 'Summer', icon: <Sun className="w-4 h-4" /> },
  { key: 'autumn', label: 'Autumn', icon: <Leaf className="w-4 h-4" /> },
  { key: 'winter', label: 'Winter', icon: <Snowflake className="w-4 h-4" /> },
];

const CAMERA_MODES: { key: CameraMode; label: string; icon: React.ReactNode }[] = [
  { key: 'orbit', label: 'Orbit', icon: <Orbit className="w-4 h-4" /> },
  { key: 'god', label: 'God View', icon: <Eye className="w-4 h-4" /> },
  { key: 'follow', label: 'Follow', icon: <Orbit className="w-4 h-4" /> },
];

const REFUGE_OPTIONS: { key: RefugePolicy; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'limited', label: 'Limited' },
  { key: 'closed', label: 'Closed' },
];

interface SpeciesControl {
  emoji: string;
  label: string;
  type: AgentType;
  min: number;
  max: number;
}

const SPECIES_CONTROLS: SpeciesControl[] = [
  { emoji: '🐺', label: 'Wolves', type: 'wolf', min: 0, max: 50 },
  { emoji: '🦌', label: 'Elk', type: 'elk', min: 0, max: 100 },
  { emoji: '🐻', label: 'Bears', type: 'bear', min: 0, max: 20 },
  { emoji: '🦫', label: 'Beavers', type: 'beaver', min: 0, max: 25 },
  { emoji: '🐦‍⬛', label: 'Ravens', type: 'raven', min: 0, max: 40 },
  { emoji: '🦬', label: 'Bison', type: 'bison', min: 0, max: 60 },
  { emoji: '🫎', label: 'Moose', type: 'moose', min: 0, max: 25 },
  { emoji: '🐺', label: 'Coyotes', type: 'coyote', min: 0, max: 35 },
  { emoji: '🦅', label: 'Osprey', type: 'osprey', min: 0, max: 15 },
];

const COUNT_KEYS: Record<AgentType, string> = {
  wolf: 'wolfCount', elk: 'elkCount', bear: 'bearCount', beaver: 'beaverCount',
  raven: 'ravenCount', bison: 'bisonCount', moose: 'mooseCount',
  coyote: 'coyoteCount', osprey: 'ospreyCount',
};

interface ScenarioPreset {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  apply: () => void;
}

function useScenarioPresets(): ScenarioPreset[] {
  const resetScenario = useAgentStore((s) => s.resetScenario);
  const sim = useSimulationStore();

  return [
    {
      id: 'wolf-reintro',
      name: 'Wolf Reintroduction (1995)',
      icon: <BookOpen className="w-4 h-4" />,
      description: 'Zero wolves, elevated elk. Introduce 14 wolves and watch the trophic cascade.',
      apply: () => {
        resetScenario({ wolf: 0, elk: 60, bear: 4, beaver: 2, raven: 8, bison: 20, moose: 8, coyote: 12, osprey: 4 });
        sim.setDayAndYear(75, 1995); // Spring
        setTimeout(() => {
          useAgentStore.getState().spawnAgents('wolf', 14);
          toast({ title: '🐺 14 wolves introduced to Lamar Valley' });
        }, 2000);
      },
    },
    {
      id: 'severe-winter',
      name: 'Severe Winter',
      icon: <Snowflake className="w-4 h-4" />,
      description: 'Maximum winter severity. Mass elk mortality, bison huddle near geothermal zones.',
      apply: () => {
        resetScenario({ wolf: 10, elk: 40, bear: 4, beaver: 6, raven: 10, bison: 25, moose: 6, coyote: 8, osprey: 4 });
        sim.setDayAndYear(335, 1); // Winter
        sim.setWinterSeverity(10);
        toast({ title: '❄️ Severe winter scenario activated' });
      },
    },
    {
      id: 'wildfire-summer',
      name: 'Wildfire Summer',
      icon: <Flame className="w-4 h-4" />,
      description: 'Trigger a major wildfire. Watch destruction, displacement, and regeneration.',
      apply: () => {
        resetScenario({ wolf: 8, elk: 35, bear: 5, beaver: 6, raven: 10, bison: 20, moose: 5, coyote: 8, osprey: 4 });
        sim.setDayAndYear(190, 1); // Summer
        sim.triggerWildfire(20, -15);
        toast({ title: '🔥 Wildfire ignited in Tower Junction' });
      },
    },
    {
      id: 'human-withdrawal',
      name: 'Human Withdrawal',
      icon: <Shield className="w-4 h-4" />,
      description: 'Close all refuges, zero rancher tolerance. Track the mortality cascade.',
      apply: () => {
        resetScenario({ wolf: 12, elk: 50, bear: 5, beaver: 6, raven: 10, bison: 25, moose: 6, coyote: 10, osprey: 4 });
        sim.setRefugePolicy('closed');
        sim.setWinterSeverity(7);
        sim.setDayAndYear(300, 1); // Late autumn
        toast({ title: '🚫 Human intervention withdrawn — refuges closed' });
      },
    },
  ];
}

export function ControlPanel() {
  const [collapsed, setCollapsed] = useState(true);
  const [tab, setTab] = useState<'sim' | 'pop' | 'env' | 'preset'>('sim');
  const {
    season, setSeason,
    timeSpeed, setTimeSpeed,
    isPlaying, togglePlay,
    cameraMode, setCameraMode,
    winterSeverity, setWinterSeverity,
    refugePolicy, setRefugePolicy,
    wildfireActive, triggerWildfire, stopWildfire,
    day, year,
  } = useSimulationStore();

  const eco = useEcoConfigStore();
  const agentStore = useAgentStore();
  const presets = useScenarioPresets();
  const narrationCooldown = useRef(false);

  const requestNarration = useCallback(async () => {
    if (narrationCooldown.current) return;
    narrationCooldown.current = true;
    agentStore.setNarrationLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('narrate', {
        body: {
          events: agentStore.events.slice(0, 8).map(e => ({ type: e.type, species: e.species, message: e.message })),
          season,
          year,
          populations: {
            wolves: agentStore.wolfCount,
            elk: agentStore.elkCount,
            bears: agentStore.bearCount,
            beavers: agentStore.beaverCount,
            ravens: agentStore.ravenCount,
            bison: agentStore.bisonCount,
            moose: agentStore.mooseCount,
            coyotes: agentStore.coyoteCount,
            ospreys: agentStore.ospreyCount,
          },
        },
      });

      if (error) throw error;
      if (data?.narration) {
        agentStore.setNarration(data.narration);
      } else if (data?.error) {
        toast({ title: 'Narration error', description: data.error, variant: 'destructive' });
      }
    } catch (e: any) {
      console.error('Narration error:', e);
      toast({ title: 'Narration failed', description: e.message, variant: 'destructive' });
    } finally {
      agentStore.setNarrationLoading(false);
      setTimeout(() => { narrationCooldown.current = false; }, 15000);
    }
  }, [season, year, agentStore]);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute top-4 left-4 z-50 bg-card/80 backdrop-blur-md border border-border rounded-lg p-2 hover:bg-card/95 transition-colors"
        aria-label="Open controls"
      >
        <ChevronRight className="w-5 h-5 text-foreground" />
      </button>
    );
  }

  const TABS = [
    { key: 'sim' as const, label: 'Time' },
    { key: 'pop' as const, label: 'Species' },
    { key: 'env' as const, label: 'Environ' },
    { key: 'preset' as const, label: 'Scenarios' },
  ];

  return (
    <div className="absolute top-4 left-4 z-50 w-72 bg-card/85 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Controls</h2>
        <button onClick={() => setCollapsed(true)} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-[10px] py-2 transition-colors ${
              tab === t.key ? 'text-primary border-b-2 border-primary font-medium' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-5">
        {tab === 'sim' && (
          <>
            {/* Season selector */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Season</label>
              <div className="grid grid-cols-4 gap-1">
                {SEASONS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSeason(s.key)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs transition-all ${
                      season === s.key
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                    }`}
                  >
                    {s.icon}
                    <span className="text-[10px]">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time speed */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Speed: {timeSpeed.toFixed(1)}x
              </label>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={togglePlay}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[timeSpeed]}
                  onValueChange={([v]) => setTimeSpeed(v)}
                  min={0.25}
                  max={10}
                  step={0.25}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Year scrubber */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Day of Year: {Math.floor(day)}
              </label>
              <Slider
                value={[day]}
                onValueChange={([v]) => {
                  const sim = useSimulationStore.getState();
                  sim.setDayAndYear(v, year);
                }}
                min={0}
                max={364}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                <span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Dec</span>
              </div>
            </div>

            {/* Camera mode */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Camera</label>
              <div className="grid grid-cols-3 gap-1">
                {CAMERA_MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setCameraMode(m.key)}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-[10px] transition-all ${
                      cameraMode === m.key
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Narration */}
            <div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={requestNarration}
                disabled={agentStore.narrationLoading}
              >
                <Mic className="w-3 h-3 mr-2" />
                {agentStore.narrationLoading ? 'Narrating…' : 'Request Narration'}
              </Button>
            </div>
          </>
        )}

        {tab === 'pop' && (
          <>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block">
              Population Sliders
            </label>
            <p className="text-[10px] text-muted-foreground -mt-3">
              Drag to spawn or cull animals instantly
            </p>
            {SPECIES_CONTROLS.map((sp) => {
              const currentCount = (agentStore as any)[COUNT_KEYS[sp.type]] as number;
              return (
                <div key={sp.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{sp.emoji} {sp.label}</span>
                    <span className="text-xs text-foreground font-medium tabular-nums">{currentCount}</span>
                  </div>
                  <Slider
                    value={[currentCount]}
                    onValueChange={([v]) => agentStore.setPopulationTarget(sp.type, v)}
                    min={sp.min}
                    max={sp.max}
                    step={1}
                    className="w-full"
                  />
                </div>
              );
            })}

            <div className="h-px bg-border" />

            <label className="text-xs text-muted-foreground uppercase tracking-wider block">
              <Zap className="w-3 h-3 inline mr-1" />
              Genetic Fitness
            </label>
            <p className="text-[10px] text-muted-foreground -mt-3">
              0.5 = disease/inbreeding, 1.5 = peak fitness
            </p>
            {SPECIES_CONTROLS.map((sp) => (
              <div key={`fitness-${sp.type}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">{sp.emoji} {sp.label}</span>
                  <span className="text-[10px] text-foreground font-medium tabular-nums">
                    {eco.geneticFitness[sp.type].toFixed(1)}x
                  </span>
                </div>
                <Slider
                  value={[eco.geneticFitness[sp.type]]}
                  onValueChange={([v]) => eco.setFitness(sp.type, v)}
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            ))}
          </>
        )}

        {tab === 'env' && (
          <>
            {/* Winter severity */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                <Snowflake className="w-3 h-3 inline mr-1" />
                Winter Severity: {winterSeverity}
              </label>
              <Slider
                value={[winterSeverity]}
                onValueChange={([v]) => setWinterSeverity(v)}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                <span>Mild</span><span>Extreme</span>
              </div>
            </div>

            {/* Wildfire */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                <Flame className="w-3 h-3 inline mr-1" />
                Wildfire
              </label>
              {wildfireActive ? (
                <Button variant="destructive" size="sm" className="w-full" onClick={stopWildfire}>
                  🔥 Extinguish Wildfire
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const x = (Math.random() - 0.5) * 60;
                    const z = (Math.random() - 0.5) * 60;
                    triggerWildfire(x, z);
                    toast({ title: '🔥 Wildfire ignited!', description: `Location: (${x.toFixed(0)}, ${z.toFixed(0)})` });
                  }}
                >
                  <Flame className="w-3 h-3 mr-2" />
                  Trigger Random Wildfire
                </Button>
              )}
            </div>

            {/* Human refuge policy */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                <Shield className="w-3 h-3 inline mr-1" />
                Elk Refuge Policy
              </label>
              <div className="grid grid-cols-3 gap-1">
                {REFUGE_OPTIONS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRefugePolicy(r.key)}
                    className={`py-2 px-2 rounded-lg text-xs transition-all text-center ${
                      refugePolicy === r.key
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">
                Controls winter elk survival outside park boundaries
              </p>
            </div>

            {/* Ecosystem tuning */}
            <div className="h-px bg-border" />
            <label className="text-xs text-muted-foreground uppercase tracking-wider block">⚙️ Ecosystem Tuning</label>
            <div className="space-y-3">
              <SliderRow label="Energy per Kill" value={eco.energyPerKill} min={20} max={100} step={10} onChange={(v) => eco.set({ energyPerKill: v })} />
              <SliderRow label="Reproduce Energy" value={eco.reproduceEnergy} min={40} max={100} step={5} onChange={(v) => eco.set({ reproduceEnergy: v })} />
              <SliderRow label="Kill Distance" value={eco.killDist} min={1} max={6} step={0.5} onChange={(v) => eco.set({ killDist: v })} />
            </div>

            <Button variant="outline" size="sm" className="w-full mt-2" onClick={eco.reset}>
              <RotateCcw className="w-3 h-3 mr-2" />
              Reset Defaults
            </Button>
          </>
        )}

        {tab === 'preset' && (
          <>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block">
              Scenario Presets
            </label>
            <p className="text-[10px] text-muted-foreground -mt-3">
              Pre-built scenarios from the Yellowstone PRD
            </p>
            <div className="space-y-3">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={p.apply}
                  className="w-full text-left bg-secondary/40 hover:bg-secondary/70 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {p.icon}
                    <span className="text-xs font-medium text-foreground">{p.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{p.description}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] text-foreground font-medium tabular-nums">{value.toFixed(step < 0.1 ? 3 : step < 1 ? 1 : 0)}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}
