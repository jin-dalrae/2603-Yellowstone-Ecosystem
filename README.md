<div align="center">

# 🌲 Yellowstone Living World

**The first browser-native ecological digital twin with emergent trophic cascades.**

*We didn't program the cascade. We programmed the wolves. The cascade happened on its own.*

[**Live Demo →**](https://yellowstone-rae.lovable.app)

</div>

---

## The Problem

Ecological collapse is the defining crisis of the century, yet the tools to understand it are stuck in spreadsheets and static models. Trophic cascades — the chain reactions triggered by adding or removing a single species — reshape entire landscapes. But no one can *see* them happen, *intervene* in them, or *feel* the feedback loops.

**Result:** Policy decisions about apex predators, land use, and conservation are made without intuitive understanding of cascading consequences.

---

## What We Built

A **real-time agent-based ecological simulation** running entirely in the browser at 60fps. Nine species. Procedural terrain. Dynamic seasons. And a trophic cascade that *emerges from local agent rules* — not from scripted sequences.

### The Cascade Is Real

```
🐺 Wolves hunt → 🦌 Elk populations drop → Grazing pressure decreases
→ 🌲 Riverbank willows recover → 🦫 Beavers find habitat
→ Beaver dams built → 💧 Water table rises → Riparian zones expand
→ More biodiversity → Healthier rivers → Changed landscapes
```

**This chain reaction is not coded.** No agent has a global view. Wolves chase elk using proximity detection. Elk consume vegetation based on energy needs. Beavers build dams when nearby tree health exceeds a threshold. The cascade is a *measured emergent property* of 400+ autonomous agents following local rules on shared terrain — exactly as it happened in the real Yellowstone after the 1995 wolf reintroduction.

**Remove the wolves. Watch the ecosystem collapse in 60 seconds. Add them back. Watch it heal.**

---

## Grounded in Real NPS Data

This simulation is calibrated against the **NPS Wolf Project Biennial Reports (1995–2005)**, the definitive longitudinal study of the Yellowstone wolf reintroduction. Key parameters are derived from a decade of field observations:

### Data Sources

| Report | Key Findings Incorporated |
|--------|--------------------------|
| **Wolf Project Report 1995–96** | 14 wolves introduced → 51 by end of 1996. Kill rates: 1 elk per 1.5–5 days per pack. Prey: 86% elk (30% calves, 49% elderly), 0% bison. Wolves tested bison but failed every attempt. |
| **Wolf Project Report 2005** | 171 wolves in 16 packs. Kill rates dropped to 0.9 elk/wolf/month as prey adapted. Interior packs began specializing in bison (9% of kills). **Intraspecific strife** (wolf-on-wolf pack warfare) became the #1 cause of mortality. Pup survival crashed from 60% to 16% in disease years. |

### How Reports Shaped the Simulation

| NPS Finding | Simulation Implementation |
|-------------|--------------------------|
| **Wolves failed to kill bison until interior packs specialized (post-2000)** | Bison are unkillable by wolves before simulation year 5; afterward, 9% prey preference with 25% success rate |
| **86% elk prey preference, targeting calves and elderly** | Weighted prey selection: 86% elk / 9% bison / 5% moose. Low-energy prey are 1.5× easier to kill |
| **Kill rate ~1 elk per 2–3 days per pack** | Per-wolf kill cooldown of ~2.4 sim-days prevents unrealistic rapid successive kills |
| **Intraspecific strife was #1 mortality cause by 2005** | Wolf-on-wolf territorial mortality at high density (10+ wolves). Crowded, low-energy wolves die from pack disputes |
| **Pack flanking and coordinated hunting** | Wolves calculate flank angles by pack rank, surrounding prey from multiple vectors |
| **Elk behavioral shifts (increased vigilance, habitat avoidance)** | Elk defensive herding tightens formation near predators; autumn rut adds erratic movement |

---

## Working Predator-Prey Dynamics

This is not a toy visualization. The simulation implements a closed-loop ecological feedback system with measurable, reproducible dynamics:

### 🐺→🦌 Predation Pressure (NPS-calibrated)

| Mechanic | Implementation |
|----------|---------------|
| **Pack flanking** | Wolves calculate flank angles by pack rank, surrounding prey from multiple vectors instead of single-file pursuit |
| **Prey preference** | 86% elk / 9% bison (year 5+) / 5% moose — matching NPS kill composition data |
| **Kill cooldown** | ~1 kill per 2–3 days per pack, matching observed rates of 0.9–1.8 elk/wolf/month |
| **Vulnerability targeting** | Low-energy prey (calves/elderly proxy) are 1.5× more likely to be taken |
| **Kill cascades** | Successful kills generate carrion events that attract ravens, coyotes, and bears — redistributing energy through the food web |
| **Intraspecific strife** | At high wolf density, territorial aggression kills dispersing wolves — the real #1 cause of wolf mortality |

### 🦌→🌲 Grazing Dynamics

| Mechanic | Implementation |
|----------|---------------|
| **Cumulative grazing pressure** | Each elk within range of riverbank vegetation reduces riparian health by 0.15/tick — pressure scales with elk density |
| **Vegetation recovery** | Without grazing pressure, riparian zones recover at 0.003/tick — slow enough that overpopulation leaves lasting damage |
| **Sapling recruitment** | When riparian health exceeds 65%, new saplings sprout and grow into mature trees over multiple seasons |
| **Tree population tracking** | Mature tree count directly reflects cumulative herbivore pressure over time |

### 🌲→🦫→💧 Engineering Cascade

| Mechanic | Implementation |
|----------|---------------|
| **Beaver energy scaling** | Beaver energy intake scales with nearby tree health — healthy riverbanks sustain beaver populations |
| **Dam construction** | Beavers build dams at water-adjacent sites when conditions are met, creating expanding pond zones with cattail reeds |
| **Riparian feedback** | Beaver dams raise local water tables, accelerating vegetation recovery in a positive feedback loop |
| **River response** | River width, clarity, and color respond dynamically to riparian health — blue/clear when healthy, brown/murky when degraded |

### 🦬🫎🐻 Secondary Dynamics

| Species | Ecological Role |
|---------|----------------|
| **Bison** | Defensive herding: form tight clusters when wolves are within 35 units, dispersing when threat passes |
| **Moose** | Solitary riparian browsers adding grazing pressure independent of elk herds |
| **Bears** | Opportunistic omnivores — hunt small prey, compete for carrion, seasonal foraging patterns |
| **Coyotes** | Mesopredator release: populations expand when wolves decline, adding secondary predation pressure |
| **Ravens** | Scavenger network tracking kill sites across the map |
| **Osprey** | River-dependent aerial fishers — population health indicates water quality |

### Measured Outputs

Every metric is computed from agent interactions, not illustrated:

- **Riparian Health %** — rolling average of vegetation condition along water corridors
- **Population curves** — 9 species + tree count tracked over simulation time
- **Trophic cascade HUD** — live visualization: 🐺 count → 🦌 count → 🌲 health % → 🦫 count → dam count
- **Event feed** — kills, births, starvation events, pack strife, extinctions, dam construction

---

## Why It's Hard (and Why We Solved It)

| Challenge | Our Approach |
|-----------|-------------|
| **400+ agents at 60fps** | Instanced mesh rendering, spatial hashing for proximity queries, zero garbage collection pressure |
| **Emergent behavior from local rules** | Boids-based flocking + predator-prey finite state machines + energy/reproduction/mortality model |
| **Visual fidelity without asset loading** | Procedural terrain with GLSL biome shaders, custom low-poly animal geometries, UV-scrolling river |
| **Seasonal dynamics** | Shader uniforms interpolate terrain colors, snow coverage, fog, and sky across 4 seasons |
| **AI narration** | Edge function calls Gemini Flash every 35s with live population/event data, generating contextual ecological commentary |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    React UI Layer                     │
│  Controls · Population Charts · Trophic Cascade HUD  │
│  Scenario Presets · Animal Inspector · Event Feed     │
├──────────────────────────────────────────────────────┤
│                Three.js World Layer                   │
│  Procedural terrain (200×200, GLSL biome shaders)    │
│  Instanced vegetation (200 trees + 150 saplings)     │
│  9 species with custom geometries · Seasonal sky     │
│  Flow-animated river with health-reactive rendering   │
├──────────────────────────────────────────────────────┤
│              Agent Simulation Engine                  │
│  Boids flocking with Perlin noise wandering          │
│  Pack flanking · Defensive herding · Kill cascades   │
│  Energy model · Reproduction thresholds · Mortality  │
│  Riparian state machine · Beaver dam lifecycle       │
├──────────────────────────────────────────────────────┤
│               AI Narration Layer                     │
│  LLM narration from live sim state (Gemini Flash)    │
│  Trophic-cascade-aware prompting                     │
│  Contextual: highlights active cascade link           │
└──────────────────────────────────────────────────────┘
```

**Zero backend for simulation.** Everything runs client-side. The only server call is optional AI narration.

---

## The Market

### Education ($8B+ EdTech)
Trophic cascades are taught in every AP Biology and college ecology course. Students read about them. With Yellowstone Living World, they *experience* them — removing wolves and watching collapse unfold in 60 seconds instead of 70 years.

### Conservation & Policy
Wildlife management decisions about apex predator reintroduction, hunting quotas, and habitat corridors require understanding cascading effects. This is the interactive briefing tool that doesn't exist yet.

### Gaming & Interactive Media
Living ecosystems are the holy grail of open-world game design. Our agent architecture proves that meaningful emergent ecology runs at 60fps in a browser — no server, no ML inference cost.

---

## The Platform Vision

Yellowstone is the proof of concept. The agent-based architecture generalizes:

| Domain | Cascade |
|--------|---------|
| **Marine ecosystems** | Shark removal → mesopredator release → reef collapse |
| **Urban ecology** | Green corridor planning → pollinator networks → urban heat mitigation |
| **Agricultural systems** | Pesticide reduction → pest-predator rebalancing → soil health |
| **Climate scenarios** | Temperature shifts → migration pattern changes → ecosystem reorganization |

**The goal:** A general-purpose ecological simulation engine. Define species, rules, and terrain. The cascades emerge. Layer in learned components from real telemetry data, and you have a **predictive ecological digital twin**.

---

## Roadmap to World Model

| Phase | Status | Description |
|-------|--------|-------------|
| Agent-based simulation | ✅ Shipped | 9 species, emergent trophic cascade, seasonal dynamics |
| AI narration | ✅ Shipped | LLM commentary from live simulation state |
| Scenario presets | ✅ Shipped | Wolf Reintroduction 1995, Severe Winter, Wildfire, Human Withdrawal |
| Pack hunting & herding | ✅ Shipped | Flanking wolves, defensive bison clusters |
| Learn rules from data | 🔜 Next | Train on real Yellowstone GPS collar data + population surveys |
| Neural state predictor | 🔜 Planned | Predict population trajectories from current state |
| Multi-ecosystem support | 🔜 Planned | Marine, urban, agricultural templates |
| Counterfactual engine | 🔜 Planned | Parallel rollouts comparing intervention scenarios |

---

## Technical Stack

| Component | Technology |
|-----------|-----------|
| Framework | React 18 + TypeScript + Vite |
| 3D Engine | Three.js via React Three Fiber + Drei |
| Rendering | Instanced meshes, custom GLSL shaders, procedural geometry |
| Simulation | Custom boids engine + predator-prey FSM + energy model |
| State | Zustand (3 stores: agents, simulation, eco-config) |
| AI | Gemini Flash via serverless edge functions |
| Styling | Tailwind CSS + shadcn/ui |

---

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. No API keys needed for the core simulation.

---

<div align="center">

**Yellowstone Living World** — *Where wolves change rivers.*

The trophic cascade isn't scripted. It's computed. And it works.

[**Try the Live Demo →**](https://yellowstone-rae.lovable.app) · Built with [Lovable](https://lovable.dev)

</div>
