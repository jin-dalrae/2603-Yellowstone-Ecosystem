<div align="center">

# 🌲 Yellowstone Living World

**A real-time ecosystem world model running entirely in your browser.**

*What happens when you remove the apex predator from a 2-million-acre wilderness?*

</div>

---

## The Thesis

Every ecology textbook tells the story of Yellowstone's wolf reintroduction. In 1995, 14 wolves were released into a park that had been without them for 70 years. What followed was one of the most dramatic trophic cascades ever documented — wolves changed the behavior of rivers.

**Yellowstone Living World** is a browser-native **world model** that lets you *experience* this cascade in real time, intervene in it, and observe what emerges.

---

## What is a World Model?

A world model is a self-contained simulation that maintains internal state, runs forward in time, and produces **emergent behavior** from simple rules — no scripted outcomes, no predetermined narratives.

Our world model is built on three primitives:

| Layer | What it does | How it works |
|-------|-------------|--------------|
| **Terrain** | Procedural heightmap with 5 biomes, river system, seasonal shaders | Fractal Brownian Motion noise, GPU shaders |
| **Agents** | 9 species with autonomous behavior: hunt, flee, graze, reproduce, die | Modified Boids algorithm + predator-prey state machines |
| **Cascade** | Emergent ecosystem effects that no single agent "knows" about | Riparian zone tracking, grazing pressure → tree health → beaver habitat |

The key insight: **nobody programs the cascade**. It *emerges* from the interactions. Wolves don't "know" they're saving the riverbank. Beavers don't "know" the wolves are helping them. The system produces the trophic cascade as an emergent property — exactly like the real Yellowstone.

---

## The Cascade in Action

```
🐺 Wolves → reduce 🦌 Elk → less grazing pressure
→ 🌲 Riverbank trees recover → 🦫 Beavers thrive
→ Beaver dams built → 💧 Riparian zones expand
→ More vegetation → More biodiversity → Healthier rivers
```

**Remove the wolves. Watch it collapse. Add them back. Watch it heal.**

This is not a visualization. This is a *simulation*. Every data point is computed, not illustrated.

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
│  LLM-powered David Attenborough commentary       │
│  Auto-triggered every 45s from live event data   │
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
- Real-time population area chart with 9-species tracking
- Event feed: kills, births, starvation, extinctions, beaver dams
- **Trophic Cascade HUD**: live chain visualization (🐺→🦌→🌲→🦫→💧)
- Riparian health bars showing grazing pressure vs. tree recovery

### 🎬 Experience
- Click any animal to inspect: energy, age, speed, position
- Follow-camera mode locks onto a selected animal
- AI narration generates poetic commentary from live simulation data
- 4 scenario presets: Wolf Reintroduction 1995, Severe Winter, Wildfire Summer, Human Withdrawal

---

## Species Roster

| Species | Role | Behavior |
|---------|------|----------|
| 🐺 Wolf | Apex predator | Elk pursuit, cooperative hunting proximity, seasonal aggression |
| 🦌 Elk | Primary herbivore | Grazing, flee response, riverbank pressure |
| 🐻 Bear | Omnivore predator | Opportunistic hunting, foraging, solitary |
| 🦬 Bison | Megaherbivore | Herd movement, geothermal winter refuge |
| 🫎 Moose | Solitary browser | Riparian feeding, beaver pond dependency |
| 🦫 Beaver | Ecosystem engineer | River-bound, dam building, riparian recovery |
| 🐺 Coyote | Mesopredator | Small prey hunting, territorial |
| 🐦‍⬛ Raven | Scavenger | Kill-site tracking, aerial movement |
| 🦅 Osprey | Aerial predator | River fishing, high-altitude flight |

---

## Why This Matters

### For Education
Trophic cascades are taught in every ecology class but never *felt*. This simulator lets a student remove wolves and watch — in 60 seconds — what took Yellowstone 70 years to demonstrate.

### For Research
The agent-based model provides a sandbox for testing intervention strategies: What population threshold triggers cascade collapse? How does winter severity interact with predation pressure? What's the minimum beaver population for measurable riparian recovery?

### For AI World Models
This project demonstrates that **meaningful emergent behavior** arises from surprisingly simple rules. No neural network predicts the cascade — it falls out of 9 species following local rules on a shared terrain. This is the foundation of world-model thinking: complex global phenomena from local agent interactions.

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

Yellowstone is the proof of concept. The world model architecture generalizes to:

- **Marine ecosystems** — coral reef bleaching cascades
- **Urban ecology** — green corridor planning
- **Agricultural systems** — pest-predator balance modeling
- **Climate scenarios** — biome shift simulation under warming
- **Game worlds** — living ecosystems for open-world games

The goal: **a general-purpose ecological world model engine** where you define species, rules, and terrain — and the cascades emerge.

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
