<div align="center">

# 🌲 Yellowstone Living World

**A real-time agent-based ecological simulation running entirely in your browser.**

*What happens when you remove the apex predator from a 2-million-acre wilderness?*

</div>

---

## The Thesis

Every ecology textbook tells the story of Yellowstone's wolf reintroduction. In 1995, 14 wolves were released into a park that had been without them for 70 years. What followed was one of the most dramatic trophic cascades ever documented — wolves changed the behavior of rivers.

**Yellowstone Living World** is a browser-native **agent-based simulation** that lets you *experience* this cascade in real time, intervene in it, and observe what emerges.

---

## How It Works (and What It Is Not)

This is an **agent-based simulation** (ABS), not a learned world model in the AI/ML sense.

The distinction matters:

| | This Project | AI World Model (e.g. Dreamer, Sora) |
|---|---|---|
| **Rules** | Hand-authored per species | Learned from data |
| **State prediction** | Computed from rules each tick | Neural network inference |
| **Emergent behavior** | ✅ Yes — trophic cascade is not programmed | ✅ Yes — but from learned representations |
| **Counterfactuals** | ✅ Intervene and observe divergence | ✅ Latent-space rollouts |
| **Data required** | None — rules encode ecological knowledge | Large observational datasets |

### What *does* emerge

The trophic cascade — the chain reaction from wolf predation through to river recovery — is **not scripted**. No agent has a global view. Wolves pursue elk using local proximity rules. Elk graze riverbank vegetation based on energy needs. Beavers build dams near water when conditions allow. The cascade arises as an emergent property of these local interactions, exactly as it did in the real Yellowstone.

### What is coded, not learned

- Predator-prey targeting rules (who hunts whom, at what range)
- Energy costs, reproduction thresholds, mortality conditions
- Terrain generation, seasonal cycles, species parameters

The simulation is a **computational thought experiment**: given these rules, does the Yellowstone cascade reproduce? The answer is yes — and that itself is a meaningful result.

---

## The Cascade in Action

```
🐺 Wolves → reduce 🦌 Elk → less grazing pressure
→ 🌲 Riverbank trees recover → 🦫 Beavers thrive
→ Beaver dams built → 💧 Riparian zones expand
→ More vegetation → More biodiversity → Healthier rivers
```

**Remove the wolves. Watch it collapse. Add them back. Watch it heal.**

Every data point is computed from agent interactions, not illustrated.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  React UI Layer                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Controls │ │ Status   │ │ Trophic Cascade  │ │
│  │ Panel    │ │ Panel    │ │ HUD              │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────┤
│              Three.js World Layer                │
│  Terrain · Water · Vegetation · Animals · Labels │
│  Low-poly stylized · Instanced rendering         │
│  Seasonal shaders · Flow-animated river          │
├─────────────────────────────────────────────────┤
│              Agent Simulation Layer               │
│  Boids flocking · Predator-prey FSM              │
│  Energy model · Reproduction · Mortality          │
│  Riparian state · Beaver dam tracking             │
├─────────────────────────────────────────────────┤
│              AI Narration Layer                   │
│  LLM-generated commentary on live sim state      │
│  Auto-triggered every 45s from event data        │
│  Edge function → Gemini Flash                    │
└─────────────────────────────────────────────────┘
```

---

## What You Can Do

### 🎮 Intervene
- **Spawn / cull** any of 9 species with population sliders
- **Trigger wildfires** that displace animals and stress the ecosystem
- **Set winter severity** (1–10) affecting prey mortality and migration
- **Toggle human refuge policy** (Open / Limited / Closed)

### 📊 Observe
- Real-time population area chart tracking 9 species + trees
- Event feed: kills, births, starvation, extinctions, beaver dams
- **Trophic Cascade HUD**: live chain visualization (🐺→🦌→🌲→🦫→💧)
- Riparian health bars showing grazing pressure vs. tree recovery

### 🎬 Experience
- Click any animal to inspect: energy, age, speed, position
- Follow-camera mode locks onto a selected animal
- AI narration generates commentary from live simulation data
- 4 scenario presets: Wolf Reintroduction 1995, Severe Winter, Wildfire Summer, Human Withdrawal

---

## Species Roster

| Species | Role | Behavior |
|---------|------|----------|
| 🐺 Wolf | Apex predator | Elk pursuit, cooperative hunting proximity, seasonal aggression |
| 🦌 Elk | Primary herbivore | Grazing, flee response, riverbank pressure |
| 🐻 Bear | Omnivore predator | Opportunistic hunting, foraging, solitary |
| 🦬 Bison | Megaherbivore | Herd movement, geothermal winter refuge |
| 🫎 Moose | Solitary browser | Riparian feeding, water-proximity bias |
| 🦫 Beaver | Ecosystem engineer | Water-bound, dam building, riparian recovery trigger |
| 🐺 Coyote | Mesopredator | Wolf-shadow scavenging, kill-site attraction |
| 🐦‍⬛ Raven | Scavenger | Kill-site tracking, aerial movement |
| 🦅 Osprey | Aerial fisher | River-proximity fishing, high-altitude flight |

---

## Why This Matters

### For Education
Trophic cascades are taught in every ecology class but never *felt*. This simulator lets a student remove wolves and watch — in 60 seconds — what took Yellowstone 70 years to demonstrate.

### For Research Intuition
The agent-based model provides a sandbox for testing intervention strategies: What population threshold triggers cascade collapse? How does winter severity interact with predation pressure? What's the minimum beaver population for measurable riparian recovery? These are not rigorous quantitative answers — they're intuition-building tools.

### For Exploring Emergence
This project demonstrates that **meaningful emergent behavior** arises from surprisingly simple local rules. The trophic cascade is not programmed — it falls out of 9 species following proximity-based behaviors on a shared terrain. This is the core idea behind agent-based modeling: complex global phenomena from local interactions.

---

## What Would Make It a True World Model

This is an honest roadmap, not a current capability:

1. **Learn agent rules from data** — train on real Yellowstone telemetry (GPS collar data, population surveys) instead of hand-coding behaviors
2. **Neural state predictor** — a small model trained on the simulation's own population history to predict future trajectories
3. **Counterfactual engine** — run parallel simulations with/without interventions, compare divergence statistically
4. **Uncertainty quantification** — represent parameter uncertainty and propagate it through predictions

The current simulation is the **sandbox** — a working environment where these learned components could be integrated.

---

## Technical Stack

| Component | Technology |
|-----------|-----------|
| Framework | React 18 + TypeScript + Vite |
| 3D Engine | Three.js via React Three Fiber |
| Rendering | Instanced meshes, custom GLSL shaders |
| Simulation | Custom boids engine + predator-prey FSM |
| State | Zustand (3 stores: agents, simulation, eco-config) |
| AI Narration | Gemini Flash via Edge Functions |
| Styling | Tailwind CSS + shadcn/ui |

**Zero backend required for simulation.** Everything runs client-side at 60fps. The only server call is optional AI narration.

---

## The Vision

Yellowstone is the proof of concept. The agent-based architecture generalizes to:

- **Marine ecosystems** — coral reef bleaching cascades
- **Urban ecology** — green corridor planning
- **Agricultural systems** — pest-predator balance modeling
- **Game worlds** — living ecosystems for open-world games

The goal: **a general-purpose ecological simulation engine** where you define species, rules, and terrain — and the cascades emerge. Adding learned components would bridge the gap from simulation to true world model.

---

## Run It

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. No API keys needed for the core simulation.

---

<div align="center">

**Yellowstone Living World** — *Where wolves change rivers.*

[Live Demo](https://yellowstone-rae.lovable.app) · Built with [Lovable](https://lovable.dev)

</div>
