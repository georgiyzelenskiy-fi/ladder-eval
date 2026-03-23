# DevSync: Cyber-Metric Dark Design System (V1.0)

**Doc type:** Product UI tokens and implementation notes. **Audience:** Agents and engineers building the MVP. **Hub:** [agent-navigation.md](./agent-navigation.md).

## 1. Design Philosophy: "The Precision Architect"
The Cyber-Metric Dark system is designed for high-density, technical environments where data accuracy and real-time collaboration are paramount. It draws inspiration from military-grade heads-up displays (HUDs) and modern developer tools.

### Core Principles
- **Clarity Over Chrome:** Minimalist borders and backgrounds to let data take center stage.
- **Actionable Contrast:** High-contrast neon accents (Blue/Green/Red) signal state and urgency.
- **Density with Hierarchy:** Supports complex information layouts without overwhelming the user through strict vertical and horizontal rhythm.

---

## 2. Color Palette & Theming

### Base Grays (The Void)
- **Background (Primary):** `#0B0E11` (Deep charcoal, nearly black)
- **Background (Secondary/Cards):** `#161B22`
- **Borders/Dividers:** `rgba(255, 255, 255, 0.05)` or `#30363D`

### Functional Accents (The Glow)
- **Primary Action (Info/Active):** `#00A3FF` (Neon Blue)
- **Success/Met:** `#4ADE80` (Neon Green)
- **Warning/Gap:** `#F87171` (Soft Neon Red)
- **In-Progress:** `#A855F7` (Deep Purple)
- **Text (Primary):** `#F8F9FE` (Off-white for high readability)
- **Text (Secondary):** `#8B949E` (Muted gray for metadata)

---

## 3. Typography: Inter / Roboto Mono
- **Primary Font:** `Inter` (Sans-serif) for all UI controls and body text.
- **Secondary Font:** `Roboto Mono` for data values, scores, and technical identifiers.

### Hierarchy
- **H1 (Display):** 32px, Bold, Tracking -0.05em.
- **H2 (Section):** 18px, Semibold, Tracking -0.02em, Uppercase for technical headers.
- **Body:** 14px, Regular, Leading 1.5.
- **Caption:** 11px, Medium, Tracking 0.05em, Uppercase.

---

## 4. Components & Layout Patterns

### Layout Shell
- **Side Navigation:** 256px width, fixed left. Uses `#0B0E11` with a `1px` right border.
- **Top Navigation:** 64px height, fixed top. Integrated search and profile actions.
- **Content Area:** Flexible grid with `24px` padding.

### Specialized UI Patterns
- **The "Swiss Cheese" Heatmap:**
  - Grid cells: `32px x 32px`.
  - Binary states: `bg-green-500/20` (Met) vs `bg-red-500/20` (Gap).
- **Spider Overlay (Radar Chart):**
  - Use `SVG` overlays with `stroke-width: 2` and `fill-opacity: 0.1`.
  - Toggle states via dotted (`stroke-dasharray`) vs solid lines.
- **Dreyfus Skill Checkboxes:**
  - Nested hierarchy: Level (01-05) -> Criterion.
  - Interactive state: Toggling lower levels must visually alert if higher levels are checked (Guttman Scale logic).

---

## 5. Interaction Design
- **Hover States:** Subtle background shift to `rgba(255,255,255,0.05)` and `transition-all duration-200`.
- **Loading/Broadcasting:** Pulse animation on primary buttons during active calibration sessions.
- **Bias Mitigation:** Disable "Manual Mark" slider (`pointer-events-none opacity-40`) until `>50%` of checklists are interacted with.

---

## 6. Implementation Notes for Agents
- **CSS Framework:** Tailwind CSS.
- **Icons:** Material Symbols (Outlined).
- **Rounding:** `ROUND_FOUR` (4px border-radius) for a sharp, technical feel.
- **Shadows:** No soft shadows; use `1px` solid borders for elevation.