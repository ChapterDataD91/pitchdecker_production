// ---------------------------------------------------------------------------
// Primitive barrel.
// Aggregates CSS from all primitive modules into one string that the render
// pipeline concatenates into the output's <style> block.
// ---------------------------------------------------------------------------

import { accordionCss } from './accordion'
import { calloutCss } from './callout'
import { candidateCardCss } from './candidateCard'
import { heroCss } from './hero'
import { initialsCss } from './initials'
import { personCardCss } from './personCard'
import { personaCardCss } from './personaCard'
import { scoreBarCss } from './scoreBar'
import { scorecardCss } from './scorecard'
import { tableCss } from './table'
import { timelineCss } from './timelineItem'

export const primitivesCss: string = [
  heroCss,
  accordionCss,
  calloutCss,
  personCardCss,
  tableCss,
  timelineCss,
  scoreBarCss,
  personaCardCss,
  scorecardCss,
  candidateCardCss,
  initialsCss,
].join('\n')

export { renderHero, renderIntroSection, renderConfidentialityBar, renderFooter } from './hero'
export { renderAccordionSection } from './accordion'
export { renderInitials, renderAvatar } from './initials'
export { esc, escAttr, escMultiline } from './escape'
