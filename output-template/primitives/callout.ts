// ---------------------------------------------------------------------------
// Callout boxes: .bx (blue left-border), .gd (sand gradient), .cd (col card)
// Reference: demo CSS ~L134-140.
// ---------------------------------------------------------------------------

export const calloutCss = `
.lb {
  font-size: 13px; font-weight: 700;
  letter-spacing: 2.5px; text-transform: uppercase;
  color: var(--blue);
  margin: 36px 0 14px;
  font-family: var(--sans);
}
.lb:first-child { margin-top: 0; }

.bx {
  background: var(--wh);
  border-left: 3px solid var(--blue);
  padding: 24px 28px;
  margin: 24px 0;
  border-radius: 0 12px 12px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
  font-style: normal;
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.7;
}
.bx p {
  font-size: 15px !important;
  margin-bottom: 10px !important;
  font-family: var(--sans) !important;
}
.bx p:last-child { margin-bottom: 0 !important; }

.gd {
  background: linear-gradient(135deg, rgba(196,168,122,.07), rgba(196,168,122,.02));
  border: 1px solid rgba(196,168,122,.18);
  padding: 22px 26px;
  margin: 20px 0;
  border-radius: 10px;
}

.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 22px 0;
}
.cd {
  background: var(--wh);
  padding: 26px;
  border-radius: 10px;
  border: 1px solid var(--ln);
  font-family: var(--sans);
}
.cd h4 {
  font-family: var(--sans);
  font-size: 16px; font-weight: 600;
  color: var(--navy);
  margin-bottom: 14px;
}
.cd ul { list-style: none; padding: 0; margin: 0; }
.cd li {
  font-size: 15px; color: var(--txt2);
  padding: 6px 0 6px 18px;
  position: relative;
  line-height: 1.7;
  font-family: var(--sans);
}
.cd li::before {
  content: '';
  position: absolute;
  left: 0; top: 14px;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--blue);
}

@media (max-width: 768px) {
  .cols { grid-template-columns: 1fr; }
}
`
