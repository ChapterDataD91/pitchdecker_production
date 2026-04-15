// ---------------------------------------------------------------------------
// Generic data table (.tb) for Credentials + generic lists.
// Reference: demo CSS ~L146-155.
// ---------------------------------------------------------------------------

export const tableCss = `
.tb {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 15px;
  font-family: var(--sans);
}
.tb th {
  text-align: left;
  font-size: 10px; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--txt3);
  padding: 10px 14px;
  border-bottom: 2px solid var(--ln);
}
.tb td {
  padding: 14px;
  border-bottom: 1px solid var(--ln);
  vertical-align: middle;
}
.tb tr:hover td { background: rgba(90,146,181,.06); transition: background .2s; }
.tb tbody tr:nth-child(even) td { background: rgba(245,241,234,.5); }
.tb .tr { font-weight: 600; color: var(--navy); }
.tb .tco { color: var(--blue); font-weight: 500; font-size: 15px; }
.tb .tco a { color: var(--blue); text-decoration: none; }
.tb .tco a:hover { text-decoration: underline; }
.ts { font-family: var(--mono); font-size: 13px; }

.tg {
  display: inline-block;
  font-size: 9.5px; font-weight: 600;
  letter-spacing: 1px; text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 3px;
  white-space: nowrap;
}
.t1 { background: #daf0ea; color: #1a6b5a; }
.t2 { background: #d4e8f2; color: #2e5d8b; }
.t3 { background: #f0e4d4; color: #8b5a2e; }

@media (max-width: 768px) {
  .tb { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
}
`
