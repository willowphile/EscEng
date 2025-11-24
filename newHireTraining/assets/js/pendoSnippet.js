(function (apiKey) {
  (function (p, e, n, d, o) {
    var v, w, x, y, z;
    o = p[d] = p[d] || {};
    o._q = o._q || [];
    v = ['initialize', 'identify', 'updateOptions', 'pageLoad', 'track'];
    for (w = 0, x = v.length; w < x; ++w)
      (function (m) {
        o[m] =
          o[m] ||
          function () {
            o._q[m === v[0] ? 'unshift' : 'push']([
              m,
              ...[].slice.call(arguments, 0),
            ]);
          };
      })(v[w]);
    y = e.createElement(n);
    y.async = true;
    y.src = 'https://cdn.pendo.io/agent/static/' + apiKey + '/pendo.js';
    z = e.getElementsByTagName(n)[0];
    z.parentNode.insertBefore(y, z);
  })(window, document, 'script', 'pendo');
})('167e41e0-0f3d-466f-4800-0ea4175ea6ba'); // Replace with your actual key


document.addEventListener("DOMContentLoaded", () => {
  const storedVisitor = localStorage.getItem('visitor');
  const storedAccount = localStorage.getItem('account');
  if (storedVisitor && storedAccount) {
    pendo.initialize({
      visitor: { id: storedVisitor },
      account: { id: storedAccount }
    });
  }
});
