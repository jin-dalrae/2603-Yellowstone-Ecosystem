import { Scene } from '@/components/world/Scene';
import { ControlPanel } from '@/components/ControlPanel';
import { StatusOverlay } from '@/components/StatusOverlay';
import { StatusPanel } from '@/components/StatusPanel';
import { AnimalDetailPanel } from '@/components/AnimalDetailPanel';
import { TrendInsightOverlay } from '@/components/TrendInsightOverlay';
import { RiparianHealthIndicator } from '@/components/RiparianHealthIndicator';
import { ExtinctionOverlay } from '@/components/ExtinctionOverlay';

const Simulate = () => {
  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <Scene />
      <ControlPanel />
      <StatusPanel />
      <StatusOverlay />
      <AnimalDetailPanel />
      <TrendInsightOverlay />
      <RiparianHealthIndicator />
      <ExtinctionOverlay />
    </div>
  );
};

export default Simulate;
