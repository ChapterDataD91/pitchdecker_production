// ---------------------------------------------------------------------------
// Process & Timeline section: header sentence + vertical timeline + trailing
// confidentiality .gd block.
//
// Active phases get a numbered .td badge and contribute to the running week
// counter. Holiday phases render as a dashed-left placeholder (no badge,
// faded copy) and are excluded from the week counter so derived ranges stay
// accurate even when a holiday spans active weeks.
//
// Reference: demo HTML L479-489.
// ---------------------------------------------------------------------------

import type { TimelineSection, TimelinePhase } from '@/lib/types'
import type { Brand } from '../brand'
import { esc } from '../primitives/escape'

interface NumberedPhase {
  phase: TimelinePhase
  badgeNumber: number | null // null for holidays
  weekStart: number // 1-indexed; 0 if unknown
  weekEnd: number
}

function computePhaseSchedule(
  phases: readonly TimelinePhase[],
): NumberedPhase[] {
  const sorted = [...phases].sort((a, b) => a.order - b.order)
  let activeCounter = 0
  let weekCursor = 1
  return sorted.map((phase) => {
    const isHoliday = phase.kind === 'holiday'
    const duration = Math.max(0, phase.durationWeeks)
    if (isHoliday) {
      return { phase, badgeNumber: null, weekStart: 0, weekEnd: 0 }
    }
    activeCounter += 1
    const weekStart = weekCursor
    const weekEnd = duration > 0 ? weekCursor + duration - 1 : weekCursor
    weekCursor = weekEnd + 1
    return { phase, badgeNumber: activeCounter, weekStart, weekEnd }
  })
}

function deriveWeekRange(np: NumberedPhase): string {
  const { phase, weekStart, weekEnd } = np
  if (phase.weekRangeLabel?.trim()) return phase.weekRangeLabel.trim()
  if (weekStart === 0) return ''
  if (weekStart === weekEnd) return `Week ${weekStart}`
  return `Weeks ${weekStart}–${weekEnd}`
}

function renderActivePhase(np: NumberedPhase): string {
  const range = deriveWeekRange(np)
  const titleParts = [esc(np.phase.name)]
  if (range) titleParts.push(`— ${esc(range)}`)
  return `<div class="ti">
  <div class="td">${esc(np.badgeNumber ?? '')}</div>
  <div class="tb2">
    <strong>${titleParts.join(' ')}</strong>
    <span>${esc(np.phase.description)}</span>
  </div>
</div>`
}

function renderHolidayPhase(np: NumberedPhase): string {
  const range = np.phase.weekRangeLabel?.trim()
  const titleParts = [esc(np.phase.name)]
  if (range) titleParts.push(`(${esc(range)})`)
  return `<div class="ti ti--holiday">
  <div class="tb2">
    <strong style="color:var(--txt3)">${titleParts.join(' ')}</strong>
    <span style="color:var(--txt3)">${esc(np.phase.description)}</span>
  </div>
</div>`
}

function renderHeader(data: TimelineSection): string {
  if (data.totalWeeks <= 0) return ''
  const weekWord = data.totalWeeks === 1 ? 'week' : 'weeks'
  return `<p>Total timeline: <strong>${esc(data.totalWeeks)} working ${esc(weekWord)}</strong>.</p>`
}

function renderConfidentialityBlock(data: TimelineSection): string {
  const note = data.confidentialityNote?.trim()
  if (!note) return ''
  return `<div class="gd"><p>${esc(note)}</p></div>`
}

export function renderTimeline(data: TimelineSection, _brand: Brand): string {
  if (data.phases.length === 0) {
    return `<div class="ot-empty">No timeline phases added yet.</div>`
  }

  const schedule = computePhaseSchedule(data.phases)
  const items = schedule
    .map((np) =>
      np.phase.kind === 'holiday' ? renderHolidayPhase(np) : renderActivePhase(np),
    )
    .join('\n')

  return `${renderHeader(data)}
<div class="tl">${items}</div>
${renderConfidentialityBlock(data)}`
}
