# Frontend Design Layout Blueprint

This document defines a reusable format for creating frontend UI design systems and page layouts without hardcoding brand colors. Use it as a starter for any new product clone, landing page, dashboard, or app shell.

## 1) Design Foundation

### 1.1 Brand Intent
- Product personality: define 3 adjectives (example: calm, expert, premium).
- User mood target: what the user should feel in the first 5 seconds.
- Clarity target: what action should be obvious immediately.

### 1.2 Visual Direction
- Contrast style: low, medium, or high contrast.
- Shape style: soft (large radius), neutral, or sharp (small radius).
- Density: compact, balanced, or spacious.
- Motion style: subtle, expressive, or minimal.

## 2) Token System (No Fixed Colors)

Define semantic tokens first. Real colors are chosen later.

### 2.1 Core Color Roles
- `--color-bg`
- `--color-surface`
- `--color-surface-alt`
- `--color-border`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-accent`
- `--color-accent-hover`
- `--color-success`
- `--color-warning`
- `--color-danger`
- `--color-info`

### 2.2 Usage Rules
- Never use raw hex in components.
- Components only consume semantic tokens.
- State tokens (hover/focus/disabled) must be defined globally.
- Define contrast expectations for text-on-bg and text-on-accent.

## 3) Typography Blueprint

### 3.1 Font Roles
- Primary font: UI/body font.
- Display font: optional for hero/headlines.
- Mono font: optional for code/data.

### 3.2 Type Scale
- `--text-xs` for helper/meta labels.
- `--text-sm` for secondary content.
- `--text-base` for primary body text.
- `--text-lg` for emphasized body/subheads.
- `--text-xl` for section titles.
- `--text-2xl` for page headers.
- `--text-3xl` for hero statements.

### 3.3 Typography Rules
- Body line length target: 45-75 characters.
- Use consistent heading rhythm.
- Use one body font weight as default.
- Reserve bold weights for hierarchy, not decoration.

## 4) Spacing, Grid, and Layout

### 4.1 Spacing System
- Set one base unit (commonly 4px).
- Use only scale multiples (`1, 2, 3, 4, 6, 8, 10, 12...`).
- Keep section spacing larger than component spacing.

### 4.2 Grid Rules
- Mobile-first layout.
- Container widths:
  - Content container
  - Reading container
  - Wide dashboard container
- Column strategy:
  - 1 column on mobile
  - 2 columns at tablet breakpoint
  - 3-4 columns for desktop metrics/cards

### 4.3 Page Skeleton
- Sticky header (optional by product type).
- Hero or page-intro block.
- Primary action area.
- Supporting content blocks.
- Footer actions or secondary navigation.

## 5) Component Blueprint

### 5.1 Primitive Components
- Button: primary, secondary, ghost, danger.
- Input: text, textarea, select.
- Badge: info/state/context badges.
- Card: base container with border/background.
- Table/List item: dense and relaxed modes.

### 5.2 Component Contract
For each component define:
- Purpose
- Variants
- States (`default`, `hover`, `focus`, `active`, `disabled`, `loading`, `error`)
- Size options (`sm`, `md`, `lg`)
- Accessibility rules

## 6) Interaction and Motion

### 6.1 Motion Principles
- Motion should clarify structure, not distract.
- Prefer short transitions for micro-interactions.
- Use entrance motion for hierarchy reveal only.

### 6.2 Standard Motion Patterns
- Page enter/exit fade + slight translate.
- Stagger for card groups.
- Color/border transitions for hover/focus.
- Feedback states for async actions (loading/success/error).

### 6.3 Motion Safety
- Respect reduced motion preferences.
- Avoid layout-shifting animations on key content.

## 7) Responsive Blueprint

### 7.1 Breakpoint Behavior
- Mobile: single-column, action-first.
- Tablet: split content and controls.
- Desktop: full hierarchy with side-by-side sections.

### 7.2 Responsive Rules
- Prioritize readable typography before adding columns.
- Preserve touch target size across breakpoints.
- Keep primary CTA visible without excess scrolling.

## 8) Accessibility Blueprint

### 8.1 Core A11y Rules
- All interactive elements keyboard reachable.
- Visible focus style for all controls.
- Semantic heading order (`h1` to `h3+`).
- Form labels and error text associated correctly.

### 8.2 Content A11y Rules
- Avoid color-only meaning; add icon/text cue.
- Provide status messages for loading and errors.
- Keep link/button copy action-specific.

## 9) Page-Level Layout Templates

Use these as repeatable patterns.

### 9.1 Landing/Upload Page
- Intro band: headline, subhead, trust cue.
- Primary action block: upload/form/CTA.
- Process block: 3-step explanation.
- Social proof or waitlist block.

### 9.2 Report/Dashboard Page
- Header with context metadata.
- KPI row (3-6 cards).
- Secondary metrics row.
- Detail table or breakdown chart.
- Share/export actions.

### 9.3 Waitlist/Empty State Page
- Status icon/visual.
- Clear state message.
- Single action (email/form/back).
- Reassurance copy.

## 10) Implementation Format (Tailwind or CSS Variables)

### 10.1 Theme Layer
- Put semantic tokens in a single theme file.
- Map framework theme keys to semantic tokens.
- Keep typography and radius tokens centralized.

### 10.2 Utility and Component Layers
- Utility classes for spacing/layout only.
- Component styles own semantic meaning and states.
- Avoid page-specific hacks inside shared components.

## 11) Quality Checklist

Before shipping, confirm:
- No hardcoded raw colors in components.
- Visual hierarchy is clear in 3 seconds.
- CTA is obvious on mobile and desktop.
- Focus states exist and are visible.
- Empty/loading/error states are designed.
- Spacing rhythm is consistent across pages.
- Typography scale is used consistently.

## 12) Handoff Template (Fill Per Project)

Use this short template at project start:

```md
Project:
Audience:
Primary action:
Visual tone (3 words):
Density:
Motion level:

Typography:
- Primary font:
- Display font:
- Scale choice:

Token mapping:
- background:
- surface:
- text primary:
- text secondary:
- accent:
- status colors:

Core layouts:
- Page 1:
- Page 2:
- Page 3:

Core components:
- Buttons:
- Inputs:
- Cards:
- Tables/Lists:

Accessibility notes:
Responsive notes:
```

