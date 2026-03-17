import { motion } from 'framer-motion';

const layers = [
  { label: 'React UI Layer', sub: 'Controls · Charts · Trophic HUD · Event Feed', color: 'hsl(var(--primary))' },
  { label: 'Three.js World', sub: 'Procedural terrain · Instanced vegetation · 9 species · Seasonal sky', color: '#38bdf8' },
  { label: 'Agent Simulation Engine', sub: 'Boids flocking · Pack flanking · Energy model · Riparian FSM', color: '#f97316' },
  { label: 'AI Narration Layer', sub: 'Gemini Flash · Live sim state · Cascade-aware prompting', color: '#a78bfa' },
];

export function ArchitectureSVG() {
  const layerH = 72;
  const gap = 8;
  const totalH = layers.length * (layerH + gap) + 20;

  return (
    <svg viewBox={`0 0 600 ${totalH}`} className="w-full max-w-2xl mx-auto" aria-label="Architecture diagram">
      {layers.map((layer, i) => {
        const y = 10 + i * (layerH + gap);
        return (
          <motion.g
            key={layer.label}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <rect x={20} y={y} width={560} height={layerH} rx={10} fill="hsl(var(--card))" stroke={layer.color} strokeWidth={1.5} />
            <rect x={20} y={y} width={6} height={layerH} rx={3} fill={layer.color} />
            <text x={42} y={y + 28} fill="hsl(var(--foreground))" fontSize="14" fontWeight="700">{layer.label}</text>
            <text x={42} y={y + 50} fill="hsl(var(--muted-foreground))" fontSize="11">{layer.sub}</text>
          </motion.g>
        );
      })}

      {/* Connecting arrows between layers */}
      {layers.slice(0, -1).map((_, i) => {
        const y = 10 + (i + 1) * (layerH + gap) - gap / 2;
        return (
          <motion.g
            key={`conn-${i}`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.4 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            <line x1={300} y1={y - 6} x2={300} y2={y + 6} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} />
            <polygon points={`295,${y + 4} 305,${y + 4} 300,${y + 9}`} fill="hsl(var(--muted-foreground))" />
          </motion.g>
        );
      })}
    </svg>
  );
}
