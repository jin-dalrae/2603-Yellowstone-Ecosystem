import { useState } from 'react';
import { useSimulationStore, type Season, type CameraMode } from '@/store/simulationStore';
import { Snowflake, Sun, Leaf, Flower2, Eye, Orbit, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
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
];

export function ControlPanel() {
  const [collapsed, setCollapsed] = useState(true);
  const {
    season, setSeason,
    timeSpeed, setTimeSpeed,
    isPlaying, togglePlay,
    cameraMode, setCameraMode,
  } = useSimulationStore();

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
    <div className="absolute top-4 left-4 z-50 w-64 bg-card/85 backdrop-blur-xl border border-border rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">Controls</h2>
        <button onClick={() => setCollapsed(true)} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5">
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={togglePlay}
            >
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
      </div>
    </div>
  );
}
