// ---------------------------------------------------------------------------
// Aggregated client-side scripts, inlined into the published HTML as one
// <script> block at the end of <body>.
// ---------------------------------------------------------------------------

import { accordionScript } from './accordion'
import { progressBarScript } from './progressBar'
import { scrollAnimationsScript } from './scrollAnimations'

export const allScripts: string = [
  accordionScript,
  progressBarScript,
  scrollAnimationsScript,
].join('\n')
