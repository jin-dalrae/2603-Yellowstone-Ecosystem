import { motion } from 'framer-motion';

/** Decorative pulsing concentric rings — used as section accents */
export function PulseRingSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={`pointer-events-none ${className}`} aria-hidden="true">
      {[60, 80, 100].map((r, i) => (
        <motion.circle
          key={r}
          cx={100}
          cy={100}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={1}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.25, 0], scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 3 + i * 0.5, delay: i * 0.6 }}
        />
      ))}
    </svg>
  );
}
