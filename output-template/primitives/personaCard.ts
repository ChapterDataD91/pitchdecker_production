// ---------------------------------------------------------------------------
// Persona card (.pr) used in Personas section.
// Reference: demo CSS ~L165-168.
// ---------------------------------------------------------------------------

export const personaCardCss = `
.pr {
  background: var(--wh);
  border: 1px solid var(--ln);
  border-radius: 12px;
  padding: 28px;
  margin: 16px 0;
  transition: border-color .2s, box-shadow .2s;
}
.pr:hover {
  border-color: var(--blue);
  box-shadow: 0 4px 16px rgba(90,146,181,.06);
  border-left: 3px solid var(--blue);
}
.ph { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.pn {
  font-size: 18px;
  font-family: var(--serif);
  font-weight: 700;
  color: var(--navy);
}

/* Pool-size badge */
.pool-badge {
  display: inline-block;
  font-size: 11px; font-weight: 600;
  padding: 3px 10px;
  border-radius: 3px;
  margin-right: 6px;
  letter-spacing: .5px;
  font-family: var(--sans);
}
.pool-narrow { background: rgba(196,106,74,.1); color: #c4694a; }
.pool-moderate { background: rgba(196,168,122,.15); color: #8b6d2e; }
.pool-strong { background: rgba(42,157,143,.1); color: #1a6b5a; }
`
