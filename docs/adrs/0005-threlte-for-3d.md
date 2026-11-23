# ADR 0005 — Threlte (Svelte) for 3D, not React Three Fiber

- **Status:** Proposed (2026-11-23). Becomes Accepted when the
  first 3D app lands; no dependency is added before then.

## Decision

3D scenes are built with **three.js** through **Threlte 8**
(`@threlte/core` + `@threlte/extras`), the Svelte 5 renderer for
three.js. A 3D scene is an ordinary interactive app: a
`kind: "svelte"` registry entry whose `load()` dynamically imports
a component that owns a Threlte `<Canvas>`. Models are authored in
Blender, exported as glTF binary (`.glb`), compressed with
glTF-Transform, and turned into typed Svelte components with
`@threlte/gltf`. The pipeline lives in the `three-asset-pipeline`
skill.

Dependencies, added together with the first 3D app:

| Package               | Kind    | Role                                    |
| --------------------- | ------- | --------------------------------------- |
| `three`               | runtime | renderer, loaders                       |
| `@threlte/core`       | runtime | `<Canvas>`, `<T>`, `useTask`, contexts  |
| `@threlte/extras`     | runtime | `useGltf`, controls, helpers (drei-ish) |
| `@types/three`        | dev     | types for strict TS                     |
| `@threlte/gltf`       | dev     | `.glb` → `.svelte` component generator  |
| `@gltf-transform/cli` | dev     | Draco/Meshopt + KTX2/WebP compression   |

Physics (`@threlte/rapier`), post-processing and `@threlte/studio`
need their own ADR if a scene ever needs them.

## Why

- **No second framework.** React Three Fiber would bring back
  React, react-dom, `@astrojs/react` and a second island, undoing
  ADR 0004 and its "no React in `src/`" check. A React scene
  could not read the window-manager store without a bridge.
- **Parity with R3F.** Threlte covers what we would use R3F for:
  declarative scene graph (`<T>` ≈ JSX intrinsics), a frame
  scheduler (`useTask` ≈ `useFrame`), `@threlte/extras` ≈ drei,
  `@threlte/gltf` ≈ gltfjsx. It targets Svelte 5 runes
  (peer `svelte >=5`, `three >=0.172`).
- **Fits the window model.** Mounting and unmounting with the
  window gives the scene a natural lifecycle; Threlte disposes
  what it creates when the component is destroyed.
- **Agent support.** Threlte publishes `llms.txt`
  (<https://threlte.xyz/llms.txt>); the vendored
  `three-best-practices` skill covers the three.js layer beneath.

## Alternatives

- **React Three Fiber + drei.** Largest ecosystem and the best
  agent skills, but costs a React runtime and a second island.
  Rejected for the reasons above.
- **Vanilla three.js in a Svelte action.** Zero extra deps beyond
  `three`. Fine for one small effect (e.g. a wallpaper shader);
  becomes hand-rolled Threlte once scenes have state, events and
  loaded models. Still allowed for single-mesh / single-shader
  effects under `effects/`.
- **TresJS / model-viewer / Spline embeds.** Vue-only, too
  limited, or a third-party runtime we do not control.

## Consequences

- **Never in the boot path.** three.js is roughly 150 KB
  gzipped, more than the whole 90 KB budget for `/`
  (`docs/05-performance-a11y.md`). It may only be reached through
  a registry `load()` (or another dynamic `import()`), so it
  ships as its own chunk on window open. `performance-auditor`
  checks this for every 3D PR.
- **Reduced motion.** Scenes use `renderMode="on-demand"` by
  default. Under `prefersReducedMotion()` (`src/lib/motion.ts`)
  there is no auto-rotation, idle animation or camera easing;
  the scene renders a still frame and moves only on input.
- **Accessibility.** The canvas gets a text alternative
  (`role="img"` + `aria-label`, or adjacent visible text), every
  pointer interaction has a keyboard equivalent, and the canvas
  wrapper shows the standard focus ring.
- **Tokens.** Scene and shader colours are read from
  `tokens.css` custom properties at mount (and on theme change),
  never written as hex literals in components.
- **Layering.** three/Threlte imports are allowed in `apps/` and
  `effects/` only. Pure scene maths (camera paths, procedural
  geometry data, colour conversion) lives in `src/lib/` with no
  three.js import where practical, so Vitest covers it.
- **Testing.** happy-dom has no WebGL, so component tests mock
  the canvas or skip it. Rendering is covered by Playwright
  (chromium, software GL) with screenshot assertions.
- **WebGL can fail.** Every scene has a static fallback (poster
  image or text) when WebGL is unavailable or the context is
  lost.
- **Assets.** Source `.blend` files stay out of the build; the
  compressed `.glb` and any KTX2 textures go in `src/assets/models/`
  (imported with `?url`) so they are hashed and cached.
