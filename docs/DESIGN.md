# Design System Strategy: High-Performance Data Editorial

**Doc type:** Visual / editorial design strategy (Stitch-aligned). **Audience:** Designers and frontend implementers. **Hub:** [agent-navigation.md](./agent-navigation.md).

## 1. Overview & Creative North Star

### Creative North Star: "The Precision Architect"
This design system moves beyond the standard SaaS dashboard to create a high-fidelity, editorial environment for performance data. It is inspired by the precision of architectural blueprints and the immersive quality of premium dark-mode interfaces. We reject the "boxed-in" feeling of traditional grids in favor of **Intentional Asymmetry** and **Tonal Depth**.

The system is designed to handle immense data density without cognitive overload. By utilizing a "dark-first" philosophy, we allow neon accents to act as thermal heat maps, guiding the eye immediately to critical performance metrics while the rest of the interface recedes into a sophisticated, layered background.

## 2. Colors

The palette is anchored in a deep charcoal foundation, using high-chroma blue accents to signify interactive "intelligence."

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off major layout areas. Structural boundaries must be defined through **Background Shifting**. 
*   Place a `surface-container-low` component on a `surface` background.
*   The transition of tones creates a cleaner, more premium "edge" than a stroke ever could.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-opaque materials.
*   **Base:** `surface` (#0B0E11) – The bedrock.
*   **Layer 1:** `surface-container-low` – Used for large sidebar or navigation regions.
*   **Layer 2:** `surface-container` – The primary workspace or canvas.
*   **Layer 3:** `surface-container-high` – Cards, modals, and interactive modules.
*   **Layer 4:** `surface-bright` – Hover states or active focal points.

### The "Glass & Gradient" Rule
To elevate the aesthetic, floating elements (like tooltips or dropdowns) should utilize **Glassmorphism**. Use `surface-container` at 80% opacity with a `backdrop-blur` of 12px. For primary CTAs, do not use flat hex codes; apply a subtle linear gradient from `primary` (#5EB4FF) to `primary-container` (#2AA7FF) at a 135-degree angle to provide a machined, "glow" effect.

## 3. Typography

The system utilizes **Inter** for its neutral, high-legibility character, treated with editorial spacing.

*   **Display (lg/md/sm):** Reserved for high-level performance scores or hero metrics. Use tight letter-spacing (-0.02em) to create an authoritative, "bold" impact.
*   **Headline & Title:** Used for section headers. In this system, Titles should be set in `on-surface-variant` (subtle grey) to allow the data points to remain the highest visual priority.
*   **Body (lg/md/sm):** The workhorse for data descriptions.
*   **Label (md/sm):** Specifically for "micro-data"—labels within charts, axis markers, and metadata. These should often be Uppercase with +0.05em tracking for a "technical" feel.

## 4. Elevation & Depth

We eschew traditional "Drop Shadows" for **Tonal Layering** and **Ambient Glows**.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-highest` card sitting on a `surface-container` provides all the visual separation required for a professional interface.
*   **Ambient Shadows:** If a floating state (like a modal) requires a shadow, use a diffuse, wide-spread blur (24px - 40px) with the color `surface-container-lowest` at 40% opacity. This mimics a soft object blocking light rather than a harsh black smudge.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., in a high-density table), use the **Ghost Border**: `outline-variant` at 15% opacity. It should be barely felt, only sensed.
*   **Glassmorphism:** Use for "floating" navigation or overlays. The `surface-variant` color with a 70% alpha and blur effect ensures the background data "bleeds" through, maintaining the user's context.

## 5. Components

### Buttons & Chips
*   **Primary Button:** Gradient fill (Primary to Primary-Container) with `on-primary-fixed` text. Radius: `md` (0.375rem).
*   **Secondary Button:** Ghost style. No fill. `Ghost Border` (outline-variant @ 20%).
*   **Chips:** Use `surface-container-highest` for the background. For status chips (Met/Gap/Discrepancy), use a small 4px "dot" of the semantic color (`green`, `error`, `yellow`) rather than coloring the entire chip.

### Input Fields & Complex Forms
*   **Inputs:** Use `surface-container-low` with a bottom-only `outline-variant` 1px border. This creates a "terminal" aesthetic that feels high-tech.
*   **Checkboxes/Radios:** When active, they must "glow." Use `primary-dim` for the fill and a subtle 4px outer glow of the same color.

### Data Visualization (Signature Component)
*   **Radar & Line Charts:** Lines must be ultra-thin (1px). Use `primary` for the main data path. 
*   **The Grid:** Use `surface-container-highest` for grid lines at 10% opacity.
*   **Performance Sliders:** The track should be `surface-container-highest`, while the thumb should be a `primary` glow-point.

### Cards & Lists
*   **No Dividers:** Prohibit 1px lines between list items. Use the `Spacing Scale 4` (0.9rem) to separate items visually, or alternate background shades between `surface` and `surface-container-lowest`.

## 6. Do’s and Don’ts

### Do
*   **Do** use `on-surface-variant` for non-essential text to keep the "neon" data points at the center of attention.
*   **Do** leverage the `surface-container` tiers to create hierarchy. If everything is the same shade of black, the UI will feel "flat" and confusing.
*   **Do** use asymmetrical layouts (e.g., a wide data column next to a very narrow "insights" column) to create an editorial feel.

### Don’t
*   **Don’t** use 100% white (#FFFFFF) for text. Use `on-background` (#F8F9FE) to prevent eye strain against the dark background.
*   **Don’t** use heavy rounded corners. Stick to the `md` (0.375rem) or `sm` (0.125rem) scale to maintain a professional, sharp, and "engineered" look.
*   **Don’t** use standard drop shadows. If it looks like a "box shadow" from 2015, it’s wrong for this system.