---
name: section-editor
description: >
  Reference for building section editors in the pitch deck authoring tool.
  Use when creating or modifying any of the 11 deck section editors. Covers
  the interaction patterns, component structure, and state management for
  each section type.
---

# Section Editor Patterns

The editor uses a sidebar + content layout. The sidebar lists all 11 sections;
clicking one shows its editor in the content area. Each section uses one of
these editor patterns:

## Database Picker (Team, Credentials)
- Content area shows selected items as cards/chips
- "+" button opens a slide-out panel (portal-based)
- Slide-out has search/filter, browsable list, click-to-add
- Selected items removable via X button on cards
- Drag-to-reorder within the section

## Structured Input (Search Profile, Scorecard)
- Categorized lists (must-haves, nice-to-haves, etc.)
- Each item: text field + weight selector (1-5)
- "+ Add criterion" button per category
- Drag-to-reorder within categories
- Can move items between categories
- Optional: AI-suggest button ("Based on similar searches...")

## Upload + Enrichment (Sample Candidates)
- "+ Add candidate" with options: Upload CV, Paste LinkedIn URL, Manual
- Upload triggers parsing → pre-fills fields → consultant reviews/edits
- Each candidate becomes a card: photo, name, role, summary, scores
- Scores tie back to Scorecard criteria
- Ranking: auto from score, drag to override

## Template-Based (Process & Timeline, Assessment)
- Start from a template (e.g., 12-week standard timeline)
- Edit inline: adjust dates, descriptions, phases
- Add/remove items from the template
- Visual representation (horizontal timeline, methodology cards)

## Simple Form (Salary, Fee Proposal, Cover)
- Standard form fields with labels
- Optional: market benchmark lookup (async, three-dot loading)
- Auto-populated stats from other sections
- Rich text areas for longer content (intro paragraphs)

## Shared Patterns Across All Sections
- Each section editor receives data as props + onChange callback
- Auto-save with status indicator ("Saved" / "Saving...")
- Completion tracking: sidebar shows completion per section
- Sidebar navigation controls which section is active
