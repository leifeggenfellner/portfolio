---
name: three-asset-pipeline
description: Take a 3D model from Blender to a lazy-loaded Threlte component inside a desktop app window.
---

# Skill — 3D asset pipeline (Blender → glTF → Threlte)

## When to invoke

- Adding or replacing a 3D model in a scene.
- Building a new 3D app or effect (use alongside `generate-app`).
- Reviewing a PR that touches `src/assets/models/` or imports
  `three` / `@threlte/*`.

Read [ADR 0005](../../../docs/adrs/0005-threlte-for-3d.md) first.
For three.js-level rules (disposal, draw calls, shaders), apply
the vendored `three-best-practices` skill, with the overrides
below.

## Inputs

1. Source model (`.blend`, or an existing `.glb`/`.gltf`).
2. Target: which app or effect mounts it.
3. Budget: triangles and compressed size (defaults below).

## Steps

1. **Author for real time** (Blender):
   - Apply transforms (scale 1, rotation 0); +Y up is handled by
     the exporter.
   - Low-poly is the house style; default budget ≤ 20k triangles
     per model.
   - One material per distinct surface; reuse materials across
     meshes. Prefer flat or vertex colours over texture maps.
   - Bake lighting into textures for static props instead of
     adding lights.
   - Name meshes and nodes meaningfully: `@threlte/gltf` turns
     the names into component structure.
2. **Export** as glTF Binary (`.glb`): selected objects only,
   +Y up, apply modifiers, no cameras or lights unless the scene
   needs them. Headless:
   ```sh
   blender -b model.blend --python-expr \
     "import bpy; bpy.ops.export_scene.gltf(filepath='model.glb', export_format='GLB', export_apply=True)"
   ```
3. **Compress** with glTF-Transform:
   ```sh
   pnpm exec gltf-transform optimize model.glb src/assets/models/<name>.glb \
     --compress meshopt --texture-compress webp
   ```
   Use `--texture-compress ktx2` only for large textures (needs
   the KTX2 transcoder shipped with the scene). Budget: ≤ 300 KB
   per `.glb` after compression. Check with
   `pnpm exec gltf-transform inspect`.
4. **Generate the component**:
   ```sh
   pnpm exec @threlte/gltf src/assets/models/<name>.glb --types --transform=false
   ```
   Move the output into the consuming app's folder, rename to
   `<PascalName>Model.svelte`, and import the asset with `?url` so
   Vite hashes it. Strip anything the scene does not use.
5. **Mount** inside a Threlte `<Canvas>` in an app or effect
   component that is only reached via a registry `load()` (or
   another dynamic `import()`). Never import `three` from a module
   on the boot path.
6. **Scene requirements** (ADR 0005):
   - `renderMode="on-demand"`; under `prefersReducedMotion()`
     no idle motion, still frame only.
   - Colours from `tokens.css` custom properties, read at mount.
   - Text alternative on the canvas; keyboard equivalents for
     every pointer interaction; visible focus ring.
   - Static fallback when WebGL is missing or the context is
     lost.
7. **Test**: pure helpers in `src/lib/` under Vitest; the scene
   via Playwright screenshot in `tests/e2e/`.
8. Run `performance-auditor` (chunk stays off `/`) and
   `accessibility-reviewer`, then `pnpm run ci`.

## Overrides to `three-best-practices`

- Ignore `setup-use-import-maps` and CDN URLs: Vite bundles
  `three` from `node_modules`.
- Read `memory-dispose-on-unmount` as Svelte: Threlte disposes
  what it creates; anything created by hand is disposed in an
  `$effect` teardown.
- Read `render-single-raf` / `render-conditional` as Threlte's
  `useTask` and `renderMode`, not a manual
  `requestAnimationFrame` loop.

## Acceptance

- `.glb` under budget, committed under `src/assets/models/`;
  source `.blend` not in the build.
- No `three` / `@threlte` code in the initial chunk for `/`.
- Reduced motion, keyboard, focus ring and WebGL fallback all
  verified.
- `pnpm run ci` green.

## Anti-patterns

- React, R3F or drei imports (ADR 0004).
- Hex colours in scene code or shaders.
- Allocating vectors/matrices inside `useTask` callbacks.
- Loading uncompressed `.gltf` + loose textures.
