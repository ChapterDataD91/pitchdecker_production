// ---------------------------------------------------------------------------
// Reading progress bar: thin blue bar fixed to the top, fills as user scrolls.
// ---------------------------------------------------------------------------

export const progressBarScript: string = /* js */ `
(function() {
  var bar = document.createElement('div');
  bar.className = 'progress-bar';
  document.body.appendChild(bar);
  window.addEventListener('scroll', function() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  }, { passive: true });
})();
`
