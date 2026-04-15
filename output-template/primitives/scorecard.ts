// ---------------------------------------------------------------------------
// Selection Scorecard table (.sc) with category header rows.
// Reference: demo CSS ~L559-565.
// ---------------------------------------------------------------------------

export const scorecardCss = `
.sc {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 17px;
  font-style: normal;
  font-family: var(--sans);
  line-height: 1.7;
}
.sc th {
  text-align: left;
  font-size: 12px; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--txt3);
  padding: 8px 10px;
  border-bottom: 2px solid var(--ln);
}
.sc td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--ln);
  vertical-align: top;
}
.sc .cat {
  background: var(--bg2);
  font-weight: 700;
  color: var(--navy);
  font-size: 14px;
  padding: 10px;
  letter-spacing: .5px;
}
.sc .wt {
  text-align: center;
  font-weight: 600;
  color: var(--blue);
  font-family: var(--mono);
  font-size: 14px;
}
.sc tr:nth-child(even) td { background: rgba(245,241,234,.4); }
`
