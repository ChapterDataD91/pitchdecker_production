// ---------------------------------------------------------------------------
// Timeline primitives (.tl container + .ti items + .td dot).
// Reference: demo CSS ~L157-163.
// ---------------------------------------------------------------------------

export const timelineCss = `
.tl { margin: 28px 0; position: relative; }
.tl::before {
  content: '';
  position: absolute;
  left: 18px; top: 10px; bottom: 10px;
  width: 2px;
  background: var(--ln);
}
.ti { display: flex; gap: 22px; padding: 16px 0; position: relative; }
.ti--holiday {
  opacity: .45;
  margin-left: 17px;
  padding-left: 40px;
  border-left: 2px dashed var(--ln);
}
.td {
  width: 38px; height: 38px;
  border-radius: 50%;
  background: var(--wh);
  border: 2px solid var(--blue);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--mono);
  font-size: 12px; font-weight: 600;
  color: var(--blue);
  flex-shrink: 0;
  position: relative; z-index: 1;
}
.tb2 { padding-top: 7px; }
.tb2 strong {
  font-size: 15px;
  color: var(--navy);
  display: block;
  margin-bottom: 4px;
  font-family: var(--sans);
}
.tb2 span {
  font-size: 15px;
  color: var(--txt3);
  line-height: 1.7;
  font-family: var(--sans);
}
`
