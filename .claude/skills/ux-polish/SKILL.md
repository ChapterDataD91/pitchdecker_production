---
name: ux-polish
description: >
  UX interaction philosophy inspired by Notion, Craft, and Apple.
  Invoke when building or reviewing any component to ensure it feels
  premium, responsive, and intentional. Covers motion, transitions,
  hover behavior, empty states, editing patterns, keyboard nav, and
  micro-interactions.
---

# UX Polish — Interaction Philosophy

This skill defines HOW things should feel, not what they look like.
The design-system skill handles tokens and specs. This skill handles soul.

Reference products: Notion, Craft, Apple. The common thread: every
interaction feels intentional. Nothing is accidental. Nothing is lazy.

---

## Core Principles

1. **Content is king** — UI chrome fades away; the user's content is the
   loudest thing on screen. Controls appear when needed, hide when not.
2. **Instant response** — Every click, keystroke, and hover produces an
   immediate visible reaction. Perceived latency kills trust.
3. **Progressive disclosure** — Show the simple thing first. Reveal
   complexity on hover, click, or when the user is ready.
4. **Spatial consistency** — Elements don't teleport. Things slide from
   where they came from and return to where they belong.
5. **Quiet confidence** — No exclamation marks in the UI. No "Wow, great
   job!" confirmation dialogs. The tool is calm and competent.

---

## Motion & Animation

### Philosophy
Motion should feel like physics, not decoration. Things have weight and
momentum. Nothing pops in from nowhere.

### Rules
- **Enter**: Elements fade in (opacity 0 -> 1) AND slide from their
  origin direction. A sidebar panel slides from left. A dropdown falls
  from its trigger. A modal scales from 0.97 -> 1 with fade.
- **Exit**: Reverse the enter animation but 30% faster. Closing should
  feel snappier than opening.
- **Micro-interactions** (hover, toggle, badge count): 120-150ms.
  Instant enough to feel connected, slow enough to be perceived.
- **Layout shifts** (section swap, panel open): 200-250ms.
  Quick but trackable by the eye.
- **Overlays** (modals, slide-outs, full transitions): 280-350ms.
  Slow enough to orient the user spatially.
- **Easing**: Always ease-out for enters (fast start, gentle land).
  Use `cubic-bezier(0.16, 1, 0.3, 1)` as default — it has a slight
  spring feel without being bouncy.
- **Never animate on scroll** unless it's a parallax-like subtle shift.
  Scroll-triggered animations feel like a marketing site, not a tool.
- **Stagger children** when a group appears: 30-50ms delay between items.
  Makes lists feel like they "pour in" rather than flash.
- **Drag animations**: Item lifts with subtle scale (1.02) and shadow
  increase. Drop target highlights with a soft border pulse. On drop,
  item settles with a gentle ease (like placing something on a desk).

### Framer Motion defaults
```tsx
// Standard enter
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}

// Slide-out panel
initial={{ x: '100%' }}
animate={{ x: 0 }}
exit={{ x: '100%' }}
transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}

// Modal
initial={{ opacity: 0, scale: 0.97 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.97 }}
transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}

// List stagger
<motion.div variants={{ show: { transition: { staggerChildren: 0.04 } } }}>

// Drag lift
whileDrag={{ scale: 1.02, boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}
```

---

## Hover & Interactive States

### Philosophy
Hover is a conversation. The interface whispers "you can interact with me"
before the user commits. Every interactive element must have a hover state.

### Patterns
- **Buttons**: Background darkens (primary) or appears (ghost). Transition
  on background-color, not opacity. Subtle transform: `translateY(-0.5px)`
  on hover for a micro-lift feeling.
- **Cards/rows**: Background shifts to `bg-hover` (#F0F0F0). If the card
  has a shadow, shadow increases one level. Never change border on hover
  alone — it causes layout shift.
- **Text links**: Underline appears on hover (not permanently visible).
  Color shifts to accent-hover.
- **Icon buttons**: Background circle/rounded-rect appears behind the icon
  on hover. The icon itself doesn't change size.
- **Destructive actions**: On hover, shift to red tones gently. Don't
  flash red — ease into it.
- **Hidden controls**: Toolbar buttons, row actions, "more" menus — these
  appear on parent hover with a quick fade (120ms). They occupy their
  space invisibly (not display:none, use opacity:0) so the layout doesn't
  jump when they appear.
- **Focus states**: Visible focus ring (2px accent blue, 2px offset) for
  keyboard navigation. Only show on `:focus-visible`, not `:focus`, so
  mouse clicks don't trigger the ring.
- **Active/pressed**: Slight scale-down (`scale: 0.98`) for buttons. The
  button visually "pushes in" like a physical button.

---

## Content Editing

### Philosophy
Editing should feel like writing on paper with superpowers. The user is
never in "edit mode" vs "view mode" — the content IS the interface.

### Patterns
- **Inline editing**: Click text to edit it directly. No separate edit
  dialog or modal for simple text fields. The text element transforms
  into an input with the same font, size, and position — seamless swap.
- **Click-to-edit fields**: Show a subtle dashed bottom border or slight
  background shift on hover to indicate editability. On click, the field
  gains a clean border and focus ring. On blur, it saves and returns to
  display mode.
- **Auto-growing textareas**: Never show a scrollbar inside a textarea.
  It grows with content. Max-height with scroll only for truly unbounded
  content.
- **Placeholder text**: Helpful and specific, not generic. "Add a brief
  description of the ideal candidate..." not "Enter text here".
  Placeholders disappear on focus, not on first keystroke.
- **Auto-save**: Every change triggers a debounced save (800ms after last
  keystroke). Show "Saving..." briefly, then "Saved" that fades after 2s.
  Never show a save button. The user should forget saving exists.
- **Undo**: Cmd+Z works everywhere. Every meaningful change is undoable.
  Toast with "Undo" action appears after destructive operations (delete
  item, clear field, remove team member).

---

## Empty States

### Philosophy
An empty state is an invitation, not an error. It should make the user
feel excited to fill it, not confused about why it's empty.

### Rules
- Every list, every section, every panel needs a designed empty state.
  A blank white void is never acceptable.
- Structure: subtle icon (24-32px, tertiary color) + short title +
  one-line description + primary action button.
- The tone is helpful and direct: "No team members yet" + "Add the
  consultants working on this search" + [Add Team Member] button.
- Empty states for OPTIONAL sections should not feel like something is
  broken. Use language like "You can add..." not "Missing..." or "No...".
- If the section can be auto-populated (e.g., from AI), mention it:
  "Upload a job description and we'll extract key criteria."
- Empty table/list: show the header row/structure even when empty.
  The skeleton communicates what will eventually live there.

---

## Loading States

### Philosophy
The interface should never feel frozen. If something takes time, show
motion. If something is instant, don't fake a loading state.

### Patterns
- **< 200ms**: No loading indicator. Just show the result.
- **200ms - 1s**: Subtle pulse animation on the target area, or the
  content area dims to 60% opacity with the LoadingDots component.
- **> 1s**: Full skeleton screen matching the shape of expected content.
  Skeletons have a subtle shimmer animation (left-to-right gradient).
- **Never block the full page** for a section-level load. The sidebar,
  topbar, and other sections remain interactive.
- **Optimistic updates**: For actions like reordering, toggling, or
  simple edits — update the UI immediately and reconcile with the server
  in the background. Only show an error if the server rejects.
- **Progress indicators**: For multi-step processes (file upload, AI
  analysis), show a determinate progress bar or step indicator, not
  a spinner.

---

## Keyboard & Navigation

### Philosophy
Power users live on the keyboard. The mouse is optional for common
operations. Keyboard navigation should be discoverable but not intrusive.

### Patterns
- **Tab order**: Logical flow through the content. Tab through form
  fields within a section. Tab should not jump to the sidebar.
- **Arrow keys**: Navigate lists and grids. Up/down for vertical lists,
  left/right for horizontal groups or tabs.
- **Escape**: Always closes the nearest overlay (modal, slide-out,
  dropdown). If nothing is open, Escape deselects / returns focus to
  the main content.
- **Enter**: Confirms the primary action. In a list, Enter activates
  the selected item.
- **Cmd+S**: Even though we auto-save, intercept Cmd+S to trigger an
  immediate save and show the "Saved" indicator. Don't let the browser
  "Save As" dialog appear.
- **Shortcuts bar**: Don't build a shortcuts modal yet — but structure
  actions so they CAN have shortcuts later. Every significant action
  should be a callable function, not inline logic.

---

## Transitions Between Views

### Philosophy
View transitions should maintain spatial orientation. The user should
always know where they are and how they got there.

### Patterns
- **Section switching** (sidebar navigation): Content area crossfades
  with a subtle vertical shift. New section fades in from bottom (y: 8px)
  as old section fades out. Never hard-cut.
- **Slide-out panels** (team picker, credential browser): Panel slides
  from the right edge. Background content dims slightly (overlay at 10%
  black). Panel pushes nothing — it overlays.
- **Drill-in** (list item -> detail): Content slides left, detail slides
  in from right. Back action reverses direction. Maintains the mental
  model of a spatial stack.
- **Modal dialogs**: Backdrop fades in (150ms). Modal scales from 0.97
  and fades in (200ms). Keep modals rare — they break flow.
- **Page transitions** (dashboard -> editor): Full crossfade with the
  new page sliding up subtly. Keep the topbar stable as an anchor.

---

## Scroll Behavior

- **Sticky headers**: Section headers stick to the top of the scroll
  area. They get a subtle bottom border and slight shadow when pinned.
- **Scroll areas**: Custom scrollbar styling — thin (6px), rounded,
  grey track. Only visible on hover or while scrolling (macOS style).
- **No infinite scroll** in the editor. Paginate or load-more if lists
  are long. The user needs to feel the boundaries of their content.
- **Restore scroll position** when returning to a section. If the user
  scrolled down in the Candidates section, switched to Cover, and came
  back — they should be where they left off.

---

## Error Handling

- **Inline validation**: Show errors next to the field, not in a toast.
  Red border + error text below the field. Appear on blur, not on every
  keystroke.
- **Toast for system errors**: Network failures, server errors — these
  get a toast with a retry action. "Couldn't save changes. [Retry]"
- **Never show raw error messages** to the user. "Something went wrong"
  with a retry button is always better than a stack trace.
- **Recoverable errors**: If a save fails, keep the user's input. Never
  clear a form on error. The user's work is sacred.
- **Destructive confirmation**: Before deleting something significant
  (a candidate, a team member), show a confirmation dialog. For
  lightweight items (a tag, a single criterion), use an undo toast.

---

## The Polish Checklist

When building or reviewing any component, verify:

- [ ] Every interactive element has hover, focus-visible, and active states
- [ ] Transitions use the standard easing curve, not linear or ease-in
- [ ] Empty state exists and is helpful, not just "No items"
- [ ] Loading state exists and is proportional to expected wait time
- [ ] Error state exists and preserves user input
- [ ] Hidden controls appear on hover, not always visible
- [ ] Text is editable inline where possible, not via modals
- [ ] Auto-save works — no save button needed
- [ ] Keyboard navigation works for core flows
- [ ] Scroll position is preserved across view switches
- [ ] Animations are < 350ms (nothing feels sluggish)
- [ ] No layout shift — elements don't jump when state changes
- [ ] Focus management: opening a panel moves focus into it,
      closing it returns focus to the trigger
