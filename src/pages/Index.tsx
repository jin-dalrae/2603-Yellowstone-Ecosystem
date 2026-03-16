import { Scene } from '@/components/world/Scene';
import { ControlPanel } from '@/components/ControlPanel';
import { StatusOverlay } from '@/components/StatusOverlay';
import { StatusPanel } from '@/components/StatusPanel';

const Index = () => {
  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      <Scene />
      <ControlPanel />
      <StatusPanel />
      <StatusOverlay />
    </div>
  );
};

export default Index;
