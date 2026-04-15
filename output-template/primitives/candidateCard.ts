// ---------------------------------------------------------------------------
// Candidate grid + individual .cand-card styling.
// Reference: demo CSS ~L617-649.
// ---------------------------------------------------------------------------

export const candidateCardCss = `
.cand {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin: 24px 0;
}
@media (max-width: 600px) {
  .cand { grid-template-columns: 1fr; }
}

.cand-card {
  background: var(--wh);
  border-radius: 12px;
  border: 1px solid var(--ln);
  padding: 20px 20px 38px;
  text-align: left;
  transition: all .3s;
  cursor: pointer;
  position: relative;
  text-decoration: none;
  color: inherit;
  display: block;
}
.cand-card::after {
  content: 'View profile →';
  position: absolute; bottom: 12px; left: 20px; right: 0;
  text-align: left;
  font-size: 11px; font-weight: 500;
  color: var(--blue);
  opacity: 0;
  transition: opacity .3s;
  letter-spacing: .5px;
  font-family: var(--sans);
}
.cand-card:hover::after { opacity: 1; }
.cand-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(22,45,70,.1);
  border-color: var(--blue);
}
.cand-card.top3 { border-left: 3px solid var(--blue); }

.cand-rank {
  position: absolute; top: 10px; left: 10px;
  width: 26px; height: 26px;
  border-radius: 50%;
  background: var(--navy);
  color: #fff;
  font-family: var(--mono);
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.cand-header {
  display: flex; align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}
.cand-header-info { display: flex; flex-direction: column; gap: 4px; }
.cand-badge {
  display: inline-block;
  font-size: 9px; letter-spacing: 1px; text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
  font-family: var(--sans);
}

.cand-initials-lg {
  width: 72px; height: 72px;
  border-radius: 50%;
  background: var(--bl);
  color: var(--blue);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--mono);
  font-size: 18px; font-weight: 600;
  flex-shrink: 0;
  object-fit: cover;
}

.cand-score {
  font-family: var(--mono);
  font-size: 28px; font-weight: 700;
  margin: 8px 0 4px;
  text-align: left;
  color: var(--blue);
}

.cand-bar {
  height: 5px;
  border-radius: 3px;
  background: var(--bg2);
  margin: 8px 0;
  overflow: hidden;
}
.cand-bar-fill {
  height: 100%;
  border-radius: 3px;
  width: 0 !important;
  background: var(--blue);
  transition: width 1s cubic-bezier(.4,0,.2,1) .2s;
}
.cand-card.in-view .cand-bar-fill { width: var(--score) !important; }

.cand-name {
  font-family: var(--serif);
  font-size: 17px; font-weight: 600;
  color: var(--navy);
  margin-bottom: 2px;
}
.cand-sub {
  font-family: var(--sans);
  font-size: 12px;
  color: var(--txt3);
  line-height: 1.4;
  margin-bottom: 6px;
  min-height: 30px;
}
.cand-summary {
  font-size: 12.5px;
  line-height: 1.5;
  color: rgba(22,45,70,.75);
  margin-top: 8px;
  padding: 0 4px;
  text-align: left;
  font-family: var(--sans);
}
`
