// ---------------------------------------------------------------------------
// Public barrel for the output-template module.
//
// The rest of the app MUST import from `@/output-template` only — not from
// internal paths. This is enforced by ESLint `no-restricted-imports`.
//
// Nothing inside this folder may import from `@/components`, `@/app`,
// `@/lib/theme`, or Tailwind / next/font. Only `@/lib/types` is allowed.
// ---------------------------------------------------------------------------

export { renderDeck } from './render'
export type {
  RenderResult,
  RenderedCandidate,
  RenderOptions,
} from './render'
export { brand } from './brand'
export type { Brand } from './brand'
