# `src/components/three`

React Three Fiber scenes for the AR/VR landing hero.

Rules:

- The canvas is lazy-loaded (`dynamic(..., { ssr: false })`) so 3D never blocks LCP.
- Device tiers: full scene, simplified scene, or a static fallback for no-WebGL
  and reduced-motion visitors.
- Rendering pauses when the scene is off-screen; DPR is capped at 2.
- Geometries, materials and textures are disposed on unmount.

Built in **Stage 2**.
