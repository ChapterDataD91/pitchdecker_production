// ---------------------------------------------------------------------------
// IntersectionObserver for scroll-entrance animations + candidate score bars.
// ---------------------------------------------------------------------------

export const scrollAnimationsScript: string = /* js */ `
(function() {
  if (!('IntersectionObserver' in window)) return;

  // Section entrance
  var secObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) e.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.sec').forEach(function(s) { secObserver.observe(s); });

  // Candidate score bar fill
  var barObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) e.target.classList.add('in-view');
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.cand-card').forEach(function(c) {
    var fill = c.querySelector('.cand-bar-fill');
    if (fill) {
      var w = fill.style.width;
      fill.style.setProperty('--score', w);
    }
    barObserver.observe(c);
  });
})();
`
