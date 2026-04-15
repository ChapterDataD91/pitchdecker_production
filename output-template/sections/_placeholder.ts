// ---------------------------------------------------------------------------
// Shared "empty section" placeholder used by Phase-A stubs.
// Phase-B+ renderers will replace this with real content.
// ---------------------------------------------------------------------------

import { esc } from '../primitives/escape'

export function sectionPlaceholder(hint: string): string {
  return `<div class="ot-empty">${esc(hint)}</div>`
}
