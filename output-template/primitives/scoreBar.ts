// ---------------------------------------------------------------------------
// Animated score bar (.svb) + section score visualisation (.sv2).
// Reference: demo CSS ~L170-177.
// ---------------------------------------------------------------------------

export const scoreBarCss = `
.sv2 {
  background: var(--wh);
  border-radius: 12px;
  padding: 30px;
  border: 1px solid var(--ln);
  margin: 24px 0;
}
.svh { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
.svh strong { font-family: var(--serif); font-size: 17px; color: var(--navy); }
.svh span { font-family: var(--mono); font-size: 15px; color: var(--blue); font-weight: 600; }

.svb {
  position: relative; height: 42px; margin: 22px 0 14px;
}
.svb-bg {
  position: absolute; top: 15px; left: 0; right: 0;
  height: 12px; background: var(--bg2); border-radius: 6px;
}
.svb-fill {
  position: absolute; top: 15px;
  height: 12px;
  background: linear-gradient(90deg, var(--blue), var(--sand));
  border-radius: 6px;
  animation: fillIn .8s ease-out;
}
@keyframes fillIn { from { right: 80%; } to { right: 20%; } }

.svl {
  display: flex; justify-content: space-between;
  font-size: 12px; color: var(--txt3);
}
`
