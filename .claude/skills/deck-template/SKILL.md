---
name: deck-template
description: >
  Reference for the client-facing pitch deck output template. The template
  uses the Top of Minds huisstijl (brand guide) — different fonts and colors
  from the editor UI. This skill is for Phase 3 when the output template
  is built. See huisstijl-reference.md for the full brand guide.
---

# Deck Output Template

## Overview
The client-facing output is a separate HTML/CSS template from the editor UI.
It uses the Top of Minds huisstijl (brand guide) which has different fonts
and colors from the editor.

## Key Differences from Editor UI
| Aspect | Editor UI | Client Output |
|--------|-----------|---------------|
| Heading font | Playfair Display | coranto-2 (Adobe Fonts) |
| Body font | DM Sans | Barlow (Google Fonts) |
| Mono font | JetBrains Mono | Roboto Mono (Google Fonts) |
| Primary color | #1A1A2E (deep navy) | #2A384E (navy) |
| Accent | #2E5E8C (teal-blue) | #B9D9EB (light blue) |
| Background | #F5F0EB (warm cream) | #F5F5EF (cream) |
| Border radius | Rounded (16px cards) | No border-radius (sharp edges) |
| Borders | Warm borders | No borders on elements |

## Implementation (Phase 3)
See huisstijl-reference.md in this directory for the complete brand guide
including typography rules, component styles, animation definitions, and
responsive breakpoints.

The template is 90% fixed HTML/CSS with content slots. The LLM generates
content that fills the slots — it never touches styling.
