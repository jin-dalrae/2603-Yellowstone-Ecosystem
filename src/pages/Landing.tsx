import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play, TreePine, Skull, Waves, PawPrint, Zap, GraduationCap,
  Gamepad2, Shield, CheckCircle2, Clock, ArrowRight, Target,
  BarChart3, Globe, Sprout
} from 'lucide-react';
import heroImage from '@/assets/hero-yellowstone.jpg';
import wolfIcon from '@/assets/wolf-icon.png';
import simScreenshot from '@/assets/screenshot-simulation.png';
import { CascadeSVG } from '@/components/landing/CascadeSVG';
import { ArchitectureSVG } from '@/components/landing/ArchitectureSVG';
import { PulseRingSVG } from '@/components/landing/PulseRingSVG';

/* ─── DATA ─── */
const stats = [
  { value: '400+', label: 'Autonomous Agents' },
  { value: '9', label: 'Species Simulated' },
  { value: '60fps', label: 'Browser-Native' },
  { value: '0', label: 'Backend Required' },
];

const features = [
  {
    icon: <PawPrint className="w-6 h-6" />,
    title: 'Agent-Based Wildlife',
    desc: 'Every wolf, elk, beaver, and bison acts independently — energy, hunger, reproduction, and death. No scripted sequences.',
  },
  {
    icon: <TreePine className="w-6 h-6" />,
    title: 'Emergent Trophic Cascades',
    desc: 'Wolves reshape rivers. Not because we programmed it — because 400 agents following local rules produce global ecosystem change.',
  },
  {
    icon: <Waves className="w-6 h-6" />,
    title: 'Riparian Recovery',
    desc: 'Real-time riverbank health tracking. Watch vegetation rebound as overgrazing pressure drops.',
  },
  {
    icon: <Skull className="w-6 h-6" />,
    title: 'Extinction & Recovery',
    desc: 'Push the system past tipping points. Watch cascading collapse — or intervene with policy levers to prevent it.',
  },
];

const predatorPreyData = [
  { mechanic: 'Pack flanking', detail: 'Wolves calculate flank angles by rank, surrounding prey from multiple vectors' },
  { mechanic: 'Prey preference', detail: '86% elk / 9% bison (year 5+) / 5% moose — matching NPS kill composition data' },
  { mechanic: 'Kill cooldown', detail: '~1 kill per 2–3 days per pack — observed rates of 0.9–1.8 elk/wolf/month' },
  { mechanic: 'Intraspecific strife', detail: 'At high density, wolf-on-wolf territorial aggression is the #1 mortality cause' },
  { mechanic: 'Kill cascades', detail: 'Carrion attracts ravens, coyotes, bears — redistributing energy through the food web' },
];

const npsData = [
  { report: 'Wolf Project 1995–96', finding: '14 wolves introduced → 51 by end of 1996. Kill rates: 1 elk per 1.5–5 days.' },
  { report: 'Wolf Project 2005', finding: '171 wolves in 16 packs. Pup survival crashed from 60% to 16% in disease years.' },
];

const markets = [
  { icon: <GraduationCap className="w-7 h-7" />, title: 'Education', size: '$8B+ EdTech', desc: 'Trophic cascades taught in every AP Biology and college ecology course. Students experience them instead of reading.' },
  { icon: <Shield className="w-7 h-7" />, title: 'Conservation & Policy', size: 'Gov/NGO', desc: 'Wildlife management decisions need cascading-effect models. This is the interactive briefing tool that doesn\'t exist yet.' },
  { icon: <Gamepad2 className="w-7 h-7" />, title: 'Gaming & Media', size: '$200B+', desc: 'Living ecosystems are the holy grail of open-world design. Emergent ecology at 60fps in a browser — no server costs.' },
];

const platformVision = [
  { domain: 'Marine ecosystems', cascade: 'Shark removal → mesopredator release → reef collapse' },
  { domain: 'Urban ecology', cascade: 'Green corridors → pollinator networks → heat mitigation' },
  { domain: 'Agricultural systems', cascade: 'Pesticide reduction → pest-predator rebalancing → soil health' },
  { domain: 'Climate scenarios', cascade: 'Temperature shifts → migration changes → ecosystem reorganization' },
];

const roadmap = [
  { phase: 'Agent-based simulation', status: 'shipped', desc: '9 species, emergent cascade, seasonal dynamics' },
  { phase: 'NPS report calibration', status: 'shipped', desc: 'Kill rates, prey preference from 1995–2005 data' },
  { phase: 'AI narration', status: 'shipped', desc: 'LLM commentary from live simulation state' },
  { phase: 'Scenario presets', status: 'shipped', desc: 'Wolf 1995, Severe Winter, Wildfire, Human Withdrawal' },
  { phase: 'Pack hunting & herding', status: 'shipped', desc: 'Flanking wolves, defensive bison, territorial strife' },
  { phase: 'Disease outbreaks', status: 'next', desc: 'Pup survival crashes matching NPS data' },
  { phase: 'Learn rules from data', status: 'planned', desc: 'Train on GPS collar + population surveys' },
  { phase: 'Multi-ecosystem support', status: 'planned', desc: 'Marine, urban, agricultural templates' },
  { phase: 'Counterfactual engine', status: 'planned', desc: 'Parallel rollouts comparing interventions' },
];

const techStack = [
  { component: 'Framework', tech: 'React 18 + TypeScript + Vite' },
  { component: '3D Engine', tech: 'Three.js via React Three Fiber + Drei' },
  { component: 'Rendering', tech: 'Instanced meshes, custom GLSL shaders' },
  { component: 'Simulation', tech: 'Custom boids + predator-prey FSM' },
  { component: 'State', tech: 'Zustand (3 stores)' },
  { component: 'AI', tech: 'Gemini Flash via edge functions' },
];

/* ─── HELPERS ─── */
const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };
const SectionTitle = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
  <div className="text-center mb-16">
    <motion.h2
      className="text-3xl md:text-5xl font-black tracking-tight"
      style={{ fontFamily: "'Georgia', serif" }}
      {...fadeUp}
    >
      {children}
    </motion.h2>
    {sub && (
      <motion.p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg" {...fadeUp} transition={{ delay: 0.1 }}>
        {sub}
      </motion.p>
    )}
  </div>
);

/* ─── COMPONENT ─── */
export default function Landing() {
  const navigate = useNavigate();

  const ctaButton = (label: string, className?: string) => (
    <motion.button
      onClick={() => navigate('/simulate')}
      className={`group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_40px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_60px_hsl(var(--primary)/0.55)] transition-all duration-500 ${className ?? ''}`}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    >
      <Play className="w-5 h-5 fill-current" />
      {label}
    </motion.button>
  );

  return (
    <div className="relative w-full min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative h-screen flex items-end justify-center overflow-hidden">
        <img src={heroImage} alt="Yellowstone valley" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/20" />

        {/* Decorative pulse rings */}
        <PulseRingSVG className="absolute top-10 left-10 w-48 h-48 opacity-30" />
        <PulseRingSVG className="absolute bottom-40 right-10 w-32 h-32 opacity-20" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-20 text-center">
          <motion.img src={wolfIcon} alt="" className="w-20 h-20 mx-auto mb-6 drop-shadow-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} />
          <motion.p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            Ecological Digital Twin
          </motion.p>
          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.02] mb-3"
            style={{ fontFamily: "'Georgia', serif" }}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15 }}
          >
            <span className="text-primary">Yellowstone</span><br />
            <span className="text-foreground/90">Living World</span>
          </motion.h1>
          <motion.p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-3 italic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            "We didn't program the cascade. We programmed the wolves. The cascade happened on its own."
          </motion.p>
          <motion.p className="text-sm text-muted-foreground/70 mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            A browser-native agent-based ecosystem with emergent trophic cascades.
          </motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
            {ctaButton('Enter Simulation')}
          </motion.div>
        </div>

        <motion.div className="absolute bottom-6 left-1/2 -translate-x-1/2" animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          <div className="w-5 h-8 rounded-full border-2 border-foreground/30 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-foreground/50" />
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="relative z-10 bg-secondary/80 backdrop-blur-md border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((s, i) => (
            <motion.div key={s.label} className="py-8 text-center" {...fadeUp} transition={{ delay: i * 0.1 }}>
              <div className="text-3xl md:text-4xl font-black text-primary">{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ THE PROBLEM ═══════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <SectionTitle sub="Ecological collapse is the defining crisis of the century, yet the tools to understand it are stuck in spreadsheets and static models.">
            The <span className="text-primary">Problem</span>
          </SectionTitle>
          <motion.div className="bg-card border border-border rounded-2xl p-8 md:p-12 text-left" {...fadeUp}>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Trophic cascades — the chain reactions triggered by adding or removing a single species — reshape entire landscapes. But no one can{' '}
              <span className="text-foreground font-semibold">see</span> them happen,{' '}
              <span className="text-foreground font-semibold">intervene</span> in them, or{' '}
              <span className="text-foreground font-semibold">feel</span> the feedback loops.
            </p>
            <p className="text-primary font-bold mt-6 text-lg">
              Policy decisions about apex predators are made without intuitive understanding of cascading consequences.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ THE CASCADE (SVG) ═══════════════ */}
      <section className="py-20 px-6 bg-card/50 border-y border-border">
        <SectionTitle sub="This chain reaction is not coded. It emerges from 400+ agents following local rules.">
          The Cascade Is <span className="text-primary">Real</span>
        </SectionTitle>
        <CascadeSVG />
        <motion.p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto" {...fadeUp}>
          Remove the wolves. Watch the ecosystem collapse in 60 seconds. Add them back. Watch it heal.
        </motion.p>
      </section>

      {/* ═══════════════ SCREENSHOT SHOWCASE ═══════════════ */}
      <section className="py-24 px-6">
        <SectionTitle sub="A real-time agent-based ecological simulation running entirely in the browser at 60fps.">
          What We <span className="text-primary">Built</span>
        </SectionTitle>
        <div className="max-w-6xl mx-auto">
          {/* Main screenshot */}
          <motion.div
            className="relative rounded-2xl overflow-hidden border border-border shadow-2xl shadow-primary/10 mb-8"
            {...fadeUp}
          >
            <img src={simScreenshot} alt="Full ecosystem simulation view" className="w-full" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-primary font-bold">Live Simulation</div>
                <div className="text-sm text-foreground/80 mt-1">9 species · Procedural terrain · Dynamic seasons</div>
              </div>
              {ctaButton('Try It Live', 'text-sm px-6 py-3')}
            </div>
          </motion.div>

          {/* Close-up screenshots */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div className="rounded-xl overflow-hidden border border-border shadow-xl" {...fadeUp} transition={{ delay: 0.1 }}>
              <img src={closeup1} alt="Close-up of wildlife agents" className="w-full" loading="lazy" />
            </motion.div>
            <motion.div className="rounded-xl overflow-hidden border border-border shadow-xl" {...fadeUp} transition={{ delay: 0.2 }}>
              <img src={closeup2} alt="Terrain and vegetation detail" className="w-full" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className="py-24 px-6 bg-card/30">
        <SectionTitle>How Wolves Changed <span className="text-primary">Everything</span></SectionTitle>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors duration-300"
              {...fadeUp}
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
      </section>

      {/* ═══════════════ NPS DATA ═══════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionTitle sub="Calibrated against the NPS Wolf Project Biennial Reports (1995–2005), the definitive longitudinal study.">
            Grounded in <span className="text-primary">Real Data</span>
          </SectionTitle>

          {/* NPS reports */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {npsData.map((d, i) => (
              <motion.div key={d.report} className="p-6 rounded-xl bg-card border border-border" {...fadeUp} transition={{ delay: i * 0.1 }}>
                <div className="text-xs uppercase tracking-widest text-primary font-bold mb-2">{d.report}</div>
                <p className="text-muted-foreground">{d.finding}</p>
              </motion.div>
            ))}
          </div>

          {/* Predator-prey table */}
          <motion.div className="rounded-xl border border-border overflow-hidden" {...fadeUp}>
            <div className="bg-secondary/60 px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Predator-Prey Dynamics</h3>
            </div>
            <div className="divide-y divide-border">
              {predatorPreyData.map((row) => (
                <div key={row.mechanic} className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                  <span className="font-semibold text-foreground min-w-[160px]">{row.mechanic}</span>
                  <span className="text-muted-foreground text-sm">{row.detail}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ ARCHITECTURE (SVG) ═══════════════ */}
      <section className="py-24 px-6 bg-card/50 border-y border-border relative overflow-hidden">
        <PulseRingSVG className="absolute -right-16 top-10 w-64 h-64 opacity-10" />
        <SectionTitle sub="Zero backend for simulation. Everything runs client-side. The only server call is optional AI narration.">
          <span className="text-primary">Architecture</span>
        </SectionTitle>
        <ArchitectureSVG />

        {/* Tech stack pills */}
        <div className="max-w-3xl mx-auto mt-12 flex flex-wrap justify-center gap-3">
          {techStack.map((t, i) => (
            <motion.div
              key={t.component}
              className="px-4 py-2 rounded-full bg-secondary border border-border text-sm"
              {...fadeUp}
              transition={{ delay: i * 0.06 }}
            >
              <span className="font-semibold text-foreground">{t.component}:</span>{' '}
              <span className="text-muted-foreground">{t.tech}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ WHY IT'S HARD ═══════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SectionTitle>Why It's <span className="text-primary">Hard</span></SectionTitle>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Zap className="w-6 h-6" />, title: '400+ agents at 60fps', desc: 'Instanced mesh rendering, spatial hashing, zero GC pressure.' },
              { icon: <Sprout className="w-6 h-6" />, title: 'Emergent from local rules', desc: 'Boids flocking + predator-prey FSM + energy model.' },
              { icon: <Globe className="w-6 h-6" />, title: 'No asset loading', desc: 'Procedural terrain, GLSL biome shaders, custom geometries.' },
            ].map((item, i) => (
              <motion.div key={item.title} className="p-6 rounded-xl bg-card border border-border text-center" {...fadeUp} transition={{ delay: i * 0.1 }}>
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ MARKET ═══════════════ */}
      <section className="py-24 px-6 bg-card/30">
        <SectionTitle sub="The simulation engine addresses three massive, underserved markets.">
          The <span className="text-primary">Market</span>
        </SectionTitle>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {markets.map((m, i) => (
            <motion.div
              key={m.title}
              className="p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors relative overflow-hidden"
              {...fadeUp}
              transition={{ delay: i * 0.12 }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                {m.icon}
              </div>
              <div className="text-xs uppercase tracking-widest text-primary font-bold mb-1">{m.size}</div>
              <h3 className="text-xl font-bold mb-3">{m.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ PLATFORM VISION ═══════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <SectionTitle sub="Yellowstone is the proof of concept. The agent-based architecture generalizes to any ecosystem.">
            Platform <span className="text-primary">Vision</span>
          </SectionTitle>
          <div className="space-y-4">
            {platformVision.map((p, i) => (
              <motion.div
                key={p.domain}
                className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
                {...fadeUp}
                transition={{ delay: i * 0.08 }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-foreground">{p.domain}</span>
                  <span className="text-muted-foreground ml-2">— {p.cascade}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.p className="text-center text-primary font-bold mt-10 text-lg" {...fadeUp}>
            The goal: A general-purpose ecological simulation engine. Define species, rules, terrain. The cascades emerge.
          </motion.p>
        </div>
      </section>

      {/* ═══════════════ ROADMAP ═══════════════ */}
      <section className="py-24 px-6 bg-card/50 border-y border-border relative overflow-hidden">
        <PulseRingSVG className="absolute -left-20 bottom-0 w-56 h-56 opacity-10" />
        <SectionTitle sub="From ecological digital twin to predictive world model.">
          <span className="text-primary">Roadmap</span>
        </SectionTitle>
        <div className="max-w-3xl mx-auto space-y-3">
          {roadmap.map((r, i) => (
            <motion.div
              key={r.phase}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
              {...fadeUp}
              transition={{ delay: i * 0.06 }}
            >
              <div className="shrink-0">
                {r.status === 'shipped' ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : r.status === 'next' ? (
                  <Zap className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Clock className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-foreground">{r.phase}</span>
                <span className="text-muted-foreground ml-2 text-sm hidden md:inline">— {r.desc}</span>
              </div>
              <span className={`text-xs uppercase tracking-widest font-bold shrink-0 ${
                r.status === 'shipped' ? 'text-primary' : r.status === 'next' ? 'text-yellow-400' : 'text-muted-foreground'
              }`}>
                {r.status === 'shipped' ? '✅ Shipped' : r.status === 'next' ? '🔜 Next' : '📋 Planned'}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="py-32 text-center px-6 relative">
        <PulseRingSVG className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-15" />
        <motion.div className="relative z-10 max-w-2xl mx-auto" {...fadeUp}>
          <motion.img src={wolfIcon} alt="" className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ fontFamily: "'Georgia', serif" }}>
            Where wolves change <span className="text-primary">rivers</span>.
          </h2>
          <p className="text-muted-foreground text-lg mb-10 italic">
            The trophic cascade isn't scripted. It's computed. And it works.
          </p>
          {ctaButton('Launch Simulation')}
        </motion.div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-border py-10 text-center">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">Yellowstone Living World</span> · Built with Lovable · Inspired by the 1995 Wolf Reintroduction
        </p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <a href="https://yellowstone-rae.lovable.app" className="text-xs text-primary hover:underline">Live Demo</a>
          <a href="https://lovable.dev" className="text-xs text-muted-foreground hover:text-foreground transition-colors">lovable.dev</a>
        </div>
      </footer>
    </div>
  );
}
