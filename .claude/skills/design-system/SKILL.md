---
name: design-system
description: >
  Design tokens, typography, colors, spacing, and shared component specs
  for the pitch deck authoring tool. Reference when styling any component
  or creating new UI elements.
---

# Design System

## Aesthetic

Clean, modern, Notion-inspired. White backgrounds, geometric sans-serif
typography, blue accent, subtle borders. No cream, no warm greys, no
serif fonts. Think Notion meets Linear — calm, spacious, precise.

## Color Tokens

All colors defined in `globals.css` @theme block and mirrored in `lib/theme.ts`.

### Background
- --color-bg: #FFFFFF (White — main background)
- --color-bg-subtle: #FAFAFA (Off-white — subtle alternate sections)
- --color-bg-muted: #F5F5F5 (Light grey — muted areas, sidebar)
- --color-bg-hover: #F0F0F0 (Hover state background)
- --color-bg-active: #E8F0FE (Active/selected state — blue tint)

### Text
- --color-text: #111827 (Near-black — headings, primary text)
- --color-text-secondary: #6B7280 (Cool grey — secondary text, descriptions)
- --color-text-tertiary: #9CA3AF (Light grey — hints, metadata)
- --color-text-placeholder: #D1D5DB (Placeholder text in inputs)

### Borders
- --color-border: #E5E7EB (Default border — cards, dividers)
- --color-border-subtle: #F3F4F6 (Very subtle separator)
- --color-border-strong: #D1D5DB (Emphasized border — hover, focus)
- --color-border-dashed: #D1D5DB (Dashed dividers, drop zones)

### Accent (blue)
- --color-accent: #2563EB (Primary blue — links, buttons, active states)
- --color-accent-hover: #1D4ED8 (Darker blue — hover on accent elements)
- --color-accent-light: #EFF6FF (Light blue — hover backgrounds, subtle fills)
- --color-accent-muted: #DBEAFE (Blue tint — selection highlight, badges)

### Status colors
- --color-success: #059669 (Green — completion, saved, valid)
- --color-success-light: #ECFDF5 (Green bg — success badges)
- --color-warning: #D97706 (Amber — warnings, attention needed)
- --color-warning-light: #FFFBEB (Amber bg — warning badges)
- --color-error: #DC2626 (Red — errors, validation failures)
- --color-error-light: #FEF2F2 (Red bg — error badges)

### Functional colors (tags, categories, grouping)
Each has a bg (light fill) + fg (text/icon on that fill) pair.

- Sand — default/neutral tags: bg #F5F0EB, fg #78716C
- Sage — health, sustainability, completion: bg #ECFDF5, fg #047857
- Rose — people, HR, leadership: bg #FFF1F2, fg #BE123C
- Lilac — technology, innovation, digital: bg #F3F0FF, fg #6D28D9
- Slate — finance, operations, infrastructure: bg #F1F5F9, fg #475569
- Sienna — industry, manufacturing, PE: bg #FEF3C7, fg #92400E
- Teal — active, selected, primary grouping: bg #F0FDFA, fg #0F766E
- Copper — premium, featured, highlight: bg #FFF7ED, fg #C2410C

### Usage mapping
| Context | Color | Why |
|---------|-------|-----|
| Expertise tags (team members) | Functional set | Each area gets a consistent color |
| Section completion badge | Success (green) | Universally understood |
| Active sidebar section | Accent (blue) | Primary interactive color |
| Score weights (1-5) | Accent blue scale | Intensity = depth |
| Credential axis grouping | Functional set (mapped per axis) | Visual grouping |
| Candidate archetype tags | Functional set (mapped per archetype) | Differentiation |
| Draft/incomplete states | Text tertiary (light grey) | Muted |
| Featured/highlighted items | Copper or accent | Emphasis |

## Typography
- All text: Inter (geometric sans-serif, loaded via next/font)
- Headings: Inter semibold/bold (font-semibold / font-bold)
- Body: Inter regular (font-normal)
- Mono: SF Mono, Fira Code, or similar (for code/technical content)
- Scale: 0.75rem / 0.8125rem / 0.875rem / 1rem / 1.125rem / 1.5rem / 1.875rem

## Spacing
- Follow Tailwind default scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64
- Section padding: 24px horizontal, 20px vertical (inside content area)
- Card gap: 12px between items, 16px between groups
- Page margins: 32px on desktop, 16px on tablet

## Border Radius
- XS: 4px (radius-xs) — small badges, inline elements
- SM: 6px (radius-sm) — tags, small buttons
- MD: 8px (radius-md) — cards, inputs
- LG: 10px (radius-lg) — buttons, panels
- XL: 12px (radius-xl) — modals, large cards

## Shadows
- XS: 0 1px 2px rgba(0,0,0,0.05) — subtle lift
- SM: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04) — cards at rest
- MD: 0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04) — cards on hover
- LG: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04) — panels
- Overlay: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.06) — modals

## Animation Curves
- Content transitions: cubic-bezier(0.16, 1, 0.3, 1) — spring-like
- Slide-out: cubic-bezier(0.32, 0.72, 0, 1) — smooth ease-out
- Fade: cubic-bezier(0.4, 0, 0.2, 1) — standard ease
- Duration: 150ms for micro-interactions, 200ms for layout changes, 300ms for overlays

## Shared Components
- Sidebar: fixed left panel with section navigation and completion indicators
- SectionHeader: section title + description in the content area
- PersonCard: photo + name + title + tags (used for team and candidates)
- Badge: colored tag with text (for expertise areas, archetypes)
- ScoreIndicator: visual weight display (1-5 dots or bar)
- SlideOutPanel: right-aligned overlay with search + list
- Toast: bottom-center notification with auto-dismiss
- ProgressBar: overall deck completion in sidebar
- EmptyState: reusable empty state with icon, title, description, action
- LoadingDots: three pulsing dots for async operations
