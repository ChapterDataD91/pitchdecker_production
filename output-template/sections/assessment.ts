// ---------------------------------------------------------------------------
// Assessment section: assessor card + pillar callout (.bx) + process paragraph
// + purposes list + costs note + optional Sample Report CTA + optional MT
// assessment block.
// Reference: demo HTML L500-533.
//
// The renderer is provider-agnostic — `providerName` and `pillars` describe
// whatever instrument the firm uses (Hogan today, SHL/Korn Ferry tomorrow).
// Hogan-specific copy lives in the editor's "Apply Hogan template" preset.
// ---------------------------------------------------------------------------

import type {
  AssessmentSection,
  AssessmentPillar,
  AssessmentCta,
  AssessmentMtBlock,
} from '@/lib/types'
import type { Brand } from '../brand'
import { esc, escAttr } from '../primitives/escape'
import { renderAvatar } from '../primitives/initials'

function renderAssessorCard(data: AssessmentSection): string {
  const { assessor } = data
  if (!assessor.name.trim() && !assessor.bio.trim()) return ''

  const avatar = assessor.photoUrl?.trim()
    ? `<img src="${escAttr(assessor.photoUrl)}" alt="${escAttr(assessor.name)}" style="width:160px;height:200px;object-fit:cover;object-position:center 20%;border-radius:10px;flex-shrink:0">`
    : `<div style="width:160px;height:200px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,var(--bl),var(--bg2));display:flex;align-items:center;justify-content:center;color:var(--blue);font-family:var(--mono);font-size:42px;font-weight:600">${esc(getInitials(assessor.name))}</div>`

  return `<div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:24px">
  ${avatar}
  <div>
    <div style="font-family:var(--serif);font-size:19px;color:var(--navy);margin-bottom:2px">${esc(assessor.name)}</div>
    ${assessor.title.trim() ? `<div style="font-size:12px;font-weight:600;color:var(--blue);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;font-family:var(--sans)">${esc(assessor.title)}</div>` : ''}
    ${assessor.bio.trim() ? `<p style="font-size:14px">${esc(assessor.bio)}</p>` : ''}
  </div>
</div>`
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

function renderPillarBlock(pillars: readonly AssessmentPillar[]): string {
  if (pillars.length === 0) return ''
  const lines = pillars
    .map(
      (p) =>
        `<p><strong>${esc(p.label || p.key)}</strong> — ${esc(p.description)}</p>`,
    )
    .join('')
  return `<div class="bx">${lines}</div>`
}

function renderProcess(data: AssessmentSection): string {
  if (!data.processDescription.trim()) return ''
  return `<p>${esc(data.processDescription)}</p>`
}

function renderPurposes(data: AssessmentSection): string {
  if (data.purposes.length === 0) return ''
  const intro = `<p>Assessment results serve ${
    data.purposes.length === 2 ? 'two purposes' :
    data.purposes.length === 3 ? 'three purposes' :
    data.purposes.length === 4 ? 'four purposes' :
    `${data.purposes.length} purposes`
  }:</p>`
  const items = data.purposes.map((p) => `<li>${esc(p)}</li>`).join('')
  return `${intro}<ul>${items}</ul>`
}

function renderCostsNote(data: AssessmentSection): string {
  if (!data.costsNote.trim()) return ''
  return `<p>${esc(data.costsNote)}</p>`
}

function renderSampleReport(cta: AssessmentCta | null | undefined): string {
  if (!cta || !cta.url.trim() || !cta.label.trim()) return ''
  return `<div style="margin-top:28px;padding:20px 24px;background:rgba(90,146,181,.05);border-left:3px solid var(--blue);border-radius:0 8px 8px 0">
  <div style="font-size:12px;font-weight:600;color:var(--blue);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;font-family:var(--sans)">Sample Report</div>
  <p style="font-size:17px;margin-bottom:12px;font-family:var(--sans)">A standard assessment produces a comprehensive personality profile mapped against the competencies required for the role, resulting in an overall match percentage and targeted development recommendations.</p>
  <a href="${escAttr(cta.url)}" style="display:inline-flex;align-items:center;gap:8px;padding:12px 20px;background:rgba(90,146,181,.1);border:1px solid rgba(90,146,181,.3);border-radius:6px;font-size:17px;font-weight:600;color:var(--blue);text-decoration:none;transition:all .2s;font-family:var(--sans)"><span style="font-size:18px">&#9671;</span> ${esc(cta.label)}</a>
</div>`
}

function renderMtBlock(mt: AssessmentMtBlock | null | undefined, currency = 'EUR'): string {
  if (!mt || !mt.enabled) return ''

  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'USD' ? '$' : `${currency} `
  const formattedAmount =
    mt.amount > 0
      ? `${symbol}${mt.amount.toLocaleString('en-GB').replace(/,/g, '\u202F')}`
      : ''

  const description = mt.description.trim()
    ? `<p style="font-size:17px;margin-bottom:8px;font-family:var(--sans)">${esc(mt.description)}</p>`
    : ''

  const investmentLine = formattedAmount
    ? `<p style="font-size:17px;margin-bottom:14px;font-family:var(--sans)">The investment for a full management team assessment is <strong>${esc(formattedAmount)}</strong>.</p>`
    : ''

  const cta = mt.ctaUrl.trim() && mt.ctaLabel.trim()
    ? `<a href="${escAttr(mt.ctaUrl)}" style="display:inline-flex;align-items:center;gap:8px;padding:12px 20px;background:rgba(138,109,181,.08);border:1px solid rgba(138,109,181,.25);border-radius:6px;font-size:17px;font-weight:600;color:#8a6db5;text-decoration:none;transition:all .2s;font-family:var(--sans)"><span style="font-size:18px">&#9671;</span> ${esc(mt.ctaLabel)}</a>`
    : ''

  return `<div style="margin-top:24px;padding:20px 24px;background:rgba(196,168,122,.06);border-left:3px solid var(--sand);border-radius:0 8px 8px 0">
  <div style="font-size:12px;font-weight:600;color:var(--sand);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;font-family:var(--sans)">Optional: Management Team Assessment</div>
  ${description}
  ${investmentLine}
  ${cta}
</div>`
}

export function renderAssessment(data: AssessmentSection, _brand: Brand): string {
  // Suppress the avatar primitive's unused-import warning when no real content
  void renderAvatar

  const noContent =
    !data.assessor.name.trim() &&
    data.pillars.length === 0 &&
    !data.processDescription.trim() &&
    data.purposes.length === 0 &&
    !data.costsNote.trim()

  if (noContent) {
    return `<div class="ot-empty">No assessment details captured yet.</div>`
  }

  return `${renderAssessorCard(data)}
${renderPillarBlock(data.pillars)}
${renderProcess(data)}
${renderPurposes(data)}
${renderCostsNote(data)}
${renderSampleReport(data.sampleReport)}
${renderMtBlock(data.mtAssessment)}`
}
