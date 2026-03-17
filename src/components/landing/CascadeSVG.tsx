import { motion } from 'framer-motion';

/** Animated SVG diagram of the trophic cascade chain */
export function CascadeSVG() {
  const nodes = [
    { emoji: '🐺', label: 'Wolves Hunt', x: 80, color: 'hsl(var(--primary))' },
    { emoji: '🦌', label: 'Elk Decline', x: 230, color: '#c97a4b' },
    { emoji: '🌲', label: 'Willows Recover', x: 380, color: '#4ade80' },
    { emoji: '🦫', label: 'Beavers Return', x: 530, color: '#a17249' },
    { emoji: '💧', label: 'Rivers Heal', x: 680, color: '#38bdf8' },
  ];

  return (
    <svg viewBox="0 0 760 120" className="w-full max-w-4xl mx-auto" aria-label="Trophic cascade flow diagram">
      {/* Connecting arrows */}
      {nodes.slice(0, -1).map((node, i) => (
        <motion.line
          key={`line-${i}`}
          x1={node.x + 40}
          y1={50}
          x2={nodes[i + 1].x - 10}
          y2={50}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={2}
          strokeDasharray="6 4"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.6 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 + i * 0.25 }}
        />
      ))}

      {/* Arrow heads */}
      {nodes.slice(1).map((node, i) => (
        <motion.polygon
          key={`arrow-${i}`}
          points={`${node.x - 10},44 ${node.x - 10},56 ${node.x},50`}
          fill="hsl(var(--muted-foreground))"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.6 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 + i * 0.25 }}
        />
      ))}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.g
          key={node.label}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.2 }}
        >
          <circle cx={node.x + 15} cy={50} r={28} fill="hsl(var(--card))" stroke={node.color} strokeWidth={2} />
          <text x={node.x + 15} y={56} textAnchor="middle" fontSize="22">{node.emoji}</text>
          <text x={node.x + 15} y={95} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="11" fontWeight="600">
            {node.label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
