// ---------------------------------------------------------------------------
// Placeholder avatar: renders initials in a circle when a photoUrl is absent.
// Matches .cand-initials from the demo.
// ---------------------------------------------------------------------------

import { esc, escAttr } from './escape'

export const initialsCss = `
.ot-initials {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bl);
  color: var(--blue);
  font-family: var(--mono);
  font-weight: 600;
  flex-shrink: 0;
}
.ot-initials--sq {
  border-radius: 4px;
}
.ot-initials--circle {
  border-radius: 50%;
}
`

function extractInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export interface InitialsOptions {
  name: string
  sizePx: number
  fontSizePx?: number
  shape?: 'circle' | 'square'
}

/**
 * Render an initials block.
 * If `photoUrl` is present, prefer renderAvatar() which falls back to this.
 */
export function renderInitials({
  name,
  sizePx,
  fontSizePx,
  shape = 'circle',
}: InitialsOptions): string {
  const fontSize = fontSizePx ?? Math.max(10, Math.round(sizePx / 3.5))
  const shapeClass = shape === 'square' ? 'ot-initials--sq' : 'ot-initials--circle'
  return `<span class="ot-initials ${shapeClass}" style="width:${sizePx}px;height:${sizePx}px;font-size:${fontSize}px" aria-label="${escAttr(name)}">${esc(extractInitials(name))}</span>`
}

/**
 * Render an <img> if photoUrl is provided, else fall back to initials.
 */
export function renderAvatar(opts: {
  name: string
  photoUrl?: string | null
  sizePx: number
  objectPosition?: string
  className?: string
  shape?: 'circle' | 'square'
}): string {
  const { name, photoUrl, sizePx, objectPosition, className, shape } = opts
  if (photoUrl && photoUrl.trim() !== '') {
    const radius = shape === 'square' ? '4px' : '50%'
    const position = objectPosition ? `object-position:${escAttr(objectPosition)};` : ''
    const cls = className ? ` class="${escAttr(className)}"` : ''
    return `<img${cls} src="${escAttr(photoUrl)}" alt="${escAttr(name)}" style="width:${sizePx}px;height:${sizePx}px;object-fit:cover;border-radius:${radius};${position}">`
  }
  return renderInitials({ name, sizePx, shape: shape ?? 'circle' })
}
