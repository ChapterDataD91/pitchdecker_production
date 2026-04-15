// ---------------------------------------------------------------------------
// Accordion shell primitive.
// Each deck section is rendered inside a .sec block: clickable header
// (number circle + title + chevron) and a body that expands/collapses.
// The toggle behavior lives in /scripts/accordion.ts (inlined at render time).
// ---------------------------------------------------------------------------

import { esc } from './escape'

export const accordionCss = `
.secs { padding: 0 0 60px; }

.sec {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity .7s ease, transform .7s ease;
  border-top: 1px solid var(--ln);
}
.sec:last-child { border-bottom: 1px solid var(--ln); }
.sec.visible { opacity: 1; transform: translateY(0); }
.sec.open { opacity: 1; transform: translateY(0); }

.sh {
  display: flex; align-items: center; justify-content: space-between;
  padding: 36px 0;
  cursor: pointer; user-select: none;
  transition: padding-left .25s;
}
.sh:hover { padding-left: 8px; }
.sh:hover .sn { background: var(--blue); color: #fff; }

.sl { display: flex; align-items: center; gap: 20px; }

.sn {
  font-family: var(--mono);
  font-size: 12px; font-weight: 600;
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: var(--bg2);
  color: var(--txt3);
  transition: all .4s;
  flex-shrink: 0;
}
.sec.open .sn {
  background: var(--blue);
  color: #fff;
  box-shadow: 0 2px 8px rgba(90,146,181,.3);
}

.st {
  font-family: var(--serif);
  font-size: 26px;
  color: var(--navy);
  letter-spacing: .01em;
}

.sv {
  width: 18px; height: 18px;
  transition: transform .35s cubic-bezier(.4,0,.2,1);
  color: var(--txt3);
  flex-shrink: 0;
}
.sec.open .sv { transform: rotate(180deg); color: var(--blue); }

.sb {
  max-height: 0;
  overflow: hidden;
  transition: max-height .55s cubic-bezier(.4,0,.2,1), padding .35s, opacity .3s;
  padding: 0 0 0 56px;
  font-size: 19px;
}
.sec:not(.open) .sb { opacity: 0; }
.sec.open .sb { opacity: 1; max-height: 12000px; padding: 8px 0 56px 56px; }

.sb p { font-size: 19px; color: var(--txt2); line-height: 1.8; margin-bottom: 20px; }

/* Empty-section placeholder (used when a Phase-A section renderer has no content yet) */
.sb .ot-empty {
  padding: 32px;
  background: var(--wh);
  border: 1px dashed var(--ln);
  border-radius: 10px;
  color: var(--txt3);
  font-family: var(--sans);
  font-size: 14px;
  text-align: center;
}

@media print {
  .sec { border: none !important; page-break-inside: avoid; }
  .sec .sb { display: block !important; max-height: none !important; padding: 0 !important; opacity: 1 !important; }
  .sec .sh { cursor: default; }
  .sv { display: none !important; }
  .sn { background: #eee !important; color: #333 !important; }
}

@media (max-width: 768px) {
  .secs { padding: 60px 0 40px; }
  .sh { padding: 20px 0; gap: 14px; }
  .sn { width: 34px; height: 34px; font-size: 11px; }
  .st { font-size: 20px; }
  .sb { padding-left: 0 !important; padding-top: 16px; }
}
`

/**
 * Wrap a rendered section body in the accordion shell.
 * First section can be marked open by default.
 */
export function renderAccordionSection(opts: {
  number: number
  title: string
  anchorId?: string
  open?: boolean
  body: string
}): string {
  const idAttr = opts.anchorId ? ` id="${esc(opts.anchorId)}"` : ''
  const openClass = opts.open ? ' open' : ''
  return `<div class="sec${openClass}"${idAttr}>
  <div class="sh">
    <div class="sl">
      <div class="sn">${esc(opts.number)}</div>
      <div class="st">${esc(opts.title)}</div>
    </div>
    <svg class="sv" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>
  </div>
  <div class="sb">${opts.body}</div>
</div>`
}
