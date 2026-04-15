// ---------------------------------------------------------------------------
// Preview-iframe bridge.
//
// Inside the editor's preview, each deck document lives in an <iframe srcDoc>
// with an opaque base URL — relative hrefs like "candidates/foo.html" or
// "../index.html" do not resolve. This script intercepts those clicks, stops
// the default nav, and posts a message to the parent (PreviewShell) which
// swaps the iframe's srcDoc to the right document.
//
// Published (non-iframe) context: `window.parent === window`, so the early
// return leaves every anchor alone and the browser navigates normally.
// ---------------------------------------------------------------------------

export const previewBridgeScript: string = /* js */ `
(function () {
  if (window.parent === window) return;

  function findAnchor(el) {
    while (el && el !== document) {
      if (el.tagName === 'A') return el;
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener('click', function (e) {
    var a = findAnchor(e.target);
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return;

    // "candidates/{slug}.html"  — from main deck → candidate page
    var m = href.match(/^candidates\\/([^\\/]+?)\\.html?$/i);
    if (m) {
      e.preventDefault();
      window.parent.postMessage(
        { type: 'pitchdecker:navigate-candidate', slug: m[1] },
        '*'
      );
      return;
    }

    // "{slug}.html"  — from a candidate page → another candidate page
    m = href.match(/^([^\\/.#]+)\\.html?$/i);
    if (m) {
      e.preventDefault();
      window.parent.postMessage(
        { type: 'pitchdecker:navigate-candidate', slug: m[1] },
        '*'
      );
      return;
    }

    // Back to main deck from candidate page
    if (
      href === '../index.html' ||
      href === '../' ||
      href === 'index.html' ||
      href === './index.html'
    ) {
      e.preventDefault();
      window.parent.postMessage(
        { type: 'pitchdecker:navigate-main' },
        '*'
      );
      return;
    }
  }, true);
})();
`
