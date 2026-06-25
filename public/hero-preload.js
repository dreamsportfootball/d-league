(function () {
  var script = document.currentScript;
  if (!script) return;

  var baseUrl = new URL('.', script.src).pathname;
  var hash = window.location.hash;
  var usesHashRoute = hash.indexOf('#/') === 0;
  var isHomeRoute = usesHashRoute
    ? hash === '#/'
    : window.location.pathname === baseUrl ||
      window.location.pathname === baseUrl.replace(/\/$/, '');

  if (!isHomeRoute) return;

  var optimized = script.getAttribute('data-optimized') === 'true';
  var mobile = window.matchMedia('(max-width: 767px)').matches;
  var fileName = mobile
    ? 'registration-poster-mobile'
    : 'registration-poster-desktop';
  var preload = document.createElement('link');

  preload.rel = 'preload';
  preload.as = 'image';
  preload.href =
    baseUrl +
    'assets/seasons/2026-27/' +
    fileName +
    (optimized ? '.webp' : '.png');
  preload.type = optimized ? 'image/webp' : 'image/png';
  preload.fetchPriority = 'high';
  preload.setAttribute('fetchpriority', 'high');
  preload.setAttribute('data-home-hero-preload', 'true');
  document.head.appendChild(preload);
})();
