import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, TreePine, Skull, Waves, PawPrint } from 'lucide-react';
import heroImage from '@/assets/hero-yellowstone.jpg';
import wolfIcon from '@/assets/wolf-icon.png';

const stats = [
  { value: '1995', label: 'Wolf Reintroduction' },
  { value: '41', label: 'Initial Wolves' },
  { value: '10+', label: 'Species Simulated' },
  { value: '∞', label: 'Cascade Effects' },
];

const features = [
  {
    icon: <PawPrint className="w-6 h-6" />,
    title: 'Agent-Based Wildlife',
    desc: 'Every wolf, elk, beaver, and bison acts independently with energy, hunger, and survival instincts.',
  },
  {
    icon: <TreePine className="w-6 h-6" />,
    title: 'Trophic Cascades',
    desc: 'Watch how wolves reshape rivers — fewer elk means more willows, which means beaver dams return.',
  },
  {
    icon: <Waves className="w-6 h-6" />,
    title: 'Riparian Recovery',
    desc: 'Real-time riverbank health tracking as vegetation rebounds from decades of overgrazing.',
  },
  {
    icon: <Skull className="w-6 h-6" />,
    title: 'Extinction Events',
    desc: 'Push the ecosystem too far and watch species collapse — or manage policies to prevent it.',
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ─── HERO ─── */}
      <section className="relative h-screen flex items-end justify-center overflow-hidden">
        {/* bg image */}
        <img
          src={heroImage}
          alt="Yellowstone valley with wolves and bison"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center">
          <motion.img
            src={wolfIcon}
            alt=""
            className="w-20 h-20 mx-auto mb-6 drop-shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          />

          <motion.h1
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-4"
            style={{ fontFamily: "'Georgia', serif" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
          >
            <span className="text-primary">Yellowstone</span>
            <br />
            <span className="text-foreground/90">Trophic Cascade</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            An interactive 3D ecosystem simulator. Reintroduce wolves, reshape
            rivers, and witness one of ecology's greatest stories unfold in
            real time.
          </motion.p>

          <motion.button
            onClick={() => navigate('/simulate')}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_40px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_60px_hsl(var(--primary)/0.6)] transition-shadow duration-500"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <Play className="w-5 h-5 fill-current" />
            Enter Simulation
          </motion.button>
        </div>

        {/* scroll cue */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        >
          <div className="w-5 h-8 rounded-full border-2 border-foreground/30 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-foreground/50" />
          </div>
        </motion.div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="relative z-10 -mt-1 bg-secondary/80 backdrop-blur-md border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="py-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-black text-primary">{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl font-black text-center mb-16"
            style={{ fontFamily: "'Georgia', serif" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            How Wolves Changed{' '}
            <span className="text-primary">Everything</span>
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="pb-32 text-center px-6">
        <motion.div
          className="max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground text-lg mb-8 italic">
            "The wolves didn't just change the wildlife — they changed the
            rivers."
          </p>
          <motion.button
            onClick={() => navigate('/simulate')}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_40px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_60px_hsl(var(--primary)/0.6)] transition-shadow duration-500"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <Play className="w-5 h-5 fill-current" />
            Launch Simulation
          </motion.button>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Built with Lovable · Inspired by the 1995 Yellowstone Wolf Reintroduction
      </footer>
    </div>
  );
}
