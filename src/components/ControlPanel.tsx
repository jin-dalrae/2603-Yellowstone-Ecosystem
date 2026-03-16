import { useState } from 'react';
import { useSimulationStore, type Season, type CameraMode } from '@/store/simulationStore';
import { useEcoConfigStore } from '@/store/ecoConfigStore';
import { Snowflake, Sun, Leaf, Flower2, Eye, Orbit, Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

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

export function ControlPanel() {
  const [collapsed, setCollapsed] = useState(true);
  const [tab, setTab] = useState<'sim' | 'eco'>('sim');
  const {
    season, setSeason,
    timeSpeed, setTimeSpeed,
    isPlaying, togglePlay,
    cameraMode, setCameraMode,
  } = useSimulationStore();

  const eco = useEcoConfigStore();

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

  return (
    <div className="absolute top-4 left-4 z-50 w-64 bg-card/85 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Controls</h2>
        <button onClick={() => setCollapsed(true)} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setTab('sim')}
          className={`flex-1 text-xs py-2 transition-colors ${
            tab === 'sim' ? 'text-primary border-b-2 border-primary font-medium' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Simulation
        </button>
        <button
          onClick={() => setTab('eco')}
          className={`flex-1 text-xs py-2 transition-colors ${
            tab === 'eco' ? 'text-primary border-b-2 border-primary font-medium' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Ecosystem
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-5">
        {tab === 'sim' ? (
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

            {/* Camera mode */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Camera</label>
              <div className="grid grid-cols-2 gap-1">
                {CAMERA_MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setCameraMode(m.key)}
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg text-xs transition-all ${
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
          </>
        ) : (
          <>
            {/* Ecosystem controls */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">🐺 Wolf Parameters</label>
              <div className="space-y-3">
                <SliderRow label="Energy Drain /s" value={eco.wolfEnergyDrain} min={0.5} max={8} step={0.5} onChange={(v) => eco.set({ wolfEnergyDrain: v })} />
                <SliderRow label="Chase Distance" value={eco.wolfChaseDist} min={10} max={60} step={5} onChange={(v) => eco.set({ wolfChaseDist: v })} />
                <SliderRow label="Repro Chance" value={eco.wolfReproChance} min={0.001} max={0.01} step={0.001} onChange={(v) => eco.set({ wolfReproChance: v })} />
                <SliderRow label="Max Population" value={eco.wolfMaxPop} min={5} max={50} step={5} onChange={(v) => eco.set({ wolfMaxPop: v })} />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">🦌 Elk Parameters</label>
              <div className="space-y-3">
                <SliderRow label="Energy Drain /s" value={eco.elkEnergyDrain} min={0.2} max={4} step={0.2} onChange={(v) => eco.set({ elkEnergyDrain: v })} />
                <SliderRow label="Graze Rate /s" value={eco.elkGrazeRate} min={1} max={8} step={0.5} onChange={(v) => eco.set({ elkGrazeRate: v })} />
                <SliderRow label="Flee Distance" value={eco.elkFleeDist} min={10} max={60} step={5} onChange={(v) => eco.set({ elkFleeDist: v })} />
                <SliderRow label="Repro Chance" value={eco.elkReproChance} min={0.001} max={0.02} step={0.001} onChange={(v) => eco.set({ elkReproChance: v })} />
                <SliderRow label="Max Population" value={eco.elkMaxPop} min={10} max={100} step={10} onChange={(v) => eco.set({ elkMaxPop: v })} />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">⚙️ Shared</label>
              <div className="space-y-3">
                <SliderRow label="Energy per Kill" value={eco.energyPerKill} min={20} max={100} step={10} onChange={(v) => eco.set({ energyPerKill: v })} />
                <SliderRow label="Reproduce Energy" value={eco.reproduceEnergy} min={40} max={100} step={5} onChange={(v) => eco.set({ reproduceEnergy: v })} />
                <SliderRow label="Kill Distance" value={eco.killDist} min={1} max={6} step={0.5} onChange={(v) => eco.set({ killDist: v })} />
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full mt-2" onClick={eco.reset}>
              <RotateCcw className="w-3 h-3 mr-2" />
              Reset Defaults
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
