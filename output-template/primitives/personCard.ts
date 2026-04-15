// ---------------------------------------------------------------------------
// Team member / consultant card. Used by Team + Assessment sections.
// Reference: demo CSS ~L122-130.
// ---------------------------------------------------------------------------

export const personCardCss = `
.team {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 24px 0;
}
.tc {
  background: var(--wh);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--ln);
  transition: all .3s;
}
.tc:hover {
  border-color: var(--blue);
  box-shadow: 0 12px 32px rgba(22,45,70,.08);
}
.tc-img {
  width: 100%;
  aspect-ratio: 9 / 10;
  height: auto;
  object-fit: cover;
  display: block;
}
.tc-img-placeholder {
  width: 100%;
  aspect-ratio: 9 / 10;
  background: linear-gradient(135deg, var(--bg2), var(--bl));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--blue);
  font-family: var(--mono);
  font-size: 48px;
  font-weight: 600;
}
.tc-body { padding: 24px; }
.tc-name {
  font-family: var(--serif);
  font-size: 19px;
  color: var(--navy);
  margin-bottom: 2px;
}
.tc-role {
  font-size: 12px; font-weight: 600;
  color: var(--blue);
  letter-spacing: 1.5px; text-transform: uppercase;
  margin-bottom: 12px;
  font-family: var(--sans);
}
.tc-bio {
  font-family: var(--sans);
  font-size: 15px;
  color: var(--txt2);
  line-height: 1.7;
}

@media (max-width: 768px) {
  .team { grid-template-columns: 1fr; }
}
`
