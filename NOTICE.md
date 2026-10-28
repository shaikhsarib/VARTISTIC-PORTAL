# NOTICE — adopted reference code & licenses

This portal adapts patterns from publicly documented research (see
`Deep-Dive_Research_and_Analysis_UI_Design_AI_Sources.docx`). Adopted items:

| Reference | What was adopted | License | How |
| --------- | ---------------- | ------- | --- |
| opensourceui.in — ArcBandsBackground | Five-layer pure-CSS radial band background recipe | MIT (© opensourceui contributors) | `src/components/vartistic/arc-bands.tsx` — recolored to brand tokens, band geometry adapted; attribution in file header |
| soundcn (github.com/kapishdima/soundcn) | `useSound` hook API shape (volume/rate/interrupt pattern) | MIT (© kapishdima); sounds CC0 (Kenney) | `src/hooks/use-sound.ts` — original Web Audio oscillator implementation, no bundled audio files (avoids all sound licensing) |
| react-bits (github.com/DavidHDev/react-bits) | Concepts only: scroll-triggered reveal + stagger patterns | MIT + Commons Clause (no resale of components) | No source copied; motion implemented via framer-motion primitives |
| framer.university — 10 scroll animations | Mechanics: scroll transforms, parallax layers, sticky reveal | Reference material (free tutorial) | `dashboard-view.tsx` header parallax; `whileInView` reveals |
| glass3d.dev | Glassmorphism recipe knowledge (backdrop-filter + layered shadows) | No explicit license — treated as inspiration only | Token-level `.glass` utility in `globals.css` (original values) |
| 3dicons.co | 3D-icon *style direction* for empty states | CC0 | Original inline SVG artwork in `src/components/icons3d/icons.tsx` (no assets copied) |
| ui.watermelon.sh / openui / OpenIntelligentUI / usehallmark / supahero / refero / cta.gallery / footer.design / navbar.gallery / builtformars / microcopy.me / checklist.design / string-tune / threeui.com | UX & copy patterns (empty-state tone, checklist thinking, microcopy) | Respectively MIT / MIT / MIT / MIT / proprietary sites — patterns and ideas only, no code | Copy and interaction patterns informed the UI; no source copied |

The wordmark and orbit mark are extracted verbatim from the supplied brand asset
`vartistic-logo-v4.svg` (02 · PALETTE variation) and rendered through
`src/components/vartistic/logo.tsx` + `wordmark.ts`.
