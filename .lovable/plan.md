

## Yellowstone Living World Simulator — Phase 1: 3D Terrain + Seasonal Rendering

### What we're building
A navigable Three.js 3D terrain representing Yellowstone's landscape with four seasonal visual states, dynamic sky, camera controls, and the foundation for the Boids + rules-based agent system.

### Pages & Layout
- **Single-page app** with a full-screen Three.js canvas
- **Left sidebar (collapsed by default)**: Minimal control panel with season selector and time speed controls
- **Bottom overlay**: Year/day counter and season indicator

### 3D Terrain
- Procedurally generated heightmap terrain resembling Yellowstone's valleys, ridges, and river corridors
- PBR-style materials with grass/rock textures via shader blending based on altitude and slope
- **5 biome zones** rendered with distinct colors/textures: alpine meadow (high, rocky), coniferous forest (mid-elevation, dark green), riparian corridor (river edges, lush), geothermal basin (warm tones, steam particles), open grassland (golden/green)
- River meshes with animated flow using normal map scrolling
- Simple lake geometry with reflective material

### Seasonal Rendering System
- **Winter**: Snow shader overlay on terrain, frozen river tint, reduced vegetation, cool blue fog
- **Spring**: Green ground, swelling rivers, flower particles in meadows
- **Summer**: Full foliage density, warm lighting, optional wildfire smoke placeholder
- **Autumn**: Color-shifted foliage (gold/amber), warm color grading, falling leaf particles

Seasons transition smoothly when user changes the selector (shader uniform interpolation).

### Camera System
- **Orbit mode (default)**: Free orbit with scroll zoom, drag rotate, right-drag pan. Terrain collision to prevent going underground
- **God view**: Top-down orthographic toggle for overview
- Smooth transitions between camera modes

### Control Panel (Left Sidebar)
- Season selector: 4-button segmented toggle (Winter/Spring/Summer/Autumn) with icons
- Time speed slider: 0.25x to 10x with play/pause
- Year & day counter display
- Camera mode toggle (Orbit / God view)

### Atmosphere & Effects
- Dynamic sky shader tied to time-of-day and season
- Volumetric fog in valleys (distance-based)
- Snow/rain particle systems per season
- Geothermal steam particles in basin zones

### Tech Approach
- **React Three Fiber** (`@react-three/fiber@^8.18`) + **Drei** (`@react-three/drei@^9.122.0`) + `three@^0.170`
- Zustand for simulation state (season, time, camera mode)
- Tailwind CSS for UI overlay panels
- Custom ShaderMaterial for terrain biome blending and seasonal transitions
- GPU-instanced vegetation (trees, grass clusters) with LOD

### Foundation for Phase 2
- World coordinate system and spatial grid ready for agent placement
- Boids + rules engine architecture stubbed out (agent base class, perception system, behavior trees) — not yet visualized but structurally prepared

