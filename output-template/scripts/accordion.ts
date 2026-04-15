// ---------------------------------------------------------------------------
// Accordion toggle + first-section-open + URL hash handler.
// Vanilla JS, inlined into the published HTML.
// Not a module — a string of JS that runs in the browser.
// ---------------------------------------------------------------------------

export const accordionScript: string = /* js */ `
(function() {
  // Toggle open/closed on click
  document.querySelectorAll('.sh').forEach(function(sh) {
    sh.addEventListener('click', function() {
      var sec = this.parentElement;
      sec.classList.toggle('open');
    });
  });

  // Open first section by default (if none are open yet)
  var firstSec = document.querySelector('.sec');
  if (firstSec && !document.querySelector('.sec.open')) firstSec.classList.add('open');

  // Open section from URL hash
  var hash = window.location.hash.replace('#', '');
  if (hash) {
    var target = document.getElementById(hash);
    if (target) {
      target.classList.add('open');
      setTimeout(function() {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }
})();
`
