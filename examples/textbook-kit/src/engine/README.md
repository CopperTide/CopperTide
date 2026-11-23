# General mathematical WebGPU engine · 0.1.0

The engine every course and module shares. It renders mathematical data. It does not certify mathematical claims.

CopperTide copies this file into each Textbook creator project, where the team's agents read it.

## Conventions

- World coordinates are right-handed. Units belong to the module.
- The camera is orthographic. Depth maps to WebGPU's [0, 1].
- `span` is the vertical world extent. Visible depth reaches roughly 10 spans either side of the camera center.

## Use

```ts
import { WebGPUEngine } from './WebGPUEngine';
import { curve, surface, DEFAULT_CAMERA } from './geometry';

const engine = await WebGPUEngine.create(canvas, showVisibleError);
engine.setScene([
  curve(t => [Math.cos(t), Math.sin(t), t / 4], [0, 4 * Math.PI]),
  surface((u, v) => [u, v, 0], [-1, 1], [-1, 1], 20),
]);
engine.setCamera({ ...DEFAULT_CAMERA, yaw: 0.7 });
// Call render() on ResizeObserver changes, and dispose() on unmount.
```

Render on parameter changes. There is no permanent animation loop.

## What it needs

- A browser and adapter with WebGPU, in a secure context. Localhost development works.
- The module owns accessible controls (yaw, pitch and zoom inputs plus reset), the mathematical explanations, axis and unit labels, and an always-available text or table fallback.
- Catch initialization failure and show the explanation without a canvas. A missing WebGPU device is not a passing GPU test.

## Supported

- Colored line segments and triangle meshes.
- Parameter curves and surfaces.
- Depth occlusion, orbit angles, zoom and center, resize.
- Explicit cleanup and device-loss reporting.
- At most 300,000 vertices per scene. Invalid or non-finite geometry is rejected. Split singular domains explicitly.

## Limits

Not supported yet: indexed mesh buffers, lighting and normals, labels and picking, transparency ordering, adaptive tessellation, a perspective camera and volumetric rendering. Color alpha is accepted, but the canvas and pipeline are opaque, so use alpha 1. Do not pretend these capabilities exist.

## Request a change

1. Send Engine support a minimal use case, the current API version and acceptance checks.
2. The 3D engine creator owns shared engine changes.
3. The 3D engine verifier checks the revision.
4. Engine support replies with docs and examples, and the requesting visualizer confirms the integration.

Record requests under `docs/engine/support`. Keep APIs general, and update this capability list and the examples when you extend them.

## Tests

Run `npm test` and `npm run build`. Then run a real browser smoke test covering two overlapping surfaces, a spatial curve, resize, controls, disposal and the unavailable-device path. Save the exact revision, commands, captures and unrun checks under `docs/engine/checks`. Do not claim browser or GPU validation from CPU tests.

## References

[WebGPU specification](https://www.w3.org/TR/webgpu/) · [canvas configuration](https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure) · [device creation](https://developer.mozilla.org/en-US/docs/Web/API/GPUAdapter/requestDevice)
