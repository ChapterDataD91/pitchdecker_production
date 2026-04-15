// ---------------------------------------------------------------------------
// HTML escaping for user-supplied strings.
// All section/primitive renderers MUST route untrusted text through `esc`.
// ---------------------------------------------------------------------------

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch] ?? ch)
}

/** Multi-line text → paragraphs. Escapes each line. */
export function escMultiline(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .split(/\n{2,}/)
    .map((block) => `<p>${esc(block.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/** Safe attribute value (for href, src, alt). */
export function escAttr(value: string | null | undefined): string {
  return esc(value ?? '')
}
