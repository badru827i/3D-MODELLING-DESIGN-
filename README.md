# PRISMA 3D Engineer

Cross-platform precision 3D modeling starter for Android and Windows. The first milestone is a responsive installable web app (PWA) using Three.js and Vite, so one codebase runs in modern desktop and mobile browsers.

## Current MVP
- 3D viewport with orbit, zoom, pan, perspective/top/front/right views
- Box, cylinder, sphere and cone primitives
- Scene object list and selection
- Move, rotate and scale gizmos
- Real geometry dimensions displayed in mm, cm, m or inch
- Primitive dimension editing
- Binary STL and OBJ export
- Save scene parameters to JSON
- Responsive layout and basic service-worker caching
- Adaptive WebGL 2 renderer with GPU capability detection and quality tiers
- Compatibility path designed for Qualcomm Adreno, Arm Mali/Immortalis and desktop GPUs that expose WebGL 2

## Run locally
```bash
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run preview
```

## Technology decision
Three.js + TypeScript + Vite is the recommended first platform layer. It supports Windows and Android from one codebase and uses WebGL 2 rendering with a lightweight install footprint. The renderer checks WebGL 2 availability and GPU limits at startup, then adjusts antialiasing, pixel ratio and shadows for high, balanced or compatibility quality. This avoids tying the app to a Qualcomm- or MediaTek-specific SDK. Qualcomm Adreno and MediaTek devices are supported when their browser and graphics driver expose a working WebGL 2 context. WebGPU is detected as a future optional path, not required. The app can be installed as a PWA from a supported browser. A native CAD kernel such as Open CASCADE is a later engineering milestone for parametric constraints, robust Boolean operations, STEP import/export and solid validation.

## Units and precision
Internal model coordinates use millimetres. Unit selection changes display and input conversion only; it does not rescale stored geometry. This prevents unit drift when switching between mm, cm, m and inches.

## Roadmap
1. Undo/redo, project import, autosave and object naming.
2. Vertex/edge/face editing, snapping, constraints and dimension annotations.
3. CAD kernel integration for robust Boolean, fillet/chamfer and STEP.
4. Technical drawings, tolerances, assemblies and BOM.
5. Desktop packaging and Android native shell if browser PWA limits are reached.

## Engineering disclaimer
This is an early interactive modeling prototype, not a certified parametric CAD system. Arbitrary mesh editing, constraints, technical drawings, STEP support, robust Boolean/fillet/chamfer tools and validated manufacturing tolerances are not implemented yet. Verify engineering outputs in a qualified CAD workflow before fabrication.
