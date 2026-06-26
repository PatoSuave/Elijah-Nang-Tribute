**Source Visual Truth**
- Confirmed brief: photo-inspired sakura canopy, slow breeze illusion, petals falling from the canopy, no user-facing controls, reduced-motion support.
- User reference: `c:/Users/afils/OneDrive/Desktop/Sakura.jpg` used as art direction only.
- Production assets: `public/images/sakura-canopy.webp`, `public/images/sakura-petal.png`.

**Implementation Evidence**
- Comparison image: `design/qa-sakura-tree-comparison.png`
- Desktop screenshot: `design/qa-sakura-tree-desktop.png`
- Mobile screenshot: `design/qa-sakura-tree-mobile.png`
- Reduced-motion screenshot: `design/qa-sakura-tree-reduced-motion.png`
- Vercel preview screenshot: `design/qa-sakura-tree-preview.png`
- Desktop viewport: 1440 x 1800
- Mobile viewport: 390 x 1400
- Reduced-motion viewport: 1440 x 1800
- State: homepage at top, unauthenticated, default dark archive theme

**Full-View Comparison Evidence**
- The generated canopy echoes the reference photo's upper-left branch mass, dark negative space, and softly scattered blossoms without shipping the reference image.
- The rendered page keeps the canopy behind the hero, portrait, shelf art, selected works, and mini-player.
- Petals begin near the top canopy zone and drift downward slowly, so the motion reads as falling from the tree instead of random floating decoration.
- Text remains readable across desktop and mobile; the canopy and petals stay faint against the existing scrims.

**Focused Region Comparison Evidence**
- Desktop hero: the canopy is visible along the upper-left and upper edge, while the portrait and primary CTA remain dominant.
- Mobile hero: the canopy sits behind the opening copy and does not crowd the portrait or buttons.
- Reduced motion: the canopy is static and the falling petal layer is hidden.
- Accessibility: the layer is `aria-hidden`, non-interactive, and uses `pointer-events: none`.

**Browser Checks**
- Page content rendered: passed.
- Next/Vite error overlay: none detected.
- Console/runtime errors in CDP probe: none detected.
- Horizontal overflow at mobile probe width: 0 px.
- Normal motion: canopy animation is `sakuraCanopyBreeze`; 12 mobile petals are visible.
- Reduced motion: canopy animation is `none`; 0 petals are visible.

**Findings**
- No actionable P0, P1, or P2 issues remain.

**Open Questions**
- None for this pass.

**Patches Made Since Previous QA Pass**
- Replaced the petal-only layer with `src/components/SakuraAtmosphere.tsx`.
- Added the generated/processed canopy asset at `public/images/sakura-canopy.webp`.
- Retuned petal origins, durations, drift, opacity, and mobile density.
- Added slow CSS-only canopy sway and Safari-compatible masking.
- Preserved reduced-motion support by freezing the canopy and hiding petals.
- Recorded the design decision in `DESIGN_CONTINUATION.md`.

**Verification**
- `cmd /c npm run lint`: passed
- `cmd /c npm run build`: passed
- Chrome screenshot QA: passed
- Chrome DevTools Protocol DOM/style QA: passed
- Vercel preview screenshot QA: passed

**Final Result**
- final result: passed
